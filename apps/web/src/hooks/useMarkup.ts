import { useState, useCallback } from 'react';

export interface MarkupConfig {
  /** Direct cost margin as percentage (e.g. 20 = 20%) */
  profitMargin: number;
  /** General expenses/overhead as percentage */
  overhead: number;
  /** Tax rate (IVA) as percentage — default 19% Chile */
  taxRate: number;
  /** Whether to apply markup to all items automatically */
  autoApply: boolean;
}

export interface MarkupResult {
  directCost: number;
  overhead: number;
  profitMargin: number;
  subtotal: number;
  tax: number;
  totalPrice: number;
  markupFactor: number;
  effectiveMargin: number;
}

const DEFAULT_CONFIG: MarkupConfig = {
  profitMargin: 20,
  overhead: 10,
  taxRate: 19,
  autoApply: true,
};

/**
 * Hook for automatic markup calculation.
 *
 * Usage:
 *   const { config, setConfig, calculate, applyToItems } = useMarkup();
 *   const result = calculate(directCost);
 *   // result.totalPrice = the final price to client
 */
export function useMarkup(initialConfig?: Partial<MarkupConfig>) {
  const [config, setConfig] = useState<MarkupConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  /**
   * Calculate the full price breakdown from a direct cost amount.
   * Formula: Price = DirectCost × (1 + Overhead%) × (1 + Margin%) × (1 + Tax%)
   */
  const calculate = useCallback(
    (directCost: number): MarkupResult => {
      const overheadAmount = directCost * (config.overhead / 100);
      const subtotalBeforeMargin = directCost + overheadAmount;
      const profitAmount = subtotalBeforeMargin * (config.profitMargin / 100);
      const subtotal = subtotalBeforeMargin + profitAmount;
      const taxAmount = subtotal * (config.taxRate / 100);
      const totalPrice = subtotal + taxAmount;

      const markupFactor = directCost > 0 ? totalPrice / directCost : 1;
      const effectiveMargin =
        directCost > 0
          ? ((totalPrice - directCost) / totalPrice) * 100
          : 0;

      return {
        directCost,
        overhead: overheadAmount,
        profitMargin: profitAmount,
        subtotal,
        tax: taxAmount,
        totalPrice,
        markupFactor,
        effectiveMargin,
      };
    },
    [config],
  );

  /**
   * Calculate unit price from unit cost with markup applied.
   */
  const applyMarkupToUnitCost = useCallback(
    (unitCost: number): number => {
      return calculate(unitCost).totalPrice;
    },
    [calculate],
  );

  /**
   * Calculate the markup factor (multiplier) for quick application.
   * Example: 1.5 means price = cost × 1.5
   */
  const getMarkupFactor = useCallback((): number => {
    return (
      (1 + config.overhead / 100) *
      (1 + config.profitMargin / 100) *
      (1 + config.taxRate / 100)
    );
  }, [config]);

  /**
   * Reverse calculation: given a target price, find the required direct cost.
   */
  const reverseCalculate = useCallback(
    (targetPrice: number): number => {
      const factor = getMarkupFactor();
      return factor > 0 ? targetPrice / factor : 0;
    },
    [getMarkupFactor],
  );

  /**
   * Format a markup result for display.
   */
  const formatResult = useCallback(
    (result: MarkupResult, currency = 'CLP') => {
      const fmt = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      return {
        directCost: fmt.format(result.directCost),
        overhead: fmt.format(result.overhead),
        profitMargin: fmt.format(result.profitMargin),
        subtotal: fmt.format(result.subtotal),
        tax: fmt.format(result.tax),
        totalPrice: fmt.format(result.totalPrice),
        effectiveMargin: `${result.effectiveMargin.toFixed(1)}%`,
        markupFactor: `×${result.markupFactor.toFixed(2)}`,
      };
    },
    [],
  );

  return {
    config,
    setConfig,
    calculate,
    applyMarkupToUnitCost,
    getMarkupFactor,
    reverseCalculate,
    formatResult,
  };
}
