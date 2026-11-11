export type DocumentType = 'ORDEM DE SERVIÇO' | 'ORÇAMENTO' | 'CADASTRO DE CLIENTE';

export type OrderStatus =
  | 'ORÇAMENTO'
  | 'APROVADO'
  | 'EM ANDAMENTO'
  | 'AGUARDANDO PEÇAS'
  | 'CONCLUÍDO'
  | 'ENTREGUE'
  | 'CANCELADO'
  | 'CADASTRADO';

export interface Customer {
  nome: string;
  documento: string; // CPF or CNPJ
  telefone: string;
  email: string;
  endereco: string;
  cep?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  dataNascimento?: string; // YYYY-MM-DD para controle de aniversariantes
  tipo?: 'PF' | 'PJ';
}

export interface Vehicle {
  marca: string;
  modelo: string;
  matricula: string; // Placa
  ano: string;
  cor: string;
  kmEntrada: string;
  kmSaida: string;
  dataEntrada: string;
  dataSaida: string;
  combustivel?: 'Reserva' | '1/4' | '1/2' | '3/4' | 'Cheio';
  tipoCombustivel?: string; // Flex, Gasolina, Etanol, Diesel, GNV, Híbrido, Elétrico
}

export interface DamageMark {
  id: string;
  zona: string; // 'Frente', 'Traseira', 'Lateral Esquerda', 'Lateral Direita', 'Teto'
  tipo: 'Risco' | 'Amassado' | 'Quebrado' | 'Ralado' | 'Outro';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  descricao?: string;
}

export interface InspectionChecklist {
  nivelCombustivel: 'Reserva' | '1/4' | '1/2' | '3/4' | 'Cheio';
  temEstepe: boolean;
  temMacaco: boolean;
  temChaveRoda: boolean;
  temTriangulo: boolean;
  temManual: boolean;
  temDocumento: boolean;
  avariasIdentificadas: string; // texto livre
  pertencesDeixados: string;
  danosVisuais?: DamageMark[]; // marcações interativas na lataria
}

export interface ServiceItem {
  id: string;
  descricao: string;
  valor: number;
  mecanico?: string;
  codigoServico?: string;
  aliquotaIss?: number;
}

export interface PartItem {
  id: string;
  descricao: string;
  unidade: string;
  qtd: number;
  preco: number;
  custo?: number;
  codigo?: string;
  ncm?: string;
  cfop?: string;
  csosn?: string;
}

export interface CatalogServiceItem {
  id: string;
  descricao: string;
  valor: number;
  categoria?: string;
}

export interface CatalogPartItem {
  id: string;
  descricao: string;
  unidade: string;
  preco: number;
  categoria?: string;
  codigo?: string;
}

export interface InventoryItem {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  estoqueMinimo: number;
  precoCusto: number;
  precoVenda: number;
  categoria?: string;
  marca?: string;
}

export interface PaymentInfo {
  forma: string;
  prazo: string;
  desconto: number;
  observacoes: string;
  valorEntrada?: number;
  valorPago?: number;
}

export interface NFeEmissao {
  numeroNFe: string;
  serie: string;
  chaveAcesso: string;
  dataEmissao: string;
  naturezaOperacao: string;
  status: 'AUTORIZADA' | 'EMITIDA' | 'CANCELADA';
  protocoloAutorizacao?: string;
  valorTotalServicos: number;
  valorTotalPecas: number;
  valorTotalNota: number;
  tributosAproximados: number;
  xmlContent: string;
  motivoCancelamento?: string;
  dataCancelamento?: string;
}

export interface ServiceOrder {
  id: string;
  numeroOS: string;
  tipoDoc: DocumentType;
  statusOS: OrderStatus;
  cliente: Customer;
  veiculo: Vehicle;
  mecanicoResponsavel?: string;
  checklist?: InspectionChecklist;
  servicos: ServiceItem[];
  pecas: PartItem[];
  pagamento: PaymentInfo;
  nfeEmitida?: boolean;
  nfeDados?: NFeEmissao;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopConfig {
  nome: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  inscricaoMunicipal?: string;
  endereco: string;
  telefone: string;
  whatsapp: string;
  email: string;
  logoUrl?: string;
  termoGarantia: string;
  prazoValidadeOrcamentoDias: number;
  prazoGarantiaDias: number;
  regimeTributario?: 'SIMPLES_NACIONAL' | 'SIMPLES_MEI' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  serieNFe?: string;
  proximoNumeroNFe?: number;
  cfopPadraoPecas?: string;
  aliquotaIbptPadrao?: number;
  ambienteSefaz?: 'PRODUCAO' | 'HOMOLOGACAO';
}

export interface OilStickerData {
  veiculo: string;
  placa: string;
  kmAtual: number;
  proximoKm: number;
  dataTroca: string;
  proximaData: string;
  oleo: string;
  filtroOleo: boolean;
  filtroAr: boolean;
  filtroComb: boolean;
  filtroCabine: boolean;
}

export interface MechanicProfile {
  id: string;
  nome: string;
  comissaoTaxa: number; // Porcentagem (ex: 30 para 30%)
  telefone?: string;
  especialidade?: string;
  documento?: string;
  chavePix?: string;
  ativo: boolean;
  dataCadastro?: string;
  observacoes?: string;
}

// ==========================================
// 1. FLUXO DE CAIXA E CONTROLE DIÁRIO
// ==========================================
export type CashMovementType = 'ENTRADA' | 'SAIDA' | 'SANGRIA' | 'SUPRIMENTO';

export interface CashMovement {
  id: string;
  tipo: CashMovementType;
  descricao: string;
  valor: number;
  formaPagamento: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'OUTRO';
  categoria?: string;
  dataHora: string;
  operador?: string;
  referenciaId?: string; // ID da OS ou da Venda Balcão
}

export interface CashRegisterSession {
  id: string;
  abertoEm: string;
  fechadoEm?: string;
  saldoInicial: number;
  saldoFinalDinheiro?: number;
  status: 'ABERTO' | 'FECHADO';
  operadorAbertura: string;
  operadorFechamento?: string;
  movimentacoes: CashMovement[];
  observacoesFechamento?: string;
}

// ==========================================
// 2. CONTAS A PAGAR E RECEBER (DESPESAS E RECEITAS)
// ==========================================
export type BillType = 'PAGAR' | 'RECEBER';
export type BillStatus = 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO';

export interface BillItem {
  id: string;
  tipo: BillType;
  descricao: string;
  categoria: string; // 'Aluguel', 'Fornecedor/Peças', 'Água/Luz/Internet', 'Salários', 'Impostos', 'Ferramentas', 'Outro'
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: BillStatus;
  entidade: string; // Nome do fornecedor ou cliente
  documentoNumero?: string;
  observacoes?: string;
  formaPagamento?: string;
}

// ==========================================
// 3. IMPORTAÇÃO DE XML (NF-e)
// ==========================================
export interface ParsedXmlProduct {
  codigo: string;
  descricao: string;
  ncm?: string;
  unidade: string;
  quantidade: number;
  precoCusto: number;
  precoVendaSugerido: number;
  jaExiste: boolean;
  itemExistenteId?: string;
  acao: 'ATUALIZAR' | 'CADASTRAR' | 'IGNORAR';
}

export interface ParsedXmlNFe {
  numeroNF: string;
  serie?: string;
  dataEmissao?: string;
  emitenteNome: string;
  emitenteCnpj: string;
  produtos: ParsedXmlProduct[];
  valorTotalNota: number;
}


