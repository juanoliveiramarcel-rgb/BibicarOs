import React, { useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_WORKSHOP_CONFIG,
  INITIAL_ORDERS,
  INITIAL_INVENTORY,
} from './data/initialData';
import {
  DocumentType,
  OrderStatus,
  ServiceOrder,
  WorkshopConfig,
  InventoryItem,
  CashRegisterSession,
  BillItem,
  CashMovement,
  MechanicProfile,
} from './types';
import { Header, AppActiveView } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { FilterBar } from './components/FilterBar';
import { OrderTable } from './components/OrderTable';
import { OrderKanban } from './components/OrderKanban';
import { CustomerDirectory } from './components/CustomerDirectory';
import { InventoryManager } from './components/InventoryManager';
import { MechanicCommissions } from './components/MechanicCommissions';
import { FinancialManager } from './components/FinancialManager';
import { ReportsManager } from './components/ReportsManager';
import { VehicleHistoryModal } from './components/VehicleHistoryModal';
import { OilStickerModal } from './components/OilStickerModal';
import { OrderModal } from './components/OrderModal';
import { SettingsModal } from './components/SettingsModal';
import { PrintDocument } from './components/PrintDocument';
import { BlankInspectionPrint } from './components/BlankInspectionPrint';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { NFeModal } from './components/NFeModal';
import { DialogModal } from './components/DialogModal';
import { exportOrdersToExcel, importOrdersFromExcel } from './utils/excel';
import {
  downloadServiceOrderPdf,
  downloadBlankInspectionPdf,
} from './utils/pdfGenerator';
import { getStoredMechanics, DEFAULT_MECHANICS } from './utils/mechanicsStorage';
import { safeSetItem, safeRemoveItem, downloadJsonFile } from './utils/safeStorage';
import { StorageAlertBanner } from './components/StorageAlertBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

export default function App() {
  // Workshop Configuration State
  const [config, setConfig] = useState<WorkshopConfig>(() => {
    try {
      const saved = localStorage.getItem('bibicar_config');
      return saved ? JSON.parse(saved) : DEFAULT_WORKSHOP_CONFIG;
    } catch (e) {
      console.warn('[Bibicar OS] Falha ao carregar configurações do localStorage. Usando padrão.', e);
      return DEFAULT_WORKSHOP_CONFIG;
    }
  });

  // Orders State
  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    try {
      const saved = localStorage.getItem('bibicar_os_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_ORDERS;
    } catch (e) {
      console.warn('[Bibicar OS] Falha ao carregar ordens de serviço do localStorage.', e);
      return INITIAL_ORDERS;
    }
  });

  // Persist Config
  useEffect(() => {
    safeSetItem('bibicar_config', JSON.stringify(config));
  }, [config]);

  // Persist Orders
  useEffect(() => {
    safeSetItem('bibicar_os_data', JSON.stringify(orders));
  }, [orders]);

  // Inventory State
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('bibicar_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_INVENTORY;
    } catch (e) {
      console.warn('[Bibicar OS] Falha ao carregar estoque do localStorage.', e);
      return INITIAL_INVENTORY;
    }
  });

  // Persist Inventory
  useEffect(() => {
    safeSetItem('bibicar_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Cash Register State (Fluxo de Caixa)
  const [cashSession, setCashSession] = useState<CashRegisterSession | null>(() => {
    try {
      const saved = localStorage.getItem('bibicar_cash_register');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('[Bibicar OS] Falha ao carregar sessão de caixa do localStorage.', e);
      return null;
    }
  });

  useEffect(() => {
    if (cashSession) {
      safeSetItem('bibicar_cash_register', JSON.stringify(cashSession));
    } else {
      safeRemoveItem('bibicar_cash_register');
    }
  }, [cashSession]);

  // Bills State (Contas a Pagar e Receber)
  const [bills, setBills] = useState<BillItem[]>(() => {
    try {
      const saved = localStorage.getItem('bibicar_bills');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch (e) {
      console.warn('[Bibicar OS] Falha ao carregar contas a pagar/receber do localStorage.', e);
      return [];
    }
  });

  useEffect(() => {
    safeSetItem('bibicar_bills', JSON.stringify(bills));
  }, [bills]);

  // Mechanics State (Equipe & Comissões Centralizadas)
  const [mechanics, setMechanics] = useState<MechanicProfile[]>(() => {
    try {
      return getStoredMechanics();
    } catch (e) {
      console.warn('[Bibicar OS] Falha ao inicializar cadastro de mecânicos.', e);
      return DEFAULT_MECHANICS;
    }
  });

  useEffect(() => {
    safeSetItem('bibicar_mechanics', JSON.stringify(mechanics));
  }, [mechanics]);

  // Monitoramento preventivo de exceções globais e rejeições assíncronas
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.warn('[Bibicar OS Uncaught Handler] Exceção capturada:', event.error || event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('[Bibicar OS Unhandled Promise] Rejeição assíncrona capturada:', event.reason);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // View state
  const [activeView, setActiveView] = useState<AppActiveView>('table');

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Vehicle History Modal State
  const [isVehicleHistoryOpen, setIsVehicleHistoryOpen] = useState(false);
  const [selectedHistoryPlate, setSelectedHistoryPlate] = useState<string>('');

  // Oil Sticker Modal State
  const [isOilStickerOpen, setIsOilStickerOpen] = useState(false);
  const [oilStickerOrder, setOilStickerOrder] = useState<ServiceOrder | null>(null);

  // NF-e Fiscal Emission Modal State
  const [isNFeModalOpen, setIsNFeModalOpen] = useState(false);
  const [selectedNFeOrder, setSelectedNFeOrder] = useState<ServiceOrder | null>(null);

  // Printing & PDF Preview State
  const [printMode, setPrintMode] = useState<'order' | 'inspection_blank'>('order');
  const [orderToPrint, setOrderToPrint] = useState<ServiceOrder | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfPreviewOrder, setPdfPreviewOrder] = useState<ServiceOrder | null>(null);
  const [pdfPreviewMode, setPdfPreviewMode] = useState<'order' | 'inspection_blank'>('order');

  // PDF Generation Background Indicator State
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState('');

  // Dialog / Alert State
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoDocFilter, setTipoDocFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Otimização de Performance: Lógica de filtragem memoizada com useMemo
  const filteredOrders = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return orders.filter((item) => {
      // Status filter
      if (statusFilter !== 'TODOS' && item.statusOS !== statusFilter) {
        return false;
      }

      // Document Type filter
      const itemTipo = item.tipoDoc || 'ORDEM DE SERVIÇO';
      if (tipoDocFilter !== 'TODOS' && itemTipo !== tipoDocFilter) {
        return false;
      }

      // Date range filter
      const itemDate = item.veiculo?.dataEntrada;
      if (startDate && itemDate && itemDate < startDate) {
        return false;
      }
      if (endDate && itemDate && itemDate > endDate) {
        return false;
      }

      // Text search
      if (!q) return true;

      const fullText = [
        item.numeroOS,
        item.cliente?.nome,
        item.cliente?.documento,
        item.cliente?.telefone,
        item.veiculo?.marca,
        item.veiculo?.modelo,
        item.veiculo?.matricula,
        item.statusOS,
        ...(item.servicos || []).map((s) => s.descricao),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return fullText.includes(q);
    });
  }, [orders, statusFilter, tipoDocFilter, startDate, endDate, searchTerm]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setTipoDocFilter('TODOS');
    setStatusFilter('TODOS');
    setStartDate('');
    setEndDate('');
  };

  // Order Operations
  const handleNewOrder = () => {
    setEditingOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleEditOrder = (order: ServiceOrder) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleDuplicateOrder = (order: ServiceOrder) => {
    const copy: ServiceOrder = {
      ...order,
      id: `os-${Date.now()}`,
      numeroOS: (orders.length + 1).toString().padStart(5, '0'),
      tipoDoc: 'ORDEM DE SERVIÇO',
      statusOS: 'ORÇAMENTO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingOrder(copy);
    setIsOrderModalOpen(true);
  };

  const handleDeleteOrder = (id: string) => {
    const target = orders.find((o) => o.id === id);
    setDialog({
      isOpen: true,
      title: 'Excluir Registro',
      message: `Tem certeza que deseja excluir a Ordem de Serviço #${target?.numeroOS || ''}? Esta ação não pode ser desfeita.`,
      type: 'confirm',
      onConfirm: () => {
        setOrders((prev) => prev.filter((o) => o.id !== id));
      },
    });
  };

  const handleSaveOrder = (savedOrder: ServiceOrder) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === savedOrder.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedOrder;
        return copy;
      }
      return [savedOrder, ...prev];
    });
    setIsOrderModalOpen(false);
  };

  // PDF & Print Actions
  const handleDownloadOrderPdf = async (order: ServiceOrder) => {
    setPdfGenerating(true);
    setPdfStatusMessage(`Baixando PDF da OS #${order.numeroOS}...`);

    const ok = await downloadServiceOrderPdf(order, config);
    setPdfGenerating(false);

    if (ok) {
      const cleanClient = (order.cliente?.nome || 'cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `OS_${order.numeroOS || '000'}_${cleanClient}.pdf`;
      setDialog({
        isOpen: true,
        title: 'PDF Baixado com Sucesso!',
        message: `O arquivo ${fileName} foi salvo no seu dispositivo. Você já pode imprimi-lo ou anexá-lo diretamente no WhatsApp.`,
        type: 'success',
      });
    } else {
      setDialog({
        isOpen: true,
        title: 'Falha no PDF',
        message: 'Não foi possível gerar o arquivo PDF. Tente usar a opção de Impressão.',
        type: 'error',
      });
    }
  };

  const handleDownloadBlankInspectionPdf = async (order?: ServiceOrder | null) => {
    setPdfGenerating(true);
    setPdfStatusMessage('Baixando PDF da Ficha de Vistoria...');

    const ok = await downloadBlankInspectionPdf(order || null, config);
    setPdfGenerating(false);

    if (ok) {
      const fileName = `Ficha_Vistoria_${order?.numeroOS ? `OS_${order.numeroOS}` : 'Oficina'}.pdf`;
      setDialog({
        isOpen: true,
        title: 'Ficha de Vistoria Baixada!',
        message: `O arquivo ${fileName} foi salvo no seu dispositivo pronto para impressão.`,
        type: 'success',
      });
    } else {
      setDialog({
        isOpen: true,
        title: 'Falha no PDF',
        message: 'Não foi possível gerar o arquivo PDF da vistoria.',
        type: 'error',
      });
    }
  };

  const handlePrintOrder = (order: ServiceOrder) => {
    setOrderToPrint(order);
    setPrintMode('order');
    setPdfPreviewOrder(order);
    setPdfPreviewMode('order');
    setIsPdfPreviewOpen(true);
  };

  const handlePrintBlankInspection = (order?: ServiceOrder | null) => {
    setOrderToPrint(order || null);
    setPrintMode('inspection_blank');
    setPdfPreviewOrder(order || null);
    setPdfPreviewMode('inspection_blank');
    setIsPdfPreviewOpen(true);
  };

  const handleSaveAndPrint = (order: ServiceOrder) => {
    handleSaveOrder(order);
    handlePrintOrder(order);
  };

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, statusOS: newStatus, updatedAt: new Date().toISOString() } : o))
    );
  };

  // Customer Directory Helper
  const handleNewOrderForCustomer = (clientName: string, vehiclePlate?: string) => {
    const existing = orders.find(
      (o) =>
        o.cliente?.nome?.trim().toLowerCase() === clientName.trim().toLowerCase() &&
        (!vehiclePlate || o.veiculo?.matricula === vehiclePlate)
    );

    if (existing) {
      handleDuplicateOrder(existing);
    } else {
      handleNewOrder();
    }
  };

  const handleFilterByCustomer = (clientName: string) => {
    setSearchTerm(clientName);
    setActiveView('table');
  };

  const handleOpenVehicleHistory = (plate: string) => {
    if (!plate) return;
    setSelectedHistoryPlate(plate);
    setIsVehicleHistoryOpen(true);
  };

  // Excel & Backup Actions
  const handleExportExcel = () => {
    if (orders.length === 0) {
      setDialog({
        isOpen: true,
        title: 'Sem Dados',
        message: 'Não há registros para exportar.',
        type: 'info',
      });
      return;
    }
    exportOrdersToExcel(
      filteredOrders.length > 0 ? filteredOrders : orders,
      `bibicar_ordens_servico_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const handleImportExcel = async (file: File) => {
    try {
      const result = await importOrdersFromExcel(file, orders);
      if (result.count > 0) {
        setOrders((prev) => [...result.imported, ...prev]);
        setDialog({
          isOpen: true,
          title: 'Importação Concluída!',
          message: `${result.count} registro(s) da planilha foram importados com sucesso para o sistema.`,
          type: 'success',
        });
      } else {
        setDialog({
          isOpen: true,
          title: 'Nenhum Dado Encontrado',
          message: 'Não foi possível identificar colunas de cliente, modelo ou placa na planilha selecionada.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error(err);
      setDialog({
        isOpen: true,
        title: 'Erro na Leitura',
        message: 'Ocorreu um erro ao processar o arquivo Excel. Verifique se a planilha é válida.',
        type: 'error',
      });
    }
  };

  const handleExportBackup = () => {
    try {
      const fullBackup = {
        app: 'Bibicar OS',
        exportDate: new Date().toISOString(),
        version: '2.0',
        data: {
          bibicar_config: JSON.stringify(config),
          bibicar_os_data: JSON.stringify(orders),
          bibicar_inventory: JSON.stringify(inventory),
          bibicar_cash_register: cashSession ? JSON.stringify(cashSession) : null,
          bibicar_bills: JSON.stringify(bills),
          bibicar_mechanics: JSON.stringify(mechanics),
        },
      };

      downloadJsonFile(
        `Backup_Completo_Bibicar_OS_${new Date().toISOString().split('T')[0]}.json`,
        fullBackup
      );
    } catch (err) {
      console.warn('[Bibicar OS] Falha ao exportar cópia de segurança:', err);
      setDialog({
        isOpen: true,
        title: 'Falha no Backup',
        message: 'Ocorreu um erro ao gerar a cópia de segurança.',
        type: 'error',
      });
    }
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawContent = e.target?.result as string;
        if (!rawContent || !rawContent.trim()) {
          throw new Error('Arquivo de backup vazio');
        }

        const imported = JSON.parse(rawContent);
        if (imported && imported.data) {
          // Full Backup Format (v2.0)
          let restoredModulesCount = 0;

          if (imported.data.bibicar_config) {
            try {
              const parsedConfig = JSON.parse(imported.data.bibicar_config);
              setConfig(parsedConfig);
              restoredModulesCount++;
            } catch (err) {
              console.warn('[Bibicar OS Backup] Módulo de configurações corrompido no arquivo:', err);
            }
          }

          if (imported.data.bibicar_os_data) {
            try {
              const parsedOrders = JSON.parse(imported.data.bibicar_os_data);
              if (Array.isArray(parsedOrders)) {
                setOrders(parsedOrders);
                restoredModulesCount++;
              }
            } catch (err) {
              console.warn('[Bibicar OS Backup] Módulo de Ordens de Serviço corrompido:', err);
            }
          }

          if (imported.data.bibicar_inventory) {
            try {
              const parsedInventory = JSON.parse(imported.data.bibicar_inventory);
              if (Array.isArray(parsedInventory)) {
                setInventory(parsedInventory);
                restoredModulesCount++;
              }
            } catch (err) {
              console.warn('[Bibicar OS Backup] Módulo de estoque corrompido:', err);
            }
          }

          if (imported.data.bibicar_cash_register) {
            try {
              const parsedCash = JSON.parse(imported.data.bibicar_cash_register);
              setCashSession(parsedCash);
              restoredModulesCount++;
            } catch (err) {
              console.warn('[Bibicar OS Backup] Módulo de caixa diário corrompido:', err);
            }
          }

          if (imported.data.bibicar_bills) {
            try {
              const parsedBills = JSON.parse(imported.data.bibicar_bills);
              if (Array.isArray(parsedBills)) {
                setBills(parsedBills);
                restoredModulesCount++;
              }
            } catch (err) {
              console.warn('[Bibicar OS Backup] Módulo de contas a pagar/receber corrompido:', err);
            }
          }

          if (imported.data.bibicar_mechanics) {
            try {
              const parsedMechanics =
                typeof imported.data.bibicar_mechanics === 'string'
                  ? JSON.parse(imported.data.bibicar_mechanics)
                  : imported.data.bibicar_mechanics;
              if (Array.isArray(parsedMechanics)) {
                setMechanics(parsedMechanics);
                restoredModulesCount++;
              }
            } catch (err) {
              console.warn('[Bibicar OS Backup] Módulo de mecânicos e comissões corrompido:', err);
            }
          }

          setDialog({
            isOpen: true,
            title: 'Backup Completo Restaurado!',
            message: `Restauração concluída com sucesso! ${restoredModulesCount} módulo(s) de dados foram sincronizados no sistema.`,
            type: 'success',
          });
        } else if (Array.isArray(imported)) {
          // Legacy OS array format
          setOrders(imported);
          setDialog({
            isOpen: true,
            title: 'Backup de OS Restaurado!',
            message: `${imported.length} registro(s) de Ordens de Serviço foram restaurados com sucesso.`,
            type: 'success',
          });
        } else {
          setDialog({
            isOpen: true,
            title: 'Arquivo Inválido',
            message: 'O arquivo JSON selecionado não contém uma estrutura de backup reconhecida do Bibicar OS.',
            type: 'error',
          });
        }
      } catch (err) {
        console.warn('[Bibicar OS] Falha na interpretação do arquivo JSON de backup:', err);
        setDialog({
          isOpen: true,
          title: 'Erro de Leitura',
          message: 'Não foi possível ler o arquivo JSON de backup. Verifique se o arquivo está corrompido.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Storage Quota Protection & Emergency Recovery Banner */}
      <StorageAlertBanner onOpenSettings={() => setIsSettingsModalOpen(true)} />

      {/* Header Bar */}
      <Header
        config={config}
        activeView={activeView}
        setActiveView={setActiveView}
        onNewOrder={handleNewOrder}
        onExportExcel={handleExportExcel}
        onImportExcel={handleImportExcel}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 no-print">
        <ErrorBoundary fallbackTitle="Falha no Módulo Selecionado">
          {/* KPI Dashboard */}
          <MetricsCards
          orders={orders}
          onFilterStatus={(st) => {
            setStatusFilter(st);
            setActiveView('table');
          }}
        />

        {/* View 1: Table List */}
        {activeView === 'table' && (
          <div className="space-y-4">
            <FilterBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              tipoDocFilter={tipoDocFilter}
              setTipoDocFilter={setTipoDocFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onClearFilters={handleClearFilters}
              totalFiltered={filteredOrders.length}
              totalOverall={orders.length}
            />

            <OrderTable
              orders={filteredOrders}
              config={config}
              onEdit={handleEditOrder}
              onPrint={handlePrintOrder}
              onDownloadPdf={handleDownloadOrderPdf}
              onDuplicate={handleDuplicateOrder}
              onDelete={handleDeleteOrder}
              onNewOrder={handleNewOrder}
              onOpenOilSticker={(order) => {
                setOilStickerOrder(order);
                setIsOilStickerOpen(true);
              }}
              onOpenVehicleHistory={handleOpenVehicleHistory}
              onOpenNFeModal={(order) => {
                setSelectedNFeOrder(order);
                setIsNFeModalOpen(true);
              }}
            />
          </div>
        )}

        {/* View 2: Workshop Kanban */}
        {activeView === 'kanban' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <h2 className="font-extrabold text-sm text-slate-800">
                  Quadro de Fluxo da Oficina (Pátio & Elevador)
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhe em tempo real a evolução de cada veículo desde o orçamento até a entrega
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {orders.length} veículo(s) no sistema
              </span>
            </div>

            <OrderKanban
              orders={orders}
              config={config}
              onUpdateStatus={handleUpdateStatus}
              onEdit={handleEditOrder}
              onPrint={handlePrintOrder}
              onDownloadPdf={handleDownloadOrderPdf}
              onOpenOilSticker={(order) => {
                setOilStickerOrder(order);
                setIsOilStickerOpen(true);
              }}
              onOpenVehicleHistory={handleOpenVehicleHistory}
            />
          </div>
        )}

        {/* View 3: Customer & Fleet Directory */}
        {activeView === 'customers' && (
          <CustomerDirectory
            orders={orders}
            onNewOrderForCustomer={handleNewOrderForCustomer}
            onFilterByCustomer={handleFilterByCustomer}
            onOpenVehicleHistory={handleOpenVehicleHistory}
          />
        )}

        {/* View 4: Inventory & Parts Stock */}
        {activeView === 'inventory' && (
          <InventoryManager
            items={inventory}
            onUpdateItems={setInventory}
          />
        )}

        {/* View 5: Financial Manager (Caixa Diário, Contas a Pagar/Receber & Comissões) */}
        {activeView === 'financial' && (
          <FinancialManager
            orders={orders}
            config={config}
            bills={bills}
            onUpdateBills={setBills}
            cashSession={cashSession}
            onUpdateCashSession={setCashSession}
          />
        )}

        {/* View 6: Strategic Reports & CRM (Curva ABC, Faturamento, Aniversariantes) */}
        {activeView === 'reports' && (
          <ReportsManager
            orders={orders}
            config={config}
            inventory={inventory}
            bills={bills}
          />
        )}

        {/* View 7: Direct Mechanic Commissions Tab */}
        {activeView === 'commissions' && (
          <MechanicCommissions
            orders={orders}
            config={config}
            mechanics={mechanics}
            onUpdateMechanics={setMechanics}
          />
        )}
        </ErrorBoundary>
      </main>

      {/* Interactive PDF Document Preview & Print Modal */}
      {isPdfPreviewOpen && (
        <PdfPreviewModal
          isOpen={isPdfPreviewOpen}
          onClose={() => setIsPdfPreviewOpen(false)}
          order={pdfPreviewOrder}
          config={config}
          mode={pdfPreviewMode}
        />
      )}

      {/* Printable Document for Browser @media print */}
      {printMode === 'order' && orderToPrint ? (
        <PrintDocument order={orderToPrint} config={config} id="printArea" />
      ) : orderToPrint ? (
        <BlankInspectionPrint order={orderToPrint} config={config} id="blankPrintArea" />
      ) : null}

      {/* Vehicle Timeline / Complete Health Records Modal */}
      {isVehicleHistoryOpen && selectedHistoryPlate && (
        <VehicleHistoryModal
          isOpen={isVehicleHistoryOpen}
          onClose={() => setIsVehicleHistoryOpen(false)}
          plate={selectedHistoryPlate}
          orders={orders}
          config={config}
          onNewOrderForPlate={(baseOrder) => {
            setIsVehicleHistoryOpen(false);
            handleDuplicateOrder(baseOrder);
          }}
        />
      )}

      {/* Windshield Oil Change Sticker Modal */}
      {isOilStickerOpen && oilStickerOrder && (
        <OilStickerModal
          isOpen={isOilStickerOpen}
          onClose={() => setIsOilStickerOpen(false)}
          order={oilStickerOrder}
          config={config}
        />
      )}

      {/* Create / Edit Modal */}
      {isOrderModalOpen && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onSave={handleSaveOrder}
          onSaveAndPrint={handleSaveAndPrint}
          onDownloadPdf={handleDownloadOrderPdf}
          onPrintBlankInspection={handlePrintBlankInspection}
          onDownloadBlankInspectionPdf={handleDownloadBlankInspectionPdf}
          initialOrder={editingOrder}
          existingOrders={orders}
          config={config}
        />
      )}

      {/* Workshop Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          config={config}
          onSaveConfig={setConfig}
        />
      )}

      {/* NF-e Fiscal Emission & DANFE Document Modal */}
      {isNFeModalOpen && selectedNFeOrder && (
        <NFeModal
          isOpen={isNFeModalOpen}
          onClose={() => setIsNFeModalOpen(false)}
          order={selectedNFeOrder}
          config={config}
          onSaveOrder={handleSaveOrder}
        />
      )}

      {/* Custom Dialog / Confirmation Modal */}
      {dialog.isOpen && (
        <DialogModal
          isOpen={dialog.isOpen}
          title={dialog.title}
          message={dialog.message}
          type={dialog.type}
          onCancel={() => setDialog({ ...dialog, isOpen: false })}
          onConfirm={dialog.onConfirm}
        />
      )}

      {/* PDF Generation Loading Indicator */}
      {pdfGenerating && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-3 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Preparando PDF Oficial</h3>
            <p className="text-xs text-slate-500">{pdfStatusMessage || 'Processando layout de alta resolução...'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
