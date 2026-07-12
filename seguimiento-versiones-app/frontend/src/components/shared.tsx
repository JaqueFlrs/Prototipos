import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Asignado, areaLabel } from "@/lib/asignados";

export function TypeBadge({ tipo }: { tipo: "CH" | "PB" | "HU" | string }) {
  if (tipo === "CH") return <Badge variant="ch">Cambio</Badge>;
  if (tipo === "PB") return <Badge variant="pb">Error</Badge>;
  return <Badge variant="success">HU sin ticket</Badge>;
}

const PRIO_COLOR: Record<string, string> = {
  alta: "bg-destructive",
  high: "bg-destructive",
  normal: "bg-warning",
  medium: "bg-warning",
  baja: "bg-success",
  low: "bg-success",
};

export function PrioDot({ prioridad, className }: { prioridad?: string | null; className?: string }) {
  if (!prioridad) return null;
  return (
    <span
      title={`Prioridad ${prioridad}`}
      className={cn("inline-block h-2.5 w-2.5 rounded-full shrink-0", PRIO_COLOR[prioridad.toLowerCase()] ?? "bg-muted-foreground", className)}
    />
  );
}

export function InitialsAvatar({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return null;
  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Avatar className={cn("h-6 w-6", className)} title={name}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

/** Referencia a un ticket por su ID amigable (#1234) — no el ID interno de Zoho. */
export function TicketRef({ friendlyId }: { friendlyId?: string | null }) {
  if (!friendlyId) return <span className="text-xs text-muted-foreground">Sin ticket</span>;
  return <span className="text-xs font-medium text-primary">{friendlyId}</span>;
}

/** Todas las personas asignadas a un ticket/HU, con su área (Versiones/Desarrollo/Calidad...). */
export function AsignadosList({ asignados }: { asignados?: Asignado[] }) {
  if (!asignados || asignados.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin asignar todavía.</p>;
  }
  return (
    <div className="space-y-1.5">
      {asignados.map((a) => (
        <div key={a.email || a.nombre} className="flex items-center gap-2">
          <InitialsAvatar name={a.nombre} className="h-5 w-5" />
          <span className="text-xs">{a.nombre}</span>
          <span className="text-[10px] text-muted-foreground">· {areaLabel(a.area)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Equipo de una HU agrupado por rol real (Analista / Desarrollo / Calidad), derivado de
 * las subtareas "DEV - "/"QA - ". Si no hay devs/qas identificados (p. ej. un ticket sin
 * HU), cae de vuelta a la lista plana de asignados.
 */
export function EquipoRoles({
  devs,
  qas,
  analista,
  asignados,
}: {
  devs?: Asignado[];
  qas?: Asignado[];
  analista?: string | null;
  asignados?: Asignado[];
}) {
  const hayRoles = (devs && devs.length > 0) || (qas && qas.length > 0);
  if (!hayRoles) return <AsignadosList asignados={asignados} />;

  return (
    <div className="space-y-2.5">
      {analista && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Analista</p>
          <div className="mt-0.5 flex items-center gap-2">
            <InitialsAvatar name={analista} className="h-5 w-5" />
            <span className="text-xs">{analista}</span>
          </div>
        </div>
      )}
      {devs && devs.length > 0 && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Desarrollo</p>
          <div className="mt-0.5 space-y-1">
            {devs.map((a) => (
              <div key={a.email || a.nombre} className="flex items-center gap-2">
                <InitialsAvatar name={a.nombre} className="h-5 w-5" />
                <span className="text-xs">{a.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {qas && qas.length > 0 && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Calidad</p>
          <div className="mt-0.5 space-y-1">
            {qas.map((a) => (
              <div key={a.email || a.nombre} className="flex items-center gap-2">
                <InitialsAvatar name={a.nombre} className="h-5 w-5" />
                <span className="text-xs">{a.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Fila compacta (para tarjetas) de avatares de los asignados, con tooltip del nombre+área. */
export function AsignadosRow({ asignados }: { asignados?: Asignado[] }) {
  if (!asignados || asignados.length === 0) return null;
  return (
    <div className="flex -space-x-1.5">
      {asignados.slice(0, 4).map((a) => (
        <InitialsAvatar key={a.email || a.nombre} name={a.nombre} className="h-5 w-5 ring-2 ring-card" />
      ))}
    </div>
  );
}
