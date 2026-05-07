import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatFecha, formatFechaHora, type Estado } from "@/lib/expedientes";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/expedientes/$codexp/caratula")({
  component: CaratulaPage,
  head: ({ params }) => ({
    meta: [{ title: `Carátula ${params.codexp}` }],
  }),
});

function CaratulaPage() {
  const { codexp } = Route.useParams();
  const navigate = useNavigate();

  const { data: exp } = useQuery({
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

  const { data: cfg } = useQuery({
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

  useEffect(() => {
    document.body.classList.add("bg-muted");
    return () => document.body.classList.remove("bg-muted");
  }, []);

  if (!exp) return <div className="p-8 text-muted-foreground">Cargando...</div>;

  return (
    <div className="min-h-screen py-6">
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex justify-between items-center px-2">
        <Button variant="outline" onClick={() => navigate({ to: "/expedientes/$codexp", params: { codexp } })}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
      </div>

      <article className="caratula shadow-lg">
        {/* Encabezado */}
        <div className="frame">
          <div className="row" style={{ alignItems: "flex-end" }}>
            <div style={{ flex: 2 }}>
              <h1 style={{ fontSize: "16pt", fontWeight: 700, letterSpacing: "0.05em" }}>
                {cfg?.municipalidad || "MUNICIPALIDAD"}
              </h1>
              {cfg?.direccion && (
                <div style={{ fontSize: "9pt", color: "#444" }}>{cfg.direccion}</div>
              )}
              <div style={{ fontSize: "10pt", marginTop: 4 }}>
                Mantenimiento de Expedientes
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "9pt" }}>
              <div>Fecha de emisión: {formatFechaHora(new Date().toISOString())}</div>
            </div>
          </div>
        </div>

        {/* Codexp */}
        <div className="frame" style={{ marginTop: 8 }}>
          <div className="codexp-big">{exp.codexp}</div>
        </div>

        {/* Identificación */}
        <div className="frame">
          <div className="row">
            <div style={{ flex: 1 }}>
              <div className="label">Año</div>
              <div className="value">{exp.anoexp}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Código</div>
              <div className="value">{exp.codigo}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Letra</div>
              <div className="value">{exp.letraexp}</div>
            </div>
            <div style={{ flex: 2 }}>
              <div className="label">Nº Expediente</div>
              <div className="value">{exp.nroexp}</div>
            </div>
            <div style={{ flex: 2 }}>
              <div className="label">Fecha de entrada</div>
              <div className="value">{formatFecha(exp.fechent)}</div>
            </div>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <div style={{ flex: 3 }}>
              <div className="label">Organismo</div>
              <div className="value">{exp.organismo}</div>
            </div>
            <div style={{ flex: 2 }}>
              <div className="label">Tema</div>
              <div className="value">{exp.tema}</div>
            </div>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <div className="label">Apellido y Nombre</div>
              <div className="value" style={{ fontSize: "13pt" }}>{exp.apeynom}</div>
            </div>
          </div>
        </div>

        {/* Iniciador y Objeto */}
        <div className="frame">
          <div className="row">
            <div style={{ flex: 2 }}>
              <div className="label">Tipo objeto</div>
              <div className="value">{exp.tipo_objeto || "—"}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Nº objeto</div>
              <div className="value">{exp.nro_objeto || "—"}</div>
            </div>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <div className="label">Nº acta</div>
              <div className="value">{exp.nro_acta || "—"}</div>
            </div>
            <div style={{ flex: 2 }}>
              <div className="label">Infracción</div>
              <div className="value">{exp.infraccion || "—"}</div>
            </div>
            <div style={{ flex: 2 }}>
              <div className="label">Oficina de inicio</div>
              <div className="value">{(exp as any).oficina_inicio?.nombre || "—"}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Nº juzgado</div>
              <div className="value">{exp.nro_juzgado || "—"}</div>
            </div>
          </div>
        </div>

        {/* Comentario */}
        <div className="frame">
          <div className="label">Comentario</div>
          <div style={{ minHeight: 70, fontSize: "11pt", marginTop: 4, whiteSpace: "pre-wrap" }}>
            {exp.comentario || ""}
          </div>
        </div>

        {/* Estado */}
        <div className="frame">
          <div className="row">
            <div style={{ flex: 1 }}>
              <div className="label">Estado actual</div>
              <div className="value" style={{ fontSize: "13pt" }}>{exp.estado}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Última nota</div>
              <div className="value">{exp.ultima_nota || "—"}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Total movimientos</div>
              <div className="value">{movs.length}</div>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="frame">
          <div className="label" style={{ marginBottom: 6 }}>
            Historial de movimientos
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: 30 }}>Nº</th>
                <th>Oficina</th>
                <th style={{ width: 110 }}>Fecha entrada</th>
                <th style={{ width: 110 }}>Fecha salida</th>
                <th style={{ width: 80 }}>Estado</th>
                <th style={{ width: 70 }}>Tipo</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {movs.map((m) => (
                <tr key={m.id}>
                  <td style={{ textAlign: "center" }}>{m.nromov}</td>
                  <td>{(m as any).oficina?.nombre || "—"}</td>
                  <td>{formatFechaHora(m.fechaini)}</td>
                  <td>{m.fecsarea ? formatFechaHora(m.fecsarea) : "—"}</td>
                  <td>{m.estado_resultante}</td>
                  <td>{m.tipo_movimiento}</td>
                  <td>{m.observac || ""}</td>
                </tr>
              ))}
              {movs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#666" }}>
                    Sin movimientos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Firmas */}
        <div className="row" style={{ marginTop: 24 }}>
          <div className="firma-box">Firma y sello del Operador</div>
          <div className="firma-box">Firma y sello de la Oficina Receptora</div>
        </div>
      </article>
    </div>
  );
}
