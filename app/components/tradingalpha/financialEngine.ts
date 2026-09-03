// ============================================================================
// TradingAlpha — Motor Cuantitativo & Financiero Institucional
// Algoritmos de Valoración (DCF, Graham, Lynch), Ratios DuPont, Altman Z,
// Piotroski F-Score e Indicadores Técnicos (TradingView Standard)
// ============================================================================

export interface CandleBar {
  time: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalSummary {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema9: number | null;
  ema21: number | null;
  rsi14: number | null;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  } | null;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  } | null;
  pivots: {
    r2: number;
    r1: number;
    pivot: number;
    s1: number;
    s2: number;
  } | null;
  signals: {
    trendPrimary: 'Alcista' | 'Bajista' | 'Neutral';
    trendMedium: 'Alcista' | 'Bajista' | 'Neutral';
    goldenCross: boolean;
    deathCross: boolean;
    rsiStatus: 'Sobrecompra' | 'Sobreventa' | 'Neutral';
    macdCross: 'Compra Alcista' | 'Venta Bajista' | 'Neutral';
    bollingerStatus: 'Squeeze' | 'Banda Superior' | 'Banda Inferior' | 'Rango Normal';
    technicalScore: number; // 0 - 100
    overallSignal: 'Fuerte Compra' | 'Compra' | 'Neutral' | 'Venta' | 'Fuerte Venta';
  };
}

// ----------------------------------------------------------------------------
// 1. CÁLCULO DE INDICADORES TÉCNICOS
// ----------------------------------------------------------------------------

export function computeTechnicalIndicators(bars: CandleBar[]): TechnicalSummary {
  if (!bars || bars.length < 5) {
    return {
      sma20: null,
      sma50: null,
      sma200: null,
      ema9: null,
      ema21: null,
      rsi14: null,
      macd: null,
      bollinger: null,
      pivots: null,
      signals: {
        trendPrimary: 'Neutral',
        trendMedium: 'Neutral',
        goldenCross: false,
        deathCross: false,
        rsiStatus: 'Neutral',
        macdCross: 'Neutral',
        bollingerStatus: 'Rango Normal',
        technicalScore: 50,
        overallSignal: 'Neutral',
      },
    };
  }

  const closes = bars.map(b => b.close);
  const n = closes.length;
  const currentPrice = closes[n - 1];

  // Helper SMA
  const calcSMA = (period: number): number | null => {
    if (n < period) return null;
    const slice = closes.slice(n - period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return Number((sum / period).toFixed(2));
  };

  // Helper EMA series
  const calcEMASeries = (period: number): number[] => {
    if (n < period) return [];
    const k = 2 / (period + 1);
    const emaArr: number[] = [];
    let initialSma = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    emaArr.push(initialSma);

    for (let i = period; i < n; i++) {
      const prev = emaArr[emaArr.length - 1];
      const val = closes[i] * k + prev * (1 - k);
      emaArr.push(val);
    }
    return emaArr;
  };

  const sma20 = calcSMA(20);
  const sma50 = calcSMA(50);
  const sma200 = calcSMA(200);

  const ema9Series = calcEMASeries(9);
  const ema21Series = calcEMASeries(21);
  const ema9 = ema9Series.length ? Number(ema9Series[ema9Series.length - 1].toFixed(2)) : null;
  const ema21 = ema21Series.length ? Number(ema21Series[ema21Series.length - 1].toFixed(2)) : null;

  // RSI 14 (Wilder smoothing)
  let rsi14: number | null = null;
  if (n >= 15) {
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= 14; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    let avgGain = gains / 14;
    let avgLoss = losses / 14;

    for (let i = 15; i < n; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;
      avgGain = (avgGain * 13 + gain) / 14;
      avgLoss = (avgLoss * 13 + loss) / 14;
    }

    if (avgLoss === 0) {
      rsi14 = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi14 = Number((100 - (100 / (1 + rs))).toFixed(1));
    }
  }

  // MACD (12, 26, 9)
  let macdResult: TechnicalSummary['macd'] = null;
  if (n >= 35) {
    const ema12 = calcEMASeries(12);
    const ema26 = calcEMASeries(26);
    // Align indices: ema26 starts at index 25 of closes
    const offset = 26 - 12;
    const macdLine: number[] = [];
    for (let i = 0; i < ema26.length; i++) {
      macdLine.push(ema12[i + offset] - ema26[i]);
    }

    // Signal line: 9-period EMA of macdLine
    if (macdLine.length >= 9) {
      const kSig = 2 / (9 + 1);
      let sigVal = macdLine.slice(0, 9).reduce((a, b) => a + b, 0) / 9;
      for (let i = 9; i < macdLine.length; i++) {
        sigVal = macdLine[i] * kSig + sigVal * (1 - kSig);
      }
      const lastMacd = macdLine[macdLine.length - 1];
      macdResult = {
        macd: Number(lastMacd.toFixed(2)),
        signal: Number(sigVal.toFixed(2)),
        histogram: Number((lastMacd - sigVal).toFixed(2)),
      };
    }
  }

  // Bollinger Bands (20, 2)
  let bollinger: TechnicalSummary['bollinger'] = null;
  if (n >= 20 && sma20 != null) {
    const slice = closes.slice(n - 20);
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma20, 2), 0) / 20;
    const stdDev = Math.sqrt(variance);
    const upper = Number((sma20 + 2 * stdDev).toFixed(2));
    const lower = Number((sma20 - 2 * stdDev).toFixed(2));
    const bandwidth = Number((((upper - lower) / sma20) * 100).toFixed(2));
    bollinger = { upper, middle: sma20, lower, bandwidth };
  }

  // Pivot Points (Standard Daily based on previous bar)
  let pivots: TechnicalSummary['pivots'] = null;
  if (bars.length >= 2) {
    const prev = bars[bars.length - 2];
    const pp = (prev.high + prev.low + prev.close) / 3;
    const r1 = 2 * pp - prev.low;
    const s1 = 2 * pp - prev.high;
    const r2 = pp + (prev.high - prev.low);
    const s2 = pp - (prev.high - prev.low);
    pivots = {
      r2: Number(r2.toFixed(2)),
      r1: Number(r1.toFixed(2)),
      pivot: Number(pp.toFixed(2)),
      s1: Number(s1.toFixed(2)),
      s2: Number(s2.toFixed(2)),
    };
  }

  // Scoring & Signals Engine
  let techScore = 50;
  let bullCount = 0;
  let bearCount = 0;

  // Trend Primary (Price vs SMA 200)
  let trendPrimary: 'Alcista' | 'Bajista' | 'Neutral' = 'Neutral';
  if (sma200 != null) {
    if (currentPrice > sma200 * 1.01) {
      trendPrimary = 'Alcista';
      techScore += 15;
      bullCount++;
    } else if (currentPrice < sma200 * 0.99) {
      trendPrimary = 'Bajista';
      techScore -= 15;
      bearCount++;
    }
  }

  // Trend Medium (SMA 50 vs SMA 200 or Price vs SMA 50)
  let trendMedium: 'Alcista' | 'Bajista' | 'Neutral' = 'Neutral';
  let goldenCross = false;
  let deathCross = false;
  if (sma50 != null && sma200 != null) {
    if (sma50 > sma200) {
      goldenCross = true;
      trendMedium = 'Alcista';
      techScore += 10;
      bullCount++;
    } else {
      deathCross = true;
      trendMedium = 'Bajista';
      techScore -= 10;
      bearCount++;
    }
  } else if (sma50 != null) {
    trendMedium = currentPrice > sma50 ? 'Alcista' : 'Bajista';
  }

  // RSI Status
  let rsiStatus: 'Sobrecompra' | 'Sobreventa' | 'Neutral' = 'Neutral';
  if (rsi14 != null) {
    if (rsi14 >= 70) {
      rsiStatus = 'Sobrecompra';
      techScore -= 5; // Cautela por agotamiento
    } else if (rsi14 <= 30) {
      rsiStatus = 'Sobreventa';
      techScore += 10; // Oportunidad de rebote
    } else if (rsi14 > 50) {
      techScore += 5;
      bullCount++;
    } else {
      techScore -= 5;
      bearCount++;
    }
  }

  // MACD Status
  let macdCross: 'Compra Alcista' | 'Venta Bajista' | 'Neutral' = 'Neutral';
  if (macdResult) {
    if (macdResult.histogram > 0 && macdResult.macd > macdResult.signal) {
      macdCross = 'Compra Alcista';
      techScore += 10;
      bullCount++;
    } else if (macdResult.histogram < 0 && macdResult.macd < macdResult.signal) {
      macdCross = 'Venta Bajista';
      techScore -= 10;
      bearCount++;
    }
  }

  // Bollinger Status
  let bollingerStatus: 'Squeeze' | 'Banda Superior' | 'Banda Inferior' | 'Rango Normal' = 'Rango Normal';
  if (bollinger) {
    if (bollinger.bandwidth < 8) bollingerStatus = 'Squeeze';
    else if (currentPrice >= bollinger.upper * 0.99) bollingerStatus = 'Banda Superior';
    else if (currentPrice <= bollinger.lower * 1.01) bollingerStatus = 'Banda Inferior';
  }

  const finalScore = Math.max(5, Math.min(95, Math.round(techScore)));

  let overallSignal: 'Fuerte Compra' | 'Compra' | 'Neutral' | 'Venta' | 'Fuerte Venta' = 'Neutral';
  if (finalScore >= 75) overallSignal = 'Fuerte Compra';
  else if (finalScore >= 60) overallSignal = 'Compra';
  else if (finalScore <= 30) overallSignal = 'Fuerte Venta';
  else if (finalScore <= 42) overallSignal = 'Venta';

  return {
    sma20,
    sma50,
    sma200,
    ema9,
    ema21,
    rsi14,
    macd: macdResult,
    bollinger,
    pivots,
    signals: {
      trendPrimary,
      trendMedium,
      goldenCross,
      deathCross,
      rsiStatus,
      macdCross,
      bollingerStatus,
      technicalScore: finalScore,
      overallSignal,
    },
  };
}

// ----------------------------------------------------------------------------
// 2. MODELOS DE VALORACIÓN INTRÍNSECA (DCF, PETER LYNCH, GRAHAM)
// ----------------------------------------------------------------------------

export interface DCFResult {
  fairValue: number;
  marginOfSafety: number; // porcentaje positivo = descuento / infravalorado
  projectedFCFs: number[];
  presentValueFCFs: number;
  terminalValue: number;
  presentValueTerminal: number;
  enterpriseValue: number;
  equityValue: number;
  verdict: 'Gran Descuento' | 'Valor Razonable' | 'Sobrevalorada';
}

export function calculateDCF(
  fcfBase: number,
  growthRate5Y: number, // ej: 0.10 (10%)
  terminalGrowthRate: number, // ej: 0.025 (2.5%)
  waccDiscountRate: number, // ej: 0.09 (9%)
  sharesOutstanding: number,
  netDebt: number,
  currentPrice: number
): DCFResult | null {
  if (fcfBase <= 0 || sharesOutstanding <= 0 || waccDiscountRate <= terminalGrowthRate) {
    return null;
  }

  const projectedFCFs: number[] = [];
  let pvFCFs = 0;
  let lastFCF = fcfBase;

  for (let year = 1; year <= 5; year++) {
    lastFCF = lastFCF * (1 + growthRate5Y);
    projectedFCFs.push(lastFCF);
    const pv = lastFCF / Math.pow(1 + waccDiscountRate, year);
    pvFCFs += pv;
  }

  // Terminal Value (Gordon Shapiro)
  const terminalFCF = lastFCF * (1 + terminalGrowthRate);
  const terminalValue = terminalFCF / (waccDiscountRate - terminalGrowthRate);
  const pvTerminal = terminalValue / Math.pow(1 + waccDiscountRate, 5);

  const enterpriseValue = pvFCFs + pvTerminal;
  const equityValue = enterpriseValue - netDebt;
  const fairValue = Math.max(0, equityValue / sharesOutstanding);

  const marginOfSafety = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  let verdict: 'Gran Descuento' | 'Valor Razonable' | 'Sobrevalorada' = 'Valor Razonable';
  if (marginOfSafety >= 20) verdict = 'Gran Descuento';
  else if (marginOfSafety <= -15) verdict = 'Sobrevalorada';

  return {
    fairValue: Number(fairValue.toFixed(2)),
    marginOfSafety: Number(marginOfSafety.toFixed(1)),
    projectedFCFs: projectedFCFs.map(v => Math.round(v)),
    presentValueFCFs: Math.round(pvFCFs),
    terminalValue: Math.round(terminalValue),
    presentValueTerminal: Math.round(pvTerminal),
    enterpriseValue: Math.round(enterpriseValue),
    equityValue: Math.round(equityValue),
    verdict,
  };
}

export function calculatePeterLynchFairValue(eps: number | null, growthRate: number | null): number | null {
  if (eps == null || eps <= 0) return null;
  // Crecimiento normalizado entre 12% y 25% para evitar múltiplos extremos
  const g = growthRate != null ? Math.min(30, Math.max(12, growthRate * 100)) : 15;
  return Number((eps * g).toFixed(2));
}

export function calculateGrahamNumber(eps: number | null, bookValuePerShare: number | null): number | null {
  if (eps == null || bookValuePerShare == null || eps <= 0 || bookValuePerShare <= 0) {
    return null;
  }
  const product = 22.5 * eps * bookValuePerShare;
  return Number(Math.sqrt(product).toFixed(2));
}

// ----------------------------------------------------------------------------
// 3. PIOTROSKI F-SCORE (0 A 9 PUNTOS)
// ----------------------------------------------------------------------------

export interface PiotroskiBreakdown {
  score: number;
  details: Array<{
    category: 'Rentabilidad' | 'Apalancamiento/Liquidez' | 'Eficiencia';
    name: string;
    passed: boolean;
    explanation: string;
  }>;
  quality: 'Excelente' | 'Aceptable' | 'Débil';
}

export function calculatePiotroskiScore(data: any): PiotroskiBreakdown {
  const fin = data.financialData || {};
  const stats = data.defaultKeyStatistics || {};
  const incomeHist = data.incomeStatementHistory?.incomeStatementHistory || [];
  const cashflowHist = data.cashflowStatementHistory?.cashflowStatementHistory || [];
  const balanceHist = data.balanceSheetHistory?.balanceSheetStatements || [];

  const details: PiotroskiBreakdown['details'] = [];
  let score = 0;

  // Helper safe pick
  const pick = (obj: any): number | null => {
    if (obj == null) return null;
    if (typeof obj === 'number') return obj;
    if (typeof obj?.raw === 'number') return obj.raw;
    return null;
  };

  // 1. ROA > 0
  const roa = pick(fin.returnOnAssets);
  const p1 = roa != null && roa > 0;
  if (p1) score++;
  details.push({
    category: 'Rentabilidad',
    name: 'Retorno sobre Activos (ROA) positivo',
    passed: p1,
    explanation: `ROA reportado: ${roa != null ? (roa * 100).toFixed(1) + '%' : 'N/D'}. Genera beneficio positivo con sus activos.`,
  });

  // 2. CFO > 0 (Flujo de Caja Operativo positivo)
  const ocf = pick(fin.operatingCashflow) ?? pick(cashflowHist[0]?.totalCashFromOperatingActivities);
  const p2 = ocf != null && ocf > 0;
  if (p2) score++;
  details.push({
    category: 'Rentabilidad',
    name: 'Flujo de caja operativo (CFO) positivo',
    passed: p2,
    explanation: `CFO reportado: ${ocf != null ? (ocf / 1e9).toFixed(2) + 'B' : 'N/D'}. La actividad principal genera caja líquida.`,
  });

  // 3. Delta ROA > 0 (Crecimiento anual de ROA)
  const netIncome0 = pick(incomeHist[0]?.netIncome);
  const netIncome1 = pick(incomeHist[1]?.netIncome);
  const assets0 = pick(balanceHist[0]?.totalAssets);
  const assets1 = pick(balanceHist[1]?.totalAssets);
  let p3 = false;
  if (netIncome0 && netIncome1 && assets0 && assets1) {
    const roa0 = netIncome0 / assets0;
    const roa1 = netIncome1 / assets1;
    p3 = roa0 > roa1;
  } else {
    p3 = (pick(fin.earningsGrowth) ?? 0) > 0;
  }
  if (p3) score++;
  details.push({
    category: 'Rentabilidad',
    name: 'Mejora interanual en ROA (ΔROA > 0)',
    passed: p3,
    explanation: p3 ? 'La productividad del activo ha aumentado respecto al ejercicio anterior.' : 'El rendimiento de activos no ha mejorado.',
  });

  // 4. Calidad de beneficios: CFO > Beneficio Neto
  let p4 = false;
  if (ocf != null && netIncome0 != null) {
    p4 = ocf > netIncome0;
  } else {
    p4 = (pick(fin.freeCashflow) ?? 0) > 0;
  }
  if (p4) score++;
  details.push({
    category: 'Rentabilidad',
    name: 'Calidad de beneficios (CFO > Beneficio Neto)',
    passed: p4,
    explanation: p4 ? 'El flujo de caja supera el beneficio contable (baja manipulación por devengos).' : 'Beneficio contable superior al flujo de caja.',
  });

  // 5. Apalancamiento a LP: Reducción de deuda a largo plazo
  const ltDebt0 = pick(balanceHist[0]?.longTermDebt);
  const ltDebt1 = pick(balanceHist[1]?.longTermDebt);
  let p5 = false;
  if (ltDebt0 != null && ltDebt1 != null) {
    p5 = ltDebt0 <= ltDebt1;
  } else {
    const dte = pick(fin.debtToEquity);
    p5 = dte != null && dte < 1.5;
  }
  if (p5) score++;
  details.push({
    category: 'Apalancamiento/Liquidez',
    name: 'Control o reducción de deuda a largo plazo',
    passed: p5,
    explanation: p5 ? 'La ratio de endeudamiento a largo plazo se ha reducido o mantenido sana.' : 'La deuda a largo plazo ha aumentado.',
  });

  // 6. Liquidez: Mejora de Current Ratio
  const curRatio = pick(fin.currentRatio);
  const p6 = curRatio != null && curRatio >= 1.2;
  if (p6) score++;
  details.push({
    category: 'Apalancamiento/Liquidez',
    name: 'Current Ratio solvente (> 1.2x)',
    passed: p6,
    explanation: `Ratio de liquidez corriente actual: ${curRatio != null ? curRatio.toFixed(2) : 'N/D'}x.`,
  });

  // 7. No dilución de acciones ordinarias
  const shares0 = pick(stats.sharesOutstanding);
  const shares1 = pick(stats.sharesOutstandingPrevYear) ?? shares0;
  let p7 = true;
  if (shares0 && shares1 && shares1 > 0) {
    p7 = shares0 <= shares1 * 1.02; // Permite un margen mínimo del 2%
  }
  if (p7) score++;
  details.push({
    category: 'Apalancamiento/Liquidez',
    name: 'Sin dilución de acciones (o recompras netas)',
    passed: p7,
    explanation: p7 ? 'No ha emitido volumen material de nuevas acciones que diluyan al inversor.' : 'Se detecta emisión o dilución de acciones.',
  });

  // 8. Margen Bruto: Mejora interanual
  const gross0 = pick(incomeHist[0]?.grossProfit);
  const rev0 = pick(incomeHist[0]?.totalRevenue);
  const gross1 = pick(incomeHist[1]?.grossProfit);
  const rev1 = pick(incomeHist[1]?.totalRevenue);
  let p8 = false;
  if (gross0 && rev0 && gross1 && rev1) {
    p8 = gross0 / rev0 >= gross1 / rev1;
  } else {
    p8 = (pick(fin.grossMargins) ?? 0) >= 0.35;
  }
  if (p8) score++;
  details.push({
    category: 'Eficiencia',
    name: 'Expansión o solidez del Margen Bruto',
    passed: p8,
    explanation: p8 ? 'Poder de fijación de precios y ventaja competitiva sostenida.' : 'Contracción en el margen bruto comercial.',
  });

  // 9. Rotación de Activos: Mejora en eficiencia
  let p9 = false;
  if (rev0 && assets0 && rev1 && assets1) {
    p9 = rev0 / assets0 >= rev1 / assets1;
  } else {
    p9 = (pick(fin.revenueGrowth) ?? 0) > 0;
  }
  if (p9) score++;
  details.push({
    category: 'Eficiencia',
    name: 'Mejora en Rotación de Activos (Ventas / Activos)',
    passed: p9,
    explanation: p9 ? 'Capacidad de generar mayores ingresos por cada euro invertido en activos.' : 'Menor rotación de activos que el ejercicio previo.',
  });

  let quality: PiotroskiBreakdown['quality'] = 'Aceptable';
  if (score >= 7) quality = 'Excelente';
  else if (score <= 4) quality = 'Débil';

  return { score, details, quality };
}

// ----------------------------------------------------------------------------
// 4. ALTMAN Z-SCORE (SOLVENCIA Y RIESGO DE QUIEBRA)
// ----------------------------------------------------------------------------

export interface AltmanZResult {
  score: number;
  zone: 'Segura' | 'Gris' | 'Dificultad';
  explanation: string;
  notApplicable?: boolean;
}

export function calculateAltmanZScore(data: any): AltmanZResult | null {
  const profile = data.assetProfile || {};
  const sector = profile.sector || '';

  // 1. Altman Z-Score NO es aplicable a Bancos ni Entidades Financieras
  if (sector.toLowerCase().includes('financial') || sector.toLowerCase().includes('financier')) {
    return {
      score: 0,
      zone: 'Gris',
      explanation: 'El Altman Z-Score no es metodológicamente aplicable a entidades bancarias/financieras por su regulación y estructura de reservas/depósitos.',
      notApplicable: true,
    };
  }

  const fin = data.financialData || {};
  const stats = data.defaultKeyStatistics || {};
  const sum = data.summaryDetail || {};
  const balanceHist = data.balanceSheetHistory?.balanceSheetStatements || [];
  const incomeHist = data.incomeStatementHistory?.incomeStatementHistory || [];

  const pick = (obj: any): number | null => {
    if (obj == null) return null;
    if (typeof obj === 'number') return obj;
    if (typeof obj?.raw === 'number') return obj.raw;
    return null;
  };

  const rawAssets = pick(balanceHist[0]?.totalAssets);
  // Si no hay balance auditado con activos válidos, no calcular Z-Score
  if (!rawAssets || rawAssets < 100000) {
    return null;
  }
  const totalAssets = rawAssets;

  const currentAssets = pick(balanceHist[0]?.totalCurrentAssets) ?? (totalAssets * 0.4);
  const currentLiabilities = pick(balanceHist[0]?.totalCurrentLiabilities) ?? (totalAssets * 0.3);
  const workingCapital = currentAssets - currentLiabilities;

  const retainedEarnings = pick(balanceHist[0]?.retainedEarnings) ?? (totalAssets * 0.2);
  const ebit = pick(incomeHist[0]?.operatingIncome) ?? pick(fin.ebitda) ?? (totalAssets * 0.08);
  const marketCap = pick(sum.marketCap) ?? pick(stats.enterpriseValue) ?? (totalAssets * 0.5);
  const rawLiab = pick(balanceHist[0]?.totalLiab) ?? pick(fin.totalDebt);
  const totalLiabilities = rawLiab && rawLiab > 1000 ? rawLiab : (totalAssets * 0.5);
  const sales = pick(incomeHist[0]?.totalRevenue) ?? pick(fin.totalRevenue) ?? totalAssets;

  const X1 = workingCapital / totalAssets;
  const X2 = retainedEarnings / totalAssets;
  const X3 = ebit / totalAssets;
  const X4 = marketCap / totalLiabilities;
  const X5 = sales / totalAssets;

  const rawZ = 1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * X4 + 0.999 * X5;
  // Acotar matemáticamente para evitar artefactos
  const clampedZ = Math.max(-15, Math.min(50, rawZ));
  const score = Number(clampedZ.toFixed(2));

  let zone: AltmanZResult['zone'] = 'Gris';
  let explanation = '';

  if (score >= 2.99) {
    zone = 'Segura';
    explanation = 'Solvencia financiera óptima. Riesgo de insolvencia o quiebra insignificante.';
  } else if (score >= 1.81) {
    zone = 'Gris';
    explanation = 'Rango intermedio. Solvencia aceptable pero sensible a contracciones del ciclo macroeconómico.';
  } else {
    zone = 'Dificultad';
    explanation = 'Zona de peligro. Estructura de capital muy apalancada con riesgo financiero relevante.';
  }

  return { score, zone, explanation, notApplicable: false };
}

// ----------------------------------------------------------------------------
// 5. DESCOMPOSICIÓN DUPONT (ROE 3 FASES)
// ----------------------------------------------------------------------------

export interface DuPontBreakdown {
  roe: number;
  netMargin: number; // Beneficio Neto / Ventas
  assetTurnover: number; // Ventas / Activos
  equityMultiplier: number; // Activos / Patrimonio Neto
  narrative: string;
}

export function calculateDuPont(data: any): DuPontBreakdown | null {
  const fin = data.financialData || {};
  const balanceHist = data.balanceSheetHistory?.balanceSheetStatements || [];
  const incomeHist = data.incomeStatementHistory?.incomeStatementHistory || [];

  const pick = (obj: any): number | null => {
    if (obj == null) return null;
    if (typeof obj === 'number') return obj;
    if (typeof obj?.raw === 'number') return obj.raw;
    return null;
  };

  const netIncome = pick(incomeHist[0]?.netIncome) ?? pick(fin.profitMargins) != null ? (pick(fin.profitMargins)! * (pick(fin.totalRevenue) ?? 1)) : null;
  const sales = pick(incomeHist[0]?.totalRevenue) ?? pick(fin.totalRevenue);
  const totalAssets = pick(balanceHist[0]?.totalAssets);
  const equity = pick(balanceHist[0]?.totalStockholderEquity);

  if (!netIncome || !sales || !totalAssets || !equity || sales <= 0 || totalAssets <= 0 || equity <= 0) {
    const rawRoe = pick(fin.returnOnEquity);
    const rawMargin = pick(fin.profitMargins);
    if (rawRoe != null && rawMargin != null) {
      return {
        roe: Number((rawRoe * 100).toFixed(1)),
        netMargin: Number((rawMargin * 100).toFixed(1)),
        assetTurnover: 0.8,
        equityMultiplier: Number((rawRoe / (rawMargin * 0.8)).toFixed(2)),
        narrative: 'Estimación basada en márgenes y apalancamiento directo.',
      };
    }
    return null;
  }

  const netMargin = (netIncome / sales) * 100;
  const assetTurnover = sales / totalAssets;
  const equityMultiplier = totalAssets / equity;
  const roe = (netMargin * assetTurnover * equityMultiplier);

  let narrative = '';
  if (equityMultiplier > 4) {
    narrative = 'La rentabilidad (ROE) está fuertemente impulsada por apalancamiento financiero.';
  } else if (netMargin > 20) {
    narrative = 'Excelente poder de fijación de precios y ventajas competitivas (Moat) lideran el ROE.';
  } else {
    narrative = 'Modelo eficiente de alta rotación de inventario y activos.';
  }

  return {
    roe: Number(roe.toFixed(1)),
    netMargin: Number(netMargin.toFixed(1)),
    assetTurnover: Number(assetTurnover.toFixed(2)),
    equityMultiplier: Number(equityMultiplier.toFixed(2)),
    narrative,
  };
}

// ----------------------------------------------------------------------------
// 6. RADAR SNOWFLAKE DE 5 EJES & ALPHA SCORE INSTITUCIONAL
// ----------------------------------------------------------------------------

export interface SnowflakeScores {
  value: number; // 0 - 100
  growth: number; // 0 - 100
  performance: number; // 0 - 100
  health: number; // 0 - 100
  momentum: number; // 0 - 100
  alphaScore: number; // 0 - 100 Global
  verdict: 'Fuerte Compra' | 'Compra Atractiva' | 'Neutral' | 'Precaución' | 'Sobrevalorada';
}

export function computeSnowflake(
  quoteData: any,
  technicalScore: number,
  dcfResult: DCFResult | null
): SnowflakeScores {
  const fin = quoteData.financialData || {};
  const stats = quoteData.defaultKeyStatistics || {};
  const sum = quoteData.summaryDetail || {};

  const pick = (obj: any): number | null => {
    if (obj == null) return null;
    if (typeof obj === 'number') return obj;
    if (typeof obj?.raw === 'number') return obj.raw;
    return null;
  };

  // 1. Eje Valor (P/E, Forward P/E, PEG, DCF discount)
  let valScore = 50;
  const pe = pick(sum.trailingPE);
  const fwdPe = pick(stats.forwardPE);
  const peg = pick(stats.pegRatio);

  if (pe != null) {
    if (pe < 15) valScore += 20;
    else if (pe < 25) valScore += 10;
    else if (pe > 45) valScore -= 20;
  }
  if (fwdPe != null && pe != null && fwdPe < pe) valScore += 10;
  if (peg != null && peg > 0) {
    if (peg < 1.2) valScore += 15;
    else if (peg > 2.5) valScore -= 10;
  }
  if (dcfResult) {
    if (dcfResult.marginOfSafety > 15) valScore += 15;
    else if (dcfResult.marginOfSafety < -20) valScore -= 15;
  }
  const value = Math.max(10, Math.min(95, valScore));

  // 2. Eje Crecimiento (Rev Growth, Earnings Growth)
  let grScore = 50;
  const revGr = pick(fin.revenueGrowth);
  const earnGr = pick(fin.earningsGrowth);
  if (revGr != null) {
    if (revGr > 0.20) grScore += 25;
    else if (revGr > 0.08) grScore += 15;
    else if (revGr < 0) grScore -= 20;
  }
  if (earnGr != null) {
    if (earnGr > 0.20) grScore += 20;
    else if (earnGr > 0.05) grScore += 10;
    else if (earnGr < -0.10) grScore -= 20;
  }
  const growth = Math.max(10, Math.min(95, grScore));

  // 3. Eje Rendimiento Pasado / Calidad (ROE, ROA, Margen Neto, Margen FCF)
  let perfScore = 50;
  const roe = pick(fin.returnOnEquity);
  const roa = pick(fin.returnOnAssets);
  const netM = pick(fin.profitMargins);
  if (roe != null) {
    if (roe > 0.25) perfScore += 25;
    else if (roe > 0.12) perfScore += 15;
    else if (roe < 0.04) perfScore -= 15;
  }
  if (netM != null) {
    if (netM > 0.20) perfScore += 15;
    else if (netM < 0.05) perfScore -= 15;
  }
  if (roa != null && roa > 0.08) perfScore += 10;
  const performance = Math.max(10, Math.min(95, perfScore));

  // 4. Eje Salud Financiera (Current ratio, D/E, Deuda Neta / EBITDA)
  let hlthScore = 50;
  const dte = pick(fin.debtToEquity);
  const curR = pick(fin.currentRatio);
  const cash = pick(fin.totalCash) ?? 0;
  const debt = pick(fin.totalDebt) ?? 0;

  if (curR != null) {
    if (curR >= 1.5) hlthScore += 15;
    else if (curR < 0.9) hlthScore -= 20;
  }
  if (dte != null) {
    const dteRatio = dte > 5 ? dte / 100 : dte;
    if (dteRatio < 0.5) hlthScore += 20;
    else if (dteRatio > 2.0) hlthScore -= 25;
  }
  if (cash > debt) hlthScore += 15; // Caja neta
  const health = Math.max(10, Math.min(95, hlthScore));

  // 5. Eje Momentum Técnico
  const momentum = Math.max(10, Math.min(95, technicalScore));

  // Puntuación Alpha Global Ponderada
  const alphaScore = Math.round(
    value * 0.25 +
    growth * 0.20 +
    performance * 0.20 +
    health * 0.20 +
    momentum * 0.15
  );

  let verdict: SnowflakeScores['verdict'] = 'Neutral';
  if (alphaScore >= 80) verdict = 'Fuerte Compra';
  else if (alphaScore >= 66) verdict = 'Compra Atractiva';
  else if (alphaScore <= 35) verdict = 'Sobrevalorada';
  else if (alphaScore <= 49) verdict = 'Precaución';

  return {
    value,
    growth,
    performance,
    health,
    momentum,
    alphaScore,
    verdict,
  };
}
