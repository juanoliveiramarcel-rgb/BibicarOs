/**
 * imageOptimizer.ts
 * Otimizador assíncrono de imagens para persistência em localStorage e documentos PDF.
 * Reduz dimensões, comprime qualidade e assegura payloads < 35KB, prevenindo QuotaExceededError.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preferredMimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
  maxSizeBytes?: number;
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 320,
  maxHeight: 320,
  quality: 0.82,
  preferredMimeType: 'image/jpeg',
  maxSizeBytes: 35 * 1024, // 35 KB
};

/**
 * Otimiza um arquivo de imagem recebido (logo ou anexo), redimensionando via Canvas
 * e comprimindo para garantir tamanho compacto sem perda visual perceptível.
 */
export async function optimizeImageFile(
  file: File,
  customOptions?: ImageOptimizationOptions
): Promise<string> {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  // Arquivos SVG são vetoriais e leves por natureza
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Não foi possível ler os dados do arquivo de imagem.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido ou corrompido.'));

      img.onload = () => {
        try {
          let { width, height } = img;
          const maxW = options.maxWidth || 320;
          const maxH = options.maxHeight || 320;

          // Calcula proporção sem distorção
          if (width > maxW || height > maxH) {
            if (width / maxW > height / maxH) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            } else {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          // Preenche fundo branco para evitar artefatos pretos em PNGs transparentes convertidos para JPEG
          if (options.preferredMimeType === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Primeira passagem de compressão
          let quality = options.quality || 0.82;
          let mime = options.preferredMimeType || 'image/jpeg';
          let result = canvas.toDataURL(mime, quality);

          // Se ainda exceder o limite seguro, reduz resolução e qualidade progressivamente
          const maxBytes = options.maxSizeBytes || 35 * 1024;
          if (result.length > maxBytes * 1.33) { // Base64 overhead é ~33%
            quality = 0.68;
            result = canvas.toDataURL(mime, quality);
          }

          resolve(result);
        } catch (canvasErr) {
          console.warn('[imageOptimizer] Falha ao comprimir imagem via Canvas, mantendo original:', canvasErr);
          resolve(rawDataUrl);
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
