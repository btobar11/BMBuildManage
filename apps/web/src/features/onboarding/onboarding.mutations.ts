import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface OnboardingData {
  companyName: string;
  specialty: string;
  painPoint: string;
}

export const useOnboardingSeeding = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      // Refresh session to get latest user metadata with company_id
      const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Session refresh failed:', refreshError);
      }
      
      const session = sessionData?.session;
      if (!session) throw new Error('Usuario no autenticado');

      // Get company_id from the refreshed session
      const userMeta = session.user.user_metadata;
      const companyId = userMeta?.company_id;
      
      if (!companyId) {
        throw new Error('No se encontró company_id. Por favor inicia sesión novamente.');
      }
      
      // 2. Create Demo Project
      const projectPayload = {
        name: `Proyecto Demo - ${data.companyName}`,
        status: 'planning',
        description: `Especialidad: ${data.specialty}. Reto principal: ${data.painPoint}`,
        company_id: companyId,
      };

      const projectResponse = await api.post('/projects', projectPayload);
      const newProject = projectResponse.data;

      // 3. Create Demo Budget
      const budgetResponse = await api.post('/budgets', {
        project_id: newProject.id,
        version: 1,
        status: 'editing',
        total_estimated_price: 3500000,
        total_estimated_cost: 0,
      });
      const newBudget = budgetResponse.data;

      // 4. Inject Seed Data (3 sub-items) into a Stage using PATCH
      const patchPayload = {
        total_estimated_cost: 0,
        total_estimated_price: 3500000,
        stages: [
          {
            name: 'Obra Gruesa Demo',
            position: 0,
            items: [
              {
                name: 'Instalación de Faenas',
                quantity: 1,
                unit: 'glb',
                unit_price: 500000,
                unit_cost: 350000,
                position: 0,
              },
              {
                name: 'Excavación y Movimiento de Tierra',
                quantity: 120,
                unit: 'm3',
                unit_price: 8500,
                unit_cost: 6500,
                position: 1,
              },
              {
                name: 'Hormigón de Cimientos H20',
                quantity: 15,
                unit: 'm3',
                unit_price: 95000,
                unit_cost: 75000,
                position: 2,
              }
            ]
          }
        ]
      };

      await api.patch(`/budgets/${newBudget.id}`, patchPayload);

      return { budgetId: newBudget.id };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('¡Entorno de demostración autoconfigurado con éxito! 🎉', { duration: 5000 });
      
      // Refresh session one more time to ensure JWT has all claims before navigating
      await supabase.auth.refreshSession();
      
      navigate(`/budget/${data.budgetId}`); // Fixed route format since BudgetEditor reads ID
    },
    onError: (error: any) => {
      toast.error(`Error en el onboarding: ${error.message}`);
    }
  });
};
