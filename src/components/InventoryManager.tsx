import React, { useState } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Trash2,
  Edit2,
  TrendingUp,
  Boxes,
  FileCode2,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { XmlImportModal } from './XmlImportModal';

interface InventoryManagerProps {
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  items,
  onUpdateItems,
}) => {
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showXmlModal, setShowXmlModal] = useState(false);

  // New item modal/form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDescricao, setNewDescricao] = useState('');
  const [newCodigo, setNewCodigo] = useState('');
  const [newUnidade, setNewUnidade] = useState('UN');
  const [newQuantidade, setNewQuantidade] = useState<number>(10);
  const [newEstoqueMinimo, setNewEstoqueMinimo] = useState<number>(4);
  const [newPrecoCusto, setNewPrecoCusto] = useState<number>(0);
  const [newPrecoVenda, setNewPrecoVenda] = useState<number>(0);

  const lowStockCount = items.filter((i) => i.quantidade <= i.estoqueMinimo).length;
  const totalValueInStock = items.reduce(
    (acc, i) => acc + (i.quantidade * (i.precoCusto || 0)),
    0
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescricao.trim()) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      codigo: newCodigo.trim().toUpperCase() || `P-${Date.now().toString().slice(-4)}`,
      descricao: newDescricao.trim().toUpperCase(),
      unidade: newUnidade.trim().toUpperCase(),
      quantidade: newQuantidade,
      estoqueMinimo: newEstoqueMinimo,
      precoCusto: newPrecoCusto,
      precoVenda: newPrecoVenda,
    };

    onUpdateItems([newItem, ...items]);
    setShowAddForm(false);
    setNewDescricao('');
    setNewCodigo('');
    setNewPrecoCusto(0);
    setNewPrecoVenda(0);
  };

  const updateQuantity = (id: string, delta: number) => {
    onUpdateItems(
      items.map((i) =>
        i.id === id ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i
      )
    );
  };

  const deleteItem = (id: string) => {
    if (window.confirm('Deseja excluir este item do catálogo de peças?')) {
      onUpdateItems(items.filter((i) => i.id !== id));
    }
  };

  const handleConfirmXmlImport = (newItems: InventoryItem[], updatedItems: InventoryItem[]) => {
    let result = [...items];
    updatedItems.forEach((upd) => {
      result = result.map((i) => (i.id === upd.id ? upd : i));
    });
    result = [...newItems, ...result];
    onUpdateItems(result);
  };

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.descricao.toLowerCase().includes(q) ||
      item.codigo.toLowerCase().includes(q);
    const matchLowStock = !filterLowStock || item.quantidade <= item.estoqueMinimo;
    return matchSearch && matchLowStock;
  });

  return (
    <div className="space-y-4 no-print animate-in fade-in">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Total de Itens Cadastrados
            </p>
            <p className="text-xl font-extrabold text-slate-900 font-mono">
              {items.length} itens
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Patrimônio em Peças (Custo)
            </p>
            <p className="text-xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalValueInStock)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`p-4 rounded-xl border shadow-2xs flex justify-between items-center cursor-pointer transition ${
            filterLowStock
              ? 'bg-amber-100 border-amber-300'
              : 'bg-white border-slate-200/90 hover:border-amber-300'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-amber-700 uppercase">
              Abaixo do Estoque Mínimo
            </p>
            <p className="text-xl font-extrabold text-amber-700 font-mono">
              {lowStockCount} produto(s)
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar peça por código ou descrição..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              filterLowStock
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {filterLowStock ? 'Exibindo: Estoque Baixo' : 'Filtrar Estoque Baixo'}
          </button>

          <button
            type="button"
            onClick={() => setShowXmlModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Importar Nota Fiscal Eletrônica (NF-e) em formato XML"
          >
            <FileCode2 className="w-4 h-4" />
            <span>Importar XML (NF-e)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Peça</span>
          </button>
        </div>
      </div>

      {/* XML NF-e Import Modal */}
      <XmlImportModal
        isOpen={showXmlModal}
        onClose={() => setShowXmlModal(false)}
        inventory={items}
        onConfirmImport={handleConfirmXmlImport}
      />

      {/* Add New Item Dialog */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Cadastrar Nova Peça no Estoque
              </h3>
              <button onClick={() => setShowAddForm(false)}>
                <Trash2 className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Descrição da Peça *
                </label>
                <input
                  type="text"
                  required
                  value={newDescricao}
                  onChange={(e) => setNewDescricao(e.target.value)}
                  placeholder="Ex: JOGO DE PASTILHAS DE FREIO DIANTEIRAS"
                  className="w-full border border-slate-300 rounded px-3 py-1.5 uppercase font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Código / Referência
                  </label>
                  <input
                    type="text"
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    placeholder="Ex: PD-1402"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={newUnidade}
                    onChange={(e) => setNewUnidade(e.target.value)}
                    placeholder="UN, JG, L, KIT"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 uppercase font-medium text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Quantidade Inicial em Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newQuantidade}
                    onChange={(e) => setNewQuantidade(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newEstoqueMinimo}
                    onChange={(e) => setNewEstoqueMinimo(parseInt(e.target.value, 10) || 0)}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrecoCusto || ''}
                    onChange={(e) => setNewPrecoCusto(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Preço de Venda ao Cliente (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrecoVenda || ''}
                    onChange={(e) => setNewPrecoVenda(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono font-bold text-red-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-1.5 rounded font-bold"
                >
                  Salvar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Descrição da Peça</th>
                <th className="py-3 px-3 text-center">Un.</th>
                <th className="py-3 px-3 text-center">Estoque Atual</th>
                <th className="py-3 px-3 text-right">Custo Un.</th>
                <th className="py-3 px-4 text-right">Preço Venda</th>
                <th className="py-3 px-3 text-center">Margem %</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.quantidade <= item.estoqueMinimo;
                const margem =
                  item.precoCusto > 0
                    ? Math.round(((item.precoVenda - item.precoCusto) / item.precoCusto) * 100)
                    : 100;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.codigo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.descricao}
                    </td>
                    <td className="py-3 px-3 text-center uppercase font-mono">
                      {item.unidade}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            item.quantidade === 0
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-900 border border-amber-400 font-extrabold'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                      {item.quantidade === 0 ? (
                        <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-extrabold inline-flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>Esgotado!</span>
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded font-extrabold inline-flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Reposição Urgente (Mín: {item.estoqueMinimo})</span>
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {formatCurrency(item.precoCusto)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.precoVenda)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        +{margem}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
