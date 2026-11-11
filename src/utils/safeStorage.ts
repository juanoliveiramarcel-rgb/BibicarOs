/**
 * safeStorage.ts
 * Utilitário profissional de auditoria, métricas e persistência resiliente para localStorage.
 * Detecta e protege contra QuotaExceededError, fornecendo diagnósticos e eventos globais.
 */

export interface StorageKeyMetric {
  key: string;
  bytes: number;
  kb: number;
  percent: number;
}

export interface StorageMetrics {
  usedBytes: number;
  usedKB: number;
  usedMB: number;
  estimatedQuotaMB: number;
  percentageUsed: number;
  keyBreakdown: StorageKeyMetric[];
  isNearLimit: boolean;
  isCritical: boolean;
}

const ESTIMATED_QUOTA_BYTES = 5 * 1024 * 1024; // 5 MB cota típica em navegadores modernos e Electron

/**
 * Detecta se uma exceção é QuotaExceededError em múltiplos motores de navegador.
 */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException) {
    return (
      err.code === 22 || // Chrome, Safari, Edge
      err.code === 1014 || // Firefox antigo
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }
  const errorObj = err as { name?: string; message?: string; code?: number };
  return (
    errorObj.name === 'QuotaExceededError' ||
    errorObj.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    (typeof errorObj.message === 'string' && errorObj.message.toLowerCase().includes('quota'))
  );
}

/**
 * Calcula métricas detalhadas de uso do localStorage.
 */
export function getStorageMetrics(): StorageMetrics {
  let totalChars = 0;
  const breakdown: StorageKeyMetric[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || '';
      // Cada caractere UTF-16 consome tipicamente 2 bytes em memória do navegador
      const keyBytes = (key.length + value.length) * 2;
      totalChars += key.length + value.length;

      breakdown.push({
        key,
        bytes: keyBytes,
        kb: Math.round((keyBytes / 1024) * 10) / 10,
        percent: 0,
      });
    }
  } catch (err) {
    console.warn('[Bibicar Storage] Não foi possível auditar localStorage completamente:', err);
  }

  const usedBytes = totalChars * 2;
  const usedKB = Math.round((usedBytes / 1024) * 10) / 10;
  const usedMB = Math.round((usedBytes / (1024 * 1024)) * 100) / 100;
  const percentageUsed = Math.min(100, Math.round((usedBytes / ESTIMATED_QUOTA_BYTES) * 1000) / 10);

  // Ordena por maior consumo
  breakdown.sort((a, b) => b.bytes - a.bytes);
  breakdown.forEach((item) => {
    item.percent = usedBytes > 0 ? Math.round((item.bytes / usedBytes) * 1000) / 10 : 0;
  });

  return {
    usedBytes,
    usedKB,
    usedMB,
    estimatedQuotaMB: 5.0,
    percentageUsed,
    keyBreakdown: breakdown,
    isNearLimit: percentageUsed >= 80,
    isCritical: percentageUsed >= 92,
  };
}

/**
 * Grava dados no localStorage com captura garantida de QuotaExceededError
 * e disparo de evento global para a interface do usuário.
 */
export function safeSetItem(
  key: string,
  value: string
): { success: boolean; isQuotaError?: boolean; error?: unknown } {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (err) {
    const isQuota = isQuotaExceededError(err);
    const metrics = getStorageMetrics();

    console.error(`[Bibicar OS Storage] Erro crítico ao persistir a chave '${key}':`, {
      isQuotaExceeded: isQuota,
      payloadSizeKB: Math.round(((key.length + value.length) * 2) / 1024),
      storageUsage: `${metrics.usedMB} MB de ~${metrics.estimatedQuotaMB} MB (${metrics.percentageUsed}%)`,
      error: err,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('bibicar:storage-error', {
          detail: {
            key,
            isQuotaExceeded: isQuota,
            metrics,
            error: err,
          },
        })
      );
    }

    return { success: false, isQuotaError: isQuota, error: err };
  }
}

/**
 * Recupera dados do localStorage com tratamento de erro silencioso e fallback.
 */
export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Bibicar OS Storage] Falha ao recuperar chave '${key}', usando fallback:`, err);
    return fallback;
  }
}

/**
 * Remove com segurança uma chave.
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`[Bibicar OS Storage] Erro ao remover chave '${key}':`, err);
  }
}

/**
 * Exporta arquivo JSON de maneira híbrida compatível com Web e Electron desktop.
 * Utiliza Blob e ObjectURL em vez de data URIs para prevenir limites de comprimento de URL.
 */
export function downloadJsonFile(filename: string, data: object | string): void {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1000);
}
