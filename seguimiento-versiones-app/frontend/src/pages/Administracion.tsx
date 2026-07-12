import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";
import { useRole } from "../hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Usuario {
  id: string; // = correo
  nombre: string;
  rol: "super" | "lider" | "analista" | "calendario";
  puedeVer: string;
  puedeMover: "todo" | "propio";
  puedeActualizar: boolean;
}

const ROLES = ["super", "lider", "analista", "calendario"] as const;

export default function Administracion() {
  const { perfil } = useRole();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [altaMsg, setAltaMsg] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(collection(db, "usuarios"), (snap) => {
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Usuario));
    });
  }, []);

  async function toggleActualizar(u: Usuario) {
    await updateDoc(doc(db, "usuarios", u.id), { puedeActualizar: !u.puedeActualizar });
  }

  async function cambiarRol(u: Usuario, rol: Usuario["rol"]) {
    await updateDoc(doc(db, "usuarios", u.id), { rol });
  }

  async function agregarUsuario() {
    const email = nuevoEmail.trim().toLowerCase();
    if (!email.endsWith("@gmtransporterp.com") || !nuevoNombre.trim()) return;
    setAltaMsg(null);
    try {
      const crearUsuario = httpsCallable(functions, "crearUsuario");
      const res: any = await crearUsuario({ email, nombre: nuevoNombre.trim(), rol: "analista" });
      setAltaMsg(
        `Usuario creado. Contraseña temporal: ${res.data.tempPassword} — pásasela para que entre y la cambie.`
      );
      setNuevoEmail("");
      setNuevoNombre("");
    } catch (err: any) {
      setAltaMsg(err.message ?? "No se pudo crear el usuario.");
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const syncZoho = httpsCallable(functions, "syncZoho");
      await syncZoho();
      setSyncMsg("Información actualizada.");
    } catch (err: any) {
      setSyncMsg(err.message ?? "No se pudo sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Administración</h2>
        <p className="text-xs text-muted-foreground">
          El super admin da de alta a cada persona por su correo @gmtransporterp.com y define qué puede mover.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="correo@gmtransporterp.com"
          value={nuevoEmail}
          onChange={(e) => setNuevoEmail(e.target.value)}
          className="max-w-xs"
        />
        <Input placeholder="Nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="max-w-[180px]" />
        <Button onClick={agregarUsuario}>Agregar usuario</Button>
      </div>
      {altaMsg && <p className="text-xs text-primary">{altaMsg}</p>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Correo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-center">Puede actualizar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.nombre}</TableCell>
                <TableCell>
                  <Select value={u.rol} onValueChange={(v) => cambiarRol(u, v as Usuario["rol"])}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={u.puedeActualizar} onCheckedChange={() => toggleActualizar(u)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div>
        <h3 className="mb-2 text-base font-semibold">Sincronización con Zoho</h3>
        {perfil?.puedeActualizar ? (
          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <span className="text-xs text-muted-foreground">{syncMsg ?? "—"}</span>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? "Actualizando…" : "Actualizar información"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-xs text-muted-foreground">
              Tu rol no tiene permiso para actualizar la información.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
