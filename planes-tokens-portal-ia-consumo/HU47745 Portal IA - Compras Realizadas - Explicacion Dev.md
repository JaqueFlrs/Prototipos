# Compras Realizadas — Explicación para desarrollo (HU47745)

## Qué está pidiendo el cliente y por qué

El administrador de la empresa cliente quiere ver todas las compras de tokens que se han hecho en su empresa: cuántas, quién las hizo, qué plan, y cuánto se pagó. Hoy esa información existe (en el historial "Planes Contratados" del ticket de Compra de Tokens), pero no hay una vista que la agrupe a nivel de toda la empresa con filtros de fecha. Por ahora todas las compras se hacen desde Portal IA (web) — no hay otro canal todavía.

## Paso a paso de lo que debe pasar

1. Un usuario tipo "Administrador" en el ERP ve en el menú la opción "Compras Realizadas". Un usuario tipo "Usuario" no la ve.
2. Al abrir la pantalla, el rango de fechas viene por default en el mes en curso (igual que en "Consumo de IA por Usuario").
3. Arriba de la tabla se muestran 2 KPIs: "Total de compras" (cuántas compras hay en el rango, cuenten o no como pagadas) y "Total pagado" (la suma en USD de solo las compras que sí se cobraron).
4. La tabla lista cada compra con: Fecha, Usuario (quién la hizo), Plan, Tokens, Monto Pagado y Estatus. Se ordena de la compra más reciente a la más antigua.
5. El usuario puede cambiar el rango de fechas. Al cambiarlo, tanto la tabla como los 2 KPIs se recalculan con las compras dentro del nuevo rango.

## Casos que también debes cubrir (no son opcionales)

- **Las compras canceladas también se listan.** Si una compra quedó con estatus "Cancelado" (porque nunca se confirmó el pago — ver ticket de Compra de Tokens), igual aparece en la tabla, con su estatus visible. Cuenta dentro de "Total de compras", pero su monto NO se suma en "Total pagado", porque nunca se cobró realmente.
- **Fecha final antes que la inicial:** mensaje "La fecha final no puede ser anterior a la fecha inicial", la tabla no se actualiza.
- **Rango sin ninguna compra:** mensaje "Sin compras registradas en el rango seleccionado", ambos KPIs en 0.

## Qué NO te puedes brincar (excusas ya resueltas)

- "¿Cuento las compras canceladas en 'Total de compras'?" → Sí. Solo se excluyen del "Total pagado", no del conteo.
- "¿Tengo que agregar un filtro de canal (web/app)?" → No por ahora. Solo existe el canal web, no hace falta un selector de canal todavía.
- "¿Esta pantalla necesita su propia tabla en base de datos?" → No, reutiliza el mismo historial "Planes Contratados" que ya existe — solo se consulta agrupado por empresa con filtro de fechas.

## Cómo saber que ya quedó bien

- ✅ Un usuario tipo "Usuario" no ve "Compras Realizadas" en el menú.
- ✅ La tabla muestra Fecha, Usuario, Plan, Tokens, Monto Pagado y Estatus, ordenada de la más reciente a la más antigua.
- ✅ Una compra "Cancelada" aparece en la tabla y cuenta en "Total de compras", pero no en "Total pagado".
- ✅ Cambiar el rango de fechas actualiza tabla y ambos KPIs.

## Referencia

Ver Gherkin: `HU47745 Portal IA - Compras Realizadas.feature` — mismo alcance, ahí está en formato de criterios de aceptación.

Prototipo visual: https://claude.ai/code/artifact/30a4a33f-ab8c-4130-a842-5817b401df78 (pantalla ⑧)
