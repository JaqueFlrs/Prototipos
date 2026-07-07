# Requerimiento — Rediseño Mis Viajes (App + ERP)

**Prototipo de referencia (interactivo):** https://jaqueflrs.github.io/Prototipos/mis-viajes-rediseno/
**Contexto completo de decisiones/negocio:** [CONTEXTO.md](CONTEXTO.md)

> Este documento es para que el desarrollador entienda **qué se pide** y pueda dar una estimación de tiempos real. El prototipo es la referencia visual/funcional — no hay que copiarlo pixel a pixel, pero sí replicar el comportamiento.

---

## Se pide — App móvil (Flutter)

**Rediseño visual**
- Rediseñar interfaz completa: login, inicio, salida/llegada, evidencias, chat, carta porte, liquidaciones, gastos, inspecciones, turno, asistencia, perfil
- Estilo más serio/profesional: menos redondeado, colores menos saturados, sombras sutiles

**Inicio**
- Hacer configurable por operador (desde ERP) qué se muestra en la tarjeta del inicio: gráfico de ruta, distancia, fecha de descarga, número de viaje, hora de sucursal, botón "Ver mapa"
- Mejorar visualmente el gráfico de ruta (icono del camión sobre la barra de progreso)

**Fallas**
- Fusionar "Reportar falla" y "Mis reportes de falla" en una sola pantalla (botón para desplegar el formulario + historial debajo)
- Cambiar el campo de código de falla de texto libre a catálogo estructurado por categoría (Motor, Frenos, Llantas, Suspensión, Eléctrico, Otro)

**SOS**
- Cambiar de "confirmar antes de activar" a "activar directo, con opción de cancelar después"

**Mis Viajes (listado)**
- Agregar filtros por estatus: Todos / En ruta / Terminados / Pendientes a liquidar
- Etiquetar visualmente Destino/Estatus en la tarjeta (actualmente el título no indica que es el destino)

**Trayectos (pantallas nuevas)**
- Pantalla de lista de trayectos de un viaje (un viaje puede tener N trayectos)
- Pantalla de detalle del trayecto con botón contextual, replicando la lógica real ya existente en `contextual_action_button.dart`:
  - Si el trayecto es geocerca: solo permite acción manual si el operador tiene ese permiso; si no, queda bloqueado esperando el registro automático
  - Si no es geocerca: prioridad Registrar (manual) → Solicitar (si no tiene manual pero sí solicitud) → sin acción disponible

**Liquidaciones**
- Agregar filtros por estatus: Todas / Pagadas / Pendientes / Rechazadas

**Menú inferior**
- Reducir a: Inicio / Viajes / Otros
- Mover Solicitudes y Reportes (Fallas) a la sección "Otras herramientas" (ya no van en el menú fijo de abajo)
- Tab "Otros": listar todos los procesos a los que el operador tiene derecho

---

## Se pide — ERP (configuración administrativa)

**Alcance por operador**
- Toda la configuración de abajo debe poder aplicarse a: un operador, varios operadores seleccionados, o todos a la vez — sin tener que repetir la captura por cada uno

**Configuración de interfaz**
- Modo simple (reduce información secundaria) vs modo completo (todo visible) — por operador
- Activar/desactivar geocerca por trayecto

**Configuración de vistas**
- Listado de viajes: info mínima (destino + estatus) vs detalle completo (todas las columnas)
- Tarjeta del inicio: checkboxes para mostrar/ocultar gráfico, distancia, fecha descarga, número de viaje, hora sucursal, ver mapa

**Configuración de formularios**
- Todos los campos vs solo obligatorios

**Valores por default (Salida/Llegada)**
- Por cada campo (estatus, fecha/hora, odómetro), decidir si el operador lo captura o si se usa un valor fijo/automático cuando no tiene permiso de captura

**Derechos del operador**
- Árbol de permisos en cascada (como el árbol de derechos ya existente en el ERP), incluyendo los granulares de Mis Viajes: Dar salida (manual/solicitud/geocerca), Dar llegada (manual/solicitud/geocerca), Ver trayectos, Detalle del trayecto, Listado de viajes (oculta/muestra el tab Viajes), Evidencias, Documentos, Gastos de viaje
- Revisar y limpiar permisos que ya no tengan función real (se identificaron y quitaron varios en el prototipo: Registro de Entrada/Salidas genéricos, Asistencia Grúa, Asignar Estatus, Estatus Salida/Llegada duplicados con la sección de valores por default)

**Módulos/herramientas secundarias**
- Por operador, decidir qué módulos están disponibles (Chat, Asistencia, Solicitudes, Gastos, Liquidaciones, Inspecciones, Carta porte, Reportar falla, Mi turno, Notificaciones, Reportes)
- Decidir cuáles de esos módulos aparecen también como acceso rápido en la pantalla principal (por default, ninguno aparece ahí — solo viven en "Otras herramientas" hasta que el admin los active)

---

## Estimación de tiempos (Claude — referencial, no vinculante)

> Estimación gruesa asumiendo que el dev ya conoce la arquitectura actual (BLoC, Clean Architecture, endpoints existentes de salida/llegada). No incluye QA formal ni pruebas de integración con ERP real. El equipo de desarrollo debe validar y ajustar.

| Bloque | Estimado |
|---|---|
| Rediseño visual general (todas las pantallas existentes) | 16-24 h |
| Inicio configurable (tarjeta) + mejora gráfico de ruta | 6-8 h |
| Fusión pantalla de Fallas + catálogo estructurado de códigos | 8-10 h |
| SOS activación directa + cancelar | 3-4 h |
| Filtros de estatus (Mis Viajes + Liquidaciones) | 5-6 h |
| Pantallas nuevas: Lista de trayectos + Detalle con botón contextual | 14-18 h |
| Reordenar menú inferior + mover Solicitudes/Reportes a Otras herramientas | 4-6 h |
| **Subtotal App móvil** | **56-76 h** |
| ERP — selector de alcance (1/varios/todos operadores) | 8-10 h |
| ERP — configuración de interfaz, vistas, formularios (por operador) | 10-14 h |
| ERP — valores por default en Salida/Llegada | 6-8 h |
| ERP — árbol de derechos (limpieza + nuevos permisos granulares) | 10-14 h |
| ERP — módulos secundarios + toggle "mostrar en inicio" | 6-8 h |
| **Subtotal ERP** | **40-54 h** |
| **Total estimado** | **96-130 h (~12-16 días de desarrollo)** |

*No incluye tiempo de pruebas del equipo de QA, ajustes post-retroalimentación del cliente, ni migración de datos si aplica.*
