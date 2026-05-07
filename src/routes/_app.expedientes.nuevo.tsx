import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildCodexp, expedienteSchema, TEMAS } from "@/lib/expedientes";
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

export const Route = createFileRoute("/_app/expedientes/nuevo")({
  component: NuevoExpedientePage,
  head: () => ({
    meta: [{ title: "Nuevo Expediente — Sistema Municipal" }],
  }),
});

function NuevoExpedientePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    codigo: "",
    anoexp: String(new Date().getFullYear()),
    nroexp: "",
    letraexp: "",
    apeynom: "",
    fechent: new Date().toISOString().slice(0, 10),
    organismo: "",
    tema: "",
    oficina_inicial_id: "",
    iniciado_por: "",
    iniciado_nro: "",
    tipo_objeto: "",
    nro_objeto: "",
    nro_acta: "",
    infraccion: "",
    nro_juzgado: "",
    comentario: "",
    ultima_nota: "",
    operador: "",
  });

  const { data: oficinas = [] } = useQuery({
    queryKey: ["oficinas-activas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oficinas")
        .select("id,nombre")
        .eq("activa", true)
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parse = expedienteSchema.safeParse(form);
    if (!parse.success) {
      toast.error(parse.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    const v = parse.data;
    const codexp = buildCodexp(v.codigo, v.anoexp, v.nroexp, v.letraexp);
    setSaving(true);

    const { error: expErr } = await supabase.from("expedientes").insert({
      codexp,
      codigo: v.codigo,
      anoexp: v.anoexp,
      nroexp: v.nroexp,
      letraexp: v.letraexp.toUpperCase(),
      apeynom: v.apeynom,
      fechent: v.fechent,
      organismo: v.organismo,
      tema: v.tema,
      iniciado_por: v.iniciado_por || null,
      iniciado_nro: v.iniciado_nro || null,
      tipo_objeto: v.tipo_objeto || null,
      nro_objeto: v.nro_objeto || null,
      nro_acta: v.nro_acta || null,
      infraccion: v.infraccion || null,
      oficina_inicio_id: v.oficina_inicial_id,
      nro_juzgado: v.nro_juzgado || null,
      comentario: v.comentario || null,
      ultima_nota: v.ultima_nota || null,
      estado: "Pendiente",
      created_by: v.operador,
      updated_by: v.operador,
    });

    if (expErr) {
      setSaving(false);
      toast.error(
        expErr.code === "23505"
          ? "Ya existe un expediente con esos datos."
          : `Error: ${expErr.message}`,
      );
      return;
    }

    // Primer movimiento automático
    const { error: movErr } = await supabase.from("movimientos").insert({
      codexp,
      nromov: 1,
      oficina_id: v.oficina_inicial_id,
      fechaini: new Date(v.fechent).toISOString(),
      estado_resultante: "Pendiente",
      tipo_movimiento: "Normal",
      observac: "Inicio del expediente",
      created_by: v.operador,
    });

    setSaving(false);
    if (movErr) {
      toast.warning(`Expediente creado, pero falló el movimiento inicial: ${movErr.message}`);
    } else {
      toast.success("Expediente creado correctamente");
    }
    navigate({ to: "/expedientes/$codexp", params: { codexp } });
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-card px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/expedientes" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Nuevo Expediente</h1>
      </header>

      <form onSubmit={onSubmit} className="flex-1 overflow-auto p-6 max-w-5xl mx-auto w-full">
        <fieldset className="border rounded-lg p-5 bg-card">
          <legend className="px-2 text-sm font-semibold">Identificación</legend>
          <div className="grid grid-cols-12 gap-4">
            <Field label="Código" cols={2}>
              <Input value={form.codigo} onChange={(e) => update("codigo", e.target.value)} required />
            </Field>
            <Field label="Año" cols={2}>
              <Input value={form.anoexp} onChange={(e) => update("anoexp", e.target.value)} required />
            </Field>
            <Field label="Nº Expediente" cols={3}>
              <Input value={form.nroexp} onChange={(e) => update("nroexp", e.target.value)} required />
            </Field>
            <Field label="Letra" cols={2}>
              <Input
                value={form.letraexp}
                onChange={(e) => update("letraexp", e.target.value.toUpperCase())}
                maxLength={2}
                required
              />
            </Field>
            <Field label="Fecha Entrada" cols={3}>
              <Input
                type="date"
                value={form.fechent}
                onChange={(e) => update("fechent", e.target.value)}
                required
              />
            </Field>
            <Field label="Apellido y Nombre" cols={12}>
              <Input
                value={form.apeynom}
                onChange={(e) => update("apeynom", e.target.value)}
                required
              />
            </Field>
            <Field label="Organismo" cols={6}>
              <Input
                value={form.organismo}
                onChange={(e) => update("organismo", e.target.value)}
                required
              />
            </Field>
            <Field label="Tema" cols={6}>
              <Input value={form.tema} onChange={(e) => update("tema", e.target.value)} required />
            </Field>
          </div>
        </fieldset>

        <fieldset className="border rounded-lg p-5 bg-card mt-4">
          <legend className="px-2 text-sm font-semibold">Iniciador y Objeto</legend>
          <div className="grid grid-cols-12 gap-4">
            <Field label="Iniciado por" cols={4}>
              <Input
                value={form.iniciado_por}
                onChange={(e) => update("iniciado_por", e.target.value)}
              />
            </Field>
            <Field label="Número" cols={2}>
              <Input
                value={form.iniciado_nro}
                onChange={(e) => update("iniciado_nro", e.target.value)}
              />
            </Field>
            <Field label="Tipo Objeto" cols={3}>
              <Input
                value={form.tipo_objeto}
                onChange={(e) => update("tipo_objeto", e.target.value)}
              />
            </Field>
            <Field label="Nº Objeto" cols={3}>
              <Input
                value={form.nro_objeto}
                onChange={(e) => update("nro_objeto", e.target.value)}
              />
            </Field>
            <Field label="Nº Acta" cols={3}>
              <Input value={form.nro_acta} onChange={(e) => update("nro_acta", e.target.value)} />
            </Field>
            <Field label="Infracción" cols={6}>
              <Input
                value={form.infraccion}
                onChange={(e) => update("infraccion", e.target.value)}
              />
            </Field>
            <Field label="Nº Juzgado" cols={3}>
              <Input
                value={form.nro_juzgado}
                onChange={(e) => update("nro_juzgado", e.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="border rounded-lg p-5 bg-card mt-4">
          <legend className="px-2 text-sm font-semibold">Movimiento inicial</legend>
          <div className="grid grid-cols-12 gap-4">
            <Field label="Oficina inicial *" cols={6}>
              <Select
                value={form.oficina_inicial_id}
                onValueChange={(v) => update("oficina_inicial_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar oficina" />
                </SelectTrigger>
                <SelectContent>
                  {oficinas.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Operador *" cols={6}>
              <Input
                value={form.operador}
                onChange={(e) => update("operador", e.target.value)}
                placeholder="Tu nombre"
                required
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="border rounded-lg p-5 bg-card mt-4">
          <legend className="px-2 text-sm font-semibold">Comentarios</legend>
          <div className="grid grid-cols-12 gap-4">
            <Field label="Comentario" cols={12}>
              <Textarea
                rows={3}
                value={form.comentario}
                onChange={(e) => update("comentario", e.target.value)}
              />
            </Field>
            <Field label="Última nota" cols={12}>
              <Input
                value={form.ultima_nota}
                onChange={(e) => update("ultima_nota", e.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/expedientes" })}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Crear expediente"}
          </Button>
        </div>
      </form>
    </div>
  );
}

const COL_CLASSES: Record<number, string> = {
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  6: "md:col-span-6",
  12: "md:col-span-12",
};

function Field({
  label,
  cols,
  children,
}: {
  label: string;
  cols: number;
  children: React.ReactNode;
}) {
  return (
    <div className={`col-span-12 ${COL_CLASSES[cols] ?? "md:col-span-12"}`}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">
        {label}
      </Label>
      {children}
    </div>
  );
}
