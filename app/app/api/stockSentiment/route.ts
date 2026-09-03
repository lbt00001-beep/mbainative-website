import { type NextRequest } from 'next/server';

// ============================================================================
// TRADINGALPHA — MOTOR DE SENTIMIENTO FINANCIERO & PULSO DE NOTICIAS
// Inspirado en la arquitectura científica de OpinionPulse & Behavioral Finance
// ============================================================================

interface SentimentArticle {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  sourceType: 'professional' | 'reputable_media' | 'crowd_social';
  authorityScore: number;
  sentimentLabel: 'Positivo' | 'Neutral' | 'Negativo';
  sentimentScore: number; // -1.0 a +1.0
  keyThemes: string[];
}

// Lexicón financiero bilingüe (Español / Inglés) con pesos de valencia
const BULLISH_KEYWORDS: Record<string, number> = {
  // Español
  "sube": 0.5, "alza": 0.6, "maximos": 0.8, "record": 0.8, "ganancias": 0.6,
  "beneficio": 0.6, "supera": 0.8, "crecimiento": 0.7, "dispara": 0.9,
  "fuerte demanda": 0.8, "recomienda comprar": 0.9, "mejora precio objetivo": 0.9,
  "eleva precio objetivo": 0.9, "dividendo": 0.5, "recompra": 0.6, "expansion": 0.6,
  "acuerdo": 0.6, "impulso": 0.6, "rentabilidad": 0.6, "solidez": 0.6, "lider": 0.6,
  "optimismo": 0.7, "alcista": 0.8, "oportunidad": 0.6, "rebote": 0.6,
  // English
  "surges": 0.9, "jumps": 0.8, "rallies": 0.9, "gains": 0.6, "beats": 0.8,
  "outperforms": 0.8, "record high": 0.9, "growth": 0.6, "strong buy": 0.9,
  "upgrade": 0.9, "raises target": 0.9, "bullish": 0.8, "profit": 0.6,
  "revenue beat": 0.9, "dividend hike": 0.7, "buyback": 0.6, "breakout": 0.8,
  "innovation": 0.6, "soars": 0.9, "upside": 0.7, "cheap": 0.5, "value": 0.5
};

const BEARISH_KEYWORDS: Record<string, number> = {
  // Español
  "cae": -0.6, "baja": -0.5, "desplome": -0.9, "hunde": -0.9, "perdidas": -0.7,
  "decepciona": -0.8, "falla": -0.7, "recorta estimaciones": -0.9, "rebaja": -0.8,
  "vender": -0.8, "demanda": -0.7, "investigacion": -0.7,
  "multa": -0.7, "fraude": -1.0, "quiebra": -1.0, "riesgo": -0.6, "deuda": -0.5,
  "freno": -0.6, "aranceles": -0.6, "crisis": -0.8, "alerta": -0.7, "bajista": -0.8,
  "pesimismo": -0.7, "panico": -0.9, "presion": -0.6, "litigio": -0.7,
  // English
  "plunges": -0.9, "slumps": -0.8, "tumbles": -0.9, "drops": -0.6, "falls": -0.5,
  "misses": -0.8, "downgrade": -0.9, "cuts target": -0.9, "sell-off": -0.8,
  "bearish": -0.8, "losses": -0.7, "warning": -0.8, "lawsuit": -0.7, "sec probe": -0.9,
  "fine": -0.7, "bankruptcy": -1.0, "layoffs": -0.6, "recession": -0.8, "crash": -0.9,
  "debt burden": -0.7, "fear": -0.8, "panic": -0.9, "sell": -0.7
};

const INTENSIFIERS: Record<string, number> = {
  "muy": 1.4, "extremadamente": 1.7, "totalmente": 1.5, "brutalmente": 1.6,
  "mas": 1.2, "fuerte": 1.3, "significativo": 1.3, "historico": 1.4,
  "very": 1.4, "extremely": 1.7, "massively": 1.6, "sharply": 1.4, "huge": 1.4
};

const PROFESSIONAL_PUBLISHERS = new Set([
  "bloomberg", "reuters", "the wall street journal", "wsj", "financial times",
  "cnbc", "barron's", "barrons", "marketwatch", "morningstar", "investor's business daily",
  "forbes", "seeking alpha", "expansion", "cinco dias", "el economista", "bolsamania"
]);

function scoreHeadline(title: string): { score: number; label: 'Positivo' | 'Neutral' | 'Negativo'; matched: string[] } {
  const norm = title.toLowerCase().replace(/[^a-záéíóúüñ0-9\s]/gi, ' ');
  const words = norm.split(/\s+/).filter(Boolean);
  let totalScore = 0;
  let matches: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prev = i > 0 ? words[i - 1] : "";
    let mult = 1.0;
    if (prev in INTENSIFIERS) mult = INTENSIFIERS[prev];

    // Check negation
    const isNegated = prev === "no" || prev === "not" || prev === "sin" || prev === "without";

    if (word in BULLISH_KEYWORDS) {
      const val = (BULLISH_KEYWORDS[word] * mult) * (isNegated ? -0.8 : 1.0);
      totalScore += val;
      matches.push(word);
    } else if (word in BEARISH_KEYWORDS) {
      const val = (BEARISH_KEYWORDS[word] * mult) * (isNegated ? -0.5 : 1.0);
      totalScore += val;
      matches.push(word);
    }
  }

  // Clamping to [-1.0, 1.0]
  const clamped = Math.max(-1.0, Math.min(1.0, Number(totalScore.toFixed(2))));
  let label: 'Positivo' | 'Neutral' | 'Negativo' = 'Neutral';
  if (clamped >= 0.20) label = 'Positivo';
  else if (clamped <= -0.20) label = 'Negativo';

  return { score: clamped, label, matched: matches };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = (searchParams.get('t') || '').trim().toUpperCase();
    const company = (searchParams.get('company') || ticker).trim();

    if (!ticker) {
      return new Response(JSON.stringify({ error: "Ticker requerido" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    const articles: SentimentArticle[] = [];
    const seenTitles = new Set<string>();

    // 1. Yahoo Finance Search News API
    try {
      const yUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=15`;
      const yRes = await fetch(yUrl, {
        headers: { 'User-Agent': UA },
        next: { revalidate: 300 },
      });
      if (yRes.ok) {
        const yJson = await yRes.json();
        for (const item of (yJson.news || [])) {
          const t = item.title?.trim();
          if (!t || seenTitles.has(t.toLowerCase())) continue;
          seenTitles.add(t.toLowerCase());

          const pub = (item.publisher || 'Yahoo Finance').trim();
          const isProf = PROFESSIONAL_PUBLISHERS.has(pub.toLowerCase());
          const { score, label, matched } = scoreHeadline(t);

          articles.push({
            id: item.uuid || `yh_${Math.random()}`,
            title: t,
            publisher: pub,
            link: item.link || `https://finance.yahoo.com/quote/${ticker}`,
            publishedAt: item.providerPublishTime
              ? new Date(item.providerPublishTime * 1000).toISOString()
              : new Date().toISOString(),
            sourceType: isProf ? 'professional' : 'reputable_media',
            authorityScore: isProf ? 85 : 60,
            sentimentLabel: label,
            sentimentScore: score,
            keyThemes: matched,
          });
        }
      }
    } catch (e) {
      console.warn('Yahoo News fetch failed:', e);
    }

    // 2. Google News RSS (Spanish + Global Financial query)
    try {
      const query = `${ticker} ${company} (acciones OR bolsa OR stock)`;
      const gUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es&gl=ES&ceid=ES:es`;
      const gRes = await fetch(gUrl, {
        headers: { 'User-Agent': UA },
        next: { revalidate: 300 },
      });
      if (gRes.ok) {
        const xml = await gRes.text();
        const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<source[^>]*>(.*?)<\/source>[\s\S]*?<\/item>/g)];

        for (const match of items.slice(0, 15)) {
          let title = match[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          const link = match[2]?.trim();
          const pubDate = match[3]?.trim();
          const publisher = (match[4] || 'Google News').trim();

          // Clean title if ends with " - Source"
          const cleanTitle = title.replace(/\s*-\s*[^-]+$/, '').trim();
          if (!cleanTitle || seenTitles.has(cleanTitle.toLowerCase())) continue;
          seenTitles.add(cleanTitle.toLowerCase());

          const isProf = PROFESSIONAL_PUBLISHERS.has(publisher.toLowerCase());
          const { score, label, matched } = scoreHeadline(cleanTitle);

          articles.push({
            id: `gn_${Math.random().toString(36).substring(2, 9)}`,
            title: cleanTitle,
            publisher,
            link,
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            sourceType: isProf ? 'professional' : 'reputable_media',
            authorityScore: isProf ? 85 : 55,
            sentimentLabel: label,
            sentimentScore: score,
            keyThemes: matched,
          });
        }
      }
    } catch (e) {
      console.warn('Google News fetch failed:', e);
    }

    // Sort by date desc
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // 3. Compute Net Sentiment Index (NSI) & Distribution
    const totalCount = articles.length;
    let posCount = 0;
    let neuCount = 0;
    let negCount = 0;
    let weightedSum = 0;
    let weightSum = 0;

    for (const art of articles) {
      if (art.sentimentLabel === 'Positivo') posCount++;
      else if (art.sentimentLabel === 'Negativo') negCount++;
      else neuCount++;

      const weight = art.authorityScore / 100;
      weightedSum += art.sentimentScore * weight;
      weightSum += weight;
    }

    const nsi = weightSum > 0 ? Math.round((weightedSum / weightSum) * 100) : 0;

    const posPct = totalCount > 0 ? Math.round((posCount / totalCount) * 100) : 33;
    const neuPct = totalCount > 0 ? Math.round((neuCount / totalCount) * 100) : 34;
    const negPct = totalCount > 0 ? Math.round((negCount / totalCount) * 100) : 33;

    // Polarization Index (bimodal tension: high when both pos and neg are large)
    const polarization = Math.round(Math.min(posPct, negPct) * 2);

    let nsiLabel: 'Euforia Extrema' | 'Optimismo' | 'Neutral / Mixto' | 'Miedo / Pesimismo' | 'Pánico Extremo' = 'Neutral / Mixto';
    if (nsi >= 40) nsiLabel = 'Euforia Extrema';
    else if (nsi >= 15) nsiLabel = 'Optimismo';
    else if (nsi <= -40) nsiLabel = 'Pánico Extremo';
    else if (nsi <= -15) nsiLabel = 'Miedo / Pesimismo';

    return new Response(
      JSON.stringify({
        ticker,
        company,
        totalArticles: totalCount,
        nsi, // -100 a +100
        nsiLabel,
        distribution: {
          positive: posPct,
          neutral: neuPct,
          negative: negPct,
        },
        polarizationIndex: polarization, // 0 - 100
        professionalCount: articles.filter(a => a.sourceType === 'professional').length,
        articles: articles.slice(0, 20),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Error al analizar sentimiento" }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
