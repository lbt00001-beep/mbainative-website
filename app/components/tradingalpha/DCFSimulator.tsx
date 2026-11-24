"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  calculateDCF, calculatePeterLynchFairValue, calculateGrahamNumber,
  estimateWacc, normalizeFcf, impliedFcfGrowth, calculateRoic, type FundamentalYearData,
} from './financialEngine';
import type { AnnualEpsGrowth } from './fundamentalMetrics';

type FcfMode = 'ttm' | 'avg' | 'avgSbc';
const FCF_MODE_LABEL: Record<FcfMode, string> = {
  ttm: 'FCF últimos 12 meses (Yahoo)',
  avg: 'FCF medio de los últimos ejercicios',
  avgSbc: 'FCF medio − remuneración en acciones',
};
const pctFmt = (v: number, d = 1) => `${(v * 100).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d })} %`;

interface DCFSimulatorProps {
  currentPrice: number;
  currency?: string;
  fcfBase: number | null;
  sharesOutstanding: number | null;
  netDebt: number | null;
  defaultGrowthRate?: number;
  eps?: number | null;
  bookValuePerShare?: number | null;
  annualEpsGrowth?: AnnualEpsGrowth | null;
  epsBasis?: 'TTM' | 'previsto' | null;
  fundamentalYears?: FundamentalYearData[] | null;
  beta?: number | null;
  marketCap?: number | null;
  totalDebt?: number | null;
  financialCurrency?: string | null;
}

export default function DCFSimulator({
  currentPrice,
  currency = '$',
  fcfBase,
  sharesOutstanding,
  netDebt,
  defaultGrowthRate = 0.10,
  eps = null,
  bookValuePerShare = null,
  annualEpsGrowth = null,
  epsBasis = null,
  fundamentalYears = null,
  beta = null,
  marketCap = null,
  totalDebt = null,
  financialCurrency = null,
}: DCFSimulatorProps) {
  const normalized = useMemo(() => normalizeFcf(fundamentalYears), [fundamentalYears]);
  const roic = useMemo(() => calculateRoic(fundamentalYears), [fundamentalYears]);
  const [fcfMode, setFcfMode] = useState<FcfMode | null>(null);
  // Por defecto, el FCF normalizado neto de remuneración en acciones: es un coste real para el accionista.
  const mode: FcfMode = fcfMode ?? (normalized?.averageLessSbc != null && normalized.averageLessSbc > 0 ? 'avgSbc' : normalized && normalized.average > 0 ? 'avg' : 'ttm');
  const effectiveFcf = mode === 'avgSbc' ? normalized?.averageLessSbc ?? null : mode === 'avg' ? normalized?.average ?? null : fcfBase;

  // CAPM: tipo libre de riesgo en vivo (editable), beta de Yahoo (editable) y prima de riesgo supuesta.
  const [riskFree, setRiskFree] = useState<number | null>(null);
  const [riskFreeSource, setRiskFreeSource] = useState<string | null>(null);
  const [erp, setErp] = useState(0.05);
  // undefined = sigue la beta de Yahoo aunque llegue después del primer render.
  const [betaEdit, setBetaInput] = useState<number | null | undefined>(undefined);
  const betaInput = betaEdit === undefined ? beta : betaEdit;
  useEffect(() => {
    if (!financialCurrency) return;
    let alive = true;
    fetch(`/api/riskFree?currency=${encodeURIComponent(financialCurrency)}`).then(r => r.json()).then(d => {
      if (!alive) return;
      if (d.rate != null) { setRiskFree(d.rate); setRiskFreeSource(`${d.source}, ${d.date}`); }
      else setRiskFreeSource(`Sin referencia automática para ${financialCurrency}: introduce el tipo a 10 años`);
    }).catch(() => alive && setRiskFreeSource('No se pudo obtener el tipo libre de riesgo: introdúcelo'));
    return () => { alive = false; };
  }, [financialCurrency]);
  const latestYear = fundamentalYears?.[0]?.values;
  const waccEstimate = useMemo(() => riskFree == null || betaInput == null || marketCap == null ? null : estimateWacc({
    riskFree, beta: betaInput, equityRiskPremium: erp, marketCap,
    totalDebt: totalDebt ?? latestYear?.totalDebt ?? 0,
    interestExpense: latestYear?.interestExpense ?? null,
    taxRate: latestYear?.taxRateForCalcs ?? null,
  }), [riskFree, betaInput, erp, marketCap, totalDebt, latestYear]);
  const suggestedGrowth = annualEpsGrowth != null && annualEpsGrowth.rate > 0 && annualEpsGrowth.rate <= 50
    ? annualEpsGrowth.rate.toFixed(1) : '';
  // Sliders state
  const [growthRate5Y, setGrowthRate5Y] = useState<number>(
    Math.min(0.30, Math.max(0.04, defaultGrowthRate || 0.10))
  );
  const [terminalRate, setTerminalRate] = useState<number>(0.025);
  const [waccOverride, setWacc] = useState<number | null>(null);
  // Mientras el usuario no mueva el control, el WACC sigue la estimación CAPM (acotada al rango del control).
  const wacc = waccOverride ?? (waccEstimate ? Math.min(0.16, Math.max(0.05, Number(waccEstimate.wacc.toFixed(3)))) : 0.09);
  // Null means the field follows the latest Yahoo estimate as quote data arrives.
  // An explicit string, including an empty one, is the user's own hypothesis.
  const [earningsGrowth, setEarningsGrowth] = useState<string | null>(null);
  const growthValue = earningsGrowth ?? suggestedGrowth;
  const dcfAvailable = effectiveFcf != null && sharesOutstanding != null && sharesOutstanding > 0
    && netDebt != null && currentPrice > 0;

  // Recalculate DCF
  const dcfResult = useMemo(() => {
    if (!dcfAvailable || effectiveFcf == null || sharesOutstanding == null || netDebt == null) return null;
    return calculateDCF(
      effectiveFcf,
      growthRate5Y,
      terminalRate,
      wacc,
      sharesOutstanding,
      netDebt,
      currentPrice
    );
  }, [dcfAvailable, effectiveFcf, growthRate5Y, terminalRate, wacc, sharesOutstanding, netDebt, currentPrice]);

  const impliedGrowth = useMemo(() => {
    if (!dcfAvailable || effectiveFcf == null || effectiveFcf <= 0 || sharesOutstanding == null || netDebt == null) return null;
    return impliedFcfGrowth(currentPrice, effectiveFcf, terminalRate, wacc, sharesOutstanding, netDebt);
  }, [dcfAvailable, effectiveFcf, terminalRate, wacc, sharesOutstanding, netDebt, currentPrice]);

  // Sensibilidad del valor por acción a WACC (filas) y crecimiento terminal (columnas).
  const sensitivity = useMemo(() => {
    if (!dcfAvailable || effectiveFcf == null || sharesOutstanding == null || netDebt == null) return null;
    const waccs = [-0.02, -0.01, 0, 0.01, 0.02].map(d => wacc + d).filter(w => w > 0.02);
    const terms = [-0.01, -0.005, 0, 0.005, 0.01].map(d => terminalRate + d).filter(t => t >= 0);
    return { waccs, terms, values: waccs.map(w => terms.map(t => calculateDCF(effectiveFcf, growthRate5Y, t, w, sharesOutstanding, netDebt, currentPrice)?.fairValue ?? null)) };
  }, [dcfAvailable, effectiveFcf, growthRate5Y, terminalRate, wacc, sharesOutstanding, netDebt, currentPrice]);

  const peterLynchValue = useMemo(() => {
    return calculatePeterLynchFairValue(eps, growthValue === '' ? null : Number(growthValue) / 100);
  }, [eps, growthValue]);

  const grahamNumber = useMemo(() => {
    return calculateGrahamNumber(eps, bookValuePerShare);
  }, [eps, bookValuePerShare]);

  const formatLargeNum = (num: number) => {
    const abs = Math.abs(num);
    if (abs >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toLocaleString();
  };

  return (
    <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>💎</span> Modelos de Valoración Intrínseca (DCF & Clásicos)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Descuento de Flujos de Caja Libre (FCF) a 2 fases, Línea Peter Lynch y Suelo de Benjamin Graham
          </p>
        </div>

        {/* Reset defaults */}
        <button
          onClick={() => {
            setGrowthRate5Y(0.10);
            setTerminalRate(0.025);
            setWacc(null);
            setFcfMode(null);
            setErp(0.05);
            setBetaInput(undefined);
            setEarningsGrowth(null);
          }}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition-all"
        >
          Restablecer Parámetros
        </button>
      </div>

      {/* Main Intrinsic Value Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DCF Fair Value Card */}
        <div className="bg-[#141d30] border border-[#223048] rounded-2xl p-5 relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Valor Intrínseco DCF
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {dcfResult ? `${currency}${dcfResult.fairValue}` : 'No disponible'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (Precio: {currency}{currentPrice.toFixed(2)})
            </span>
          </div>

          {dcfResult && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    dcfResult.marginOfSafety >= 20
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : dcfResult.marginOfSafety >= 0
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : dcfResult.marginOfSafety >= -15
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {dcfResult.marginOfSafety >= 0 ? '+' : ''}
                  {dcfResult.marginOfSafety}% Margen de Seguridad
                </span>
                <span className="text-xs text-slate-400">({dcfResult.verdict})</span>
              </div>

              {/* Baremo Calibrado Graham */}
              <div className="bg-[#0e1626] p-2.5 rounded-xl border border-[#223048] space-y-1 mt-2">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Baremo de Descuento:</span>
                  <span className="text-slate-200 font-semibold">
                    {dcfResult.marginOfSafety >= 25 ? '🎯 >+25% Excelente margen' :
                     dcfResult.marginOfSafety >= 10 ? '✅ +10% a +25% Favorable' :
                     dcfResult.marginOfSafety >= -10 ? '⚖️ ±10% Precio equilibrado' :
                     dcfResult.marginOfSafety >= -25 ? '⚠️ -10% a -25% Exigida' :
                     '🚨 <-25% Fuerte sobrevaloración'}
                  </span>
                </div>
                <div className="relative h-2 w-full bg-[#162032] rounded-full overflow-hidden flex">
                  <div className="w-[35%] bg-rose-500/70" title="<-10% Sobrevalorada"></div>
                  <div className="w-[35%] bg-amber-500/70" title="-10% a +20% Rango Justo"></div>
                  <div className="w-[30%] bg-emerald-500/70" title=">+20% Margen Óptimo"></div>
                </div>
                <div className="relative w-full h-1">
                  <div
                    className="absolute -top-1 -ml-1 w-2 h-2 bg-white rounded-full shadow-[0_0_6px_#fff] transition-all"
                    style={{
                      left: `${Math.min(95, Math.max(5, ((dcfResult.marginOfSafety + 50) / 100) * 100))}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-0.5">
                  <span>-50% (Cara)</span>
                  <span>0% (Justo)</span>
                  <span>+50% (Descuento)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Peter Lynch Fair Value */}
        <div className="bg-[#141d30] border border-[#223048] rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Escenario Peter Lynch (PER = crecimiento BPA)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {peterLynchValue ? `${currency}${peterLynchValue}` : 'N/D'}
            </span>
            {peterLynchValue && currentPrice > 0 && (
              <span className={`text-xs font-semibold ${peterLynchValue >= currentPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                {peterLynchValue >= currentPrice ? 'Precio inferior al escenario' : 'Precio superior al escenario'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Regla orientativa, no valoración intrínseca. Introduce tu hipótesis de crecimiento anual sostenible del BPA.
          </p>
          {eps != null && eps > 0 && <p className="text-xs text-slate-400 mt-2">BPA utilizado: {eps.toLocaleString('es-ES', { maximumFractionDigits: 2 })} {currency} ({epsBasis || 'periodo no identificado'}).</p>}
          {annualEpsGrowth && <p className="text-xs text-slate-400 mt-2">Yahoo estima {annualEpsGrowth.rate.toFixed(1)}% de crecimiento del BPA entre {annualEpsGrowth.fromPeriod} y {annualEpsGrowth.toPeriod} ({annualEpsGrowth.currency}). {annualEpsGrowth.rate <= 0 ? 'La tasa no es positiva: introduce una hipótesis sostenible si procede.' : annualEpsGrowth.rate > 50 ? 'Supera el límite del escenario (50%): introduce una hipótesis sostenible.' : earningsGrowth !== null ? 'Has sustituido esta referencia por tu hipótesis.' : 'Se usa como hipótesis inicial editable; un año no demuestra crecimiento sostenible.'}</p>}
          {(eps == null || eps <= 0) && <p className="text-xs text-amber-300 mt-2">Se necesita un BPA positivo y comparable para calcular este escenario.</p>}
          <label className="block text-xs text-slate-300 mt-3">Crecimiento BPA esperado (%)
            <input type="number" min="0" max="50" step="0.5" value={growthValue} onChange={e => setEarningsGrowth(e.target.value)} placeholder="Introduce 0–50" className="mt-1 w-full rounded-lg bg-[#0e1626] border border-[#334155] px-3 py-2 text-white" />
          </label>
        </div>

        {/* Benjamin Graham Number */}
        <div className="bg-[#141d30] border border-[#223048] rounded-2xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Número de Benjamin Graham
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">
              {grahamNumber ? `${currency}${grahamNumber}` : 'N/D'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Suelo conservador basado en √(22.5 × BPA × Valor Contable) para empresas de valor y activos tangibles.
          </p>
        </div>
      </div>

      {/* Interactive DCF Sensitivity Sliders */}
      {dcfAvailable ? <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-5">
        <h4 className="text-sm font-semibold text-slate-200">
          Ajuste Dinámico de Supuestos del DCF
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slider 1: 5Y Growth */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Crecimiento FCF 5 Años</span>
              <span className="text-blue-400 font-mono">{(growthRate5Y * 100).toFixed(1)}% anual</span>
            </div>
            <input
              type="range"
              min="-0.05"
              max="0.35"
              step="0.005"
              value={growthRate5Y}
              onChange={(e) => setGrowthRate5Y(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-5%</span>
              <span>10% (Estándar)</span>
              <span>+35%</span>
            </div>
          </div>

          {/* Slider 2: Terminal Growth */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Crecimiento Terminal Perpetuo</span>
              <span className="text-emerald-400 font-mono">{(terminalRate * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.04"
              step="0.002"
              value={terminalRate}
              onChange={(e) => setTerminalRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1.0% (PIB bajo)</span>
              <span>2.5% (Inflación)</span>
              <span>4.0%</span>
            </div>
          </div>

          {/* Slider 3: WACC Discount */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Tasa de Descuento (WACC)</span>
              <span className="text-purple-400 font-mono">{(wacc * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.16"
              step="0.005"
              value={wacc}
              onChange={(e) => setWacc(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5%</span>
              <span>{waccOverride == null && waccEstimate ? 'Estimación CAPM' : 'Manual'}</span>
              <span>16%</span>
            </div>
          </div>
        </div>
      </div> : <p className="text-xs text-amber-300">DCF no disponible: faltan flujo de caja libre, acciones, caja, deuda o moneda financiera comparable. Los escenarios de Lynch y Graham se calculan de forma independiente cuando hay datos suficientes.</p>}

      {/* Base de FCF y coste de capital (CAPM) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">Flujo de caja libre de partida</h4>
          <select value={mode} onChange={e => setFcfMode(e.target.value as FcfMode)} className="w-full rounded-lg bg-[#0e1626] border border-[#334155] px-3 py-2 text-sm text-white">
            <option value="ttm" disabled={fcfBase == null}>{FCF_MODE_LABEL.ttm}{fcfBase != null ? `: ${currency}${formatLargeNum(fcfBase)}` : ' (N/D)'}</option>
            <option value="avg" disabled={!normalized}>{FCF_MODE_LABEL.avg}{normalized ? ` (${normalized.years}): ${currency}${formatLargeNum(normalized.average)}` : ' (N/D)'}</option>
            <option value="avgSbc" disabled={normalized?.averageLessSbc == null}>{FCF_MODE_LABEL.avgSbc}{normalized?.averageLessSbc != null ? `: ${currency}${formatLargeNum(normalized.averageLessSbc)}` : ' (N/D)'}</option>
          </select>
          <p className="text-xs text-slate-400">
            La media de varios ejercicios evita valorar un año excepcional. La remuneración en acciones no consume caja, pero diluye al accionista; por eso se resta.
            {normalized?.sbcShare != null && ` Aquí equivale al ${pctFmt(normalized.sbcShare)} del FCF medio.`}
          </p>
        </div>

        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">Coste de capital (WACC) por CAPM</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <label className="text-slate-400 flex flex-col gap-1">Libre de riesgo (%)
              <input type="number" step="0.05" value={riskFree == null ? '' : Number((riskFree * 100).toFixed(2))} onChange={e => setRiskFree(e.target.value === '' ? null : Number(e.target.value) / 100)} className="rounded-lg bg-[#0e1626] border border-[#334155] px-2 py-1.5 text-white" />
            </label>
            <label className="text-slate-400 flex flex-col gap-1">Beta
              <input type="number" step="0.05" value={betaInput ?? ''} onChange={e => setBetaInput(e.target.value === '' ? null : Number(e.target.value))} className="rounded-lg bg-[#0e1626] border border-[#334155] px-2 py-1.5 text-white" />
            </label>
            <label className="text-slate-400 flex flex-col gap-1">Prima de riesgo (%)
              <input type="number" step="0.25" value={Number((erp * 100).toFixed(2))} onChange={e => setErp(Number(e.target.value) / 100)} className="rounded-lg bg-[#0e1626] border border-[#334155] px-2 py-1.5 text-white" />
            </label>
          </div>
          {waccEstimate ? (
            <div className="text-xs text-slate-300 space-y-1">
              <div>Coste del capital: {pctFmt(riskFree!)} + {betaInput?.toLocaleString('es-ES', { maximumFractionDigits: 2 })} × {pctFmt(erp)} = <strong>{pctFmt(waccEstimate.costOfEquity)}</strong></div>
              <div>Coste de la deuda: {pctFmt(waccEstimate.costOfDebt)} antes de impuestos ({waccEstimate.costOfDebtSource}), impuesto {pctFmt(waccEstimate.taxRate, 0)}</div>
              <div>Peso del capital a valor de mercado: {pctFmt(waccEstimate.weightEquity, 0)} → <strong className="text-purple-300">WACC {pctFmt(waccEstimate.wacc)}</strong>
                {waccOverride != null && <button type="button" onClick={() => setWacc(null)} className="ml-2 text-blue-400 underline">usar esta estimación</button>}
              </div>
            </div>
          ) : <p className="text-xs text-amber-300">Faltan tipo libre de riesgo, beta o capitalización: el WACC queda en 9 % hasta que los introduzcas.</p>}
          <p className="text-[11px] text-slate-500">{riskFreeSource ?? 'Buscando el tipo a 10 años…'} · Beta de Yahoo (5 años, mensual). La prima de riesgo del 5 % es un supuesto habitual (rango usual 4–6 %); ajústala a tu criterio.</p>
        </div>
      </div>

      {dcfAvailable && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-slate-200">DCF inverso: ¿qué descuenta el precio?</h4>
            {impliedGrowth != null ? (
              <p className="text-sm text-slate-300 mt-2">
                Para justificar {currency}{currentPrice.toFixed(2)}, el FCF debe crecer un <strong className="text-white">{pctFmt(impliedGrowth)}</strong> anual durante 5 años
                (WACC {pctFmt(wacc)}, crecimiento terminal {pctFmt(terminalRate)}). Compáralo con tu hipótesis ({pctFmt(growthRate5Y)}) y con el crecimiento histórico.
              </p>
            ) : <p className="text-xs text-slate-400 mt-2">El precio queda fuera del rango calculable (crecimiento entre −50 % y +100 % anual) o el FCF no es positivo.</p>}
          </div>
          <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-slate-200">Creación de valor: ROIC frente a WACC</h4>
            {roic ? (
              <p className="text-sm text-slate-300 mt-2">
                ROIC {roic.year}: <strong className={roic.roic > wacc ? 'text-emerald-400' : 'text-rose-400'}>{pctFmt(roic.roic)}</strong> frente a un WACC de {pctFmt(wacc)}.{' '}
                {roic.roic > wacc ? 'Cada unidad de capital reinvertida rinde más que su coste: el crecimiento crea valor.' : 'El capital rinde menos que su coste: crecer reinvirtiendo destruiría valor.'}
                <span className="block text-[11px] text-slate-500 mt-1">ROIC = EBIT × (1 − {pctFmt(roic.taxRate, 0)}) ÷ capital invertido medio ({currency}{formatLargeNum(roic.investedCapital)}).</span>
              </p>
            ) : <p className="text-xs text-slate-400 mt-2">N/D: Yahoo no publica EBIT o capital invertido para este emisor.</p>}
          </div>
        </div>
      )}

      {sensitivity && (
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">Sensibilidad del valor por acción</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-center">
              <thead>
                <tr className="text-slate-400 border-b border-[#223048]">
                  <th className="py-2 px-2 text-left font-sans">WACC ↓ · g terminal →</th>
                  {sensitivity.terms.map(t => <th key={t} className="py-2 px-2">{pctFmt(t)}</th>)}
                </tr>
              </thead>
              <tbody>
                {sensitivity.waccs.map((w, i) => (
                  <tr key={w} className="border-b border-[#1b2537]">
                    <td className="py-2 px-2 text-left text-slate-400">{pctFmt(w)}</td>
                    {sensitivity.values[i].map((v, j) => {
                      const base = Math.abs(w - wacc) < 1e-9 && Math.abs(sensitivity.terms[j] - terminalRate) < 1e-9;
                      return <td key={j} className={`py-2 px-2 ${v == null ? 'text-slate-600' : v >= currentPrice ? 'text-emerald-400' : 'text-rose-400'} ${base ? 'font-bold bg-[#1e293b] rounded' : ''}`}>{v == null ? '—' : `${currency}${v.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">Verde: valor superior al precio actual ({currency}{currentPrice.toFixed(2)}); rojo: inferior. En negrita, el escenario seleccionado. Sin valor: WACC no superior al crecimiento terminal.</p>
        </div>
      )}

      {/* DCF Breakdown Table */}
      {dcfResult && (
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200">
              Proyección de Flujos Descontados (5 Años)
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              FCF base: {currency}{formatLargeNum(effectiveFcf!)} · {FCF_MODE_LABEL[mode]}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="border-b border-[#223048] text-slate-400">
                  <th className="py-2 px-3">Métrica</th>
                  <th className="py-2 px-3">Año 1</th>
                  <th className="py-2 px-3">Año 2</th>
                  <th className="py-2 px-3">Año 3</th>
                  <th className="py-2 px-3">Año 4</th>
                  <th className="py-2 px-3">Año 5</th>
                  <th className="py-2 px-3">Valor Terminal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2537]">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-300">FCF Proyectado</td>
                  {dcfResult.projectedFCFs.map((v, i) => (
                    <td key={`fcf-${i}`} className="py-2.5 px-3 text-slate-200">
                      {currency}{formatLargeNum(v)}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                    {currency}{formatLargeNum(dcfResult.terminalValue)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-300">Valor Presente (PV)</td>
                  {dcfResult.projectedFCFs.map((v, i) => {
                    const pv = v / Math.pow(1 + wacc, i + 1);
                    return (
                      <td key={`pv-${i}`} className="py-2.5 px-3 text-blue-400">
                        {currency}{formatLargeNum(pv)}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                    {currency}{formatLargeNum(dcfResult.presentValueTerminal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#1e293b] text-xs">
            <div>
              <span className="text-slate-400">Valor Empresa (EV):</span>
              <div className="font-bold text-slate-200 font-mono">
                {currency}{formatLargeNum(dcfResult.enterpriseValue)}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Deuda Neta:</span>
              <div className="font-bold text-slate-200 font-mono">
                  {currency}{formatLargeNum(netDebt!)}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Valor Acciones (Equity):</span>
              <div className="font-bold text-slate-200 font-mono">
                {currency}{formatLargeNum(dcfResult.equityValue)}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Acciones en Circulación:</span>
              <div className="font-bold text-slate-200 font-mono">
                  {formatLargeNum(sharesOutstanding!)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
