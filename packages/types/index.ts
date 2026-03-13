export type ProjectStatus = 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  companyId: string;
  clientId: string | null;
  name: string;
  description: string | null;
  location: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  estimatedBudget: number | null;
  createdAt: string;
}

export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface Budget {
  id: string;
  projectId: string;
  version: number;
  status: BudgetStatus;
  totalEstimatedCost: number;
  totalEstimatedPrice: number;
  createdAt: string;
}

export interface Stage {
  id: string;
  budgetId: string;
  name: string;
  position: number;
  createdAt: string;
}

export interface Item {
  id: string;
  stageId: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitCost: number;
  totalCost: number;
  costCode: string | null;
  createdAt: string;
}

export interface FinancialSummary {
  projectId: string;
  budgetedCost: number;
  realCost: number;
  revenue: number;
  margin: number;
}
