import React from 'react';
import {
  TrendingUp,
  Wrench,
  Clock,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { ServiceOrder } from '../types';
import { calculateOrderTotals, formatCurrency } from '../utils/formatters';

interface MetricsCardsProps {
  orders: ServiceOrder[];
  onFilterStatus?: (status: string) => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ orders, onFilterStatus }) => {
  const concluidas = orders.filter(
    (o) => o.statusOS === 'CONCLUÍDO' || o.statusOS === 'ENTREGUE'
  );
  const emAndamento = orders.filter(
    (o) =>
      o.statusOS === 'EM ANDAMENTO' ||
      o.statusOS === 'APROVADO' ||
      o.statusOS === 'AGUARDANDO PEÇAS'
  );
  const orcamentos = orders.filter((o) => o.statusOS === 'ORÇAMENTO');

  const faturamentoTotal = concluidas.reduce((acc, o) => {
    return acc + calculateOrderTotals(o).totalGeral;
  }, 0);

  const valorOrcamentosPendentes = orcamentos.reduce((acc, o) => {
    return acc + calculateOrderTotals(o).totalGeral;
  }, 0);

  const ticketMedio =
    concluidas.length > 0 ? faturamentoTotal / concluidas.length : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 no-print">
      {/* Total Faturado */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('CONCLUÍDO')}
        className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Faturamento Concluído
          </p>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
          {formatCurrency(faturamentoTotal)}
        </p>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{concluidas.length} ordens finalizadas</span>
        </p>
      </div>

      {/* Em Oficina */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('EM ANDAMENTO')}
        className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Em Serviço na Oficina
          </p>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
          {emAndamento.length}{' '}
          <span className="text-xs font-normal text-slate-500">veículos</span>
        </p>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>{orders.filter((o) => o.statusOS === 'AGUARDANDO PEÇAS').length} aguardando peças</span>
        </p>
      </div>

      {/* Orçamentos Pendentes */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('ORÇAMENTO')}
        className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Orçamentos em Aberto
          </p>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-extrabold text-amber-600 font-mono tabular-nums">
          {orcamentos.length}{' '}
          <span className="text-xs font-normal text-slate-500">
            ({formatCurrency(valorOrcamentosPendentes)})
          </span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Propostas aguardando aprovação
        </p>
      </div>

      {/* Ticket Médio */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 transition-all">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Ticket Médio
          </p>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
          {formatCurrency(ticketMedio)}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Média por atendimento realizado
        </p>
      </div>
    </div>
  );
};
