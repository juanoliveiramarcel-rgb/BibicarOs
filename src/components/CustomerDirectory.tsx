import React, { useState } from 'react';
import {
  Users,
  Car,
  Phone,
  Mail,
  MapPin,
  Plus,
  Search,
  Receipt,
  ChevronRight,
} from 'lucide-react';
import { ServiceOrder } from '../types';
import { calculateOrderTotals, formatCurrency } from '../utils/formatters';

interface CustomerDirectoryProps {
  orders: ServiceOrder[];
  onNewOrderForCustomer: (clientName: string, vehiclePlate?: string) => void;
  onFilterByCustomer: (clientName: string) => void;
  onOpenVehicleHistory?: (plate: string) => void;
}

interface CustomerSummary {
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  veiculos: { marca: string; modelo: string; matricula: string; ano?: string }[];
  totalOrdens: number;
  totalGasto: number;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  orders,
  onNewOrderForCustomer,
  onFilterByCustomer,
  onOpenVehicleHistory,
}) => {
  const [search, setSearch] = useState('');

  // Group by client name / document
  const clientMap = new Map<string, CustomerSummary>();

  orders.forEach((order) => {
    const nome = order.cliente?.nome?.trim();
    if (!nome) return;
    const key = nome.toLowerCase();

    const totals = calculateOrderTotals(order);
    const existing = clientMap.get(key);

    const veic = order.veiculo;
    const hasVeic = veic && (veic.modelo || veic.matricula);

    if (!existing) {
      const veiculosList = hasVeic
        ? [
            {
              marca: veic.marca || '',
              modelo: veic.modelo || '',
              matricula: veic.matricula || '',
              ano: veic.ano || '',
            },
          ]
        : [];

      clientMap.set(key, {
        nome: order.cliente.nome,
        documento: order.cliente.documento || '',
        telefone: order.cliente.telefone || '',
        email: order.cliente.email || '',
        endereco: order.cliente.endereco || '',
        veiculos: veiculosList,
        totalOrdens: 1,
        totalGasto: totals.totalGeral,
      });
    } else {
      existing.totalOrdens += 1;
      existing.totalGasto += totals.totalGeral;

      if (!existing.telefone && order.cliente.telefone) existing.telefone = order.cliente.telefone;
      if (!existing.documento && order.cliente.documento) existing.documento = order.cliente.documento;
      if (!existing.email && order.cliente.email) existing.email = order.cliente.email;
      if (!existing.endereco && order.cliente.endereco) existing.endereco = order.cliente.endereco;

      if (hasVeic) {
        const jaTem = existing.veiculos.some(
          (v) =>
            (v.matricula && v.matricula.toLowerCase() === (veic.matricula || '').toLowerCase()) ||
            (!v.matricula && v.modelo.toLowerCase() === (veic.modelo || '').toLowerCase())
        );
        if (!jaTem) {
          existing.veiculos.push({
            marca: veic.marca || '',
            modelo: veic.modelo || '',
            matricula: veic.matricula || '',
            ano: veic.ano || '',
          });
        }
      }
    }
  });

  const clients = Array.from(clientMap.values()).filter((c) => {
    const term = search.toLowerCase();
    const matchName = c.nome.toLowerCase().includes(term);
    const matchDoc = c.documento.toLowerCase().includes(term);
    const matchPhone = c.telefone.toLowerCase().includes(term);
    const matchCar = c.veiculos.some(
      (v) =>
        v.modelo.toLowerCase().includes(term) ||
        v.matricula.toLowerCase().includes(term) ||
        v.marca.toLowerCase().includes(term)
    );
    return matchName || matchDoc || matchPhone || matchCar;
  });

  return (
    <div className="space-y-4 no-print">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, telefone, CPF ou placa do veículo..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Total de <strong className="text-slate-800">{clients.length}</strong> clientes cadastrados
        </p>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                    {client.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      {client.nome}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {client.documento || 'Doc. não informado'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                  {client.totalOrdens} {client.totalOrdens === 1 ? 'OS' : 'OSs'}
                </span>
              </div>

              {/* Contacts */}
              <div className="space-y-1 text-xs text-slate-600 mb-3">
                {client.telefone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{client.telefone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.endereco && (
                  <div className="flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.endereco}</span>
                  </div>
                )}
              </div>

              {/* Vehicles Registered */}
              <div className="mb-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Car className="w-3 h-3 text-red-500" />
                  <span>Veículos Cadastrados ({client.veiculos.length})</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {client.veiculos.length > 0 ? (
                    client.veiculos.map((v, vIdx) => (
                      <button
                        key={vIdx}
                        type="button"
                        onClick={() => v.matricula && onOpenVehicleHistory?.(v.matricula)}
                        className={`inline-flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-medium transition ${
                          v.matricula
                            ? 'hover:bg-red-50 hover:text-red-700 hover:border-red-300 cursor-pointer shadow-2xs'
                            : 'cursor-default'
                        }`}
                        title={v.matricula ? `Ver prontuário da placa ${v.matricula}` : undefined}
                      >
                        <span>
                          {v.marca} {v.modelo}
                        </span>
                        {v.matricula && (
                          <strong className="font-mono text-slate-900 ml-1">
                            {v.matricula}
                          </strong>
                        )}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Nenhum veículo vinculado ainda
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Total Histórico:
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatCurrency(client.totalGasto)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onFilterByCustomer(client.nome)}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold transition"
                >
                  Ver Histórico
                </button>
                <button
                  type="button"
                  onClick={() => onNewOrderForCustomer(client.nome)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nova OS</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
