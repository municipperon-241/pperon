import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Ingresar — Sistema Municipal" }] }),
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(usuario, password);
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-card border rounded-lg p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-6">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Sistema Municipal</h1>
            <p className="text-xs text-muted-foreground">Gestión de Expedientes</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Usuario</Label>
            <Input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoFocus
              autoComplete="username"
              required
            />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full mt-5" disabled={loading}>
          <LogIn className="h-4 w-4" /> {loading ? "Ingresando..." : "Ingresar"}
        </Button>

        <p className="text-[11px] text-muted-foreground text-center mt-4">
          Usuario inicial: <code className="font-mono">admin</code> / <code className="font-mono">admin</code>
        </p>
      </form>
    </div>
  );
}
