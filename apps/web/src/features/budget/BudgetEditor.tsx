import React, { useState } from 'react';
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

const TABS: { id: BudgetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'presupuesto', label: 'Presupuesto', icon: <FileText size={14} /> },
  { id: 'gastos', label: 'Gastos', icon: <Receipt size={14} /> },
  { id: 'trabajadores', label: 'Trabajadores', icon: <HardHat size={14} /> },
  { id: 'documentos', label: 'Documentos', icon: <FolderOpen size={14} /> },
];

export function BudgetEditor() {
  const budgetCtx = useBudget();
  const { budget, financials } = budgetCtx;

  const [activeTab, setActiveTab] = useState<BudgetTab>('presupuesto');
  const [showTemplates, setShowTemplates] = useState(budget.stages.length === 0);

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
