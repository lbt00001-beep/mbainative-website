import Link from 'next/link';
export default function PracticalGuide() {
  return <section className="site-shell section-block">
    <div className="guide-banner">
      <div><p className="eyebrow">Lectura recomendada · Carlos Santana, DotCSV</p><h2>De usar IA a trabajar con agentes.</h2>
        <p>Contexto, procesos documentados, evaluación y economía de los tokens. Una guía de MBAI para llevar las ideas de la charla publicada por Holded a una primera prueba en tu empresa.</p></div>
      <Link href="/mejores-practicas/ia-en-la-practica" className="button">Leer la guía práctica <span aria-hidden="true">→</span></Link>
    </div>
  </section>;
}
