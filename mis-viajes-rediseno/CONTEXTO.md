# Contexto — Prototipo Mis Viajes (rediseño app + ERP)

**Publicado en:** https://jaqueflrs.github.io/Prototipos/mis-viajes-rediseno/
**Archivo único:** `index.html` (todo el prototipo — celular simulado + panel ERP — vive en un solo HTML con CSS/JS embebido, sin dependencias externas salvo el CDN de Tabler Icons)

## Qué es este prototipo

Prototipo interactivo de alta fidelidad para el rediseño de **Mis Viajes** (app Flutter de operadores de transporte de GM Transport). Combina dos partes en la misma página:

1. **Celular simulado** (arriba): recorre todos los flujos de la app tocando los botones — login, inicio, salida/llegada, evidencias, chat, carta porte, liquidaciones, gastos, inspecciones, turno, asistencia, fallas, perfil, SOS.
2. **Panel ERP wireframe** (abajo): configuración administrativa **vinculada en vivo** al celular — cualquier cambio ahí se refleja al instante arriba.

El objetivo es mostrar cómo cada cliente/operador puede ajustar la app a sus necesidades sin perder funcionalidad, y validar el flujo antes de pasar a desarrollo real en Flutter.

## Conocimiento del sistema real "Mis Viajes" (contexto de negocio, no del prototipo)

Esto es lo que se investigó del sistema **real** (código fuente + capturas de pantalla de producción) antes de diseñar el prototipo. Sirve para no perder este contexto de negocio en sesiones futuras.

### Qué es Mis Viajes
App móvil para operadores de transporte de GM Transport. Gestiona el ciclo completo de un viaje:

**Sin salida → En ruta → Terminado → Pendiente a liquidar**

Incluye gastos CFDI (flujo de 5 pasos), liquidaciones en PDF, y registro de odómetro/GPS en cada salida y llegada.

### Stack técnico
- **App:** Flutter v15.0.0, Dart ^3.8.0, Android + iOS, patrón BLoC, Clean Architecture, offline-first, HERE Maps para mapas, 35 módulos de inyección de dependencias
- **Backend:** Go, Air (hot reload), Redis (opcional), Make
- **Multi-país:** México (usa RFC) y Guatemala (usa NIT) — el prototipo solo cubre el caso México
- **Reglas de código del backend:** `Either<Failure,T>` en todos los repositorios y UseCases (nunca throws directos); Hive typeIds 0–80 ya ocupados, cualquier typeId nuevo debe ser > 120
- **2 APIs distintas:** `API_URL` (todo el sistema) y `GM_DOBLE_CHECK_URL` (inspecciones C-TPAT + Azure Storage)
- Repos: `gm-mis-viajes` (app), `gm-mis-viajes-backend` (Go), `gm-mis-viajes-db` (base de datos)

### Pantallas/procesos reales inventariados (de capturas de producción)
Splash, inicio, detalle de trayecto, balance de gastos, lista de trayectos, carta porte, inspecciones físico-mecánicas, solicitudes, reportes, perfil, historial de entradas/salidas, notificaciones, registro de entrada — todo esto se revisó a fondo (3 agentes en paralelo: uno en salida/llegada/geocercas, otro en solicitudes/gastos/liquidaciones/chat/inspecciones, otro en nombres de campos y jerarquía visual de las capturas) antes de rediseñar.

### Hallazgos importantes del sistema real (afectan decisiones de diseño)
- **Geocercas no muestran un anillo visual en la app real** — solo es una bandera/flag que, al activarse, registra automáticamente la salida y llegada sin que el operador tenga que hacerlo manualmente. El prototipo respeta esto: cuando la geocerca está activa, se bloquea el registro manual y aparece un chip "Geocerca" (no un mapa con círculo).
- **El campo "Código de Falla" en el sistema real es de texto libre** y genera muchos errores de captura (typos, inconsistencia). Por eso en el prototipo se reemplazó por un catálogo estructurado (dropdown con categorías) — ver sección de decisiones de diseño abajo.
- Liquidaciones: el sistema real permite ver Última, Penúltima y Todas — **sin usar tabs**, se muestran apiladas (así quedó también en el prototipo).
- Solicitudes: al entrar a la pantalla ya deben verse las solicitudes propias y las de los compañeros en una sola lista, con la acción de crear una nueva integrada ahí mismo (no en una pantalla aparte) — el prototipo sigue este patrón.
- Inspecciones físico-mecánicas: flujo real de 5 pasos (Movimiento / Unidad / Revisión / Seguridad / Firma) — replicado en el prototipo.
- Gastos: flujo CFDI de 5 pasos.

### Relación Viaje ↔ Trayecto y flujo real de "Dar salida" / "Dar llegada" (investigación profunda del código, sesión posterior)

Esto se investigó a fondo (3 agentes en paralelo sobre `gm-mis-viajes-main`, `gm-mis-viajes-backend-main` y el schema/BD) porque no estaba claro si "Dar salida (manual/solicitud/geocerca)" eran 3 pantallas distintas. **Conclusión verificada en código:**

- **Un viaje (`ViajeSimple`) tiene 1-a-N trayectos (`Trayecto`)**. Cada trayecto tiene `fechaSalida` y `fechaLlegada` (nullable) — el estatus se **calcula**, no se guarda:
  - `Salida==null && Llegada==null` → **SIN SALIDA**
  - `Salida!=null && Llegada==null` → **EN RUTA**
  - `Salida!=null && Llegada!=null && TrayectoLiquidable==0` → **TERMINADO**
  - `Salida!=null && Llegada!=null && IdLiquidacion==null && TrayectoLiquidable==1` → **PENDIENTE LIQUIDAR**
- **Navegación real:** Lista de viajes → **Lista de trayectos del viaje** (`trayectos_page.dart`) → **Detalle del trayecto** (`trayecto_detalle_page.dart`) → desde ahí, un **botón contextual** (`contextual_action_button.dart`, HU41902) decide qué mostrar.
- **"Manual" y "Geocerca" son LA MISMA PANTALLA** (`RegistrarSalidaPage` / `RegistrarLlegadaPage`), diferenciada solo por el campo `esGeocerca` (bool) del trayecto — el botón cambia de etiqueta ("Registrar Salida" vs "Registrar Salida (Geocerca)") pero abre el mismo formulario.
- **"Solicitud" es realmente distinto**: NO abre ningún formulario de registro. Dispara `EnviarNotificacionClienteEvent` (BLoC `AsistenciaBloc`/`SolicitudLlegadaSalidaBloc`) que **envía una notificación al centro de control/despachador** (incluye ubicación GPS vía link de Google Maps) pidiendo que ellos autoricen/registren. No hay "aprobación" visible en la app del operador, solo el envío del aviso.
- **Lógica de prioridad real del botón contextual** (replicada en el prototipo dentro de `page-trayecto-detalle` / función `renderCtxAction()`):
  1. Si `esGeocerca=true`: solo importa el permiso **manual** — si lo tiene, botón "Registrar Salida/Llegada (Geocerca)" (mismo formulario); si no lo tiene, queda bloqueado esperando el disparo automático (el permiso de "solicitud" se ignora por completo cuando es geocerca).
  2. Si NO es geocerca: prioridad = Registrar (manual, si hay permiso) → si no, Solicitar (si hay permiso de solicitud) → si no, sin acción disponible.
- **Campos reales capturados:**
  - Salida: odómetro (km y millas, sincronizado bilateralmente con el ERP — se toma el mayor entre lo capturado y lo que ya tiene el ERP), fecha/hora, estatus del viaje, coordenadas GPS (obligatorias, sin GPS el registro falla).
  - Llegada: lo mismo + estatus de **4 unidades** (Camión, Carga1, Dolly, Carga2 — las que no aplican se envían como "sin cambios").
  - Todo viaja a Go backend (`POST /trayecto/salida`, `POST /trayecto/llegada`) que reenvía por SOAP al ERP.

**Cómo quedó reflejado en el prototipo:** se agregaron las pantallas `page-viaje-trayectos` (lista de N trayectos de un viaje) y `page-trayecto-detalle` (info + botón contextual). El botón contextual lee en vivo los permisos `sal-manual`/`sal-solicitud`/`sal-geocerca` (y sus equivalentes `lleg-*`) del árbol de derechos del ERP, más el toggle global "Geocerca activada" — igual que el sistema real.

## Estado actual (resumen "Se propone" — ya está en el HTML, arriba del celular)

### En la app
- Rediseño completo de la interfaz (login, inicio, salida/llegada, evidencias, chat, carta porte, liquidaciones, gastos, inspecciones, turno, asistencia, perfil)
- Inicio configurable: ocultar/mostrar gráfico de ruta, distancia, fecha de descarga, número de viaje, hora de sucursal, ver mapa
- **Reportar falla + Mis reportes fusionados en 1 sola pantalla** (antes eran 2 pantallas separadas — causaba confusión)
- Catálogo de códigos de falla por categoría (Motor, Frenos, Llantas, Suspensión, Eléctrico) en vez de iconos fijos — viable para catálogos grandes/configurables por cliente
- SOS se activa directo (sin confirmar) pero se puede cancelar si fue por error
- Filtros por estatus en Mis Viajes (Todos/En ruta/Terminados/Pendientes) y en Liquidaciones (Todas/Pagadas/Pendientes/Rechazadas)
- Listado de viajes con más variedad de estatus de ejemplo (en ruta, pendiente liquidar, programado)
- Botones más chicos y menos saturados (Evidencia/Estatus/Chat/Viaje terminado)

### En el ERP (panel wireframe gris, abajo del celular)
- **Selector de operador en 2 pasos** (simple para usuario dummie): Paso 1 = lista con checkboxes (buscar, marcar uno/varios/"Seleccionar todos") → botón "Configurar →". Paso 2 = aparece la configuración con un letrero "Configurando: X" y link "← Cambiar selección"
- **Solo 2 pestañas** dentro del paso de configuración:
  - **Configuración**: todo junto con subtítulos — Interfaz y comportamiento (modo simple/completo, geocerca), Vistas de viajes (listado + tarjeta del inicio), Formularios (todos los campos / solo obligatorios), Campos y valores por default en Salida/Llegada
  - **Derechos del operador**: árbol de permisos en cascada (3 columnas "Proceso"), igual al patrón real del ERP GM Transport — **lo que se desmarca ahí desaparece del celular del operador**
- Valores por default: si el operador no captura un campo (ej. Estatus), se autocompleta con un valor fijo configurable; Fecha/hora usa la hora actual del dispositivo
- Se revisaron y quitaron permisos que ya no se usaban: "Registro de Entrada/Salidas" (huérfanos, redundantes con el detalle granular de Dar salida/llegada), "Asistencia Grúa" (sin pantalla propia), y se fusionó el permiso duplicado de fallas en uno solo
- Estilo **wireframe gris** (sin naranja) para dejar explícito que el ERP es solo referencia funcional — el celular sí conserva el diseño visual real de la app

## Decisiones de diseño / feedback aplicado (para no repetir errores)

- **El operador NO se selecciona con tarjetas/modos en la misma pantalla** — se probó (tarjetas "Un operador/Varios/Todos" con autocompletar) y no funcionó para un usuario dummie. Se cambió a: lista simple → seleccionar → botón "Configurar" en un paso separado. **No volver al patrón de tarjetas.**
- **No usar acordeón colapsable** en la configuración del ERP — se pidió tabs en su lugar, y luego se pidió reducir de 5 tabs a solo 2 (Configuración todo-en-uno + Derechos separado).
- **El texto de resumen arriba del celular** ("Se propone:") debe ser **bullets directos, sin lenguaje de venta/marketing** ("mamonería"). Nada de headlines llamativos, stats destacados ni frases tipo "menos taps, menos errores". Solo: `Se propone:` + lista plana de qué se hace.
- Ese resumen debe reflejar **TODO lo trabajado en la sesión**, no solo el último cambio — si se agrega algo nuevo, actualizar el bullet correspondiente ahí también.
- El diseño del celular se ajustó para que no se vea "de juguete": bordes menos redondeados (7-10px en vez de 12-20px), sombras más sutiles (sin "glow"), naranja menos saturado (`#E8600F` en vez de `#FF7043`). Si se pide seguir afinando esto, es sobre ese eje (seriedad visual, no cambiar la esencia).
- Reportar falla usa **dropdown con optgroups por categoría**, no iconos — un catálogo de fallas puede tener cientos de códigos y no es viable representarlos como iconos.
- Campos de Salida/Llegada, tarjeta del inicio, tabs del menú inferior, etc. — se controlan vía el objeto `PROC` (mapa `clave → [ids de elementos del celular]`) y la función `procTg(key, on)` / `campoDefault(key, on)`. Si se agrega un nuevo elemento configurable de este tipo, seguir ese mismo patrón.
- **Los tiles de "Más herramientas" / tab "Otros" del home YA NO usan `PROC`/`procTg`** — se renderizan dinámicamente con `PROCESOS_DEF` (diccionario de {label, icon, page, derecho}) + la función `tieneDerecho(procKey)` (lee directo del árbol de derechos) + `renderProcesos()`. Si un tile de herramienta no aparece, revisar `PROCESOS_DEF` y el checkbox `data-principal` correspondiente, no el mapa `PROC`.
- **Por default, ninguna herramienta secundaria aparece en el home** ("Mostrar en pantalla principal") — los checkboxes `data-principal` de Carta porte/Gastos/Liquidaciones/Inspecciones/etc. arrancan **desmarcados**. El admin debe activarlas explícitamente por operador si quiere que aparezcan ahí; si no, solo viven en el tab "Otros". No revertir esto a "checked by default".
- El árbol de derechos (`DERECHOS_TREE`) es un objeto JS con columnas en cascada (`col1`, `col2-viajes`, `col3-docs`, etc.) — cada item puede tener `proc:'clave'` para vincularse a un elemento real (vía `PROC`, vía `tieneDerecho()` en pantallas nuevas, o vía `PROCESOS_DEF.derecho`). **Ya se auditó dos veces para quitar permisos muertos/duplicados** (Registro de Entrada/Salidas, Asistencia Grúa, Alta+Listado Reporte de Fallas duplicados, Asignar Estatus, Estatus Salida/Llegada duplicados con la pestaña de valores por default). Si se agrega un nuevo item al árbol, **siempre** dale un `proc` real y conéctalo a algo visible — no dejar permisos "de adorno" que no hagan nada, porque eso es exactamente lo que se ha estado limpiando.
- Los permisos "Dar salida/llegada (manual/solicitud/geocerca)" están conectados a `page-trayecto-detalle` vía `renderCtxAction()`, que lee `tieneDerecho('sal-manual')`, `tieneDerecho('sal-solicitud')`, `tieneDerecho('sal-geocerca')` (y sus equivalentes `lleg-*`) más la variable global `geoOn`. Ver la sección de arriba sobre el flujo real de Dar salida/llegada antes de tocar esta lógica — la prioridad geocerca > manual > solicitud es intencional y replica el código real (`contextual_action_button.dart`).

## Flujo de publicación (IMPORTANTE — ya resuelto, no perder tiempo en esto)

- Repo local en esta máquina: `C:\Users\jaqui\tmp-prototipos\` (clon de `JaqueFlrs/Prototipos`)
- **El remote debe usar el usuario `JaqueFlrs`** (`https://JaqueFlrs@github.com/JaqueFlrs/Prototipos.git`) — es el único que tiene permiso de push. Otros usuarios guardados en Credential Manager (`jaquelineflores`, `jaquelineflores94`) cuelgan o dan 403.
- Flujo: editar `index.html` → `git add` → `git commit -m "..."` → `git push origin main` (ya con el remote correcto no requiere pull previo salvo que otra sesión haya publicado algo).
- Antes de cada push, validar que el JS embebido no tenga errores de sintaxis:
  ```bash
  node -e "
  const fs = require('fs');
  const html = fs.readFileSync('index.html', 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
  new Function(scriptMatch[1]);
  console.log('JS SYNTAX OK');
  "
  ```
- Y que los `<div>` estén balanceados (útil tras ediciones grandes de HTML):
  ```bash
  node -e "
  const fs = require('fs');
  const html = fs.readFileSync('index.html', 'utf8');
  const chunk = html.slice(html.indexOf('<body>'), html.indexOf('<script>'));
  console.log('opens:', (chunk.match(/<div/g)||[]).length, 'closes:', (chunk.match(/<\/div>/g)||[]).length);
  "
  ```
- GitHub Pages tarda ~30-60 segundos en reflejar los cambios tras el push.

## Posibles siguientes pasos (no confirmados, solo pendientes de mencionar si Jaqueline pregunta)

- Nada pendiente explícitamente solicitado al cierre de esta sesión — el prototipo está en un punto estable y aprobado ("mucho mejor").
- Si se retoma, preguntar primero qué parte se quiere seguir afinando (visual del celular, ERP, o un flujo específico) antes de asumir.
