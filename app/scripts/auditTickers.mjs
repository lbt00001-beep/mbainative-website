import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/tradingalpha/sp500Data.ts', import.meta.url), 'utf8');
const directory = [...source.matchAll(/ticker:\s*'([^']+)'/g)].map(match => match[1]);
const extra = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'ASML', 'ITX.MC', 'SAN.MC', 'SPY', 'QQQ', 'SMSN.IL', 'SMSN.L', '005930.KS', 'BTC-USD'];
const symbols = [...new Set([...directory, ...extra])];
const results = [];

async function check(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 TradingAlpha ticker audit' }, signal: AbortSignal.timeout(12000) });
      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 2500));
        continue;
      }
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!res.ok || !meta) return { symbol, error: json?.chart?.error?.description || `HTTP ${res.status}` };
      const ageDays = meta.regularMarketTime ? Math.round((Date.now() - meta.regularMarketTime * 1000) / 86400000) : null;
      return { symbol, returned: meta.symbol, name: meta.longName || meta.shortName, currency: meta.currency, exchange: meta.exchangeName, type: meta.instrumentType, ageDays };
    } catch (error) {
      if (attempt === 1) return { symbol, error: String(error) };
    }
  }
}

for (let index = 0; index < symbols.length; index += 4) {
  results.push(...await Promise.all(symbols.slice(index, index + 4).map(check)));
  await new Promise(resolve => setTimeout(resolve, 500));
}

const issues = results.filter(row => row.error || row.returned !== row.symbol || row.ageDays == null || row.ageDays > 7 || (directory.includes(row.symbol) && row.type !== 'EQUITY'));
console.log(JSON.stringify({ checked: results.length, directory: directory.length, issues }, null, 2));
