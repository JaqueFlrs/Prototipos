import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Asignado } from "../lib/asignados";

export interface Ticket {
  id: string;
  friendlyId: string | null;
  name: string;
  statusFamily: "CH" | "PB" | "ST" | "OTRO";
  status: string;
  priority: string;
  cliente: string | null;
  rfc: string | null;
  /** Todas las personas asignadas (puede ser más de una: analista, desarrollador, calidad...). */
  asignados: Asignado[];
  /** El analista "de Versiones" ya resuelto (excluye a Maricruz/Adrian cuando hay alguien más). */
  analista: string | null;
  dev: string | null;
  fechaPublicacion: string | null;
  moduloERP: string | null;
  tipoDeCambio: string | null;
  description: string | null;
  ticketUrl: string | null;
  milestone: string | null;
  tasklist: string | null;
  /** true si nadie del depto Versiones (analista/dev/calidad) está asignado — soporte externo, no se rastrea. */
  fueraDeAlcance?: boolean;
}

// Regla de negocio acordada: un ticket CH cancelado o terminado ya no es "pendiente".
const ESTATUS_OCULTOS_DE_PENDIENTES = ["CH - Cancelado", "CH - Terminado"];

/** Tickets de una familia (CH/PB), excluyendo cancelados/terminados por default. */
export function useTickets(statusFamily?: "CH" | "PB", opts?: { includeFinalizados?: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const col = collection(db, "tickets");
    const q = statusFamily ? query(col, where("statusFamily", "==", statusFamily)) : query(col);
    return onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, asignados: [], ...d.data() }) as unknown as Ticket)
        .filter((t) => !t.fueraDeAlcance);
      const visible = opts?.includeFinalizados
        ? all
        : all.filter((t) => !ESTATUS_OCULTOS_DE_PENDIENTES.includes(t.status));
      setTickets(visible);
      setLoading(false);
    });
  }, [statusFamily, opts?.includeFinalizados]);

  return { tickets, loading };
}
