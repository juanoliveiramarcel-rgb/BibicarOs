import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceOrder, WorkshopConfig } from '../types';
import { calculateOrderTotals, formatCurrency, formatDate } from './formatters';

/**
 * Normaliza e sanitiza qualquer texto para renderização 100% perfeita em UTF-8 no jsPDF.
 * - Converte decomposição Unicode (NFD) para pré-composta (NFC) unindo diacríticos (ç, ã, é, ó, etc.).
 * - Substitui caracteres tipográficos que falham na fonte Helvetica padrão (travessões longos, aspas curvas, bullets).
 * - Remove caracteres invisíveis ou de largura zero que causam quebra incorreta de palavras no autoTable.
 */
export function sanitizePdfText(input: unknown): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // 1. Normalização Canônica (NFC): unifica diacríticos e acentos do português brasileiro
  str = str.normalize('NFC');

  // 2. Substituições seguras de caracteres tipográficos para fontes PostScript do jsPDF
  str = str
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-') // Travessões Unicode para hífen ASCII
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // Aspas simples curvas para reta
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // Aspas duplas curvas para reta
    .replace(/[\u2026]/g, '...') // Reticências
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ') // Espaços não-quebráveis para espaço padrão
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Caracteres de largura zero / BOM
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-') // Marcadores bullet para traço
    .replace(/[✓✔☑]/g, '[x]')
    .replace(/[✗✘☒]/g, '[ ]')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  return str;
}

/**
 * Divide textos longos para caber na largura máxima garantindo preservação de acentos e diacríticos.
 */
export function safeSplitText(
  doc: jsPDF,
  text: unknown,
  maxWidth: number
): string[] {
  const clean = sanitizePdfText(text);
  return doc.splitTextToSize(clean, maxWidth);
}

/**
 * Downloads a jsPDF document safely in any environment (including iframes and mobile browsers)
 * using an Object URL and HTML5 download attribute.
 */
export function downloadPdf(doc: jsPDF, fileName: string): boolean {
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
    return true;
  } catch (err) {
    console.error('Erro ao baixar PDF:', err);
    try {
      doc.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
      return true;
    } catch (saveErr) {
      console.error('Fallback save também falhou:', saveErr);
      return false;
    }
  }
}

/**
 * Returns a Blob URL for previewing or printing the PDF.
 */
export function getPdfBlobUrl(doc: jsPDF): string {
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/**
 * Generates an authentic, vector-quality A4 Service Order PDF with 100% UTF-8 support.
 * Never depends on DOM rasterization or html2canvas, completely immune to CSS color/oklch issues.
 */
export function generateServiceOrderPdfDoc(
  order: ServiceOrder,
  config: WorkshopConfig
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const totals = calculateOrderTotals(order);
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190mm
  let currentY = margin;

  const workshopNome = sanitizePdfText(config.nome || 'Oficina Mecânica');
  const workshopRazao = sanitizePdfText(config.razaoSocial || config.nome || 'Oficina Mecânica');
  const workshopEndereco = sanitizePdfText(config.endereco || 'Endereço não informado');
  const workshopCnpj = sanitizePdfText(config.cnpj || '-');
  const workshopIe = sanitizePdfText(config.inscricaoEstadual || 'ISENTO');
  const workshopTel = sanitizePdfText(config.telefone || '-');
  const workshopWhats = sanitizePdfText(config.whatsapp || config.telefone || '-');
  const workshopEmail = sanitizePdfText(config.email || '-');

  // Set Metadata com strings sanitizadas
  doc.setDocumentProperties({
    title: sanitizePdfText(`${order.tipoDoc || 'Ordem de Serviço'} #${order.numeroOS} - ${workshopNome}`),
    subject: sanitizePdfText(`OS #${order.numeroOS} - ${order.cliente?.nome || 'Cliente'}`),
    author: workshopNome,
    creator: 'Bibicar OS - Gestão de Oficina Mecânica',
  });

  // 1. TOP HEADER BOX
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, contentWidth, 26);

  // Workshop info (Left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38); // Bibicar Red
  doc.text(workshopNome.toUpperCase(), margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(workshopRazao, margin + 4, currentY + 10.5);
  doc.text(workshopEndereco, margin + 4, currentY + 14.5);
  doc.text(
    `CNPJ: ${workshopCnpj}   |   IE: ${workshopIe}`,
    margin + 4,
    currentY + 18.5
  );
  doc.text(
    `Telefone: ${workshopTel}   |   WhatsApp: ${workshopWhats}   |   E-mail: ${workshopEmail}`,
    margin + 4,
    currentY + 22.5
  );

  // Document Badge (Right side box)
  const docBoxWidth = 52;
  const docBoxX = margin + contentWidth - docBoxWidth;
  doc.setFillColor(248, 250, 252);
  doc.rect(docBoxX, currentY, docBoxWidth, 26, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizePdfText(order.tipoDoc || 'ORDEM DE SERVIÇO'), docBoxX + docBoxWidth / 2, currentY + 5.5, {
    align: 'center',
  });

  doc.setFontSize(16);
  doc.setTextColor(220, 38, 38);
  doc.text(sanitizePdfText(`#${order.numeroOS || '00000'}`), docBoxX + docBoxWidth / 2, currentY + 13, {
    align: 'center',
  });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizePdfText(`STATUS: ${order.statusOS || 'ORÇAMENTO'}`), docBoxX + docBoxWidth / 2, currentY + 19, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const dataEntradaFmt = formatDate(order.veiculo?.dataEntrada);
  doc.text(sanitizePdfText(`Entrada: ${dataEntradaFmt}`), docBoxX + docBoxWidth / 2, currentY + 23.5, {
    align: 'center',
  });

  currentY += 28;

  // 2. DADOS DO CLIENTE E DO VEÍCULO (2 Columns Grid)
  const colWidth = (contentWidth - 3) / 2;
  const blockHeight = 31;

  // Cliente Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, colWidth, blockHeight, 'FD');

  doc.setFillColor(226, 232, 240);
  doc.rect(margin, currentY, colWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(sanitizePdfText('DADOS DO CLIENTE'), margin + 3, currentY + 4);

  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);

  // Nome
  doc.setFont('helvetica', 'bold');
  doc.text('Nome:', margin + 3, currentY + 9.5);
  doc.setFont('helvetica', 'normal');
  const clienteNomeWrapped = safeSplitText(doc, order.cliente?.nome || '-', colWidth - 18);
  doc.text(clienteNomeWrapped, margin + 15, currentY + 9.5);

  // CPF / CNPJ & Telefone
  doc.setFont('helvetica', 'bold');
  doc.text('CPF/CNPJ:', margin + 3, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order.cliente?.documento || '-'), margin + 18, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Tel/Whats:', margin + 50, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order.cliente?.telefone || '-'), margin + 65, currentY + 14);

  // Endereço
  doc.setFont('helvetica', 'bold');
  doc.text('Endereço:', margin + 3, currentY + 18.5);
  doc.setFont('helvetica', 'normal');
  const endParts = [
    order.cliente?.endereco,
    order.cliente?.numero ? `Nº ${order.cliente.numero}` : null,
    order.cliente?.bairro,
    order.cliente?.cidade && order.cliente?.uf ? `${order.cliente.cidade}/${order.cliente.uf}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const endWrapped = safeSplitText(doc, endParts || '-', colWidth - 20);
  doc.text(endWrapped, margin + 18, currentY + 18.5);

  // Email & CEP
  doc.setFont('helvetica', 'bold');
  doc.text('E-mail:', margin + 3, currentY + 23);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order.cliente?.email || '-'), margin + 14, currentY + 23);

  doc.setFont('helvetica', 'bold');
  doc.text('CEP:', margin + 55, currentY + 23);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order.cliente?.cep || '-'), margin + 63, currentY + 23);

  // Veículo Box
  const col2X = margin + colWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.rect(col2X, currentY, colWidth, blockHeight, 'FD');

  doc.setFillColor(226, 232, 240);
  doc.rect(col2X, currentY, colWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(sanitizePdfText('DADOS DO VEÍCULO & ATENDIMENTO'), col2X + 3, currentY + 4);

  // Veículo Marca / Modelo
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Veículo:', col2X + 3, currentY + 9.5);
  doc.setFont('helvetica', 'normal');
  const veiculoDesc = sanitizePdfText(`${order.veiculo?.marca || ''} ${order.veiculo?.modelo || '-'}`.trim());
  doc.text(veiculoDesc, col2X + 16, currentY + 9.5);

  // Placa Badge & Ano / Cor
  doc.setFont('helvetica', 'bold');
  doc.text('Placa:', col2X + 3, currentY + 14);
  doc.setFillColor(254, 243, 199); // Amber badge for plate
  doc.rect(col2X + 13, currentY + 11.2, 24, 4.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  const placaText = sanitizePdfText(order.veiculo?.matricula?.toUpperCase() || 'SEM PLACA');
  doc.text(placaText, col2X + 14.5, currentY + 14.2);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Ano:', col2X + 41, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order.veiculo?.ano || '-'), col2X + 48, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Cor:', col2X + 65, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order.veiculo?.cor || '-'), col2X + 72, currentY + 14);

  // KM Entrada & Combustível
  doc.setFont('helvetica', 'bold');
  doc.text('KM Entrada:', col2X + 3, currentY + 18.5);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(`${order.veiculo?.kmEntrada || '-'} km`), col2X + 21, currentY + 18.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Combustível:', col2X + 48, currentY + 18.5);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order.veiculo?.combustivel || order.checklist?.nivelCombustivel || '-'), col2X + 67, currentY + 18.5);

  // Mecânico Responsável & Previsão Saída
  doc.setFont('helvetica', 'bold');
  doc.text('Mecânico Resp.:', col2X + 3, currentY + 23);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(sanitizePdfText(order.mecanicoResponsavel || 'Equipe Geral'), col2X + 25, currentY + 23);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Previsão Saída:', col2X + 53, currentY + 23);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(formatDate(order.veiculo?.dataSaida)), col2X + 75, currentY + 23);

  currentY += blockHeight + 3;

  // 3. CHECKLIST RESUMO (Horizontal bar)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 12, 'FD');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(sanitizePdfText('CHECKLIST DE ENTRADA:'), margin + 3, currentY + 4);

  const checkItems = [
    `Estepe: ${order.checklist?.temEstepe ? 'SIM [x]' : 'NÃO [ ]'}`,
    `Macaco: ${order.checklist?.temMacaco ? 'SIM [x]' : 'NÃO [ ]'}`,
    `Chave Roda: ${order.checklist?.temChaveRoda ? 'SIM [x]' : 'NÃO [ ]'}`,
    `Triângulo: ${order.checklist?.temTriangulo ? 'SIM [x]' : 'NÃO [ ]'}`,
    `Manual: ${order.checklist?.temManual ? 'SIM [x]' : 'NÃO [ ]'}`,
    `Documento: ${order.checklist?.temDocumento ? 'SIM [x]' : 'NÃO [ ]'}`,
  ];

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  let checkX = margin + 38;
  checkItems.forEach((chk) => {
    doc.text(sanitizePdfText(chk), checkX, currentY + 4);
    checkX += 25;
  });

  // Observations / Damages
  const avariasTxt = order.checklist?.avariasIdentificadas || 'Nenhuma avaria declarada na entrada.';
  const pertencesTxt = order.checklist?.pertencesDeixados ? ` | Pertences: ${order.checklist.pertencesDeixados}` : '';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  const avariasWrapped = safeSplitText(doc, `Avarias / Obs: ${avariasTxt}${pertencesTxt}`, contentWidth - 6);
  doc.text(avariasWrapped, margin + 3, currentY + 8.5);

  currentY += 14;

  // 4. SERVIÇOS E MÃO DE OBRA (AutoTable)
  const servicosRows = (order.servicos && order.servicos.length > 0)
    ? order.servicos.map((s, idx) => [
        (idx + 1).toString().padStart(2, '0'),
        sanitizePdfText(s.descricao || '-'),
        sanitizePdfText(s.mecanico || order.mecanicoResponsavel || 'Geral'),
        formatCurrency(s.valor || 0),
      ])
    : [['01', 'Nenhum serviço discriminado', '-', 'R$ 0,00']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      '#',
      sanitizePdfText('MÃO DE OBRA / DESCRIÇÃO DOS SERVIÇOS'),
      sanitizePdfText('MECÂNICO'),
      'VALOR',
    ]],
    body: servicosRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      overflow: 'linebreak',
    },
    didParseCell: (data) => {
      if (typeof data.cell.raw === 'string') {
        data.cell.text = [sanitizePdfText(data.cell.raw)];
      }
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'left' },
      3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    foot: [
      [
        '',
        sanitizePdfText('SUBTOTAL DE MÃO DE OBRA & SERVIÇOS'),
        '',
        formatCurrency(totals.totalServicos),
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'right',
      cellPadding: 2,
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  if (currentY > 230) {
    doc.addPage();
    currentY = margin;
  }

  // 5. PEÇAS E MATERIAIS APLICADOS (AutoTable)
  const pecasRows = (order.pecas && order.pecas.length > 0)
    ? order.pecas.map((p, idx) => {
        const itemTotal = (Number(p.qtd) || 0) * (Number(p.preco) || 0);
        return [
          (idx + 1).toString().padStart(2, '0'),
          sanitizePdfText(p.descricao || '-'),
          sanitizePdfText(p.unidade || 'UN'),
          p.qtd?.toString() || '1',
          formatCurrency(p.preco || 0),
          formatCurrency(itemTotal),
        ];
      })
    : [['01', 'Nenhuma peça discriminada', 'UN', '0', 'R$ 0,00', 'R$ 0,00']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      '#',
      sanitizePdfText('PEÇAS, LUBRIFICANTES E MATERIAIS APLICADOS'),
      'UN',
      'QTD',
      'UNITÁRIO',
      'TOTAL',
    ]],
    body: pecasRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      overflow: 'linebreak',
    },
    didParseCell: (data) => {
      if (typeof data.cell.raw === 'string') {
        data.cell.text = [sanitizePdfText(data.cell.raw)];
      }
    },
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    foot: [
      [
        '',
        sanitizePdfText('SUBTOTAL DE PEÇAS & MATERIAIS'),
        '',
        '',
        '',
        formatCurrency(totals.totalPecas),
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'right',
      cellPadding: 2,
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  if (currentY > 215) {
    doc.addPage();
    currentY = margin;
  }

  // 6. TOTAIS, PAGAMENTO E OBSERVAÇÕES
  const summaryBoxWidth = 85;
  const summaryBoxX = margin + contentWidth - summaryBoxWidth;
  const summaryBoxHeight = 32;

  // Left card: Observações & Condição de Pagamento
  const obsWidth = contentWidth - summaryBoxWidth - 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, obsWidth, summaryBoxHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(sanitizePdfText('CONDIÇÕES DE PAGAMENTO & OBSERVAÇÕES'), margin + 3, currentY + 4.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Forma de Pagamento:', margin + 3, currentY + 10);
  doc.setFont('helvetica', 'normal');
  const pgtoStr = sanitizePdfText(`${order.pagamento?.forma || 'A COMBINAR'}  -  ${order.pagamento?.prazo || 'À VISTA'}`);
  doc.text(pgtoStr, margin + 34, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Observações:', margin + 3, currentY + 15);
  doc.setFont('helvetica', 'normal');
  const obsText = order.pagamento?.observacoes || 'Nenhuma observação adicional.';
  const obsWrapped = safeSplitText(doc, obsText, obsWidth - 6);
  doc.text(obsWrapped, margin + 3, currentY + 19);

  // Right card: Totais Financeiros
  doc.setFillColor(248, 250, 252);
  doc.rect(summaryBoxX, currentY, summaryBoxWidth, summaryBoxHeight, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(sanitizePdfText('Total em Serviços:'), summaryBoxX + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totals.totalServicos), summaryBoxX + summaryBoxWidth - 4, currentY + 5.5, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText('Total em Peças:'), summaryBoxX + 4, currentY + 10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totals.totalPecas), summaryBoxX + summaryBoxWidth - 4, currentY + 10.5, {
    align: 'right',
  });

  if (totals.desconto > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(sanitizePdfText('Desconto Concedido:'), summaryBoxX + 4, currentY + 15.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`- ${formatCurrency(totals.desconto)}`, summaryBoxX + summaryBoxWidth - 4, currentY + 15.5, {
      align: 'right',
    });
  }

  // TOTAL GERAL BANNER
  doc.setFillColor(30, 41, 59);
  doc.rect(summaryBoxX + 2, currentY + 19, summaryBoxWidth - 4, 11, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL GERAL:', summaryBoxX + 6, currentY + 26);

  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(formatCurrency(totals.totalGeral), summaryBoxX + summaryBoxWidth - 6, currentY + 26.5, {
    align: 'right',
  });

  currentY += summaryBoxHeight + 4;

  // 7. TERMO DE GARANTIA & CONDIÇÕES LEGAIS
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, currentY, contentWidth, 16, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text(sanitizePdfText('TERMO DE GARANTIA E ACEITE DOS SERVIÇOS (CDC ART. 26)'), margin + 3, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  const garantiaText =
    config.termoGarantia ||
    'Autorizo a realização dos serviços e fornecimento das peças descritas. Os serviços executados e peças substituídas gozam de garantia legal de 90 dias (CDC Art. 26), salvo desgaste natural por rodagem ou mau uso. Veículo liberado apenas mediante quitação total dos valores acordados.';
  const garantiaWrapped = safeSplitText(doc, garantiaText, contentWidth - 6);
  doc.text(garantiaWrapped, margin + 3, currentY + 7.5);

  currentY += 19;

  // 8. CAMPOS DE ASSINATURA
  const sigWidth = 80;
  const sig1X = margin + 10;
  const sig2X = margin + contentWidth - sigWidth - 10;

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(sig1X, currentY + 8, sig1X + sigWidth, currentY + 8);
  doc.line(sig2X, currentY + 8, sig2X + sigWidth, currentY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text(sanitizePdfText('ASSINATURA DO CLIENTE / PROPRIETÁRIO'), sig1X + sigWidth / 2, currentY + 11.5, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('Data: ____ / ____ / ________', sig1X + sigWidth / 2, currentY + 14.5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(sanitizePdfText('RESPONSÁVEL TÉCNICO'), sig2X + sigWidth / 2, currentY + 11.5, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  const techWorkshopSignature = sanitizePdfText((config.nome || config.razaoSocial || 'Oficina Mecânica').toUpperCase());
  doc.text(techWorkshopSignature, sig2X + sigWidth / 2, currentY + 14.5, {
    align: 'center',
  });

  // Footer page numbers across all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    const footerMsg = sanitizePdfText(
      `Página ${i} de ${pageCount}  -  Bibicar OS - Gestão de Oficina Mecânica  -  Documento gerado eletronicamente`
    );
    doc.text(footerMsg, pageWidth / 2, 292, { align: 'center' });
  }

  return doc;
}

/**
 * Generates an official, blank inspection sheet (Ficha de Vistoria de Entrada)
 * with inspection checkboxes, fuel gauge, and damage diagram with 100% UTF-8 support.
 */
export function generateBlankInspectionPdfDoc(
  order: ServiceOrder | null,
  config: WorkshopConfig
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const workshopNome = sanitizePdfText(config.nome || 'Oficina Mecânica');
  const workshopEndereco = sanitizePdfText(config.endereco || 'Endereço não informado');
  const workshopTel = sanitizePdfText(config.telefone || '-');
  const workshopCnpj = sanitizePdfText(config.cnpj || '-');
  const workshopEmail = sanitizePdfText(config.email || '-');

  doc.setDocumentProperties({
    title: sanitizePdfText(`Ficha de Vistoria e Checklist - ${workshopNome}`),
    subject: 'Vistoria de Entrada de Veículo',
    author: workshopNome,
    creator: 'Bibicar OS - Gestão de Oficina Mecânica',
  });

  // Header Box
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, contentWidth, 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.text(workshopNome.toUpperCase(), margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(sanitizePdfText('FICHA DE VISTORIA E CHECKLIST DE ENTRADA DO VEÍCULO'), margin + 4, currentY + 11);
  doc.text(sanitizePdfText(`${workshopEndereco}  -  Telefone: ${workshopTel}`), margin + 4, currentY + 15.5);
  doc.text(sanitizePdfText(`CNPJ: ${workshopCnpj}  -  E-mail: ${workshopEmail}`), margin + 4, currentY + 19.5);

  // Document Badge
  const docBoxWidth = 52;
  const docBoxX = margin + contentWidth - docBoxWidth;
  doc.setFillColor(248, 250, 252);
  doc.rect(docBoxX, currentY, docBoxWidth, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizePdfText('CHECKLIST ENTRADA'), docBoxX + docBoxWidth / 2, currentY + 6, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  const badgeTitle = order?.numeroOS ? `OS #${order.numeroOS}` : 'VISTORIA AVULSA';
  doc.text(sanitizePdfText(badgeTitle), docBoxX + docBoxWidth / 2, currentY + 14, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  const dataHoje = order?.veiculo?.dataEntrada ? formatDate(order.veiculo.dataEntrada) : formatDate(new Date().toISOString());
  doc.text(sanitizePdfText(`Data: ${dataHoje}`), docBoxX + docBoxWidth / 2, currentY + 20, { align: 'center' });

  currentY += 26;

  // Client & Vehicle Header Info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 24, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  // Row 1
  doc.text('Cliente:', margin + 3, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order?.cliente?.nome || '________________________________________________'), margin + 16, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Telefone:', margin + 115, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order?.cliente?.telefone || '(____) ____________'), margin + 130, currentY + 5.5);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Veículo:', margin + 3, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  const veiculoModeloStr = order?.veiculo?.marca && order?.veiculo?.modelo
    ? `${order.veiculo.marca} ${order.veiculo.modelo}`
    : '________________________________';
  doc.text(sanitizePdfText(veiculoModeloStr), margin + 16, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Placa:', margin + 85, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order?.veiculo?.matricula?.toUpperCase() || '___________'), margin + 96, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Ano / Cor:', margin + 125, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    sanitizePdfText(`${order?.veiculo?.ano || '____'} / ${order?.veiculo?.cor || '____'}`),
    margin + 142,
    currentY + 11.5
  );

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('KM Entrada:', margin + 3, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order?.veiculo?.kmEntrada ? `${order.veiculo.kmEntrada} km` : '___________ km'), margin + 22, currentY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Mecânico Resp.:', margin + 70, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order?.mecanicoResponsavel || '____________________'), margin + 94, currentY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Nível Combustível:', margin + 135, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(order?.checklist?.nivelCombustivel || '[ ] R  [ ] 1/4  [ ] 1/2  [ ] 3/4  [ ] F'), margin + 162, currentY + 17.5);

  currentY += 27;

  // CHECKLIST ITEMS GRID (3 COLUMNS)
  const checklistItemsCol1 = [
    'Nível do Óleo do Motor',
    'Filtro de Óleo',
    'Filtro de Ar do Motor',
    'Filtro de Combustível',
    'Filtro de Cabine (A/C)',
    'Líquido de Arrefecimento',
    'Vazamentos Aparentes',
    'Fluido de Freio',
    'Pastilhas e Discos Diant.',
    'Sapatas e Tambores Tras.',
  ];

  const checklistItemsCol2 = [
    'Pneus Dianteiros (Desgaste/Tread)',
    'Pneus Traseiros (Desgaste/Tread)',
    'Estepe (Pressão & Condição)',
    'Macaco & Chave de Roda',
    'Triângulo de Sinalização',
    'Amortecedores & Batentes',
    'Bandejas, Pivôs & Buchas',
    'Correia Dentada / Acessórios',
    'Bateria & Carga Alternador',
    'Escapamento & Catalisador',
  ];

  const checklistItemsCol3 = [
    'Faróis Principais (Alto/Baixo)',
    'Lanternas & Luz de Freio',
    'Setas & Pisca-Alerta',
    'Limpador de Para-brisa (Palhetas)',
    'Buzina & Painel de Instrumentos',
    'Ar-Condicionado (Eficiência)',
    'Travas & Vidros Elétricos',
    'Manual do Proprietário',
    'Documento do Veículo (CRLV)',
    'Alarme & Chave Reserva',
  ];

  const colWidthChk = contentWidth / 3;
  const colY = currentY;

  const renderCol = (items: string[], colX: number, title: string) => {
    doc.setFillColor(30, 41, 59);
    doc.rect(colX, colY, colWidthChk - 2, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(sanitizePdfText(title), colX + 3, colY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);

    let itemY = colY + 8;
    items.forEach((item) => {
      doc.setDrawColor(100, 116, 139);
      doc.rect(colX + 2, itemY - 2.5, 3, 3);
      doc.text(sanitizePdfText(item), colX + 7, itemY);
      itemY += 5;
    });
  };

  renderCol(checklistItemsCol1, margin, 'LUBRIFICAÇÃO & FREIOS');
  renderCol(checklistItemsCol2, margin + colWidthChk, 'SUSPENSÃO & SEGURANÇA');
  renderCol(checklistItemsCol3, margin + colWidthChk * 2, 'ELÉTRICA & ACESSÓRIOS');

  currentY = colY + 60;

  // VISUAL DAMAGE INSPECTION DIAGRAM & PRE-EXISTING OBSERVATIONS
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 38, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(sanitizePdfText('MAPA DE AVARIAS, RISCOS E AMASSADOS PRÉ-EXISTENTES'), margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    sanitizePdfText('Legenda para anotação: (A) Amassado   (R) Risco/Arranhão   (T) Trinca no Vidro   (Q) Quebrado   (F) Falta Peça'),
    margin + 3,
    currentY + 8.5
  );

  const boxW = 34;
  const boxH = 14;
  const startBoxX = margin + 4;
  const boxY = currentY + 11;

  const sections = [
    { label: 'FRENTE / CAPÔ', x: startBoxX },
    { label: 'LAT. ESQUERDA', x: startBoxX + boxW + 4 },
    { label: 'TETO', x: startBoxX + (boxW + 4) * 2 },
    { label: 'LAT. DIREITA', x: startBoxX + (boxW + 4) * 3 },
    { label: 'TRASEIRA / PORTA-MALAS', x: startBoxX + (boxW + 4) * 4 },
  ];

  sections.forEach((sec) => {
    doc.setDrawColor(148, 163, 184);
    doc.rect(sec.x, boxY, boxW, boxH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizePdfText(sec.label), sec.x + boxW / 2, boxY + 4, { align: 'center' });
  });

  // Notes on damages and belongings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Pertences deixados no veículo:', margin + 4, currentY + 29);
  doc.setFont('helvetica', 'normal');
  const pertencesText = order?.checklist?.pertencesDeixados || '__________________________________________________________________________________________';
  doc.text(sanitizePdfText(pertencesText), margin + 42, currentY + 29);

  doc.setFont('helvetica', 'bold');
  doc.text('Avarias relatadas pelo cliente:', margin + 4, currentY + 34);
  doc.setFont('helvetica', 'normal');
  const avariasRelatadas = order?.checklist?.avariasIdentificadas || '__________________________________________________________________________________________';
  doc.text(sanitizePdfText(avariasRelatadas), margin + 42, currentY + 34);

  currentY += 42;

  // SIGNATURES & AUTHORIZATION
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 26, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text(sanitizePdfText('DECLARAÇÃO DE RECEPÇÃO E AUTORIZAÇÃO DE VISTORIA'), margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  const decVistoria = sanitizePdfText(
    'Declaro que as informações e o estado do veículo descritos nesta ficha de vistoria conferem com o estado atual no momento da entrega do veículo na oficina Bibicar Automotivo. Autorizo a execução de testes práticos em via pública se necessário para o diagnóstico técnico.'
  );
  const decVistoriaWrapped = safeSplitText(doc, decVistoria, contentWidth - 6);
  doc.text(decVistoriaWrapped, margin + 3, currentY + 8.5);

  const sigWidth = 80;
  const sig1X = margin + 10;
  const sig2X = margin + contentWidth - sigWidth - 10;

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(sig1X, currentY + 19, sig1X + sigWidth, currentY + 19);
  doc.line(sig2X, currentY + 19, sig2X + sigWidth, currentY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(51, 65, 85);
  doc.text(sanitizePdfText('ASSINATURA DO CLIENTE'), sig1X + sigWidth / 2, currentY + 22.5, { align: 'center' });
  const inspectionReceptionSign = sanitizePdfText(`RECEPCIONADO POR (${(config.nome || config.razaoSocial || 'OFICINA').toUpperCase()})`);
  doc.text(inspectionReceptionSign, sig2X + sigWidth / 2, currentY + 22.5, { align: 'center' });

  // Page footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  const footerVistoria = sanitizePdfText(
    `Ficha de Vistoria Oficial  -  Bibicar OS - Gestão de Oficina Mecânica  -  Impresso em ${new Date().toLocaleDateString('pt-BR')}`
  );
  doc.text(footerVistoria, pageWidth / 2, 292, { align: 'center' });

  return doc;
}

/**
 * Generates an oil change sticker document in PDF (format standard 90x60mm label) with 100% UTF-8 support.
 */
export function generateOilStickerPdfDoc(
  order: ServiceOrder,
  config: WorkshopConfig,
  stickerData: {
    dataTroca: string;
    kmAtual: number;
    proximaData: string;
    proximoKm: number;
    oleo: string;
    filtros: string;
  }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [90, 60],
  });

  const workshopNome = sanitizePdfText(config.nome || 'Oficina Mecânica');
  const workshopTel = sanitizePdfText(config.telefone || '-');

  // Background card
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 90, 60, 'F');

  // Red Accent border
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);
  doc.rect(2, 2, 86, 56);

  // Workshop Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38);
  doc.text(workshopNome.toUpperCase(), 4, 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizePdfText(`Tel: ${workshopTel}  -  Troca de Óleo`), 4, 12);

  // Plate Badge
  doc.setFillColor(241, 245, 249);
  doc.rect(58, 4, 28, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const placaLabel = sanitizePdfText(order.veiculo?.matricula?.toUpperCase() || 'SEM PLACA');
  doc.text(placaLabel, 72, 10, { align: 'center' });

  // Current Info
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizePdfText('Data Troca:'), 4, 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizePdfText(formatDate(stickerData.dataTroca)), 18, 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizePdfText('KM Atual:'), 50, 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizePdfText(`${stickerData.kmAtual.toLocaleString('pt-BR')} km`), 63, 18);

  // Próxima Troca Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(4, 21, 82, 17, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(251, 191, 36); // Amber
  doc.text(sanitizePdfText('PRÓXIMA TROCA RECOMENDADA'), 45, 25.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(203, 213, 225);
  doc.text(sanitizePdfText('Até a data:'), 16, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(sanitizePdfText(formatDate(stickerData.proximaData)), 16, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.text(sanitizePdfText('ou'), 43, 33);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(203, 213, 225);
  doc.text(sanitizePdfText('Aos:'), 60, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(251, 191, 36);
  doc.text(sanitizePdfText(`${stickerData.proximoKm.toLocaleString('pt-BR')} km`), 60, 35.5);

  // Oil & Filters specifications
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizePdfText('Óleo:'), 4, 43);
  doc.setFont('helvetica', 'normal');
  const oleoWrapped = safeSplitText(doc, stickerData.oleo, 70);
  doc.text(oleoWrapped, 12, 43);

  doc.setFont('helvetica', 'bold');
  doc.text(sanitizePdfText('Filtros:'), 4, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(stickerData.filtros || 'Óleo e Ar'), 14, 48);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5);
  doc.setTextColor(148, 163, 184);
  const dicaOleo = sanitizePdfText('Troque o óleo rigorosamente no prazo para garantir a vida útil do motor.');
  doc.text(dicaOleo, 45, 55, { align: 'center' });

  return doc;
}

/**
 * Downloads a Service Order directly as PDF.
 */
export async function downloadServiceOrderPdf(
  order: ServiceOrder,
  config: WorkshopConfig
): Promise<boolean> {
  try {
    const doc = generateServiceOrderPdfDoc(order, config);
    const cleanClient = sanitizePdfText(order.cliente?.nome || 'cliente').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `OS_${order.numeroOS || '00000'}_${cleanClient}.pdf`;
    return downloadPdf(doc, fileName);
  } catch (err) {
    console.error('Falha ao baixar PDF da OS:', err);
    return false;
  }
}

/**
 * Downloads a Blank Inspection Sheet directly as PDF.
 */
export async function downloadBlankInspectionPdf(
  order: ServiceOrder | null,
  config: WorkshopConfig
): Promise<boolean> {
  try {
    const doc = generateBlankInspectionPdfDoc(order, config);
    const fileName = `Ficha_Vistoria_${order?.numeroOS ? `OS_${order.numeroOS}` : 'Oficina'}.pdf`;
    return downloadPdf(doc, fileName);
  } catch (err) {
    console.error('Falha ao baixar PDF da Vistoria:', err);
    return false;
  }
}

/**
 * Opens a generated PDF document in a new browser tab/window.
 * Perfect for bypassing iframe printing restrictions and viewing in native PDF reader.
 */
export function openPdfInNewTab(doc: jsPDF, _title?: string): boolean {
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
    }
    return true;
  } catch (err) {
    console.error('Falha ao abrir PDF em nova aba:', err);
    return false;
  }
}

/**
 * Legacy compatibility export for HTML element capture if needed.
 */
export async function exportElementToPdf(
  _element: HTMLElement,
  _fileName: string,
  _title?: string
): Promise<boolean> {
  console.warn('exportElementToPdf chamado. Recomenda-se downloadServiceOrderPdf');
  return false;
}

/**
 * Triggers printing safely with fallback.
 */
export function printElementSafely(
  _elementId: string,
  fallbackAction?: () => void
): boolean {
  try {
    window.print();
    return true;
  } catch (err) {
    console.warn('window.print falhou:', err);
    if (fallbackAction) {
      fallbackAction();
    }
    return false;
  }
}
