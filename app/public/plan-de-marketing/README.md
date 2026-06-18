# PlanPro Marketing v1.0.0

Aplicación local sin backend para confeccionar un plan de marketing profesional a partir de los tres documentos de `Documentación`.

## Cómo usarla

Abre `index.html` en el navegador. La app guarda automáticamente los planes en `localStorage`, permite duplicarlos, exportarlos como JSON e imprimir el plan final como PDF desde el diálogo de impresión del navegador.

## Método implementado

La app convierte las guías en un flujo de trabajo práctico:

1. Diagnóstico de empresa, mercado, competencia, FODA y posicionamiento.
2. Evaluación de alineación entre marketing, ventas, atención al cliente y operaciones.
3. Definición de buyer personas.
4. Arquitectura de datos, CRM y reglas de personalización.
5. Mapa omnicanal del recorrido del comprador.
6. Diseño de estrategia, acciones, flujos de venta, objetivos SMART, KPI, presupuesto y plan final.
7. Simulación con IA: el usuario introduce datos clave de la empresa y la app genera un borrador editable de los 10 apartados anteriores.
8. Ajustes: configuración local de OpenRouter, API key y modelo. El modelo por defecto es `google/gemini-3.1-flash-lite`.
9. Ayuda: explicación sencilla del flujo de trabajo y de la simulación de escenarios.
10. Documento final: redacción IA del plan completo y exportación a DOCX o PDF imprimible.

Después de generar la simulación IA, la app vuelve al primer apartado para revisar el plan paso a paso con los botones `Anterior` y `Siguiente`.

En `Ajustes` hay un botón de reinicio total que borra todos los datos guardados en el navegador.

## Archivos principales

- `index.html`: entrada de la aplicación.
- `styles.css`: diseño responsive e impresión.
- `app.js`: modelo de datos, persistencia local, formularios, cálculos y exportación.
