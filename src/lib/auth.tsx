import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import bcrypt from "bcryptjs";
import { supabase } from "@/integrations/supabase/client";

export type Rol = "admin" | "editor" | "lector";

export interface AppUser {
  id: string;
  usuario: string;
  nombre: string;
  rol: Rol;
}

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "app_session_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  async function login(usuario: string, password: string) {
    const u = usuario.trim().toLowerCase();
    const { data, error } = await supabase
      .from("app_users")
      .select("id,usuario,nombre,rol,activo,password_hash")
      .eq("usuario", u)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Usuario o contraseña incorrectos");
    if (!data.activo) throw new Error("Usuario inactivo");
    const ok = bcrypt.compareSync(password, data.password_hash);
    if (!ok) throw new Error("Usuario o contraseña incorrectos");
    const session: AppUser = {
      id: data.id,
      usuario: data.usuario,
      nombre: data.nombre,
      rol: data.rol as Rol,
    };
    localStorage.setItem(KEY, JSON.stringify(session));
    setUser(session);
  }

  function logout() {
    localStorage.removeItem(KEY);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fuera de AuthProvider");
  return c;
}

export function hashPassword(plain: string) {
  return bcrypt.hashSync(plain, 10);
}

export const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  editor: "Editor",
  lector: "Lector",
};

export function canEdit(rol?: Rol | null) {
  return rol === "admin" || rol === "editor";
}
export function isAdmin(rol?: Rol | null) {
  return rol === "admin";
}
