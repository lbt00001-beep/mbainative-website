'use client';
import { useEffect, useState } from 'react';
import { recentNews } from '@/lib/news.mjs';
import styles from './AINewsWidget.module.css';
interface NewsItem { title:string; link:string; summary:string; pubDate:string; source:string; sourceLogo:string; relevance:number; }
interface NewsData {lastUpdated:string; totalArticles:number; featured:NewsItem[]; all:NewsItem[];}
export default function AINewsWidget({limit=3,showViewAll=true}:{limit?:number;showViewAll?:boolean}) {
  const [news,setNews]=useState<NewsData|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/data/ai-news.json',{signal:controller.signal}).then(res => {if(!res.ok) throw Error(); return res.json();})
      .then(data => {if(!Array.isArray(data.all)) throw Error(); setNews(data);})
      .catch(() => {}).finally(() => {if(!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  },[]);
  if(loading) return <p role="status" className="text-slate-300">Cargando actualidad de IA…</p>;
  if(!news) return <p role="status" className="text-slate-300">La actualidad no está disponible en este momento. <a className="text-link" href="/mejores-practicas/ia-en-la-practica">Explora nuestra guía práctica →</a></p>;
  const items=recentNews(news.all).slice(0,limit);
  const updated=new Date(news.lastUpdated);
  const stale=Date.now()-updated.getTime()>48*60*60*1000;
  return <div className={styles.widget}>
    <div className="section-heading"><div><p className="eyebrow">Lecturas para seguir aprendiendo</p><h2>Actualidad de IA</h2></div><p className="text-sm text-slate-400">Última recopilación: {updated.toLocaleDateString('es-ES',{timeZone:'Europe/Madrid'})}</p></div>
    <p className="text-sm text-slate-300 mb-5">Titulares y extractos en el idioma original de cada fuente.{stale ? ' La recopilación lleva más de 48 horas sin actualizarse.' : ''}</p>
    {items.length ? <div className={styles.grid}>{items.map(item => <a key={item.link} href={item.link} target="_blank" rel="noopener noreferrer" className={styles.card}>
      <div className={styles.cardHeader}><span className={styles.source}>{item.sourceLogo} {item.source}</span><time dateTime={new Date(item.pubDate).toISOString()} className={styles.date}>{new Date(item.pubDate).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'})}</time></div>
      <h3 className={styles.cardTitle}>{item.title}</h3><p className={styles.cardSummary}>{item.summary.slice(0,160)}…</p>
    </a>)}</div> : <p className="text-slate-300">No hay noticias de los últimos 21 días en esta recopilación. Puedes consultar el archivo.</p>}
    {showViewAll && <div className={styles.footer}><a className="text-link" href="/mejores-practicas/noticias">Consultar todas las fuentes y el archivo →</a></div>}
  </div>;
}
