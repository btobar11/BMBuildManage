import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Save, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  CreditCard,
  Camera,
  Upload,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface Company {
  id: string;
  name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  currency: string;
  country: string;
  created_at?: string;
  updated_at?: string;
}

interface CompanyFormData {
  name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  currency: string;
  country: string;
}

function createEmptyCompany(): CompanyFormData {
  return {
    name: '',
    tax_id: '',
    address: '',
    phone: '',
    email: '',
    logo_url: '',
    currency: 'CLP',
    country: 'Chile'
  };
}

export function CompanySettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch company data with TanStack Query
  const { data: company, isLoading, isError, error } = useQuery<Company>({
    queryKey: ['company', user?.company_id],
    queryFn: async () => {
      if (!user?.company_id) throw new Error('No company ID');
      const response = await api.get(`/companies/${user.company_id}`);
      return response.data;
    },
    enabled: Boolean(user?.company_id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      if (!user?.company_id) throw new Error('No company ID');
      await api.patch(`/companies/${user.company_id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', user?.company_id] });
      setSaveSuccess(true);
      setSaveError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Error al guardar');
    }
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!company) return;
    setSaveError(null);
    setSaveSuccess(false);
    
    const updateData: CompanyFormData = {
      name: company.name,
      tax_id: company.tax_id,
      address: company.address,
      phone: company.phone,
      email: company.email,
      logo_url: company.logo_url,
      currency: company.currency,
      country: company.country
    };
    
    updateMutation.mutate(updateData);
  };

  const handleChange = <K extends keyof CompanyFormData>(field: K, value: CompanyFormData[K]) => {
    if (!company) return;
    // We'll use queryClient to update the cache directly for optimistic updates
    queryClient.setQueryData<Company>(['company', user?.company_id], (old) => {
      if (!old) return old;
      return { ...old, [field]: value };
    });
  };

  const handleLogoUpload = async (file: File) => {
    if (!file || !user?.company_id) return;
    
    try {
      const { supabase } = await import('../../lib/supabase');
      const fileName = `logo.png`;
      const filePath = `logos/${user.company_id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('organization-assets').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('organization-assets').getPublicUrl(filePath);
      
      // Update local state and cache
      handleChange('logo_url', publicUrl);
      
      // Save to API
      await api.patch(`/companies/${user.company_id}`, { logo_url: publicUrl });
      
      alert('Logo actualizado exitosamente');
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Hubo un error subiendo tu logo. Intenta de nuevo.');
    }
  };

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <div className="h-10 w-64 bg-muted animate-pulse rounded-lg mb-2" />
          <div className="h-5 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-32 h-32 bg-muted animate-pulse rounded-2xl" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-24 bg-muted animate-pulse rounded-xl" />
              <div className="h-24 bg-muted animate-pulse rounded-xl" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-muted animate-pulse rounded-2xl" />
          <div className="h-96 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error state - show error message
  if (isError) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl border border-red-200 dark:border-red-800 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error al cargar configuración</h2>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : 'No se pudo cargar la información de la empresa'}
          </p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['company', user?.company_id] })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // No company data - show empty state
  if (!company) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Sin empresa asociada</h2>
          <p className="text-muted-foreground">
            Tu cuenta no tiene una empresa asociada. Contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Building2 className="text-blue-500" size={32} />
          Configuración de la Empresa
        </h1>
        <p className="text-muted-foreground mt-2">Personaliza la identidad de tu empresa para presupuestos y documentos.</p>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-green-600 dark:text-green-400 flex items-center gap-2">
          <Save size={18} />
          Configuración guardada exitosamente
        </div>
      )}

      {/* Save error message */}
      {saveError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle size={18} />
          {saveError}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group">
              <div className="w-32 h-32 bg-background rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <Camera className="text-muted-foreground mb-2" size={24} />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Subir Logo</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                id="logoUpload" 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }} 
              />
              <label 
                htmlFor="logoUpload" 
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Upload size={16} />
              </label>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={14} /> Nombre de la Empresa
                </label>
                <input 
                  type="text" 
                  value={company.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej: Constructora Horizon S.A."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Hash size={14} /> RUT / ID Fiscal
                </label>
                <input 
                  type="text" 
                  value={company.tax_id || ''}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ej: 76.543.210-K"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Información de Contacto</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Mail size={14} /> Correo Electrónico
              </label>
              <input 
                type="email" 
                value={company.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Phone size={14} /> Teléfono
              </label>
              <input 
                type="text" 
                value={company.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin size={14} /> Dirección Principal
              </label>
              <textarea 
                value={company.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors min-h-[100px]"
                placeholder="Calle Falsa 123, Oficina 404, Santiago"
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Localización y Moneda</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Globe size={14} /> País
              </label>
              <input 
                type="text" 
                value={company.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Chile"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={14} /> Moneda por Defecto
              </label>
              <select 
                value={company.currency || 'CLP'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="CLP">CLP - Peso Chileno</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
                <option value="MXN">MXN - Peso Mexicano</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            {updateMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}