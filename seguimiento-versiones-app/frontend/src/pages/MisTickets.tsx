import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Hammer, PackageCheck, ListChecks, CircleCheck, CirclePlay } from "lucide-react";
import { useTickets } from "../hooks/useTickets";
import { useHUs } from "../hooks/useHUs";
import { useRole } from "../hooks/useRole";
import { useBitacora } from "../hooks/useBitacora";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PrioDot, EquipoRoles } from "@/components/shared";
import { Asignado, tituloSinId, descripcionATexto } from "@/lib/asignados";
import { cn } from "@/lib/utils";

type Etapa = "Pendiente" | "En curso" | "Por entregar";

/** Una fila = una relación ticket↔HU. Uno de los dos puede faltar (ticket sin HU, o HU sin ticket). */
interface MiFila {
  id: string;
  ticketId: string | null;
  ticketFriendlyId: string | null;
  ticketStatus: string | null;
  ticketTipo: "CH" | "PB" | null;
  huId: string | null;
  huFriendlyId: string | null;
  huStatus: string | null;
  huName: string | null;
  nombre: string;
  cliente: string | null;
  rfc: string | null;
  description: string | null;
  milestone: string | null;
  priority: string | null;
  fecha: string | null;
  fechaHeredadaDe: string | null;
  etapa: Etapa;
  analista: string | null;
  devs: Asignado[];
  qas: Asignado[];
  asignados: Asignado[];
}

function etapaDe(status: string): Etapa {
  if (status === "PB - Armar paquete" || status === "OP - En espera de Versión") return "Por entregar";
  if (status.startsWith("CH - Nueva") || status === "CH - En análisis" || status === "CH - En proceso de análisis")
    return "Pendiente";
  return "En curso";
}

const ETAPA_STYLE: Record<Etapa, string> = {
  Pendiente: "bg-muted text-muted-foreground",
  "En curso": "bg-accent text-accent-foreground",
  "Por entregar": "bg-success/15 text-success",
};

// Flujo real de estatus en Zoho por familia (confirmado). Los tickets pueden tener
// estatus fuera de este flujo estándar (p. ej. "CH - Aprobado por cliente", "PB - Terminado",
// ramas de excepción) — en esos casos no se fabrica una posición falsa en el recorrido.
const PIPE_CH = [
  "CH - Nueva",
  "CH - En análisis",
  "CH - Documentado",
  "CH - En aprobación de prototipo",
  "CH - Presupuesto aprobado",
];
const PIPE_PB = [
  "PB - En proceso de analisis",
  "PB - En analisis de desarrollo",
  "PB - En desarrollo",
  "PB - En revisión",
  "PB - Armar paquete",
];
// Flujo de una HU (confirmado por la usuaria). "Denegado Calidad" es una rama de rechazo
// después de "En revisión Calidad" — no continúa hacia Versiones, se marca aparte.
const PIPE_HU = [
  "OP - Para Analizar (Desarrollo/Calidad)",
  "OP - En Desarrollo",
  "OP - Por Revisar Calidad",
  "OP - En revisión Calidad",
  "OP - Revisado por calidad",
  "OP - Por Revisar Versiones",
  "OP - Por Autorizar Pro Owner",
  "OP - Revisado por versiones",
  "OP - En espera de Versión",
];
const HU_DENEGADO = "OP - Denegado Calidad";

/** Recorrido de la tarea: qué etapas ya pasó, en cuál va, y cuáles faltan. */
function Recorrido({ tipo, status, esHU }: { tipo: "CH" | "PB" | null; status: string; esHU: boolean }) {
  const stages = esHU ? PIPE_HU : tipo === "CH" ? PIPE_CH : tipo === "PB" ? PIPE_PB : null;
  const denegado = esHU && status === HU_DENEGADO;
  const curIndex = denegado ? stages!.indexOf("OP - En revisión Calidad") : stages?.indexOf(status) ?? -1;

  if (!stages || curIndex === -1) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Estatus actual: <span className="font-medium text-foreground">{status}</span>
        {stages && " (fuera del flujo estándar)"}
      </p>
    );
  }

  if (denegado) {
    return (
      <div>
        {stages.slice(0, curIndex + 1).map((s) => (
          <div key={s} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <div className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-success text-white">
                <CircleCheck className="h-3 w-3" />
              </div>
              <div className="min-h-[14px] w-0.5 flex-1 bg-destructive" />
            </div>
            <p className="pb-2.5 text-[11px] leading-tight text-foreground">{s}</p>
          </div>
        ))}
        <div className="flex gap-2.5">
          <div className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-destructive text-white">
            <span className="text-[10px] font-bold">!</span>
          </div>
          <p className="pb-2.5 text-[11px] font-semibold leading-tight text-destructive">{HU_DENEGADO}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {stages.map((s, i) => {
        const done = i < curIndex;
        const cur = i === curIndex;
        return (
          <div key={s} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full text-white",
                  done ? "bg-success" : cur ? "bg-primary" : "border border-border bg-muted"
                )}
              >
                {done ? (
                  <CircleCheck className="h-3 w-3" />
                ) : cur ? (
                  <CirclePlay className="h-2.5 w-2.5" />
                ) : null}
              </div>
              {i < stages.length - 1 && (
                <div className={cn("min-h-[14px] w-0.5 flex-1", done ? "bg-success" : "bg-border")} />
              )}
            </div>
            <p
              className={cn(
                "pb-2.5 text-[11px] leading-tight",
                cur ? "font-semibold text-foreground" : i <= curIndex ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const QUICK_ACTIONS = ["Analizado", "Prototipo enviado", "Seguimiento a cliente", "Bloqueado", "Listo para entrega"];
const PRIO_ORDER: Record<string, number> = { alta: 0, high: 0, normal: 1, medium: 1, baja: 2, low: 2 };
const POR_PAGINA = 15;
type Tab = "detalle" | "descripcion" | "equipo" | "bitacora";
const TABS: { key: Tab; label: string }[] = [
  { key: "detalle", label: "Detalle" },
  { key: "descripcion", label: "Descripción" },
  { key: "equipo", label: "Equipo" },
  { key: "bitacora", label: "Bitácora" },
];

export default function MisTickets() {
  const { perfil, user } = useRole();
  const { tickets, loading: loadingTickets } = useTickets();
  const { hus, loading: loadingHUs } = useHUs();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtroEtapa, setFiltroEtapa] = useState<Etapa | null>(null);
  const [nota, setNota] = useState("");
  const [pagina, setPagina] = useState(1);
  const [tab, setTab] = useState<Tab>("detalle");

  const miEmail = user?.email?.toLowerCase();

  // Cada fila es una relación ticket↔HU (una de las dos partes puede faltar). Un ticket con
  // varias HU genera varias filas; una HU sin ticket también sale, aunque el ticket que la
  // originó no sea "mío" (igual quiero ver en qué va).
  const misFilas = useMemo<MiFila[]>(() => {
    const soyYo = (asignados?: Asignado[]) =>
      !!miEmail && !!asignados?.some((a) => a.email?.toLowerCase() === miEmail);

    const ticketsById = new Map(tickets.map((t) => [t.id, t]));
    const husPorTicketId = new Map<string, typeof hus>();
    hus.forEach((h) => {
      h.relatedTickets.forEach((r) => {
        if (!husPorTicketId.has(r.ticketId)) husPorTicketId.set(r.ticketId, []);
        husPorTicketId.get(r.ticketId)!.push(h);
      });
    });

    const husYaUsadas = new Set<string>();
    const filas: MiFila[] = [];

    for (const t of tickets) {
      if (!soyYo(t.asignados)) continue;
      const relacionadas = husPorTicketId.get(t.id) ?? [];
      if (relacionadas.length === 0) {
        filas.push({
          id: `t-${t.id}`,
          ticketId: t.id,
          ticketFriendlyId: t.friendlyId,
          ticketStatus: t.status,
          ticketTipo: t.statusFamily === "PB" ? "PB" : "CH",
          huId: null,
          huFriendlyId: null,
          huStatus: null,
          huName: null,
          nombre: t.name,
          cliente: t.cliente,
          rfc: t.rfc,
          description: t.description,
          milestone: t.milestone,
          priority: t.priority,
          fecha: t.fechaPublicacion,
          fechaHeredadaDe: null,
          etapa: etapaDe(t.status),
          analista: t.analista,
          devs: [],
          qas: [],
          asignados: t.asignados,
        });
      } else {
        for (const h of relacionadas) {
          husYaUsadas.add(h.id);
          filas.push({
            id: `t-${t.id}-h-${h.id}`,
            ticketId: t.id,
            ticketFriendlyId: t.friendlyId,
            ticketStatus: t.status,
            ticketTipo: t.statusFamily === "PB" ? "PB" : "CH",
            huId: h.id,
            huFriendlyId: h.friendlyId,
            huStatus: h.status,
            huName: h.name,
            nombre: h.name,
            cliente: t.cliente ?? h.cliente,
            rfc: t.rfc ?? h.rfc,
            description: t.description ?? h.description,
            milestone: h.milestone ?? t.milestone,
            priority: t.priority,
            fecha: t.fechaPublicacion ?? h.fechaPublicacion,
            fechaHeredadaDe: t.fechaPublicacion ? null : h.fechaHeredadaDe ?? null,
            etapa: etapaDe(h.status),
            analista: h.analista ?? t.analista,
            devs: h.devs,
            qas: h.qas,
            asignados: h.asignados.length ? h.asignados : t.asignados,
          });
        }
      }
    }

    for (const h of hus) {
      if (husYaUsadas.has(h.id) || !soyYo(h.asignados)) continue;
      const ticketOrigen = h.relatedTickets[0] ? ticketsById.get(h.relatedTickets[0].ticketId) : null;
      filas.push({
        id: `h-${h.id}`,
        ticketId: ticketOrigen?.id ?? null,
        ticketFriendlyId: ticketOrigen?.friendlyId ?? h.relatedTickets[0]?.friendlyId ?? null,
        ticketStatus: ticketOrigen?.status ?? null,
        ticketTipo: ticketOrigen ? (ticketOrigen.statusFamily === "PB" ? "PB" : "CH") : null,
        huId: h.id,
        huFriendlyId: h.friendlyId,
        huStatus: h.status,
        huName: h.name,
        nombre: h.name,
        cliente: h.cliente ?? ticketOrigen?.cliente ?? null,
        rfc: h.rfc ?? ticketOrigen?.rfc ?? null,
        description: h.description ?? ticketOrigen?.description ?? null,
        milestone: h.milestone ?? ticketOrigen?.milestone ?? null,
        priority: ticketOrigen?.priority ?? null,
        fecha: h.fechaPublicacion,
        fechaHeredadaDe: h.fechaHeredadaDe ?? null,
        etapa: etapaDe(h.status),
        analista: h.analista,
        devs: h.devs,
        qas: h.qas,
        asignados: h.asignados,
      });
    }

    return filas.sort((a, b) => {
      if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha);
      if (a.fecha) return -1;
      if (b.fecha) return 1;
      return (PRIO_ORDER[a.priority?.toLowerCase() ?? ""] ?? 3) - (PRIO_ORDER[b.priority?.toLowerCase() ?? ""] ?? 3);
    });
  }, [tickets, hus, miEmail]);

  const counts = useMemo(
    () => ({
      total: misFilas.length,
      pendiente: misFilas.filter((f) => f.etapa === "Pendiente").length,
      enCurso: misFilas.filter((f) => f.etapa === "En curso").length,
      porEntregar: misFilas.filter((f) => f.etapa === "Por entregar").length,
    }),
    [misFilas]
  );

  const visibles = useMemo(
    () => (filtroEtapa ? misFilas.filter((f) => f.etapa === filtroEtapa) : misFilas),
    [misFilas, filtroEtapa]
  );

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  useEffect(() => {
    setPagina(1);
  }, [filtroEtapa]);
  const paginaActual = Math.min(pagina, totalPaginas);
  const visiblesPagina = useMemo(
    () => visibles.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA),
    [visibles, paginaActual]
  );

  const selected = visibles.find((f) => f.id === selectedId) ?? null;
  const { entries, addEntry } = useBitacora(selectedId ?? "", perfil?.nombre ?? "");

  useEffect(() => {
    setTab("detalle");
  }, [selectedId]);

  if (loadingTickets || loadingHUs) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const METRICAS: { etapa: Etapa | null; label: string; count: number; icon: typeof Clock }[] = [
    { etapa: null, label: "Todo lo mío", count: counts.total, icon: ListChecks },
    { etapa: "Pendiente", label: "Pendiente", count: counts.pendiente, icon: Clock },
    { etapa: "En curso", label: "En curso", count: counts.enCurso, icon: Hammer },
    { etapa: "Por entregar", label: "Por entregar", count: counts.porEntregar, icon: PackageCheck },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Mis tickets</h2>
          <p className="text-xs text-muted-foreground">Qué tengo, qué sigue y qué entrego — ordenado por urgencia.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {METRICAS.map((m) => {
            const activo = filtroEtapa === m.etapa;
            return (
              <button
                key={m.label}
                onClick={() => setFiltroEtapa(m.etapa)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activo ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
                )}
              >
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
                <span className={cn("rounded-full px-1.5 text-[10px]", activo ? "bg-primary-foreground/20" : "bg-muted")}>
                  {m.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada en esta etapa. 🎉</p>
      ) : (
        <div className={cn("grid items-start gap-3", selected && "lg:grid-cols-[minmax(0,1fr)_380px]")}>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-20">Ticket</TableHead>
                    <TableHead>Estatus ticket</TableHead>
                    <TableHead className="w-20">HU</TableHead>
                    <TableHead>Estatus HU</TableHead>
                    <TableHead>Hito</TableHead>
                    <TableHead className="w-20 text-right">Entrega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblesPagina.map((f) => (
                    <TableRow
                      key={f.id}
                      className={cn("cursor-pointer", f.id === selectedId && "bg-accent")}
                      onClick={() => setSelectedId(f.id)}
                    >
                      <TableCell>
                        <PrioDot prioridad={f.priority} />
                      </TableCell>
                      <TableCell className="font-medium text-primary">{f.ticketFriendlyId ?? "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={f.ticketStatus ?? undefined}>
                        {f.ticketStatus ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium text-primary">{f.huFriendlyId ?? "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={f.huStatus ?? undefined}>
                        {f.huStatus ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground" title={f.milestone ?? undefined}>
                        {f.milestone ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-[11px]",
                          f.fecha ? "font-medium text-destructive" : "text-muted-foreground"
                        )}
                      >
                        {f.fecha ? f.fecha.slice(5) : "sin fecha"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <span>
                  {(paginaActual - 1) * POR_PAGINA + 1}–{Math.min(paginaActual * POR_PAGINA, visibles.length)} de{" "}
                  {visibles.length}
                </span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                    disabled={paginaActual <= 1}
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                    disabled={paginaActual >= totalPaginas}
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {selected && (
            <Card className="sticky top-4 space-y-3 p-4">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <PrioDot prioridad={selected.priority} />
                  {selected.ticketFriendlyId && (
                    <span className="text-xs font-semibold text-primary">{selected.ticketFriendlyId}</span>
                  )}
                  {selected.huFriendlyId && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {selected.huFriendlyId}
                    </span>
                  )}
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", ETAPA_STYLE[selected.etapa])}>
                    {selected.etapa}
                  </span>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="ml-auto rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Cerrar detalle"
                  >
                    ✕
                  </button>
                </div>
                <p className="break-words text-sm font-semibold leading-snug">{tituloSinId(selected.nombre)}</p>
              </div>

              <div className="flex gap-1 border-b pb-2">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                      tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "detalle" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="min-w-0 rounded-md bg-muted/60 p-2">
                      <p className="text-[10px] text-muted-foreground">Cliente</p>
                      <p className="break-words">{selected.cliente ?? "—"}</p>
                    </div>
                    <div className="rounded-md bg-muted/60 p-2">
                      <p className="text-[10px] text-muted-foreground">Entrega</p>
                      <p className={cn(selected.fecha && "font-medium text-destructive")}>
                        {selected.fecha ?? "sin fecha"}
                      </p>
                      {selected.fechaHeredadaDe && (
                        <p className="text-[10px] italic text-muted-foreground">del ticket {selected.fechaHeredadaDe}</p>
                      )}
                    </div>
                    <div className="col-span-2 rounded-md bg-muted/60 p-2">
                      <p className="text-[10px] text-muted-foreground">Hito</p>
                      <p className="break-words">{selected.milestone ?? "—"}</p>
                    </div>
                  </div>

                  {selected.ticketFriendlyId && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Recorrido del ticket {selected.ticketFriendlyId}
                      </p>
                      <Recorrido tipo={selected.ticketTipo} status={selected.ticketStatus!} esHU={false} />
                    </div>
                  )}
                  {selected.huFriendlyId && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Recorrido de la HU {selected.huFriendlyId}
                      </p>
                      <Recorrido tipo={null} status={selected.huStatus!} esHU={true} />
                    </div>
                  )}
                </div>
              )}

              {tab === "descripcion" && (
                <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/60 p-2 text-[11px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {selected.description ? descripcionATexto(selected.description) : "Sin descripción capturada."}
                </div>
              )}

              {tab === "equipo" && (
                <EquipoRoles
                  devs={selected.devs}
                  qas={selected.qas}
                  analista={selected.analista}
                  asignados={selected.asignados}
                />
              )}

              {tab === "bitacora" && (
                <div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {QUICK_ACTIONS.map((label) => (
                      <Button key={label} size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => addEntry(label)}>
                        {label}
                      </Button>
                    ))}
                  </div>
                  <div className="mb-2 flex gap-1.5">
                    <Input
                      className="h-7 text-xs"
                      placeholder="Nota rápida…"
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && nota.trim()) {
                          addEntry(nota);
                          setNota("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-7"
                      onClick={() => {
                        if (nota.trim()) {
                          addEntry(nota);
                          setNota("");
                        }
                      }}
                    >
                      +
                    </Button>
                  </div>
                  <div className="max-h-64 space-y-0.5 overflow-y-auto">
                    {entries.length === 0 && <p className="text-[11px] text-muted-foreground">Sin registros todavía.</p>}
                    {entries.map((e) => (
                      <div key={e.id} className="flex items-center gap-1.5 border-b py-1 text-[11px] last:border-0">
                        <Check className="h-3 w-3 shrink-0 text-success" />
                        <span className="min-w-0 flex-1 break-words">{e.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
