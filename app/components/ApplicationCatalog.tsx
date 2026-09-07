"use client";
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { categorias } from '@/data/applications';
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function ApplicationCatalog() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const filtered = useMemo(() => categorias.filter(c => category === 'all' || c.id === category).map(c => ({ ...c,
    apps: c.apps.filter(app => normalize(app.nombre + ' ' + app.descripcion + ' ' + c.nombre).includes(normalize(query.trim())))
  })).filter(c => c.apps.length > 0), [category, query]);
  const count = filtered.reduce((sum, c) => sum + c.apps.length, 0);
  return <div className="site-shell page-content">
    <p className="eyebrow">Laboratorio de aplicaciones</p><h1>Encuentra una herramienta<br /><span className="hero-accent">para tu próxima tarea.</span></h1>
    <p className="page-intro">Explora aplicaciones de análisis, comunicación, formación y productividad. Algunas se abren en servicios externos con sus propias condiciones de acceso.</p>
    <div className="catalog-controls">
      <div><label className="block mb-2 text-slate-200" htmlFor="buscar-aplicacion">Buscar por nombre o tarea</label><input id="buscar-aplicacion" type="search" className="catalog-search" placeholder="Por ejemplo: marketing, documentos, finanzas…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <div role="group" aria-label="Filtrar por categoría" className="category-links"><button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Todas</button>{categorias.map(c => <button key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.nombre}</button>)}</div>
      <p className="catalog-count" role="status">{count} {count === 1 ? 'aplicación encontrada' : 'aplicaciones encontradas'}</p>
    </div>
    {filtered.map(c => <section className="catalog-group" key={c.id} id={c.id} aria-labelledby={'title-'+c.id}>
      <h2 id={'title-'+c.id}><span aria-hidden="true">{c.icono}</span> {c.nombre}</h2><p>{c.descripcion}</p>
      <div className="feature-grid">{c.apps.map(app => {
        const external = app.url.startsWith('https:');
        return <article className="feature-card" key={app.nombre}>
          <p className="eyebrow">{app.estado === 'proximamente' ? 'En preparación' : external ? 'Aplicación externa' : 'En MBAI Native'}</p>
          <h3>{app.nombre}</h3><p>{app.descripcion}</p>
          {app.estado === 'proximamente' ? <p className="result-label mt-6">Disponible próximamente</p> : <a className="text-link" href={app.url} {...(external ? {target:'_blank',rel:'noopener noreferrer'} : {})}>Abrir {app.nombre} <span aria-hidden="true">↗</span></a>}
        </article>;
      })}</div>
    </section>)}
    {count === 0 && <div className="feature-card"><h2>No hay aplicaciones con estos filtros.</h2><p>Prueba otra palabra o vuelve a mostrar el catálogo completo.</p><button className="button mt-4" onClick={() => {setQuery(''); setCategory('all');}}>Restablecer filtros</button></div>}
    <div className="guide-banner"><div><h2>¿Tu proceso necesita algo distinto?</h2><p>Cuéntanos qué resultado buscas y con qué información trabajas.</p></div><Link href="/contact?interes=desarrollo" className="button">Hablar de mi proyecto ↗</Link></div>
  </div>;
}
