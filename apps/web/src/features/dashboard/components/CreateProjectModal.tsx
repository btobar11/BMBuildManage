import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, AlertCircle, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import api from '../../../lib/api';
import { getRegionNames, getCommunesByRegion } from '../../../lib/chileLocationData';
import { ClientAutocomplete } from './ClientAutocomplete';
import { useUFValue } from '../../../hooks/useUFValue';

interface FormErrors {
  name?: string;
  address?: string;
  region?: string;
  commune?: string;
  start_date?: string;
  end_date?: string;
  estimated_price?: string;
  estimated_surface?: string;
}

export const CreateProjectModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: (budgetId: string) => void }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    region: '',
    commune: '',
    type: ['residential'] as string[],
    status: 'draft' as string,
    estimated_price: '',
    estimated_price_currency: 'CLP' as string,
    estimated_surface: '',
    description: '',
    start_date: '',
    end_date: '',
    client_id: '' as string | null,
    client_name: '',
    code: '',
    floors: '',
    underground_floors: '',
    land_area: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const regionNames = useMemo(() => getRegionNames(), []);
  const communesForRegion = useMemo(() => formData.region ? getCommunesByRegion(formData.region) : [], [formData.region]);

  const projectTypes = [
    { value: 'residential', label: 'Residencial' },
    { value: 'commercial', label: 'Comercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'infrastructure', label: 'Infraestructura' },
    { value: 'remodel', label: 'Remodelación' },
  ];

  const projectStatuses = [
    { value: 'draft', label: 'En Estudio' },
    { value: 'in_progress', label: 'En Ejecución' },
    { value: 'completed', label: 'Terminado' },
  ];

  const currencies = [
    { value: 'CLP', label: 'CLP' },
    { value: 'UF', label: 'UF' },
  ];

  const toggleType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const queryClient = useQueryClient();
  const { data: ufValue } = useUFValue();

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      // Sanitizar tipos antes de enviar a la API
      const sanitizedStartDate = formData.start_date 
        ? new Date(formData.start_date).toISOString() 
        : undefined;
      const sanitizedEndDate = formData.end_date 
        ? new Date(formData.end_date).toISOString() 
        : undefined;
      const sanitizedBudget = formData.estimated_price 
        ? Number(formData.estimated_price) 
        : undefined;
      const sanitizedArea = formData.estimated_surface 
        ? parseFloat(formData.estimated_surface) 
        : undefined;

      const projectPayload = {
        name: formData.name,
        address: formData.address || undefined,
        region: formData.region || undefined,
        commune: formData.commune || undefined,
        type: formData.type || undefined,
        status: formData.status || 'draft',
        budget: sanitizedBudget,
        estimated_area: sanitizedArea,
        description: formData.description || undefined,
        start_date: sanitizedStartDate,
        end_date: sanitizedEndDate,
        client_id: formData.client_id || undefined,
        budget_currency: formData.estimated_price_currency,
        price_currency: formData.estimated_price_currency,
        floors: formData.floors ? parseInt(formData.floors) : undefined,
        underground_floors: formData.underground_floors ? parseInt(formData.underground_floors) : undefined,
        land_area: formData.land_area ? parseFloat(formData.land_area) : undefined,
      };

      const projectResponse = await api.post('/projects', projectPayload);
      const newProject = projectResponse.data;

      const budgetResponse = await api.post('/budgets', {
        project_id: newProject.id,
        code: formData.code || undefined,
        version: 1,
        status: 'draft',
        total_estimated_price: sanitizedBudget || 0,
        total_estimated_cost: 0,
      });

      return { project: newProject, budget: budgetResponse.data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
      onSuccess(data.budget.id);
    },
  });

  const resetForm = () => {
    setFormData({ 
      name: '', address: '', region: '', commune: '', type: ['residential'], status: 'draft', 
      estimated_price: '', estimated_price_currency: 'CLP', estimated_surface: '', 
      description: '', start_date: '', end_date: '', client_id: '', client_name: '',
      code: '', floors: '', underground_floors: '', land_area: ''
    });
    setErrors({});
    setTouched({});
    setCurrentStep(1);
  };

  const handleClientChange = (clientId: string | null, clientName: string) => {
    setFormData(prev => ({
      ...prev,
      client_id: clientId || '',
      client_name: clientName,
    }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep = (step: number) => {
    const newErrors: FormErrors = {};
    let isValid = true;
    let newTouched: Record<string, boolean> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre del proyecto es requerido';
        newTouched.name = true;
        isValid = false;
      }
    } else if (step === 2) {
      if (!formData.address.trim()) {
        newErrors.address = 'La dirección es requerida';
        newTouched.address = true;
        isValid = false;
      }
      if (!formData.region) {
        newErrors.region = 'La región es requerida';
        newTouched.region = true;
        isValid = false;
      }
      if (!formData.commune) {
        newErrors.commune = 'La comuna es requerida';
        newTouched.commune = true;
        isValid = false;
      }
    } else if (step === 3) {
      if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (end < start) {
          newErrors.end_date = 'La fecha de término no puede ser anterior a la de inicio';
          newTouched.end_date = true;
          isValid = false;
        }
      }
    } else if (step === 4) {
      if (formData.estimated_surface && isNaN(parseFloat(formData.estimated_surface))) {
        newErrors.estimated_surface = 'Debe ser un número válido';
        newTouched.estimated_surface = true;
        isValid = false;
      }
      if (formData.estimated_price && isNaN(Number(formData.estimated_price))) {
        newErrors.estimated_price = 'Debe ser un número válido';
        newTouched.estimated_price = true;
        isValid = false;
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    setTouched(prev => ({ ...prev, ...newTouched }));
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        if (currentStep === 3 && !formData.code) {
          generateRecommendedCode();
        }
        setCurrentStep(prev => prev + 1);
      } else {
        createProjectMutation.mutate();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleInputBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const generateRecommendedCode = () => {
    if (!formData.name) return;
    
    // Get first 2 letters of each word in name (up to 3 words)
    const initials = formData.name
      .split(' ')
      .filter(w => w.length > 0)
      .slice(0, 3)
      .map(w => w.substring(0, 2).charAt(0).toUpperCase() + w.substring(1, 2).toLowerCase())
      .join('');
    
    const commune = formData.commune ? `-${formData.commune.toUpperCase()}` : '';
    const year = `-${new Date().getFullYear()}`;
    
    const recommended = `${initials}${commune}${year}`;
    setFormData(prev => ({ ...prev, code: recommended }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-foreground">Nuevo Proyecto</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted">
            <X size={20} />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-center px-6 py-4 bg-muted/20 border-b border-border shrink-0">
          {[1, 2, 3, 4].map((step, idx) => (
            <div key={step} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                  currentStep === step 
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/20' 
                    : currentStep > step 
                      ? 'bg-emerald-600/20 text-emerald-600' 
                      : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {currentStep > step ? <Check size={16} strokeWidth={3} /> : step}
              </div>
              {idx < 3 && (
                <div className={`w-8 sm:w-16 h-1 mx-2 rounded-full transition-colors ${currentStep > step ? 'bg-emerald-500/50' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto w-full flex-1 min-h-[300px]">
          <div className="space-y-4 max-w-md mx-auto">
            
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-foreground">Información General</h3>
                  <p className="text-sm text-muted-foreground">Datos básicos del proyecto a realizar.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Nombre del Proyecto <span className="text-red-500">*</span></label>
                  <input 
                    autoFocus
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onBlur={() => handleInputBlur('name')}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Ej. Remodelación Casa Central"
                  />
                  {touched.name && errors.name && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertCircle size={12} /><span>{errors.name}</span>
                    </div>
                  )}
                  <ClientAutocomplete
                    value={formData.client_name}
                    onChange={handleClientChange}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Descripción / Notas</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-y transition-all"
                    placeholder="Detalles adicionales sobre la obra..."
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-foreground">Ubicación de la Obra</h3>
                  <p className="text-sm text-muted-foreground">Determina dónde se llevará a cabo la ejecución.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Dirección de Obra <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    onBlur={() => handleInputBlur('address')}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Freire 123"
                  />
                  {touched.address && errors.address && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertCircle size={12} /><span>{errors.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Región <span className="text-red-500">*</span></label>
                    <select 
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value, commune: '' })}
                      onBlur={() => handleInputBlur('region')}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                    >
                      <option value="">Seleccionar región</option>
                      {regionNames.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                    {touched.region && errors.region && (
                      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                        <AlertCircle size={12} /><span>{errors.region}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Comuna <span className="text-red-500">*</span></label>
                    <select 
                      disabled={!formData.region}
                      value={formData.commune}
                      onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                      onBlur={() => handleInputBlur('commune')}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all appearance-none"
                    >
                      <option value="">{formData.region ? 'Seleccionar comuna' : 'Seleccione una región'}</option>
                      {communesForRegion.map((commune) => (
                        <option key={commune} value={commune}>{commune}</option>
                      ))}
                    </select>
                    {touched.commune && errors.commune && (
                      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                        <AlertCircle size={12} /><span>{errors.commune}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-foreground">Clasificación y Plazos</h3>
                  <p className="text-sm text-muted-foreground">Define el tipo de proyecto y su temporalidad.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Obra <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {projectTypes.map((pt) => (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => toggleType(pt.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                          formData.type.includes(pt.value)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                            : 'bg-background text-muted-foreground border-border hover:border-emerald-400'
                        }`}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-muted-foreground">Estado Inicial</label>
                  <div className="flex flex-wrap gap-2">
                    {projectStatuses.map((ps) => (
                      <button
                        key={ps.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: ps.value }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                          formData.status === ps.value
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                            : 'bg-background text-muted-foreground border-border hover:border-emerald-400'
                        }`}
                      >
                        {ps.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Fecha Inicio (Estimada)</label>
                    <input 
                      type="date" 
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      onBlur={() => handleInputBlur('start_date')}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Fecha Término (Estimada)</label>
                    <input 
                      type="date" 
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      onBlur={() => handleInputBlur('end_date')}
                      min={formData.start_date}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    {touched.end_date && errors.end_date && (
                      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                        <AlertCircle size={12} /><span>{errors.end_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-foreground">Estimaciones y Código</h3>
                  <p className="text-sm text-muted-foreground">Datos finales y código identificador del proyecto.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Código de Presupuesto <span className="text-red-500">*</span></label>
                    <button 
                      type="button" 
                      onClick={generateRecommendedCode}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 uppercase tracking-wider"
                    >
                      Regenerar Sugerencia
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                    placeholder="Ej. EdMiBi-CONCE-2026"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Presupuesto Estimado (Cliente)</label>
                  <div className="flex gap-2">
                    <div className="flex rounded-xl overflow-hidden border border-border bg-background">
                      {currencies.map((curr) => (
                        <button
                          key={curr.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, estimated_price_currency: curr.value }))}
                          className={`px-4 py-3 text-sm font-semibold transition-all ${
                            formData.estimated_price_currency === curr.value
                              ? 'bg-emerald-600 text-white'
                              : 'text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {curr.label}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="number" 
                      value={formData.estimated_price}
                      onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })}
                      onBlur={() => handleInputBlur('estimated_price')}
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Dejar en blanco si se desconoce"
                    />
                  </div>
                  {formData.estimated_price_currency === 'UF' && formData.estimated_price && ufValue && (
                    <div className="flex justify-end pr-2 pt-1">
                      <p className="text-xs text-emerald-400 font-medium">
                        ≈ {(Number(formData.estimated_price) * ufValue).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })} CLP 
                        <span className="text-muted-foreground ml-1">(UF hoy: {ufValue.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })})</span>
                      </p>
                    </div>
                  )}
                  {touched.estimated_price && errors.estimated_price && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertCircle size={12} /><span>{errors.estimated_price}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-medium text-muted-foreground">Superficie Estimada (m²)</label>
                  <input 
                    type="number" 
                    value={formData.estimated_surface}
                    onChange={(e) => setFormData({ ...formData, estimated_surface: e.target.value })}
                    onBlur={() => handleInputBlur('estimated_surface')}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Ej. 150"
                  />
                  {touched.estimated_surface && errors.estimated_surface && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertCircle size={12} /><span>{errors.estimated_surface}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Número de Pisos</label>
                    <input 
                      type="number" 
                      value={formData.floors}
                      onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ej. 5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Pisos Subterráneos</label>
                    <input 
                      type="number" 
                      value={formData.underground_floors}
                      onChange={(e) => setFormData({ ...formData, underground_floors: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ej. 2"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-medium text-muted-foreground">Superficie Terreno (m²)</label>
                  <input 
                    type="number" 
                    value={formData.land_area}
                    onChange={(e) => setFormData({ ...formData, land_area: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Ej. 500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-border shrink-0 flex items-center justify-between bg-muted/10 rounded-b-2xl">
          <button 
            type="button" 
            onClick={handleBack}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors ${
              currentStep === 1 
                ? 'text-transparent pointer-events-none' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          
          <button 
            type="button" 
            onClick={handleNext}
            disabled={createProjectMutation.isPending}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20"
          >
            {createProjectMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {currentStep < totalSteps ? (
              <>Siguiente <ChevronRight size={16} /></>
            ) : (
              'Crear Proyecto'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}