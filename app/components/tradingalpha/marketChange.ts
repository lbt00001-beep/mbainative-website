export function dailyPriceChange(currentPrice: number, bars: Array<{ close: number }>): { change: number; percent: number } | null {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0 || bars.length < 2) return null;
  const previousClose = bars[bars.length - 2]?.close;
  if (!Number.isFinite(previousClose) || previousClose <= 0) return null;
  const change = currentPrice - previousClose;
  return { change, percent: change / previousClose * 100 };
}
