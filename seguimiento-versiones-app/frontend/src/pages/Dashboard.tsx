import { useMemo } from "react";
import { PackageCheck, Hammer, SearchCheck, ListTodo, FileText, Boxes } from "lucide-react";
import { useTickets } from "../hooks/useTickets";
import { useHUs } from "../hooks/useHUs";
import { Card, CardContent } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/shared";
import { tituloSinId, analistaStyle } from "@/lib/asignados";
import { cn } from "@/lib/utils";

const ETAPAS_PIPELINE = [
  { k: "PB - En proceso de analisis", l: "En proceso de análisis" },
  { k: "PB - En analisis de desarrollo", l: "En análisis de desarrollo" },
  { k: "PB - En desarrollo", l: "En desarrollo" },
  { k: "PB - En revisión", l: "En revisión" },
  { k: "PB - Armar paquete", l: "Armar paquete" },
];

export default function Dashboard() {
  const { tickets, loading: loadingTickets } = useTickets();
  const { hus, loading: loadingHUs } = useHUs();

  const data = useMemo(() => {
    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const todo = [...tickets, ...hus];

    const porEntregarMes = todo.filter(
      (i) => i.status === "PB - Armar paquete" && i.fechaPublicacion?.startsWith(mesActual)
    ).length;
    const enDesarrollo = todo.filter((i) => i.status === "PB - En desarrollo" || i.status === "OP - En Desarrollo").length;
    const enRevision = todo.filter(
      (i) => i.status === "PB - En revisión" || i.status.includes("Revisar Calidad") || i.status.includes("revisión Calidad")
    ).length;
    const backlogCH = tickets.filter((t) => t.statusFamily === "CH").length;
    const cotizaciones = tickets.filter((t) => t.tipoDeCambio === "Cotización").length;

    const porAnalista: Record<string, number> = {};
    todo.forEach((i) => {
      if (!i.analista) return;
      porAnalista[i.analista] = (porAnalista[i.analista] ?? 0) + 1;
    });

    const pipeline = ETAPAS_PIPELINE.map((e) => ({
      ...e,
      count: todo.filter((i) => i.status === e.k).length,
    }));

    const proximas = todo
      .filter((i) => i.fechaPublicacion)
      .sort((a, b) => a.fechaPublicacion!.localeCompare(b.fechaPublicacion!))
      .slice(0, 6);

    const label = now.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    return {
      porEntregarMes,
      enDesarrollo,
      enRevision,
      backlogCH,
      cotizaciones,
      total: todo.length,
      porAnalista: Object.entries(porAnalista).sort((a, b) => b[1] - a[1]),
      pipeline,
      proximas,
      mesLabel: label.charAt(0).toUpperCase() + label.slice(1),
    };
  }, [tickets, hus]);

  if (loadingTickets || loadingHUs) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const maxAnalista = data.porAnalista[0]?.[1] ?? 1;
  const maxPipeline = Math.max(...data.pipeline.map((p) => p.count), 1);

  const STATS = [
    { label: "Por entregar este mes", value: data.porEntregarMes, icon: PackageCheck, destacado: true },
    { label: "En desarrollo", value: data.enDesarrollo, icon: Hammer },
    { label: "En revisión (dev + calidad)", value: data.enRevision, icon: SearchCheck },
    { label: "Backlog de cambios", value: data.backlogCH, icon: ListTodo },
    { label: "Cotizaciones activas", value: data.cotizaciones, icon: FileText },
    { label: "Total sincronizado", value: data.total, icon: Boxes },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-xs text-muted-foreground">{data.mesLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {STATS.map((s) => (
          <Card key={s.label} className={cn(s.destacado && "border-destructive/40 bg-destructive/10")}>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-1.5">
                <s.icon className={cn("h-3.5 w-3.5", s.destacado ? "text-destructive" : "text-muted-foreground")} />
                <p className={cn("text-[11px] leading-tight", s.destacado ? "text-destructive" : "text-muted-foreground")}>
                  {s.label}
                </p>
              </div>
              <p className={cn("text-2xl font-semibold", s.destacado && "text-destructive")}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold">Pipeline de desarrollo</p>
              <div className="space-y-2.5">
                {data.pipeline.map((p) => (
                  <div key={p.k} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 truncate text-xs text-muted-foreground">{p.l}</span>
                    <div className="h-2.5 min-w-0 flex-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(p.count / maxPipeline) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs font-medium">{p.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold">Carga por analista</p>
              <div className="space-y-2.5">
                {data.porAnalista.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sin analistas identificados todavía.</p>
                )}
                {data.porAnalista.map(([nombre, count]) => {
                  const st = analistaStyle(nombre);
                  return (
                    <div key={nombre} className="flex items-center gap-3">
                      <InitialsAvatar name={nombre} />
                      <span className="w-36 shrink-0 truncate text-xs">{nombre}</span>
                      <div className="h-2.5 min-w-0 flex-1 rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", st.dot)}
                          style={{ width: `${(count / maxAnalista) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-xs font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Próximas entregas</p>
            {data.proximas.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nada con fecha comprometida.</p>
            ) : (
              <div className="space-y-2">
                {data.proximas.map((i) => {
                  const st = analistaStyle(i.analista);
                  return (
                    <div key={i.id} className={cn("flex min-w-0 items-center gap-2.5 rounded-lg border border-l-4 bg-card p-2.5", st.border)}>
                      <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
                        <span className="text-sm font-semibold leading-none">
                          {i.fechaPublicacion!.slice(8)}
                        </span>
                        <span className="text-[9px] uppercase text-muted-foreground">
                          {new Date(i.fechaPublicacion + "T00:00:00").toLocaleDateString("es-MX", { month: "short" })}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          <span className="text-primary">{i.friendlyId ?? "HU"}</span> · {tituloSinId(i.name)}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {i.cliente ?? "—"}
                          {i.analista ? ` · ${i.analista}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
