import { ServiceOrder, WorkshopConfig } from '../types';

export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseCurrency(valStr: string | number | null | undefined): number {
  if (typeof valStr === 'number') return isNaN(valStr) ? 0 : valStr;
  if (!valStr) return 0;
  const clean = valStr.toString().replace(/[^\d]/g, '');
  if (!clean) return 0;
  return parseFloat(clean) / 100;
}

export function maskPhone(value: string): string {
  let v = value.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length <= 10) {
    // (11) 4444-5555
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
  } else {
    // (11) 99999-9999
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d{4})$/, '$1-$2');
  }
  return v;
}

export function maskCep(value: string): string {
  let v = value.replace(/\D/g, '');
  if (v.length > 8) v = v.substring(0, 8);
  if (v.length > 5) {
    v = v.replace(/^(\d{5})(\d)/, '$1-$2');
  }
  return v;
}

export async function fetchAddressByCep(cep: string): Promise<{
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
} | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return { erro: true };
    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
    };
  } catch (err) {
    console.error('Erro ao buscar CEP:', err);
    return null;
  }
}

export function maskYearModel(value: string): string {
  // Cleans anything except digits and slash
  const rawDigits = value.replace(/[^\d]/g, '');
  if (!rawDigits) return '';
  if (rawDigits.length <= 4) {
    return rawDigits;
  }
  // If user entered more than 4 digits, insert the slash
  const firstYear = rawDigits.substring(0, 4);
  const secondYear = rawDigits.substring(4, 8);
  return `${firstYear}/${secondYear}`;
}

export function formatCurrencyPlain(value: number | string | null | undefined): string {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function maskDocument(value: string): string {
  let v = value.replace(/\D/g, '');
  if (v.length <= 11) {
    // CPF 000.000.000-00
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ 00.000.000/0000-00
    v = v.substring(0, 14);
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
  }
  return v;
}

export function maskLicensePlate(value: string): string {
  let v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return v.substring(0, 7);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function calculateOrderTotals(order: {
  servicos?: { valor?: number }[];
  pecas?: { qtd?: number; preco?: number }[];
  pagamento?: { desconto?: number };
}) {
  const totalServicos = (order.servicos || []).reduce(
    (acc, s) => acc + (Number(s.valor) || 0),
    0
  );
  const totalPecas = (order.pecas || []).reduce(
    (acc, p) => acc + (Number(p.qtd) || 0) * (Number(p.preco) || 0),
    0
  );
  const desconto = Number(order.pagamento?.desconto) || 0;
  const subtotalBruto = totalServicos + totalPecas;
  const totalGeral = Math.max(0, subtotalBruto - desconto);

  return {
    totalServicos,
    totalPecas,
    subtotalBruto,
    desconto,
    totalGeral,
  };
}

export function generateWhatsAppMessage(order: ServiceOrder, config: WorkshopConfig): string {
  const totals = calculateOrderTotals(order);
  const clientePrimeiroNome = order.cliente.nome.split(' ')[0] || 'Cliente';
  const carro = [order.veiculo.marca, order.veiculo.modelo, order.veiculo.matricula ? `(${order.veiculo.matricula})` : '']
    .filter(Boolean)
    .join(' ');

  let msg = `Olá, *${clientePrimeiroNome}*! Tudo bem?\n`;
  msg += `Aqui é da oficina *${config.nome}*.\n\n`;

  if (order.tipoDoc === 'ORÇAMENTO') {
    msg += `📋 *ORÇAMENTO #${order.numeroOS}*\n`;
  } else {
    msg += `🔧 *ORDEM DE SERVIÇO #${order.numeroOS}* (${order.statusOS})\n`;
  }

  msg += `🚗 *Veículo:* ${carro}\n`;
  if (order.veiculo.kmEntrada) {
    msg += `⏱️ *Km Entrada:* ${order.veiculo.kmEntrada} km\n`;
  }
  msg += `📅 *Data Entrada:* ${formatDate(order.veiculo.dataEntrada)}\n\n`;

  if (order.servicos && order.servicos.length > 0) {
    msg += `🛠️ *Mão de Obra e Serviços:*\n`;
    order.servicos.forEach((s) => {
      msg += `• ${s.descricao}: ${formatCurrency(s.valor)}\n`;
    });
    msg += `_Subtotal Serviços: ${formatCurrency(totals.totalServicos)}_\n\n`;
  }

  if (order.pecas && order.pecas.length > 0) {
    msg += `📦 *Peças e Materiais:*\n`;
    order.pecas.forEach((p) => {
      const tot = (Number(p.qtd) || 0) * (Number(p.preco) || 0);
      msg += `• ${p.qtd}x ${p.descricao}: ${formatCurrency(tot)}\n`;
    });
    msg += `_Subtotal Peças: ${formatCurrency(totals.totalPecas)}_\n\n`;
  }

  if (totals.desconto > 0) {
    msg += `🎁 *Desconto Especial:* -${formatCurrency(totals.desconto)}\n`;
  }

  msg += `💰 *VALOR TOTAL: ${formatCurrency(totals.totalGeral)}*\n`;

  if (order.pagamento?.forma) {
    msg += `💳 *Condições:* ${order.pagamento.forma} ${order.pagamento.prazo ? `(${order.pagamento.prazo})` : ''}\n`;
  }

  if (order.pagamento?.observacoes) {
    msg += `📝 *Obs:* ${order.pagamento.observacoes}\n`;
  }

  msg += `\n🛡️ *Garantia:* 90 dias conforme CDC.\n`;
  msg += `Qualquer dúvida estamos à disposição!\n`;
  msg += `📞 Telefone: ${config.telefone}`;

  return msg;
}

export function generateWhatsAppReadyMessage(order: ServiceOrder, config: WorkshopConfig): string {
  const totals = calculateOrderTotals(order);
  const clientePrimeiroNome = order.cliente.nome.split(' ')[0] || 'Cliente';
  const carro = [order.veiculo.marca, order.veiculo.modelo, order.veiculo.matricula ? `(${order.veiculo.matricula})` : '']
    .filter(Boolean)
    .join(' ');

  let msg = `Olá, *${clientePrimeiroNome}*! Tudo bem?\n`;
  msg += `Boas notícias da oficina *${config.nome}*! 🚗✨\n\n`;
  msg += `Seu veículo *${carro}* teve os serviços concluídos com sucesso e já está *PRONTO PARA RETIRADA*! ✅\n\n`;
  msg += `📋 *OS Nº:* #${order.numeroOS}\n`;
  msg += `💰 *Valor Total:* ${formatCurrency(totals.totalGeral)}\n`;
  if (order.pagamento?.forma) {
    msg += `💳 *Pagamento:* ${order.pagamento.forma} ${order.pagamento.prazo ? `(${order.pagamento.prazo})` : ''}\n`;
  }
  msg += `\n📍 *Endereço para retirada:*\n${config.endereco}\n`;
  msg += `⏰ *Horário de atendimento:* Segunda a Sexta das 08h às 18h\n`;
  msg += `📞 *Telefone:* ${config.telefone}\n\n`;
  msg += `Agradecemos pela preferência e confiança em nosso trabalho!`;

  return msg;
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  // Default to Brazil 55 if not present
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
}
