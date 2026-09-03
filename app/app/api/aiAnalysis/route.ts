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
Presta especial atención al contraste entre la realidad contable/intrínseca de la empresa y la psicología del mercado.

REGLAS ABSOLUTAS E INELUDIBLES:
1. IDIOMA: Redacta el 100% del informe en ESPAÑOL DE ESPAÑA (Castellano peninsular). Queda ESTRICTAMENTE PROHIBIDO el uso del inglés, chino o cualquier otro idioma.
2. SIN BORRADORES NI PENSAMIENTO EN INGLÉS: NO incluyas notas de razonamiento ("Let me analyze...", "Key data points...", "Let me draft...", "Paragraph 1:").
3. INICIO INMEDIATO: Comienza DIRECTAMENTE tu respuesta con la primera cabecera:
### 1. Veredicto Estratégico Ejecutivo
4. Toda la narrativa, análisis, argumentos alcistas/bajistas y conclusiones deben ser en prosa fluida y profesional en español de España.`;

    const userPrompt = `Analiza la empresa ${companyName || ticker} (${ticker}), sector: ${sector || 'General'}.
Datos de Mercado y Métricas Cuantitativas actuales:
- Precio actual: ${price} ${currency} | Capitalización: ${marketCap}
- Puntuación Alpha Global: ${alphaScore}/100 (Salud Fundamental: ${fundamentalScore}/100, Momentum Técnico: ${technicalScore}/100)
- Auditoría Piotroski F-Score: ${piotroski ?? 'N/D'}/9 | Riesgo de Quiebra Altman Z-Score: ${altmanZ ?? 'N/D'}
- Valoración Intrínseca DCF: ${dcfFairValue ? `${dcfFairValue} ${currency}` : 'N/D'} (Margen de Seguridad: ${marginOfSafety ? `${marginOfSafety}%` : 'N/D'})
- Múltiplos de Valoración: PER ${pe ?? 'N/D'} | PER Futuro ${fwdPe ?? 'N/D'} | Rendimiento FCF ${fcfYield ?? 'N/D'}%
- Rentabilidad y Calidad Contable: Margen Neto ${netMargin ?? 'N/D'}% | ROE ${roe ?? 'N/D'}% | Deuda sobre Fondos Propios ${debtToEquity ?? 'N/D'}
- Situación Técnica y Momentum: RSI(14) ${rsi ?? 'N/D'} | Señal MACD: ${macdSignal ?? 'N/D'} | Tendencia de Medias Móviles: ${trend50_200 ?? 'N/D'}
- Sentimiento de Mercado y Prensa:
  * Índice de Sentimiento Neto (NSI): ${nsi ?? '0'} (${sentimentLabel ?? 'Neutral'})
  * Titulares recientes (traducir y contextualizar al español): ${topHeadlines || 'Sin titulares destacados'}

IMPORTANTE: Escribe el 100% de tu respuesta en ESPAÑOL DE ESPAÑA sin preámbulos. Estructura tu respuesta exactamente con estas 6 secciones en formato Markdown:

### 1. Veredicto Estratégico Ejecutivo
(Dictamen conciso de 2-3 párrafos resumiendo el equilibrio entre valoración, calidad del negocio y oportunidad técnica).

### 2. Tesis Alcista (Factores a Favor)
(3-4 argumentos sólidos en español de por qué el activo puede revalorizarse y batir al mercado).

### 3. Tesis Bajista y Principales Riesgos
(3-4 riesgos fundamentales, contables, de valoración, regulatorios o macroeconómicos).

### 4. Diagnóstico Técnico y Momento de Entrada
(Lectura de la acción del precio, niveles de soporte/resistencia, fuerza del RSI/MACD y momento adecuado para operar).

### 5. Psicología del Mercado y Finanzas Conductuales
(Evaluación de si existe trampa de euforia/FOMO minorista o una oportunidad de compra por sobrerreacción o pánico excesivo en las noticias).

### 6. Conclusión y Perfil de Inversor Idóneo
(Perfil sugerido: Inversión en Valor / Crecimiento / Dividendos / Seguimiento de Tendencia / No apto en este momento).`;

    // Configuración del cuerpo de petición para OpenRouter
    const requestBody: any = {
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    };

    // Para modelos de razonamiento (GLM 5.3 Flash, DeepSeek), fijar esfuerzo bajo y excluir tokens de pensamiento
    if (selectedModel.includes('glm') || selectedModel.includes('deepseek') || selectedModel.includes('r1')) {
      requestBody.reasoning = {
        effort: "low",
        exclude: true,
      };
    }

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mbainative.com",
        "X-Title": "TradingAlpha Inversiones",
      },
      body: JSON.stringify(requestBody),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      return new Response(JSON.stringify({ error: `OpenRouter error (${openRouterRes.status}): ${errText}` }), {
        status: openRouterRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const aiData = await openRouterRes.json();
    const choice = aiData?.choices?.[0];
    const msg = choice?.message;

    let content = msg?.content || "";

    // 1. Limpiar cualquier etiqueta de pensamiento <think>...</think>
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // 2. Si el modelo incluyó un preludio o borrador en inglés antes del informe, recortar hasta la primera sección
    const sectionIndex = content.indexOf("### 1.");
    if (sectionIndex !== -1 && sectionIndex > 0) {
      content = content.slice(sectionIndex).trim();
    }

    // 3. Si por limitación de tokens content quedó vacío, advertir amigablemente sin filtrar nunca el scratchpad en inglés
    if (!content) {
      if (choice?.finish_reason === 'length') {
        content = "El modelo agotó el límite de procesamiento antes de completar la redacción en español. Por favor, pulsa 'Regenerar Informe' o selecciona Gemini 3.5 Flash Lite en Ajustes (⚙️).";
      } else {
        content = "No se pudo generar la redacción en español. Por favor, reintenta la generación.";
      }
    }

    return new Response(JSON.stringify({ report: content }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "Error al generar análisis con IA" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
