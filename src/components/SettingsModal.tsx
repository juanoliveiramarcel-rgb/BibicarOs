import React, { useState, useRef } from 'react';
import {
  X,
  Save,
  Building,
  ShieldCheck,
  Upload,
  Trash2,
  Image as ImageIcon,
  Camera,
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  HardDrive,
} from 'lucide-react';
import { WorkshopConfig } from '../types';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { downloadJsonFile, safeSetItem, getStorageMetrics, StorageMetrics } from '../utils/safeStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkshopConfig;
  onSaveConfig: (newConfig: WorkshopConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<WorkshopConfig>({ ...config });
  const [dragActive, setDragActive] = useState(false);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics>(() => getStorageMetrics());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleExportFullBackup = () => {
    try {
      const fullBackup = {
        app: 'Bibicar OS',
        exportDate: new Date().toISOString(),
        version: '2.0',
        data: {
          bibicar_config: localStorage.getItem('bibicar_config'),
          bibicar_os_data: localStorage.getItem('bibicar_os_data'),
          bibicar_inventory: localStorage.getItem('bibicar_inventory'),
          bibicar_cash_register: localStorage.getItem('bibicar_cash_register'),
          bibicar_bills: localStorage.getItem('bibicar_bills'),
          bibicar_mechanics: localStorage.getItem('bibicar_mechanics'),
        },
      };

      downloadJsonFile(
        `Backup_Completo_Bibicar_OS_${new Date().toISOString().split('T')[0]}.json`,
        fullBackup
      );
    } catch (err) {
      alert('Erro ao exportar backup: ' + (err as Error).message);
    }
  };

  const handleRestoreFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);

        const isFullBackup = parsed && parsed.data;
        const isLegacyArray = Array.isArray(parsed);

        if (!isFullBackup && !isLegacyArray) {
          alert('Arquivo de backup inválido. Certifique-se de que é um arquivo JSON gerado pelo Bibicar OS.');
          return;
        }

        const confirmRestore = window.confirm(
          '⚠️ ATENÇÃO: Esta ação substituirá os dados atuais do sistema (Ordens de Serviço, Estoque, Financeiro e Configurações) pelas informações do arquivo selecionado.\n\nDeseja realmente restaurar este backup?'
        );

        if (confirmRestore) {
          let hasError = false;
          if (isFullBackup) {
            for (const [k, v] of Object.entries(parsed.data)) {
              if (v && typeof v === 'string') {
                const res = safeSetItem(k, v);
                if (!res.success) {
                  hasError = true;
                  alert(
                    `⚠️ Erro ao restaurar chave '${k}'. O limite de armazenamento local (5MB) foi excedido ou o arquivo é grande demais.`
                  );
                  break;
                }
              }
            }
          } else if (isLegacyArray) {
            const res = safeSetItem('bibicar_os_data', JSON.stringify(parsed));
            if (!res.success) {
              hasError = true;
              alert('⚠️ Erro ao restaurar ordens de serviço. Limite de armazenamento local excedido.');
            }
          }

          if (!hasError) {
            alert('✅ Backup restaurado com sucesso! A página será atualizada.');
            window.location.reload();
          }
        }
      } catch (err) {
        alert('Erro ao processar arquivo de backup: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    try {
      setIsCompressingLogo(true);
      const optimizedBase64 = await optimizeImageFile(file, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.82,
        preferredMimeType: 'image/jpeg',
      });
      setFormData((prev) => ({ ...prev, logoUrl: optimizedBase64 }));
      setStorageMetrics(getStorageMetrics());
    } catch (err) {
      console.error('[SettingsModal] Erro ao otimizar logotipo:', err);
      alert('Não foi possível processar a imagem do logotipo. Tente outro arquivo.');
    } finally {
      setIsCompressingLogo(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-start overflow-y-auto p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg text-white">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-tight">
                Dados da Oficina & Garantia
              </h2>
              <p className="text-xs text-slate-400">
                Informações que constam nos cabeçalhos impressos e mensagens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Workshop Logo / Photo Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-red-600" />
                <span>Foto / Logotipo / Ícone da Oficina</span>
              </label>
              {formData.logoUrl && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Foto ativa
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Esta foto ou logotipo será exibida no topo do sistema, no cabeçalho das Ordens de Serviço impressas (A4), orçamentos e etiquetas.
            </p>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Photo Preview Container */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-24 h-24 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center p-1 overflow-hidden shrink-0 group ${
                  dragActive
                    ? 'border-red-500 bg-red-50/50 scale-102'
                    : formData.logoUrl
                    ? 'border-slate-300 bg-white shadow-xs hover:border-red-500'
                    : 'border-dashed border-slate-300 bg-white hover:border-red-500 hover:bg-slate-100'
                }`}
                title="Clique para escolher foto ou arraste um arquivo"
              >
                {formData.logoUrl ? (
                  <>
                    <img
                      src={formData.logoUrl}
                      alt="Logo Oficina"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold">
                      <Upload className="w-4 h-4 mb-0.5" />
                      Trocar
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-red-600 transition-colors">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-[9px] font-bold text-center leading-tight">
                      Adicionar Foto
                    </span>
                  </div>
                )}
              </div>

              {/* Upload & Action Controls */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-red-600" />
                    <span>{formData.logoUrl ? 'Escolher outra foto' : 'Enviar foto do computador'}</span>
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: undefined })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover foto</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Ou insira a URL direta da imagem (opcional):
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl?.startsWith('data:') ? '' : formData.logoUrl || ''}
                    placeholder="https://exemplo.com/logo.png"
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value.trim() || undefined })}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                  />
                  {formData.logoUrl?.startsWith('data:') && (
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      ✓ Imagem carregada do dispositivo (salva localmente)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Fantasia da Oficina
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Razão Social
              </label>
              <input
                type="text"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inscrição Estadual (IE)
              </label>
              <input
                type="text"
                value={formData.inscricaoEstadual}
                onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inscrição Municipal (IM)
              </label>
              <input
                type="text"
                value={formData.inscricaoMunicipal || ''}
                placeholder="Para emissão de serviços"
                onChange={(e) => setFormData({ ...formData, inscricaoMunicipal: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Endereço Completo da Oficina
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone Fixo
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Oficial
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="11999999999"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail de Contato
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garantias & Validades Legais</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Validade do Orçamento (Dias)
                </label>
                <input
                  type="number"
                  value={formData.prazoValidadeOrcamentoDias}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prazoValidadeOrcamentoDias: parseInt(e.target.value, 10) || 10,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prazo de Garantia (Dias CDC)
                </label>
                <input
                  type="number"
                  value={formData.prazoGarantiaDias}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prazoGarantiaDias: parseInt(e.target.value, 10) || 90,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Texto do Termo de Garantia e Responsabilidade (Impresso no Rodapé)
              </label>
              <textarea
                rows={3}
                value={formData.termoGarantia}
                onChange={(e) => setFormData({ ...formData, termoGarantia: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Fiscal & NF-e Configuration Section */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Parâmetros de Emissão de NF-e (SEFAZ & Tributos)</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Layout SEFAZ 4.00
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Defina os parâmetros padrão para emissão de Notas Fiscais Eletrônicas para os clientes que solicitarem documento fiscal.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Regime Tributário
                </label>
                <select
                  value={formData.regimeTributario || 'SIMPLES_NACIONAL'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      regimeTributario: e.target.value as any,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="SIMPLES_NACIONAL">Simples Nacional (ME / EPP)</option>
                  <option value="SIMPLES_MEI">MEI (Microempreendedor Individual)</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="LUCRO_REAL">Lucro Real</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Série da NF-e
                </label>
                <input
                  type="text"
                  value={formData.serieNFe || '1'}
                  onChange={(e) => setFormData({ ...formData, serieNFe: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Próximo Número da NF-e
                </label>
                <input
                  type="number"
                  value={formData.proximoNumeroNFe || 1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      proximoNumeroNFe: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CFOP Padrão para Peças
                </label>
                <input
                  type="text"
                  value={formData.cfopPadraoPecas || '5102'}
                  placeholder="5102 ou 5405"
                  onChange={(e) => setFormData({ ...formData, cfopPadraoPecas: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tributos Aprox. IBPT (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.aliquotaIbptPadrao || 13.45}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aliquotaIbptPadrao: parseFloat(e.target.value) || 13.45,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ambiente SEFAZ
                </label>
                <select
                  value={formData.ambienteSefaz || 'HOMOLOGACAO'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ambienteSefaz: e.target.value as any,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="HOMOLOGACAO">Homologação (Testes / Sem valor fiscal)</option>
                  <option value="PRODUCAO">Produção (Oficial com validade jurídica)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Backup & Restoration Section */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Cópia de Segurança & Restauração (Backup Completo)</span>
              </h3>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                100% Offline
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Exporte uma cópia completa de todos os dados do Bibicar OS (Ordens de Serviço, Estoque, Peças, Caixa Diário, Contas a Pagar/Receber e Configurações) para um arquivo .JSON seguro no seu computador.
            </p>

            {/* Hidden file input for restore */}
            <input
              type="file"
              ref={backupInputRef}
              onChange={handleRestoreFullBackup}
              accept=".json"
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportFullBackup}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:border-slate-400 rounded-xl transition text-left flex items-start gap-3 group"
              >
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Exportar Cópia de Segurança
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Gera um arquivo .json com todos os dados locais
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="p-3 bg-amber-50/60 hover:bg-amber-100/60 border border-amber-200 hover:border-amber-300 rounded-xl transition text-left flex items-start gap-3 group"
              >
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-950">
                    Restaurar Backup
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">
                    Recupera dados de um arquivo .json salvo
                  </div>
                </div>
              </button>
            </div>

            {/* Diagnóstico de Armazenamento Local */}
            <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 text-xs mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  Saúde do Armazenamento Local (localStorage)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    storageMetrics.percentageUsed < 70
                      ? 'bg-emerald-100 text-emerald-800'
                      : storageMetrics.percentageUsed < 90
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {storageMetrics.percentageUsed}% Utilizado ({storageMetrics.usedMB} MB / ~{storageMetrics.estimatedQuotaMB} MB)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    storageMetrics.percentageUsed >= 90
                      ? 'bg-red-600'
                      : storageMetrics.percentageUsed >= 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, storageMetrics.percentageUsed)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-500">
                <span>{storageMetrics.keyBreakdown.length} chaves ativas no navegador</span>
                <button
                  type="button"
                  onClick={() => setStorageMetrics(getStorageMetrics())}
                  className="hover:text-slate-800 font-semibold underline"
                >
                  Atualizar medição
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
