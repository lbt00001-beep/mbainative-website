"use client";

import React, { useState } from 'react';
import {
  PiotroskiBreakdown,
  AltmanZResult,
  DuPontBreakdown,
} from './financialEngine';

interface StatementsDuPontProps {
  incomeHistory: any[];
  balanceHistory: any[];
  cashflowHistory: any[];
  currency?: string;
  piotroski: PiotroskiBreakdown;
  altmanZ: AltmanZResult | null;
  dupont: DuPontBreakdown | null;
}

export default function StatementsDuPont({
  incomeHistory = [],
  balanceHistory = [],
  cashflowHistory = [],
  currency = '$',
  piotroski,
  altmanZ,
  dupont,
}: StatementsDuPontProps) {
  const [activeStatement, setActiveStatement] = useState<'income' | 'balance' | 'cashflow'>('income');

  const formatNum = (val: any) => {
    if (val == null) return '—';
    const num = typeof val === 'number' ? val : val?.raw;
    if (num == null || !isFinite(num)) return '—';
    const abs = Math.abs(num);
    if (abs >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toLocaleString();
  };

  const getYear = (entry: any) => {
    const rawDate = entry?.endDate?.fmt || entry?.endDate;
    if (!rawDate) return 'LTM';
    return String(rawDate).slice(0, 4);
  };

  return (
    <div className="space-y-6">
      {/* 1. Quality & Solvency Bar: DuPont + Altman Z + Piotroski */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* DuPont 3-Stage Card */}
        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔄</span> Descomposición DuPont (ROE)
              </h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                ROE: {dupont ? `${dupont.roe}%` : '—'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {dupont?.narrative || 'Análisis de los 3 motores que impulsan la rentabilidad sobre el capital.'}
            </p>

            {dupont ? (
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
                  <div className="text-slate-400 text-[10px] uppercase">Margen Neto</div>
                  <div className="text-emerald-400 font-bold text-sm mt-1">{dupont.netMargin}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Rentabilidad</div>
                </div>
                <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
                  <div className="text-slate-400 text-[10px] uppercase">Rotación Activos</div>
                  <div className="text-cyan-400 font-bold text-sm mt-1">{dupont.assetTurnover}x</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Eficiencia</div>
                </div>
                <div className="bg-[#141d30] p-2.5 rounded-xl border border-[#223048]">
                  <div className="text-slate-400 text-[10px] uppercase">Apalancamiento</div>
                  <div className="text-amber-400 font-bold text-sm mt-1">{dupont.equityMultiplier}x</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Estructura</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-4">Datos insuficientes para DuPont.</div>
            )}
          </div>
          <div className="text-[11px] text-slate-500 pt-3 border-t border-[#1e293b] mt-4">
            ROE = Margen Neto × Rotación de Activos × Multiplicador de Capital
          </div>
        </div>

        {/* Altman Z-Score Card */}
        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🛡️</span> Altman Z-Score (Solvencia)
              </h4>
              {altmanZ && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    altmanZ.notApplicable
                      ? 'bg-slate-700/40 text-slate-300 border border-slate-600/30'
                      : altmanZ.zone === 'Segura'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : altmanZ.zone === 'Gris'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {altmanZ.notApplicable ? 'No aplicable (Banca/Finanzas)' : `Zona ${altmanZ.zone} (${altmanZ.score})`}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {altmanZ?.explanation || 'Estimación cuantitativa de riesgo de quiebra e insolvencia.'}
            </p>

            {/* Visual Zone Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#162032]">
                <div className="w-[30%] bg-rose-500/60 flex items-center justify-center text-[9px] font-bold text-white">
                  Peligro &lt;1.8
                </div>
                <div className="w-[30%] bg-amber-500/60 flex items-center justify-center text-[9px] font-bold text-white">
                  Gris 1.8-3.0
                </div>
                <div className="w-[40%] bg-emerald-500/60 flex items-center justify-center text-[9px] font-bold text-white">
                  Segura &gt;3.0
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Estrés Financiero</span>
                <span>Intermedia</span>
                <span>Grado Inversión</span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-3 border-t border-[#1e293b] mt-4">
            Modelo de Edward Altman basado en capital de trabajo, EBIT y valor bursátil.
          </div>
        </div>

        {/* Piotroski F-Score Card */}
        <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📋</span> Piotroski F-Score (0 a 9)
              </h4>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  piotroski.score >= 7
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : piotroski.score <= 4
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {piotroski.score}/9 ({piotroski.quality})
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Auditoría de 9 pruebas contables rigurosas sobre rentabilidad, apalancamiento y eficiencia operativa.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#141d30] p-2 rounded-lg border border-[#223048]">
                <div className="text-[10px] text-slate-400">Rentabilidad</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {piotroski.details.filter(d => d.category === 'Rentabilidad' && d.passed).length}/4
                </div>
              </div>
              <div className="bg-[#141d30] p-2 rounded-lg border border-[#223048]">
                <div className="text-[10px] text-slate-400">Apalancamiento</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {piotroski.details.filter(d => d.category === 'Apalancamiento/Liquidez' && d.passed).length}/3
                </div>
              </div>
              <div className="bg-[#141d30] p-2 rounded-lg border border-[#223048]">
                <div className="text-[10px] text-slate-400">Eficiencia</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {piotroski.details.filter(d => d.category === 'Eficiencia' && d.passed).length}/2
                </div>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-3 border-t border-[#1e293b] mt-4">
            Puntuaciones &gt;= 7 identifican empresas de la máxima solidez contable según Joseph Piotroski.
          </div>
        </div>
      </div>

      {/* 2. Interactive Historical Financial Statements (4 Years) */}
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📊</span> Estados Financieros Normalizados a 4 Años (Koyfin & Bloomberg Style)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Datos contables auditados de los últimos ejercicios fiscales
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#141d30] p-1 rounded-xl border border-[#223048]">
            <button
              onClick={() => setActiveStatement('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeStatement === 'income'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cuenta de Resultados
            </button>
            <button
              onClick={() => setActiveStatement('balance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeStatement === 'balance'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Balance de Situación
            </button>
            <button
              onClick={() => setActiveStatement('cashflow')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeStatement === 'cashflow'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flujos de Caja
            </button>
          </div>
        </div>

        {/* Statement Tables */}
        <div className="overflow-x-auto">
          {activeStatement === 'income' && (
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="border-b border-[#223048] text-slate-400">
                  <th className="py-2.5 px-3">Partida Contable ({currency})</th>
                  {incomeHistory.map((item, idx) => (
                    <th key={idx} className="py-2.5 px-3 text-right">
                      {getYear(item)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2537]">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">Ingresos Totales (Revenues)</td>
                  {incomeHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-medium text-slate-100">
                      {formatNum(item.totalRevenue)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Coste de Ventas (COGS)</td>
                  {incomeHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-slate-400">
                      {formatNum(item.costOfRevenue)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#121b2b]/50">
                  <td className="py-2.5 px-3 font-semibold text-amber-300">Margen Bruto (Gross Profit)</td>
                  {incomeHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-semibold text-amber-300">
                      {formatNum(item.grossProfit)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Beneficio Operativo (EBIT)</td>
                  {incomeHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-slate-200">
                      {formatNum(item.operatingIncome)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Gastos por Intereses</td>
                  {incomeHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-slate-400">
                      {formatNum(item.interestExpense)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#121b2b]">
                  <td className="py-2.5 px-3 font-bold text-emerald-400">Beneficio Neto (Net Income)</td>
                  {incomeHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {formatNum(item.netIncome)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}

          {activeStatement === 'balance' && (
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="border-b border-[#223048] text-slate-400">
                  <th className="py-2.5 px-3">Partida de Balance ({currency})</th>
                  {balanceHistory.map((item, idx) => (
                    <th key={idx} className="py-2.5 px-3 text-right">
                      {getYear(item)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2537]">
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Efectivo e Inversiones a CP</td>
                  {balanceHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-emerald-400 font-medium">
                      {formatNum(item.cash || item.totalCash)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Activo Corriente Total</td>
                  {balanceHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-slate-200">
                      {formatNum(item.totalCurrentAssets)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#121b2b]/50">
                  <td className="py-2.5 px-3 font-semibold text-cyan-300">Activos Totales (Total Assets)</td>
                  {balanceHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-semibold text-cyan-300">
                      {formatNum(item.totalAssets)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Pasivo Corriente</td>
                  {balanceHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-slate-400">
                      {formatNum(item.totalCurrentLiabilities)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-rose-400">Deuda a Largo Plazo</td>
                  {balanceHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-rose-400">
                      {formatNum(item.longTermDebt)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Pasivos Totales</td>
                  {balanceHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-slate-300">
                      {formatNum(item.totalLiab)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#121b2b]">
                  <td className="py-2.5 px-3 font-bold text-amber-400">Patrimonio Neto (Stockholder Equity)</td>
                  {balanceHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-bold text-amber-400">
                      {formatNum(item.totalStockholderEquity)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}

          {activeStatement === 'cashflow' && (
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="border-b border-[#223048] text-slate-400">
                  <th className="py-2.5 px-3">Partida Flujo de Caja ({currency})</th>
                  {cashflowHistory.map((item, idx) => (
                    <th key={idx} className="py-2.5 px-3 text-right">
                      {getYear(item)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2537]">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-emerald-400">
                    Flujo de Caja Operativo (CFO)
                  </td>
                  {cashflowHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                      {formatNum(item.totalCashFromOperatingActivities)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-rose-400">Gasto de Capital (CapEx)</td>
                  {cashflowHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-rose-400">
                      {formatNum(item.capitalExpenditures)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#121b2b]">
                  <td className="py-2.5 px-3 font-bold text-cyan-300">
                    Flujo de Caja Libre (Free Cash Flow)
                  </td>
                  {cashflowHistory.map((item, idx) => {
                    const cfo = item.totalCashFromOperatingActivities?.raw ?? item.totalCashFromOperatingActivities ?? 0;
                    const capex = Math.abs(item.capitalExpenditures?.raw ?? item.capitalExpenditures ?? 0);
                    const fcf = cfo - capex;
                    return (
                      <td key={idx} className="py-2.5 px-3 text-right font-bold text-cyan-300">
                        {formatNum(fcf)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Dividendos Pagados</td>
                  {cashflowHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-slate-400">
                      {formatNum(item.dividendsPaid)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400">Recompra de Acciones Propias</td>
                  {cashflowHistory.map((item, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-slate-400">
                      {formatNum(item.repurchaseOfStock)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 3. Piotroski 9-Test Detailed Audit Checklist */}
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>🔍</span> Desglose de las 9 Pruebas de Calidad de Piotroski
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {piotroski.details.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                item.passed
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {item.passed ? '✓ CUMPLE' : '✗ NO CUMPLE'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 mb-1">{item.name}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
