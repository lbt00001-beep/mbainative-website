import Link from 'next/link';
import { journey, references } from '@/data/ai-journey';
import type { ReactNode } from 'react';

export function JourneyShell({ step, title, intro, children }: { step: number; title: string; intro: string; children: ReactNode }) {
  return <div className="journey-page">
    <div className="site-shell">
      <nav className="journey-nav" aria-label="Recorrido de empresa nativa en IA">
        {journey.map((item,i) => <Link key={item.href} href={item.href} aria-current={step===i?'step':undefined}><span>{String(i+1).padStart(2,'0')}</span>{item.short}</Link>)}
      </nav>
      <header className="journey-heading"><p className="eyebrow">Empresa nativa en IA · {String(step+1).padStart(2,'0')} / 04</p><h1>{title}</h1><p>{intro}</p></header>
      {children}
      <nav className="journey-next" aria-label="Continuar el recorrido">
        {step>0 ? <Link className="text-link" href={journey[step-1].href}>← {journey[step-1].label}</Link> : <span>Una decisión concreta en cada etapa.</span>}
        {step<3 ? <Link className="button" href={journey[step+1].href}>{journey[step+1].label} →</Link> : <Link className="button" href="/contact?interes=consultoria">Contrastar mi piloto con MBAI →</Link>}
      </nav>
    </div>
  </div>;
}
export function Sources({ items }: { items: (keyof typeof references)[] }) {
  return <aside className="journey-sources"><h2>Para profundizar en las fuentes</h2><p>Propuesta práctica de MBAI Native. Referencias técnicas consultadas el 8 de septiembre de 2026; los ejemplos no describen una implantación real ni implican respaldo de los proveedores.</p><ul>{items.map(key=><li key={key}><a href={references[key].url} target="_blank" rel="noopener noreferrer">{references[key].title} ↗</a></li>)}</ul></aside>;
}
