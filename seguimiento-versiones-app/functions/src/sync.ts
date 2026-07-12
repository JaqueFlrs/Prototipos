import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { ZOHO_CLIENT_SECRET, ZOHO_SYNC_REFRESH_TOKEN } from "./config";
import { getSyncAccessToken, fetchAllTasks, ZohoOwner, ZohoTask } from "./zohoClient";

interface Asignado {
  nombre: string;
  email: string;
  area: string;
}

/** CH / PB / ST / otro, según el prefijo del nombre de estatus en Zoho. */
function statusFamily(statusName: string): "CH" | "PB" | "ST" | "OTRO" {
  if (statusName.startsWith("CH")) return "CH";
  if (statusName.startsWith("PB")) return "PB";
  if (statusName.startsWith("ST")) return "ST";
  return "OTRO";
}

function getArea(email: string | undefined): string {
  if (!email) return "otro";
  const m = /^[^.]+\.([^@]+)@/.exec(email);
  return m ? m[1] : "otro";
}

function toAsignado(o: ZohoOwner): Asignado {
  return { nombre: o.name, email: o.email, area: getArea(o.email) };
}

function friendlyIdOf(name: string, prefix: string | undefined, esHU: boolean): string | null {
  let m = /#([0-9]+)/.exec(name);
  if (m) return `#${m[1]}`;
  m = /^(CH-[0-9]+)/.exec(name);
  if (m) return m[1];
  m = /^(PB-[0-9]+)/.exec(name);
  if (m) return m[1];
  if (esHU) {
    // La mayoría de las HU llevan su número en el propio nombre ("HU45020 ...", "HU-80 ...").
    m = /^HU\s*-?\s*([0-9]+)/i.exec(name);
    if (m) return `HU${m[1]}`;
    return null;
  }
  return prefix ?? null;
}

// Nombres fijos que aparecen como co-owners genéricos en casi todo ticket (creador/revisor).
const FIJOS = /(maricruz|adrian)/i;
const DOMINIO_VERSIONES = /\.versiones@/i;

function analistaPrincipal(candidatos: Asignado[]): Asignado | null {
  if (candidatos.length === 0) return null;
  if (candidatos.length === 1) return candidatos[0];
  const sinFijos = candidatos.filter((a) => !FIJOS.test(a.nombre));
  if (sinFijos.length >= 1) return sinFijos[0];
  return candidatos[0];
}

/** owners de subtarea "DEV - " => developers de esa HU; "QA - " => calidad de esa HU. */
const ES_DEV_QA_SUBTAREA = /^(DEV|QA)\s*-/i;
const ES_QA_SUBTAREA = /^QA\s*-/i;

function ticketDocFromTask(
  task: ZohoTask,
  asignados: Asignado[],
  analista: string | null,
  fueraDeAlcance: boolean
) {
  return {
    name: task.name,
    friendlyId: friendlyIdOf(task.name, task.prefix, false),
    statusFamily: statusFamily(task.status.name),
    status: task.status.name,
    priority: task.priority,
    cliente: task.nombre_del_cliente ?? null,
    rfc: task.rfc ?? task.rfc_ticket ?? null,
    asignados,
    analista,
    fueraDeAlcance,
    dev: task.desarrollador_asignado?.name ?? null,
    fechaPublicacion: task.fecha_de_publicacion ?? task.fecha_de_entrega_al_cliente ?? null,
    moduloERP: task.modulo_del_sistema_erp ?? null,
    tipoDeCambio: task.tipo_de_cambio ?? null,
    tipoDeTarea: task.tipo_de_tarea ?? null,
    description: task.description ?? null,
    numeroDeCambio: task.numero_de_cambio ?? null,
    ticketId: task.ticket_id ?? null,
    ticketUrl: task.url_ticket ?? null,
    milestone: task.milestone?.name ?? null,
    tasklist: task.tasklist?.name ?? null,
    lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

/**
 * Núcleo del sync: trae tareas de Zoho (Backlog Versiones + hitos de Kanban/Versión),
 * separa tickets (tipo_de_tarea = Ticket) de HU (tipo_de_tarea = Historia), y para las
 * HU con subtareas/predecesoras/sucesoras arma la relación con su(s) ticket(s) de origen.
 *
 * NOTA: solo pide detalle (fetchTaskDetail) de las tareas que sí traen relaciones
 * (association_info.has_subtasks) para no disparar N+1 llamadas contra Zoho.
 */
async function runSync(triggeredBy: string) {
  const clientSecret = ZOHO_CLIENT_SECRET.value();
  const refreshToken = ZOHO_SYNC_REFRESH_TOKEN.value();
  const accessToken = await getSyncAccessToken(clientSecret, refreshToken);

  const tasks = await fetchAllTasks(accessToken);
  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  const db = admin.firestore();
  let batch = db.batch();
  let ops = 0;

  const flushIfNeeded = async () => {
    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  };

  // Regla confirmada por la usuaria: subtarea "DEV - ..." -> sus owners son developers
  // de la HU padre; "QA - ..." -> sus owners son calidad de la HU padre. El resto de
  // owners de la HU/ticket que no sean owners de esas subtareas son analista (dominio
  // .versiones) o soporte externo (se ignora).
  const devsPorHU = new Map<string, Asignado[]>();
  const qasPorHU = new Map<string, Asignado[]>();
  for (const task of tasks) {
    if (!ES_DEV_QA_SUBTAREA.test(task.name)) continue;
    const padre = task.parental_info?.parent_task_id;
    if (!padre) continue;
    const bucket = ES_QA_SUBTAREA.test(task.name) ? qasPorHU : devsPorHU;
    if (!bucket.has(padre)) bucket.set(padre, []);
    const lista = bucket.get(padre)!;
    for (const o of task.owners_and_work?.owners ?? []) {
      const a = toAsignado(o);
      if (!lista.some((x) => x.email === a.email)) lista.push(a);
    }
  }

  for (const task of tasks) {
    if (ES_DEV_QA_SUBTAREA.test(task.name)) continue; // subtareas DEV-/QA-: no son tickets ni HU propias
    const isHU = task.tipo_de_tarea === "Historia";
    const asignados = (task.owners_and_work?.owners ?? []).map(toAsignado);

    if (isHU) {
      // Relación con el/los ticket(s) de origen: por subtarea (parental_info) o por la
      // pestaña "Relacionadas" de Zoho (dependency_info.predecessor/successor). Ambas
      // vienen embebidas en la lista plana de tareas — no requieren llamada de detalle
      // (confirmado en vivo: get_task_details no devuelve subtasks/dependency utilizables).
      const relatedTickets: { ticketId: string; rel: string }[] = [];
      const padreId = task.parental_info?.parent_task_id;
      if (padreId && tasksById.has(padreId)) {
        relatedTickets.push({ ticketId: padreId, rel: "parent" });
      }
      for (const d of task.dependency_info?.predecessor ?? []) {
        if (tasksById.has(d.id) && !relatedTickets.some((r) => r.ticketId === d.id)) {
          relatedTickets.push({ ticketId: d.id, rel: "predecesora" });
        }
      }
      for (const d of task.dependency_info?.successor ?? []) {
        if (tasksById.has(d.id) && !relatedTickets.some((r) => r.ticketId === d.id)) {
          relatedTickets.push({ ticketId: d.id, rel: "sucesora" });
        }
      }
      // Origen (CH/PB) de la HU: se toma del primer ticket relacionado que sí exista
      // como ticket real (no otra HU) en este mismo lote. Si no hay ninguno, es HU
      // sin ticket de origen.
      const originTicket = relatedTickets
        .map((r) => tasksById.get(r.ticketId))
        .find((t) => t && t.tipo_de_tarea !== "Historia");
      const origen = originTicket ? statusFamily(originTicket.status.name) : "HU";

      const devs = devsPorHU.get(task.id) ?? [];
      const qas = qasPorHU.get(task.id) ?? [];
      const devQaEmails = new Set([...devs, ...qas].map((a) => a.email));
      const versionesSinDevQa = asignados.filter(
        (a) => DOMINIO_VERSIONES.test(a.email) && !devQaEmails.has(a.email)
      );
      const analista = analistaPrincipal(versionesSinDevQa);
      // Marca como fuera de alcance (soporte externo) si nadie del depto está identificado.
      // No se excluye del sync: se marca para que la UI la filtre, sin perder el dato.
      const fueraDeAlcance = !(versionesSinDevQa.length > 0 || devs.length > 0 || qas.length > 0);
      // Las HU casi nunca traen su propia fecha en Zoho; heredan la del ticket relacionado.
      const fechaHeredada = relatedTickets
        .map((r) => tasksById.get(r.ticketId))
        .find((t) => t?.fecha_de_publicacion || t?.fecha_de_entrega_al_cliente);

      batch.set(
        db.collection("hus").doc(task.id),
        {
          name: task.name,
          friendlyId: friendlyIdOf(task.name, task.prefix, true),
          status: task.status.name,
          origen,
          asignados,
          devs,
          qas,
          analista: analista ? analista.nombre : null,
          fueraDeAlcance,
          dev: task.desarrollador_asignado?.name ?? null,
          moduloERP: task.modulo_del_sistema_erp ?? null,
          cliente: task.nombre_del_cliente ?? null,
          rfc: task.rfc ?? task.rfc_ticket ?? null,
          description: task.description ?? null,
          fechaPublicacion:
            task.fecha_de_publicacion ??
            task.fecha_de_entrega_al_cliente ??
            fechaHeredada?.fecha_de_publicacion ??
            fechaHeredada?.fecha_de_entrega_al_cliente ??
            null,
          fechaHeredadaDe:
            !task.fecha_de_publicacion && !task.fecha_de_entrega_al_cliente && fechaHeredada
              ? friendlyIdOf(fechaHeredada.name, fechaHeredada.prefix, false)
              : null,
          milestone: task.milestone?.name ?? null,
          relatedTickets,
          lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      const versiones = asignados.filter((a) => DOMINIO_VERSIONES.test(a.email));
      const analista = analistaPrincipal(versiones);
      batch.set(
        db.collection("tickets").doc(task.id),
        ticketDocFromTask(task, asignados, analista ? analista.nombre : null, versiones.length === 0),
        { merge: true }
      );
    }
    ops += 1;
    await flushIfNeeded();
  }
  if (ops > 0) await batch.commit();

  await db.doc("syncMeta/status").set({
    lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastSyncedBy: triggeredBy,
    state: "ok",
    ticketCount: tasks.length,
  });
}

export const syncZoho = onCall(
  { secrets: [ZOHO_CLIENT_SECRET, ZOHO_SYNC_REFRESH_TOKEN] },
  async (request) => {
    const email = request.auth?.token.email as string | undefined;
    if (!request.auth || !email) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const usuarioDoc = await admin.firestore().doc(`usuarios/${email}`).get();
    if (!usuarioDoc.exists || usuarioDoc.data()?.puedeActualizar !== true) {
      throw new HttpsError(
        "permission-denied",
        "Tu rol no tiene permiso para actualizar la información."
      );
    }
    await runSync(email);
    return { ok: true };
  }
);

export const syncZohoScheduled = onSchedule(
  { schedule: "every 30 minutes", secrets: [ZOHO_CLIENT_SECRET, ZOHO_SYNC_REFRESH_TOKEN] },
  async () => {
    await runSync("scheduled");
  }
);
