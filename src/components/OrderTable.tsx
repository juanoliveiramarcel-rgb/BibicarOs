import React from 'react';
import {
  Printer,
  Edit,
  Trash2,
  Copy,
  MessageCircle,
  Car,
  Calendar,
  Gauge,
  Droplet,
  Download,
  FileText,
} from 'lucide-react';
import { ServiceOrder, WorkshopConfig } from '../types';
import {
  calculateOrderTotals,
  formatCurrency,
  formatDate,
  generateWhatsAppMessage,
  getWhatsAppUrl,
} from '../utils/formatters';

interface OrderTableProps {
  orders: ServiceOrder[];
  config: WorkshopConfig;
  onEdit: (order: ServiceOrder) => void;
  onPrint: (order: ServiceOrder) => void;
  onDownloadPdf?: (order: ServiceOrder) => void;
  onDuplicate: (order: ServiceOrder) => void;
  onDelete: (id: string) => void;
  onNewOrder: () => void;
  onOpenOilSticker?: (order: ServiceOrder) => void;
  onOpenVehicleHistory?: (plate: string) => void;
  onOpenNFeModal?: (order: ServiceOrder) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  config,
  onEdit,
  onPrint,
  onDownloadPdf,
  onDuplicate,
  onDelete,
  onNewOrder,
  onOpenOilSticker,
  onOpenVehicleHistory,
  onOpenNFeModal,
}) => {
  const getStatusBadge = (status: ServiceOrder['statusOS']) => {
    switch (status) {
      case 'ORÇAMENTO':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APROVADO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EM ANDAMENTO':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'AGUARDANDO PEÇAS':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'CONCLUÍDO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ENTREGUE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'CANCELADO':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

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

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-12 text-center no-print">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Car className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Nenhuma ordem de serviço encontrada
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
          Tente ajustar os filtros acima ou crie uma nova ordem de serviço para sua oficina.
        </p>
        <button
          onClick={onNewOrder}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs"
        >
          Criar Nova Ordem
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden no-print">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Nº / Tipo</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4">Cliente & Contato</th>
              <th className="py-3 px-4">Veículo</th>
              <th className="py-3 px-3">Placa</th>
              <th className="py-3 px-3">Entrada / KM</th>
              <th className="py-3 px-4 text-right">Total Geral</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const totals = calculateOrderTotals(order);
              const statusStyle = getStatusBadge(order.statusOS);

              return (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* OS / Tipo */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-900 font-mono">
                        #{order.numeroOS}
                      </span>
                      {order.nfeEmitida && order.nfeDados && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded font-mono ${
                            order.nfeDados.status === 'CANCELADA'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                          title={`NF-e #${order.nfeDados.numeroNFe}`}
                        >
                          NF-e #{order.nfeDados.numeroNFe}
                        </span>
                      )}
                    </div>
                    <span className="block text-[10px] text-slate-400 font-medium tracking-tight">
                      {order.tipoDoc}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusStyle}`}
                    >
                      {order.statusOS}
                    </span>
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 text-xs truncate max-w-[180px]">
                      {order.cliente?.nome || 'Não informado'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {order.cliente?.telefone || 'Sem telefone'}
                    </p>
                  </td>

                  {/* Veículo */}
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800 text-xs">
                      {order.veiculo?.marca} {order.veiculo?.modelo}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {[order.veiculo?.ano, order.veiculo?.cor].filter(Boolean).join(' · ') || '-'}
                    </p>
                  </td>

                  {/* Placa */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {order.veiculo?.matricula ? (
                      <button
                        type="button"
                        onClick={() => onOpenVehicleHistory?.(order.veiculo.matricula)}
                        className="inline-block bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition text-slate-800 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-300 cursor-pointer shadow-2xs"
                        title="Ver prontuário / histórico completo desta placa"
                      >
                        {order.veiculo.matricula}
                      </button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Entrada / KM */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(order.veiculo?.dataEntrada)}</span>
                    </div>
                    {order.veiculo?.kmEntrada && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Gauge className="w-3 h-3" />
                        <span>{order.veiculo.kmEntrada} km</span>
                      </div>
                    )}
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="font-extrabold text-sm text-slate-900 font-mono tabular-nums">
                      {formatCurrency(totals.totalGeral)}
                    </span>
                    {totals.desconto > 0 && (
                      <span className="block text-[10px] text-emerald-600 font-medium">
                        desc. {formatCurrency(totals.desconto)}
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(order)}
                        title="Enviar orçamento/OS pelo WhatsApp (Baixa PDF)"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      {/* Baixar PDF */}
                      {onDownloadPdf && (
                        <button
                          type="button"
                          onClick={() => onDownloadPdf(order)}
                          title="Baixar Arquivo PDF (.pdf)"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      {/* Imprimir */}
                      <button
                        type="button"
                        onClick={() => onPrint(order)}
                        title="Imprimir OS / Ficha Física"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Etiqueta de Óleo */}
                      {onOpenOilSticker && (
                        <button
                          type="button"
                          onClick={() => onOpenOilSticker(order)}
                          title="Gerar Etiqueta de Troca de Óleo para o Para-brisa"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition"
                        >
                          <Droplet className="w-4 h-4" />
                        </button>
                      )}

                      {/* Emitir / Ver NF-e */}
                      {onOpenNFeModal && (
                        <button
                          type="button"
                          onClick={() => onOpenNFeModal(order)}
                          title={
                            order.nfeEmitida
                              ? `Ver DANFE / XML da NF-e #${order.nfeDados?.numeroNFe || ''}`
                              : 'Emitir NF-e / DANFE para este cliente'
                          }
                          className={`p-1.5 rounded-md transition ${
                            order.nfeEmitida
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => onEdit(order)}
                        title="Editar / Visualizar Detalhes"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Duplicar */}
                      <button
                        type="button"
                        onClick={() => onDuplicate(order)}
                        title="Criar nova OS com os dados deste cliente"
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Excluir */}
                      <button
                        type="button"
                        onClick={() => onDelete(order.id)}
                        title="Excluir Ordem"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
