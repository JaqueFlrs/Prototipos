import { HU } from "../hooks/useHUs";

/** Tarjeta del Kanban: identifica la HU (no el ticket) — el ticket es referencia secundaria. */
export default function KCard({ hu, originTicketId }: { hu: HU; originTicketId?: string }) {
  return (
    <div
      className="card"
      style={{ padding: 8, marginBottom: 7, boxShadow: "0 1px 2px rgba(20,25,40,.05)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 11.5, color: "var(--accent-text)" }}>
          {hu.id}
        </span>
      </div>
      <div style={{ fontSize: 11.5, lineHeight: 1.35, marginBottom: 5 }}>{hu.name}</div>
      {hu.cliente && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
          {hu.cliente}
          {hu.moduloERP ? ` · ${hu.moduloERP}` : ""}
        </div>
      )}
      <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginBottom: 4 }}>
        {originTicketId ? `De #${originTicketId}` : "HU sin ticket de origen"}
      </div>
      {hu.dev && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 600,
            }}
          >
            {hu.dev.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
