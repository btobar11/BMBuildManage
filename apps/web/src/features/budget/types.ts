export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  unit_price: number;
  cost_code?: string;
  total?: number;
  total_cost?: number;
  total_price?: number;
  
  item_type?: 'material' | 'labor' | 'machinery' | 'subcontract';
  
  apu_template_id?: string;
  apu_components?: ApuComponent[];
  cubication_mode?: 'manual' | 'dimensions' | 'cad' | 'pdf' | 'bim';
  dim_length?: number;
  dim_width?: number;
  dim_height?: number;
  dim_thickness?: number;
  dim_count?: number;
  dim_holes?: number;
  formula?: string;
  geometry_data?: any;
  ifc_global_id?: string;
  quantity_executed?: number;
  real_cost?: number;
  is_price_overridden?: boolean;
  markup_percentage?: number;
}

export interface ApuComponent {
  id: string;
  name: string;
  category: 'material' | 'labor' | 'machinery';
  unit: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  totalCost: number;
  totalPrice: number;
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

export interface Company {
  name?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
}

export interface Budget {
  id: string;
  projectName: string;
  code?: string;
  clientName: string;
  status: 'draft' | 'editing' | 'sent' | 'approved' | 'rejected' | 'counter_offer';
  clientPrice: number;
  currency?: string;
  professionalFeePercentage?: number;
  estimatedUtility?: number;
  markupPercentage?: number;
  marginThreshold?: number;
  targetMargin?: number;
  location?: string;
  start_date?: string;
  end_date?: string;
  folder?: string;
  version?: number;
  stages: Stage[];
  expenses: Expense[];
  workers: Worker[];
  project?: {
    id: string;
    name: string;
    code: string;
    location: string;
    client?: {
      id: string;
      name: string;
    };
  };
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
  targetMargin?: number;
}

export type BudgetTab = 'presupuesto' | 'gastos' | 'trabajadores' | 'documentos' | 'contingencias' | 'analisis' | 'bim' | 'cashflow';

export const UNITS = ['m2', 'm3', 'ml', 'un', 'viaje', 'glb', 'gl', 'kg', 'hr', 'día', 'pt', 'lb', 'tn'];
export const EXPENSE_CATEGORIES = [
  { value: 'material', label: 'Material' },
  { value: 'transport', label: 'Transporte' },
  { value: 'tools', label: 'Herramientas' },
  { value: 'contingency', label: 'Imprevistos' },
];
