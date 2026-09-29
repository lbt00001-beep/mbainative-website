export interface InstrumentConfig {
  quoteTicker: string;
  chartTicker?: string;
  label?: string;
  receiptRatio?: number;
  receiptQuoteUnavailable?: boolean;
  sameShareListing?: boolean;
  warning?: string;
  sourceUrl?: string;
  marketUrl?: string;
}

// The London instrument is a GDR (25 Korean ordinary shares), quoted in USD.
// Yahoo's per-GDR fundamental fields are inconsistent across SMSN.IL and SMSN.L.
// Use the Korean ordinary share for company fundamentals, while the chart and
// displayed market price continue to belong to the selected London instrument.
const SPECIAL_INSTRUMENTS: Record<string, InstrumentConfig> = {
  BIDU: {
    quoteTicker: 'BIDU',
    label: 'Baidu ADS, Nasdaq',
    receiptRatio: 8,
    warning: 'Cada ADS de BIDU representa 8 acciones ordinarias. Yahoo cotiza el ADS en USD y publica los estados financieros en CNY. Solo se muestran PER y BPA por ADS si concuerdan con el precio; el PER TTM no se aplica cuando hay pérdidas. Se omiten DCF y ratios que crucen monedas.',
    sourceUrl: 'https://ir.baidu.com/shareholder-services/investor-faqs',
  },
  ASML: {
    quoteTicker: 'ASML.AS',
    label: 'ASML Holding N.V.',
    sameShareListing: true,
    warning: 'ASML cotiza como acción ordinaria en Nasdaq (USD) y Ámsterdam (EUR). Yahoo entrega la contabilidad en EUR. PER, BPA, objetivos y DCF se toman de ASML.AS en EUR; gráfico y precio mostrado, de ASML en USD. No se convierte el valor en EUR a USD.',
    sourceUrl: 'https://www.asml.com/en/investors/shares',
  },
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
  CEIR: {
    quoteTicker: '2324.TW',
    chartTicker: '2324.TW',
    label: 'Compal Electronics',
    receiptRatio: 5,
    receiptQuoteUnavailable: true,
    warning: 'CEIR es un GDR de 5 acciones ordinarias. Yahoo no ofrece CEIR y su CEIR.L tiene cotización obsoleta. Se muestra la acción ordinaria 2324.TW en TWD; su precio y gráfico NO son los del GDR.',
    sourceUrl: 'https://www.compal.com/mediafiles/sh-meeting/annual-report/1150508_Compal_2025_Annual_Report_EN.pdf',
    marketUrl: 'https://www.londonstockexchange.com/stock/CEIR/compal-electronics-inc/company-page',
  },
  'CEIR.L': {
    quoteTicker: '2324.TW',
    chartTicker: '2324.TW',
    label: 'Compal Electronics',
    receiptRatio: 5,
    receiptQuoteUnavailable: true,
    warning: 'CEIR.L tiene una cotización obsoleta en Yahoo. Se muestra la acción ordinaria 2324.TW en TWD; su precio y gráfico NO son los del GDR CEIR.',
    sourceUrl: 'https://www.compal.com/mediafiles/sh-meeting/annual-report/1150508_Compal_2025_Annual_Report_EN.pdf',
    marketUrl: 'https://www.londonstockexchange.com/stock/CEIR/compal-electronics-inc/company-page',
  },
  RIGD: {
    quoteTicker: 'RELIANCE.NS',
    chartTicker: 'RELIANCE.NS',
    label: 'Reliance Industries',
    receiptRatio: 4,
    receiptQuoteUnavailable: true,
    warning: 'RIGD es un GDR de 4 acciones ordinarias actuales. Yahoo no ofrece RIGD y su RIGD.L tiene cotización obsoleta. Se muestra la acción ordinaria RELIANCE.NS en INR; su precio y gráfico NO son los del GDR.',
    sourceUrl: 'https://www.ril.com/ar2025-26/RIL_IAR%202026.pdf',
    marketUrl: 'https://www.londonstockexchange.com/stock/RIGD/reliance-industries-limited/company-page',
  },
  'RIGD.L': {
    quoteTicker: 'RELIANCE.NS',
    chartTicker: 'RELIANCE.NS',
    label: 'Reliance Industries',
    receiptRatio: 4,
    receiptQuoteUnavailable: true,
    warning: 'RIGD.L tiene una cotización obsoleta en Yahoo. Se muestra la acción ordinaria RELIANCE.NS en INR; su precio y gráfico NO son los del GDR RIGD.',
    sourceUrl: 'https://www.ril.com/ar2025-26/RIL_IAR%202026.pdf',
    marketUrl: 'https://www.londonstockexchange.com/stock/RIGD/reliance-industries-limited/company-page',
  },
};

export function getInstrumentConfig(ticker: string): InstrumentConfig {
  return SPECIAL_INSTRUMENTS[ticker.toUpperCase()] || { quoteTicker: ticker.toUpperCase() };
}

export function currencyLabel(code: string | null | undefined): string {
  return code || 'moneda N/D';
}
