import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS, type Estado, formatFecha } from "@/lib/expedientes";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/expedientes/")({
  component: ExpedientesPage,
  head: () => ({
    meta: [
      { title: "Expedientes — Sistema Municipal" },
      { name: "description", content: "Listado, búsqueda y gestión de expedientes municipales." },
    ],
  }),
});

function ExpedientesPage() {
  const navigate = useNavigate();
  const [filtroEstado, setFiltroEstado] = useState<Estado | "Todos">("Todos");
  const [q, setQ] = useState("");

  const { data: expedientes = [], isLoading } = useQuery({
    queryKey: ["expedientes", filtroEstado, q],
    queryFn: async () => {
      let query = supabase
        .from("expedientes")
        .select("codexp,codigo,anoexp,nroexp,letraexp,apeynom,estado,fechent,tema")
        .order("created_at", { ascending: false })
        .limit(500);
      if (filtroEstado !== "Todos") query = query.eq("estado", filtroEstado);
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(
          `apeynom.ilike.${term},codexp.ilike.${term},tema.ilike.${term}`,
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Mantenimiento de Expedientes
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {expedientes.length} expediente{expedientes.length !== 1 && "s"}
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/expedientes/nuevo" })}>
          <Plus className="h-4 w-4" /> Nuevo expediente
        </Button>
      </header>

      <div className="px-6 py-3 border-b bg-muted/40 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar apellido, código, organismo, tema..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8 bg-background"
          />
        </div>
        <div className="flex gap-1">
          {(["Todos", ...ESTADOS] as const).map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded border transition-colors",
                filtroEstado === e
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground sticky top-0">
            <tr>
              <th className="text-left px-6 py-2.5 font-semibold">Código Expediente</th>
              <th className="text-left px-3 py-2.5 font-semibold">Apellido y Nombre</th>
              
              <th className="text-left px-3 py-2.5 font-semibold">Tema</th>
              <th className="text-left px-3 py-2.5 font-semibold">Fecha Ent.</th>
              <th className="text-left px-3 py-2.5 font-semibold">Estado</th>
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
            {!isLoading && expedientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  No hay expedientes que coincidan.
                </td>
              </tr>
            )}
            {expedientes.map((e) => (
              <tr key={e.codexp} className="border-b hover:bg-accent/40 cursor-pointer">
                <td className="px-6 py-2 font-mono font-semibold">
                  <Link
                    to="/expedientes/$codexp"
                    params={{ codexp: e.codexp }}
                    className="text-primary hover:underline"
                  >
                    {e.codexp}
                  </Link>
                </td>
                <td className="px-3 py-2">{e.apeynom}</td>
                
                <td className="px-3 py-2 text-xs">{e.tema}</td>
                <td className="px-3 py-2 text-xs">{formatFecha(e.fechent)}</td>
                <td className="px-3 py-2">
                  <EstadoBadge estado={e.estado as Estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
