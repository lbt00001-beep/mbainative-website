function raw(value: any): number | null {
  const number = typeof value === 'number' ? value : value?.raw;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
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
  const trailingEPS = sameCurrency ? (reportedTrailingEPS ?? estimatedTrailingEPS) : null;
  const reportedTrailingPE = raw(summary.trailingPE);
  const trailingPE = sameCurrency
    ? (reportedTrailingPE != null && reportedTrailingPE > 0 ? reportedTrailingPE
      : trailingEPS != null && trailingEPS > 0 && quotePrice != null && quotePrice > 0 ? quotePrice / trailingEPS : null)
    : null;

  const nextYear = Array.isArray(data?.earningsTrend?.trend)
    ? data.earningsTrend.trend.find((row: any) => row?.period === '+1y') : null;
  const estimateCurrency = nextYear?.epsTrend?.epsTrendCurrency || nextYear?.earningsEstimate?.earningsCurrency || price.currency;
  const estimatedForwardEPS = estimateCurrency === price.currency
    ? (raw(nextYear?.epsTrend?.current) ?? raw(nextYear?.earningsEstimate?.avg)) : null;
  const forwardEPS = sameCurrency ? (raw(stats.forwardEps) ?? estimatedForwardEPS) : null;
  const reportedForwardPE = raw(stats.forwardPE);
  const forwardPE = sameCurrency
    ? (reportedForwardPE != null && reportedForwardPE > 0 ? reportedForwardPE
      : forwardEPS != null && forwardEPS > 0 && quotePrice != null && quotePrice > 0 ? quotePrice / forwardEPS : null)
    : null;

  return {
    trailingPE,
    trailingPEApproximate: reportedTrailingPE == null && trailingPE != null,
    trailingEPS,
    trailingEPSApproximate: reportedTrailingEPS == null && trailingEPS != null,
    forwardPE,
    forwardEPS,
    forwardPeriod: nextYear?.endDate || null,
  };
}
