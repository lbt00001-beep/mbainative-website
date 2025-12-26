"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './InversionFundamentales.module.css';

// Type definitions
interface Metric {
  key: string;
  name: string;
  val: number | null;
  fmt: (val: number | null) => string;
  weight: number;
  score: (val: number | null) => number | null;
  why: string;
}

interface SP500Company {
  symbol: string;
  security: string;
  sector: string;
}

// Utility functions
const fmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const fmt0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const pct = (x: number | null) => (x == null || !isFinite(x)) ? "—" : (fmt.format(x * 100) + "%");
const money = (x: number | null, cur = "$") => {
  if (x == null || !isFinite(x)) return "—";
  const abs = Math.abs(x);
  let v = x, suf = "";
  if (abs >= 1e12) { v = x / 1e12; suf = "T"; }
  else if (abs >= 1e9) { v = x / 1e9; suf = "B"; }
  else if (abs >= 1e6) { v = x / 1e6; suf = "M"; }
  else if (abs >= 1e3) { v = x / 1e3; suf = "K"; }
  return `${cur}${fmt.format(v)}${suf}`;
};
const clamp = (x: number, min = 0, max = 100) => Math.max(min, Math.min(max, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function scoreHigherBetter(x: number | null, x0: number, x1: number, x2: number): number | null {
  if (x == null || !isFinite(x)) return null;
  if (x <= x0) return 0;
  if (x >= x2) return 100;
  if (x <= x1) return clamp(50 * (x - x0) / (x1 - x0));
  return clamp(50 + 50 * (x - x1) / (x2 - x1));
}

function scoreLowerBetter(x: number | null, x0: number, x1: number, x2: number): number | null {
  if (x == null || !isFinite(x)) return null;
  if (x <= x0) return 100;
  if (x >= x2) return 0;
  if (x <= x1) return clamp(100 - 50 * (x - x0) / (x1 - x0));
  return clamp(50 - 50 * (x - x1) / (x2 - x1));
}

function scoreAround(x: number | null, target: number, tolGood: number, tolBad: number): number | null {
  if (x == null || !isFinite(x)) return null;
  const d = Math.abs(x - target);
  if (d <= tolGood) return 100;
  if (d >= tolBad) return 0;
  return clamp(100 - 100 * (d - tolGood) / (tolBad - tolGood));
}

const GROUPS = [
  { title: "Rentabilidad", keys: ["grossMargin", "operMargin", "netMargin", "roe", "roa"] },
  { title: "Solidez", keys: ["debtToEquity", "netDebtToEbitda", "currentRatio"] },
  { title: "Crecimiento", keys: ["revGrowth", "earnGrowth"] },
  { title: "Caja", keys: ["fcfMargin"] },
  { title: "Valoración", keys: ["forwardPE", "peg", "ps", "pb"] }
];

export default function InversionFundamentales() {
  const [status, setStatus] = useState({ kind: '', html: '<b>Estado:</b> cargando lista S&P 500…' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [sp500, setSp500] = useState<SP500Company[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Load S&P 500 list from Wikipedia
  useEffect(() => {
    const loadSP500 = async () => {
      try {
        const url = "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_S%26P_500_companies&prop=text&format=json&origin=*";
        const r = await fetch(url);
        if (!r.ok) throw new Error("Wikipedia: " + r.status);
        const j = await r.json();
        const html = j?.parse?.text?.["*"];
        if (!html) throw new Error("No se pudo leer la tabla.");

        const doc = new DOMParser().parseFromString(html, "text/html");
        const tables = Array.from(doc.querySelectorAll("table.wikitable"));
        let t: HTMLTableElement | null = null;

        for (const tb of tables) {
          const header = tb.querySelector("tr")?.innerText || "";
          if (header.includes("Symbol") && header.includes("Security")) {
            t = tb as HTMLTableElement;
            break;
          }
        }
        if (!t) throw new Error("No encontré la tabla.");

        const rows = Array.from(t.querySelectorAll("tbody tr")).slice(1);
        const companies: SP500Company[] = rows.map(tr => {
          const tds = tr.querySelectorAll("td");
          return {
            symbol: (tds[0]?.textContent || "").trim(),
            security: (tds[1]?.textContent || "").trim(),
            sector: (tds[3]?.textContent || "").trim()
          };
        }).filter(x => x.symbol && x.security);

        companies.sort((a, b) => {
          const sa = (a.sector || "").localeCompare(b.sector || "", 'en', { sensitivity: "base" });
          if (sa !== 0) return sa;
          return (a.symbol || "").localeCompare(b.symbol || "", 'en', { sensitivity: "base" });
        });

        setSp500(companies);
        setStatus({ kind: "ok", html: `<b>Estado:</b> lista cargada (${companies.length} empresas). Elige una empresa.` });
      } catch (e) {
        setStatus({ kind: "warn", html: `<b>Aviso:</b> no pude cargar S&P 500. Escribe el ticker manualmente.` });
      }
    };
    loadSP500();
  }, []);

  // Group companies by sector
  const companiesBySector = sp500.reduce((acc, company) => {
    const sector = company.sector || "Other";
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(company);
    return acc;
  }, {} as Record<string, SP500Company[]>);

  const fetchYahoo = async (ticker: string, modules: string[]) => {
    const res = await fetch(`/api/quoteSummary?t=${ticker}&modules=${modules.join(',')}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Error fetching data: ${res.statusText}`);
    }
    return res.json();
  };

  function pickNum(obj: any): number | null {
    if (obj == null) return null;
    if (typeof obj === "number") return obj;
    if (typeof obj?.raw === "number") return obj.raw;
    return null;
  }

  function sectorProfile(sector: string | null) {
    const s = (sector || "").toLowerCase();
    if (s.includes("financial")) return { drop: ["currentRatio", "debtToEquity", "netDebtToEbitda"], tweak: { peMax: 55 } };
    if (s.includes("utilities")) return { tweak: { peMax: 45 } };
    if (s.includes("energy")) return { tweak: { peMax: 35 } };
    if (s.includes("information technology") || s.includes("communication services")) return { tweak: { peMax: 65 } };
    return { tweak: { peMax: 55 } };
  }

  function buildMetrics(data: any): { metrics: Metric[], sector: string } {
    const fin = data.financialData || {};
    const stats = data.defaultKeyStatistics || {};
    const sum = data.summaryDetail || {};
    const profile = data.assetProfile || {};
    const sector = profile.sector || "—";
    const adj = sectorProfile(sector);

    const totalRevenue = pickNum(fin.totalRevenue);
    const freeCashflow = pickNum(fin.freeCashflow);
    const totalDebt = pickNum(fin.totalDebt);
    const totalCash = pickNum(fin.totalCash);
    const ebitda = pickNum(fin.ebitda);

    const netDebt = (totalDebt != null && totalCash != null) ? (totalDebt - totalCash) : null;
    const netDebtToEbitda = (netDebt != null && ebitda != null && ebitda > 0) ? (netDebt / ebitda) : null;
    const fcfMargin = (freeCashflow != null && totalRevenue != null && totalRevenue > 0) ? (freeCashflow / totalRevenue) : null;

    const mGross = pickNum(fin.grossMargins);
    const mOper = pickNum(fin.operatingMargins);
    const mNet = pickNum(fin.profitMargins);
    const roe = pickNum(fin.returnOnEquity);
    const roa = pickNum(fin.returnOnAssets);

    let dte = pickNum(fin.debtToEquity);
    if (dte != null && dte > 5) dte = dte / 100;

    const currentRatio = pickNum(fin.currentRatio);
    const revGrowth = pickNum(fin.revenueGrowth);
    const earnGrowth = pickNum(fin.earningsGrowth);
    const forwardPE = pickNum(stats.forwardPE);
    const peg = pickNum(stats.pegRatio);
    const pb = pickNum(stats.priceToBook);
    const ps = pickNum(sum.priceToSalesTrailing12Months);

    let metrics: Metric[] = [
      { key: "grossMargin", name: "Margen bruto", val: mGross, fmt: pct, weight: 9, score: (x) => scoreHigherBetter(x, .20, .40, .60), why: "Parte de ventas que queda tras costes directos." },
      { key: "operMargin", name: "Margen operativo", val: mOper, fmt: pct, weight: 10, score: (x) => scoreHigherBetter(x, 0.00, .10, .25), why: "Rentabilidad del negocio antes de intereses e impuestos." },
      { key: "netMargin", name: "Margen neto", val: mNet, fmt: pct, weight: 6, score: (x) => scoreHigherBetter(x, 0.00, .08, .20), why: "Beneficio final sobre ventas." },
      { key: "roe", name: "ROE", val: roe, fmt: pct, weight: 6, score: (x) => scoreHigherBetter(x, 0.00, .10, .25), why: "Eficiencia con el capital de accionistas." },
      { key: "roa", name: "ROA", val: roa, fmt: pct, weight: 4, score: (x) => scoreHigherBetter(x, 0.00, .05, .10), why: "Eficiencia con activos totales." },
      { key: "debtToEquity", name: "Deuda/Patrimonio (D/E)", val: dte, fmt: (x) => x == null ? "—" : fmt.format(x!), weight: 10, score: (x) => scoreLowerBetter(x, 0.4, 1.2, 2.5), why: "Más deuda suele implicar más fragilidad en crisis." },
      { key: "netDebtToEbitda", name: "Deuda neta / EBITDA", val: netDebtToEbitda, fmt: (x) => x == null ? "—" : fmt.format(x!), weight: 9, score: (x) => scoreLowerBetter(x, 0.5, 2.0, 4.5), why: "Años 'equivalentes' para repagar deuda con EBITDA." },
      { key: "currentRatio", name: "Current ratio", val: currentRatio, fmt: (x) => x == null ? "—" : fmt.format(x!), weight: 6, score: (x) => scoreHigherBetter(x, 0.8, 1.5, 2.5), why: "Capacidad de pagar obligaciones a corto plazo." },
      { key: "revGrowth", name: "Crec. ingresos (YoY)", val: revGrowth, fmt: pct, weight: 12, score: (x) => scoreHigherBetter(x, -0.10, 0.05, 0.20), why: "Si ventas crecen, suele haber demanda real." },
      { key: "earnGrowth", name: "Crec. beneficios (YoY)", val: earnGrowth, fmt: pct, weight: 8, score: (x) => scoreHigherBetter(x, -0.10, 0.05, 0.25), why: "Beneficios creciendo: buena señal, con cautela por ciclos." },
      { key: "fcfMargin", name: "FCF / ingresos", val: fcfMargin, fmt: pct, weight: 12, score: (x) => scoreHigherBetter(x, -0.02, 0.06, 0.15), why: "Caja libre sobre ventas. Alta = negocio que genera dinero real." },
      { key: "forwardPE", name: "PER forward", val: forwardPE, fmt: (x) => x == null ? "—" : fmt.format(x!), weight: 4, score: (x) => { const peMax = adj.tweak?.peMax ?? 55; if (x == null) return null; if (x <= 0) return 0; return scoreLowerBetter(x, 15, 25, peMax); }, why: "Precio vs beneficios futuros esperados." },
      { key: "peg", name: "PEG", val: peg, fmt: (x) => x == null ? "—" : fmt.format(x!), weight: 2, score: (x) => scoreAround(x, 1.0, 0.6, 2.2), why: "PER ajustado por crecimiento (aprox.)." },
      { key: "ps", name: "P/S", val: ps, fmt: (x) => x == null ? "—" : fmt.format(x!), weight: 1, score: (x) => scoreLowerBetter(x, 3.5, 7.5, 16), why: "Precio respecto a ventas." },
      { key: "pb", name: "P/B", val: pb, fmt: (x) => x == null ? "—" : fmt.format(x!), weight: 1, score: (x) => scoreLowerBetter(x, 2.5, 6.0, 16), why: "Precio respecto a valor contable." }
    ];

    if (adj.drop) {
      for (const k of adj.drop) {
        const m = metrics.find(x => x.key === k);
        if (m) m.weight = 0;
      }
    }

    return { metrics, sector };
  }

  function computeScore(metrics: Metric[]): { score: number | null, dataQuality: number, have: number, activeCount: number, weightUsed: number } {
    const active = metrics.filter(m => m.weight > 0);
    let wSum = 0, sSum = 0, have = 0;
    for (const m of active) {
      const sc = m.score(m.val);
      if (sc == null) continue;
      have++;
      wSum += m.weight;
      sSum += sc * m.weight;
    }
    const score = (wSum > 0) ? (sSum / wSum) : null;
    const dq = active.length ? (have / active.length) : 0;
    return { score, dataQuality: dq, have, activeCount: active.length, weightUsed: wSum };
  }

  function verdict(score: number | null) {
    if (score == null) return { title: "Sin score", sub: "Faltan datos para calcular." };
    if (score >= 80) return { title: "Muy fuerte", sub: "Fundamentales muy sanos en varias dimensiones. Aun así, revisa valoración y riesgos." };
    if (score >= 65) return { title: "Fuerte", sub: "Buen perfil fundamental. Revisa riesgos y precio pagado." };
    if (score >= 50) return { title: "Mixto", sub: "Hay puntos fuertes y débiles. Necesitas tesis clara y margen de seguridad." };
    return { title: "Débil", sub: "Fundamentales frágiles o fase complicada. Precaución." };
  }

  function computeSubIndex(metrics: Metric[], group: typeof GROUPS[0]) {
    const ms = metrics.filter(m => group.keys.includes(m.key) && m.weight > 0);
    const r = computeScore(ms);
    return { title: group.title, score: r.score };
  }

  function topContributions(metrics: Metric[], limit = 8) {
    const active = metrics.filter(m => m.weight > 0);
    const scored: { m: Metric, s: number, contrib: number }[] = [];
    for (const m of active) {
      const s = m.score(m.val);
      if (s == null) continue;
      scored.push({ m, s, contrib: (m.weight * s) });
    }
    scored.sort((a, b) => b.contrib - a.contrib);
    return scored.slice(0, limit).map(x => ({
      label: `${x.m.name} (${x.m.weight}%)`,
      value: x.s
    }));
  }

  function buildStrengthRiskLists(metrics: Metric[]) {
    const active = metrics.filter(m => m.weight > 0);
    const scored = active.map(m => ({ m, s: m.score(m.val) })).filter(x => x.s != null) as { m: Metric, s: number }[];

    const strengths = scored.filter(x => x.s >= 75).sort((a, b) => (b.m.weight * b.s) - (a.m.weight * a.s)).slice(0, 5);
    const risks = scored.filter(x => x.s <= 40).sort((a, b) => (b.m.weight - a.m.weight)).slice(0, 5);

    return {
      strengths: strengths.map(x => ({ name: x.m.name, weight: x.m.weight, score: Math.round(x.s), value: x.m.fmt(x.m.val), why: x.m.why })),
      risks: risks.map(x => ({ name: x.m.name, weight: x.m.weight, score: Math.round(x.s), value: x.m.fmt(x.m.val), why: x.m.why }))
    };
  }

  const handleAnalyze = async () => {
    const sym = tickerInput.split("—")[0].trim().split(" ")[0].trim().toUpperCase().replaceAll(".", "-");
    if (!sym) {
      setStatus({ kind: "warn", html: "<b>Aviso:</b> escribe o selecciona un ticker." });
      return;
    }

    setIsAnalyzing(true);
    setStatus({ kind: '', html: `<b>Estado:</b> consultando API para <b>${sym}</b>…` });

    try {
      const { data } = await fetchYahoo(sym, ["price", "summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile"]);

      const row = sp500.find(x => x.symbol.toUpperCase() === sym.toUpperCase());
      const name = data.price?.shortName || row?.security || "—";
      const sector = data.assetProfile?.sector || row?.sector || "—";
      const mcap = pickNum(data.price?.marketCap);
      const price = pickNum(data.price?.regularMarketPrice);
      const divY = pickNum(data.summaryDetail?.dividendYield);

      const metricsResult = buildMetrics(data);
      const agg = computeScore(metricsResult.metrics);
      const verdictData = verdict(agg.score);
      const subs = GROUPS.map(g => computeSubIndex(metricsResult.metrics, g));
      const contrib = topContributions(metricsResult.metrics);
      const { strengths, risks } = buildStrengthRiskLists(metricsResult.metrics);

      setAnalysisResult({
        ticker: sym,
        name,
        sector,
        mcap,
        price,
        divY,
        metrics: metricsResult.metrics,
        score: agg.score,
        dataQuality: agg.dataQuality,
        have: agg.have,
        activeCount: agg.activeCount,
        weightUsed: agg.weightUsed,
        verdict: verdictData,
        subs,
        contrib,
        strengths,
        risks
      });

      const kind = (agg.score == null) ? "warn" : (agg.score >= 65 ? "ok" : (agg.score >= 50 ? "warn" : "bad"));
      setStatus({ kind, html: `<b>Estado:</b> análisis completado para <b>${sym}</b>.` });

    } catch (e) {
      setStatus({ kind: 'bad', html: `<b>Error:</b> no pude leer los datos para <b>${sym}</b>.<br><span class="small mono">${String(e)}</span>` });
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setSelectedSector(v);
    if (v) {
      setTickerInput(v);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !analysisResult) return;

    setIsGeneratingPdf(true);
    setStatus({ kind: '', html: '<b>Estado:</b> generando PDF…' });

    try {
      // Dynamic imports to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = reportRef.current;

      // Create canvas from the report section
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0b1020',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If content is taller than one page, we need multiple pages
      let heightLeft = imgHeight;
      let position = 10; // top margin

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      // Generate filename with ticker and date
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const filename = `${analysisResult.ticker}_informe_${dateStr}.pdf`;

      pdf.save(filename);
      setStatus({ kind: 'ok', html: `<b>Estado:</b> PDF descargado: <b>${filename}</b>` });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setStatus({ kind: 'bad', html: '<b>Error:</b> no se pudo generar el PDF.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleClear = () => {
    setTickerInput('');
    setSelectedSector('');
    setAnalysisResult(null);
    setStatus({ kind: '', html: '<b>Estado:</b> escribe o selecciona un ticker.' });
  };

  const scoreColor = (score: number | null) => {
    if (score == null) return "rgba(169,182,223,.8)";
    if (score >= 70) return "#66f2a3";
    if (score >= 50) return "#ffd166";
    return "#ff6b6b";
  };

  // SVG Gauge component
  const Gauge = ({ score }: { score: number | null }) => {
    const p = score != null ? clamp(score, 0, 100) / 100 : 0;
    const len = 283;
    const ang = lerp(-90, 90, p);

    return (
      <svg width="220" height="120" viewBox="0 0 220 120" aria-label="Índice fundamental">
        <defs>
          <linearGradient id="grad" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(255,107,107,.95)" />
            <stop offset="55%" stopColor="rgba(255,209,102,.95)" />
            <stop offset="100%" stopColor="rgba(102,242,163,.95)" />
          </linearGradient>
        </defs>
        <path d="M20,110 A90,90 0 0 1 200,110" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="14" strokeLinecap="round" />
        <path d="M20,110 A90,90 0 0 1 200,110" fill="none" stroke="url(#grad)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={score != null ? `${len * p} 999` : "0 999"} />
        <circle cx="110" cy="110" r="7" fill="rgba(255,255,255,.25)" />
        <line x1="110" y1="110" x2="110" y2="28" stroke="rgba(122,162,255,.95)" strokeWidth="4" strokeLinecap="round"
          transform={score != null ? `rotate(${ang} 110 110)` : ""} />
        <text x="110" y="74" textAnchor="middle" fontSize="22" fontWeight="900" fill="currentColor">
          {score != null ? fmt0.format(score) : "—"}
        </text>
        <text x="110" y="96" textAnchor="middle" fontSize="12" fill="rgba(169,182,223,.9)">
          Índice 0–100
        </text>
      </svg>
    );
  };

  // SVG Bar Chart component
  const BarChart = ({ items, leftWidth = 140 }: { items: { label: string, value: number | null }[], leftWidth?: number }) => {
    const barH = 18;
    const gap = 12;
    const w = 520;
    const right = 40;
    const top = 12;
    const h = top + items.length * (barH + gap) + 10;
    const maxW = w - leftWidth - right;

    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width={w} height={h} rx="14" fill="rgba(255,255,255,.02)" stroke="rgba(255,255,255,.08)" />
        {items.map((it, i) => {
          const y = top + i * (barH + gap);
          const val = clamp(it.value ?? 0, 0, 100);
          const bw = maxW * (val / 100);
          const col = scoreColor(it.value);

          return (
            <g key={i}>
              <text x={leftWidth - 10} y={y + barH - 4} textAnchor="end" fontSize="12" fill="rgba(169,182,223,.95)">{it.label}</text>
              <rect x={leftWidth} y={y} width={maxW} height={barH} rx="999" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.10)" />
              <rect x={leftWidth} y={y} width={bw} height={barH} rx="999" fill={col} />
              <text x={leftWidth + maxW + 10} y={y + barH - 4} fontSize="12" fill="rgba(169,182,223,.95)">
                {it.value == null ? "—" : Math.round(val)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <h1>
            SP500 Fundamental Score
            <span className={styles.tag}>
              <span className={styles.dot} style={{ background: status.kind === 'ok' ? '#66f2a3' : status.kind === 'warn' ? '#ffd166' : status.kind === 'bad' ? '#ff6b6b' : 'rgba(169,182,223,.9)' }}></span>
              <span>{status.kind === 'ok' ? 'OK' : status.kind === 'warn' ? 'Aviso' : status.kind === 'bad' ? 'Error' : 'Listo'}</span>
            </span>
          </h1>
          <p>Elige una empresa del S&P 500 (por sector o tecleando), consulta Yahoo Finance y calcula un índice 0–100 (salud fundamental).</p>
          <div className={styles.pillrow}>
            <span className={styles.pill}>Rentabilidad</span>
            <span className={styles.pill}>Solidez</span>
            <span className={styles.pill}>Crecimiento</span>
            <span className={styles.pill}>Caja</span>
            <span className={styles.pill}>Valoración</span>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>1) Selección (S&P 500)</h2>

          <div className={styles.row}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <label className={styles.label}>Ticker (teclear) o elegir por sector</label>
              <div className={styles.tickerRow}>
                <input
                  list="sp500List"
                  placeholder="Ej: NVDA, GOOGL, AAPL…"
                  className={styles.input}
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
                <button type="button" className={styles.ghostBtn} onClick={handleClear}>Limpiar</button>
              </div>
              <datalist id="sp500List">
                {sp500.map(c => (
                  <option key={c.symbol} value={`${c.symbol} — ${c.security} (${c.sector})`} />
                ))}
              </datalist>

              <div className={styles.tickerRow} style={{ marginTop: 10 }}>
                <select
                  className={styles.input}
                  value={selectedSector}
                  onChange={handleSectorChange}
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#1a1a2e'
                  }}
                >
                  <option value="">— Selecciona por sector —</option>
                  {Object.keys(companiesBySector).sort().map(sector => (
                    <optgroup key={sector} label={sector} style={{ backgroundColor: '#ffffff', color: '#333' }}>
                      {companiesBySector[sector].map(c => (
                        <option key={c.symbol} value={c.symbol} style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}>
                          {c.symbol} — {c.security}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className={styles.small}>{sp500.length > 0 ? `Lista cargada: ${sp500.length} empresas` : 'Cargando lista...'}</div>
            </div>

            <div style={{ minWidth: 180 }}>
              <label className={styles.label}>&nbsp;</label>
              <button onClick={handleAnalyze} disabled={isAnalyzing} className={styles.button}>
                {isAnalyzing ? <span className={styles.spin}></span> : 'Analizar'}
              </button>
            </div>
          </div>

          <div className={`${styles.status} ${status.kind && styles[status.kind]}`} dangerouslySetInnerHTML={{ __html: status.html }} />

          {/* Gauge & KPIs */}
          <div className={styles.split} style={{ marginTop: 12 }}>
            <div className={styles.gaugeBox}>
              <Gauge score={analysisResult?.score ?? null} />
              <div className={styles.verdict}>
                <p className={styles.big}>
                  {analysisResult ? `${analysisResult.verdict.title} · ${analysisResult.score != null ? fmt0.format(analysisResult.score) : '—'}/100` : 'Sin análisis'}
                </p>
                <p className={styles.sub}>
                  {analysisResult ? analysisResult.verdict.sub : 'Elige una empresa y pulsa "Analizar".'}
                </p>
                <div className={styles.barwrap}>
                  <div className={styles.small}>Confianza (calidad de datos)</div>
                  <div className={styles.bar}>
                    <i style={{ width: `${analysisResult ? Math.round(analysisResult.dataQuality * 100) : 0}%` }}></i>
                  </div>
                  <div className={styles.small}>{analysisResult ? `${Math.round(analysisResult.dataQuality * 100)}% de métricas con datos válidos` : '—'}</div>
                </div>
              </div>
            </div>

            <div className={styles.kpis}>
              <div className={styles.kpi}><div className={styles.t}>Ticker</div><div className={styles.v}>{analysisResult?.ticker || '—'}</div><div className={styles.s}>{analysisResult?.name || '—'}</div></div>
              <div className={styles.kpi}><div className={styles.t}>Sector</div><div className={styles.v}>{analysisResult?.sector || '—'}</div><div className={styles.s}>S&P 500</div></div>
              <div className={styles.kpi}><div className={styles.t}>Market Cap</div><div className={styles.v}>{analysisResult ? money(analysisResult.mcap) : '—'}</div><div className={styles.s}>tamaño</div></div>
              <div className={styles.kpi}><div className={styles.t}>Precio</div><div className={styles.v}>{analysisResult?.price != null ? `$${fmt.format(analysisResult.price)}` : '—'}</div><div className={styles.s}>mercado</div></div>
              <div className={styles.kpi}><div className={styles.t}>Div. Yield</div><div className={styles.v}>{analysisResult?.divY != null ? pct(analysisResult.divY) : '—'}</div><div className={styles.s}>si aplica</div></div>
            </div>
          </div>
        </section>

        {/* Subíndices */}
        <aside className={styles.card}>
          <h2>2) Subíndices y explicación</h2>
          <div>
            {analysisResult?.subs.map((sub: any) => (
              <div key={sub.title} className={styles.kpi} style={{ marginBottom: 10 }}>
                <div className={styles.t}>{sub.title}</div>
                <div className={styles.v}>{sub.score != null ? fmt0.format(sub.score) : '—'}</div>
              </div>
            ))}
          </div>
          <details style={{ marginTop: 12 }}>
            <summary>¿Qué significa cada indicador?</summary>
            <div className={styles.hint}>
              <ul>
                <li><b>Márgenes</b>: parte de las ventas que queda tras costes.</li>
                <li><b>ROE / ROA</b>: eficiencia generando beneficio.</li>
                <li><b>Deuda/Patrimonio</b>: cuánto depende de deuda.</li>
                <li><b>FCF</b>: caja libre real.</li>
                <li><b>PER/PEG</b>: valoración frente a beneficios.</li>
              </ul>
            </div>
          </details>
        </aside>
      </div>

      {/* Metrics Table */}
      <section className={styles.card} style={{ marginTop: 14 }}>
        <h2>3) Tabla de métricas (valor + puntuación)</h2>
        <div style={{ maxHeight: 380, overflow: 'auto', borderRadius: 16 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Métrica</th>
                <th style={{ width: '18%' }}>Valor</th>
                <th style={{ width: '12%' }}>Score</th>
                <th style={{ width: '16%' }}>Peso</th>
                <th>Interpretación</th>
              </tr>
            </thead>
            <tbody>
              {analysisResult?.metrics.filter((m: Metric) => m.weight > 0).sort((a: Metric, b: Metric) => b.weight - a.weight).map((m: Metric) => (
                <tr key={m.key}>
                  <td><b>{m.name}</b><div className={styles.small} style={{ fontFamily: 'monospace' }}>{m.key}</div></td>
                  <td style={{ fontFamily: 'monospace' }}>{m.fmt(m.val)}</td>
                  <td><b>{m.score(m.val) != null ? fmt0.format(m.score(m.val)!) : '—'}</b></td>
                  <td>{fmt.format(m.weight)}%</td>
                  <td className={styles.small}>{m.why}</td>
                </tr>
              ))}
              {!analysisResult && <tr><td colSpan={5} className={styles.small}>Sin datos todavía.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className={styles.footer}><b>Nota:</b> el índice mide "salud" del negocio, no garantiza que el precio esté barato.</div>
      </section>

      {/* Report Section */}
      {analysisResult && (
        <section className={styles.card} style={{ marginTop: 14 }}>
          <div className={styles.row} style={{ justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ marginBottom: 6 }}>4) Informe (texto + gráficos)</h2>
              <div className={styles.small}>
                Empresa: {analysisResult.ticker} · {analysisResult.name} · Sector: {analysisResult.sector} · Fecha: {new Date().toLocaleString("es-ES")}
              </div>
            </div>
            <div>
              <button
                onClick={downloadPDF}
                disabled={isGeneratingPdf}
                className={styles.ghostBtn}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {isGeneratingPdf ? <span className={styles.spin}></span> : '📄'}
                {isGeneratingPdf ? 'Generando…' : 'Descargar PDF'}
              </button>
            </div>
          </div>
          <div ref={reportRef}>

            <div className={styles.reportGrid} style={{ marginTop: 12 }}>
              <div className={styles.reportBox}>
                <h3>Resumen en lenguaje claro</h3>
                <div className={styles.small} style={{ lineHeight: 1.5 }}>
                  Este informe resume la <b>salud fundamental</b> de la empresa con un índice de <b>0 a 100</b>.
                  <br /><br />
                  <b>Cómo leerlo:</b>
                  <br />• Alto: suele indicar <b>rentabilidad</b>, <b>solidez</b>, <b>crecimiento</b> y <b>caja</b>.
                  <br />• Bajo: suele indicar <b>debilidades</b> (márgenes pobres, mucha deuda, caída de ingresos…).
                  <br /><br />
                  <b>Ojo:</b> "fundamentales sanos" no equivale a "acción barata".
                </div>
                <div className={styles.chips} style={{ marginTop: 10 }}>
                  <span className={`${styles.badge} ${analysisResult.score >= 65 ? styles.bGood : analysisResult.score >= 50 ? styles.bWarn : styles.bBad}`}>
                    Índice: <b>{analysisResult.score != null ? Math.round(analysisResult.score) : '—'}</b>/100 · {analysisResult.verdict.title}
                  </span>
                  <span className={styles.chip}>Calidad de datos: <b>{Math.round(analysisResult.dataQuality * 100)}%</b></span>
                  <span className={styles.chip}>Peso usado: <b>{fmt.format(analysisResult.weightUsed)}%</b></span>
                </div>
              </div>

              <div className={styles.reportBox}>
                <h3>Cómo se calcula (0–100)</h3>
                <div className={styles.small} style={{ lineHeight: 1.5 }}>
                  Cada indicador se convierte en un <b>score</b> entre 0 y 100. Luego hacemos un <b>promedio ponderado</b>.
                  <br /><br />
                  <code style={{ fontFamily: 'monospace' }}>Índice = (Σ (pesoᵢ × scoreᵢ)) / (Σ pesoᵢ con dato)</code>
                  <br /><br />
                  En esta empresa hemos usado <b>{fmt.format(analysisResult.weightUsed)}%</b> del peso total.
                </div>
              </div>

              <div className={styles.reportBox}>
                <h3>Gráfico 1: Subíndices (0–100)</h3>
                <BarChart items={analysisResult.subs.map((s: any) => ({ label: s.title, value: s.score }))} />
              </div>

              <div className={styles.reportBox}>
                <h3>Gráfico 2: Métricas con más impacto</h3>
                <BarChart items={analysisResult.contrib} leftWidth={220} />
              </div>

              <div className={styles.reportBox} style={{ gridColumn: '1 / -1' }}>
                <h3>Fortalezas y puntos a vigilar</h3>
                <div className={styles.reportGrid}>
                  <div>
                    <div className={styles.small} style={{ marginBottom: 6 }}><b>Fortalezas</b></div>
                    <div className={styles.small} style={{ lineHeight: 1.5 }}>
                      {analysisResult.strengths.length > 0 ? analysisResult.strengths.map((s: any, i: number) => (
                        <div key={i}>• <b>{s.name}</b> ({s.weight}%): score <b>{s.score}</b>, valor {s.value}</div>
                      )) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className={styles.small} style={{ marginBottom: 6 }}><b>Puntos a vigilar</b></div>
                    <div className={styles.small} style={{ lineHeight: 1.5 }}>
                      {analysisResult.risks.length > 0 ? analysisResult.risks.map((r: any, i: number) => (
                        <div key={i}>• <b>{r.name}</b> ({r.weight}%): score <b>{r.score}</b>, valor {r.value}</div>
                      )) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
