# Registro de Consumo de Tokens por Usuario — Explicación para desarrollo (HU47728, IA GM)

## Qué está pidiendo el cliente y por qué

Hoy el sistema solo calcula, de forma aproximada, cuántos tokens gasta una empresa completa contando caracteres — no sabe realmente cuántos tokens consume cada persona, ni usa el número real que reporta el proveedor de IA. Este ticket es el prerrequisito técnico de la pantalla "Consumo de IA por Usuario" en Portal IA: sin este registro real por usuario, esa pantalla no tiene ningún dato que mostrar.

## Paso a paso de lo que debe pasar

1. Un usuario de una empresa cliente (ej. "aperez") envía un mensaje al asistente de IA GM.
2. El asistente genera una respuesta. El proveedor de servicio de IA que procesa ese mensaje reporta un número real de tokens consumidos (no una estimación por caracteres).
3. El sistema registra ese número real de tokens, asociado específicamente a "aperez", con la fecha y hora exacta del mensaje.
4. Si "aperez" envía un segundo mensaje el mismo día, el consumo se acumula sobre lo que ya tenía registrado ese día — no se reemplaza, se suma.
5. Al mismo tiempo que se registra el consumo de "aperez", el sistema descuenta esos tokens de la bolsa de tokens de la empresa a la que pertenece "aperez" (la bolsa es compartida por toda la empresa, no individual).
6. Ese registro por usuario queda disponible para que después se pueda consultar en la pantalla "Consumo de IA por Usuario" de Portal IA.

## Casos que también debes cubrir (no son opcionales)

- **El número tiene que ser el real, no una estimación.** El sistema debe tomar el conteo de tokens que reporta el proveedor de servicio de IA para cada mensaje. No debe calcular el consumo contando caracteres del mensaje o de la respuesta — eso es justamente lo que se está reemplazando con este ticket.
- **Si el proveedor de IA no responde:** si por cualquier motivo no se genera ninguna respuesta al mensaje del usuario, no se registra ningún consumo de tokens para ese usuario, y tampoco se descuenta nada de la bolsa de la empresa. No hay que registrar un consumo "en cero" ni nada parecido — simplemente no se genera ningún registro.

## Qué NO te puedes brincar (excusas ya resueltas)

- "¿Puedo seguir usando la estimación por caracteres mientras conecto el conteo real?" → No. El objetivo de este ticket es justamente reemplazar esa estimación por el número real que reporta el proveedor de IA.
- "¿Qué usuario le asigno el consumo si el mensaje no trae ese dato?" → No debería pasar: cada mensaje se envía dentro de una sesión de un usuario específico, y ese es el usuario al que se le asocia el consumo.
- "¿Y si el proveedor de IA tarda o falla?" → Ya está resuelto: si no hay respuesta, no se registra consumo ni se descuenta nada.

## Cómo saber que ya quedó bien

- ✅ Cada mensaje enviado por un usuario genera un registro de tokens asociado específicamente a ese usuario, con fecha y hora.
- ✅ El número de tokens registrado coincide con el que reporta el proveedor de IA, no con un cálculo por caracteres.
- ✅ Si el mismo usuario envía varios mensajes el mismo día, su consumo del día se va acumulando.
- ✅ El consumo de cada mensaje descuenta esos mismos tokens de la bolsa de la empresa.
- ✅ Si el proveedor de IA no responde, no queda ningún registro de consumo para ese intento.

## Referencia

Ver Gherkin: `HU47728 IA GM - Registro de Consumo de Tokens por Usuario.feature` — mismo alcance, ahí está en formato de criterios de aceptación.

Esta funcionalidad no tiene pantalla propia — es la base de datos que consume la pantalla "Consumo de IA por Usuario" de Portal IA (ver explicación de ese ticket).
