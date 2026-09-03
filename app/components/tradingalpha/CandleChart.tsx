"use client";

import React, { useState, useMemo, useRef } from 'react';
import { CandleBar, TechnicalSummary } from './financialEngine';

interface CandleChartProps {
  bars: CandleBar[];
  technical: TechnicalSummary;
  currency?: string;
  range: string;
  onRangeChange: (r: string) => void;
  isLoading?: boolean;
}

export default function CandleChart({
  bars,
  technical,
  currency = '$',
  range,
  onRangeChange,
  isLoading = false,
}: CandleChartProps) {
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showBollinger, setShowBollinger] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeSubPanel, setActiveSubPanel] = useState<'rsi' | 'macd'>('rsi');

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter or limit bars for display width
  const displayBars = useMemo(() => {
    if (!bars || bars.length === 0) return [];
    // Max 140 bars on screen for clean candle rendering
    return bars.length > 140 ? bars.slice(bars.length - 140) : bars;
  }, [bars]);

  const n = displayBars.length;

  // Min/Max Price and Volume
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    if (n === 0) return { minPrice: 0, maxPrice: 100, maxVol: 1 };
    let min = Infinity;
    let max = -Infinity;
    let vMax = 0;
    for (const b of displayBars) {
      if (b.low < min) min = b.low;
      if (b.high > max) max = b.high;
      if (b.volume > vMax) vMax = b.volume;
    }
    const pad = (max - min) * 0.08 || 5;
    return {
      minPrice: Math.max(0, min - pad),
      maxPrice: max + pad,
      maxVol: vMax || 1,
    };
  }, [displayBars, n]);

  // Chart dimensions
  const width = 900;
  const height = 400;
  const padding = { top: 20, right: 65, bottom: 45, left: 10 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Mapping functions
  const getY = (price: number) => {
    if (maxPrice === minPrice) return height / 2;
    return padding.top + plotH - ((price - minPrice) / (maxPrice - minPrice)) * plotH;
  };

  const candleW = Math.max(2, Math.min(12, (plotW / (n || 1)) * 0.65));
  const getX = (index: number) => {
    return padding.left + (index + 0.5) * (plotW / (n || 1));
  };

  // Hovered Bar Info
  const activeBar = hoveredIdx !== null && displayBars[hoveredIdx]
    ? displayBars[hoveredIdx]
    : displayBars[n - 1];

  // Moving Average Series for displayBars
  const seriesSMA20 = useMemo(() => {
    if (n < 20) return [];
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 19; i < n; i++) {
      const slice = displayBars.slice(i - 19, i + 1);
      const avg = slice.reduce((acc, b) => acc + b.close, 0) / 20;
      pts.push({ x: getX(i), y: getY(avg) });
    }
    return pts;
  }, [displayBars, n, minPrice, maxPrice]);

  const seriesSMA50 = useMemo(() => {
    if (n < 50) return [];
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 49; i < n; i++) {
      const slice = displayBars.slice(i - 49, i + 1);
      const avg = slice.reduce((acc, b) => acc + b.close, 0) / 50;
      pts.push({ x: getX(i), y: getY(avg) });
    }
    return pts;
  }, [displayBars, n, minPrice, maxPrice]);

  const seriesEMA9 = useMemo(() => {
    if (n < 9) return [];
    const pts: Array<{ x: number; y: number }> = [];
    const k = 2 / 10;
    let ema = displayBars.slice(0, 9).reduce((acc, b) => acc + b.close, 0) / 9;
    pts.push({ x: getX(8), y: getY(ema) });
    for (let i = 9; i < n; i++) {
      ema = displayBars[i].close * k + ema * (1 - k);
      pts.push({ x: getX(i), y: getY(ema) });
    }
    return pts;
  }, [displayBars, n, minPrice, maxPrice]);

  // Bollinger Band Series (20, 2)
  const bollingerSeries = useMemo(() => {
    if (n < 20) return null;
    const uppers: Array<{ x: number; y: number }> = [];
    const lowers: Array<{ x: number; y: number }> = [];
    for (let i = 19; i < n; i++) {
      const slice = displayBars.slice(i - 19, i + 1);
      const avg = slice.reduce((acc, b) => acc + b.close, 0) / 20;
      const variance = slice.reduce((acc, b) => acc + Math.pow(b.close - avg, 2), 0) / 20;
      const sd = Math.sqrt(variance);
      uppers.push({ x: getX(i), y: getY(avg + 2 * sd) });
      lowers.push({ x: getX(i), y: getY(avg - 2 * sd) });
    }
    return { uppers, lowers };
  }, [displayBars, n, minPrice, maxPrice]);

  // RSI Series for Subpanel
  const rsiSeries = useMemo(() => {
    if (n < 15) return [];
    const closes = displayBars.map(b => b.close);
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= 14; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    let avgGain = gains / 14;
    let avgLoss = losses / 14;
    const pts: Array<{ x: number; val: number }> = [];

    for (let i = 14; i < n; i++) {
      if (i > 14) {
        const diff = closes[i] - closes[i - 1];
        const g = diff >= 0 ? diff : 0;
        const l = diff < 0 ? Math.abs(diff) : 0;
        avgGain = (avgGain * 13 + g) / 14;
        avgLoss = (avgLoss * 13 + l) / 14;
      }
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
      pts.push({ x: getX(i), val: rsi });
    }
    return pts;
  }, [displayBars, n]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const chartX = (relX / rect.width) * width;
    const clampedX = Math.max(padding.left, Math.min(width - padding.right, chartX));
    const idx = Math.floor(((clampedX - padding.left) / plotW) * n);
    if (idx >= 0 && idx < n) {
      setHoveredIdx(idx);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  return (
    <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-[#162032] p-1 rounded-xl border border-[#27354f]">
          {['1mo', '3mo', '6mo', '1y', '5y'].map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                range === r
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2a40]'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Indicators Overlay Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
              showSMA
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-[#162032] text-slate-400 border-[#27354f] hover:text-white'
            }`}
          >
            SMA (20/50)
          </button>
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
              showEMA
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-[#162032] text-slate-400 border-[#27354f] hover:text-white'
            }`}
          >
            EMA (9)
          </button>
          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
              showBollinger
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-[#162032] text-slate-400 border-[#27354f] hover:text-white'
            }`}
          >
            Bollinger (20,2)
          </button>

          {/* Subpanel switcher */}
          <div className="flex items-center bg-[#162032] p-1 rounded-lg border border-[#27354f] ml-2">
            <button
              onClick={() => setActiveSubPanel('rsi')}
              className={`px-2.5 py-0.5 text-xs rounded ${
                activeSubPanel === 'rsi' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setActiveSubPanel('macd')}
              className={`px-2.5 py-0.5 text-xs rounded ${
                activeSubPanel === 'macd' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              MACD (12,26,9)
            </button>
          </div>
        </div>
      </div>

      {/* Bar Data HUD / Tooltip */}
      {activeBar && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono bg-[#131b2e] px-4 py-2 rounded-xl border border-[#223048]">
          <span className="text-slate-400">Fecha: <strong className="text-slate-200">{activeBar.date}</strong></span>
          <span className="text-slate-400">O: <strong className="text-slate-100">{currency}{activeBar.open}</strong></span>
          <span className="text-slate-400">H: <strong className="text-emerald-400">{currency}{activeBar.high}</strong></span>
          <span className="text-slate-400">L: <strong className="text-rose-400">{currency}{activeBar.low}</strong></span>
          <span className="text-slate-400">
            C:{' '}
            <strong className={activeBar.close >= activeBar.open ? 'text-emerald-400' : 'text-rose-400'}>
              {currency}{activeBar.close}
            </strong>
          </span>
          <span className="text-slate-400">
            Vol: <strong className="text-slate-300">{(activeBar.volume / 1e6).toFixed(2)}M</strong>
          </span>
          {showSMA && seriesSMA20.length > 0 && (
            <span className="text-amber-400">SMA20: {currency}{technical.sma20 ?? '—'}</span>
          )}
          {technical.rsi14 != null && (
            <span className="text-purple-400">RSI(14): {technical.rsi14}</span>
          )}
        </div>
      )}

      {/* Main SVG Candlestick Chart */}
      <div className="relative w-full overflow-hidden" ref={containerRef}>
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0e1626]/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-blue-400 text-sm font-semibold">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Actualizando datos de velas...
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Horizontal Grid lines and Price labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + plotH * ratio;
            const price = maxPrice - (maxPrice - minPrice) * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={width - padding.right + 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {currency}{price.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Volume Histogram (bottom 18% of main chart) */}
          {displayBars.map((bar, i) => {
            const x = getX(i);
            const volH = (bar.volume / maxVol) * (plotH * 0.18);
            const y = padding.top + plotH - volH;
            const isBull = bar.close >= bar.open;
            return (
              <rect
                key={`vol-${i}`}
                x={x - candleW / 2}
                y={y}
                width={candleW}
                height={Math.max(1, volH)}
                fill={isBull ? '#10b981' : '#f43f5e'}
                opacity={0.25}
              />
            );
          })}

          {/* Bollinger Bands Shaded Area & Lines */}
          {showBollinger && bollingerSeries && (
            <g>
              {/* Shaded Channel */}
              <polygon
                points={`
                  ${bollingerSeries.uppers.map(p => `${p.x},${p.y}`).join(' ')}
                  ${bollingerSeries.lowers.slice().reverse().map(p => `${p.x},${p.y}`).join(' ')}
                `}
                fill="#8b5cf6"
                opacity="0.08"
              />
              {/* Upper Band */}
              <polyline
                points={bollingerSeries.uppers.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.8"
              />
              {/* Lower Band */}
              <polyline
                points={bollingerSeries.lowers.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.8"
              />
            </g>
          )}

          {/* Moving Averages Lines */}
          {showSMA && seriesSMA20.length > 1 && (
            <polyline
              points={seriesSMA20.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.8"
              opacity="0.9"
            />
          )}
          {showSMA && seriesSMA50.length > 1 && (
            <polyline
              points={seriesSMA50.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.8"
              opacity="0.9"
            />
          )}
          {showEMA && seriesEMA9.length > 1 && (
            <polyline
              points={seriesEMA9.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.8"
              opacity="0.9"
            />
          )}

          {/* Candlesticks (Wick + Body) */}
          {displayBars.map((bar, i) => {
            const x = getX(i);
            const highY = getY(bar.high);
            const lowY = getY(bar.low);
            const openY = getY(bar.open);
            const closeY = getY(bar.close);

            const isBull = bar.close >= bar.open;
            const bodyY = Math.min(openY, closeY);
            const bodyH = Math.max(1.5, Math.abs(closeY - openY));
            const color = isBull ? '#10b981' : '#f43f5e';

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                {/* Body */}
                <rect
                  x={x - candleW / 2}
                  y={bodyY}
                  width={candleW}
                  height={bodyH}
                  fill={color}
                  stroke={color}
                  strokeWidth="0.5"
                  rx="1"
                />
              </g>
            );
          })}

          {/* Hover Crosshair */}
          {hoveredIdx !== null && hoveredIdx < n && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={padding.top}
                x2={getX(hoveredIdx)}
                y2={padding.top + plotH}
                stroke="#60a5fa"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={padding.left}
                y1={getY(displayBars[hoveredIdx].close)}
                x2={width - padding.right}
                y2={getY(displayBars[hoveredIdx].close)}
                stroke="#60a5fa"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredIdx)}
                cy={getY(displayBars[hoveredIdx].close)}
                r="4"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* X Axis Date labels (6 evenly spaced) */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
            const idx = Math.min(n - 1, Math.floor((n - 1) * ratio));
            const bar = displayBars[idx];
            if (!bar) return null;
            return (
              <text
                key={`label-${ratio}`}
                x={getX(idx)}
                y={height - 12}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {bar.date.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Subpanel: RSI (14) or MACD */}
      <div className="bg-[#111928] border border-[#1e293b] rounded-xl p-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          {activeSubPanel === 'rsi' ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Oscilador RSI (14 Periodos) — Sobrecompra: 70 | Sobreventa: 30
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              MACD (12, 26, 9) con Histograma
            </span>
          )}
          <span className="font-mono text-slate-300">
            {activeSubPanel === 'rsi'
              ? `Actual: ${technical.rsi14 ?? '—'}`
              : `Hist: ${technical.macd?.histogram ?? '—'}`}
          </span>
        </div>

        {activeSubPanel === 'rsi' ? (
          <div className="h-20 w-full">
            <svg viewBox={`0 0 ${width} 80`} className="w-full h-full select-none">
              {/* Overbought 70 line */}
              <line x1={padding.left} y1={24} x2={width - padding.right} y2={24} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
              <text x={width - padding.right + 4} y={28} fill="#f43f5e" fontSize="9" fontFamily="monospace">70</text>
              {/* Oversold 30 line */}
              <line x1={padding.left} y1={56} x2={width - padding.right} y2={56} stroke="#10b981" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
              <text x={width - padding.right + 4} y={60} fill="#10b981" fontSize="9" fontFamily="monospace">30</text>
              {/* RSI Curve */}
              {rsiSeries.length > 1 && (
                <polyline
                  points={rsiSeries.map(p => `${p.x},${80 - (p.val / 100) * 80}`).join(' ')}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.8"
                />
              )}
            </svg>
          </div>
        ) : (
          <div className="h-20 w-full flex items-center justify-center">
            {technical.macd ? (
              <div className="flex items-center gap-6 text-xs font-mono">
                <div className="bg-[#162032] px-3 py-1.5 rounded-lg border border-[#27354f]">
                  <span className="text-slate-400">Línea MACD: </span>
                  <strong className="text-blue-400">{technical.macd.macd}</strong>
                </div>
                <div className="bg-[#162032] px-3 py-1.5 rounded-lg border border-[#27354f]">
                  <span className="text-slate-400">Línea Signal (9): </span>
                  <strong className="text-amber-400">{technical.macd.signal}</strong>
                </div>
                <div className="bg-[#162032] px-3 py-1.5 rounded-lg border border-[#27354f]">
                  <span className="text-slate-400">Histograma: </span>
                  <strong className={technical.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {technical.macd.histogram >= 0 ? '+' : ''}{technical.macd.histogram}
                  </strong>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500">Insuficientes datos históricos para calcular MACD.</span>
            )}
          </div>
        )}
      </div>

      {/* Technical Signals Matrix Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
        <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048]">
          <div className="text-slate-400 mb-1 font-medium">Tendencia Primaria (SMA 200)</div>
          <div className={`font-semibold text-sm ${
            technical.signals.trendPrimary === 'Alcista' ? 'text-emerald-400' :
            technical.signals.trendPrimary === 'Bajista' ? 'text-rose-400' : 'text-amber-400'
          }`}>
            {technical.signals.trendPrimary}
          </div>
        </div>
        <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048]">
          <div className="text-slate-400 mb-1 font-medium">Cruce Medias (50 vs 200)</div>
          <div className="font-semibold text-sm text-slate-200">
            {technical.signals.goldenCross ? '🌟 Cruce Dorado' : technical.signals.deathCross ? '⚠️ Cruce de la Muerte' : 'Neutral'}
          </div>
        </div>
        <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048]">
          <div className="text-slate-400 mb-1 font-medium">Oscilador RSI (14)</div>
          <div className={`font-semibold text-sm ${
            technical.signals.rsiStatus === 'Sobrecompra' ? 'text-rose-400' :
            technical.signals.rsiStatus === 'Sobreventa' ? 'text-emerald-400' : 'text-slate-300'
          }`}>
            {technical.signals.rsiStatus} ({technical.rsi14 ?? '—'})
          </div>
        </div>
        <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048]">
          <div className="text-slate-400 mb-1 font-medium">Señal Técnica Consolidada</div>
          <div className={`font-bold text-sm ${
            technical.signals.overallSignal.includes('Compra') ? 'text-emerald-400' :
            technical.signals.overallSignal.includes('Venta') ? 'text-rose-400' : 'text-amber-400'
          }`}>
            {technical.signals.overallSignal} ({technical.signals.technicalScore}/100)
          </div>
        </div>
      </div>
    </div>
  );
}
