import Link from 'next/link';
export default function Hero() {
  return <section className="home-hero site-shell">
    <div>
      <p className="eyebrow"><span className="status-dot" /> Dirección de empresas · Inteligencia artificial</p>
      <h1>Lidera una empresa<br /><span className="hero-accent">nativa en IA.</span></h1>
      <p className="hero-intro">Aprende a organizar el trabajo entre personas y agentes. Convierte el conocimiento de tu empresa en procesos que puedas probar, supervisar y mejorar.</p>
      <div className="button-row">
        <Link href="/empresa-nativa-ia" className="button">Descubrir cómo funciona <span aria-hidden="true">↗</span></Link>
        <Link href="/arquitectura-solucion" className="button button-outline">Explorar la arquitectura</Link>
      </div>
      <p className="hero-note">Para profesionales, equipos y directivos que quieren pasar de la conversación a la práctica.</p>
    </div>
    <aside className="operating-card" aria-label="Cómo trabajamos con agentes">
      <div className="card-kicker"><span>EL MODELO MBAI</span><span className="text-blue-300">01 / OPERAR</span></div>
      <h2>La autonomía se diseña.</h2>
      <p>El agente ejecuta. Las personas definen el objetivo, los límites y qué significa hacerlo bien.</p>
      <ol className="operating-steps">
        <li><span>01</span><div><strong>Contexto</strong><small>Conocimiento, fuentes y procedimientos</small></div></li>
        <li><span>02</span><div><strong>Acción</strong><small>Herramientas, tareas y permisos</small></div></li>
        <li><span>03</span><div><strong>Evaluación</strong><small>Calidad, coste y revisión humana</small></div></li>
      </ol>
      <Link href="/empresa-nativa-ia/procesos" className="text-link">Ver un proceso en acción <span aria-hidden="true">→</span></Link>
    </aside>
  </section>;
}
