import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import {
  Car, Bike, TrendingUp, ClipboardList, Clock, CheckCircle2,
  AlertCircle, RefreshCw
} from "lucide-react";

interface CupoStats {
  total_autos: number;
  disponibles_autos: number;
  total_motos: number;
  disponibles_motos: number;
}

interface RegistroReciente {
  id: number;
  placa: string;
  estado: string;
  fecha_hora_entrada: string;
  tipos_vehiculo: { nombre: string };
  espacios: { codigo: string };
}

const Dashboard: React.FC = () => {
  const { usuario } = useAuth();
  const [cupos, setCupos] = useState<CupoStats>({ total_autos: 30, disponibles_autos: 30, total_motos: 15, disponibles_motos: 15 });
  const [registrosHoy, setRegistrosHoy] = useState<RegistroReciente[]>([]);
  const [totalHoy, setTotalHoy] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cupos
      const { data: espacios } = await supabase.from("espacios").select("tipo_vehiculo_id, disponible");
      if (espacios) {
        const autosTotal = espacios.filter(e => e.tipo_vehiculo_id === 1).length;
        const autosDisp = espacios.filter(e => e.tipo_vehiculo_id === 1 && e.disponible === 1).length;
        const motosTotal = espacios.filter(e => e.tipo_vehiculo_id === 2).length;
        const motosDisp = espacios.filter(e => e.tipo_vehiculo_id === 2 && e.disponible === 1).length;
        setCupos({ total_autos: autosTotal, disponibles_autos: autosDisp, total_motos: motosTotal, disponibles_motos: motosDisp });
      }

      // Registros del día
      const hoy = new Date().toISOString().split("T")[0];
      const { data: regs } = await supabase
        .from("registros")
        .select("id, placa, estado, fecha_hora_entrada, tipos_vehiculo(nombre), espacios(codigo)")
        .gte("fecha_hora_entrada", `${hoy}T00:00:00`)
        .order("fecha_hora_entrada", { ascending: false })
        .limit(10);
      setRegistrosHoy((regs as RegistroReciente[]) ?? []);

      // Total del día
      const { count } = await supabase
        .from("registros")
        .select("id", { count: "exact", head: true })
        .gte("fecha_hora_entrada", `${hoy}T00:00:00`);
      setTotalHoy(count ?? 0);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, []);

  const autosOcupados = cupos.total_autos - cupos.disponibles_autos;
  const motosOcupadas = cupos.total_motos - cupos.disponibles_motos;

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bienvenido, {usuario?.nombre?.split(" ")[0]} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {/* Stats cards - Cupos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Autos disponibles */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cupos.disponibles_autos > 5 ? "bg-green-100 text-green-700" : cupos.disponibles_autos > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                {cupos.disponibles_autos > 0 ? "Disponible" : "Lleno"}
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{cupos.disponibles_autos}</p>
            <p className="text-sm text-muted-foreground">Cupos Autos</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(cupos.disponibles_autos / cupos.total_autos) * 100}%`,
                  background: cupos.disponibles_autos > 5 ? "hsl(142 71% 45%)" : cupos.disponibles_autos > 0 ? "hsl(43 96% 56%)" : "hsl(0 72% 51%)"
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{autosOcupados} ocupados de {cupos.total_autos}</p>
          </div>

          {/* Motos disponibles */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl gradient-warning flex items-center justify-center">
                <Bike className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cupos.disponibles_motos > 3 ? "bg-green-100 text-green-700" : cupos.disponibles_motos > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                {cupos.disponibles_motos > 0 ? "Disponible" : "Lleno"}
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{cupos.disponibles_motos}</p>
            <p className="text-sm text-muted-foreground">Cupos Motos</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(cupos.disponibles_motos / cupos.total_motos) * 100}%`,
                  background: cupos.disponibles_motos > 3 ? "hsl(142 71% 45%)" : cupos.disponibles_motos > 0 ? "hsl(43 96% 56%)" : "hsl(0 72% 51%)"
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{motosOcupadas} ocupadas de {cupos.total_motos}</p>
          </div>

          {/* Vehículos hoy */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalHoy}</p>
            <p className="text-sm text-muted-foreground">Vehículos Hoy</p>
            <p className="text-xs text-muted-foreground mt-2">Total registros del día</p>
          </div>

          {/* En curso */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{autosOcupados + motosOcupadas}</p>
            <p className="text-sm text-muted-foreground">En Parqueadero</p>
            <p className="text-xs text-muted-foreground mt-2">Vehículos actualmente</p>
          </div>
        </div>

        {/* Registros recientes */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Registros de Hoy</h2>
            <span className="text-sm text-muted-foreground">{registrosHoy.length} registros</span>
          </div>
          {registrosHoy.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay registros hoy</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {registrosHoy.map(r => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${r.tipos_vehiculo?.nombre === "Moto" ? "gradient-warning" : "gradient-primary"}`}>
                    {r.tipos_vehiculo?.nombre === "Moto" ? <Bike className="h-4 w-4 text-white" /> : <Car className="h-4 w-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{r.placa}</p>
                    <p className="text-xs text-muted-foreground">Espacio: {r.espacios?.codigo}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${r.estado === "EN_CURSO" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {r.estado === "EN_CURSO" ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                      {r.estado === "EN_CURSO" ? "En curso" : "Finalizado"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.fecha_hora_entrada).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
