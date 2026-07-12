import { useState } from "react";
import { Boxes, Ticket, FileText, LayoutGrid, PackageCheck, ArrowRight } from "lucide-react";
import { loginWithPassword, resetPassword } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FLOW_NODES = [
  { icon: Ticket, label: "Ticket", sub: "Zoho Desk" },
  { icon: FileText, label: "HU", sub: "Historia" },
  { icon: LayoutGrid, label: "Kanban", sub: "Desarrollo" },
  { icon: PackageCheck, label: "Versión", sub: "Liberación" },
];

function OrgPanel() {
  return (
    <div className="relative hidden h-full w-full overflow-hidden bg-[#0b0d14] lg:block">
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[hsl(var(--pb))]/25 blur-3xl" />

      <div className="relative flex h-full flex-col items-center justify-center gap-10 px-10">
        <div className="text-center">
          <p className="text-sm font-medium text-white/60">Todo tu departamento, organizado</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">De un ticket a una versión liberada</h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {FLOW_NODES.map((node, i) => (
            <div key={node.label} className="flex items-center gap-2 sm:gap-4">
              <div className="flex w-24 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                  <node.icon className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">{node.label}</p>
                  <p className="text-[10px] text-white/50">{node.sub}</p>
                </div>
              </div>
              {i < FLOW_NODES.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-white/25" />}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {["#42063 · Transporte por Internet", "#44311 · Logistics T21", "HU-45194 · En revisión"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/70"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await loginWithPassword(email, password);
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setNotice("Listo — revisa tu correo para restablecer la contraseña.");
    } catch {
      setError("No se pudo enviar el correo. Verifica que esté bien escrito.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[440px_1fr]">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--pb))] text-primary-foreground shadow-lg shadow-primary/30">
              <Boxes className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Seguimiento</h1>
            <p className="text-xs text-muted-foreground">GM Transport</p>
          </div>

          {!modoRecuperar ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setModoRecuperar(true);
                      setError(null);
                      setNotice(null);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Entrando…" : "Iniciar sesión"}
              </Button>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Ponemos tu correo y te mandamos un enlace para poner una contraseña nueva.
              </p>
              <div className="space-y-1">
                <Label htmlFor="email-reset">Correo</Label>
                <Input
                  id="email-reset"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Enviando…" : "Enviar enlace"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setModoRecuperar(false);
                  setError(null);
                  setNotice(null);
                }}
                className="w-full text-center text-xs text-muted-foreground hover:underline"
              >
                Volver al inicio de sesión
              </button>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {notice && <p className="text-xs text-[hsl(var(--success))]">{notice}</p>}
            </form>
          )}
        </div>
      </div>

      <OrgPanel />
    </div>
  );
}
