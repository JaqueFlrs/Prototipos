import fetch from "node-fetch";
import { cfg } from "./config";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  error?: string;
}

// Cache en memoria del access token del "usuario de servicio" usado para el sync
// programado. Vive mientras la instancia de la función esté caliente — si expira,
// se refresca solo.
let cachedSyncToken: { token: string; expiresAt: number } | null = null;

/** Refresca el access token de la cuenta de servicio usada para el sync programado. */
export async function getSyncAccessToken(
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const now = Date.now();
  if (cachedSyncToken && cachedSyncToken.expiresAt > now + 30_000) {
    return cachedSyncToken.token;
  }
  const url = `${cfg.accountsBase}/oauth/v2/token`;
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: cfg.clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  const res = await fetch(url, { method: "POST", body: params });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || data.error) {
    throw new Error(`Zoho token refresh failed: ${data.error ?? res.status}`);
  }
  cachedSyncToken = { token: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return data.access_token;
}

/**
 * GET genérico contra la API de Zoho Projects.
 * NOTA: las rutas exactas (paginación, filtros por criteria) deben verificarse contra
 * la documentación REST v3 de Zoho Projects al conectar credenciales reales — aquí se
 * modela el patrón que ya confirmamos vía el conector MCP, no una llamada probada en vivo.
 */
export async function zohoGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${cfg.apiBase}${path}`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Zoho GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export interface ZohoOwner {
  name: string;
  email: string;
}

export interface ZohoTask {
  id: string;
  prefix?: string;
  name: string;
  status: { id: string; name: string };
  priority: string;
  milestone?: { id: string; name: string };
  tasklist?: { id: string; name: string };
  association_info?: { has_subtasks?: boolean };
  parental_info?: { parent_task_id?: string; root_task_id?: string };
  // Relación por la pestaña "Relacionadas" de Zoho (independiente de parental_info/subtareas).
  // Confirmado en vivo: viene embebido en la lista plana de tareas, no requiere llamada de detalle.
  dependency_info?: { predecessor?: { id: string; type?: string }[]; successor?: { id: string; type?: string }[] };
  owners_and_work?: { owners?: ZohoOwner[] };
  ticket_id?: string;
  url_ticket?: string;
  rfc?: string;
  rfc_ticket?: string;
  nombre_del_cliente?: string;
  desarrollador_asignado?: { name: string };
  // Fecha comprometida al cliente: los tickets PB la traen en fecha_de_publicacion,
  // los CH la traen en fecha_de_entrega_al_cliente (mismo concepto, campo distinto).
  fecha_de_publicacion?: string;
  fecha_de_entrega_al_cliente?: string;
  modulo_del_sistema_erp?: string;
  tipo_de_cambio?: string;
  tipo_de_tarea?: string;
  description?: string;
  numero_de_cambio?: string;
}

/** Trae todas las tareas del proyecto de Versiones, paginando. */
export async function fetchAllTasks(accessToken: string): Promise<ZohoTask[]> {
  const all: ZohoTask[] = [];
  let page = 1;
  const perPage = 200;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await zohoGet<{ tasks: ZohoTask[]; page_info?: { has_next_page?: boolean } }>(
      `/portals/${cfg.portalId}/projects/${cfg.projectId}/tasks/?page=${page}&per_page=${perPage}`,
      accessToken
    );
    all.push(...(data.tasks ?? []));
    if (!data.page_info?.has_next_page) break;
    page += 1;
  }
  return all;
}

export interface ZohoTaskDetail extends ZohoTask {
  dependency?: { predecessor_list?: { id: string; name: string }[]; successor_list?: { id: string; name: string }[] };
  subtasks?: { id: string; name: string }[];
}

/** Detalle de una tarea puntual (para sacar subtareas + predecesoras/sucesoras). */
export async function fetchTaskDetail(taskId: string, accessToken: string): Promise<ZohoTaskDetail> {
  const data = await zohoGet<{ tasks: ZohoTaskDetail[] }>(
    `/portals/${cfg.portalId}/projects/${cfg.projectId}/tasks/${taskId}/`,
    accessToken
  );
  return data.tasks[0];
}
