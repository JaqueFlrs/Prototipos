import { useEffect, useState } from "react";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Espacio de trabajo propio del equipo, independiente de Zoho — nadie sincroniza esto,
// lo maneja la usuaria como sus tableros de Notion (crear filas, cambiar estatus, etc.).

export interface NotionTablero {
  id: string;
  nombre: string;
  estatusOpciones: string[];
  orden: number;
}

export interface NotionFila {
  id: string;
  titulo: string;
  estatus: string;
  fecha: string | null;
  notas: string;
  orden: number;
}

const ESTATUS_DEFAULT = ["Por hacer", "En curso", "Hecho"];

export function useNotionTableros() {
  const [tableros, setTableros] = useState<NotionTablero[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "notionTableros"), orderBy("orden", "asc"));
    return onSnapshot(q, (snap) => {
      setTableros(
        snap.docs.map(
          (d) => ({ id: d.id, estatusOpciones: ESTATUS_DEFAULT, ...d.data() }) as unknown as NotionTablero
        )
      );
      setLoading(false);
    });
  }, []);

  async function crearTablero(nombre: string) {
    await addDoc(collection(db, "notionTableros"), {
      nombre,
      estatusOpciones: ESTATUS_DEFAULT,
      orden: Date.now(),
      createdAt: serverTimestamp(),
    });
  }

  async function renombrarTablero(id: string, nombre: string) {
    await updateDoc(doc(db, "notionTableros", id), { nombre });
  }

  async function eliminarTablero(id: string) {
    await deleteDoc(doc(db, "notionTableros", id));
  }

  async function agregarEstatusOpcion(id: string, estatus: string) {
    await updateDoc(doc(db, "notionTableros", id), { estatusOpciones: arrayUnion(estatus) });
  }

  return { tableros, loading, crearTablero, renombrarTablero, eliminarTablero, agregarEstatusOpcion };
}

export function useNotionFilas(tableroId: string | null) {
  const [filas, setFilas] = useState<NotionFila[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tableroId) {
      setFilas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "notionTableros", tableroId, "filas"), orderBy("orden", "asc"));
    return onSnapshot(q, (snap) => {
      setFilas(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as NotionFila));
      setLoading(false);
    });
  }, [tableroId]);

  async function agregarFila(tableroId: string, estatusInicial: string) {
    await addDoc(collection(db, "notionTableros", tableroId, "filas"), {
      titulo: "",
      estatus: estatusInicial,
      fecha: null,
      notas: "",
      orden: Date.now(),
      updatedAt: serverTimestamp(),
    });
  }

  async function actualizarFila(tableroId: string, filaId: string, patch: Partial<NotionFila>) {
    await updateDoc(doc(db, "notionTableros", tableroId, "filas", filaId), { ...patch, updatedAt: serverTimestamp() });
  }

  async function eliminarFila(tableroId: string, filaId: string) {
    await deleteDoc(doc(db, "notionTableros", tableroId, "filas", filaId));
  }

  return { filas, loading, agregarFila, actualizarFila, eliminarFila };
}
