import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useBudget } from '../../hooks/useBudget';
import { ProjectHeader } from './components/ProjectHeader';
import { BudgetTable } from './components/BudgetTable';
import { FinancialSummaryPanel } from './components/FinancialSummaryPanel';
import { TemplateSelector } from './components/TemplateSelector';
import { FileText, Receipt, HardHat, FolderOpen, Download, Plus, Save, Loader2, Check, AlertTriangle, Calculator, BarChart3, GitBranch, History, Box, RefreshCcw, FileSpreadsheet } from 'lucide-react';
import { ExpensesTab } from './components/ExpensesTab';
import { WorkersTab } from './components/WorkersTab';
import type { BudgetTab } from './types';
import { applyTemplate } from './templates';
import type { Template } from './templates';
import { SyncIndicatorInline } from '../../components/SyncIndicator';
import { BMLogo } from '../../components/ui/BMLogo';
import { ContingenciesTab } from './components/ContingenciesTab';
import { AnalysisTab } from './components/AnalysisTab';
import { downloadBudgetPDF } from './ProfessionalReportService';
import toast from 'react-hot-toast';
import { AuditLogSidebar } from './components/AuditLogSidebar';
import { DocumentsTab } from './components/DocumentsTab';
import { BimTab } from './components/BimTab';
import { CashflowTab } from './components/CashflowTab';
import { ConfirmModal } from '../../components/Modal';
import { BudgetBulkImporter } from './components/BudgetBulkImporter';
import { AIAssistant } from './components/AIAssistant';

const TABS: { id: BudgetTab; label: string; icon: ReactNode }[] = [
  { id: 'presupuesto', label: 'Presupuesto', icon: <FileText size={14} /> },
  { id: 'gastos', label: 'Gastos', icon: <Receipt size={14} /> },
  { id: 'trabajadores', label: 'Trabajadores', icon: <HardHat size={14} /> },
  { id: 'contingencias', label: 'Contingencias', icon: <AlertTriangle size={14} /> },
  { id: 'analisis', label: 'Análisis', icon: <BarChart3 size={14} /> },
  { id: 'bim', label: 'Visor BIM 3D', icon: <Box size={14} /> },
  { id: 'cashflow', label: 'Caja', icon: <Calculator size={14} /> },
  { id: 'documentos', label: 'Documentos', icon: <FolderOpen size={14} /> },
];

interface ServerBudget {
  id: string;
  project_id: string;
  status: string;
  code?: string;
  version: number;
  total_estimated_price: string | number;
  project?: {
    name: string;
    client_id?: string;
    client?: {
      name: string;
    };
    location?: string;
    start_date?: string;
    end_date?: string;
    company?: {
      name: string;
      logo_url?: string;
      address?: string;
      phone?: string;
      email?: string;
      rut?: string;
    };
    budget_currency?: string;
    price_currency?: string;
  };
  stages?: Array<{
    id: string;
    name: string;
    progress?: number;
    items?: Array<{
      id: string;
      name: string;
      quantity: string | number;
      unit: string;
      unit_cost?: string | number;
      unit_price: string | number;
      apu_template_id?: string;
      cubication_mode?: string;
      dim_length?: string | number;
      dim_width?: string | number;
      dim_height?: string | number;
      dim_thickness?: string | number;
      quantity_executed?: string | number;
      real_cost?: string | number;
      ifc_global_id?: string;
    }>;
  }>;
}

export default function BudgetEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const { data: serverBudget, isLoading, error } = useQuery<ServerBudget>({
    queryKey: ['budget', id],
    queryFn: async () => {
      const response = await api.get(`/budgets/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: projectFinancials } = useQuery<{ financials: any }>({
    queryKey: ['project-financials', serverBudget?.project_id],
    queryFn: () => api.get(`/budgets/project/${serverBudget?.project_id}/summary`).then((r) => r.data),
    enabled: !!serverBudget?.project_id,
  });

  const budgetCtx = useBudget(
    undefined, 
    projectFinancials?.financials?.realExpenses || 0,
    projectFinancials?.financials?.workerPayments || 0,
    projectFinancials?.financials?.contingenciesTotal || 0
  );
  const { budget, financials } = budgetCtx;

  const { data: contingencies = [] } = useQuery<any[]>({
    queryKey: ['contingencies', serverBudget?.project_id],
    queryFn: () => api.get(`/contingencies/by-project/${serverBudget?.project_id}`).then((r) => r.data),
    enabled: !!serverBudget?.project_id,
  });

  const contingenciesTotal = contingencies.reduce((s, c) => s + Number(c.total_cost || 0), 0);

  const { mutateAsync: performSave } = useMutation({
    mutationFn: async () => {
      const payload = {
        total_estimated_cost: financials.estimatedCost,
        total_estimated_price: financials.autoCalculatedPrice || financials.estimatedPrice,
        professional_fee_percentage: budget.professionalFeePercentage ?? 10,
        estimated_utility: financials.estimatedUtility ?? 15,
        markup_percentage: budget.markupPercentage ?? 20,
        status: budget.status,
        stages: budget.stages.map((s, sIdx) => ({
          id: s.id.length < 30 ? undefined : s.id, 
          name: s.name,
          position: sIdx,
          items: s.items.map((i, iIdx) => ({
            id: i.id.length < 30 ? undefined : i.id,
            name: i.name,
            unit: i.unit,
            quantity: i.quantity,
            unit_cost: i.unit_cost || 0,
            unit_price: i.unit_price || 0,
            is_price_overridden: i.is_price_overridden || false,
            item_type: i.item_type || 'material',
            markup_percentage: i.markup_percentage,
            position: iIdx,
            apu_template_id: i.apu_template_id,
            cubication_mode: i.cubication_mode,
            dim_length: i.dim_length,
            dim_width: i.dim_width,
            dim_height: i.dim_height,
            dim_thickness: i.dim_thickness,
            quantity_executed: i.quantity_executed,
            ifc_global_id: i.ifc_global_id,
          })),
        })),
      };
      
      const promises = [api.patch(`/budgets/${id}`, payload)];
      
      if (serverBudget?.project_id) {
        promises.push(api.patch(`/projects/${serverBudget.project_id}`, { 
          name: budget.projectName,
          location: budget.location,
          start_date: budget.start_date,
          end_date: budget.end_date
        }));
      }
      
      if (serverBudget?.project?.client_id && user?.company_id) {
        promises.push(api.patch(`/clients/${serverBudget.project.client_id}?company_id=${user.company_id}`, { name: budget.clientName }));
      }
      
      const results = await Promise.all(promises);
      return results[0];
    },
    onMutate: () => {
      setSaveStatus('saving');
    },
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: (err: any) => {
      if (!navigator.onLine || err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }

      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
      toast.error('Error al guardar el presupuesto. Por favor, intente de nuevo.');
    }
  });

  const handleSave = async () => {
    try {
      await performSave();
    } catch {
      // Silent fail - already handled in performSave
    }
  };

  const { mutate: createRevision, isPending: isCreatingRevision } = useMutation({
    mutationFn: async () => {
      await performSave(); 
      return api.post(`/budgets/${id}/revision`);
    },
    onSuccess: (response) => {
      const newBudget = response.data;
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      toast.success(
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">✓</div>
          <div>
            <p className="font-bold">Nueva versión v{newBudget.version} creada</p>
            <button 
              onClick={() => navigate(`/budget/${newBudget.id}`)}
              className="text-blue-300 underline text-sm"
            >
              Ir a la nueva versión →
            </button>
          </div>
        </div>,
        { duration: 5000 }
      );
    },
    onError: () => {
      toast.error('Error al crear revisión del presupuesto.');
    },
  });

  // Only sync once when the budget data first arrives or changes ID
  useEffect(() => {
    const shouldSync = serverBudget && (!budgetCtx.budget.id || budgetCtx.budget.id !== serverBudget.id || budgetCtx.budget.projectName === 'Cargando...');
    
    if (shouldSync) {
      budgetCtx.setBudget({
        id: serverBudget.id,
        projectName: serverBudget.project?.name || 'Presupuesto',
        code: serverBudget.code,
        clientName: serverBudget.project?.client?.name || 'Cliente',
        status: (serverBudget.status as any) || 'editing',
        clientPrice: Number(serverBudget.total_estimated_price) || 0,
        currency: serverBudget.project?.price_currency || 'CLP',
        professionalFeePercentage: (serverBudget as any).professional_fee_percentage ?? 10,
        estimatedUtility: (serverBudget as any).estimated_utility ?? 15,
        markupPercentage: (serverBudget as any).markup_percentage ?? 20,
        targetMargin: 25,
        location: serverBudget.project?.location || '',
        start_date: (serverBudget as any).project?.start_date || '',
        end_date: (serverBudget as any).project?.end_date || '',
        stages: (serverBudget.stages || []).map((s) => ({
          id: s.id,
          name: s.name,
          progress: s.progress || 0,
          items: (s.items || []).map((i) => ({
            id: i.id,
            name: i.name,
            quantity: Number(i.quantity) || 0,
            unit: i.unit || 'glb',
            unit_price: Number(i.unit_price) || 0,
            unit_cost: Number(i.unit_cost) || 0,
            is_price_overridden: (i as any).is_price_overridden || false,
            item_type: (i as any).item_type || 'material',
            markup_percentage: (i as any).markup_percentage,
            total: (Number(i.quantity) || 0) * (Number(i.unit_price) || 0),
            apu_template_id: i.apu_template_id,
            cubication_mode: (i as any).cubication_mode || 'manual',
            dim_length: Number(i.dim_length) || 0,
            dim_width: Number(i.dim_width) || 0,
            dim_height: Number(i.dim_height) || 0,
            dim_thickness: Number(i.dim_thickness) || 0,
            quantity_executed: Number(i.quantity_executed) || 0,
            real_cost: Number(i.real_cost) || 0,
            ifc_global_id: i.ifc_global_id || undefined,
          })) || []
        })) || [],
        expenses: [], 
        workers: [],
      });
    }
  }, [serverBudget]);

  const [activeTab, setActiveTab] = useState<BudgetTab>('presupuesto');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showRevisionConfirm, setShowRevisionConfirm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfParams, setPdfParams] = useState({ generalExpenses: 12, utility: 18 });

  if (isLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !id) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Error al cargar el presupuesto</h2>
        <p className="text-muted-foreground mb-8">No pudimos encontrar el presupuesto solicitado o hubo un problema de conexión.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl transition-all"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const handleTemplateSelect = (t: Template) => {
    budgetCtx.setStages(applyTemplate(t));
  };

  const handleExportExcel = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const response = await api.get(`/budgets/${id}/export/excel`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const projectName = budget.projectName || 'presupuesto';
      link.setAttribute('download', `Presupuesto_${projectName.replace(/\s+/g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel exportado correctamente');
    } catch {
      toast.error('Error al exportar. Guarda los cambios primero.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setShowPdfModal(true);
  };

  const handleGeneratePDF = async () => {
    if (!id) return;
    setExporting(true);
    try {
      await downloadBudgetPDF({
        budget: budget,
        company: serverBudget?.project?.company,
        professionalName: user?.name,
        hasBimModel: false,
        generalExpensesPercentage: pdfParams.generalExpenses,
        utilityPercentage: pdfParams.utility,
      });
      toast.success('PDF generado correctamente');
      setShowPdfModal(false);
    } catch {
      toast.error('Error al generar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full bg-background text-foreground relative">

      {/* Top nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center pointer-events-none -ml-2">
              <BMLogo variant="icon" className="h-full w-full" />
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-foreground text-lg tracking-tight">Editor</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Status Indicator - Offline/Pending indicator */}
            <SyncIndicatorInline />

            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['budget', id] });
                queryClient.invalidateQueries({ queryKey: ['project-financials'] });
              }}
              title="Refrescar datos"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <RefreshCcw size={16} className={`${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
               onClick={() => navigate('/apu-library')}
               className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
             >
               <Calculator size={13} /> APU
             </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
               >
                 <Plus size={13} /> Plantillas
              </button>
              <button
                 onClick={() => setShowAuditLog(!showAuditLog)}
                 className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-all ${
                   showAuditLog 
                     ? 'bg-blue-600/10 border-blue-500/50 text-blue-500' 
                     : 'text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                 }`}
               >
                 <History size={13} strokeWidth={2.5} /> 
                 Historial
              </button>
              <button
                onClick={() => navigate(`/budget/${id}/field`)}
                className="flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all shadow-sm"
              >
                <HardHat size={13} /> 
                Vista Terreno
              </button>
              <div className="w-px h-4 bg-border mx-2" />
              <button
                onClick={() => budgetCtx.addStage()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={13} /> Etapa
              </button>
              <button
                onClick={() => setShowImporter(true)}
                title="Importar desde Excel"
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FileSpreadsheet size={13} /> Importar
              </button>
              <button
                onClick={() => setShowRevisionConfirm(true)}
                disabled={isCreatingRevision}
                title={`Crear nueva versión (actual: v${serverBudget?.version || 1})`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <GitBranch size={13} /> v{serverBudget?.version || 1}
              </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              id="save-budget-button"
              data-testid="save-budget-button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg transition-all font-medium ${
                saveStatus === 'saved' 
                  ? 'bg-green-600/20 text-green-600 dark:text-green-400 border border-green-500/30' 
                  : saveStatus === 'error'
                  ? 'bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
              }`}
            >
              {saveStatus === 'saving' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check size={13} />
              ) : (
                <Save size={13} />
              )}
              {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? 'Guardado' : 'Guardar Cambios'}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              title="Exportar a Excel (.xlsx)"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={13} /> {exporting ? 'Exportando...' : 'Excel'}
            </button>
            <button
              onClick={handleExportPDF}
              title="Imprimir / Exportar PDF"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={13} /> PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 pb-20">
        <ProjectHeader
          budget={budget}
          financials={financials}
          onUpdate={budgetCtx.updateHeader}
        />

        <div className="flex items-center gap-1 mb-5 bg-card/60 backdrop-blur-sm rounded-xl p-1 border border-border w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
             {activeTab === 'presupuesto' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <BudgetTable
                    stages={budget.stages}
                    onAddStage={budgetCtx.addStage}
                    onUpdateStage={budgetCtx.updateStage}
                    onDuplicateStage={budgetCtx.duplicateStage}
                    onDeleteStage={budgetCtx.deleteStage}
                    onAddItem={budgetCtx.addItem}
                    onUpdateItem={budgetCtx.updateItem}
                    onDuplicateItem={budgetCtx.duplicateItem}
                    onDeleteItem={budgetCtx.deleteItem}
                  />
               </div>
             )}

             {activeTab === 'gastos' && (
               <ExpensesTab projectId={serverBudget?.project_id ?? ''} />
             )}

             {activeTab === 'trabajadores' && (
               <WorkersTab projectId={serverBudget?.project_id ?? ''} />
             )}

             {activeTab === 'contingencias' && (
               <ContingenciesTab projectId={serverBudget?.project_id ?? ''} />
             )}

             {activeTab === 'analisis' && (
                <AnalysisTab 
                  stages={budget.stages} 
                  contingenciesTotal={contingenciesTotal} 
                />
              )}

              {activeTab === 'bim' && serverBudget?.project_id && (
                <BimTab
                  projectId={serverBudget.project_id}
                  stages={budget.stages}
                  onUpdateItem={budgetCtx.updateItem}
                />
              )}

              {activeTab === 'documentos' && serverBudget?.project_id && (
                <DocumentsTab projectId={serverBudget.project_id} />
              )}

              {activeTab === 'cashflow' && serverBudget?.project_id && (
                <CashflowTab 
                  projectId={serverBudget.project_id} 
                  totalClientPrice={budget.clientPrice} 
                />
              )}
          </div>

          <aside className="w-full lg:w-[380px] space-y-6">
            <FinancialSummaryPanel
              financials={financials}
              clientPrice={budget.clientPrice}
            />
          </aside>
        </div>
      </main>

      {/* Floating Audit Log Sidebar Overlay */}
      {showAuditLog && serverBudget?.project_id && (
        <div className="fixed inset-y-0 right-0 z-50 flex">
          <div 
            className="w-screen h-screen fixed inset-0 bg-background/40 backdrop-blur-[2px] animate-in fade-in duration-300" 
            onClick={() => setShowAuditLog(false)}
          />
          <AuditLogSidebar 
            projectId={serverBudget.project_id} 
            onClose={() => setShowAuditLog(false)} 
          />
        </div>
      )}

      {showTemplates && (
        <TemplateSelector 
          onSelect={handleTemplateSelect} 
          onClose={() => setShowTemplates(false)} 
        />
      )}

      <ConfirmModal
        isOpen={showRevisionConfirm}
        onClose={() => setShowRevisionConfirm(false)}
        onConfirm={() => {
          setShowRevisionConfirm(false);
          createRevision();
        }}
        title="Crear nueva versión"
        message="¿Crear una nueva versión del presupuesto? Se guardará una copia independiente del estado actual."
        confirmText="Crear Versión"
        cancelText="Cancelar"
        variant="info"
        isLoading={isCreatingRevision}
      />

      {showImporter && budget.stages[0] && (
        <BudgetBulkImporter
          budgetId={id!}
          stageId={budget.stages[0].id}
          onComplete={(count) => {
            toast.success(`${count} partidas importadas`);
            queryClient.invalidateQueries({ queryKey: ['budget', id] });
            setShowImporter(false);
          }}
          onCancel={() => setShowImporter(false)}
        />
      )}

      {showPdfModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Configurar PDF</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Gastos Generales (%)</label>
                <input
                  type="number"
                  value={pdfParams.generalExpenses}
                  onChange={(e) => setPdfParams({ ...pdfParams, generalExpenses: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Utilidad (%)</label>
                <input
                  type="number"
                  value={pdfParams.utility}
                  onChange={(e) => setPdfParams({ ...pdfParams, utility: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={exporting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                {exporting && <Loader2 size={16} className="animate-spin" />}
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      <AIAssistant 
        budgetId={id}
        projectContext={{
          name: serverBudget?.project?.name || 'Proyecto',
          location: serverBudget?.project?.location,
          stages: budget.stages.map(s => ({
            name: s.name,
            items: s.items.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit }))
          }))
        }}
      />
    </div>
  );
}
