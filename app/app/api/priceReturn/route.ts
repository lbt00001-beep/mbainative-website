import { type NextRequest } from 'next/server';
import { riskVsBenchmark, summarizeReturns, type DailyPoint, type MonthlyIndex, type RiskStats } from '@/lib/realReturn';
import { jsonError, rateLimit } from '@/lib/security';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DAY = 86_400;
const EURO_START = '1999-01-04';

// Índices de precios oficiales por moneda. Eurostat: IPCA (2025=100). OECD: IPC nacional (2015=100).
const EUROSTAT_GEO: Record<string, { geo: string; label: string }> = {
  EUR: { geo: 'EA', label: 'IPCA zona euro (Eurostat)' },
  DKK: { geo: 'DK', label: 'IPCA Dinamarca (Eurostat)' },
  SEK: { geo: 'SE', label: 'IPCA Suecia (Eurostat)' },
  NOK: { geo: 'NO', label: 'IPCA Noruega (Eurostat)' },
  PLN: { geo: 'PL', label: 'IPCA Polonia (Eurostat)' },
  CZK: { geo: 'CZ', label: 'IPCA Chequia (Eurostat)' },
  HUF: { geo: 'HU', label: 'IPCA Hungría (Eurostat)' },
};
const OECD_AREA: Record<string, { area: string; label: string }> = {
  USD: { area: 'USA', label: 'IPC Estados Unidos (OCDE)' },
  GBP: { area: 'GBR', label: 'IPC Reino Unido (OCDE)' },
  CHF: { area: 'CHE', label: 'IPC Suiza (OCDE)' }, // Eurostat solo cubre Suiza desde 2004-12
  CAD: { area: 'CAN', label: 'IPC Canadá (OCDE)' },
  AUD: { area: 'AUS', label: 'IPC Australia (OCDE)' },
  KRW: { area: 'KOR', label: 'IPC Corea del Sur (OCDE)' },
  BRL: { area: 'BRA', label: 'IPC Brasil (OCDE)' },
  MXN: { area: 'MEX', label: 'IPC México (OCDE)' },
};
// Cotizaciones en subunidades (peniques, céntimos de rand, agorot).
const MINOR_UNITS: Record<string, string> = { GBp: 'GBP', GBX: 'GBP', ZAc: 'ZAR', ILA: 'ILS' };

function sanitizeTicker(t: string | null): string | null {
  if (!t) return null;
  const up = String(t).trim().toUpperCase();
  return /^[A-Z0-9=.\-^]{1,20}$/.test(up) ? up : null;
}

function isoDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) return null;
  return value;
}

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: status === 200 ? { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } : undefined,
});

async function fetchEurostat(geo: string): Promise<MonthlyIndex> {
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_minr?format=JSON&lang=EN&geo=${geo}&coicop18=TOTAL&unit=I25&sinceTimePeriod=1996-01`;
  const res = await fetch(url, { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Eurostat HTTP ${res.status}`);
  const data = await res.json();
  const times = data?.dimension?.time?.category?.index as Record<string, number> | undefined;
  if (!times) throw new Error('Eurostat sin serie temporal');
  const out: MonthlyIndex = new Map();
  for (const [month, i] of Object.entries(times)) {
    const v = data.value?.[i];
    if (typeof v === 'number') out.set(month, v);
  }
  return out;
}

async function fetchOecd(area: string): Promise<MonthlyIndex> {
  const url = `https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/${area}.M.N.CPI.IX._T.N._Z?startPeriod=1996-01&dimensionAtObservation=AllDimensions`;
  const res = await fetch(url, {
    // Sin Accept-Language explícito, la OCDE responde 500 al «*» que envía Node.
    headers: { Accept: 'application/vnd.sdmx.data+csv', 'Accept-Language': 'en' },
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`OCDE HTTP ${res.status}`);
  const [header, ...rows] = (await res.text()).trim().split(/\r?\n/);
  const cols = header.split(',');
  const iTime = cols.indexOf('TIME_PERIOD');
  const iValue = cols.indexOf('OBS_VALUE');
  const out: MonthlyIndex = new Map();
  for (const row of rows) {
    const cells = row.split(',');
    const v = Number(cells[iValue]);
    if (/^\d{4}-\d{2}$/.test(cells[iTime]) && Number.isFinite(v)) out.set(cells[iTime], v);
  }
  if (!out.size) throw new Error('OCDE sin observaciones');
  return out;
}

async function fetchCpi(currency: string, deflator: string): Promise<{ index: MonthlyIndex; label: string } | null> {
  if (currency === 'EUR' && deflator === 'es') return { index: await fetchEurostat('ES'), label: 'IPCA España (Eurostat)' };
  if (EUROSTAT_GEO[currency]) return { index: await fetchEurostat(EUROSTAT_GEO[currency].geo), label: EUROSTAT_GEO[currency].label };
  if (OECD_AREA[currency]) return { index: await fetchOecd(OECD_AREA[currency].area), label: OECD_AREA[currency].label };
  return null;
}

/** Tipos de referencia diarios del BCE: unidades de `currency` por 1 EUR. */
async function fetchEcbRates(currency: string, from: string, to: string): Promise<Array<[string, number]>> {
  const url = `https://data-api.ecb.europa.eu/service/data/EXR/D.${currency}.EUR.SP00.A?format=csvdata&detail=dataonly&startPeriod=${from}&endPeriod=${to}`;
  // El servicio del BCE tarda varios segundos en series largas; la respuesta queda en caché un día.
  const res = await fetch(url, { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(50_000) });
  if (!res.ok) throw new Error(`BCE HTTP ${res.status}`);
  const [header, ...rows] = (await res.text()).trim().split(/\r?\n/);
  const cols = header.split(',');
  const iTime = cols.indexOf('TIME_PERIOD');
  const iValue = cols.indexOf('OBS_VALUE');
  return rows.map(r => r.split(',')).map(c => [c[iTime], Number(c[iValue])] as [string, number])
    .filter(([d, v]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && v > 0).sort((a, b) => a[0].localeCompare(b[0]));
}

// Índice de referencia con dividendos por moneda de cotización (sustituible con ?bench=).
const DEFAULT_BENCHMARK: Record<string, { ticker: string; label: string }> = {
  USD: { ticker: '^SP500TR', label: 'S&P 500 con dividendos' },
  EUR: { ticker: 'EXSA.DE', label: 'STOXX Europe 600 (ETF iShares, dividendos reinvertidos)' },
  GBP: { ticker: 'ISF.L', label: 'FTSE 100 (ETF iShares, dividendos reinvertidos)' },
};

class RouteError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

interface LoadedSeries { points: DailyPoint[]; currency: string; name: string; dividends: number; notes: string[] }

/** Cierres diarios ajustados por splits y su índice de rentabilidad total propio. */
async function loadSeries(ticker: string, period1: number, period2: number): Promise<LoadedSeries> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${period1}&period2=${period2}&interval=1d&events=div%2Csplit`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new RouteError(`Yahoo Chart HTTP ${res.status}: ${ticker} no encontrado o sin histórico`, res.status === 404 ? 404 : 502);
  const result = (await res.json())?.chart?.result?.[0];
  if (!result?.timestamp?.length) throw new RouteError(`No hay cotizaciones de ${ticker} para ese periodo`, 404);

  const meta = result.meta || {};
  const rawCurrency: string = meta.currency || 'USD';
  const currency = MINOR_UNITS[rawCurrency] ?? rawCurrency;
  const scale = MINOR_UNITS[rawCurrency] ? 0.01 : 1;
  const offset = Number(meta.gmtoffset) || 0;
  const closes: Array<number | null> = result.indicators?.quote?.[0]?.close || [];
  const toDate = (ts: number) => new Date((ts + offset) * 1000).toISOString().slice(0, 10);

  let points: DailyPoint[] = [];
  result.timestamp.forEach((ts: number, i: number) => {
    const close = closes[i];
    if (close != null && close > 0) points.push({ date: toDate(ts), close: close * scale, adj: null });
  });
  // Yahoo puede repetir la sesión en curso; se conserva la última observación de cada fecha.
  points = points.filter((p, i) => points[i + 1]?.date !== p.date);
  if (points.length < 2) throw new RouteError(`Histórico insuficiente de ${ticker}`, 404);

  const notes: string[] = [];
  // Índice de rentabilidad total propio: TR_t = TR_{t-1} × (P_t + D_t) / P_{t-1}, con D en la sesión ex-dividendo.
  // No se usa el cierre ajustado de Yahoo porque en algunas bolsas (p. ej. Londres) omite los dividendos.
  const dividends = Object.values(result.events?.dividends || {}) as Array<{ date: number; amount: number }>;
  const divByDate = new Map<string, number>();
  for (const d of dividends) {
    if (!(d.amount > 0)) continue;
    const session = points.find(p => p.date >= toDate(d.date));
    if (session) divByDate.set(session.date, (divByDate.get(session.date) ?? 0) + d.amount * scale);
  }
  points[0].adj = points[0].close;
  for (let i = 1; i < points.length; i++) {
    const div = divByDate.get(points[i].date) ?? 0;
    points[i].adj = points[i - 1].adj! * (points[i].close + div) / points[i - 1].close;
    if (div > points[i].close * 0.25) notes.push(`Dividendo inusualmente alto de ${ticker} el ${points[i].date} (${(div / points[i].close * 100).toFixed(0)} % del precio): puede ser extraordinario o venir en otra moneda; compruébalo.`);
  }
  return { points, currency, name: meta.longName || meta.shortName || ticker, dividends: divByDate.size, notes };
}

/** Convierte a EUR cada sesión con el último fijo del BCE publicado en esa fecha o antes. */
async function convertToEur(points: DailyPoint[], currency: string): Promise<DailyPoint[]> {
  const since = points.filter(p => p.date >= EURO_START);
  if (since.length < 2) throw new RouteError('La vista en euros empieza el 4 de enero de 1999', 422);
  const rates = await fetchEcbRates(currency, since[0].date, since[since.length - 1].date).catch(() => []);
  if (rates.length < 2) throw new RouteError(`El BCE no publica un tipo de referencia diario EUR/${currency}; usa la vista en moneda de cotización`, 422);
  let k = 0;
  return since.flatMap(p => {
    while (k + 1 < rates.length && rates[k + 1][0] <= p.date) k++;
    if (rates[k][0] > p.date) return [];
    const r = rates[k][1];
    return [{ date: p.date, close: p.close / r, adj: p.adj == null ? null : p.adj / r }];
  });
}

/** Tipo a corto plazo anual por mes para Sharpe, Sortino y alfa: letra del Tesoro (USD) o Euríbor (EUR). */
async function fetchShortRate(currency: string): Promise<{ index: MonthlyIndex; label: string } | null> {
  if (currency === 'USD') {
    // Con range=max Yahoo devuelve puntos trimestrales; con un periodo explícito, mensuales.
    const now = Math.floor(Date.now() / 1000);
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/%5EIRX?period1=631152000&period2=${now}&interval=1mo`, {
      headers: { 'User-Agent': UA }, next: { revalidate: 86_400 }, signal: AbortSignal.timeout(20_000),
    });
    const r = (await res.json())?.chart?.result?.[0];
    const closes: Array<number | null> = r?.indicators?.quote?.[0]?.close || [];
    const index: MonthlyIndex = new Map();
    (r?.timestamp || []).forEach((ts: number, i: number) => {
      if (closes[i] != null) index.set(new Date(ts * 1000).toISOString().slice(0, 7), closes[i]! / 100);
    });
    return index.size ? { index, label: 'Letra del Tesoro de EE. UU. a 3 meses' } : null;
  }
  if (currency === 'EUR') {
    const res = await fetch('https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA?format=csvdata&detail=dataonly&startPeriod=1999-01', {
      next: { revalidate: 86_400 }, signal: AbortSignal.timeout(30_000),
    });
    const [header, ...rows] = (await res.text()).trim().split(/\r?\n/);
    const cols = header.split(','), iT = cols.indexOf('TIME_PERIOD'), iV = cols.indexOf('OBS_VALUE');
    const index: MonthlyIndex = new Map();
    for (const row of rows) { const c = row.split(','); const v = Number(c[iV]); if (Number.isFinite(v)) index.set(c[iT], v / 100); }
    return index.size ? { index, label: 'Euríbor a 3 meses (BCE)' } : null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ticker = sanitizeTicker(params.get('t'));
  const benchParam = params.get('bench');
  const from = isoDate(params.get('from')) ?? '2000-01-01';
  const to = isoDate(params.get('to'));
  const view = params.get('view') === 'eur' ? 'eur' : 'local';
  const deflator = params.get('deflator') === 'es' ? 'es' : 'ea';
  if (!ticker) return json({ error: 'Ticker inválido' }, 400);
  if (benchParam && !sanitizeTicker(benchParam)) return json({ error: 'Índice de referencia inválido' }, 400);
  try {
    // Cada consulta puede llamar a Yahoo, BCE, Eurostat u OCDE: límite global por proceso.
    rateLimit('priceReturn:global', 120, 60_000);
  } catch (error) {
    return jsonError(error);
  }
  if (to && to <= from) return json({ error: 'La fecha final debe ser posterior a la inicial' }, 400);

  try {
    const period1 = Math.floor(Date.parse(from) / 1000);
    const period2 = to ? Math.floor(Date.parse(to) / 1000) + DAY : Math.floor(Date.now() / 1000) + DAY;
    const stock = await loadSeries(ticker, period1, period2);
    const { currency } = stock;
    let points = stock.points;
    const notes = [...stock.notes];

    let viewCurrency = currency;
    if (view === 'eur' && currency !== 'EUR') {
      if (points[0].date < EURO_START) notes.push('La vista en euros comienza el 4 de enero de 1999, primer tipo de referencia del BCE.');
      points = await convertToEur(points, currency);
      viewCurrency = 'EUR';
      notes.push(`Precios convertidos de ${currency} a EUR con el tipo de referencia diario del BCE.`);
    }

    let cpiLabel: string | null = null;
    let cpi: MonthlyIndex | null = null;
    try {
      const found = await fetchCpi(viewCurrency, deflator);
      if (found) { cpi = found.index; cpiLabel = found.label; }
      else notes.push(`No hay índice de precios configurado para ${viewCurrency}: solo se muestra la variación nominal. Prueba la vista «inversor en euros».`);
    } catch (e: any) {
      notes.push(`No se pudo descargar el índice de precios (${e?.message || 'error de red'}); solo se muestra la variación nominal.`);
    }

    const summary = summarizeReturns(points, cpi);
    if (!summary) return json({ error: 'Histórico insuficiente para calcular la variación' }, 404);
    if (cpi && !summary.realPrice) notes.push(`El índice de precios no cubre el mes inicial (${summary.startDate.slice(0, 7)}); no se calcula la variación real.`);
    // Más de una semana entre la fecha pedida y la primera sesión: el histórico empieza después.
    if (Date.parse(summary.startDate) - Date.parse(from) > 7 * DAY * 1000) {
      notes.push(`El histórico disponible de ${ticker} empieza el ${summary.startDate}; el cálculo parte de esa sesión.`);
    }
    if (!stock.dividends) notes.push('Yahoo no registra dividendos en el periodo: la rentabilidad total coincide con la subida del precio.');
    if (summary.cpiEndIsStale) notes.push(`El último índice de precios publicado es de ${summary.cpiEndMonth}; se aplica también a los meses posteriores.`);

    // Riesgo frente al índice: mismo periodo, misma moneda y rentabilidades totales mensuales.
    let benchmark: { ticker: string; label: string } | null = benchParam
      ? { ticker: sanitizeTicker(benchParam)!, label: sanitizeTicker(benchParam)! }
      : DEFAULT_BENCHMARK[currency] ?? null;
    let risk: RiskStats | null = null;
    if (benchmark && benchmark.ticker !== ticker) {
      try {
        const bench = await loadSeries(benchmark.ticker, period1, period2);
        let benchPoints = bench.points;
        if (bench.currency !== viewCurrency) {
          if (viewCurrency !== 'EUR') throw new RouteError(`${benchmark.ticker} cotiza en ${bench.currency} y la acción en ${viewCurrency}; usa un índice en la misma moneda o la vista en euros`, 422);
          benchPoints = await convertToEur(benchPoints, bench.currency);
        }
        if (benchParam) benchmark = { ...benchmark, label: bench.name };
        const rf = await fetchShortRate(viewCurrency).catch(() => null);
        risk = riskVsBenchmark(points, benchPoints, rf?.index ?? null, rf?.label ?? null);
        if (!risk) notes.push(`Menos de dos años en común con ${benchmark.ticker}: no se calculan las métricas de riesgo.`);
        else {
          if (risk.from.slice(0, 7) > summary.startDate.slice(0, 7)) notes.push(`${benchmark.ticker} solo tiene datos desde ${risk.from}: las métricas de riesgo usan el periodo común.`);
          if (!rf) notes.push(`Sin tipo a corto plazo para ${viewCurrency}: no se calculan alfa, Sharpe ni Sortino.`);
        }
      } catch (e: any) {
        notes.push(`Índice de referencia no disponible: ${e?.message || 'error de red'}.`);
      }
    } else if (!benchmark) {
      notes.push(`No hay índice de referencia predeterminado para ${currency}: escribe uno en «Índice» para ver beta, alfa y Sharpe.`);
    }

    return json({
      ticker,
      name: stock.name,
      quoteCurrency: currency,
      currency: viewCurrency,
      requestedFrom: from,
      cpiLabel,
      notes,
      benchmark,
      risk,
      ...summary,
    });
  } catch (error: any) {
    if (error instanceof RouteError) return json({ error: error.message }, error.status);
    return json({ error: error?.message || 'Error interno al calcular la revalorización' }, 500);
  }
}
