export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costCode?: string;
  total: number; // computed: quantity * unitPrice
}

export interface Stage {
  id: string;
  name: string;
  progress: number; // 0–100
  items: LineItem[];
}

export interface Expense {
  id: string;
  category: 'material' | 'transport' | 'tools' | 'contingency';
  description: string;
  amount: number;
  date: string;
}

export interface Worker {
  id: string;
  name: string;
  specialty: string;
  dailyRate: number;
  daysWorked: number;
  totalPaid: number;
}

export interface Budget {
  id: string;
  projectName: string;
  clientName: string;
  status: 'draft' | 'editing' | 'sent' | 'approved';
  clientPrice: number;
  stages: Stage[];
  expenses: Expense[];
  workers: Worker[];
}

// Derived financials (computed from Budget)
export interface FinancialSummary {
  estimatedCost: number;
  realExpenses: number;
  workerPayments: number;
  totalRealCost: number;
  projectedProfit: number;
  currentProfit: number;
  margin: number; // percentage
}

export type BudgetTab = 'presupuesto' | 'gastos' | 'trabajadores' | 'documentos';

export const UNITS = ['m2', 'm3', 'ml', 'un', 'viaje', 'gl', 'kg', 'hr', 'día'];
export const EXPENSE_CATEGORIES = [
  { value: 'material', label: 'Material' },
  { value: 'transport', label: 'Transporte' },
  { value: 'tools', label: 'Herramientas' },
  { value: 'contingency', label: 'Imprevistos' },
];
