import { ServiceOrder, WorkshopConfig, NFeEmissao } from '../types';

// Código do Estado (IBGE) para UF
const UF_IBGE_CODES: Record<string, string> = {
  RO: '11', AC: '12', AM: '13', RR: '14', PA: '15', AP: '16', TO: '17',
  MA: '21', PI: '22', CE: '23', RN: '24', PB: '25', PE: '26', AL: '27',
  SE: '28', BA: '29', MG: '31', ES: '32', RJ: '33', SP: '35', PR: '41',
  SC: '42', RS: '43', MS: '50', MT: '51', GO: '52', DF: '53',
};

/**
 * Remove formatação e caracteres não numéricos
 */
export function onlyDigits(val?: string): string {
  return (val || '').replace(/\D/g, '');
}

/**
 * Calcula o Dígito Verificador (Módulo 11) da Chave de Acesso da NF-e (43 dígitos base)
 */
export function calculateModulo11(chave43: string): number {
  let soma = 0;
  let peso = 2;

  for (let i = chave43.length - 1; i >= 0; i--) {
    const digito = parseInt(chave43.charAt(i), 10);
    soma += digito * peso;
    peso = peso >= 9 ? 2 : peso + 1;
  }

  const resto = soma % 11;
  const dv = 11 - resto;
  return dv === 0 || dv === 1 || dv >= 10 ? 0 : dv;
}

/**
 * Gera a Chave de Acesso oficial SEFAZ (44 dígitos numéricos)
 * Formato: cUF (2) + AAMM (4) + CNPJ (14) + mod (2) + serie (3) + nNF (9) + tpEmis (1) + cNF (8) + cDV (1)
 */
export function generateChaveAcesso(
  uf: string,
  dataEmissao: Date,
  cnpjEmitente: string,
  serie: string,
  numeroNF: number
): string {
  const cUF = UF_IBGE_CODES[uf.toUpperCase()] || '35'; // Default SP (35)
  const ano = dataEmissao.getFullYear().toString().slice(-2);
  const mes = (dataEmissao.getMonth() + 1).toString().padStart(2, '0');
  const aamm = `${ano}${mes}`;
  const cnpjClean = onlyDigits(cnpjEmitente).padStart(14, '0').slice(0, 14);
  const mod = '55'; // NF-e Modelo 55
  const serieClean = onlyDigits(serie).padStart(3, '0').slice(0, 3);
  const nNF = numeroNF.toString().padStart(9, '0').slice(0, 9);
  const tpEmis = '1'; // 1 = Emissão normal

  // Código numérico aleatório de 8 dígitos
  const cNF = Math.floor(10000000 + Math.random() * 90000000).toString();

  const chave43 = `${cUF}${aamm}${cnpjClean}${mod}${serieClean}${nNF}${tpEmis}${cNF}`;
  const cDV = calculateModulo11(chave43);

  return `${chave43}${cDV}`;
}

/**
 * Formata Chave de Acesso em blocos de 4 dígitos para visualização humana
 */
export function formatChaveAcesso(chave: string): string {
  const clean = onlyDigits(chave);
  if (clean.length !== 44) return chave;
  return clean.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Gera o XML SEFAZ Layout 4.00 da NF-e para produtos / serviços da oficina
 */
export function generateNFeXML(
  order: ServiceOrder,
  config: WorkshopConfig,
  chaveAcesso: string,
  numeroNFe: string,
  serieNFe: string,
  naturezaOperacao = 'Venda de mercadorias e prestação de serviços'
): string {
  const cleanEmitCnpj = onlyDigits(config.cnpj) || '00000000000000';
  const cleanDestDoc = onlyDigits(order.cliente.documento);
  const isCnpjDest = cleanDestDoc.length > 11;
  const dataHoje = new Date();
  const dhEmi = dataHoje.toISOString();

  // Itens de peças aplicadas
  const pecas = order.pecas || [];
  const servicos = order.servicos || [];

  const totalPecas = pecas.reduce((acc, p) => acc + (p.qtd * p.preco), 0);
  const totalServicos = servicos.reduce((acc, s) => acc + s.valor, 0);
  const totalDesconto = order.pagamento.desconto || 0;
  const totalNF = Math.max(0, totalPecas + totalServicos - totalDesconto);

  // Estimativa aproximada de tributos (Lei 12.741/2012) - Média Simples/IBPT ~13.45%
  const aliquotaMedia = config.aliquotaIbptPadrao || 13.45;
  const valorTributos = Number(((totalNF * aliquotaMedia) / 100).toFixed(2));

  // Determinar CRT (Código de Regime Tributário): 1 = Simples Nacional, 3 = Regime Normal
  const crt = config.regimeTributario === 'LUCRO_PRESUMIDO' || config.regimeTributario === 'LUCRO_REAL' ? '3' : '1';

  // Montagem do XML estruturado
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<NFe xmlns="http://www.portalfiscal.inf.br/nfe">\n`;
  xml += `  <infNFe Id="NFe${chaveAcesso}" versao="4.00">\n`;

  // <ide> Identificação da NF-e
  xml += `    <ide>\n`;
  xml += `      <cUF>35</cUF>\n`;
  xml += `      <cNF>${chaveAcesso.substring(35, 43)}</cNF>\n`;
  xml += `      <natOp>${escapeXml(naturezaOperacao)}</natOp>\n`;
  xml += `      <mod>55</mod>\n`;
  xml += `      <serie>${serieNFe}</serie>\n`;
  xml += `      <nNF>${parseInt(numeroNFe, 10)}</nNF>\n`;
  xml += `      <dhEmi>${dhEmi}</dhEmi>\n`;
  xml += `      <tpNF>1</tpNF>\n`; // 1 = Saída
  xml += `      <idDest>1</idDest>\n`; // 1 = Operação interna
  xml += `      <cMunFG>3550308</cMunFG>\n`;
  xml += `      <tpImp>1</tpImp>\n`; // 1 = DANFE normal retrato
  xml += `      <tpEmis>1</tpEmis>\n`; // 1 = Emissão normal
  xml += `      <cDV>${chaveAcesso.slice(-1)}</cDV>\n`;
  xml += `      <tpAmb>${config.ambienteSefaz === 'PRODUCAO' ? '1' : '2'}</tpAmb>\n`; // 1 = Produção, 2 = Homologação
  xml += `      <finNFe>1</finNFe>\n`; // 1 = NF-e normal
  xml += `      <indFinal>1</indFinal>\n`; // 1 = Consumidor final
  xml += `      <indPres>1</indPres>\n`; // 1 = Operação presencial
  xml += `      <procEmi>0</procEmi>\n`; // 0 = Emissão por aplicativo do contribuinte
  xml += `      <verProc>Bibicar OS 2.0</verProc>\n`;
  xml += `    </ide>\n`;

  // <emit> Dados do Emitente (Oficina Mecânica)
  xml += `    <emit>\n`;
  xml += `      <CNPJ>${cleanEmitCnpj}</CNPJ>\n`;
  xml += `      <xNome>${escapeXml(config.razaoSocial || config.nome)}</xNome>\n`;
  if (config.nome) {
    xml += `      <xFant>${escapeXml(config.nome)}</xFant>\n`;
  }
  xml += `      <enderEmit>\n`;
  xml += `        <xLgr>${escapeXml(config.endereco || 'Avenida Principal')}</xLgr>\n`;
  xml += `        <nro>S/N</nro>\n`;
  xml += `        <xBairro>Centro</xBairro>\n`;
  xml += `        <cMun>3550308</cMun>\n`;
  xml += `        <xMun>Sao Paulo</xMun>\n`;
  xml += `        <UF>SP</UF>\n`;
  xml += `        <CEP>01001000</CEP>\n`;
  xml += `        <cPais>1058</cPais>\n`;
  xml += `        <xPais>Brasil</xPais>\n`;
  if (config.telefone) {
    xml += `        <fone>${onlyDigits(config.telefone)}</fone>\n`;
  }
  xml += `      </enderEmit>\n`;
  xml += `      <IE>${onlyDigits(config.inscricaoEstadual) || 'ISENTO'}</IE>\n`;
  if (config.inscricaoMunicipal) {
    xml += `      <IM>${onlyDigits(config.inscricaoMunicipal)}</IM>\n`;
  }
  xml += `      <CRT>${crt}</CRT>\n`;
  xml += `    </emit>\n`;

  // <dest> Dados do Destinatário (Cliente)
  xml += `    <dest>\n`;
  if (isCnpjDest) {
    xml += `      <CNPJ>${cleanDestDoc}</CNPJ>\n`;
  } else if (cleanDestDoc.length === 11) {
    xml += `      <CPF>${cleanDestDoc}</CPF>\n`;
  } else {
    xml += `      <CPF>00000000000</CPF>\n`;
  }
  xml += `      <xNome>${escapeXml(order.cliente.nome || 'CONSUMIDOR FINAL')}</xNome>\n`;
  xml += `      <enderDest>\n`;
  xml += `        <xLgr>${escapeXml(order.cliente.endereco || 'RUA CLIENTE')}</xLgr>\n`;
  xml += `        <nro>${escapeXml(order.cliente.numero || 'S/N')}</nro>\n`;
  xml += `        <xBairro>${escapeXml(order.cliente.bairro || 'CENTRO')}</xBairro>\n`;
  xml += `        <cMun>3550308</cMun>\n`;
  xml += `        <xMun>${escapeXml(order.cliente.cidade || 'SAO PAULO')}</xMun>\n`;
  xml += `        <UF>${escapeXml(order.cliente.uf || 'SP')}</UF>\n`;
  xml += `        <CEP>${onlyDigits(order.cliente.cep) || '01001000'}</CEP>\n`;
  xml += `        <cPais>1058</cPais>\n`;
  xml += `        <xPais>Brasil</xPais>\n`;
  if (order.cliente.telefone) {
    xml += `        <fone>${onlyDigits(order.cliente.telefone)}</fone>\n`;
  }
  xml += `      </enderDest>\n`;
  xml += `      <indIEDest>9</indIEDest>\n`; // 9 = Não Contribuinte
  if (order.cliente.email) {
    xml += `      <email>${escapeXml(order.cliente.email)}</email>\n`;
  }
  xml += `    </dest>\n`;

  // <det> Itens (Peças)
  pecas.forEach((peca, idx) => {
    const itemNum = idx + 1;
    const vProd = Number((peca.qtd * peca.preco).toFixed(2));
    const ncm = onlyDigits(peca.ncm) || '87082999'; // Peças e acessórios de veículos
    const cfop = onlyDigits(peca.cfop) || onlyDigits(config.cfopPadraoPecas) || '5102'; // 5102 = Venda de mercadoria adquirida
    const csosn = peca.csosn || '102'; // 102 = Tributada pelo Simples Nacional sem permissão de crédito

    xml += `    <det nItem="${itemNum}">\n`;
    xml += `      <prod>\n`;
    xml += `        <cProd>${escapeXml(peca.codigo || `PEC-${itemNum}`)}</cProd>\n`;
    xml += `        <cEAN>SEM GTIN</cEAN>\n`;
    xml += `        <xProd>${escapeXml(peca.descricao)}</xProd>\n`;
    xml += `        <NCM>${ncm}</NCM>\n`;
    xml += `        <CFOP>${cfop}</CFOP>\n`;
    xml += `        <uCom>${escapeXml(peca.unidade || 'UN')}</uCom>\n`;
    xml += `        <qCom>${peca.qtd.toFixed(4)}</qCom>\n`;
    xml += `        <vUnCom>${peca.preco.toFixed(4)}</vUnCom>\n`;
    xml += `        <vProd>${vProd.toFixed(2)}</vProd>\n`;
    xml += `        <cEANTrib>SEM GTIN</cEANTrib>\n`;
    xml += `        <uTrib>${escapeXml(peca.unidade || 'UN')}</uTrib>\n`;
    xml += `        <qTrib>${peca.qtd.toFixed(4)}</qTrib>\n`;
    xml += `        <vUnTrib>${peca.preco.toFixed(4)}</vUnTrib>\n`;
    xml += `        <indTot>1</indTot>\n`;
    xml += `      </prod>\n`;
    xml += `      <imposto>\n`;
    xml += `        <vTotTrib>${(vProd * (aliquotaMedia / 100)).toFixed(2)}</vTotTrib>\n`;
    xml += `        <ICMS>\n`;
    if (crt === '1') {
      xml += `          <ICMSSN102>\n`;
      xml += `            <orig>0</orig>\n`; // 0 = Nacional
      xml += `            <CSOSN>${csosn}</CSOSN>\n`;
      xml += `          </ICMSSN102>\n`;
    } else {
      xml += `          <ICMS00>\n`;
      xml += `            <orig>0</orig>\n`;
      xml += `            <CST>00</CST>\n`;
      xml += `            <modBC>3</modBC>\n`;
      xml += `            <vBC>${vProd.toFixed(2)}</vBC>\n`;
      xml += `            <pICMS>18.00</pICMS>\n`;
      xml += `            <vICMS>${(vProd * 0.18).toFixed(2)}</vICMS>\n`;
      xml += `          </ICMS00>\n`;
    }
    xml += `        </ICMS>\n`;
    xml += `        <PIS>\n`;
    xml += `          <PISNT>\n`;
    xml += `            <CST>07</CST>\n`;
    xml += `          </PISNT>\n`;
    xml += `        </PIS>\n`;
    xml += `        <COFINS>\n`;
    xml += `          <COFINSNT>\n`;
    xml += `            <CST>07</CST>\n`;
    xml += `          </COFINSNT>\n`;
    xml += `        </COFINS>\n`;
    xml += `      </imposto>\n`;
    xml += `    </det>\n`;
  });

  // <total> Totais da NF-e
  xml += `    <total>\n`;
  xml += `      <ICMSTot>\n`;
  xml += `        <vBC>0.00</vBC>\n`;
  xml += `        <vICMS>0.00</vICMS>\n`;
  xml += `        <vICMSDeson>0.00</vICMSDeson>\n`;
  xml += `        <vFCPUFDest>0.00</vFCPUFDest>\n`;
  xml += `        <vICMSUFDest>0.00</vICMSUFDest>\n`;
  xml += `        <vICMSUFRemet>0.00</vICMSUFRemet>\n`;
  xml += `        <vFCP>0.00</vFCP>\n`;
  xml += `        <vBCST>0.00</vBCST>\n`;
  xml += `        <vST>0.00</vST>\n`;
  xml += `        <vFCPST>0.00</vFCPST>\n`;
  xml += `        <vFCPSTRet>0.00</vFCPSTRet>\n`;
  xml += `        <vProd>${totalPecas.toFixed(2)}</vProd>\n`;
  xml += `        <vFrete>0.00</vFrete>\n`;
  xml += `        <vSeg>0.00</vSeg>\n`;
  xml += `        <vDesc>${totalDesconto.toFixed(2)}</vDesc>\n`;
  xml += `        <vII>0.00</vII>\n`;
  xml += `        <vIPI>0.00</vIPI>\n`;
  xml += `        <vIPIDevol>0.00</vIPIDevol>\n`;
  xml += `        <vPIS>0.00</vPIS>\n`;
  xml += `        <vCOFINS>0.00</vCOFINS>\n`;
  xml += `        <vOutro>0.00</vOutro>\n`;
  xml += `        <vNF>${totalPecas.toFixed(2)}</vNF>\n`;
  xml += `        <vTotTrib>${valorTributos.toFixed(2)}</vTotTrib>\n`;
  xml += `      </ICMSTot>\n`;
  if (totalServicos > 0) {
    xml += `      <ISSQNtot>\n`;
    xml += `        <vServ>${totalServicos.toFixed(2)}</vServ>\n`;
    xml += `        <vBC>${totalServicos.toFixed(2)}</vBC>\n`;
    xml += `        <vISS>${(totalServicos * 0.03).toFixed(2)}</vISS>\n`;
    xml += `      </ISSQNtot>\n`;
  }
  xml += `    </total>\n`;

  // <transp> Transporte
  xml += `    <transp>\n`;
  xml += `      <modFrete>9</modFrete>\n`; // 9 = Sem ocorrência de transporte
  xml += `    </transp>\n`;

  // <pag> Forma de Pagamento
  const tPag = mapFormaPagamentoParaSefaz(order.pagamento.forma);
  xml += `    <pag>\n`;
  xml += `      <detPag>\n`;
  xml += `        <tPag>${tPag}</tPag>\n`;
  xml += `        <vPag>${totalNF.toFixed(2)}</vPag>\n`;
  xml += `      </detPag>\n`;
  xml += `    </pag>\n`;

  // <infAdic> Informações Adicionais
  const infoVeiculo = order.veiculo ? `Veículo: ${order.veiculo.marca} ${order.veiculo.modelo} | Placa: ${order.veiculo.matricula} | KM: ${order.veiculo.kmEntrada || 'N/I'}.` : '';
  const obsComplementares = `OS #${order.numeroOS}. ${infoVeiculo} Tributos aproximados: R$ ${valorTributos.toFixed(2)} (${aliquotaMedia}% Fonte: IBPT Lei 12.741/2012). Documento emitido por ME ou EPP optante pelo Simples Nacional.`;

  xml += `    <infAdic>\n`;
  xml += `      <infCpl>${escapeXml(obsComplementares)}</infCpl>\n`;
  xml += `    </infAdic>\n`;

  xml += `  </infNFe>\n`;
  xml += `</NFe>`;

  return xml;
}

/**
 * Mapeia formas de pagamento do Bibicar OS para códigos oficiais SEFAZ
 */
function mapFormaPagamentoParaSefaz(forma?: string): string {
  const f = (forma || '').toUpperCase();
  if (f.includes('DINHEIRO')) return '01';
  if (f.includes('CHEQUE')) return '02';
  if (f.includes('CRÉDITO') || f.includes('CREDITO')) return '03';
  if (f.includes('DÉBITO') || f.includes('DEBITO')) return '04';
  if (f.includes('BOLETO')) return '15';
  if (f.includes('PIX')) return '17';
  return '99'; // Outros
}

/**
 * Escapa caracteres reservados para XML seguro
 */
function escapeXml(unsafe?: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Faz download do arquivo XML da NF-e no navegador
 */
export function downloadNFeXml(xmlContent: string, chaveAcesso: string, numeroNFe: string): void {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `NFe_${numeroNFe}_${chaveAcesso.substring(0, 10)}.xml`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
