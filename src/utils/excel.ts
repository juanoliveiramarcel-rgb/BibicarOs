import * as XLSX from 'xlsx';
import { ServiceOrder } from '../types';
import { calculateOrderTotals, formatDate } from './formatters';

export function exportOrdersToExcel(orders: ServiceOrder[], filename = 'ordens_servico_bibicar.xlsx') {
  const rows = orders.map((o) => {
    const totals = calculateOrderTotals(o);
    const servicosStr = (o.servicos || []).map((s) => `${s.descricao} (R$ ${s.valor})`).join('; ');
    const pecasStr = (o.pecas || []).map((p) => `${p.qtd}x ${p.descricao} (R$ ${p.preco})`).join('; ');

    return {
      'Nº OS': o.numeroOS,
      'Tipo Documento': o.tipoDoc,
      'Status': o.statusOS,
      'Cliente': o.cliente?.nome || '',
      'Telefone': o.cliente?.telefone || '',
      'CPF/CNPJ': o.cliente?.documento || '',
      'E-mail': o.cliente?.email || '',
      'Endereço': o.cliente?.endereco || '',
      'Marca': o.veiculo?.marca || '',
      'Modelo': o.veiculo?.modelo || '',
      'Placa': o.veiculo?.matricula || '',
      'Ano': o.veiculo?.ano || '',
      'Cor': o.veiculo?.cor || '',
      'Km Entrada': o.veiculo?.kmEntrada || '',
      'Km Saída': o.veiculo?.kmSaida || '',
      'Data Entrada': formatDate(o.veiculo?.dataEntrada),
      'Data Saída': formatDate(o.veiculo?.dataSaida),
      'Serviços': servicosStr,
      'Total Serviços (R$)': totals.totalServicos,
      'Peças': pecasStr,
      'Total Peças (R$)': totals.totalPecas,
      'Desconto (R$)': totals.desconto,
      'Valor Total Geral (R$)': totals.totalGeral,
      'Forma de Pagamento': o.pagamento?.forma || '',
      'Prazo / Parcelas': o.pagamento?.prazo || '',
      'Observações': o.pagamento?.observacoes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordens de Serviço');

  try {
    // Abordagem Híbrida via Blob compatível com todos navegadores, Electron e WebViews locais
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (err) {
    console.warn('[Bibicar Excel] Fallback para XLSX.writeFile nativo:', err);
    XLSX.writeFile(workbook, filename);
  }
}

export function importOrdersFromExcel(
  file: File,
  currentOrders: ServiceOrder[]
): Promise<{ count: number; imported: ServiceOrder[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          resolve({ count: 0, imported: [] });
          return;
        }

        const imported: ServiceOrder[] = [];
        let highestNum = currentOrders.reduce((max, o) => {
          const num = parseInt(o.numeroOS, 10);
          return !isNaN(num) && num > max ? num : max;
        }, 0);

        jsonData.forEach((row, index) => {
          const getVal = (keys: string[]): string => {
            for (const key of Object.keys(row)) {
              const lowerKey = key.toLowerCase();
              if (keys.some((k) => lowerKey.includes(k))) {
                return String(row[key] || '').trim();
              }
            }
            return '';
          };

          const clienteNome = getVal(['cliente', 'nome', 'razao', 'razão', 'proprietário', 'proprietario']);
          const veiculoMarca = getVal(['marca', 'fabricante', 'montadora']);
          const veiculoModelo = getVal(['modelo', 'veiculo', 'veículo', 'carro', 'automovel']);
          const veiculoMatricula = getVal(['placa', 'matricula', 'matrícula']);

          if (clienteNome || veiculoModelo || veiculoMatricula) {
            highestNum++;
            const numeroOS = getVal(['nº os', 'num os', 'numero os', 'ordem', 'os']) ||
              highestNum.toString().padStart(5, '0');

            let dataEntrada = getVal(['data', 'entrada', 'criacao', 'emissão', 'emissao']);
            if (!dataEntrada) {
              dataEntrada = new Date().toISOString().split('T')[0];
            } else if (dataEntrada.includes('/')) {
              const parts = dataEntrada.split('/');
              if (parts.length === 3 && parts[2].length === 4) {
                dataEntrada = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }

            const descServico = getVal(['serviço', 'servico', 'descrição', 'descricao', 'historico', 'reparo', 'problema']);
            const valorTotalStr = getVal(['valor', 'total', 'preco', 'preço', 'custo', 'orcamento', 'orçamento']);

            const parseVal = (str: string): number => {
              if (!str) return 0;
              let limpo = str.replace('R$', '').replace('r$', '').trim();
              if (limpo.includes(',') && limpo.includes('.')) {
                limpo = limpo.replace(/\./g, '').replace(',', '.');
              } else if (limpo.includes(',')) {
                limpo = limpo.replace(',', '.');
              }
              const parsed = parseFloat(limpo);
              return isNaN(parsed) ? 0 : parsed;
            };

            const valorNum = parseVal(valorTotalStr);
            const statusRaw = getVal(['status']).toUpperCase();
            let statusOS: ServiceOrder['statusOS'] = 'CONCLUÍDO';
            if (statusRaw.includes('ORÇAMENTO')) statusOS = 'ORÇAMENTO';
            else if (statusRaw.includes('APROVADO')) statusOS = 'APROVADO';
            else if (statusRaw.includes('ANDAMENTO')) statusOS = 'EM ANDAMENTO';
            else if (statusRaw.includes('PEÇAS')) statusOS = 'AGUARDANDO PEÇAS';
            else if (statusRaw.includes('CANCELADO')) statusOS = 'CANCELADO';
            else if (!descServico && valorNum === 0) statusOS = 'CADASTRADO';

            const newOrder: ServiceOrder = {
              id: `os-excel-${Date.now()}-${index}`,
              numeroOS,
              tipoDoc: descServico || valorNum > 0 ? 'ORDEM DE SERVIÇO' : 'CADASTRO DE CLIENTE',
              statusOS,
              cliente: {
                nome: clienteNome || 'Cliente Importado',
                documento: getVal(['cpf', 'cnpj', 'doc', 'documento']),
                telefone: getVal(['tel', 'cel', 'fone', 'whatsapp', 'whats', 'contato']),
                email: getVal(['email', 'e-mail', 'correio']),
                endereco: getVal(['end', 'rua', 'logradouro', 'bairro', 'cidade', 'endereço', 'endereco']),
              },
              veiculo: {
                marca: veiculoMarca,
                modelo: veiculoModelo,
                matricula: veiculoMatricula.toUpperCase(),
                ano: getVal(['ano']),
                cor: getVal(['cor']),
                kmEntrada: getVal(['km', 'quilometragem']),
                kmSaida: getVal(['km saída', 'km saida']),
                dataEntrada,
                dataSaida: getVal(['saida', 'entrega']),
              },
              servicos: descServico || valorNum > 0
                ? [{ id: `s-imp-${index}`, descricao: descServico || 'Serviços Anteriores (Importado)', valor: valorNum }]
                : [],
              pecas: [],
              pagamento: {
                forma: getVal(['pagamento', 'forma', 'pgto', 'condição']) || 'DINHEIRO/PIX',
                prazo: getVal(['prazo', 'parcelas']),
                desconto: 0,
                observacoes: getVal(['obs', 'detalhe', 'nota', 'defeito']) || 'Importado de arquivo Excel',
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            imported.push(newOrder);
          }
        });

        resolve({ count: imported.length, imported });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
