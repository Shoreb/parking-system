import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { DollarSign, Plus, Pencil, Power, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface TipoVehiculo { id: number; nombre: string; }
interface Tarifa {
  id: number;
  tipo_vehiculo_id: number;
  nombre: string;
  tipo_cobro: string;
  valor: number;
  activo: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipos_vehiculo?: { nombre: string };
}

const TIPOS_COBRO = ["POR_MINUTO", "POR_HORA", "POR_DIA", "FRACCION"];

const defaultForm = { tipo_vehiculo_id: 1, nombre: "", tipo_cobro: "POR_HORA", valor: "", activo: 1, fecha_inicio: new Date().toISOString().split("T")[0], fecha_fin: "" };

const GestionTarifas: React.FC = () => {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [tipos, setTipos] = useState<TipoVehiculo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTarifas = async () => {
    const { data } = await supabase.from("tarifas").select("*, tipos_vehiculo(nombre)").order("id");
    setTarifas((data as Tarifa[]) ?? []);
  };

  useEffect(() => {
    fetchTarifas();
    supabase.from("tipos_vehiculo").select("*").then(({ data }) => setTipos(data ?? []));
  }, []);

  const handleEdit = (t: Tarifa) => {
    setForm({
      tipo_vehiculo_id: t.tipo_vehiculo_id,
      nombre: t.nombre,
      tipo_cobro: t.tipo_cobro,
      valor: String(t.valor),
      activo: t.activo,
      fecha_inicio: t.fecha_inicio,
      fecha_fin: t.fecha_fin ?? "",
    });
    setEditId(t.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!form.nombre || !form.valor || !form.fecha_inicio) { setMsg({ type: "error", text: "Complete todos los campos obligatorios." }); return; }
    setLoading(true);
    const payload = {
      tipo_vehiculo_id: form.tipo_vehiculo_id,
      nombre: form.nombre,
      tipo_cobro: form.tipo_cobro,
      valor: parseFloat(form.valor as string),
      activo: form.activo,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
    };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from("tarifas").update(payload).eq("id", editId));
    } else {
      ({ error: err } = await supabase.from("tarifas").insert(payload));
    }
    setLoading(false);
    if (err) { setMsg({ type: "error", text: "Error: " + err.message }); return; }
    setMsg({ type: "success", text: editId ? "Tarifa actualizada." : "Tarifa creada." });
    setShowForm(false); setEditId(null); setForm(defaultForm);
    fetchTarifas();
  };

  const toggleActivo = async (t: Tarifa) => {
    await supabase.from("tarifas").update({ activo: t.activo === 1 ? 0 : 1 }).eq("id", t.id);
    fetchTarifas();
  };

  const formatMoneda = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Tarifas</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Configure las tarifas por tipo de vehículo</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm); }}
            className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-white rounded-xl font-medium text-sm hover:opacity-90 shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            Nueva Tarifa
          </button>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
            {msg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span className="text-sm font-medium">{msg.text}</span>
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6">
            <h2 className="font-semibold text-foreground mb-4">{editId ? "Editar Tarifa" : "Nueva Tarifa"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo de Vehículo *</label>
                <select
                  value={form.tipo_vehiculo_id}
                  onChange={e => setForm(f => ({ ...f, tipo_vehiculo_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm"
                >
                  {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre de la Tarifa *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Tarifa Auto Hora"
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo de Cobro *</label>
                <select
                  value={form.tipo_cobro}
                  onChange={e => setForm(f => ({ ...f, tipo_cobro: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm"
                >
                  {TIPOS_COBRO.map(tc => <option key={tc} value={tc}>{tc.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Valor (COP) *</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Fecha Inicio *</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Fecha Fin (opcional)</label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-70">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Guardar Cambios" : "Crear Tarifa"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-6 py-2.5 border border-border rounded-xl text-sm text-foreground hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de tarifas */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground">Tarifas Configuradas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Vehículo</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo Cobro</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Valor</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Vigencia</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tarifas.map(t => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{t.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.tipos_vehiculo?.nombre}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-muted rounded-lg text-xs font-mono">{t.tipo_cobro}</span></td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatMoneda(t.valor)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.fecha_inicio}{t.fecha_fin ? ` → ${t.fecha_fin}` : " (Sin vencimiento)"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.activo === 1 ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {t.activo === 1 ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggleActivo(t)} className={`p-1.5 hover:bg-muted rounded-lg transition-colors ${t.activo === 1 ? "text-green-600 hover:text-red-500" : "text-muted-foreground hover:text-green-600"}`} title={t.activo === 1 ? "Desactivar" : "Activar"}>
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
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

export default GestionTarifas;
