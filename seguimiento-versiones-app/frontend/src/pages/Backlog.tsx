import { useTickets } from "../hooks/useTickets";
import TicketBoard from "@/components/TicketBoard";

export default function Backlog() {
  const { tickets, loading } = useTickets("CH");

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Backlog Versiones</h2>
        <p className="text-xs text-muted-foreground">
          Ciclo de cambio/cotización por estatus CH. Los cancelados/terminados ya no aparecen aquí.
        </p>
      </div>
      <TicketBoard tickets={tickets} />
    </div>
  );
}
