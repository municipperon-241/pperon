import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin, hashPassword, ROL_LABEL, type Rol } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/usuarios")({
  component: UsuariosPage,
  head: () => ({ meta: [{ title: "Usuarios — Sistema Municipal" }] }),
});

interface UsuarioRow {
  id: string;
  usuario: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  created_at: string;
}

function UsuariosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<UsuarioRow | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user && !isAdmin(user.rol)) navigate({ to: "/" });
  }, [user, navigate]);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["app_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_users")
        .select("id,usuario,nombre,rol,activo,created_at")
        .order("usuario");
      if (error) throw error;
      return data as UsuarioRow[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("app_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["app_users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5" /> Usuarios del sistema
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {usuarios.length} usuario{usuarios.length !== 1 && "s"}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground sticky top-0">
            <tr>
              <th className="text-left px-6 py-2.5 font-semibold">Usuario</th>
              <th className="text-left px-3 py-2.5 font-semibold">Nombre</th>
              <th className="text-left px-3 py-2.5 font-semibold">Rol</th>
              <th className="text-left px-3 py-2.5 font-semibold">Estado</th>
              <th className="text-right px-6 py-2.5 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b hover:bg-accent/40">
                <td className="px-6 py-2 font-mono font-semibold">{u.usuario}</td>
                <td className="px-3 py-2">{u.nombre || "—"}</td>
                <td className="px-3 py-2">{ROL_LABEL[u.rol]}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      u.activo
                        ? "text-xs px-2 py-0.5 rounded bg-green-100 text-green-900"
                        : "text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700"
                    }
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-2 text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(u)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={u.usuario === "admin"}
                    onClick={() => {
                      if (confirm(`¿Eliminar usuario "${u.usuario}"?`)) del.mutate(u.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <UsuarioDialog
          row={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["app_users"] });
          }}
        />
      )}
    </div>
  );
}

function UsuarioDialog({ row, onClose }: { row: UsuarioRow | null; onClose: () => void }) {
  const isEdit = !!row;
  const [form, setForm] = useState({
    usuario: row?.usuario ?? "",
    nombre: row?.nombre ?? "",
    rol: (row?.rol ?? "lector") as Rol,
    activo: row?.activo ?? true,
    password: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.usuario.trim()) return toast.error("Usuario requerido");
    if (!isEdit && !form.password) return toast.error("Contraseña requerida");
    setSaving(true);
    try {
      if (isEdit) {
        const update: any = {
          nombre: form.nombre.trim(),
          rol: form.rol,
          activo: form.activo,
        };
        if (form.password) update.password_hash = hashPassword(form.password);
        const { error } = await supabase.from("app_users").update(update).eq("id", row!.id);
        if (error) throw error;
        toast.success("Usuario actualizado");
      } else {
        const { error } = await supabase.from("app_users").insert({
          usuario: form.usuario.trim().toLowerCase(),
          nombre: form.nombre.trim(),
          rol: form.rol,
          activo: form.activo,
          password_hash: hashPassword(form.password),
        });
        if (error) throw error;
        toast.success("Usuario creado");
      }
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Usuario</Label>
            <Input
              value={form.usuario}
              disabled={isEdit}
              onChange={(e) => setForm((s) => ({ ...s, usuario: e.target.value }))}
            />
          </div>
          <div>
            <Label>Nombre completo</Label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={form.rol} onValueChange={(v) => setForm((s) => ({ ...s, rol: v as Rol }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="lector">Lector</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{isEdit ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((s) => ({ ...s, activo: e.target.checked }))}
            />
            Activo
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
