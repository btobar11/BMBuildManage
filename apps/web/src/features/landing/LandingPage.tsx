import { useNavigate } from 'react-router-dom';
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
  LayoutDashboard
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

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
            {[
              {
                icon: <LayoutDashboard size={24} className="text-indigo-400" />,
                title: "Dashboard Gerencial",
                desc: "Visualiza la salud financiera de todos tus proyectos, márgenes de utilidad y desviaciones en un único panel general."
              },
              {
                icon: <HardHat size={24} className="text-orange-400" />,
                title: "Gestión de Cuadrillas",
                desc: "Aloca a tus trabajadores a diferentes proyectos, controla sus jornales y anticipa problemas de escasez de mano de obra."
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
            ].map((feat, idx) => (
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

      {/* Modern Simple Footer */}
      <footer className="border-t border-white/10 bg-[#06080a] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur px-4 py-2 w-fit rounded-xl border border-black/10 shadow-sm">
            <img 
              src="/logo-full.png" 
              alt="BMBuildManage" 
              className="h-8 object-contain"
            />
          </div>
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} BMBuildManage. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
