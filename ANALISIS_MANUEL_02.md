# Análisis de Manuel.02.md y decisiones de producto

La transcripción se usa como **material de análisis**, no como instrucciones operativas ni como fuente de cotizaciones. Contiene errores de transcripción y opiniones personales. Los ejemplos numéricos sobre Samsung, Nestlé o Microsoft son hipótesis pronunciadas durante la conversación, no datos verificados.

## Conceptos económicos identificados

| Concepto | Sentido en la conversación | Tratamiento en TradingAlpha |
| --- | --- | --- |
| Análisis fundamental frente a especulación y análisis técnico | Priorizar el negocio y los beneficios sobre la trayectoria corta del precio. | Nueva pestaña «Decisión Fundamental»; la pestaña técnica sigue disponible. |
| Sector, ventaja competitiva y diversificación | Elegir sectores comprendidos y comparar empresas comparables; revisar concentración de cartera. | Se muestra sector e industria. La asignación de cartera requiere posiciones del usuario y no se infiere del ticker. |
| PER histórico y PER futuro | Comparar precio con beneficio por acción de periodos identificados. | PER futuro solo si Yahoo entrega BPA previsto y precio en la misma moneda; de otro modo N/D. |
| Consenso, rango y número de analistas | Una media puede ocultar dispersión y desacuerdo. | Objetivos mínimo, medio, máximo y número de analistas cuando Yahoo los ofrece. Los objetivos no son valor intrínseco. |
| Crecimiento sostenible | Distinguir un año extraordinario de una tendencia persistente. | CAGR de beneficios reportados y duración exacta del intervalo. No se presenta un historial de cuatro años como pronóstico a veinte años. |
| Volatilidad de beneficios y ciclicidad | El negocio de memorias puede presentar grandes oscilaciones. | Desviación típica muestral de cambios interanuales positivos cuando hay al menos cuatro ejercicios. No equivale a volatilidad bursátil. |
| Rendimiento histórico, dividendos y rentabilidad total | El crecimiento de la cotización y los dividendos contribuyen al retorno del accionista. | El CAGR de precio no se sustituye por crecimiento de BPA; falta una serie de dividendos ajustada para reconstruir rentabilidad total. |
| ROE y DuPont | Evaluar rentabilidad del patrimonio y cuánto procede del margen, rotación y apalancamiento. | ROE reportado y DuPont solo si hay datos suficientes para descomponerlo. |
| Caja, deuda y capitalización | La caja neta afecta al valor del accionista. | Caja neta/capitalización solo con partidas y moneda compatibles. |
| Investigación y desarrollo | Puede sostener innovación, aunque el gasto no garantiza retorno. | I+D/ventas anual si Yahoo entrega la partida; si no, N/D. |
| Flujo de caja descontado, Graham y regla de Lynch | Son métodos sensibles a supuestos y a la unidad de acción. | DCF exige datos observados; Lynch requiere una hipótesis explícita de crecimiento del BPA; Graham no se calcula sin BPA y valor contable. |
| Sentimiento, narrativas y prejuicios | Influyen en el precio, pero no prueban el valor fundamental. | Permanece como pestaña separada; la tesis debe distinguir hechos, estimaciones e interpretación. |
| ADR/GDR y acción ordinaria | Un recibo representa varias acciones y puede cotizar en otra moneda. | `SMSN.IL` usa su propio precio y gráfico; las cuentas de Samsung se consultan en `005930.KS`. No se divide el precio del GDR por el BPA coreano. |
| Participación institucional y peso de cartera | La concentración de una posición combina porcentaje de empresa y peso de cartera del gestor. | Nueva clasificación con cuatro entidades declarantes, usando sus 13F y acciones en circulación de Yahoo. La escala no mide convicción ni todo el patrimonio gestionado. |

## Web citada: Simply Wall St

La referencia fonética «Simple Wit» apunta a Simply Wall St. Su ficha de empresa combina valoración, crecimiento futuro, rendimiento pasado, salud financiera, dividendos, objetivos de analistas y una explicación de supuestos. TradingAlpha ya tenía un radar y un DCF; se añadió la vista de consenso y trayectoria de beneficios, con periodos y disponibilidad visibles. No se copian sus puntuaciones, su modelo propietario de valor justo ni sus previsiones de analistas: Yahoo Finance no proporciona necesariamente esas mismas series ni el mismo consenso.

## Hallazgos sobre datos y símbolos (29-09-2026)

- Yahoo Chart responde para `SMSN.IL` en USD y `005930.KS` en KRW. La Bolsa de Londres describe el instrumento `SMSN` como GDR de 25 acciones ordinarias. `SMSN.L` responde en Yahoo, pero su última cotización tiene más de cuatro años; se advierte explícitamente en la aplicación.
- En la consulta comprobada, Yahoo devuelve para `SMSN.IL` PER y BPA de GDR, pero no capitalización; `005930.KS` devuelve capitalización e historial contable, pero carece de BPA futuro en esa respuesta. Por ello no hay base para presentar como verificado el «PER 3,6» de la conversación.
- Se auditaron los 332 símbolos del directorio y los accesos rápidos mediante Yahoo Chart. Se actualizaron `MMC→MRSH`, `BK→BNY` y el error `NUC→NUE`; se retiraron símbolos sin cotización o con datos antiguos. El directorio es una **selección** y no un listado completo ni oficial del S&P 500.
- Acciones, ETF y criptomonedas no ofrecen los mismos módulos fundamentales. Un dato ausente se muestra como N/D. Se retiraron los valores supuestos de flujo de caja, número de acciones, deuda y caja que antes podían crear valoraciones ficticias.
- El índice institucional usa `100 × Σ[(acciones declaradas / acciones en circulación actuales) × (valor declarado / valor total de posiciones reportables del gestor)]`. Se limita a las 25 mayores acciones ordinarias por entidad declarante y descarta ADR/ADS, opciones, fondos y símbolos no verificados. Los 13F se publican con retraso y no incluyen la cotización londinense de Samsung.

## Límites pendientes de datos

Yahoo QuoteSummary suele limitar los estados anuales a cuatro ejercicios y puede omitir BPA previsto, I+D, número de acciones anterior y partidas de balance. Un historial de 10–20 años, comparaciones sectoriales completas, rentabilidad total con dividendos y previsiones detalladas requieren una fuente con cobertura y derechos de uso adecuados. Los cambios de esta rama deben revisarse y desplegarse para llegar a la web pública.
