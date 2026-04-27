import type { Estado } from "@/lib/expedientes";
import { cn } from "@/lib/utils";

const colors: Record<Estado, string> = {
  Pendiente: "bg-[var(--estado-pendiente)] text-white",
  Demorado: "bg-[var(--estado-demorado)] text-white",
  Archivado: "bg-[var(--estado-archivado)] text-white",
  Finalizado: "bg-[var(--estado-finalizado)] text-white",
};

export function EstadoBadge({ estado, className }: { estado: Estado; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide",
        colors[estado],
        className,
      )}
    >
      {estado}
    </span>
  );
}
