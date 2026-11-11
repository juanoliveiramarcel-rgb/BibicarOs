import React, { useState } from 'react';
import { X, Printer, Droplet, Sparkles, Download, ExternalLink } from 'lucide-react';
import { OilStickerData, ServiceOrder, WorkshopConfig } from '../types';
import { formatDate } from '../utils/formatters';
import {
  generateOilStickerPdfDoc,
  downloadPdf,
  openPdfInNewTab,
} from '../utils/pdfGenerator';

interface OilStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  config: WorkshopConfig;
}

export const OilStickerModal: React.FC<OilStickerModalProps> = ({
  isOpen,
  onClose,
  order,
  config,
}) => {
  if (!isOpen || !order) return null;

  const kmEntradaNum = parseInt(order.veiculo?.kmEntrada || '0', 10) || 50000;
  const hoje = new Date().toISOString().split('T')[0];

  // Detect oil type from parts list if possible
  const oilPart = order.pecas?.find((p) =>
    p.descricao.toLowerCase().includes('óleo') || p.descricao.toLowerCase().includes('oleo')
  );

  const [tipoIntervalo, setTipoIntervalo] = useState<'10k' | '5k' | '7k'>('10k');
  const [dataTroca, setDataTroca] = useState(order.veiculo?.dataEntrada || hoje);
  const [kmAtual, setKmAtual] = useState(kmEntradaNum);
  const [oleo, setOleo] = useState(oilPart?.descricao || 'ÓLEO SINTÉTICO 5W30');

  const [filtroOleo, setFiltroOleo] = useState(true);
  const [filtroAr, setFiltroAr] = useState(true);
  const [filtroComb, setFiltroComb] = useState(false);
  const [filtroCabine, setFiltroCabine] = useState(false);

  const getAddKm = () => {
    if (tipoIntervalo === '5k') return 5000;
    if (tipoIntervalo === '7k') return 7000;
    return 10000;
  };

  const proximoKm = kmAtual + getAddKm();

  const getProximaData = () => {
    try {
      const d = new Date(dataTroca);
      const meses = tipoIntervalo === '5k' ? 6 : 12;
      d.setMonth(d.getMonth() + meses);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const proximaData = getProximaData();

  const getFiltrosText = () => {
    return [
      filtroOleo ? 'Óleo' : null,
      filtroAr ? 'Ar' : null,
      filtroComb ? 'Combustível' : null,
      filtroCabine ? 'Cabine' : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'Nenhum';
  };

  const handleDownloadSticker = () => {
    const doc = generateOilStickerPdfDoc(order, config, {
      dataTroca,
      kmAtual,
      proximaData,
      proximoKm,
      oleo,
      filtros: getFiltrosText(),
    });
    const plate = order.veiculo?.matricula?.toUpperCase() || 'VEICULO';
    downloadPdf(doc, `Etiqueta_Oleo_${plate}.pdf`);
  };

  const handlePrintSticker = () => {
    const doc = generateOilStickerPdfDoc(order, config, {
      dataTroca,
      kmAtual,
      proximaData,
      proximoKm,
      oleo,
      filtros: getFiltrosText(),
    });
    // Open in clean tab with browser native print dialog
    openPdfInNewTab(doc);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 no-print">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-bold">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Etiqueta de Troca de Óleo (Para-brisa)
              </h3>
              <p className="text-xs text-slate-400">
                Gere e imprima o adesivo de próxima revisão para o cliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Intervalo de Troca
              </label>
              <select
                value={tipoIntervalo}
                onChange={(e) => setTipoIntervalo(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
              >
                <option value="10k">10.000 km / 1 ano (Sintético)</option>
                <option value="7k">7.000 km / 1 ano (Semissintético)</option>
                <option value="5k">5.000 km / 6 meses (Mineral / Severo)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                KM Atual da Troca
              </label>
              <input
                type="number"
                value={kmAtual}
                onChange={(e) => setKmAtual(parseInt(e.target.value, 10) || 0)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Data Desta Troca
              </label>
              <input
                type="date"
                value={dataTroca}
                onChange={(e) => setDataTroca(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Especificação do Óleo
            </label>
            <input
              type="text"
              value={oleo}
              onChange={(e) => setOleo(e.target.value)}
              placeholder="Ex: SINTÉTICO 5W30 DEXOS 1 GEN 3"
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold uppercase"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
              Filtros Substituídos Nesta Troca:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroOleo}
                  onChange={(e) => setFiltroOleo(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span>Filtro de Óleo</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroAr}
                  onChange={(e) => setFiltroAr(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span>Filtro de Ar</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroComb}
                  onChange={(e) => setFiltroComb(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span>Filtro Comb.</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroCabine}
                  onChange={(e) => setFiltroCabine(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span>Filtro Cabine</span>
              </label>
            </div>
          </div>

          {/* Visual Preview of the Windshield Sticker */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Pré-visualização da Etiqueta Adesiva:
            </span>

            <div className="border-2 border-dashed border-slate-400 p-3 rounded-xl bg-slate-50 max-w-sm mx-auto shadow-sm">
              <div className="bg-white border-2 border-slate-900 rounded-lg p-3 text-slate-900 font-sans text-xs space-y-1.5">
                {/* Sticker Header */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-1.5">
                  <div className="flex items-center gap-2">
                    {config.logoUrl && (
                      <div className="w-7 h-7 shrink-0 flex items-center justify-center border border-slate-300 rounded bg-white p-0.5">
                        <img
                          src={config.logoUrl}
                          alt={config.nome}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-sm tracking-tight text-red-600 leading-none mb-0.5">
                        {config.nome}
                      </h4>
                      <p className="text-[9px] text-slate-600 font-bold">
                        CENTRO AUTOMOTIVO · {config.telefone}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                    {order.veiculo?.matricula || 'SEM PLACA'}
                  </span>
                </div>

                {/* Current Info */}
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div>
                    <span className="text-slate-500 block leading-tight">Data da Troca:</span>
                    <strong className="font-mono">{formatDate(dataTroca)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block leading-tight">KM Atual:</span>
                    <strong className="font-mono">{kmAtual.toLocaleString('pt-BR')} km</strong>
                  </div>
                </div>

                {/* Next Change Banner */}
                <div className="bg-slate-900 text-white p-2 rounded text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                    PRÓXIMA TROCA RECOMENDADA
                  </span>
                  <div className="flex justify-around items-center mt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Até a data:</span>
                      <strong className="text-xs font-mono font-bold text-white">
                        {formatDate(proximaData)}
                      </strong>
                    </div>
                    <div className="text-slate-500 font-bold">ou</div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Aos:</span>
                      <strong className="text-sm font-mono font-black text-amber-400">
                        {proximoKm.toLocaleString('pt-BR')} km
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Oil & Filter specs */}
                <div className="text-[10px] pt-1">
                  <p className="truncate">
                    <strong>ÓLEO:</strong> <span className="font-medium text-[9px]">{oleo}</span>
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5">
                    <strong>Filtros trocados:</strong>{' '}
                    {[
                      filtroOleo ? 'Óleo' : null,
                      filtroAr ? 'Ar' : null,
                      filtroComb ? 'Combustível' : null,
                      filtroCabine ? 'Cabine' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Nenhum'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Fechar
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSticker}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Baixar arquivo PDF da etiqueta (formato adesivo)"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSticker}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
