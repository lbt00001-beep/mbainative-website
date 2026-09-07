import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('/services');
const services = [
  { title:'Formación ejecutiva en IA', audience:'Para directivos y responsables de equipos.', text:'Comprende qué puedes delegar, cómo dar contexto a un agente y cómo evaluar sus resultados.', items:['Mapa de tareas de tu equipo','Ejercicios con herramientas y simulación','Criterios de supervisión y autonomía'], interest:'formacion' },
  { title:'Estrategia y consultoría', audience:'Para empresas que necesitan priorizar.', text:'Identifica un proceso con potencial y define una prueba con un objetivo verificable.', items:['Diagnóstico del proceso y sus datos','Propuesta de piloto y criterios de éxito','Estimación de recursos y seguimiento'], interest:'consultoria' },
  { title:'Talleres para equipos', audience:'Para quienes quieren aprender haciendo.', text:'Trabaja sobre un caso de uso de tu actividad y documenta una forma de repetirlo.', items:['Sesión aplicada a una tarea concreta','Procedimiento de trabajo documentado','Revisión de resultados y siguientes pasos'], interest:'taller' },
  { title:'Desarrollo de soluciones', audience:'Para equipos con un problema definido.', text:'Diseña una herramienta adaptada a tu flujo de trabajo, con límites claros y revisión del resultado.', items:['Definición funcional y prototipo','Integración de las fuentes acordadas','Validación y documentación de uso'], interest:'desarrollo' },
  { title:'Auditoría y optimización', audience:'Para empresas que ya utilizan IA.', text:'Revisa la utilidad, el coste y los puntos de supervisión de tus sistemas actuales.', items:['Revisión de calidad y errores frecuentes','Análisis de consumo y permisos','Propuestas de mejora priorizadas'], interest:'auditoria' },
  { title:'Investigación aplicada', audience:'Para responsables de innovación.', text:'Convierte novedades e investigaciones en decisiones sobre qué merece una prueba.', items:['Selección de fuentes relevantes','Comparativa orientada a tu caso de uso','Hipótesis de aplicación y validación'], interest:'investigacion' },
];
export default function Services() {
  return <div className="site-shell page-content">
    <p className="eyebrow">Servicios MBAI Native</p><h1>Una aplicación concreta.<br /><span className="hero-accent">Un resultado que puedas evaluar.</span></h1>
    <p className="page-intro">Formación, estrategia y desarrollo para introducir IA en tu empresa. Partimos de tus tareas y del conocimiento de tu equipo.</p>
    <div className="feature-grid services-grid">{services.map(s => <article className="feature-card" key={s.interest}>
      <p className="eyebrow">{s.audience}</p><h2>{s.title}</h2><p>{s.text}</p>
      <ul className="deliverables">{s.items.map(i => <li key={i}>{i}</li>)}</ul>
      <p className="result-label">Alcance, duración y presupuesto acordados tras conocer tu caso.</p>
      <Link className="text-link" href={'/contact?interes='+s.interest}>Consultar este servicio →</Link>
    </article>)}</div>
    <div className="guide-banner mt-12"><div><h2>Empieza por contarnos el problema.</h2><p>Qué tarea te ocupa tiempo, con qué información trabajas y qué resultado esperas conseguir.</p></div><Link className="button" href="/contact">Hablar de mi proyecto ↗</Link></div>
  </div>;
}
