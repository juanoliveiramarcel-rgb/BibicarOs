import React from 'react';
import {
  X,
  Car,
  Calendar,
  Gauge,
  TrendingUp,
  Wrench,
  Package,
  Clock,
  Printer,
  Plus,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
} from 'lucide-react';
import { ServiceOrder, WorkshopConfig } from '../types';
import {
  calculateOrderTotals,
  formatCurrency,
  formatDate,
} from '../utils/formatters';

interface VehicleHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  plate: string;
  orders: ServiceOrder[];
  config: WorkshopConfig;
  onNewOrderForPlate: (order: ServiceOrder) => void;
}

export const VehicleHistoryModal: React.FC<VehicleHistoryModalProps> = ({
  isOpen,
  onClose,
  plate,
  orders,
  config,
  onNewOrderForPlate,
}) => {
  if (!isOpen || !plate) return null;

  const cleanTargetPlate = plate.toUpperCase().trim();

  // Find all orders for this plate (sorted newest to oldest)
  const vehicleOrders = orders
    .filter(
      (o) =>
        o.veiculo?.matricula?.toUpperCase().trim() === cleanTargetPlate ||
        (cleanTargetPlate.length > 3 &&
          o.veiculo?.matricula?.toUpperCase().replace(/[^A-Z0-9]/g, '') ===
            cleanTargetPlate.replace(/[^A-Z0-9]/g, ''))
    )
    .sort((a, b) => {
      const dateA = a.veiculo?.dataEntrada || a.createdAt || '';
      const dateB = b.veiculo?.dataEntrada || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

  const latestOrder = vehicleOrders[0];
  const oldestOrder = vehicleOrders[vehicleOrders.length - 1];

  const vehicleInfo = latestOrder?.veiculo;
  const clientInfo = latestOrder?.cliente;

  const totalSpent = vehicleOrders.reduce(
    (acc, o) => acc + calculateOrderTotals(o).totalGeral,
    0
  );

  // Mileage analysis
  const kmsRecorded = vehicleOrders
    .map((o) => parseInt(o.veiculo?.kmEntrada || '0', 10))
    .filter((k) => k > 0)
    .sort((a, b) => b - a);

  const highestKm = kmsRecorded[0] || 0;
  const lowestKm = kmsRecorded[kmsRecorded.length - 1] || highestKm;
  const kmDifference = highestKm - lowestKm;

  // Search specific past services across history
  const allServices = vehicleOrders.flatMap((o) => o.servicos || []);
  const allParts = vehicleOrders.flatMap((o) => o.pecas || []);

  const lastOilService = vehicleOrders.find(
    (o) =>
      o.servicos?.some((s) => s.descricao.toLowerCase().includes('óleo') || s.descricao.toLowerCase().includes('oleo')) ||
      o.pecas?.some((p) => p.descricao.toLowerCase().includes('óleo') || p.descricao.toLowerCase().includes('oleo'))
  );

  const lastTimingBeltService = vehicleOrders.find(
    (o) =>
      o.servicos?.some((s) => s.descricao.toLowerCase().includes('correia')) ||
      o.pecas?.some((p) => p.descricao.toLowerCase().includes('correia'))
  );

  const lastBrakeService = vehicleOrders.find(
    (o) =>
      o.servicos?.some((s) => s.descricao.toLowerCase().includes('freio') || s.descricao.toLowerCase().includes('pastilha')) ||
      o.pecas?.some((p) => p.descricao.toLowerCase().includes('freio') || p.descricao.toLowerCase().includes('pastilha'))
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-start overflow-y-auto p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2.5 rounded-xl font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  Prontuário & Linha do Tempo do Veículo
                </h3>
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-300">
                  {cleanTargetPlate}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Histórico completo de revisões, manutenções e peças aplicadas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-160px)] overflow-y-auto">
          {/* Top Vehicle & Owner Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-slate-900">
                  {vehicleInfo?.marca} {vehicleInfo?.modelo}
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  {[vehicleInfo?.ano, vehicleInfo?.cor].filter(Boolean).join(' · ')}
                </span>
              </div>

              <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  <strong>Cliente:</strong> {clientInfo?.nome || 'Não informado'}
                </span>
                {clientInfo?.telefone && (
                  <span className="flex items-center gap-1 font-mono text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {clientInfo.telefone}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Prontuário</span>
              </button>

              {latestOrder && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNewOrderForPlate(latestOrder);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova OS para este Carro</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Visitas na Oficina
              </span>
              <p className="text-xl font-black text-slate-900 font-mono">
                {vehicleOrders.length} {vehicleOrders.length === 1 ? 'visita' : 'visitas'}
              </p>
              <span className="text-[10px] text-slate-500">
                Desde {formatDate(oldestOrder?.veiculo?.dataEntrada)}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                KM Atual Registrado
              </span>
              <p className="text-xl font-black text-slate-900 font-mono">
                {highestKm > 0 ? `${highestKm.toLocaleString('pt-BR')} km` : 'N/D'}
              </p>
              <span className="text-[10px] text-slate-500">
                {kmDifference > 0 ? `+${kmDifference.toLocaleString('pt-BR')} km na oficina` : 'Primeira leitura'}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Total Investido
              </span>
              <p className="text-xl font-black text-red-600 font-mono">
                {formatCurrency(totalSpent)}
              </p>
              <span className="text-[10px] text-slate-500">
                Média {formatCurrency(vehicleOrders.length > 0 ? totalSpent / vehicleOrders.length : 0)} / visita
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Serviços Executados
              </span>
              <p className="text-xl font-black text-slate-900 font-mono">
                {allServices.length} serviços
              </p>
              <span className="text-[10px] text-slate-500">
                e {allParts.length} peças substituídas
              </span>
            </div>
          </div>

          {/* Quick Maintenance Health Indicator */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Status das Manutenções Críticas do Veículo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Óleo */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="font-bold text-slate-800 block text-[11px] mb-1">
                  Troca de Óleo & Filtros
                </span>
                {lastOilService ? (
                  <div className="space-y-0.5 text-slate-600 text-[11px]">
                    <p className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Realizada em {formatDate(lastOilService.veiculo?.dataEntrada)}</span>
                    </p>
                    <p className="text-slate-500 font-mono">
                      KM: {lastOilService.veiculo?.kmEntrada || 'N/D'} km (OS #{lastOilService.numeroOS})
                    </p>
                  </div>
                ) : (
                  <p className="text-amber-600 text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Nenhum registro de troca de óleo no sistema</span>
                  </p>
                )}
              </div>

              {/* Correia Dentada */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="font-bold text-slate-800 block text-[11px] mb-1">
                  Correia Dentada / Tensor
                </span>
                {lastTimingBeltService ? (
                  <div className="space-y-0.5 text-slate-600 text-[11px]">
                    <p className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Trocada em {formatDate(lastTimingBeltService.veiculo?.dataEntrada)}</span>
                    </p>
                    <p className="text-slate-500 font-mono">
                      KM: {lastTimingBeltService.veiculo?.kmEntrada || 'N/D'} km (OS #{lastTimingBeltService.numeroOS})
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    Sem troca de correia registrada
                  </p>
                )}
              </div>

              {/* Freios */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="font-bold text-slate-800 block text-[11px] mb-1">
                  Sistema de Freios & Pastilhas
                </span>
                {lastBrakeService ? (
                  <div className="space-y-0.5 text-slate-600 text-[11px]">
                    <p className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Revisado em {formatDate(lastBrakeService.veiculo?.dataEntrada)}</span>
                    </p>
                    <p className="text-slate-500 font-mono">
                      KM: {lastBrakeService.veiculo?.kmEntrada || 'N/D'} km (OS #{lastBrakeService.numeroOS})
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    Sem histórico de freios registrado
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Chronological Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
              Linha do Tempo Cronológica de Atendimentos ({vehicleOrders.length})
            </h4>

            {vehicleOrders.length === 0 ? (
              <p className="text-slate-400 italic text-xs py-4 text-center">
                Nenhum histórico encontrado para esta placa.
              </p>
            ) : (
              <div className="relative border-l-2 border-red-500/40 ml-3 space-y-6 pl-5">
                {vehicleOrders.map((order, idx) => {
                  const totals = calculateOrderTotals(order);

                  return (
                    <div key={order.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-xs"></div>

                      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm transition space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900">
                              OS #{order.numeroOS}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                              {order.statusOS}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {order.tipoDoc}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(order.veiculo?.dataEntrada)}
                            </span>
                            {order.veiculo?.kmEntrada && (
                              <span className="flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                <Gauge className="w-3 h-3 text-slate-500" />
                                {order.veiculo.kmEntrada} km
                              </span>
                            )}
                            <span className="font-mono font-black text-sm text-slate-900">
                              {formatCurrency(totals.totalGeral)}
                            </span>
                          </div>
                        </div>

                        {/* Services List */}
                        {order.servicos && order.servicos.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1 mb-1">
                              <Wrench className="w-3 h-3 text-red-600" />
                              <span>Mão de Obra e Serviços Realizados:</span>
                            </span>
                            <div className="space-y-1">
                              {order.servicos.map((s, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="flex justify-between items-center text-xs bg-slate-50 px-2.5 py-1 rounded text-slate-700"
                                >
                                  <span>{s.descricao}</span>
                                  <span className="font-mono font-semibold text-slate-900">
                                    {formatCurrency(s.valor)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Parts List */}
                        {order.pecas && order.pecas.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1 mb-1">
                              <Package className="w-3 h-3 text-red-600" />
                              <span>Peças e Insumos Substituídos:</span>
                            </span>
                            <div className="space-y-1">
                              {order.pecas.map((p, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="flex justify-between items-center text-xs bg-slate-50 px-2.5 py-1 rounded text-slate-700"
                                >
                                  <span>
                                    {p.qtd}x {p.descricao}
                                  </span>
                                  <span className="font-mono font-semibold text-slate-900">
                                    {formatCurrency((p.qtd || 0) * (p.preco || 0))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {order.pagamento?.observacoes && (
                          <p className="text-[11px] text-slate-500 bg-amber-50/60 p-2 rounded border border-amber-200/60">
                            <strong>Obs:</strong> {order.pagamento.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-lg text-xs font-bold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
