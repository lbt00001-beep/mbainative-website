"use client";

import { useState } from 'react';
import styles from './InversionFundamentales.module.css';
import { sp500Tickers } from './sp500_tickers';
import Tooltip from '@/components/Tooltip';

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

// Utility functions (ported from the original JS)
const fmt = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 2});
const fmt0 = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 0});
const pct = (x: number | null) => (x==null || !isFinite(x)) ? "—" : (fmt.format(x*100) + "%");
const money = (x: number | null, cur="$") => {
  if(x==null || !isFinite(x)) return "—";
  const abs = Math.abs(x);
  let v = x, suf="";
  if(abs>=1e12){ v=x/1e12; suf="T"; }
  else if(abs>=1e9){ v=x/1e9; suf="B"; }
  else if(abs>=1e6){ v=x/1e6; suf="M"; }
  else if(abs>=1e3){ v=x/1e3; suf="K"; }
  return `${cur}${fmt.format(v)}${suf}`;
};
const clamp = (x: number,min=0,max=100)=>Math.max(min,Math.min(max,x));
const lerp = (a: number,b: number,t: number)=>a+(b-a)*t;

function scoreHigherBetter(x: number | null, x0: number, x1: number, x2: number): number | null {
  if(x==null || !isFinite(x)) return null;
  if(x<=x0) return 0;
  if(x>=x2) return 100;
  if(x<=x1) return clamp(50*(x-x0)/(x1-x0));
  return clamp(50 + 50*(x-x1)/(x2-x1));
}
function scoreLowerBetter(x: number | null, x0: number, x1: number, x2: number): number | null {
  if(x==null || !isFinite(x)) return null;
  if(x<=x0) return 100;
  if(x>=x2) return 0;
  if(x<=x1) return clamp(100 - 50*(x-x0)/(x1-x0));
  return clamp(50 - 50*(x-x1)/(x2-x1));
}
function scoreAround(x: number | null, target: number, tolGood: number, tolBad: number): number | null {
  if(x==null || !isFinite(x)) return null;
  const d = Math.abs(x-target);
  if(d<=tolGood) return 100;
  if(d>=tolBad) return 0;
  return clamp(100 - 100*(d-tolGood)/(tolBad-tolGood));
}

export default function InversionFundamentales() {
  const [status, setStatus] = useState({ kind: '', html: '<b>Estado:</b> inicializando…' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const fetchYahoo = async (ticker: string, modules: string[]) => {
    const res = await fetch(`/api/quoteSummary?t=${ticker}&modules=${modules.join(',')}`);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error fetching data: ${res.statusText}`);
    }
    return res.json();
  };
  
  function pickNum(obj: any): number | null {
    if(obj==null) return null;
    if(typeof obj === "number") return obj;
    if(typeof obj?.raw === "number") return obj.raw;
    return null;
  }
  
  function sectorProfile(sector: string | null){
    const s = (sector||"").toLowerCase();
    if(s.includes("financial")){
      return { name:"Financials", drop:["currentRatio","debtToEquity","quickRatio","netDebtToEbitda"], boost:{roe:1.25, pb:1.15} };
    }
    if(s.includes("real estate")){
      return { name:"Real Estate", boost:{divYield:1.15, fcfMargin:1.10}, tweak:{peMax:55} };
    }
    if(s.includes("utilities")){
      return { name:"Utilities", boost:{divYield:1.20, currentRatio:1.05}, tweak:{peMax:45} };
    }
    if(s.includes("energy")){
      return { name:"Energy", boost:{fcfMargin:1.15, debtToEquity:1.05}, tweak:{peMax:35} };
    }
    if(s.includes("information technology") || s.includes("communication services")){
      return { name:"Tech/Comms", boost:{growth:1.20, margins:1.10}, tweak:{peMax:65} };
    }
    return { name:"General" };
  }

  function buildMetrics(data: any): { metrics: Metric[], sector: string } {
    const price = data.price || {};
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
  
    const netDebt = (totalDebt!=null && totalCash!=null) ? (totalDebt - totalCash) : null;
    const netDebtToEbitda = (netDebt!=null && ebitda!=null && ebitda>0) ? (netDebt/ebitda) : null;
  
    const fcfMargin = (freeCashflow!=null && totalRevenue!=null && totalRevenue>0) ? (freeCashflow/totalRevenue) : null;
  
    const mGross = pickNum(fin.grossMargins);
    const mOper = pickNum(fin.operatingMargins);
    const mNet = pickNum(fin.profitMargins);
  
    const roe = pickNum(fin.returnOnEquity);
    const roa = pickNum(fin.returnOnAssets);
  
    let dte = pickNum(fin.debtToEquity);
    if(dte != null && dte > 5) dte = dte / 100;
  
    const currentRatio = pickNum(fin.currentRatio);
  
    const revGrowth = pickNum(fin.revenueGrowth);
    const earnGrowth = pickNum(fin.earningsGrowth);
  
    const forwardPE = pickNum(stats.forwardPE);
    const peg = pickNum(stats.pegRatio);
    const ps = pickNum(sum.priceToSalesTrailing12Months);
    const pb = pickNum(stats.priceToBook);
  
    let metrics: Metric[] = [
      {key:"grossMargin",   name:"Margen bruto",        val:mGross,  fmt:pct, weight:9,  score:(x)=>scoreHigherBetter(x, .20, .40, .60),
        why:"Cuánto queda tras costes directos. Alto = poder de precio/eficiencia."},
      {key:"operMargin",    name:"Margen operativo",    val:mOper,   fmt:pct, weight:10, score:(x)=>scoreHigherBetter(x, 0.00, .10, .25),
        why:"Rentabilidad del negocio antes de intereses e impuestos. Alto suele ser señal de buen ‘moat’."},
      {key:"netMargin",     name:"Margen neto",         val:mNet,    fmt:pct, weight:6,  score:(x)=>scoreHigherBetter(x, 0.00, .08, .20),
        why:"Beneficio final sobre ventas. Si es negativo, la empresa ‘quema’ valor."},
      {key:"roe",           name:"ROE",                 val:roe,     fmt:pct, weight:6,  score:(x)=>scoreHigherBetter(x, 0.00, .10, .25),
        why:"Eficiencia con el capital de accionistas. Muy alto y sostenible suele ser excelente."},
      {key:"roa",           name:"ROA",                 val:roa,     fmt:pct, weight:4,  score:(x)=>scoreHigherBetter(x, 0.00, .05, .10),
        why:"Eficiencia con los activos totales. Complementa al ROE."},
      {key:"debtToEquity",  name:"Deuda/Patrimonio (D/E)", val:dte, fmt:(x)=> x==null? "—" : fmt.format(x!), weight:10,
        score:(x)=>scoreLowerBetter(x, 0.4, 1.2, 2.5),
        why:"Mucha deuda hace frágil a la empresa en crisis. (En bancos este ratio no se usa igual)."},
      {key:"netDebtToEbitda",name:"Deuda neta / EBITDA", val:netDebtToEbitda, fmt:(x)=> x==null? "—" : fmt.format(x!), weight:9,
        score:(x)=>scoreLowerBetter(x, 0.5, 2.0, 4.5),
        why:"Años ‘equivalentes’ para repagar deuda con EBITDA. Cuanto menor, más colchón."},
      {key:"currentRatio",  name:"Current ratio",       val:currentRatio, fmt:(x)=> x==null? "—" : fmt.format(x!), weight:6,
        score:(x)=>scoreHigherBetter(x, 0.8, 1.5, 2.5),
        why:"Capacidad para pagar obligaciones de corto plazo. Muy bajo = estrés de liquidez."},
      {key:"revGrowth",     name:"Crec. ingresos (YoY)", val:revGrowth, fmt:pct, weight:12,
        score:(x)=>scoreHigherBetter(x, -0.10, 0.05, 0.20),
        why:"Si ventas crecen sostenidamente, suele haber demanda real / expansión."},
      {key:"earnGrowth",    name:"Crec. beneficios (YoY)", val:earnGrowth, fmt:pct, weight:8,
        score:(x)=>scoreHigherBetter(x, -0.10, 0.05, 0.25),
        why:"Crecimiento de beneficios: clave, pero puede ser volátil por ciclos."},
      {key:"fcfMargin",     name:"FCF / ingresos",       val:fcfMargin, fmt:pct, weight:12,
        score:(x)=>scoreHigherBetter(x, -0.02, 0.06, 0.15),
        why:"Caja libre respecto a ventas. Alta = negocio que genera dinero real."},
      {key:"forwardPE",     name:"PER forward",          val:forwardPE, fmt:(x)=> x==null? "—" : fmt.format(x!), weight:4,
        score:(x)=> {
          const peMax = (adj.tweak?.peMax ?? 55);
          if(x==null) return null;
          if(x<=0) return 0;
          return scoreLowerBetter(x, 15, 25, peMax);
        },
        why:"Precio vs beneficios futuros esperados. Muy alto exige crecimiento alto."},
      {key:"peg",           name:"PEG",                  val:peg, fmt:(x)=> x==null? "—" : fmt.format(x!), weight:2,
        score:(x)=>scoreAround(x, 1.0, 0.6, 2.2),
        why:"PER ajustado por crecimiento. ~1 suele verse ‘razonable’ (ojo: aproximación)."},
      {key:"ps",            name:"Precio/Ventas (P/S)",  val:ps, fmt:(x)=> x==null? "—" : fmt.format(x!), weight:1,
        score:(x)=>scoreLowerBetter(x, 3.5, 7.5, 16),
        why:"Útil cuando beneficios fluctúan. Muy alto implica expectativas muy exigentes."},
      {key:"pb",            name:"Precio/Valor contable (P/B)", val:pb, fmt:(x)=> x==null? "—" : fmt.format(x!), weight:1,
        score:(x)=>scoreLowerBetter(x, 2.5, 6.0, 16),
        why:"Más informativo en bancos/industria que en software puro. Contexto importa."},
    ];

    if(adj.drop){
      for(const k of adj.drop){
        const m = metrics.find(x=>x.key===k);
        if(m) m.weight = 0;
      }
    }
    if(adj.boost){
        metrics.forEach(m => {
            if(adj.boost.hasOwnProperty(m.key)){
                m.weight *= (adj.boost as any)[m.key];
            }
            if(adj.boost.hasOwnProperty('growth') && (m.key === 'revGrowth' || m.key === 'earnGrowth')){
                m.weight *= (adj.boost as any)['growth'];
            }
            if(adj.boost.hasOwnProperty('margins') && (m.key === 'grossMargin' || m.key === 'operMargin' || m.key === 'netMargin')){
                m.weight *= (adj.boost as any)['margins'];
            }
        })
    }
  
    return { metrics, sector };
  }

  function computeScore(metrics: Metric[]): { score: number | null, dataQuality: number } {
    const active = metrics.filter(m=>m.weight>0);
    let wSum = 0, sSum = 0;
    let have = 0;
    for(const m of active){
      const sc = m.score(m.val);
      if(sc==null) continue;
      have++;
      wSum += m.weight;
      sSum += sc * m.weight;
    }
    const score = (wSum>0) ? (sSum / wSum) : null;
    const dq = active.length ? (have / active.length) : 0;
    return { score, dataQuality: dq };
  }

  function verdict(score: number | null) {
    if(score==null) return {title:"Sin score", sub:"Faltan datos para calcular."};
    if(score>=80) return {title:"Muy fuerte", sub:"Fundamentales sanos + alta calidad en varias dimensiones. Aun así: mira valoración y riesgos."};
    if(score>=65) return {title:"Fuerte", sub:"Buen perfil fundamental. Revisa riesgos (ciclo, competencia, regulación) y precio pagado."};
    if(score>=50) return {title:"Mixto", sub:"Hay puntos fuertes y débiles. Necesitas tesis clara y margen de seguridad."};
    return {title:"Débil", sub:"Fundamentales frágiles o incompletos. Precaución: puede ser especulativo o fase complicada."};
  }

  const handleAnalyze = async () => {
    const sym = tickerInput.toUpperCase();
    if(!sym){
      setStatus({ kind: "warn", html: "<b>Aviso:</b> escribe o selecciona un ticker." });
      return;
    }

    setIsAnalyzing(true);
    setStatus({ kind: '', html: `<b>Estado:</b> consultando API para <b>${sym}</b>…` });

    try {
      const { data } = await fetchYahoo(sym, ["price","summaryDetail","defaultKeyStatistics","financialData","assetProfile"]);
      
      const metrics = buildMetrics(data);
      const score = computeScore(metrics.metrics);
      const verdictData = verdict(score.score);
      
      setAnalysisResult({
          data,
          metrics,
          score,
          verdict: verdictData,
          ticker: sym
      });

      const kind = (score.score==null) ? "warn" : (score.score>=65 ? "ok" : (score.score>=50 ? "warn" : "bad"));
      setStatus({ kind, html: `<b>Estado:</b> análisis completado para <b>${sym}</b>.` });

    } catch (e) {
        setStatus({ kind: 'bad', html: `<b>Error:</b> no pude leer los datos para <b>${sym}</b>.<br><span class="small mono">${String(e)}</span>` });
        setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <h1>SP500 Fundamental Score</h1>
          <p>Selecciona una empresa del S&P 500, consulta fundamentales de Yahoo Finance y obtén un índice 0–100 (salud fundamental). Explicaciones a nivel de bachillerato incluidas.</p>
        </div>
      </div>
      
      <div className={styles.row} style={{marginBottom: 20}}>
        <div style={{flex:1, minWidth:260}}>
          <label htmlFor="tickerInput" className={styles.label}>Empresa (busca por ticker o nombre)</label><br/>
          <input 
            id="tickerInput" 
            list="tickerList"
            placeholder="Ej: NVDA, ASML, GOOGL, AAPL…" 
            style={{width:'100%'}}
            className={styles.input}
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <datalist id="tickerList">
            {sp500Tickers.map(t => (
                <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div style={{minWidth:120}}>
          <label className={styles.label}>&nbsp;</label><br/>
          <button onClick={handleAnalyze} disabled={isAnalyzing} className={styles.button} style={{width: '100%'}}>
            {isAnalyzing ? <span className={styles.spin}></span> : 'Analizar'}
          </button>
        </div>
      </div>
      
      <div className={`${styles.status} ${status.kind && styles[status.kind]}`} dangerouslySetInnerHTML={{ __html: status.html }} />

      {analysisResult && (
        <div style={{marginTop: 28, display: 'flex', flexDirection: 'column', gap: 24}}>
            
            {/* Score & Verdict Section */}
            <div className={styles.split}>
                <div className={styles.gaugeBox}>
                    <div className={styles.verdict}>
                        <Tooltip content={
                            <div>
                                <strong style={{color:'#fff', display:'block', marginBottom:4}}>Índice de Salud Fundamental (0-100)</strong>
                                Evalúa rentabilidad, eficiencia, deuda y valoración.<br/><br/>
                                <div style={{display:'grid', gridTemplateColumns:'auto 1fr', gap:'4px', alignItems:'center'}}>
                                  <span style={{color:'#EF4444'}}>●</span> <span>0-49: Débil / Riesgo alto</span>
                                  <span style={{color:'#F59E0B'}}>●</span> <span>50-64: Mixto / Precaución</span>
                                  <span style={{color:'#10B981'}}>●</span> <span>65-79: Fuerte</span>
                                  <span style={{color:'var(--accent)'}}>●</span> <span>80-100: Muy fuerte</span>
                                </div>
                            </div>
                        }>
                            <div className={styles.label}>Puntuación fundamental ⓘ</div>
                            <div className={styles.big} style={{color: analysisResult.score?.score >= 65 ? 'var(--accent)' : (analysisResult.score?.score >= 50 ? '#F59E0B' : '#EF4444')}}>
                               {fmt0.format(analysisResult.score?.score || 0)}/100
                            </div>
                        </Tooltip>
                        <div className={styles.barwrap}>
                            <div className={styles.bar}>
                                <i style={{width: `${analysisResult.score?.score || 0}%`, backgroundColor: analysisResult.score?.score >= 65 ? 'var(--accent)' : (analysisResult.score?.score >= 50 ? '#F59E0B' : '#EF4444')}}></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.gaugeBox}>
                     <div className={styles.verdict}>
                        <div className={styles.label}>Veredicto</div>
                        <h2 className={styles.big}>{analysisResult.verdict.title}</h2>
                        <p className={styles.sub}>{analysisResult.verdict.sub}</p>
                    </div>
                </div>
            </div>

            {/* Metrics Tables */}
            <div className={styles.split}>
                {/* Left Col: Profitability & Efficiency */}
                <div className={styles.card}>
                    <h2>Rentabilidad y Eficiencia</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Métrica</th>
                                <th style={{textAlign:'right'}}>Valor</th>
                                <th style={{textAlign:'center'}}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysisResult.metrics.metrics
                                .filter((m: Metric) => ['grossMargin', 'operMargin', 'netMargin', 'roe', 'roa', 'revGrowth', 'earnGrowth', 'fcfMargin'].includes(m.key))
                                .map((m: Metric) => (
                                <tr key={m.key}>
                                    <td>
                                        <div style={{fontWeight:600}}>{m.name}</div>
                                        <div style={{fontSize:10, color:'var(--secondary)', lineHeight:1.2}}>{m.why}</div>
                                    </td>
                                    <td style={{textAlign:'right', fontWeight:600, fontFamily:'monospace'}}>{m.fmt(m.val)}</td>
                                    <td style={{textAlign:'center'}}>
                                         <div className={styles.tag} style={{
                                             borderColor: m.score(m.val)! >= 65 ? 'rgba(34,197,94,.3)' : (m.score(m.val)! >= 50 ? 'rgba(251,191,36,.3)' : 'rgba(239,68,68,.3)'),
                                             background: m.score(m.val)! >= 65 ? 'rgba(34,197,94,.1)' : (m.score(m.val)! >= 50 ? 'rgba(251,191,36,.1)' : 'rgba(239,68,68,.1)'),
                                             color: m.score(m.val)! >= 65 ? '#15803d' : (m.score(m.val)! >= 50 ? '#b45309' : '#b91c1c')
                                         }}>
                                            {m.score(m.val) === null ? '—' : fmt0.format(m.score(m.val)!)}
                                         </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Right Col: Health & Valuation */}
                <div className={styles.card}>
                    <h2>Salud Financiera y Valoración</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Métrica</th>
                                <th style={{textAlign:'right'}}>Valor</th>
                                <th style={{textAlign:'center'}}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                             {analysisResult.metrics.metrics
                                .filter((m: Metric) => !['grossMargin', 'operMargin', 'netMargin', 'roe', 'roa', 'revGrowth', 'earnGrowth', 'fcfMargin'].includes(m.key))
                                .map((m: Metric) => (
                                <tr key={m.key}>
                                    <td>
                                        <div style={{fontWeight:600}}>{m.name}</div>
                                        <div style={{fontSize:10, color:'var(--secondary)', lineHeight:1.2}}>{m.why}</div>
                                    </td>
                                    <td style={{textAlign:'right', fontWeight:600, fontFamily:'monospace'}}>{m.fmt(m.val)}</td>
                                     <td style={{textAlign:'center'}}>
                                         <div className={styles.tag} style={{
                                             borderColor: m.score(m.val)! >= 65 ? 'rgba(34,197,94,.3)' : (m.score(m.val)! >= 50 ? 'rgba(251,191,36,.3)' : 'rgba(239,68,68,.3)'),
                                             background: m.score(m.val)! >= 65 ? 'rgba(34,197,94,.1)' : (m.score(m.val)! >= 50 ? 'rgba(251,191,36,.1)' : 'rgba(239,68,68,.1)'),
                                             color: m.score(m.val)! >= 65 ? '#15803d' : (m.score(m.val)! >= 50 ? '#b45309' : '#b91c1c')
                                         }}>
                                            {m.score(m.val) === null ? '—' : fmt0.format(m.score(m.val)!)}
                                         </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className={styles.footer}>
                <p><strong>Nota:</strong> Estos datos provienen de Yahoo Finance y pueden diferir de reportes oficiales. El "Score" es un modelo simplificado con fines educativos, no una recomendación de inversión. Haz tu propia diligencia (DYOR).</p>
            </div>
        </div>
      )}
    </div>
  );
}
