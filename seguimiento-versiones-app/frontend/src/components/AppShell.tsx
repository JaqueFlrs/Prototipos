import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Kanban as KanbanIcon,
  ListTodo,
  FileText,
  Package,
  Calendar,
  UserCircle,
  Settings,
  SlidersHorizontal,
  LogOut,
  Sun,
  Moon,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { logout } from "@/lib/auth";
import { getStoredMode, applyMode } from "@/lib/theme";
import { useRole } from "@/hooks/useRole";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/", label: "Kanban por mes", icon: KanbanIcon },
  { to: "/backlog", label: "Backlog Versiones", icon: ListTodo },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { to: "/liberaciones", label: "Liberaciones", icon: Package },
  { to: "/calendario", label: "Calendario", icon: Calendar },
  { to: "/mis-tickets", label: "Mis tickets", icon: UserCircle },
];

const NAV_SECUNDARIO = [
  { to: "/admin", label: "Administración", icon: Settings },
  { to: "/configuracion", label: "Configuración", icon: SlidersHorizontal },
];

function NavIcon({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Settings }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          end={to === "/" || to === "/dashboard"}
          aria-label={label}
          className={({ isActive }) =>
            cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm",
              isActive && "bg-background text-foreground shadow-sm"
            )
          }
        >
          <Icon className="h-[18px] w-[18px]" />
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { perfil, user } = useRole();
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const m = getStoredMode();
    setMode(m);
    applyMode(m);
  }, []);

  function toggleMode() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyMode(next);
  }

  const initials = (perfil?.nombre ?? user?.email ?? "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 border-b bg-card/60 px-4 py-2 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--pb))] text-primary-foreground shadow-sm shadow-primary/30">
              <Boxes className="h-4 w-4" />
            </div>
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">Seguimiento</span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Button variant="outline" size="icon" onClick={toggleMode} title="Modo claro/oscuro">
              {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/configuracion" title="Configuración">
              <Avatar className="h-8 w-8 ring-1 ring-border transition-shadow hover:ring-2 hover:ring-primary/50">
                <AvatarImage src={perfil?.fotoURL} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => logout()} title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <nav className="order-3 flex w-full flex-wrap items-center justify-center gap-1 rounded-full bg-muted/60 p-1 sm:order-none sm:w-auto sm:flex-nowrap sm:justify-start">
            {NAV.map((item) => (
              <NavIcon key={item.to} {...item} />
            ))}
            <div className="mx-1 h-5 w-px shrink-0 bg-border" />
            {NAV_SECUNDARIO.map((item) => (
              <NavIcon key={item.to} {...item} />
            ))}
          </nav>
        </header>

        <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-6">{children}</main>
      </div>
    </TooltipProvider>
  );
}
