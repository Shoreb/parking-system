import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { BarChart2, Search, Download, Car, Bike, Clock, DollarSign, FileText } from "lucide-react";

interface RegistroReporte {
  id: number;
  placa: string;
  estado: string;
  fecha_hora_entrada: string;
  fecha_hora_salida: string | null;
  minutos_totales: number | null;
  valor_calculado: number | null;
  descuento_tipo: string | null;
  tipos_vehiculo: { nombre: string };
  espacios: { codigo: string };
  tarifas: { nombre: string } | null;
  tickets: { codigo_ticket: string } | null;
  usuarios_entrada: { nombre: string } | null;
}

const Reportes: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroReporte[]>([]);
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split("T")[0]);
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, autos: 0, motos: 0, ingresos: 0, enCurso: 0 });

  const fetchReporte = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("registros")
      .select(`
        id, placa, estado, fecha_hora_entrada, fecha_hora_salida,
        minutos_totales, valor_calculado, descuento_tipo,
        tipos_vehiculo(nombre), espacios(codigo), tarifas(nombre),
        tickets(codigo_ticket)
      `)
      .gte("fecha_hora_entrada", `${fechaDesde}T00:00:00`)
      .lte("fecha_hora_entrada", `${fechaHasta}T23:59:59`)
      .order("fecha_hora_entrada", { ascending: false })
      .limit(500);

    const regs = (data as RegistroReporte[]) ?? [];
    setRegistros(regs);

    setStats({
      total: regs.length,
      autos: regs.filter(r => r.tipos_vehiculo?.nombre === "Auto").length,
      motos: regs.filter(r => r.tipos_vehiculo?.nombre === "Moto").length,
      ingresos: regs.filter(r => r.estado === "FINALIZADO").reduce((s, r) => s + (r.valor_calculado ?? 0), 0),
      enCurso: regs.filter(r => r.estado === "EN_CURSO").length,
    });
    setLoading(false);
  };

  useEffect(() => { fetchReporte(); }, []);

  const formatMoneda = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);
  const formatMinutos = (m: number | null) => {
    if (!m) return "-";
    const h = Math.floor(m / 60); const min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  const exportarCSV = () => {
    const headers = ["ID", "Placa", "Vehículo", "Espacio", "Entrada", "Salida", "Tiempo", "Valor", "Estado", "Ticket"];
    const rows = registros.map(r => [
      r.id, r.placa, r.tipos_vehiculo?.nombre, r.espacios?.codigo,
      r.fecha_hora_entrada, r.fecha_hora_salida ?? "",
      formatMinutos(r.minutos_totales), r.valor_calculado ?? 0, r.estado,
      r.tickets?.codigo_ticket ?? ""
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `reporte-${fechaDesde}-${fechaHasta}.csv`; a.click();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Historial de registros por período</p>
        </div>

        {/* Filtros */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Desde</label>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="px-3 py-2.5 border border-border rounded-xl bg-background text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="px-3 py-2.5 border border-border rounded-xl bg-background text-sm" />
            </div>
            <button onClick={fetchReporte} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-70">
              <Search className="h-4 w-4" />
              {loading ? "Cargando..." : "Consultar"}
            </button>
            <button onClick={exportarCSV} className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted">
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="stat-card text-center"><p className="text-2xl font-bold text-foreground">{stats.total}</p><p className="text-xs text-muted-foreground mt-0.5">Total Registros</p></div>
          <div className="stat-card text-center"><Car className="h-5 w-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold text-foreground">{stats.autos}</p><p className="text-xs text-muted-foreground">Autos</p></div>
          <div className="stat-card text-center"><Bike className="h-5 w-5 text-orange-500 mx-auto mb-1" /><p className="text-2xl font-bold text-foreground">{stats.motos}</p><p className="text-xs text-muted-foreground">Motos</p></div>
          <div className="stat-card text-center"><Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold text-foreground">{stats.enCurso}</p><p className="text-xs text-muted-foreground">En Curso</p></div>
          <div className="stat-card text-center"><DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" /><p className="text-lg font-bold text-green-600">{formatMoneda(stats.ingresos)}</p><p className="text-xs text-muted-foreground">Ingresos</p></div>
        </div>

        {/* Tabla */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Detalle de Registros ({registros.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Placa</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Espacio</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Entrada</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Salida</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tiempo</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Valor</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registros.length === 0 ? (
                  <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">No hay registros en el período seleccionado</td></tr>
                ) : registros.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-foreground font-mono">{r.placa}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {r.tipos_vehiculo?.nombre === "Moto" ? <Bike className="h-3.5 w-3.5 text-orange-500" /> : <Car className="h-3.5 w-3.5 text-primary" />}
                        <span className="text-muted-foreground">{r.tipos_vehiculo?.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">{r.espacios?.codigo}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.fecha_hora_entrada).toLocaleString("es-CO")}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.fecha_hora_salida ? new Date(r.fecha_hora_salida).toLocaleString("es-CO") : "-"}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatMinutos(r.minutos_totales)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{r.valor_calculado !== null ? formatMoneda(r.valor_calculado) : "-"}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.estado === "EN_CURSO" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{r.estado === "EN_CURSO" ? "En curso" : "Finalizado"}</span></td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{r.tickets?.codigo_ticket ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reportes;
