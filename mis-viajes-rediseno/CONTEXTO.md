# Contexto — Prototipo Mis Viajes (rediseño app + ERP)

**Publicado en:** https://jaqueflrs.github.io/Prototipos/mis-viajes-rediseno/
**Archivo único:** `index.html` (todo el prototipo — celular simulado + panel ERP — vive en un solo HTML con CSS/JS embebido, sin dependencias externas salvo el CDN de Tabler Icons)

## Qué es este prototipo

Prototipo interactivo de alta fidelidad para el rediseño de **Mis Viajes** (app Flutter de operadores de transporte de GM Transport). Combina dos partes en la misma página:

1. **Celular simulado** (arriba): recorre todos los flujos de la app tocando los botones — login, inicio, salida/llegada, evidencias, chat, carta porte, liquidaciones, gastos, inspecciones, turno, asistencia, fallas, perfil, SOS.
2. **Panel ERP wireframe** (abajo): configuración administrativa **vinculada en vivo** al celular — cualquier cambio ahí se refleja al instante arriba.

El objetivo es mostrar cómo cada cliente/operador puede ajustar la app a sus necesidades sin perder funcionalidad, y validar el flujo antes de pasar a desarrollo real en Flutter.

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
- El código de falla, campos de Salida/Llegada, procesos/módulos, tarjeta del inicio, etc. — todo se controla vía el objeto `PROC` (mapa `clave → [ids de elementos del celular]`) y la función `procTg(key, on)` / `campoDefault(key, on)`. Si se agrega un nuevo elemento configurable, seguir ese mismo patrón.
- El árbol de derechos (`DERECHOS_TREE`) es un objeto JS con columnas en cascada (`col1`, `col2-viajes`, `col3-docs`, etc.) — cada item puede tener `proc:'clave'` para vincularse a un elemento real del celular, o no tener `proc` si es una acción granular sin toggle propio en el mockup (eso está bien, no todos necesitan estar wireados).

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
