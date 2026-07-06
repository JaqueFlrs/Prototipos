# language: es
# Ticket #37413 — Layout Importar Unidades v2
# Módulo: Catálogo de Unidades — PAGE_CatUnidadesImportar

Feature: Importación masiva de catálogo de unidades

  Como usuario de implementación
  Quiero importar unidades masivamente desde un archivo Excel
  Para configurar el catálogo sin captura manual, incluyendo los nuevos campos de Carta Porte SAT

  Background:
    Given el usuario está autenticado en el ERP GM Transport
    And el usuario tiene acceso al módulo "Catálogo de Unidades"

  # ─────────────────────────────────────────────
  # FLUJO 1 — DESCARGA DE PLANTILLA
  # ─────────────────────────────────────────────

  Scenario: Descargar plantilla versión nueva v2 (48 columnas)
    Given el usuario está en la pantalla "Catálogo de Unidades"
    When hace clic en el botón "Importar" del toolbar
    And selecciona la opción "Importar Unidades" del menú desplegable
    And el popup "Importar catálogo de unidades" se abre en el tab "Descargar Plantilla"
    And selecciona la opción "Versión nueva v2 (48 columnas)"
    And hace clic en "Descargar plantilla"
    Then se descarga el archivo "ImportarUnidades_v2.xls"
    And el archivo contiene la hoja "Datos" con 48 columnas de encabezado
    And el archivo contiene la hoja "Instrucciones" con la descripción de cada campo
    And el archivo contiene la hoja "Tipos de Unidades" con los tipos vigentes del sistema
    And el archivo contiene la hoja "Grupos de Unidades" con los grupos vigentes del sistema
    And el archivo contiene la hoja "Clave SAT Permiso SCT" con el catálogo SAT
    And el archivo contiene la hoja "Clave SAT Tipo Remolque" con el catálogo SAT

  Scenario: Descargar plantilla versión anterior v1 (36 columnas)
    Given el usuario está en la pantalla "Catálogo de Unidades"
    When abre el popup "Importar catálogo de unidades"
    And selecciona la opción "Versión anterior (36 columnas)"
    And hace clic en "Descargar plantilla"
    Then se descarga el archivo "ImportarUnidades.xls"
    And el archivo contiene exactamente 36 columnas de encabezado
    And el archivo no contiene hojas de referencia SAT

  # ─────────────────────────────────────────────
  # FLUJO 2 — IMPORTAR ARCHIVO
  # ─────────────────────────────────────────────

  Scenario: Importar archivo con todas las filas válidas
    Given el usuario tiene un archivo "ImportarUnidades_v2.xls" con 21 filas de datos
    And todas las filas tienen los campos obligatorios completos y sin errores
    When abre el popup "Importar catálogo de unidades"
    And navega al tab "Importar Archivo"
    And selecciona el archivo "ImportarUnidades_v2.xls"
    And hace clic en el botón "Cargar"
    Then el sistema procesa las 21 filas
    And el sistema navega automáticamente al tab "Resultados"
    And muestra el mensaje "Se importaron 21 unidades correctamente."
    And muestra el mensaje "0 unidades no se pudieron importar."
    And el botón "Descargar reporte de errores" está deshabilitado

  Scenario: Importar archivo con algunas filas con error
    Given el usuario tiene un archivo "ImportarUnidades_v2.xls" con 21 filas de datos
    And la fila 4 tiene el código "TRC-001" que ya existe en el sistema
    And la fila 9 no tiene valor en la columna "IdTipoUnidad"
    And la fila 15 tiene valor en "TransporteRentadaOPrestada" pero la unidad no es rentada
    When importa el archivo
    Then el sistema importa las 18 filas válidas
    And el sistema muestra el tab "Resultados" con:
      | Fila | Código    | Descripción                  | Motivo del error                                                        |
      | 4    | TRC-001   | TRACTOCAMION KENWORTH 2019   | El código ya existe en el sistema. No se permiten duplicados.           |
      | 9    | (vacío)   | CAJA SECA WABASH             | El tipo de unidad es requerido (columna IdTipoUnidad).                  |
      | 15   | S7        | TRACTOCAMION FREIGHTLINER    | TransporteRentadaOPrestada solo aplica para unidades rentadas.          |
    And el botón "Descargar reporte de errores" está habilitado

  Scenario: Importar archivo con encabezados incorrectos
    Given el usuario tiene un archivo Excel con encabezados modificados
    When selecciona el archivo y hace clic en "Cargar"
    Then el sistema muestra el error "El archivo no corresponde a ninguna versión válida del layout."
    And no se importa ninguna unidad
    And el tab "Resultados" no se activa

  Scenario: Importar archivo con versión v1 (36 columnas) desde la pantalla v2
    Given el usuario tiene un archivo "ImportarUnidades.xls" con 36 columnas (versión anterior)
    When lo selecciona en el popup y hace clic en "Cargar"
    Then el sistema detecta automáticamente que es la versión v1
    And procesa el archivo usando el mapeo de 36 columnas
    And las columnas 37-48 quedan vacías para esas unidades

  # ─────────────────────────────────────────────
  # FLUJO 3 — VALIDACIONES DE NEGOCIO
  # ─────────────────────────────────────────────

  Scenario: Validación de campo TransporteRentadaOPrestada en unidad no rentada
    Given una fila del archivo tiene valor "ARRENDADA" en la columna 48 (TransporteRentadaOPrestada)
    And el campo "EsRentada" de esa unidad es falso (la unidad no es rentada)
    When el sistema procesa esa fila
    Then la fila no se importa
    And el motivo del error es "TransporteRentadaOPrestada solo aplica para unidades rentadas."

  Scenario: Validación de campo TransporteRentadaOPrestada en unidad rentada
    Given una fila del archivo tiene valor "ARRENDADA" en la columna 48 (TransporteRentadaOPrestada)
    And el campo "EsRentada" de esa unidad es verdadero
    When el sistema procesa esa fila
    Then la fila se importa correctamente
    And el campo "TransporteRentadaOPrestadaSAT" queda guardado con el valor "ARRENDADA"

  Scenario: Fila con error no bloquea las demás filas
    Given el archivo contiene 10 filas válidas y 2 filas con error intercaladas
    When el sistema procesa el archivo
    Then importa las 10 filas válidas
    And acumula los errores de las 2 filas inválidas
    And no detiene el proceso por los errores encontrados

  # ─────────────────────────────────────────────
  # FLUJO 4 — REPORTE DE ERRORES
  # ─────────────────────────────────────────────

  Scenario: Descargar reporte de errores después de una importación parcial
    Given el usuario acaba de importar un archivo con 3 filas con error
    And el tab "Resultados" muestra la tabla de errores
    When hace clic en "Descargar reporte de errores"
    Then se descarga el archivo "ReporteErrores_ImportarUnidades.xls"
    And el archivo contiene únicamente las filas que no se importaron
    And el archivo tiene las mismas columnas del layout original utilizado
    And el archivo incluye una columna adicional "Motivo del error" al final

  Scenario: Botón de reporte deshabilitado cuando no hay errores
    Given el usuario acaba de importar un archivo sin errores
    When el sistema muestra el tab "Resultados"
    Then el botón "Descargar reporte de errores" aparece deshabilitado
    And no es posible hacer clic en él

  # ─────────────────────────────────────────────
  # CORRECCIONES DE ENCABEZADOS (bugs existentes)
  # ─────────────────────────────────────────────

  Scenario: Validación correcta del encabezado TarjetaIAVE2 (columna 20)
    Given el archivo tiene el encabezado "TarjetaIAVE2" en la columna 20
    When el sistema valida los encabezados del archivo
    Then la validación de la columna 20 es exitosa
    And el sistema mapea el valor al campo "TarjetaIAVE2" en la base de datos

  Scenario: Archivo con encabezado obsoleto TarjetaEPASS es rechazado
    Given el archivo tiene el encabezado "TarjetaEPASS" en la columna 20 (encabezado antiguo)
    When el sistema valida los encabezados del archivo
    Then la validación falla
    And el sistema muestra el error "El encabezado de la columna 20 no es válido. Use 'TarjetaIAVE2'."

  Scenario: Validación correcta del encabezado VencimientoSeguro (columnas 27 y 32)
    Given el archivo tiene el encabezado "VencimientoSeguro" en las columnas 27 y 32
    When el sistema valida los encabezados
    Then la validación de las columnas 27 y 32 es exitosa
