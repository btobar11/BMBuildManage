import { useState, useEffect } from 'react';
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
  Upload
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
  logo_url: string;
  currency: string;
  country: string;
}

export function CompanySettingsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await api.get(`/companies/${user?.company_id}`);
        setCompany(response.data);
      } catch (error) {
        console.error('Error fetching company:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_id) {
      fetchCompany();
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    setSaving(true);
    try {
      const updateData: any = { ...company };
      // Also omit any other read-only fields that might come from the db
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.id;

      await api.patch(`/companies/${company.id}`, updateData);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
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

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group">
              <div className="w-32 h-32 bg-background rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden">
                {company?.logo_url ? (
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
                 onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if (!file || !user?.company_id) return;
                   try {
                     setSaving(true);
                     // Import supabase inside
                     const { supabase } = await import('../../lib/supabase');
                     // Delete old file if necessary, but we can just upload new with random name
                     const fileName = `logo.png`;
                     const filePath = `logos/${user.company_id}/${fileName}`;
                     
                     const { error } = await supabase.storage.from('organization-assets').upload(filePath, file, { upsert: true });
                     if (error) throw error;
                     
                     const { data: { publicUrl } } = supabase.storage.from('organization-assets').getPublicUrl(filePath);
                     
                     setCompany(prev => prev ? {...prev, logo_url: publicUrl} : null);
                     // Auto save to DB directly since Logo upload is immediate feedback
                     await api.patch(`/companies/${user.company_id}`, { logo_url: publicUrl });
                     alert('Logo actualizado exitosamente');
                   } catch (err) {
                     console.error('Error uploading logo:', err);
                     alert('Hubo un error subiendo tu logo. Intenta de nuevo.');
                   } finally {
                     setSaving(false);
                   }
                 }} 
               />
               <label 
                 htmlFor="logoUpload" 
                 className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
               >
                 {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={16} />}
               </label>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={14} /> Nombre de la Empresa
                </label>
                <input 
                  type="text" 
                  value={company?.name || ''}
                  onChange={(e) => setCompany(prev => prev ? {...prev, name: e.target.value} : null)}
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
                  value={company?.tax_id || ''}
                  onChange={(e) => setCompany(prev => prev ? {...prev, tax_id: e.target.value} : null)}
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
                value={company?.email || ''}
                onChange={(e) => setCompany(prev => prev ? {...prev, email: e.target.value} : null)}
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
                value={company?.phone || ''}
                onChange={(e) => setCompany(prev => prev ? {...prev, phone: e.target.value} : null)}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin size={14} /> Dirección Principal
              </label>
              <textarea 
                value={company?.address || ''}
                onChange={(e) => setCompany(prev => prev ? {...prev, address: e.target.value} : null)}
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
                value={company?.country || ''}
                onChange={(e) => setCompany(prev => prev ? {...prev, country: e.target.value} : null)}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Chile"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={14} /> Moneda por Defecto
              </label>
              <select 
                value={company?.currency || 'CLP'}
                onChange={(e) => setCompany(prev => prev ? {...prev, currency: e.target.value} : null)}
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
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            {saving ? (
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
