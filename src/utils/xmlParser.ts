import { InventoryItem, ParsedXmlNFe, ParsedXmlProduct } from '../types';

/**
 * Parses a standard Brazilian SEFAZ NF-e XML string into structured data
 * and correlates it with current workshop inventory.
 */
export function parseNFeXml(
  xmlContent: string,
  currentInventory: InventoryItem[],
  defaultMarkupPercent: number = 45
): ParsedXmlNFe {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Check parser error
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('O arquivo selecionado não é um XML válido ou está corrompido.');
  }

  // Helper to get text content from first tag matching name, ignoring namespace prefixes
  const getTagText = (parent: Element | Document, tagName: string): string => {
    // Try direct getElementsByTagName
    const el = parent.getElementsByTagName(tagName)[0];
    if (el && el.textContent) return el.textContent.trim();

    // Fallback: search all elements with matching localName
    const all = parent.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      if (all[i].localName === tagName && all[i].textContent) {
        return all[i].textContent.trim();
      }
    }
    return '';
  };

  // Header data
  const numeroNF = getTagText(xmlDoc, 'nNF') || `NF-${Date.now().toString().slice(-6)}`;
  const serie = getTagText(xmlDoc, 'serie');
  const dataEmissao = getTagText(xmlDoc, 'dhEmi') || getTagText(xmlDoc, 'dEmi') || new Date().toISOString().split('T')[0];

  // Emitente (Fornecedor)
  let emitenteNome = 'Fornecedor Desconhecido';
  let emitenteCnpj = '';

  const emitList = xmlDoc.getElementsByTagName('emit');
  const emit = emitList.length > 0 ? emitList[0] : null;
  if (emit) {
    emitenteNome = getTagText(emit, 'xNome') || getTagText(emit, 'xFant') || emitenteNome;
    emitenteCnpj = getTagText(emit, 'CNPJ') || getTagText(emit, 'CPF') || '';
  }

  // Total da Nota
  const vNFTxt = getTagText(xmlDoc, 'vNF');
  const valorTotalNota = parseFloat(vNFTxt.replace(',', '.')) || 0;

  // Detalhes dos Produtos (<det> -> <prod>)
  const detList = xmlDoc.getElementsByTagName('det');
  const products: ParsedXmlProduct[] = [];

  for (let i = 0; i < detList.length; i++) {
    const det = detList[i];
    const prodList = det.getElementsByTagName('prod');
    const prod = prodList.length > 0 ? prodList[0] : null;
    if (!prod) continue;

    const codigo = (getTagText(prod, 'cProd') || `XML-${i + 1}`).toUpperCase();
    const descricao = (getTagText(prod, 'xProd') || 'PRODUTO SEM DESCRIÇÃO').toUpperCase();
    const ncm = getTagText(prod, 'NCM');
    const unidadeRaw = (getTagText(prod, 'uCom') || 'UN').toUpperCase();
    
    // Normalize units
    let unidade = unidadeRaw;
    if (unidadeRaw.includes('LITRO') || unidadeRaw === 'LT' || unidadeRaw === 'L') unidade = 'L';
    else if (unidadeRaw === 'PC' || unidadeRaw === 'PÇ' || unidadeRaw === 'UND' || unidadeRaw === 'UNID') unidade = 'UN';
    else if (unidadeRaw === 'JG' || unidadeRaw === 'JOGO') unidade = 'JG';
    else if (unidadeRaw === 'KT' || unidadeRaw === 'KIT') unidade = 'KIT';

    const qComTxt = getTagText(prod, 'qCom');
    const quantidade = parseFloat(qComTxt.replace(',', '.')) || 1;

    const vUnComTxt = getTagText(prod, 'vUnCom');
    const precoCusto = parseFloat(vUnComTxt.replace(',', '.')) || 0;

    // Calculate suggested sell price with markup
    const markupFactor = 1 + defaultMarkupPercent / 100;
    const precoVendaSugerido = Math.round(precoCusto * markupFactor * 100) / 100;

    // Check if item already exists in inventory (by exact code or exact description)
    const existing = currentInventory.find(
      (inv) =>
        inv.codigo.trim().toUpperCase() === codigo ||
        inv.descricao.trim().toUpperCase() === descricao
    );

    products.push({
      codigo,
      descricao,
      ncm,
      unidade,
      quantidade,
      precoCusto,
      precoVendaSugerido: existing ? existing.precoVenda : precoVendaSugerido,
      jaExiste: !!existing,
      itemExistenteId: existing?.id,
      acao: existing ? 'ATUALIZAR' : 'CADASTRAR',
    });
  }

  if (products.length === 0) {
    throw new Error('Nenhum produto válido foi encontrado dentro da tag <det><prod> desta NF-e.');
  }

  return {
    numeroNF,
    serie,
    dataEmissao,
    emitenteNome,
    emitenteCnpj,
    produtos: products,
    valorTotalNota,
  };
}
