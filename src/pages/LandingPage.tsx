import { useNavigate } from "react-router-dom";
import { Car, Shield, BarChart3, Users, Clock, CheckCircle, ArrowRight, ParkingSquare, Bike, Menu, X } from "lucide-react";
import { useState } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black font-sans">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
              <ParkingSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ParqueApp</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-black transition-colors">Funcionalidades</a>
            <a href="#stats" className="hover:text-black transition-colors">Estadísticas</a>
            <a href="#about" className="hover:text-black transition-colors">Acerca de</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 text-sm font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Iniciar sesión
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 text-sm font-medium">
            <a href="#features" onClick={() => setMenuOpen(false)} className="text-gray-600 hover:text-black">Funcionalidades</a>
            <a href="#stats" onClick={() => setMenuOpen(false)} className="text-gray-600 hover:text-black">Estadísticas</a>
            <a href="#about" onClick={() => setMenuOpen(false)} className="text-gray-600 hover:text-black">Acerca de</a>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2 bg-black text-white rounded-lg font-semibold"
            >
              Iniciar sesión
            </button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-black text-white rounded-full mb-6 tracking-widest uppercase">
              Sistema de parqueadero
            </span>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              Control total de tu parqueadero
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              Gestiona entradas, salidas, cupos y tarifas en tiempo real. Diseñado para operarios y administradores que necesitan eficiencia y claridad.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 px-7 py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm"
              >
                Acceder al sistema
                <ArrowRight className="h-4 w-4" />
              </button>
              
                href="#features"
                className="flex items-center justify-center gap-2 px-7 py-3.5 border border-gray-200 text-black font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Ver funcionalidades
              </a>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative hidden md:block">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">Panel en tiempo real</span>
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  En vivo
                </span>
              </div>
              {[
                { label: "Cupos autos", value: "28/30", pct: 93, color: "bg-black" },
                { label: "Cupos motos", value: "12/15", pct: 80, color: "bg-gray-600" },
                { label: "Vehículos hoy", value: "47", pct: 78, color: "bg-gray-400" },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="text-sm font-bold">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 space-y-2">
                {["ABC-123 · Espacio A01 · Entrada 08:32", "XYZ-789 · Espacio M03 · Entrada 09:15", "DEF-456 · Espacio A07 · Salida 10:02"].map((r) => (
                  <div key={r} className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-2">
                    <Car className="h-3.5 w-3.5 flex-shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-16 bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "100%", label: "Control en tiempo real" },
            { value: "2", label: "Roles de acceso" },
            { value: "0", label: "Papel requerido" },
            { value: "24/7", label: "Disponibilidad" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold mb-1">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Todo lo que necesitas</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Un sistema completo para administrar tu parqueadero sin complicaciones.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Car className="h-6 w-6" />,
                title: "Registro de entradas",
                desc: "Registra vehículos al instante con asignación automática de espacio y tarifa según el tipo de vehículo."
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: "Control de salidas",
                desc: "Calcula el cobro automáticamente según el tiempo y genera el ticket de pago al momento."
              },
              {
                icon: <ParkingSquare className="h-6 w-6" />,
                title: "Cupos en tiempo real",
                desc: "Visualiza la disponibilidad de espacios para autos y motos actualizada en todo momento."
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Reportes y estadísticas",
                desc: "Analiza ingresos diarios, ocupación y rendimiento del parqueadero con gráficas claras."
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Gestión de usuarios",
                desc: "Administra operarios y administradores con roles y permisos diferenciados."
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Acceso seguro",
                desc: "Autenticación segura con sesiones protegidas y control de acceso por rol."
              },
            ].map((f) => (
              <div key={f.title} className="border border-gray-100 rounded-2xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Diseñado para tu equipo</h2>
            <p className="text-gray-500 text-lg">Dos roles con accesos específicos para cada función.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-5">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Operario</h3>
              <p className="text-gray-500 text-sm mb-5">Acceso al flujo operativo del parqueadero día a día.</p>
              <ul className="space-y-2.5">
                {["Registrar entrada de vehículos", "Registrar salida y cobro", "Consultar cupos disponibles"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-black flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-black text-white rounded-2xl p-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-3">Administrador</h3>
              <p className="text-gray-400 text-sm mb-5">Control total del sistema y configuración avanzada.</p>
              <ul className="space-y-2.5">
                {["Todo lo del operario", "Gestión de tarifas", "Gestión de usuarios", "Reportes y estadísticas"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-gray-500 text-lg mb-8">Accede al sistema con tus credenciales y gestiona tu parqueadero desde cualquier dispositivo.</p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm"
          >
            Iniciar sesión ahora
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <ParkingSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">ParqueApp</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            © 2025 ParqueApp · SENA – Nodo TIC · Sistema de Control de Parqueadero
          </p>
          <button
            onClick={() => navigate("/login")}
            className="text-xs font-semibold text-black underline underline-offset-2 hover:text-gray-600 transition-colors"
          >
            Acceder al sistema →
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
