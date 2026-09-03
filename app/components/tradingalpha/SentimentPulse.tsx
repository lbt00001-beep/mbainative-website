"use client";

import React from 'react';

export interface SentimentData {
  ticker: string;
  company: string;
  totalArticles: number;
  nsi: number; // -100 a +100
  nsiLabel: string;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  polarizationIndex: number;
  professionalCount: number;
  articles: Array<{
    id: string;
    title: string;
    publisher: string;
    link: string;
    publishedAt: string;
    sourceType: 'professional' | 'reputable_media' | 'crowd_social';
    authorityScore: number;
    sentimentLabel: 'Positivo' | 'Neutral' | 'Negativo';
    sentimentScore: number;
    keyThemes: string[];
  }>;
}

interface SentimentPulseProps {
  data: SentimentData | null;
  isLoading: boolean;
  onRefresh: () => void;
  marginOfSafety?: number | null;
  alphaScore?: number;
}

export default function SentimentPulse({
  data,
  isLoading,
  onRefresh,
  marginOfSafety = null,
  alphaScore = 50,
}: SentimentPulseProps) {
  if (isLoading && !data) {
    return (
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-12 shadow-2xl flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-200 text-sm font-semibold">
          Escaneando titulares financieros y sentimiento de mercado en tiempo real...
        </div>
        <p className="text-xs text-slate-400">
          Procesando Bloomberg, Reuters, TheStreet, Google News y valencias de polarización.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-8 shadow-2xl text-center space-y-3">
        <span className="text-4xl">🧠</span>
        <h4 className="text-base font-bold text-white">Análisis de Sentimiento no disponible</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          No se pudieron recuperar noticias para este activo o la consulta ha caducado.
        </p>
        <button
          onClick={onRefresh}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
        >
          Reintentar Búsqueda
        </button>
      </div>
    );
  }

  const nsi = data.nsi;

  // Behavioral Divergence Diagnostic
  let divergenceType: 'euphoria_trap' | 'contrarian_buy' | 'rational_aligned' | 'deterioration' = 'rational_aligned';
  let divergenceTitle = "Sentimiento y Fundamentales Alineados";
  let divergenceDesc = "La narrativa mediática y la cotización actual se corresponden de forma razonable con los números y márgenes del negocio.";

  if (nsi >= 30 && marginOfSafety !== null && marginOfSafety <= -15) {
    divergenceType = 'euphoria_trap';
    divergenceTitle = "⚠️ Alerta de Trampa de Euforia / FOMO Minorista";
    divergenceDesc = `El sentimiento en titulares y redes está en niveles de optimismo o euforia (${nsi > 0 ? '+' : ''}${nsi}), pero el modelo de valoración intrínseca indica que el precio cotiza con una prima exigente (${marginOfSafety}% de margen de seguridad). Típica zona donde el inversor retail persigue el precio mientras el dinero institucional distribuye.`;
  } else if (nsi <= -20 && marginOfSafety !== null && marginOfSafety >= 15 && alphaScore >= 60) {
    divergenceType = 'contrarian_buy';
    divergenceTitle = "💎 Oportunidad Contraria por Pánico Desmedido";
    divergenceDesc = `El ruido informativo está dominado por el pesimismo o pánico (${nsi}), pero la calidad fundamental del activo (${alphaScore}/100) y el descuento respecto a flujos de caja (+${marginOfSafety}% margen de seguridad) permanecen muy sólidos. Escenario clásico 'Be greedy when others are fearful' de Warren Buffett.`;
  } else if (nsi <= -20 && alphaScore < 45) {
    divergenceType = 'deterioration';
    divergenceTitle = "🔴 Deterioro Real Respaldado por Fundamentales";
    divergenceDesc = "El tono pesimista de los medios está plenamente justificado por debilidad contable real, contracción de márgenes o problemas de solvencia. Precaución con intentar adivinar el suelo.";
  }

  // Position on gauge: -100 is 0%, 0 is 50%, +100 is 100%
  const gaugePercent = Math.max(0, Math.min(100, ((nsi + 100) / 200) * 100));

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Behavioral Divergence Card (Contrarian Radar) */}
      <div
        className={`border rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all ${
          divergenceType === 'euphoria_trap'
            ? 'bg-gradient-to-r from-amber-950/40 via-[#0e1626] to-[#0e1626] border-amber-500/40'
            : divergenceType === 'contrarian_buy'
            ? 'bg-gradient-to-r from-emerald-950/40 via-[#0e1626] to-[#0e1626] border-emerald-500/40'
            : divergenceType === 'deterioration'
            ? 'bg-gradient-to-r from-rose-950/40 via-[#0e1626] to-[#0e1626] border-rose-500/40'
            : 'bg-[#0e1626] border-[#1e293b]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <span>🧠 Diagnóstico de Finanzas Conductuales</span>
              <span className="text-slate-500">•</span>
              <span className="text-blue-400">Psicología de Masas vs Fundamentales</span>
            </div>
            <h3 className="text-lg font-black text-white">{divergenceTitle}</h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">{divergenceDesc}</p>
          </div>

          <button
            onClick={onRefresh}
            className="self-start md:self-center px-4 py-2 bg-[#141d30] hover:bg-[#1c273e] text-slate-300 hover:text-white border border-[#27354f] text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-2"
          >
            🔄 Actualizar Noticias
          </button>
        </div>
      </div>

      {/* 2. Sentiment Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Net Sentiment Index (NSI) Gauge Card */}
        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🌡️</span> Termómetro de Sentimiento Neto (NSI)
              </h4>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                  nsi >= 30
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : nsi <= -25
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {data.nsiLabel}
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-4">
              <span className="text-4xl font-black font-mono text-white">
                {nsi > 0 ? `+${nsi}` : nsi}
              </span>
              <span className="text-xs text-slate-400 font-mono">(-100 Pánico a +100 Euforia)</span>
            </div>

            {/* Gauge Bar */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-full rounded-full overflow-hidden bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 relative border border-[#223048]">
                <div
                  className="absolute top-0 bottom-0 w-2.5 bg-white shadow-lg border border-black rounded-full transition-all duration-700 -ml-1"
                  style={{ left: `${gaugePercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Pánico (-100)</span>
                <span>Neutro (0)</span>
                <span>Euforia (+100)</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-[#1e293b]">
            Calculado con ponderación bayesiana por autoridad de fuente y filtros de intensidad.
          </p>
        </div>

        {/* Opinion Distribution Card */}
        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📊</span> Distribución de Titulares
              </h4>
              <span className="text-xs font-mono text-slate-400">{data.totalArticles} noticias</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-[#162032] border border-[#223048]">
              <div
                className="bg-emerald-500 transition-all duration-700 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${data.distribution.positive}%` }}
              >
                {data.distribution.positive > 12 && `${data.distribution.positive}%`}
              </div>
              <div
                className="bg-slate-500 transition-all duration-700 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${data.distribution.neutral}%` }}
              >
                {data.distribution.neutral > 12 && `${data.distribution.neutral}%`}
              </div>
              <div
                className="bg-rose-500 transition-all duration-700 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${data.distribution.negative}%` }}
              >
                {data.distribution.negative > 12 && `${data.distribution.negative}%`}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs font-mono">
              <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
                <div className="text-emerald-400 font-bold text-sm">{data.distribution.positive}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Optimista</div>
              </div>
              <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
                <div className="text-slate-300 font-bold text-sm">{data.distribution.neutral}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Neutral</div>
              </div>
              <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
                <div className="text-rose-400 font-bold text-sm">{data.distribution.negative}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Pesimista</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-4 pt-3 border-t border-[#1e293b]">
            <span>Polarización / Dispersión:</span>
            <strong className="text-slate-300 font-mono">{data.polarizationIndex}/100</strong>
          </div>
        </div>

        {/* The Dual Lens (Professional Media vs General/Blogs) */}
        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <span>🔍</span> La Doble Lente Informativa
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Separación metodológica entre análisis financiero riguroso y corrientes de difusión general.
            </p>

            <div className="space-y-3 text-xs">
              <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Prensa Institucional / Especializada</div>
                  <div className="text-[11px] text-slate-400">Bloomberg, Reuters, FT, WSJ, CNBC, Barron&apos;s</div>
                </div>
                <span className="font-mono font-bold text-blue-400 text-sm">
                  {data.professionalCount} fuentes
                </span>
              </div>

              <div className="bg-[#141d30] p-3 rounded-xl border border-[#223048] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Portales Financieros & Agregadores</div>
                  <div className="text-[11px] text-slate-400">Yahoo Finance, TheStreet, Google News, Blogs</div>
                </div>
                <span className="font-mono font-bold text-slate-300 text-sm">
                  {data.totalArticles - data.professionalCount} fuentes
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-[#1e293b]">
            Ponderación diferenciada: las fuentes de mayor autoridad ejercen más peso en el cálculo del NSI.
          </p>
        </div>
      </div>

      {/* 3. Live News Feed with Sentiment Badges */}
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📰</span> Feed de Titulares y Catalizadores en Tiempo Real
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Noticias analizadas semánticamente para detectar sesgo alcista/bajista y términos clave
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {data.articles.length} artículos procesados
          </span>
        </div>

        <div className="divide-y divide-[#1b2537] max-h-[500px] overflow-y-auto pr-1">
          {data.articles.map((art) => (
            <div key={art.id} className="py-3.5 hover:bg-[#121b2b]/40 px-2 rounded-xl transition-all space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  {art.publisher}
                  {art.sourceType === 'professional' && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-sans uppercase">
                      Institucional
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">{formatDate(art.publishedAt)}</span>
              </div>

              <a
                href={art.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-slate-100 hover:text-blue-400 transition-colors block leading-snug"
              >
                {art.title} ↗
              </a>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    art.sentimentLabel === 'Positivo'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : art.sentimentLabel === 'Negativo'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}
                >
                  {art.sentimentLabel} ({art.sentimentScore > 0 ? '+' : ''}{art.sentimentScore})
                </span>

                {art.keyThemes.length > 0 && (
                  <span className="text-[11px] text-slate-400 font-sans">
                    Catalizadores: <strong className="text-slate-300">{art.keyThemes.join(', ')}</strong>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
