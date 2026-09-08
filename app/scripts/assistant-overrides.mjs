// Tool tours explain controls and concepts; they never narrate private inputs or changing market values.
const chapter=(title,text,selector='main')=>({title,text,match:'',selector});
export const overrides={
 '/aplicaciones/tradingalpha':[
  chapter('Bienvenido a TradingAlpha','Esta herramienta reúne información de mercado y varios métodos de análisis. Te explicaré cómo orientarte. Los números que aparecen pueden cambiar; esta guía explica los conceptos y no da recomendaciones de compra o venta.','h1'),
  chapter('Elegir un activo','Busca el símbolo de la empresa o utiliza los accesos rápidos. Espera a que se carguen los datos. Comprueba qué activo estás viendo antes de interpretar un gráfico o una valoración.','input'),
  chapter('Resumen y radar','El resumen combina indicadores para ayudar a ordenar el análisis. Una puntuación resume supuestos; no garantiza lo que hará una acción. Conviene contrastar sus componentes y la fecha de los datos.','[data-assistant-target="trading-tabs"]'),
  chapter('Gráficos y valoración','La pestaña técnica muestra la evolución del precio. La valoración por flujos de caja calcula un escenario usando supuestos sobre el futuro. Cambiar esos supuestos puede cambiar mucho el resultado. Explora cada pestaña y revisa la ayuda antes de sacar conclusiones.','[data-assistant-target="trading-tabs"]'),
  chapter('Estados financieros y noticias','Los estados financieros ayudan a entender el negocio. El sentimiento resume señales informativas, que pueden ser incompletas. Compara varias fuentes y separa los hechos de las interpretaciones.','[data-assistant-target="trading-tabs"]'),
  chapter('Informe con inteligencia artificial','El informe redacta una interpretación de los datos. Necesita tu clave personal de OpenRouter, que puedes introducir en Ajustes. Revisa cifras, fuentes y supuestos del texto generado. El asistente de esta página no lee tu clave ni tu informe privado.','[data-assistant-target="trading-tabs"]'),
  chapter('Revisión antes de decidir','Consulta la guía didáctica y las salvedades de la aplicación. Utiliza los resultados como material de estudio y contraste. Puedes detener este recorrido para explorar una pestaña a tu ritmo.','[data-assistant-target="trading-tabs"]'),
 ],
 '/aplicaciones/inversion-fundamentales':[
  chapter('Análisis de fundamentales','Aquí puedes consultar indicadores y comparar hipótesis sobre una inversión. Empezaremos por la empresa, seguiremos por sus datos y terminaremos por los escenarios. La guía explica la herramienta y no recomienda operaciones.','h1'),
  chapter('Selecciona la empresa','Introduce un símbolo de mercado válido y solicita el análisis. Comprueba que los datos pertenecen a la empresa y al periodo que quieres estudiar. Si una fuente no responde, evita completar los valores ausentes por intuición.','input'),
  chapter('Interpreta los indicadores','Un ratio compara dos magnitudes del negocio. Puede ayudar a detectar diferencias, pero su significado depende del sector y del momento. Contrasta rentabilidad, deuda, crecimiento y generación de caja en conjunto.'),
  chapter('Trabaja con escenarios','Una valoración depende de sus supuestos. Prueba qué ocurre con un crecimiento menor o con un coste de capital diferente. Revisa las limitaciones del método y conserva la responsabilidad sobre tus decisiones.'),
 ],
 '/empresa-nativa-ia/empezar':[
  chapter('Diseña tu primer piloto','Un piloto es una prueba pequeña para descubrir si una forma de trabajar mejora un resultado. No necesitas transformar toda la empresa. Escoge un proceso concreto y una persona que pueda revisar lo que ocurra.','h1'),
  chapter('Elige una tarea adecuada','Busca una tarea frecuente, con entradas y salida claras, que puedas probar mediante borradores. Así podrás comparar casos sin autorizar todavía acciones que afecten a clientes, pagos u operaciones.','.pilot-introduction'),
  chapter('Parte de un ejemplo','Compras, Ventas, Finanzas y Operaciones ofrecen puntos de partida. Cargar un ejemplo sustituye el contenido de la ficha y conserva los responsables. Adáptalo a la forma real de trabajar de tu equipo.','.pilot-template'),
  chapter('Asigna personas responsables','El responsable define el proceso y responde por su resultado. El supervisor revisa los expedientes y atiende excepciones. Pueden ser la misma persona, pero ambas funciones deben quedar claras.','#pilot-owner'),
  chapter('Define entradas, agentes y permisos','Describe qué inicia el trabajo y qué fuentes están autorizadas. Después asigna una función a cada agente. Separa consultar información, preparar un borrador, modificar un registro y enviar una comunicación. Cada acción necesita el permiso adecuado.','#pilot-trigger'),
  chapter('Acuerda cómo comprobar el resultado','Especifica qué aprueba una persona, cómo medirás calidad, tiempo y coste, y cuándo hay que detenerse. Antes de empezar, acuerda una muestra de prueba, un presupuesto y un umbral de aceptación.','#pilot-approval'),
  chapter('Descarga y revisa la ficha','La ficha se prepara en tu navegador. Descárgala antes de salir, porque no se guarda al recargar la página. Su contenido no se envía al asistente de voz. Revisa el borrador con tu departamento y con TI antes de conectar sistemas.','.pilot-privacy'),
  chapter('Avanza por cuatro puertas','Primero mide el proceso actual. Después prueba sin acciones externas. Revisa resultados y costes con el equipo. Finalmente decide si parar, corregir o ampliar el alcance. Cada avance debe tener una persona responsable.','.architecture-trace'),
 ],
 '/mejores-practicas/noticias':[
  chapter('Actualidad de inteligencia artificial','Esta página reúne noticias y enlaza a las publicaciones originales. Te ayudaré a orientarte sin leer titulares que pueden haber cambiado. Distingue un anuncio de una capacidad que ya puedes probar.','h1'),
  chapter('Explora las fuentes','Utiliza los filtros disponibles para acotar la selección. Revisa la fecha y el medio de cada publicación. Los titulares pueden conservar el idioma de la fuente original.'),
  chapter('De una noticia a una prueba','Cuando una idea parezca útil, abre la fuente y busca qué problema resuelve, qué necesita y cuáles son sus límites. Después elige una tarea de tu empresa en la que puedas comprobar esa promesa mediante una prueba pequeña.'),
 ],
 '/aplicaciones/comparativa-ue':[
  chapter('Comparar España y la Unión Europea','La página muestra un panel económico incrustado. Sirve para explorar indicadores y comparar su evolución. Empieza por una pregunta concreta y elige el indicador, los países y el periodo que permitan responderla.','iframe'),
  chapter('Lee cada gráfico con contexto','Comprueba la unidad, las fechas y la fuente. Un total y una cifra por habitante responden a preguntas diferentes. Una variación porcentual tampoco equivale a un cambio en puntos porcentuales.','iframe'),
  chapter('Explora el panel a tu ritmo','El panel pertenece a una aplicación externa. Por esa separación técnica, este asistente explica cómo usarlo, pero no puede recorrer ni interpretar su contenido interno. Pausa la guía para utilizar sus controles.','iframe'),
 ],
 '/aplicaciones/futuros':[
  chapter('Monitor de futuros','Esta herramienta permite explorar contratos y escenarios. Un futuro es un compromiso sobre una operación posterior; su comportamiento y su riesgo dependen del contrato. Esta guía se centra en orientarte por la aplicación.','h1'),
  chapter('Comprueba el instrumento','Antes de interpretar un gráfico, identifica el contrato, su vencimiento y sus unidades. Si hay una simulación, distingue sus supuestos de los datos observados.','iframe'),
  chapter('Utiliza la ayuda de la herramienta','Si el panel está incrustado desde otro dominio, el asistente no puede acceder a sus controles internos. Detén la narración para explorar la herramienta y revisar sus explicaciones.','iframe'),
 ],
 '/aplicaciones/corrector-rae':[
  chapter('Corrector ortotipográfico','Esta herramienta ayuda a revisar aspectos de escritura, como comillas, mayúsculas y puntuación. Una corrección automática es una propuesta que conviene revisar según el contexto del documento.','h1'),
  chapter('Prepara el documento','Sigue las instrucciones de carga que aparecen en la herramienta. Conserva una copia del original para comparar los cambios. El asistente explica los controles y no lee el contenido de tu archivo.','iframe'),
  chapter('Revisa el resultado','Comprueba especialmente los nombres propios, las citas y los términos de tu actividad. Si la aplicación se muestra dentro de un panel externo, utiliza su ayuda: este asistente no puede recorrer el interior de otro dominio.','iframe'),
 ],
 '/plan-de-marketing/index.html':[
  chapter('Tu plan de marketing','Un plan conecta una situación de partida con objetivos y acciones. Esta aplicación te ayuda a ordenar ese trabajo. Te explicaré los pasos generales sin leer los datos que introduzcas.','h1'),
  chapter('Comprende el punto de partida','Describe tu oferta, a quién va dirigida y con qué alternativas compite. Separa los datos que conoces de las hipótesis que necesitas comprobar.'),
  chapter('Define objetivos y acciones','Elige objetivos medibles y acciones vinculadas a ellos. Indica quién hace cada acción, cuándo y con qué recursos. Una lista larga no sustituye una prioridad clara.'),
  chapter('Presupuesta y revisa','Comprueba que el presupuesto y el calendario son coherentes. Utiliza la exportación disponible para revisar el plan con tu equipo. El documento final debe reflejar decisiones que alguien pueda ejecutar y supervisar.'),
 ],
 '/benchmarks-ia/index.html':[
  chapter('Comparar modelos de inteligencia artificial','Un benchmark es una prueba de referencia. Ayuda a comparar determinadas capacidades, pero no representa todas las tareas de tu empresa. Esta guía explica cómo leer las comparaciones sin dar por permanentes sus puntuaciones.','h1'),
  chapter('Comprueba qué mide cada prueba','Revisa la tarea evaluada, la fecha y las condiciones. Modelos con puntuaciones parecidas pueden tener comportamientos distintos ante tus documentos o herramientas.'),
  chapter('Contrasta capacidad, coste y uso real','Escoge algunos candidatos y pruébalos con ejemplos representativos. Cuenta los errores, las correcciones y el coste por resultado aceptado. La mejor elección depende de tu caso de uso.'),
 ],
 '/evolucion/index.html':[
  chapter('Explora la evolución demográfica','Este simulador presenta una visión simplificada del cambio de la población a lo largo del tiempo. Utiliza el mapa y la cronología para observar patrones. Una simulación depende de sus supuestos y no equivale a un registro exacto de la historia.','h1'),
  chapter('Cronología y controles','La reproducción del simulador es independiente de la voz de este asistente. Puedes pausar esta guía para mover la cronología o cambiar su velocidad. Comprueba el periodo que estás observando.'),
  chapter('Mapa y distribución','El mapa y los indicadores regionales muestran cómo se reparte la población según el modelo. Relaciona lo que ves con la fecha seleccionada y consulta las explicaciones de la aplicación.'),
  chapter('Interpretar la curva','La curva demográfica utiliza una escala logarítmica. Eso permite comparar magnitudes muy distintas, pero las distancias no se interpretan como en una escala lineal. Revisa los supuestos antes de extraer conclusiones.','canvas'),
 ],
};
