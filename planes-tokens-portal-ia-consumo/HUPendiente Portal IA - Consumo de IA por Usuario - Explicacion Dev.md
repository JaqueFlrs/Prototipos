# Consumo de IA por Usuario — Explicación para desarrollo (HUPendiente)

## Qué está pidiendo el cliente y por qué

El administrador de una empresa cliente (el usuario tipo "Administrador" en el ERP, no cualquier usuario) necesita ver cuánto gasta cada persona de su empresa en el asistente de IA. Hoy no tiene forma de saber quién de su equipo consume más tokens. Esta pantalla es nueva y le permite consultarlo por rango de fechas, para poder controlar el gasto.

**Importante:** esta pantalla depende de que exista el ticket "Registro de Consumo de Tokens por Usuario" (IA GM), que es el que realmente guarda cuántos tokens consume cada persona. Esta pantalla solo lee y muestra ese dato — no lo genera.

## Paso a paso de lo que debe pasar

1. Un usuario tipo "Administrador" en el ERP entra a Portal IA y ve en el menú la opción "Consumo de IA por Usuario". Un usuario tipo "Usuario" (no Administrador) no ve esta opción en absoluto.
2. Al abrir la pantalla, el rango de fechas ya viene puesto por default: el primer y el último día del mes en curso (ej. si es julio, "01/07/2026" a "28/07/2026" si hoy es 28).
3. Arriba de la tabla se muestra un KPI "Total del periodo" con la suma de todos los tokens consumidos por todos los usuarios dentro de ese rango.
4. La tabla lista a los usuarios con 3 columnas: Usuario, Tokens consumidos, Tiene acceso actualmente (Sí/No).
   - El orden por default es de mayor a menor consumo — el que más gastó aparece primero.
5. Si un usuario ya no tiene el permiso de acceso a la IA, o si su cuenta fue dada de baja del ERP, de todas formas debe seguir apareciendo en la tabla con su consumo del rango consultado. La columna "Tiene acceso actualmente" para ese usuario muestra "No". No se le oculta ni se le quita del listado — perdería visibilidad del gasto pasado si lo hicieras.
6. Hay un campo de búsqueda arriba de la tabla. Si el usuario escribe parte de un nombre o usuario (ej. "lgomez"), la tabla se filtra para mostrar solo esa coincidencia.
   - Si no hay ninguna coincidencia, se muestra el mensaje "No se encontraron usuarios con ese nombre o usuario" en vez de una tabla vacía sin explicación.
7. El usuario puede cambiar el rango de fechas manualmente. Al cambiarlo, tanto la tabla como el KPI "Total del periodo" se recalculan usando solo el consumo dentro del nuevo rango.

## Casos que también debes cubrir (no son opcionales)

- **Fecha final antes que la fecha inicial:** si el usuario pone una fecha final anterior a la inicial, se muestra el mensaje "La fecha final no puede ser anterior a la fecha inicial" y la tabla no se actualiza — se queda con los datos del rango anterior válido.
- **Rango sin ningún consumo:** si en el rango seleccionado ningún usuario de la empresa consumió tokens, se muestra el mensaje "Sin consumo registrado en el rango seleccionado" y el KPI "Total del periodo" marca 0 tokens. No se deja la tabla vacía sin explicación.
- **No hay límite de rango:** el usuario puede ampliar el rango todo lo que quiera (incluso a un año completo o más), y el sistema debe seguir funcionando, solo mostrando más filas.

## Qué NO te puedes brincar (excusas ya resueltas)

- "¿Muestro solo a los usuarios que tienen acceso hoy?" → No. Se muestran todos los que tuvieron consumo en el rango, tengan o no acceso vigente. La columna "Tiene acceso actualmente" es la que distingue esto, no un filtro que los oculte.
- "¿Y si el usuario ya no existe en el ERP porque lo dieron de baja?" → Igual debe aparecer con su consumo histórico y "No" en "Tiene acceso actualmente" — mismo tratamiento que alguien al que solo le quitaron el permiso de IA.
- "¿En qué orden pongo la tabla si no me dicen nada?" → Ya está definido: de mayor a menor consumo, siempre.
- "¿Tengo que construir yo el conteo de tokens por usuario?" → No, eso es un ticket aparte ("Registro de Consumo de Tokens por Usuario", IA GM). Esta pantalla solo consulta ese dato ya existente.

## Cómo saber que ya quedó bien

- ✅ Un usuario tipo "Usuario" (no Administrador) no ve esta opción en el menú.
- ✅ Al abrir la pantalla, el rango ya viene en el mes en curso, sin que el usuario tenga que configurarlo.
- ✅ La tabla aparece ordenada de mayor a menor consumo.
- ✅ Un usuario sin acceso vigente sigue apareciendo en la tabla, marcado "No" en "Tiene acceso actualmente".
- ✅ Buscar un usuario que no existe muestra el mensaje de "no se encontraron usuarios", no una tabla vacía muda.
- ✅ Cambiar el rango de fechas actualiza tanto la tabla como el KPI "Total del periodo".

## Referencia

Ver Gherkin: `HUPendiente Portal IA - Consumo de IA por Usuario.feature` — mismo alcance, ahí está en formato de criterios de aceptación.

Prototipo visual: https://claude.ai/code/artifact/30a4a33f-ab8c-4130-a842-5817b401df78 (pantalla ③)
