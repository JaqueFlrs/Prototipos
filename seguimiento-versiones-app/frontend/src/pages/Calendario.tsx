import { Fragment, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useTickets } from "../hooks/useTickets";
import { useHUs } from "../hooks/useHUs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EquipoRoles } from "@/components/shared";
import { Asignado, tituloSinId, descripcionATexto, analistaStyle } from "@/lib/asignados";
import { cn } from "@/lib/utils";

interface Entrega {
  id: string;
  friendlyId: string | null;
  name: string;
  cliente: string | null;
  rfc: string | null;
  description: string | null;
  fechaPublicacion: string;
  /** Si la fecha se copió de un ticket relacionado (las HU casi nunca traen fecha propia). */
  fechaHeredadaDe: string | null;
  analista: string | null;
  asignados: Asignado[];
  devs: Asignado[];
  qas: Asignado[];
}

export default function Calendario() {
  const { tickets, loading: loadingTickets } = useTickets();
  const { hus, loading: loadingHUs } = useHUs();
  const [overrideDay, setOverrideDay] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Entrega | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filtroAnalista, setFiltroAnalista] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const hoy = new Date();
  const [mesGrid, setMesGrid] = useState({ year: hoy.getFullYear(), month: hoy.getMonth() }); // month: 0-11

  // El ticket puede no traer analista directo, pero su HU relacionada sí.
  const analistaViaHU = useMemo(() => {
    const map: Record<string, string> = {};
    hus.forEach((h) => {
      if (!h.analista) return;
      h.relatedTickets.forEach((r) => {
        if (!map[r.ticketId]) map[r.ticketId] = h.analista!;
      });
    });
    return map;
  }, [hus]);

  // Tickets + HU con fecha comprometida, tengan o no analista identificado.
  const conEntrega = useMemo<Entrega[]>(() => {
    const deTickets: Entrega[] = tickets
      .filter((t) => t.fechaPublicacion)
      .map((t) => ({
        id: t.id,
        friendlyId: t.friendlyId,
        name: t.name,
        cliente: t.cliente,
        rfc: t.rfc,
        description: t.description,
        fechaPublicacion: t.fechaPublicacion!,
        fechaHeredadaDe: null,
        analista: t.analista ?? analistaViaHU[t.id] ?? null,
        asignados: t.asignados,
        devs: [],
        qas: [],
      }));
    const deHUs: Entrega[] = hus
      .filter((h) => h.fechaPublicacion)
      .map((h) => ({
        id: h.id,
        friendlyId: h.friendlyId,
        name: h.name,
        cliente: h.cliente,
        rfc: h.rfc,
        description: h.description,
        fechaPublicacion: h.fechaPublicacion!,
        fechaHeredadaDe: h.fechaHeredadaDe ?? null,
        analista: h.analista,
        asignados: h.asignados,
        devs: h.devs,
        qas: h.qas,
      }));
    return [...deTickets, ...deHUs];
  }, [tickets, hus, analistaViaHU]);

  const dayOf = (e: Entrega) => overrideDay[e.id] ?? new Date(e.fechaPublicacion + "T00:00:00").getDate();

  const analistas = useMemo(
    () => Array.from(new Set(conEntrega.map((e) => e.analista).filter(Boolean) as string[])),
    [conEntrega]
  );

  const visibles = useMemo(
    () => (filtroAnalista ? conEntrega.filter((e) => e.analista === filtroAnalista) : conEntrega),
    [conEntrega, filtroAnalista]
  );

  // El grid solo pinta el mes seleccionado (navegable); la tabla de abajo lista todo
  // (incluye atrasadas de meses anteriores, que son las más urgentes), agrupada por
  // cliente y con buscador.
  const mesGridStr = `${mesGrid.year}-${String(mesGrid.month + 1).padStart(2, "0")}`;
  const visiblesDelMes = useMemo(
    () => visibles.filter((e) => e.fechaPublicacion.startsWith(mesGridStr)),
    [visibles, mesGridStr]
  );

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return visibles;
    return visibles.filter(
      (e) =>
        (e.friendlyId ?? "").toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        (e.cliente ?? "").toLowerCase().includes(q) ||
        (e.analista ?? "").toLowerCase().includes(q)
    );
  }, [visibles, busqueda]);

  const porCliente = useMemo(() => {
    const grupos = new Map<string, Entrega[]>();
    filtradas.forEach((e) => {
      const key = e.cliente || "Sin cliente";
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(e);
    });
    return Array.from(grupos.entries())
      .map(([cliente, entregas]) => ({
        cliente,
        entregas: entregas.sort((a, b) => a.fechaPublicacion.localeCompare(b.fechaPublicacion)),
      }))
      .sort((a, b) => a.entregas[0].fechaPublicacion.localeCompare(b.entregas[0].fechaPublicacion));
  }, [filtradas]);

  if (loadingTickets || loadingHUs) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const daysInMonth = new Date(mesGrid.year, mesGrid.month + 1, 0).getDate();
  const firstDow = new Date(mesGrid.year, mesGrid.month, 1).getDay();
  const mesLabelRaw = new Date(mesGrid.year, mesGrid.month, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
  const mesLabel = mesLabelRaw.charAt(0).toUpperCase() + mesLabelRaw.slice(1);

  function onDrop(day: number) {
    if (!dragId) return;
    setOverrideDay((prev) => ({ ...prev, [dragId]: day }));
    setDragId(null);
    setToast("Movimiento solo visual — el sync con Zoho es de solo lectura por ahora.");
    setTimeout(() => setToast(null), 2500);
  }

  function cambiarMes(delta: number) {
    setMesGrid((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Calendario de entregas</h2>
          <p className="text-xs text-muted-foreground">
            Cada color es un analista — da clic en su nombre para filtrar. Clic en una entrega para ver el detalle.
          </p>
        </div>
        {analistas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {analistas.map((nombre) => {
              const st = analistaStyle(nombre);
              const activo = filtroAnalista === nombre;
              return (
                <button
                  key={nombre}
                  onClick={() => setFiltroAnalista(activo ? null : nombre)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                    st.chip,
                    activo ? "ring-2 ring-primary" : "opacity-90 hover:opacity-100"
                  )}
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", st.dot)} />
                  {nombre}
                </button>
              );
            })}
            {filtroAnalista && (
              <button
                onClick={() => setFiltroAnalista(null)}
                className="rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Quitar filtro
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center justify-center gap-3">
        <button
          onClick={() => cambiarMes(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border bg-card hover:bg-accent"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[140px] text-center text-sm font-semibold">{mesLabel}</span>
        <button
          onClick={() => cambiarMes(1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border bg-card hover:bg-accent"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {(mesGrid.year !== hoy.getFullYear() || mesGrid.month !== hoy.getMonth()) && (
          <button
            onClick={() => setMesGrid({ year: hoy.getFullYear(), month: hoy.getMonth() })}
            className="rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Hoy
          </button>
        )}
      </div>

      <Card className="overflow-x-auto p-3">
        <div className="min-w-[1000px]">
          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
            {["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const entries = visiblesDelMes.filter((e) => dayOf(e) === day);
              return (
                <div
                  key={day}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(day)}
                  className={cn(
                    "flex min-h-[128px] min-w-0 flex-col gap-1.5 rounded-lg border bg-card p-2 text-xs",
                    entries.length > 0 && "bg-muted/30"
                  )}
                >
                  <span className="text-[11px] font-medium text-muted-foreground">{day}</span>
                  {entries.map((e) => {
                    const st = analistaStyle(e.analista);
                    return (
                      <div
                        key={e.id}
                        draggable
                        onDragStart={() => setDragId(e.id)}
                        onClick={() => setSelected(e)}
                        className={cn(
                          "min-w-0 cursor-grab rounded-md border-l-4 bg-muted px-2 py-1.5 leading-tight transition-colors hover:bg-accent",
                          st.border
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[11px] font-semibold text-primary">
                            {e.friendlyId ?? "HU"}
                          </span>
                          <span className="shrink-0 text-[9px] font-medium text-destructive">
                            {new Date(e.fechaPublicacion + "T00:00:00").toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-foreground/80">{tituloSinId(e.name)}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{e.cliente || "Sin cliente"}</p>
                        {e.fechaHeredadaDe && (
                          <p className="truncate text-[9px] italic text-muted-foreground/80">
                            Fecha de {e.fechaHeredadaDe}
                          </p>
                        )}
                        {e.analista && (
                          <span
                            className={cn(
                              "mt-1 inline-block max-w-full truncate rounded px-1 py-px text-[9px] font-medium",
                              st.chip
                            )}
                          >
                            {e.analista.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            Próximas entregas <span className="font-normal text-muted-foreground">({filtradas.length})</span>
          </p>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar por ticket, título, cliente o analista…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {porCliente.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada que mostrar con estos filtros.</p>
        ) : (
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Entrega</TableHead>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Analista</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porCliente.map(({ cliente, entregas }) => (
                  <Fragment key={cliente}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={4} className="py-1.5 text-xs font-semibold">
                        {cliente}{" "}
                        <span className="font-normal text-muted-foreground">({entregas.length})</span>
                      </TableCell>
                    </TableRow>
                    {entregas.map((e) => {
                      const st = analistaStyle(e.analista);
                      return (
                        <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                          <TableCell className="text-xs">
                            {new Date(e.fechaPublicacion + "T00:00:00").toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </TableCell>
                          <TableCell className="font-medium text-primary">{e.friendlyId ?? "HU"}</TableCell>
                          <TableCell className="max-w-md break-words text-xs">{tituloSinId(e.name)}</TableCell>
                          <TableCell>
                            {e.analista ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  st.chip
                                )}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                                {e.analista}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Sin asignar</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg border bg-card px-4 py-2 text-xs shadow-lg">
          {toast}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", analistaStyle(selected.analista).dot)} />
                  {selected.friendlyId ?? "HU"}
                </DialogTitle>
                <DialogDescription className="break-words">{tituloSinId(selected.name)}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Cliente</p>
                  <p className="break-words">{selected.cliente}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">RFC</p>
                  <p className="break-words">{selected.rfc ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground">Entrega comprometida</p>
                  <p className="text-destructive">
                    {selected.fechaPublicacion}
                    {selected.fechaHeredadaDe && (
                      <span className="ml-1.5 text-[11px] font-normal italic text-muted-foreground">
                        (fecha del ticket {selected.fechaHeredadaDe})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Quién trae qué
                </p>
                <EquipoRoles
                  devs={selected.devs}
                  qas={selected.qas}
                  analista={selected.analista}
                  asignados={selected.asignados}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Contexto
                </p>
                <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-relaxed [overflow-wrap:anywhere]">
                  {descripcionATexto(selected.description) || "Sin descripción capturada."}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
