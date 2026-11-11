import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Wrench,
  Calendar,
  Percent,
  CheckCircle2,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  Car,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { ServiceOrder, WorkshopConfig, MechanicProfile } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  getStoredMechanics,
  saveStoredMechanics,
  addStoredMechanic,
  updateStoredMechanic,
  deleteStoredMechanic,
  MECHANICS_UPDATED_EVENT,
} from '../utils/mechanicsStorage';
import { MechanicFormModal } from './MechanicFormModal';

interface MechanicCommissionsProps {
  orders: ServiceOrder[];
  config: WorkshopConfig;
  mechanics?: MechanicProfile[];
  onUpdateMechanics?: (updated: MechanicProfile[]) => void;
}

interface MechanicStats {
  profile?: MechanicProfile;
  nome: string;
  isRegistered: boolean;
  ativo: boolean;
  comissaoTaxa: number; // Porcentagem
  totalServicos: number;
  totalMaoDeObra: number;
  comissaoTotal: number;
  servicosExecutados: {
    data: string;
    numeroOS: string;
    cliente: string;
    veiculo: string;
    descricao: string;
    valor: number;
    comissao: number;
  }[];
}

export const MechanicCommissions: React.FC<MechanicCommissionsProps> = ({
  orders,
  config,
  mechanics,
  onUpdateMechanics,
}) => {
  const [localMechanicsList, setLocalMechanicsList] = useState<MechanicProfile[]>(() =>
    mechanics || getStoredMechanics()
  );

  const mechanicsList = mechanics || localMechanicsList;
  const setMechanicsList = (list: MechanicProfile[]) => {
    setLocalMechanicsList(list);
    if (onUpdateMechanics) {
      onUpdateMechanics(list);
    }
  };

  const [periodFilter, setPeriodFilter] = useState<'all' | 'this_month' | 'last_month'>('all');
  const [onlyCompleted, setOnlyCompleted] = useState(true);
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState<MechanicProfile | null>(null);

  // Deletion confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Copy feedback state
  const [copiedPix, setCopiedPix] = useState<string | null>(null);

  // Reload mechanics when storage changes
  useEffect(() => {
    const handleUpdate = () => {
      setMechanicsList(getStoredMechanics());
    };

    window.addEventListener(MECHANICS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(MECHANICS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Filter orders according to period & status
  const filteredOrders = orders.filter((order) => {
    if (onlyCompleted && order.statusOS !== 'CONCLUÍDO' && order.statusOS !== 'ENTREGUE') {
      return false;
    }

    if (periodFilter === 'all') return true;

    const dateStr = order.veiculo?.dataEntrada || order.createdAt;
    if (!dateStr) return false;
    const orderDate = new Date(dateStr);

    if (periodFilter === 'this_month') {
      return (
        orderDate.getFullYear() === currentYear &&
        orderDate.getMonth() === currentMonth
      );
    }

    if (periodFilter === 'last_month') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return (
        orderDate.getFullYear() === lastMonthYear &&
        orderDate.getMonth() === lastMonth
      );
    }

    return true;
  });

  // Build stats map: start with ALL registered mechanics so they appear even with 0 orders
  const statsMap = new Map<string, MechanicStats>();

  mechanicsList.forEach((m) => {
    statsMap.set(m.nome.toLowerCase().trim(), {
      profile: m,
      nome: m.nome,
      isRegistered: true,
      ativo: m.ativo,
      comissaoTaxa: m.comissaoTaxa,
      totalServicos: 0,
      totalMaoDeObra: 0,
      comissaoTotal: 0,
      servicosExecutados: [],
    });
  });

  // Tally services from filtered orders
  filteredOrders.forEach((order) => {
    const defaultMecName = order.mecanicoResponsavel?.trim() || 'Não Atribuído';

    (order.servicos || []).forEach((s) => {
      const rawName = s.mecanico?.trim() || defaultMecName;
      const key = rawName.toLowerCase().trim();

      let stat = statsMap.get(key);
      if (!stat) {
        // Unregistered mechanic from orders
        stat = {
          nome: rawName,
          isRegistered: false,
          ativo: true,
          comissaoTaxa: 30, // Default for unregistered
          totalServicos: 0,
          totalMaoDeObra: 0,
          comissaoTotal: 0,
          servicosExecutados: [],
        };
        statsMap.set(key, stat);
      }

      const comissaoItem = (s.valor * stat.comissaoTaxa) / 100;
      stat.totalServicos += 1;
      stat.totalMaoDeObra += s.valor;
      stat.comissaoTotal += comissaoItem;
      stat.servicosExecutados.push({
        data: order.veiculo?.dataEntrada || order.createdAt,
        numeroOS: order.numeroOS,
        cliente: order.cliente?.nome || 'Cliente',
        veiculo: `${order.veiculo?.marca || ''} ${order.veiculo?.modelo || ''} (${order.veiculo?.matricula || ''})`.trim(),
        descricao: s.descricao,
        valor: s.valor,
        comissao: comissaoItem,
      });
    });
  });

  const allStats = Array.from(statsMap.values()).sort((a, b) => {
    // Registered active first, then by total labor desc
    if (a.isRegistered && !b.isRegistered) return -1;
    if (!a.isRegistered && b.isRegistered) return 1;
    if (a.ativo && !b.ativo) return -1;
    if (!a.ativo && b.ativo) return 1;
    return b.totalMaoDeObra - a.totalMaoDeObra;
  });

  const totalGeralMaoDeObra = allStats.reduce((acc, m) => acc + m.totalMaoDeObra, 0);
  const totalGeralComissoes = allStats.reduce((acc, m) => acc + m.comissaoTotal, 0);

  // Selected mechanic details
  const currentMechanicDetails = selectedMechanic
    ? allStats.find((m) => m.nome.toLowerCase() === selectedMechanic.toLowerCase())
    : null;

  // Handlers for Add / Edit
  const handleOpenAddModal = () => {
    setEditingMechanic(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (profile: MechanicProfile) => {
    setEditingMechanic(profile);
    setIsModalOpen(true);
  };

  const handleSaveMechanic = (
    data: Omit<MechanicProfile, 'id' | 'dataCadastro'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated = updateStoredMechanic(existingId, data);
      setMechanicsList(updated);
      if (selectedMechanic === editingMechanic?.nome) {
        setSelectedMechanic(data.nome);
      }
    } else {
      const newMec = addStoredMechanic(data);
      setMechanicsList(getStoredMechanics());
      setSelectedMechanic(newMec.nome);
    }
  };

  const handleDeleteMechanic = (id: string) => {
    const updated = deleteStoredMechanic(id);
    setMechanicsList(updated);
    setConfirmDeleteId(null);
    setSelectedMechanic(null);
  };

  const handleInlineRateChange = (stat: MechanicStats, newRate: number) => {
    if (stat.profile) {
      const updated = updateStoredMechanic(stat.profile.id, { comissaoTaxa: newRate });
      setMechanicsList(updated);
    }
  };

  const handleRegisterUnlisted = (unregisteredName: string) => {
    const newMec = addStoredMechanic({
      nome: unregisteredName,
      comissaoTaxa: 30,
      ativo: true,
      especialidade: 'Mecânica Geral',
    });
    setMechanicsList(getStoredMechanics());
    setSelectedMechanic(newMec.nome);
  };

  const handleCopyPix = (pix: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(pix);
      setCopiedPix(pix);
      setTimeout(() => setCopiedPix(null), 2500);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  // WhatsApp summary to mechanic
  const handleSendWhatsAppStatement = (stat: MechanicStats) => {
    if (!stat.profile?.telefone && !stat.servicosExecutados.length) return;

    let text = `*EXTRATO DE COMISSÃO - ${config.nome.toUpperCase()}*\n`;
    text += `*Mecânico:* ${stat.nome}\n`;
    text += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `*Taxa Padrão:* ${stat.comissaoTaxa}%\n`;
    text += `--------------------------------\n`;
    text += `*Total Mão de Obra:* ${formatCurrency(stat.totalMaoDeObra)}\n`;
    text += `*TOTAL DE COMISSÃO:* ${formatCurrency(stat.comissaoTotal)}\n`;
    text += `*Total de Serviços:* ${stat.totalServicos}\n`;
    if (stat.profile?.chavePix) {
      text += `*Chave PIX Cadastrada:* ${stat.profile.chavePix}\n`;
    }
    text += `--------------------------------\n`;
    text += `*Serviços do Período:*\n`;

    stat.servicosExecutados.slice(0, 10).forEach((s) => {
      text += `• OS #${s.numeroOS} (${s.veiculo}): ${s.descricao} -> M.O ${formatCurrency(s.valor)} | Com. ${formatCurrency(s.comissao)}\n`;
    });

    if (stat.servicosExecutados.length > 10) {
      text += `... e mais ${stat.servicosExecutados.length - 10} serviços.\n`;
    }

    text += `\n_Emitido automaticamente pelo sistema Bibicar_`;

    const cleanPhone = (stat.profile?.telefone || '').replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `phone=55${cleanPhone}&` : '';
    const url = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 no-print animate-in fade-in">
      {/* Top Header Card with Registration Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <span>Comissões & Cadastro de Mecânicos</span>
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre sua equipe, defina comissões individuais e acompanhe os pagamentos em tempo real
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Cadastrar Novo Mecânico Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Mecânico</span>
          </button>

          {/* Period selector */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="all">Todo o Período</option>
            <option value="this_month">Este Mês Atual</option>
            <option value="last_month">Mês Anterior</option>
          </select>

          {/* Status filter toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={onlyCompleted}
              onChange={(e) => setOnlyCompleted(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
            />
            <span className="font-semibold">Apenas OS Concluídas</span>
          </label>

          <button
            type="button"
            onClick={handlePrintReport}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Total Mão de Obra Realizada
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalGeralMaoDeObra)}
          </p>
          <span className="text-[10px] text-slate-500">
            {allStats.reduce((acc, m) => acc + m.totalServicos, 0)} serviços executados
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Total de Comissões a Pagar
          </span>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            {formatCurrency(totalGeralComissoes)}
          </p>
          <span className="text-[10px] text-slate-500">
            Calculado com a taxa individual de cada mecânico
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Mecânicos Cadastrados
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {mechanicsList.length} profissionais
          </p>
          <span className="text-[10px] text-slate-500">
            {mechanicsList.filter((m) => m.ativo).length} ativos para atendimento
          </span>
        </div>
      </div>

      {/* Main Grid: Mechanics Management & Detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Mechanics Cards List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Equipe de Mecânicos</span>
              <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {allStats.length}
              </span>
            </h3>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Novo</span>
            </button>
          </div>

          <div className="space-y-3">
            {allStats.map((m) => {
              const isSelected =
                selectedMechanic?.toLowerCase() === m.nome.toLowerCase();

              return (
                <div
                  key={m.nome}
                  onClick={() => setSelectedMechanic(m.nome)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg ring-2 ring-red-500'
                      : 'bg-white hover:border-slate-300 text-slate-800 shadow-2xs'
                  }`}
                >
                  {/* Top Bar with Name, Specialty and Actions */}
                  <div className="flex justify-between items-start gap-2 mb-2 pb-2.5 border-b border-slate-100/15">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}
                      >
                        {m.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm tracking-tight">{m.nome}</h4>
                          {m.profile && !m.profile.ativo && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              Inativo
                            </span>
                          )}
                          {!m.isRegistered && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              Não cadastrado
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[11px] block truncate max-w-[180px] ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {m.profile?.especialidade || 'Mecânica Geral'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (Edit & Delete) */}
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {m.profile ? (
                        <>
                          <button
                            type="button"
                            title="Editar mecânico"
                            onClick={() => handleOpenEditModal(m.profile!)}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              isSelected
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            title="Excluir mecânico"
                            onClick={() => setConfirmDeleteId(m.profile!.id)}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              isSelected
                                ? 'bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300'
                                : 'bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRegisterUnlisted(m.nome)}
                          className="text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg transition"
                        >
                          Cadastrar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Deletion confirmation bar */}
                  {confirmDeleteId === m.profile?.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in"
                    >
                      <span className="text-[11px] font-bold text-red-500">
                        Confirmar exclusão de {m.nome}?
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 text-[10px] rounded bg-slate-200 text-slate-800 font-bold"
                        >
                          Não
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMechanic(m.profile!.id)}
                          className="px-2 py-0.5 text-[10px] rounded bg-red-600 text-white font-bold"
                        >
                          Sim, excluir
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contact & PIX preview */}
                  {(m.profile?.telefone || m.profile?.chavePix) && (
                    <div
                      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] mb-2.5 pb-2 border-b ${
                        isSelected
                          ? 'border-slate-800 text-slate-300'
                          : 'border-slate-100 text-slate-500'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {m.profile.telefone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 opacity-70" />
                          <span>{m.profile.telefone}</span>
                        </span>
                      )}

                      {m.profile.chavePix && (
                        <button
                          type="button"
                          onClick={() => handleCopyPix(m.profile!.chavePix!)}
                          title="Clique para copiar a chave PIX"
                          className={`flex items-center gap-1 hover:underline font-mono text-[10px] px-1.5 py-0.5 rounded transition ${
                            isSelected ? 'bg-slate-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <CreditCard className="w-3 h-3 text-emerald-500" />
                          <span>PIX: {m.profile.chavePix}</span>
                          {copiedPix === m.profile.chavePix ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Financial & Commission summary row */}
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] opacity-60 uppercase font-bold block">
                        Mão de Obra ({m.totalServicos} serviços):
                      </span>
                      <strong className="font-mono text-sm">
                        {formatCurrency(m.totalMaoDeObra)}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold opacity-60 block">
                        Comissão a Pagar:
                      </span>
                      <span
                        className={`font-mono font-black text-base ${
                          isSelected ? 'text-amber-400' : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(m.comissaoTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Commission Rate badge & Quick inline modifier */}
                  <div
                    className="mt-2.5 pt-2 border-t border-slate-100/15 flex justify-between items-center text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[11px] opacity-70">Taxa de Comissão:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={m.comissaoTaxa}
                        onChange={(e) =>
                          handleInlineRateChange(m, parseFloat(e.target.value) || 0)
                        }
                        className={`w-14 text-center font-mono font-black rounded-lg py-0.5 text-xs border ${
                          isSelected
                            ? 'bg-slate-800 text-white border-slate-700 focus:ring-1 focus:ring-red-500'
                            : 'bg-slate-50 text-slate-900 border-slate-300 focus:ring-1 focus:ring-red-500'
                        }`}
                      />
                      <span className="font-bold text-[11px]">%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Breakdown of Selected Mechanic */}
        <div className="lg:col-span-7">
          {currentMechanicDetails ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>Extrato:</span>
                      <span className="text-red-600">{currentMechanicDetails.nome}</span>
                    </h3>
                    {currentMechanicDetails.profile && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(currentMechanicDetails.profile!)}
                        className="text-xs text-slate-500 hover:text-red-600 p-1 rounded hover:bg-slate-100"
                        title="Editar cadastro do mecânico"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {currentMechanicDetails.profile?.especialidade || 'Mecânica Geral'} • Taxa de{' '}
                    {currentMechanicDetails.comissaoTaxa}% sobre mão de obra
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* WhatsApp statement button */}
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppStatement(currentMechanicDetails)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Extrato WhatsApp</span>
                  </button>

                  <div className="text-right pl-3 border-l border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total a Pagar:
                    </span>
                    <span className="text-xl font-black text-emerald-600 font-mono">
                      {formatCurrency(currentMechanicDetails.comissaoTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mechanic profile details strip */}
              {currentMechanicDetails.profile && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap gap-4 text-xs text-slate-600">
                  {currentMechanicDetails.profile.telefone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">
                        {currentMechanicDetails.profile.telefone}
                      </span>
                    </div>
                  )}

                  {currentMechanicDetails.profile.chavePix && (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PIX:</span>
                      <strong className="font-mono text-slate-900">
                        {currentMechanicDetails.profile.chavePix}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopyPix(currentMechanicDetails.profile!.chavePix!)}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                      >
                        {copiedPix === currentMechanicDetails.profile.chavePix ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {currentMechanicDetails.profile.documento && (
                    <div>
                      <span className="text-slate-400">CPF:</span>{' '}
                      <span className="font-mono font-semibold">
                        {currentMechanicDetails.profile.documento}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Table of Services */}
              {currentMechanicDetails.servicosExecutados.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-2">OS Nº</th>
                        <th className="py-2.5 px-3">Cliente / Veículo</th>
                        <th className="py-2.5 px-3">Descrição do Serviço</th>
                        <th className="py-2.5 px-3 text-right">Valor M.O.</th>
                        <th className="py-2.5 px-3 text-right">
                          Comissão ({currentMechanicDetails.comissaoTaxa}%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentMechanicDetails.servicosExecutados.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-medium">
                            {formatDate(s.data)}
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap font-mono font-bold text-slate-900">
                            #{s.numeroOS}
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-800 truncate max-w-[150px]">
                              {s.cliente}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {s.veiculo}
                            </p>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {s.descricao}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            {formatCurrency(s.valor)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(s.comissao)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                        <td colSpan={4} className="py-3 px-3 text-right uppercase text-[11px]">
                          Total Acumulado no Período:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sm">
                          {formatCurrency(currentMechanicDetails.totalMaoDeObra)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-base font-black text-emerald-600">
                          {formatCurrency(currentMechanicDetails.comissaoTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
                  <Wrench className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700">
                    Nenhum serviço registrado para {currentMechanicDetails.nome} no período
                    selecionado
                  </p>
                  <p className="text-xs text-slate-400">
                    Ao atribuir ordens de serviço a este profissional, os valores e comissões
                    aparecerão detalhados aqui.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-2xs">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-700">
                  Selecione um mecânico para ver o extrato detalhado
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Ou clique em <strong className="text-red-600 font-bold">"Cadastrar Novo Mecânico"</strong> para adicionar membros à equipe
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Creating / Editing Mechanic */}
      <MechanicFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMechanic(null);
        }}
        onSave={handleSaveMechanic}
        mechanicToEdit={editingMechanic}
      />
    </div>
  );
};
