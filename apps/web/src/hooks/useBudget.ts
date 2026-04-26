import { useState, useCallback } from 'react';
import type { Budget, Stage, LineItem, Expense, Worker } from '../features/budget/types';
import { calcFinancials, calcLineItem, newStage, newLineItem } from '../features/budget/helpers';
import { nanoid } from '../features/budget/utils';
import { useUFValue } from './useUFValue';

const DEFAULT_BUDGET: Budget = {
  id: nanoid(),
  projectName: 'Remodelación Baño Pérez',
  clientName: 'Juan Pérez',
  status: 'editing',
  clientPrice: 2600000,
  stages: [],
  expenses: [],
  workers: [],
};

export function useBudget(initial?: Partial<Budget>, apiRealExpenses: number = 0, apiWorkerPayments: number = 0, apiContingencies: number = 0) {
  const { data: ufValue = 0 } = useUFValue();
  const [budget, setBudget] = useState<Budget>(() => ({ ...DEFAULT_BUDGET, ...initial, id: nanoid() }));

  const financials = calcFinancials(budget, apiRealExpenses, apiWorkerPayments, apiContingencies, ufValue);

  // ─ Project header ────────────────────────────────────────────────
  const updateHeader = useCallback((patch: Partial<Pick<Budget, 'projectName' | 'clientName' | 'clientPrice' | 'status' | 'professionalFeePercentage' | 'estimatedUtility'>>) => {
    setBudget((b) => ({ ...b, ...patch }));
  }, []);

  // ─ Stages ────────────────────────────────────────────────────────
  const addStage = useCallback((name = 'Nueva etapa') => {
    setBudget((b) => ({ ...b, stages: [...b.stages, newStage(name)] }));
  }, []);

  const updateStage = useCallback((stageId: string, patch: Partial<Pick<Stage, 'name' | 'progress'>>) => {
    setBudget((b) => ({
      ...b,
      stages: b.stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s)),
    }));
  }, []);

  const duplicateStage = useCallback((stageId: string) => {
    setBudget((b) => {
      const idx = b.stages.findIndex((s) => s.id === stageId);
      if (idx === -1) return b;
      const original = b.stages[idx];
      const copy: Stage = {
        ...original,
        id: nanoid(),
        name: `${original.name} (copia)`,
        items: original.items.map((i) => ({ ...i, id: nanoid() })),
      };
      const stages = [...b.stages];
      stages.splice(idx + 1, 0, copy);
      return { ...b, stages };
    });
  }, []);

  const deleteStage = useCallback((stageId: string) => {
    setBudget((b) => ({ ...b, stages: b.stages.filter((s) => s.id !== stageId) }));
  }, []);

  // ─ Line items ─────────────────────────────────────────────────────
  const addItem = useCallback((stageId: string) => {
    const item = newLineItem();
    setBudget((b) => ({
      ...b,
      stages: b.stages.map((s) =>
        s.id === stageId ? { ...s, items: [...s.items, item] } : s
      ),
    }));
    return item.id;
  }, []);

  const updateItem = useCallback(
    (stageId: string, itemId: string, patch: Partial<Omit<LineItem, 'id' | 'total'>>) => {
      setBudget((b) => ({
        ...b,
        stages: b.stages.map((s) =>
          s.id === stageId
            ? {
                ...s,
                items: s.items.map((i) =>
                  i.id === itemId ? calcLineItem({ ...i, ...patch }) : i
                ),
              }
            : s
        ),
      }));
    },
    []
  );

  const duplicateItem = useCallback((stageId: string, itemId: string) => {
    setBudget((b) => ({
      ...b,
      stages: b.stages.map((s) => {
        if (s.id !== stageId) return s;
        const idx = s.items.findIndex((i) => i.id === itemId);
        if (idx === -1) return s;
        const copy = { ...s.items[idx], id: nanoid() };
        const items = [...s.items];
        items.splice(idx + 1, 0, copy);
        return { ...s, items };
      }),
    }));
  }, []);

  const deleteItem = useCallback((stageId: string, itemId: string) => {
    setBudget((b) => ({
      ...b,
      stages: b.stages.map((s) =>
        s.id === stageId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      ),
    }));
  }, []);

  // ─ Expenses ────────────────────────────────────────────────────────
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setBudget((b) => ({
      ...b,
      expenses: [...b.expenses, { ...expense, id: nanoid() }],
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setBudget((b) => ({ ...b, expenses: b.expenses.filter((e) => e.id !== id) }));
  }, []);

  // ─ Workers ─────────────────────────────────────────────────────────
  const addWorker = useCallback((worker: Omit<Worker, 'id'>) => {
    setBudget((b) => ({
      ...b,
      workers: [...b.workers, { ...worker, id: nanoid() }],
    }));
  }, []);

  const deleteWorker = useCallback((id: string) => {
    setBudget((b) => ({ ...b, workers: b.workers.filter((w) => w.id !== id) }));
  }, []);

  // ─ Replace all stages (used by template apply) ────────────────────
  const setStages = useCallback((stages: Stage[]) => {
    setBudget((b) => ({ ...b, stages }));
  }, []);

  return {
    budget,
    financials,
    updateHeader,
    addStage,
    updateStage,
    duplicateStage,
    deleteStage,
    addItem,
    updateItem,
    duplicateItem,
    deleteItem,
    addExpense,
    deleteExpense,
    addWorker,
    deleteWorker,
    setStages,
    setBudget,
  };
}
