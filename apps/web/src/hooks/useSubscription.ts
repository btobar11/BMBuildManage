import { useCallback, useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import type { FeatureCode, PlanTier } from '../lib/plan.constants';
import { FEATURE_MIN_PLAN, PLAN_DISPLAY_NAMES } from '../lib/plan.constants';

interface FeatureCheckResult {
  allowed: boolean;
  requiredPlan: PlanTier | null;
  requiredPlanName: string | null;
}

/**
 * Hook to check a single feature's availability.
 *
 * Usage:
 *   const { allowed, requiredPlan } = useFeature('bim_viewer');
 *   if (!allowed) showUpgradeModal(requiredPlan);
 */
export function useFeature(featureCode: FeatureCode): FeatureCheckResult {
  const { hasFeature } = useSubscription();
  const allowed = hasFeature(featureCode);
  const requiredPlan = allowed ? null : (FEATURE_MIN_PLAN[featureCode] || null);

  return {
    allowed,
    requiredPlan,
    requiredPlanName: requiredPlan ? PLAN_DISPLAY_NAMES[requiredPlan] : null,
  };
}

/**
 * Hook that returns the current plan info.
 *
 * Usage:
 *   const { plan, planName, isEnterprise } = usePlan();
 */
export function usePlan() {
  const { plan, isTrialActive, daysLeftInTrial } = useSubscription();

  return {
    plan,
    planName: PLAN_DISPLAY_NAMES[plan],
    isLite: plan === 'lite',
    isPro: plan === 'pro',
    isEnterprise: plan === 'enterprise',
    isTrialActive,
    daysLeftInTrial,
  };
}

/**
 * Hook for the upgrade modal pattern.
 *
 * Usage:
 *   const { showUpgrade, upgradeFeature, triggerUpgrade, dismissUpgrade } = useUpgradePrompt();
 *
 *   // In event handler:
 *   const { allowed } = useFeature('bim_viewer');
 *   if (!allowed) return triggerUpgrade('bim_viewer');
 *
 *   // In render:
 *   {showUpgrade && <UpgradeModal feature={upgradeFeature} onClose={dismissUpgrade} />}
 */
export function useUpgradePrompt() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<FeatureCode | null>(null);

  const triggerUpgrade = useCallback((feature: FeatureCode) => {
    setUpgradeFeature(feature);
    setShowUpgrade(true);
  }, []);

  const dismissUpgrade = useCallback(() => {
    setShowUpgrade(false);
    setUpgradeFeature(null);
  }, []);

  return {
    showUpgrade,
    upgradeFeature,
    triggerUpgrade,
    dismissUpgrade,
  };
}
