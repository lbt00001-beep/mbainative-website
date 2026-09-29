"use client";

import { epsRevisionPoints, recommendationPoints } from './analystTrendData';

type Point = { label: string; value: number; count?: number; offset: number };

function TrendChart({ points, min, max, title, unit, lowerIsBetter = false }: {
  points: Point[];
  min?: number;
  max?: number;
  title: string;
  unit: string;
  lowerIsBetter?: boolean;
}) {
  if (points.length < 2) return <p className="text-xs text-slate-400 mt-4">No hay suficientes observaciones comparables.</p>;
  const values = points.map(point => point.value);
  const low = min ?? Math.min(...values);
  const high = max ?? Math.max(...values);
  const padding = min == null && max == null ? Math.max((high - low) * 0.2, Math.abs(high) * 0.01, 0.01) : 0;
  const domainLow = low - padding;
  const domainHigh = high + padding;
  const first = points[0].offset;
  const last = points[points.length - 1].offset;
  const x = (index: number) => 54 + (points[index].offset - first) * 388 / (last - first || 1);
  const y = (value: number) => 12 + (domainHigh - value) / (domainHigh - domainLow || 1) * 130;
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.value)}`).join(' ');
  const format = (value: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: unit === 'nota' ? 2 : 3 }).format(value);

  return (
    <div className="mt-4">
      <svg viewBox="0 0 490 193" role="img" aria-label={title} className="w-full h-auto max-h-60">
        <title>{title}</title>
        {[0, 0.5, 1].map(fraction => {
          const value = domainHigh - fraction * (domainHigh - domainLow);
          const lineY = 12 + fraction * 130;
          return <g key={fraction}>
            <line x1="54" x2="442" y1={lineY} y2={lineY} stroke="#334155" strokeDasharray="3 5" />
            <text x="48" y={lineY + 4} textAnchor="end" fill="#94a3b8" fontSize="11">{format(value)}</text>
          </g>;
        })}
        <path d={path} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => <g key={`${point.label}-${index}`}>
          <circle cx={x(index)} cy={y(point.value)} r="5" fill="#38bdf8" stroke="#0e1626" strokeWidth="2">
            <title>{point.label}: {format(point.value)} {unit}{point.count ? ` · ${point.count} analistas` : ''}</title>
          </circle>
          <text x={x(index)} y="168" textAnchor="middle" fill="#cbd5e1" fontSize="10">{point.label.replace('Hace ', '-').replace(' ', '')}</text>
        </g>)}
      </svg>
      <p className="text-xs text-slate-400">
        {lowerIsBetter ? 'Escala: 1 = compra fuerte; 5 = venta fuerte. Una línea descendente indica una opinión media más favorable.' : `Unidad: ${unit}. Se compara siempre el mismo ejercicio fiscal.`}
      </p>
    </div>
  );
}

export default function AnalystTrends({ data }: { data: any }) {
  const recommendations = recommendationPoints(data);
  const eps = epsRevisionPoints(data);
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
    <section className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5">
      <h4 className="font-semibold text-white">Tendencia de recomendaciones</h4>
      <p className="text-xs text-slate-400 mt-1">Media ponderada de las recomendaciones publicadas por Yahoo Finance para cada mes disponible.</p>
      <TrendChart points={recommendations} min={1} max={5} title="Evolución de la recomendación media de analistas" unit="nota" lowerIsBetter />
      {recommendations.length > 0 && <p className="text-xs text-slate-400 mt-2">Cobertura actual: {recommendations[recommendations.length - 1].count} recomendaciones. La cantidad de analistas puede variar entre meses.</p>}
    </section>
    <section className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5">
      <h4 className="font-semibold text-white">Revisión del BPA estimado</h4>
      <p className="text-xs text-slate-400 mt-1">Consenso de beneficio por acción observado durante los últimos 90 días para el ejercicio terminado el {eps?.period || 'N/D'}.</p>
      <TrendChart points={eps?.points || []} title="Evolución del BPA estimado por analistas" unit={eps?.currency || 'moneda N/D'} />
    </section>
    <p className="lg:col-span-2 text-xs text-slate-500">Fuente: Yahoo Finance. Estas series muestran recomendaciones y revisiones del BPA; no son el histórico del precio objetivo medio de Simply Wall St.</p>
  </div>;
}
