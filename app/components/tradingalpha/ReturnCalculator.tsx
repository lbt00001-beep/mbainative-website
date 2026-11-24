"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReturnLeg, ReturnSummary, RiskStats } from '@/lib/realReturn';
import { getInstrumentConfig } from './instruments';

interface ReturnResponse extends ReturnSummary {
  ticker: string;
  name: string;
  quoteCurrency: string;
  currency: string;
  requestedFrom: string;
  cpiLabel: string | null;
  notes: string[];
  benchmark: { ticker: string; label: string } | null;
  risk: RiskStats | null;
}

// Paleta validada (dataviz) sobre la superficie #111928: azul = nominal, ámbar = real.
const NOMINAL = '#3b82f6';
const REAL = '#d97706';

const pct = (v: number | null | undefined, digits = 1) =>
  v == null ? 'N/D' : `${v >= 0 ? '+' : ''}${new Intl.NumberFormat('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v * 100)} %`;
const num = (v: number, digits = 2) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
const dateEs = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const tone = (v: number | null | undefined) => (v == null ? 'text-slate-400' : v >= 0 ? 'text-emerald-400' : 'text-rose-400');

function GrowthChart({ data, currency }: { data: ReturnResponse; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 760, H = 300, pad = { top: 16, right: 92, bottom: 28, left: 56 };
  const pts = data.series;
  const values = pts.flatMap(p => (p.real != null ? [p.nominal, p.real] : [p.nominal]));
  const lo = Math.log10(Math.min(...values) * 0.9), hi = Math.log10(Math.max(...values) * 1.1);
  const x = (i: number) => pad.left + (i / Math.max(1, pts.length - 1)) * (W - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (Math.log10(v) - lo) / (hi - lo)) * (H - pad.top - pad.bottom);
  const path = (key: 'nominal' | 'real') => pts.map((p, i) => (p[key] == null ? '' : `${i === 0 || pts[i - 1][key] == null ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[key]!).toFixed(1)}`)).join('');

  // Escala logarítmica: marcas 1-2-5 por década, para que igual distancia vertical = igual variación porcentual.
  const ticks: number[] = [];
  for (let d = Math.floor(lo); d <= Math.ceil(hi); d++) for (const m of [1, 2, 5]) {
    const v = m * 10 ** d;
    if (Math.log10(v) >= lo && Math.log10(v) <= hi) ticks.push(v);
  }
  const yearTicks = pts.map((p, i) => ({ i, year: p.date.slice(0, 4) }))
    .filter((p, k, arr) => k === 0 || p.year !== arr[k - 1].year);
  const step = Math.ceil(yearTicks.length / 8);

  const onMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - pad.left) / (W - pad.left - pad.right)) * (pts.length - 1));
    setHover(Math.min(pts.length - 1, Math.max(0, i)));
  }, [pts.length, pad.left, pad.right]);

  const last = pts[pts.length - 1];
  const hp = hover != null ? pts[hover] : null;
  const fmtIdx = (v: number) => num(v, v >= 1000 ? 0 : 1);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-4 text-xs text-slate-300 mb-2" aria-hidden="true">
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5" style={{ background: NOMINAL }} />Nominal ({currency})</span>
        {last.real != null && <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5" style={{ background: REAL }} />Real (poder adquisitivo inicial)</span>}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none select-none" role="img"
        aria-label={`Evolución de 100 invertidos en ${data.ticker}: ${fmtIdx(last.nominal)} nominal${last.real != null ? ` y ${fmtIdx(last.real)} en términos reales` : ''}`}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map(v => (
          <g key={v}>
            <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="#1e293b" strokeWidth={1} />
            <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#94a3b8">{num(v, 0)}</text>
          </g>
        ))}
        {y(100) >= pad.top && y(100) <= H - pad.bottom && <line x1={pad.left} x2={W - pad.right} y1={y(100)} y2={y(100)} stroke="#64748b" strokeDasharray="3 3" strokeWidth={1} />}
        {yearTicks.filter((_, k) => k % step === 0).map(t => (
          <text key={t.year} x={x(t.i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#94a3b8">{t.year}</text>
        ))}
        <path d={path('nominal')} fill="none" stroke={NOMINAL} strokeWidth={2} strokeLinejoin="round" />
        {last.real != null && <path d={path('real')} fill="none" stroke={REAL} strokeWidth={2} strokeLinejoin="round" />}
        <text x={W - pad.right + 8} y={y(last.nominal) + 4} fontSize={11} fill="#e2e8f0">{fmtIdx(last.nominal)} nom.</text>
        {last.real != null && <text x={W - pad.right + 8} y={y(last.real) + (Math.abs(y(last.real) - y(last.nominal)) < 14 ? 18 : 4)} fontSize={11} fill="#e2e8f0">{fmtIdx(last.real)} real</text>}
        {hp && (
          <g>
            <line x1={x(hover!)} x2={x(hover!)} y1={pad.top} y2={H - pad.bottom} stroke="#64748b" strokeWidth={1} />
            <circle cx={x(hover!)} cy={y(hp.nominal)} r={4} fill={NOMINAL} stroke="#111928" strokeWidth={2} />
            {hp.real != null && <circle cx={x(hover!)} cy={y(hp.real)} r={4} fill={REAL} stroke="#111928" strokeWidth={2} />}
          </g>
        )}
      </svg>
      {hp && (
        <div className="absolute top-8 pointer-events-none bg-[#0b1220] border border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-200 shadow-xl"
          style={{ left: `${Math.min(70, (x(hover!) / W) * 100)}%` }}>
          <div className="font-semibold text-white">{dateEs(hp.date)}</div>
          <div>Nominal: <strong>{fmtIdx(hp.nominal)}</strong> ({pct(hp.nominal / 100 - 1)})</div>
          {hp.real != null && <div>Real: <strong>{fmtIdx(hp.real)}</strong> ({pct(hp.real / 100 - 1)})</div>}
        </div>
      )}
      <p className="text-[11px] text-slate-500 mt-1">Base 100 en la fecha inicial, con dividendos reinvertidos cuando hay datos. Eje vertical logarítmico.</p>
    </div>
  );
}

function MetricCard({ title, leg, sub }: { title: string; leg: ReturnLeg | null; sub?: string }) {
  return (
    <div className="bg-[#141d30] border border-[#223048] rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{title}</div>
      <div className={`text-2xl font-extrabold mt-1 ${tone(leg?.total)}`}>{pct(leg?.total)}</div>
      <div className="text-xs text-slate-400 mt-1">Anual compuesta: <span className={tone(leg?.cagr)}>{pct(leg?.cagr, 2)}</span></div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function RiskPanel({ risk, benchmark, ticker }: { risk: RiskStats; benchmark: { ticker: string; label: string }; ticker: string }) {
  const ratio = (v: number | null) => (v == null ? 'N/D' : num(v, 2));
  const items: Array<{ label: string; value: string; note: string; cls?: string }> = [
    { label: 'Beta', value: num(risk.beta, 2), note: `Si el índice sube un 1 %, ${ticker} se ha movido de media un ${num(risk.beta, 2)} %. Correlación ${num(risk.correlation, 2)}.` },
    { label: 'Alfa anual (Jensen)', value: pct(risk.alpha, 1), cls: tone(risk.alpha), note: 'Rentabilidad por encima de la que explicaría su beta frente al índice.' },
    { label: 'Ratio de Sharpe', value: ratio(risk.sharpe), note: `Rentabilidad sobre el tipo sin riesgo por unidad de volatilidad. Índice: ${ratio(risk.benchmarkSharpe)}.` },
    { label: 'Ratio de Sortino', value: ratio(risk.sortino), note: 'Como Sharpe, pero solo penaliza las caídas.' },
    { label: 'Error de seguimiento', value: `${num(risk.trackingError * 100, 1)} %`, note: 'Volatilidad anual de la diferencia mensual frente al índice.' },
    { label: 'Ratio de información', value: num(risk.informationRatio, 2), note: 'Diferencia anual media frente al índice ÷ error de seguimiento.' },
  ];
  return (
    <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-4">
      <div>
        <h4 className="font-semibold text-white">Riesgo frente al índice: {benchmark.ticker}</h4>
        <p className="text-xs text-slate-400 mt-1">
          {benchmark.label}. Periodo común {dateEs(risk.from)} → {dateEs(risk.to)} ({risk.months} meses): {ticker} <span className={tone(risk.stockCagr)}>{pct(risk.stockCagr, 2)}</span> anual frente a <span className={tone(risk.benchmarkCagr)}>{pct(risk.benchmarkCagr, 2)}</span> del índice, ambos con dividendos.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map(i => (
          <div key={i.label} className="bg-[#141d30] border border-[#223048] rounded-xl p-3">
            <div className="text-slate-400 uppercase text-[10px]">{i.label}</div>
            <div className={`font-bold text-base mt-0.5 ${i.cls ?? 'text-white'}`}>{i.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{i.note}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">Rentabilidades totales mensuales de fin de mes. Tipo sin riesgo: {risk.riskFreeLabel ?? 'no disponible para esta moneda (alfa, Sharpe y Sortino N/D)'}.</p>
    </div>
  );
}

export default function ReturnCalculator({ defaultTicker }: { defaultTicker: string }) {
  const [ticker, setTicker] = useState(defaultTicker);
  const [from, setFrom] = useState('2000-01-01');
  const [to, setTo] = useState('');
  const [bench, setBench] = useState('');
  const [view, setView] = useState<'local' | 'eur'>('local');
  const [deflator, setDeflator] = useState<'ea' | 'es'>('ea');
  const [data, setData] = useState<ReturnResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alias, setAlias] = useState<string | null>(null);
  const requestId = useRef(0);

  const calculate = useCallback(async (symbol: string) => {
    const typed = symbol.trim().toUpperCase();
    if (!typed) return;
    // Códigos de bolsa que Yahoo publica con otro símbolo (p. ej. SMSN → SMSN.IL).
    const t = getInstrumentConfig(typed).chartTicker || typed;
    setAlias(t !== typed ? getInstrumentConfig(typed).warning ?? `${typed} se consulta en Yahoo como ${t}.` : null);
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ t, from: from || '2000-01-01', view, deflator });
      if (to) qs.set('to', to);
      if (bench.trim()) qs.set('bench', bench.trim().toUpperCase());
      const res = await fetch(`/api/priceReturn?${qs}`);
      const body = await res.json();
      if (id !== requestId.current) return;
      if (!res.ok) { setData(null); setError(body.error || `Error HTTP ${res.status}`); }
      else setData(body);
    } catch (e: any) {
      if (id === requestId.current) { setData(null); setError(e?.message || 'Error de red'); }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [from, to, view, deflator, bench]);

  // Primer cálculo automático con el activo que se está analizando.
  useEffect(() => { calculate(defaultTicker); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const annual = useMemo(() => {
    if (!data) return [];
    const ends = data.series.filter((p, i, arr) => i === arr.length - 1 || arr[i + 1].date.slice(0, 4) !== p.date.slice(0, 4)).filter(p => p !== data.series[0]);
    const firstYear = data.startDate.slice(0, 4);
    const startsLate = data.startDate > `${firstYear}-01-07`;
    const endsEarly = data.endDate < `${data.endDate.slice(0, 4)}-12-24`;
    let prev = data.series[0];
    return ends.map(p => {
      const year = p.date.slice(0, 4);
      const row = {
        year,
        partial: (year === firstYear && startsLate) || (p.date === data.endDate && endsEarly),
        nominal: p.nominal / prev.nominal - 1,
        real: p.real != null && prev.real != null ? p.real / prev.real - 1 : null,
      };
      prev = p;
      return row;
    });
  }, [data]);

  const input = 'bg-[#141d30] text-sm text-white rounded-lg border border-[#223048] px-3 py-2 focus:outline-none focus:border-blue-500';
  const cur = data?.currency ?? '';

  return (
    <div className="space-y-6">
      <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">📐 Revalorización histórica: nominal y real</h3>
          <p className="text-xs text-slate-400 mt-1">Escribe un símbolo y el periodo. Por defecto: desde el 1 de enero de 2000 hasta la última sesión cotizada. La variación real descuenta la inflación del área monetaria del precio.</p>
        </div>
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1.4fr_1fr_auto] gap-3 items-end"
          onSubmit={e => { e.preventDefault(); calculate(ticker); }}>
          <label className="text-xs text-slate-400 flex flex-col gap-1">Ticker
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="AAPL, SAN.MC, ^GSPC…" className={`${input} font-mono uppercase`} />
          </label>
          <label className="text-xs text-slate-400 flex flex-col gap-1">Desde
            <input type="date" value={from} min="1970-01-01" onChange={e => setFrom(e.target.value)} className={input} />
          </label>
          <label className="text-xs text-slate-400 flex flex-col gap-1">Hasta
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={input} title="Vacío = última sesión cotizada" />
          </label>
          <label className="text-xs text-slate-400 flex flex-col gap-1">Perspectiva
            <select value={view === 'eur' ? `eur-${deflator}` : 'local'} className={input}
              onChange={e => { const v = e.target.value; setView(v === 'local' ? 'local' : 'eur'); if (v !== 'local') setDeflator(v === 'eur-es' ? 'es' : 'ea'); }}>
              <option value="local">Moneda de cotización + su IPC</option>
              <option value="eur-ea">Inversor en euros · IPCA zona euro</option>
              <option value="eur-es">Inversor en euros · IPCA España</option>
            </select>
          </label>
          <label className="text-xs text-slate-400 flex flex-col gap-1">Índice (opcional)
            <input value={bench} onChange={e => setBench(e.target.value.toUpperCase())} placeholder="Automático" title="Vacío: ^SP500TR (USD), EXSA.DE (EUR) o ISF.L (GBP)" className={`${input} font-mono uppercase`} />
          </label>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-5 py-2">
            {loading ? 'Calculando…' : 'Calcular'}
          </button>
        </form>
        <p className="text-[11px] text-slate-500">«Hasta» vacío equivale a la última fecha cotizada.{view === 'eur' && ' La primera conversión a euros descarga los tipos diarios del BCE y puede tardar unos 20 segundos.'}</p>
      </div>

      {alias && <div className="text-xs px-4 py-3 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200">{alias}</div>}

      {error && <div className="text-sm px-4 py-3 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200">{error}</div>}

      {data && (
        <div className={`space-y-6 ${loading ? 'opacity-60' : ''}`}>
          <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-xl font-black font-mono text-white">{data.ticker}</span>
                <span className="text-sm text-slate-400 ml-2">{data.name}</span>
              </div>
              <div className="text-xs text-slate-400">
                {dateEs(data.startDate)} → {dateEs(data.endDate)} · {num(data.years, 1)} años · {cur}{data.currency !== data.quoteCurrency ? ` (cotiza en ${data.quoteCurrency})` : ''}
              </div>
            </div>
            <div className="text-sm text-slate-300">
              Precio: <strong className="text-white">{num(data.startPrice)} {cur}</strong> → <strong className="text-white">{num(data.endPrice)} {cur}</strong>
              <span className="text-slate-500"> (ajustado por splits)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <MetricCard title="Subida del precio · nominal" leg={data.price} sub={`${num(1000 * (1 + data.price.total), 0)} ${cur} por cada 1.000 invertidos`} />
              <MetricCard title="Subida del precio · real" leg={data.realPrice} sub={data.realPrice ? `Poder adquisitivo de ${data.startDate.slice(0, 4)}` : 'Sin índice de precios aplicable'} />
              <MetricCard title="Rentabilidad total · nominal" leg={data.totalReturn} sub="Precio + dividendos reinvertidos, antes de impuestos" />
              <MetricCard title="Rentabilidad total · real" leg={data.realTotalReturn} sub="Descontada la inflación" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#141d30] border border-[#223048] rounded-xl p-3">
                <div className="text-slate-400 uppercase text-[10px]">Inflación acumulada</div>
                <div className="text-white font-bold text-base mt-0.5">{pct(data.inflation?.total)} <span className="text-slate-400 font-normal text-xs">({pct(data.inflation?.cagr, 2)} anual)</span></div>
                <div className="text-slate-500 mt-0.5">{data.cpiLabel ? `${data.cpiLabel}, ${data.cpiStartMonth} → ${data.cpiEndMonth}` : 'No disponible'}</div>
              </div>
              <div className="bg-[#141d30] border border-[#223048] rounded-xl p-3">
                <div className="text-slate-400 uppercase text-[10px]">Máxima caída desde máximos</div>
                <div className="text-rose-400 font-bold text-base mt-0.5">{pct(data.maxDrawdown?.value)}{data.maxDrawdownReal && <span className="text-slate-400 font-normal text-xs"> · real {pct(data.maxDrawdownReal.value)}</span>}</div>
                <div className="text-slate-500 mt-0.5">{data.maxDrawdown ? `${dateEs(data.maxDrawdown.peakDate)} → ${dateEs(data.maxDrawdown.troughDate)}` : '—'}</div>
              </div>
              <div className="bg-[#141d30] border border-[#223048] rounded-xl p-3">
                <div className="text-slate-400 uppercase text-[10px]">Volatilidad anualizada</div>
                <div className="text-white font-bold text-base mt-0.5">{data.volatility == null ? 'N/D' : `${num(data.volatility * 100, 1)} %`}</div>
                <div className="text-slate-500 mt-0.5">Desviación típica de rentabilidades mensuales × √12</div>
              </div>
            </div>
            {data.notes.length > 0 && (
              <ul className="text-xs text-amber-200 bg-amber-950/30 border border-amber-500/30 rounded-xl px-4 py-3 space-y-1">
                {data.notes.map(n => <li key={n}>• {n}</li>)}
              </ul>
            )}
          </div>

          {data.risk && data.benchmark && <RiskPanel risk={data.risk} benchmark={data.benchmark} ticker={data.ticker} />}

          <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5">
            <h4 className="font-semibold text-white mb-3">Evolución de 100 {cur} invertidos</h4>
            <GrowthChart data={data} currency={cur} />
          </div>

          <details className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5">
            <summary className="cursor-pointer font-semibold text-white">Rentabilidad total por año natural (tabla)</summary>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-xs border-b border-[#1e293b]">
                  <th className="text-left py-2 px-2">Año</th><th className="text-right py-2 px-2">Nominal</th><th className="text-right py-2 px-2">Real</th>
                </tr></thead>
                <tbody>
                  {annual.map(r => (
                    <tr key={r.year} className="border-b border-[#1e293b]/60">
                      <td className="py-1.5 px-2 text-slate-300">{r.year}{r.partial ? ' (parcial)' : ''}</td>
                      <td className={`py-1.5 px-2 text-right font-mono ${tone(r.nominal)}`}>{pct(r.nominal)}</td>
                      <td className={`py-1.5 px-2 text-right font-mono ${tone(r.real)}`}>{pct(r.real)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Método: variación real = (1 + variación nominal) ÷ (1 + inflación del periodo) − 1. Tasa anual compuesta = (1 + variación)^(1/años) − 1.
            Precios de Yahoo Finance ajustados por splits. La rentabilidad total se reconstruye reinvirtiendo cada dividendo bruto de Yahoo al cierre de su sesión ex-dividendo, sin comisiones ni impuestos.
            Para la inflación se usa el índice mensual del mes de cada fecha. Rentabilidades pasadas no garantizan resultados futuros.
          </p>
        </div>
      )}
    </div>
  );
}
