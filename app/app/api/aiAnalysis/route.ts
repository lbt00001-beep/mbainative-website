import { type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = (body.userApiKey && body.userApiKey.trim())
      ? body.userApiKey.trim()
      : process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "No se ha configurado ninguna clave de OpenRouter. Por favor, introduce tu API Key en el panel de Ajustes (⚙️) o define la variable OPENROUTER_API_KEY.",
        code: "MISSING_OPENROUTER_KEY",
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const selectedModel = body.model || "google/gemini-3.5-flash-lite";

    const {
      ticker,
      companyName,
      sector,
      price,
      currency = 'USD',
      marketCap,
      alphaScore,
      fundamentalScore,
      technicalScore,
      piotroski,
      altmanZ,
      dcfFairValue,
      marginOfSafety,
      rsi,
      macdSignal,
      trend50_200,
      pe,
      fwdPe,
      fcfYield,
      netMargin,
      roe,
      debtToEquity,
      nsi,
      sentimentLabel,
      topHeadlines,
    } = body;

    if (!ticker) {
      return new Response(JSON.stringify({ error: "Ticker requerido" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `Eres un Analista Financiero Senior Jefe de Estrategia de Inversión y Equity Research en una gestora institucional internacional de primer nivel.
Tu misión es redactar una Tesis de Inversión y un Resumen Ejecutivo riguroso, objetivo y de alto valor sobre el activo analizado.
Debes basarte estrictamente en los datos cuantitativos, técnicos y de sentimiento proporcionados por el sistema, sin inventar datos no verificables.
Presta especial atención al contraste entre la realidad contable/intrínseca de la empresa y la psicología del mercado (noticias virales, euforia minorista o pánico irracional).
Usa un tono profesional, directo, analítico y en español de España.`;

    const userPrompt = `Analiza la empresa ${companyName || ticker} (${ticker}), sector: ${sector || 'General'}.
Datos de Mercado y Métricas Cuantitativas actuales:
- Precio actual: ${price} ${currency} | Capitalización: ${marketCap}
- Puntuación Alpha Global: ${alphaScore}/100 (Salud Fundamental: ${fundamentalScore}/100, Momentum Técnico: ${technicalScore}/100)
- Piotroski F-Score: ${piotroski ?? 'N/D'}/9 | Altman Z-Score: ${altmanZ ?? 'N/D'}
- Valoración Intrínseca DCF: ${dcfFairValue ? `${dcfFairValue} ${currency}` : 'N/D'} (Margen de Seguridad: ${marginOfSafety ? `${marginOfSafety}%` : 'N/D'})
- Múltiplos: PER ${pe ?? 'N/D'} | Forward PER ${fwdPe ?? 'N/D'} | FCF Yield ${fcfYield ?? 'N/D'}%
- Rentabilidad & Calidad: Margen Neto ${netMargin ?? 'N/D'}% | ROE ${roe ?? 'N/D'}% | D/E ${debtToEquity ?? 'N/D'}
- Situación Técnica: RSI(14) ${rsi ?? 'N/D'} | Señal MACD: ${macdSignal ?? 'N/D'} | Tendencia Medias (50 vs 200): ${trend50_200 ?? 'N/D'}
- Sentimiento y Psicología de Masas:
  * Índice de Sentimiento Neto (NSI): ${nsi ?? '0'} (${sentimentLabel ?? 'Neutral'}) en escala [-100 Pánico a +100 Euforia]
  * Titulares recientes en medios financieros y redes: ${topHeadlines || 'Sin titulares destacados'}

Estructura tu respuesta exactamente con estas secciones en formato Markdown:
### 1. Veredicto Estratégico Ejecutivo
(Dictamen conciso de 2-3 párrafos resumiendo el equilibrio entre valoración, calidad del negocio y timing técnico).

### 2. Tesis Alcista (Bull Case)
(3-4 argumentos sólidos de por qué el activo puede generar alfa o revalorizarse).

### 3. Tesis Bajista & Principales Riesgos (Bear Case)
(3-4 riesgos fundamentales, de valoración, regulatorios o de ciclo de mercado).

### 4. Diagnóstico Técnico & Timing de Entrada
(Lectura de la acción del precio, momentum RSI/MACD y niveles clave a vigilar).

### 5. Psicología del Mercado y Sesgo Mediático (Behavioral Finance)
(Diagnóstico de si existe trampa de euforia/FOMO minorista o una oportunidad contraria por pánico desmedido en las noticias).

### 6. Conclusión y Perfil de Inversor Idóneo
(Perfil recomendado: Value / Growth / Dividendos / Momentum / No apto en este momento).`;

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mbainative.com",
        "X-Title": "TradingAlpha Inversiones",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      return new Response(JSON.stringify({ error: `OpenRouter error (${openRouterRes.status}): ${errText}` }), {
        status: openRouterRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const aiData = await openRouterRes.json();
    const msg = aiData?.choices?.[0]?.message;
    const reportMarkdown = (msg?.content && msg.content.trim())
      ? msg.content
      : (msg?.reasoning && msg.reasoning.trim())
      ? msg.reasoning
      : "No se pudo generar el informe.";

    return new Response(JSON.stringify({ report: reportMarkdown }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "Error al generar análisis con IA" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
