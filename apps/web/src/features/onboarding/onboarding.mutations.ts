import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface OnboardingData {
  companyName: string;
  rut: string;
  legalType: string;
  address: string;
  industry: string[];
  companySize?: string;
  phone?: string;
  specialties: string[];
  challenges: string[];
}

export const useOnboardingSeeding = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      // Get current session to get user ID (no refresh needed yet - company will be created)
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) throw new Error('Usuario no autenticado');
      
      
      
      // 1. Create Company via API - include RUT, legal type, address and multi-select fields
      const companyResponse = await api.post('/companies', { 
        name: data.companyName,
        rut: data.rut,
        legal_type: data.legalType,
        address: data.address,
        industry: data.industry,
        challenges: data.challenges,
        size: data.companySize,
        phone: data.phone,
        specialties: data.specialties,
        description: `Especialidades: ${data.specialties.join(', ')}. Desafíos: ${data.challenges.join(', ')}`
      });
      const newCompany = companyResponse.data;

      // 2. Update user metadata with company_id BEFORE refreshing session
      await supabase.auth.updateUser({ 
        data: { company_id: newCompany.id }
      });

      // 3. Refresh session to get JWT with new company_id claim
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        // Session refresh failed, continue anyway
      }
      
      if (!refreshedSession?.session) {
        throw new Error('No se pudo actualizar la sesión');
      }
      
      // 4. Create Demo Project with the new company_id
      const projectPayload = {
        name: `Proyecto Demo - ${data.companyName}`,
        status: 'planning',
        description: `Especialidades: ${data.specialties.join(', ')}. Reto principal: ${data.challenges[0] || 'Gestión'}`,
        company_id: newCompany.id,
      };

      const projectResponse = await api.post('/projects', projectPayload);
      const newProject = projectResponse.data;

      // 5. Create Demo Budget
      const budgetResponse = await api.post('/budgets', {
        project_id: newProject.id,
        version: 1,
        status: 'editing',
        total_estimated_price: 3500000,
        total_estimated_cost: 0,
      });
      const newBudget = budgetResponse.data;

      // 6. Inject Seed Data (3 sub-items) into a Stage using PATCH
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

      return { budgetId: newBudget.id, companyId: newCompany.id };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('¡Entorno de demostración autoconfigurado con éxito! 🎉', { duration: 5000 });
      
      // Session is already refreshed in mutationFn - navigate to dashboard
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const backendMessage = error.response?.data?.message;
      const displayMessage = backendMessage || error.message || 'Error desconocido';
      toast.error(`Error en el onboarding: ${displayMessage}`);
    }
  });
};