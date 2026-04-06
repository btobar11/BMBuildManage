export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  unit_price: number;
  cost_code?: string;
  total?: number; // legacy alias for total_price
  total_cost?: number; // quantity * unit_cost
  total_price?: number; // quantity * unit_price
  // APU & cubicacion
  apu_template_id?: string;
  cubication_mode?: 'manual' | 'dimensions' | 'cad' | 'pdf' | 'bim';
  dim_length?: number;
  dim_width?: number;
  dim_height?: number;
  dim_thickness?: number;
  dim_count?: number;
  dim_holes?: number;
  formula?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry_data?: any;
  // BIM / IFC link
  ifc_global_id?: string;
  // Ejecución real
  quantity_executed?: number;
  real_cost?: number;
  // Modificaciones y sobreescritura de precio
  is_price_overridden?: boolean;
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
  expense_type?: string;
  description: string;
  amount: number;
  date: string;
  document_url?: string;
  document_id?: string;
  document?: {
    id: string;
    name: string;
    url: string;
  };
}

export interface Worker {
  id: string;
  name: string;
  specialty: string;
  dailyRate: number;
  daysWorked: number;
  totalPaid: number;
  phone?: string;
  performance?: number; // 1-5
  notes?: string;
}

export interface Budget {
  id: string;
  projectName: string;
  clientName: string;
  status: 'draft' | 'editing' | 'sent' | 'approved' | 'rejected' | 'counter_offer';
  clientPrice: number;
  professionalFeePercentage?: number;
  estimatedUtility?: number;
  markupPercentage?: number;
  marginThreshold?: number;
  location?: string;
  start_date?: string;
  end_date?: string;
  folder?: string;
  stages: Stage[];
  expenses: Expense[];
  workers: Worker[];
}

export interface FinancialSummary {
  estimatedCost: number;
  estimatedPrice: number;
  autoCalculatedPrice?: number;
  realExpenses: number;
  workerPayments: number;
  contingenciesTotal: number;
  totalRealCost: number;
  projectedProfit: number;
  currentProfit: number;
  margin: number;
  realMargin: number;
  variance: number;
  executedValue: number;
  estimatedUtility?: number;
  professionalFeePercentage?: number;
}

export type BudgetTab = 'presupuesto' | 'gastos' | 'trabajadores' | 'documentos' | 'contingencias' | 'analisis' | 'bim' | 'cashflow';

export const UNITS = ['m2', 'm3', 'ml', 'un', 'viaje', 'glb', 'gl', 'kg', 'hr', 'día', 'pt', 'lb', 'tn'];
export const EXPENSE_CATEGORIES = [
  { value: 'material', label: 'Material' },
  { value: 'transport', label: 'Transporte' },
  { value: 'tools', label: 'Herramientas' },
  { value: 'contingency', label: 'Imprevistos' },
];
