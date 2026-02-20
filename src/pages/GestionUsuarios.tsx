import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Users, Plus, Pencil, Power, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

interface Rol { id: number; nombre: string; }
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol_id: number;
  activo: number;
  fecha_creacion: string;
  roles?: { nombre: string };
}

const defaultForm = { nombre: "", email: "", password: "", rol_id: 2, activo: 1 };

const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsuarios = async () => {
    const { data } = await supabase.from("usuarios").select("*, roles(nombre)").order("id");
    setUsuarios((data as Usuario[]) ?? []);
  };

  useEffect(() => {
    fetchUsuarios();
    supabase.from("roles").select("*").then(({ data }) => setRoles(data ?? []));
  }, []);

  const handleEdit = (u: Usuario) => {
    setForm({ nombre: u.nombre, email: u.email, password: "", rol_id: u.rol_id, activo: u.activo });
    setEditId(u.id);
    setShowForm(true);
    setMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!form.nombre || !form.email) { setMsg({ type: "error", text: "Nombre y email son obligatorios." }); return; }
    if (!editId && !form.password) { setMsg({ type: "error", text: "La contraseña es obligatoria para nuevos usuarios." }); return; }
    setLoading(true);
    try {
      if (editId) {
        // Solo actualizamos datos del perfil (no la contraseña auth por ahora)
        const { error } = await supabase.from("usuarios").update({
          nombre: form.nombre,
          rol_id: form.rol_id,
          activo: form.activo,
        }).eq("id", editId);
        if (error) throw error;
        setMsg({ type: "success", text: "Usuario actualizado correctamente." });
      } else {
        // Crear usuario en auth
        const { data: authData, error: authErr } = await supabase.auth.admin
          ? // No tenemos admin, usamos signUp
            (await supabase.auth.signUp({ email: form.email, password: form.password, options: { emailRedirectTo: undefined } }))
          : { data: null, error: new Error("No admin access") };

        // Alternativa: crear via edge function. Por ahora insertamos en la tabla
        // y asumimos que el usuario se creará con el mismo email.
        // Usando signUp normal sin redireccion de email
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });
        if (signUpErr) throw signUpErr;

        const authUserId = signUpData.user?.id;
        const { error: insertErr } = await supabase.from("usuarios").insert({
          auth_user_id: authUserId,
          nombre: form.nombre,
          email: form.email,
          password_hash: "managed_by_auth",
          rol_id: form.rol_id,
          activo: form.activo,
        });
        if (insertErr) throw insertErr;
        setMsg({ type: "success", text: `Usuario ${form.nombre} creado. Se enviará verificación al email.` });
      }
      setShowForm(false); setEditId(null); setForm(defaultForm);
      fetchUsuarios();
    } catch (err: any) {
      setMsg({ type: "error", text: "Error: " + (err.message ?? "Intente nuevamente.") });
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (u: Usuario) => {
    await supabase.from("usuarios").update({ activo: u.activo === 1 ? 0 : 1 }).eq("id", u.id);
    fetchUsuarios();
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Administre los usuarios del sistema</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm); setMsg(null); }}
            className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-white rounded-xl font-medium text-sm hover:opacity-90 shadow-md"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
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
            <h2 className="font-semibold text-foreground mb-4">{editId ? "Editar Usuario" : "Nuevo Usuario"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre completo *</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del usuario" className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                <input type="email" value={form.email} disabled={!!editId} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm disabled:opacity-60" />
              </div>
              {!editId && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña *</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" className="w-full px-3 py-2.5 pr-10 border border-border rounded-xl bg-background text-sm" />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Rol *</label>
                <select value={form.rol_id} onChange={e => setForm(f => ({ ...f, rol_id: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm">
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="activo" checked={form.activo === 1} onChange={e => setForm(f => ({ ...f, activo: e.target.checked ? 1 : 0 }))} className="rounded" />
                <label htmlFor="activo" className="text-sm font-medium text-foreground">Usuario Activo</label>
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-70">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Guardar Cambios" : "Crear Usuario"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-6 py-2.5 border border-border rounded-xl text-sm text-foreground hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Usuarios del Sistema</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Rol</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Creado</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{u.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.rol_id === 1 ? "bg-primary/10 text-primary" : "bg-orange-100 text-orange-700"}`}>{u.roles?.nombre ?? (u.rol_id === 1 ? "Administrador" : "Operario")}</span></td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.activo === 1 ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{u.activo === 1 ? "Activo" : "Inactivo"}</span></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString("es-CO") : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(u)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground" title="Editar"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => toggleActivo(u)} className={`p-1.5 hover:bg-muted rounded-lg ${u.activo === 1 ? "text-green-600 hover:text-red-500" : "text-muted-foreground hover:text-green-600"}`} title={u.activo === 1 ? "Desactivar" : "Activar"}><Power className="h-4 w-4" /></button>
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

export default GestionUsuarios;
