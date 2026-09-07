import Link from 'next/link';
const featured = [
  { n:'01', category:'ESTRATEGIA', title:'PlanPro Marketing', text:'Convierte un diagnóstico en un plan de marketing con objetivos, presupuesto y acciones.', href:'/plan-de-marketing/index.html', output:'Resultado: un plan exportable a DOCX o PDF.', tags:['Diagnóstico', 'Plan de acción', 'Presupuesto'] },
  { n:'02', category:'ANÁLISIS', title:'TradingAlpha', text:'Explora datos de mercado y escenarios de valoración antes de formular una hipótesis.', href:'/aplicaciones/tradingalpha', output:'Resultado: un análisis con métricas y escenarios.', tags:['Fundamentales', 'Valoración', 'Escenarios'] },
  { n:'03', category:'CONOCIMIENTO', title:'Analizador de contenidos', text:'Transforma documentos y vídeos en ideas organizadas y propuestas de aplicación.', href:'https://analizador-de-temas-416251601036.europe-west1.run.app', output:'Resultado: un informe estructurado para revisar.', tags:['Fuentes', 'Ideas clave', 'Aplicaciones'] },
];
export default function FeaturedApplications() {
  return <section className="section-block site-shell" aria-labelledby="herramientas-title">
    <div className="section-heading"><div><p className="eyebrow">Del concepto al trabajo</p><h2 id="herramientas-title">Empieza por una tarea real.</h2></div><Link className="text-link" href="/aplicaciones">Ver todas las aplicaciones →</Link></div>
    <div className="feature-grid">{featured.map(app => <article className="feature-card" key={app.n}>
      <div className="card-kicker"><span>{app.category}</span><span>{app.n}</span></div>
      <h3>{app.title}</h3><p>{app.text}</p>
      <div className="task-flow" aria-label="Etapas de trabajo">{app.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
      <p className="result-label">{app.output}</p>
      <a className="text-link" href={app.href} {...(app.href.startsWith('https:') ? {target:'_blank',rel:'noopener noreferrer'} : {})}>Probar {app.title} <span aria-hidden="true">↗</span></a>
    </article>)}</div>
  </section>;
}
