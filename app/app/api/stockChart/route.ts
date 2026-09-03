import { type NextRequest } from 'next/server';

function sanitizeTicker(t: string | null): string | null {
  if (!t) return null;
  const up = String(t).trim().toUpperCase();
  if (!/^[A-Z0-9=.\-^]{1,20}$/.test(up)) return null;
  return up;
}

const VALID_RANGES = new Set(['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max']);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = sanitizeTicker(searchParams.get('t'));
    const range = searchParams.get('range') || '1y';
    const interval = searchParams.get('interval') || '1d';

    if (!ticker) {
      return new Response(JSON.stringify({ error: "Ticker inválido" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const safeRange = VALID_RANGES.has(range) ? range : '1y';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${safeRange}&interval=${interval}&includePrePost=false`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache 5 min
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Yahoo Chart HTTP ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      return new Response(JSON.stringify({ error: "No se encontraron datos de gráfico para el ticker" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const meta = result.meta || {};
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    // Filter out null/undefined bars
    const bars: Array<{
      time: number;
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }> = [];

    for (let i = 0; i < timestamps.length; i++) {
      const o = opens[i];
      const h = highs[i];
      const l = lows[i];
      const c = closes[i];
      const v = volumes[i] ?? 0;

      if (o != null && h != null && l != null && c != null && isFinite(c)) {
        const d = new Date(timestamps[i] * 1000);
        bars.push({
          time: timestamps[i],
          date: d.toISOString().split('T')[0],
          open: Number(o.toFixed(2)),
          high: Number(h.toFixed(2)),
          low: Number(l.toFixed(2)),
          close: Number(c.toFixed(2)),
          volume: Math.round(v),
        });
      }
    }

    return new Response(
      JSON.stringify({
        ticker,
        range: safeRange,
        currency: meta.currency || 'USD',
        regularMarketPrice: meta.regularMarketPrice,
        chartPreviousClose: meta.chartPreviousClose,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        bars,
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
      JSON.stringify({ error: error?.message || 'Error interno al consultar gráfico' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
