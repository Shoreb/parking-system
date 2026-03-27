import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface UsuarioSistema {
  id: number;
  nombre: string;
  email: string;
  rol_id: number;
  activo: number;
  roles?: { nombre: string };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  usuario: UsuarioSistema | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isOperario: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<UsuarioSistema | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsuario = async (authUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*, roles(nombre)")
        .eq("auth_user_id", authUserId)
        .eq("activo", 1)
        .maybeSingle();
      if (error) {
        console.error("Error obteniendo usuario:", error);
        setUsuario(null);
        return null;
      }
      setUsuario(data as UsuarioSistema | null);
      return data;
    } catch (err) {
      console.error("Error inesperado:", err);
      setUsuario(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUsuario(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUsuario(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setUsuario(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Credenciales incorrectas o usuario inactivo." };
    if (data.user) {
      const u = await fetchUsuario(data.user.id);
      if (!u) {
        await supabase.auth.signOut();
        return { error: "Usuario inactivo o sin acceso al sistema." };
      }
    }
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setUser(null);
    setSession(null);
  };

  const isAdmin = () => usuario?.rol_id === 1;
  const isOperario = () => usuario?.rol_id === 2;

  return (
    <AuthContext.Provider value={{ user, session, usuario, loading, login, logout, isAdmin, isOperario }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
