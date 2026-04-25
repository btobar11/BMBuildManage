import React, { useState } from 'react';
import { usePricingPlans } from '../../hooks/usePricingPlans';
import type { BillingCycle, Plan } from '../../types/billing';
import { usePricingAI } from '../../hooks/usePricingAI';
import { Check, Sparkles, AlertCircle, Building2, Users, HardDrive } from 'lucide-react';
import api from '../../lib/api';

const trackEvent = (_eventName: string, _data?: unknown) => {
  // Track analytics event in production
};

export function PricingPage() {
  const { plans, loading: plansLoading } = usePricingPlans();
  const { recommendation, loading: aiLoading } = usePricingAI();
  const [cycle, setCycle] = useState<BillingCycle>('annual');

  // Track page view
  React.useEffect(() => {
    trackEvent('pricing_view');
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    trackEvent('plan_selected', { plan: plan.code, cycle });
    try {
      const { data } = await api.post('/subscriptions/checkout', {
        plan: plan.code,
        billing_cycle: cycle,
      });
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Error creating checkout session', error);
      alert('Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.');
    }
  };

  const handleBuyAddon = async (addonCode: string) => {
    trackEvent('addon_selected', { addon: addonCode });
    try {
      const { data } = await api.post('/subscriptions/addons/checkout', {
        addon_code: addonCode,
      });
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Error creating addon checkout session', error);
      alert('Hubo un error al procesar tu compra. Por favor intenta de nuevo.');
    }
  };

  const getDiscount = (c: BillingCycle) => {
    if (c === 'quarterly') return 0.9; // 10%
    if (c === 'semiannual') return 0.85; // 15%
    if (c === 'annual') return 0.75; // 25%
    return 1;
  };

  const formatPrice = (basePrice: number) => {
    const discounted = basePrice * getDiscount(cycle);
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(discounted));
  };

  if (plansLoading) {
    return <div className="p-12 text-center text-gray-500">Cargando planes...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Precios simples, escalar sin límites
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Encuentra el plan perfecto para tu constructora. Prueba gratis por 14 días, sin tarjeta de crédito.
        </p>
      </div>

      {/* AI Recommendation */}
      {!aiLoading && recommendation && (
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 flex items-start space-x-4 shadow-sm">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider">AI Insight</h3>
              <p className="mt-1 text-indigo-800 font-medium">{recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 inline-flex">
          {(['monthly', 'quarterly', 'semiannual', 'annual'] as BillingCycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                cycle === c ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {c === 'monthly' && 'Mensual'}
              {c === 'quarterly' && 'Trimestral (-10%)'}
              {c === 'semiannual' && 'Semestral (-15%)'}
              {c === 'annual' && 'Anual (-25%)'}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.code}
            className={`relative flex flex-col p-8 bg-white rounded-2xl shadow-lg border ${
              plan.recommended ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'
            }`}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2">
                <span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Más popular
                </span>
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-4 flex items-baseline text-gray-900">
                <span className="text-5xl font-extrabold tracking-tight">{formatPrice(plan.price)}</span>
                <span className="ml-1 text-xl font-medium text-gray-500">/mes</span>
              </p>
            </div>
            
            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-600">{feature}</span>
                </li>
              ))}
              <div className="pt-4 border-t border-gray-100 mt-4 space-y-3">
                <li className="flex items-center text-sm text-gray-500">
                  <Building2 className="w-4 h-4 mr-2" /> Hasta {plan.limits.projects} proyectos
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-2" /> Hasta {plan.limits.users} usuarios
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <HardDrive className="w-4 h-4 mr-2" /> {plan.limits.storage}GB almacenamiento
                </li>
              </div>
            </ul>

            <button
              onClick={() => handleSelectPlan(plan)}
              className={`mt-auto w-full py-3 px-4 rounded-xl font-bold text-center transition-colors ${
                plan.recommended
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Comenzar prueba gratis
            </button>
          </div>
        ))}
      </div>

      {/* Addons Section */}
      <div className="max-w-7xl mx-auto mt-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Potencia tu plan con Add-ons</h2>
          <p className="mt-4 text-lg text-gray-600">Agrega solo lo que necesitas, cuando lo necesitas.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { code: 'ai_pack', name: 'AI Pack', desc: '1000 requests AI extra', price: 15000 },
            { code: 'bim_pack', name: 'BIM Module', desc: 'Soporte 4D y 5D avanzado', price: 49990 },
            { code: 'extra_users', name: 'Usuarios Extra', desc: '+5 usuarios adicionales', price: 19990 },
            { code: 'storage_pack', name: 'Storage Extra', desc: '+50GB almacenamiento', price: 9990 },
          ].map((addon) => (
            <div key={addon.code} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-bold text-gray-900 text-lg">{addon.name}</h4>
              <p className="text-sm text-gray-500 mt-1 mb-4">{addon.desc}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">${addon.price.toLocaleString('es-CL')}/mes</span>
                <button 
                  onClick={() => handleBuyAddon(addon.code)}
                  className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800"
                >
                  Añadir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Estimator */}
      <div className="max-w-4xl mx-auto mt-24 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Calculadora de Inversión</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proyectos Activos</label>
              <input type="number" min="1" placeholder="Ej: 5" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuarios de Equipo</label>
              <input type="number" min="1" placeholder="Ej: 10" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Uso de BIM</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="none">No utilizo BIM</option>
                <option value="basic">Visualización 3D</option>
                <option value="advanced">4D / 5D Completo</option>
              </select>
            </div>
          </div>
          <div className="mt-8 bg-indigo-50 p-6 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-indigo-900 text-lg">Plan recomendado: Pro</h4>
              <p className="text-indigo-700 mt-1">Costo estimado: $89.990 CLP /mes</p>
            </div>
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition">
              Comenzar con Pro
            </button>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-5xl mx-auto mt-24 mb-24 overflow-x-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Comparación de funcionalidades</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="py-4 px-6 font-bold text-gray-900 border-b-2 border-gray-200">Funcionalidad</th>
              <th className="py-4 px-6 font-bold text-gray-900 border-b-2 border-gray-200 text-center">Lite</th>
              <th className="py-4 px-6 font-bold text-indigo-600 border-b-2 border-indigo-200 text-center bg-indigo-50 rounded-t-lg">Pro</th>
              <th className="py-4 px-6 font-bold text-gray-900 border-b-2 border-gray-200 text-center">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Proyectos', lite: '3', pro: '20', ent: 'Ilimitado' },
              { name: 'Usuarios', lite: '2', pro: '10', ent: 'Ilimitado' },
              { name: 'Soporte', lite: 'Email', pro: 'Prioritario', ent: 'Dedicado 24/7' },
              { name: 'Presupuestos', lite: '✅', pro: '✅', ent: '✅' },
              { name: 'Facturación', lite: '✅', pro: '✅', ent: '✅' },
              { name: 'BIM 3D', lite: '❌', pro: '✅', ent: '✅' },
              { name: 'AI Assistant', lite: '❌', pro: '✅', ent: '✅' },
              { name: 'Integración ERP', lite: '❌', pro: '❌', ent: '✅' },
              { name: 'API Access', lite: '❌', pro: 'Add-on', ent: '✅' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="py-4 px-6 text-gray-700 font-medium">{row.name}</td>
                <td className="py-4 px-6 text-center text-gray-600">{row.lite}</td>
                <td className="py-4 px-6 text-center font-bold text-indigo-900 bg-indigo-50/30">{row.pro}</td>
                <td className="py-4 px-6 text-center text-gray-600">{row.ent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default PricingPage;
