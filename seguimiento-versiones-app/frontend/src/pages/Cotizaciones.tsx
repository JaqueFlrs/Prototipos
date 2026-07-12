import { useMemo } from "react";
import { useTickets } from "../hooks/useTickets";
import TicketBoard from "@/components/TicketBoard";

export default function Cotizaciones() {
  const { tickets, loading } = useTickets("CH");
  const cotizables = useMemo(() => tickets.filter((t) => t.tipoDeCambio === "Cotización"), [tickets]);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Cotizaciones</h2>
        <p className="text-xs text-muted-foreground">
          Backlog filtrado a tipo de cambio = Cotización. Si el cliente no contesta o rechaza, el ticket pasa a
          CH · Cancelado / En pausa.
        </p>
      </div>
      <TicketBoard tickets={cotizables} />
    </div>
  );
}
