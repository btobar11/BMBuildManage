import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Step {
  code: string;
  completed: boolean;
  completedAt?: string;
}

interface OnboardingProgress {
  percentage: number;
  steps: Step[];
}

interface Props {
  progress: OnboardingProgress;
}

const STEP_LABELS: Record<string, { title: string, desc: string, action: string, link: string }> = {
  create_project: {
    title: 'Crea tu primer proyecto',
    desc: 'Configura la estructura básica de tu obra.',
    action: 'Ir a proyectos',
    link: '/projects'
  },
  create_budget: {
    title: 'Genera un presupuesto',
    desc: 'Calcula costos y recursos para tu proyecto.',
    action: 'Crear presupuesto',
    link: '/budgets'
  },
  add_item: {
    title: 'Agrega partidas',
    desc: 'Define los APUs y detalles constructivos.',
    action: 'Ver partidas',
    link: '/items'
  },
  add_expense: {
    title: 'Registra un gasto',
    desc: 'Inicia el control de costos reales.',
    action: 'Ir a gastos',
    link: '/expenses'
  },
  invite_user: {
    title: 'Invita a tu equipo',
    desc: 'La colaboración es clave para el éxito.',
    action: 'Configurar equipo',
    link: '/settings/users'
  }
};

export function OnboardingChecklist({ progress }: Props) {
  const navigate = useNavigate();

  if (!progress || progress.percentage === 100) {
    return null; // Don't show if fully onboarded
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Primeros pasos</h3>
        <p className="text-sm text-gray-500 mt-1">Completa esta guía para aprovechar al máximo BM Build Manage.</p>
        
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="text-sm font-bold text-indigo-600">{Math.round(progress.percentage)}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {progress.steps.map((step, idx) => {
          const config = STEP_LABELS[step.code] || {
            title: step.code,
            desc: '',
            action: 'Completar',
            link: '/'
          };

          return (
            <div 
              key={step.code} 
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                step.completed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="mt-0.5">
                {step.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${step.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {config.title}
                </h4>
                <p className="text-sm text-gray-500 mt-1">{config.desc}</p>
                
                {!step.completed && (
                  <button 
                    onClick={() => navigate(config.link)}
                    className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {config.action} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
