import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  HardHat, 
  Calculator, 
  History, 
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Star,
  TrendingUp,
  FileCheck,
  Award,
  Building2
} from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos Mendoza',
    role: 'Director de Proyectos',
    company: 'Constructora Andes SpA',
    avatar: 'CM',
    content: 'BMBuildManage transformó nuestra forma de gestionar presupuestos. Antes tardábamos semanas en cerrar un proyecto, ahora lo hacemos en días. El control de costos en tiempo real es invaluable.',
    rating: 5,
    metric: '60% más rápido'
  },
  {
    name: 'María Elena Rojas',
    role: 'Ingeniera de Costos',
    company: 'Ingeniería y Construcción IRG',
    avatar: 'MR',
    content: 'La biblioteca de APU es oro puro. Tenemos toda nuestra base de costos estandarizada y generar presupuestos se volvió casi automático. El ROI fue inmediato.',
    rating: 5,
    metric: '40% ahorro en costos'
  },
  {
    name: 'Roberto Sánchez',
    role: 'Gerente General',
    company: 'Constructora Vanguardia',
    avatar: 'RS',
    content: 'La función de trabajo offline fue clave para nuestra operación en terreno. Nuestros supervisores pueden registrar avance sin conexión y todo se sincroniza automáticamente.',
    rating: 5,
    metric: '100% conectividad'
  }
];

const features = [
  {
    icon: <LayoutDashboard size={24} className="text-indigo-400" />,
    title: "Dashboard Gerencial",
    desc: "Visualiza la salud financiera de todos tus proyectos, márgenes de utilidad y desviaciones en un único panel general."
  },
  {
    icon: <HardHat size={24} className="text-orange-400" />,
    title: "Gestión de Cuadrillas",
    desc: "Aloca a tus trabajadores a diferentes proyectos, controla sus Jornales y anticipa problemas de escasez de mano de obra."
  },
  {
    icon: <BarChart3 size={24} className="text-emerald-400" />,
    title: "Control de Gastos (Facturas)",
    desc: "Carga las compras reales contra lo presupuestado. Chequea desviaciones al instante para evitar mermar tu rentabilidad."
  },
  {
    icon: <Calculator size={24} className="text-blue-400" />,
    title: "Presupuestos Ilimitados",
    desc: "Calcula los Itemizados con partidas customizables o arrastra desde tu biblioteca general del sistema para agilizar tu flujo."
  },
  {
    icon: <History size={24} className="text-purple-400" />,
    title: "Trazabilidad Total (Audit Log)",
    desc: "Líneas de tiempo automatizadas de quién hizo qué, cuándo, y qué valor cambió en los presupuestos. Transparencia total."
  },
  {
    icon: <ShieldCheck size={24} className="text-rose-400" />,
    title: "Seguridad y Accesibilidad",
    desc: "Backups automatizados, accesos cifrados en la nube mediante roles y autenticación de última generación."
  }
];

const pricingPlans = [
  {
    name: 'Profesional',
    description: 'Para equipos pequeños que comienzan',
    price: '99.000',
    period: 'mes',
    features: [
      '3 proyectos simultáneos',
      'Usuarios ilimitados',
      'Biblioteca APU básica',
      'Reportes estándar',
      'Soporte por email',
      '5 GB almacenamiento'
    ],
    highlighted: false,
    cta: 'Comenzar Gratis'
  },
  {
    name: 'Empresa',
    description: 'Para constructoras en crecimiento',
    price: '249.000',
    period: 'mes',
    features: [
      'Proyectos ilimitados',
      'Usuarios ilimitados',
      'Biblioteca APU avanzada',
      'Reportes avanzados',
      'Soporte prioritario',
      '50 GB almacenamiento',
      'Integración BIM',
      'API personalizada'
    ],
    highlighted: true,
    cta: 'Comenzar Prueba'
  },
  {
    name: 'Corporativo',
    description: 'Solución enterprise completa',
    price: 'Custom',
    period: '',
    features: [
      'Todo lo de Empresa',
      'Implementación dedicada',
      'Capacitación incluida',
      'SLA garantizado',
      'Almacenamiento ilimitado',
      'Integraciones custom',
      'Account manager',
      'Auditorías de seguridad'
    ],
    highlighted: false,
    cta: 'Contactar Ventas'
  }
];

const stats = [
  { value: '500+', label: 'Empresas', icon: Building2 },
  { value: '2.5M', label: 'Presupuestos', icon: FileCheck, suffix: 'CLP generados' },
  { value: '98%', label: 'Satisfacción', icon: Award },
  { value: '40%', label: 'Ahorro promedio', icon: TrendingUp }
];

export function LandingPage() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const handleCTA = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#090b0e] text-foreground font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Abstract Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] -right-[20%] w-[60%] h-[60%] bg-indigo-600/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#090b0e]/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-black/10 shadow-sm">
            <img 
              src="/logo-full.png" 
              alt="BMBuildManage" 
              className="h-6 object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogin}
              className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={handleCTA}
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Empezar Gratis
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap size={16} className="text-blue-500" />
            <span className="tracking-wide uppercase text-xs">El futuro de la gestión de obras</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400 tracking-tight leading-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            Control Total de tu Obra <br className="hidden md:block" />
            <span className="text-blue-500">en Tiempo Real</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            Simplificamos la estimación de costos, APUs, y el control de ejecución en una plataforma en la nube diseñada exclusivamente para profesionales de la construcción.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
            <button onClick={handleCTA} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold rounded-2xl shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-3 group">
              Crea tu primer proyecto
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
            <button onClick={handleLogin} className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-lg font-semibold rounded-2xl border border-border/50 transition-all flex items-center justify-center gap-3">
              Ver Demo
            </button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-6xl mx-auto px-6 mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="glass-dark p-6 rounded-2xl text-center group hover:bg-white/[0.08] transition-all">
                  <Icon size={28} className="text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Highlights Mockup */}
        <section className="max-w-6xl mx-auto px-6 mb-40">
          <div className="relative rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-700">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-50 pointer-events-none" />
            
            {/* Mockbar */}
            <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* Mock Content area */}
            <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
               <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Presupuestos Inteligentes APU</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Nuestra base de datos de Análisis de Precios Unitarios (APU) te permite cotizar cualquier etapa de tu obra de manera granular. Crea plantillas de partidas, calcula rendimientos de cuadrillas y ajusta márgenes comerciales en segundos.
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Cálculo automático de costos directos (Material, Mano de Obra, Equipos)',
                      'Ajuste dinámico de Gastos Generales y Utilidad',
                      'Consolidado general e impresión a PDF profesional'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl relative">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full" />
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Calculator size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Item 1.1: Hormigón Armado</h4>
                      <p className="text-xs text-muted-foreground">Volumen total: 120 m³</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-gray-400">Costo Materiales</span>
                      <span className="font-mono font-medium text-emerald-400">$ 45.000</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-gray-400">Mano de Obra (Semanal)</span>
                      <span className="font-mono font-medium text-blue-400">$ 12.500</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-white/10 border border-white/20 mt-4">
                      <span className="text-white font-medium">Costo Total Unitario</span>
                      <span className="font-mono font-bold text-white">$ 57.500</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Todo lo que necesitas, bajo un mismo techo</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Sustituye múltiples hojas de Excel desconectadas por una única fuente de verdad, con cálculos en tiempo real y colaboración integral.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <div key={idx} className="glass-dark p-8 rounded-[2rem] hover:bg-white/[0.08] transition-colors group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-5xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Lo que dicen nuestros clientes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Constructoras de toda Chile confían en BMBuildManage para gestionar sus proyectos.</p>
          </div>

          <div className="relative glass-dark rounded-3xl p-8 md:p-12">
            <div className="absolute top-8 left-8 text-8xl text-blue-500/20 font-serif">"</div>
            
            <div className="relative z-10">
              {testimonials.map((testimonial, idx) => (
                <div 
                  key={idx}
                  className={`transition-all duration-500 ${idx === currentTestimonial ? 'block' : 'hidden'}`}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={20} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed font-light">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-white">{testimonial.name}</p>
                        <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                        <p className="text-blue-400 text-sm font-medium">{testimonial.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-emerald-400">{testimonial.metric}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Resultado</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentTestimonial 
                      ? 'bg-blue-500 w-8' 
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-6xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Planes que escalan contigo</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Sin sorpresas. Sin costos ocultos. Cancela cuando quieras.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`relative rounded-3xl p-8 transition-all hover:-translate-y-2 ${
                  plan.highlighted 
                    ? 'bg-gradient-to-b from-blue-600/20 to-indigo-600/10 border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20' 
                    : 'glass-dark'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 rounded-full text-sm font-bold text-white">
                    Más Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>
                <div className="mb-8">
                  {plan.price === 'Custom' ? (
                    <p className="text-4xl font-bold text-white">A consultar</p>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">${plan.price}</span>
                      <span className="text-muted-foreground ml-1">CLP/{plan.period}</span>
                    </>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={handleCTA}
                  className={`w-full py-4 rounded-xl font-bold transition-all ${
                    plan.highlighted
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="p-12 md:p-16 rounded-[3rem] bg-gradient-to-br from-blue-900/40 via-[#090b0e] to-blue-900/40 border border-blue-500/20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10 text-center flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">¿Listo para escalar tus proyectos?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
                Únete hoy y obtén acceso total a las herramientas predilectas para el control de la construcción. Regístrate en menos de 1 minuto.
              </p>
              <button onClick={handleCTA} className="px-8 py-4 bg-white text-black font-bold rounded-2xl shadow-xl hover:bg-gray-100 transition-all flex items-center gap-2 group text-lg">
                Crear una cuenta gratis
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#06080a] py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur px-4 py-2 w-fit rounded-xl border border-black/10 shadow-sm mb-4">
                <img 
                  src="/logo-full.png" 
                  alt="BMBuildManage" 
                  className="h-8 object-contain"
                />
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                El software de gestión de construcción más completo del mercado chileno.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Características</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Integraciones</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Casos de Éxito</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Webinars</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Términos de Servicio</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-white transition-colors">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} BMBuildManage. Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Todos los sistemas operativos
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
