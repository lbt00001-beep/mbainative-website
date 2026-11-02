# Observatorio Electoral 3.7.2 — Target Point / El Debate

La búsqueda no detectaba la encuesta del2/11 porque la etiqueta «encuesta Target Point» está fuera del enlace del titular. La noticia combina estimaciones con transferencias y valoración; su vector completo está en un gráfico Datawrapper separado, y la ficha técnica queda fuera del articleBody de los metadatos.

El descubrimiento reconoce la etiqueta dentro de cada tarjeta y solo la aplica a su titular principal. El lector identifica un único iframe «Porcentaje de voto», descarga su dataset público y comprueba título, fuente TargetPoint, identificador, columnas y coincidencia del fin de campo con la ficha. No ejecuta JavaScript remoto: solo interpreta el JSON de metadatos y el TSV. Lee la columna «Porcentaje», omite las celdas vacías y separa la columna GEN.2023. El CSV original y su huella quedan conservados.

Datos publicados2/11: campo28–30/10 (inicio18h del28),1024panelistasCAWI, ponderación documentada. PP31,8PSOE25,5Vox19,9FrenteAmplio6,6Podemos2,4SALF2,6. FrenteAmplio se armoniza con Sumar. Denominador no explícito, con reducción de peso; ausencias no se rellenan y no se importan escaños de la casa. El modo CATI/CAWI se reconoce como sigla completa para que «educativo» no sugiera entrevistas telefónicas.

Un gráfico incompatible, inaccesible, de líderes, de otra casa o con campo diferente queda pendiente sin sustituir datos por cifras de transferencias. Se registra el original nacional como respaldo para instalaciones existentes. Ayuda, versión3.7.2 y crédito coherentes; se conserva GPT6.1SolMedio con su grafía confirmada en la app. El despliegue mantiene los datos persistentes.

Validación contra el HTML real de índice/noticia y dataset del gráfico, cuatro pruebas específicas,78 electorales y119 web; verificación de datos y build electoral, lint y tipos. CI verifica la compilación web y la auditoría. La comprobación final se hará tras el despliegue con Actualizar público.
