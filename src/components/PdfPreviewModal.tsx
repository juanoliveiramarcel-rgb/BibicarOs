import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  MessageCircle,
} from 'lucide-react';
import { ServiceOrder, WorkshopConfig } from '../types';
import {
  generateServiceOrderPdfDoc,
  generateBlankInspectionPdfDoc,
  downloadPdf,
  getPdfBlobUrl,
} from '../utils/pdfGenerator';
import { formatCurrency, generateWhatsAppMessage, getWhatsAppUrl } from '../utils/formatters';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  config: WorkshopConfig;
  mode: 'order' | 'inspection_blank';
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  order,
  config,
  mode,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isOrder = mode === 'order';
  const docTitle = isOrder
    ? `Ordem de Serviço #${order?.numeroOS || '00000'} - ${order?.cliente?.nome || 'Cliente'}`
    : `Ficha de Vistoria de Entrada ${order?.numeroOS ? `(OS #${order.numeroOS})` : ''}`;

  const cleanClient = (order?.cliente?.nome || 'cliente').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = isOrder
    ? `OS_${order?.numeroOS || '00000'}_${cleanClient}.pdf`
    : `Ficha_Vistoria_${order?.numeroOS ? `OS_${order.numeroOS}` : 'Oficina'}.pdf`;

  // Generate PDF and Blob URL on open
  useEffect(() => {
    if (!isOpen) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    try {
      const doc = isOrder
        ? generateServiceOrderPdfDoc(order!, config)
        : generateBlankInspectionPdfDoc(order, config);

      const url = getPdfBlobUrl(doc);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Erro ao gerar preview de PDF:', err);
    }
  }, [isOpen, order, config, mode, isOrder]);

  if (!isOpen) return null;

  const handleDownload = () => {
    try {
      const doc = isOrder
        ? generateServiceOrderPdfDoc(order!, config)
        : generateBlankInspectionPdfDoc(order, config);
      downloadPdf(doc, fileName);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    // 1. Try iframe print first
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        setTimeout(() => setIsPrinting(false), 800);
        return;
      }
    } catch (err) {
      console.warn('Iframe print bloqueado por sandbox, tentando nova janela...', err);
    }

    // 2. Fallback: Open in new window/tab for native print
    try {
      if (blobUrl) {
        const printWin = window.open(blobUrl, '_blank');
        if (printWin) {
          printWin.focus();
        }
      }
    } catch {
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const handleSendWhatsApp = () => {
    if (!order) return;
    const msg = generateWhatsAppMessage(order, config);
    const phone = order.cliente?.telefone || '';
    if (!phone) {
      navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      return;
    }
    const url = getWhatsAppUrl(phone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-xs flex justify-center items-center p-2 sm:p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  {docTitle}
                </h3>
                <span className="text-[10px] font-mono uppercase bg-red-600/30 text-red-200 px-2 py-0.5 rounded-full border border-red-500/40">
                  PDF Vetorial Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visualize com precisão, baixe o arquivo .pdf ou imprima em folha A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Controls Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap justify-between items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="font-mono text-slate-500 font-semibold">{fileName}</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pronto para Impressão
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* WhatsApp button */}
            {isOrder && (
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                title="Enviar resumo e aviso pelo WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}

            {/* Open in new tab button */}
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              title="Abrir PDF em tela cheia numa nova guia do navegador"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Nova Guia</span>
            </button>

            {/* Download PDF button */}
            <button
              type="button"
              onClick={handleDownload}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF (.pdf)</span>
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="bg-slate-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Agora</span>
            </button>
          </div>
        </div>

        {/* Live Document Viewer */}
        <div className="flex-1 bg-slate-200/80 p-2 sm:p-4 overflow-hidden relative flex flex-col items-center justify-center">
          {blobUrl ? (
            <div className="w-full h-full bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden flex flex-col">
              <iframe
                ref={iframeRef}
                src={`${blobUrl}#toolbar=1&navpanes=0&view=FitH`}
                title={docTitle}
                className="w-full flex-1 border-0"
              />
            </div>
          ) : (
            <div className="text-center space-y-2 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="animate-spin w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-xs font-bold text-slate-700">Renderizando documento PDF...</p>
            </div>
          )}

          {/* Quick Sandbox Help Notice */}
          <div className="mt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Dica: Você pode clicar em <strong>Baixar PDF</strong> para salvar no seu computador/celular ou em <strong>Nova Guia</strong> para abrir o painel de impressão padrão do seu navegador.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-2.5 flex justify-between items-center shrink-0">
          <div className="text-[11px] text-slate-500">
            Formato: <strong className="text-slate-700">A4 (210 x 297 mm)</strong> · Resolução: <strong className="text-slate-700">300 DPI Vetorial</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
