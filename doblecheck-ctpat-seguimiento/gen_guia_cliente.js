const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, WidthType, ShadingType, BorderStyle,
  HeadingLevel, PageNumber, PageBreak
} = require('C:\\Users\\JaquelineFlores\\AppData\\Roaming\\npm\\node_modules\\docx');
const fs = require('fs');
const path = require('path');

const BASE = 'C:\\Users\\JaquelineFlores\\gm-docs-versiones\\Prototipos\\doblecheck-ctpat-seguimiento';
const SS   = path.join(BASE, 'screenshots');
const OUT  = path.join(BASE, 'Guia_Cliente_Seguimiento_Estatus.docx');

// ── helpers ──────────────────────────────────────────────────────────────────
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function img(file, w, h) {
  return new ImageRun({
    type: 'png',
    data: fs.readFileSync(path.join(SS, file)),
    transformation: { width: w, height: h },
    altText: { title: file, description: file, name: file }
  });
}

function stepNum(n) {
  return new Paragraph({
    spacing: { before: 320, after: 80 },
    children: [
      new TextRun({ text: `Paso ${n}`, font: 'Calibri', size: 28, bold: true, color: 'FF8C00' })
    ]
  });
}
function stepTitle(txt) {
  return new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: txt, font: 'Calibri', size: 26, bold: true, color: '222222' })]
  });
}
function body(txt) {
  return new Paragraph({
    spacing: { before: 0, after: 100 },
    children: [new TextRun({ text: txt, font: 'Calibri', size: 22, color: '444444' })]
  });
}
function bullet(txt) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: '▸  ', font: 'Calibri', size: 22, color: 'FF8C00', bold: true }),
      new TextRun({ text: txt, font: 'Calibri', size: 22, color: '444444' })
    ]
  });
}
function tipBox(txt) {
  return new Table({
    width: { size: 9200, type: WidthType.DXA },
    columnWidths: [9200],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9200, type: WidthType.DXA },
      shading: { fill: 'FFF8EE', type: ShadingType.CLEAR },
      borders: { top: { style: BorderStyle.SINGLE, size: 3, color: 'FFA101' }, bottom: { style: BorderStyle.SINGLE, size: 3, color: 'FFA101' }, left: { style: BorderStyle.SINGLE, size: 12, color: 'FFA101' }, right: noBorder },
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      children: [new Paragraph({ children: [
        new TextRun({ text: '💡  ', font: 'Calibri', size: 21 }),
        new TextRun({ text: txt, font: 'Calibri', size: 21, color: '7A4700' })
      ]})]
    })]})],
  });
}
function screenshotRow(file, w, h) {
  return new Table({
    width: { size: 9200, type: WidthType.DXA },
    columnWidths: [9200],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9200, type: WidthType.DXA },
      shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' }, left: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' } },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [img(file, w, h)] })]
    })]})],
  });
}
function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'FFE0A0', space: 1 } },
    children: []
  });
}
function space(pt) {
  return new Paragraph({ spacing: { before: 0, after: pt*20 }, children: [] });
}

// ── Portada ──────────────────────────────────────────────────────────────────
const portada = [
  space(12),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: 'DobleCheck', font: 'Calibri', size: 64, bold: true, color: 'FF8C00' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 400 },
    children: [new TextRun({ text: 'Seguimiento y Notificación de Estatus', font: 'Calibri', size: 36, color: '555555' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'Guía Visual para el Cliente', font: 'Calibri', size: 28, bold: true, color: '222222' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
    children: [new TextRun({ text: '¿Qué va a cambiar y cómo funciona?', font: 'Calibri', size: 24, italics: true, color: '888888' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [new TextRun({ text: 'Mayo 2026  ·  GM Transport SA de CV', font: 'Calibri', size: 20, color: 'AAAAAA' })]
  }),
  new Paragraph({ children: [new PageBreak()] })
];

// ── Intro ─────────────────────────────────────────────────────────────────────
const intro = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 0, after: 160 }, children: [new TextRun({ text: '¿De qué trata esta mejora?', font: 'Calibri', size: 30, bold: true, color: '222222' })] }),
  body('Hoy en DobleCheck, cuando un operador realiza una inspección, el sistema registra el resultado — pero no hay forma de actualizar el estatus del viaje después, sin hacer una nueva inspección completa.'),
  space(4),
  body('Con esta mejora, usted podrá:'),
  bullet('Activar el "Seguimiento de estatus" en cualquier formulario con un simple switch.'),
  bullet('Definir sus propios estatus (En tránsito, En aduana, Detenido, etc.).'),
  bullet('Ver un botón de Seguimiento junto a cada inspección en el listado.'),
  bullet('Actualizar el estatus del viaje con un clic — sin llenar todo de nuevo.'),
  bullet('Recibir un correo automático cada vez que haya una actualización.'),
  bullet('Consultar el historial completo de registros desde la Bitácora.'),
  space(4),
  tipBox('Nadie pierde información. Cada actualización queda guardada de forma permanente y nunca se reemplaza la anterior.'),
  new Paragraph({ children: [new PageBreak()] })
];

// ── Paso 1 ─────────────────────────────────────────────────────────────────
const paso1 = [
  stepNum(1),
  stepTitle('Activar el Seguimiento en la Configuración del formulario'),
  body('Ingrese al formulario que desee configurar → pestaña Configuración. Encontrará un nuevo switch llamado "Seguimiento y notificación de estatus". Al activarlo, se despliega la sección de estatus.'),
  space(4),
  screenshotRow('s1_config.png', 680, 390),
  space(6),
  body('En esta misma sección podrá:'),
  bullet('Agregar, editar o eliminar los estatus que verá el operador.'),
  bullet('Copiar la lista de estatus de otro formulario existente con el botón "Copiar de otro formulario".'),
  space(4),
  tipBox('Los estatus que defina aquí son los únicos que aparecerán en la inspección. Si no define ninguno, el campo quedará vacío y podrá llenarse más tarde.'),
  new Paragraph({ children: [new PageBreak()] })
];

// ── Paso 2 ─────────────────────────────────────────────────────────────────
const paso2 = [
  stepNum(2),
  stepTitle('Al crear una inspección: el operador elige el estatus inicial'),
  body('Cuando el operador crea una nueva inspección de este formulario, en la pantalla de Datos Generales verá un campo nuevo: "Estatus del seguimiento". Es opcional — puede dejarse en blanco si aún no se conoce el estatus.'),
  space(4),
  screenshotRow('s3_form.png', 680, 390),
  space(6),
  bullet('El campo muestra los estatus configurados por usted en el paso anterior.'),
  bullet('La ubicación GPS se detecta automáticamente al abrir la pantalla.'),
  bullet('Si el campo se deja en blanco, la inspección se guarda normalmente sin problema.'),
  space(4),
  tipBox('El campo de estatus aparece solo si el formulario tiene el switch activado. En formularios sin seguimiento, la pantalla sigue igual que antes.'),
  new Paragraph({ children: [new PageBreak()] })
];

// ── Paso 3 ─────────────────────────────────────────────────────────────────
const paso3 = [
  stepNum(3),
  stepTitle('En el listado: botón "Seguimiento" junto a cada inspección'),
  body('En el listado de Inspecciones, las inspecciones de formularios con seguimiento activo muestran un pequeño botón "Seguimiento" junto a los datos del viaje. También verá el último estatus registrado como etiqueta de color.'),
  space(4),
  screenshotRow('s2_list.png', 680, 360),
  space(6),
  bullet('El botón aparece solo en inspecciones con seguimiento habilitado.'),
  bullet('Las inspecciones de otros formularios siguen viéndose igual — sin botón.'),
  bullet('El estatus más reciente se muestra como badge de color para identificarlo rápidamente.'),
  space(4),
  tipBox('Con un solo clic en "Seguimiento" el operador puede registrar una actualización sin tener que abrir la inspección completa.'),
  new Paragraph({ children: [new PageBreak()] })
];

// ── Paso 4 ─────────────────────────────────────────────────────────────────
const paso4 = [
  stepNum(4),
  stepTitle('Registrar una actualización de estatus'),
  body('Al presionar "Seguimiento" se abre un panel lateral con toda la información del viaje y los campos para registrar la actualización. No es necesario crear una nueva inspección.'),
  space(4),
  screenshotRow('s4_drawer_nuevo.png', 680, 390),
  space(6),
  body('El operador solo necesita:'),
  bullet('Seleccionar el nuevo estatus del viaje.'),
  bullet('Verificar o ajustar la fecha y hora (viene con la hora actual).'),
  bullet('Escribir observaciones si las hay — este campo es opcional.'),
  bullet('Presionar "Notificar nueva posición" para guardar y enviar el correo.'),
  space(4),
  tipBox('La ubicación GPS se detecta automáticamente. El sistema toma los destinatarios directamente de la configuración de Envío de Formulario — no hay que configurar nada extra.'),
  new Paragraph({ children: [new PageBreak()] })
];

// ── Paso 5 ─────────────────────────────────────────────────────────────────
const paso5 = [
  stepNum(5),
  stepTitle('Bitácora: historial completo de la inspección'),
  body('En la pestaña "Bitácora" del mismo panel se muestra el historial completo de todos los registros de seguimiento de esa inspección. Cada entrada es permanente — nunca se borra ni se modifica.'),
  space(4),
  screenshotRow('s4_drawer_bitacora.png', 680, 390),
  space(6),
  bullet('Cada registro muestra: número de entrada, fecha y hora, estatus (con color), observaciones, coordenadas GPS y el nombre del operador.'),
  bullet('Los registros más recientes aparecen primero.'),
  bullet('El contador del badge (el número naranja junto a "Bitácora") indica cuántas entradas hay.'),
  space(4),
  tipBox('Esta bitácora es el historial oficial del viaje. Sirve como evidencia de que el seguimiento se realizó correctamente en cada punto del trayecto.'),
  new Paragraph({ children: [new PageBreak()] })
];

// ── Paso 6 – Correo ──────────────────────────────────────────────────────────
const paso6 = [
  stepNum(6),
  stepTitle('El cliente recibe el correo automáticamente'),
  body('Cada vez que el operador guarda un registro de seguimiento, el sistema envía automáticamente un correo a los contactos configurados en Envío de Formulario. No requiere configuración adicional.'),
  space(4),
  screenshotRow('s5_email.png', 680, 420),
  space(6),
  body('El correo incluye:'),
  bullet('Número de viaje, cliente y trayecto.'),
  bullet('Operador que realizó el registro, fecha y hora exacta.'),
  bullet('Nuevo estatus del viaje (resaltado).'),
  bullet('Observaciones del operador (si las hay).'),
  bullet('Ubicación GPS registrada en ese momento.'),
  space(4),
  tipBox('Los destinatarios son los mismos que ya están configurados en Configuraciones → Envío de Formulario. No hay que agregar correos nuevos.')
];

// ── Resumen final ─────────────────────────────────────────────────────────────
const resumen = [
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 0, after: 200 }, children: [new TextRun({ text: 'Resumen rápido', font: 'Calibri', size: 30, bold: true, color: '222222' })] }),
  new Table({
    width: { size: 9200, type: WidthType.DXA },
    columnWidths: [500, 4500, 4200],
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: 500, type: WidthType.DXA }, shading: { fill: 'FFA101', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, borders: noBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '#', font: 'Calibri', size: 22, bold: true, color: 'FFFFFF' })] })] }),
        new TableCell({ width: { size: 4500, type: WidthType.DXA }, shading: { fill: 'FFA101', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 120 }, borders: noBorders, children: [new Paragraph({ children: [new TextRun({ text: '¿Qué hace?', font: 'Calibri', size: 22, bold: true, color: 'FFFFFF' })] })] }),
        new TableCell({ width: { size: 4200, type: WidthType.DXA }, shading: { fill: 'FFA101', type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 120 }, borders: noBorders, children: [new Paragraph({ children: [new TextRun({ text: '¿Dónde está?', font: 'Calibri', size: 22, bold: true, color: 'FFFFFF' })] })] }),
      ]}),
      ...([
        ['1', 'Activar seguimiento y definir estatus', 'Formulario → Configuración'],
        ['2', 'Estatus inicial al crear la inspección', 'Inspección → Datos Generales'],
        ['3', 'Ver botón Seguimiento en el listado', 'Inspecciones → listado'],
        ['4', 'Registrar actualización de estatus', 'Botón "Seguimiento"'],
        ['5', 'Consultar historial completo', 'Panel → pestaña Bitácora'],
        ['6', 'Recibir correo automático', 'Bandeja de entrada del destinatario'],
      ].map(([n, q, d], i) => new TableRow({ children: [
        new TableCell({ width: { size: 500, type: WidthType.DXA }, shading: { fill: i%2===0 ? 'FFF8EE' : 'FFFFFF', type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 120, right: 120 }, borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'FFE0A0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'FFE0A0' }, left: noBorder, right: noBorder }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: n, font: 'Calibri', size: 22, bold: true, color: 'FF8C00' })] })] }),
        new TableCell({ width: { size: 4500, type: WidthType.DXA }, shading: { fill: i%2===0 ? 'FFF8EE' : 'FFFFFF', type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 160, right: 120 }, borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'FFE0A0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'FFE0A0' }, left: noBorder, right: noBorder }, children: [new Paragraph({ children: [new TextRun({ text: q, font: 'Calibri', size: 21, color: '222222' })] })] }),
        new TableCell({ width: { size: 4200, type: WidthType.DXA }, shading: { fill: i%2===0 ? 'FFF8EE' : 'FFFFFF', type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 160, right: 120 }, borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'FFE0A0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'FFE0A0' }, left: noBorder, right: noBorder }, children: [new Paragraph({ children: [new TextRun({ text: d, font: 'Calibri', size: 21, color: '555555', italics: true })] })] }),
      ]}))),
    ]
  }),
  space(8),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 0 }, children: [new TextRun({ text: '¿Tienes dudas?  Cel. (686) 304 3241  ·  GM Transport SA de CV', font: 'Calibri', size: 20, color: 'AAAAAA' })] })
];

// ── Header / Footer ──────────────────────────────────────────────────────────
const header = {
  default: new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'FFA101', space: 1 } },
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({ text: 'DobleCheck  ·  Seguimiento y Notificación de Estatus', font: 'Calibri', size: 18, color: 'FFA101' })
      ]
    })]
  })
};
const footer = {
  default: new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'EEEEEE', space: 1 } },
      spacing: { before: 80, after: 0 },
      children: [
        new TextRun({ text: 'Página ', font: 'Calibri', size: 18, color: 'AAAAAA' }),
        new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 18, color: 'AAAAAA' }),
        new TextRun({ text: '  ·  GM Transport SA de CV', font: 'Calibri', size: 18, color: 'AAAAAA' })
      ]
    })]
  })
};

// ── Build doc ────────────────────────────────────────────────────────────────
const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
      }
    },
    headers: header,
    footers: footer,
    children: [
      ...portada,
      ...intro,
      ...paso1,
      ...paso2,
      ...paso3,
      ...paso4,
      ...paso5,
      ...paso6,
      ...resumen,
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log('Generado:', OUT);
});
