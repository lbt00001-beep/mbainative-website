import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('/about');
export default function About() {
  return <div className="site-shell page-content">
    <p className="eyebrow">El proyecto</p><h1>Entender la IA.<br /><span className="hero-accent">Aprender a dirigir con ella.</span></h1>
    <p className="page-intro">MBAI Native reúne principios de gestión, recursos de aprendizaje y aplicaciones de inteligencia artificial. Nuestro foco es el trabajo que comparten personas y agentes.</p>
    <div className="feature-grid">
      <article className="feature-card"><span className="eyebrow">01 / CRITERIO</span><h2>Una visión de empresa</h2><p>Organizar por tareas, decidir qué autonomía tiene cada agente y conservar la responsabilidad sobre las decisiones.</p><Link href="/mejores-practicas/doctrinas" className="text-link">Conocer los 20 principios →</Link></article>
      <article className="feature-card"><span className="eyebrow">02 / PRÁCTICA</span><h2>Herramientas para probar</h2><p>Un catálogo de aplicaciones para explorar problemas de análisis, comunicación y productividad mediante casos concretos.</p><Link href="/aplicaciones" className="text-link">Explorar el trabajo publicado →</Link></article>
      <article className="feature-card"><span className="eyebrow">03 / APRENDIZAJE</span><h2>Resultados que se revisan</h2><p>Documentar fuentes, comprobar resultados y ajustar los procesos. Una respuesta convincente debe poder contrastarse.</p><Link href="/mejores-practicas/ia-en-la-practica" className="text-link">Leer nuestra guía aplicada →</Link></article>
    </div>
    <section className="guide-banner mt-12"><div><p className="eyebrow">MBAI Native · Madrid</p><h2>Conoce el proyecto a través de lo que hace.</h2><p>Las aplicaciones y los materiales publicados son nuestra primera presentación. Para conocer quién participaría en tu proyecto, el enfoque y la experiencia relevante, escríbenos.</p></div><Link href="/contact" className="button">Contactar con MBAI Native ↗</Link></section>
  </div>;
}
