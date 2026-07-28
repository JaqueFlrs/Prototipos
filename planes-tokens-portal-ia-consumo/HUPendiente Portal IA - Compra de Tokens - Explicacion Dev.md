# Compra de Tokens desde Portal IA — Explicación para desarrollo (HUPendiente)

## Qué está pidiendo el cliente y por qué

Las empresas clientes van a poder comprar planes de tokens de IA directamente desde Portal IA (no solo desde la app móvil). Cada empresa tiene una bolsa de tokens compartida, y cuando se le acaban, necesita poder contratar más sin depender de la app. El pago se hace con tarjeta a través de Mercado Pago, y una vez pagado, se factura con el proceso que GM ya usa hoy para cualquier otra venta — no hay que construir nada nuevo de facturación.

## Paso a paso de lo que debe pasar

1. El usuario entra a Portal IA con su sesión normal.
2. Si tiene el permiso "puede contratar tokens" activo, ve la opción "Comprar Tokens" en el menú. Si no lo tiene, esa opción simplemente no aparece — no se muestra deshabilitada, se omite por completo.
3. Al entrar a "Comprar Tokens" ve el catálogo con los planes que estén marcados como activos. Ahora mismo eso es "Plan Básico" (5,000 tokens, $50.00 USD) y "Plan Estándar" (20,000 tokens, $180.00 USD). El plan "Plan Empresarial" existe en el catálogo pero está inactivo, así que no debe aparecer en esta lista.
   - Si no hay ningún plan activo en ese momento, en vez de la lista se muestra el mensaje "No hay planes disponibles por el momento".
4. El usuario selecciona un plan y hace clic en "Continuar".
5. Pasa a la pantalla "Método de pago", que muestra un resumen fijo con el formato "Plan Básico · 5,000 tokens · Total: $50.00 USD" y el método de pago Mercado Pago.
6. El usuario hace clic en "Pagar $50.00 USD".
   - En cuanto hace clic, el botón se deshabilita. Esto es para que un segundo clic (sea por error o por impaciencia) no genere un segundo cobro. El botón solo se vuelve a habilitar si el pago termina siendo rechazado.
7. A partir de aquí hay tres caminos posibles, y los tres ya están definidos — ninguno se puede improvisar:
   - **Pago confirmado:** se suman los tokens del plan a la bolsa de la empresa (ej. si tenía 3,000 y compra Plan Básico, queda en 8,000). Se muestra el mensaje "Compra realizada. Se agregaron 5,000 tokens a tu saldo." junto con el folio de la transacción. Se crea un registro en el historial "Planes Contratados" con fecha, plan, tokens, costo, método de pago y estado "Vigente".
   - **Pago rechazado:** se muestra el mensaje "No se pudo procesar el pago, intenta de nuevo". No se suman tokens ni se crea ningún registro en el historial. El botón "Pagar" se vuelve a habilitar para que el usuario pueda reintentar.
   - **Sin respuesta del proveedor a tiempo:** si pasa el tiempo límite configurado sin que Mercado Pago confirme ni rechace, no se suman tokens, y se crea un registro en "Planes Contratados" con estatus "Cancelado" (no "Vigente" ni "Pendiente").
8. Si el usuario está en "Método de pago" y hace clic en "Atrás" en vez de pagar, regresa al catálogo. No se cobra nada, no se suman tokens y no se crea ningún registro.

## Casos que también debes cubrir (no son opcionales)

- **Los tokens comprados no caducan.** Cuando el ciclo mensual de tokens gratis se renueva, los tokens que la empresa compró (a diferencia de los gratis) siguen disponibles y se suman a los tokens gratis del nuevo mes. No se resetean ni se pierden.
- **Nunca hay reembolsos.** Una compra ya confirmada (estado "Vigente" en el historial) no debe mostrar ninguna opción de "Cancelar" ni "Solicitar reembolso" en su detalle. Esto es una regla de negocio fija, no algo que dependa de configuración.
- **Doble confirmación de pago.** Si por cualquier motivo el sistema recibe la confirmación del pago dos veces para la misma compra (ej. un reintento de la pasarela), no se deben sumar los tokens dos veces ni crear un segundo registro en el historial. La segunda confirmación se ignora si ya existe el registro de esa compra.
- **La venta debe aparecer en Cobranza.** Cuando se confirma un pago, esa venta se agrega al mismo listado de ingresos que ya usa el área de Cobranza de GM, con empresa, plan, monto y fecha — para que se pueda facturar con el proceso manual que ya existe.

## Qué NO te puedes brincar (excusas ya resueltas)

- "¿Y si el cliente quiere pagar y luego se arrepiente?" → No aplica. No hay reembolsos, es una regla ya definida, no una pregunta abierta.
- "¿Qué pasa si hace doble clic en Pagar?" → Ya está resuelto: el botón se deshabilita en el primer clic.
- "¿Debo mostrar los planes inactivos aunque sea en gris?" → No. Los planes inactivos no aparecen en absoluto en el catálogo de compra.
- "¿Y si no hay ningún plan activo?" → Ya está resuelto: se muestra el mensaje "No hay planes disponibles por el momento", no una lista vacía sin explicación.
- "¿La facturación la tengo que automatizar?" → No. Se usa el proceso manual que GM ya tiene para facturar cualquier venta; lo único que debes hacer es que la venta aparezca en el listado de ingresos de Cobranza.

## Cómo saber que ya quedó bien

- ✅ Un usuario sin el permiso "puede contratar tokens" no ve "Comprar Tokens" en el menú.
- ✅ El catálogo solo muestra planes activos, con su cantidad de tokens y costo en USD.
- ✅ Al pagar exitosamente, la bolsa de tokens de la empresa aumenta exactamente en la cantidad del plan comprado.
- ✅ Un pago rechazado no suma tokens ni crea registro en el historial.
- ✅ Una compra ya confirmada no tiene opción de reembolso en su detalle.
- ✅ Los tokens comprados siguen ahí después de que se renuevan los tokens gratis del mes.

## Referencia

Ver Gherkin: `HUPendiente Portal IA - Compra de Tokens.feature` — mismo alcance, ahí está en formato de criterios de aceptación.

Prototipo visual: https://claude.ai/code/artifact/30a4a33f-ab8c-4130-a842-5817b401df78 (pantallas ① y ②)
