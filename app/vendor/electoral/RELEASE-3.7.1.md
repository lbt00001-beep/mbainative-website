# Observatorio Electoral 3.7.1 — actualización de Sigma Dos

Sigma Dos migró su web: /feed/ y los antiguos artículos devuelven404. La app consulta ahora el índice /noticias.php?lang=es y reconoce el cuerpo news-body de la nueva noticia. El descubrimiento conserva el título descriptivo frente a enlaces repetidos «Leer más». Las rutas /noticia y /noticia.php con el mismo id y lang=es se identifican como un artículo; distintos ids siguen siendo estudios diferentes.

La extracción admite fechas como «29 y30 de octubre de2026» y porcentajes entre paréntesis después de horquillas de escaños. Sigue rechazando publicaciones futuras, campos incompatibles, referencias históricas y transferencias. Los mapas provinciales se clasifican como desgloses del estudio nacional.

El sondeo del2/11 se conserva en originalReports como enlace de respaldo para instalaciones con datos persistentes: n2505, CATI+CAWI, campo29–30/10. Se leen PP31,1 PSOE24,6 Vox19,3 FrenteAmplio7,1 Podemos1,9 ERC3 Bildu1,3 PNV0,9 Junts1,1 BNG1 CC0,4 AA1,4. Denominador no explícito, con reducción de peso. FrontValencià0,9 se conserva en unmodeledValues y en la nota, sin sumarlo a Sumar ni proyectarlo como lista independiente; SALF no se completa. No se importan los escaños de la casa.

Ayuda y versión3.7.1 actualizadas; crédito de creación GPT6.1SolMedio conservado con su grafía confirmada. No se reemplaza el catálogo persistente al desplegar: Actualizar incorporará los originales mediante validación y guardará el histórico.

Validación: HTML real de la noticia y del índice, tres pruebas nuevas (descubrimiento/identidad, cifras/ficha, preservación/selección/deduplicación),74 pruebas electorales y115 de web. Verificación de datos y build electoral. CI comprueba lint, tipos, build web y auditoría de producción.
