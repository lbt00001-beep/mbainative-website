# Observatorio electoral 3.13.0 · Auditoría de cocina · 26/11/2026

Nueva pestaña `40dB y CIS · Cocina`, enlazable con `#cocina`, y capítulo 16 de Ayuda.

Se descargan los archivos públicos de 40dB del 22/11 (tracking Día 10, 2.000 registros) y 23/11 (preelectoral II de voto, 7.500). Se reproducen recuentos, porcentajes ponderados con `ponde` y conversión a voto válido. Se ensayan cinco reglas explícitas, iguales en ambos ficheros, sin atribuirlas a la empresa. Ninguna reproduce sus seis estimaciones. Los estudios se solapan. Marco de ponderación común documentado; identidad de la fórmula electoral privada no identificable.

El CIS 3587 se compara mediante frecuencias y cruces oficiales ya ponderados; no se presentan como entrevistas brutas. Se consulta también su informe técnico de 202 páginas y la matriz de escenarios. Se conservan las discrepancias PP directo 18,0/18,2 y estimación 24,4 en informe técnico frente a 24,7 en anexo. La tabla utiliza el anexo de estimación.

Los datos de auditoría son agregados estáticos, separados del almacenamiento persistente. No se cambian el promedio, los escaños, el catálogo ni los laboratorios y no se ejecuta `api/update`. No se publican registros individuales ni identificadores. Modelo de creación conservado: GPT 6.1 Sol Medio, año 2026.

Reproducción offline: descargar y extraer los dos ZIP de las fuentes indicadas en `data/cooking-audit.json` bajo `research/cocina-20261126/{tracking10,preelectoral2}`; conservar el registro de descargas y el PDF técnico del CIS bajo `cisReport.pdf`. Con pandas instalado, ejecutar `python scripts/prepare-cooking-inputs.py` y después `node scripts/prepare-cooking-audit.mjs`. Las fuentes y huellas están en el agregado; los archivos de investigación quedan fuera del manifiesto público.

Validación: concordancia DTA/XLSX de muestra, pesos e intención; lectura visual de páginas originales; 164 pruebas del paquete web, lint y typecheck. WebKit en 320, 375 y 1.280 píxeles comprueba tablas, enlace directo, ayuda y ausencia de desbordamiento de página. No es una prueba en un iPhone físico.
