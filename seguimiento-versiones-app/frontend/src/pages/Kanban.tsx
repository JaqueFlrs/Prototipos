import { useMemo, useState } from "react";
import { LayoutGrid, List as ListIcon, UserCheck } from "lucide-react";
import { useHUs } from "../hooks/useHUs";
import { useTickets } from "../hooks/useTickets";
import { useRole } from "../hooks/useRole";
import { Asignado, tituloSinId } from "../lib/asignados";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PrioDot, TicketRef, TypeBadge, AsignadosRow } from "@/components/shared";
import { cn } from "@/lib/utils";

// Nombres reales de estatus en Zoho (ojo: "analisis" sin acento en dos de ellos).
const PB_COLS = [
  { k: "PB - En proceso de analisis", l: "En proceso de análisis" },
  { k: "PB - En analisis de desarrollo", l: "En análisis de desarrollo" },
  { k: "PB - En desarrollo", l: "En desarrollo" },
  { k: "PB - En revisión", l: "En revisión" },
  { k: "PB - Armar paquete", l: "Armar paquete" },
];

interface BoardItem {
  id: string;
  friendlyId: string | null;
  name: string;
  cliente: string | null;
  moduloERP: string | null;
  asignados: Asignado[];
  priority?: string | null;
  tipo: "CH" | "PB" | "HU";
  esHU: boolean;
  originFriendlyId?: string | null;
  status: string;
}

function ItemCard({ item, esMio }: { item: BoardItem; esMio: boolean }) {
  return (
    <Card className={cn("mb-2 min-w-0 p-3", esMio && "ring-2 ring-primary/60")}>
      <div className="mb-1.5 flex min-w-0 items-center gap-2">
        <PrioDot prioridad={item.priority} />
        <span className="truncate text-xs font-semibold text-primary">
          {item.esHU ? item.friendlyId ?? "HU" : item.friendlyId}
        </span>
        {esMio && <UserCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
      </div>
      <p className="mb-1.5 break-words text-xs leading-snug">{tituloSinId(item.name)}</p>
      {item.cliente && (
        <p className="mb-1.5 break-words text-[11px] text-muted-foreground">
          {item.cliente}
          {item.moduloERP ? ` · ${item.moduloERP}` : ""}
        </p>
      )}
      <p className="mb-1.5 text-[10px] text-muted-foreground">
        {item.esHU ? (
          item.originFriendlyId ? (
            <>
              De <TicketRef friendlyId={item.originFriendlyId} />
            </>
          ) : (
            "HU sin ticket de origen"
          )
        ) : (
          "Ticket directo (sin HU)"
        )}
      </p>
      <div className="flex justify-end">
        <AsignadosRow asignados={item.asignados} />
      </div>
    </Card>
  );
}

export default function Kanban() {
  const { hus, loading: loadingHUs } = useHUs();
  const { tickets, loading: loadingTickets } = useTickets("PB");
  const { user } = useRole();
  const [filter, setFilter] = useState<"todos" | "CH" | "PB">("todos");
  const [view, setView] = useState<"board" | "list">("board");
  const [soloMios, setSoloMios] = useState(false);

  const miEmail = user?.email?.toLowerCase();
  const esMio = (i: BoardItem) => !!miEmail && i.asignados?.some((a) => a.email?.toLowerCase() === miEmail);

  const items = useMemo<BoardItem[]>(() => {
    const fromTickets: BoardItem[] = tickets.map((t) => ({
      id: t.id,
      friendlyId: t.friendlyId,
      name: t.name,
      cliente: t.cliente,
      moduloERP: t.moduloERP,
      asignados: t.asignados,
      priority: t.priority,
      tipo: "PB",
      esHU: false,
      status: t.status,
    }));
    const ticketsById = new Map(tickets.map((t) => [t.id, t]));
    const fromHUs: BoardItem[] = hus
      .filter((h) => h.status.startsWith("PB -"))
      .map((h) => {
        const originId = h.relatedTickets[0]?.ticketId;
        return {
          id: h.id,
          friendlyId: h.friendlyId,
          name: h.name,
          cliente: h.cliente,
          moduloERP: h.moduloERP,
          asignados: h.asignados,
          tipo: h.origen,
          esHU: true,
          originFriendlyId: originId ? ticketsById.get(originId)?.friendlyId : null,
          status: h.status,
        };
      });
    return [...fromTickets, ...fromHUs];
  }, [tickets, hus]);

  const misCount = useMemo(() => items.filter(esMio).length, [items, miEmail]);

  const filtered = useMemo(() => {
    let out = filter === "todos" ? items : items.filter((i) => i.tipo === filter);
    if (soloMios) out = out.filter(esMio);
    return out;
  }, [items, filter, soloMios, miEmail]);

  if (loadingHUs || loadingTickets) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Kanban por mes</h2>
          <p className="text-xs text-muted-foreground">
            Los errores (PB) entran directo; las HU de cambios (CH) se muestran con su ticket de origen.
          </p>
        </div>
        <Select defaultValue="julio-2026">
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="julio-2026">Kanban Julio 2026</SelectItem>
            <SelectItem value="junio-2026">Kanban Junio 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(["todos", "CH", "PB"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "todos" ? "Todos" : f === "CH" ? "Cambios" : "Errores"}
            </Button>
          ))}
          <Button size="sm" variant={soloMios ? "default" : "outline"} onClick={() => setSoloMios((v) => !v)}>
            <UserCheck className="h-3.5 w-3.5" /> Solo lo mío ({misCount})
          </Button>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant={view === "board" ? "default" : "outline"} onClick={() => setView("board")}>
            <LayoutGrid className="h-3.5 w-3.5" /> Tablero
          </Button>
          <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
            <ListIcon className="h-3.5 w-3.5" /> Lista
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <div className="flex gap-2.5 overflow-x-auto pb-2">
          {PB_COLS.map((col) => {
            const colItems = filtered.filter((i) => i.status === col.k);
            return (
              <div key={col.k} className="w-64 shrink-0 rounded-xl bg-muted/50 p-2.5">
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span className="min-w-0 break-words">{col.l}</span>
                  <span className="shrink-0">{colItems.length}</span>
                </div>
                {colItems.map((item) => (
                  <ItemCard key={item.id} item={item} esMio={esMio(item)} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Asignados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className={cn(esMio(item) && "bg-primary/5")}>
                  <TableCell className="font-medium text-primary">
                    {item.esHU ? item.friendlyId ?? "HU" : item.friendlyId}
                  </TableCell>
                  <TableCell className="max-w-xs break-words">{tituloSinId(item.name)}</TableCell>
                  <TableCell>
                    <TicketRef friendlyId={item.originFriendlyId} />
                  </TableCell>
                  <TableCell>
                    <TypeBadge tipo={item.tipo} />
                  </TableCell>
                  <TableCell className="max-w-[180px] break-words">{item.cliente}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.status}</TableCell>
                  <TableCell>
                    <AsignadosRow asignados={item.asignados} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
