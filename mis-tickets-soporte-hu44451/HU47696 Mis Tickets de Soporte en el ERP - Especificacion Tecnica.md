# Especificación técnica — Mis Tickets de Soporte (Zoho Desk) — HU47696 (Zoho Desk #44451)

**Dónde vive:** dentro del propio ERP (WLanguage), no en GM Integra ni ningún servicio externo. Cada instalación del ERP llama directo a la API de Zoho Desk.

**Riesgo aceptado (decisión ya tomada, no volver a preguntar):** el token de Zoho Desk queda replicado en el INI de cada instalación de cliente, siguiendo el mismo patrón que ya usa el ERP para otras integraciones (`HERE.ApiKey`, `PTV.Token`, etc. — ver `configuracion-sistema.md` del contexto ERP). Un solo token da acceso a los tickets de soporte de **todos** los clientes de GM Transport, así que si el servidor de un cliente se ve comprometido, esa credencial queda expuesta. Se acepta este riesgo porque el scope del token es de solo lectura de tickets (`Desk.tickets.READ`), no dato financiero ni de negocio del cliente.

---

## Credenciales necesarias (ya generadas, entregar al dev de forma segura — nunca por chat/correo abierto)

| Dato | Para qué sirve |
|---|---|
| `client_id` | Identifica la app registrada en Zoho API Console |
| `client_secret` | Junto con el `client_id`, permite renovar el `access_token` |
| `refresh_token` | El dato que realmente hay que resguardar — no expira, con él se pide un `access_token` nuevo cada hora |

Guardarlas en el INI de cada instalación (sección propia, ej. `[ZohoDesk]` con claves `ClientId`, `ClientSecret`, `RefreshToken`), igual que las demás integraciones externas del ERP.

---

## Qué debe construir el desarrollador

### 1. Clase de integración (ej. `ClsApiZohoDesk`)

Responsabilidades:
- Gestionar el ciclo OAuth: usar el `refresh_token` del INI para pedir un `access_token` nuevo (vía `HTTPRequest` a `https://accounts.zoho.com/oauth/v2/token`), cachear ese `access_token` en memoria/variable global mientras no expire (dura 1 hora).
- `GetListadoTickets(sRFC1, sRFC2, ..., sEstatusFiltro)` → arma el request a `https://desk.zoho.com/api/v1/tickets` con:
  - Header `Authorization: Zoho-oauthtoken {access_token}`
  - Filtro fijo (hardcodeado, no configurable): `departmentId = 890726000000006907` (departamento "GMTransportErp" — esta cuenta de Zoho Desk también tiene tickets de "Franquicias" y "Rastreo Satelital", **nunca deben mezclarse**)
  - Trae el lote de tickets abiertos del departamento y los filtra localmente por `cf_rfc` (normalizado: trim + mayúsculas) contra el/los RFC de la instalación
- `GetDetalleTicket(sFolio, sRFC)` → trae el ticket + su hilo de conversación (`/tickets/{id}/conversations`), valida que el `cf_rfc` del ticket coincida con el RFC de la instalación antes de regresarlo (si no coincide, tratar como "no encontrado", igual que si no existiera — nunca revelar que existe pero es de otra empresa)

### 2. Filtro por vista (Abiertos / En espera / Vencidos / Cerrados / Todos)

No es un parámetro que se le mande a Zoho — se resuelve en el ERP después de traer los tickets:

| Vista | Regla |
|---|---|
| Abiertos | `statusType = Open`, sin límite de fecha |
| En espera | estatus real es "Pendiente por el cliente" o "Resuelto - Pendiente del cliente" → mostrar como **"Esperando tu respuesta"** |
| Vencidos | `statusType = Open` y la fecha compromiso (`dueDate`) ya pasó respecto a hoy |
| Cerrados | `statusType = Closed`, solo `createdTime` de los últimos 3 meses |
| Todos | unión de las anteriores (cerrados con el mismo límite de 3 meses) |

### 3. Traducción de estatus reales → estatus visible (tabla de mapeo, cerrada con datos reales)

| Estatus real en Zoho Desk | Se muestra al cliente como |
|---|---|
| Nuevo | Nuevo |
| En proceso, Documentándose, En pruebas, Registrado, En espera de área interna, Agendado, Cotización enviada, Pendiente, Por revisar Calidad (normalizar espacios dobles) | En proceso |
| Pendiente por el cliente, Resuelto - Pendiente del cliente | **Esperando tu respuesta** |
| Finalizado, Cerrado | Cerrado |

### 4. Notas privadas — regla sin excepción

Al traer el hilo de conversación (`/tickets/{id}/conversations`), cada elemento viene con `type: "thread"` (mensajes de correo/chat) o `type: "comment"` (notas internas entre agentes). Los `comment` **nunca** se muestran — filtrarlos siempre en el procedimiento que arma la conversación, antes de pintarla en pantalla. Los `thread` sí traen un campo `visibility: "public"` — solo mostrar esos.

### 5. Adjuntos

Cada mensaje puede traer adjuntos. Si es imagen (`.png`, `.jpg`, `.jpeg`, `.gif`) → mostrar miniatura. Cualquier otro tipo → mostrar como archivo descargable con su nombre. La descarga del archivo debe pasar por el propio ERP (que llama a Zoho con el token), **nunca exponer una URL directa de Zoho Desk al cliente final** (esa URL requeriría sesión de agente para abrir).

### 6. Caché local (evitar golpear Zoho Desk en cada clic)

- Guardar el resultado del último `GetListadoTickets` por RFC + vista, con marca de tiempo.
- **5 minutos** de vigencia para Abiertos/En espera/Vencidos.
- **30 minutos** de vigencia para Cerrados/Todos.
- El botón "Actualizar" en pantalla llama de nuevo al mismo procedimiento: si el caché sigue vigente, regresa el dato guardado al instante; si ya venció, sí vuelve a consultar Zoho.
- Guardar también la fecha/hora exacta de la última consulta real a Zoho, para pintar el texto "Actualizado hace X min".

### 7. Proceso automático diario

Un proceso programado (ej. tarea nocturna del ERP, mismo patrón que otros procesos automáticos existentes) ejecuta `GetListadoTickets` una vez al día por cada instalación, para que el caché nunca esté "frío" aunque nadie entre a la pantalla en todo el día.

### 8. Manejo de errores

Si Zoho Desk no responde, el token es inválido, o cualquier falla de red: mostrar el mensaje **"No se pudo consultar el estatus de tus tickets en este momento, intenta más tarde."** — nunca mostrar el código de error HTTP ni el mensaje técnico real.

---

## Referencia de campos que trae Zoho Desk (confirmado con datos reales)

Ticket: `id`, `ticketNumber`, `subject`, `status`, `statusType`, `priority`, `channel`, `dueDate`, `createdTime`, `modifiedTime`, `departmentId`, `cf.cf_rfc`.
Conversación: `type` (`thread`/`comment`), `visibility` (`public`/otro), `author.name`, `createdTime`/`commentedTime`, `summary`/`content`, `attachments[]` (cada uno con `name`).

---

## Qué darle al desarrollador (paquete completo de entrega)

1. Este documento (especificación técnica).
2. `HU47696 Mis Tickets de Soporte en el ERP.feature` (Gherkin — criterios de aceptación para QA, incluye escenarios de la conexión con Zoho Desk).
3. `HU47696 Mis Tickets de Soporte en el ERP - Explicacion Dev.md` (explicación en lenguaje simple).
4. Las 3 credenciales de Zoho Desk (client_id, client_secret, refresh_token) — entregarlas en persona/chat cifrado, nunca en un documento que quede archivado en texto plano.
5. Link del prototipo visual (referencia de diseño): el que ya tienes publicado.
