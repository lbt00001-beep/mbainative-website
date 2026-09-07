"use client";

import React, { useState, useEffect, useCallback } from 'react';

export interface ConnectorStatus {
  ok: boolean | null; // null = unverified, true = active (green), false = inactive (red)
  loading: boolean;
  latency?: number;
  label?: string;
  usage?: string;
  error?: string;
}

interface SettingsPanelProps {
  userApiKey: string;
  setUserApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

import { AVAILABLE_MODELS, DEFAULT_AI_MODEL } from '@/lib/ai-models';
export { AVAILABLE_MODELS } from '@/lib/ai-models';

export default function SettingsPanel({
  userApiKey,
  setUserApiKey,
  selectedModel,
  setSelectedModel,
}: SettingsPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Status for each connector
  const [openRouterStatus, setOpenRouterStatus] = useState<ConnectorStatus>({ ok: null, loading: false });
  const [chartStatus, setChartStatus] = useState<ConnectorStatus>({ ok: null, loading: false });
  const [quoteStatus, setQuoteStatus] = useState<ConnectorStatus>({ ok: null, loading: false });
  const [sentimentStatus, setSentimentStatus] = useState<ConnectorStatus>({ ok: null, loading: false });

  // Test OpenRouter Connector
  const testOpenRouter = useCallback(async (key?: string) => {
    setOpenRouterStatus({ ok: null, loading: true });
    try {
      const res = await fetch('/api/testConnector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'openrouter', apiKey: key !== undefined ? key : userApiKey }),
      });
      const data = await res.json();
      if (data.ok) {
        setOpenRouterStatus({
          ok: true,
          loading: false,
          latency: data.latency,
          label: data.label,
          usage: data.usage,
        });
      } else {
        setOpenRouterStatus({
          ok: false,
          loading: false,
          latency: data.latency,
          error: data.error || 'Clave no válida',
        });
      }
    } catch (e: any) {
      setOpenRouterStatus({ ok: false, loading: false, error: e.message || 'Error de conexión' });
    }
  }, [userApiKey]);

  // Test Yahoo Chart Connector
  const testChart = useCallback(async () => {
    setChartStatus({ ok: null, loading: true });
    try {
      const res = await fetch('/api/testConnector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'yahooChart' }),
      });
      const data = await res.json();
      setChartStatus({
        ok: data.ok,
        loading: false,
        latency: data.latency,
        error: data.error,
      });
    } catch (e: any) {
      setChartStatus({ ok: false, loading: false, error: e.message });
    }
  }, []);

  // Test Yahoo Quote Summary Connector
  const testQuote = useCallback(async () => {
    setQuoteStatus({ ok: null, loading: true });
    const start = Date.now();
    try {
      // 1. Probar directamente el endpoint de cotización real de la aplicación
      const res = await fetch('/api/quoteSummary?t=AAPL&modules=price');
      const latency = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        const isOk = !!data?.data?.price?.regularMarketPrice;
        setQuoteStatus({
          ok: isOk,
          loading: false,
          latency,
          error: isOk ? undefined : 'Datos incompletos desde Yahoo Finance',
        });
        return;
      }
      // 2. Fallback a testConnector
      const resFallback = await fetch('/api/testConnector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'yahooQuote' }),
      });
      const dataFallback = await resFallback.json();
      setQuoteStatus({
        ok: dataFallback.ok,
        loading: false,
        latency: dataFallback.latency || latency,
        error: dataFallback.error,
      });
    } catch (e: any) {
      setQuoteStatus({ ok: false, loading: false, error: e.message });
    }
  }, []);

  // Test Sentiment Connector
  const testSentiment = useCallback(async () => {
    setSentimentStatus({ ok: null, loading: true });
    try {
      const res = await fetch('/api/testConnector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sentiment' }),
      });
      const data = await res.json();
      setSentimentStatus({
        ok: data.ok,
        loading: false,
        latency: data.latency,
        error: data.error,
      });
    } catch (e: any) {
      setSentimentStatus({ ok: false, loading: false, error: e.message });
    }
  }, []);

  // Test All on Mount
  const testAllConnectors = useCallback(() => {
    testOpenRouter();
    testChart();
    testQuote();
    testSentiment();
  }, [testOpenRouter, testChart, testQuote, testSentiment]);

  useEffect(() => {
    const timer = setTimeout(testAllConnectors, 700);
    return () => clearTimeout(timer);
  }, [testAllConnectors]);

  // Handle Save API Key
  const handleSaveKey = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tradingalpha_openrouter_key', userApiKey);
      localStorage.setItem('tradingalpha_model', selectedModel);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
      testOpenRouter(userApiKey);
    }
  };

  const handleResetKey = () => {
    setUserApiKey('');
    setSelectedModel(DEFAULT_AI_MODEL);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tradingalpha_openrouter_key');
      localStorage.removeItem('tradingalpha_model');
    }
    testOpenRouter('');
  };

  return (
    <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <span>⚙️ Panel de Control & Ajustes</span>
            <span>•</span>
            <span className="text-slate-400">Diagnóstico en Tiempo Real</span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🔌</span> Conectores Activos y Configuración de Inteligencia Artificial
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Supervisa el estado de salud de las APIs de mercado y personaliza la clave de acceso a OpenRouter y el modelo de IA utilizado para los informes.
          </p>
        </div>

        <button
          onClick={testAllConnectors}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span>🔄</span> Probar Todos los Conectores
        </button>
      </div>

      {/* 1. STATUS GRID OF CONNECTORS */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>📡</span> Estado de Conectores del Sistema (4 Activos)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connector 1: OpenRouter AI */}
          <div className="bg-[#141d30] p-5 rounded-2xl border border-[#223048] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className="font-bold text-white text-sm">OpenRouter AI Gateway</h4>
                  <p className="text-[11px] text-slate-400">Informes con los modelos disponibles en el selector</p>
                </div>
              </div>

              {/* Visual Status Indicator Badge */}
              <div className="flex items-center gap-1.5">
                {openRouterStatus.loading ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Comprobando...
                  </span>
                ) : openRouterStatus.ok === true ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Conector Activo
                  </span>
                ) : openRouterStatus.ok === false ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Inactivo / Error
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-700 text-slate-300">
                    Sin verificar
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#0e1626] p-3 rounded-xl border border-[#1e293b] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Latencia de red:</span>
                <span className="text-white font-bold">{openRouterStatus.latency ? `${openRouterStatus.latency} ms` : '—'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Consumo registrado:</span>
                <span className="text-emerald-400 font-bold">{openRouterStatus.usage || '—'}</span>
              </div>
              {openRouterStatus.error && (
                <div className="text-rose-400 text-[11px] pt-1">
                  ⚠️ {openRouterStatus.error}
                </div>
              )}
            </div>

            <button
              onClick={() => testOpenRouter()}
              disabled={openRouterStatus.loading}
              className="w-full text-xs font-semibold py-2 rounded-xl bg-[#1a253c] hover:bg-[#223048] text-slate-300 transition-all border border-[#2e3e58]"
            >
              {openRouterStatus.loading ? 'Verificando...' : 'Probar Conexión OpenRouter'}
            </button>
          </div>

          {/* Connector 2: Yahoo Chart API */}
          <div className="bg-[#141d30] p-5 rounded-2xl border border-[#223048] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📈</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Yahoo Finance Chart API</h4>
                  <p className="text-[11px] text-slate-400">Series temporales, velas OHLCV y volúmenes</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {chartStatus.loading ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Comprobando...
                  </span>
                ) : chartStatus.ok === true ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Conector Activo
                  </span>
                ) : chartStatus.ok === false ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Inactivo / Error
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-700 text-slate-300">
                    Sin verificar
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#0e1626] p-3 rounded-xl border border-[#1e293b] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Latencia de red:</span>
                <span className="text-white font-bold">{chartStatus.latency ? `${chartStatus.latency} ms` : '—'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Protocolo:</span>
                <span className="text-blue-400 font-bold">HTTPS REST (Cloudflare CDN Edge)</span>
              </div>
              {chartStatus.error && (
                <div className="text-rose-400 text-[11px] pt-1">
                  ⚠️ {chartStatus.error}
                </div>
              )}
            </div>

            <button
              onClick={testChart}
              disabled={chartStatus.loading}
              className="w-full text-xs font-semibold py-2 rounded-xl bg-[#1a253c] hover:bg-[#223048] text-slate-300 transition-all border border-[#2e3e58]"
            >
              {chartStatus.loading ? 'Verificando...' : 'Probar Conexión Gráficos'}
            </button>
          </div>

          {/* Connector 3: Yahoo Quote Summary */}
          <div className="bg-[#141d30] p-5 rounded-2xl border border-[#223048] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📑</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Yahoo Quote Summary</h4>
                  <p className="text-[11px] text-slate-400">Cuentas anuales a 4 años, ratios y balances</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {quoteStatus.loading ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Comprobando...
                  </span>
                ) : quoteStatus.ok === true ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Conector Activo
                  </span>
                ) : quoteStatus.ok === false ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Inactivo / Error
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-700 text-slate-300">
                    Sin verificar
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#0e1626] p-3 rounded-xl border border-[#1e293b] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Latencia de red:</span>
                <span className="text-white font-bold">{quoteStatus.latency ? `${quoteStatus.latency} ms` : '—'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sesión en memoria:</span>
                <span className="text-emerald-400 font-bold">Cookie + Crumb Cacheado (20m)</span>
              </div>
              {quoteStatus.error && (
                <div className="text-rose-400 text-[11px] pt-1">
                  ⚠️ {quoteStatus.error}
                </div>
              )}
            </div>

            <button
              onClick={testQuote}
              disabled={quoteStatus.loading}
              className="w-full text-xs font-semibold py-2 rounded-xl bg-[#1a253c] hover:bg-[#223048] text-slate-300 transition-all border border-[#2e3e58]"
            >
              {quoteStatus.loading ? 'Verificando...' : 'Probar Conexión Balances'}
            </button>
          </div>

          {/* Connector 4: News & Sentiment Engine */}
          <div className="bg-[#141d30] p-5 rounded-2xl border border-[#223048] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🧠</span>
                <div>
                  <h4 className="font-bold text-white text-sm">News & Sentiment Engine</h4>
                  <p className="text-[11px] text-slate-400">Yahoo News, Google RSS & Algoritmo NSI</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {sentimentStatus.loading ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Comprobando...
                  </span>
                ) : sentimentStatus.ok === true ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Conector Activo
                  </span>
                ) : sentimentStatus.ok === false ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Inactivo / Error
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-700 text-slate-300">
                    Sin verificar
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#0e1626] p-3 rounded-xl border border-[#1e293b] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Latencia de red:</span>
                <span className="text-white font-bold">{sentimentStatus.latency ? `${sentimentStatus.latency} ms` : '—'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Idiomas soportados:</span>
                <span className="text-cyan-400 font-bold">Español & English (Bilingüe)</span>
              </div>
              {sentimentStatus.error && (
                <div className="text-rose-400 text-[11px] pt-1">
                  ⚠️ {sentimentStatus.error}
                </div>
              )}
            </div>

            <button
              onClick={testSentiment}
              disabled={sentimentStatus.loading}
              className="w-full text-xs font-semibold py-2 rounded-xl bg-[#1a253c] hover:bg-[#223048] text-slate-300 transition-all border border-[#2e3e58]"
            >
              {sentimentStatus.loading ? 'Verificando...' : 'Probar Conexión Noticias'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-300">Tarifas consultadas el 7 de septiembre de 2026. Las estimaciones usan 2.000 tokens de entrada y 1.000 de salida; el coste real depende del consumo y de la tarifa vigente de OpenRouter.</p>
      {/* 2. OPENROUTER CONFIGURATION & API KEY SETTINGS */}
      <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🔑</span> Configuración de Clave API de OpenRouter
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Utiliza tu propia clave de OpenRouter. Al guardarla, permanece solo durante esta sesión del navegador y se envía a nuestro servidor para consultar OpenRouter. Puedes borrarla en cualquier momento.
          </p>
        </div>

        {/* Input API Key */}
        <div className="space-y-2">
          <label htmlFor="openrouter-api-key" className="text-xs font-semibold text-slate-300 block">
            Clave de API de OpenRouter (formato: <code className="text-blue-400">sk-or-v1-...</code>)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="openrouter-api-key"
                autoComplete="off"
                type={showKey ? 'text' : 'password'}
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                placeholder="Introduce tu clave personal sk-or-v1-..."
                className="w-full bg-[#141d30] text-sm text-white placeholder-slate-500 px-4 py-2.5 rounded-xl border border-[#223048] focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                {showKey ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            <button
              onClick={handleSaveKey}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all shrink-0"
            >
              Guardar Clave
            </button>

            <button
              onClick={handleResetKey}
              title="Borrar la clave de esta sesión y restablecer el modelo"
              className="bg-[#141d30] hover:bg-[#1a253c] text-slate-300 text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#223048] transition-all shrink-0"
            >
              Restablecer
            </button>
          </div>

          {saveSuccessMsg && (
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              ✓ Clave guardada para esta sesión. Preferencia de modelo actualizada.
            </p>
          )}
        </div>

        {/* AI Model Selector */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Modelo de Inteligencia Artificial Seleccionado:
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AVAILABLE_MODELS.map((model) => (
              <div
                key={model.id}
                role="button"
                tabIndex={0}
                aria-pressed={selectedModel === model.id}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }}
                onClick={() => {
                  setSelectedModel(model.id);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('tradingalpha_model', model.id);
                  }
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedModel === model.id
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-[#141d30] border-[#223048] text-slate-400 hover:text-white hover:bg-[#1a253c]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{model.name}</span>
                    <span className="text-[10px] text-slate-400 font-sans">({model.provider})</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      model.isFree
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedModel === model.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1e293b] text-blue-400 border border-[#2e3e58]'
                    }`}
                  >
                    {model.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {model.desc}
                </p>

                {/* OpenRouter Pricing Breakdown */}
                <div className="bg-[#0e1626] p-2.5 rounded-xl border border-[#1e293b] space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Tarifas OpenRouter:</span>
                    <span className="text-slate-300">
                      In: <strong className="text-emerald-400">{model.inputCost}</strong> | Out: <strong className="text-blue-400">{model.outputCost}</strong>
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#1e293b] pt-1">
                    <span className="text-slate-400">Coste estimado / informe:</span>
                    <span className="font-bold text-amber-300">{model.costPerReport}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Informes estimados por $1:</span>
                    <span className="text-slate-300 font-semibold">{model.reportsPerDollar}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
