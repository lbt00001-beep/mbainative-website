import assert from 'node:assert/strict';
import test from 'node:test';
import { epsRevisionPoints, recommendationPoints } from '../components/tradingalpha/analystTrendData';

test('recommendation consensus is weighted by each rating and ordered oldest to newest', () => {
  const points = recommendationPoints({ recommendationTrend: { trend: [
    { period: '0m', strongBuy: 2, buy: 1, hold: 1, sell: 0, strongSell: 0 },
    { period: '-1m', strongBuy: 0, buy: 0, hold: 2, sell: 1, strongSell: 1 },
  ] } });
  assert.deepEqual(points.map(point => point.label), ['Hace 1 m', 'Actual']);
  assert.equal(points[0].value, 3.75);
  assert.equal(points[1].value, 1.75);
  assert.equal(points[1].count, 4);
});

test('EPS revision trend keeps a single fiscal period and its currency', () => {
  const result = epsRevisionPoints({ earningsTrend: { trend: [
    { period: '0q', endDate: '2026-09-30', epsTrend: { current: { raw: 2 } } },
    { period: '0y', endDate: '2026-12-31', epsTrend: {
      '90daysAgo': { raw: 10 }, '30daysAgo': { raw: 11 }, current: { raw: 12 }, epsTrendCurrency: 'KRW',
    } },
  ] } });
  assert.equal(result?.period, '2026-12-31');
  assert.equal(result?.currency, 'KRW');
  assert.deepEqual(result?.points.map(point => point.value), [10, 11, 12]);
  assert.equal(epsRevisionPoints({ earningsTrend: { trend: [{ period: '0y', epsTrend: { current: { raw: 12 } } }] } }), null);
});
