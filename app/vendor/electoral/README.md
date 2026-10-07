# Observatorio Electoral · España

Versión 3.2.0. Aplicación local y paquete de integración para mbainative.com. Autor: Luis Benedicto Tuzón.

## Ejecutar

Node.js >=22.13.0. `npm ci`, `npm start`, http://localhost:3026/. En Windows también `EJECUTAR.bat`. La actualización de artículos y PDF se ejecuta íntegramente en Node.js: **no necesita Python**. Los antiguos scripts Python se conservan para investigación histórica.

## Datos y fechas

Una ola por instituto, elegida por fin de campo (publicación si falta), con desempate por publicación. Ventana de 60 días respecto a la fecha de cálculo de hoy en Madrid. Las cifras ausentes no se convierten en cero. La interfaz separa consulta, revisión del catálogo, última publicación, campo y cálculo. Consultar sin novedades no rejuvenece los datos. Todos los pesos absolutos decaen con los días: sus proporciones no cambian si todos envejecen igual, hasta que un estudio sale de la ventana o entra uno nuevo.

Si no quedan sondeos vigentes, se muestra **Archivo: sin sondeos vigentes**, con el último escenario archivado y aviso visible. No se presenta como estimación actual.

Fuentes originales, muestra, campo, observaciones y cálculo por partido son consultables. La estimación electoral CIS se excluye por el criterio editorial solicitado. Sus respuestas publicadas, recodificadas y ponderadas se estudian aparte: no son microdatos sin tratamiento ni se mezclan con voto válido.

## Ponderación metodológica

Peso = tamaño × actualidad × claridad × metodología × historial.

- Tamaño: raíz de mínimo(muestra, límite)/1.500; desconocida, factor 0,8.
- Límite: 1.500; 3.000 solo cuando la selección probabilística está documentada. No es una muestra efectiva calculada.
- Actualidad: semivida de 21 días. Si falta campo, publicación y reducción adicional 0,7.
- Denominador no declarado: se asume voto válido y se aplica 0,8.
- Selección: probabilística documentada 1; panel 0,8; abierta 0,5; desconocida 0,7. No se infiere selección probabilística del modo telefónico o en línea.
- Cuotas no documentadas: 0,9; ponderación no documentada: otro 0,9. Se guardan fuente y evidencia de los atributos.
- Historial: desactivado mientras no mejore la media sencilla en al menos dos elecciones reservadas.

**Estos factores metodológicos son cautelas editoriales, todavía sin calibración histórica propia.** Una fuente no transparente no queda probada como sesgada por ello. El principio de revisar selección, cobertura y ponderación procede de las [buenas prácticas AAPOR](https://aapor.org/standards-and-ethics/best-practices/); los números anteriores son decisiones de esta app, no coeficientes recomendados por AAPOR. El Observatorio compara la media completa, la misma media sin ajuste metodológico y una media sencilla. La ficha ElectoPanel enlaza también su [metodología publicada](https://electomania.es/metodologia/).

## Actualizar

POST ./api/update consulta las fuentes configuradas y originales del catálogo. Artículos y PDF reconocidos se extraen sin IA. Se validan identidad, ámbito, fechas, cifras y coherencia del catálogo y reparto. Fuente, fragmentos y SHA-256 quedan registrados. No garantiza localizar todos los sondeos ni interpretar gráficos o formatos nuevos.

El informe distingue:

- **Verificación completa:** cifras registradas, muestra, campo y denominador reconstruidos y coincidentes.
- **Verificación parcial:** se contrasta parte de las cifras o falta reconstruir la ficha.
- **Solo accesible:** descarga correcta sin poder reconstruir cifras.
- **Incidencia:** bloqueo, discrepancia o formato ambiguo; mantiene datos anteriores.
- Guías, duplicados, portales y estudios antiguos se clasifican separadamente.

La verificación completa no certifica representatividad ni precisión. Los campos `verified` del catálogo reflejan la revisión de incorporación; el grado de recontraste automático se registra por separado.

El servicio comparte consultas simultáneas, conserva resultados dos minutos y pausa reintentos tras fallos. Se limita tamaño de solicitud, destinos, documentos, páginas PDF, memoria del lector y tiempo de extracción. Un bloqueo de archivo protege también frente al actualizador manual. Se escribe mediante renombrado y se conserva copia anterior. Una evaluación manual fallida restaura el catálogo.

`npm run data:search` ejecuta la consulta; `npm run data:update -- fichero.json` incorpora una revisión manual. Si un despliegue interrumpe una actualización, el bloqueo renovable `.run/catalog.lease` se recupera tras dos minutos sin señal de actividad. Un bloqueo reciente se respeta.

## Proyección y evaluación

Patrones provinciales oficiales 2023; huellas europeas 2024 para Podemos y SALF; AC y AA provisionales en sus regiones. Los porcentajes nacionales se ajustan exactamente manteniendo volúmenes de 2023 y usando escaños provinciales 2026. Son supuestos territoriales, no sondeos provinciales actuales. D’Hondt ordena cocientes, no restos.

Las simulaciones alteran errores nacionales, por partido y territoriales y recalculan 350 escaños. Semilla reproducible. **Son análisis de sensibilidad, no probabilidades electorales calibradas** ni predicciones de pactos. La política metodológica nueva no hereda una validación de precisión de los diagnósticos históricos anteriores.

`npm run data:evaluate` publica comparaciones históricas, incluidas las que no mejoran. La comparación reservada de pesos de 2023 sigue siendo parcial y mantiene el factor histórico desactivado. Los diagnósticos territoriales conocen el voto nacional real: no equivalen a predicciones retrospectivas completas.

## Comprobaciones

`npm test`, `npm run data:verify`, `npm run data:evaluate`, `npm run build`. Las pruebas cubren reparto oficial, fronteras D’Hondt, simulaciones, selección de olas, pesos, fechas, lectores HTML/PDF, errores, concurrencia, recuperación, origen de solicitudes y rutas de integración. GitHub ejecuta las comprobaciones con Node 24 y genera el artefacto; no publica automáticamente.

## GitHub → Hostinger → mbainative.com

Se comprobó en hPanel el 7 de octubre de 2026: mbainative.com es una app Node.js conectada a `lbt00001-beep/mbainative-website`, rama master. La web existente usa Next.js. **No sustituirla por este servidor independiente ni subir solamente dist esperando búsquedas.**

La integración se prepara con `node scripts/prepare-hostinger.mjs RUTA_A_COPIA_DE_LA_WEB/app`. Añade un paquete privado, dependencias y la ruta `/aplicaciones/observatorio-electoral`, con archivos y API bajo esa misma ruta. Se sirve el catálogo actualizado desde almacenamiento privado. El paquete trazado incluye lectores PDF y fuentes necesarias para el despliegue standalone. Consulte [deployment/HOSTINGER.md](deployment/HOSTINGER.md).

`PUBLIC_ORIGIN` y `BASE_PATH` configuran el servidor independiente. En la integración Next.js se utilizan `ELECTORAL_PUBLIC_ORIGIN` y `ELECTORAL_DATA_DIR`. **La conservación entre redespliegues requiere una carpeta persistente de Hostinger confirmada o almacenamiento externo.** La copia local prueba reinicios con la misma carpeta; no certifica la persistencia del alojamiento. No se ha desplegado ni cambiado el sitio publicado.

OpenRouter es opcional; clave solo en memoria. La pregunta y el contexto se transmiten a OpenRouter y al proveedor elegido; las respuestas no modifican los cálculos. La aplicación no necesita IA para funcionar.

## Laboratorio de microdatos CIS (octubre de 2026)

La sección usa agregados reproducibles de las 4.042 entrevistas del estudio 3577. No publica identificadores ni registros individuales. Lee PESO, INTENCIONGR, RECUERDO y PROBVOTO; los cruces de edad, sexo, sexo y edad, ingresos e ideología conservan todas las respuestas y las categorías no identificadas. El tamaño efectivo de Kish no sustituye la incertidumbre del diseño.

Se comparan pesos publicados o iguales, ajuste por recuerdo (factores 0,25–4), participación declarada y reglas de indecisos. La vista de perfiles ajusta solo cinco candidaturas al promedio renormalizado entre ellas. Las alternativas no alimentan el promedio ni los escaños. No hay ponderación demográfica nueva ni importación automática de nuevos microdatos.

Reproducción: descarga MD3577.zip desde la fuente indicada en data/microdata-3577.json a research/microdata/MD3577.zip y ejecuta Python scripts/import-microdata.py (solo biblioteca estándar). Para regenerar la comprobación histórica, scripts/evaluate-microdata.mjs lee calibration/microdata-3411.json y resultados oficiales de 2023. El agregado histórico procede de MD3411.zip; scripts/import-historical-microdata.py lo reconstruye con el fichero histórico de territorio de la carpeta calibration. El recuerdo utiliza resultados de 2019. La comparación retrospectiva de 2023 no se describe como una validación prospectiva ni permite seleccionar una receta definitiva.

## Microdatos a petición (v3.4)
Buscar nuevos microdatos CIS descubre hasta ocho páginas de barómetros desde la portada oficial. Incorporar descarga el ZIP y la ficha, contrasta variables nacionales y recuerdo 2023, muestra y fechas, y guarda solo agregados en data/microdata-library.json. La biblioteca conserva hasta doce estudios en ELECTORAL_DATA_DIR y sobrevive a despliegues. No importa modelos electorales del CIS ni modifica el promedio. Cambios de etiquetas o formatos se rechazan para revisión; no se promete cobertura exhaustiva ni predicción de abstención. El endpoint GET/POST api/microdata comparte el bloqueo del catálogo, limita peticiones y documentos, y acepta solo destinos www.cis.es descubiertos en el servidor.
