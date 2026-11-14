# Observatorio Electoral 3.9.0

15 de noviembre de 2026.

Se añaden dos secciones: «Cocientes provinciales», con filtro de consulta de candidaturas y reparto D’Hondt completo, y «CIS · Estimación alternativa», con corrección por recuerdo, tratamiento separado de NS/NC y combinación explícita con la media sin CIS.

La estimación alternativa utiliza las tablas nacionales del preelectoral 3584 y los agregados de microdatos del barómetro 3582. Solo el segundo permite aplicar participación y simpatía individual. Se conservan denominadores y categorías originales. El resultado independiente y la combinación con el consenso se muestran por separado. Los valores iniciales y el peso de la media son hipótesis editables, no parámetros aprendidos. La retrospectiva 2023 no demuestra una mejora predictiva y se muestra íntegramente.

Las alternativas no alimentan el promedio principal ni los escaños. Los archivos incluidos con la versión se sirven desde el paquete; los catálogos y la biblioteca persistentes conservan su almacenamiento existente y no se sobrescriben en el despliegue.

Validación: 142 pruebas de la web y paquete electoral, lint, TypeScript, compilación de producción y auditoría de dependencias. La prueba DOM comprueba la carga del modelo, el cambio de estudio, las restricciones para datos agregados y la actualización de la combinación. No sustituye a una revisión visual de navegador.

Crédito de creación conservado: By Luis Benedicto Tuzón with GPT 6.1 Sol Medio · versión 3.9.0 · 2026.
