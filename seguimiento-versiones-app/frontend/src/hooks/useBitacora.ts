import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { auth } from "../lib/firebase";

export interface BitacoraEntry {
  id: string;
  label: string;
  userEmail: string;
  userNombre: string;
  createdAt: Timestamp | null;
}

/** Seguimiento manual rápido de un ticket/HU, fuera de los campos que trae Zoho. */
export function useBitacora(taskId: string, nombreUsuario: string) {
  const [entries, setEntries] = useState<BitacoraEntry[]>([]);

  useEffect(() => {
    if (!taskId) return;
    const q = query(collection(db, "bitacoras", taskId, "entries"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BitacoraEntry));
    });
  }, [taskId]);

  async function addEntry(label: string) {
    const user = auth.currentUser;
    if (!user?.email || !label.trim()) return;
    await addDoc(collection(db, "bitacoras", taskId, "entries"), {
      label: label.trim(),
      userEmail: user.email,
      userNombre: nombreUsuario,
      createdAt: serverTimestamp(),
    });
  }

  return { entries, addEntry };
}
