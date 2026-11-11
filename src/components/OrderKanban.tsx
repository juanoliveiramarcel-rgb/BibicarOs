import React from 'react';
import {
  Clock,
  CheckCircle,
  Wrench,
  Package,
  CheckCheck,
  Send,
  Printer,
  MessageCircle,
  ArrowRight,
  ChevronRight,
  Droplet,
  Download,
} from 'lucide-react';
import { OrderStatus, ServiceOrder, WorkshopConfig } from '../types';
import {
  calculateOrderTotals,
  formatCurrency,
  generateWhatsAppMessage,
  getWhatsAppUrl,
} from '../utils/formatters';

interface OrderKanbanProps {
  orders: ServiceOrder[];
  config: WorkshopConfig;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onEdit: (order: ServiceOrder) => void;
  onPrint: (order: ServiceOrder) => void;
  onDownloadPdf?: (order: ServiceOrder) => void;
  onOpenOilSticker?: (order: ServiceOrder) => void;
  onOpenVehicleHistory?: (plate: string) => void;
}

interface ColumnDef {
  key: OrderStatus;
  label: string;
  icon: React.ElementType;
  color: string;
  nextStatus?: OrderStatus;
  nextLabel?: string;
}

const KANBAN_COLUMNS: ColumnDef[] = [
  {
    key: 'ORÇAMENTO',
    label: 'Orçamentos',
    icon: Clock,
    color: 'border-amber-400 bg-amber-500/10 text-amber-700',
    nextStatus: 'APROVADO',
    nextLabel: 'Aprovar',
  },
  {
    key: 'APROVADO',
    label: 'Aprovados',
    icon: CheckCircle,
    color: 'border-blue-400 bg-blue-500/10 text-blue-700',
    nextStatus: 'EM ANDAMENTO',
    nextLabel: 'Iniciar Oficina',
  },
  {
    key: 'EM ANDAMENTO',
    label: 'No Elevador / Serviço',
    icon: Wrench,
    color: 'border-indigo-400 bg-indigo-500/10 text-indigo-700',
    nextStatus: 'CONCLUÍDO',
    nextLabel: 'Concluir',
  },
  {
    key: 'AGUARDANDO PEÇAS',
    label: 'Aguardando Peças',
    icon: Package,
    color: 'border-orange-400 bg-orange-500/10 text-orange-700',
    nextStatus: 'EM ANDAMENTO',
    nextLabel: 'Peças Chegaram',
  },
  {
    key: 'CONCLUÍDO',
    label: 'Pronto p/ Entrega',
    icon: CheckCheck,
    color: 'border-emerald-400 bg-emerald-500/10 text-emerald-700',
    nextStatus: 'ENTREGUE',
    nextLabel: 'Entregar Veículo',
  },
  {
    key: 'ENTREGUE',
    label: 'Entregues / Faturados',
    icon: Send,
    color: 'border-slate-400 bg-slate-500/10 text-slate-700',
  },
];

export const OrderKanban: React.FC<OrderKanbanProps> = ({
  orders,
  config,
  onUpdateStatus,
  onEdit,
  onPrint,
  onDownloadPdf,
  onOpenOilSticker,
  onOpenVehicleHistory,
}) => {
  const handleSendWhatsApp = (order: ServiceOrder) => {
    if (!order.cliente?.telefone) {
      alert('Este cliente não possui telefone cadastrado.');
      return;
    }
    if (onDownloadPdf) {
      onDownloadPdf(order);
    }
    const message = generateWhatsAppMessage(order, config);
    const url = getWhatsAppUrl(order.cliente.telefone, message);
    window.open(url, '_blank');
  };

  return (
    <div className="overflow-x-auto pb-6 no-print">
      <div className="flex gap-4 min-w-[1200px]">
        {KANBAN_COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.statusOS === col.key);
          const colTotal = colOrders.reduce(
            (acc, o) => acc + calculateOrderTotals(o).totalGeral,
            0
          );
          const Icon = col.icon;

          return (
            <div
              key={col.key}
              className="w-72 flex-shrink-0 flex flex-col bg-slate-100/70 rounded-xl border border-slate-200/90 p-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center border ${col.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">
                    {col.label}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {colOrders.length}
                </span>
              </div>

              {/* Subtotal of column */}
              <div className="text-[11px] text-slate-500 font-mono mb-2 flex justify-between px-1">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-700">
                  {formatCurrency(colTotal)}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {colOrders.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs italic bg-white/40">
                    Nenhum veículo nesta etapa
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const totals = calculateOrderTotals(order);

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs hover:shadow-md transition-shadow group relative"
                      >
                        {/* Card top */}
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <div className="flex items-center flex-wrap gap-1">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              #{order.numeroOS}
                            </span>
                            {order.veiculo?.matricula && (
                              <button
                                type="button"
                                onClick={() => onOpenVehicleHistory?.(order.veiculo.matricula)}
                                className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition text-slate-800 border border-slate-300 cursor-pointer shadow-2xs"
                                title="Ver prontuário / histórico desta placa"
                              >
                                {order.veiculo.matricula}
                              </button>
                            )}
                          </div>
                          <span className="font-mono font-extrabold text-xs text-slate-900">
                            {formatCurrency(totals.totalGeral)}
                          </span>
                        </div>

                        {/* Vehicle & Customer */}
                        <p className="font-bold text-xs text-slate-800 truncate">
                          {order.veiculo?.marca} {order.veiculo?.modelo}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mb-2">
                          {order.cliente?.nome}
                        </p>

                        {/* Services preview */}
                        {order.servicos && order.servicos.length > 0 && (
                          <div className="text-[10px] text-slate-600 bg-slate-50 rounded p-1.5 border border-slate-100 mb-2 space-y-0.5">
                            {order.servicos.slice(0, 2).map((s, idx) => (
                              <p key={idx} className="truncate">
                                • {s.descricao}
                              </p>
                            ))}
                            {order.servicos.length > 2 && (
                              <p className="text-slate-400 font-medium">
                                + {order.servicos.length - 2} outro(s)...
                              </p>
                            )}
                          </div>
                        )}

                        {/* Action buttons on card */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSendWhatsApp(order)}
                              title="WhatsApp (Baixa PDF)"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            {onDownloadPdf && (
                              <button
                                onClick={() => onDownloadPdf(order)}
                                title="Baixar PDF"
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onPrint(order)}
                              title="Imprimir"
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {onOpenOilSticker && (
                              <button
                                onClick={() => onOpenOilSticker(order)}
                                title="Gerar Etiqueta de Troca de Óleo"
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded transition"
                              >
                                <Droplet className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onEdit(order)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-1 py-0.5 transition"
                            >
                              Editar
                            </button>
                          </div>

                          {col.nextStatus && (
                            <button
                              onClick={() =>
                                onUpdateStatus(order.id, col.nextStatus!)
                              }
                              className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-900 hover:bg-red-600 text-white px-2 py-1 rounded transition shadow-2xs"
                              title={`Avançar para: ${col.nextLabel}`}
                            >
                              <span>{col.nextLabel}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
