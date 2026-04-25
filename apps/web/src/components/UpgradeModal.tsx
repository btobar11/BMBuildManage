import { useNavigate } from 'react-router-dom';
import type { FeatureCode, PlanTier } from '../lib/plan.constants';
import { FEATURE_MIN_PLAN, PLAN_DISPLAY_NAMES } from '../lib/plan.constants';

interface UpgradeModalProps {
  feature: FeatureCode | null;
  onClose: () => void;
}

const FEATURE_LABELS: Partial<Record<string, string>> = {
  bim_viewer: 'Visor BIM 3D',
  bim_4d: 'Simulación 4D',
  bim_5d: 'Costos 5D',
  bim_clashes: 'Detección de Colisiones',
  bim_apu_link: 'Vinculación BIM-APU',
  ai_assistant: 'Asistente IA',
  analytics_advanced: 'Analytics Avanzado',
  apu: 'Análisis de Precios Unitarios',
  formula_engine: 'Motor de Cubicación',
  purchase_orders: 'Órdenes de Compra',
  invoices_sii: 'Facturación Electrónica SII',
  execution: 'Control de Ejecución',
  schedule: 'Programación Gantt',
  subcontractors: 'Gestión de Subcontratistas',
  analytics_basic: 'Dashboard Analytics',
  rfis: 'RFIs',
  submittals: 'Submittals',
  punch_list: 'Punch List',
  audit_logs: 'Registro de Auditoría',
};

const PLAN_COLORS: Record<PlanTier, string> = {
  lite: 'from-blue-500 to-blue-600',
  pro: 'from-violet-500 to-purple-600',
  enterprise: 'from-amber-500 to-orange-600',
};

export function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();

  if (!feature) return null;

  const requiredPlan = FEATURE_MIN_PLAN[feature] || 'pro';
  const planName = PLAN_DISPLAY_NAMES[requiredPlan];
  const featureLabel = FEATURE_LABELS[feature] || feature;
  const gradient = PLAN_COLORS[requiredPlan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${gradient} px-6 py-8 text-center`}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">
            Funcionalidad Premium
          </h2>
          <p className="text-white/80 mt-1 text-sm">
            Disponible en plan {planName} o superior
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-700 text-center mb-6">
            <strong>{featureLabel}</strong> no está incluido en tu plan actual.
            Actualiza a <strong>Plan {planName}</strong> para desbloquear
            esta funcionalidad.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/pricing');
              }}
              className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${gradient} text-white rounded-lg hover:opacity-90 transition-opacity font-medium`}
            >
              Ver planes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
