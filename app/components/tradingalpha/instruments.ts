export interface InstrumentConfig {
  quoteTicker: string;
  label?: string;
  receiptRatio?: number;
  warning?: string;
  sourceUrl?: string;
}

// The London instrument is a GDR (25 Korean ordinary shares), quoted in USD.
// Yahoo's per-GDR fundamental fields are inconsistent across SMSN.IL and SMSN.L.
// Use the Korean ordinary share for company fundamentals, while the chart and
// displayed market price continue to belong to the selected London instrument.
const SPECIAL_INSTRUMENTS: Record<string, InstrumentConfig> = {
  'SMSN.IL': {
    quoteTicker: '005930.KS',
    label: 'Samsung Electronics GDR, Londres',
    receiptRatio: 25,
    warning: 'GDR de 25 acciones ordinarias. La cotización está en USD; los fundamentales de 005930.KS están en KRW.',
    sourceUrl: 'https://www.londonstockexchange.com/stock/SMSN/samsung-electronics-co-ltd-att',
  },
  'SMSN.L': {
    quoteTicker: '005930.KS',
    label: 'Samsung Electronics GDR, símbolo Yahoo alternativo',
    receiptRatio: 25,
    warning: 'Yahoo muestra una cotización posiblemente desactualizada para SMSN.L. Comprueba SMSN.IL y la Bolsa de Londres.',
    sourceUrl: 'https://www.londonstockexchange.com/stock/SMSN/samsung-electronics-co-ltd-att',
  },
  TSM: {
    quoteTicker: '2330.TW',
    label: 'TSMC ADR, Nueva York',
    receiptRatio: 5,
    warning: 'Cada ADR representa 5 acciones ordinarias. La cotización de TSM está en USD; los fundamentales de 2330.TW están en TWD.',
    sourceUrl: 'https://investor.tsmc.com/sites/ir/sec-filings/2025_20F%20Report.pdf',
  },
  NVO: {
    quoteTicker: 'NOVO-B.CO',
    label: 'Novo Nordisk ADR, Nueva York',
    receiptRatio: 1,
    warning: 'Cada ADR representa 1 acción B. La cotización de NVO está en USD; los fundamentales de NOVO-B.CO están en DKK.',
    sourceUrl: 'https://www.novonordisk.com/investors/stock-information/dividend.html',
  },
};

export function getInstrumentConfig(ticker: string): InstrumentConfig {
  return SPECIAL_INSTRUMENTS[ticker.toUpperCase()] || { quoteTicker: ticker.toUpperCase() };
}

export function currencyLabel(code: string | null | undefined): string {
  return code || 'moneda N/D';
}
