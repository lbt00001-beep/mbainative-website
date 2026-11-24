// Yahoo QuoteSummary dejó de entregar balances y flujos de caja históricos (solo `endDate`).
// Su servicio de series fundamentales sí los publica; aquí se traducen a los nombres
// clásicos de QuoteSummary para que Piotroski, Altman, DuPont y los estados vuelvan a calcularse.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const BALANCE: Record<string, string> = {
  totalAssets: 'TotalAssets',
  totalCurrentAssets: 'CurrentAssets',
  totalCurrentLiabilities: 'CurrentLiabilities',
  retainedEarnings: 'RetainedEarnings',
  totalLiab: 'TotalLiabilitiesNetMinorityInterest',
  totalStockholderEquity: 'StockholdersEquity',
  longTermDebt: 'LongTermDebt',
  totalDebt: 'TotalDebt',
  cash: 'CashAndCashEquivalents',
  totalCash: 'CashCashEquivalentsAndShortTermInvestments',
  investedCapital: 'InvestedCapital',
  ordinarySharesNumber: 'OrdinarySharesNumber',
};
const CASHFLOW: Record<string, string> = {
  totalCashFromOperatingActivities: 'OperatingCashFlow',
  capitalExpenditures: 'CapitalExpenditure',
  freeCashFlow: 'FreeCashFlow',
  stockBasedCompensation: 'StockBasedCompensation',
  dividendsPaid: 'CashDividendsPaid',
  repurchaseOfStock: 'RepurchaseOfCapitalStock',
};
const INCOME: Record<string, string> = {
  totalRevenue: 'TotalRevenue',
  costOfRevenue: 'CostOfRevenue',
  grossProfit: 'GrossProfit',
  operatingIncome: 'OperatingIncome',
  netIncome: 'NetIncome',
  ebit: 'EBIT',
  ebitda: 'EBITDA',
  taxRateForCalcs: 'TaxRateForCalcs',
  interestExpense: 'InterestExpense',
  pretaxIncome: 'PretaxIncome',
  taxProvision: 'TaxProvision',
};

export interface FundamentalYear {
  endDate: string; // YYYY-MM-DD
  currency: string | null;
  values: Record<string, number>; // clave clásica -> valor
}

export async function fetchFundamentalYears(ticker: string): Promise<FundamentalYear[]> {
  const all = { ...BALANCE, ...CASHFLOW, ...INCOME };
  const types = Object.values(all).map(t => `annual${t}`).join(',');
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(ticker)}`
    + `?symbol=${encodeURIComponent(ticker)}&type=${types}&period1=${now - 8 * 366 * 86_400}&period2=${now}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA }, next: { revalidate: 21_600 }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Yahoo series HTTP ${res.status}`);
  const result: any[] = (await res.json())?.timeseries?.result || [];
  const byType = new Map<string, string>(Object.entries(all).map(([legacy, type]) => [`annual${type}`, legacy]));
  const years = new Map<string, FundamentalYear>();
  for (const serie of result) {
    const type = serie?.meta?.type?.[0];
    const legacy = byType.get(type);
    if (!legacy) continue;
    for (const obs of serie[type] || []) {
      const raw = obs?.reportedValue?.raw;
      if (!obs?.asOfDate || typeof raw !== 'number' || !Number.isFinite(raw)) continue;
      const year: FundamentalYear = years.get(obs.asOfDate) ?? { endDate: obs.asOfDate, currency: obs.currencyCode ?? null, values: {} };
      year.values[legacy] = raw;
      years.set(obs.asOfDate, year);
    }
  }
  // Más reciente primero, como QuoteSummary.
  return Array.from(years.values()).sort((a, b) => b.endDate.localeCompare(a.endDate));
}

const asStatement = (y: FundamentalYear, keys: Record<string, string>) => {
  const row: Record<string, unknown> = { endDate: { raw: Date.parse(y.endDate) / 1000, fmt: y.endDate } };
  for (const key of Object.keys(keys)) if (y.values[key] != null) row[key] = { raw: y.values[key] };
  return row;
};

/** Completa en `data` los módulos históricos vacíos y añade `fundamentalSeries` con todas las series. */
export function mergeFundamentalYears(data: any, years: FundamentalYear[]): any {
  if (!years.length) return data;
  const statementYears = years.filter(y => Object.keys(BALANCE).some(k => y.values[k] != null));
  const cashYears = years.filter(y => Object.keys(CASHFLOW).some(k => y.values[k] != null));
  const out = { ...data };
  out.balanceSheetHistory = { balanceSheetStatements: statementYears.map(y => asStatement(y, BALANCE)) };
  out.cashflowStatementHistory = { cashflowStatements: cashYears.map(y => asStatement(y, CASHFLOW)) };

  // Partidas de resultados que QuoteSummary aún publica se conservan; solo se añaden las ausentes.
  const income = data?.incomeStatementHistory?.incomeStatementHistory;
  if (Array.isArray(income)) {
    out.incomeStatementHistory = {
      ...data.incomeStatementHistory,
      incomeStatementHistory: income.map((row: any) => {
        const date = row?.endDate?.fmt ?? (row?.endDate?.raw ? new Date(row.endDate.raw * 1000).toISOString().slice(0, 10) : null);
        const match = years.find(y => y.endDate === date);
        if (!match) return row;
        const extra: Record<string, unknown> = {};
        for (const key of Object.keys(INCOME)) if (typeof row[key]?.raw !== 'number' && match.values[key] != null) extra[key] = { raw: match.values[key] };
        return { ...row, ...extra };
      }),
    };
  }

  const shares = statementYears.map(y => y.values.ordinarySharesNumber).filter((v): v is number => v != null);
  if (shares.length >= 2) {
    out.defaultKeyStatistics = {
      ...data?.defaultKeyStatistics,
      sharesOutstandingLastFY: { raw: shares[0] },
      sharesOutstandingPrevYear: { raw: shares[1] },
    };
  }
  out.fundamentalSeries = years;
  return out;
}
