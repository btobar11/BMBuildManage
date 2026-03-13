import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useBudget } from '../../hooks/useBudget';
import { ProjectHeader } from './components/ProjectHeader';
import { BudgetTable } from './components/BudgetTable';
import { FinancialSummaryPanel } from './components/FinancialSummaryPanel';
import { TemplateSelector } from './components/TemplateSelector';
import { ExpensesTab } from './components/ExpensesTab';
import { WorkersTab } from './components/WorkersTab';
import type { BudgetTab } from './types';
import { applyTemplate } from './templates';
import type { Template } from './templates';
import { Layers, FileText, Receipt, HardHat, FolderOpen, Download, Plus } from 'lucide-react';

const TABS: { id: BudgetTab; label: string; icon: ReactNode }[] = [
  { id: 'presupuesto', label: 'Presupuesto', icon: <FileText size={14} /> },
  { id: 'gastos', label: 'Gastos', icon: <Receipt size={14} /> },
  { id: 'trabajadores', label: 'Trabajadores', icon: <HardHat size={14} /> },
  { id: 'documentos', label: 'Documentos', icon: <FolderOpen size={14} /> },
];

interface ServerBudget {
  id: string;
  status: string;
  total_estimated_price: string | number;
  project?: {
    name: string;
    client?: {
      name: string;
    }
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
      unit_cost: string | number;
    }>;
  }>;
}

export default function BudgetEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: serverBudget, isLoading, error } = useQuery<ServerBudget>({
    queryKey: ['budget', id],
    queryFn: async () => {
      const response = await api.get(`/budgets/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const budgetCtx = useBudget();
  const { budget, financials } = budgetCtx;

  // Sync server data to local state once LOADED
  useEffect(() => {
    if (serverBudget) {
      budgetCtx.setBudget({
        id: serverBudget.id,
        projectName: serverBudget.project?.name || 'Cargando...',
        clientName: serverBudget.project?.client?.name || 'Cliente',
        status: (serverBudget.status as 'draft' | 'editing' | 'sent' | 'approved') || 'editing',
        clientPrice: Number(serverBudget.total_estimated_price) || 0,
        stages: serverBudget.stages?.map((s) => ({
          id: s.id,
          name: s.name,
          progress: s.progress || 0,
          items: s.items?.map((i) => ({
            id: i.id,
            name: i.name,
            quantity: Number(i.quantity) || 0,
            unit: i.unit || 'glb',
            unitPrice: Number(i.unit_cost) || 0,
            total: (Number(i.quantity) || 0) * (Number(i.unit_cost) || 0)
          })) || []
        })) || [],
        expenses: [], 
        workers: [],
      });
    }
  }, [serverBudget, budgetCtx.setBudget]);

  const [activeTab, setActiveTab] = useState<BudgetTab>('presupuesto');
  const [showTemplates, setShowTemplates] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !id) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Error al cargar el presupuesto</h2>
        <p className="text-gray-400 mb-8">No pudimos encontrar el presupuesto solicitado o hubo un problema de conexión.</p>
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

  const handleExportPDF = () => {
    // Simple print-based PDF for MVP
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      {/* Top nav */}
      <header className="border-b border-white/8 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">BM</span>
            </div>
            <span className="text-white font-semibold text-sm">BMBuildManage</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Layers size={13} /> Plantillas
            </button>
            <button
              onClick={() => budgetCtx.addStage()}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} /> Etapa
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Download size={13} /> Exportar PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Project header card */}
        <ProjectHeader
          budget={budget}
          financials={financials}
          onUpdate={budgetCtx.updateHeader}
        />

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-5 bg-gray-900/60 rounded-xl p-1 border border-white/8 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Main content + sidebar */}
        <div className="flex gap-6 items-start">
          {/* Content area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'presupuesto' && (
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
            )}

            {activeTab === 'gastos' && (
              <ExpensesTab
                expenses={budget.expenses}
                onAdd={budgetCtx.addExpense}
                onDelete={budgetCtx.deleteExpense}
              />
            )}

            {activeTab === 'trabajadores' && (
              <WorkersTab
                workers={budget.workers}
                onAdd={budgetCtx.addWorker}
                onDelete={budgetCtx.deleteWorker}
              />
            )}

            {activeTab === 'documentos' && (
              <div className="text-center py-20 text-gray-600">
                <p className="text-5xl mb-3">📁</p>
                <p className="font-medium text-gray-500">Gestión de documentos</p>
                <p className="text-sm mt-1">Próximamente — sube planos, boletas y contratos</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <FinancialSummaryPanel
            financials={financials}
            clientPrice={budget.clientPrice}
          />
        </div>
      </main>

      {/* Template selector modal */}
      {showTemplates && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}
