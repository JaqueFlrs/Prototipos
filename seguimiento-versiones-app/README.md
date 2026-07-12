# Seguimiento de Versiones — GM Transport

Sistema de seguimiento de tickets/HU/liberaciones para el equipo de Versiones, construido
sobre Firebase con datos reales de Zoho Projects (portal `gmtransporterp`, proyecto
`GM - MACRO PROYECTO`). Este README es el punto de partida para retomar el proyecto sin
tener que redescubrir todo desde cero — si vuelves después de mucho tiempo, léelo completo
antes de tocar código.

## Estado actual (no es Milestone 1 — ya está mucho más avanzado)

- **Frontend**: las 8 vistas están construidas y funcionando contra datos reales:
  Dashboard, Kanban por mes, Backlog Versiones, Cotizaciones, Liberaciones, Calendario,
  Mis Tickets (con bitácora), Administración, Configuración.
- **Login**: correo + contraseña (Firebase Auth Email/Password) — `frontend/src/pages/Login.tsx`
  usa `loginWithPassword`, no hay Google Sign-In implementado (una versión anterior de este
  README decía lo contrario; era un plan que no se llevó a cabo). La autorización real de la
  app es tener un doc en Firestore `usuarios/{email}` — sin eso, el login funciona pero la
  app no deja entrar.
- **Hosting**: desplegado en https://seguimientogm-a05df.web.app (desde este entorno, sin
  Firebase CLI instalado globalmente — se usó `firebase-tools` como dependencia local del
  proyecto + el service account para autenticar sin login interactivo). Para redeployar:
  `cd frontend && npm run build && cd .. && GOOGLE_APPLICATION_CREDENTIALS="<ruta-a-la-llave>"
  node_modules/.bin/firebase deploy --only hosting --project seguimientogm-a05df --non-interactive`.
- **Datos**: cargados **manualmente** vía un pipeline propio (ver abajo) porque todavía no
  hay una app OAuth de Zoho registrada para que las Cloud Functions sincronicen solas.
  `functions/src/sync.ts` existe, compila, y tiene la misma lógica que el pipeline manual —
  pero **nunca se ha desplegado ni probado en vivo** contra la API real de Zoho.
- **Firebase**: proyecto `seguimientogm-a05df`. Firestore, Auth y **Hosting** están en uso
  real (https://seguimientogm-a05df.web.app). **Functions no están desplegadas** todavía
  (el sync sigue siendo manual).
- **Git**: este proyecto vive dentro del repo `JaqueFlrs/Prototipos`
  (`C:\Users\jaqui\tmp-prototipos\`), pero **nunca se había comiteado hasta ahora** — todo
  el trabajo existía solo en el filesystem local hasta este commit.

## Cómo se sincronizan los datos hoy (pipeline manual, no automático)

No hay sync automático corriendo. Cuando los datos se ven desactualizados, el flujo es:

1. Traer datos frescos de Zoho vía el conector MCP (`ZohoProjects_get_tasks_by_project`),
   usando el `view_id` de la vista curada de Zoho que Jaqueline comparte
   (`view_id=2171959000013268165` sobre `portal_id=824013132`,
   `project_id=2171959000001008161`). Guardar la respuesta cruda (el MCP la guarda sola en
   un archivo de `tool-results` si es muy grande).
2. Editar `build-seed-data.cjs` para apuntar `RAW_FILES` al/los archivo(s) nuevo(s) (el
   primero de la lista gana en caso de IDs repetidos — es el más reciente).
3. `node build-seed-data.cjs` — genera `seed-data.json` (nunca se comitea, tiene datos
   reales de clientes).
4. `node seed-firestore.cjs "<ruta-a-la-llave-de-servicio.json>"` — sube todo a Firestore
   (colecciones `tickets`, `hus`, `releases`, merge, no borra nada).
5. **Borrar `seed-data.json` inmediatamente** — contiene nombres/datos reales de clientes,
   nunca debe persistir en disco más de lo necesario.

La llave de cuenta de servicio de Firebase vive **fuera de este repo**, en
`C:\Users\jaqui\Downloads\seguimientogm-a05df-firebase-adminsdk-fbsvc-faf1eff1b4.json`.
Si se pierde o se necesita regenerar: Firebase Console → Configuración del proyecto →
Cuentas de servicio → Generar nueva clave privada. Nunca subir esa llave a ningún repo.

## Reglas de negocio del modelo de datos (importante, no son obvias)

- **CH vs PB vs HU**: CH = solicitud de cambio, PB = reporte de error, HU = historia de
  usuario (subtarea de trabajo real). Cada familia tiene su propio flujo de estatus — ver
  `PIPE_CH` / `PIPE_PB` / `PIPE_HU` en `frontend/src/pages/MisTickets.tsx`.
- **Fecha de entrega — campo distinto según familia**: los tickets **PB** usan
  `fecha_de_publicacion`; los tickets **CH** usan `fecha_de_entrega_al_cliente`. Son el
  mismo concepto con nombre de campo distinto en Zoho — si solo se lee uno de los dos,
  la mitad de los tickets muestran "sin fecha" aunque sí la tengan capturada.
- **Las HU casi nunca traen su propia fecha** — heredan la de su ticket relacionado
  (`fechaHeredadaDe` guarda de cuál, para mostrarlo en la UI).
- **Relación ticket↔HU es de DOS tipos, no uno solo**:
  1. `parental_info.parent_task_id` — HU como subtarea directa del ticket (`rel: "parent"`).
  2. `dependency_info.predecessor` / `dependency_info.successor` — vínculo por la pestaña
     "Relacionadas" de Zoho, independiente de subtareas (`rel: "predecesora"` /
     `"sucesora"`). Si solo se revisa el primero, muchas HU aparecen sin ticket relacionado
     aunque sí lo tengan.
  3. Ambos vienen **embebidos en la lista plana de tareas** (`get_tasks_by_project`) — no
     hace falta llamar `get_task_details` por tarea. Ese endpoint de detalle, de hecho, NO
     devuelve subtasks/dependency utilizables (se probó en vivo) — no confiar en él.
- **Clasificación Dev/Calidad/Analista** (regla confirmada con la usuaria): dentro de una
  HU, las subtareas cuyo nombre empieza con `DEV -` → sus owners son los developers de esa
  HU; `QA -` → sus owners son calidad. El resto de owners de la HU/ticket que no sean
  owners de esas subtareas son analista (si su correo es `@...versiones@`) o soporte externo
  (se ignora). Regla Mari/Adrian: cuando ambos aparecen como analistas candidatos, el
  analista real es el tercero (son fijos como creador/revisor en casi todo ticket).
- **`fueraDeAlcance`**: tickets/HU sin nadie del depto Versiones identificado (ni analista
  ni dev/qa) se marcan con este flag en vez de borrarse — la UI los filtra
  (`useTickets`/`useHUs`), pero el dato sigue en Firestore por si el criterio cambia.
- **friendlyId de HU**: la mayoría de las HU llevan su número en el propio nombre
  ("HU45020 ...", "HU-80 ...") — extraerlo de ahí, no asumir que Zoho da un ID amigable
  aparte. Solo si de verdad no hay número se muestra "HU" genérico.
- **Roster real de analistas** (dominio `.versiones@gmtransporterp.com`): Jaqueline (Flores
  Ramos), Jonathan Saavedra, Jorge Antonio, Adrian Navarro, Maricruz (Flores Lopez), Alondra
  Verduzco (líder de Versiones).

## Firestore: colecciones y reglas

- `tickets/{id}`, `hus/{id}`, `releases/{id}` — espejo de solo lectura de Zoho. Solo se
  escriben desde Admin SDK (el script manual, o en el futuro `syncZoho`).
- `usuarios/{email}` — provisionamiento de roles, doc ID = correo. Solo super admin gestiona
  a otros; cada quien puede actualizar su propia `fotoURL`.
- `bitacoras/{taskId}/entries` — seguimiento rápido manual (Mis Tickets), sí se escribe
  desde el cliente.
- `config/{doc}` — apariencia (tema/modo/logo), org-wide.
- `notionTableros/{id}` + subcolección `filas/{id}` — **feature nueva, en progreso**:
  tableros propios del equipo (tipo Notion), completamente independientes de Zoho. Reglas
  ya agregadas en `firestore.rules` (cualquier persona provisionada puede leer/escribir —
  es un espacio compartido, no privado). El hook `frontend/src/hooks/useNotion.ts` ya
  existe; falta la página/nav (`Notion.tsx`) — quedó a medias, revisar antes de continuar.

**Importante**: `firestore.rules` en este repo puede no coincidir 1:1 con lo publicado en
Firebase en un momento dado — publicar reglas requiere el Firebase CLI (`firebase deploy
--only firestore:rules`) o la API de Security Rules con permisos. Si algo en la app falla
con "permission denied" y las reglas de este archivo lo permiten, probablemente falta
publicarlas.

## Cómo retomar esto desde cero (si esta sesión/entorno se pierde)

1. `git clone https://github.com/JaqueFlrs/Prototipos.git` (o el remote ya configurado si
   el clon existe) y entra a `seguimiento-versiones-app/`.
2. Consigue la llave de cuenta de servicio (Firebase Console, ver arriba) y
   `frontend/.env.local` / `functions/.env` (basados en los `.env.example`) — estos NUNCA
   están en el repo, hay que reconstruirlos a mano.
3. `npm install` en `frontend/` y `functions/`.
4. Para correr local: `cd frontend && npm run dev` (usa el Firestore real del proyecto, no
   emuladores, salvo que decidas usar `firebase emulators:start`).
5. Para refrescar datos: seguir el pipeline manual de arriba.
6. Antes de tocar reglas o desplegar: revisar que `firebase login` esté hecho con la cuenta
   dueña del proyecto Firebase (no necesariamente la misma que la de GitHub).

## Pendientes conocidos

- Desplegar Functions de verdad (Hosting y Firestore rules ya están desplegados).
- Registrar la app OAuth de Zoho para que `syncZoho` deje de ser manual (ver pasos en la
  sección de Zoho más abajo).
- Terminar la sección "Notion" (tableros propios + vista de datos alterna) — el hook ya
  existe (`frontend/src/hooks/useNotion.ts`), falta la página y el ítem de navegación.
  Quedó pausada a propósito, no continuar sin que la usuaria lo pida.

## Registrar UNA app de Zoho para el sync (no para el login)

1. Ve a https://api-console.zoho.com (con una cuenta admin de `gmtransporterp`).
2. **Add Client → Server-based Applications**. Nombre: "Seguimiento de Versiones - Sync".
3. Copia el **Client ID** y **Client Secret**.
4. Genera **un solo** refresh token de servicio (scope
   `ZohoProjects.projects.READ,ZohoProjects.tasks.READ`, `access_type=offline`).
5. `firebase functions:secrets:set ZOHO_CLIENT_SECRET` y
   `firebase functions:secrets:set ZOHO_SYNC_REFRESH_TOKEN`.

## Sobre los "skills"/"agentes" de Claude Code (no viven en este repo)

Los skills usados en este proyecto (`proyectos-gm`, `gm-mockup`, `doc-solicitud`,
`gherkin-analisis`, `estimacion`, `mi-trabajo`, `erp-analisis`, `analista-funcional`,
`publicar-prototipo`, etc.) son plugins del paquete `anthropic-skills` — viven en la
instalación de Claude Code de la usuaria, no como archivos dentro de este repo de GitHub.
Si algún día se pierde esta máquina/entorno, esos skills se recuperan reinstalando/
reconectando ese plugin en la nueva instalación de Claude Code, no restaurando desde git.
Este README es lo que sí vive en el repo y sobrevive a cualquier reinicio de entorno.

## Notas de arquitectura que ya no aplican (referencia histórica)

El README original de Milestone 1 mencionaba login con correo/contraseña y solo
Kanban+Administración — quedó obsoleto por decisiones posteriores (Google Sign-In, las 8
vistas completas). Se deja este README como la fuente de verdad actual; si algo contradice
el plan original en `C:\Users\jaqui\.claude\plans\zany-finding-fog.md`, **este documento
manda**.
