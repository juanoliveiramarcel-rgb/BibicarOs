import React from 'react';
import { ServiceOrder, WorkshopConfig } from '../types';
import { formatDate } from '../utils/formatters';

interface BlankInspectionPrintProps {
  order?: ServiceOrder | null;
  config: WorkshopConfig;
  forceVisible?: boolean;
  id?: string;
}

export const BlankInspectionPrint: React.FC<BlankInspectionPrintProps> = ({
  order,
  config,
  forceVisible = false,
  id = 'blankPrintArea',
}) => {
  return (
    <div
      id={id}
      className={`${forceVisible ? 'block w-[800px] p-6 bg-white' : 'print-only max-w-4xl mx-auto p-4'} bg-white text-slate-900 font-sans text-xs`}
    >
      {/* Top Header */}
      <div className="border-2 border-slate-900 p-2.5 mb-2">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-2">
          <div className="flex items-center gap-3">
            {config.logoUrl && (
              <div className="w-14 h-14 shrink-0 flex items-center justify-center border border-slate-300 rounded p-1 bg-white">
                <img
                  src={config.logoUrl}
                  alt={config.nome}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-lg font-black tracking-wider text-slate-900 leading-tight">
                {config.nome}
              </h1>
              <p className="text-[10px] font-bold text-slate-700">
                {config.endereco}
              </p>
              <p className="text-[9px] text-slate-600">
                Tel: {config.telefone} | WhatsApp: {config.whatsapp} | CNPJ: {config.cnpj}
              </p>
            </div>
          </div>

          <div className="text-right border-l-2 border-slate-900 pl-3 min-w-[150px]">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
              PRANCHETA DE ENTRADA
            </p>
            <p className="text-xl font-black text-red-600 font-mono leading-tight">
              {order?.numeroOS ? `OS #${order.numeroOS}` : 'FICHA DE VISTORIA'}
            </p>
            <p className="text-[9px] text-slate-500 font-medium">
              Data: {formatDate(order?.veiculo?.dataEntrada || new Date().toISOString().split('T')[0])}
            </p>
          </div>
        </div>

        {/* Customer & Vehicle Header Box */}
        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 border border-slate-300">
          <div className="space-y-1">
            <p className="border-b border-dotted border-slate-300 pb-0.5">
              <strong>CLIENTE:</strong> {order?.cliente?.nome || '________________________________________________'}
            </p>
            <p className="border-b border-dotted border-slate-300 pb-0.5">
              <strong>TELEFONE:</strong> {order?.cliente?.telefone || '______________________'} | <strong>CPF/CNPJ:</strong> {order?.cliente?.documento || '___________________'}
            </p>
            <p className="border-b border-dotted border-slate-300 pb-0.5">
              <strong>ENDEREÇO:</strong> {order?.cliente?.endereco || '________________________________________________'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="border-b border-dotted border-slate-300 pb-0.5">
              <strong>VEÍCULO:</strong> {order?.veiculo?.marca || '___________'} {order?.veiculo?.modelo || '___________________'} | <strong>PLACA:</strong> <span className="font-mono font-bold">{order?.veiculo?.matricula || '_______'}</span>
            </p>
            <p className="border-b border-dotted border-slate-300 pb-0.5">
              <strong>ANO/MOD:</strong> {order?.veiculo?.ano || '________'} | <strong>COR:</strong> {order?.veiculo?.cor || '________'} | <strong>COMB.:</strong> {order?.veiculo?.tipoCombustivel || '________'}
            </p>
            <p className="border-b border-dotted border-slate-300 pb-0.5">
              <strong>KM ENTRADA:</strong> <span className="font-mono">{order?.veiculo?.kmEntrada || '____________'}</span> | <strong>MECÂNICO:</strong> {order?.mecanicoResponsavel || '____________________'}
            </p>
          </div>
        </div>

        {/* Checklist & Car Silhouette */}
        <div className="mt-2 grid grid-cols-12 gap-2 text-[9px] bg-white border border-slate-200 p-2">
          {/* Fuel & Inventory */}
          <div className="col-span-5 space-y-1.5 border-r border-slate-200 pr-2">
            <div>
              <span className="font-bold text-slate-800 uppercase block mb-0.5">
                Nível de Combustível:
              </span>
              <div className="flex gap-2">
                {['Reserva', '1/4', '1/2', '3/4', 'Cheio'].map((lvl) => (
                  <label key={lvl} className="flex items-center gap-1 cursor-pointer">
                    <span className="w-3 h-3 border border-slate-500 rounded-full inline-block text-center text-[8px] font-bold">
                      {order?.checklist?.nivelCombustivel === lvl ? '●' : ''}
                    </span>
                    <span>{lvl}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase block mb-0.5">
                Equipamentos Presentes:
              </span>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { key: 'temEstepe', label: 'Estepe' },
                  { key: 'temMacaco', label: 'Macaco' },
                  { key: 'temChaveRoda', label: 'Chave Roda' },
                  { key: 'temTriangulo', label: 'Triângulo' },
                  { key: 'temManual', label: 'Manual' },
                  { key: 'temDocumento', label: 'CRLV / Doc' },
                ].map((item) => {
                  const isChecked = order?.checklist ? (order.checklist as any)[item.key] : false;
                  return (
                    <label key={item.key} className="flex items-center gap-1">
                      <span className="w-3 h-3 border border-slate-500 rounded text-center inline-flex items-center justify-center text-[8px] font-bold">
                        {isChecked ? '✓' : ''}
                      </span>
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-1">
              <span className="font-bold text-slate-800 block">Pertences no Veículo:</span>
              <p className="border-b border-dotted border-slate-300 min-h-[16px] text-slate-700">
                {order?.checklist?.pertencesDeixados || ''}
              </p>
            </div>
          </div>

          {/* Car Diagram / Legend for Damage */}
          <div className="col-span-7">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-800 uppercase">
                Vistoria da Lataria (Marcar Avarias / Riscos / Amassados)
              </span>
              <span className="text-[8px] text-slate-500 font-mono">
                [R] Risco · [A] Amassado · [Q] Quebrado · [X] Ralado
              </span>
            </div>

            {/* Simplified Car Blueprint for Print */}
            <div className="border border-slate-300 rounded p-1 bg-slate-50 flex items-center justify-center min-h-[68px]">
              <div className="grid grid-cols-5 gap-1 w-full text-center text-[8px] font-bold text-slate-600">
                <div className="border border-dashed border-slate-400 p-1 rounded bg-white">
                  <span>FRENTE</span>
                  <div className="h-7 border-t border-slate-200 mt-1 flex items-center justify-center text-[9px] font-mono text-slate-400">
                    [ &nbsp; &nbsp; ]
                  </div>
                </div>
                <div className="border border-dashed border-slate-400 p-1 rounded bg-white">
                  <span>LATERAL ESQ</span>
                  <div className="h-7 border-t border-slate-200 mt-1 flex items-center justify-center text-[9px] font-mono text-slate-400">
                    [ &nbsp; &nbsp; ]
                  </div>
                </div>
                <div className="border border-dashed border-slate-400 p-1 rounded bg-white">
                  <span>TETO</span>
                  <div className="h-7 border-t border-slate-200 mt-1 flex items-center justify-center text-[9px] font-mono text-slate-400">
                    [ &nbsp; &nbsp; ]
                  </div>
                </div>
                <div className="border border-dashed border-slate-400 p-1 rounded bg-white">
                  <span>LATERAL DIR</span>
                  <div className="h-7 border-t border-slate-200 mt-1 flex items-center justify-center text-[9px] font-mono text-slate-400">
                    [ &nbsp; &nbsp; ]
                  </div>
                </div>
                <div className="border border-dashed border-slate-400 p-1 rounded bg-white">
                  <span>TRASEIRA</span>
                  <div className="h-7 border-t border-slate-200 mt-1 flex items-center justify-center text-[9px] font-mono text-slate-400">
                    [ &nbsp; &nbsp; ]
                  </div>
                </div>
              </div>
            </div>
            {order?.checklist?.avariasIdentificadas && (
              <p className="text-[8px] text-slate-700 mt-1">
                <strong>Avarias anotadas:</strong> {order.checklist.avariasIdentificadas}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ruled Table 1: Serviços / Mão de Obra */}
      <div className="mb-2">
        <div className="bg-slate-900 text-white font-bold px-2 py-0.5 text-[10px] uppercase flex justify-between items-center">
          <span>1. SERVIÇOS A EXECUTAR / MÃO DE OBRA (PREENCHIMENTO DO MECÂNICO)</span>
          <span className="text-[9px] font-normal text-slate-300">Tempo / Valor</span>
        </div>
        <table className="w-full border-collapse border border-slate-400 text-[10px]">
          <thead>
            <tr className="bg-slate-200 font-bold">
              <th className="border border-slate-400 p-1 w-8 text-center">Nº</th>
              <th className="border border-slate-400 p-1 text-left">DESCRIÇÃO DO SERVIÇO / DIAGNÓSTICO</th>
              <th className="border border-slate-400 p-1 w-32 text-center">STATUS / VISTO</th>
              <th className="border border-slate-400 p-1 w-28 text-right">VALOR EST. (R$)</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((num, idx) => {
              const svc = order?.servicos?.[idx];
              return (
                <tr key={num} className="h-6">
                  <td className="border border-slate-400 p-1 text-center font-mono font-bold text-slate-500">
                    {num}
                  </td>
                  <td className="border border-slate-400 p-1 font-medium">
                    {svc?.descricao || ''}
                  </td>
                  <td className="border border-slate-400 p-1 text-center text-slate-400">
                    [ &nbsp; ] OK &nbsp; [ &nbsp; ] Pend.
                  </td>
                  <td className="border border-slate-400 p-1 text-right font-mono">
                    {svc ? `R$ ${Number(svc.valor).toFixed(2)}` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ruled Table 2: Peças e Componentes */}
      <div className="mb-2">
        <div className="bg-slate-900 text-white font-bold px-2 py-0.5 text-[10px] uppercase flex justify-between items-center">
          <span>2. PEÇAS, FLUIDOS E MATERIAIS NECESSÁRIOS (PREENCHIMENTO DO MECÂNICO)</span>
          <span className="text-[9px] font-normal text-slate-300">Previsão de Aplicação</span>
        </div>
        <table className="w-full border-collapse border border-slate-400 text-[10px]">
          <thead>
            <tr className="bg-slate-200 font-bold">
              <th className="border border-slate-400 p-1 w-8 text-center">IT</th>
              <th className="border border-slate-400 p-1 text-left">DESCRIÇÃO DA PEÇA / FLUIDO / CÓDIGO</th>
              <th className="border border-slate-400 p-1 w-14 text-center">UN</th>
              <th className="border border-slate-400 p-1 w-14 text-center">QTD</th>
              <th className="border border-slate-400 p-1 w-28 text-right">PREÇO EST. (R$)</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((num, idx) => {
              const part = order?.pecas?.[idx];
              return (
                <tr key={num} className="h-6">
                  <td className="border border-slate-400 p-1 text-center font-mono font-bold text-slate-500">
                    {num}
                  </td>
                  <td className="border border-slate-400 p-1 font-medium">
                    {part?.descricao || ''}
                  </td>
                  <td className="border border-slate-400 p-1 text-center uppercase">
                    {part?.unidade || ''}
                  </td>
                  <td className="border border-slate-400 p-1 text-center font-mono">
                    {part?.qtd || ''}
                  </td>
                  <td className="border border-slate-400 p-1 text-right font-mono">
                    {part ? `R$ ${Number(part.preco).toFixed(2)}` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Observations & Signatures */}
      <div className="border border-slate-400 p-1.5 text-[9px] bg-slate-50 mb-2">
        <strong>OBSERVAÇÕES DO MECÂNICO / RECOMENDAÇÕES ADICIONAIS:</strong>
        <div className="border-b border-dotted border-slate-400 h-4 mt-0.5"></div>
        <div className="border-b border-dotted border-slate-400 h-4 mt-0.5"></div>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-6 text-center text-[9px]">
        <div>
          <div className="border-t border-slate-800 pt-1 font-bold">
            {config.nome || config.razaoSocial || 'Oficina Mecânica'}
          </div>
          <p className="text-[8px] text-slate-500">
            {order?.mecanicoResponsavel ? `Mecânico Resp.: ${order.mecanicoResponsavel}` : 'Responsável Técnico pela Vistoria e Execução'}
          </p>
        </div>
        <div>
          <div className="border-t border-slate-800 pt-1 font-bold">
            AUTORIZAÇÃO DO CLIENTE / PROPRIETÁRIO
          </div>
          <p className="text-[8px] text-slate-500">
            {order?.cliente?.nome || 'Assinatura do Cliente na Entrada'}
          </p>
        </div>
      </div>
      <div className="mt-4 text-center text-[8px] text-slate-400">
        Bibicar OS - Gestão de Oficina Mecânica · Ficha Oficial de Vistoria
      </div>
    </div>
  );
};
