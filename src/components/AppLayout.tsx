import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { FileText, Building2, Settings, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Expedientes", icon: FileText },
  { to: "/oficinas", label: "Oficinas", icon: Building2 },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

export function AppLayout() {
  const loc = useLocation();
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
            const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
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
        <div className="px-5 py-3 text-[10px] opacity-60 border-t border-sidebar-border">
          v1.0 · {new Date().getFullYear()}
        </div>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
