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

export interface AIModelOption {
  id: string;
  name: string;
  provider: string;
  badge: string;
  inputCost: string;
  outputCost: string;
  costPerReport: string;
  reportsPerDollar: string;
  desc: string;
  isFree?: boolean;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'z-ai/glm-5.3-flash',
    name: 'GLM 5.3 Flash',
    provider: 'Zhipu AI (Z.ai)',
    badge: 'Ultra Económico ($0.075/M)',
    inputCost: '$0.075 / 1M',
    outputCost: '$0.250 / 1M',
    costPerReport: '~$0.00019',
    reportsPerDollar: '≈ 5.200 informes / $1',
    desc: 'El modelo de alta velocidad más asequible de la familia GLM. Destaca por su rapidez, capacidad de razonamiento lógico y coste minúsculo.',
  },
  {
    id: 'google/gemini-3.5-flash-lite',
    name: 'Google Gemini 3.5 Flash Lite',
    provider: 'Google DeepMind',
    badge: 'Recomendado ($0.30/M)',
    inputCost: '$0.300 / 1M',
    outputCost: '$2.500 / 1M',
    costPerReport: '~$0.00150',
    reportsPerDollar: '≈ 660 informes / $1',
    desc: 'El estándar de oro en velocidad (~200ms) y precisión en la estructuración de informes ejecutivos institucionales.',
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Google Gemini 2.5 Flash Lite',
    provider: 'Google DeepMind',
    badge: 'Hiper Asequible ($0.10/M)',
    inputCost: '$0.100 / 1M',
    outputCost: '$0.400 / 1M',
    costPerReport: '~$0.00030',
    reportsPerDollar: '≈ 3.300 informes / $1',
    desc: 'Versión ultraligera de Gemini con inferencia casi instantánea y costes mínimos.',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    badge: 'Gran Rigor Lógico ($0.26/M)',
    inputCost: '$0.257 / 1M',
    outputCost: '$1.028 / 1M',
    costPerReport: '~$0.00070',
    reportsPerDollar: '≈ 1.400 informes / $1',
    desc: 'Modelo MoE puntero especializado en análisis financiero, cuentas anuales y deducción contable.',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    provider: 'OpenAI',
    badge: 'Estándar OpenAI ($0.15/M)',
    inputCost: '$0.150 / 1M',
    outputCost: '$0.600 / 1M',
    costPerReport: '~$0.00045',
    reportsPerDollar: '≈ 2.200 informes / $1',
    desc: 'El modelo económico de OpenAI optimizado para respuestas rápidas y formato consistente.',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Anthropic Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'Calidad Élite ($3.00/M)',
    inputCost: '$3.000 / 1M',
    outputCost: '$15.000 / 1M',
    costPerReport: '~$0.01000',
    reportsPerDollar: '≈ 100 informes / $1',
    desc: 'La redacción institucional más cuidada y el análisis cualitativo más exhaustivo del mercado.',
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'GLM 5.2 (Free Tier)',
    provider: 'Zhipu AI (OpenRouter)',
    badge: '100% Gratuito (:free)',
    inputCost: '$0.00 / 1M',
    outputCost: '$0.00 / 1M',
    costPerReport: '$0.00 (Gratis)',
    reportsPerDollar: 'Ilimitado (Gratis)',
    isFree: true,
    desc: 'Modelo gratuito de cortesía ofrecido por OpenRouter sin consumo de saldo (sujeto a límite de peticiones).',
  },
];

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
    testAllConnectors();
  }, [testAllConnectors]);

  // Handle Save API Key
  const handleSaveKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tradingalpha_openrouter_key', userApiKey);
      localStorage.setItem('tradingalpha_model', selectedModel);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
      testOpenRouter(userApiKey);
    }
  };

  const handleResetKey = () => {
    setUserApiKey('');
    setSelectedModel('google/gemini-3.5-flash-lite');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tradingalpha_openrouter_key');
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
                  <p className="text-[11px] text-slate-400">Generación de Tesis con Gemini, Claude o DeepSeek</p>
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

      {/* 2. OPENROUTER CONFIGURATION & API KEY SETTINGS */}
      <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🔑</span> Configuración de Clave API de OpenRouter
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Puedes introducir tu propia clave de OpenRouter o dejar la clave del servidor predeterminada. La clave se almacena de forma segura en tu navegador.
          </p>
        </div>

        {/* Input API Key */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Clave de API de OpenRouter (formato: <code className="text-blue-400">sk-or-v1-...</code>)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                placeholder="Introduce tu clave sk-or-v1-... (o déjalo vacío para usar la clave por defecto)"
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
              title="Restablecer clave por defecto del sistema"
              className="bg-[#141d30] hover:bg-[#1a253c] text-slate-300 text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#223048] transition-all shrink-0"
            >
              Restablecer
            </button>
          </div>

          {saveSuccessMsg && (
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              ✓ Clave y modelo guardados en la memoria de tu navegador con éxito.
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
                    <span className="text-slate-400">Coste medio / informe:</span>
                    <span className="font-bold text-amber-300">{model.costPerReport}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Rendimiento por \$1:</span>
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
