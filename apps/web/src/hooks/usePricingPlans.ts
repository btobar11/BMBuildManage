import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { BillingCycle, Plan } from '../types/billing';

export function usePricingPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from GET /subscriptions/pricing
    // Simulating API response with static data for now to guarantee render
    const fetchPlans = async () => {
      try {
        setLoading(true);
        // const response = await api.get('/subscriptions/pricing');
        // setPlans(response.data);
        
        // Mock data
        setPlans([
          {
            code: 'lite',
            name: 'Lite',
            price: 29990,
            features: ['Gestión básica', 'Presupuestos', '10GB Storage'],
            limits: { projects: 3, users: 2, storage: 10 },
          },
          {
            code: 'pro',
            name: 'Pro',
            price: 89990,
            features: ['BIM 3D/4D', 'AI Assistant', '100GB Storage', 'Soporte Prioritario'],
            limits: { projects: 20, users: 10, storage: 100 },
            recommended: true,
          },
          {
            code: 'enterprise',
            name: 'Enterprise',
            price: 249990,
            features: ['BIM 5D', 'API Access', 'Integraciones ERP', 'Onboarding VIP'],
            limits: { projects: 9999, users: 9999, storage: 1000 },
          },
        ]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return { plans, loading };
}
