import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/oficinas")({
  component: OficinasPage,
  head: () => ({ meta: [{ title: "Oficinas — Sistema Municipal" }] }),
});

function OficinasPage() {
  const qc = useQueryClient();
  const [nuevo, setNuevo] = useState("");

  const { data: oficinas = [] } = useQuery({
    queryKey: ["oficinas-todas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oficinas")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const crear = useMutation({
    mutationFn: async (nombre: string) => {
      const n = nombre.trim();
      if (!n) throw new Error("Nombre requerido");
      const { error } = await supabase.from("oficinas").insert({ nombre: n });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oficina creada");
      setNuevo("");
      qc.invalidateQueries({ queryKey: ["oficinas-todas"] });
      qc.invalidateQueries({ queryKey: ["oficinas-activas"] });
    },
    onError: (e: any) =>
      toast.error(e.code === "23505" ? "Ya existe una oficina con ese nombre" : e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, activa }: { id: string; activa: boolean }) => {
      const { error } = await supabase.from("oficinas").update({ activa }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oficinas-todas"] });
      qc.invalidateQueries({ queryKey: ["oficinas-activas"] });
    },
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("oficinas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oficina eliminada");
      qc.invalidateQueries({ queryKey: ["oficinas-todas"] });
    },
    onError: (e: any) =>
      toast.error(
        e.code === "23503"
          ? "No se puede eliminar: la oficina tiene movimientos asociados. Desactivala en su lugar."
          : e.message,
      ),
  });

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-card px-6 py-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5" /> Oficinas
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Catálogo de oficinas usadas en los movimientos.
        </p>
      </header>

      <div className="p-6 max-w-3xl mx-auto w-full space-y-4">
        <form
          className="flex gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            crear.mutate(nuevo);
          }}
        >
          <div className="flex-1">
            <Label className="text-xs">Nueva oficina</Label>
            <Input
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder="Ej: Dirección de Catastro"
            />
          </div>
          <Button type="submit" disabled={crear.isPending}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </form>

        <div className="border rounded-lg bg-card divide-y">
          {oficinas.map((o) => (
            <div key={o.id} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium text-sm">{o.nombre}</div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  {o.activa ? "Activa" : "Inactiva"}
                </div>
              </div>
              <Switch
                checked={o.activa}
                onCheckedChange={(v) => toggle.mutate({ id: o.id, activa: v })}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm(`¿Eliminar la oficina "${o.nombre}"?`)) eliminar.mutate(o.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {oficinas.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sin oficinas cargadas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
