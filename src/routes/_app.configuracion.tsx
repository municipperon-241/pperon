import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracion")({
  component: ConfigPage,
  head: () => ({ meta: [{ title: "Configuración — Sistema Municipal" }] }),
});

function ConfigPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["configuracion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({ municipalidad: "", direccion: "", logo_url: "" });
  useEffect(() => {
    if (data)
      setForm({
        municipalidad: data.municipalidad ?? "",
        direccion: data.direccion ?? "",
        logo_url: data.logo_url ?? "",
      });
  }, [data]);

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("configuracion")
        .update({
          municipalidad: form.municipalidad.trim() || "MUNICIPALIDAD",
          direccion: form.direccion.trim() || null,
          logo_url: form.logo_url.trim() || null,
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuración guardada");
      qc.invalidateQueries({ queryKey: ["configuracion"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-card px-6 py-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5" /> Configuración
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Datos institucionales que aparecen en la carátula.
        </p>
      </header>

      <form
        className="p-6 max-w-2xl mx-auto w-full space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          guardar.mutate();
        }}
      >
        <div>
          <Label>Municipalidad</Label>
          <Input
            value={form.municipalidad}
            onChange={(e) => setForm((s) => ({ ...s, municipalidad: e.target.value }))}
            maxLength={200}
          />
        </div>
        <div>
          <Label>Dirección</Label>
          <Input
            value={form.direccion}
            onChange={(e) => setForm((s) => ({ ...s, direccion: e.target.value }))}
            maxLength={300}
          />
        </div>
        <div>
          <Label>URL Logo (opcional)</Label>
          <Input
            value={form.logo_url}
            onChange={(e) => setForm((s) => ({ ...s, logo_url: e.target.value }))}
            placeholder="https://..."
          />
        </div>
        <Button type="submit" disabled={guardar.isPending}>
          <Save className="h-4 w-4" /> Guardar
        </Button>
      </form>
    </div>
  );
}
