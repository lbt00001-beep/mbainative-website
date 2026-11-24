import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeReturns, riskVsBenchmark, type DailyPoint } from '../lib/realReturn';
import { mergeFundamentalYears } from '../lib/fundamentalSeries';
import {
  type FundamentalYearData,
  calculateAltmanZScore, calculateDCF, impliedFcfGrowth, estimateWacc, normalizeFcf, calculateRoic,
} from '../components/tradingalpha/financialEngine';
import { getInstrumentConfig } from '../components/tradingalpha/instruments';

const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('la variación real descuenta la inflación del periodo y la tasa anual compone', () => {
  const points: DailyPoint[] = [
    { date: '2000-01-03', close: 100, adj: 100 },
    { date: '2010-01-04', close: 200, adj: 300 },
  ];
  const cpi = new Map([['2000-01', 100], ['2010-01', 125]]);
  const r = summarizeReturns(points, cpi)!;
  close(r.price.total, 1);
  close(r.totalReturn!.total, 2);
  close(r.inflation!.total, 0.25);
  close(r.realPrice!.total, 2 / 1.25 - 1);
  close(r.realTotalReturn!.total, 3 / 1.25 - 1);
  close(r.price.cagr!, Math.pow(2, 1 / r.years) - 1);
});

test('si el IPC aún no está publicado se usa el último mes disponible y se avisa', () => {
  const points: DailyPoint[] = [
    { date: '2020-01-02', close: 10, adj: 10 },
    { date: '2020-03-31', close: 11, adj: 11 },
  ];
  const r = summarizeReturns(points, new Map([['2020-01', 100], ['2020-02', 101]]))!;
  assert.equal(r.cpiEndMonth, '2020-02');
  assert.equal(r.cpiEndIsStale, true);
  close(r.inflation!.total, 0.01);
});

test('beta y correlación frente al índice se calculan con rentabilidades mensuales', () => {
  const months = Array.from({ length: 40 }, (_, i) => `20${String(10 + Math.floor(i / 12)).padStart(2, '0')}-${String(i % 12 + 1).padStart(2, '0')}-28`);
  let b = 100, s = 100;
  const bench: DailyPoint[] = [], stock: DailyPoint[] = [];
  months.forEach((date, i) => {
    const rb = i % 3 === 0 ? 0.03 : -0.01;
    if (i) { b *= 1 + rb; s *= 1 + 2 * rb; }
    bench.push({ date, close: b, adj: b });
    stock.push({ date, close: s, adj: s });
  });
  const risk = riskVsBenchmark(stock, bench, null, null)!;
  close(risk.beta, 2, 1e-9);
  close(risk.correlation, 1, 1e-9);
  assert.equal(risk.sharpe, null); // sin tipo sin riesgo no se inventa
});

test('los estados reconstruidos desde las series de Yahoo permiten Altman Z y Z\'\'', () => {
  const years = [
    { endDate: '2025-12-31', currency: 'USD', values: { totalAssets: 1000, totalCurrentAssets: 400, totalCurrentLiabilities: 200, retainedEarnings: 300, totalLiab: 500, totalStockholderEquity: 500, operatingIncome: 150 } },
  ];
  // QuoteSummary devuelve {} sin raw: no debe bloquear el resultado operativo de las series.
  const base = { incomeStatementHistory: { incomeStatementHistory: [{ endDate: { fmt: '2025-12-31' }, operatingIncome: {}, totalRevenue: { raw: 1500 } }] } };
  const merged = mergeFundamentalYears(base, years);
  assert.equal(merged.incomeStatementHistory.incomeStatementHistory[0].operatingIncome.raw, 150);
  const tech = calculateAltmanZScore({ ...merged, assetProfile: { sector: 'Technology' } })!;
  assert.equal(tech.model, "Z''");
  close(tech.score, Number((6.56 * 0.2 + 3.26 * 0.3 + 6.72 * 0.15 + 1.05 * 1).toFixed(2)));
  const industrial = calculateAltmanZScore({ ...merged, assetProfile: { sector: 'Industrials' }, summaryDetail: { marketCap: { raw: 2000 } } })!;
  assert.equal(industrial.model, 'Z');
  close(industrial.score, Number((1.2 * 0.2 + 1.4 * 0.3 + 3.3 * 0.15 + 0.6 * 4 + 0.999 * 1.5).toFixed(2)));
});

test('el DCF inverso devuelve el crecimiento que iguala valor y precio', () => {
  const fair = calculateDCF(100, 0.08, 0.025, 0.09, 10, 50, 1)!.fairValue;
  const g = impliedFcfGrowth(fair, 100, 0.025, 0.09, 10, 50)!;
  close(g, 0.08, 1e-3);
});

test('WACC por CAPM, FCF normalizado neto de SBC y ROIC', () => {
  const w = estimateWacc({ riskFree: 0.04, beta: 1.2, equityRiskPremium: 0.05, marketCap: 800, totalDebt: 200, interestExpense: 10, taxRate: 0.25 })!;
  close(w.costOfEquity, 0.1);
  close(w.costOfDebt, 0.05);
  close(w.wacc, 0.8 * 0.1 + 0.2 * 0.05 * 0.75);
  const years: FundamentalYearData[] = [
    { endDate: '2025-12-31', currency: 'USD', values: { freeCashFlow: 120, stockBasedCompensation: 20, ebit: 200, investedCapital: 1100, taxRateForCalcs: 0.2 } },
    { endDate: '2024-12-31', currency: 'USD', values: { freeCashFlow: 90, stockBasedCompensation: 10, investedCapital: 900 } },
  ];
  const n = normalizeFcf(years)!;
  close(n.average, 105);
  close(n.averageLessSbc!, 90);
  close(calculateRoic(years)!.roic, 200 * 0.8 / 1000);
});

test('SMSN y SMSN.L se consultan como el GDR vigente SMSN.IL', () => {
  assert.equal(getInstrumentConfig('SMSN').chartTicker, 'SMSN.IL');
  assert.equal(getInstrumentConfig('smsn.l').chartTicker, 'SMSN.IL');
  assert.equal(getInstrumentConfig('SMSN').quoteTicker, '005930.KS');
});
