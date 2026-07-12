import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Asignado } from "../lib/asignados";

export interface Release {
  id: string;
  name: string;
  fecha: string;
  estado: "En preparación" | "Liberada";
  hus: {
    id: string;
    friendlyId: string | null;
    name: string;
    moduloERP: string | null;
    cliente: string | null;
    asignados: Asignado[];
    status: string;
    origen: "CH" | "PB" | "HU";
  }[];
}

export function useReleases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(query(collection(db, "releases")), (snap) => {
      setReleases(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Release));
      setLoading(false);
    });
  }, []);

  return { releases, loading };
}
