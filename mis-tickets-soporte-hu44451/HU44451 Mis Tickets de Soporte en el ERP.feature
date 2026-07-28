@HU44451 @MisTicketsSoporte
Feature: Consulta de tickets de soporte desde el ERP

    Yo como usuario logueado en la instancia del ERP de una empresa cliente
    requiero consultar el estatus de mis tickets de soporte con GM Transport directamente en el ERP
    Para no tener que ingresar al portal externo de atención a clientes para saber cómo va mi caso

    Background: Given que el usuario tiene una sesión activa en el ERP con la "Empresa A" cuyo RFC es "EAA010101AA1"

    Scenario: Acceso al listado desde el ícono de la barra superior
        Given que el usuario está en cualquier pantalla del ERP
        When el usuario da clic en el ícono de tickets ubicado en la barra superior, junto al ícono de ayuda
        Then el sistema navega a la pantalla "Mis Tickets de Soporte"
        And no se solicita ningún permiso ni derecho adicional para entrar a esa pantalla

    Scenario: Listado muestra por default solo los tickets abiertos de la empresa
        Given que la empresa "Empresa A" (RFC "EAA010101AA1") tiene 3 tickets con estatus "Nuevo" y 2 tickets con estatus "Cerrado" en Zoho Desk
        When el usuario entra a la pantalla "Mis Tickets de Soporte"
        Then la pestaña "Abiertos" aparece seleccionada por default
        And el listado muestra únicamente los 3 tickets con estatus abierto
        And cada fila muestra folio, asunto y estatus, sin ninguna otra columna
        And los tickets de otras empresas nunca aparecen en el listado, sin importar el filtro seleccionado

    Scenario: Listado vacío cuando la empresa no tiene tickets abiertos
        Given que la empresa activa no tiene ningún ticket con estatus abierto en Zoho Desk
        When el usuario entra a la pantalla "Mis Tickets de Soporte" con la pestaña "Abiertos" seleccionada
        Then el sistema muestra el mensaje "No tienes tickets de soporte registrados."
        And no se muestra ninguna tabla ni encabezados de columna

    Scenario: Filtro "Vencidos" muestra tickets abiertos cuya fecha compromiso ya pasó
        Given que la empresa activa tiene un ticket abierto con fecha compromiso "19/07/2026" y la fecha actual es "21/07/2026"
        And tiene otro ticket abierto con fecha compromiso "25/07/2026"
        When el usuario selecciona la pestaña "Vencidos"
        Then el listado muestra únicamente el ticket con fecha compromiso "19/07/2026"
        And la columna de estatus indica que ese ticket está vencido

    Scenario: Filtro "Cerrados" solo muestra los tickets cerrados de los últimos 3 meses
        Given que la fecha actual es "21/07/2026"
        And la empresa activa tiene un ticket cerrado el "10/07/2026" y otro ticket cerrado el "02/01/2026"
        When el usuario selecciona la pestaña "Cerrados"
        Then el listado muestra el ticket cerrado el "10/07/2026"
        And el ticket cerrado el "02/01/2026" no aparece en el listado

    Scenario: Filtro "En espera" muestra los tickets donde soporte ya respondió y espera al cliente
        Given que la empresa activa tiene un ticket cuyo estatus real en Zoho Desk es "Resuelto - Pendiente del cliente"
        When el usuario selecciona la pestaña "En espera"
        Then el listado muestra ese ticket
        And el estatus mostrado es "Esperando tu respuesta", no el texto interno de Zoho Desk

    Scenario: Ver el detalle completo de un ticket
        Given que el listado muestra el ticket folio "46201" con asunto "Facturación / CFDI no timbra al cancelar nota de crédito"
        When el usuario da clic sobre esa fila
        Then el sistema muestra el detalle del ticket con: folio, asunto, estatus, prioridad, canal, fecha de creación, fecha de última actualización, fecha compromiso y el nombre de quién lo atiende
        And debajo se muestra la conversación completa en orden cronológico, empezando por el mensaje más antiguo
        And cada mensaje que tenga archivos adjuntos los muestra: las imágenes como miniatura y los demás archivos como un elemento descargable con su nombre

    Scenario: Las notas internas del equipo de soporte nunca se muestran al cliente
        Given que un ticket tiene 2 mensajes públicos y 1 nota marcada como privada en Zoho Desk
        When el usuario abre el detalle de ese ticket
        Then el sistema muestra únicamente los 2 mensajes públicos
        And la nota privada no aparece bajo ninguna circunstancia, sin importar el estatus del ticket ni el perfil del usuario

    Scenario: Aviso cuando el ticket espera respuesta del cliente
        Given que el ticket abierto tiene estatus real "Pendiente por el cliente" en Zoho Desk
        When el usuario abre el detalle de ese ticket
        Then el sistema muestra el aviso "Esperando tu respuesta" de forma visible junto al estatus

    Scenario: Actualización manual del listado
        Given que el usuario está en la pantalla "Mis Tickets de Soporte"
        And la última consulta a Zoho Desk fue hace 3 minutos
        Then el sistema muestra el texto "Actualizado hace 3 min" y el botón "Actualizar"
        When el usuario da clic en el botón "Actualizar"
        Then el sistema vuelve a consultar la información y actualiza el texto de "Actualizado hace" a "0 min"

    Scenario: Actualización automática diaria sin intervención del usuario
        Given que un ticket cambió de estatus en Zoho Desk hace 20 horas
        And el usuario no ha dado clic en "Actualizar" en ese tiempo
        When el proceso de actualización automática diaria se ejecuta
        Then la próxima vez que el usuario entre a "Mis Tickets de Soporte" ve el estatus más reciente del ticket, sin necesidad de dar clic en "Actualizar"

    Scenario: La consulta es de solo lectura
        Given que el usuario está viendo el detalle de un ticket
        Then no existe ningún campo, botón ni opción para responder, comentar o modificar el ticket desde el ERP
        And si el usuario necesita responder, debe seguir usando el canal de atención actual (correo o portal de Zoho Desk)

    Scenario: Falla la conexión con Zoho Desk
        Given que el servicio de Zoho Desk no responde o el token de acceso es inválido
        When el usuario entra a la pantalla "Mis Tickets de Soporte" o intenta actualizarla
        Then el sistema muestra el mensaje "No se pudo consultar el estatus de tus tickets en este momento, intenta más tarde."
        And no se muestra ningún código de error técnico ni detalle interno de la falla

    Scenario: Empresa con más de una razón social ve los tickets de todas
        Given que la instalación del ERP tiene activo el parámetro de multiempresa y opera con los RFC "EAA010101AA1" y "EAA010101AA2"
        When el usuario entra a la pantalla "Mis Tickets de Soporte"
        Then el listado incluye los tickets levantados bajo cualquiera de los dos RFC de esa instalación
