const {
  Document, Packer, Paragraph, TextRun, Footer, Header,
  AlignmentType, WidthType, BorderStyle, PageBreak,
  UnderlineType
} = require('C:\\Users\\JaquelineFlores\\AppData\\Roaming\\npm\\node_modules\\docx');
const fs   = require('fs');
const path = require('path');

// ─── SALIDA ───────────────────────────────────────────────────────────────────
const SALIDA = "C:\\Users\\JaquelineFlores\\gm-docs-versiones\\Prototipos\\doblecheck-ctpat-seguimiento\\#POR DEFINIR Seguimiento y Notificación de Estatus en Formularios - DobleCheck.docx";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function p(opts) {
  // opts: { text, bold, italic, size, align, before, after, runs }
  const { text, bold, italic, size, align, before, after, runs, underline } = opts || {};
  return new Paragraph({
    alignment: align || AlignmentType.LEFT,
    spacing: { before: before !== undefined ? before : 0, after: after !== undefined ? after : 100 },
    children: runs || [
      new TextRun({
        text: text || '',
        bold: !!bold,
        italics: !!italic,
        size: size ? size * 2 : 22,
        font: 'Calibri',
        underline: underline ? { type: UnderlineType.SINGLE } : undefined
      })
    ]
  });
}

function empty(before, after) {
  return p({ text: '', before: before || 0, after: after || 0 });
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function makeHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: 'PROTOTIPO DE DESARROLLO',
            bold: true,
            size: 26, // 13pt
            font: 'Calibri'
          })
        ]
      })
    ]
  });
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: 'Nos encontramos a sus órdenes Cel. (686)304 3241, Grupo GM Transport SA de CV — Alhóndiga de Granaditas 800 Independencia Mexicali Baja California CP. 21290',
            italics: true,
            size: 18, // 9pt
            font: 'Calibri'
          })
        ]
      })
    ]
  });
}

// ─── FECHA + ASUNTO (reutilizable) ────────────────────────────────────────────
function fechaAsunto() {
  return [
    empty(0, 80),
    p({ text: 'Mexicali, Baja California a 28 de Mayo de 2026.', size: 11, after: 200 })
  ];
}

// ─── PÁGINA 1 ─────────────────────────────────────────────────────────────────
function pagina1() {
  const bloques = [];

  // Título centrado
  bloques.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: 'PROTOTIPO DE DESARROLLO', bold: true, size: 28, font: 'Calibri' })]
  }));

  // Fecha
  bloques.push(...fechaAsunto());

  // Asunto
  bloques.push(new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [
      new TextRun({ text: 'Asunto: ', bold: true, size: 22, font: 'Calibri' }),
      new TextRun({ text: 'SEGUIMIENTO Y NOTIFICACIÓN DE ESTATUS EN FORMULARIOS – DOBLECHECK', bold: true, size: 22, font: 'Calibri' })
    ]
  }));

  // Cliente / Contacto
  bloques.push(new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [
      new TextRun({ text: 'Nombre del cliente: ', bold: true, size: 22, font: 'Calibri' }),
      new TextRun({ text: 'POR DEFINIR', size: 22, font: 'Calibri' })
    ]
  }));
  bloques.push(new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [
      new TextRun({ text: 'Contacto cliente: ', bold: true, size: 22, font: 'Calibri' }),
      new TextRun({ text: 'POR DEFINIR  POR DEFINIR', size: 22, font: 'Calibri' })
    ]
  }));

  // Saludo
  bloques.push(p({ text: 'Estimado cliente en relación con su amable solicitud, le detallamos lo siguiente:', size: 11, after: 160 }));

  // No. Solicitud
  bloques.push(new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [
      new TextRun({ text: 'No. De Solicitud: ', bold: true, size: 22, font: 'Calibri' }),
      new TextRun({ text: 'POR DEFINIR', size: 22, font: 'Calibri' })
    ]
  }));

  // Línea separadora
  bloques.push(p({ text: '______________________________________________________________________________', size: 11, after: 160 }));

  // Objetivo
  bloques.push(p({ text: 'Objetivo del requerimiento.', bold: true, size: 11, after: 80 }));
  bloques.push(p({
    text: 'Se requiere agregar la capacidad de configurar notificaciones de seguimiento de estatus directamente desde la configuración de cualquier formulario en DobleCheck. El objetivo es que el administrador pueda habilitar un switch de "Seguimiento y notificación de estatus" en el tab de Configuración del formulario, lo que activará: (1) un campo de selección de estatus en la pantalla de Datos Generales al crear o editar una inspección, y (2) un botón de Seguimiento en el listado de inspecciones para registrar actualizaciones de estatus posteriores sin crear una nueva inspección. Los estatus disponibles se definen en la configuración del formulario y pueden copiarse de otro formulario existente. Los destinatarios de las notificaciones se toman automáticamente de la configuración de Envío de Formulario ya existente en el sistema.',
    size: 11, after: 160
  }));

  // Puntos funcionales
  bloques.push(p({ text: 'Puntos funcionales del requerimiento:', bold: true, size: 11, after: 80 }));

  const bullets = [
    'En el tab Configuración del formulario se agrega un nuevo switch "Seguimiento y notificación de estatus". Al activarlo, se despliega debajo una sección para definir los estatus del seguimiento.',
    'La sección de estatus permite agregar, editar y eliminar opciones libremente. Incluye un botón "Copiar de otro formulario" que abre un selector de formularios existentes para importar su lista de estatus, evitando configuración repetitiva.',
    'Al crear o editar una inspección en Datos Generales, si el formulario tiene el switch activo, aparece un campo select "Estatus del seguimiento" con las opciones configuradas. Este campo es opcional al crear la inspección.',
    'En el listado de inspecciones, las inspecciones pertenecientes a formularios con seguimiento activo muestran un botón pill "Seguimiento" (borde naranja, fondo transparente) junto a los datos de la inspección.',
    'Al presionar el botón Seguimiento se abre un panel lateral (drawer) con dos pestañas: "Nuevo registro" y "Bitácora".',
    'En la pestaña Nuevo registro el inspector puede registrar: estatus (select con las opciones configuradas), fecha y hora (con opción de usar la fecha actual), y observaciones (campo opcional). La ubicación GPS se detecta automáticamente.',
    'Al guardar el registro se envía una notificación a los destinatarios configurados en Configuraciones → Envío de Formulario para ese cliente y formulario. El registro queda guardado de forma inmutable en la bitácora.',
    'La pestaña Bitácora muestra el historial completo de registros de seguimiento de esa inspección, con número de registro, fecha y hora, estatus (con color identificador), observaciones, coordenadas GPS y nombre del operador que registró.',
    'Los registros de seguimiento nunca reemplazan información anterior; cada actualización se agrega como una nueva entrada en la bitácora.',
    'El campo de observaciones en el registro de seguimiento es opcional; el estatus y la ubicación GPS son los únicos datos requeridos para guardar.',
    'Los destinatarios de las notificaciones (tanto al crear la inspección como al registrar seguimiento) se toman automáticamente de la configuración existente en Configuraciones → Envío de Formulario. No se requiere configuración adicional de destinatarios.',
    'La notificación enviada incluye: número de viaje, trayecto, cliente, operador, nuevo estatus, fecha y hora del registro, observaciones (si las hay), y coordenadas GPS.'
  ];

  for (const b of bullets) {
    bloques.push(new Paragraph({
      spacing: { before: 0, after: 80 },
      indent: { left: 360, hanging: 240 },
      children: [
        new TextRun({ text: '•\t' + b, size: 22, font: 'Calibri' })
      ]
    }));
  }

  // Resultado Esperado
  bloques.push(empty(120, 0));
  bloques.push(p({ text: 'Resultado Esperado:', bold: true, size: 11, after: 80 }));
  bloques.push(p({
    text: 'Al completar este desarrollo, los administradores podrán configurar desde cualquier formulario la funcionalidad de seguimiento de estatus, sin necesidad de crear formularios adicionales. Los inspectores podrán registrar actualizaciones de estatus de manera rápida desde el botón de Seguimiento en el listado, y los clientes recibirán notificaciones automáticas con la información relevante del viaje, el estatus actualizado y la ubicación del operador, aprovechando la configuración de envío ya existente en el sistema.',
    size: 11, after: 0
  }));

  return bloques;
}

// ─── PÁGINA 2 ─────────────────────────────────────────────────────────────────
function pagina2() {
  const bloques = [];

  bloques.push(new Paragraph({ children: [new PageBreak()] }));

  // Título centrado
  bloques.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: 'PROTOTIPO DE DESARROLLO', bold: true, size: 28, font: 'Calibri' })]
  }));

  bloques.push(...fechaAsunto());

  bloques.push(p({ text: 'Apoyos visuales', bold: true, size: 11, after: 120 }));

  bloques.push(new Paragraph({
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({ text: 'Nota: ', bold: true, size: 22, font: 'Calibri' }),
      new TextRun({
        text: 'Las imágenes presentadas en esta sección corresponden a un prototipo elaborado con fines estrictamente ilustrativos. La interfaz final podrá sufrir modificaciones o mejoras durante la fase de desarrollo, garantizando siempre el cumplimiento de las reglas de negocio y las funcionalidades descritas en los puntos anteriores.',
        italics: true, size: 22, font: 'Calibri'
      })
    ]
  }));

  // Espacio para capturas
  for (let i = 0; i < 12; i++) {
    bloques.push(empty(0, 80));
  }

  return bloques;
}

// ─── ÚLTIMA PÁGINA — FIRMA ────────────────────────────────────────────────────
function paginaFirma() {
  const bloques = [];

  bloques.push(new Paragraph({ children: [new PageBreak()] }));

  // Título centrado
  bloques.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: 'PROTOTIPO DE DESARROLLO', bold: true, size: 28, font: 'Calibri' })]
  }));

  bloques.push(...fechaAsunto());

  bloques.push(p({ text: 'Nombre y firma de aceptación', bold: true, size: 11, after: 600 }));

  // Línea de firma
  bloques.push(new Paragraph({
    spacing: { before: 0, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 }
    },
    children: [new TextRun({ text: '', size: 22, font: 'Calibri' })]
  }));

  return bloques;
}

// ─── DOCUMENTO ───────────────────────────────────────────────────────────────
const HEADER = makeHeader();
const FOOTER = makeFooter();

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size:   { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 600, footer: 600 }
        }
      },
      headers: { default: HEADER },
      footers: { default: FOOTER },
      children: [
        ...pagina1(),
        ...pagina2(),
        ...paginaFirma()
      ]
    }
  ]
});

// Crear directorio si no existe
const dir = path.dirname(SALIDA);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(SALIDA, buf);
  console.log('Generado:', SALIDA);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
