import { Test, TestingModule } from '@nestjs/testing';
import { BillingService, PriceCalculation } from './billing.service';
import { PlanTier, BillingCycle } from './entities/subscription.entity';
import { BadRequestException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingService],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('calculatePrice', () => {
    it('should calculate Lite monthly (no discount)', () => {
      const result = service.calculatePrice(
        PlanTier.LITE,
        BillingCycle.MONTHLY,
      );
      expect(result.plan).toBe('lite');
      expect(result.billing_cycle).toBe('monthly');
      expect(result.base_monthly_clp).toBe(29990);
      expect(result.discount_percentage).toBe(0);
      expect(result.monthly_price).toBe(29990);
      expect(result.total_price).toBe(29990);
      expect(result.cycle_months).toBe(1);
      expect(result.savings_clp).toBe(0);
      expect(result.currency).toBe('CLP');
    });

    it('should calculate Pro quarterly (10% discount)', () => {
      const result = service.calculatePrice(
        PlanTier.PRO,
        BillingCycle.QUARTERLY,
      );
      expect(result.discount_percentage).toBe(10);
      expect(result.monthly_price).toBe(80991);
      expect(result.total_price).toBe(80991 * 3);
      expect(result.cycle_months).toBe(3);
    });

    it('should calculate Pro semiannual (15% discount)', () => {
      const result = service.calculatePrice(
        PlanTier.PRO,
        BillingCycle.SEMIANNUAL,
      );
      expect(result.discount_percentage).toBe(15);
      expect(result.monthly_price).toBe(76492);
      expect(result.cycle_months).toBe(6);
    });

    it('should calculate Enterprise annual (25% discount)', () => {
      const result = service.calculatePrice(
        PlanTier.ENTERPRISE,
        BillingCycle.ANNUAL,
      );
      expect(result.discount_percentage).toBe(25);
      expect(result.monthly_price).toBe(187493);
      expect(result.cycle_months).toBe(12);
      expect(result.savings_clp).toBeGreaterThan(0);
    });

    it('should reject Lite with quarterly cycle', () => {
      expect(() =>
        service.calculatePrice(PlanTier.LITE, BillingCycle.QUARTERLY),
      ).toThrow(BadRequestException);
    });

    it('should reject Lite with annual cycle', () => {
      expect(() =>
        service.calculatePrice(PlanTier.LITE, BillingCycle.ANNUAL),
      ).toThrow(BadRequestException);
    });

    it('should reject Enterprise with monthly cycle', () => {
      expect(() =>
        service.calculatePrice(PlanTier.ENTERPRISE, BillingCycle.MONTHLY),
      ).toThrow(BadRequestException);
    });
  });

  describe('calculateEndDate', () => {
    it('should add 1 month for monthly cycle', () => {
      const start = new Date('2026-01-15');
      const end = service.calculateEndDate(start, BillingCycle.MONTHLY);
      expect(end.getMonth()).toBe(1); // February
    });

    it('should add 3 months for quarterly cycle', () => {
      const start = new Date('2026-01-15');
      const end = service.calculateEndDate(start, BillingCycle.QUARTERLY);
      expect(end.getMonth()).toBe(3); // April
    });

    it('should add 12 months for annual cycle', () => {
      const start = new Date('2026-01-15');
      const end = service.calculateEndDate(start, BillingCycle.ANNUAL);
      expect(end.getFullYear()).toBe(2027);
    });
  });

  describe('getAllPricing', () => {
    it('should return pricing for all valid plan+cycle combos', () => {
      const all = service.getAllPricing();
      // Lite: monthly (1), Pro: monthly/quarterly/semiannual (3), Enterprise: annual (1)
      expect(all.length).toBe(5);
    });

    it('should return valid PriceCalculation objects', () => {
      const all = service.getAllPricing();
      for (const p of all) {
        expect(p.plan).toBeDefined();
        expect(p.billing_cycle).toBeDefined();
        expect(p.monthly_price).toBeGreaterThan(0);
        expect(p.currency).toBe('CLP');
      }
    });
  });

  describe('isExpired', () => {
    it('should return true for past dates', () => {
      expect(service.isExpired(new Date('2020-01-01'))).toBe(true);
    });

    it('should return false for future dates', () => {
      expect(service.isExpired(new Date('2030-01-01'))).toBe(false);
    });
  });

  describe('isInTrial', () => {
    it('should return false for null', () => {
      expect(service.isInTrial(null)).toBe(false);
    });

    it('should return true for future trial end', () => {
      expect(service.isInTrial(new Date('2030-01-01'))).toBe(true);
    });

    it('should return false for past trial end', () => {
      expect(service.isInTrial(new Date('2020-01-01'))).toBe(false);
    });
  });
});
