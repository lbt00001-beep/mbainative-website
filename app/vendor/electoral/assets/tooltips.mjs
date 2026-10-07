export const PARAMETER_HELP={
 'micro-basis':'PESO es la ponderación publicada del CIS, un ajuste de muestra que no equivale a su estimación electoral. Pesos iguales sirven para comparar su efecto, pero no garantizan mayor representatividad.',
 'micro-recall':'Compara el recuerdo declarado con el resultado de 2023 entre candidaturas comparables y cambia su influencia. La referencia no representa exactamente la población actual. Los factores se limitan entre 0,25 y 4 para evitar pesos extremos; no ajusta quienes no recuerdan partido.',
 'micro-participation':'La alternativa declarada multiplica el peso por la probabilidad de votar que responde cada persona, dividida por diez. Un 5 aporta la mitad que un 10. Es una regla exploratoria sin calibración; las respuestas sin número válido quedan fuera de esta opción.',
 'micro-undecided':'Solo modifica no sabe y no contesta. Puede dejarlos sin asignar, repartirlos como el voto declarado nacional o como el de su mismo grupo de recuerdo. Un grupo sin respuestas válidas usa la distribución nacional. Abstención y nulos nunca se redistribuyen.',
 'micro-dimension':'Variable por la que se divide la muestra. Muestra distribución de intención dentro de cada grupo, no el peso de ese grupo en toda España. Los grupos pequeños tienen más incertidumbre y se ocultan porcentajes con base insuficiente.',
 'micro-view':'La alternativa sin imponer el promedio calcula su resultado con las reglas elegidas, todavía sin validación predictiva. Perfiles ajustados impone el total del promedio entre cinco partidos para describir sus apoyos: no es una estimación nacional independiente.',
 'Tamaño efectivo de pesos':'Equivale a la información que conservarían los pesos si todas las entrevistas influyeran igual, según la fórmula de Kish: cuadrado de la suma de pesos dividido por suma de pesos al cuadrado. No incluye todos los errores del diseño ni es un margen de error electoral.',

 'national-sigma':'Escala de las variaciones nacionales, en puntos porcentuales. Pasar del 32 % al 34 % son dos puntos. Aumentar σ genera escenarios más diferentes del central; no equivale al margen de error publicado por una encuesta ni fija un límite máximo.',
 'local-sigma':'Añade variaciones propias de cada provincia, además del cambio nacional. Dos simulaciones pueden tener un apoyo nacional parecido y repartirlo territorialmente de forma distinta. Un valor mayor puede cambiar más escaños; no es una encuesta provincial.',
 runs:'Cantidad de elecciones hipotéticas que calcula el programa. Más ensayos estabilizan las frecuencias dentro de los mismos supuestos, pero no mejoran las encuestas ni convierten el modelo en una predicción validada.',
 seed:'Número que determina la secuencia de variaciones aleatorias. Con iguales datos, parámetros y semilla se repite el experimento. Cambiarlo genera otros ensayos, no información nueva sobre los votantes.',
 preset:'Ejemplos de hipótesis para experimentar. Aplicar uno cambia los porcentajes nacionales; no incorpora una encuesta ni expresa la opinión de la app sobre lo que ocurrirá.',
 'province-select':'Provincia, Ceuta o Melilla donde se asignan los escaños. El Congreso se calcula sumando 52 repartos locales, no repartiendo directamente el porcentaje de toda España.',
 'province-basis':'Puedes usar la proyección actual de los sondeos o los resultados oficiales de 2023 como referencia histórica. La proyección es un cálculo con supuestos; la referencia histórica es un resultado observado.',
 'province-blank':'Votos válidos que no eligen ninguna candidatura. Cuentan al calcular la barrera del 3 %, pero no reciben escaños. Aumentarlos puede dificultar que una lista pequeña supere esa barrera.',
 'province-seats':'Número de diputados que se reparten en esta circunscripción. La base actual usa los escaños de la convocatoria de 2026. Editarlo crea un escenario hipotético, sin cambiar la norma electoral.',
 'transfer-from':'Candidatura a la que se restan los votos. Debe tener al menos tantos votos como deseas transferir. El resto de candidaturas conserva sus votos.',
 'transfer-to':'Candidatura que recibe exactamente los votos restados a la de origen. El total válido y los votos en blanco permanecen iguales, pero los cocientes de ambas candidaturas cambian.',
 'transfer-amount':'Número entero de votos que cambian de una candidatura a otra. Primero se muestra una comparación. Puede cambiar el voto sin mover ningún escaño: el cambio debe ser suficiente para cruzar un cociente ganador o una barrera legal.',
 'poll-import':'Carga un catálogo preparado en formato JSON. La app comprueba su estructura y coherencia, pero no puede certificar que el autor del archivo haya verificado las cifras. Esta importación solo dura durante la sesión.',
 'api-key':'Clave personal que permite usar tu cuenta de OpenRouter. Se envía únicamente a OpenRouter para autenticar la consulta y permanece en memoria mientras está abierta esta página. No se guarda en el servidor ni forma parte del catálogo electoral.',
 'ai-model':'Modelo de IA que responderá a tu pregunta. La lista procede del catálogo actual de OpenRouter; aparecer en ella no garantiza disponibilidad, saldo suficiente o acceso de tu cuenta. Los precios y capacidades dependen del modelo.',
 'ai-question':'Pregunta que se enviará junto al escenario nacional, sus escaños y supuestos. No incluyas información privada innecesaria. La IA explica el cálculo; no modifica los votos ni comprueba nuevas encuestas.',
 'ai-max-tokens':'Límite total de unidades de texto que puede generar el modelo. Incluye razonamiento interno y respuesta visible. Un límite demasiado pequeño puede dejar la respuesta vacía; uno mayor puede consumir más saldo. No significa que siempre se gasten todos los tokens.',
 'Escala vertical de la evolución':'Selecciona todos los porcentajes o amplía un intervalo para ver cambios pequeños. En una vista ampliada, las series fuera de sus límites no se dibujan. Los porcentajes no cambian y la tabla conserva todas las cifras.',
 'Estimación propia':'Media de los sondeos originales incluidos, ponderada por actualidad, tamaño y metodología. El porcentaje corresponde al conjunto de España sobre voto válido; cada provincia puede tener un porcentaje diferente.',
 'Evolución de la estimación':'Reconstruye la media con los sondeos del catálogo que ya se habían publicado en cada fecha. Las líneas unen cálculos, no mediciones diarias. Con pocos sondeos o cambios de cobertura, una variación puede reflejar composición del catálogo.',
 'Proyección de escaños 2026':'Distribuye el voto esperado por provincias y aplica las reglas electorales en cada una. Usa patrones históricos para el reparto territorial. No es una suma de sondeos provinciales actuales ni un resultado electoral observado.',
 'Escenario central':'Reparto obtenido con los porcentajes elegidos, antes de añadir las variaciones aleatorias. Es el punto de partida de la simulación y suma 350 escaños; no significa que sea el resultado más probable.',
 'PSOE y apoyos de la investidura de 2023':'Suma los escaños proyectados del PSOE y de las candidaturas vinculadas a quienes votaron a favor de su investidura en 2023, incluida Coalición Canaria. Podemos se cuenta aparte en el escenario actual. Es una suma aritmética, no una promesa de acuerdo futuro.',
 'PP + Vox':'Suma de los escaños de estas dos candidaturas en el escenario. Compararla con 176 permite estudiar una mayoría absoluta. La suma no garantiza que exista un acuerdo político.',
 'PSOE + Sumar + Podemos':'Suma de estas tres candidaturas estatales. No incluye los partidos territoriales; el recuadro de apoyos a la investidura los añade y explica cuáles son.',
 'Resto de candidaturas':'Escaños de las listas que no pertenecen a las dos sumas anteriores. No forman un bloque político único; cada candidatura se calcula por separado.',
 'Muestra':'Número de personas entrevistadas. Una muestra mayor puede reducir el error aleatorio, pero no elimina sesgos de selección, no respuesta o cuestionario. El modelo limita su influencia y considera también el método.',
 'Campo hasta':'Último día de las entrevistas. Indica cuándo se recogieron las respuestas; puede ser anterior a la publicación. Se utiliza para dar más peso a observaciones recientes.',
 'Publicación':'Fecha en que el estudio se hizo público. En la evolución no se utiliza una encuesta antes de esa fecha. Publicar una encuesta antigua hoy no convierte sus entrevistas en observaciones actuales.',
 'Peso orientativo':'Porcentaje de influencia del estudio entre los seleccionados. Si un partido no tiene cifra en ese estudio, su media se calcula solo con los que sí la publican. El peso se puede reconstruir en la ficha.',
 'Voto válido':'Porcentaje sobre votos a candidaturas y votos en blanco; excluye nulos y abstención. No es lo mismo que el porcentaje de todos los entrevistados que menciona un partido en una pregunta del CIS.',
 'Voto válido esperado':'Porcentaje que produce el modelo para el escenario elegido, incluyendo el blanco en el denominador. Puede ser editado para explorar hipótesis; no es un voto ya emitido.',
 'Sondeos con cifra':'Cantidad de estudios seleccionados que publican un dato para ese partido. Un dato ausente no se cuenta como cero. Una cobertura pequeña obliga a interpretar la cifra con más cautela.',
 'Institutos':'Número de encuestadoras distintas disponibles para ese cálculo. Se usa como máximo un estudio de cada una, para que publicar muchas encuestas no multiplique artificialmente su influencia.',
 'Votos':'Número absoluto de votos de la candidatura en la provincia. En la proyección es un número calculado con supuestos, tomando como base el volumen provincial de 2023; en la referencia histórica es oficial.',
 '% válidos':'Votos de esta candidatura divididos por los votos válidos de la provincia, multiplicados por 100. El denominador provincial explica por qué el porcentaje de Madrid puede diferir del de toda España.',
 'Escaños':'Diputados asignados tras ordenar los cocientes de D’Hondt. El voto puede aumentar sin obtener otro escaño si todavía no supera un cociente ganador. En Ceuta y Melilla gana la candidatura más votada.',
 'Escaños 2026':'Diputados correspondientes a la circunscripción en la convocatoria de 2026. Pocos escaños suelen exigir un porcentaje mayor para obtener representación.',
 'Siguiente cociente':'Votos de la candidatura divididos por los escaños que ya tiene más uno. Si supera un cociente ganador de otra candidatura, puede ganar el siguiente escaño. No es un resto de votos sobrantes.',
 'Votos extra para +1':'Votos adicionales mínimos que el cálculo necesita para ganar un escaño más, manteniendo los votos de las otras listas. Aumentan el total válido. No equivalen a una transferencia, que resta votos a otra candidatura.',
 'Divisor':'Número por el que se divide el voto de una lista: 1, 2, 3 y siguientes. Sus cocientes compiten con los de las demás candidaturas hasta completar los escaños de la provincia.',
 'Cociente':'Resultado de dividir los votos por un divisor. D’Hondt selecciona los cocientes más altos, no los restos de una división. Cerca del último cociente ganador, pocos votos pueden cambiar un diputado.',
 'Mediana':'Resultado situado en el centro de los repartos simulados: la mitad queda por debajo o igual y la mitad por encima o igual. Describe los ensayos del modelo, no una garantía electoral.',
 'P10':'Percentil 10: aproximadamente el 10 % de los ensayos queda por debajo o igual. Junto con P90 describe el intervalo central aproximado del 80 % de las simulaciones bajo tus supuestos.',
 'P90':'Percentil 90: aproximadamente el 90 % de los ensayos queda por debajo o igual. No es un límite que el resultado real no pueda superar.',
 'Error absoluto medio':'Media de las diferencias absolutas entre la estimación y el resultado conocido, en puntos. Menor valor significa mayor aproximación en esa evaluación; pocas elecciones no permiten una clasificación definitiva.',
 'Factor candidato (no aplicado)':'Multiplicador histórico estudiado como alternativa. No se utiliza en la estimación actual mientras no se demuestre una mejora en elecciones reservadas, distintas de las usadas para aprender el factor.',
 'No sabe + no contesta':'Personas que no eligen una candidatura en esta pregunta. No se reparten automáticamente entre los partidos. Excluirlas y volver a calcular porcentajes cambia el denominador y no constituye por sí solo una predicción.',
 'Recuerdo normalizado':'Recuerdo declarado del voto anterior, recalculado entre quienes mencionan una candidatura. Puede diferir del resultado oficial por memoria, no respuesta o composición de la muestra; una diferencia no demuestra por sí sola manipulación.',
 'Diferencia (puntos)':'Resta entre los dos porcentajes comparados. Es una diferencia en puntos porcentuales: 25 % menos 20 % son 5 puntos, no un aumento relativo del 5 %.',
 'Directa':'Respuesta a la pregunta sobre a quién votaría la persona entrevistada. Se expresa sobre el total de la encuesta y mantiene indecisos y abstención como respuestas distintas. No es una estimación de voto válido.',
 'Voto + simpatía':'Añade afinidad por un partido a algunas personas que no expresan intención de voto. Es una operación diferente de la pregunta directa y de la estimación electoral; no debe mezclarse con ellas.',
 'Fuente':'Enlace al documento o publicación original que permite contrastar la cifra. Que una página sea accesible no significa que se haya podido verificar su tabla completa.',
};
export function parameterHelp(label){
 const clean=label.replace(/\s+/g,' ').trim();
 if(PARAMETER_HELP[clean])return PARAMETER_HELP[clean];
 if(/^Estimación propia/.test(clean))return PARAMETER_HELP['Estimación propia'];
 if(/Error media|Error con historial|MAE /.test(clean))return PARAMETER_HELP['Error absoluto medio'];
 if(/entrevistas|Entrevistas/.test(clean))return PARAMETER_HELP.Muestra;
 if(/Votos (antes|después)/.test(clean))return 'Votos de la candidatura antes o después de la transferencia comparada. El cambio de votos es visible aunque no cambie ningún escaño; el total válido de la provincia se conserva.';
 if(/Escaños (antes|después)/.test(clean))return PARAMETER_HELP.Escaños;
 if(/^% (antes|después)$/.test(clean))return PARAMETER_HELP['% válidos'];
 if(/^Cambio/.test(clean))return 'Resultado después de la transferencia menos resultado anterior. Cero significa que este parámetro no cambia, aunque los votos de origen y destino sí lo hagan.';
 return null;
}
export function helpButton(text,label,doc=document){
 const button=doc.createElement('button');button.type='button';button.className='help-question';button.textContent='?';button.setAttribute('aria-label','Ayuda sobre '+label);button.dataset.help=text;return button;
}
export function enhanceParameterHelp(root=document){
 for(const input of root.querySelectorAll('input,select,textarea')){
  let text=PARAMETER_HELP[input.id]||PARAMETER_HELP[input.getAttribute('aria-label')];
  if(input.id.startsWith('pct-'))text='Porcentaje nacional sobre voto válido de esta candidatura. Cambiarlo crea un escenario manual. Se distribuye por provincias mediante patrones históricos, por lo que no se impone ese mismo porcentaje a Madrid ni a las demás provincias.';
  if(input.id.startsWith('local-')&&input.id!=='local-sigma')text='Votos absolutos de esta candidatura en la provincia elegida. Puedes editarlos para estudiar un escenario local. El porcentaje se obtiene dividiéndolos por el total válido de esa provincia; el cambio no altera la estimación nacional.';
  const holder=input.closest('label')||root.querySelector(`label[for="${input.id}"]`)||(input.id.startsWith('pct-')?input.closest('.range-heading'):null);
  const labelCopy=holder?.cloneNode(true);labelCopy?.querySelectorAll('input,select,textarea,.help-question').forEach(n=>n.remove());const controlLabel=labelCopy?.textContent.trim()||input.id;
  if(text&&holder&&!input.hasAttribute('aria-label'))input.setAttribute('aria-label',controlLabel.slice(0,100));
  if(text&&holder&&!holder.querySelector('.help-question'))holder.prepend(helpButton(text,input.getAttribute('aria-label')||controlLabel.slice(0,80),root.ownerDocument||root));
 }
 for(const heading of root.querySelectorAll('h3,.metric small')){const text=parameterHelp(heading.textContent);if(text&&!heading.querySelector('.help-question'))heading.append(helpButton(text,heading.textContent,root.ownerDocument||root));}
}
export function installTooltips(doc=document){
 const tooltip=doc.createElement('div');tooltip.id='parameter-tooltip';tooltip.className='parameter-tooltip';tooltip.role='tooltip';tooltip.hidden=true;doc.body.append(tooltip);let active;
 const hide=()=>{active?.removeAttribute('aria-describedby');active=null;tooltip.hidden=true;};
 const show=button=>{hide();(button.closest('dialog')||doc.body).append(tooltip);active=button;button.setAttribute('aria-describedby',tooltip.id);tooltip.textContent=button.dataset.help;tooltip.hidden=false;const r=button.getBoundingClientRect(),w=tooltip.offsetWidth,h=tooltip.offsetHeight;tooltip.style.left=Math.max(10,Math.min(r.left,doc.defaultView.innerWidth-w-10))+'px';tooltip.style.top=(r.bottom+h+18<doc.defaultView.innerHeight?r.bottom+10:Math.max(10,r.top-h-10))+'px';};
 doc.addEventListener('mouseover',e=>{const b=e.target.closest?.('.help-question');if(b&&b!==active)show(b);});
 doc.addEventListener('mouseout',e=>{if(e.target.closest?.('.help-question')===active&&!active?.contains(e.relatedTarget))hide();});
 doc.addEventListener('focusin',e=>{if(e.target.matches?.('.help-question'))show(e.target);});
 doc.addEventListener('focusout',e=>{if(e.target===active)hide();});
 doc.addEventListener('click',e=>{const b=e.target.closest?.('.help-question');if(b){e.preventDefault();e.stopPropagation();show(b);}else hide();});
 doc.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});doc.defaultView.addEventListener('scroll',hide,true);
}
