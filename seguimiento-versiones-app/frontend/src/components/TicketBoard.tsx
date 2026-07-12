import { useMemo, useState } from "react";
import { UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrioDot, AsignadosRow } from "@/components/shared";
import { tituloSinId } from "@/lib/asignados";
import { Ticket } from "@/hooks/useTickets";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

export const CH_COLS = [
  { k: "CH - Nueva", l: "CH · Nueva" },
  { k: "CH - En análisis", l: "CH · En análisis" },
  { k: "CH - Documentado", l: "CH · Documentado" },
  { k: "CH - En aprobación de prototipo", l: "CH · En aprobación de prototipo" },
  { k: "CH - Presupuesto aprobado", l: "CH · Presupuesto aprobado", ok: true },
];

function TicketCard({ t, esMio }: { t: Ticket; esMio: boolean }) {
  return (
    <Card className={cn("mb-2 min-w-0 p-3", esMio && "ring-2 ring-primary/60")}>
      <div className="mb-1.5 flex min-w-0 items-center gap-2">
        <PrioDot prioridad={t.priority} />
        <span className="truncate text-xs font-medium text-primary">{t.friendlyId}</span>
        {esMio && <UserCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
        {t.tipoDeCambio === "Cotización" && (
          <span className="ml-auto shrink-0 rounded-full bg-[hsl(var(--ch-bg))] px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--ch))]">
            Cotización
          </span>
        )}
      </div>
      <p className="mb-1.5 break-words text-xs leading-snug">{tituloSinId(t.name)}</p>
      {t.cliente && (
        <p className="mb-1.5 break-words text-[11px] text-muted-foreground">
          {t.cliente}
          {t.moduloERP ? ` · ${t.moduloERP}` : ""}
        </p>
      )}
      <div className="flex justify-end">
        <AsignadosRow asignados={t.asignados} />
      </div>
    </Card>
  );
}

export default function TicketBoard({ tickets }: { tickets: Ticket[] }) {
  const { user } = useRole();
  const [soloMios, setSoloMios] = useState(false);
  const miEmail = user?.email?.toLowerCase();

  const esMio = (t: Ticket) => !!miEmail && t.asignados?.some((a) => a.email?.toLowerCase() === miEmail);

  const visibles = useMemo(() => (soloMios ? tickets.filter(esMio) : tickets), [tickets, soloMios, miEmail]);
  const misCount = useMemo(() => tickets.filter(esMio).length, [tickets, miEmail]);

  return (
    <div>
      <div className="mb-3">
        <Button size="sm" variant={soloMios ? "default" : "outline"} onClick={() => setSoloMios((v) => !v)}>
          <UserCheck className="h-3.5 w-3.5" /> Solo lo mío ({misCount})
        </Button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {CH_COLS.map((col) => {
          const items = visibles.filter((t) => t.status === col.k);
          return (
            <div key={col.k} className="w-64 shrink-0 rounded-xl bg-muted/50 p-2.5">
              <div
                className={cn(
                  "mb-2 flex items-center justify-between text-[11px] font-medium",
                  col.ok ? "text-success" : "text-muted-foreground"
                )}
              >
                <span className="min-w-0 break-words">{col.l}</span>
                <span className="shrink-0">{items.length}</span>
              </div>
              {items.map((t) => (
                <TicketCard key={t.id} t={t} esMio={esMio(t)} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
