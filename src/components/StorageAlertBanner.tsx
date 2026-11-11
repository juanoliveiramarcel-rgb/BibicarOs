import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  HardDrive,
  Download,
  X,
  RefreshCw,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { getStorageMetrics, downloadJsonFile, StorageMetrics } from '../utils/safeStorage';

interface StorageAlertBannerProps {
  onOpenSettings?: () => void;
}

export const StorageAlertBanner: React.FC<StorageAlertBannerProps> = ({ onOpenSettings }) => {
  const [metrics, setMetrics] = useState<StorageMetrics>(() => getStorageMetrics());
  const [isCriticalError, setIsCriticalError] = useState(false);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Escuta erros de gravação e saturação emitidos pelo safeStorage
  useEffect(() => {
    const handleStorageError = (e: Event) => {
      const customEvent = e as CustomEvent<{
        key: string;
        isQuotaExceeded: boolean;
        metrics: StorageMetrics;
      }>;
      if (customEvent.detail) {
        setIsCriticalError(true);
        setFailedKey(customEvent.detail.key);
        setMetrics(customEvent.detail.metrics || getStorageMetrics());
        setIsDismissed(false); // Força exibição imediata se houver erro crítico
      }
    };

    window.addEventListener('bibicar:storage-error', handleStorageError);
    return () => window.removeEventListener('bibicar:storage-error', handleStorageError);
  }, []);

  // Atualiza métricas periodicamente de forma leve
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getStorageMetrics());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyBackup = () => {
    try {
      const backupData = {
        app: 'Bibicar OS',
        exportDate: new Date().toISOString(),
        version: '2.0-emergency',
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
        `BACKUP_EMERGENCIA_BIBICAR_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`,
        backupData
      );
    } catch (err) {
      alert('Erro ao gerar backup de emergência: ' + (err as Error).message);
    }
  };

  const shouldShow = (isCriticalError || metrics.isNearLimit) && !isDismissed;

  if (!shouldShow) return null;

  return (
    <>
      <div
        className={`w-full z-40 border-b px-4 py-2.5 transition-all duration-200 ${
          isCriticalError || metrics.isCritical
            ? 'bg-red-950/95 border-red-700 text-red-100 shadow-lg shadow-red-950/50'
            : 'bg-amber-950/90 border-amber-700 text-amber-100'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className={`p-1.5 rounded-full shrink-0 ${
                isCriticalError || metrics.isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold">
                {isCriticalError
                  ? '⚠️ Falha ao Salvar Dados: Cota de Armazenamento Excedida!'
                  : '⚠️ Alerta de Espaço: Armazenamento Local Quase Cheio'}
              </span>
              <p className="opacity-90 text-xs truncate">
                {isCriticalError
                  ? `Não foi possível salvar '${failedKey || 'dados'}'. O limite de 5MB foi atingido. Baixe um backup agora!`
                  : `Você já utilizou ${metrics.usedMB} MB (~${metrics.percentageUsed}%) da cota do navegador/desktop.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={handleEmergencyBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold shadow text-xs transition"
              title="Baixar cópia de segurança em arquivo JSON imediatamente"
            >
              <Download className="w-3.5 h-3.5" />
              Backup de Emergência
            </button>
            <button
              onClick={() => setShowDetailsModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs transition"
            >
              <HardDrive className="w-3.5 h-3.5" />
              Diagnóstico
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-white/10 rounded text-slate-300 transition"
              title="Fechar aviso temporariamente"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Armazenamento */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-lg">Auditoria do Armazenamento Local</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Barra de progresso */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Capacidade utilizada:</span>
                  <span className="font-bold text-slate-200">
                    {metrics.usedMB} MB / ~{metrics.estimatedQuotaMB} MB ({metrics.percentageUsed}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-300 ${
                      metrics.percentageUsed >= 90
                        ? 'bg-red-500'
                        : metrics.percentageUsed >= 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.percentageUsed)}%` }}
                  />
                </div>
              </div>

              {/* Status geral */}
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
                {metrics.percentageUsed < 80 ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Armazenamento saudável com espaço livre suficiente.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Atenção: A base de dados está próxima ao limite do navegador. Recomendamos exportar um backup
                      e otimizar imagens da oficina.
                    </span>
                  </div>
                )}
              </div>

              {/* Tabela de chaves */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Consumo por Chave do Sistema
                </span>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 divide-y divide-slate-800 bg-slate-950/50">
                  {metrics.keyBreakdown.map((item) => (
                    <div key={item.key} className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="font-mono text-slate-300 truncate max-w-[240px]">{item.key}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{item.kb} KB</span>
                        <span className="text-slate-500 font-mono text-[11px] w-12 text-right">
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMetrics(getStorageMetrics());
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recalcular
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEmergencyBackup}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Backup JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
