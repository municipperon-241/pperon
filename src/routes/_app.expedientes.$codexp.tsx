import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ESTADOS,
  formatFecha,
  formatFechaHora,
  movimientoSchema,
  type Estado,
} from "@/lib/expedientes";
import { EstadoBadge } from "@/components/EstadoBadge";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Printer, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/expedientes/$codexp")({
  component: DetalleExpedientePage,
  head: ({ params }) => ({
    meta: [{ title: `Expediente ${params.codexp} — Sistema Municipal` }],
  }),
});

function DetalleExpedientePage() {
  const { codexp } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [openMov, setOpenMov] = useState(false);

  const { data: exp, isLoading } = useQuery({
    queryKey: ["expediente", codexp],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expedientes")
        .select("*, oficina_inicio:oficina_inicio_id(nombre)")
        .eq("codexp", codexp)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: movs = [] } = useQuery({
    queryKey: ["movimientos", codexp],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimientos")
        .select("*, oficina:oficina_id(nombre)")
        .eq("codexp", codexp)
        .order("nromov", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Cargando...</div>;
  if (!exp) return <div className="p-8 text-muted-foreground">Expediente no encontrado.</div>;

  const finalizado = exp.estado === "Finalizado";

  return (
    <div className="flex flex-col h-full">
      <header className="border-b bg-card px-6 py-4 flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/expedientes" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono">{exp.codexp}</h1>
            <EstadoBadge estado={exp.estado as Estado} />
          </div>
          <p className="text-sm text-muted-foreground truncate">{exp.apeynom}</p>
        </div>
        <Link to="/expedientes/$codexp/caratula" params={{ codexp }}>
          <Button variant="outline">
            <Printer className="h-4 w-4" /> Imprimir carátula
          </Button>
        </Link>
        <Dialog open={openMov} onOpenChange={setOpenMov}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Nuevo movimiento
            </Button>
          </DialogTrigger>
          <NuevoMovimientoDialog
            codexp={codexp}
            estadoActual={exp.estado as Estado}
            onClose={() => {
              setOpenMov(false);
              qc.invalidateQueries({ queryKey: ["expediente", codexp] });
              qc.invalidateQueries({ queryKey: ["movimientos", codexp] });
              qc.invalidateQueries({ queryKey: ["expedientes"] });
            }}
          />
        </Dialog>
      </header>

      <div className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <Card title="Datos del expediente">
            <Grid>
              <Item label="Código">{exp.codigo}</Item>
              <Item label="Año">{exp.anoexp}</Item>
              <Item label="Nº Expediente">{exp.nroexp}</Item>
              <Item label="Letra">{exp.letraexp}</Item>
              <Item label="Fecha entrada">{formatFecha(exp.fechent)}</Item>
              <Item label="Apellido y Nombre" full>
                {exp.apeynom}
              </Item>
              <Item label="Organismo" full>
                {exp.organismo}
              </Item>
              <Item label="Tema" full>
                {exp.tema}
              </Item>
            </Grid>
          </Card>

          <Card title="Iniciador y objeto">
            <Grid>
              <Item label="Iniciado por">{exp.iniciado_por || "—"}</Item>
              <Item label="Número">{exp.iniciado_nro || "—"}</Item>
              <Item label="Tipo objeto">{exp.tipo_objeto || "—"}</Item>
              <Item label="Nº objeto">{exp.nro_objeto || "—"}</Item>
              <Item label="Nº acta">{exp.nro_acta || "—"}</Item>
              <Item label="Infracción">{exp.infraccion || "—"}</Item>
              <Item label="Oficina inicio">
                {(exp as any).oficina_inicio?.nombre || "—"}
              </Item>
              <Item label="Nº juzgado">{exp.nro_juzgado || "—"}</Item>
            </Grid>
          </Card>

          <Card title="Comentario">
            <p className="text-sm whitespace-pre-wrap">{exp.comentario || "—"}</p>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card title="Auditoría">
            <Grid>
              <Item label="Creado">{formatFechaHora(exp.created_at)}</Item>
              <Item label="Por">{exp.created_by || "—"}</Item>
              <Item label="Modificado">{formatFechaHora(exp.updated_at)}</Item>
              <Item label="Por">{exp.updated_by || "—"}</Item>
            </Grid>
          </Card>

          <Card title={`Movimientos (${movs.length})`}>
            {finalizado && (
              <div className="mb-3 p-2 rounded bg-[var(--estado-finalizado)]/10 border border-[var(--estado-finalizado)]/30 text-xs flex items-center gap-2">
                <Lock className="h-3 w-3" /> Expediente finalizado. Solo se permite Reapertura.
              </div>
            )}
            <ol className="relative space-y-4">
              {movs.map((m, i) => (
                <li key={m.id} className="pl-6 relative">
                  <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                  {i < movs.length - 1 && (
                    <span className="absolute left-[5px] top-5 bottom-[-16px] w-0.5 bg-border" />
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono font-bold">#{m.nromov}</span>
                    <span>·</span>
                    <span>{formatFechaHora(m.fechaini)}</span>
                    {m.tipo_movimiento === "Reapertura" && (
                      <span className="px-1.5 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold">
                        REAPERTURA
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium mt-0.5 flex items-center gap-2">
                    {(m as any).oficina?.nombre}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <EstadoBadge estado={m.estado_resultante as Estado} />
                  </div>
                  {m.observac && (
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                      {m.observac}
                    </p>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {m.fecsarea ? `Cerrado: ${formatFechaHora(m.fecsarea)}` : "Abierto"}
                    {m.created_by && ` · ${m.created_by}`}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-lg">
      <h2 className="text-xs uppercase tracking-wider font-semibold px-4 py-2 border-b bg-muted/40">
        {title}
      </h2>
      <div className="p-4">{children}</div>
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}
function Item({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function NuevoMovimientoDialog({
  codexp,
  estadoActual,
  onClose,
}: {
  codexp: string;
  estadoActual: Estado;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const finalizado = estadoActual === "Finalizado";
  const [form, setForm] = useState({
    oficina_id: "",
    estado_resultante: finalizado ? "Pendiente" : estadoActual,
    tipo_movimiento: finalizado ? "Reapertura" : "Normal",
    observac: "",
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

  async function submit() {
    const parse = movimientoSchema.safeParse(form);
    if (!parse.success) {
      toast.error(parse.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("movimientos").insert({
      codexp,
      oficina_id: form.oficina_id,
      estado_resultante: form.estado_resultante,
      tipo_movimiento: form.tipo_movimiento,
      observac: form.observac || null,
      created_by: form.operador,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Movimiento registrado");
    onClose();
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nuevo movimiento</DialogTitle>
      </DialogHeader>
      {finalizado && (
        <div className="text-xs p-2 rounded bg-amber-100 border border-amber-300 text-amber-900">
          El expediente está Finalizado. Solo se permite un movimiento de tipo{" "}
          <strong>Reapertura</strong>.
        </div>
      )}
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Oficina destino *</Label>
          <Select
            value={form.oficina_id}
            onValueChange={(v) => setForm((s) => ({ ...s, oficina_id: v }))}
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
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select
              value={form.tipo_movimiento}
              onValueChange={(v) => setForm((s) => ({ ...s, tipo_movimiento: v }))}
              disabled={finalizado}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Reapertura">Reapertura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Estado resultante *</Label>
            <Select
              value={form.estado_resultante}
              onValueChange={(v) => setForm((s) => ({ ...s, estado_resultante: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.filter(
                  (e) => !(form.tipo_movimiento === "Reapertura" && e === "Finalizado"),
                ).map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Observaciones</Label>
          <Textarea
            rows={3}
            value={form.observac}
            onChange={(e) => setForm((s) => ({ ...s, observac: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs">Operador *</Label>
          <Input
            value={form.operador}
            onChange={(e) => setForm((s) => ({ ...s, operador: e.target.value }))}
            placeholder="Tu nombre"
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving}>
          {saving ? "Guardando..." : "Registrar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
