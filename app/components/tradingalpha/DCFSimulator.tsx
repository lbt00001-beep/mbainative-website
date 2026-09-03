"use client";

import React, { useState, useMemo } from 'react';
import { calculateDCF, calculatePeterLynchFairValue, calculateGrahamNumber } from './financialEngine';

interface DCFSimulatorProps {
  currentPrice: number;
  currency?: string;
  fcfBase: number; // en dólares/euros
  sharesOutstanding: number;
  netDebt: number;
  defaultGrowthRate?: number;
  eps?: number | null;
  bookValuePerShare?: number | null;
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
}: DCFSimulatorProps) {
  // Sliders state
  const [growthRate5Y, setGrowthRate5Y] = useState<number>(
    Math.min(0.30, Math.max(0.04, defaultGrowthRate || 0.10))
  );
  const [terminalRate, setTerminalRate] = useState<number>(0.025);
  const [wacc, setWacc] = useState<number>(0.09);

  // Recalculate DCF
  const dcfResult = useMemo(() => {
    return calculateDCF(
      fcfBase,
      growthRate5Y,
      terminalRate,
      wacc,
      sharesOutstanding,
      netDebt,
      currentPrice
    );
  }, [fcfBase, growthRate5Y, terminalRate, wacc, sharesOutstanding, netDebt, currentPrice]);

  const peterLynchValue = useMemo(() => {
    return calculatePeterLynchFairValue(eps, growthRate5Y);
  }, [eps, growthRate5Y]);

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
            setWacc(0.09);
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
            Línea Peter Lynch (15-25x EPS)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {peterLynchValue ? `${currency}${peterLynchValue}` : 'N/D'}
            </span>
            {peterLynchValue && currentPrice > 0 && (
              <span className={`text-xs font-semibold ${peterLynchValue >= currentPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                {peterLynchValue >= currentPrice ? 'Infravalorada vs EPS' : 'Prima sobre beneficios'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Precio justo estimado cuando el PER se iguala a la tasa sostenible de crecimiento del BPA.
          </p>
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
      <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-5">
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
              min="0.06"
              max="0.15"
              step="0.005"
              value={wacc}
              onChange={(e) => setWacc(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>6.0% (Bajo riesgo)</span>
              <span>9.0% (Típico)</span>
              <span>15.0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* DCF Breakdown Table */}
      {dcfResult && (
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200">
              Proyección de Flujos Descontados (5 Años)
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              FCF Base: {currency}{formatLargeNum(fcfBase)}
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
                {currency}{formatLargeNum(netDebt)}
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
                {formatLargeNum(sharesOutstanding)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
