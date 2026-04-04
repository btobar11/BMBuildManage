import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { 
  BarChart3, 
  HardHat, 
  Calculator, 
  History, 
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  LayoutDashboard,
  Star,
  TrendingUp,
  Award,
  Building2,
  Globe,
  Lock,
  Smartphone,
  Settings,
  FileText,
  Truck,
  Wrench,
  ChevronDown,
  Play,
  Mail,
  Phone,
  MapPin,
  Menu,
  X,
  Sparkles,
  Layers,
  DollarSign,
  ClipboardCheck,
  Building,
  Ruler,
  Cpu,
  Database,
  Cloud,
  HeadphonesIcon
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
    icon: <LayoutDashboard size={28} />,
    title: "Dashboard Gerencial",
    desc: "Visualiza la salud financiera de todos tus proyectos, márgenes de utilidad y desviaciones en un único panel general.",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: <HardHat size={28} />,
    title: "Gestión de Cuadrillas",
    desc: "Aloca a tus trabajadores a diferentes proyectos, controla sus Jornales y anticipa problemas de escasez de mano de obra.",
    color: "from-amber-500 to-orange-600"
  },
  {
    icon: <BarChart3 size={28} />,
    title: "Control de Gastos",
    desc: "Carga las compras reales contra lo presupuestado. Chequea desviaciones al instante para evitar mermar tu rentabilidad.",
    color: "from-emerald-500 to-teal-600"
  },
  {
    icon: <Calculator size={28} />,
    title: "Presupuestos Ilimitados",
    desc: "Calcula los Itemizados con partidas customizables o arrastra desde tu biblioteca general del sistema para agilizar tu flujo.",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: <History size={28} />,
    title: "Trazabilidad Total",
    desc: "Líneas de tiempo automatizadas de quién hizo qué, cuándo, y qué valor cambió en los presupuestos. Transparencia total.",
    color: "from-pink-500 to-rose-600"
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Seguridad Total",
    desc: "Backups automatizados, accesos cifrados en la nube mediante roles y autenticación de última generación.",
    color: "from-cyan-500 to-sky-600"
  }
];

const constructionIcons = [
  { icon: <Building size={32} />, label: 'Edificación' },
  { icon: <Ruler size={32} />, label: 'Ingeniería' },
  { icon: <HardHat size={32} />, label: 'Obras Civiles' },
  { icon: <Wrench size={32} />, label: 'Industrial' },
  { icon: <Truck size={32} />, label: 'Infraestructura' },
  { icon: <Cpu size={32} />, label: 'BIM/CAE' },
];

const stats = [
  { value: '500+', label: 'Empresas', icon: Building2, color: 'text-violet-400' },
  { value: '2.5M', label: 'MLP Generados', icon: DollarSign, color: 'text-emerald-400' },
  { value: '98%', label: 'Satisfacción', icon: Award, color: 'text-amber-400' },
  { value: '40%', label: 'Ahorro Promedio', icon: TrendingUp, color: 'text-cyan-400' }
];

const processSteps = [
  {
    number: '01',
    title: 'Regístrate Gratis',
    description: 'Crea tu cuenta en segundos. Sin tarjeta de crédito requerida.',
    icon: <Sparkles size={24} />
  },
  {
    number: '02',
    title: 'Configura tu Empresa',
    description: 'Personaliza tu espacio con tu marca y preferencias.',
    icon: <Settings size={24} />
  },
  {
    number: '03',
    title: 'Crea tu Primer Proyecto',
    description: 'Comienza a presupuestar con nuestras plantillas inteligentes.',
    icon: <FileText size={24} />
  },
  {
    number: '04',
    title: 'Gestiona y Controla',
    description: 'Supervisa avance, costos y recursos en tiempo real.',
    icon: <ClipboardCheck size={24} />
  }
];

export function LandingPage() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isPaused] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const fullText = "Construye sin límites";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let index = 0;
    let currentText = '';
    let isDeleting = false;
    
    const typeInterval = setInterval(() => {
      if (isPaused) return;
      
      if (!isDeleting && index <= fullText.length) {
        currentText = fullText.slice(0, index);
        setTypedText(currentText);
        index++;
      } else if (isDeleting && index >= 0) {
        currentText = fullText.slice(0, index);
        setTypedText(currentText);
        index--;
      }
      
      if (index > fullText.length) {
        isDeleting = true;
        setTimeout(() => {}, 2000);
      }
      
      if (index < 0) {
        isDeleting = false;
        index = 0;
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, [isPaused]);

  const handleCTA = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-foreground font-sans selection:bg-violet-500/30 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/20 blur-[150px] rounded-full mix-blend-screen animate-float" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/15 blur-[120px] rounded-full mix-blend-screen animate-float-delayed" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-fuchsia-600/10 blur-[100px] rounded-full mix-blend-screen animate-particle" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-[#0a0a12]/90 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-violet-900/10' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10 shadow-lg shadow-violet-500/5 transform hover:scale-[1.02] transition-transform">
            <img 
              src="/logo-full.png" 
              alt="BMBuildManage" 
              className="h-7 sm:h-8 object-contain"
            />
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={scrollToFeatures} className="text-sm text-white/70 hover:text-white transition-colors">Características</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-white/70 hover:text-white transition-colors">Precios</button>
            <button onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-white/70 hover:text-white transition-colors">Testimonios</button>
            <button 
              onClick={handleLogin}
              className="px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={handleCTA}
              className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-violet-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-violet-500/40"
            >
              Empezar Gratis
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white/70 hover:text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-[#0a0a12]/95 backdrop-blur-2xl border-b border-white/5 transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}>
          <div className="px-4 py-6 space-y-4">
            <button onClick={() => { scrollToFeatures(); setMobileMenuOpen(false); }} className="block w-full text-left text-white/70 hover:text-white py-2">Características</button>
            <button onClick={() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block w-full text-left text-white/70 hover:text-white py-2">Precios</button>
            <button onClick={() => { document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block w-full text-left text-white/70 hover:text-white py-2">Testimonios</button>
            <button onClick={handleLogin} className="block w-full text-left text-white/70 hover:text-white py-2">Iniciar Sesión</button>
            <button onClick={handleCTA} className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl mt-4">
              Empezar Gratis
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-20">
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Floating Construction Icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {constructionIcons.map((item, idx) => (
              <div 
                key={idx}
                className="absolute text-white/5 hover:text-white/10 transition-colors animate-float"
                style={{
                  left: `${15 + (idx * 15)}%`,
                  top: `${20 + (idx * 12)}%`,
                  animationDelay: `${idx * 0.5}s`
                }}
              >
                {item.icon}
              </div>
            ))}
          </div>

          <div className="max-w-6xl mx-auto text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold mb-8 animate-slide-up shadow-lg shadow-violet-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              <span className="tracking-wide">Plataforma #1 en Gestión de Construcción</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-violet-200 to-purple-400 tracking-tight leading-[1.1] mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Control Total de tu Obra
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent animate-gradient">
                  {typedText}<span className="animate-blink text-violet-400">|</span>
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 4 150 6C200 8 250 4 298 10" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6"/>
                      <stop offset="50%" stopColor="#d946ef"/>
                      <stop offset="100%" stopColor="#8b5cf6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-up" style={{ animationDelay: '200ms' }}>
              La plataforma integral que simplifica la estimación de costos, <span className="text-violet-400">APUs</span>, gestión de cuadrillas y control de ejecución en tiempo real.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <button 
                onClick={handleCTA}
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white text-lg font-bold rounded-2xl shadow-2xl shadow-violet-600/30 transition-all flex items-center justify-center gap-3 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                Comienza Gratis Hoy
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button 
                onClick={() => document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                  <Play size={18} className="text-violet-400 ml-0.5" />
                </div>
                Ver Demo en Vivo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-white/40 text-sm animate-slide-up" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span>Datos 100% Seguros</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-cyan-400" />
                <span>Cloud + Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-amber-400" />
                <span>Mobile Friendly</span>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <button 
            onClick={scrollToFeatures}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white/60 transition-colors animate-scroll"
          >
            <ChevronDown size={32} />
          </button>
        </section>

        {/* Software Mockup Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-2xl shadow-2xl shadow-violet-900/20">
              {/* Browser Chrome */}
              <div className="h-12 bg-white/5 border-b border-white/5 flex items-center px-4 gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="h-7 bg-white/5 rounded-lg px-4 flex items-center text-white/40 text-xs gap-2">
                    <Lock size={12} />
                    <span>app.bmbuildmanage.cl/dashboard</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sidebar */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-600/30 flex items-center justify-center text-violet-400">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="text-white font-bold">Mi Constructora</p>
                          <p className="text-white/50 text-xs">Plan Empresa</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {['Dashboard', 'Proyectos', 'APU', 'Gastos'].map((item, i) => (
                          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${i === 0 ? 'bg-violet-600/30 text-white font-medium' : 'text-white/60 hover:bg-white/5'}`}>
                            <div className="w-2 h-2 rounded-full bg-current" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Proyectos Activos', value: '12', trend: '+2', color: 'violet' },
                        { label: 'Presupuesto Total', value: '$450M', trend: '+15%', color: 'emerald' },
                        { label: 'En Obra', value: '8', trend: '+1', color: 'amber' },
                        { label: 'Completados', value: '24', trend: '+4', color: 'cyan' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                          <p className="text-white/50 text-xs mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                          <p className={`text-xs font-medium ${stat.color === 'violet' ? 'text-violet-400' : stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'amber' ? 'text-amber-400' : 'text-cyan-400'}`}>
                            {stat.trend} este mes
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Project Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'Edificio Las Camelias', progress: 75, budget: '$180M', status: 'En Obra' },
                        { name: 'Centro Comercial Norte', progress: 45, budget: '$320M', status: 'En Obra' },
                      ].map((project, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-white font-bold group-hover:text-violet-300 transition-colors">{project.name}</h4>
                              <p className="text-white/50 text-sm">{project.status}</p>
                            </div>
                            <span className="text-violet-400 font-bold">{project.budget}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/50">Progreso</span>
                              <span className="text-white font-medium">{project.progress}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={idx} 
                    className="group glass-dark p-8 rounded-3xl text-center hover:bg-white/[0.08] transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/10"
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color.replace('text-', 'from-').replace('-400', '-500/20')} to-transparent flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                      <Icon size={28} className={stat.color} />
                    </div>
                    <p className="text-4xl md:text-5xl font-black text-white mb-2 animate-count">{stat.value}</p>
                    <p className="text-sm text-white/50">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold mb-6">
                <Layers size={16} />
                <span>Características Premium</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
                Todo lo que necesitas,
                <br />
                <span className="text-gradient">bajo un mismo techo</span>
              </h2>
              <p className="text-lg text-white/50 max-w-2xl mx-auto">
                Sustituye múltiples hojas de Excel desconectadas por una única fuente de verdad, con cálculos en tiempo real y colaboración integral.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {features.map((feat, idx) => (
                <div 
                  key={idx} 
                  className="group card-glass rounded-3xl p-8 hover:shadow-2xl hover:shadow-violet-500/10"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                    <div className="text-white">
                      {feat.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors">{feat.title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* Additional Features Banner */}
            <div className="mt-16 grid md:grid-cols-3 gap-6">
              {[
                { icon: <Database size={24} />, title: 'Biblioteca APU', desc: 'Análisis de Precios Unitarios prediseñados' },
                { icon: <Cloud size={24} />, title: 'Sincronización', desc: 'Trabaja online y offline sin perder datos' },
                { icon: <HeadphonesIcon size={24} />, title: 'Soporte 24/7', desc: 'Equipo especializado en construcción' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{item.title}</h4>
                    <p className="text-white/50 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 via-transparent to-transparent" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">
                Empieza en <span className="text-gradient">4 pasos simples</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, idx) => (
                <div key={idx} className="relative group">
                  {idx < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-violet-500/50 to-transparent z-0" />
                  )}
                  <div className="relative z-10 glass-dark rounded-3xl p-8 hover:bg-white/[0.08] transition-all">
                    <div className="text-6xl font-black text-violet-500/20 mb-4">{step.number}</div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/30">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-white/50 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">
                Lo que dicen nuestros <span className="text-gradient">clientes</span>
              </h2>
              <p className="text-lg text-white/50">Constructoras de toda Chile confían en BMBuildManage.</p>
            </div>

            <div className="relative">
              <div className="absolute -top-8 -left-4 text-9xl text-violet-500/10 font-serif select-none">"</div>
              
              <div className="glass-dark rounded-3xl p-8 md:p-12">
                <div className="relative z-10">
                  {testimonials.map((testimonial, idx) => (
                    <div 
                      key={idx}
                      className={`transition-all duration-700 ${idx === currentTestimonial ? 'block opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}
                    >
                      <div className="flex gap-1 mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={20} className="text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed font-light">
                        "{testimonial.content}"
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/30">
                            {testimonial.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-white">{testimonial.name}</p>
                            <p className="text-white/50 text-sm">{testimonial.role}</p>
                            <p className="text-violet-400 text-sm font-medium">{testimonial.company}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl px-6 py-3">
                          <p className="text-3xl font-black text-white">{testimonial.metric}</p>
                          <p className="text-xs text-white/50 uppercase tracking-wider">Resultado</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-3 mt-10">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTestimonial(idx)}
                      className={`h-3 rounded-full transition-all duration-500 ${
                        idx === currentTestimonial 
                          ? 'w-10 bg-gradient-to-r from-violet-500 to-fuchsia-500' 
                          : 'w-3 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">
                Planes que <span className="text-gradient">escalan contigo</span>
              </h2>
              <p className="text-lg text-white/50">Sin sorpresas. Sin costos ocultos. Cancela cuando quieras.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Profesional',
                  description: 'Para equipos pequeños',
                  price: '$99.000',
                  features: ['3 proyectos simultáneos', 'Usuarios ilimitados', 'Biblioteca APU básica', 'Reportes estándar', 'Soporte email', '5 GB almacenamiento'],
                  highlighted: false
                },
                {
                  name: 'Empresa',
                  description: 'Para constructoras',
                  price: '$249.000',
                  features: ['Proyectos ilimitados', 'Usuarios ilimitados', 'Biblioteca APU avanzada', 'Reportes avanzados', 'Soporte prioritario', '50 GB', 'Integración BIM'],
                  highlighted: true
                },
                {
                  name: 'Corporativo',
                  description: 'Enterprise completo',
                  price: 'Custom',
                  features: ['Todo de Empresa', 'Implementación dedicada', 'Capacitación incluida', 'SLA garantizado', 'Storage ilimitado', 'Account manager'],
                  highlighted: false
                },
              ].map((plan, idx) => (
                <div 
                  key={idx} 
                  className={`relative rounded-3xl p-8 transition-all duration-500 hover:-translate-y-3 ${
                    plan.highlighted 
                      ? 'bg-gradient-to-b from-violet-600/30 to-fuchsia-600/10 border-2 border-violet-500/50 shadow-2xl shadow-violet-500/20' 
                      : 'glass-dark hover:bg-white/[0.08]'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full text-sm font-bold text-white shadow-lg shadow-violet-500/30">
                      Más Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-white/50 text-sm">{plan.description}</p>
                  </div>
                  <div className="mb-8">
                    {plan.price === 'Custom' ? (
                      <p className="text-4xl font-black text-white">A consultar</p>
                    ) : (
                      <>
                        <span className="text-5xl font-black text-white">{plan.price}</span>
                        <span className="text-white/50 ml-1">CLP/mes</span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-white/70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={handleCTA}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {plan.price === 'Custom' ? 'Contactar Ventas' : 'Comenzar Prueba'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-fuchsia-600/5 to-violet-600/10" />
          <div className="absolute inset-0 grid-pattern opacity-20" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Todos los sistemas operativos</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8">
              ¿Listo para escalar
              <br />
              <span className="text-gradient">tus proyectos?</span>
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto mb-12">
              Únete a más de 500 constructoras que ya transformaron su gestión con BMBuildManage.
            </p>
            <button 
              onClick={handleCTA}
              className="group px-10 py-5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white text-xl font-bold rounded-2xl shadow-2xl shadow-violet-600/40 transition-all flex items-center justify-center gap-3 mx-auto hover:shadow-violet-500/60 hover:scale-[1.03] active:scale-[0.98]"
            >
              Crear cuenta gratis
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
            </button>
            <p className="text-white/30 text-sm mt-6">Sin tarjeta de crédito · Configuración en 2 minutos</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#05050a] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 w-fit rounded-xl border border-white/10 shadow-sm mb-6">
                <img 
                  src="/logo-full.png" 
                  alt="BMBuildManage" 
                  className="h-8 object-contain"
                />
              </div>
              <p className="text-white/50 text-sm mb-6">
                El software de gestión de construcción más completo del mercado chileno.
              </p>
              <div className="flex gap-3">
                {[
                  { name: 'Twitter', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                  { name: 'LinkedIn', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                ].map((social, idx) => (
                  <a 
                    key={idx}
                    href="#" 
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-violet-500/20 flex items-center justify-center text-white/50 hover:text-violet-400 transition-all"
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Producto</h4>
              <ul className="space-y-3 text-sm">
                {['Características', 'Precios', 'Integraciones', 'API', 'Actualizaciones'].map((item, idx) => (
                  <li key={idx}>
                    <a href="#" className="text-white/50 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Recursos</h4>
              <ul className="space-y-3 text-sm">
                {['Documentación', 'Blog', 'Casos de Éxito', 'Webinars', 'Tutoriales'].map((item, idx) => (
                  <li key={idx}>
                    <a href="#" className="text-white/50 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-white/50">
                  <Mail size={16} className="text-violet-400" />
                  hola@bmbuildmanage.cl
                </li>
                <li className="flex items-center gap-2 text-white/50">
                  <Phone size={16} className="text-violet-400" />
                  +56 2 2345 6789
                </li>
                <li className="flex items-center gap-2 text-white/50">
                  <MapPin size={16} className="text-violet-400" />
                  Santiago, Chile
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white/30 text-sm">
              © {new Date().getFullYear()} BMBuildManage. Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-white/30 hover:text-white/50 transition-colors">Términos</a>
              <a href="#" className="text-white/30 hover:text-white/50 transition-colors">Privacidad</a>
              <a href="#" className="text-white/30 hover:text-white/50 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
