export interface AnalystPoint {
  label: string;
  value: number;
  count: number;
  offset: number;
}

export interface EpsPoint {
  label: string;
  value: number;
  offset: number;
}

function finite(value: unknown): number | null {
  const number = typeof value === 'number' ? value : (value as { raw?: unknown } | null)?.raw;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
}

export function recommendationPoints(data: any): AnalystPoint[] {
  const trend = data?.recommendationTrend?.trend;
  if (!Array.isArray(trend)) return [];
  return trend.flatMap((row: any) => {
    const match = /^(-?\d+)m$/.exec(String(row?.period || ''));
    if (!match) return [];
    const months = Number(match[1]);
    if (!Number.isInteger(months) || months > 0) return [];
    const counts = [row.strongBuy, row.buy, row.hold, row.sell, row.strongSell].map(finite);
    if (counts.some(value => value == null || value < 0 || !Number.isInteger(value))) return [];
    const safeCounts = counts as number[];
    const count = safeCounts.reduce((sum, value) => sum + value, 0);
    if (!count) return [];
    const score = safeCounts.reduce((sum, value, index) => sum + value * (index + 1), 0) / count;
    return [{ label: months === 0 ? 'Actual' : `Hace ${-months} m`, value: score, count, offset: months }];
  }).sort((a, b) => a.offset - b.offset);
}

export function epsRevisionPoints(data: any): { period: string; currency: string; points: EpsPoint[] } | null {
  const trend = data?.earningsTrend?.trend;
  if (!Array.isArray(trend)) return null;
  // Keep one fiscal period throughout the chart; annual estimates take priority.
  const row = trend.find((item: any) => item?.period === '0y' && item?.epsTrend)
    || trend.find((item: any) => item?.period === '+1y' && item?.epsTrend)
    || trend.find((item: any) => item?.period === '0q' && item?.epsTrend);
  if (!row) return null;
  const observations: Array<[string, string, number]> = [
    ['Hace 90 d', '90daysAgo', -90],
    ['Hace 60 d', '60daysAgo', -60],
    ['Hace 30 d', '30daysAgo', -30],
    ['Hace 7 d', '7daysAgo', -7],
    ['Actual', 'current', 0],
  ];
  const points = observations.flatMap(([label, key, offset]) => {
    const value = finite(row.epsTrend[key]);
    return value == null ? [] : [{ label, value, offset }];
  });
  if (points.length < 2) return null;
  return {
    period: String(row.endDate || row.period),
    currency: String(row.epsTrend.epsTrendCurrency || row.earningsEstimate?.earningsCurrency || ''),
    points,
  };
}
