import React, { useState, useRef } from 'react';
import {
  X,
  FileCode2,
  Upload,
  CheckCircle2,
  AlertCircle,
  PackagePlus,
  RefreshCw,
  Building,
  FileSpreadsheet,
} from 'lucide-react';
import { InventoryItem, ParsedXmlNFe, ParsedXmlProduct } from '../types';
import { parseNFeXml } from '../utils/xmlParser';
import { formatCurrency } from '../utils/formatters';

interface XmlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onConfirmImport: (newItems: InventoryItem[], updatedItems: InventoryItem[]) => void;
}

export const XmlImportModal: React.FC<XmlImportModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onConfirmImport,
}) => {
  const [xmlData, setXmlData] = useState<ParsedXmlNFe | null>(null);
  const [products, setProducts] = useState<ParsedXmlProduct[]>([]);
  const [markupPercent, setMarkupPercent] = useState<number>(45);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setErrorMsg('Por favor selecione um arquivo válido com extensão .xml (NF-e).');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseNFeXml(text, inventory, markupPercent);
        setXmlData(parsed);
        setProducts(parsed.produtos);
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao processar o arquivo XML.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const toggleProductAction = (index: number) => {
    setProducts((prev) =>
      prev.map((p, idx) => {
        if (idx !== index) return p;
        const nextAcao = p.acao === 'IGNORAR' ? (p.jaExiste ? 'ATUALIZAR' : 'CADASTRAR') : 'IGNORAR';
        return { ...p, acao: nextAcao };
      })
    );
  };

  const updateProductPrice = (index: number, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, precoVendaSugerido: newPrice } : p))
    );
  };

  const handleApplyMarkupAll = (pct: number) => {
    setMarkupPercent(pct);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.jaExiste) return p; // Don't overwrite existing product sell prices
        const factor = 1 + pct / 100;
        return {
          ...p,
          precoVendaSugerido: Math.round(p.precoCusto * factor * 100) / 100,
        };
      })
    );
  };

  const handleConfirm = () => {
    const toCreate: InventoryItem[] = [];
    const toUpdate: InventoryItem[] = [];

    products.forEach((prod) => {
      if (prod.acao === 'IGNORAR') return;

      if (prod.jaExiste && prod.itemExistenteId) {
        // Find in current inventory and create updated version
        const existing = inventory.find((i) => i.id === prod.itemExistenteId);
        if (existing) {
          toUpdate.push({
            ...existing,
            quantidade: existing.quantidade + prod.quantidade,
            precoCusto: prod.precoCusto, // update cost to latest invoice
            precoVenda: prod.precoVendaSugerido > 0 ? prod.precoVendaSugerido : existing.precoVenda,
          });
        }
      } else {
        // Brand new inventory item
        toCreate.push({
          id: `inv-xml-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          codigo: prod.codigo,
          descricao: prod.descricao,
          unidade: prod.unidade,
          quantidade: prod.quantidade,
          estoqueMinimo: 4,
          precoCusto: prod.precoCusto,
          precoVenda: prod.precoVendaSugerido,
          categoria: 'Entrada XML NF-e',
          marca: xmlData?.emitenteNome || 'Diversos',
        });
      }
    });

    onConfirmImport(toCreate, toUpdate);
    onClose();
  };

  const newCount = products.filter((p) => p.acao === 'CADASTRAR').length;
  const updateCount = products.filter((p) => p.acao === 'ATUALIZAR').length;
  const ignoreCount = products.filter((p) => p.acao === 'IGNORAR').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-start overflow-y-auto p-4 no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Importação Automática de Estoque via XML (NF-e)
              </h3>
              <p className="text-xs text-slate-400">
                Lê arquivos de Nota Fiscal Eletrônica e dá entrada automática no inventário
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 flex-1">
          {/* File Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xml"
            className="hidden"
          />

          {!xmlData ? (
            /* Upload Drop Area */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
              }`}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Arraste o arquivo XML da sua NF-e para cá
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                ou clique para selecionar o arquivo da Nota Fiscal do seu fornecedor (.xml)
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold">
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Localizar Arquivo XML</span>
              </div>
            </div>
          ) : (
            /* Parsed Summary & Item Table */
            <div className="space-y-4">
              {/* Invoice Banner */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-bold uppercase">Fornecedor / Emitente</span>
                  <strong className="text-slate-900 font-bold block truncate" title={xmlData.emitenteNome}>
                    {xmlData.emitenteNome}
                  </strong>
                  <span className="text-[11px] text-slate-500 font-mono">{xmlData.emitenteCnpj || 'Sem CNPJ'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-bold uppercase">Número da NF-e</span>
                  <strong className="text-slate-900 font-bold font-mono text-sm">
                    #{xmlData.numeroNF}
                  </strong>
                  <span className="text-[11px] text-slate-500 block">Série: {xmlData.serie || '0'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-bold uppercase">Data Emissão</span>
                  <strong className="text-slate-800 font-medium">
                    {xmlData.dataEmissao ? xmlData.dataEmissao.split('T')[0] : 'Não informada'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-bold uppercase">Valor Total da Nota</span>
                  <strong className="text-emerald-700 font-extrabold text-sm font-mono">
                    {formatCurrency(xmlData.valorTotalNota)}
                  </strong>
                </div>
              </div>

              {/* Markup and Action Bar */}
              <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Margem Padrão de Venda:</span>
                  {[30, 40, 50, 60].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyMarkupAll(pct)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        markupPercent === pct
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                    {newCount} Novos
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold border border-blue-200">
                    {updateCount} Atualizações
                  </span>
                  {ignoreCount > 0 && (
                    <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-semibold">
                      {ignoreCount} Ignorados
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setXmlData(null);
                      setProducts([]);
                    }}
                    className="text-slate-500 hover:text-red-600 text-xs ml-2 underline"
                  >
                    Trocar XML
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Status</th>
                      <th className="p-2.5">Código / Peça</th>
                      <th className="p-2.5 w-16 text-center">Qtd NF</th>
                      <th className="p-2.5 w-24 text-right">Custo NF</th>
                      <th className="p-2.5 w-28 text-right">Venda Sugerida</th>
                      <th className="p-2.5 w-28 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50/80 transition ${
                          prod.acao === 'IGNORAR' ? 'opacity-40 bg-slate-50/50' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          {prod.jaExiste ? (
                            <span
                              className="inline-flex p-1 rounded-full bg-blue-100 text-blue-700"
                              title="Produto já existe no estoque (somará quantidade e atualizará custo)"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span
                              className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700"
                              title="Novo produto a ser cadastrado"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900 leading-tight">{prod.descricao}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>Cód: {prod.codigo}</span>
                            <span>·</span>
                            <span>Un: {prod.unidade}</span>
                            {prod.jaExiste && (
                              <span className="text-blue-600 font-sans font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                                Já Cadastrado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                          +{prod.quantidade}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          {formatCurrency(prod.precoCusto)}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          <input
                            type="number"
                            step="0.01"
                            value={prod.precoVendaSugerido}
                            onChange={(e) => updateProductPrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-24 border border-slate-300 rounded px-1.5 py-1 text-right text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleProductAction(idx)}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                              prod.acao === 'IGNORAR'
                                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                : prod.jaExiste
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {prod.acao === 'IGNORAR'
                              ? 'Ignorar'
                              : prod.jaExiste
                              ? 'Atualizar'
                              : 'Cadastrar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
          >
            Cancelar
          </button>

          {xmlData && (
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-md flex items-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Confirmar Entrada ({newCount + updateCount} itens)
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
