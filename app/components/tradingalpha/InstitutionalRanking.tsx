"use client";

import React, { useEffect, useState } from 'react';

interface Holding {
  manager: string;
  period: string;
  shares: number;
  value: number;
  ownership: number;
  portfolioWeight: number;
  contribution: number;
}
interface Row { ticker: string; company: string; cusip: string; score: number; contributions: Holding[] }
interface Ranking {
  asOf: string;
  method: string;
  coverage: string;
  managers: Array<{ name: string; period: string; filed: string; source: string; reportedValue: number }>;
  rows: Row[];
  unresolved: number;
}

export default function InstitutionalRanking({ onSelectTicker }: { onSelectTicker: (ticker: string) => void }) {
  const [data, setData] = useState<Ranking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/institutional', { signal: controller.signal })
      .then(async response => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || `HTTP ${response.status}`);
        return json as Ranking;
      })
      .then(setData)
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return <div className="space-y-5">
    <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white">Posiciones de grandes gestores</h3>
      <p className="text-xs text-slate-400 mt-2">Clasificación de posiciones 13F declaradas a la SEC. Mide exposición observada, no convicción ni recomendación: BlackRock, Vanguard y State Street gestionan también productos que replican índices. Cada fila identifica a una entidad declarante concreta, no al conjunto de todas sus filiales.</p>
      {data && <p className="text-xs text-cyan-300 mt-3">{data.method}</p>}
      {data && <p className="text-xs text-amber-200 mt-2">{data.coverage}</p>}
    </div>

    {loading && <div className="bg-[#0e1626] rounded-2xl p-6 text-sm text-slate-300">Consultando las últimas carteras 13F y verificando símbolos y acciones en circulación. La primera carga puede tardar.</div>}
    {error && <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 text-sm text-rose-300">No se pudo calcular la clasificación: {error}</div>}
    {data && <>
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 overflow-x-auto">
        <div className="flex flex-wrap justify-between gap-2 mb-4"><h4 className="font-semibold text-white">Clasificación por índice de exposición</h4><span className="text-xs text-slate-400">Actualizado {new Date(data.asOf).toLocaleString('es-ES')} · {data.unresolved} posiciones sin ticker o base comparable</span></div>
        <table className="w-full text-xs min-w-[680px]"><thead><tr className="border-b border-[#223048] text-slate-400"><th className="py-2 text-left">#</th><th className="text-left">Ticker y empresa</th><th className="text-right">Índice</th><th className="text-right">Gestores</th><th className="text-right">Detalle</th></tr></thead><tbody>
          {data.rows.map((row, index) => <React.Fragment key={row.cusip}>
            <tr className="border-b border-[#1b2537]"><td className="py-2">{index + 1}</td><td><button onClick={() => onSelectTicker(row.ticker)} className="text-cyan-300 hover:underline font-bold">{row.ticker}</button><span className="text-slate-400 ml-2">{row.company}</span></td><td className="text-right font-mono font-bold text-white">{row.score.toFixed(3)}</td><td className="text-right">{row.contributions.length}</td><td className="text-right"><button onClick={() => setExpanded(expanded === row.cusip ? null : row.cusip)} className="text-blue-300 hover:underline">{expanded === row.cusip ? 'Cerrar' : 'Ver'}</button></td></tr>
            {expanded === row.cusip && <tr><td colSpan={5} className="bg-[#111928] p-3"><div className="grid gap-2">{row.contributions.map(holding => <div key={holding.manager} className="grid grid-cols-4 gap-2 text-slate-300"><span>{holding.manager}</span><span className="text-right">Propiedad estimada: {(holding.ownership * 100).toFixed(2)}%</span><span className="text-right">Peso 13F: {(holding.portfolioWeight * 100).toFixed(2)}%</span><span className="text-right">Aporte: {holding.contribution.toFixed(3)}</span></div>)}</div></td></tr>}
          </React.Fragment>)}
        </tbody></table>
        {!data.rows.length && <p className="text-sm text-amber-300 mt-3">Las fuentes no devolvieron suficientes datos comparables para ordenar posiciones.</p>}
      </div>
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5"><h4 className="font-semibold text-white mb-3">Informes utilizados</h4><ul className="space-y-2 text-xs text-slate-300">{data.managers.map(manager => <li key={manager.name}><a href={manager.source} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">{manager.name}</a> · cartera a {manager.period} · presentado {manager.filed} · valor 13F computado {(manager.reportedValue / 1e9).toFixed(1)} mil millones USD</li>)}</ul><p className="text-xs text-slate-400 mt-3">Un 13F no cubre toda la cartera del gestor, omite posiciones cortas y no incluye cotizaciones de Londres o Corea. Los porcentajes de propiedad son aproximaciones con acciones en circulación actuales. No se agregan filiales del mismo grupo.</p></div>
    </>}
  </div>;
}
