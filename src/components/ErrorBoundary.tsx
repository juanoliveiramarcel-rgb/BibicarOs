import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Download, ChevronDown, ChevronUp, Wrench, ShieldAlert } from 'lucide-react';
import { downloadJsonFile } from '../utils/safeStorage';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Bibicar OS Crash Boundary] Exceção capturada na árvore de componentes:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleEmergencyExport = () => {
    try {
      const fullBackup = {
        app: 'Bibicar OS',
        exportDate: new Date().toISOString(),
        version: '2.0-crash-recovery',
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
        `BACKUP_EMERGENCIA_RECUPERACAO_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`,
        fullBackup
      );
    } catch (err) {
      alert('Falha ao exportar backup de emergência: ' + (err as Error).message);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-2xl w-full bg-slate-900 border border-red-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
              <div className="p-3 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30 shrink-0">
                <AlertOctagon className="w-8 h-8 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-800/60">
                    Modo de Recuperação
                  </span>
                  <span className="text-xs text-slate-500">Bibicar OS</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {this.props.fallbackTitle || 'Instabilidade Inesperada no Sistema'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Ocorreu uma falha no ciclo de renderização. Seus dados estão seguros e preservados no armazenamento local da oficina.
                </p>
              </div>
            </div>

            {/* Aviso de Proteção de Dados */}
            <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl flex items-center gap-3 text-xs text-slate-300">
              <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Seus dados não foram apagados:</strong> Todas as Ordens de Serviço, estoque e fluxo de caixa permanecem íntegros no banco de dados local do computador.
              </span>
            </div>

            {/* Ações de Recuperação */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 text-xs sm:text-sm transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Sistema
              </button>

              <button
                onClick={this.handleEmergencyExport}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 font-semibold rounded-xl text-xs sm:text-sm transition"
                title="Salva todo o banco de dados em arquivo JSON"
              >
                <Download className="w-4 h-4" />
                Baixar Backup de Emergência
              </button>

              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition"
              >
                <Wrench className="w-3.5 h-3.5" />
                Tentar Restaurar Tela
              </button>
            </div>

            {/* Detalhes Técnicos (Colapsável) */}
            <div className="pt-2 border-t border-slate-800/60">
              <button
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="flex items-center justify-between w-full text-left text-xs text-slate-400 hover:text-slate-300 transition py-1"
              >
                <span className="font-mono">Diagnóstico técnico para suporte</span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[11px] font-mono text-red-300/90 max-h-48 space-y-1">
                  <div>
                    <strong>Erro:</strong> {this.state.error?.name} - {this.state.error?.message}
                  </div>
                  {this.state.error?.stack && (
                    <pre className="text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed mt-1">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
