import { type NextRequest } from 'next/server';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Rentabilidad a 10 años como tipo libre de riesgo para el CAPM del DCF.
async function usd() {
  const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?range=5d&interval=1d', {
    headers: { 'User-Agent': UA }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(12_000),
  });
  const meta = (await res.json())?.chart?.result?.[0]?.meta;
  if (!(meta?.regularMarketPrice > 0)) throw new Error('Sin dato de ^TNX');
  return { rate: meta.regularMarketPrice / 100, date: new Date(meta.regularMarketTime * 1000).toISOString().slice(0, 10), source: 'Bono del Tesoro de EE. UU. a 10 años (Yahoo ^TNX)' };
}

async function eur() {
  const res = await fetch('https://data-api.ecb.europa.eu/service/data/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y?format=csvdata&detail=dataonly&lastNObservations=1', {
    next: { revalidate: 21_600 }, signal: AbortSignal.timeout(20_000),
  });
  const [header, row] = (await res.text()).trim().split(/\r?\n/);
  const cols = header.split(','), cells = (row || '').split(',');
  const rate = Number(cells[cols.indexOf('OBS_VALUE')]);
  if (!Number.isFinite(rate)) throw new Error('Sin dato del BCE');
  return { rate: rate / 100, date: cells[cols.indexOf('TIME_PERIOD')], source: 'Curva AAA de la zona euro a 10 años (BCE)' };
}

export async function GET(request: NextRequest) {
  const currency = (request.nextUrl.searchParams.get('currency') || '').toUpperCase();
  const loader = currency === 'USD' ? usd : currency === 'EUR' ? eur : null;
  if (!loader) return Response.json({ rate: null, source: null, date: null });
  try {
    return Response.json(await loader(), { headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  } catch (e: any) {
    return Response.json({ rate: null, source: null, date: null, error: e?.message || 'Sin dato' });
  }
}
