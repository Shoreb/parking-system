import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import {
  Search, MinusCircle, Loader2, AlertCircle, CheckCircle2,
  Car, Bike, Clock, Printer, X, Receipt, RefreshCw
} from "lucide-react";

interface RegistroEnCurso {
  id: number;
  placa: string;
  fecha_hora_entrada: string;
  tipos_vehiculo: { nombre: string; id: number };
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

interface TicketGenerado {
  codigoTicket: string;
  placa: string;
  tipoVehiculo: string;
  espacio: string;
  fechaEntrada: string;
  fechaSalida: string;
  minutos: number;
  valorBase: number;
  descuentoTipo: string;
  descuentoValor: number;
  valorFinal: number;
}

const formatMinutos = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}min`;
};

const formatMoneda = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

const calcularValorBase = (tarifa: RegistroEnCurso["tarifas"], minutos: number): number => {
  if (!tarifa) return 0;
  switch (tarifa.tipo_cobro) {
    case "POR_MINUTO": return minutos * tarifa.valor;
    case "POR_HORA":   return Math.ceil(minutos / 60) * tarifa.valor;
    case "POR_DIA":    return Math.ceil(minutos / 1440) * tarifa.valor;
    case "FRACCION":   return Math.ceil(minutos / 30) * tarifa.valor; // fracción de 30 min
    default:           return 0;
  }
};

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
  const [ticket, setTicket] = useState<TicketGenerado | null>(null);
  const [error, setError] = useState("");
  const ticketRef = useRef<HTMLDivElement>(null);

  const fetchRegistros = useCallback(async (buscar = "") => {
    setLoading(true);
    let query = supabase
      .from("registros")
      .select("id, placa, fecha_hora_entrada, tipos_vehiculo(nombre, id), espacios(codigo, id), tarifas(id, nombre, tipo_cobro, valor)")
      .eq("estado", "EN_CURSO")
      .order("fecha_hora_entrada");
    if (buscar.trim()) query = query.ilike("placa", `%${buscar.trim()}%`);
    const { data } = await query.limit(50);
    setRegistros((data as RegistroEnCurso[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRegistros();

    // Realtime para que la lista se actualice automáticamente
    const ch = supabase
      .channel("registros-salida-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "registros" }, () => fetchRegistros(busqueda))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchRegistros, busqueda]);

  const buildResumen = useCallback((reg: RegistroEnCurso, desc: string, descVal: number, esCortesia: boolean): ResumenCobro => {
    const entrada = new Date(reg.fecha_hora_entrada);
    const minutos = Math.max(1, Math.ceil((Date.now() - entrada.getTime()) / 60000));
    const valorBase = calcularValorBase(reg.tarifas, minutos);

    let valorFinal = valorBase;
    if (esCortesia)              valorFinal = 0;
    else if (desc === "PORCENTUAL") valorFinal = valorBase * (1 - descVal / 100);
    else if (desc === "FIJO")      valorFinal = Math.max(0, valorBase - descVal);

    return {
      registro: reg,
      minutos,
      valorBase,
      descuentoTipo: esCortesia ? "CORTESIA" : desc,
      descuentoValor: descVal,
      valorFinal: Math.round(valorFinal),
    };
  }, []);

  const handleSeleccionar = (reg: RegistroEnCurso) => {
    setResumen(buildResumen(reg, descuentoTipo, descuentoValor, cortesia));
    setError("");
    setTicket(null);
  };

  // Recalcular al cambiar descuentos
  useEffect(() => {
    if (resumen) {
      setResumen(buildResumen(resumen.registro, descuentoTipo, descuentoValor, cortesia));
    }
  }, [descuentoTipo, descuentoValor, cortesia]); // eslint-disable-line

  const handleConfirmar = async () => {
    if (!resumen) return;
    setConfirmando(true);
    setError("");
    try {
      const ahora = new Date().toISOString();
      const codigoTicket = `TK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Actualizar registro
      const { error: updErr } = await supabase.from("registros").update({
        fecha_hora_salida: ahora,
        minutos_totales: resumen.minutos,
        valor_calculado: resumen.valorFinal,
        descuento_tipo: resumen.descuentoTipo === "NINGUNO" ? null : resumen.descuentoTipo,
        descuento_valor: resumen.descuentoValor,
        estado: "FINALIZADO",
        usuario_salida_id: usuario?.id ?? null,
      }).eq("id", resumen.registro.id);

      if (updErr) throw updErr;

      // Liberar espacio
      await supabase.from("espacios").update({ disponible: 1 }).eq("id", resumen.registro.espacios.id);

      // Generar ticket
      await supabase.from("tickets").insert({
        registro_id: resumen.registro.id,
        codigo_ticket: codigoTicket,
        fecha_emision: ahora,
        enviado_email: 0,
      });

      setTicket({
        codigoTicket,
        placa: resumen.registro.placa,
        tipoVehiculo: resumen.registro.tipos_vehiculo?.nombre ?? "",
        espacio: resumen.registro.espacios?.codigo ?? "",
        fechaEntrada: resumen.registro.fecha_hora_entrada,
        fechaSalida: ahora,
        minutos: resumen.minutos,
        valorBase: resumen.valorBase,
        descuentoTipo: resumen.descuentoTipo,
        descuentoValor: resumen.descuentoValor,
        valorFinal: resumen.valorFinal,
      });

      setResumen(null);
      setDescuentoTipo("NINGUNO");
      setDescuentoValor(0);
      setCortesia(false);
      await fetchRegistros(busqueda);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Intente nuevamente.";
      setError("Error al procesar la salida: " + msg);
    } finally {
      setConfirmando(false);
    }
  };

  const handleImprimir = () => {
    const printContent = ticketRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Ticket Parqueadero</title>
      <style>
        body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
        .logo { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 4px; }
        .sub { text-align: center; font-size: 11px; color: #666; margin-bottom: 16px; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
        .total { border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; font-size: 16px; font-weight: bold; }
        hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
        .center { text-align: center; font-size: 11px; color: #888; }
        .code { text-align: center; font-size: 13px; font-weight: bold; background: #f0f0f0; padding: 6px; border-radius: 4px; margin: 8px 0; }
      </style></head><body>
      <div class="logo">🅿 ParqueApp</div>
      <div class="sub">SENA – Nodo TIC<br/>Ticket de Salida</div>
      <div class="code">${ticket?.codigoTicket}</div>
      <hr/>
      <div class="row"><span>Placa:</span><span><b>${ticket?.placa}</b></span></div>
      <div class="row"><span>Vehículo:</span><span>${ticket?.tipoVehiculo}</span></div>
      <div class="row"><span>Espacio:</span><span>${ticket?.espacio}</span></div>
      <hr/>
      <div class="row"><span>Entrada:</span><span>${new Date(ticket?.fechaEntrada ?? "").toLocaleString("es-CO")}</span></div>
      <div class="row"><span>Salida:</span><span>${new Date(ticket?.fechaSalida ?? "").toLocaleString("es-CO")}</span></div>
      <div class="row"><span>Tiempo:</span><span><b>${formatMinutos(ticket?.minutos ?? 0)}</b></span></div>
      <hr/>
      <div class="row"><span>Valor base:</span><span>${formatMoneda(ticket?.valorBase ?? 0)}</span></div>
      ${ticket?.descuentoTipo !== "NINGUNO" ? `<div class="row"><span>Descuento:</span><span style="color:green">-${ticket?.descuentoTipo === "PORCENTUAL" ? ticket?.descuentoValor + "%" : formatMoneda(ticket?.descuentoValor ?? 0)}</span></div>` : ""}
      <div class="row total"><span>TOTAL:</span><span>${formatMoneda(ticket?.valorFinal ?? 0)}</span></div>
      <hr/>
      <div class="center">¡Gracias por preferirnos!<br/>${new Date().toLocaleString("es-CO")}</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Registrar Salida</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Seleccione el vehículo y procese el cobro</p>
          </div>
          <button onClick={() => fetchRegistros(busqueda)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {/* TICKET GENERADO */}
        {ticket && (
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
                <h2 className="font-bold text-lg">Salida Procesada — Ticket Generado</h2>
              </div>
              <button onClick={() => setTicket(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* TICKET IMPRIMIBLE */}
            <div ref={ticketRef} className="border-2 border-dashed border-green-300 rounded-xl p-6 bg-white max-w-xs mx-auto font-mono">
              <div className="text-center mb-4">
                <div className="text-2xl mb-1">🅿</div>
                <h3 className="font-bold text-lg">ParqueApp</h3>
                <p className="text-xs text-muted-foreground">SENA – Nodo TIC</p>
                <p className="text-xs text-muted-foreground">Ticket de Salida</p>
                <div className="mt-2 px-3 py-1 bg-muted rounded-lg text-xs font-bold">{ticket.codigoTicket}</div>
              </div>

              <div className="border-t border-dashed pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Placa:</span><span className="font-bold text-base">{ticket.placa}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vehículo:</span><span>{ticket.tipoVehiculo}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Espacio:</span><span className="font-bold">{ticket.espacio}</span></div>
              </div>
              <div className="border-t border-dashed my-3" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Entrada:</span><span className="text-right text-xs">{new Date(ticket.fechaEntrada).toLocaleString("es-CO")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Salida:</span><span className="text-right text-xs">{new Date(ticket.fechaSalida).toLocaleString("es-CO")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tiempo:</span><span className="font-bold">{formatMinutos(ticket.minutos)}</span></div>
              </div>
              <div className="border-t border-dashed my-3" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Valor base:</span><span>{formatMoneda(ticket.valorBase)}</span></div>
                {ticket.descuentoTipo !== "NINGUNO" && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({ticket.descuentoTipo}):</span>
                    <span>-{ticket.descuentoTipo === "PORCENTUAL" ? `${ticket.descuentoValor}%` : formatMoneda(ticket.descuentoValor)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t-2 border-black pt-2 mt-2">
                  <span>TOTAL:</span>
                  <span>{formatMoneda(ticket.valorFinal)}</span>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">¡Gracias por preferirnos!</p>
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={handleImprimir}
                className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl font-medium text-sm hover:opacity-90"
              >
                <Printer className="h-4 w-4" /> Imprimir Ticket
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LISTA DE VEHÍCULOS */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground mb-3">
                Vehículos en Parqueadero
                <span className="ml-2 text-sm font-normal text-muted-foreground">({registros.length})</span>
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); fetchRegistros(e.target.value); }}
                  placeholder="Buscar por placa..."
                  className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="divide-y divide-border flex-1 overflow-y-auto max-h-96">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : registros.length === 0 ? (
                <div className="py-10 text-center">
                  <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No hay vehículos en curso</p>
                </div>
              ) : registros.map(r => {
                const mins = Math.max(1, Math.ceil((Date.now() - new Date(r.fecha_hora_entrada).getTime()) / 60000));
                const esMoto = r.tipos_vehiculo?.nombre === "Moto";
                const isSelected = resumen?.registro.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSeleccionar(r)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left ${isSelected ? "bg-primary/5 border-l-4 border-primary" : ""}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${esMoto ? "bg-orange-100" : "bg-primary/10"}`}>
                      {esMoto ? <Bike className="h-4 w-4 text-orange-600" /> : <Car className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground font-mono">{r.placa}</p>
                      <p className="text-xs text-muted-foreground">Espacio {r.espacios?.codigo}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{formatMinutos(mins)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(r.fecha_hora_entrada).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PANEL DE COBRO */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 flex flex-col">
            {!resumen ? (
              <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Seleccione un vehículo</p>
                <p className="text-xs text-muted-foreground mt-1">para calcular el cobro y procesar la salida</p>
              </div>
            ) : (
              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                <h2 className="font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Resumen de Cobro
                </h2>

                {/* DATOS DEL VEHÍCULO */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Placa:</span>
                    <span className="font-bold text-xl font-mono">{resumen.registro.placa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{resumen.registro.tipos_vehiculo?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Espacio:</span>
                    <span className="font-bold">{resumen.registro.espacios?.codigo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrada:</span>
                    <span>{new Date(resumen.registro.fecha_hora_entrada).toLocaleString("es-CO")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tiempo:</span>
                    <span className="font-semibold text-primary">{formatMinutos(resumen.minutos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarifa:</span>
                    <span className="text-xs">{resumen.registro.tarifas?.nombre ?? "Sin tarifa asignada"}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Valor base:</span>
                    <span className="font-semibold">{formatMoneda(resumen.valorBase)}</span>
                  </div>
                </div>

                {/* DESCUENTOS */}
                <div className="border-t border-border pt-4 space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={cortesia}
                      onChange={e => { setCortesia(e.target.checked); if (e.target.checked) setDescuentoTipo("NINGUNO"); }}
                      className="rounded"
                    />
                    <span className="text-green-600 font-semibold">🎁 Aplicar Cortesía (Costo $0)</span>
                  </label>

                  {!cortesia && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Tipo descuento</label>
                        <select
                          value={descuentoTipo}
                          onChange={e => { setDescuentoTipo(e.target.value); setDescuentoValor(0); }}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                        >
                          <option value="NINGUNO">Sin descuento</option>
                          <option value="PORCENTUAL">Porcentual (%)</option>
                          <option value="FIJO">Fijo (COP $)</option>
                        </select>
                      </div>
                      {descuentoTipo !== "NINGUNO" && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            {descuentoTipo === "PORCENTUAL" ? "Porcentaje %" : "Valor COP $"}
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

                {/* TOTAL */}
                <div className={`rounded-xl p-4 border-2 ${resumen.valorFinal === 0 ? "bg-green-50 border-green-300" : "bg-primary/5 border-primary/30"}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground text-base">TOTAL A PAGAR:</span>
                    <span className={`font-bold text-2xl ${resumen.valorFinal === 0 ? "text-green-600" : "text-primary"}`}>
                      {formatMoneda(resumen.valorFinal)}
                    </span>
                  </div>
                  {resumen.valorFinal === 0 && (
                    <p className="text-green-600 text-xs mt-1 font-medium">Cortesía aplicada — Sin costo</p>
                  )}
                </div>

                {/* ERROR */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                {/* ACCIONES */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setResumen(null); setError(""); }}
                    className="py-3 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmar}
                    disabled={confirmando}
                    className="py-3 gradient-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-70 transition-all"
                  >
                    {confirmando
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
                      : <><CheckCircle2 className="h-4 w-4" /> Confirmar Salida</>}
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
