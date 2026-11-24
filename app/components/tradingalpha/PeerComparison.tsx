"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { SP500_SECTORS } from './sp500Data';

const MODULES = 'price,summaryDetail,defaultKeyStatistics,financialData,assetProfile';
const MAX_CANDIDATES = 12;
const MAX_PEERS = 8;

const raw = (v: any): number | null => {
  const n = typeof v === 'number' ? v : v?.raw;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

interface PeerRow {
  ticker: string;
  name: string;
  industry: string | null;
  sector: string | null;
  metrics: Record<MetricKey, number | null>;
}

type MetricKey = 'pe' | 'evEbitda' | 'evSales' | 'opMargin' | 'roe' | 'growth';
const METRICS: Array<{ key: MetricKey; label: string; pct: boolean }> = [
  { key: 'pe', label: 'PER TTM', pct: false },
  { key: 'evEbitda', label: 'EV/EBITDA', pct: false },
  { key: 'evSales', label: 'EV/Ventas', pct: false },
  { key: 'opMargin', label: 'Margen operativo', pct: true },
  { key: 'roe', label: 'ROE', pct: true },
  { key: 'growth', label: 'Crec. ventas', pct: true },
];

function toRow(ticker: string, d: any): PeerRow {
  const sum = d?.summaryDetail || {}, ks = d?.defaultKeyStatistics || {}, fin = d?.financialData || {};
  // Los múltiplos de Yahoo mezclan precio y contabilidad: solo valen si ambas monedas coinciden.
  const comparable = !d?.price?.currency || !fin.financialCurrency || d.price.currency === fin.financialCurrency;
  const positive = (v: number | null) => (v != null && v > 0 ? v : null);
  return {
    ticker,
    name: d?.price?.shortName || d?.price?.longName || ticker,
    industry: d?.assetProfile?.industry || null,
    sector: d?.assetProfile?.sector || null,
    metrics: {
      pe: comparable ? positive(raw(sum.trailingPE)) : null,
      evEbitda: comparable ? positive(raw(ks.enterpriseToEbitda)) : null,
      evSales: comparable ? positive(raw(ks.enterpriseToRevenue)) : null,
      opMargin: raw(fin.operatingMargins),
      roe: raw(fin.returnOnEquity),
      growth: raw(fin.revenueGrowth),
    },
  };
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const fmt = (v: number | null, pct: boolean) => v == null ? 'N/D'
  : pct ? `${(v * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %` : `${v.toLocaleString('es-ES', { maximumFractionDigits: 1 })}×`;

function defaultCandidates(ticker: string): string[] {
  for (const sector of SP500_SECTORS) {
    const self = sector.stocks.find(s => s.ticker === ticker);
    if (!self) continue;
    const same = sector.stocks.filter(s => s.ticker !== ticker && s.subIndustry === self.subIndustry);
    const rest = sector.stocks.filter(s => s.ticker !== ticker && s.subIndustry !== self.subIndustry);
    return [...same, ...rest].slice(0, MAX_CANDIDATES).map(s => s.ticker);
  }
  return [];
}

export default function PeerComparison({ ticker, data }: { ticker: string; data: any }) {
  const self = useMemo(() => toRow(ticker, data), [ticker, data]);
  const [input, setInput] = useState(() => defaultCandidates(ticker).join(', '));
  const [candidates, setCandidates] = useState<string[]>(() => defaultCandidates(ticker));
  const [peers, setPeers] = useState<PeerRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!candidates.length) { setPeers([]); return; }
    let alive = true;
    setLoading(true);
    Promise.all(candidates.slice(0, MAX_CANDIDATES).map(t =>
      fetch(`/api/quoteSummary?t=${encodeURIComponent(t)}&modules=${MODULES}`).then(r => (r.ok ? r.json() : null)).then(j => (j?.data ? toRow(t, j.data) : null)).catch(() => null),
    )).then(rows => {
      if (!alive) return;
      const valid = rows.filter((r): r is PeerRow => r != null);
      // Primero la misma industria de Yahoo; si no hay suficientes, el mismo sector.
      const sameIndustry = valid.filter(r => self.industry && r.industry === self.industry);
      const sameSector = valid.filter(r => !sameIndustry.includes(r) && self.sector && r.sector === self.sector);
      setPeers([...sameIndustry, ...sameSector].slice(0, MAX_PEERS));
      setLoading(false);
    });
    return () => { alive = false; };
  }, [candidates, self.industry, self.sector]);

  const medians = useMemo(() => Object.fromEntries(METRICS.map(m => [m.key,
    median((peers || []).map(p => p.metrics[m.key]).filter((v): v is number => v != null))])) as Record<MetricKey, number | null>, [peers]);

  return (
    <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 space-y-4">
      <div>
        <h4 className="font-semibold text-white">Comparables del sector</h4>
        <p className="text-xs text-slate-400 mt-1">
          Un PER de 25 puede ser alto en banca y bajo en software: los múltiplos se interpretan frente a empresas parecidas.
          Se usan candidatos del directorio S&amp;P 500 (o los que escribas) y se conservan los de la misma industria de Yahoo ({self.industry || 'N/D'}) y, si faltan, del mismo sector.
        </p>
      </div>
      <form className="flex flex-col sm:flex-row gap-2" onSubmit={e => { e.preventDefault(); setCandidates(input.split(/[\s,;]+/).map(s => s.trim().toUpperCase()).filter(s => s && s !== ticker)); }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Tickers comparables, p. ej. BBVA.MC, CABK.MC, SAB.MC" className="flex-1 rounded-lg bg-[#141d30] border border-[#223048] px-3 py-2 text-sm text-white font-mono" />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg px-4 py-2">Comparar</button>
      </form>
      {!candidates.length && <p className="text-xs text-amber-300">{ticker} no está en el directorio S&amp;P 500: escribe sus comparables (máximo {MAX_CANDIDATES}).</p>}
      {loading && <p className="text-xs text-slate-400">Consultando comparables…</p>}
      {peers && !loading && peers.length === 0 && candidates.length > 0 && <p className="text-xs text-amber-300">Ningún candidato pertenece a la misma industria o sector según Yahoo.</p>}
      {peers && peers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-[#223048]">
                <th className="text-left py-2 px-2">Empresa</th>
                {METRICS.map(m => <th key={m.key} className="text-right py-2 px-2">{m.label}</th>)}
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-[#223048] bg-[#141d30]">
                <td className="py-2 px-2 font-sans font-semibold text-white">{ticker}</td>
                {METRICS.map(m => {
                  const v = self.metrics[m.key], med = medians[m.key];
                  const diff = v != null && med != null && med !== 0 ? (v - med) / Math.abs(med) : null;
                  return <td key={m.key} className="text-right py-2 px-2 text-white">{fmt(v, m.pct)}
                    {diff != null && <span className="block text-[10px] text-slate-400">{diff >= 0 ? '+' : ''}{(diff * 100).toFixed(0)} % vs mediana</span>}</td>;
                })}
              </tr>
              <tr className="border-b border-[#223048] text-sky-300">
                <td className="py-2 px-2 font-sans">Mediana ({peers.length})</td>
                {METRICS.map(m => <td key={m.key} className="text-right py-2 px-2">{fmt(medians[m.key], m.pct)}</td>)}
              </tr>
              {peers.map(p => (
                <tr key={p.ticker} className="border-b border-[#1b2537] text-slate-300">
                  <td className="py-1.5 px-2 font-sans"><span className="font-mono">{p.ticker}</span> <span className="text-slate-500">{p.name}</span></td>
                  {METRICS.map(m => <td key={m.key} className="text-right py-1.5 px-2">{fmt(p.metrics[m.key], m.pct)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-500 mt-2">Múltiplos de Yahoo; solo se muestran cuando precio y contabilidad están en la misma moneda. Valores negativos de PER o EV/EBITDA se omiten. Estar por debajo de la mediana en múltiplos no implica infravaloración si la calidad o el crecimiento también son menores.</p>
        </div>
      )}
    </div>
  );
}
