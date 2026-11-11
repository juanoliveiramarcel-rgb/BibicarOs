import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  ShieldCheck,
  Send,
  Barcode,
  Copy,
  Check,
  Ban,
  ExternalLink,
} from 'lucide-react';
import { ServiceOrder, WorkshopConfig, NFeEmissao } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  generateChaveAcesso,
  generateNFeXML,
  downloadNFeXml,
  formatChaveAcesso,
  onlyDigits,
} from '../utils/nfeGenerator';

interface NFeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  config: WorkshopConfig;
  onSaveOrder: (updatedOrder: ServiceOrder) => void;
}

export const NFeModal: React.FC<NFeModalProps> = ({
  isOpen,
  onClose,
  order,
  config,
  onSaveOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'danfe' | 'config' | 'xml'>('danfe');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Form states for fiscal emission
  const initialNumeroNFe =
    order?.nfeDados?.numeroNFe ||
    (config.proximoNumeroNFe ? config.proximoNumeroNFe.toString().padStart(6, '0') : '000001');
  const initialSerie = order?.nfeDados?.serie || config.serieNFe || '1';
  const initialNatureza =
    order?.nfeDados?.naturezaOperacao || '5.102 - Venda de mercadorias e prestação de serviços';

  const [numeroNFe, setNumeroNFe] = useState(initialNumeroNFe);
  const [serieNFe, setSerieNFe] = useState(initialSerie);
  const [naturezaOperacao, setNaturezaOperacao] = useState(initialNatureza);

  // Totals
  const pecas = order?.pecas || [];
  const servicos = order?.servicos || [];
  const totalPecas = pecas.reduce((acc, p) => acc + p.qtd * p.preco, 0);
  const totalServicos = servicos.reduce((acc, s) => acc + s.valor, 0);
  const desconto = order?.pagamento?.desconto || 0;
  const totalNota = Math.max(0, totalPecas + totalServicos - desconto);
  const aliquotaMedia = config.aliquotaIbptPadrao || 13.45;
  const valorTributos = (totalNota * aliquotaMedia) / 100;

  // Active or generated NFe
  const isAlreadyEmitted = Boolean(order?.nfeEmitida && order?.nfeDados);

  // Temporary or existing Chave de Acesso
  const [chaveAcesso, setChaveAcesso] = useState(() => {
    if (order?.nfeDados?.chaveAcesso) return order.nfeDados.chaveAcesso;
    return generateChaveAcesso(
      'SP',
      new Date(),
      config.cnpj || '00000000000000',
      initialSerie,
      parseInt(initialNumeroNFe, 10) || 1
    );
  });

  const [xmlText, setXmlText] = useState(() => {
    if (order?.nfeDados?.xmlContent) return order.nfeDados.xmlContent;
    if (!order) return '';
    return generateNFeXML(order, config, chaveAcesso, initialNumeroNFe, initialSerie, initialNatureza);
  });

  // Re-sync on modal open or order change
  useEffect(() => {
    if (!order) return;
    if (order.nfeDados) {
      setNumeroNFe(order.nfeDados.numeroNFe);
      setSerieNFe(order.nfeDados.serie);
      setNaturezaOperacao(order.nfeDados.naturezaOperacao);
      setChaveAcesso(order.nfeDados.chaveAcesso);
      setXmlText(order.nfeDados.xmlContent);
    } else {
      const generatedChave = generateChaveAcesso(
        'SP',
        new Date(),
        config.cnpj || '00000000000000',
        config.serieNFe || '1',
        config.proximoNumeroNFe || 1
      );
      setChaveAcesso(generatedChave);
      const generatedXml = generateNFeXML(
        order,
        config,
        generatedChave,
        initialNumeroNFe,
        config.serieNFe || '1',
        initialNatureza
      );
      setXmlText(generatedXml);
    }
  }, [order, config, initialNumeroNFe, initialNatureza]);

  if (!isOpen || !order) return null;

  const handleEmitirNFe = () => {
    const finalChave = chaveAcesso || generateChaveAcesso('SP', new Date(), config.cnpj || '00000000000000', serieNFe, parseInt(numeroNFe, 10) || 1);
    const finalXml = generateNFeXML(order, config, finalChave, numeroNFe, serieNFe, naturezaOperacao);

    const emissao: NFeEmissao = {
      numeroNFe,
      serie: serieNFe,
      chaveAcesso: finalChave,
      dataEmissao: new Date().toISOString(),
      naturezaOperacao,
      status: 'AUTORIZADA',
      protocoloAutorizacao: `135${Date.now().toString().slice(-12)}`,
      valorTotalPecas: totalPecas,
      valorTotalServicos: totalServicos,
      valorTotalNota: totalNota,
      tributosAproximados: valorTributos,
      xmlContent: finalXml,
    };

    const updated: ServiceOrder = {
      ...order,
      nfeEmitida: true,
      nfeDados: emissao,
      updatedAt: new Date().toISOString(),
    };

    onSaveOrder(updated);
    setActiveTab('danfe');
  };

  const handleCancelNFe = () => {
    if (!cancelReason.trim()) {
      alert('Por favor, informe a justificativa de cancelamento da NF-e.');
      return;
    }

    if (!order.nfeDados) return;

    const updatedNfe: NFeEmissao = {
      ...order.nfeDados,
      status: 'CANCELADA',
      motivoCancelamento: cancelReason.trim(),
      dataCancelamento: new Date().toISOString(),
    };

    const updated: ServiceOrder = {
      ...order,
      nfeDados: updatedNfe,
      updatedAt: new Date().toISOString(),
    };

    onSaveOrder(updated);
    setIsCanceling(false);
    setCancelReason('');
  };

  const handleCopyChave = () => {
    navigator.clipboard.writeText(chaveAcesso);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handlePrintDANFE = () => {
    window.print();
  };

  const handleDownloadXml = () => {
    downloadNFeXml(xmlText, chaveAcesso, numeroNFe);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = onlyDigits(order.cliente.telefone);
    const workshopName = config.nome || 'Oficina Mecânica';
    const chaveFormatada = formatChaveAcesso(chaveAcesso);

    const msg = encodeURIComponent(
      `Olá ${order.cliente.nome}!\n\nSua *Nota Fiscal Eletrônica (NF-e)* referente à OS #${order.numeroOS} foi emitida com sucesso pela *${workshopName}*.\n\n*Dados da NF-e:*\n• Número: ${numeroNFe} (Série ${serieNFe})\n• Valor Total: ${formatCurrency(totalNota)}\n• Chave de Acesso:\n${chaveFormatada}\n\nVocê pode consultar a validade no portal da SEFAZ ou solicitar o arquivo XML por este mesmo canal. Obrigado pela confiança!`
    );

    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-start overflow-y-auto p-2 sm:p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base leading-tight">
                  Emissão de NF-e & DANFE
                </h2>
                {isAlreadyEmitted ? (
                  order.nfeDados?.status === 'CANCELADA' ? (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      Cancelada
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Autorizada SEFAZ
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-900">
                    Pendente de Emissão
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Ordem de Serviço #{order.numeroOS} · Cliente: {order.cliente.nome}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 flex items-center justify-between gap-2 overflow-x-auto text-xs font-bold">
          <div className="flex items-center gap-1 py-2">
            <button
              onClick={() => setActiveTab('danfe')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'danfe'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Documento DANFE</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'config'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-4 h-4 text-blue-600" />
              <span>Dados Fiscais & Emissão</span>
            </button>

            <button
              onClick={() => setActiveTab('xml')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'xml'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Barcode className="w-4 h-4 text-purple-600" />
              <span>Estrutura XML SEFAZ</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 py-2">
            <button
              onClick={handlePrintDANFE}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
              title="Imprimir DANFE"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={handleDownloadXml}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
              title="Baixar arquivo XML da NF-e"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Baixar XML</span>
            </button>

            {order.cliente.telefone && (
              <button
                onClick={handleSendWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                title="Enviar dados da NF-e por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: DANFE VIEW */}
          {activeTab === 'danfe' && (
            <div className="space-y-4">
              {/* Emission Banner Alert if not emitted yet */}
              {!isAlreadyEmitted && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Esta Ordem de Serviço ainda não possui NF-e oficial emitida.
                      </h4>
                      <p className="text-[11px] text-amber-700">
                        Revise os dados fiscais do cliente e das peças para gerar o documento e protocolar a chave de 44 dígitos.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEmitirNFe}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Emitir NF-e Agora</span>
                  </button>
                </div>
              )}

              {/* Chave de Acesso Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Chave de Acesso da NF-e (44 Dígitos Oficiais)
                  </span>
                  <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 select-all tracking-wider">
                    {formatChaveAcesso(chaveAcesso)}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyChave}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copiado!' : 'Copiar Chave'}</span>
                  </button>

                  <a
                    href="https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-bold text-xs flex items-center gap-1 hover:bg-blue-100 transition"
                    title="Consultar no Portal Nacional da SEFAZ"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Portal SEFAZ</span>
                  </a>
                </div>
              </div>

              {/* DANFE Physical Sheet Container (Standard Layout) */}
              <div
                id="danfeContainer"
                className="bg-white border-2 border-slate-900 p-5 rounded-lg text-slate-900 font-sans shadow-sm space-y-3 text-xs"
              >
                {/* 1. Header Canhoto de Recebimento */}
                <div className="border border-slate-800 p-2 rounded-xs flex justify-between items-center text-[10px] bg-slate-50">
                  <div>
                    RECEBEMOS DE <strong>{(config.razaoSocial || config.nome || 'OFICINA MECANICA').toUpperCase()}</strong> OS PRODUTOS/SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO
                  </div>
                  <div className="text-right font-bold border-l border-slate-400 pl-3">
                    NF-e Nº {numeroNFe}
                  </div>
                </div>

                {/* 2. Cabeçalho Principal (Emitente | DANFE | Chave) */}
                <div className="grid grid-cols-12 gap-2 border border-slate-800 p-3 rounded-xs">
                  {/* Emitente */}
                  <div className="col-span-5 flex items-center gap-3 border-r border-slate-300 pr-2">
                    {config.logoUrl && (
                      <div className="w-14 h-14 shrink-0 rounded overflow-hidden flex items-center justify-center p-0.5 border border-slate-200">
                        <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-black text-xs uppercase leading-tight text-slate-900">
                        {config.nome || 'Bibicar Oficina Mecânica'}
                      </h3>
                      <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                        {config.razaoSocial || config.nome}
                      </p>
                      <p className="text-[10px] text-slate-600">{config.endereco || 'Endereço não cadastrado'}</p>
                      <p className="text-[10px] text-slate-600 font-mono">
                        CNPJ: {config.cnpj || '00.000.000/0000-00'} · IE: {config.inscricaoEstadual || 'ISENTO'}
                      </p>
                    </div>
                  </div>

                  {/* DANFE Identifier */}
                  <div className="col-span-3 text-center border-r border-slate-300 px-2 flex flex-col justify-center items-center">
                    <span className="font-black text-sm tracking-wider">DANFE</span>
                    <span className="text-[9px] uppercase font-bold text-slate-600 leading-tight">
                      Documento Auxiliar da Nota Fiscal Eletrônica
                    </span>
                    <div className="my-1 text-[11px] font-bold">
                      <span>0 - ENTRADA</span> | <span className="underline">1 - SAÍDA</span> [ 1 ]
                    </div>
                    <div className="text-[11px] font-bold font-mono">
                      Nº {numeroNFe}
                    </div>
                    <div className="text-[10px] font-bold font-mono text-slate-600">
                      SÉRIE: {serieNFe}
                    </div>
                  </div>

                  {/* Chave de Acesso & Código de Barras Simulado */}
                  <div className="col-span-4 pl-2 flex flex-col justify-center">
                    <div className="bg-slate-100 p-1.5 rounded-xs border border-slate-300 text-center mb-1">
                      {/* Visual Barcode Bars Representation */}
                      <div className="h-6 flex items-center justify-center gap-0.5 overflow-hidden">
                        {[...Array(38)].map((_, i) => (
                          <span
                            key={i}
                            className={`h-full ${
                              i % 3 === 0 ? 'w-1 bg-slate-900' : i % 2 === 0 ? 'w-0.5 bg-slate-900' : 'w-0.5 bg-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Chave de Acesso:</span>
                    <span className="font-mono text-[10px] font-bold text-slate-900 break-all leading-tight">
                      {formatChaveAcesso(chaveAcesso)}
                    </span>
                    <div className="mt-1 text-[9px] text-slate-500">
                      Consulta de autenticidade no portal www.nfe.fazenda.gov.br
                    </div>
                  </div>
                </div>

                {/* 3. Natureza da Operação & Protocolo */}
                <div className="grid grid-cols-12 gap-2 border border-slate-800 p-2 rounded-xs bg-slate-50 text-[10px]">
                  <div className="col-span-7">
                    <span className="font-bold text-slate-600 uppercase block">NATUREZA DA OPERAÇÃO</span>
                    <strong className="text-slate-900">{naturezaOperacao}</strong>
                  </div>
                  <div className="col-span-5 border-l border-slate-300 pl-2">
                    <span className="font-bold text-slate-600 uppercase block">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
                    <strong className="font-mono text-slate-900">
                      {order.nfeDados?.protocoloAutorizacao || '135260000000000'} · {formatDate(order.nfeDados?.dataEmissao || new Date().toISOString())}
                    </strong>
                  </div>
                </div>

                {/* 4. Destinatário / Remetente */}
                <div className="border border-slate-800 rounded-xs">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px] uppercase border-b border-slate-800">
                    Destinatário / Remetente
                  </div>
                  <div className="p-2 grid grid-cols-12 gap-2 text-[10px]">
                    <div className="col-span-8">
                      <span className="text-slate-600 block">NOME / RAZÃO SOCIAL</span>
                      <strong className="text-slate-900 uppercase">{order.cliente.nome || 'CONSUMIDOR FINAL'}</strong>
                    </div>
                    <div className="col-span-4">
                      <span className="text-slate-600 block">CNPJ / CPF</span>
                      <strong className="font-mono text-slate-900">{order.cliente.documento || 'NÃO INFORMADO'}</strong>
                    </div>
                    <div className="col-span-6">
                      <span className="text-slate-600 block">ENDEREÇO</span>
                      <span>{order.cliente.endereco || 'RUA PADRÃO'}, {order.cliente.numero || 'S/N'}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-slate-600 block">BAIRRO / DISTRITO</span>
                      <span>{order.cliente.bairro || 'CENTRO'}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-slate-600 block">CEP</span>
                      <span className="font-mono">{order.cliente.cep || '00000-000'}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Cálculo do Imposto */}
                <div className="border border-slate-800 rounded-xs">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px] uppercase border-b border-slate-800">
                    Cálculo do Imposto
                  </div>
                  <div className="p-2 grid grid-cols-5 gap-2 text-[10px] text-center">
                    <div className="border-r border-slate-200 pr-1">
                      <span className="text-slate-600 block">BASE DE CÁLCULO ICMS</span>
                      <strong className="font-mono">R$ 0,00</strong>
                    </div>
                    <div className="border-r border-slate-200 pr-1">
                      <span className="text-slate-600 block">VALOR DO ICMS</span>
                      <strong className="font-mono">R$ 0,00</strong>
                    </div>
                    <div className="border-r border-slate-200 pr-1">
                      <span className="text-slate-600 block">VALOR TOTAL PEÇAS</span>
                      <strong className="font-mono">{formatCurrency(totalPecas)}</strong>
                    </div>
                    <div className="border-r border-slate-200 pr-1">
                      <span className="text-slate-600 block">VALOR TOTAL SERVIÇOS</span>
                      <strong className="font-mono">{formatCurrency(totalServicos)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600 block">VALOR TOTAL DA NOTA</span>
                      <strong className="font-mono text-emerald-800 text-xs font-black">
                        {formatCurrency(totalNota)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 6. Dados dos Produtos / Serviços */}
                <div className="border border-slate-800 rounded-xs">
                  <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px] uppercase border-b border-slate-800 flex justify-between">
                    <span>Dados dos Produtos / Peças Aplicadas</span>
                    <span>{pecas.length} item(ns)</span>
                  </div>
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-100 border-b border-slate-300">
                      <tr>
                        <th className="p-1.5">CÓD</th>
                        <th className="p-1.5">DESCRIÇÃO DA PEÇA / PRODUTO</th>
                        <th className="p-1.5">NCM/SH</th>
                        <th className="p-1.5">CFOP</th>
                        <th className="p-1.5">UN</th>
                        <th className="p-1.5 text-right">QTD</th>
                        <th className="p-1.5 text-right">VLR UNIT</th>
                        <th className="p-1.5 text-right">VLR TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pecas.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-2 text-center text-slate-400 italic">
                            Nenhuma peça discriminada para esta Ordem de Serviço (Apenas mão de obra/serviços).
                          </td>
                        </tr>
                      ) : (
                        pecas.map((p, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5 font-mono text-slate-600">{p.codigo || `P${idx + 1}`}</td>
                            <td className="p-1.5 font-bold text-slate-900">{p.descricao}</td>
                            <td className="p-1.5 font-mono">{p.ncm || '8708.29.99'}</td>
                            <td className="p-1.5 font-mono">{p.cfop || config.cfopPadraoPecas || '5102'}</td>
                            <td className="p-1.5">{p.unidade || 'UN'}</td>
                            <td className="p-1.5 text-right font-mono">{p.qtd}</td>
                            <td className="p-1.5 text-right font-mono">{formatCurrency(p.preco)}</td>
                            <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(p.qtd * p.preco)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 7. Dados dos Serviços Prestados (ISSQN) */}
                {servicos.length > 0 && (
                  <div className="border border-slate-800 rounded-xs">
                    <div className="bg-slate-200 px-2 py-0.5 font-bold text-[10px] uppercase border-b border-slate-800 flex justify-between">
                      <span>Serviços Prestados pela Oficina (ISSQN)</span>
                      <span>{servicos.length} serviço(s)</span>
                    </div>
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-100 border-b border-slate-300">
                        <tr>
                          <th className="p-1.5">DESCRIÇÃO DO SERVIÇO</th>
                          <th className="p-1.5">MECÂNICO EXECUTOR</th>
                          <th className="p-1.5 text-right">VALOR DO SERVIÇO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {servicos.map((s, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5 font-bold text-slate-900">{s.descricao}</td>
                            <td className="p-1.5 text-slate-600">{s.mecanico || order.mecanicoResponsavel || 'Geral'}</td>
                            <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(s.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 8. Dados Adicionais / Informações Complementares */}
                <div className="border border-slate-800 rounded-xs p-2 text-[10px] bg-slate-50 space-y-1">
                  <span className="font-bold uppercase text-slate-700 block">DADOS ADICIONAIS / INFORMAÇÕES COMPLEMENTARES</span>
                  <p className="text-slate-800 font-mono text-[9px] leading-relaxed">
                    OS #{order.numeroOS} · Veículo: {order.veiculo?.marca} {order.veiculo?.modelo} | Placa: {order.veiculo?.matricula} | KM Entrada: {order.veiculo?.kmEntrada || 'N/I'}.
                  </p>
                  <p className="text-slate-600 text-[9px] leading-relaxed">
                    Valor aprox. dos tributos: {formatCurrency(valorTributos)} ({aliquotaMedia}% Fonte: IBPT Lei 12.741/2012). Documento emitido por ME ou EPP optante pelo Simples Nacional. Não gera direito a crédito fiscal de IPI.
                  </p>
                </div>
              </div>

              {/* Cancel Action if already emitted */}
              {isAlreadyEmitted && order.nfeDados?.status !== 'CANCELADA' && (
                <div className="border border-rose-200 bg-rose-50/50 p-3 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">Cancelamento de NF-e</span>
                    <span className="text-[11px] text-rose-700">
                      Caso a nota tenha sido emitida indevidamente ou o serviço estornado, você pode registrar o cancelamento formal.
                    </span>
                  </div>

                  {!isCanceling ? (
                    <button
                      onClick={() => setIsCanceling(true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancelar NF-e</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Motivo do cancelamento..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="bg-white border border-rose-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                      <button
                        onClick={handleCancelNFe}
                        className="px-2.5 py-1 bg-rose-700 text-white font-bold text-xs rounded-lg hover:bg-rose-800 transition"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setIsCanceling(false)}
                        className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-300 transition"
                      >
                        Voltar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONFIGURAÇÃO DE DADOS FISCAIS */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Configure os dados fiscais desta emissão. As alterações refletem diretamente na chave de 44 dígitos e no XML oficial da SEFAZ.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número da NF-e
                  </label>
                  <input
                    type="text"
                    value={numeroNFe}
                    onChange={(e) => setNumeroNFe(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Série da NF-e
                  </label>
                  <input
                    type="text"
                    value={serieNFe}
                    onChange={(e) => setSerieNFe(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regime Tributário
                  </label>
                  <select
                    value={config.regimeTributario || 'SIMPLES_NACIONAL'}
                    disabled
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 cursor-not-allowed"
                  >
                    <option value="SIMPLES_NACIONAL">Simples Nacional (ME / EPP)</option>
                    <option value="SIMPLES_MEI">MEI - Microempreendedor Individual</option>
                    <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Natureza da Operação
                </label>
                <input
                  type="text"
                  value={naturezaOperacao}
                  onChange={(e) => setNaturezaOperacao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              {/* Destinatário Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Dados do Cliente / Destinatário</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold">Nome Completo:</span>
                    <strong className="text-slate-900">{order.cliente.nome}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold">CPF / CNPJ:</span>
                    <strong className="font-mono text-slate-900">{order.cliente.documento || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold">Endereço:</span>
                    <span className="text-slate-800">{order.cliente.endereco || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-semibold">Telefone / WhatsApp:</span>
                    <span className="font-mono text-slate-800">{order.cliente.telefone || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              {/* Botão de Gravação */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleEmitirNFe}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Dados Fiscais & Emitir NF-e</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: XML VIEW */}
          {activeTab === 'xml' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Arquivo XML SEFAZ (Layout v4.00)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Estrutura oficial para envio à contabilidade ou transmissão ao WebService da SEFAZ
                  </p>
                </div>
                <button
                  onClick={handleDownloadXml}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo .xml</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                  {xmlText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Bibicar OS · Emissor de NF-e e DANFE
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
