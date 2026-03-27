import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import {
  Car, Bike, TrendingUp, ClipboardList, Clock, CheckCircle2,
  RefreshCw
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
      const { data: espacios } = await supabase.from("espacios").select("tipo_vehiculo_id, disponible");
      if (espacios) {
        const autosTotal = espacios.filter(e => e.tipo_vehiculo_id === 1).length;
        const autosDisp = espacios.filter(e => e.tipo_vehiculo_id === 1 && e.disponible === 1).length;
        const motosTotal = espacios.filter(e => e.tipo_vehiculo_id === 2).length;
        const motosDisp = espacios.filter(e => e.tipo_vehiculo_id === 2 && e.disponible === 1).length;
        setCupos({ total_autos: autosTotal, disponibles_autos: autosDisp, total_motos: motosTotal, disponibles_motos: motosDisp });
      }

      const hoy = new Date().toISOString().split("T")[0];
      const { data: regs } = await supabase
        .from("registros")
        .select("id, placa, estado, fecha_hora_entrada, tipos_vehiculo(nombre), espacios(codigo)")
        .gte("fecha_hora_entrada", `${hoy}T00:00:00`)
        .order("fecha_hora_entrada", { ascending: false })
        .limit(10);
      setRegistrosHoy((regs as RegistroReciente[]) ?? []);

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
      <div className="space-y-8 max-w-7xl mx-auto px-2">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black tracking-tight">
              Bienvenido, {usuario?.nombre?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1 capitalize">
              {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* AUTOS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                cupos.disponibles_autos > 5 ? "bg-green-100 text-green-700" :
                cupos.disponibles_autos > 0 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {cupos.disponibles_autos > 0 ? "Disponible" : "Lleno"}
              </span>
            </div>

            <p className="text-3xl font-bold text-black">{cupos.disponibles_autos}</p>
            <p className="text-sm text-gray-500">Cupos Autos</p>

            <div className="mt-3 h-1.5 bg-gray-100 rounded-full">
              <div
                className="h-full bg-black rounded-full transition-all duration-500"
                style={{ width: `${(cupos.disponibles_autos / cupos.total_autos) * 100}%` }}
              />
            </div>

            <p className="text-xs text-gray-400 mt-1">
              {autosOcupados} ocupados de {cupos.total_autos}
            </p>
          </div>

          {/* MOTOS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center">
                <Bike className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                cupos.disponibles_motos > 3 ? "bg-green-100 text-green-700" :
                cupos.disponibles_motos > 0 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {cupos.disponibles_motos > 0 ? "Disponible" : "Lleno"}
              </span>
            </div>

            <p className="text-3xl font-bold text-black">{cupos.disponibles_motos}</p>
            <p className="text-sm text-gray-500">Cupos Motos</p>

            <div className="mt-3 h-1.5 bg-gray-100 rounded-full">
              <div
                className="h-full bg-black rounded-full transition-all duration-500"
                style={{ width: `${(cupos.disponibles_motos / cupos.total_motos) * 100}%` }}
              />
            </div>

            <p className="text-xs text-gray-400 mt-1">
              {motosOcupadas} ocupadas de {cupos.total_motos}
            </p>
          </div>

          {/* HOY */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>

            <p className="text-3xl font-bold text-black">{totalHoy}</p>
            <p className="text-sm text-gray-500">Vehículos Hoy</p>
          </div>

          {/* EN CURSO */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center mb-4">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>

            <p className="text-3xl font-bold text-black">{autosOcupados + motosOcupadas}</p>
            <p className="text-sm text-gray-500">En Parqueadero</p>
          </div>

        </div>

        {/* REGISTROS */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-black">Registros de Hoy</h2>
            <span className="text-sm text-gray-500">{registrosHoy.length} registros</span>
          </div>

          {registrosHoy.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay registros hoy</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {registrosHoy.map(r => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">

                  <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
                    {r.tipos_vehiculo?.nombre === "Moto"
                      ? <Bike className="h-4 w-4 text-white" />
                      : <Car className="h-4 w-4 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-black text-sm">{r.placa}</p>
                    <p className="text-xs text-gray-500">
                      Espacio: {r.espacios?.codigo}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      r.estado === "EN_CURSO"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-black text-white"
                    }`}>
                      {r.estado === "EN_CURSO"
                        ? <Clock className="h-3 w-3" />
                        : <CheckCircle2 className="h-3 w-3" />}
                      {r.estado === "EN_CURSO" ? "En curso" : "Finalizado"}
                    </span>

                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.fecha_hora_entrada).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
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
