import React, { useRef } from 'react';
import {
  Wrench,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Settings,
  Kanban,
  Table,
  Users,
  Package,
  DollarSign,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { WorkshopConfig } from '../types';

export type AppActiveView =
  | 'table'
  | 'kanban'
  | 'customers'
  | 'inventory'
  | 'financial'
  | 'commissions'
  | 'reports';

interface HeaderProps {
  config: WorkshopConfig;
  activeView: AppActiveView;
  setActiveView: (view: AppActiveView) => void;
  onNewOrder: () => void;
  onExportExcel: () => void;
  onImportExcel: (file: File) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeView,
  setActiveView,
  onNewOrder,
  onExportExcel,
  onImportExcel,
  onExportBackup,
  onImportBackup,
  onOpenSettings,
}) => {
  const excelInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportExcel(file);
      e.target.value = '';
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      e.target.value = '';
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800 no-print">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={excelInputRef}
        onChange={handleExcelChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
      <input
        type="file"
        ref={jsonInputRef}
        onChange={handleJsonChange}
        accept=".json"
        className="hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md bg-white border border-slate-700/80 flex items-center justify-center shrink-0 p-0.5">
              <img
                src={config.logoUrl}
                alt={config.nome}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="bg-red-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white whitespace-nowrap">
                {config.nome || 'Minha Oficina Mecânica'}
              </span>
              {!config.nome && (
                <button
                  onClick={onOpenSettings}
                  className="text-[10px] bg-red-500 hover:bg-red-400 text-white font-bold px-2 py-0.5 rounded-full animate-pulse transition"
                  title="Clique para cadastrar os dados da sua oficina"
                >
                  Configurar Nome
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Gestão de Oficina Mecânica, Vistoria & Ordens de Serviço
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-medium overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveView('table')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'table'
                ? 'bg-red-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Lista de OS</span>
          </button>
          <button
            onClick={() => setActiveView('kanban')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'kanban'
                ? 'bg-red-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Quadro Oficina</span>
          </button>
          <button
            onClick={() => setActiveView('customers')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'customers'
                ? 'bg-red-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clientes & Frotas</span>
          </button>
          <button
            onClick={() => setActiveView('inventory')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'inventory'
                ? 'bg-red-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Estoque & Peças</span>
          </button>
          <button
            onClick={() => setActiveView('financial')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'financial'
                ? 'bg-red-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Financeiro & Caixa</span>
          </button>
          <button
            onClick={() => setActiveView('commissions')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'commissions'
                ? 'bg-red-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Comissões</span>
          </button>
          <button
            onClick={() => setActiveView('reports')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'reports'
                ? 'bg-red-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Relatórios & CRM</span>
          </button>
        </div>

        {/* Action Zone */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Excel dropdown/buttons */}
          <div className="hidden lg:flex items-center gap-1 border-l border-slate-700 pl-3">
            <button
              onClick={onExportExcel}
              className="text-slate-300 hover:text-emerald-400 p-1.5 rounded-lg text-xs flex items-center gap-1 transition"
              title="Exportar dados para Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar</span>
            </button>
            <button
              onClick={() => excelInputRef.current?.click()}
              className="text-slate-300 hover:text-emerald-400 p-1.5 rounded-lg text-xs flex items-center gap-1 transition"
              title="Importar planilha Excel existente"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Excel</span>
            </button>
            <button
              onClick={onExportBackup}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg text-xs flex items-center gap-1 transition"
              title="Baixar Backup JSON"
            >
              <Download className="w-4 h-4" />
              <span>Backup</span>
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="text-slate-300 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            title="Configurações da Oficina (CNPJ, Endereço, Garantia)"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Primary CTA */}
          <button
            onClick={onNewOrder}
            className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova OS / Orçamento</span>
          </button>
        </div>
      </div>
    </header>
  );
};
