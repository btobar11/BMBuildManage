import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BMLogo } from '../../components/ui/BMLogo';
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
  Smartphone,
  Play,
  Mail,
  Phone,
  MapPin,
  Menu,
  X,
  Cloud,
  DollarSign
} from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos Mendoza',
    role: 'Director de Proyectos',
    company: 'Constructora Andes SpA',
    avatar: 'CM',
    content: 'BMBuildManage transformó nuestra forma de gestionar presupuestos. Antes tardábamos semanas, ahora lo hacemos en días. El control de costos en tiempo real es invaluable.',
    rating: 5,
    metric: '60% más rápido'
  },
  {
    name: 'María Elena Rojas',
    role: 'Ingeniera de Costos',
    company: 'Ingeniería y Construcción IRG',
    avatar: 'MR',
    content: 'La biblioteca de APU es oro puro. Tenemos toda nuestra base de costos estandarizada y generar presupuestos se volvió casi automático.',
    rating: 5,
    metric: '40% ahorro en costos'
  },
  {
    name: 'Roberto Sánchez',
    role: 'Gerente General',
    company: 'Constructora Vanguardia',
    avatar: 'RS',
    content: 'La función offline fue clave para nuestra operación en terreno. Nuestros supervisores registran avance sin conexión y todo se sincroniza automáticamente.',
    rating: 5,
    metric: '100% conectividad'
  }
];

const features = [
  {
    icon: <LayoutDashboard size={22} />,
    title: "Dashboard Gerencial",
    desc: "Visualiza la salud financiera de todos tus proyectos en un único panel.",
    color: "emerald"
  },
  {
    icon: <HardHat size={22} />,
    title: "Gestión de Cuadrillas",
    desc: "Aloca trabajadores y controla Jornales sin complicaciones.",
    color: "amber"
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Control de Gastos",
    desc: "Carga compras reales contra lo presupuestado y detecta desviaciones al instante.",
    color: "emerald"
  },
  {
    icon: <Calculator size={22} />,
    title: "Presupuestos APU",
    desc: "Itemizados con partidas customizables o arrastra desde tu biblioteca general.",
    color: "sky"
  },
  {
    icon: <History size={22} />,
    title: "Trazabilidad Total",
    desc: "Audit Log completo: quién, qué, cuándo y qué valor cambió.",
    color: "violet"
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Seguridad Total",
    desc: "Backups automatizados, accesos cifrados y autenticación de última generación.",
    color: "rose"
  }
];

const stats = [
  { value: '500+', label: 'Empresas', icon: Building2 },
  { value: '2.5M', label: 'CLP Generados', icon: DollarSign },
  { value: '98%', label: 'Satisfacción', icon: Award },
  { value: '40%', label: 'Ahorro Promedio', icon: TrendingUp }
];

const processSteps = [
  {
    number: '01',
    title: 'Regístrate',
    description: 'Crea tu cuenta en segundos. Sin tarjeta de crédito.',
  },
  {
    number: '02',
    title: 'Configura',
    description: 'Personaliza tu espacio con tu empresa y preferencias.',
  },
  {
    number: '03',
    title: 'Crea tu Proyecto',
    description: 'Comienza con plantillas inteligentes para presupuestos.',
  },
  {
    number: '04',
    title: 'Gestiona',
    description: 'Supervisa avance, costos y recursos en tiempo real.',
  }
];

export function LandingPage() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCTA = () => navigate('/register');
  const handleLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/90 backdrop-blur-lg border-b border-border' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BMLogo variant="full" className="h-7" />
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Características</button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Precios</button>
            <button onClick={handleLogin} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Iniciar Sesión
            </button>
            <button 
              onClick={handleCTA}
              className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/25"
            >
              Empezar Gratis
            </button>
          </div>
          
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-3">
            <button className="block w-full text-left text-sm text-muted-foreground py-2">Características</button>
            <button className="block w-full text-left text-sm text-muted-foreground py-2">Precios</button>
            <button onClick={handleLogin} className="block w-full text-left text-sm text-muted-foreground py-2">Iniciar Sesión</button>
            <button onClick={handleCTA} className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm">
              Empezar Gratis
            </button>
          </div>
        )}
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-600 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              Plataforma #1 en Gestión de Construcción
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Control Total de tu Obra
              <br />
              <span className="text-emerald-600">en Tiempo Real</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Simplificamos la estimación de costos, APUs y control de ejecución en una plataforma diseñada para profesionales de la construcción.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handleCTA}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Comenzar Gratis
                <ArrowRight size={18} />
              </button>
              <button className="w-full sm:w-auto px-6 py-3 border border-border text-foreground hover:bg-muted font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                <Play size={16} />
                Ver Demo
              </button>
            </div>

            {/* Trust */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                Datos 100% Seguros
              </div>
              <div className="flex items-center gap-1.5">
                <Cloud size={14} className="text-emerald-500" />
                Cloud + Offline
              </div>
              <div className="flex items-center gap-1.5">
                <Smartphone size={14} className="text-emerald-500" />
                Mobile Friendly
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-card rounded-xl p-6 text-center border border-border">
                    <Icon size={24} className="text-emerald-500 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Todo lo que necesitas, en un solo lugar
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Sustituye múltiples hojas de Excel por una única fuente de verdad con cálculos en tiempo real.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feat, idx) => (
                <div key={idx} className="bg-card rounded-xl p-6 border border-border hover:border-emerald-500/30 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-20 px-4 bg-slate-950 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Empieza en 4 pasos</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((step, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl font-bold text-emerald-500/20 mb-2">{step.number}</div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Lo que dicen nuestros clientes
              </h2>
            </div>

            <div className="bg-card rounded-xl p-6 sm:p-8 border border-border">
              {testimonials.map((testimonial, idx) => (
                <div 
                  key={idx}
                  className={`transition-all duration-500 ${idx === currentTestimonial ? 'block' : 'hidden'}`}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                        <p className="text-muted-foreground text-xs">{testimonial.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{testimonial.metric}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonial(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentTestimonial ? 'bg-emerald-500 w-6' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Planes que escalan contigo
              </h2>
              <p className="text-muted-foreground">Sin costos ocultos. Cancela cuando quieras.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Profesional',
                  price: '$99.000',
                  features: ['3 proyectos', 'Biblioteca APU básica', 'Reportes estándar', 'Soporte email'],
                  highlighted: false
                },
                {
                  name: 'Empresa',
                  price: '$249.000',
                  features: ['Proyectos ilimitados', 'Biblioteca APU avanzada', 'Reportes avanzados', 'Integración BIM', 'Soporte prioritario'],
                  highlighted: true
                },
                {
                  name: 'Corporativo',
                  price: 'Custom',
                  features: ['Todo de Empresa', 'Implementación dedicada', 'Capacitación incluida', 'Account manager'],
                  highlighted: false
                },
              ].map((plan, idx) => (
                <div 
                  key={idx}
                  className={`rounded-xl p-6 ${plan.highlighted 
                    ? 'bg-slate-950 text-white border-2 border-emerald-500' 
                    : 'bg-card border border-border'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="inline-block px-3 py-1 bg-emerald-500 rounded-full text-xs font-medium text-white mb-4">
                      Más Popular
                    </div>
                  )}
                  <h3 className={`text-lg font-semibold mb-2 ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-3xl font-bold mb-6 ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                    {plan.price}
                    {plan.price !== 'Custom' && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span className={plan.highlighted ? 'text-slate-300' : 'text-muted-foreground'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={handleCTA}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700'
                    }`}
                  >
                    {plan.price === 'Custom' ? 'Contactar' : 'Comenzar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              ¿Listo para escalar tus proyectos?
            </h2>
            <p className="text-muted-foreground mb-8">
              Únete a más de 500 constructoras que ya transformaron su gestión.
            </p>
            <button 
              onClick={handleCTA}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Crear cuenta gratis
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BMLogo variant="icon" className="h-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                El software de gestión de construcción más completo del mercado chileno.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Características</a></li>
                <li><a href="#" className="hover:text-foreground">Precios</a></li>
                <li><a href="#" className="hover:text-foreground">Integraciones</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Recursos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentación</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Casos de Éxito</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Contacto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail size={14} /> hola@bmbuildmanage.cl
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} /> +56 2 2345 6789
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} /> Santiago, Chile
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BMBuildManage. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Todos los sistemas operativos
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
