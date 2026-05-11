import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { FileText, Building2, Settings, LayoutGrid, Users, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth, ROL_LABEL, isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const admin = !!user && isAdmin(user.rol);
  const inConfig =
    loc.pathname.startsWith("/configuracion") ||
    loc.pathname.startsWith("/oficinas") ||
    loc.pathname.startsWith("/usuarios");
  const [configOpen, setConfigOpen] = useState(inConfig);

  useEffect(() => {
    if (inConfig) setConfigOpen(true);
  }, [inConfig]);

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

  const NAV = [{ to: "/", label: "Expedientes", icon: FileText, show: true }];

  const CONFIG_SUB = [
    { to: "/configuracion", label: "General", icon: Settings, exact: true },
    { to: "/oficinas", label: "Oficinas", icon: Building2 },
    { to: "/usuarios", label: "Usuarios", icon: Users },
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
          {NAV.map((n) => {
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
          {admin && (
            <div>
              <button
                type="button"
                onClick={() => setConfigOpen((o) => !o)}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 text-left",
                  inConfig
                    ? "bg-sidebar-accent border-sidebar-primary font-medium"
                    : "border-transparent hover:bg-sidebar-accent/60",
                )}
              >
                <Settings className="h-4 w-4" />
                <span className="flex-1">Configuración</span>
                {configOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
              {configOpen && (
                <div className="bg-sidebar-accent/30">
                  {CONFIG_SUB.map((s) => {
                    const sActive = s.exact
                      ? loc.pathname === s.to
                      : loc.pathname === s.to || loc.pathname.startsWith(s.to + "/");
                    const SIcon = s.icon;
                    return (
                      <Link
                        key={s.to}
                        to={s.to}
                        className={cn(
                          "flex items-center gap-3 pl-10 pr-5 py-2 text-xs transition-colors border-l-2",
                          sActive
                            ? "bg-sidebar-accent border-sidebar-primary font-medium"
                            : "border-transparent hover:bg-sidebar-accent/60",
                        )}
                      >
                        <SIcon className="h-3.5 w-3.5" /> {s.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
