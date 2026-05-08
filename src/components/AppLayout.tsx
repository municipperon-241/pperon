import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { FileText, Building2, Settings, LayoutGrid, Users, LogOut } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth, ROL_LABEL, isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    );
  }

  const NAV = [
    { to: "/", label: "Expedientes", icon: FileText, show: true },
    { to: "/oficinas", label: "Oficinas", icon: Building2, show: isAdmin(user.rol) },
    { to: "/usuarios", label: "Usuarios", icon: Users, show: isAdmin(user.rol) },
    { to: "/configuracion", label: "Configuración", icon: Settings, show: isAdmin(user.rol) },
  ];

  return (
    <div className="min-h-screen flex bg-background no-print">
      <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          <div>
            <div className="font-bold text-sm leading-tight">Expedientes</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">Sistema Municipal</div>
          </div>
        </div>
        <nav className="flex-1 py-3">
          {NAV.filter((n) => n.show).map((n) => {
            const active =
              loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2",
                  active
                    ? "bg-sidebar-accent border-sidebar-primary font-medium"
                    : "border-transparent hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-sidebar-border space-y-2">
          <div className="text-xs">
            <div className="font-semibold truncate">{user.nombre || user.usuario}</div>
            <div className="text-[10px] opacity-70">{ROL_LABEL[user.rol]}</div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start text-xs h-8"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
