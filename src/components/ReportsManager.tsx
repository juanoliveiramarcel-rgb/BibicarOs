import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  Gift,
  Phone,
  MessageCircle,
  Package,
  Wrench,
  DollarSign,
  Award,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  ServiceOrder,
  WorkshopConfig,
  InventoryItem,
  BillItem,
} from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ReportsManagerProps {
  orders: ServiceOrder[];
  config: WorkshopConfig;
  inventory: InventoryItem[];
  bills: BillItem[];
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  orders,
  config,
  inventory,
  bills,
}) => {
  const currentMonthIdx = new Date().getMonth();
  const [selectedBirthdayMonth, setSelectedBirthdayMonth] = useState<number>(currentMonthIdx);
  const [periodFilter, setPeriodFilter] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [searchTermABC, setSearchTermABC] = useState('');

  // 1. Calculate Period Filter Range
  const now = new Date();
  const filterDateRange = useMemo(() => {
    const start = new Date();
    if (periodFilter === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (periodFilter === 'quarter') {
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
    } else if (periodFilter === 'year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    } else {
      return null;
    }
    return start;
  }, [periodFilter]);

  // Filter completed/delivered orders within range
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const isFinished = o.statusOS === 'CONCLUÍDO' || o.statusOS === 'ENTREGUE';
      if (!isFinished) return false;
      if (!filterDateRange) return true;
      const d = o.veiculo?.dataSaida || o.updatedAt || o.createdAt;
      if (!d) return true;
      return new Date(d) >= filterDateRange;
    });
  }, [orders, filterDateRange]);

  // Filter paid bills within range
  const filteredPaidBills = useMemo(() => {
    return bills.filter((b) => {
      if (b.status !== 'PAGO') return false;
      if (!filterDateRange) return true;
      const d = b.dataPagamento || b.dataVencimento;
      return new Date(d) >= filterDateRange;
    });
  }, [bills, filterDateRange]);

  // 2. Financial Metrics Calculation
  const totalServicesOS = useMemo(
    () =>
      filteredOrders.reduce(
        (acc, o) => acc + (o.servicos || []).reduce((sum, s) => sum + s.valor, 0),
        0
      ),
    [filteredOrders]
  );

  const totalPartsOS = useMemo(
    () =>
      filteredOrders.reduce(
        (acc, o) => acc + (o.pecas || []).reduce((sum, p) => sum + p.qtd * p.preco, 0),
        0
      ),
    [filteredOrders]
  );

  const totalRevenue = totalServicesOS + totalPartsOS;

  const totalExpenses = useMemo(
    () =>
      filteredPaidBills
        .filter((b) => b.tipo === 'PAGAR')
        .reduce((acc, b) => acc + b.valor, 0),
    [filteredPaidBills]
  );

  const totalCostOSParts = useMemo(
    () =>
      filteredOrders.reduce((acc, o) => {
        const partsCost = (o.pecas || []).reduce(
          (sum, p) => sum + (p.custo || p.preco * 0.5) * p.qtd,
          0
        );
        return acc + partsCost;
      }, 0),
    [filteredOrders]
  );

  const totalOperationalProfit =
    totalRevenue - totalExpenses - totalCostOSParts;
  const profitMarginPercent = totalRevenue > 0 ? (totalOperationalProfit / totalRevenue) * 100 : 0;
  const averageTicket =
    filteredOrders.length > 0
      ? (totalServicesOS + totalPartsOS) / filteredOrders.length
      : 0;

  // 3. Monthly Breakdown for Bar Chart (Last 6 Months)
  const monthlyData = useMemo(() => {
    const list = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = MONTH_NAMES[month].substring(0, 3) + '/' + year.toString().slice(-2);

      // Filter OS completed in this month
      const osInMonth = orders.filter((o) => {
        if (o.statusOS !== 'CONCLUÍDO' && o.statusOS !== 'ENTREGUE') return false;
        const dtStr = o.veiculo?.dataSaida || o.updatedAt || o.createdAt;
        if (!dtStr) return false;
        const dt = new Date(dtStr);
        return dt.getFullYear() === year && dt.getMonth() === month;
      });

      // Filter paid expenses in this month
      const expInMonth = bills.filter((b) => {
        if (b.tipo !== 'PAGAR' || b.status !== 'PAGO') return false;
        const dt = new Date(b.dataPagamento || b.dataVencimento);
        return dt.getFullYear() === year && dt.getMonth() === month;
      });

      const servicos = osInMonth.reduce(
        (acc, o) => acc + (o.servicos || []).reduce((sum, s) => sum + s.valor, 0),
        0
      );
      const pecas = osInMonth.reduce(
        (acc, o) => acc + (o.pecas || []).reduce((sum, p) => sum + p.qtd * p.preco, 0),
        0
      );
      const despesas = expInMonth.reduce((acc, b) => acc + b.valor, 0);
      const faturamento = servicos + pecas;

      list.push({
        label,
        servicos,
        pecas,
        faturamento,
        despesas,
        lucro: faturamento - despesas,
      });
    }
    return list;
  }, [orders, bills]);

  const maxMonthlyRevenue = Math.max(...monthlyData.map((m) => Math.max(m.faturamento, m.despesas)), 100);

  // 4. Curva ABC de Produtos
  const abcProducts = useMemo(() => {
    const salesMap = new Map<
      string,
      {
        codigo: string;
        descricao: string;
        qtdVendida: number;
        faturamentoTotal: number;
        estoqueAtual: number;
      }
    >();

    // Seed from current inventory
    inventory.forEach((item) => {
      salesMap.set(item.descricao.toLowerCase().trim(), {
        codigo: item.codigo,
        descricao: item.descricao,
        qtdVendida: 0,
        faturamentoTotal: 0,
        estoqueAtual: item.quantidade,
      });
    });

    // Accumulate from completed orders
    orders.forEach((o) => {
      if (o.statusOS !== 'CONCLUÍDO' && o.statusOS !== 'ENTREGUE') return;
      (o.pecas || []).forEach((p) => {
        const key = p.descricao.toLowerCase().trim();
        const existing = salesMap.get(key) || {
          codigo: p.codigo || 'S/C',
          descricao: p.descricao,
          qtdVendida: 0,
          faturamentoTotal: 0,
          estoqueAtual: 0,
        };
        existing.qtdVendida += p.qtd;
        existing.faturamentoTotal += p.qtd * p.preco;
        salesMap.set(key, existing);
      });
    });

    // Sort by revenue descending
    const items = Array.from(salesMap.values()).sort(
      (a, b) => b.faturamentoTotal - a.faturamentoTotal
    );

    const totalABCFaturamento = items.reduce((acc, i) => acc + i.faturamentoTotal, 0);

    let cumulativeRevenue = 0;
    return items.map((item) => {
      cumulativeRevenue += item.faturamentoTotal;
      const share = totalABCFaturamento > 0 ? (item.faturamentoTotal / totalABCFaturamento) * 100 : 0;
      const cumulativeShare =
        totalABCFaturamento > 0 ? (cumulativeRevenue / totalABCFaturamento) * 100 : 0;

      let classification: 'A' | 'B' | 'C' = 'C';
      if (item.faturamentoTotal === 0) {
        classification = 'C';
      } else if (cumulativeShare <= 80 || item.faturamentoTotal >= totalABCFaturamento * 0.15) {
        classification = 'A';
      } else if (cumulativeShare <= 95) {
        classification = 'B';
      } else {
        classification = 'C';
      }

      return {
        ...item,
        share,
        cumulativeShare,
        classification,
      };
    });
  }, [inventory, orders]);

  const filteredAbc = useMemo(() => {
    if (!searchTermABC.trim()) return abcProducts;
    const q = searchTermABC.toLowerCase();
    return abcProducts.filter(
      (i) => i.descricao.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q)
    );
  }, [abcProducts, searchTermABC]);

  // 5. CRM: Aniversariantes do Mês
  const birthdayCustomers = useMemo(() => {
    const clientsMap = new Map<
      string,
      {
        nome: string;
        telefone: string;
        dataNascimento?: string;
        veiculo?: string;
        placa?: string;
        ultimaOS?: string;
      }
    >();

    orders.forEach((o) => {
      if (!o.cliente?.nome) return;
      const key = o.cliente.nome.toLowerCase().trim();
      if (!clientsMap.has(key)) {
        clientsMap.set(key, {
          nome: o.cliente.nome,
          telefone: o.cliente.telefone || '',
          dataNascimento: o.cliente.dataNascimento,
          veiculo: o.veiculo ? `${o.veiculo.marca} ${o.veiculo.modelo}` : '',
          placa: o.veiculo?.matricula || '',
          ultimaOS: o.numeroOS,
        });
      } else {
        const existing = clientsMap.get(key)!;
        if (!existing.dataNascimento && o.cliente.dataNascimento) {
          existing.dataNascimento = o.cliente.dataNascimento;
        }
      }
    });

    const list = Array.from(clientsMap.values());

    return list.filter((c) => {
      if (!c.dataNascimento) return false;
      // parse YYYY-MM-DD or DD/MM/YYYY
      let month: number | null = null;
      if (c.dataNascimento.includes('-')) {
        const parts = c.dataNascimento.split('-');
        if (parts.length >= 2) {
          month = parseInt(parts[1], 10) - 1;
        }
      } else if (c.dataNascimento.includes('/')) {
        const parts = c.dataNascimento.split('/');
        if (parts.length >= 2) {
          month = parseInt(parts[1], 10) - 1;
        }
      }
      return month === selectedBirthdayMonth;
    });
  }, [orders, selectedBirthdayMonth]);

  const sendWhatsAppBirthday = (c: {
    nome: string;
    telefone: string;
    veiculo?: string;
  }) => {
    const cleanPhone = c.telefone.replace(/\D/g, '');
    const workshopName = config.nome || 'Bibicar Oficina';
    const message = encodeURIComponent(
      `Olá ${c.nome}! 🎂🎈\n\nToda a equipe da *${workshopName}* deseja a você um Feliz Aniversário, com muita saúde, paz e conquistas!\n\nPara comemorar com você, preparamos um presente especial: *15% de desconto* na mão de obra na próxima revisão ou manutenção do seu veículo ${c.veiculo ? `(*${c.veiculo}*)` : ''}!\n\nBasta apresentar esta mensagem ao agendar o seu serviço. Aguardamos sua visita!`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & Period Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xs">
              <BarChart3 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                Relatórios Estratégicos & CRM
              </h1>
              <p className="text-xs text-slate-500">
                Indicadores gerenciais, Curva ABC de peças, faturamento e relacionamento com clientes
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setPeriodFilter('month')}
            className={`px-3 py-1.5 rounded-lg transition ${
              periodFilter === 'month'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriodFilter('quarter')}
            className={`px-3 py-1.5 rounded-lg transition ${
              periodFilter === 'quarter'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Últimos 3 Meses
          </button>
          <button
            onClick={() => setPeriodFilter('year')}
            className={`px-3 py-1.5 rounded-lg transition ${
              periodFilter === 'year'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Este Ano
          </button>
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              periodFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todo Histórico
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faturamento Bruto
            </span>
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Serviços: {formatCurrency(totalServicesOS)}</span>
            <span>Peças de OS: {formatCurrency(totalPartsOS)}</span>
          </div>
        </div>

        {/* Expenses & Costs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Despesas & Custos
            </span>
            <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalExpenses + totalCostOSParts)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Contas pagas: {formatCurrency(totalExpenses)}</span>
            <span>Custo de peças: {formatCurrency(totalCostOSParts)}</span>
          </div>
        </div>

        {/* Operational Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lucro Operacional
            </span>
            <div
              className={`p-2 rounded-xl ${
                totalOperationalProfit >= 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              totalOperationalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(totalOperationalProfit)}
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                profitMarginPercent >= 30
                  ? 'bg-emerald-100 text-emerald-800'
                  : profitMarginPercent >= 15
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {profitMarginPercent.toFixed(1)}% Margem
            </span>
            <span>sobre faturamento total</span>
          </div>
        </div>

        {/* Ticket Médio & OS Concluídas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ticket Médio Oficina
            </span>
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(averageTicket)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{filteredOrders.length} OS finalizadas</span>
            <span className="text-emerald-700 font-semibold font-mono">100% Ordens de Serviço</span>
          </div>
        </div>
      </div>

      {/* Grid: Visual Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart: Faturamento Mensal (Últimos 6 Meses) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-600" />
                  Evolução do Faturamento Mensal (Últimos 6 Meses)
                </h2>
                <p className="text-xs text-slate-500">
                  Comparativo entre Faturamento de OS (Serviços + Peças) vs Despesas
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Faturamento
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-xs bg-rose-400 inline-block" /> Despesas
                </span>
              </div>
            </div>

            {/* Visual CSS Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
              {monthlyData.map((item, idx) => {
                const revHeight = maxMonthlyRevenue > 0 ? (item.faturamento / maxMonthlyRevenue) * 100 : 0;
                const expHeight = maxMonthlyRevenue > 0 ? (item.despesas / maxMonthlyRevenue) * 100 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] p-2 rounded-lg pointer-events-none mb-1 text-center shadow-lg font-mono whitespace-nowrap z-10">
                      <div>Receita: {formatCurrency(item.faturamento)}</div>
                      <div>Despesas: {formatCurrency(item.despesas)}</div>
                      <div className="text-emerald-400 font-bold">
                        Lucro: {formatCurrency(item.lucro)}
                      </div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1.5 h-44">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${Math.max(revHeight, 3)}%` }}
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all relative group/bar"
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(expHeight, 3)}%` }}
                        className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t-md transition-all relative group/bar"
                      />
                    </div>

                    <span className="text-[11px] font-bold text-slate-600 mt-1">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Receita Média/Mês</span>
              <div className="text-xs font-black text-slate-800 font-mono mt-0.5">
                {formatCurrency(
                  monthlyData.reduce((acc, m) => acc + m.faturamento, 0) / (monthlyData.length || 1)
                )}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Despesa Média/Mês</span>
              <div className="text-xs font-black text-slate-800 font-mono mt-0.5">
                {formatCurrency(
                  monthlyData.reduce((acc, m) => acc + m.despesas, 0) / (monthlyData.length || 1)
                )}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Lucro Acumulado</span>
              <div className="text-xs font-black text-emerald-700 font-mono mt-0.5">
                {formatCurrency(monthlyData.reduce((acc, m) => acc + m.lucro, 0))}
              </div>
            </div>
          </div>
        </div>

        {/* CRM: Aniversariantes do Mês */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-600" />
                Aniversariantes do Mês (CRM)
              </h2>
              <span className="bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full text-xs font-extrabold border border-pink-200">
                {birthdayCustomers.length} cliente(s)
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Fidelize seus clientes enviando parabéns e cupons de revisão preventiva diretamente no WhatsApp.
            </p>

            {/* Month Filter Selector */}
            <div className="mb-4">
              <select
                value={selectedBirthdayMonth}
                onChange={(e) => setSelectedBirthdayMonth(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx}>
                    Mês de {m} {idx === currentMonthIdx ? '⭐ (Atual)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Customers Birthday List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {birthdayCustomers.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl p-4">
                  <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    Nenhum aniversariante cadastrado em {MONTH_NAMES[selectedBirthdayMonth]}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Preencha a data de nascimento no cadastro do cliente para ativar os lembretes automáticos.
                  </p>
                </div>
              ) : (
                birthdayCustomers.map((cust, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-pink-50/40 rounded-xl border border-pink-100 flex items-center justify-between gap-3 hover:bg-pink-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{cust.nome}</span>
                        {cust.placa && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600">
                            {cust.placa}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>🎂 {formatDate(cust.dataNascimento || '')}</span>
                        {cust.telefone && <span>• {cust.telefone}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => sendWhatsAppBirthday(cust)}
                      disabled={!cust.telefone}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-xs"
                      title="Enviar Parabéns no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Dica: Ofereça 15% de desconto para elevar o retorno dos clientes para revisões.</span>
          </div>
        </div>
      </div>

      {/* Section 3: Curva ABC de Produtos */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-red-50 text-red-600 p-1.5 rounded-lg">
                <PieChart className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Curva ABC de Peças & Produtos
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifique os produtos de maior giro e impacto financeiro versus itens parados em estoque
            </p>
          </div>

          {/* Search in ABC */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar peça ou código..."
              value={searchTermABC}
              onChange={(e) => setSearchTermABC(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Classe A (Alta Importância)
              </span>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                ~80% Receita
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Produtos campeões de vendas. Nunca devem faltar no estoque da oficina.
            </p>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-800 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Classe B (Médio Giro)
              </span>
              <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                ~15% Receita
              </span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1">
              Peças de giro intermediário com reposição sob demanda moderada.
            </p>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-800 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                Classe C (Baixo Giro / Parado)
              </span>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                ~5% Receita
              </span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              Itens com baixo volume ou sem saída recente. Evitar compras excessivas.
            </p>
          </div>
        </div>

        {/* ABC Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Classificação</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descrição da Peça</th>
                  <th className="px-4 py-3 text-right">Qtd Vendida</th>
                  <th className="px-4 py-3 text-right">Estoque Atual</th>
                  <th className="px-4 py-3 text-right">Faturamento Total</th>
                  <th className="px-4 py-3 text-right">Participação %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAbc.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredAbc.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                            item.classification === 'A'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.classification === 'B'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          Classe {item.classification}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-600 font-semibold">
                        {item.codigo}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {item.descricao}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                        {item.qtdVendida} un
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        <span
                          className={`font-bold ${
                            item.estoqueAtual <= 0
                              ? 'text-rose-600'
                              : item.estoqueAtual <= 3
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {item.estoqueAtual} un
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.faturamentoTotal)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-700">
                        {item.share.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
