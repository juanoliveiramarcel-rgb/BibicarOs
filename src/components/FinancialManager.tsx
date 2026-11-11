import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  AlertCircle,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Users,
  Building,
  Receipt,
  FileSpreadsheet,
  Wallet,
  PiggyBank,
  Search,
  Filter,
  X,
} from 'lucide-react';
import {
  BillItem,
  BillStatus,
  BillType,
  CashMovement,
  CashRegisterSession,
  ServiceOrder,
  WorkshopConfig,
} from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface FinancialManagerProps {
  orders: ServiceOrder[];
  config: WorkshopConfig;
  bills: BillItem[];
  onUpdateBills: (bills: BillItem[]) => void;
  cashSession: CashRegisterSession | null;
  onUpdateCashSession: (session: CashRegisterSession | null) => void;
}

export const FinancialManager: React.FC<FinancialManagerProps> = ({
  orders,
  config,
  bills,
  onUpdateBills,
  cashSession,
  onUpdateCashSession,
}) => {
  const [subTab, setSubTab] = useState<'caixa' | 'contas' | 'comissoes'>('caixa');

  // Modals state for Cash Register
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openInitialAmount, setOpenInitialAmount] = useState<number>(100);
  const [openOperator, setOpenOperator] = useState<string>('Operador Caixa');

  const [showSangriaModal, setShowSangriaModal] = useState(false);
  const [sangriaAmount, setSangriaAmount] = useState<number>(0);
  const [sangriaMotivo, setSangriaMotivo] = useState<string>('');
  const [sangriaOperator, setSangriaOperator] = useState<string>('Operador');

  const [showSuprimentoModal, setShowSuprimentoModal] = useState(false);
  const [suprimentoAmount, setSuprimentoAmount] = useState<number>(0);
  const [suprimentoMotivo, setSuprimentoMotivo] = useState<string>('Troco Adicional');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeFinalAmount, setCloseFinalAmount] = useState<number>(0);
  const [closeObs, setCloseObs] = useState<string>('');

  // Modals state for Bills
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [billTipo, setBillTipo] = useState<BillType>('PAGAR');
  const [billDescricao, setBillDescricao] = useState('');
  const [billCategoria, setBillCategoria] = useState('Fornecedor/Peças');
  const [billValor, setBillValor] = useState<number>(0);
  const [billVencimento, setBillVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [billEntidade, setBillEntidade] = useState('');
  const [billDocNumero, setBillDocNumero] = useState('');
  const [billObs, setBillObs] = useState('');

  const [billFilter, setBillFilter] = useState<'TODAS' | 'PAGAR' | 'RECEBER' | 'VENCIDAS' | 'PAGAS'>('TODAS');
  const [billSearch, setBillSearch] = useState('');

  // Commissions state
  const [commDateFilter, setCommDateFilter] = useState<'TODOS' | 'ESTE_MES' | 'ULTIMO_MES'>('ESTE_MES');

  // ----------------------------------------------------
  // CASH REGISTER CALCULATIONS
  // ----------------------------------------------------
  const isCashOpen = cashSession && cashSession.status === 'ABERTO';

  const cashMovements = cashSession?.movimentacoes || [];

  const totalEntradas = cashMovements
    .filter((m) => m.tipo === 'ENTRADA' || m.tipo === 'SUPRIMENTO')
    .reduce((acc, m) => acc + m.valor, 0);

  const totalSaidas = cashMovements
    .filter((m) => m.tipo === 'SAIDA' || m.tipo === 'SANGRIA')
    .reduce((acc, m) => acc + m.valor, 0);

  const totalSangrias = cashMovements
    .filter((m) => m.tipo === 'SANGRIA')
    .reduce((acc, m) => acc + m.valor, 0);

  // Cash in drawer (money only)
  const dinheiroEntradas = cashMovements
    .filter((m) => (m.tipo === 'ENTRADA' || m.tipo === 'SUPRIMENTO') && m.formaPagamento === 'DINHEIRO')
    .reduce((acc, m) => acc + m.valor, 0);

  const dinheiroSaidas = cashMovements
    .filter((m) => (m.tipo === 'SAIDA' || m.tipo === 'SANGRIA') && m.formaPagamento === 'DINHEIRO')
    .reduce((acc, m) => acc + m.valor, 0);

  const saldoDinheiroEsperado = (cashSession?.saldoInicial || 0) + dinheiroEntradas - dinheiroSaidas;
  const saldoTotalCaixa = (cashSession?.saldoInicial || 0) + totalEntradas - totalSaidas;

  // Handlers for Cash Register
  const handleOpenCash = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: CashRegisterSession = {
      id: `cash-${Date.now()}`,
      abertoEm: new Date().toISOString(),
      saldoInicial: openInitialAmount,
      status: 'ABERTO',
      operadorAbertura: openOperator || 'Operador',
      movimentacoes: [],
    };
    onUpdateCashSession(newSession);
    setShowOpenModal(false);
  };

  const handleRegisterSangria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashSession || sangriaAmount <= 0) return;

    const newMov: CashMovement = {
      id: `mov-${Date.now()}`,
      tipo: 'SANGRIA',
      descricao: `SANGRIA: ${sangriaMotivo.trim() || 'Retirada de caixa'}`,
      valor: sangriaAmount,
      formaPagamento: 'DINHEIRO',
      categoria: 'Sangria',
      dataHora: new Date().toISOString(),
      operador: sangriaOperator,
    };

    onUpdateCashSession({
      ...cashSession,
      movimentacoes: [newMov, ...cashSession.movimentacoes],
    });

    setSangriaAmount(0);
    setSangriaMotivo('');
    setShowSangriaModal(false);
  };

  const handleRegisterSuprimento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashSession || suprimentoAmount <= 0) return;

    const newMov: CashMovement = {
      id: `mov-${Date.now()}`,
      tipo: 'SUPRIMENTO',
      descricao: `SUPRIMENTO: ${suprimentoMotivo.trim() || 'Entrada de troco'}`,
      valor: suprimentoAmount,
      formaPagamento: 'DINHEIRO',
      categoria: 'Suprimento',
      dataHora: new Date().toISOString(),
      operador: cashSession.operadorAbertura,
    };

    onUpdateCashSession({
      ...cashSession,
      movimentacoes: [newMov, ...cashSession.movimentacoes],
    });

    setSuprimentoAmount(0);
    setSuprimentoMotivo('Troco Adicional');
    setShowSuprimentoModal(false);
  };

  const handleCloseCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashSession) return;

    const closedSession: CashRegisterSession = {
      ...cashSession,
      fechadoEm: new Date().toISOString(),
      saldoFinalDinheiro: closeFinalAmount,
      status: 'FECHADO',
      operadorFechamento: openOperator || 'Operador',
      observacoesFechamento: closeObs,
    };

    onUpdateCashSession(closedSession);
    setShowCloseModal(false);
  };

  // ----------------------------------------------------
  // BILLS (CONTAS A PAGAR E RECEBER) CALCULATIONS
  // ----------------------------------------------------
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to determine status based on date
  const getBillStatus = (bill: BillItem): BillStatus => {
    if (bill.status === 'PAGO' || bill.status === 'CANCELADO') return bill.status;
    if (bill.dataVencimento < todayStr) return 'VENCIDO';
    return 'PENDENTE';
  };

  const activeBills = bills.map((b) => ({
    ...b,
    status: getBillStatus(b),
  }));

  const totalAPagarPendente = activeBills
    .filter((b) => b.tipo === 'PAGAR' && (b.status === 'PENDENTE' || b.status === 'VENCIDO'))
    .reduce((acc, b) => acc + b.valor, 0);

  const totalAReceberPendente = activeBills
    .filter((b) => b.tipo === 'RECEBER' && (b.status === 'PENDENTE' || b.status === 'VENCIDO'))
    .reduce((acc, b) => acc + b.valor, 0);

  const totalVencido = activeBills
    .filter((b) => b.status === 'VENCIDO')
    .reduce((acc, b) => acc + b.valor, 0);

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billDescricao.trim() || billValor <= 0) return;

    const newBill: BillItem = {
      id: `bill-${Date.now()}`,
      tipo: billTipo,
      descricao: billDescricao.trim().toUpperCase(),
      categoria: billCategoria,
      valor: billValor,
      dataVencimento: billVencimento,
      status: 'PENDENTE',
      entidade: billEntidade.trim().toUpperCase() || 'DIVERSOS',
      documentoNumero: billDocNumero.trim(),
      observacoes: billObs.trim(),
    };

    onUpdateBills([newBill, ...bills]);
    setShowAddBillModal(false);
    setBillDescricao('');
    setBillValor(0);
    setBillEntidade('');
    setBillDocNumero('');
    setBillObs('');
  };

  const handlePayBill = (billId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    const isPaying = bill.tipo === 'PAGAR';
    const confirmMsg = isPaying
      ? `Confirmar o pagamento de ${formatCurrency(bill.valor)} para "${bill.entidade}"?`
      : `Confirmar o recebimento de ${formatCurrency(bill.valor)} de "${bill.entidade}"?`;

    if (!window.confirm(confirmMsg)) return;

    const updated = bills.map((b) =>
      b.id === billId
        ? {
            ...b,
            status: 'PAGO' as BillStatus,
            dataPagamento: new Date().toISOString().split('T')[0],
          }
        : b
    );
    onUpdateBills(updated);

    // Optionally integrate directly into Cash Register if open!
    if (isCashOpen && cashSession) {
      const mov: CashMovement = {
        id: `mov-${Date.now()}`,
        tipo: isPaying ? 'SAIDA' : 'ENTRADA',
        descricao: `${isPaying ? 'PAGAMENTO' : 'RECEBIMENTO'}: ${bill.descricao} (${bill.entidade})`,
        valor: bill.valor,
        formaPagamento: 'DINHEIRO',
        categoria: bill.categoria,
        dataHora: new Date().toISOString(),
        operador: cashSession.operadorAbertura,
        referenciaId: bill.id,
      };
      onUpdateCashSession({
        ...cashSession,
        movimentacoes: [mov, ...cashSession.movimentacoes],
      });
    }
  };

  const handleDeleteBill = (billId: string) => {
    if (window.confirm('Deseja excluir este lançamento financeiro?')) {
      onUpdateBills(bills.filter((b) => b.id !== billId));
    }
  };

  const filteredBills = activeBills.filter((b) => {
    const matchSearch =
      b.descricao.toLowerCase().includes(billSearch.toLowerCase()) ||
      b.entidade.toLowerCase().includes(billSearch.toLowerCase()) ||
      (b.documentoNumero || '').toLowerCase().includes(billSearch.toLowerCase());

    if (!matchSearch) return false;

    if (billFilter === 'PAGAR') return b.tipo === 'PAGAR' && b.status !== 'PAGO';
    if (billFilter === 'RECEBER') return b.tipo === 'RECEBER' && b.status !== 'PAGO';
    if (billFilter === 'VENCIDAS') return b.status === 'VENCIDO';
    if (billFilter === 'PAGAS') return b.status === 'PAGO';
    return true;
  });

  // ----------------------------------------------------
  // COMMISSIONS SUMMARY
  // ----------------------------------------------------
  const completedOrders = orders.filter((o) => o.statusOS === 'CONCLUÍDO' || o.statusOS === 'ENTREGUE');

  // Group commissions by mechanic
  const mechanicMap: {
    [key: string]: {
      nome: string;
      totalServicos: number;
      totalComissao: number;
      qtdOrdens: number;
    };
  } = {};

  completedOrders.forEach((o) => {
    (o.servicos || []).forEach((s) => {
      const mec = s.mecanico || o.mecanicoResponsavel || 'Geral';
      if (!mechanicMap[mec]) {
        mechanicMap[mec] = {
          nome: mec,
          totalServicos: 0,
          totalComissao: 0,
          qtdOrdens: 0,
        };
      }
      const val = Number(s.valor) || 0;
      mechanicMap[mec].totalServicos += val;
      // Default 40% commission if no profile
      mechanicMap[mec].totalComissao += val * 0.4;
      mechanicMap[mec].qtdOrdens += 1;
    });
  });

  const mechanicList = Object.values(mechanicMap);
  const totalComissoesGeral = mechanicList.reduce((acc, m) => acc + m.totalComissao, 0);

  return (
    <div className="space-y-4 no-print animate-in fade-in">
      {/* Top Navigation Subtabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab('caixa')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              subTab === 'caixa'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Fluxo de Caixa Diário</span>
            {isCashOpen && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('contas')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              subTab === 'contas'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Contas a Pagar & Receber</span>
            {totalVencido > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {activeBills.filter((b) => b.status === 'VENCIDO').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('comissoes')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              subTab === 'comissoes'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Controle de Comissões</span>
          </button>
        </div>

        {/* Status indicator on the right */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <span className="text-slate-500">Caixa Atual:</span>
          {isCashOpen ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <Unlock className="w-3.5 h-3.5 text-emerald-600" /> ABERTO
            </span>
          ) : (
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> FECHADO
            </span>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* SUBTAB 1: FLUXO DE CAIXA DIÁRIO                       */}
      {/* ==================================================== */}
      {subTab === 'caixa' && (
        <div className="space-y-4">
          {/* Caixa Status & Quick Actions Banner */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isCashOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {isCashOpen ? 'Caixa Diário Aberto' : 'Caixa Diário Fechado'}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCashOpen
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isCashOpen ? 'Operando' : 'Encerrado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isCashOpen
                      ? `Aberto em ${formatDate(cashSession.abertoEm)} por ${cashSession.operadorAbertura}`
                      : 'Abra o caixa informando o saldo inicial em dinheiro para iniciar as movimentações do dia'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {!isCashOpen ? (
                  <button
                    type="button"
                    onClick={() => setShowOpenModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Abrir Caixa</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowSuprimentoModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      title="Adicionar troco / entrada de dinheiro"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>Suprimento</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSangriaModal(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      title="Retirada de dinheiro da gaveta"
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      <span>Sangria</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCloseFinalAmount(saldoDinheiroEsperado);
                        setShowCloseModal(true);
                      }}
                      className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Fechar Caixa</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Metric Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Saldo Inicial</span>
                <span className="text-base font-extrabold text-slate-800 font-mono">
                  {formatCurrency(cashSession?.saldoInicial || 0)}
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Total Entradas
                </span>
                <span className="text-base font-extrabold text-emerald-700 font-mono">
                  +{formatCurrency(totalEntradas)}
                </span>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                <span className="text-[11px] font-bold text-amber-800 uppercase block flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-600" /> Saídas & Sangrias
                </span>
                <span className="text-base font-extrabold text-amber-700 font-mono">
                  -{formatCurrency(totalSaidas)}
                </span>
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xs">
                <span className="text-[11px] font-bold text-slate-300 uppercase block">Dinheiro na Gaveta</span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {formatCurrency(saldoDinheiroEsperado)}
                </span>
              </div>
            </div>
          </div>

          {/* Movements Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Movimentações Registradas na Sessão ({cashMovements.length})</span>
              </h4>
              <span className="text-xs text-slate-500">
                Saldo Total (Todas Formas): <strong>{formatCurrency(saldoTotalCaixa)}</strong>
              </span>
            </div>

            {cashMovements.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhuma movimentação registrada no caixa atual.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Hora</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-4">Descrição / Origem</th>
                      <th className="py-2.5 px-3">Forma</th>
                      <th className="py-2.5 px-3">Operador</th>
                      <th className="py-2.5 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashMovements.map((mov) => {
                      const isPositive = mov.tipo === 'ENTRADA' || mov.tipo === 'SUPRIMENTO';
                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {mov.dataHora.split('T')[1]?.substring(0, 5) || '--:--'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                mov.tipo === 'SANGRIA'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isPositive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {mov.tipo}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            {mov.descricao}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                            {mov.formaPagamento}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {mov.operador || 'Geral'}
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-mono font-bold ${
                              isPositive ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? '+' : '-'} {formatCurrency(mov.valor)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUBTAB 2: CONTAS A PAGAR E RECEBER                     */}
      {/* ==================================================== */}
      {subTab === 'contas' && (
        <div className="space-y-4">
          {/* Metric Cards for Bills */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">A Pagar (Pendente)</span>
              <span className="text-xl font-extrabold text-red-600 font-mono">
                {formatCurrency(totalAPagarPendente)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">A Receber (Pendente)</span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono">
                {formatCurrency(totalAReceberPendente)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase block flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Títulos Vencidos
              </span>
              <span className="text-xl font-extrabold text-amber-700 font-mono">
                {formatCurrency(totalVencido)}
              </span>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs">
              <span className="text-[11px] font-bold text-slate-300 uppercase block">Saldo Previsto</span>
              <span className="text-xl font-black text-white font-mono">
                {formatCurrency(totalAReceberPendente - totalAPagarPendente)}
              </span>
            </div>
          </div>

          {/* Action and Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                placeholder="Buscar por descrição, fornecedor ou documento..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                {(['TODAS', 'PAGAR', 'RECEBER', 'VENCIDAS', 'PAGAS'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBillFilter(mode)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      billFilter === mode
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'TODAS'
                      ? 'Todas'
                      : mode === 'PAGAR'
                      ? 'A Pagar'
                      : mode === 'RECEBER'
                      ? 'A Receber'
                      : mode === 'VENCIDAS'
                      ? 'Vencidas'
                      : 'Pagas'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddBillModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Despesa / Conta</span>
              </button>
            </div>
          </div>

          {/* Bills Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {filteredBills.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhuma conta encontrada com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Tipo</th>
                      <th className="py-3 px-4">Descrição da Conta / Despesa</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-4">Fornecedor / Favorecido</th>
                      <th className="py-3 px-3 text-center">Vencimento</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBills.map((b) => {
                      const isPagar = b.tipo === 'PAGAR';
                      const isPaid = b.status === 'PAGO';
                      const isVencido = b.status === 'VENCIDO';

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPagar ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isPagar ? 'A PAGAR' : 'A RECEBER'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {b.descricao}
                            {b.documentoNumero && (
                              <span className="text-[10px] text-slate-400 font-normal block font-mono">
                                Doc: {b.documentoNumero}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                              {b.categoria}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-semibold">
                            {b.entidade}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700">
                            {formatDate(b.dataVencimento)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isPaid ? (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pago
                              </span>
                            ) : isVencido ? (
                              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-red-600" /> Vencido
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                Pendente
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                              isPagar ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {formatCurrency(b.valor)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => handlePayBill(b.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                                  title={isPagar ? 'Dar Baixa / Pagar' : 'Dar Baixa / Receber'}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{isPagar ? 'Pagar' : 'Receber'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteBill(b.id)}
                                className="p-1 text-slate-400 hover:text-red-600 transition"
                                title="Excluir Lançamento"
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
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUBTAB 3: CONTROLE DE COMISSÕES                       */}
      {/* ==================================================== */}
      {subTab === 'comissoes' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                <span>Comissões de Mão de Obra (Ordens Concluídas)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculado automaticamente com base nos serviços executados em cada OS finalizada
              </p>
            </div>

            <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total a Pagar</span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {formatCurrency(totalComissoesGeral)}
                </span>
              </div>
            </div>
          </div>

          {/* Mechanics Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {mechanicList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum serviço concluído registrado com mecânico atribuído.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mecânico / Colaborador</th>
                    <th className="py-3 px-3 text-center">Ordens Realizadas</th>
                    <th className="py-3 px-4 text-right">Total Mão de Obra</th>
                    <th className="py-3 px-3 text-center">Taxa Comissão</th>
                    <th className="py-3 px-4 text-right">Comissão a Receber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mechanicList.map((mec) => (
                    <tr key={mec.nome} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {mec.nome}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {mec.qtdOrdens} serviços
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(mec.totalServicos)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-700 font-bold bg-emerald-50">
                        40%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-sm text-red-600">
                        {formatCurrency(mec.totalComissao)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODALS SECTION                                       */}
      {/* ==================================================== */}

      {/* 1. Modal Abertura de Caixa */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Unlock className="w-4 h-4 text-emerald-600" />
                <span>Abertura de Caixa Diário</span>
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenCash} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Saldo Inicial em Dinheiro (Fundo de Troco) R$
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openInitialAmount}
                  onChange={(e) => setOpenInitialAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nome do Operador de Caixa
                </label>
                <input
                  type="text"
                  required
                  value={openOperator}
                  onChange={(e) => setOpenOperator(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold shadow-xs"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Sangria de Caixa */}
      {showSangriaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-amber-700">
                <ArrowDownCircle className="w-4 h-4 text-amber-600" />
                <span>Registrar Sangria (Retirada de Dinheiro)</span>
              </h3>
              <button onClick={() => setShowSangriaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSangria} className="space-y-3 text-xs">
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
                Saldo atual em gaveta disponível: <strong>{formatCurrency(saldoDinheiroEsperado)}</strong>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Valor da Retirada (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={saldoDinheiroEsperado > 0 ? saldoDinheiroEsperado : undefined}
                  required
                  value={sangriaAmount || ''}
                  onChange={(e) => setSangriaAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-base font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Motivo / Justificativa da Sangria
                </label>
                <input
                  type="text"
                  required
                  value={sangriaMotivo}
                  onChange={(e) => setSangriaMotivo(e.target.value)}
                  placeholder="Ex: Pagamento Fornecedor de Peças, Depósito Bancário"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Operador Responsável
                </label>
                <input
                  type="text"
                  value={sangriaOperator}
                  onChange={(e) => setSangriaOperator(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSangriaModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-bold shadow-xs"
                >
                  Confirmar Sangria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Suprimento de Caixa */}
      {showSuprimentoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-blue-700">
                <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                <span>Registrar Suprimento (Entrada de Troco)</span>
              </h3>
              <button onClick={() => setShowSuprimentoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSuprimento} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Valor a Inserir na Gaveta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={suprimentoAmount || ''}
                  onChange={(e) => setSuprimentoAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-base font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  required
                  value={suprimentoMotivo}
                  onChange={(e) => setSuprimentoMotivo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSuprimentoModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-xs"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Fechamento de Caixa */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-red-600" />
                <span>Fechamento & Conferência de Caixa</span>
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseCash} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Saldo Inicial:</span>
                  <strong className="font-mono">{formatCurrency(cashSession?.saldoInicial || 0)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Dinheiro Calculado em Gaveta:</span>
                  <strong className="font-mono text-emerald-700 font-bold">{formatCurrency(saldoDinheiroEsperado)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Valor Físico Contado na Gaveta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={closeFinalAmount}
                  onChange={(e) => setCloseFinalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {closeFinalAmount !== saldoDinheiroEsperado && (
                  <p className="text-[11px] font-semibold text-amber-700 mt-1">
                    Diferença de conferência: {formatCurrency(closeFinalAmount - saldoDinheiroEsperado)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Observações de Fechamento
                </label>
                <textarea
                  rows={2}
                  value={closeObs}
                  onChange={(e) => setCloseObs(e.target.value)}
                  placeholder="Informações adicionais do turno ou conferência..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold shadow-xs"
                >
                  Encerrar e Fechar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Nova Despesa / Conta a Pagar/Receber */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-red-600" />
                <span>Novo Lançamento Financeiro</span>
              </h3>
              <button onClick={() => setShowAddBillModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBill} className="space-y-3 text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="radio"
                    name="tipoConta"
                    checked={billTipo === 'PAGAR'}
                    onChange={() => setBillTipo('PAGAR')}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-red-600">Conta a Pagar (Despesa)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="radio"
                    name="tipoConta"
                    checked={billTipo === 'RECEBER'}
                    onChange={() => setBillTipo('RECEBER')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-emerald-700">Conta a Receber (Receita)</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Descrição da Conta / Título
                </label>
                <input
                  type="text"
                  required
                  value={billDescricao}
                  onChange={(e) => setBillDescricao(e.target.value)}
                  placeholder="Ex: Aluguel Galpão Oficina, Fatura Distribuidora Peças"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Categoria
                  </label>
                  <select
                    value={billCategoria}
                    onChange={(e) => setBillCategoria(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value="Fornecedor/Peças">Fornecedor / Peças</option>
                    <option value="Aluguel">Aluguel / Galpão</option>
                    <option value="Água/Luz/Internet">Água / Luz / Internet</option>
                    <option value="Salários/Adiantamentos">Salários / Colaboradores</option>
                    <option value="Impostos/Taxas">Impostos / Tributos</option>
                    <option value="Ferramentas/Equipamentos">Ferramentas / Maquinário</option>
                    <option value="Serviços Prestados">Serviços a Receber</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={billValor || ''}
                    onChange={(e) => setBillValor(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    required
                    value={billVencimento}
                    onChange={(e) => setBillVencimento(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Fornecedor / Cliente / Favorecido
                  </label>
                  <input
                    type="text"
                    value={billEntidade}
                    onChange={(e) => setBillEntidade(e.target.value)}
                    placeholder="Ex: Auto Peças Brasil, Imobiliária"
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nº do Documento / Nota Fiscal / Boleto
                </label>
                <input
                  type="text"
                  value={billDocNumero}
                  onChange={(e) => setBillDocNumero(e.target.value)}
                  placeholder="Ex: NF 12345, Boleto Itaú 9988"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold shadow-xs"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
