// Cálculo puro de revalorización nominal y real. Sin acceso a red: lo usa /api/priceReturn.

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  close: number; // precio ajustado por splits
  adj: number | null; // precio ajustado por splits y dividendos (rentabilidad total)
}

export type MonthlyIndex = Map<string, number>; // 'YYYY-MM' -> nivel de precios

export interface ReturnLeg {
  total: number; // variación acumulada (0,25 = +25 %)
  cagr: number | null; // tasa anual compuesta
}

export interface ReturnSummary {
  startDate: string;
  endDate: string;
  years: number;
  startPrice: number;
  endPrice: number;
  price: ReturnLeg;
  totalReturn: ReturnLeg | null;
  inflation: ReturnLeg | null;
  realPrice: ReturnLeg | null;
  realTotalReturn: ReturnLeg | null;
  cpiStartMonth: string | null;
  cpiEndMonth: string | null;
  cpiEndIsStale: boolean;
  maxDrawdown: { value: number; peakDate: string; troughDate: string } | null;
  maxDrawdownReal: { value: number; peakDate: string; troughDate: string } | null;
  volatility: number | null; // anualizada, rentabilidades mensuales
  series: Array<{ date: string; nominal: number; real: number | null }>;
}

const DAY_MS = 86_400_000;

export function cagr(total: number, years: number): number | null {
  if (!(years > 0) || total <= -1) return null;
  return Math.pow(1 + total, 1 / years) - 1;
}

function leg(total: number, years: number): ReturnLeg {
  return { total, cagr: cagr(total, years) };
}

/** Nivel de precios del mes de `date`; si aún no está publicado, el último disponible. */
export function cpiAt(index: MonthlyIndex, date: string, lastMonth: string): { value: number; month: string } | null {
  const month = date.slice(0, 7);
  const own = index.get(month);
  if (own != null) return { value: own, month };
  if (month > lastMonth) return { value: index.get(lastMonth)!, month: lastMonth };
  return null;
}

function drawdown(points: Array<{ date: string; value: number }>) {
  let peak = points[0];
  let worst = { value: 0, peakDate: peak.date, troughDate: peak.date };
  for (const p of points) {
    if (p.value > peak.value) peak = p;
    const dd = p.value / peak.value - 1;
    if (dd < worst.value) worst = { value: dd, peakDate: peak.date, troughDate: p.date };
  }
  return worst.value < 0 ? worst : null;
}

export interface RiskStats {
  months: number; // rentabilidades mensuales en común
  from: string;
  to: string;
  benchmarkTotal: number; // rentabilidad total del índice en el periodo común
  stockTotal: number; // de la acción en el mismo periodo común
  benchmarkCagr: number | null;
  stockCagr: number | null;
  beta: number;
  correlation: number;
  alpha: number | null; // alfa de Jensen anualizada (requiere tipo sin riesgo)
  sharpe: number | null;
  benchmarkSharpe: number | null;
  sortino: number | null;
  trackingError: number;
  informationRatio: number;
  riskFreeLabel: string | null;
}

/** Último punto de cada mes, indexado por 'YYYY-MM'. */
function monthEnds(points: DailyPoint[], value: (p: DailyPoint) => number): Map<string, { date: string; v: number }> {
  const out = new Map<string, { date: string; v: number }>();
  for (const p of points) out.set(p.date.slice(0, 7), { date: p.date, v: value(p) });
  return out;
}

const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(xs.reduce((s, v) => s + (v - m) ** 2, 0) / (xs.length - 1)); };

/**
 * Métricas de riesgo con rentabilidades totales mensuales (fin de mes) del periodo común.
 * `riskFree`: tipo anual por mes ('YYYY-MM' → 0,04); sin él no se calculan alfa, Sharpe ni Sortino.
 */
export function riskVsBenchmark(stock: DailyPoint[], bench: DailyPoint[], riskFree: MonthlyIndex | null, riskFreeLabel: string | null): RiskStats | null {
  const tr = (p: DailyPoint) => p.adj ?? p.close;
  const s = monthEnds(stock, tr), b = monthEnds(bench, tr);
  const months = Array.from(s.keys()).filter(m => b.has(m)).sort();
  if (months.length < 25) return null; // menos de dos años de datos mensuales no da estimaciones estables
  const rs: number[] = [], rb: number[] = [], ex: number[] = [], exB: number[] = [];
  // Meses sin dato publicado usan el último tipo conocido (incluido el anterior al periodo).
  const rfMonths = riskFree ? Array.from(riskFree.keys()).filter(m => m <= months[0]).sort() : [];
  let lastRf: number | null = rfMonths.length ? riskFree!.get(rfMonths[rfMonths.length - 1])! : null;
  let rfMissing = riskFree == null;
  for (let i = 1; i < months.length; i++) {
    const r1 = s.get(months[i])!.v / s.get(months[i - 1])!.v - 1;
    const r2 = b.get(months[i])!.v / b.get(months[i - 1])!.v - 1;
    rs.push(r1); rb.push(r2);
    if (riskFree) {
      lastRf = riskFree.get(months[i]) ?? lastRf;
      if (lastRf == null) rfMissing = true;
      const rfM = (lastRf ?? 0) / 12;
      ex.push(r1 - rfM); exB.push(r2 - rfM);
    }
  }
  const mS = mean(rs), mB = mean(rb);
  let cov = 0, varB = 0;
  for (let i = 0; i < rs.length; i++) { cov += (rs[i] - mS) * (rb[i] - mB); varB += (rb[i] - mB) ** 2; }
  cov /= rs.length - 1; varB /= rs.length - 1;
  const beta = cov / varB;
  const correlation = cov / (sd(rs) * sd(rb));
  const active = rs.map((r, i) => r - rb[i]);
  const trackingError = sd(active) * Math.sqrt(12);
  const first = months[0], last = months[months.length - 1];
  const years = (Date.parse(s.get(last)!.date) - Date.parse(s.get(first)!.date)) / DAY_MS / 365.25;
  const stockTotal = s.get(last)!.v / s.get(first)!.v - 1;
  const benchmarkTotal = b.get(last)!.v / b.get(first)!.v - 1;
  const useRf = !rfMissing && ex.length === rs.length;
  const downside = useRf ? Math.sqrt(ex.reduce((acc, v) => acc + Math.min(0, v) ** 2, 0) / ex.length) : null;
  return {
    months: rs.length,
    from: s.get(first)!.date,
    to: s.get(last)!.date,
    stockTotal,
    benchmarkTotal,
    stockCagr: cagr(stockTotal, years),
    benchmarkCagr: cagr(benchmarkTotal, years),
    beta,
    correlation,
    alpha: useRf ? (mean(ex) - beta * mean(exB)) * 12 : null,
    sharpe: useRf ? (mean(ex) / sd(ex)) * Math.sqrt(12) : null,
    benchmarkSharpe: useRf ? (mean(exB) / sd(exB)) * Math.sqrt(12) : null,
    sortino: useRf && downside ? (mean(ex) / downside) * Math.sqrt(12) : null,
    trackingError,
    informationRatio: trackingError > 0 ? (mean(active) * 12) / trackingError : 0,
    riskFreeLabel: useRf ? riskFreeLabel : null,
  };
}

export function summarizeReturns(points: DailyPoint[], cpi: MonthlyIndex | null): ReturnSummary | null {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const years = (Date.parse(last.date) - Date.parse(first.date)) / DAY_MS / 365.25;
  const hasAdj = first.adj != null && last.adj != null && points.every(p => p.adj != null && p.adj > 0);
  const tr = (p: DailyPoint) => (hasAdj ? p.adj! : p.close);

  const priceTotal = last.close / first.close - 1;
  const totalReturn = hasAdj ? last.adj! / first.adj! - 1 : null;

  const cpiMonths = cpi ? Array.from(cpi.keys()).sort() : [];
  const cpiLast = cpiMonths[cpiMonths.length - 1];
  const cpiStart = cpi && cpiLast ? cpiAt(cpi, first.date, cpiLast) : null;
  const cpiEnd = cpi && cpiLast ? cpiAt(cpi, last.date, cpiLast) : null;
  const realReady = cpiStart != null && cpiEnd != null;
  const inflationTotal = realReady ? cpiEnd!.value / cpiStart!.value - 1 : null;
  const deflate = (nominal: number) => (1 + nominal) / (1 + inflationTotal!) - 1;

  // Serie mensual: último día cotizado de cada mes, más el día final.
  const monthly: DailyPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const next = points[i + 1];
    if (i === 0 || !next || next.date.slice(0, 7) !== points[i].date.slice(0, 7)) monthly.push(points[i]);
  }
  const base = tr(first);
  const series = monthly.map(p => {
    const nominal = (tr(p) / base) * 100;
    const c = realReady ? cpiAt(cpi!, p.date, cpiLast) : null;
    return { date: p.date, nominal, real: c ? nominal * (cpiStart!.value / c.value) : null };
  });

  let volatility: number | null = null;
  if (series.length >= 13) {
    const logs = series.slice(1).map((p, i) => Math.log(p.nominal / series[i].nominal));
    const mean = logs.reduce((s, v) => s + v, 0) / logs.length;
    const variance = logs.reduce((s, v) => s + (v - mean) ** 2, 0) / (logs.length - 1);
    volatility = Math.sqrt(variance * 12);
  }

  const realSeries = series.filter(p => p.real != null).map(p => ({ date: p.date, value: p.real! }));

  return {
    startDate: first.date,
    endDate: last.date,
    years,
    startPrice: first.close,
    endPrice: last.close,
    price: leg(priceTotal, years),
    totalReturn: totalReturn == null ? null : leg(totalReturn, years),
    inflation: inflationTotal == null ? null : leg(inflationTotal, years),
    realPrice: realReady ? leg(deflate(priceTotal), years) : null,
    realTotalReturn: realReady && totalReturn != null ? leg(deflate(totalReturn), years) : null,
    cpiStartMonth: cpiStart?.month ?? null,
    cpiEndMonth: cpiEnd?.month ?? null,
    cpiEndIsStale: cpiEnd != null && cpiEnd.month !== last.date.slice(0, 7),
    maxDrawdown: drawdown(points.map(p => ({ date: p.date, value: tr(p) }))),
    maxDrawdownReal: realSeries.length > 1 ? drawdown(realSeries) : null,
    volatility,
    series,
  };
}
