import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TEMAS } from "@/lib/expedientes";
import { useAuth, canEdit } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/expedientes/$codexp/editar")({
  component: EditarExpedientePage,
  head: ({ params }) => ({
    meta: [{ title: `Editar ${params.codexp} — Sistema Municipal` }],
  }),
});

function EditarExpedientePage() {
  const { codexp } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !canEdit(user.rol)) navigate({ to: "/expedientes/$codexp", params: { codexp } });
  }, [user, navigate, codexp]);

  const { data: exp, isLoading } = useQuery({
    queryKey: ["expediente-edit", codexp],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expedientes")
        .select("*")
        .eq("codexp", codexp)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    apeynom: "",
    fechent: "",
    tema: "",
    tipo_objeto: "",
    nro_objeto: "",
    nro_acta: "",
    infraccion: "",
    nro_juzgado: "",
    comentario: "",
    ultima_nota: "",
  });

  useEffect(() => {
    if (exp) {
      setForm({
        apeynom: exp.apeynom ?? "",
        fechent: exp.fechent ?? "",
        tema: exp.tema ?? "",
        tipo_objeto: exp.tipo_objeto ?? "",
        nro_objeto: exp.nro_objeto ?? "",
        nro_acta: exp.nro_acta ?? "",
        infraccion: exp.infraccion ?? "",
        nro_juzgado: exp.nro_juzgado ?? "",
        comentario: exp.comentario ?? "",
        ultima_nota: exp.ultima_nota ?? "",
      });
    }
  }, [exp]);

  function up<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.apeynom.trim() || !form.tema.trim() || !form.fechent) {
      return toast.error("Apellido, fecha y tema son obligatorios");
    }
    setSaving(true);
    const { error } = await supabase
      .from("expedientes")
      .update({
        apeynom: form.apeynom.trim(),
        fechent: form.fechent,
        tema: form.tema,
        tipo_objeto: form.tipo_objeto || null,
        nro_objeto: form.nro_objeto || null,
        nro_acta: form.nro_acta || null,
        infraccion: form.infraccion || null,
        nro_juzgado: form.nro_juzgado || null,
        comentario: form.comentario || null,
        ultima_nota: form.ultima_nota || null,
        updated_by: user?.usuario ?? "sistema",
      })
      .eq("codexp", codexp);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Expediente actualizado");
    navigate({ to: "/expedientes/$codexp", params: { codexp } });
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Cargando...</div>;
  if (!exp) return <div className="p-8 text-muted-foreground">Expediente no encontrado.</div>;

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-card px-6 py-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/expedientes/$codexp", params: { codexp } })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">
          Editar expediente <span className="font-mono">{codexp}</span>
        </h1>
      </header>

      <form onSubmit={onSubmit} className="flex-1 overflow-auto p-6 max-w-5xl mx-auto w-full space-y-4">
        <fieldset className="border rounded-lg p-5 bg-card">
          <legend className="px-2 text-sm font-semibold">Datos principales</legend>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-3">
              <Label className="text-xs uppercase">Fecha entrada</Label>
              <Input type="date" value={form.fechent} onChange={(e) => up("fechent", e.target.value)} />
            </div>
            <div className="col-span-12 md:col-span-9">
              <Label className="text-xs uppercase">Apellido y Nombre</Label>
              <Input value={form.apeynom} onChange={(e) => up("apeynom", e.target.value)} />
            </div>
            <div className="col-span-12">
              <Label className="text-xs uppercase">Tema</Label>
              <Select value={form.tema} onValueChange={(v) => up("tema", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tema" />
                </SelectTrigger>
                <SelectContent>
                  {TEMAS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>

        <fieldset className="border rounded-lg p-5 bg-card">
          <legend className="px-2 text-sm font-semibold">Objeto</legend>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4">
              <Label className="text-xs uppercase">Tipo Objeto</Label>
              <Select value={form.tipo_objeto} onValueChange={(v) => up("tipo_objeto", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {["Inmuebles", "Rodados", "Cementerio", "Comercio"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-6 md:col-span-4">
              <Label className="text-xs uppercase">Nº Objeto</Label>
              <Input value={form.nro_objeto} onChange={(e) => up("nro_objeto", e.target.value)} />
            </div>
            <div className="col-span-6 md:col-span-4">
              <Label className="text-xs uppercase">Nº Acta</Label>
              <Input value={form.nro_acta} onChange={(e) => up("nro_acta", e.target.value)} />
            </div>
            <div className="col-span-12 md:col-span-8">
              <Label className="text-xs uppercase">Infracción</Label>
              <Input value={form.infraccion} onChange={(e) => up("infraccion", e.target.value)} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <Label className="text-xs uppercase">Nº Juzgado</Label>
              <Input value={form.nro_juzgado} onChange={(e) => up("nro_juzgado", e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset className="border rounded-lg p-5 bg-card">
          <legend className="px-2 text-sm font-semibold">Comentarios</legend>
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase">Comentario</Label>
              <Textarea
                rows={3}
                value={form.comentario}
                onChange={(e) => up("comentario", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs uppercase">Última nota</Label>
              <Input value={form.ultima_nota} onChange={(e) => up("ultima_nota", e.target.value)} />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/expedientes/$codexp", params: { codexp } })}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
