import { useEffect, useState } from "react";
import { useReleases } from "../hooks/useReleases";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TypeBadge, AsignadosRow } from "@/components/shared";
import { tituloSinId } from "@/lib/asignados";
import { cn } from "@/lib/utils";

export default function Liberaciones() {
  const { releases, loading } = useReleases();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && releases.length > 0) setSelectedId(releases[0].id);
  }, [releases, selectedId]);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const selected = releases.find((r) => r.id === selectedId);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Liberaciones</h2>
        <p className="text-xs text-muted-foreground">
          Qué historias (HU) van en cada versión o paquete. Elige una liberación a la izquierda.
        </p>
      </div>

      {releases.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay liberaciones sincronizadas de Zoho.
        </p>
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-64 shrink-0 space-y-2">
            {releases.map((r) => (
              <Card
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  "cursor-pointer p-3 transition-colors",
                  r.id === selectedId && "border-primary bg-accent"
                )}
              >
                <p className="text-[13px] font-semibold leading-snug">{r.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      r.estado === "Liberada" ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"
                    )}
                  >
                    {r.estado}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {r.hus.length} HU · {r.fecha}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {selected && (
            <div className="min-w-[280px] flex-1 space-y-3">
              <Card>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-base font-semibold">{selected.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Fecha objetivo: {selected.fecha} · {selected.hus.length} historias
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      selected.estado === "Liberada" ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"
                    )}
                  >
                    {selected.estado}
                  </span>
                </CardContent>
              </Card>

              <Card className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>HU</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Asignados</TableHead>
                      <TableHead>Estatus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.hus.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium text-primary">{h.friendlyId ?? "HU"}</TableCell>
                        <TableCell className="max-w-xs">{tituloSinId(h.name)}</TableCell>
                        <TableCell>{h.moduloERP}</TableCell>
                        <TableCell>{h.cliente}</TableCell>
                        <TableCell>
                          <TypeBadge tipo={h.origen} />
                        </TableCell>
                        <TableCell>
                          <AsignadosRow asignados={h.asignados} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
