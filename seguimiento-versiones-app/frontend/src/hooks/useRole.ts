import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthChange } from "../lib/auth";
import { db } from "../lib/firebase";

export interface Perfil {
  nombre: string;
  rol: "super" | "lider" | "analista" | "calendario";
  puedeVer: string;
  puedeMover: "todo" | "propio";
  puedeActualizar: boolean;
  fotoURL?: string;
}

/**
 * `perfil` viene de Firestore `usuarios/{email}` — si es null tras cargar, el usuario
 * inició sesión con Google pero el super admin todavía no lo da de alta (sin acceso).
 */
export function useRole() {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;
    const unsubAuth = onAuthChange((u) => {
      unsubDoc?.();
      setUser(u);
      setError(null);
      if (u?.email) {
        unsubDoc = onSnapshot(
          doc(db, "usuarios", u.email),
          (snap) => {
            setPerfil(snap.exists() ? (snap.data() as Perfil) : null);
            setLoading(false);
          },
          (err) => {
            // Si esto dispara, casi siempre es que las reglas de Firestore no están
            // publicadas o no permiten leer `usuarios/{email}`.
            setError(err.message);
            setLoading(false);
          }
        );
      } else {
        setPerfil(null);
        setLoading(false);
      }
    });
    return () => {
      unsubAuth();
      unsubDoc?.();
    };
  }, []);

  return { user, perfil, loading, error };
}
