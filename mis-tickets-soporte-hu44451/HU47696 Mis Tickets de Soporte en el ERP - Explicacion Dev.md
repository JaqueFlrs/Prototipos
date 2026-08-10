# Mis Tickets de Soporte en el ERP — Explicación para desarrollo (HU47696 / Zoho Desk #44451)

## Qué está pidiendo el cliente y por qué

Ahora mismo, si un cliente de GM Transport quiere saber cómo va un ticket de soporte que levantó, tiene que salirse del ERP y entrar al portal de Zoho Desk. Eso es un paso extra que no debería existir. Lo que se pide es que, sin salir del ERP, el usuario pueda ver sus propios tickets de soporte, su estatus, y la conversación completa con soporte — como si tuviera el portal de Zoho Desk metido dentro del propio ERP. Esto aplica para **todas las empresas que usan el ERP**, no solo para una en particular.

---

## Parte 1 — Servicio central de tickets de soporte

Este es el punto de partida. Es un servicio nuevo (backend), independiente del ERP y de GM Integra, que hace de intermediario entre las instalaciones del ERP y Zoho Desk.

### Cómo conectarte a Zoho Desk

OAuth2, flujo **Self Client**:

1. [api-console.zoho.com](https://api-console.zoho.com) → crear cliente tipo **Self Client**.
2. "Generate Code" con scope `Desk.tickets.READ`. Dura 10 min, canjéalo de inmediato.
3. Canjear código:
   ```
   POST https://accounts.zoho.com/oauth/v2/token
   grant_type=authorization_code&client_id=...&client_secret=...&code=...
   ```
   Regresa `access_token` (1 hora) y `refresh_token` (no expira, guardar cifrado — nunca en texto plano ni en el código).
4. Renovar `access_token` cuando expire:
   ```
   POST https://accounts.zoho.com/oauth/v2/token
   grant_type=refresh_token&client_id=...&client_secret=...&refresh_token=...
   ```
5. Llamadas: header `Authorization: Zoho-oauthtoken {access_token}`, base `https://desk.zoho.com/api/v1/`.

Si luego hace falta otro scope (`Desk.contacts.READ`, etc.), no se puede ampliar el refresh_token — repetir desde el paso 2.

### Qué hace el servicio con esa conexión, en operación normal

1. Guarda sus propias credenciales de Zoho Desk (client_id, client_secret, refresh_token) en su configuración — nunca en el ERP.
2. Cuando necesita consultar tickets y no tiene un token de acceso vigente, pide uno nuevo a Zoho Desk usando el refresh_token (paso 5 de arriba). El token de acceso dura 1 hora; hay que renovarlo cuando expire.
   - Si el refresh_token ya no es válido y no se puede obtener un token nuevo, el servicio responde al ERP con una falla genérica — nunca expone el error técnico real de Zoho.
3. Filtra **siempre** por `departmentId = 890726000000006907` (departamento "GMTransportErp") de forma fija en el código. La cuenta de Zoho Desk es compartida con otros productos (Franquicias, Rastreo Satelital) — esos nunca deben mezclarse, aunque el RFC coincida.
4. Trae los tickets de una empresa usando el campo `cf.cf_rfc` del ticket en Zoho Desk. Este campo lo captura un agente a mano, así que hay que **normalizarlo (quitar espacios, todo en mayúsculas)** antes de compararlo contra el RFC de la instalación — si no, un ticket puede "desaparecer" por un espacio de más.
5. Traduce el estatus real de Zoho Desk (que es texto libre configurado por los agentes) a un estatus fijo que entiende el ERP:
   - "Documentándose" (y similares de trabajo en curso) → "En proceso"
   - "Resuelto - Pendiente del cliente" / "Pendiente por el cliente" → "Esperando tu respuesta"
   - "Finalizado" / "Cerrado" → "Cerrado"
   - Para todo lo demás, usar el campo `statusType` de Zoho (`Open`/`Closed`) como base, no el texto exacto del estatus.
6. Trae los tickets en **lotes por departamento** (una consulta paginada general), nunca una consulta a Zoho por cada empresa — y los reparte internamente por RFC. Esto es lo que permite que el costo no crezca aunque haya miles de clientes.
7. Mantiene un caché con vigencia distinta según el tipo de vista:
   - Vistas "Abiertos" / "En espera" / "Vencidos": 5 minutos.
   - Vistas "Cerrados" / "Todos": 30 minutos.
   - Mientras el caché esté vigente, responde con el dato guardado sin volver a consultar Zoho Desk.
8. Antes de mostrar el detalle de un ticket, valida que el RFC del ticket coincida con el de la instalación que lo pide. Si no coincide, responde **como si el folio no existiera** — nunca revela que el ticket existe en otra empresa.
9. Al armar la conversación de un ticket, filtra las notas internas (`type: "comment"` / `isPublic: false` en Zoho Desk) y solo entrega los mensajes públicos (`type: "thread"`, `visibility: "public"`). Esto no es opcional ni depende de nada — se filtra siempre, en el servicio, antes de que la información salga hacia el ERP.
10. Los adjuntos de los mensajes se exponen a través de una URL propia del servicio (proxy) — nunca se expone al ERP ni al cliente final la URL directa de Zoho Desk.
11. Corre un proceso de sincronización en segundo plano (una vez al día, acordado con el cliente) para que el dato nunca esté completamente frío aunque nadie abra la pantalla en todo el día.

---

## Parte 2 — Pantalla "Mis Tickets de Soporte" en el ERP

Esta pantalla se construye después de que el servicio central ya responde. El ERP **nunca** guarda ni usa un token de Zoho Desk — solo llama por HTTP al servicio central, enviando el/los RFC de la instalación.

1. En la barra superior del ERP, junto al ícono de ayuda (el signo de interrogación), se agrega un ícono nuevo con forma de ticket.
2. Cualquier usuario que tenga sesión abierta en el ERP puede dar clic ahí. No hay que configurar ningún permiso especial.
3. Al dar clic, se abre la pantalla "Mis Tickets de Soporte", que llama al servicio central (no a Zoho Desk).
4. Esa pantalla trae 5 pestañas: **Abiertos** (la que sale seleccionada por default), **En espera**, **Vencidos**, **Cerrados**, **Todos**.
5. En cada pestaña se muestra una tabla con 3 columnas nada más: **Folio**, **Asunto**, **Estatus**. Nada de prioridad, fechas ni comentarios en esta tabla — eso va en el detalle (paso 8).
6. Los tickets que se muestran son SOLO los de la empresa donde el usuario tiene la sesión abierta (por su RFC) — esto ya lo filtra el servicio central, el ERP solo muestra lo que recibe.
   - Si la instalación tiene activado el parámetro de "multiempresa" (varias razones sociales en el mismo ERP), se envían todos los RFC de esa instalación al servicio central y se muestran los tickets de todos ellos juntos.
7. Reglas de qué aparece en cada pestaña:
   - **Abiertos**: tickets con estatus abierto. Sin límite de fecha — se muestran todos, sin importar qué tan viejos sean.
   - **En espera**: tickets donde soporte ya contestó y está esperando que el cliente responda. El servicio central ya entrega el estatus como "Esperando tu respuesta" — la pantalla nunca debe mostrar el texto original de Zoho.
   - **Vencidos**: tickets abiertos cuya fecha compromiso ya pasó respecto a hoy. Esto es sin importar en qué otra categoría estarían (un ticket "Nuevo" vencido aparece aquí también).
   - **Cerrados**: solo los cerrados de los **últimos 3 meses** contando desde hoy. Los cerrados de hace más de 3 meses no se muestran.
   - **Todos**: junta abiertos + en espera + vencidos + cerrados (con el mismo límite de 3 meses para los cerrados).
8. Si el usuario da clic sobre cualquier fila del listado, se abre el detalle de ese ticket con:
   - Folio, asunto, estatus, prioridad, canal (por dónde se levantó: chat, correo, teléfono o portal web).
   - Fecha de creación, fecha de la última actualización, fecha compromiso.
   - Nombre de la persona de soporte que lo está atendiendo.
   - Debajo de todo eso, el hilo completo de la conversación, en orden: el mensaje más viejo arriba, el más nuevo abajo.
9. Si un mensaje de la conversación tiene un archivo adjunto:
   - Si es una imagen, se muestra como una miniatura (no solo el nombre del archivo).
   - Si es cualquier otro tipo de archivo (PDF, Excel, etc.), se muestra como un elemento con nombre que se pueda descargar.
   - Los adjuntos se piden a través del servicio central, nunca con una URL directa de Zoho Desk.
10. Si el ticket está en la categoría "En espera", en el detalle también se muestra el aviso "Esperando tu respuesta", visible junto al estatus.
11. Arriba de la tabla del listado se muestra un texto tipo "Actualizado hace 3 min" y un botón "Actualizar". Al dar clic en "Actualizar", se vuelve a consultar el servicio central y el texto se actualiza a "hace 0 min".
12. Además del botón manual, el proceso diario del servicio central (parte 1, punto 11) hace que la información nunca tenga más de un día de retraso aunque nadie dé clic en "Actualizar".
13. Esta pantalla es **solo de consulta**. No hay ningún botón para responder, comentar ni cerrar un ticket desde el ERP. Si el cliente quiere responder algo, tiene que seguir usando el canal que ya usa hoy (correo o el portal de atención a clientes).

---

## Casos que también debes cubrir (no son opcionales)

- **Listado vacío**: si la empresa no tiene ningún ticket en la pestaña seleccionada, se muestra el mensaje "No tienes tickets de soporte registrados." — no se deja la tabla vacía sin explicación, ni se muestran encabezados de columna sin filas.
- **Falla del servicio central** (se cae, no responde, o no logra autenticarse contra Zoho Desk): la pantalla del ERP muestra el mensaje "No se pudo consultar el estatus de tus tickets en este momento, intenta más tarde." Nunca se muestra un código de error técnico, ni el mensaje real que regresa el servicio o Zoho Desk. La pantalla no se queda cargando indefinidamente.
- **Notas privadas del equipo de soporte**: en Zoho Desk, los agentes a veces dejan notas internas marcadas como privadas dentro del mismo ticket. **Esas notas NUNCA deben llegar al ERP ni al cliente, bajo ninguna circunstancia.** Se filtran siempre en el servicio central, antes de que la información salga de ahí — el ERP ni siquiera las recibe.
- **Doble clic o clics repetidos**: si el usuario da clic varias veces seguidas en una fila o en "Actualizar" mientras está cargando, no debe disparar varias consultas al mismo tiempo.
- **RFC mal escrito o con espacios**: el servicio central normaliza (quita espacios, pasa a mayúsculas) el RFC antes de compararlo contra `cf_rfc` de Zoho Desk.
- **Ticket de otra empresa por folio adivinado**: si alguien intenta ver el detalle de un folio que no pertenece a su instalación, el servicio central responde como si no existiera — nunca debe poder confirmarse que el ticket existe en otra empresa.

## Qué NO te puedes brincar (excusas ya resueltas)

- "¿Y si el ticket no tiene fecha compromiso?" → Entonces nunca puede aparecer en "Vencidos" (no hay fecha con la cual compararlo), pero sí en las demás pestañas que le correspondan según su estatus.
- "¿Esto aplica solo para un cliente en específico?" → No. Aplica para **todas** las empresas que usan el ERP, sin excepción y sin necesidad de activar nada por cliente.
- "¿Puedo dejar que se vea también la nota privada si el ticket ya está cerrado?" → No. Nunca. Sin excepción, sin importar el estatus.
- "¿Qué hago si el servicio central o Zoho Desk tardan mucho en responder?" → Se trata igual que una falla: se muestra el mensaje genérico, no se deja la pantalla cargando indefinidamente.
- "¿El usuario puede responder un ticket desde aquí si le urge?" → No, esta pantalla es solo de consulta. Ni un textarea, ni un botón de "Responder".
- "Pensé que 'Todos' era lo mismo que traer todo el historial completo sin límite" → No. "Todos" también respeta el límite de 3 meses para los tickets cerrados; los abiertos/en espera/vencidos sí se muestran completos porque son pocos por naturaleza.
- "Pensé que el ERP podía guardar el token de Zoho Desk para ir más rápido" → No, bajo ninguna circunstancia. El ERP nunca guarda ni usa el token — siempre pasa por el servicio central.

## Cómo saber que ya quedó bien

**Servicio central:**
- ✅ Obtiene y renueva el token de Zoho Desk solo, sin intervención manual.
- ✅ Solo trae tickets del departamento "GMTransportErp", nunca de Franquicias ni Rastreo Satelital.
- ✅ El estatus que entrega ya viene traducido ("En proceso", "Esperando tu respuesta", "Cerrado"), nunca el texto original de Zoho.
- ✅ Responde desde caché cuando la vista está vigente, y vuelve a consultar Zoho Desk cuando ya expiró.
- ✅ Nunca entrega una nota privada, probándolo con un ticket que sí tenga una.
- ✅ Si el folio no pertenece a la instalación que pregunta, responde como si no existiera.

**Pantalla del ERP:**
- ✅ El ícono de tickets aparece en la topbar para cualquier usuario, sin configurar nada.
- ✅ Las 5 pestañas filtran correctamente según las reglas de arriba, y "Abiertos" es la que abre por default.
- ✅ La tabla del listado solo tiene Folio, Asunto y Estatus.
- ✅ El detalle trae todos los campos listados en la Parte 2 (paso 8), más la conversación completa y los adjuntos (imagen = miniatura, otro archivo = descargable).
- ✅ El botón "Actualizar" funciona y el texto "Actualizado hace X" se actualiza al usarlo.
- ✅ Si falla el servicio central, se ve el mensaje genérico, no un error técnico.
- ✅ No existe ningún botón para responder o modificar un ticket desde esta pantalla.

## Referencia

Ver Gherkins:
- `HU47696-1 Servicio Central de Tickets de Soporte.feature` — criterios de aceptación del servicio backend (construir primero).
- `HU47696 Mis Tickets de Soporte en el ERP.feature` — criterios de aceptación de la pantalla del ERP (construir después).
