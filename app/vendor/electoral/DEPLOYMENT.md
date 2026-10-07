# Observatorio Electoral en MBAI Native

Ruta pública: `/aplicaciones/observatorio-electoral/`. Informe: `/documentos/observatorio-electoral.pdf`.

El manejador Next.js ejecuta el servicio de consulta de originales HTML y PDF en Node.js (22.13 o posterior). Los archivos del lector PDF se incluyen explícitamente en la salida standalone. No necesita Python en el servidor.

Configurar `ELECTORAL_DATA_DIR` como un directorio privado y escribible fuera de `hbuilds` y `public_html`, que Hostinger sustituye en cada despliegue. El servicio copia el catálogo inicial únicamente si todavía no existe; conserva el catálogo actualizado al reiniciar o desplegar. Sin esta variable, la ruta devuelve 503 para evitar guardar datos en un directorio efímero. `ELECTORAL_PUBLIC_ORIGIN` usa `https://mbainative.com` por defecto.

Las consultas concurrentes comparten trabajo y el resultado se reutiliza durante 15 minutos. Actualizar consulta las fuentes admitidas, extrae los formatos reconocidos y registra las incidencias; no garantiza descubrir todas las publicaciones. Las respuestas directas del CIS se conservan separadas de las estimaciones electorales. Las actualizaciones usan exclusión mutua, escritura atómica y copia del catálogo anterior. Los originales y las evidencias permanecen en el almacenamiento privado; los enlaces publicados permiten consultar las fuentes.

Validación: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --omit=dev --audit-level=low`. Las pruebas incluyen reparto electoral, fecha de publicación, lector PDF, restricciones de origen y conservación del catálogo al reiniciar.

Tras publicar: comprobar la ruta, el PDF, Actualizar, una simulación, y repetir un despliegue para verificar que `data/update-status.json` conserva la consulta realizada en producción. Las frecuencias simuladas son resultados condicionados a supuestos, no probabilidades electorales calibradas.
