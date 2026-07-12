import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Asignado } from "../lib/asignados";

export interface HU {
  id: string;
  friendlyId: string | null;
  name: string;
  status: string;
  origen: "CH" | "PB" | "HU";
  asignados: Asignado[];
  analista: string | null;
  dev: string | null;
  devs: Asignado[];
  qas: Asignado[];
  moduloERP: string | null;
  cliente: string | null;
  milestone: string | null;
  relatedTickets: { ticketId: string; friendlyId: string | null; rel: "subtarea" | "predecesora" | "sucesora" | "parent" }[];
  fechaPublicacion: string | null;
  /** Ticket del que se copió la fecha (la HU casi nunca trae fecha propia). Null si es propia o no hay fecha. */
  fechaHeredadaDe?: string | null;
  rfc: string | null;
  description: string | null;
  /** true si nadie del depto Versiones (analista/dev/calidad) está identificado — soporte externo, no se rastrea. */
  fueraDeAlcance?: boolean;
}

export function useHUs() {
  const [hus, setHus] = useState<HU[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(query(collection(db, "hus")), (snap) => {
      setHus(
        snap.docs
          .map((d) => ({ id: d.id, asignados: [], devs: [], qas: [], ...d.data() }) as unknown as HU)
          .filter((h) => !h.fueraDeAlcance)
      );
      setLoading(false);
    });
  }, []);

  return { hus, loading };
}
