# Observatorio Electoral 3.11.0 · 19/11/2026

Se auditó la funcionalidad propuesta para evitar duplicados. El Laboratorio provincial ya calcula votos extra para un escaño, edita votos y compara/aplica transferencias con antes y después. Las Simulaciones no aplican una intervención emparejada a múltiples escenarios. Los módulos CIS y Microdatos analizan encuestas, no otro cálculo de reparto tras transferencias.

Cocientes provinciales añade votos por candidatura y un resumen de votos válidos, votos a candidaturas y blancos. Se aclara su carácter de escenario, volumen histórico fijo y exclusión de nulos. Filtrar candidaturas mantiene los totales y los competidores del reparto completo.

Un acceso al Laboratorio carga la misma provincia y una nueva base explícita «Estimación de sondeos», independiente de ediciones nacionales. Se reutilizan los cálculos existentes; no se duplica la transferencia ni se introduce un índice de probabilidad. La base de Simulaciones y la histórica siguen disponibles. La base de sondeos se restaura y refresca al cambiar el catálogo. Ayuda y explicación del selector actualizadas.

Validación: 145 pruebas integradas; WebKit en 320/375/1280: suma de filas y totales, invariancia del filtro, paso al laboratorio tras editar un porcentaje nacional, restauración, transferencia y ausencia de contaminación de Cocientes. Importación de catálogo de prueba solo en sesión comprueba el refresco de la base de sondeos. Sin errores JS ni desbordamiento de página; capturas revisadas. No se afirma prueba en iPhone físico. Motor electoral y almacenamiento persistente sin cambios.
