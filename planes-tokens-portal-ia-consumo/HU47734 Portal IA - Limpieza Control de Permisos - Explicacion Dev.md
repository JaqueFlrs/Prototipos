# Limpieza de Control de Permisos — Explicación para desarrollo (HUPendiente)

## Qué está pidiendo el cliente y por qué

La pantalla "Control de Permisos" de Portal IA muestra hoy varias tarjetas de resumen ("Por Perfil", "Estado", "Acciones Rápidas") que repiten exactamente la misma información que ya está disponible en el menú lateral izquierdo. Esto hace la pantalla más difícil de leer sin aportar nada nuevo. El pedido es quitar esa duplicación y dejar solo el resumen general.

## Paso a paso de lo que debe pasar

1. Al abrir la pantalla "Control de Permisos", el sistema ya NO muestra la sección "Por Perfil" con las tarjetas "Gerencial", "Administrativo" y "Operativo". Esa navegación sigue existiendo, pero únicamente en el menú lateral izquierdo.
2. El sistema ya NO muestra la sección "Estado" con las tarjetas "Activos en ERP" e "Inactivos en ERP".
3. El sistema ya NO muestra la sección "Acciones Rápidas" completa, con sus tarjetas "Gestionar usuarios", "Con acceso IA" y "Sin asignar".
4. Lo único que se conserva arriba es el resumen general de 3 tarjetas: "Total usuarios", "Con acceso IA" y "Sin acceso IA", con sus números tal cual funcionan hoy.
5. El menú lateral izquierdo no cambia en nada: sigue mostrando "Usuarios" (Todos, Con IA, Sin IA), "Por Perfil" (Gerencial, Administrativo, Operativo) y "Otros" (Sin perfil, Inactivos), exactamente como está hoy.

## Casos que también debes cubrir (no son opcionales)

- **No se pierde ninguna función de navegación.** Todo lo que hacían las tarjetas eliminadas (filtrar por perfil, ver activos/inactivos) ya existe en el menú lateral — este ticket es solo visual, no quita ninguna capacidad de filtrar o navegar.
- **El resumen general no cambia su lógica.** Los números de "Total usuarios", "Con acceso IA" y "Sin acceso IA" se calculan exactamente igual que antes — lo único que cambia es que las otras tarjetas ya no aparecen debajo.

## Qué NO te puedes brincar (excusas ya resueltas)

- "¿Muevo el filtro por perfil a otro lado ya que quito la tarjeta?" → No, el filtro por perfil ya existe en el menú lateral y no se toca. Solo se quita la tarjeta redundante de arriba.
- "¿Las Acciones Rápidas llevaban a algo distinto del menú lateral?" → No, se confirmó que solo eran atajos redundantes — no hacían nada que el menú lateral no hiciera ya.
- "¿Dejo espacio en blanco donde estaban las tarjetas?" → El layout se debe ajustar para no dejar huecos incómodos, pero el criterio de "qué se ve" es visual — no afecta ningún dato ni comportamiento.

## Cómo saber que ya quedó bien

- ✅ La pantalla "Control de Permisos" ya no muestra las tarjetas "Gerencial", "Administrativo", "Operativo", "Activos en ERP", "Inactivos en ERP", ni la sección "Acciones Rápidas".
- ✅ Las 3 tarjetas de resumen general ("Total usuarios", "Con acceso IA", "Sin acceso IA") siguen mostrando los mismos números que antes.
- ✅ El menú lateral izquierdo sigue mostrando exactamente las mismas opciones de navegación que tenía antes del cambio.

## Referencia

Ver Gherkin: `HU47734 Portal IA - Limpieza Control de Permisos.feature` — mismo alcance, ahí está en formato de criterios de aceptación.

Prototipo visual: pendiente de publicar por separado (este ticket ya no vive en el mismo archivo que Adquirir Tokens/Consumo/Compras Realizadas).
