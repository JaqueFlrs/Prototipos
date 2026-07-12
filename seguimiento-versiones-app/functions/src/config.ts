import { defineSecret } from "firebase-functions/params";

// Secretos reales (Secret Manager en prod, .env local en emuladores)
export const ZOHO_CLIENT_SECRET = defineSecret("ZOHO_CLIENT_SECRET");
export const ZOHO_SYNC_REFRESH_TOKEN = defineSecret("ZOHO_SYNC_REFRESH_TOKEN");

// Config no sensible, vía variables de entorno normales (.env / .env.<project-id>).
// Solo se usa para el sync de datos (cuenta de servicio) — ya no hay login vía Zoho.
export const cfg = {
  clientId: process.env.ZOHO_CLIENT_ID ?? "",
  accountsBase: process.env.ZOHO_ACCOUNTS_BASE ?? "https://accounts.zoho.com",
  apiBase: process.env.ZOHO_API_BASE ?? "https://projectsapi.zoho.com/restapi",
  portalId: process.env.ZOHO_PORTAL_ID ?? "",
  projectId: process.env.ZOHO_PROJECT_ID ?? "",
};
