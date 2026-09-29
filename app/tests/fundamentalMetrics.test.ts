import assert from 'node:assert/strict';
import test from 'node:test';
import { annualEpsGrowthEstimate, dcfGrowthAssumption, earningsMetrics } from '../components/tradingalpha/fundamentalMetrics';
import { calculatePeterLynchFairValue } from '../components/tradingalpha/financialEngine';
import { getInstrumentConfig } from '../components/tradingalpha/instruments';
import { dailyPriceChange } from '../components/tradingalpha/marketChange';

test('verified receipts use ordinary-share fundamentals and keep their documented ratios', () => {
  assert.deepEqual(
    ['SMSN.IL', 'TSM', 'NVO'].map(symbol => {
      const instrument = getInstrumentConfig(symbol);
      return [instrument.quoteTicker, instrument.receiptRatio, Boolean(instrument.sourceUrl)];
    }),
    [['005930.KS', 25, true], ['2330.TW', 5, true], ['NOVO-B.CO', 1, true]],
  );
  assert.deepEqual(getInstrumentConfig('UNKNOWN'), { quoteTicker: 'UNKNOWN' });
});

test('London GDRs without reliable Yahoo prices use the named ordinary share for chart and fundamentals', () => {
  for (const [symbol, ordinary, ratio] of [
    ['CEIR', '2324.TW', 5], ['CEIR.L', '2324.TW', 5],
    ['RIGD', 'RELIANCE.NS', 4], ['RIGD.L', 'RELIANCE.NS', 4],
  ] as const) {
    const config = getInstrumentConfig(symbol);
    assert.equal(config.quoteTicker, ordinary);
    assert.equal(config.chartTicker, ordinary);
    assert.equal(config.receiptRatio, ratio);
    assert.equal(config.receiptQuoteUnavailable, true);
  }
});

test('ASML Nasdaq keeps its USD chart while using the EUR ordinary-share listing for fundamentals', () => {
  const config = getInstrumentConfig('ASML');
  assert.equal(config.quoteTicker, 'ASML.AS');
  assert.equal(config.chartTicker, undefined);
  assert.equal(config.sameShareListing, true);
  assert.equal(config.receiptRatio, undefined);
});

test('BIDU records the issuer-verified ADS ratio without changing the Yahoo ticker', () => {
  const config = getInstrumentConfig('BIDU');
  assert.equal(config.quoteTicker, 'BIDU');
  assert.equal(config.receiptRatio, 8);
  assert.match(config.sourceUrl || '', /^https:\/\/ir\.baidu\.com\//);
});

test('Samsung ordinary share shows labeled TTM approximation and dated forward estimates', () => {
  const result = earningsMetrics({
    price: { currency: 'KRW', regularMarketPrice: { raw: 272500 } },
    financialData: { financialCurrency: 'KRW' },
    summaryDetail: { trailingPE: {} },
    defaultKeyStatistics: {
      netIncomeToCommon: { raw: 135264684998656 },
      sharesOutstanding: { raw: 5764191903 },
      forwardPE: { raw: 3.8153555 },
    },
    earningsTrend: { trend: [{ period: '+1y', endDate: '2027-12-31', epsTrend: {
      current: { raw: 71421.914 }, epsTrendCurrency: 'KRW',
    } }] },
  });
  assert.equal(result.trailingPEApproximate, true);
  assert.equal(result.trailingEPSApproximate, true);
  assert.ok(result.trailingPE != null && result.trailingPE > 11 && result.trailingPE < 12);
  assert.equal(result.forwardPE, 3.8153555);
  assert.equal(result.forwardEPS, 71421.914);
  assert.equal(result.forwardPeriod, '2027-12-31');
});

test('different accounting currency cannot produce an inferred PER', () => {
  const result = earningsMetrics({
    price: { currency: 'USD', regularMarketPrice: { raw: 100 } },
    financialData: { financialCurrency: 'KRW' },
    defaultKeyStatistics: { netIncomeToCommon: { raw: 1000 }, sharesOutstanding: { raw: 10 }, forwardPE: { raw: 3 } },
  });
  assert.equal(result.trailingPE, null);
  assert.equal(result.forwardPE, null);
});

test('BIDU uses the USD ADS forecast only when Yahoo price, EPS and PER reconcile', () => {
  const result = earningsMetrics({
    price: { currency: 'USD', regularMarketPrice: { raw: 86.71 } },
    financialData: { financialCurrency: 'CNY' },
    summaryDetail: { trailingPE: null, forwardPE: { raw: 11.188242 } },
    defaultKeyStatistics: {
      trailingEps: { raw: -2.34 },
      forwardEps: { raw: 7.7501006 },
      forwardPE: { raw: 1.670438 }, // Yahoo also returns an incompatible mixed-currency ratio.
      netIncomeToCommon: { raw: -4709000192 },
      sharesOutstanding: { raw: 275068110 },
    },
    earningsTrend: { trend: [{ period: '+1y', endDate: '2027-12-31', epsTrend: {
      current: { raw: 51.90854 }, epsTrendCurrency: 'CNY',
    } }] },
  });
  assert.equal(result.trailingPE, null);
  assert.equal(result.forwardPE, 11.188242);
  assert.equal(result.forwardEPS, 7.7501006);
  assert.equal(result.forwardPeriod, null);
});

test('cross-currency Yahoo forecast stays hidden when the published ratio is incompatible', () => {
  const result = earningsMetrics({
    price: { currency: 'USD', regularMarketPrice: { raw: 86.71 } },
    financialData: { financialCurrency: 'CNY' },
    summaryDetail: { forwardPE: { raw: 1.67 } },
    defaultKeyStatistics: { forwardEps: { raw: 7.75 }, forwardPE: { raw: 1.67 } },
  });
  assert.equal(result.forwardPE, null);
  assert.equal(result.forwardEPS, null);
});

test('Lynch starts from two comparable annual EPS estimates rather than an empty growth field', () => {
  const estimate = annualEpsGrowthEstimate({ earningsTrend: { trend: [
    { period: '0y', endDate: '2026-09-30', epsTrend: { current: { raw: 8.8 }, epsTrendCurrency: 'USD' } },
    { period: '+1y', endDate: '2027-09-30', epsTrend: { current: { raw: 9.68 }, epsTrendCurrency: 'USD' } },
  ] } });
  assert.ok(estimate);
  assert.ok(Math.abs(estimate.rate - 10) < 0.00001);
  assert.equal(calculatePeterLynchFairValue(8.73, estimate.rate / 100), 87.3);
});

test('Lynch does not infer growth from incompatible currencies or nonpositive EPS', () => {
  const trend = (base: number, nextCurrency: string) => ({ earningsTrend: { trend: [
    { period: '0y', endDate: '2026-12-31', epsTrend: { current: { raw: base }, epsTrendCurrency: 'USD' } },
    { period: '+1y', endDate: '2027-12-31', epsTrend: { current: { raw: 12 }, epsTrendCurrency: nextCurrency } },
  ] } });
  assert.equal(annualEpsGrowthEstimate(trend(10, 'CNY')), null);
  assert.equal(annualEpsGrowthEstimate(trend(-10, 'USD')), null);
  assert.equal(calculatePeterLynchFairValue(-2, 0.1), null);
});

test('daily move uses the preceding session, never the start of the selected chart range', () => {
  assert.deepEqual(dailyPriceChange(5110, [{ close: 1496 }, { close: 4824 }, { close: 5110 }]), {
    change: 286,
    percent: 286 / 4824 * 100,
  });
  assert.equal(dailyPriceChange(5110, [{ close: 5110 }]), null);
});

test('exceptional one-period revenue growth does not compound through the DCF', () => {
  assert.equal(dcfGrowthAssumption(1.3), 0.10);
  assert.equal(dcfGrowthAssumption(0.2), 0.2);
  assert.equal(dcfGrowthAssumption(null), 0.10);
});
