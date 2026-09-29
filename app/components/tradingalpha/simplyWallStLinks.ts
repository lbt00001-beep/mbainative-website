// Verified company pages. Symbols without a verified match use a scoped search.
const REPORTS: Record<string, string> = {
  AAPL: 'https://simplywall.st/stocks/us/tech/nasdaq-aapl/apple',
  MSFT: 'https://simplywall.st/stocks/us/software/nasdaq-msft/microsoft',
  NVDA: 'https://simplywall.st/stocks/us/semiconductors/nasdaq-nvda/nvidia',
  GOOGL: 'https://simplywall.st/stocks/us/media/nasdaq-googl/alphabet',
  AMZN: 'https://simplywall.st/stocks/us/retail/nasdaq-amzn/amazoncom',
  META: 'https://simplywall.st/stocks/us/media/nasdaq-meta/meta-platforms',
  TSLA: 'https://simplywall.st/stocks/us/automobiles/nasdaq-tsla/tesla',
  ASML: 'https://simplywall.st/stocks/us/semiconductors/nasdaq-asml/asml-holding',
  'ITX.MC': 'https://simplywall.st/stocks/es/retail/bme-itx/industria-de-diseno-textil-shares',
  'SAN.MC': 'https://simplywall.st/stocks/es/banks/bme-san/banco-santander-shares',
  '005930.KS': 'https://simplywall.st/stocks/kr/tech/kose-a005930/samsung-electronics-shares',
};

export function simplyWallStReport(ticker: string, quoteTicker: string): { url: string; direct: boolean } {
  const symbol = quoteTicker.toUpperCase();
  if (REPORTS[symbol]) return { url: REPORTS[symbol], direct: true };
  const query = `site:simplywall.st/stocks/ ${symbol} ${ticker !== quoteTicker ? quoteTicker : ''}`.trim();
  return { url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, direct: false };
}
