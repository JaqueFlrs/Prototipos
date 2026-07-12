import { Routes, Route, Navigate } from "react-router-dom";
import { useRole } from "./hooks/useRole";
import { logout } from "./lib/auth";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import Backlog from "./pages/Backlog";
import Cotizaciones from "./pages/Cotizaciones";
import Liberaciones from "./pages/Liberaciones";
import Calendario from "./pages/Calendario";
import MisTickets from "./pages/MisTickets";
import Administracion from "./pages/Administracion";
import Configuracion from "./pages/Configuracion";

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-10 text-center">{children}</div>;
}

function SinAcceso({ email }: { email: string }) {
  return (
    <CenteredMessage>
      <div className="space-y-3">
        <p>
          Tu cuenta (<b>{email}</b>) inició sesión, pero no está dada de alta en el sistema.
        </p>
        <p className="text-sm text-muted-foreground">Pide al super admin que te agregue en Administración.</p>
        <Button variant="outline" onClick={() => logout()}>
          Cerrar sesión
        </Button>
      </div>
    </CenteredMessage>
  );
}

function ErrorPermiso({ mensaje }: { mensaje: string }) {
  return (
    <CenteredMessage>
      <div className="space-y-3">
        <p className="text-destructive">No se pudo leer tu perfil de Firestore.</p>
        <p className="text-sm text-muted-foreground">
          Detalle técnico: {mensaje}. Probablemente las reglas de seguridad de Firestore no se han publicado
          todavía.
        </p>
        <Button variant="outline" onClick={() => logout()}>
          Cerrar sesión
        </Button>
      </div>
    </CenteredMessage>
  );
}

export default function App() {
  const { user, perfil, loading, error } = useRole();

  if (loading) return <CenteredMessage>Cargando…</CenteredMessage>;
  if (!user) return <Login />;
  if (error) return <ErrorPermiso mensaje={error} />;
  if (!perfil) return <SinAcceso email={user.email ?? ""} />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Kanban />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/backlog" element={<Backlog />} />
        <Route path="/cotizaciones" element={<Cotizaciones />} />
        <Route path="/liberaciones" element={<Liberaciones />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/mis-tickets" element={<MisTickets />} />
        <Route path="/admin" element={<Administracion />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
