import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import api from '../lib/api';
import type { PlanTier, FeatureCode, BillingCycle } from '../lib/plan.constants';
import { useAuth } from './AuthContext';

interface SubscriptionLimits {
  max_projects: number;
  max_users: number;
  max_storage_mb: number;
  max_ai_requests_month: number;
  max_bim_models: number;
}

interface SubscriptionState {
  has_subscription: boolean;
  plan: PlanTier;
  status: string;
  features: FeatureCode[];
  limits: SubscriptionLimits;
  billing_cycle?: BillingCycle;
  start_date?: string;
  end_date?: string;
  trial_ends_at?: string;
  auto_renew?: boolean;
  monthly_price?: number;
  total_price?: number;
  currency?: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionState | null;
  isLoading: boolean;
  plan: PlanTier;
  hasFeature: (featureCode: FeatureCode) => boolean;
  limits: SubscriptionLimits | null;
  isTrialActive: boolean;
  daysLeftInTrial: number;
  refresh: () => Promise<void>;
}

const defaultLimits: SubscriptionLimits = {
  max_projects: -1,
  max_users: -1,
  max_storage_mb: -1,
  max_ai_requests_month: -1,
  max_bim_models: -1,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/subscriptions/status');
      setSubscription(data);
    } catch {
      // No subscription → legacy mode (full access)
      setSubscription({
        has_subscription: false,
        plan: 'enterprise',
        status: 'legacy',
        features: [],
        limits: defaultLimits,
      });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const hasFeature = useCallback(
    (featureCode: FeatureCode): boolean => {
      if (!subscription) return true; // Loading or error → allow
      if (!subscription.has_subscription) return true; // Legacy → full access
      if (subscription.status === 'suspended' || subscription.status === 'cancelled') return false;
      return subscription.features.includes(featureCode);
    },
    [subscription],
  );

  const plan: PlanTier = subscription?.plan || 'enterprise';
  const limits = subscription?.limits || defaultLimits;

  const isTrialActive =
    subscription?.status === 'trial' &&
    !!subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date();

  const daysLeftInTrial = isTrialActive && subscription?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.trial_ends_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        plan,
        hasFeature,
        limits,
        isTrialActive,
        daysLeftInTrial,
        refresh: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider',
    );
  }
  return context;
}
