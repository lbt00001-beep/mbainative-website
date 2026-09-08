import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import JourneyInvitation from '@/components/home/JourneyInvitation';
export const metadata=pageMetadata('/mejores-practicas');
const resources=[
  ['/mejores-practicas/ia-en-la-practica','La IA llevada al trabajo','Guía a partir de la charla de Carlos Santana: contexto, evaluación y coste por resultado.'],
  ['/mejores-practicas/doctrinas','20 principios para debatir','La propuesta de MBAI sobre organización y gestión. Un punto de partida para contrastar con tu realidad.'],
  ['/mejores-practicas/gurus','Voces del sector','Ideas y recursos de investigadores, divulgadores y líderes de tecnología.'],
  ['/mejores-practicas/consultoras','Investigación de consultoras','Recursos sobre transformación, trabajo y adopción de inteligencia artificial.'],
  ['/mejores-practicas/youtubers','Divulgación en vídeo','Canales y contenidos para seguir aprendiendo sobre IA.'],
  ['/mejores-practicas/noticias','Actualidad y fuentes','Publicaciones recientes con acceso a sus fuentes originales.'],
];
const sectors=[['tecnologia','Tecnología'],['finanzas','Finanzas'],['salud','Salud'],['retail','Comercio'],['manufactura','Industria']];
export default function Page(){return <div className="learning-hub"><header className="site-shell page-content"><p className="eyebrow">Aprender con MBAI Native</p><h1>Comprende el cambio.<br/><span className="hero-accent">Después, llévalo a tu empresa.</span></h1><p className="page-intro">Empieza por el recorrido visual o profundiza en las guías y fuentes. Separa las propuestas de organización de las capacidades que ya puedes probar.</p></header><JourneyInvitation/><section className="site-shell section-block"><div className="section-heading"><h2>Lecturas para profundizar</h2></div><div className="feature-grid">{resources.map(([href,title,text])=><article className="feature-card" key={href}><h3>{title}</h3><p>{text}</p><Link href={href} className="text-link">Explorar →</Link></article>)}</div></section><section className="site-shell section-block"><div className="section-heading"><h2>Explora tu sector</h2></div><div className="sector-links">{sectors.map(([id,label])=><Link key={id} href={'/mejores-practicas/'+id}>{label} ↗</Link>)}</div></section></div>;}
