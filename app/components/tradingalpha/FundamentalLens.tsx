"use client";

import React, { useMemo } from 'react';
import AnalystTrends from './AnalystTrends';
import { simplyWallStReport } from './simplyWallStLinks';

const raw = (value: any): number | null => {
  const n = typeof value === 'number' ? value : value?.raw;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

interface Props {
  ticker: string;
  quoteTicker: string;
  data: any;
  selectedCurrency: string;
  quoteCurrency: string;
  financialCurrency: string;
}

function yearlyHistory(data: any) {
  return (data?.incomeStatementHistory?.incomeStatementHistory || [])
    .map((row: any) => ({
      year: String(row?.endDate?.fmt || '').slice(0, 4),
      income: raw(row?.netIncome),
      revenue: raw(row?.totalRevenue),
      research: raw(row?.researchDevelopment),
    }))
    .filter((row: any) => row.year && row.income != null)
    .sort((a: any, b: any) => Number(a.year) - Number(b.year));
}

function annualMetrics(rows: ReturnType<typeof yearlyHistory>) {
  const first = rows[0];
  const last = rows[rows.length - 1];
  const years = first && last ? Number(last.year) - Number(first.year) : 0;
  const cagr = years > 0 && first.income > 0 && last.income > 0
    ? (Math.pow(last.income / first.income, 1 / years) - 1) * 100 : null;
  const changes: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i - 1].income > 0 && rows[i].income > 0) {
      changes.push((rows[i].income / rows[i - 1].income - 1) * 100);
    }
  }
  const mean = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
  const volatility = changes.length >= 3
    ? Math.sqrt(changes.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (changes.length - 1)) : null;
  return { cagr, volatility, years };
}

const percent = (n: number | null, digits = 1) => n == null ? 'N/D' : `${n.toFixed(digits)}%`;
const money = (n: number | null, code: string) => n == null ? 'N/D' : `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(n)} ${code}`;
const large = (n: number | null, code: string) => {
  if (n == null) return 'N/D';
  const abs = Math.abs(n);
  const divisor = abs >= 1e12 ? 1e12 : abs >= 1e9 ? 1e9 : abs >= 1e6 ? 1e6 : 1;
  const suffix = divisor === 1e12 ? ' billones' : divisor === 1e9 ? ' mil millones' : divisor === 1e6 ? ' millones' : '';
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(n / divisor)}${suffix} ${code}`;
};

export default function FundamentalLens({ ticker, quoteTicker, data, selectedCurrency, quoteCurrency, financialCurrency }: Props) {
  const externalReport = simplyWallStReport(ticker, quoteTicker);
  const rows = useMemo(() => yearlyHistory(data), [data]);
  const { cagr, volatility, years } = useMemo(() => annualMetrics(rows), [rows]);
  const price = data?.price || {};
  const stats = data?.defaultKeyStatistics || {};
  const fin = data?.financialData || {};
  const sum = data?.summaryDetail || {};
  const sameCurrency = quoteCurrency === financialCurrency;
  const forwardEPS = raw(stats.forwardEps);
  const quotePrice = raw(price.regularMarketPrice);
  const forwardPE = sameCurrency && forwardEPS != null && forwardEPS > 0 && quotePrice != null
    ? quotePrice / forwardEPS : null;
  const cap = raw(sum.marketCap);
  const cash = raw(fin.totalCash);
  const debt = raw(fin.totalDebt);
  const netCashPct = sameCurrency && cap != null && cap > 0 && cash != null && debt != null
    ? (cash - debt) / cap * 100 : null;
  const targetLow = raw(fin.targetLowPrice);
  const targetMean = raw(fin.targetMeanPrice);
  const targetHigh = raw(fin.targetHighPrice);
  const analystCount = raw(fin.numberOfAnalystOpinions);
  const rd = rows.length ? rows[rows.length - 1].research : null;
  const revenue = rows.length ? rows[rows.length - 1].revenue : null;
  const rdIntensity = rd != null && revenue != null && revenue > 0 ? rd / revenue * 100 : null;
  const roe = raw(fin.returnOnEquity);

  return (
    <div className="space-y-5">
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white">Análisis fundamental para decidir</h3>
        <p className="text-xs text-slate-400 mt-2">Sector → beneficio estimado → crecimiento de largo plazo → calidad y ciclicidad → precio. Los objetivos de analistas son opiniones, no valores intrínsecos.</p>
        <a href={externalReport.url} target="_blank" rel="noopener noreferrer" className="inline-flex mt-3 text-sm font-semibold text-sky-300 hover:text-sky-200 underline underline-offset-2">
          {externalReport.direct ? `Ver informe de ${quoteTicker} en Simply Wall St ↗` : `Buscar ${quoteTicker} en Simply Wall St ↗`}
        </a>
        {!externalReport.direct && <p className="text-xs text-slate-500 mt-1">La ficha exacta aún no está verificada; se abre una búsqueda limitada a Simply Wall St.</p>}
        {ticker !== quoteTicker && <p className="text-xs text-amber-300 mt-3">Cotización seleccionada: {ticker} ({selectedCurrency}). Fundamentales de la acción ordinaria {quoteTicker} ({financialCurrency}). Las cifras por acción y las valoraciones corresponden a {quoteTicker}.</p>}
        {!sameCurrency && <p className="text-xs text-amber-300 mt-2">Monedas distintas: se omiten múltiplos y porcentajes que mezclen {quoteCurrency} con {financialCurrency}.</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'PER próximo ejercicio', value: forwardPE == null ? 'N/D' : `${forwardPE.toFixed(1)}×`, note: forwardPE == null ? 'BPA estimado no disponible o moneda incompatible' : 'Precio / BPA estimado por Yahoo' },
          { label: 'BPA estimado', value: money(forwardEPS, quoteCurrency), note: 'Previsión de Yahoo; confirma ejercicio y cobertura' },
          { label: 'ROE', value: percent(roe == null ? null : roe * 100), note: 'Beneficio / patrimonio; revisar apalancamiento' },
          { label: 'Caja neta / capitalización', value: percent(netCashPct), note: 'Solo con caja, deuda y capitalización en la misma moneda' },
        ].map(card => (
          <div key={card.label} className="bg-[#141d30] border border-[#223048] rounded-xl p-4">
            <div className="text-xs text-slate-400">{card.label}</div>
            <div className="text-xl font-bold text-white mt-2">{card.value}</div>
            <div className="text-[11px] text-slate-500 mt-2">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5">
          <h4 className="font-semibold text-white">Consenso de analistas</h4>
          <p className="text-xs text-slate-400 mt-1">Objetivo a 12 meses de Yahoo Finance para {quoteTicker}, en {quoteCurrency}; no representa una garantía.</p>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[['Mínimo', targetLow], ['Media', targetMean], ['Máximo', targetHigh]].map(([label, value]) => (
              <div key={String(label)} className="bg-[#141d30] rounded-xl p-3"><div className="text-[11px] text-slate-400">{label}</div><div className="font-bold text-white mt-1">{money(value as number | null, quoteCurrency)}</div></div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Analistas: {analystCount ?? 'N/D'}. Se muestra el rango para evitar que una media oculte desacuerdo.</p>
        </div>

        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5">
          <h4 className="font-semibold text-white">Trayectoria y ciclo del beneficio</h4>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#141d30] rounded-xl p-3"><div className="text-[11px] text-slate-400">Crecimiento anual compuesto</div><div className="font-bold text-white mt-1">{percent(cagr)}</div></div>
            <div className="bg-[#141d30] rounded-xl p-3"><div className="text-[11px] text-slate-400">Variación interanual típica</div><div className="font-bold text-white mt-1">{percent(volatility)}</div></div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Basado en {rows.length} ejercicios ({years} años entre extremos). La variación es la desviación típica muestral de cambios anuales; con menos de 4 ejercicios se omite. Yahoo solo proporciona aquí un historial corto: no extrapolarlo a 10–20 años.</p>
        </div>
      </div>

      <AnalystTrends data={data} />

      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 overflow-x-auto">
        <h4 className="font-semibold text-white mb-3">Beneficios anuales y reinversión</h4>
        <table className="min-w-full text-xs"><thead><tr className="text-slate-400 border-b border-[#223048]"><th className="text-left py-2">Ejercicio</th><th className="text-right">Beneficio neto</th><th className="text-right">Ventas</th><th className="text-right">I+D / ventas</th></tr></thead><tbody>{rows.map((row: any) => <tr key={row.year} className="border-b border-[#1b2537]"><td className="py-2">{row.year}</td><td className="text-right">{large(row.income, financialCurrency)}</td><td className="text-right">{large(row.revenue, financialCurrency)}</td><td className="text-right">{row.research != null && row.revenue > 0 ? percent(row.research / row.revenue * 100) : 'N/D'}</td></tr>)}</tbody></table>
        {rows.length === 0 && <p className="text-xs text-amber-300 mt-3">Yahoo no devuelve estados anuales para este instrumento.</p>}
        <p className="text-xs text-slate-400 mt-3">Último gasto I+D: {large(rd, financialCurrency)} ({percent(rdIntensity)} de ventas). Un mayor gasto no implica por sí solo mejores retornos.</p>
      </div>
    </div>
  );
}
