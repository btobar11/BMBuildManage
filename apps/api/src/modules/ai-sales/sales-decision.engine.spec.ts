import { Test, TestingModule } from '@nestjs/testing';
import { SalesDecisionEngine, SalesOpportunity } from './sales-decision.engine';
import { SalesContext } from './sales-context.service';
import { OpportunityType } from './entities/sales-interaction.entity';

describe('SalesDecisionEngine', () => {
  let engine: SalesDecisionEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesDecisionEngine],
    }).compile();

    engine = module.get(SalesDecisionEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should return null when no opportunity exists', () => {
    const context: SalesContext = {
      plan: 'enterprise',
      plan_status: 'active',
      usage: {
        projects: { used: 5, limit: -1, percentage: 0, status: 'unlimited' },
        users: { used: 3, limit: -1, percentage: 0, status: 'unlimited' },
      },
      upsell_suggestions: [],
      blocked_features: [],
      days_since_subscription: 30,
      is_trial: false,
    };

    const result = engine.getSalesOpportunity(context);
    expect(result).toBeNull();
  });

  it('should detect blocked usage as high urgency opportunity', () => {
    const context: SalesContext = {
      plan: 'lite',
      plan_status: 'active',
      usage: {
        projects: { used: 5, limit: 5, percentage: 100, status: 'blocked' },
        users: { used: 2, limit: 3, percentage: 66, status: 'ok' },
      },
      upsell_suggestions: [],
      blocked_features: [],
      days_since_subscription: 15,
      is_trial: false,
    };

    const result = engine.getSalesOpportunity(context);
    expect(result).not.toBeNull();
    expect(result!.type).toBe(OpportunityType.INCREASE_USAGE);
    expect(result!.urgency).toBe('high');
    expect(result!.addon_code).toBe('extra_project');
  });

  it('should suggest plan upgrade when multiple metrics are critical', () => {
    const context: SalesContext = {
      plan: 'lite',
      plan_status: 'active',
      usage: {
        projects: { used: 5, limit: 5, percentage: 100, status: 'blocked' },
        users: { used: 3, limit: 3, percentage: 100, status: 'blocked' },
        storage_mb: { used: 500, limit: 1024, percentage: 48, status: 'ok' },
      },
      upsell_suggestions: [],
      blocked_features: [],
      days_since_subscription: 30,
      is_trial: false,
    };

    const result = engine.getSalesOpportunity(context);
    expect(result).not.toBeNull();
    expect(result!.type).toBe(OpportunityType.UPGRADE_PLAN);
    expect(result!.target).toBe('pro');
    expect(result!.urgency).toBe('high');
  });

  it('should suggest addon when feature is blocked', () => {
    const context: SalesContext = {
      plan: 'pro',
      plan_status: 'active',
      usage: {
        projects: { used: 5, limit: 20, percentage: 25, status: 'ok' },
      },
      upsell_suggestions: [],
      blocked_features: ['bim_viewer'],
      days_since_subscription: 60,
      is_trial: false,
    };

    const result = engine.getSalesOpportunity(context);
    expect(result).not.toBeNull();
    expect(result!.type).toBe(OpportunityType.BUY_ADDON);
    expect(result!.addon_code).toBe('bim_module');
  });

  it('should push upgrade on trial ending', () => {
    const context: SalesContext = {
      plan: 'lite',
      plan_status: 'active',
      usage: {
        projects: { used: 2, limit: 5, percentage: 40, status: 'ok' },
      },
      upsell_suggestions: [],
      blocked_features: [],
      days_since_subscription: 12,
      is_trial: true,
    };

    const result = engine.getSalesOpportunity(context);
    expect(result).not.toBeNull();
    expect(result!.type).toBe(OpportunityType.UPGRADE_PLAN);
    expect(result!.urgency).toBe('high');
  });

  it('should prioritize high urgency over medium', () => {
    const context: SalesContext = {
      plan: 'lite',
      plan_status: 'active',
      usage: {
        projects: { used: 5, limit: 5, percentage: 100, status: 'blocked' },
        users: { used: 2, limit: 3, percentage: 66, status: 'ok' },
      },
      upsell_suggestions: [],
      blocked_features: ['ai_assistant'],
      days_since_subscription: 30,
      is_trial: false,
    };

    const result = engine.getSalesOpportunity(context);
    expect(result!.urgency).toBe('high');
  });
});
