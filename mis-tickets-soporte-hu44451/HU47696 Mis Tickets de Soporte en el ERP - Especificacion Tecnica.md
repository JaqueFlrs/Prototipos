# Especificación técnica — Mis Tickets de Soporte (Zoho Desk) — HU47696 (Zoho Desk #44451)

**Dónde vive:** un **servicio nuevo, independiente**, separado tanto del ERP como de GM Integra. Es el único lugar que guarda el token de Zoho Desk. Cada instalación del ERP le llama a este servicio por HTTP — nunca habla directo con Zoho Desk.

**Por qué un servicio aparte:** con potencialmente miles de instalaciones de clientes (cada una con su propia base de datos), si el token de Zoho Desk viviera en cada ERP, quedaría replicado miles de veces — cualquier servidor comprometido expondría los tickets de **todos** los clientes. Centralizando en un solo servicio: el token vive en un solo lugar, se puede cachear/limitar el tráfico a Zoho en un solo punto, y no importa si hay 50 o 50,000 clientes — el costo de mantener el caché actualizado no crece por cliente (ver punto 6).

Hay dos partes que construir: **el servicio nuevo** (secciones 1-6) y **el lado del ERP** (sección 7, mucho más simple ahora).

---

## Credenciales necesarias (ya generadas, entregar de forma segura — nunca por chat/correo abierto)

| Dato | Para qué sirve |
|---|---|
| `client_id` | Identifica la app registrada en Zoho API Console |
| `client_secret` | Junto con el `client_id`, permite renovar el `access_token` |
| `refresh_token` | El dato que realmente hay que resguardar — no expira, con él se pide un `access_token` nuevo cada hora |

Estas credenciales viven **únicamente** en la configuración del servicio nuevo (variables de entorno o secreto del hosting) — nunca en el ERP, nunca en un repo, nunca en texto plano archivado.

---

## 1. El servicio nuevo — qué expone

Dos endpoints internos, consumidos solo por instalaciones del ERP (no público):

### `GET /tickets?rfc={rfc}&rfc={rfc2}&vista={abiertos|espera|vencidos|cerrados|todos}`

- `rfc`: uno o más RFC (multiempresa = varios), normalizados (trim + mayúsculas) antes de comparar.
- Regresa el listado ya filtrado y traducido (ver secciones 3 y 4), listo para pintar: folio, asunto, estatus visible, y el resto de campos que use el detalle no hace falta aquí — el listado del ERP solo pinta folio/asunto/estatus.
- Incluye `"consultadoEn"`: fecha/hora de la última vez que este servicio realmente le preguntó a Zoho (no de la llamada del ERP), para que el ERP pinte "Actualizado hace X min".

### `GET /tickets/{folio}?rfc={rfc}`

- Detalle completo: folio, asunto, estatus visible, prioridad, canal, fechas, quién atiende, y la conversación pública completa con adjuntos.
- Valida que el `cf_rfc` del ticket coincida con el/los RFC recibidos antes de regresarlo — si no coincide, responde 404 (mismo trato que si no existiera, nunca revelar que el ticket es de otra empresa).
- `adjuntos[].url` apunta a un tercer endpoint de este mismo servicio (`GET /adjuntos/{id}`) que hace de proxy hacia Zoho — nunca se expone la URL directa de Zoho Desk al ERP/cliente final.

---

## 2. Autenticación del servicio contra Zoho Desk

- Al arrancar (o cuando el `access_token` en memoria expira, ~1 hora), pedir uno nuevo a `https://accounts.zoho.com/oauth/v2/token` usando el `refresh_token` guardado.
- El `access_token` se mantiene en memoria del propio servicio — no hay que pedirlo por cada request que llegue del ERP.

---

## 3. Filtro fijo por departamento (obligatorio, no configurable)

`departmentId = 890726000000006907` ("GMTransportErp"). Esta cuenta de Zoho Desk también tiene tickets de "Franquicias" (`890726000002201029`) y "Rastreo Satelital" (`890726000017174029`) — **nunca deben mezclarse** con los de soporte del ERP. Validado con datos reales: dentro de "GMTransportErp" caen todas las clasificaciones legítimas (Soporte, Problema (PB), Formatos, Cambio (CH), Pólizas, Cotización, Capacitación, Servicios especiales, WS/API, Mejora).

---

## 4. Traducción de estatus reales → estatus visible

| Estatus real en Zoho Desk | Se muestra como |
|---|---|
| Nuevo | Nuevo |
| En proceso, Documentándose, En pruebas, Registrado, En espera de área interna, Agendado, Cotización enviada, Pendiente, Por revisar Calidad (normalizar espacios dobles) | En proceso |
| Pendiente por el cliente, Resuelto - Pendiente del cliente | **Esperando tu respuesta** |
| Finalizado, Cerrado | Cerrado |

Vistas del listado (Abiertos/En espera/Vencidos/Cerrados/Todos) se resuelven con este mapeo + `statusType` + `dueDate` — mismo criterio ya definido, ahora vive del lado del servicio en vez del ERP.

---

## 5. Notas privadas y adjuntos — reglas sin excepción

- Al armar la conversación, los elementos `type: "comment"` (notas internas entre agentes) **nunca** se incluyen en la respuesta del servicio — se filtran ahí mismo, antes de que el ERP los vea siquiera. Solo se regresan los `type: "thread"` con `visibility: "public"`.
- Adjuntos tipo imagen (`.png`, `.jpg`, `.jpeg`, `.gif`) se marcan para mostrarse como miniatura; el resto como archivo descargable. La descarga pasa por el endpoint proxy del propio servicio (ver sección 1), nunca por una URL directa de Zoho.

---

## 6. Caché y sincronización — la parte que resuelve la escala de "n clientes"

**Nunca hacer una consulta a Zoho por cada RFC.** En vez de eso:

- Un proceso interno del servicio (corre **una vez al día**, decisión ya definida con el cliente) trae **todos** los tickets abiertos del departamento "GMTransportErp" en un lote paginado (una consulta general, no una por cliente) y los reparte internamente en un caché por RFC.
- Esto significa que el costo de mantener todo actualizado depende de **cuántos tickets abiertos existen en total** (que son pocos, por naturaleza), no de cuántos clientes hay — da igual si son 50 o 50,000 instalaciones.
- TTL del caché: 5 minutos para Abiertos/En espera/Vencidos, 30 minutos para Cerrados/Todos.
- Cuando el ERP llama a `GET /tickets`, el servicio responde desde su caché interno — solo vuelve a golpear Zoho si el caché ya expiró para esa vista.
- El botón "Actualizar" del ERP simplemente vuelve a llamar a este mismo endpoint — el usuario nunca nota si vino de caché o de una consulta fresca.

---

## 7. Lado del ERP (mucho más simple ahora)

El ERP **ya no habla con Zoho Desk ni guarda ningún token**. Solo necesita:

- La URL base del servicio nuevo (esto sí puede vivir en el INI de cada instalación, ej. `[TicketsSoporte] UrlServicio=https://...`) — no es secreto, es solo un endpoint interno.
- `GetListadoTickets(sRFC1, sRFC2, sVista)` → `HTTPRequest GET` a `{UrlServicio}/tickets?rfc=...&vista=...`
- `GetDetalleTicket(sFolio, sRFC)` → `HTTPRequest GET` a `{UrlServicio}/tickets/{folio}?rfc=...`
- Si la llamada falla (el servicio no responde, timeout, lo que sea): mostrar **"No se pudo consultar el estatus de tus tickets en este momento, intenta más tarde."** — nunca un código de error técnico.
- El proceso automático diario que se menciona en el Gherkin/Explicación (refresco sin intervención del usuario) ahora vive **del lado del servicio** (sección 6), no como un proceso separado en cada instalación del ERP.

---

## Referencia de campos que trae Zoho Desk (confirmado con datos reales)

Ticket: `id`, `ticketNumber`, `subject`, `status`, `statusType`, `priority`, `channel`, `dueDate`, `createdTime`, `modifiedTime`, `departmentId`, `cf.cf_rfc`.
Conversación: `type` (`thread`/`comment`), `visibility` (`public`/otro), `author.name`, `createdTime`/`commentedTime`, `summary`/`content`, `attachments[]` (cada uno con `name`).

---

## Qué darle al desarrollador (paquete completo de entrega)

1. Este documento (especificación técnica) — aplica a **dos** desarrollos distintos: el servicio nuevo (secciones 1-6) y el lado del ERP (sección 7). Si los va a hacer gente distinta, dividir el documento en dos entregas.
2. `HU47696 Mis Tickets de Soporte en el ERP.feature` (Gherkin — incluye escenarios de la conexión con Zoho Desk).
3. `HU47696 Mis Tickets de Soporte en el ERP - Explicacion Dev.md` (explicación en lenguaje simple, enfocada en el comportamiento visible en el ERP).
4. Las 3 credenciales de Zoho Desk (client_id, client_secret, refresh_token) — solo para quien construya el servicio nuevo, nunca para quien toque el lado del ERP.
5. Link del prototipo visual (referencia de diseño).
