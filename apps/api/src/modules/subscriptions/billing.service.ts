import { Injectable, BadRequestException } from '@nestjs/common';
import { PlanTier, BillingCycle } from './entities/subscription.entity';
import {
  PLAN_PRICING,
  BILLING_CYCLE_DISCOUNT,
  BILLING_CYCLE_MONTHS,
} from './plan.constants';

export interface PriceCalculation {
  plan: PlanTier;
  billing_cycle: BillingCycle;
  base_monthly_clp: number;
  discount_percentage: number;
  monthly_price: number;
  total_price: number;
  addons_total_monthly: number;
  usage_fees_total: number;
  final_monthly_price: number;
  final_total_price: number;
  cycle_months: number;
  savings_clp: number;
  currency: string;
}

@Injectable()
export class BillingService {
  /**
   * Calculate price for a plan + billing cycle combination + optional addons & usage fees.
   * Validates that the billing cycle is allowed for the plan.
   */
  calculatePrice(
    plan: PlanTier,
    cycle: BillingCycle,
    addons: { addon_code: string; price: number }[] = [],
    usageFeesTotal: number = 0,
  ): PriceCalculation {
    const planConfig = PLAN_PRICING[plan];
    if (!planConfig) {
      throw new BadRequestException(`Invalid plan: ${plan}`);
    }

    if (!planConfig.allowed_cycles.includes(cycle)) {
      throw new BadRequestException(
        `Billing cycle "${cycle}" is not available for plan "${plan}". Allowed: ${planConfig.allowed_cycles.join(', ')}`,
      );
    }

    const baseMonthly = planConfig.base_monthly_clp;
    const discountPct = BILLING_CYCLE_DISCOUNT[cycle] || 0;
    const months = BILLING_CYCLE_MONTHS[cycle] || 1;

    const monthlyPrice = Math.round(baseMonthly * (1 - discountPct));
    const totalPrice = monthlyPrice * months;
    const savingsClp = (baseMonthly - monthlyPrice) * months;

    const addonsTotalMonthly = addons.reduce(
      (sum, addon) => sum + Number(addon.price),
      0,
    );
    const finalMonthlyPrice =
      monthlyPrice + addonsTotalMonthly + usageFeesTotal;
    const finalTotalPrice =
      (monthlyPrice + addonsTotalMonthly) * months + usageFeesTotal;

    return {
      plan,
      billing_cycle: cycle,
      base_monthly_clp: baseMonthly,
      discount_percentage: discountPct * 100,
      monthly_price: monthlyPrice,
      total_price: totalPrice,
      addons_total_monthly: addonsTotalMonthly,
      usage_fees_total: usageFeesTotal,
      final_monthly_price: finalMonthlyPrice,
      final_total_price: finalTotalPrice,
      cycle_months: months,
      savings_clp: savingsClp,
      currency: 'CLP',
    };
  }

  /**
   * Calculate end date from start date + billing cycle.
   */
  calculateEndDate(startDate: Date, cycle: BillingCycle): Date {
    const months = BILLING_CYCLE_MONTHS[cycle] || 1;
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + months);
    return end;
  }

  /**
   * Get pricing for all plans (for the pricing page).
   */
  getAllPricing(): PriceCalculation[] {
    const results: PriceCalculation[] = [];

    for (const plan of Object.values(PlanTier)) {
      const config = PLAN_PRICING[plan];
      for (const cycle of config.allowed_cycles) {
        results.push(this.calculatePrice(plan, cycle as BillingCycle));
      }
    }

    return results;
  }

  /**
   * Check if a subscription needs renewal (expired but auto_renew is on).
   */
  isExpired(endDate: Date): boolean {
    return new Date() > new Date(endDate);
  }

  /**
   * Check if currently in trial period.
   */
  isInTrial(trialEndsAt: Date | null): boolean {
    if (!trialEndsAt) return false;
    return new Date() < new Date(trialEndsAt);
  }
}
