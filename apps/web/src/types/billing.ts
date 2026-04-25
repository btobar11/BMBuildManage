export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export type Plan = {
  code: 'lite' | 'pro' | 'enterprise';
  name: string;
  price: number;
  features: string[];
  limits: {
    projects: number;
    users: number;
    storage: number;
  };
  recommended?: boolean;
};