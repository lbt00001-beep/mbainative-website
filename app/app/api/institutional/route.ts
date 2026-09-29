import { XMLParser } from 'fast-xml-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MANAGERS = [
  { name: 'BlackRock, Inc.', cik: '2012383' },
  { name: 'Vanguard Capital Management LLC', cik: '2100119' },
  { name: 'State Street Corp', cik: '93751' },
  { name: 'FMR LLC (Fidelity)', cik: '315066' },
];
const SEC_UA = process.env.SEC_USER_AGENT || 'TradingAlpha mbainative.com contact info@mbainative.com';
const YAHOO_UA = 'Mozilla/5.0 (compatible; TradingAlpha/1.0)';
const XML = new XMLParser({ removeNSPrefix: true, ignoreAttributes: true, parseTagValue: false });
const CUSIP_TICKERS: Record<string, string> = {
  '037833100': 'AAPL', '594918104': 'MSFT', '67066G104': 'NVDA',
  '023135106': 'AMZN', '02079K305': 'GOOGL', '02079K107': 'GOOG',
  '30303M102': 'META', '88160R101': 'TSLA', '084670702': 'BRK-B',
};

type Position = { cusip: string; issuer: string; title: string; value: number; shares: number };
type ManagerData = { name: string; period: string; filed: string; source: string; total: number; positions: Position[] };
let cache: { at: number; data: any } | null = null;
let inflight: Promise<any> | null = null;
let yahooSession: { cookie: string; crumb: string; at: number } | null = null;

async function secJson(url: string) {
  const response = await fetch(url, { headers: { 'User-Agent': SEC_UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`SEC HTTP ${response.status}`);
  return response.json();
}

async function secText(url: string) {
  const response = await fetch(url, { headers: { 'User-Agent': SEC_UA, Accept: 'application/xml' }, signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`SEC HTTP ${response.status}`);
  return response.text();
}

async function loadManager(manager: typeof MANAGERS[number]): Promise<ManagerData> {
  const cik = manager.cik.padStart(10, '0');
  const submission = await secJson(`https://data.sec.gov/submissions/CIK${cik}.json`);
  const recent = submission.filings?.recent;
  let index = recent?.form?.findIndex((form: string) => form === '13F-HR');
  if (index == null || index < 0) throw new Error(`Sin 13F-HR para ${manager.name}`);
  // A 13F-HR/A can be a complete restatement or an add-only amendment.
  // Only a complete restatement replaces the original information table.
  for (let i = 0; i < index; i++) {
    if (recent.form[i] !== '13F-HR/A' || recent.reportDate[i] !== recent.reportDate[index]) continue;
    const amendAccession = recent.accessionNumber[i];
    const amendBase = `https://www.sec.gov/Archives/edgar/data/${manager.cik}/${amendAccession.replaceAll('-', '')}/`;
    try {
      const amendment = XML.parse(await secText(`${amendBase}primary_doc.xml`));
      if (amendment.edgarSubmission?.formData?.coverPage?.amendmentInfo?.amendmentType === 'RESTATEMENT') { index = i; break; }
    } catch { /* The original filing remains the complete baseline. */ }
  }
  const accession = recent.accessionNumber[index];
  const base = `https://www.sec.gov/Archives/edgar/data/${manager.cik}/${accession.replaceAll('-', '')}/`;
  const fileIndex = await secJson(`${base}index.json`);
  const infoFile = (fileIndex.directory?.item || [])
    .filter((file: any) => /\.xml$/i.test(file.name) && !/primary_doc/i.test(file.name))
    .sort((a: any, b: any) => Number(b.size) - Number(a.size))[0];
  if (!infoFile) throw new Error(`Sin tabla de posiciones para ${manager.name}`);
  const parsed = XML.parse(await secText(`${base}${infoFile.name}`));
  const entries = parsed.informationTable?.infoTable || [];
  const positions: Position[] = [];
  let total = 0;
  for (const item of Array.isArray(entries) ? entries : [entries]) {
    if (String(item.putCall || '').trim() || item.shrsOrPrnAmt?.sshPrnamtType !== 'SH') continue;
    const value = Number(item.value);
    const shares = Number(item.shrsOrPrnAmt?.sshPrnamt);
    if (!Number.isFinite(value) || !Number.isFinite(shares) || value <= 0 || shares <= 0) continue;
    total += value;
    positions.push({ cusip: String(item.cusip || '').toUpperCase(), issuer: String(item.nameOfIssuer || ''), title: String(item.titleOfClass || ''), value, shares });
  }
  const merged = new Map<string, Position>();
  for (const position of positions) {
    const current = merged.get(position.cusip);
    if (current) { current.value += position.value; current.shares += position.shares; }
    else merged.set(position.cusip, { ...position });
  }
  return { name: manager.name, period: recent.reportDate[index], filed: recent.filingDate[index], source: `${base}${infoFile.name}`, total, positions: [...merged.values()].filter(position => !/\b(ADR|ADS|DEPOSITARY)\b/i.test(position.title)).sort((a, b) => b.value - a.value).slice(0, 25) };
}

function normalizedName(name: string) {
  return name.toUpperCase().replace(/\b(INCORPORATED|INC|CORPORATION|CORP|COMPANY|CO|THE|PLC|LTD|LIMITED|COM|CLASS|CL|NEW)\b/g, '').replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function resolveTicker(position: Position): Promise<string | null> {
  if (CUSIP_TICKERS[position.cusip]) return CUSIP_TICKERS[position.cusip];
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(position.issuer)}&quotesCount=5&newsCount=0`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': YAHOO_UA }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return null;
    const results = (await response.json()).quotes || [];
    const expected = normalizedName(position.issuer);
    const match = results.find((quote: any) => {
      if (quote.quoteType !== 'EQUITY' || !['NYQ', 'NMS', 'ASE', 'NGM'].includes(quote.exchange)) return false;
      const actual = normalizedName(quote.longname || quote.shortname || '');
      return actual === expected || (expected.length >= 8 && (actual.startsWith(expected) || expected.startsWith(actual)));
    });
    return match?.symbol || null;
  } catch { return null; }
}

async function getYahooSession() {
  if (yahooSession && Date.now() - yahooSession.at < 15 * 60_000) return yahooSession;
  const consent = await fetch('https://fc.yahoo.com/', { redirect: 'manual', headers: { 'User-Agent': YAHOO_UA }, signal: AbortSignal.timeout(12000) });
  const cookies = consent.headers.getSetCookie?.() || [];
  const cookie = cookies.map(value => value.split(';')[0]).join('; ');
  if (!cookie) throw new Error('Yahoo no entregó una sesión de consulta');
  const crumbResponse = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': YAHOO_UA, Cookie: cookie }, signal: AbortSignal.timeout(12000) });
  const crumb = (await crumbResponse.text()).trim();
  if (!crumbResponse.ok || !crumb || crumb.startsWith('<')) throw new Error('Yahoo no entregó autorización de consulta');
  yahooSession = { cookie, crumb, at: Date.now() };
  return yahooSession;
}

async function sharesOutstanding(ticker: string): Promise<number | null> {
  try {
    const { cookie, crumb } = await getYahooSession();
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=defaultKeyStatistics&crumb=${encodeURIComponent(crumb)}`;
    const response = await fetch(url, { headers: { 'User-Agent': YAHOO_UA, Cookie: cookie, Referer: `https://finance.yahoo.com/quote/${ticker}` }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return null;
    const data = (await response.json())?.quoteSummary?.result?.[0];
    const value = Number(data?.defaultKeyStatistics?.sharesOutstanding?.raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch { return null; }
}

async function buildRanking() {
  const managers = await Promise.all(MANAGERS.map(loadManager));
  const candidates = new Map<string, { position: Position; holdings: Array<{ manager: string; period: string; shares: number; value: number; portfolioWeight: number }> }>();
  for (const manager of managers) {
    for (const position of manager.positions) {
      const item = candidates.get(position.cusip) || { position, holdings: [] };
      item.holdings.push({ manager: manager.name, period: manager.period, shares: position.shares, value: position.value, portfolioWeight: position.value / manager.total });
      candidates.set(position.cusip, item);
    }
  }
  const candidateList = [...candidates.values()];
  const resolved: Array<{ position: Position; holdings: typeof candidateList[number]['holdings']; ticker: string }> = [];
  for (let i = 0; i < candidateList.length; i += 4) {
    const batch = await Promise.all(candidateList.slice(i, i + 4).map(async item => ({ ...item, ticker: await resolveTicker(item.position) })));
    resolved.push(...batch.filter((item): item is typeof resolved[number] => !!item.ticker));
  }
  const rows: any[] = [];
  for (let i = 0; i < resolved.length; i += 4) {
    const batch = await Promise.all(resolved.slice(i, i + 4).map(async item => ({ ...item, outstanding: await sharesOutstanding(item.ticker) })));
    for (const item of batch) {
      if (!item.outstanding) continue;
      const contributions = item.holdings.map(holding => ({
        ...holding,
        ownership: Math.min(1, holding.shares / item.outstanding!),
        contribution: Math.min(1, holding.shares / item.outstanding!) * holding.portfolioWeight * 100,
      }));
      rows.push({ ticker: item.ticker, company: item.position.issuer, cusip: item.position.cusip, score: contributions.reduce((sum, holding) => sum + holding.contribution, 0), contributions });
    }
  }
  rows.sort((a, b) => b.score - a.score);
  return {
    asOf: new Date().toISOString(),
    method: 'Índice = 100 × suma(participación estimada en la empresa × peso en el 13F de cada gestor).',
    coverage: 'Se evalúan las 25 mayores posiciones ordinarias de cada entidad declarante; se excluyen ADR/ADS, opciones y fondos. El peso usa valor de mercado reportado, no coste de compra, y únicamente activos reportables en 13F. La participación usa acciones en circulación actuales de Yahoo y puede diferir de la fecha del 13F. No incluye posiciones cortas ni Londres/Corea.',
    managers: managers.map(({ name, period, filed, source, total }) => ({ name, period, filed, source, reportedValue: total })),
    rows: rows.slice(0, 50),
    unresolved: candidates.size - rows.length,
  };
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < 12 * 60 * 60_000) return Response.json(cache.data);
    if (!inflight) inflight = buildRanking();
    const data = await inflight;
    cache = { at: Date.now(), data };
    return Response.json(data, { headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'No se pudieron consultar los informes 13F' }, { status: 502 });
  } finally { inflight = null; }
}
