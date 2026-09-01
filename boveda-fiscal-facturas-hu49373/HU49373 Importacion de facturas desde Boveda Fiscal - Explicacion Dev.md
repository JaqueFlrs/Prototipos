# Importación de facturas desde Bóveda Fiscal — Explicación para desarrollo (#HU49373)

## Qué está pidiendo el cliente y por qué

Hoy, si un CFDI de ingreso ya existe en Bóveda Fiscal pero nunca se capturó en Facturación, no hay forma de traerlo automáticamente al ERP — hay que darlo de alta a mano. Se pide el mismo mecanismo que ya existe en Cuentas por Pagar (GM Importa), del lado de Facturación. A futuro, esta vía debe **sustituir** a GM Importa, no convivir con él para siempre. No todos los clientes tienen Bóveda Fiscal, así que el botón solo aparece donde sí aplica.

## Qué hay que construir (sin ambigüedad, para que nadie diga que no estaba claro)

- Se agrega un **botón nuevo** llamado "Importar desde Bóveda Fiscal" en la pantalla **Listado de Facturas**, del módulo de **Facturación** — la pantalla donde hoy se ven y se dan de alta las facturas. **Hoy ese botón NO existe ahí — hay que crearlo.**
- **Este ticket es 100% del módulo de Facturación. NO se toca nada en Cuentas por Pagar ni en la pantalla de Pasivos.** Pasivos se menciona abajo únicamente como referencia de un mecanismo que YA existe ahí y que hay que replicar del lado de Facturación — no como el lugar donde va este botón.
- Al hacer clic, se abre una ventana nueva que consulta Bóveda Fiscal y permite seleccionar e importar los CFDI pendientes.
- Es exactamente el mismo patrón que ya existe en la pantalla Listado de Pasivos (Cuentas por Pagar), botón "Generar Pasivo Vía Bóveda Fiscal" — se construye el equivalente, pero en Facturación, no en Pasivos.
- Si al revisar el código ya existe una pantalla o botón parecido en Facturación, confirmarlo con Jaqueline antes de asumir que ya cubre esto — no cerrar el ticket por parecido.

## Paso a paso de lo que debe pasar

1. Un proceso aparte consulta Bóveda Fiscal, valida qué empresas están registradas, y marca una bandera local por empresa. La pantalla de Facturación **nunca** consulta Bóveda Fiscal en vivo solo para decidir si mostrar el botón.
2. El usuario abre el Listado de Facturas. Ve el botón "Importar desde Bóveda Fiscal" solo si la bandera está marcada **y** tiene el permiso. Si falta cualquiera de las dos, el botón simplemente no aparece.
3. Al hacer clic, la ventana se abre y consulta de inmediato — sin pedir fecha ni filtro — mostrando un resumen (ej. "5 facturas pendientes de importar") y la tabla.
   - Sin resultados: mensaje "No se encontraron CFDI pendientes de importar".
   - Los CFDI con el mismo UUID ya importado antes nunca vuelven a aparecer.
   - El rango de fechas es opcional, solo para acotar.
4. Cada renglón muestra Fecha, RFC del receptor, Serie y Folio, Total y UUID.
5. El usuario selecciona los CFDI a importar, sin límite. Si selecciona más de 500, el sistema los procesa en lotes de 500 automáticamente y muestra el avance.
6. Al importar, por cada CFDI:
   - Cancelado en el SAT → no se importa, motivo "CFDI cancelado en el SAT".
   - RFC receptor sin cliente activo en el catálogo → no se importa, motivo "No se encontró un cliente activo con ese RFC".
   - Si pasa ambas validaciones → se da de alta en el Listado de Facturas con los datos del CFDI.
7. Al terminar, el usuario ve cuántos se importaron y cuántos no, agrupados por motivo (cancelados por UUID/RFC; sin cliente agrupado por RFC). Si la conexión se cae a la mitad, lo importado se queda y lo pendiente se reintenta después sin duplicar nada.
8. Cancelar una factura importada por esta vía es idéntico a cancelar una capturada a mano — mismas reglas, sin excepción.

## Casos que también debes cubrir (no son opcionales)

- **Certificado del emisor:** no se revalida su vigencia — se confía en Bóveda Fiscal. Si hay varios certificados vigentes, se resuelve con el mismo mecanismo automático del alta manual.
- **Duplicados a nivel de base de datos:** el UUID debe quedar protegido contra duplicados en la base de datos, no solo por el filtro de pantalla.
- **Bitácora:** cada acción (entrar, buscar, importar) se registra en el historial, igual que en la pantalla equivalente de Cuentas por Pagar.
- **Permiso nuevo:** se da de alta un permiso propio de Facturación — no se reutiliza el de Cuentas por Pagar ni uno genérico de administrador.
- **Bloqueo del CFDI:** se libera de inmediato si el usuario cierra la ventana o navega fuera. Como respaldo, si ese cierre no se detecta (ej. se cae la conexión), el bloqueo expira solo a los 5 minutos de inactividad — un CFDI nunca queda bloqueado indefinidamente.

## Qué NO te puedes brincar (excusas ya resueltas)

- "¿Y si la empresa no tiene Bóveda Fiscal?" → El botón no aparece. No hay mensaje de error.
- "¿Reviso el certificado antes de importar?" → No, se confía en Bóveda Fiscal.
- "¿Qué hago si el lote falla a la mitad?" → Lo importado se queda; el resto se reintenta después.
- "¿Filtro los CFDI cancelados después de importarlos?" → No, se filtran antes de insertar.
- "¿La cancelación de una factura importada necesita una regla especial?" → No, es idéntica a la cancelación manual.
- "¿Le pido al usuario un rango de fechas antes de mostrarle algo?" → No, el resumen y la tabla se ven de inmediato al abrir la ventana; el rango es opcional.
- "¿Bloqueo la selección en 500?" → No, aquí se decidió distinto de Cuentas por Pagar: todo se selecciona, se procesa por lotes.
- "¿Cuánto dura el bloqueo si el primer usuario abandona sin terminar?" → Ya está resuelto: se libera al instante si cierra la ventana, y expira solo a los 5 minutos si el cierre no se detectó.

## Cómo saber que ya quedó bien

- ✅ Una empresa sin la bandera no ve el botón, aunque tenga el permiso.
- ✅ Al abrir la ventana, el resumen y la tabla aparecen sin pedir ningún filtro.
- ✅ Un CFDI ya importado no vuelve a aparecer en una búsqueda posterior.
- ✅ Un CFDI cancelado en el SAT nunca llega a existir como factura.
- ✅ Una factura importada se cancela igual que una manual.
- ✅ Seleccionar más de 500 no bloquea nada — se procesa por lotes con avance visible.

## Referencia

Ver Gherkin: `HU49373 Importacion de facturas desde Boveda Fiscal.feature` — mismo alcance, ahí está en formato de criterios de aceptación.
