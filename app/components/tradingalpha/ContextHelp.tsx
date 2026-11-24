"use client";

import { useEffect, useState } from 'react';

type Help = { title: string; explanation: string };
type SvgLabel = { key: string; phrase: string; x: number; y: number };

// The order is intentional: specific terms must win over broad words such as "precio".
const concepts: Array<[RegExp, string, string]> = [
  [/^analizar$/i, 'Analizar un activo', 'Consulta la cotización y los datos disponibles del ticker escrito. Después actualiza las pestañas y los indicadores de ese activo.'],
  [/^\d{1,3}\s*\/\s*100$/, 'Puntuación sobre 100', 'Indica la posición de este eje en una escala interna de 0 a 100. Se calcula con reglas de la app y permite comparar sus dimensiones; no representa una probabilidad de éxito.'],
  [/^salud$/i, 'Salud financiera', 'Resume liquidez, deuda y caja de la empresa. Una puntuación alta sugiere una estructura financiera más sólida según las reglas del radar.'],
  [/^rentabilidad$/i, 'Rentabilidad del negocio', 'En este eje se combinan ROE, ROA y margen neto para resumir cuánto beneficio obtiene la empresa de sus recursos y ventas.'],
  [/^crecimiento$/i, 'Crecimiento', 'Este eje resume variaciones recientes de ingresos y beneficios. Un crecimiento alto puede ser temporal; hay que estudiar si es sostenible.'],
  [/^rápidos:?$/i, 'Accesos rápidos', 'Botones para cargar directamente un símbolo frecuente. Puedes escribir otro ticker en el buscador.'],
  [/^beta(?: yahoo)?$/i, 'Beta', 'Medida de la variación histórica de una acción en relación con un índice de referencia. Beta 1,2 sugiere movimientos 20 % más amplios en promedio, pero no es una predicción.'],
  [/\bttm\b/i, 'Últimos doce meses', 'TTM significa trailing twelve months: suma o referencia a los doce meses más recientes, que pueden no coincidir con el último ejercicio cerrado.'],
  [/cap\.\s*bursátil/i, 'Capitalización bursátil', 'Valor de mercado aproximado: precio por acción × acciones en circulación. Puede cambiar con el precio y con nuevas emisiones o recompras.'],
  [/variación|cambio diario|última sesión/i, 'Variación y fecha de la cotización', 'La variación compara el precio con la referencia de la sesión anterior. Comprueba la fecha: el último precio puede estar retrasado, especialmente en festivos o fuera de mercado.'],
  [/^(?=.*[A-Z])([A-Z0-9]{1,6}(?:[.\-][A-Z0-9]{1,4})?)$/, 'Símbolo del activo', 'Código usado para consultar este instrumento. Verifica bolsa, clase de acción y moneda; símbolos parecidos pueden representar activos diferentes.'],
  [/sector|technology|healthcare|financial services|consumer/i, 'Sector económico', 'Clasificación aproximada de la actividad de la empresa. Los ratios se interpretan mejor comparando empresas de sectores similares.'],
  [/dividendo|rentabilidad por dividendo/i, 'Dividendo', 'Parte del beneficio o caja que la empresa distribuye a accionistas. La rentabilidad por dividendo compara el pago anual con el precio, pero el pago futuro no está garantizado.'],
  [/volatilidad|desviación típica/i, 'Volatilidad', 'Mide cuánto se han dispersado los cambios de precio o resultados respecto de su media. Una volatilidad alta indica más variación histórica, no una dirección segura.'],
  [/ticker|símbolo bursátil/i, 'Ticker', 'Código corto que identifica un instrumento en una bolsa. AAPL identifica Apple; SAN.MC identifica Santander en Madrid. El sufijo indica el mercado.'],
  [/s&p 500|gics/i, 'S&P 500 y sectores GICS', 'El S&P 500 agrupa grandes empresas cotizadas de Estados Unidos. GICS es una clasificación de empresas por actividad económica. El directorio es una ayuda para elegir símbolos, no una lista de recomendaciones.'],
  [/cotización|precio actual|precio de mercado|último precio/i, 'Cotización', 'Precio al que se ha negociado el activo según el proveedor de datos. Puede estar retrasado; comprueba la hora y la moneda antes de compararlo con una valoración.'],
  [/capitalización|market cap/i, 'Capitalización bursátil', 'Valor de mercado aproximado de todas las acciones: precio por acción × acciones en circulación. Ejemplo: 100 millones de acciones a 20 € equivalen a 2.000 millones €.'],
  [/52 semanas|52-week/i, 'Rango de 52 semanas', 'Mínimo y máximo observados en aproximadamente un año. La posición dentro del rango describe dónde está el precio, pero no demuestra que esté barato o caro.'],
  [/volumen/i, 'Volumen', 'Cantidad de títulos negociados durante un periodo. Un volumen elevado indica mucha actividad; por sí solo no dice si el precio seguirá subiendo o bajando.'],
  [/velas|apertura|cierre|máximo|mínimo/i, 'Vela japonesa', 'Resume apertura, máximo, mínimo y cierre de un periodo. Si el cierre supera a la apertura, el cuerpo representa una subida; las mechas muestran los extremos alcanzados.'],
  [/sma|media móvil simple/i, 'SMA', 'Media aritmética de los últimos N cierres. La SMA 20 usa 20 sesiones y suaviza las oscilaciones diarias.'],
  [/ema|media móvil exponencial/i, 'EMA', 'Media móvil que da más peso a los precios recientes. Reacciona antes que una SMA de longitud similar, a cambio de generar más señales falsas.'],
  [/rsi|sobrecompra|sobreventa/i, 'RSI', 'Oscilador de fuerza relativa entre 0 y 100. Por encima de 70 suele llamarse sobrecompra y por debajo de 30 sobreventa; ninguna zona predice por sí sola un giro.'],
  [/macd|histograma|línea de señal/i, 'MACD', 'Compara la EMA 12 con la EMA 26; su señal es una EMA 9 del propio MACD. El histograma mide la diferencia entre ambas líneas.'],
  [/bollinger|squeeze|anchura de banda/i, 'Bandas de Bollinger', 'Canal construido con una media de 20 periodos y dos desviaciones típicas. Su anchura expresa volatilidad reciente; un estrechamiento no indica la dirección futura.'],
  [/pivote|resistencia|soporte/i, 'Soporte, resistencia y pivotes', 'Niveles orientativos calculados con máximo, mínimo y cierre de la barra anterior. Pueden servir para observar reacciones del precio, pero no son barreras garantizadas.'],
  [/momentum|tendencia|alcista|bajista|señal técnica/i, 'Tendencia y momentum', 'La tendencia resume la dirección dominante; el momentum mide la fuerza del movimiento. Las señales técnicas combinan reglas del precio y pueden fallar.'],
  [/puntuación alpha|alphascore|huella cuantitativa|radar/i, 'Puntuación Alpha y radar', 'Resumen heurístico de cinco ejes: valoración 25 %, crecimiento 20 %, rentabilidad 20 %, salud 20 % y momentum 15 %. Una puntuación alta no garantiza rentabilidad.'],
  [/valoración|valor intrínseco|valor justo|valor razonable/i, 'Valor intrínseco', 'Estimación de lo que vale una empresa a partir de hipótesis sobre sus beneficios o flujos futuros. Es sensible a los supuestos y no equivale al precio que tendrá en bolsa.'],
  [/margen de seguridad|descuento frente/i, 'Margen de seguridad', 'En esta app: (valor DCF por acción − precio actual) ÷ precio actual × 100. Si el valor es 120 € y el precio 100 €, el margen mostrado es 20 %.'],
  [/dcf|descuento de flujos/i, 'DCF', 'Modelo que proyecta cinco años de flujo de caja libre, calcula un valor terminal y trae todo al presente con una tasa de descuento. Después resta la deuda neta y divide entre las acciones.'],
  [/fcf|flujo de caja libre/i, 'Flujo de caja libre', 'Dinero de operaciones menos inversión en activos productivos. Es una aproximación al efectivo disponible para acreedores y accionistas; puede variar mucho entre años.'],
  [/dcf inverso|descuenta el precio/i, 'DCF inverso', 'En lugar de estimar el valor a partir de un crecimiento supuesto, calcula qué crecimiento del flujo de caja hace falta para justificar el precio actual. Ayuda a juzgar si las expectativas del mercado son exigentes.'],
  [/sensibilidad/i, 'Tabla de sensibilidad', 'Muestra cómo cambia el valor por acción al variar el WACC y el crecimiento terminal. Si pequeños cambios alteran mucho el resultado, la valoración es frágil.'],
  [/roic|creación de valor|capital invertido/i, 'ROIC', 'Rentabilidad del capital invertido: beneficio operativo después de impuestos ÷ (patrimonio + deuda − caja). Si supera al WACC, reinvertir crea valor; si es menor, lo destruye.'],
  [/ev\/ebitda|ev\/ventas|valor de empresa/i, 'Múltiplos de valor de empresa', 'El valor de empresa (EV) suma capitalización y deuda neta. EV/EBITDA y EV/Ventas permiten comparar empresas con distinta deuda; se interpretan frente a su sector.'],
  [/rentabilidad por fcf|fcf yield/i, 'Rentabilidad por flujo de caja libre', 'Flujo de caja libre anual ÷ capitalización. Un 5 % significa que, al precio actual, la empresa genera cada año caja libre equivalente al 5 % de su valor en bolsa.'],
  [/remuneración en acciones|sbc/i, 'Remuneración en acciones', 'Pago a empleados con acciones u opciones. No consume caja, pero diluye a los accionistas; los analistas suelen restarla del flujo de caja libre.'],
  [/capm|prima de riesgo|libre de riesgo/i, 'CAPM', 'Coste del capital = tipo libre de riesgo + beta × prima de riesgo del mercado. La prima es un supuesto (habitualmente entre el 4 % y el 6 %) que conviene revisar.'],
  [/comparables/i, 'Comparables del sector', 'Empresas de la misma industria usadas como referencia. Un múltiplo solo es alto o bajo en relación con empresas parecidas.'],
  [/sharpe|sortino/i, 'Ratios de Sharpe y Sortino', 'Rentabilidad por encima del tipo sin riesgo dividida por la volatilidad (Sharpe) o solo por la volatilidad de las caídas (Sortino). Cuanto más altos, mejor compensado ha estado el riesgo.'],
  [/alfa|jensen/i, 'Alfa de Jensen', 'Rentabilidad anual que no explica la exposición al mercado (beta). Un alfa pasado positivo no garantiza que se repita.'],
  [/error de seguimiento|ratio de información/i, 'Error de seguimiento y ratio de información', 'El error de seguimiento mide cuánto se separa la acción del índice. El ratio de información divide la diferencia de rentabilidad media entre ese error.'],
  [/wacc|tasa de descuento/i, 'WACC o tasa de descuento', 'Rentabilidad exigida para compensar tiempo y riesgo. Cuanto mayor sea, menor será el valor actual de los flujos futuros. En el DCF debe superar al crecimiento perpetuo.'],
  [/crecimiento terminal|valor terminal|perpetuidad/i, 'Crecimiento y valor terminal', 'El crecimiento terminal supone que, tras los cinco años explícitos, los flujos crecen a una tasa estable. El valor terminal puede dominar el DCF y es muy sensible a esta tasa.'],
  [/deuda neta|caja neta/i, 'Deuda neta y caja neta', 'Deuda neta = deuda financiera − efectivo. Si el efectivo supera a la deuda, la empresa tiene caja neta. El DCF resta la deuda neta al valor de empresa.'],
  [/peter lynch/i, 'Línea Peter Lynch', 'Regla simplificada que relaciona beneficio por acción y crecimiento esperado. Sirve como comparación orientativa; no sustituye un análisis del negocio.'],
  [/graham/i, 'Número de Graham', 'Aproximación basada en beneficio por acción y valor contable por acción: raíz cuadrada de 22,5 × BPA × valor contable por acción. Solo se calcula con datos positivos.'],
  [/per|p\/e/i, 'PER', 'Precio dividido por beneficio por acción. Un PER de 20 significa que el precio equivale a 20 veces el beneficio anual por acción; no garantiza recuperar la inversión en 20 años.'],
  [/bpa|eps/i, 'Beneficio por acción', 'Beneficio atribuible a cada acción. El BPA estimado es una previsión de analistas y puede no cumplirse.'],
  [/peg/i, 'PEG', 'PER dividido por la tasa de crecimiento expresada como porcentaje. Intenta relacionar precio y crecimiento, pero depende de previsiones inciertas.'],
  [/roe|dupont|rentabilidad del patrimonio/i, 'ROE y DuPont', 'ROE = beneficio neto ÷ patrimonio. DuPont lo descompone en margen neto × rotación de activos × multiplicador del patrimonio; un ROE alto puede deberse a mucha deuda.'],
  [/roa/i, 'ROA', 'Rentabilidad sobre activos: beneficio neto dividido por activos totales. Relaciona el beneficio con los recursos empleados.'],
  [/ebitda/i, 'EBITDA', 'Beneficio antes de intereses, impuestos, depreciaciones y amortizaciones. No es lo mismo que flujo de caja libre.'],
  [/ebit/i, 'EBIT', 'Resultado operativo antes de intereses e impuestos. Se utiliza, entre otros datos, en el Altman Z.'],
  [/piotroski|f-score/i, 'Piotroski F-Score', 'Suma de nueve pruebas contables sobre rentabilidad, financiación y eficiencia. Va de 0 a 9; si faltan datos, conviene revisar el desglose antes de interpretar el total.'],
  [/altman|z-score|solvencia|quiebra/i, 'Altman Z-Score', 'Indicador histórico de tensión financiera basado en cinco ratios. La app usa zonas orientativas y lo marca como no aplicable a bancos y aseguradoras. No expresa una probabilidad exacta de quiebra.'],
  [/liquidez|ratio corriente/i, 'Liquidez corriente', 'Activos corrientes divididos por pasivos corrientes. Compara recursos y pagos de corto plazo; su interpretación depende del sector.'],
  [/balance|activo|pasivo|patrimonio/i, 'Balance', 'Fotografía de recursos y obligaciones en una fecha: activos = pasivos + patrimonio neto. Conviene compararlo entre ejercicios.'],
  [/ventas|ingresos|facturación/i, 'Ingresos o ventas', 'Importe generado por vender bienes o servicios antes de descontar costes. Crecer en ventas no implica necesariamente aumentar beneficios.'],
  [/beneficio neto|margen neto/i, 'Beneficio neto', 'Resultado después de gastos, intereses e impuestos. El margen neto es beneficio neto dividido por ventas.'],
  [/i\+d|investigación y desarrollo/i, 'I+D', 'Gasto en investigación y desarrollo. La intensidad I+D / ventas compara el esfuerzo con los ingresos; más gasto no asegura mejores resultados.'],
  [/rentabilidad total|dividendos reinvertidos/i, 'Rentabilidad total', 'Suma la variación del precio y los dividendos, suponiendo que cada dividendo se reinvierte en la propia acción el día en que deja de dar derecho a cobrarlo. No descuenta impuestos ni comisiones.'],
  [/\breal\b|inflación|poder adquisitivo|ipca?\b/i, 'Rentabilidad real', 'Variación descontada la inflación: (1 + variación nominal) ÷ (1 + inflación del periodo) − 1. Si una acción sube un 50 % y los precios suben un 20 %, la ganancia real es del 25 %.'],
  [/anual compuesta|crecimiento anual compuesto|cagr/i, 'Crecimiento anual compuesto', 'Tasa anual constante que llevaría de un valor inicial a uno final: (final / inicial)^(1 / años) − 1. Es una síntesis, no una predicción.'],
  [/consenso|objetivo|analistas|recomendaci[oó]n media/i, 'Consenso de analistas', 'Resumen de previsiones u opiniones publicadas por analistas. El objetivo mínimo, medio y máximo muestra desacuerdo; ninguno es una garantía.'],
  [/13f|grandes gestores|índice de exposición/i, 'Informes 13F y exposición', 'Los 13F muestran ciertas posiciones largas de gestores estadounidenses con retraso. El índice combina participación estimada y peso en la cartera declarada; no mide convicción ni toda la cartera del grupo.'],
  [/sentimiento|nsi|polarización|noticias/i, 'Sentimiento de noticias', 'La app clasifica titulares con palabras positivas y negativas, pondera las fuentes y calcula un índice de −100 a +100. Es una señal imperfecta: no entiende todos los matices del lenguaje.'],
  [/divergencia|euforia|pánico/i, 'Divergencia conductual', 'Contraste entre percepción en noticias y métricas del negocio. Una discrepancia puede merecer estudio, pero no es automáticamente una oportunidad.'],
  [/openrouter|api key|clave api|modelo de ia|coste estimado/i, 'IA y OpenRouter', 'La clave permite solicitar informes a un modelo externo mediante OpenRouter. La app guarda la clave solo durante esta sesión del navegador; el coste mostrado es estimativo y puede cambiar.'],
  [/conector|latencia|diagnóstico/i, 'Conectores', 'Pruebas de acceso a proveedores de cotizaciones, datos contables, noticias e IA. La latencia es el tiempo de respuesta; una prueba correcta no garantiza disponibilidad continua.'],
  [/n\/d|no disponible/i, 'Dato no disponible', 'La fuente no ha facilitado un valor utilizable o faltan datos para calcularlo. No debe interpretarse como cero.'],
];

function explain(rawPhrase: string, rawContext = ''): Help {
  const phrase = rawPhrase.replace(/\s+/g, ' ').trim();
  if (/\bdcf\b/i.test(phrase)) return { title: 'DCF', explanation: 'Modelo que proyecta cinco años de flujo de caja libre, calcula un valor terminal y trae todo al presente con una tasa de descuento. Después resta la deuda neta y divide entre las acciones.' };
  for (const [pattern, title, explanation] of concepts) {
    if (pattern.test(phrase)) return { title, explanation };
  }
  if (/^(analizar|buscar|generar|regenerar|descargar|imprimir|actualizar|recargar|cambiar|ver|cerrar|guardar|probar|restablecer|consultar|seleccionar)/i.test(phrase)) {
    return { title: phrase, explanation: `Es una acción de la interfaz. Al pulsar «${phrase}», la aplicación ejecuta la operación indicada; comprueba el resultado o mensaje que aparece después.` };
  }
  if (/^[\d.,%€$+−\-×/\s]+$/.test(phrase)) {
    const context = rawContext.replace(/\s+/g, ' ').trim().slice(0, 120);
    return { title: 'Valor mostrado', explanation: `Es el valor de esta variable en el contexto «${context}». Observa su unidad, moneda y periodo; si procede de datos de mercado, puede cambiar al actualizar.` };
  }
  return { title: phrase.slice(0, 100), explanation: `Esta frase describe «${phrase.slice(0, 180)}». Léela junto con el dato, gráfico o control que la rodea. Si es una cifra o una previsión, comprueba su fecha, fuente y unidades antes de sacar una conclusión.` };
}

const selector = 'h1,h2,h3,h4,h5,h6,p,span,div,button,a,label,th,td,li,strong,small';

export default function ContextHelp() {
  const [active, setActive] = useState<Help | null>(null);
  const [svgLabels, setSvgLabels] = useState<SvgLabel[]>([]);

  useEffect(() => {
    const root = document.getElementById('tradingalpha-root');
    if (!root) return;
    let frame = 0;
    const annotate = () => {
      root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (element.closest('[data-context-help-ui]') || element.closest('[data-context-help-exclude]')) return;
        if (element.parentElement?.closest('button,a')) { delete element.dataset.contextHelp; return; }
        if (element.matches('button') && element.querySelector('button')) return;
        const own = Array.from(element.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
        const useful = own.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\s·•→↗✕]/gu, '').trim();
        if (!useful) { delete element.dataset.contextHelp; return; }
        element.dataset.contextHelp = 'true';
        element.dataset.contextPhrase = own;
      });
      const labels = Array.from(root.querySelectorAll<SVGTextElement>('svg text')).map((element, index) => {
        const rect = element.getBoundingClientRect();
        const phrase = (element.textContent || '').trim();
        if (!phrase || rect.width === 0 || rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return null;
        return { key: `${index}-${phrase}`, phrase, x: Math.min(window.innerWidth - 17, rect.right + 2), y: Math.max(0, rect.top + Math.min(2, rect.height / 2)) };
      }).filter((value): value is SvgLabel => value !== null);
      setSvgLabels((previous) => JSON.stringify(previous) === JSON.stringify(labels) ? previous : labels);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(annotate); };
    annotate();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { subtree: true, childList: true, characterData: true });
    const onClick = (event: MouseEvent) => {
      for (const node of event.composedPath()) {
        if (!(node instanceof HTMLElement) || !root.contains(node)) continue;
        if (node.dataset.contextHelp !== 'true') continue;
        const rect = node.getBoundingClientRect();
        if (event.clientX >= rect.right - 26 && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.top + 24) {
          event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
          setActive(explain(node.dataset.contextPhrase || node.textContent || '', node.parentElement?.textContent || ''));
          return;
        }
      }
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setActive(null); };
    root.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); root.removeEventListener('click', onClick, true); window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule); };
  }, []);

  return <>
    <div data-context-help-ui className="context-help-svg-layer">
      {svgLabels.map(label => <button key={label.key} type="button" className="context-help-svg-icon" style={{ left: label.x, top: label.y }} aria-label={`Explicar ${label.phrase}`} onClick={() => setActive(explain(label.phrase, 'Etiqueta de un gráfico'))}>?</button>)}
    </div>
    {active && <div data-context-help-ui className="context-help-backdrop" onMouseDown={() => setActive(null)}>
      <section role="dialog" aria-modal="true" aria-label={`Explicación de ${active.title}`} className="context-help-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <button className="context-help-close" aria-label="Cerrar explicación" onClick={() => setActive(null)}>×</button>
        <div className="context-help-kicker">Explicación contextual</div>
        <h2>{active.title}</h2>
        <p>{active.explanation}</p>
        <p className="context-help-note">Los indicadores orientan el análisis y no garantizan resultados futuros.</p>
      </section>
    </div>}
  </>;
}
