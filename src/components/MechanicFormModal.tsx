import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Percent,
  Phone,
  Wrench,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { MechanicProfile } from '../types';

interface MechanicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<MechanicProfile, 'id' | 'dataCadastro'>, existingId?: string) => void;
  mechanicToEdit?: MechanicProfile | null;
}

const COMMON_SPECIALTIES = [
  'Mecânica Geral',
  'Freios & Suspensão',
  'Injeção Eletrônica',
  'Motor & Cabeçote',
  'Câmbio & Embreagem',
  'Auto Elétrica',
  'Ar Condicionado',
  'Alinhamento 3D',
];

const PRESET_COMMISSIONS = [20, 25, 30, 35, 40, 50];

export const MechanicFormModal: React.FC<MechanicFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mechanicToEdit,
}) => {
  const [nome, setNome] = useState('');
  const [comissaoTaxa, setComissaoTaxa] = useState(30);
  const [telefone, setTelefone] = useState('');
  const [especialidade, setEspecialidade] = useState('Mecânica Geral');
  const [documento, setDocumento] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (mechanicToEdit) {
      setNome(mechanicToEdit.nome || '');
      setComissaoTaxa(mechanicToEdit.comissaoTaxa ?? 30);
      setTelefone(mechanicToEdit.telefone || '');
      setEspecialidade(mechanicToEdit.especialidade || 'Mecânica Geral');
      setDocumento(mechanicToEdit.documento || '');
      setChavePix(mechanicToEdit.chavePix || '');
      setAtivo(mechanicToEdit.ativo ?? true);
      setObservacoes(mechanicToEdit.observacoes || '');
    } else {
      setNome('');
      setComissaoTaxa(30);
      setTelefone('');
      setEspecialidade('Mecânica Geral');
      setDocumento('');
      setChavePix('');
      setAtivo(true);
      setObservacoes('');
    }
    setError('');
  }, [mechanicToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe o nome do mecânico.');
      return;
    }

    if (comissaoTaxa < 0 || comissaoTaxa > 100) {
      setError('A taxa de comissão deve estar entre 0% e 100%.');
      return;
    }

    onSave(
      {
        nome: nome.trim(),
        comissaoTaxa: Number(comissaoTaxa),
        telefone: telefone.trim(),
        especialidade: especialidade.trim(),
        documento: documento.trim(),
        chavePix: chavePix.trim(),
        ativo,
        observacoes: observacoes.trim(),
      },
      mechanicToEdit ? mechanicToEdit.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-600/90 text-white">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {mechanicToEdit ? 'Editar Mecânico' : 'Cadastrar Novo Mecânico'}
              </h2>
              <p className="text-xs text-slate-300">
                {mechanicToEdit
                  ? `Atualizar dados e percentual de ${mechanicToEdit.nome}`
                  : 'Adicione um profissional à equipe para cálculo automático de comissões'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome do Profissional / Apelido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Mecânico, Roberto 'Beto', Diego..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Taxa de Comissão */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-red-600" />
                <span>Taxa de Comissão sobre a Mão de Obra</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={comissaoTaxa}
                  onChange={(e) => setComissaoTaxa(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm font-black text-slate-900 text-center font-mono focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-600">%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Percentual padrão aplicado sobre todos os serviços executados por este profissional.
            </p>

            {/* Quick buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Atalhos:
              </span>
              {PRESET_COMMISSIONS.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setComissaoTaxa(rate)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition border ${
                    comissaoTaxa === rate
                      ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Telefone e Chave PIX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Telefone / WhatsApp</span>
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chave PIX (Para Pagamento)</span>
              </label>
              <input
                type="text"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                placeholder="CPF, E-mail ou Telefone"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Especialidade Principal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-slate-500" />
              <span>Especialidade / Cargo</span>
            </label>
            <input
              type="text"
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
              placeholder="Ex: Suspensão e Freios, Injeção Eletrônica..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none mb-1.5"
            />
            <div className="flex flex-wrap gap-1">
              {COMMON_SPECIALTIES.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setEspecialidade(spec)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                    especialidade === spec
                      ? 'bg-slate-800 text-white border-slate-800 font-bold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* CPF / Documento e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>CPF / Registro (Opcional)</span>
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <div className="flex flex-col">
                  <span>Mecânico Ativo na Oficina</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    {ativo
                      ? 'Aparece na seleção de ordens de serviço'
                      : 'Oculto na seleção de novas ordens'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Internas (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Turno da manhã, trabalha de segunda a sábado..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{mechanicToEdit ? 'Salvar Alterações' : 'Cadastrar Mecânico'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
