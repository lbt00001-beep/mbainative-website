"use client";

import React, { useState } from 'react';

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  badge: string;
  content: React.ReactNode;
}

export default function HelpGuide() {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sections: HelpSection[] = [
    {
      id: 'intro',
      title: '1. Introducción y Filosofía de TradingAlpha',
      icon: '🏛️',
      badge: 'Básicos',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            Bienvenido a <strong>TradingAlpha</strong>. Esta herramienta nace para resolver un problema fundamental que tienen la mayoría de inversores: <strong>mirar solo una parte de la realidad</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <h5 className="font-bold text-white mb-1">El error del analista técnico puro</h5>
              <p className="text-xs text-slate-400">
                Mira gráficos, líneas y figuras matemáticas, pero olvida si la empresa gana dinero real, si tiene deudas impagables o si sus productos se han quedado obsoletos.
              </p>
            </div>
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <h5 className="font-bold text-white mb-1">El error del analista fundamental puro</h5>
              <p className="text-xs text-slate-400">
                Analiza balances contables impecables, pero ignora el <em>timing</em> del mercado y las corrientes de pánico, comprando acciones que siguen cayendo durante meses.
              </p>
            </div>
          </div>
          <p>
            <strong>TradingAlpha fusiona ambas disciplinas junto con las finanzas conductuales</strong> (la psicología del inversor). Su objetivo es responder a las tres grandes preguntas que todo inversor inteligente debe hacerse:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-2 text-slate-200">
            <li><strong>¿Es un buen negocio?</strong> (Análisis Fundamental & Estados Financieros a 4 años).</li>
            <li><strong>¿Está a un precio razonable o tiene descuento?</strong> (Modelos de Valoración Intrínseca DCF, Peter Lynch y Graham).</li>
            <li><strong>¿Es el momento oportuno para entrar?</strong> (Análisis Técnico de Velas y Termómetro de Sentimiento de Noticias).</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'candles',
      title: '2. Velas Japonesas y Dinámica del Precio',
      icon: '🕯️',
      badge: 'Técnico',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            El gráfico principal de TradingAlpha no utiliza una simple línea continua, sino <strong>velas japonesas</strong> (<em>candlesticks</em>), inventadas en Japón en el siglo XVIII por los comerciantes de arroz para entender la batalla psicológica entre compradores y vendedores.
          </p>

          <div className="bg-[#141d30] p-5 rounded-xl border border-[#223048] space-y-3">
            <h5 className="font-bold text-white text-base">Anatomía de una Vela Japonesa</h5>
            <p className="text-xs text-slate-400">
              Cada vela representa lo que ocurrió en un periodo de tiempo determinado (en nuestra app, 1 día de negociación). Contiene 4 datos vitales:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
              <div className="bg-[#0e1626] p-2.5 rounded-lg border border-[#1e293b]">
                <div className="text-slate-400 text-[10px] font-sans">Open (Apertura)</div>
                <div className="text-white font-bold mt-1">Precio inicial</div>
              </div>
              <div className="bg-[#0e1626] p-2.5 rounded-lg border border-[#1e293b]">
                <div className="text-slate-400 text-[10px] font-sans">Close (Cierre)</div>
                <div className="text-white font-bold mt-1">Precio final</div>
              </div>
              <div className="bg-[#0e1626] p-2.5 rounded-lg border border-[#1e293b]">
                <div className="text-slate-400 text-[10px] font-sans">High (Máximo)</div>
                <div className="text-emerald-400 font-bold mt-1">Pico más alto</div>
              </div>
              <div className="bg-[#0e1626] p-2.5 rounded-lg border border-[#1e293b]">
                <div className="text-slate-400 text-[10px] font-sans">Low (Mínimo)</div>
                <div className="text-rose-400 font-bold mt-1">Valle más bajo</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-lg">
                <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Vela Verde (Alcista)
                </span>
                <p className="text-xs text-slate-300">
                  El precio de cierre fue <strong>superior</strong> al de apertura. Los compradores tuvieron el control durante la sesión y empujaron la cotización hacia arriba.
                </p>
              </div>
              <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-lg">
                <span className="font-bold text-rose-400 text-xs flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> Vela Roja (Bajista)
                </span>
                <p className="text-xs text-slate-300">
                  El precio de cierre fue <strong>inferior</strong> al de apertura. Los vendedores dominaron y forzaron la caída del precio.
                </p>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400">
              <strong>Las Mechas o Sombras (líneas finas arriba y abajo):</strong> Muestran los extremos a los que llegó el precio pero que fueron rechazados por el mercado antes del cierre. Una mecha inferior muy larga indica que los compradores rescataron el precio con fuerza en los mínimos.
            </div>
          </div>

          <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
            <h5 className="font-bold text-white mb-1">¿Qué significa el Volumen?</h5>
            <p className="text-xs text-slate-400">
              Las barras verticales en la parte inferior del gráfico representan el <strong>volumen de acciones negociadas</strong>. El volumen es el &quot;detector de mentiras&quot; del precio: una subida de precio con volumen gigantesco significa que los grandes fondos institucionales están comprando; una subida con volumen raquítico suele ser un movimiento engañoso y frágil.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'indicators',
      title: '3. Medias Móviles, Bandas de Bollinger y Osciladores (RSI/MACD)',
      icon: '📈',
      badge: 'Indicadores',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            Los indicadores técnicos son herramientas matemáticas que limpian el &quot;ruido&quot; del día a día para mostrar la dirección real del mercado. En TradingAlpha dispones de los estándares institucionales más fiables:
          </p>

          <div className="space-y-3">
            {/* Medias Móviles */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-bold text-white">Medias Móviles (SMA 20, 50, 200 y EMA 9)</h5>
                <span className="text-[10px] font-mono text-amber-400 font-bold">Líneas de Tendencia</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Calculan el precio promedio de las últimas N sesiones. Si el precio está por encima de su media, la tendencia es positiva; si está por debajo, negativa.
              </p>
              <ul className="text-xs space-y-1 text-slate-300 pl-2">
                <li>• <strong>SMA 200 (Media de 200 días):</strong> La brújula de largo plazo de Wall Street. Define si una acción está en mercado alcista o bajista estructural.</li>
                <li>• <strong>Cruce Dorado (Golden Cross):</strong> Cuando la media de 50 días cruza hacia arriba a la de 200 días. Señal histórica de inicio de un gran ciclo alcista.</li>
                <li>• <strong>Cruce de la Muerte (Death Cross):</strong> Cuando la media de 50 días cruza hacia abajo a la de 200 días. Alerta de cambio a tendencia bajista profunda.</li>
              </ul>
            </div>

            {/* Bollinger */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-bold text-white">Bandas de Bollinger (20 periodos, 2 desviaciones típicas)</h5>
                <span className="text-[10px] font-mono text-purple-400 font-bold">Volatilidad</span>
              </div>
              <p className="text-xs text-slate-400">
                Creadas por John Bollinger, forman un canal dinámico alrededor del precio. El 95% del tiempo el precio se mueve dentro de estas bandas. Cuando las bandas se estrechan mucho (<em>Squeeze</em>), indican que la volatilidad está comprimida como un muelle y se avecina una explosión violenta del precio en una dirección.
              </p>
            </div>

            {/* RSI */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-bold text-white">RSI (Índice de Fuerza Relativa, 14 periodos)</h5>
                <span className="text-[10px] font-mono text-purple-300 font-bold">Oscilador 0 - 100</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Mide la velocidad y magnitud de los movimientos recientes de precio. Como un velocímetro:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0e1626] p-2 rounded border border-rose-500/30 text-rose-300">
                  <strong>RSI &gt; 70 (Sobrecompra):</strong> El precio ha subido demasiado rápido y sin descanso. Riesgo inminente de agotamiento o toma de beneficios.
                </div>
                <div className="bg-[#0e1626] p-2 rounded border border-emerald-500/30 text-emerald-300">
                  <strong>RSI &lt; 30 (Sobreventa):</strong> El pánico ha hundido el precio en exceso. Posible oportunidad de rebote técnico inminente.
                </div>
              </div>
            </div>

            {/* MACD */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-bold text-white">MACD (Convergencia/Divergencia de Medias Móviles)</h5>
                <span className="text-[10px] font-mono text-blue-400 font-bold">Momentum</span>
              </div>
              <p className="text-xs text-slate-400">
                Compara una media rápida (12 sesiones) con una lenta (26 sesiones). Cuando la línea MACD cruza hacia arriba a su línea de señal (Signal 9) y el histograma se vuelve verde positivo, indica que la fuerza compradora se está acelerando.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'snowflake',
      title: '4. El Radar Pentagonal (La Huella Dactilar del Activo)',
      icon: '❄️',
      badge: 'Radar Pentagonal',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            El <strong>Radar Pentagonal</strong> es una metodología cuantitativa que sintetiza en un solo golpe de vista la salud general de una empresa a través de 5 dimensiones puntuadas de 0 a 100:
          </p>

          <div className="space-y-2 text-xs">
            <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048]">
              <strong className="text-blue-400">1. Valoración (Value):</strong> ¿Está la acción barata respecto a lo que produce? Examina si el PER, el ratio Precio/Ventas y el modelo DCF ofrecen un precio ventajoso frente a su sector.
            </div>
            <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048]">
              <strong className="text-emerald-400">2. Crecimiento (Growth):</strong> ¿A qué ritmo crecen sus ventas y beneficios? Si una empresa no crece año tras año, tarde o temprano perderá cuota de mercado.
            </div>
            <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048]">
              <strong className="text-cyan-400">3. Rentabilidad y Eficiencia (Performance):</strong> Mide la calidad del motor del negocio: márgenes netos elevados y un alto retorno sobre el capital empleado (ROE &gt; 15%).
            </div>
            <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048]">
              <strong className="text-amber-400">4. Salud Financiera (Health):</strong> ¿Tiene la empresa demasiada deuda? Compara el efectivo en caja, la deuda a corto y largo plazo y la capacidad de pagar intereses sin asfixiarse.
            </div>
            <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048]">
              <strong className="text-purple-400">5. Momentum Técnico:</strong> La fuerza de la cotización actual en el gráfico (posición sobre medias móviles y comportamiento del RSI).
            </div>
          </div>

          <div className="bg-[#111928] p-4 rounded-xl border border-[#1e293b]">
            <h5 className="font-bold text-white mb-1">Puntuación Alpha Global (0 a 100)</h5>
            <p className="text-xs text-slate-400">
              Es la media ponderada institucional de los 5 ejes. Una puntuación superior a <strong>66/100</strong> califica como <em>Compra Atractiva</em> o <em>Fuerte Compra</em>, mientras que valores inferiores a <strong>45/100</strong> alertan de sobrevaloración o debilidad estructural.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'valuation',
      title: '5. Modelos de Valoración: DCF, Margen de Seguridad, Lynch y Graham',
      icon: '💎',
      badge: 'Valoración',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <div className="bg-blue-950/20 border border-blue-500/30 p-3.5 rounded-xl text-blue-200 text-xs">
            <em>&quot;El precio es lo que pagas; el valor es lo que recibes.&quot;</em> — Warren Buffett.
          </div>

          <p>
            Que una acción cueste 20$ o 500$ no dice nada sobre si está cara o barata. Para saberlo, necesitamos estimar su <strong>Valor Intrínseco</strong> (el valor real que justifica la empresa por su capacidad de generar dinero).
          </p>

          <div className="space-y-3">
            {/* DCF */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <h5 className="font-bold text-white mb-1">El Modelo DCF (Descuento de Flujos de Caja)</h5>
              <p className="text-xs text-slate-400 mb-2">
                Es el estándar más riguroso de la banca de inversión. Se basa en una verdad irrefutable: <em>una empresa vale todo el dinero líquido que será capaz de generar en el futuro, traído a valor presente</em>.
              </p>
              <div className="space-y-1.5 text-xs text-slate-300 pl-2">
                <li>• <strong>Free Cash Flow (FCF):</strong> El dinero real sobrante en la caja tras pagar todos los sueldos, materias primas e inversiones en maquinaria.</li>
                <li>• <strong>Tasa de Descuento (WACC):</strong> Como 100$ de dentro de 5 años valen menos que 100$ hoy (por la inflación y el riesgo), descontamos los flujos futuros con esta tasa (típicamente entre el 8% y el 10%).</li>
                <li>• <strong>Margen de Seguridad (%):</strong> Si el valor intrínseco calculado es de 100$ y la acción cotiza a 75$, tienes un <strong>25% de margen de seguridad</strong>. Es tu escudo protector contra errores de cálculo o imprevistos del mercado.</li>
              </div>
            </div>

            {/* Peter Lynch */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <h5 className="font-bold text-white mb-1">La Línea de Valor Razonable de Peter Lynch</h5>
              <p className="text-xs text-slate-400">
                Peter Lynch, el legendario gestor del fondo Magellan de Fidelity, popularizó la regla de que el ratio PER (Precio / Beneficio) de una empresa bien gestionada debería ser equivalente a su tasa de crecimiento sostenible. Si una empresa con beneficios creciendo al 20% anual cotiza a un PER de 12, está infravalorada.
              </p>
            </div>

            {/* Benjamin Graham */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <h5 className="font-bold text-white mb-1">El Número de Benjamin Graham</h5>
              <p className="text-xs text-slate-400">
                El padre de la inversión en valor diseñó una fórmula estricta para empresas industriales y tradicionales: √(22.5 × Beneficio por Acción × Valor Contable por Acción). Actúa como un &quot;suelo de hierro&quot; basado en activos tangibles.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'fundamentals',
      title: '6. Radiografía Contable: DuPont, Piotroski F-Score y Altman Z',
      icon: '📑',
      badge: 'Solvencia & Calidad',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            Los estados financieros son la autopsia contable de la empresa. TradingAlpha incluye tres herramientas académicas de primer nivel:
          </p>

          <div className="space-y-3">
            {/* DuPont */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-bold text-white">Descomposición DuPont del ROE (3 Fases)</h5>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Rentabilidad Real</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                El ROE (Rentabilidad sobre el Patrimonio Neto) mide cuántos euros gana la empresa por cada 100€ que ponen los accionistas. Pero un ROE del 20% puede ser un espejismo peligroso. DuPont lo divide en sus 3 factores multiplicadores:
              </p>
              <div className="p-2.5 bg-[#0e1626] rounded-lg font-mono text-xs text-slate-200 text-center mb-2">
                ROE = Margen Neto (Rentabilidad) × Rotación de Activos (Eficiencia) × Multiplicador de Capital (Apalancamiento)
              </div>
              <p className="text-xs text-slate-400">
                Si una empresa tiene un ROE muy alto solo porque tiene una deuda desorbitada (multiplicador de capital &gt; 5x), es una trampa. Lo deseable es un ROE impulsado por altos márgenes netos o gran rotación.
              </p>
            </div>

            {/* Piotroski */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-bold text-white">Piotroski F-Score (0 a 9 Puntos)</h5>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Auditoría Contable</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                El profesor Joseph Piotroski (Universidad de Chicago) diseñó 9 pruebas estrictas de aprobado/suspenso (1 punto cada una):
              </p>
              <ul className="text-xs space-y-1 text-slate-300 pl-2">
                <li>• <strong>Rentabilidad (4 pts):</strong> Beneficio neto positivo, flujo operativo positivo, aumento del ROA y flujo de caja superior al beneficio contable.</li>
                <li>• <strong>Apalancamiento y Liquidez (3 pts):</strong> Deuda a largo plazo reducida, liquidez corriente mejorada y sin dilución de acciones por ampliaciones de capital.</li>
                <li>• <strong>Eficiencia Operativa (2 pts):</strong> Expansión del margen bruto y mayor rotación de inventarios/activos.</li>
              </ul>
              <div className="text-xs text-slate-400 pt-1">
                Puntuaciones de <strong>8 o 9</strong> corresponden a compañías con una salud financiera élite. Menos de <strong>4</strong> alerta de problemas serios.
              </div>
            </div>

            {/* Altman Z */}
            <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048]">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-bold text-white">Altman Z-Score (Detector de Quiebra)</h5>
                <span className="text-[10px] font-mono text-amber-400 font-bold">Solvencia</span>
              </div>
              <p className="text-xs text-slate-400">
                Desarrollado por Edward Altman en 1968, combina 5 ratios financieros para predecir si una empresa entrará en suspensión de pagos en los próximos dos años:
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs font-mono">
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-2 rounded text-emerald-400">
                  <strong>Z &gt; 2.99</strong><br /><span className="text-[10px] font-sans">Zona Segura</span>
                </div>
                <div className="bg-amber-950/20 border border-amber-500/30 p-2 rounded text-amber-400">
                  <strong>1.81 a 2.99</strong><br /><span className="text-[10px] font-sans">Zona Gris</span>
                </div>
                <div className="bg-rose-950/20 border border-rose-500/30 p-2 rounded text-rose-400">
                  <strong>Z &lt; 1.81</strong><br /><span className="text-[10px] font-sans">Zona de Peligro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sentiment',
      title: '7. Psicología de Masas, Noticias y Finanzas Conductuales',
      icon: '🧠',
      badge: 'Sentimiento',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            En el corto plazo, el mercado de valores no es una báscula precisa que pesa el valor de las empresas, sino una <strong>máquina de votación emocional</strong>. El precio se mueve por la codicia, el pánico y los titulares sensacionalistas.
          </p>

          <div className="bg-[#141d30] p-5 rounded-xl border border-[#223048] space-y-3">
            <h5 className="font-bold text-white">El Índice de Sentimiento Neto (NSI: -100 a +100)</h5>
            <p className="text-xs text-slate-400">
              TradingAlpha escanea en tiempo real las noticias publicadas sobre la empresa y analiza el tono lingüístico mediante algoritmos de valencia emocional:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="bg-rose-950/20 p-2.5 rounded-lg border border-rose-500/30 text-rose-400">
                <strong>-100 a -30</strong><br /><span className="text-[10px] font-sans">Pánico / Miedo</span>
              </div>
              <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-600 text-slate-300">
                <strong>-29 a +29</strong><br /><span className="text-[10px] font-sans">Neutro / Mixto</span>
              </div>
              <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/30 text-emerald-400">
                <strong>+30 a +100</strong><br /><span className="text-[10px] font-sans">Optimismo / Euforia</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <h5 className="font-bold text-white text-sm">Divergencia Conductual: Las Dos Grandes Trampas del Inversor</h5>

            <div className="bg-gradient-to-r from-amber-950/30 to-[#141d30] p-4 rounded-xl border border-amber-500/30 space-y-1">
              <span className="font-bold text-amber-300 text-xs uppercase tracking-wide">
                1. La Trampa de Euforia / FOMO (Miedo a quedarse fuera)
              </span>
              <p className="text-xs text-slate-300">
                Ocurre cuando todo el mundo habla de una acción en redes sociales y la prensa titula con entusiasmo desmedido (NSI muy alto), pero el modelo DCF demuestra que la acción cotiza con una prima absurda sobre sus beneficios reales. Comprar ahí suele significar comprar en el máximo antes del desplome.
              </p>
            </div>

            <div className="bg-gradient-to-r from-emerald-950/30 to-[#141d30] p-4 rounded-xl border border-emerald-500/30 space-y-1">
              <span className="font-bold text-emerald-300 text-xs uppercase tracking-wide">
                2. La Oportunidad Contraria por Pánico Desmedido
              </span>
              <p className="text-xs text-slate-300">
                Ocurre cuando una noticia puntual o un mal titular desata una oleada de ventas histérica en los medios (NSI muy negativo), pero los fundamentales de la empresa, su caja libre y su solvencia siguen intactos con un gran margen de seguridad. Históricamente, estos son los mejores momentos de compra para el inversor paciente.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ai',
      title: '8. Generación de Informes con Inteligencia Artificial',
      icon: '🤖',
      badge: 'IA Research',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            La pestaña <strong>🤖 Informe Research con IA</strong> conecta con el modelo <strong>Google Gemini 3.5 Flash Lite</strong> a través de OpenRouter para actuar como un analista financiero jefe institucional.
          </p>

          <div className="bg-[#141d30] p-4 rounded-xl border border-[#223048] space-y-2">
            <h5 className="font-bold text-white text-sm">¿Cómo razona la Inteligencia Artificial?</h5>
            <p className="text-xs text-slate-400">
              En lugar de inventar previsiones al azar, la IA recibe una matriz cuantitativa estricta con todos los datos que has visto en la app:
            </p>
            <ul className="text-xs space-y-1 text-slate-300 pl-2">
              <li>• Cotización actual, PER, BPA y posición en el rango de 52 semanas.</li>
              <li>• Valor intrínseco DCF y porcentaje de margen de seguridad.</li>
              <li>• Puntuación de calidad Piotroski (0-9) y zona de solvencia Altman Z.</li>
              <li>• Lectura técnica del RSI, MACD y medias móviles.</li>
              <li>• Índice de sentimiento neto (NSI) y titulares más recientes.</li>
            </ul>
          </div>

          <p className="text-xs text-slate-400">
            Con esa información, genera un memorándum de inversión estructurado en 6 secciones (Veredicto, Tesis Alcista, Tesis Bajista/Riesgos, Diagnóstico Técnico, Psicología Conductual y Perfil de Inversor Recomendado) que puedes <strong>imprimir o guardar en PDF</strong> en un clic.
          </p>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.badge.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  const activeContent = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <span>📚 Centro de Aprendizaje & Manual Didáctico</span>
            <span>•</span>
            <span className="text-slate-400">Nivel Bachillerato / Didáctico</span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🎓</span> Guía Completa de TradingAlpha: Conceptos, Modelos y Uso
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Explicación ordenada y accesible de todos los principios financieros: velas japonesas, medias móviles, valoración intrínseca DCF, salud contable y psicología de masas.
          </p>
        </div>

        {/* Quick Search inside Guide */}
        <div className="w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar concepto (ej. DCF, RSI, velas)..."
            className="w-full bg-[#141d30] text-xs text-white placeholder-slate-500 px-3.5 py-2 rounded-xl border border-[#223048] focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Table of Contents */}
        <div className="lg:col-span-4 space-y-1.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Índice de Temas ({filteredSections.length})
          </div>
          {filteredSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                activeSection === sec.id
                  ? 'bg-blue-600/20 text-white border-blue-500/50 shadow-md'
                  : 'bg-[#141d30] text-slate-400 border-[#223048] hover:text-white hover:bg-[#1a253c]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg shrink-0">{sec.icon}</span>
                <span className="text-xs font-semibold truncate">{sec.title}</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                  activeSection === sec.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1e293b] text-slate-400'
                }`}
              >
                {sec.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Right Column: Detailed Topic Content Card */}
        <div className="lg:col-span-8 bg-[#111928] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 bg-[#162032] rounded-xl border border-[#27354f]">
                {activeContent.icon}
              </span>
              <div>
                <h3 className="text-base font-bold text-white">{activeContent.title}</h3>
                <span className="text-[10px] text-blue-400 font-semibold uppercase">
                  Módulo Didáctico TradingAlpha
                </span>
              </div>
            </div>
            <span className="text-xs font-bold bg-[#162032] text-slate-300 border border-[#27354f] px-2.5 py-1 rounded-lg">
              {activeContent.badge}
            </span>
          </div>

          <div className="py-1">
            {activeContent.content}
          </div>
        </div>
      </div>
    </div>
  );
}
