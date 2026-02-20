import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Car, Bike, PlusCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface TipoVehiculo { id: number; nombre: string; }
interface Tarifa { id: number; nombre: string; tipo_cobro: string; valor: number; }

const RegistrarEntrada: React.FC = () => {
  const { usuario } = useAuth();
  const [placa, setPlaca] = useState("");
  const [tipoVehiculoId, setTipoVehiculoId] = useState<number>(1);
  const [tipos, setTipos] = useState<TipoVehiculo[]>([]);
  const [cuposDisp, setCuposDisp] = useState<{ autos: number; motos: number }>({ autos: 0, motos: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchCupos = async () => {
    const { data } = await supabase.from("espacios").select("tipo_vehiculo_id, disponible");
    if (data) {
      setCuposDisp({
        autos: data.filter(e => e.tipo_vehiculo_id === 1 && e.disponible === 1).length,
        motos: data.filter(e => e.tipo_vehiculo_id === 2 && e.disponible === 1).length,
      });
    }
  };

  useEffect(() => {
    supabase.from("tipos_vehiculo").select("*").then(({ data }) => setTipos(data ?? []));
    fetchCupos();
  }, []);

  const cuposActuales = tipoVehiculoId === 1 ? cuposDisp.autos : cuposDisp.motos;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!placa.trim()) { setError("Ingrese la placa del vehículo."); return; }
    if (cuposActuales === 0) { setError(`No hay cupos disponibles para ${tipoVehiculoId === 1 ? "autos" : "motos"}.`); return; }

    setLoading(true);
    try {
      // Verificar que no haya un vehículo EN_CURSO con la misma placa
      const { data: enCurso } = await supabase.from("registros")
        .select("id").eq("placa", placa.toUpperCase()).eq("estado", "EN_CURSO").single();
      if (enCurso) { setError("Este vehículo ya tiene un registro activo en el parqueadero."); setLoading(false); return; }

      // Asignar espacio disponible
      const { data: espacio } = await supabase.from("espacios")
        .select("id").eq("tipo_vehiculo_id", tipoVehiculoId).eq("disponible", 1)
        .order("id").limit(1).single();
      if (!espacio) { setError("No se encontró un espacio disponible."); setLoading(false); return; }

      // Obtener tarifa activa
      const hoy = new Date().toISOString().split("T")[0];
      const { data: tarifa } = await supabase.from("tarifas")
        .select("id").eq("tipo_vehiculo_id", tipoVehiculoId).eq("activo", 1)
        .lte("fecha_inicio", hoy).or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)
        .order("id").limit(1).single();

      // Crear registro
      const { data: reg, error: regErr } = await supabase.from("registros").insert({
        placa: placa.toUpperCase().trim(),
        tipo_vehiculo_id: tipoVehiculoId,
        espacio_id: espacio.id,
        fecha_hora_entrada: new Date().toISOString(),
        tarifa_id: tarifa?.id ?? null,
        estado: "EN_CURSO",
        usuario_entrada_id: usuario?.id,
      }).select().single();

      if (regErr) throw regErr;

      // Marcar espacio no disponible
      await supabase.from("espacios").update({ disponible: 0 }).eq("id", espacio.id);

      await fetchCupos();
      setSuccess(`✅ Entrada registrada. Placa: ${placa.toUpperCase()} — Espacio asignado: Se procesó correctamente.`);
      setPlaca("");
    } catch (err: any) {
      setError("Error al registrar la entrada: " + (err.message ?? "Intente nuevamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registrar Entrada</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Ingrese los datos del vehículo que ingresa al parqueadero</p>
        </div>

        {/* Cupos disponibles */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`stat-card border-2 ${tipoVehiculoId === 1 ? "border-primary" : "border-transparent"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{cuposDisp.autos}</p>
                <p className="text-xs text-muted-foreground">Cupos Autos</p>
              </div>
            </div>
          </div>
          <div className={`stat-card border-2 ${tipoVehiculoId === 2 ? "border-primary" : "border-transparent"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-warning rounded-xl flex items-center justify-center">
                <Bike className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{cuposDisp.motos}</p>
                <p className="text-xs text-muted-foreground">Cupos Motos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tipo de vehículo */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Tipo de Vehículo</label>
              <div className="grid grid-cols-2 gap-3">
                {tipos.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipoVehiculoId(t.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      tipoVehiculoId === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    {t.id === 1 ? <Car className={`h-6 w-6 ${tipoVehiculoId === t.id ? "text-primary" : "text-muted-foreground"}`} /> : <Bike className={`h-6 w-6 ${tipoVehiculoId === t.id ? "text-primary" : "text-muted-foreground"}`} />}
                    <div className="text-left">
                      <p className={`font-semibold text-sm ${tipoVehiculoId === t.id ? "text-primary" : "text-foreground"}`}>{t.nombre}</p>
                      <p className="text-xs text-muted-foreground">{t.id === 1 ? `${cuposDisp.autos} disponibles` : `${cuposDisp.motos} disponibles`}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Placa */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Placa del Vehículo</label>
              <input
                type="text"
                value={placa}
                onChange={e => setPlaca(e.target.value.toUpperCase())}
                maxLength={7}
                placeholder="Ej: ABC123"
                className="w-full px-4 py-3.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground font-mono text-xl text-center uppercase tracking-widest transition-all"
              />
            </div>

            {/* Fecha/hora */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground">Fecha y hora de entrada:</p>
              <p className="font-semibold text-foreground text-lg">
                {new Date().toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>

            {/* Alerta sin cupo */}
            {cuposActuales === 0 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-destructive text-sm font-medium">
                  No hay cupos disponibles para {tipoVehiculoId === 1 ? "autos" : "motos"}
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || cuposActuales === 0}
              className="w-full btn-operativo gradient-primary text-white hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
              {loading ? "Registrando..." : "Registrar Entrada"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RegistrarEntrada;
