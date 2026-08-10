const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, LevelFormat, ExternalHyperlink, HeadingLevel,
  BorderStyle
} = require('docx');

const FONT = "Calibri";

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: !!opts.bold, italics: !!opts.italics, color: opts.color })]
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: !!opts.bold })]
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 }, children: [new TextRun({ text, font: FONT })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 }, children: [new TextRun({ text, font: FONT })] });
}
function callout(text) {
  return new Paragraph({
    spacing: { before: 100, after: 200 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: "E8600F", space: 8 } },
    children: [new TextRun({ text, font: FONT, size: 22, italics: true, color: "444444" })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: "1A2E44" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E4057", space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, font: FONT, color: "2E4057" },
        paragraph: { spacing: { before: 260, after: 100 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "Rediseño Mis Viajes (App + ERP)", font: FONT, size: 40, bold: true, color: "1A2E44" })]
      }),

      p("Prototipo interactivo (recorrerlo ANTES de leer esto, es la referencia de comportamiento real):", { bold: true }),
      new Paragraph({
        spacing: { after: 160 },
        children: [new ExternalHyperlink({
          children: [new TextRun({ text: "https://jaqueflrs.github.io/Prototipos/mis-viajes-rediseno/index.html", style: "Hyperlink", font: FONT, size: 22 })],
          link: "https://jaqueflrs.github.io/Prototipos/mis-viajes-rediseno/index.html"
        })]
      }),
      p("Repos: gm-mis-viajes (app, Flutter), gm-mis-viajes-backend (Go), ERP (WLanguage / SQL Server).", { italics: true }),

      h1("1. Qué problema resuelve esto"),
      p("Hoy la app de Mis Viajes muestra a todos los operadores los mismos módulos, los mismos campos y el mismo nivel de detalle, sin importar el tipo de operador, cliente o sucursal. Eso genera dos problemas:"),
      bullet("Operadores con poca experiencia se saturan — ven más botones/campos de los que realmente usan."),
      bullet("No hay forma de simplificar la app para un cliente/operador sin quitarle funcionalidad de verdad — o se le quita el derecho por completo (y ya no puede usarlo nunca), o se lo dejamos todo visible."),
      p("La solución: agregar una capa de configuración por operador desde el ERP que decide qué tan “cargada” se ve la app, sin tocar los derechos reales de acceso. Todo lo que el operador tiene derecho a usar sigue estando disponible — solo cambia qué tan a la mano lo tiene."),

      h1("2. El mecanismo (lo más importante del documento)"),
      p("Hay dos conceptos que no se deben confundir:"),
      bullet("Derecho (ya existe, tabla CatOperadoresDerechos / árbol SisProcesosAplicaciones): define si el operador puede usar un proceso o no. Esto NO cambia con este proyecto."),
      bullet("Visibilidad en Inicio (nuevo): de los procesos que el operador YA tiene derecho a usar, cuáles se le muestran como acceso rápido en Inicio, y cuáles quedan disponibles en una pantalla nueva llamada “Otros”."),
      p("Regla exacta:", { bold: true }),
      bullet("“Otros” (pantalla nueva, tab en el menú de abajo) = lista completa de TODOS los procesos a los que el operador tiene derecho. Siempre están ahí, sin excepción, mientras tenga el derecho."),
      bullet("Inicio = subconjunto de “Otros” que el administrador marcó en el ERP como “acceso rápido”. Si no se marca nada, el proceso solo vive en “Otros” — pero sigue siendo usable."),
      bullet("Si en el ERP se le quita el derecho a un proceso (pestaña Derechos, esto ya existe), ese proceso desaparece de los dos lugares: de Inicio y de “Otros”."),
      callout("Ejemplo: un operador tiene derecho a Inspecciones. Si el admin NO marca “mostrar en Inicio”, el botón no aparece en la pantalla principal, pero el operador lo sigue usando entrando al tab “Otros”. Si en cambio le quitan el derecho de Inspecciones, ya no aparece en ningún lado."),

      h1("3. Qué se construye en la app (Flutter)"),
      h2("3.1 Rediseño visual (sin cambio de lógica)"),
      p("Se rediseña la interfaz de todas las pantallas: login, inicio, salida/llegada, evidencias, chat, carta porte, liquidaciones, gastos, inspecciones, turno, asistencia, reportes de falla, perfil. Es cambio de estilo (colores, bordes, espaciados) — la lógica de negocio de cada pantalla sigue igual. Ver el prototipo para el estilo exacto."),
      h2("3.2 Pantalla de Inicio: cuadrícula dinámica"),
      p('Hoy el bloque "MÁS HERRAMIENTAS" de Inicio es una lista fija de accesos (Carta porte, Gastos, Liquidaciones, Inspecciones, Turno, Asistencia, Fallas, Perfil). Hay que hacerla dinámica: se debe armar en tiempo de ejecución a partir de la configuración que llega del ERP (ver sección 5), filtrando primero por derecho y después por la marca de "mostrar en Inicio".'),
      h2('3.3 Tab nuevo: "Otros"'),
      p('Se agrega un quinto tab en el menú inferior (junto a Inicio, Viajes, Solicitudes, Reportes). Esta pantalla es una cuadrícula simple que lista TODOS los procesos con derecho activo, sin filtrar por la marca de Inicio. Reutiliza el mismo servicio de permisos que ya existe (ModulePermissionService / tieneAccesoModulo) — no se crea lógica de permisos nueva, solo una pantalla que consulta lo mismo sin aplicar el filtro de "acceso rápido".'),
      h2("3.4 SOS"),
      p("El botón de SOS deja de pedir confirmación antes de activarse: se activa directo al tocarlo, y aparece la opción de cancelarlo después (por si fue un error). Esto es un cambio de flujo, no de lógica de envío de la alerta."),

      h1("4. Qué se construye en el ERP"),
      p("Se extiende la pantalla de configuración de operadores que ya existe (la que gestiona CatOperadoresDerechos) agregando controles nuevos."),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "Regla de UI: todo checkbox o radio button — nada de botones grandes ni tarjetas seleccionables.", font: FONT, size: 22, bold: true, color: "B71C1C" })]
      }),
      h2("Pestaña Configuración (nueva, o agregada a la existente)"),
      bullet('Checkbox por proceso: "mostrar en Inicio". Solo se puede activar si ese proceso ya tiene derecho activo para ese operador (si no tiene derecho, el checkbox debe estar deshabilitado o no aparecer).'),
      bullet("Radio: Modo simple / Modo completo (afecta qué tan reducidos se ven los elementos secundarios de la interfaz)."),
      bullet("Radio: Info mínima / Detalle completo (nivel de detalle del listado de viajes)."),
      bullet("Radio: Todos los campos / Solo obligatorios (en los formularios de Salida/Llegada)."),
      bullet("Por cada campo de Salida/Llegada: checkbox “usar valor default” + un valor fijo configurable (ej. estatus del viaje). Si el operador no captura ese campo, se manda el valor default configurado aquí."),
      h2("Pestaña Derechos del operador (ya existe, no se rehace)"),
      p("Árbol de 3 columnas en cascada. Es el mismo patrón de derechos que ya usa el ERP real. No se le agrega nada nuevo salvo que ahora, al desmarcar un proceso aquí, además de quitarle el acceso, hay que asegurarse de que también se le quite el checkbox de “mostrar en Inicio” si estaba marcado (para no dejar configuración huérfana)."),
      p("El selector de operador (elegir a uno, varios, o todos con checkbox + buscador) ya existe y no se toca.", { italics: true }),

      h1("5. Cómo viaja la información (flujo completo)"),
      bullet("El administrador configura en el ERP (derechos + los checks/radios nuevos de la sección 4) y guarda."),
      bullet("Esa configuración se guarda en SQL Server, en tablas nuevas (ver sección 6) más las tablas de derechos que ya existen."),
      bullet("Cuando el operador abre la app, el backend de Mis Viajes (Go) responde con la configuración combinada del operador: sus derechos + su configuración de Inicio/formularios/defaults."),
      bullet("La app usa esa respuesta para armar la cuadrícula de Inicio (solo lo marcado como acceso rápido, filtrado por derecho) y la pantalla “Otros” (todo lo que tiene derecho)."),

      h1("6. Datos nuevos (SQL Server)"),
      bullet("Tabla de configuración por operador: modo interfaz (simple/completo), geocerca activada, vista de listado (mínima/completa), modo de formulario (todos/obligatorios)."),
      bullet('Tabla de mapeo "mostrar en Inicio": operador + proceso + sí/no.'),
      bullet("Tabla de valores default por campo (Salida/Llegada): operador + campo + usa-default (sí/no) + valor fijo."),
      p("No se modifican SisProcesosAplicaciones ni CatOperadoresDerechos — se siguen usando exactamente igual que hoy, solo se les agrega esta capa nueva encima.", { italics: true }),

      h1("7. Backend Go"),
      bullet("Endpoint para que la app pida la configuración completa del operador (derechos + configuración nueva, combinados en una sola respuesta)."),
      bullet("Endpoint para guardar la configuración desde el ERP — o el ERP escribe directo a SQL Server, como ya hace hoy con derechos (a confirmar con el equipo cuál patrón se sigue)."),
      bullet("Cachear esa respuesta en Redis igual que otros catálogos, para no consultar SQL Server en cada apertura de la app."),

      h1("8. Qué NO entra en este proyecto"),
      bullet("Código de falla: el campo se queda como texto libre. NO se cambia a catálogo/dropdown por categoría (se había propuesto en el prototipo, pero no aplica para desarrollo real).", { bold: true }),
      bullet("Filtros por estatus en Mis Viajes y Liquidaciones: ya existen en la app actual, no es un desarrollo nuevo. Fuera de alcance.", { bold: true }),
      bullet("No hay migración de datos históricos."),
      bullet("No incluye testing automatizado ni plan de capacitación/lanzamiento — se cotiza aparte si se necesita."),

      h1("9. Validar con el equipo antes de arrancar"),
      bullet("¿El ERP escribe directo a SQL Server o pasa por un endpoint del backend de Mis Viajes? (define si el punto 7 aplica tal cual o se ajusta)."),
      bullet("Revisar si el árbol de derechos actual (SisProcesosAplicaciones) tiene huérfanos o duplicados antes de extenderlo con la marca de “mostrar en Inicio”."),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:\\Users\\JaquelineFlores\\nuevos-proyectos\\mis-viajes\\rediseno-app-erp\\DOC-TECNICO-REDISENO.docx", buffer);
  console.log("OK - docx generado");
});
