import { z } from "zod";

export const ESTADOS = ["Pendiente", "Demorado", "Archivado", "Finalizado"] as const;
export type Estado = (typeof ESTADOS)[number];

export const TIPOS_MOV = ["Normal", "Reapertura"] as const;
export type TipoMov = (typeof TIPOS_MOV)[number];

export function buildCodexp(codigo: number, ano: number, nro: number, letra: string) {
  const codPad = String(codigo).padStart(6, "0");
  const anoPad = String(ano).padStart(4, "0");
  const nroPad = String(nro).padStart(6, "0");
  return `${codPad}-${anoPad}-${nroPad}-${letra.toUpperCase()}`;
}

export const expedienteSchema = z.object({
  codigo: z.coerce.number().int().min(1).max(9999),
  anoexp: z.coerce.number().int().min(1900).max(2100),
  nroexp: z.coerce.number().int().min(1).max(999999),
  letraexp: z
    .string()
    .trim()
    .min(1)
    .max(2)
    .regex(/^[A-Za-z]+$/, "Solo letras"),
  apeynom: z.string().trim().min(1).max(200),
  fechent: z.string().min(1),
  organismo: z.string().trim().min(1).max(200),
  tema: z.string().trim().min(1).max(200),
  oficina_inicial_id: z.string().uuid(),
  iniciado_por: z.string().trim().max(100).optional().or(z.literal("")),
  iniciado_nro: z.string().trim().max(50).optional().or(z.literal("")),
  tipo_objeto: z.string().trim().max(100).optional().or(z.literal("")),
  nro_objeto: z.string().trim().max(50).optional().or(z.literal("")),
  nro_acta: z.string().trim().max(50).optional().or(z.literal("")),
  infraccion: z.string().trim().max(200).optional().or(z.literal("")),
  oficina_inicio_id: z.string().uuid().optional().or(z.literal("")),
  nro_juzgado: z.string().trim().max(50).optional().or(z.literal("")),
  comentario: z.string().trim().max(2000).optional().or(z.literal("")),
  ultima_nota: z.string().trim().max(200).optional().or(z.literal("")),
  operador: z.string().trim().min(1).max(100),
});

export const movimientoSchema = z.object({
  oficina_id: z.string().uuid(),
  estado_resultante: z.enum(ESTADOS),
  tipo_movimiento: z.enum(TIPOS_MOV).default("Normal"),
  observac: z.string().trim().max(1000).optional().or(z.literal("")),
  operador: z.string().trim().min(1).max(100),
});

export const oficinaSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  activa: z.boolean().default(true),
});

export const ESTADO_COLOR: Record<Estado, string> = {
  Pendiente: "bg-[--estado-pendiente] text-white",
  Demorado: "bg-[--estado-demorado] text-white",
  Archivado: "bg-[--estado-archivado] text-white",
  Finalizado: "bg-[--estado-finalizado] text-white",
};

export function formatFecha(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function formatFechaHora(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}
