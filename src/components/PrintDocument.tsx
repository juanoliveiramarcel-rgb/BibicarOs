import React from 'react';
import { ServiceOrder, WorkshopConfig } from '../types';
import {
  calculateOrderTotals,
  formatCurrency,
  formatDate,
} from '../utils/formatters';

interface PrintDocumentProps {
  order: ServiceOrder | null;
  config: WorkshopConfig;
  forceVisible?: boolean;
  id?: string;
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({
  order,
  config,
  forceVisible = false,
  id = 'printArea',
}) => {
  if (!order) return null;

  const totals = calculateOrderTotals(order);

  return (
    <div
      id={id}
      className={`${forceVisible ? 'block w-[800px] p-6 bg-white' : 'print-only max-w-4xl mx-auto p-4'} bg-white text-slate-900 font-sans text-xs`}
    >
      {/* Top Header Card */}
      <div className="border-2 border-slate-900 p-3 mb-2">
        <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2">
          <div className="flex items-center gap-3">
            {config.logoUrl && (
              <div className="w-16 h-16 shrink-0 flex items-center justify-center border border-slate-300 rounded p-1 bg-white">
                <img
                  src={config.logoUrl}
                  alt={config.nome}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black tracking-wider text-slate-900">
                {config.nome}
              </h1>
              <p className="text-[10px] font-bold text-slate-800">
                {config.endereco}
              </p>
              <p className="text-[10px] text-slate-700">
                CNPJ: {config.cnpj} | IE: {config.inscricaoEstadual}
              </p>
              <p className="text-[10px] text-slate-700">
                Telefone: {config.telefone} | E-mail: {config.email}
              </p>
            </div>
          </div>
          <div className="text-right border-l-2 border-slate-900 pl-4 min-w-[140px]">
            <p className="text-xs uppercase font-bold text-slate-700">
              {order.tipoDoc}
            </p>
            <p className="text-2xl font-black text-red-600 font-mono">
              #{order.numeroOS}
            </p>
            <p className="text-[10px] font-semibold text-slate-800">
              STATUS: {order.statusOS}
            </p>
          </div>
        </div>

        {/* Customer & Vehicle Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 border border-slate-300">
          <div className="space-y-0.5">
            <p>
              <strong>CLIENTE:</strong> {order.cliente?.nome || '-'}
            </p>
            <p>
              <strong>CPF/CNPJ:</strong> {order.cliente?.documento || '-'}
            </p>
            <p>
              <strong>TELEFONE:</strong> {order.cliente?.telefone || '-'}
            </p>
            <p>
              <strong>ENDEREÇO:</strong>{' '}
              {[
                order.cliente?.endereco,
                order.cliente?.numero ? `Nº ${order.cliente.numero}` : null,
                order.cliente?.complemento,
                order.cliente?.bairro,
                order.cliente?.cidade && order.cliente?.uf
                  ? `${order.cliente.cidade}/${order.cliente.uf}`
                  : order.cliente?.cidade,
                order.cliente?.cep ? `CEP: ${order.cliente.cep}` : null,
              ]
                .filter(Boolean)
                .join(', ') || '-'}
            </p>
            <p>
              <strong>EMAIL:</strong> {order.cliente?.email || '-'}
            </p>
          </div>
          <div className="space-y-0.5">
            <p>
              <strong>VEÍCULO:</strong> {order.veiculo?.marca} {order.veiculo?.modelo}
            </p>
            <p>
              <strong>PLACA:</strong>{' '}
              <span className="font-mono font-bold">
                {order.veiculo?.matricula ? order.veiculo.matricula.toUpperCase() : '-'}
              </span>{' '}
              | <strong>ANO:</strong> {order.veiculo?.ano || '-'} |{' '}
              <strong>COR:</strong> {order.veiculo?.cor || '-'}
            </p>
            <p>
              <strong>COMBUSTÍVEL:</strong> {order.veiculo?.tipoCombustivel || '-'} |{' '}
              <strong>MECÂNICO:</strong>{' '}
              <span className="font-semibold">{order.mecanicoResponsavel || 'Equipe Oficina'}</span>
            </p>
            <p>
              <strong>KM ENTRADA:</strong> {order.veiculo?.kmEntrada || '0'} |{' '}
              <strong>KM SAÍDA:</strong> {order.veiculo?.kmSaida || '-'}
            </p>
            <p>
              <strong>ENTRADA:</strong> {formatDate(order.veiculo?.dataEntrada)} |{' '}
              <strong>SAÍDA PREVISTA:</strong> {formatDate(order.veiculo?.dataSaida)}
            </p>
          </div>
        </div>

        {/* Inspection & Checklist details */}
        {order.checklist && (
          <div className="mt-2 pt-2 border-t border-slate-300 text-[10px] bg-white p-1.5 rounded">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <strong>Combustível:</strong> {order.checklist.nivelCombustivel || 'Não marcado'}
              </div>
              <div className="col-span-2">
                <strong>Itens presentes:</strong>{' '}
                {[
                  order.checklist.temEstepe ? 'Estepe' : null,
                  order.checklist.temMacaco ? 'Macaco' : null,
                  order.checklist.temChaveRoda ? 'Chave de Roda' : null,
                  order.checklist.temTriangulo ? 'Triângulo' : null,
                  order.checklist.temManual ? 'Manual' : null,
                  order.checklist.temDocumento ? 'CRLV' : null,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Nenhum item marcado'}
              </div>
            </div>
            {order.checklist.avariasIdentificadas && (
              <p className="mt-1">
                <strong>Avarias/Riscos pré-existentes:</strong>{' '}
                {order.checklist.avariasIdentificadas}
              </p>
            )}
            {order.checklist.danosVisuais && order.checklist.danosVisuais.length > 0 && (
              <p className="mt-0.5 text-slate-800">
                <strong>Mapeamento de Lataria:</strong>{' '}
                {order.checklist.danosVisuais
                  .map((d, i) => `[${i + 1}] ${d.tipo} (${d.zona}${d.descricao ? `: ${d.descricao}` : ''})`)
                  .join(' · ')}
              </p>
            )}
            {order.checklist.pertencesDeixados && (
              <p className="mt-0.5 text-slate-600">
                <strong>Pertences no veículo:</strong> {order.checklist.pertencesDeixados}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 1. Services Table */}
      <div className="mb-2">
        <h2 className="bg-slate-900 text-white font-bold px-2 py-1 text-[11px] uppercase">
          1. DESCRIÇÃO DOS SERVIÇOS / MÃO DE OBRA
        </h2>
        <table className="w-full border-collapse border border-slate-400 text-[10px] mt-1">
          <thead>
            <tr className="bg-slate-200 font-bold">
              <th className="border border-slate-400 p-1 text-left">DESCRIÇÃO DOS SERVIÇOS</th>
              <th className="border border-slate-400 p-1 text-right w-28">VALOR (R$)</th>
            </tr>
          </thead>
          <tbody>
            {order.servicos && order.servicos.length > 0 ? (
              order.servicos.map((s, idx) => (
                <tr key={idx}>
                  <td className="border border-slate-400 p-1">
                    {s.descricao}
                    {s.mecanico && (
                      <span className="text-[9px] text-slate-500 ml-2">
                        (Mecânico: {s.mecanico})
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-400 p-1 text-right font-mono font-medium">
                    {formatCurrency(s.valor)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border border-slate-400 p-1 text-slate-400 italic">
                  Nenhum serviço registrado
                </td>
                <td className="border border-slate-400 p-1 text-right font-mono">
                  R$ 0,00
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-slate-100">
              <td className="border border-slate-400 p-1 text-right uppercase">
                Sub-Total Serviços:
              </td>
              <td className="border border-slate-400 p-1 text-right font-mono font-bold text-slate-900">
                {formatCurrency(totals.totalServicos)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 2. Parts Table */}
      <div className="mb-2">
        <h2 className="bg-slate-900 text-white font-bold px-2 py-1 text-[11px] uppercase">
          2. DESCRIÇÃO DAS PEÇAS E MATERIAIS
        </h2>
        <table className="w-full border-collapse border border-slate-400 text-[10px] mt-1">
          <thead>
            <tr className="bg-slate-200 font-bold">
              <th className="border border-slate-400 p-1 text-left">DESCRIÇÃO PEÇAS</th>
              <th className="border border-slate-400 p-1 text-center w-12">UN.</th>
              <th className="border border-slate-400 p-1 text-center w-12">QTDE.</th>
              <th className="border border-slate-400 p-1 text-right w-24">PREÇO UN.</th>
              <th className="border border-slate-400 p-1 text-right w-28">TOTAL (R$)</th>
            </tr>
          </thead>
          <tbody>
            {order.pecas && order.pecas.length > 0 ? (
              order.pecas.map((p, idx) => {
                const totalItem = (Number(p.qtd) || 0) * (Number(p.preco) || 0);
                return (
                  <tr key={idx}>
                    <td className="border border-slate-400 p-1">
                      {p.descricao}
                      {p.codigo && (
                        <span className="text-[9px] text-slate-500 ml-1">
                          [Cód: {p.codigo}]
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-400 p-1 text-center font-mono">
                      {p.unidade || 'UN'}
                    </td>
                    <td className="border border-slate-400 p-1 text-center font-mono font-medium">
                      {p.qtd}
                    </td>
                    <td className="border border-slate-400 p-1 text-right font-mono">
                      {formatCurrency(p.preco)}
                    </td>
                    <td className="border border-slate-400 p-1 text-right font-mono font-medium">
                      {formatCurrency(totalItem)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="border border-slate-400 p-1 text-slate-400 italic">
                  Nenhuma peça registrada
                </td>
                <td className="border border-slate-400 p-1 text-right font-mono">
                  R$ 0,00
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-slate-100">
              <td colSpan={4} className="border border-slate-400 p-1 text-right uppercase">
                Sub-Total Peças:
              </td>
              <td className="border border-slate-400 p-1 text-right font-mono font-bold text-slate-900">
                {formatCurrency(totals.totalPecas)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="border border-slate-900 p-2 mb-2 bg-slate-50">
        <div className="flex justify-between items-center text-[11px] font-bold">
          <div>
            <p>
              FORMA DE PAGAMENTO:{' '}
              <span className="font-normal">{order.pagamento?.forma || 'À VISTA / PIX / CARTÃO'}</span>
            </p>
            <p>
              PRAZO / PARCELAS:{' '}
              <span className="font-normal">{order.pagamento?.prazo || 'IMEDIATO'}</span>
            </p>
            {order.pagamento?.observacoes && (
              <p className="font-normal text-[10px] text-slate-600 mt-0.5">
                Obs: {order.pagamento.observacoes}
              </p>
            )}
          </div>
          <div className="text-right space-y-0.5">
            {totals.desconto > 0 && (
              <p className="text-red-600">
                DESCONTO: -{formatCurrency(totals.desconto)}
              </p>
            )}
            <p className="text-sm font-black text-slate-900 font-mono">
              TOTAL GERAL: <span className="text-red-600">{formatCurrency(totals.totalGeral)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Warranty Terms & Disclaimer */}
      <div className="border border-slate-400 p-2 text-[9px] space-y-1 bg-slate-50">
        <p className="font-bold text-center border-b border-slate-300 pb-0.5">
          * ORÇAMENTO VÁLIDO POR {config.prazoValidadeOrcamentoDias} DIAS * GARANTIA LEGAL DE {config.prazoGarantiaDias} DIAS (CDC ART. 26) *
        </p>
        <p className="text-justify leading-tight text-slate-700">
          {config.termoGarantia}
        </p>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-12 text-center text-[10px]">
        <div>
          <div className="border-t border-slate-800 pt-1 font-bold">
            {config.nome || config.razaoSocial || 'Oficina Mecânica'}
          </div>
          <p className="text-[9px] text-slate-500">Oficina Autorizada / Responsável Técnico</p>
        </div>
        <div>
          <div className="border-t border-slate-800 pt-1 font-bold">
            ASSINATURA DO CLIENTE
          </div>
          <p className="text-[9px] text-slate-500">
            {order.cliente?.nome || 'Proprietário / Responsável'}
          </p>
        </div>
      </div>
      <div className="mt-4 text-center text-[8px] text-slate-400">
        Bibicar OS - Gestão de Oficina Mecânica · Documento emitido eletronicamente
      </div>
    </div>
  );
};
