# Mis Tickets de Soporte en el ERP — Explicación para desarrollo (HU47696 / Zoho Desk #44451)

## Qué está pidiendo el cliente y por qué

Ahora mismo, si un cliente de GM Transport quiere saber cómo va un ticket de soporte que levantó, tiene que salirse del ERP y entrar al portal de Zoho Desk. Eso es un paso extra que no debería existir. Lo que se pide es que, sin salir del ERP, el usuario pueda ver sus propios tickets de soporte, su estatus, y la conversación completa con soporte — como si tuviera el portal de Zoho Desk metido dentro del propio ERP. Esto aplica para **todas las empresas que usan el ERP**, no solo para una en particular.

## Paso a paso de lo que debe pasar

1. En la barra superior del ERP, junto al ícono de ayuda (el signo de interrogación), se agrega un ícono nuevo con forma de ticket.
2. Cualquier usuario que tenga sesión abierta en el ERP puede dar clic ahí. No hay que configurar ningún permiso especial — si el usuario ya entró al ERP, puede entrar a esta pantalla.
3. Al dar clic, se abre la pantalla "Mis Tickets de Soporte".
4. Esa pantalla trae 5 pestañas: **Abiertos** (la que sale seleccionada por default), **En espera**, **Vencidos**, **Cerrados**, **Todos**.
5. En cada pestaña se muestra una tabla con 3 columnas nada más: **Folio**, **Asunto**, **Estatus**. Nada de prioridad, fechas ni comentarios en esta tabla — eso va en el detalle (paso 8).
6. Los tickets que se muestran son SOLO los de la empresa donde el usuario tiene la sesión abierta (por su RFC). Nunca se mezclan tickets de otra empresa, sin importar la pestaña que se esté viendo.
   - Si la instalación tiene activado el parámetro de "multiempresa" (varias razones sociales en el mismo ERP), se muestran los tickets de TODOS los RFC de esa instalación, no solo del principal.
7. Reglas de qué aparece en cada pestaña:
   - **Abiertos**: tickets con estatus tipo "Nuevo" o "En proceso" (usar el campo `statusType = Open` de Zoho Desk, no el texto del estatus). Sin límite de fecha — se muestran todos, sin importar qué tan viejos sean.
   - **En espera**: tickets donde soporte ya contestó y está esperando que el cliente responda. En Zoho Desk esto puede venir con el texto "Pendiente por el cliente" o "Resuelto - Pendiente del cliente" — en la pantalla, a estos SIEMPRE se les debe mostrar el texto "Esperando tu respuesta", nunca el texto original de Zoho.
   - **Vencidos**: tickets abiertos cuya fecha compromiso (columna "Vence") ya pasó respecto a hoy. Esto es sin importar en qué otra categoría estarían (un ticket "Nuevo" vencido aparece aquí también).
   - **Cerrados**: tickets con `statusType = Closed`, pero solo de los **últimos 3 meses** contando desde hoy. Los cerrados de hace más de 3 meses no se traen — ni se muestran ni se cuentan.
   - **Todos**: junta abiertos + en espera + vencidos + cerrados (con el mismo límite de 3 meses para los cerrados).
8. Si el usuario da clic sobre cualquier fila del listado, se abre el detalle de ese ticket con:
   - Folio, asunto, estatus, prioridad, canal (por dónde se levantó: chat, correo, teléfono o portal web).
   - Fecha de creación, fecha de la última actualización, fecha compromiso.
   - Nombre de la persona de soporte que lo está atendiendo.
   - Debajo de todo eso, el hilo completo de la conversación, en orden: el mensaje más viejo arriba, el más nuevo abajo.
9. Si un mensaje de la conversación tiene un archivo adjunto:
   - Si es una imagen, se muestra como una miniatura (no solo el nombre del archivo).
   - Si es cualquier otro tipo de archivo (PDF, Excel, etc.), se muestra como un elemento con nombre que se pueda descargar.
10. Si el ticket está en la categoría "En espera", en el detalle también se muestra el aviso "Esperando tu respuesta", visible junto al estatus.
11. Arriba de la tabla del listado se muestra un texto tipo "Actualizado hace 3 min" y un botón "Actualizar". Al dar clic en "Actualizar", se vuelve a consultar la información real y el texto se actualiza a "hace 0 min".
12. Además del botón manual, hay un proceso que corre una vez al día automáticamente y refresca la información de todos los tickets en segundo plano, sin que el usuario tenga que hacer nada. Así, aunque nadie dé clic en "Actualizar" en todo el día, la información nunca tiene más de un día de retraso.
13. Esta pantalla es **solo de consulta**. No hay ningún botón para responder, comentar ni cerrar un ticket desde el ERP. Si el cliente quiere responder algo, tiene que seguir usando el canal que ya usa hoy (correo o el portal de Zoho Desk).

## Casos que también debes cubrir (no son opcionales)

- **Listado vacío**: si la empresa no tiene ningún ticket en la pestaña seleccionada, se muestra el mensaje "No tienes tickets de soporte registrados." — no se deja la tabla vacía sin explicación, ni se muestran encabezados de columna sin filas.
- **Falla la conexión con Zoho Desk** (se cae el servicio, el token expiró, lo que sea): se muestra el mensaje "No se pudo consultar el estatus de tus tickets en este momento, intenta más tarde." Nunca se muestra un código de error técnico, ni el mensaje real que regresa Zoho Desk.
- **Notas privadas del equipo de soporte**: en Zoho Desk, los agentes a veces dejan notas internas marcadas como privadas dentro del mismo ticket (por ejemplo, comentarios entre ellos sobre cómo resolverlo). **Esas notas NUNCA deben llegar al cliente, bajo ninguna circunstancia.** Esto no es negociable ni depende del estatus del ticket — se filtran siempre, en el servidor, antes de que la información llegue al ERP.
- **Doble clic o clics repetidos**: si el usuario da clic varias veces seguidas en una fila o en "Actualizar" mientras está cargando, no debe disparar varias consultas al mismo tiempo — hay que evitar la llamada duplicada mientras la anterior no termine.
- **RFC mal escrito o distinto entre el ERP y Zoho Desk**: el RFC que se usa para filtrar debe normalizarse (quitar espacios, todo en mayúsculas) antes de comparar contra el campo `cf_rfc` de Zoho Desk — si no, un ticket puede "desaparecer" solo porque alguien lo capturó con un espacio de más.

## Qué NO te puedes brincar (excusas ya resueltas)

- "¿Y si el ticket no tiene fecha compromiso?" → Entonces nunca puede aparecer en "Vencidos" (no hay fecha con la cual compararlo), pero sí en las demás pestañas que le correspondan según su estatus.
- "¿Esto aplica solo para un cliente en específico?" → No. Aplica para **todas** las empresas que usan el ERP, sin excepción y sin necesidad de activar nada por cliente.
- "¿Puedo dejar que se vea también la nota privada si el ticket ya está cerrado?" → No. Nunca. Sin excepción, sin importar el estatus.
- "¿Qué hago si Zoho Desk tarda mucho en responder?" → Se trata igual que una falla de conexión: se muestra el mensaje genérico, no se deja la pantalla cargando indefinidamente.
- "¿El usuario puede responder un ticket desde aquí si le urge?" → No, esta pantalla es solo de consulta. Ni un textarea, ni un botón de "Responder".
- "Pensé que 'Todos' era lo mismo que traer todo el historial completo sin límite" → No. "Todos" también respeta el límite de 3 meses para los tickets cerrados; los abiertos/en espera/vencidos sí se muestran completos porque son pocos por naturaleza.

## Cómo saber que ya quedó bien

- ✅ El ícono de tickets aparece en la topbar para cualquier usuario, sin configurar nada.
- ✅ Las 5 pestañas filtran correctamente según las reglas de arriba, y "Abiertos" es la que abre por default.
- ✅ La tabla del listado solo tiene Folio, Asunto y Estatus.
- ✅ El detalle trae todos los campos listados en el paso 8, más la conversación completa y los adjuntos (imagen = miniatura, otro archivo = descargable).
- ✅ Ninguna nota privada aparece jamás en el detalle, probándolo con un ticket que sí tenga una.
- ✅ El botón "Actualizar" funciona y el texto "Actualizado hace X" se actualiza al usarlo.
- ✅ Si se apaga/falla la conexión con Zoho Desk, se ve el mensaje genérico, no un error técnico.
- ✅ No existe ningún botón para responder o modificar un ticket desde esta pantalla.

## Referencia

Ver Gherkin: `HU47696 Mis Tickets de Soporte en el ERP.feature` — mismo alcance, ahí está en formato de criterios de aceptación para QA.
