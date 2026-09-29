function raw(value: any): number | null {
  const number = typeof value === 'number' ? value : value?.raw;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
}

function matchesPriceAndEps(price: number | null, eps: number | null, pe: number | null): boolean {
  if (price == null || price <= 0 || eps == null || eps <= 0 || pe == null || pe <= 0) return false;
  // Yahoo sometimes expresses a ratio using CNY EPS and a USD ADS price.
  // Only accept a cross-currency per-share pair when the quoted ratio reconciles.
  return Math.abs(price / eps - pe) / pe <= 0.05;
}

export interface EarningsMetrics {
  trailingPE: number | null;
  trailingPEApproximate: boolean;
  trailingEPS: number | null;
  trailingEPSApproximate: boolean;
  forwardPE: number | null;
  forwardEPS: number | null;
  forwardPeriod: string | null;
}

export function dcfGrowthAssumption(revenueGrowth: number | null): number {
  // One exceptional revenue period should not compound free cash flow at that rate for five years.
  if (revenueGrowth == null || !Number.isFinite(revenueGrowth) || revenueGrowth < 0 || revenueGrowth > 0.30) return 0.10;
  return Math.max(0.04, revenueGrowth);
}

export function earningsMetrics(data: any): EarningsMetrics {
  const price = data?.price || {};
  const stats = data?.defaultKeyStatistics || {};
  const summary = data?.summaryDetail || {};
  const financialCurrency = data?.financialData?.financialCurrency || price.currency;
  const sameCurrency = !!price.currency && price.currency === financialCurrency;
  const quotePrice = raw(price.regularMarketPrice);
  const netIncome = raw(stats.netIncomeToCommon);
  const shares = raw(stats.sharesOutstanding);
  const estimatedTrailingEPS = sameCurrency && netIncome != null && netIncome > 0 && shares != null && shares > 0
    ? netIncome / shares : null;
  const reportedTrailingEPS = raw(stats.trailingEps);
  const reportedTrailingPE = raw(summary.trailingPE);
  const comparableTrailing = sameCurrency || matchesPriceAndEps(quotePrice, reportedTrailingEPS, reportedTrailingPE);
  const trailingEPS = comparableTrailing ? (reportedTrailingEPS ?? estimatedTrailingEPS) : null;
  const trailingPE = comparableTrailing
    ? (reportedTrailingPE != null && reportedTrailingPE > 0 ? reportedTrailingPE
      : trailingEPS != null && trailingEPS > 0 && quotePrice != null && quotePrice > 0 ? quotePrice / trailingEPS : null)
    : null;

  const nextYear = Array.isArray(data?.earningsTrend?.trend)
    ? data.earningsTrend.trend.find((row: any) => row?.period === '+1y') : null;
  const estimateCurrency = nextYear?.epsTrend?.epsTrendCurrency || nextYear?.earningsEstimate?.earningsCurrency || price.currency;
  const estimatedForwardEPS = estimateCurrency === price.currency
    ? (raw(nextYear?.epsTrend?.current) ?? raw(nextYear?.earningsEstimate?.avg)) : null;
  const reportedForwardEPS = raw(stats.forwardEps);
  const summaryForwardPE = raw(summary.forwardPE);
  const statsForwardPE = raw(stats.forwardPE);
  const comparableForward = sameCurrency || matchesPriceAndEps(quotePrice, reportedForwardEPS, summaryForwardPE)
    || matchesPriceAndEps(quotePrice, reportedForwardEPS, statsForwardPE);
  const forwardEPS = comparableForward ? (reportedForwardEPS ?? estimatedForwardEPS) : null;
  const reportedComparablePE = [summaryForwardPE, statsForwardPE].find(pe => matchesPriceAndEps(quotePrice, forwardEPS, pe))
    ?? (sameCurrency && forwardEPS == null ? [summaryForwardPE, statsForwardPE].find(pe => pe != null && pe > 0) : null);
  const forwardPE = comparableForward
    ? (reportedComparablePE
      ?? (forwardEPS != null && forwardEPS > 0 && quotePrice != null && quotePrice > 0 ? quotePrice / forwardEPS : null))
    : null;

  return {
    trailingPE,
    trailingPEApproximate: reportedTrailingPE == null && trailingPE != null,
    trailingEPS,
    trailingEPSApproximate: reportedTrailingEPS == null && trailingEPS != null,
    forwardPE,
    forwardEPS,
    forwardPeriod: sameCurrency || estimateCurrency === price.currency ? nextYear?.endDate || null : null,
  };
}
