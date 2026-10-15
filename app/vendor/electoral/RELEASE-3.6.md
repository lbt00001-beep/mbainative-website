# Observatorio Electoral 3.6.0 — fuentes y CIS

La actualización diferencia portales consultados, publicaciones y verificaciones. Amplía de 17 a 22 fuentes: El Periódico, GESOP, La Vanguardia, Ipsos y ABC se añaden a las anteriores; La Razón ya estaba incluida. Se mantienen los bloqueos visibles y los enlaces originales. Un medio no equivale a un instituto ni a otra encuesta.

Se clasifican por separado artículos temáticos, desgloses territoriales y recopilaciones. Los fallos de acceso, conexión y extracción se muestran en categorías distintas. Las crónicas sin vector completo pueden enlazar un original validado del mismo instituto y fecha; las cifras contradictorias siguen pendientes. No se incorporan porcentajes de aprobación, umbrales del tipo «no alcanza el 3 %» ni datos reservados a suscriptores.

El lector incorpora el sondeo GAD3/ABC de octubre: 1.077 entrevistas, campo del 6 al 8 de octubre, publicación del día 12. Corrige la lectura de «Vox, que lograría…18,2 % de apoyo». El denominador permanece como supuesto porque no está declarado inequívocamente en el texto. La fecha o muestra ausente no se inventa.

El CIS se descubre también desde sus avances de resultados /w/, que pueden aparecer antes que la ficha del catálogo. La ficha técnica puede estar integrada en el PDF. Una etiqueta numérica solo se resuelve mediante otro original completo del mismo estudio con la misma pregunta, muestra y todas las cifras coincidentes; se conserva la fuente alternativa y la explicación.

Las estimaciones publicadas por el CIS se guardan en cisEstimates con medida cisComparisonOnly, nunca en polls. Se contrastan identidad, muestra, columna de voto válido y cifras directas principales con el estudio. La interfaz muestra CIS menos la media ponderada reconstruida en la fecha de publicación, cobertura por partido y originales utilizados. No se presenta la discrepancia como prueba de error electoral o sesgo sistemático. Si no hay historial de esa fecha, no se inventa una referencia.

Los sondeos y fichas se ordenan por fin de campo descendente. Si falta, se usa publicación con aviso. La ordenación de pantalla no modifica pesos ni selección.

Validación previa a la publicación: 63 pruebas del paquete electoral y 99 de la web, verificación de datos, lint, TypeScript y compilación. La búsqueda real sobre copia del catálogo público del 15/10/2026 pasa de 13 a 3 documentos pendientes pese a ampliar fuentes: 2 de lectura o validación y 1 reservado a suscriptores. Dos portales bloquean la consulta del servidor; el bloqueo depende del origen de la petición. Los originales revisados se conservan y el almacenamiento persistente no se sobrescribe al desplegar.
