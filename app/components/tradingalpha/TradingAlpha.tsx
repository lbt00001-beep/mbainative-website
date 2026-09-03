"use client";

import React, { useState, useEffect, useCallback } from 'react';
import CandleChart from './CandleChart';
import SnowflakeRadar from './SnowflakeRadar';
import DCFSimulator from './DCFSimulator';
import StatementsDuPont from './StatementsDuPont';
import SentimentPulse, { SentimentData } from './SentimentPulse';
import HelpGuide from './HelpGuide';
import SettingsPanel, { AVAILABLE_MODELS } from './SettingsPanel';
import {
  CandleBar,
  TechnicalSummary,
  computeTechnicalIndicators,
  calculateDCF,
  calculatePiotroskiScore,
  calculateAltmanZScore,
  calculateDuPont,
  computeSnowflake,
  SnowflakeScores,
  DCFResult,
  PiotroskiBreakdown,
  AltmanZResult,
  DuPontBreakdown,
} from './financialEngine';

const QUICK_TICKERS = [
  { symbol: 'AAPL', label: 'Apple' },
  { symbol: 'MSFT', label: 'Microsoft' },
  { symbol: 'NVDA', label: 'Nvidia' },
  { symbol: 'GOOGL', label: 'Alphabet' },
  { symbol: 'AMZN', label: 'Amazon' },
  { symbol: 'META', label: 'Meta' },
  { symbol: 'TSLA', label: 'Tesla' },
  { symbol: 'ASML', label: 'ASML' },
  { symbol: 'ITX.MC', label: 'Inditex' },
  { symbol: 'SAN.MC', label: 'Santander' },
  { symbol: 'SPY', label: 'S&P 500' },
  { symbol: 'QQQ', label: 'Nasdaq' },
];

function parseReportSections(text: string) {
  if (!text) return [];
  // Si el informe contiene la sección formal ### 1., descartar cualquier preludio o borrador previo
  const firstSectionIdx = text.indexOf('### 1.');
  const sanitizedText = firstSectionIdx !== -1 ? text.slice(firstSectionIdx) : text;
  const parts = sanitizedText.split(/(?=###\s+)/g);
  return parts
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return null;
      const lines = trimmed.split('\n');
      const firstLine = lines[0] || '';
      const isHeader = firstLine.startsWith('###');
      const title = isHeader ? firstLine.replace(/^###\s*/, '').trim() : '';
      const body = isHeader ? lines.slice(1).join('\n').trim() : trimmed;
      return { title, body };
    })
    .filter(Boolean) as Array<{ title: string; body: string }>;
}

export default function TradingAlpha() {
  const [ticker, setTicker] = useState<string>('AAPL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [range, setRange] = useState<string>('1y');
  const [activeTab, setActiveTab] = useState<'summary' | 'technical' | 'valuation' | 'statements' | 'sentiment' | 'aiReport' | 'help' | 'settings' | 'legal'>('summary');

  // Settings & Custom OpenRouter Key
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('z-ai/glm-5.3-flash');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('tradingalpha_openrouter_key');
      const savedModel = localStorage.getItem('tradingalpha_model');
      if (savedKey) setUserApiKey(savedKey);
      if (savedModel) setSelectedModel(savedModel);
    }
  }, []);

  const currentModelInfo = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  // API Data states
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [chartBars, setChartBars] = useState<CandleBar[]>([]);
  const [currency, setCurrency] = useState<string>('$');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'warn' | 'error'; text: string } | null>(null);

  // Sentiment State
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false);

  // AI Report State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Safe helper
  const pick = (obj: any): number | null => {
    if (obj == null) return null;
    if (typeof obj === 'number') return obj;
    if (typeof obj?.raw === 'number') return obj.raw;
    return null;
  };

  // 1. Fetch Chart Data (OHLCV)
  const loadChartData = useCallback(async (t: string, r: string) => {
    try {
      setIsLoadingChart(true);
      const res = await fetch(`/api/stockChart?t=${encodeURIComponent(t)}&range=${r}`);
      if (!res.ok) {
        throw new Error(`Chart HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.bars && Array.isArray(data.bars)) {
        setChartBars(data.bars);
        if (data.currency) setCurrency(data.currency === 'EUR' ? '€' : '$');
      }
    } catch (e: any) {
      console.error('Error fetching chart:', e);
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  // 2. Fetch Fundamental Quote Summary Data
  const loadQuoteSummary = useCallback(async (t: string) => {
    try {
      setIsLoadingQuote(true);
      setStatusMsg(null);
      const modules = [
        'price',
        'summaryDetail',
        'defaultKeyStatistics',
        'financialData',
        'assetProfile',
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
        'recommendationTrend',
      ];
      const res = await fetch(`/api/quoteSummary?t=${encodeURIComponent(t)}&modules=${modules.join(',')}`);
      if (!res.ok) {
        throw new Error(`Quote HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.data) {
        setQuoteData(json.data);
        setStatusMsg({ type: 'ok', text: `Datos de ${t} cargados con éxito.` });
      } else {
        throw new Error('No se recibieron datos de Yahoo Finance.');
      }
    } catch (e: any) {
      console.error('Error fetching quote:', e);
      setStatusMsg({
        type: 'error',
        text: `No se pudieron cargar datos para ${t}. Revisa el ticker o prueba con otro símbolo.`,
      });
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  // 3. Fetch Sentiment & News Data
  const loadSentimentData = useCallback(async (t: string, comp?: string) => {
    try {
      setIsLoadingSentiment(true);
      const url = `/api/stockSentiment?t=${encodeURIComponent(t)}${comp ? `&company=${encodeURIComponent(comp)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Sentiment HTTP ${res.status}`);
      const json = await res.json();
      setSentimentData(json);
    } catch (e) {
      console.error('Error fetching sentiment:', e);
    } finally {
      setIsLoadingSentiment(false);
    }
  }, []);

  // On ticker change
  useEffect(() => {
    loadQuoteSummary(ticker);
    loadChartData(ticker, range);
    loadSentimentData(ticker);
    setAiReport(null);
  }, [ticker, loadQuoteSummary, loadChartData, loadSentimentData]);

  // On range change
  const handleRangeChange = (newRange: string) => {
    setRange(newRange);
    loadChartData(ticker, newRange);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (clean) {
      setTicker(clean);
      setSearchInput('');
    }
  };

  // Quantitative Calculations
  const technicalSummary: TechnicalSummary = React.useMemo(() => {
    return computeTechnicalIndicators(chartBars);
  }, [chartBars]);

  const profile = quoteData?.assetProfile || {};
  const fin = quoteData?.financialData || {};
  const stats = quoteData?.defaultKeyStatistics || {};
  const sum = quoteData?.summaryDetail || {};
  const priceObj = quoteData?.price || {};

  const currentPrice = pick(priceObj.regularMarketPrice) || pick(fin.currentPrice) || (chartBars.length > 0 ? chartBars[chartBars.length - 1].close : 0);
  const regularMarketChange = pick(priceObj.regularMarketChange) ?? 0;
  const regularMarketChangePercent = (pick(priceObj.regularMarketChangePercent) ?? 0) * 100;
  const companyName = priceObj.shortName || priceObj.longName || ticker;
  const sector = profile.sector || 'N/D';
  const industry = profile.industry || 'N/D';

  const fcfBase = pick(fin.freeCashflow) ?? (pick(fin.totalRevenue) ? (pick(fin.totalRevenue)! * 0.15) : 1e9);
  const sharesOutstanding = pick(stats.sharesOutstanding) ?? 1e9;
  const totalDebt = pick(fin.totalDebt) ?? 0;
  const totalCash = pick(fin.totalCash) ?? 0;
  const netDebt = totalDebt - totalCash;
  const eps = pick(stats.trailingEps) ?? pick(stats.forwardEps);
  const bookValue = pick(stats.bookValue);

  const dcfResult: DCFResult | null = React.useMemo(() => {
    if (!currentPrice || currentPrice <= 0) return null;
    return calculateDCF(
      fcfBase,
      pick(fin.revenueGrowth) ?? 0.10,
      0.025,
      0.09,
      sharesOutstanding,
      netDebt,
      currentPrice
    );
  }, [fcfBase, currentPrice, sharesOutstanding, netDebt, fin.revenueGrowth]);

  const piotroski: PiotroskiBreakdown = React.useMemo(() => {
    if (!quoteData) return { score: 5, details: [], quality: 'Aceptable' };
    return calculatePiotroskiScore(quoteData);
  }, [quoteData]);

  const altmanZ: AltmanZResult | null = React.useMemo(() => {
    if (!quoteData) return null;
    return calculateAltmanZScore(quoteData);
  }, [quoteData]);

  const dupont: DuPontBreakdown | null = React.useMemo(() => {
    if (!quoteData) return null;
    return calculateDuPont(quoteData);
  }, [quoteData]);

  const snowflakeScores: SnowflakeScores = React.useMemo(() => {
    if (!quoteData) {
      return {
        value: 50,
        growth: 50,
        performance: 50,
        health: 50,
        momentum: technicalSummary.signals.technicalScore,
        alphaScore: 50,
        verdict: 'Neutral',
      };
    }
    return computeSnowflake(quoteData, technicalSummary.signals.technicalScore, dcfResult);
  }, [quoteData, technicalSummary, dcfResult]);

  // AI Report Generator (Gemini 3.5 Flash Lite via OpenRouter)
  const generateAiReport = async () => {
    try {
      setIsGeneratingAi(true);
      const payload = {
        ticker,
        companyName,
        sector,
        price: currentPrice.toFixed(2),
        currency,
        marketCap: pick(sum.marketCap) ? `$${(pick(sum.marketCap)! / 1e9).toFixed(2)}B` : 'N/D',
        alphaScore: snowflakeScores.alphaScore,
        fundamentalScore: Math.round((snowflakeScores.value + snowflakeScores.health + snowflakeScores.performance) / 3),
        technicalScore: technicalSummary.signals.technicalScore,
        piotroski: piotroski.score,
        altmanZ: altmanZ?.score,
        dcfFairValue: dcfResult?.fairValue,
        marginOfSafety: dcfResult?.marginOfSafety,
        rsi: technicalSummary.rsi14,
        macdSignal: technicalSummary.signals.macdCross,
        trend50_200: technicalSummary.signals.trendPrimary,
        pe: pick(sum.trailingPE)?.toFixed(1),
        fwdPe: pick(stats.forwardPE)?.toFixed(1),
        fcfYield: fcfBase && currentPrice && sharesOutstanding ? ((fcfBase / (currentPrice * sharesOutstanding)) * 100).toFixed(1) : null,
        netMargin: pick(fin.profitMargins) ? (pick(fin.profitMargins)! * 100).toFixed(1) : null,
        roe: pick(fin.returnOnEquity) ? (pick(fin.returnOnEquity)! * 100).toFixed(1) : null,
        debtToEquity: pick(fin.debtToEquity)?.toFixed(1),
        nsi: sentimentData?.nsi,
        sentimentLabel: sentimentData?.nsiLabel,
        topHeadlines: sentimentData?.articles.slice(0, 5).map(a => `${a.title} (${a.publisher})`).join('; '),
        userApiKey: userApiKey && userApiKey.trim() ? userApiKey.trim() : undefined,
        model: selectedModel,
      };

      const res = await fetch('/api/aiAnalysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'MISSING_OPENROUTER_KEY') {
          setAiReport(`🔒 Clave de OpenRouter no configurada\n\nPara generar tesis automáticas de inversión con Inteligencia Artificial, necesitas ingresar tu clave personal de OpenRouter en la pestaña "⚙️ Ajustes & Conectores".\n\n1. Ve a la pestaña "⚙️ Ajustes & Conectores" en el menú superior.\n2. Introduce tu clave privada (formato sk-or-v1-...).\n3. Haz clic en "Guardar Clave" (se guardará de forma segura y privada únicamente en tu navegador).\n4. Vuelve a esta pestaña y haz clic en "Generar Informe Ahora".`);
          return;
        }
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setAiReport(data.report || 'No se pudo generar el contenido del informe.');
    } catch (err: any) {
      console.error('Error generating AI report:', err);
      setAiReport(`Error al conectar con el motor de IA: ${err.message || 'Verifique la clave de OpenRouter'}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Helper 52-Week Progress
  const high52 = pick(sum.fiftyTwoWeekHigh);
  const low52 = pick(sum.fiftyTwoWeekLow);
  const pos52 = high52 && low52 && high52 > low52 ? Math.min(100, Math.max(0, ((currentPrice - low52) / (high52 - low52)) * 100)) : 50;

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6 print:p-0 print:m-0 print:bg-white print:text-slate-900 print:min-h-0">
      {/* 1. Header & Asset Selector Bar */}
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 shadow-2xl space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <h1 className="text-2xl font-black tracking-tight text-white">
                TradingAlpha <span className="text-blue-500 font-normal">Inversiones</span>
              </h1>
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Suite Institucional Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Terminal unificado de Análisis Fundamental Cuantitativo y Análisis Técnico Algorítmico
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar ticker (ej. AAPL, NVDA, ITX.MC)..."
                className="bg-[#141d30] text-sm text-white placeholder-slate-500 px-4 py-2 rounded-xl border border-[#223048] focus:outline-none focus:border-blue-500 w-64 uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              Analizar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('help')}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ml-1"
            >
              <span>🎓</span> Guía de Ayuda
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="bg-[#141d30] hover:bg-[#1a253c] text-slate-300 border border-[#223048] text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ml-1"
            >
              <span>⚙️</span> Ajustes
            </button>
          </form>
        </div>

        {/* Quick Ticker Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Rápidos:</span>
          {QUICK_TICKERS.map((item) => (
            <button
              key={item.symbol}
              onClick={() => setTicker(item.symbol)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                ticker === item.symbol
                  ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-md shadow-blue-600/30'
                  : 'bg-[#141d30] text-slate-400 border-[#223048] hover:text-white hover:bg-[#1a253c]'
              }`}
            >
              {item.symbol} <span className="text-[10px] text-slate-500 font-sans">({item.label})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status Alert (if any) */}
      {statusMsg && (
        <div
          className={`text-xs px-4 py-2.5 rounded-xl border flex items-center justify-between ${
            statusMsg.type === 'error'
              ? 'bg-rose-950/30 text-rose-300 border-rose-500/40'
              : 'bg-blue-950/30 text-blue-300 border-blue-500/40'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white ml-3">✕</button>
        </div>
      )}

      {/* 2. Real-Time Hero Header & Quote Strip */}
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Company Title & Price */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black font-mono text-white tracking-wide">{ticker}</span>
              <span className="text-base font-semibold text-slate-300">{companyName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1e293b] text-slate-300 border border-[#2e3e58]">
                {sector}
              </span>
            </div>

            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {currency}{currentPrice.toFixed(2)}
              </span>
              <span
                className={`text-sm font-bold px-2.5 py-0.5 rounded-lg font-mono ${
                  regularMarketChange >= 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {regularMarketChange >= 0 ? '+' : ''}
                {regularMarketChange.toFixed(2)} ({regularMarketChangePercent >= 0 ? '+' : ''}
                {regularMarketChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* 52-Week Range Bar */}
          <div className="lg:w-72 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Mín 52S: {currency}{low52?.toFixed(2) ?? '—'}</span>
              <span>Máx 52S: {currency}{high52?.toFixed(2) ?? '—'}</span>
            </div>
            <div className="h-2.5 bg-[#162032] rounded-full overflow-hidden relative border border-[#27354f]">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                style={{ width: `${pos52}%` }}
              ></div>
            </div>
            <div className="text-right text-[10px] text-slate-500 font-mono">
              Posición: {pos52.toFixed(0)}% del rango anual
            </div>
          </div>

          {/* Key Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Cap. Bursátil</div>
              <div className="font-bold text-white mt-0.5">
                {pick(sum.marketCap) ? `$${(pick(sum.marketCap)! / 1e9).toFixed(2)}B` : '—'}
              </div>
            </div>
            <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
              <div className="text-slate-400 text-[10px] uppercase font-sans">PER (TTM)</div>
              <div className="font-bold text-white mt-0.5">{pick(sum.trailingPE)?.toFixed(1) ?? '—'}</div>
            </div>
            <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Beta (1Y)</div>
              <div className="font-bold text-white mt-0.5">{pick(sum.beta)?.toFixed(2) ?? '1.00'}</div>
            </div>
            <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
              <div className="text-slate-400 text-[10px] uppercase font-sans">BPA / EPS</div>
              <div className="font-bold text-emerald-400 mt-0.5">{eps ? `${currency}${eps.toFixed(2)}` : '—'}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#1e293b] pt-4 mt-6 print:hidden">
          {[
            { id: 'summary', label: '📊 Resumen & Radar Cuantitativo', icon: '📊' },
            { id: 'technical', label: '📈 Terminal Técnico & Velas', icon: '📈' },
            { id: 'valuation', label: '💎 Valoración Intrínseca (DCF)', icon: '💎' },
            { id: 'statements', label: '📑 Estados Financieros & DuPont', icon: '📑' },
            { id: 'sentiment', label: '🧠 Sentimiento & Noticias', icon: '🧠' },
            { id: 'aiReport', label: '🤖 Informe Research con IA', icon: '🤖' },
            { id: 'help', label: '🎓 Guía Didáctica & Conceptos', icon: '🎓' },
            { id: 'settings', label: '⚙️ Ajustes & Conectores', icon: '⚙️' },
            { id: 'legal', label: '⚖️ Salvedad Legal & Riesgos', icon: '⚖️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-[#141d30] text-slate-400 border border-[#223048] hover:text-white hover:bg-[#1a253c]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: RESUMEN & RADAR SNOWFLAKE */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Snowflake Radar & Alpha Score */}
          <div className="lg:col-span-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-between">
            <div className="w-full text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs text-blue-400 font-semibold mb-2">
                Radar de 5 Dimensiones • Huella Cuantitativa
              </div>
              <h3 className="text-xl font-black text-white">Huella Cuantitativa del Activo</h3>
            </div>

            <SnowflakeRadar scores={snowflakeScores} size={300} />

            {/* Alpha Score Big Badge */}
            <div className="w-full bg-[#141d30] border border-[#223048] rounded-2xl p-4 text-center">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Puntuación Alpha Global
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl font-black text-blue-400 font-mono">
                  {snowflakeScores.alphaScore}
                </span>
                <span className="text-slate-500 text-2xl font-mono">/100</span>
              </div>
              <div className="mt-2">
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    snowflakeScores.verdict.includes('Compra')
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : snowflakeScores.verdict === 'Sobrevalorada'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  Veredicto Cuantitativo: {snowflakeScores.verdict}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Dual Health Meters & Highlights */}
          <div className="lg:col-span-7 space-y-6">
            {/* Fundamental vs Technical Dual Meter */}
            <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>⚖️</span> Termómetro Fundamental vs Técnico
              </h3>

              <div className="space-y-4">
                {/* Fundamental Health Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Salud Fundamental & Negocio</span>
                    <span className="text-emerald-400 font-mono">
                      {Math.round((snowflakeScores.value + snowflakeScores.health + snowflakeScores.performance) / 3)}/100
                    </span>
                  </div>
                  <div className="h-3 bg-[#162032] rounded-full overflow-hidden border border-[#27354f]">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.round((snowflakeScores.value + snowflakeScores.health + snowflakeScores.performance) / 3)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Technical Momentum Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Momentum Técnico Algorítmico</span>
                    <span className="text-blue-400 font-mono">{technicalSummary.signals.technicalScore}/100</span>
                  </div>
                  <div className="h-3 bg-[#162032] rounded-full overflow-hidden border border-[#27354f]">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${technicalSummary.signals.technicalScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Pillars Grid con Baremos Calibrados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Margen de Seguridad DCF con Baremo Graham */}
              <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-medium">Margen de Seguridad DCF</span>
                    {dcfResult && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dcfResult.marginOfSafety >= 20 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        dcfResult.marginOfSafety >= 0 ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                        dcfResult.marginOfSafety >= -15 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {dcfResult.marginOfSafety >= 20 ? 'Descuento Alto' : dcfResult.marginOfSafety >= 0 ? 'Descuento Leve' : dcfResult.marginOfSafety >= -15 ? 'Prima Moderada' : 'Sobrevalorada'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-bold font-mono ${
                      !dcfResult ? 'text-white' :
                      dcfResult.marginOfSafety >= 15 ? 'text-emerald-400' :
                      dcfResult.marginOfSafety >= 0 ? 'text-teal-300' :
                      dcfResult.marginOfSafety >= -15 ? 'text-amber-300' :
                      'text-rose-400'
                    }`}>
                      {dcfResult ? `${dcfResult.marginOfSafety > 0 ? '+' : ''}${dcfResult.marginOfSafety}%` : 'N/D'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      (Valor justo: {currency}{dcfResult?.fairValue ?? '—'})
                    </span>
                  </div>
                </div>

                {/* Baremo Visual Calibrado de Margen de Seguridad */}
                <div className="space-y-1 bg-[#101827] p-2.5 rounded-xl border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 font-medium flex justify-between">
                    <span>Baremo Graham:</span>
                    <span className="text-slate-200 font-semibold">
                      {dcfResult ? (
                        dcfResult.marginOfSafety >= 25 ? '🎯 >+25% Excelente margen' :
                        dcfResult.marginOfSafety >= 10 ? '✅ +10% a +25% Favorable' :
                        dcfResult.marginOfSafety >= -10 ? '⚖️ ±10% Precio equilibrado' :
                        dcfResult.marginOfSafety >= -25 ? '⚠️ -10% a -25% Exigida' :
                        '🚨 <-25% Fuerte sobrevaloración'
                      ) : 'Esperando datos'}
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full bg-[#162032] rounded-full overflow-hidden flex">
                    <div className="w-[35%] bg-rose-500/70" title="<-10% Sobrevalorada"></div>
                    <div className="w-[35%] bg-amber-500/70" title="-10% a +20% Rango Justo"></div>
                    <div className="w-[30%] bg-emerald-500/70" title=">+20% Margen Óptimo"></div>
                  </div>
                  {dcfResult && (
                    <div className="relative w-full h-1.5">
                      <div
                        className="absolute -top-1 -ml-1 w-2.5 h-2.5 bg-white border border-slate-900 rounded-full shadow-[0_0_8px_#fff] transition-all"
                        style={{
                          left: `${Math.min(95, Math.max(5, ((dcfResult.marginOfSafety + 50) / 100) * 100))}%`
                        }}
                      ></div>
                    </div>
                  )}
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono pt-0.5">
                    <span>-50% (Cara)</span>
                    <span>0% (Justo)</span>
                    <span>+50% (Ganga)</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Auditoría Piotroski F */}
              <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-medium">Auditoría Piotroski F</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      piotroski.score >= 7 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      piotroski.score >= 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {piotroski.quality}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-emerald-400 font-mono">
                      {piotroski.score}/9
                    </span>
                    <span className="text-[11px] text-slate-400">pruebas superadas</span>
                  </div>
                </div>

                {/* Baremo Piotroski */}
                <div className="space-y-1 bg-[#101827] p-2.5 rounded-xl border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 font-medium flex justify-between">
                    <span>Baremo Chicago:</span>
                    <span className="text-slate-200 font-semibold">
                      {piotroski.score >= 7 ? '⭐ 7-9 Salud contable élite' : piotroski.score >= 5 ? '⚖️ 5-6 Calidad estándar' : '⚠️ 0-4 Debilidad contable'}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#162032] rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-sm ${
                          step <= piotroski.score
                            ? step >= 7
                              ? 'bg-emerald-400'
                              : step >= 5
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                            : 'bg-[#1f2c42]'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono pt-0.5">
                    <span>0 (Riesgo)</span>
                    <span>5 (Media)</span>
                    <span>9 (Máx Calidad)</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Riesgo Quiebra Altman Z con Baremo Canónico */}
              <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-medium">Riesgo Quiebra Altman Z</span>
                    {altmanZ && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        altmanZ.notApplicable ? 'bg-slate-700/40 text-slate-300 border border-slate-600/30' :
                        altmanZ.zone === 'Segura' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        altmanZ.zone === 'Gris' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {altmanZ.notApplicable ? 'N/A Banca' : `Zona ${altmanZ.zone}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-bold font-mono ${
                      !altmanZ ? 'text-white' :
                      altmanZ.notApplicable ? 'text-slate-400' :
                      altmanZ.zone === 'Segura' ? 'text-emerald-400' :
                      altmanZ.zone === 'Gris' ? 'text-amber-300' :
                      'text-rose-400'
                    }`}>
                      {altmanZ ? (altmanZ.notApplicable ? 'N/A' : altmanZ.score) : 'N/D'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {altmanZ?.notApplicable ? '(Sector Financiero)' : altmanZ?.zone === 'Segura' ? '(Solvencia alta)' : altmanZ?.zone === 'Gris' ? '(Riesgo intermedio)' : '(Tensión contable)'}
                    </span>
                  </div>
                </div>

                {/* Baremo Altman Z */}
                <div className="space-y-1 bg-[#101827] p-2.5 rounded-xl border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 font-medium flex justify-between">
                    <span>Baremo Altman:</span>
                    <span className="text-slate-200 font-semibold">
                      {altmanZ ? (
                        altmanZ.notApplicable ? 'Exento (Auditoría Basilea)' :
                        altmanZ.score >= 3.0 ? '🛡️ >3.0 Zona Segura (<1% quiebra)' :
                        altmanZ.score >= 1.8 ? '⚠️ 1.8-3.0 Zona Gris (Solvencia media)' :
                        '🚨 <1.8 Peligro (Estrés severo)'
                      ) : 'Esperando datos'}
                    </span>
                  </div>
                  {altmanZ?.notApplicable ? (
                    <div className="h-2.5 w-full bg-[#162032] rounded-full flex items-center justify-center text-[9px] text-slate-400">
                      No aplicable a bancos (Auditoría CET1)
                    </div>
                  ) : (
                    <>
                      <div className="relative h-2.5 w-full bg-[#162032] rounded-full overflow-hidden flex">
                        <div className="w-[30%] bg-rose-500/70" title="<1.8 Peligro"></div>
                        <div className="w-[25%] bg-amber-500/70" title="1.8 a 3.0 Gris"></div>
                        <div className="w-[45%] bg-emerald-500/70" title=">3.0 Segura"></div>
                      </div>
                      {altmanZ && typeof altmanZ.score === 'number' && (
                        <div className="relative w-full h-1.5">
                          <div
                            className="absolute -top-1 -ml-1 w-2.5 h-2.5 bg-white border border-slate-900 rounded-full shadow-[0_0_8px_#fff] transition-all"
                            style={{
                              left: `${Math.min(95, Math.max(5, (altmanZ.score / 5) * 100))}%`
                            }}
                          ></div>
                        </div>
                      )}
                      <div className="flex justify-between text-[8px] text-slate-400 font-mono pt-0.5">
                        <span>0.0 (Peligro)</span>
                        <span>1.8 (Gris)</span>
                        <span>3.0+ (Segura)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card 4: Tendencia Técnica (SMA 200) */}
              <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-medium">Tendencia Técnica (SMA 200)</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      technicalSummary.signals.trendPrimary === 'Alcista' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      technicalSummary.signals.trendPrimary === 'Bajista' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {technicalSummary.signals.trendPrimary}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-amber-400 font-mono">
                      {technicalSummary.signals.trendPrimary}
                    </span>
                    <span className="text-[11px] text-slate-400">vs Media Móvil 200</span>
                  </div>
                </div>

                {/* Baremo RSI */}
                <div className="space-y-1 bg-[#101827] p-2.5 rounded-xl border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 font-medium flex justify-between">
                    <span>Baremo RSI(14):</span>
                    <span className="text-slate-200 font-semibold">
                      {technicalSummary.rsi14 ? `${technicalSummary.rsi14} • ${technicalSummary.signals.rsiStatus}` : 'N/D'}
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full bg-[#162032] rounded-full overflow-hidden flex">
                    <div className="w-[30%] bg-emerald-500/70" title="<30 Sobrevendida"></div>
                    <div className="w-[40%] bg-blue-500/70" title="30 a 70 Zona Neutral"></div>
                    <div className="w-[30%] bg-rose-500/70" title=">70 Sobrecomprada"></div>
                  </div>
                  {technicalSummary.rsi14 && (
                    <div className="relative w-full h-1.5">
                      <div
                        className="absolute -top-1 -ml-1 w-2.5 h-2.5 bg-white border border-slate-900 rounded-full shadow-[0_0_8px_#fff] transition-all"
                        style={{
                          left: `${Math.min(95, Math.max(5, technicalSummary.rsi14))}%`
                        }}
                      ></div>
                    </div>
                  )}
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono pt-0.5">
                    <span>0 (Sobreventa)</span>
                    <span>50 (Neutral)</span>
                    <span>100 (Sobrecompra)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Behavioral Sentiment Summary Card */}
            <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Psicología de Mercado & Noticias:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      (sentimentData?.nsi ?? 0) >= 30
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : (sentimentData?.nsi ?? 0) <= -25
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {sentimentData ? `${sentimentData.nsiLabel} (${sentimentData.nsi > 0 ? '+' : ''}${sentimentData.nsi})` : 'Cargando análisis...'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {sentimentData && sentimentData.nsi >= 30 && (dcfResult?.marginOfSafety ?? 0) <= -15
                    ? '⚠️ Alerta de Euforia Minorista: Titulares eufóricos mientras la valoración intrínseca está exigida.'
                    : sentimentData && sentimentData.nsi <= -20 && (dcfResult?.marginOfSafety ?? 0) >= 15
                    ? '💎 Oportunidad Contraria: Pánico en medios mientras los flujos de caja y margen de seguridad son sólidos.'
                    : 'La corriente de noticias y el tono mediático se mantienen en sintonía con la cotización.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('sentiment')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3.5 py-2 rounded-xl hover:bg-blue-500/10 transition-all shrink-0 self-start sm:self-center"
              >
                Ver Sentimiento ↗
              </button>
            </div>

            {/* Quick AI Callout Banner */}
            <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-[#0e1626] border border-blue-500/30 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🤖</span> Generar Tesis Institucional con Gemini 3.5 Flash Lite
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Produce un Equity Research Memo completo con Bull Case, Bear Case y Timing técnico.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('aiReport');
                  if (!aiReport) generateAiReport();
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/30 transition-all shrink-0"
              >
                Abrir Informe IA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TERMINAL TÉCNICO & VELAS */}
      {activeTab === 'technical' && (
        <CandleChart
          bars={chartBars}
          technical={technicalSummary}
          currency={currency}
          range={range}
          onRangeChange={handleRangeChange}
          isLoading={isLoadingChart}
        />
      )}

      {/* TAB 3: VALORACIÓN INTRÍNSECA (DCF) */}
      {activeTab === 'valuation' && (
        <DCFSimulator
          currentPrice={currentPrice}
          currency={currency}
          fcfBase={fcfBase}
          sharesOutstanding={sharesOutstanding}
          netDebt={netDebt}
          defaultGrowthRate={pick(fin.revenueGrowth) ?? 0.10}
          eps={eps}
          bookValuePerShare={bookValue}
        />
      )}

      {/* TAB 4: ESTADOS FINANCIEROS & DUPONT */}
      {activeTab === 'statements' && (
        <StatementsDuPont
          incomeHistory={quoteData?.incomeStatementHistory?.incomeStatementHistory || []}
          balanceHistory={quoteData?.balanceSheetHistory?.balanceSheetStatements || []}
          cashflowHistory={quoteData?.cashflowStatementHistory?.cashflowStatementHistory || []}
          currency={currency}
          piotroski={piotroski}
          altmanZ={altmanZ}
          dupont={dupont}
        />
      )}

      {/* TAB 5: SENTIMIENTO & NOTICIAS */}
      {activeTab === 'sentiment' && (
        <SentimentPulse
          data={sentimentData}
          isLoading={isLoadingSentiment}
          onRefresh={() => loadSentimentData(ticker, companyName)}
          marginOfSafety={dcfResult?.marginOfSafety}
          alphaScore={snowflakeScores.alphaScore}
        />
      )}

      {/* TAB 6: INFORME DE RESEARCH CON IA */}
      {activeTab === 'aiReport' && (
        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-6 print:bg-white print:border-none print:p-0 print:shadow-none print:space-y-4">
          {/* Header Bar on Screen (Hidden on Print) */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e293b] pb-4 print:hidden">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🤖</span> Equity Research Memo — {companyName} ({ticker})
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                <span>Motor: <strong className="text-white">{currentModelInfo.name}</strong></span>
                <span>•</span>
                <span className="font-mono text-emerald-400">Coste estimado OpenRouter: <strong>{currentModelInfo.costPerReport}</strong></span>
                <span>•</span>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer"
                >
                  Cambiar modelo o tarifas en Ajustes ⚙️
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={generateAiReport}
                disabled={isGeneratingAi}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                {isGeneratingAi && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isGeneratingAi ? 'Generando Informe...' : 'Regenerar Informe'}
              </button>

              <button
                onClick={() => window.print()}
                title="Genera un PDF institucional optimizado para formato A4"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <span>🖨️</span> Descargar / Imprimir PDF
              </button>
            </div>
          </div>

          {/* Institutional Print Cover Header (Visible ONLY when printing to PDF) */}
          {aiReport && (
            <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">
                    TRADINGALPHA RESEARCH • INSTITUTIONAL EQUITY MEMORANDUM
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 mt-0.5">
                    {companyName} <span className="font-mono text-slate-500 text-lg font-normal">({ticker})</span>
                  </h1>
                  <div className="text-xs text-slate-600 mt-1">
                    Sector: <strong>{sector || 'Renta Variable'}</strong> • Cotización de Cierre: <strong>{currency}{currentPrice.toFixed(2)}</strong> • Cap: <strong>${(pick(sum.marketCap) ? (pick(sum.marketCap)! / 1e9).toFixed(2) + 'B' : 'N/D')}</strong>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-600 font-mono space-y-0.5">
                  <div>Fecha: <strong>{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
                  <div>Motor: <strong>{currentModelInfo.name}</strong></div>
                  <div>Pasarela: <strong>OpenRouter Gateway</strong></div>
                </div>
              </div>

              {/* 4-Box Executive KPI Summary Strip for PDF */}
              <div className="grid grid-cols-4 gap-2 mt-4 text-xs font-mono">
                <div className="border border-slate-300 bg-slate-50 p-2 rounded">
                  <div className="text-[9px] uppercase text-slate-500">Puntuación Alpha Global</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{snowflakeScores.alphaScore}/100</div>
                  <div className="text-[9px] text-slate-600">Fund: {snowflakeScores.health} | Téc: {technicalSummary.signals.technicalScore}</div>
                </div>
                <div className="border border-slate-300 bg-slate-50 p-2 rounded">
                  <div className="text-[9px] uppercase text-slate-500">Valor Justo DCF</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{dcfResult ? `${currency}${dcfResult.fairValue}` : 'N/D'}</div>
                  <div className="text-[9px] text-slate-600">Margen Seguridad: {dcfResult ? `${dcfResult.marginOfSafety}%` : 'N/D'}</div>
                </div>
                <div className="border border-slate-300 bg-slate-50 p-2 rounded">
                  <div className="text-[9px] uppercase text-slate-500">Auditoría Piotroski / Z</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{piotroski.score}/9 • {piotroski.quality}</div>
                  <div className="text-[9px] text-slate-600">Altman Z: {altmanZ?.notApplicable ? 'N/A Banca' : (altmanZ?.score ?? 'N/D')}</div>
                </div>
                <div className="border border-slate-300 bg-slate-50 p-2 rounded">
                  <div className="text-[9px] uppercase text-slate-500">Sentimiento / Momento</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">NSI: {sentimentData?.nsi ?? 0} ({sentimentData?.nsiLabel ?? 'Neutral'})</div>
                  <div className="text-[9px] text-slate-600">RSI(14): {technicalSummary.rsi14 ?? '—'} • {technicalSummary.signals.rsiStatus}</div>
                </div>
              </div>
            </div>
          )}

          {/* Report Display */}
          {isGeneratingAi ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-slate-300 text-sm font-semibold">
                Sintetizando modelos financieros y estructura técnica con {currentModelInfo.name}...
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                Procesando cuenta de resultados, DCF, Piotroski, Altman Z y medias móviles para construir la tesis ejecutiva.
              </p>
            </div>
          ) : aiReport ? (
            <div className="space-y-4">
              {parseReportSections(aiReport).length > 0 ? (
                <div className="space-y-4">
                  {parseReportSections(aiReport).map((sec, idx) => (
                    <div
                      key={idx}
                      className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-2.5 transition-all print:bg-white print:border print:border-slate-300 print:rounded-lg print:p-3.5 print:mb-3"
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    >
                      {sec.title && (
                        <h4 className="text-sm font-bold text-blue-400 print:text-slate-900 border-b border-[#1e293b] print:border-slate-200 pb-2 flex items-center gap-2">
                          <span>📌</span> {sec.title}
                        </h4>
                      )}
                      <div className="text-sm text-slate-200 print:text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                        {sec.body}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-6 text-sm text-slate-200 print:text-slate-900 print:bg-white leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                  {aiReport}
                </div>
              )}

              {/* Institutional Disclaimer */}
              <div
                className="border-t border-[#1e293b] print:border-slate-300 pt-4 text-[11px] text-slate-500 print:text-slate-600 print:mt-4"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                <p>
                  <strong>Aviso Metodológico y Legal:</strong> Este memorando de equity research ha sido elaborado de forma automatizada por el motor de inteligencia artificial de TradingAlpha combinando modelos cuantitativos descontados (DCF), auditorías forenses contables (Piotroski F-Score y Altman Z-Score) y procesamiento conductual de noticias en tiempo real. No constituye asesoramiento financiero regulado bajo directiva MiFID II.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <span className="text-4xl">📑</span>
              <h4 className="text-base font-bold text-white">Informe aún no generado</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Haz clic en el botón inferior para solicitar a <strong>{currentModelInfo.name}</strong> un desglose ejecutivo de la tesis alcista, bajista y niveles técnicos.
              </p>
              <div className="text-xs font-mono text-emerald-400 font-semibold">
                Coste estimado de generación: {currentModelInfo.costPerReport} ({currentModelInfo.reportsPerDollar})
              </div>
              <button
                onClick={generateAiReport}
                className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              >
                Generar Informe con {currentModelInfo.name}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: GUÍA DIDÁCTICA & MANUAL DE CONCEPTOS */}
      {activeTab === 'help' && (
        <HelpGuide />
      )}

      {/* TAB 8: AJUSTES & CONECTORES DEL SISTEMA */}
      {activeTab === 'settings' && (
        <SettingsPanel
          userApiKey={userApiKey}
          setUserApiKey={setUserApiKey}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      )}

      {/* TAB 9: SALVEDAD LEGAL & DESCARGO DE RESPONSABILIDAD REGULATORIA */}
      {activeTab === 'legal' && (
        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-[#1e293b] pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚖️</span>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Aviso Legal, Salvedad Regulatoria y Descargo Universal de Responsabilidad
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Marco de cumplimiento para Europa (MiFID II / MAR), Estados Unidos (SEC / FINRA) y Jurisdicciones Internacionales.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1: Unión Europea */}
            <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <span>🇪🇺</span> Marco Regulatorio Unión Europea
              </div>
              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <p>
                  <strong>Directiva MiFID II (2014/65/UE):</strong> Esta plataforma es un software tecnológico de cálculo algorítmico y simulación cuantitativa. No constituye una Empresa de Servicios de Inversión (ESI) ni una entidad de crédito autorizada.
                </p>
                <p>
                  <strong>Ausencia de Asesoramiento:</strong> Ningún ratio, puntuación (AlphaScore, Piotroski, Altman Z), modelo de descuento de flujos (DCF) ni informe redactado por Inteligencia Artificial constituye asesoramiento en materia de inversión ni recomendación personalizada con arreglo a los artículos 24 y 25 de MiFID II.
                </p>
                <p>
                  <strong>Reglamento MAR (596/2014):</strong> Los contenidos generados no constituyen prospección comercial ni informes de análisis de inversiones regulados bajo las normas europeas de abuso de mercado.
                </p>
              </div>
            </div>

            {/* Box 2: Estados Unidos */}
            <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <span>🇺🇸</span> U.S. Regulatory Compliance (SEC & FINRA)
              </div>
              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <p>
                  <strong>Investment Advisers Act of 1940:</strong> Neither this application nor its operators are registered as investment advisers, broker-dealers, or financial planners with the U.S. Securities and Exchange Commission (SEC) or FINRA.
                </p>
                <p>
                  <strong>No Solicitation:</strong> Nothing contained herein constitutes an offer to buy or sell, or a recommendation to buy, hold, or sell any security, derivative, ETF, or financial instrument.
                </p>
                <p>
                  <strong>No Fiduciary Duty:</strong> Use of this application does not establish any advisory, brokerage, or fiduciary relationship between the user and mbainative.com or its creators.
                </p>
              </div>
            </div>

            {/* Box 3: Internacional / DYODD */}
            <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span>🌐</span> Cláusula Universal de Exención de Responsabilidad
              </div>
              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <p>
                  <strong>Principio DYODD (Do Your Own Due Diligence):</strong> La inversión en renta variable y mercados financieros conlleva un riesgo sustancial de pérdida económica, incluyendo la posible pérdida total del capital invertido.
                </p>
                <p>
                  <strong>Responsabilidad Exclusiva:</strong> El usuario asume de forma total, exclusiva e irrevocable cualquier consecuencia patrimonial de sus operaciones. Ningún cálculo matemático garantiza rentabilidades futuras.
                </p>
                <p>
                  <strong>Limitación de Responsabilidad (Hold Harmless):</strong> En ninguna circunstancia los desarrolladores, colaboradores o mbainative.com responderán de daños patrimoniales directos, indirectos, lucro cesante o pérdidas derivadas del uso de esta app.
                </p>
              </div>
            </div>
          </div>

          {/* Modelos Matemáticos e Inteligencia Artificial */}
          <div className="bg-[#141d30] border border-[#223048] rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🤖</span> Naturaleza de los Modelos de IA y Cálculos Cuantitativos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>Modelos LLM (Inteligencia Artificial):</strong> Los informes ejecutivos son sintetizados por modelos de lenguaje abiertos (vía OpenRouter). Pese a operar con instrucciones estrictas de neutralidad, los modelos de lenguaje pueden presentar sesgos o interpretaciones imprecisas y deben ser tratados exclusivamente como borradores de trabajo no vinculantes.
              </p>
              <p>
                <strong>Fuentes de Datos de Mercado:</strong> Los datos contables, fundamentales, técnicos y de cotización son servidos por APIs públicas de mercado (Yahoo Finance). No se garantiza la exactitud absoluta, integridad o puntualidad en tiempo real de los datos recibidos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT GLOBAL REGULATORY NOTICE (Visible across all tabs) */}
      <div className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-5 text-xs text-slate-400 space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a2638] pb-3">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <span>⚖️</span>
            <span>Salvedad Legal Internacional y Descargo de Responsabilidad</span>
          </div>
          <button
            onClick={() => setActiveTab('legal')}
            className="text-blue-400 hover:text-blue-300 underline font-semibold text-left sm:text-right cursor-pointer"
          >
            Consultar marco regulatorio completo (MiFID II / SEC / DYODD) ↗
          </button>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong>Aviso de Riesgo y Carácter No Asesor:</strong> TradingAlpha es una herramienta de simulación matemática, análisis cuantitativo algorítmico y divulgación formativa. <strong>No proporciona asesoramiento financiero ni recomendaciones personalizadas de inversión.</strong> Ninguna métrica cuantitativa (DCF, Piotroski, Altman Z) ni informe generado por Inteligencia Artificial constituye una recomendación de inversión bajo la Directiva MiFID II (UE 2014/65), el Reglamento MAR (UE 596/2014) ni bajo la regulación de la SEC o FINRA de los Estados Unidos. Operar en bolsa conlleva alto riesgo de pérdida de capital. Realiza siempre tu propio análisis independiente (DYODD) o consulta a un asesor financiero registrado antes de tomar decisiones de inversión.
        </p>
      </div>
    </div>
  );
}
