import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { DocumentType, OrderStatus } from '../types';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  tipoDocFilter: string;
  setTipoDocFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onClearFilters: () => void;
  totalFiltered: number;
  totalOverall: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  tipoDocFilter,
  setTipoDocFilter,
  statusFilter,
  setStatusFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onClearFilters,
  totalFiltered,
  totalOverall,
}) => {
  const hasActiveFilters =
    searchTerm ||
    tipoDocFilter !== 'TODOS' ||
    statusFilter !== 'TODOS' ||
    startDate ||
    endDate;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4 mb-4 no-print space-y-3">
      {/* Top row: search + quick count */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por cliente, placa, carro, nº da OS..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
          <span>
            Exibindo <strong className="text-slate-800">{totalFiltered}</strong> de{' '}
            {totalOverall} registros
          </span>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-md transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: select dropdowns & date ranges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tipo Documento
          </label>
          <select
            value={tipoDocFilter}
            onChange={(e) => setTipoDocFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition"
          >
            <option value="TODOS">Todos os tipos</option>
            <option value="ORDEM DE SERVIÇO">Ordem de Serviço</option>
            <option value="ORÇAMENTO">Orçamento</option>
            <option value="CADASTRO DE CLIENTE">Cadastro de Cliente</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition"
          >
            <option value="TODOS">Todos os status</option>
            <option value="ORÇAMENTO">Orçamento</option>
            <option value="APROVADO">Aprovado</option>
            <option value="EM ANDAMENTO">Em Andamento</option>
            <option value="AGUARDANDO PEÇAS">Aguardando Peças</option>
            <option value="CONCLUÍDO">Concluído</option>
            <option value="ENTREGUE">Entregue</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="CADASTRADO">Cadastrado</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Data De (Entrada)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Data Até (Entrada)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition"
          />
        </div>
      </div>
    </div>
  );
};
