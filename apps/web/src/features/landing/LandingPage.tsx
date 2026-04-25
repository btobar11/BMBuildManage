import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Play, ArrowRight, Building2, HardHat, TrendingUp, X } from 'lucide-react';

const trackEvent = (eventName: string, data?: any) => {
  // TODO: Implement analytics tracking without console.log
};

export function LandingPage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    trackEvent('landing_view');
  }, []);

  const openDemo = () => {
    trackEvent('demo_open');
    setIsDemoOpen(true);
  };

  const closeDemo = () => setIsDemoOpen(false);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold tracking-tight">BM Build Manage</span>
        </div>
        <div className="hidden md:flex gap-8 font-medium text-gray-600">
          <a href="#features" className="hover:text-indigo-600 transition">Funcionalidades</a>
          <a href="#bim" className="hover:text-indigo-600 transition">BIM 5D</a>
          <a href="#pricing" onClick={(e) => { e.preventDefault(); navigate('/pricing'); }} className="hover:text-indigo-600 transition">Precios</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="font-semibold text-gray-600 hover:text-gray-900">Ingresar</button>
          <button onClick={() => navigate('/register')} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm">
            Probar gratis
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium text-sm mb-8 border border-indigo-100">
          <SparklesIcon className="w-4 h-4" />
          Nuevo: AI Sales Agent y Cotizador Dinámico
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
          Gestiona tus obras, costos y BIM en un <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">solo lugar</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Control total de presupuestos, ejecución y análisis con Inteligencia Artificial. Optimiza tus márgenes y evita sobrecostos antes de que ocurran.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => { trackEvent('cta_click', { type: 'primary' }); navigate('/register'); }}
            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            Comenzar gratis <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={openDemo}
            className="w-full sm:w-auto bg-white text-gray-900 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 border border-gray-200 transition shadow-sm flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 text-indigo-600" /> Ver demo
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-500">14 días gratis • No requiere tarjeta de crédito</p>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-6">Constructoras que confían en nosotros</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
            {/* Logos placeholders */}
            <div className="text-2xl font-black">CONSTRUMAX</div>
            <div className="text-2xl font-black">BUILDING CO</div>
            <div className="text-2xl font-black">INGENIERÍA SUR</div>
            <div className="text-2xl font-black">ARQUITECTURA PRO</div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Todo lo que necesitas para construir mejor</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">De la planificación a la entrega. Reduce la fricción operativa y enfócate en la rentabilidad.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<HardHat />}
            title="Control de Ejecución"
            desc="Seguimiento de avance físico, subcontratos y control de horas hombre en terreno con modo offline."
          />
          <FeatureCard 
            icon={<TrendingUp />}
            title="Presupuestos Dinámicos"
            desc="Cálculo de APUs automatizado, control de desviaciones en tiempo real y proyecciones de costo."
          />
          <FeatureCard 
            icon={<Building2 />}
            title="Gestión Multi-Proyecto"
            desc="Controla múltiples obras desde un dashboard centralizado con KPIs y alertas de riesgo."
          />
        </div>
      </section>

      {/* Lead Capture Section */}
      <section className="py-24 bg-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">¿Listo para modernizar tu constructora?</h2>
          <p className="text-xl text-indigo-200 mb-10">Agenda una sesión estratégica con nuestro equipo y descubre el ROI oculto en tus proyectos.</p>
          <LeadForm />
        </div>
      </section>

      {/* Demo Modal */}
      {isDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <button onClick={closeDemo} className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white p-2 rounded-full backdrop-blur-md transition">
              <X className="w-6 h-6 text-gray-900" />
            </button>
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              {/* Replace with actual video */}
              <div className="text-center">
                <Play className="w-20 h-20 text-white/50 mx-auto mb-4" />
                <p className="text-white/70 font-medium">Video Demo Interactivo</p>
              </div>
            </div>
            <div className="p-8 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">BM Build Manage en acción</h3>
                <p className="text-gray-600">Descubre cómo reducir un 15% tus costos operativos.</p>
              </div>
              <button 
                onClick={() => { trackEvent('cta_click', { type: 'demo_modal' }); navigate('/register'); }}
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 transition whitespace-nowrap"
              >
                Crear cuenta gratis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function LeadForm() {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    trackEvent('lead_form_submit');
    try {
      // const res = await fetch('/api/v1/leads', { method: 'POST', body: JSON.stringify({ email, companyName: company }), headers: { 'Content-Type': 'application/json' }});
      await new Promise(r => setTimeout(r, 1000));
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-500/20 text-green-100 p-6 rounded-xl border border-green-500/30 font-medium">
        ¡Gracias! Nuestro equipo se contactará contigo a la brevedad.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
      <input 
        type="email" 
        placeholder="Tu correo de trabajo" 
        required 
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="flex-1 px-6 py-4 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <input 
        type="text" 
        placeholder="Nombre de constructora" 
        required 
        value={company}
        onChange={e => setCompany(e.target.value)}
        className="flex-1 px-6 py-4 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <button 
        type="submit" 
        disabled={status === 'loading'}
        className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-600 transition whitespace-nowrap disabled:opacity-70"
      >
        {status === 'loading' ? 'Enviando...' : 'Probar gratis'}
      </button>
    </form>
  );
}

export default LandingPage;
