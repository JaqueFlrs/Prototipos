import { useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db, getStorageOrThrow } from "../lib/firebase";
import { useRole } from "../hooks/useRole";
import { changePassword } from "../lib/auth";
import { COLOR_THEMES, ColorKey, getStoredColor, applyColor } from "../lib/theme";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Configuracion() {
  const { user, perfil } = useRole();
  const [color, setColor] = useState<ColorKey>(getStoredColor());
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fotoMsg, setFotoMsg] = useState<string | null>(null);

  const [pwActual, setPwActual] = useState("");
  const [pwNueva, setPwNueva] = useState("");
  const [pwConfirma, setPwConfirma] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  function pickColor(k: ColorKey) {
    setColor(k);
    applyColor(k);
  }

  async function subirFoto(file: File) {
    if (!user?.email) return;
    setUploading(true);
    setFotoMsg(null);
    try {
      const storageRef = ref(getStorageOrThrow(), `avatars/${user.email}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "usuarios", user.email), { fotoURL: url });
      setFotoMsg("Foto actualizada.");
    } catch (err: any) {
      setFotoMsg(err.message ?? "No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pwNueva !== pwConfirma) {
      setPwMsg("La contraseña nueva no coincide con la confirmación.");
      return;
    }
    if (pwNueva.length < 6) {
      setPwMsg("La contraseña nueva debe tener al menos 6 caracteres.");
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(pwActual, pwNueva);
      setPwMsg("Contraseña actualizada.");
      setPwActual("");
      setPwNueva("");
      setPwConfirma("");
    } catch {
      setPwMsg("No se pudo cambiar — revisa que tu contraseña actual sea correcta.");
    } finally {
      setPwBusy(false);
    }
  }

  const initials = (perfil?.nombre ?? auth.currentUser?.email ?? "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configuración</h2>
        <p className="text-xs text-muted-foreground">Tu foto, tu tema de color y tu contraseña.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="text-sm font-semibold">Foto de perfil</p>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={perfil?.fotoURL} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && subirFoto(e.target.files[0])}
              />
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Subiendo…" : "Cambiar foto"}
              </Button>
              {fotoMsg && <p className="text-xs text-muted-foreground">{fotoMsg}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="text-sm font-semibold">Tema de color</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {(Object.entries(COLOR_THEMES) as [ColorKey, (typeof COLOR_THEMES)[ColorKey]][]).map(
              ([key, t]) => (
                <button
                  key={key}
                  onClick={() => pickColor(key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors hover:border-foreground/30",
                    color === key && "border-primary"
                  )}
                >
                  <div
                    className="relative flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: `hsl(${t.primary})` }}
                  >
                    {color === key && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{t.label}</span>
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-semibold">Cambiar contraseña</p>
          <form onSubmit={handleChangePassword} className="max-w-xs space-y-3">
            <div className="space-y-1">
              <Label>Contraseña actual</Label>
              <Input type="password" value={pwActual} onChange={(e) => setPwActual(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Contraseña nueva</Label>
              <Input type="password" value={pwNueva} onChange={(e) => setPwNueva(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Confirmar contraseña nueva</Label>
              <Input type="password" value={pwConfirma} onChange={(e) => setPwConfirma(e.target.value)} required />
            </div>
            <Button type="submit" disabled={pwBusy}>
              {pwBusy ? "Guardando…" : "Cambiar contraseña"}
            </Button>
            {pwMsg && <p className="text-xs text-muted-foreground">{pwMsg}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
