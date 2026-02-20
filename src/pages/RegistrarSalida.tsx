import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import {
  Search, MinusCircle, Loader2, AlertCircle, CheckCircle2,
  Car, Bike, Clock, Printer, X
} from "lucide-react";

interface RegistroEnCurso {
  id: number;
  placa: string;
  fecha_hora_entrada: string;
  tipos_vehiculo: { nombre: string };
  espacios: { codigo: string; id: number };
  tarifas: { id: number; nombre: string; tipo_cobro: string; valor: number } | null;
}

interface ResumenCobro {
  registro: RegistroEnCurso;
  minutos: number;
  valorBase: number;
  descuentoTipo: string;
  descuentoValor: number;
  valorFinal: number;
}

const RegistrarSalida: React.FC = () => {
  const { usuario } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const [registros, setRegistros] = useState<RegistroEnCurso[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<ResumenCobro | null>(null);
  const [descuentoTipo, setDescuentoTipo] = useState<string>("NINGUNO");
  const [descuentoValor, setDescuentoValor] = useState<number>(0);
  const [cortesia, setCortesia] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [error, setError] = useState("");
  const ticketRef = useRef<HTMLDivElement>(null);

  const fetchRegistros = async (buscar = "") => {
    setLoading(true);
    let query = supabase
      .from("registros")
      .select("id, placa, fecha_hora_entrada, tipos_vehiculo(nombre), espacios(codigo, id), tarifas(id, nombre, tipo_cobro, valor)")
      .eq("estado", "EN_CURSO")
      .order("fecha_hora_entrada");
    if (buscar.trim()) query = query.ilike("placa", `%${buscar.trim()}%`);
    const { data } = await query.limit(20);
    setRegistros((data as RegistroEnCurso[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRegistros(); }, []);

  const calcularValor = (registro: RegistroEnCurso, desc: string, descVal: number, esCortesia: boolean): ResumenCobro => {
    const entrada = new Date(registro.fecha_hora_entrada);
    const ahora = new Date();
    const minutos = Math.ceil((ahora.getTime() - entrada.getTime()) / 60000);

    let valorBase = 0;
    if (registro.tarifas) {
      const t = registro.tarifas;
      if (t.tipo_cobro === "POR_MINUTO") valorBase = minutos * t.valor;
      else if (t.tipo_cobro === "POR_HORA") valorBase = Math.ceil(minutos / 60) * t.valor;
      else if (t.tipo_cobro === "POR_DIA") valorBase = Math.ceil(minutos / 1440) * t.valor;
      else if (t.tipo_cobro === "FRACCION") valorBase = Math.ceil(minutos / 30) * t.valor;
    }

    let valorFinal = valorBase;
    if (esCortesia) { valorFinal = 0; }
    else if (desc === "PORCENTUAL") { valorFinal = valorBase * (1 - descVal / 100); }
    else if (desc === "FIJO") { valorFinal = Math.max(0, valorBase - descVal); }

    return {
      registro,
      minutos,
      valorBase,
      descuentoTipo: esCortesia ? "CORTESIA" : desc,
      descuentoValor: descVal,
      valorFinal: Math.round(valorFinal),
    };
  };

  const handleSeleccionar = (reg: RegistroEnCurso) => {
    const r = calcularValor(reg, descuentoTipo, descuentoValor, cortesia);
    setResumen(r);
    setError("");
  };

  useEffect(() => {
    if (resumen) {
      const r = calcularValor(resumen.registro, descuentoTipo, descuentoValor, cortesia);
      setResumen(r);
    }
  }, [descuentoTipo, descuentoValor, cortesia]);

  const handleConfirmar = async () => {
    if (!resumen) return;
    setConfirmando(true);
    try {
      const ahora = new Date().toISOString();
      const codigoTicket = `TK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await supabase.from("registros").update({
        fecha_hora_salida: ahora,
        minutos_totales: resumen.minutos,
        valor_calculado: resumen.valorFinal,
        descuento_tipo: resumen.descuentoTipo === "NINGUNO" ? null : resumen.descuentoTipo,
        descuento_valor: resumen.descuentoValor,
        estado: "FINALIZADO",
        usuario_salida_id: usuario?.id,
      }).eq("id", resumen.registro.id);

      await supabase.from("espacios").update({ disponible: 1 }).eq("id", resumen.registro.espacios.id);

      const { data: ticket } = await supabase.from("tickets").insert({
        registro_id: resumen.registro.id,
        codigo_ticket: codigoTicket,
        fecha_emision: ahora,
      }).select().single();

      setTicketData({
        ...resumen,
        codigoTicket,
        fechaSalida: ahora,
        ticket,
      });

      setResumen(null);
      await fetchRegistros(busqueda);
    } catch (err: any) {
      setError("Error al procesar la salida: " + err.message);
    } finally {
      setConfirmando(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const formatMinutos = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min}min` : `${min} min`;
  };

  const formatMoneda = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registrar Salida</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Busque el vehículo por placa y procese la salida</p>
        </div>

        {/* Ticket generado */}
        {ticketData && (
          <div className="bg-card rounded-2xl shadow-card border-2 border-green-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <h2 className="font-bold text-lg">Salida Procesada — Ticket Generado</h2>
              </div>
              <button onClick={() => setTicketData(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div ref={ticketRef} className="border-2 border-dashed border-border rounded-xl p-6 bg-background max-w-sm mx-auto">
              <div className="text-center mb-4">
                <Car className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-bold text-foreground text-lg">ParqueApp</h3>
                <p className="text-xs text-muted-foreground">SENA – Nodo TIC</p>
                <p className="text-xs text-muted-foreground">Ticket de Salida</p>
              </div>
              <div className="space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Código:</span><span className="font-mono font-bold">{ticketData.codigoTicket}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Placa:</span><span className="font-bold">{ticketData.registro.placa}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vehículo:</span><span>{ticketData.registro.tipos_vehiculo?.nombre}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Entrada:</span><span>{new Date(ticketData.registro.fecha_hora_entrada).toLocaleString("es-CO")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Salida:</span><span>{new Date(ticketData.fechaSalida).toLocaleString("es-CO")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tiempo:</span><span className="font-semibold">{formatMinutos(ticketData.minutos)}</span></div>
                <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Valor base:</span><span>{formatMoneda(ticketData.valorBase)}</span></div>
                {ticketData.descuentoTipo !== "NINGUNO" && (
                  <div className="flex justify-between text-green-600"><span>Descuento ({ticketData.descuentoTipo}):</span><span>-{ticketData.descuentoTipo === "PORCENTUAL" ? `${ticketData.descuentoValor}%` : formatMoneda(ticketData.descuentoValor)}</span></div>
                )}
                <div className="flex justify-between font-bold text-lg border-t-2 border-foreground pt-2">
                  <span>TOTAL:</span>
                  <span className="text-primary">{formatMoneda(ticketData.valorFinal)}</span>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">{new Date(ticketData.fechaSalida).toLocaleString("es-CO")}</p>
            </div>
            <div className="flex justify-center mt-4">
              <button onClick={handleImprimir} className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl font-medium text-sm hover:opacity-90 no-print">
                <Printer className="h-4 w-4" />
                Imprimir Ticket
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de vehículos EN CURSO */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground mb-3">Vehículos en Parqueadero</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => { setBusqueda(e.target.value); fetchRegistros(e.target.value); }}
                    placeholder="Buscar por placa..."
                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                  />
                </div>
                <button onClick={() => fetchRegistros(busqueda)} className="px-3 py-2.5 border border-border rounded-xl hover:bg-muted text-muted-foreground">
                  <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {registros.length === 0 ? (
                <div className="py-10 text-center">
                  <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No hay vehículos en curso</p>
                </div>
              ) : registros.map(r => {
                const mins = Math.ceil((new Date().getTime() - new Date(r.fecha_hora_entrada).getTime()) / 60000);
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSeleccionar(r)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left ${resumen?.registro.id === r.id ? "bg-primary/5" : ""}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${r.tipos_vehiculo?.nombre === "Moto" ? "gradient-warning" : "gradient-primary"}`}>
                      {r.tipos_vehiculo?.nombre === "Moto" ? <Bike className="h-4 w-4 text-white" /> : <Car className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{r.placa}</p>
                      <p className="text-xs text-muted-foreground">Espacio {r.espacios?.codigo}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatMinutos(mins)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel de cobro */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50">
            {!resumen ? (
              <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                <MinusCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-medium">Seleccione un vehículo de la lista</p>
                <p className="text-xs text-muted-foreground mt-1">para procesar su salida</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <h2 className="font-semibold text-foreground border-b border-border pb-3">Resumen de Cobro</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Placa:</span><span className="font-bold text-lg">{resumen.registro.placa}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Entrada:</span><span>{new Date(resumen.registro.fecha_hora_entrada).toLocaleString("es-CO")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tiempo:</span><span className="font-semibold">{formatMinutos(resumen.minutos)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tarifa:</span><span>{resumen.registro.tarifas?.nombre ?? "Sin tarifa"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor base:</span><span className="font-semibold">{formatMoneda(resumen.valorBase)}</span></div>
                </div>

                {/* Descuentos */}
                <div className="border-t border-border pt-4 space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={cortesia} onChange={e => { setCortesia(e.target.checked); if(e.target.checked) setDescuentoTipo("NINGUNO"); }} className="rounded" />
                    <span className="text-green-600 font-semibold">Aplicar Cortesía (Valor $0)</span>
                  </label>

                  {!cortesia && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Tipo descuento</label>
                        <select
                          value={descuentoTipo}
                          onChange={e => setDescuentoTipo(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                        >
                          <option value="NINGUNO">Sin descuento</option>
                          <option value="PORCENTUAL">Porcentual (%)</option>
                          <option value="FIJO">Fijo ($)</option>
                        </select>
                      </div>
                      {descuentoTipo !== "NINGUNO" && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            {descuentoTipo === "PORCENTUAL" ? "Porcentaje %" : "Valor $"}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={descuentoTipo === "PORCENTUAL" ? 100 : undefined}
                            value={descuentoValor}
                            onChange={e => setDescuentoValor(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t-2 border-foreground pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground text-lg">TOTAL A PAGAR:</span>
                    <span className="font-bold text-2xl text-primary">{formatMoneda(resumen.valorFinal)}</span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setResumen(null)} className="btn-operativo border border-border text-foreground hover:bg-muted">
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmar}
                    disabled={confirmando}
                    className="btn-operativo gradient-primary text-white hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {confirmando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {confirmando ? "Procesando..." : "Confirmar Salida"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegistrarSalida;
