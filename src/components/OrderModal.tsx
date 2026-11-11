import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Car,
  ClipboardCheck,
  Wrench,
  Package,
  CreditCard,
  Plus,
  Trash2,
  Printer,
  Save,
  Search,
  Sparkles,
  MessageCircle,
  FileText,
  Edit3,
  Check,
  Loader2,
  Download,
} from 'lucide-react';
import { safeSetItem } from '../utils/safeStorage';
import {
  DocumentType,
  OrderStatus,
  ServiceOrder,
  WorkshopConfig,
  ServiceItem,
  PartItem,
  DamageMark,
  CatalogServiceItem,
  CatalogPartItem,
} from '../types';
import { POPULAR_SERVICES, POPULAR_PARTS } from '../data/initialData';
import {
  calculateOrderTotals,
  formatCurrency,
  maskDocument,
  maskPhone,
  maskLicensePlate,
  maskCep,
  maskYearModel,
  fetchAddressByCep,
  parseCurrency,
  generateWhatsAppMessage,
  generateWhatsAppReadyMessage,
  getWhatsAppUrl,
} from '../utils/formatters';
import {
  getStoredMechanics,
  MechanicProfile,
  MECHANICS_UPDATED_EVENT,
} from '../utils/mechanicsStorage';
import { CarDamageDiagram } from './CarDamageDiagram';
import { CurrencyInput } from './CurrencyInput';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: ServiceOrder) => void;
  onSaveAndPrint: (order: ServiceOrder) => void;
  onDownloadPdf?: (order: ServiceOrder) => void;
  onPrintBlankInspection?: (order: ServiceOrder) => void;
  onDownloadBlankInspectionPdf?: (order: ServiceOrder) => void;
  initialOrder?: ServiceOrder | null;
  existingOrders: ServiceOrder[];
  config: WorkshopConfig;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveAndPrint,
  onDownloadPdf,
  onPrintBlankInspection,
  onDownloadBlankInspectionPdf,
  initialOrder,
  existingOrders,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'vistoria' | 'itens' | 'pagamento' | 'resumo'>('dados');

  // Form State
  const [id, setId] = useState('');
  const [numeroOS, setNumeroOS] = useState('');
  const [tipoDoc, setTipoDoc] = useState<DocumentType>('ORDEM DE SERVIÇO');
  const [statusOS, setStatusOS] = useState<OrderStatus>('ORÇAMENTO');

  // Cliente
  const [clienteNome, setClienteNome] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteCep, setClienteCep] = useState('');
  const [clienteEndereco, setClienteEndereco] = useState('');
  const [clienteNumero, setClienteNumero] = useState('');
  const [clienteComplemento, setClienteComplemento] = useState('');
  const [clienteBairro, setClienteBairro] = useState('');
  const [clienteCidade, setClienteCidade] = useState('');
  const [clienteUf, setClienteUf] = useState('');
  const [clienteDataNascimento, setClienteDataNascimento] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Veículo
  const [veiculoMarca, setVeiculoMarca] = useState('');
  const [veiculoModelo, setVeiculoModelo] = useState('');
  const [veiculoMatricula, setVeiculoMatricula] = useState('');
  const [veiculoAno, setVeiculoAno] = useState('');
  const [veiculoCor, setVeiculoCor] = useState('');
  const [veiculoTipoCombustivel, setVeiculoTipoCombustivel] = useState('Flex');
  const [kmEntrada, setKmEntrada] = useState('');
  const [kmSaida, setKmSaida] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [dataSaida, setDataSaida] = useState('');

  // Mecânicos Cadastrados e Mecânico Responsável pelo Atendimento
  const [registeredMechanics, setRegisteredMechanics] = useState<MechanicProfile[]>(() =>
    getStoredMechanics()
  );
  const [mecanicoResponsavel, setMecanicoResponsavel] = useState('Beto');

  useEffect(() => {
    const handleMecsUpdate = () => {
      const mecs = getStoredMechanics();
      setRegisteredMechanics(mecs);
    };

    window.addEventListener(MECHANICS_UPDATED_EVENT, handleMecsUpdate);
    window.addEventListener('storage', handleMecsUpdate);
    return () => {
      window.removeEventListener(MECHANICS_UPDATED_EVENT, handleMecsUpdate);
      window.removeEventListener('storage', handleMecsUpdate);
    };
  }, []);

  // Checklist
  const [combustivel, setCombustivel] = useState<'Reserva' | '1/4' | '1/2' | '3/4' | 'Cheio'>('1/2');
  const [temEstepe, setTemEstepe] = useState(true);
  const [temMacaco, setTemMacaco] = useState(true);
  const [temChaveRoda, setTemChaveRoda] = useState(true);
  const [temTriangulo, setTemTriangulo] = useState(true);
  const [temManual, setTemManual] = useState(true);
  const [temDocumento, setTemDocumento] = useState(true);
  const [avarias, setAvarias] = useState('');
  const [pertences, setPertences] = useState('');
  const [danosVisuais, setDanosVisuais] = useState<DamageMark[]>([]);

  // Serviços e Peças
  const [servicos, setServicos] = useState<ServiceItem[]>([]);
  const [pecas, setPecas] = useState<PartItem[]>([]);

  // Pagamento
  const [formaPagamento, setFormaPagamento] = useState('CARTÃO DE CRÉDITO');
  const [prazoPagamento, setPrazoPagamento] = useState('À VISTA');
  const [descontoValor, setDescontoValor] = useState<number>(0);
  const [observacoes, setObservacoes] = useState('');

  // Autocomplete state
  const [searchClientQuery, setSearchClientQuery] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<ServiceOrder[]>([]);
  const [showClientResults, setShowClientResults] = useState(false);
  const [clientVehicles, setClientVehicles] = useState<{ marca: string; modelo: string; matricula: string; ano?: string; cor?: string }[]>([]);

  // Fast Catalog state with localStorage persistence
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogServices, setCatalogServices] = useState<CatalogServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('bibicar_catalog_services');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[OrderModal] Falha ao ler catálogo de serviços:', e);
    }
    return POPULAR_SERVICES.map((s, idx) => ({ id: `cs-${idx}`, descricao: s.descricao, valor: s.valor }));
  });

  const [catalogParts, setCatalogParts] = useState<CatalogPartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bibicar_catalog_parts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[OrderModal] Falha ao ler catálogo de peças:', e);
    }
    return POPULAR_PARTS.map((p, idx) => ({ id: `cp-${idx}`, descricao: p.descricao, unidade: p.unidade, preco: p.preco }));
  });

  // Adding / Editing Catalog items
  const [editingService, setEditingService] = useState<CatalogServiceItem | null>(null);
  const [editingPart, setEditingPart] = useState<CatalogPartItem | null>(null);
  const [isAddingNewItem, setIsAddingNewItem] = useState<'service' | 'part' | null>(null);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [newItemUnit, setNewItemUnit] = useState('UN');

  // Autocomplete dropdown focus tracking
  const [activeServiceRowId, setActiveServiceRowId] = useState<string | null>(null);
  const [activePartRowId, setActivePartRowId] = useState<string | null>(null);

  // Persist Catalog
  useEffect(() => {
    safeSetItem('bibicar_catalog_services', JSON.stringify(catalogServices));
  }, [catalogServices]);

  useEffect(() => {
    safeSetItem('bibicar_catalog_parts', JSON.stringify(catalogParts));
  }, [catalogParts]);

  // Handle CEP Lookup via ViaCEP
  const handleCepChange = async (val: string) => {
    const masked = maskCep(val);
    setClienteCep(masked);
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsSearchingCep(true);
      try {
        const addr = await fetchAddressByCep(clean);
        if (addr && !addr.erro) {
          if (addr.logradouro) setClienteEndereco(addr.logradouro);
          if (addr.bairro) setClienteBairro(addr.bairro);
          if (addr.localidade) setClienteCidade(addr.localidade);
          if (addr.uf) setClienteUf(addr.uf);
        }
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  // Initialize form when modal opens or initialOrder changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialOrder) {
      setId(initialOrder.id);
      setNumeroOS(initialOrder.numeroOS);
      setTipoDoc(initialOrder.tipoDoc || 'ORDEM DE SERVIÇO');
      setStatusOS(initialOrder.statusOS || 'ORÇAMENTO');

      setClienteNome(initialOrder.cliente?.nome || '');
      setClienteDocumento(initialOrder.cliente?.documento || '');
      setClienteTelefone(initialOrder.cliente?.telefone || '');
      setClienteEmail(initialOrder.cliente?.email || '');
      setClienteCep(initialOrder.cliente?.cep || '');
      setClienteEndereco(initialOrder.cliente?.endereco || '');
      setClienteNumero(initialOrder.cliente?.numero || '');
      setClienteComplemento(initialOrder.cliente?.complemento || '');
      setClienteBairro(initialOrder.cliente?.bairro || '');
      setClienteCidade(initialOrder.cliente?.cidade || '');
      setClienteUf(initialOrder.cliente?.uf || '');
      setClienteDataNascimento(initialOrder.cliente?.dataNascimento || '');

      setVeiculoMarca(initialOrder.veiculo?.marca || '');
      setVeiculoModelo(initialOrder.veiculo?.modelo || '');
      setVeiculoMatricula(initialOrder.veiculo?.matricula || '');
      setVeiculoAno(initialOrder.veiculo?.ano || '');
      setVeiculoCor(initialOrder.veiculo?.cor || '');
      setVeiculoTipoCombustivel(initialOrder.veiculo?.tipoCombustivel || 'Flex');
      setKmEntrada(initialOrder.veiculo?.kmEntrada || '');
      setKmSaida(initialOrder.veiculo?.kmSaida || '');
      setDataEntrada(initialOrder.veiculo?.dataEntrada || new Date().toISOString().split('T')[0]);
      const currentMecs = getStoredMechanics().filter((m) => m.ativo);
      const defaultMec = currentMecs[0]?.nome || 'Beto';
      setMecanicoResponsavel(initialOrder.mecanicoResponsavel || defaultMec);

      if (initialOrder.checklist) {
        setCombustivel(initialOrder.checklist.nivelCombustivel || '1/2');
        setTemEstepe(initialOrder.checklist.temEstepe ?? true);
        setTemMacaco(initialOrder.checklist.temMacaco ?? true);
        setTemChaveRoda(initialOrder.checklist.temChaveRoda ?? true);
        setTemTriangulo(initialOrder.checklist.temTriangulo ?? true);
        setTemManual(initialOrder.checklist.temManual ?? true);
        setTemDocumento(initialOrder.checklist.temDocumento ?? true);
        setAvarias(initialOrder.checklist.avariasIdentificadas || '');
        setPertences(initialOrder.checklist.pertencesDeixados || '');
        setDanosVisuais(initialOrder.checklist.danosVisuais || []);
      } else {
        setDanosVisuais([]);
      }

      setServicos(initialOrder.servicos || []);
      setPecas(initialOrder.pecas || []);

      setFormaPagamento(initialOrder.pagamento?.forma || 'CARTÃO DE CRÉDITO');
      setPrazoPagamento(initialOrder.pagamento?.prazo || 'À VISTA');
      setDescontoValor(initialOrder.pagamento?.desconto || 0);
      setObservacoes(initialOrder.pagamento?.observacoes || '');
    } else {
      // New Order
      setId(`os-${Date.now()}`);
      const nextNum = (existingOrders.length + 1).toString().padStart(5, '0');
      setNumeroOS(nextNum);
      setTipoDoc('ORDEM DE SERVIÇO');
      setStatusOS('ORÇAMENTO');

      setClienteNome('');
      setClienteDocumento('');
      setClienteTelefone('');
      setClienteEmail('');
      setClienteCep('');
      setClienteEndereco('');
      setClienteNumero('');
      setClienteComplemento('');
      setClienteBairro('');
      setClienteCidade('');
      setClienteUf('');
      setClienteDataNascimento('');

      setVeiculoMarca('');
      setVeiculoModelo('');
      setVeiculoMatricula('');
      setVeiculoAno('');
      setVeiculoCor('');
      setVeiculoTipoCombustivel('Flex');
      setKmEntrada('');
      setKmSaida('');
      setDataEntrada(new Date().toISOString().split('T')[0]);
      setDataSaida('');
      const currentMecs = getStoredMechanics().filter((m) => m.ativo);
      setMecanicoResponsavel(currentMecs[0]?.nome || 'Beto');

      setCombustivel('1/2');
      setTemEstepe(true);
      setTemMacaco(true);
      setTemChaveRoda(true);
      setTemTriangulo(true);
      setTemManual(true);
      setTemDocumento(true);
      setAvarias('');
      setPertences('');
      setDanosVisuais([]);

      setServicos([
        { id: `s-${Date.now()}-1`, descricao: '', valor: 0 },
      ]);
      setPecas([]);

      setFormaPagamento('CARTÃO DE CRÉDITO');
      setPrazoPagamento('À VISTA');
      setDescontoValor(0);
      setObservacoes('Garantia de 90 dias conforme CDC Art. 26.');
    }

    setActiveTab('dados');
    setSearchClientQuery('');
    setShowClientResults(false);
  }, [isOpen, initialOrder, existingOrders]);

  // Handle client search for autocomplete
  useEffect(() => {
    if (!searchClientQuery || searchClientQuery.trim().length < 2) {
      setClientSearchResults([]);
      setShowClientResults(false);
      return;
    }
    const q = searchClientQuery.toLowerCase();
    const results = existingOrders.filter((os) => {
      const matchName = os.cliente?.nome?.toLowerCase().includes(q);
      const matchDoc = os.cliente?.documento?.toLowerCase().includes(q);
      const matchPhone = os.cliente?.telefone?.toLowerCase().includes(q);
      const matchCar =
        os.veiculo?.modelo?.toLowerCase().includes(q) ||
        os.veiculo?.matricula?.toLowerCase().includes(q);
      return matchName || matchDoc || matchPhone || matchCar;
    });

    // Deduplicate by client name + car
    const seen = new Set();
    const unique = results.filter((item) => {
      const k = `${item.cliente?.nome}_${item.veiculo?.matricula || item.veiculo?.modelo}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    setClientSearchResults(unique.slice(0, 6));
    setShowClientResults(unique.length > 0);
  }, [searchClientQuery, existingOrders]);

  // Update client vehicles whenever clientNome changes
  useEffect(() => {
    if (!clienteNome.trim()) {
      setClientVehicles([]);
      return;
    }
    const targetName = clienteNome.trim().toLowerCase();
    const vehicles: { marca: string; modelo: string; matricula: string; ano?: string; cor?: string }[] = [];
    const seenPlates = new Set();

    existingOrders.forEach((os) => {
      if (os.cliente?.nome?.trim().toLowerCase() === targetName && os.veiculo) {
        const key = (os.veiculo.matricula || os.veiculo.modelo).trim().toLowerCase();
        if (key && !seenPlates.has(key)) {
          seenPlates.add(key);
          vehicles.push({
            marca: os.veiculo.marca || '',
            modelo: os.veiculo.modelo || '',
            matricula: os.veiculo.matricula || '',
            ano: os.veiculo.ano || '',
            cor: os.veiculo.cor || '',
          });
        }
      }
    });

    setClientVehicles(vehicles);
  }, [clienteNome, existingOrders]);

  const selectClient = (os: ServiceOrder) => {
    setClienteNome(os.cliente?.nome || '');
    setClienteDocumento(os.cliente?.documento || '');
    setClienteTelefone(os.cliente?.telefone || '');
    setClienteEmail(os.cliente?.email || '');
    setClienteCep(os.cliente?.cep || '');
    setClienteEndereco(os.cliente?.endereco || '');
    setClienteNumero(os.cliente?.numero || '');
    setClienteComplemento(os.cliente?.complemento || '');
    setClienteBairro(os.cliente?.bairro || '');
    setClienteCidade(os.cliente?.cidade || '');
    setClienteUf(os.cliente?.uf || '');
    setClienteDataNascimento(os.cliente?.dataNascimento || '');

    if (os.veiculo) {
      setVeiculoMarca(os.veiculo.marca || '');
      setVeiculoModelo(os.veiculo.modelo || '');
      setVeiculoMatricula(os.veiculo.matricula || '');
      setVeiculoAno(os.veiculo.ano || '');
      setVeiculoCor(os.veiculo.cor || '');
      setVeiculoTipoCombustivel(os.veiculo.tipoCombustivel || 'Flex');
    }

    if (os.mecanicoResponsavel) {
      setMecanicoResponsavel(os.mecanicoResponsavel);
    }

    setSearchClientQuery('');
    setShowClientResults(false);
  };

  const handleSelectClientVehicle = (idxStr: string) => {
    if (idxStr === 'novo') {
      setVeiculoMarca('');
      setVeiculoModelo('');
      setVeiculoMatricula('');
      setVeiculoAno('');
      setVeiculoCor('');
      return;
    }
    const v = clientVehicles[parseInt(idxStr, 10)];
    if (v) {
      setVeiculoMarca(v.marca);
      setVeiculoModelo(v.modelo);
      setVeiculoMatricula(v.matricula);
      setVeiculoAno(v.ano || '');
      setVeiculoCor(v.cor || '');
    }
  };

  // Services and Parts manipulation
  const addService = (desc = '', val = 0) => {
    setServicos((prev) => [
      ...prev,
      { id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, descricao: desc, valor: val, mecanico: mecanicoResponsavel },
    ]);
  };

  const updateService = (id: string, field: keyof ServiceItem, value: any) => {
    setServicos((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeService = (id: string) => {
    setServicos((prev) => prev.filter((s) => s.id !== id));
  };

  const addPart = (desc = '', unidade = 'UN', qtd = 1, preco = 0) => {
    setPecas((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        descricao: desc,
        unidade,
        qtd,
        preco,
      },
    ]);
  };

  const updatePart = (id: string, field: keyof PartItem, value: any) => {
    setPecas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removePart = (id: string) => {
    setPecas((prev) => prev.filter((p) => p.id !== id));
  };

  // Catalog item handlers
  const handleSaveCatalogService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;
    if (editingService) {
      setCatalogServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? { ...s, descricao: newItemDesc.trim().toUpperCase(), valor: newItemPrice } : s))
      );
      setEditingService(null);
    } else {
      setCatalogServices((prev) => [
        ...prev,
        { id: `cs-${Date.now()}`, descricao: newItemDesc.trim().toUpperCase(), valor: newItemPrice },
      ]);
    }
    setNewItemDesc('');
    setNewItemPrice(0);
    setIsAddingNewItem(null);
  };

  const handleSaveCatalogPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;
    if (editingPart) {
      setCatalogParts((prev) =>
        prev.map((p) =>
          p.id === editingPart.id
            ? { ...p, descricao: newItemDesc.trim().toUpperCase(), unidade: newItemUnit.toUpperCase(), preco: newItemPrice }
            : p
        )
      );
      setEditingPart(null);
    } else {
      setCatalogParts((prev) => [
        ...prev,
        {
          id: `cp-${Date.now()}`,
          descricao: newItemDesc.trim().toUpperCase(),
          unidade: newItemUnit.toUpperCase() || 'UN',
          preco: newItemPrice,
        },
      ]);
    }
    setNewItemDesc('');
    setNewItemPrice(0);
    setNewItemUnit('UN');
    setIsAddingNewItem(null);
  };

  const handleDeleteCatalogService = (id: string) => {
    setCatalogServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteCatalogPart = (id: string) => {
    setCatalogParts((prev) => prev.filter((p) => p.id !== id));
  };

  // Build the complete ServiceOrder object
  const buildCurrentOrder = (): ServiceOrder => {
    return {
      id: id || `os-${Date.now()}`,
      numeroOS,
      tipoDoc,
      statusOS,
      cliente: {
        nome: clienteNome,
        documento: clienteDocumento,
        telefone: clienteTelefone,
        email: clienteEmail,
        endereco: clienteEndereco,
        cep: clienteCep,
        numero: clienteNumero,
        complemento: clienteComplemento,
        bairro: clienteBairro,
        cidade: clienteCidade,
        uf: clienteUf,
        dataNascimento: clienteDataNascimento,
      },
      veiculo: {
        marca: veiculoMarca,
        modelo: veiculoModelo,
        matricula: veiculoMatricula.toUpperCase(),
        ano: veiculoAno,
        cor: veiculoCor,
        kmEntrada,
        kmSaida,
        dataEntrada,
        dataSaida,
        combustivel,
        tipoCombustivel: veiculoTipoCombustivel,
      },
      mecanicoResponsavel: mecanicoResponsavel || 'Beto',
      checklist: {
        nivelCombustivel: combustivel,
        temEstepe,
        temMacaco,
        temChaveRoda,
        temTriangulo,
        temManual,
        temDocumento,
        avariasIdentificadas: avarias,
        pertencesDeixados: pertences,
        danosVisuais: danosVisuais,
      },
      servicos: servicos
        .filter((s) => s.descricao.trim().length > 0 || s.valor > 0)
        .map((s) => ({ ...s, mecanico: s.mecanico || mecanicoResponsavel || 'Beto' })),
      pecas: pecas.filter((p) => p.descricao.trim().length > 0 || p.preco > 0),
      pagamento: {
        forma: formaPagamento,
        prazo: prazoPagamento,
        desconto: descontoValor,
        observacoes,
      },
      createdAt: initialOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome.trim()) {
      setActiveTab('dados');
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    const order = buildCurrentOrder();
    onSave(order);
  };

  const handleSaveAndPrint = () => {
    if (!clienteNome.trim()) {
      setActiveTab('dados');
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    const order = buildCurrentOrder();
    onSaveAndPrint(order);
  };

  const totals = calculateOrderTotals({
    servicos,
    pecas,
    pagamento: { desconto: descontoValor },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-start overflow-y-auto p-2 sm:p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-tight">
                {initialOrder ? `Editar Registro #${numeroOS}` : 'Nova Ordem de Serviço / Orçamento'}
              </h2>
              <p className="text-xs text-slate-400">
                Bibicar Automotivo · Gestão completa do atendimento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global OS Settings Bar: Número OS, Tipo Doc, Status */}
        <div className="bg-slate-100/90 px-5 py-3 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nº do Registro / OS
            </label>
            <input
              type="text"
              value={numeroOS}
              onChange={(e) => setNumeroOS(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono font-extrabold text-sm text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tipo de Documento
            </label>
            <select
              value={tipoDoc}
              onChange={(e) => setTipoDoc(e.target.value as DocumentType)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
            >
              <option value="ORDEM DE SERVIÇO">ORDEM DE SERVIÇO</option>
              <option value="ORÇAMENTO">ORÇAMENTO</option>
              <option value="CADASTRO DE CLIENTE">CADASTRO DE CLIENTE</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status do Atendimento
            </label>
            <select
              value={statusOS}
              onChange={(e) => setStatusOS(e.target.value as OrderStatus)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
            >
              <option value="ORÇAMENTO">ORÇAMENTO</option>
              <option value="APROVADO">APROVADO</option>
              <option value="EM ANDAMENTO">EM ANDAMENTO</option>
              <option value="AGUARDANDO PEÇAS">AGUARDANDO PEÇAS</option>
              <option value="CONCLUÍDO">CONCLUÍDO</option>
              <option value="ENTREGUE">ENTREGUE</option>
              <option value="CANCELADO">CANCELADO</option>
              <option value="CADASTRADO">CADASTRADO</option>
            </select>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 gap-1 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'dados'
                ? 'border-red-600 text-red-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Cliente & Veículo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vistoria')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'vistoria'
                ? 'border-red-600 text-red-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>2. Vistoria & Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('itens')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'itens'
                ? 'border-red-600 text-red-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>3. Serviços & Peças ({servicos.length + pecas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagamento')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'pagamento'
                ? 'border-red-600 text-red-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>4. Fechamento & Pagamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resumo')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'resumo'
                ? 'border-red-600 text-red-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>5. Resumo & Envio</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6">

          {/* TAB 1: CLIENTE E VEÍCULO */}
          {activeTab === 'dados' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Quick Autocomplete Box */}
              <div className="bg-red-50/70 border border-red-200/90 p-3.5 rounded-xl relative">
                <label className="block text-xs font-bold text-red-950 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-red-600" />
                  <span>Localizar Cliente Cadastrado ou Placa Anterior</span>
                </label>
                <input
                  type="text"
                  value={searchClientQuery}
                  onChange={(e) => setSearchClientQuery(e.target.value)}
                  placeholder="Digite nome, CPF/CNPJ, telefone ou placa..."
                  className="w-full bg-white border border-red-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                />

                {/* Autocomplete Dropdown */}
                {showClientResults && (
                  <div className="absolute left-3.5 right-3.5 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto z-30 divide-y divide-slate-100">
                    {clientSearchResults.map((os) => (
                      <div
                        key={os.id}
                        onClick={() => selectClient(os)}
                        className="p-2.5 hover:bg-red-50 cursor-pointer flex justify-between items-center text-xs transition"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {os.cliente?.nome}
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            {os.cliente?.documento || 'Sem CPF'} · Tel: {os.cliente?.telefone || 'Sem tel'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {os.veiculo?.marca} {os.veiculo?.modelo} {os.veiculo?.matricula ? `· ${os.veiculo.matricula}` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2-Column Grid: Cliente & Veículo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* DADOS DO CLIENTE */}
                <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-xl space-y-3">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <User className="w-4 h-4 text-red-600" />
                    <span>Dados do Cliente</span>
                  </h3>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nome Completo / Razão Social *
                    </label>
                    <input
                      type="text"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      required
                      placeholder="Ex: Carlos Eduardo Silva"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        CPF / CNPJ
                      </label>
                      <input
                        type="text"
                        value={clienteDocumento}
                        onChange={(e) => setClienteDocumento(maskDocument(e.target.value))}
                        placeholder="000.000.000-00"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={clienteTelefone}
                        onChange={(e) => setClienteTelefone(maskPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={clienteEmail}
                        onChange={(e) => setClienteEmail(e.target.value)}
                        placeholder="cliente@email.com"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                        <span>Data Nascimento</span>
                        <span className="text-[10px] text-pink-600 font-bold">🎂 CRM</span>
                      </label>
                      <input
                        type="date"
                        value={clienteDataNascimento}
                        onChange={(e) => setClienteDataNascimento(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* CEP & Endereço com Busca Automática ViaCEP */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                        <span>CEP</span>
                        {isSearchingCep && <Loader2 className="w-3 h-3 text-red-600 animate-spin" />}
                      </label>
                      <input
                        type="text"
                        value={clienteCep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Logradouro / Rua
                      </label>
                      <input
                        type="text"
                        value={clienteEndereco}
                        onChange={(e) => setClienteEndereco(e.target.value)}
                        placeholder="Ex: Av. Cupecê, Rua das Flores..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={clienteNumero}
                        onChange={(e) => setClienteNumero(e.target.value)}
                        placeholder="Ex: 120"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={clienteComplemento}
                        onChange={(e) => setClienteComplemento(e.target.value)}
                        placeholder="Ex: Bloco B, Apto 42, Galpão 3"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={clienteBairro}
                        onChange={(e) => setClienteBairro(e.target.value)}
                        placeholder="Bairro"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cidade / UF
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={clienteCidade}
                          onChange={(e) => setClienteCidade(e.target.value)}
                          placeholder="Cidade"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={clienteUf}
                          onChange={(e) => setClienteUf(e.target.value.toUpperCase())}
                          placeholder="UF"
                          maxLength={2}
                          className="w-12 bg-white border border-slate-300 rounded-lg px-1.5 py-1.5 text-xs text-center uppercase font-bold text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DADOS DO VEÍCULO */}
                <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-red-600" />
                      <span>Dados do Veículo</span>
                    </h3>

                    {clientVehicles.length > 0 && (
                      <select
                        onChange={(e) => handleSelectClientVehicle(e.target.value)}
                        className="text-[11px] border border-red-300 bg-red-50 rounded px-2 py-0.5 font-semibold text-red-800 focus:outline-none"
                      >
                        <option value="">Veículos deste cliente ({clientVehicles.length})</option>
                        {clientVehicles.map((v, i) => (
                          <option key={i} value={i}>
                            {v.marca} {v.modelo} {v.matricula ? `· ${v.matricula}` : ''}
                          </option>
                        ))}
                        <option value="novo">+ Cadastrar Novo Carro</option>
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={veiculoMarca}
                        onChange={(e) => setVeiculoMarca(e.target.value.toUpperCase())}
                        placeholder="Ex: CHEVROLET"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Modelo
                      </label>
                      <input
                        type="text"
                        value={veiculoModelo}
                        onChange={(e) => setVeiculoModelo(e.target.value)}
                        placeholder="Ex: Onix 1.0 Turbo"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Placa (Matrícula)
                      </label>
                      <input
                        type="text"
                        value={veiculoMatricula}
                        onChange={(e) => setVeiculoMatricula(maskLicensePlate(e.target.value))}
                        placeholder="ABC1D23"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Ano com Auto-Barra "/", Cor e Combustível */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Ano / Modelo
                      </label>
                      <input
                        type="text"
                        value={veiculoAno}
                        onChange={(e) => setVeiculoAno(maskYearModel(e.target.value))}
                        placeholder="2021/2022"
                        maxLength={9}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cor
                      </label>
                      <input
                        type="text"
                        value={veiculoCor}
                        onChange={(e) => setVeiculoCor(e.target.value)}
                        placeholder="Preto"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Combustível
                      </label>
                      <select
                        value={veiculoTipoCombustivel}
                        onChange={(e) => setVeiculoTipoCombustivel(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      >
                        <option value="Flex">Flex (Gas/Eta)</option>
                        <option value="Gasolina">Gasolina</option>
                        <option value="Etanol">Etanol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="GNV">GNV</option>
                        <option value="Híbrido">Híbrido</option>
                        <option value="Elétrico">Elétrico</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Km Entrada
                      </label>
                      <input
                        type="number"
                        value={kmEntrada}
                        onChange={(e) => setKmEntrada(e.target.value)}
                        placeholder="45200"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Km Saída
                      </label>
                      <input
                        type="number"
                        value={kmSaida}
                        onChange={(e) => setKmSaida(e.target.value)}
                        placeholder="45208"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Data Entrada
                      </label>
                      <input
                        type="date"
                        value={dataEntrada}
                        onChange={(e) => setDataEntrada(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Data Previsão Saída
                      </label>
                      <input
                        type="date"
                        value={dataSaida}
                        onChange={(e) => setDataSaida(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Mecânico Responsável Único pelo Atendimento */}
                  <div className="bg-red-50/60 border border-red-200/80 p-2.5 rounded-lg mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-red-600" />
                        <span>Mecânico Responsável pelo Veículo</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        (Cadastrado na aba Comissões)
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={mecanicoResponsavel}
                        onChange={(e) => setMecanicoResponsavel(e.target.value)}
                        placeholder="Nome do mecânico responsável"
                        className="w-full bg-white border border-red-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {registeredMechanics
                          .filter((m) => m.ativo)
                          .map((mec) => (
                            <button
                              key={mec.id}
                              type="button"
                              onClick={() => setMecanicoResponsavel(mec.nome)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                                mecanicoResponsavel.toLowerCase() === mec.nome.toLowerCase()
                                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {mec.nome}
                            </button>
                          ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Este profissional será o responsável por todos os serviços e comissões desta OS.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISTORIA E CHECKLIST */}
          {activeTab === 'vistoria' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Botão de Impressão da Ficha de Vistoria Física com Linhas para Prancheta */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3.5 rounded-xl flex flex-wrap justify-between items-center gap-3 shadow-md border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                      <span>Ficha de Vistoria & Prancheta do Mecânico</span>
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                        Versão com Linhas
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Imprima a folha com linhas pautadas para o mecânico anotar peças e serviços manualmente no pátio da oficina.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onDownloadBlankInspectionPdf && (
                    <button
                      type="button"
                      onClick={() => {
                        const order = buildCurrentOrder();
                        onDownloadBlankInspectionPdf(order);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Baixar PDF da Ficha</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const order = buildCurrentOrder();
                      if (onPrintBlankInspection) {
                        onPrintBlankInspection(order);
                      } else {
                        window.print();
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black px-4 py-2 rounded-lg text-xs transition flex items-center gap-2 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Ficha para Prancheta</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                    Nível de Combustível no Painel (Entrada)
                  </h3>
                  <div className="grid grid-cols-5 gap-2 max-w-md">
                    {(['Reserva', '1/4', '1/2', '3/4', 'Cheio'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setCombustivel(level)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition ${
                          combustivel === level
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                    Equipamentos e Acessórios Presentes no Veículo
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={temEstepe}
                        onChange={(e) => setTemEstepe(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span>Pneu Estepe</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={temMacaco}
                        onChange={(e) => setTemMacaco(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span>Macaco</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={temChaveRoda}
                        onChange={(e) => setTemChaveRoda(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span>Chave de Roda</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={temTriangulo}
                        onChange={(e) => setTemTriangulo(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span>Triângulo de Sinalização</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={temDocumento}
                        onChange={(e) => setTemDocumento(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span>Documento (CRLV)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={temManual}
                        onChange={(e) => setTemManual(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span>Manual do Proprietário</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Avarias, Riscos ou Amassados Pré-existentes
                    </label>
                    <textarea
                      rows={3}
                      value={avarias}
                      onChange={(e) => setAvarias(e.target.value)}
                      placeholder="Ex: Risco na porta traseira direita, roda dianteira ralada na guia..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Protege sua oficina contra contestações de danos antigos.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Pertences ou Objetos Pessoais Deixados no Veículo
                    </label>
                    <textarea
                      rows={3}
                      value={pertences}
                      onChange={(e) => setPertences(e.target.value)}
                      placeholder="Ex: Óculos de sol no porta-luvas, chaveiro, cabo USB, tag de pedágio..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Diagrama Visual da Lataria do Veículo */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Mapeamento Visual de Danos na Lataria
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Toque na lataria para fixar o ponto da avaria
                    </span>
                  </div>
                  <CarDamageDiagram damages={danosVisuais} onChange={setDanosVisuais} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SERVIÇOS E PEÇAS */}
          {activeTab === 'itens' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Mecânico Responsável Banner */}
              <div className="bg-slate-100 border border-slate-300/80 px-4 py-2.5 rounded-xl flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-red-600 text-white">
                    <Wrench className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Mecânico Responsável pelo Atendimento
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {mecanicoResponsavel || 'Não definido'}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-2">
                      (Profissional único atribuído para todos os serviços deste veículo)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">Alterar:</span>
                  <input
                    type="text"
                    value={mecanicoResponsavel}
                    onChange={(e) => setMecanicoResponsavel(e.target.value)}
                    placeholder="Mecânico"
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 w-32 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                  />
                  {registeredMechanics
                    .filter((m) => m.ativo)
                    .map((mec) => (
                      <button
                        key={mec.id}
                        type="button"
                        onClick={() => setMecanicoResponsavel(mec.nome)}
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold border transition ${
                          mecanicoResponsavel.toLowerCase() === mec.nome.toLowerCase()
                            ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {mec.nome}
                      </button>
                    ))}
                </div>
              </div>

              {/* Quick Picks & Catalog Management Banner */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-wrap justify-between items-center gap-2">
                <span className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Catálogo Rápido: clique para adicionar ou personalize itens e valores da oficina</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCatalog(!showCatalog)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-1.5 rounded-lg border border-red-200 transition"
                >
                  {showCatalog ? '✕ Ocultar Catálogo' : '⚙️ Abrir / Gerenciar Catálogo'}
                </button>
              </div>

              {/* Quick Catalog Dropdown with Add & Edit */}
              {showCatalog && (
                <div className="bg-white border border-slate-300 p-4 rounded-xl shadow-lg space-y-4">
                  {/* Inline Add / Edit Form */}
                  {(isAddingNewItem || editingService || editingPart) && (
                    <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-red-200 pb-2">
                        <span className="text-xs font-bold text-red-950 uppercase tracking-wide">
                          {editingService
                            ? 'Editar Serviço no Catálogo'
                            : editingPart
                            ? 'Editar Peça no Catálogo'
                            : isAddingNewItem === 'service'
                            ? '+ Novo Serviço no Catálogo'
                            : '+ Nova Peça no Catálogo'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewItem(null);
                            setEditingService(null);
                            setEditingPart(null);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-700"
                        >
                          ✕ Cancelar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Descrição do Item
                          </label>
                          <input
                            type="text"
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            placeholder="Ex: Troca de Óleo e Filtro"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-500 uppercase"
                          />
                        </div>

                        {(isAddingNewItem === 'part' || editingPart) && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Unidade
                            </label>
                            <input
                              type="text"
                              value={newItemUnit}
                              onChange={(e) => setNewItemUnit(e.target.value.toUpperCase())}
                              placeholder="UN / L / JG / PAR"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-center uppercase focus:outline-none focus:border-red-500"
                            />
                          </div>
                        )}

                        <div className={(isAddingNewItem === 'part' || editingPart) ? '' : 'sm:col-span-2'}>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Valor Padrão (R$)
                          </label>
                          <CurrencyInput
                            value={newItemPrice}
                            onChange={setNewItemPrice}
                            className="bg-white border-slate-300"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewItem(null);
                            setEditingService(null);
                            setEditingPart(null);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            if (editingService || isAddingNewItem === 'service') {
                              handleSaveCatalogService(e);
                            } else {
                              handleSaveCatalogPart(e);
                            }
                          }}
                          className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          Salvar no Catálogo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2 Columns: Services & Parts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Serviços */}
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-red-600" />
                          <span>Serviços Cadastrados ({catalogServices.length})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingService(null);
                            setEditingPart(null);
                            setNewItemDesc('');
                            setNewItemPrice(0);
                            setIsAddingNewItem('service');
                          }}
                          className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Novo Serviço</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {catalogServices.map((s) => (
                          <div
                            key={s.id}
                            className="flex justify-between items-center p-2 hover:bg-slate-100 rounded-lg text-xs group transition border border-transparent hover:border-slate-200"
                          >
                            <span
                              onClick={() => addService(s.descricao, s.valor)}
                              className="truncate text-slate-700 cursor-pointer flex-1 font-medium hover:text-red-600"
                              title="Clique para adicionar à OS"
                            >
                              + {s.descricao}
                            </span>
                            <div className="flex items-center gap-2 ml-2">
                              <span className="font-mono font-bold text-slate-900">
                                {formatCurrency(s.valor)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingService(s);
                                  setEditingPart(null);
                                  setIsAddingNewItem(null);
                                  setNewItemDesc(s.descricao);
                                  setNewItemPrice(s.valor);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-1 transition"
                                title="Editar valor ou nome"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCatalogService(s.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 transition"
                                title="Excluir do catálogo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Peças */}
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-red-600" />
                          <span>Peças Cadastradas ({catalogParts.length})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingService(null);
                            setEditingPart(null);
                            setNewItemDesc('');
                            setNewItemPrice(0);
                            setNewItemUnit('UN');
                            setIsAddingNewItem('part');
                          }}
                          className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nova Peça</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {catalogParts.map((p) => (
                          <div
                            key={p.id}
                            className="flex justify-between items-center p-2 hover:bg-slate-100 rounded-lg text-xs group transition border border-transparent hover:border-slate-200"
                          >
                            <span
                              onClick={() => addPart(p.descricao, p.unidade, 1, p.preco)}
                              className="truncate text-slate-700 cursor-pointer flex-1 font-medium hover:text-red-600"
                              title="Clique para adicionar à OS"
                            >
                              + {p.descricao} ({p.unidade})
                            </span>
                            <div className="flex items-center gap-2 ml-2">
                              <span className="font-mono font-bold text-slate-900">
                                {formatCurrency(p.preco)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPart(p);
                                  setEditingService(null);
                                  setIsAddingNewItem(null);
                                  setNewItemDesc(p.descricao);
                                  setNewItemPrice(p.preco);
                                  setNewItemUnit(p.unidade);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-1 transition"
                                title="Editar valor ou nome"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCatalogPart(p.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 transition"
                                title="Excluir do catálogo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SERVIÇOS TABLE */}
              <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-red-600" />
                    <span>Mão de Obra e Serviços Executados</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => addService()}
                    className="text-xs font-semibold bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Serviço</span>
                  </button>
                </div>

                <div className="overflow-x-visible">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider">
                        <th className="p-2 rounded-l">Descrição do Serviço (digite para autocompletar)</th>
                        <th className="p-2 w-44 text-right">Valor Mão de Obra (R$)</th>
                        <th className="p-2 w-10 text-center rounded-r"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {servicos.map((s) => {
                        const matchingServices = catalogServices.filter(
                          (cs) =>
                            s.descricao.trim().length > 0 &&
                            cs.descricao.toLowerCase().includes(s.descricao.toLowerCase())
                        );

                        return (
                          <tr key={s.id} className="group">
                            <td className="p-1.5 relative">
                              <input
                                type="text"
                                value={s.descricao}
                                onFocus={() => setActiveServiceRowId(s.id)}
                                onBlur={() => setTimeout(() => setActiveServiceRowId(null), 250)}
                                onChange={(e) => {
                                  updateService(s.id, 'descricao', e.target.value);
                                  setActiveServiceRowId(s.id);
                                }}
                                placeholder="Digite para buscar no catálogo... Ex: Alinhamento, Troca de pastilhas"
                                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                              />

                              {/* Autocomplete Dropdown ao digitar */}
                              {activeServiceRowId === s.id && matchingServices.length > 0 && (
                                <div className="absolute left-1.5 right-1.5 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                  {matchingServices.map((match) => (
                                    <div
                                      key={match.id}
                                      onMouseDown={() => {
                                        updateService(s.id, 'descricao', match.descricao);
                                        updateService(s.id, 'valor', match.valor);
                                        setActiveServiceRowId(null);
                                      }}
                                      className="p-2 hover:bg-red-50 cursor-pointer flex justify-between items-center text-xs transition"
                                    >
                                      <span className="font-semibold text-slate-800">{match.descricao}</span>
                                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {formatCurrency(match.valor)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            <td className="p-1.5 w-44">
                              <CurrencyInput
                                value={s.valor}
                                onChange={(v) => updateService(s.id, 'valor', v)}
                                className="bg-slate-50 focus:bg-white border-slate-200"
                              />
                            </td>

                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeService(s.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/80 font-bold text-slate-800 border-t border-slate-200">
                        <td className="p-2 text-right uppercase text-[11px]">
                          Subtotal Serviços:
                        </td>
                        <td className="p-2 text-right font-mono text-sm text-slate-900">
                          {formatCurrency(totals.totalServicos)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* PEÇAS TABLE */}
              <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-red-600" />
                    <span>Peças e Componentes Aplicados</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => addPart()}
                    className="text-xs font-semibold bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Peça</span>
                  </button>
                </div>

                <div className="overflow-x-visible">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider">
                        <th className="p-2 rounded-l">Descrição da Peça (digite para autocompletar)</th>
                        <th className="p-2 w-20">Unidade</th>
                        <th className="p-2 w-20 text-center">Qtd</th>
                        <th className="p-2 w-36 text-right">Preço Un. (R$)</th>
                        <th className="p-2 w-32 text-right">Total Linha</th>
                        <th className="p-2 w-10 text-center rounded-r"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pecas.map((p) => {
                        const totalLinha = (p.qtd || 0) * (p.preco || 0);
                        const matchingParts = catalogParts.filter(
                          (cp) =>
                            p.descricao.trim().length > 0 &&
                            cp.descricao.toLowerCase().includes(p.descricao.toLowerCase())
                        );

                        return (
                          <tr key={p.id} className="group">
                            <td className="p-1.5 relative">
                              <input
                                type="text"
                                value={p.descricao}
                                onFocus={() => setActivePartRowId(p.id)}
                                onBlur={() => setTimeout(() => setActivePartRowId(null), 250)}
                                onChange={(e) => {
                                  updatePart(p.id, 'descricao', e.target.value);
                                  setActivePartRowId(p.id);
                                }}
                                placeholder="Digite para buscar... Ex: Óleo 5W30, Filtro, Pastilha"
                                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                              />

                              {/* Autocomplete Dropdown ao digitar */}
                              {activePartRowId === p.id && matchingParts.length > 0 && (
                                <div className="absolute left-1.5 right-1.5 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                  {matchingParts.map((match) => (
                                    <div
                                      key={match.id}
                                      onMouseDown={() => {
                                        updatePart(p.id, 'descricao', match.descricao);
                                        updatePart(p.id, 'unidade', match.unidade);
                                        updatePart(p.id, 'preco', match.preco);
                                        setActivePartRowId(null);
                                      }}
                                      className="p-2 hover:bg-red-50 cursor-pointer flex justify-between items-center text-xs transition"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-800">{match.descricao}</span>
                                        <span className="text-[10px] text-slate-400 ml-1.5">({match.unidade})</span>
                                      </div>
                                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {formatCurrency(match.preco)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            <td className="p-1.5">
                              <input
                                type="text"
                                value={p.unidade}
                                onChange={(e) => updatePart(p.id, 'unidade', e.target.value.toUpperCase())}
                                placeholder="UN"
                                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-center uppercase text-slate-800 focus:ring-1 focus:ring-red-500 focus:outline-none"
                              />
                            </td>

                            <td className="p-1.5">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={p.qtd || ''}
                                onChange={(e) => updatePart(p.id, 'qtd', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-mono text-center text-slate-800 focus:ring-1 focus:ring-red-500 focus:outline-none"
                              />
                            </td>

                            <td className="p-1.5 w-36">
                              <CurrencyInput
                                value={p.preco}
                                onChange={(v) => updatePart(p.id, 'preco', v)}
                                className="bg-slate-50 focus:bg-white border-slate-200"
                              />
                            </td>

                            <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(totalLinha)}
                            </td>

                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removePart(p.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/80 font-bold text-slate-800 border-t border-slate-200">
                        <td colSpan={4} className="p-2 text-right uppercase text-[11px]">
                          Subtotal Peças:
                        </td>
                        <td className="p-2 text-right font-mono text-sm text-slate-900">
                          {formatCurrency(totals.totalPecas)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FECHAMENTO & PAGAMENTO */}
          {activeTab === 'pagamento' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <CreditCard className="w-4 h-4 text-red-600" />
                  <span>Condições Comerciais e Pagamento</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                    >
                      <option value="CARTÃO DE CRÉDITO">Cartão de Crédito</option>
                      <option value="CARTÃO DE DÉBITO">Cartão de Débito</option>
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="BOLETO BANCÁRIO / FATURADO">Boleto / Faturado</option>
                      <option value="TRANSFERÊNCIA BANCÁRIA">Transferência TED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Prazo / Parcelas
                    </label>
                    <input
                      type="text"
                      value={prazoPagamento}
                      onChange={(e) => setPrazoPagamento(e.target.value)}
                      placeholder="Ex: 3x Sem Juros / À Vista"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Desconto / Abatimento Especial (R$)
                  </label>
                  <CurrencyInput
                    value={descontoValor}
                    onChange={(v) => setDescontoValor(v)}
                    className="bg-white border-red-300 text-red-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Observações Internas / Recomendações
                  </label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Instruções para o cliente, recomendações para próxima revisão..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
                  />
                </div>

              </div>

              {/* Card de Resumo Financeiro */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Demonstrativo Financeiro da OS
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Subtotal de Mão de Obra ({servicos.length} itens):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(totals.totalServicos)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Subtotal de Peças ({pecas.length} itens):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(totals.totalPecas)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
                      <span>Total Bruto:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatCurrency(totals.subtotalBruto)}
                      </span>
                    </div>

                    {totals.desconto > 0 && (
                      <div className="flex justify-between items-center text-red-600 font-semibold bg-red-50 p-2 rounded-lg">
                        <span>Desconto Concedido:</span>
                        <span className="font-mono">-{formatCurrency(totals.desconto)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-end">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-500 block">
                      Total a Pagar:
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {formaPagamento} {prazoPagamento ? `(${prazoPagamento})` : ''}
                    </span>
                  </div>
                  <span className="text-3xl font-black text-red-600 font-mono tabular-nums">
                    {formatCurrency(totals.totalGeral)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RESUMO & ENVIO */}
          {activeTab === 'resumo' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3 mb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {tipoDoc} #{numeroOS}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cliente: <strong>{clienteNome || 'Não informado'}</strong> · Veículo: <strong>{veiculoMarca} {veiculoModelo} ({veiculoMatricula || 'Sem placa'})</strong>
                    </p>
                    {mecanicoResponsavel && (
                      <p className="text-[11px] text-slate-600 font-medium">
                        Mecânico Responsável: <span className="font-bold text-slate-900">{mecanicoResponsavel}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-red-600 font-mono">
                      {formatCurrency(totals.totalGeral)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-700 mb-1">Mão de Obra ({servicos.length})</p>
                    {servicos.length > 0 ? (
                      <ul className="space-y-1 text-slate-600">
                        {servicos.map((s, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span className="truncate">{s.descricao || 'Serviço'}</span>
                            <span className="font-mono">{formatCurrency(s.valor)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 italic">Nenhum serviço registrado</p>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-700 mb-1">Peças e Materiais ({pecas.length})</p>
                    {pecas.length > 0 ? (
                      <ul className="space-y-1 text-slate-600">
                        {pecas.map((p, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span className="truncate">{p.qtd}x {p.descricao || 'Peça'}</span>
                            <span className="font-mono">{formatCurrency((p.qtd || 0) * (p.preco || 0))}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 italic">Nenhuma peça registrada</p>
                    )}
                  </div>
                </div>

                {/* Auto PDF Hint */}
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg mb-3 flex items-center gap-2 text-xs text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Envio Prático:</strong> Ao clicar no botão do WhatsApp, a ordem de serviço é salva e o PDF é preparado/baixado automaticamente para você anexar direto na conversa!
                  </span>
                </div>

                {/* Direct Action buttons: WhatsApp, PDF, Print */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (!clienteTelefone) {
                        alert('Por favor, preencha o telefone do cliente na aba 1.');
                        return;
                      }
                      const order = buildCurrentOrder();
                      onSave(order);
                      if (onDownloadPdf) {
                        onDownloadPdf(order);
                      }
                      const msg = generateWhatsAppMessage(order, config);
                      const url = getWhatsAppUrl(clienteTelefone, msg);
                      window.open(url, '_blank');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Orçamento no WhatsApp (Baixa PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!clienteTelefone) {
                        alert('Por favor, preencha o telefone do cliente na aba 1.');
                        return;
                      }
                      const order = buildCurrentOrder();
                      onSave(order);
                      if (onDownloadPdf) {
                        onDownloadPdf(order);
                      }
                      const msg = generateWhatsAppReadyMessage(order, config);
                      const url = getWhatsAppUrl(clienteTelefone, msg);
                      window.open(url, '_blank');
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Avisar Pronto no WhatsApp (Baixa PDF)</span>
                  </button>

                  {onDownloadPdf && (
                    <button
                      type="button"
                      onClick={() => {
                        const order = buildCurrentOrder();
                        onSave(order);
                        onDownloadPdf(order);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar PDF Oficial</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAndPrint}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Salvar e Imprimir</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={() => {
                    const order = buildCurrentOrder();
                    onSave(order);
                    onDownloadPdf(order);
                  }}
                  className="w-auto border border-red-600 text-red-600 hover:bg-red-50 px-3.5 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5"
                  title="Baixar arquivo PDF da OS"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Baixar PDF</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveAndPrint}
                className="w-1/2 sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Salvar e Imprimir</span>
              </button>

              <button
                type="submit"
                className="w-1/2 sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Registro</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
