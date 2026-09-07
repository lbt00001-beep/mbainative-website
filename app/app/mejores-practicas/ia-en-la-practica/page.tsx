import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata('/mejores-practicas/ia-en-la-practica');
const source = 'https://www.youtube.com/watch?v=zEwCxAI81Xs';
const ideas = [
  { n:'01', time:'23:04', seconds:1384, title:'Aprende capacidades, no una lista de herramientas.', summary:'La charla propone comprender la generalidad de los modelos: una misma tecnología puede resolver cada vez más tareas y simplificar flujos de trabajo.', action:'Elige una tarea frecuente y compara dos formas de resolverla. Conserva el procedimiento más sencillo que alcance tu nivel de calidad.' },
  { n:'02', time:'30:05', seconds:1805, title:'Replantea cómo llegas al resultado.', summary:'La multimodalidad permite combinar texto, imagen, vídeo y código, y encontrar soluciones fuera de la herramienta habitual.', action:'Describe primero el resultado que necesitas. Para una presentación, por ejemplo, separa el contenido verificable, el diseño y el formato que debes entregar.' },
  { n:'03', time:'35:57', seconds:2157, title:'Convierte conocimiento en contexto útil.', summary:'Un agente necesita conocer la organización. Documentos, reuniones y procedimientos pueden alimentar una base de conocimiento estructurada.', action:'Empieza con un proceso: objetivo, fuentes, pasos, excepciones y responsable. Guarda la fecha y la procedencia de cada información, limita el acceso y revisa las contradicciones.' },
  { n:'04', time:'49:31', seconds:2971, title:'Define cómo sabrás si lo ha hecho bien.', summary:'Los agentes necesitan señales de evaluación. La charla advierte que optimizar una métrica equivocada puede producir un resultado no deseado.', action:'Combina una prueba de calidad con una revisión humana. Cuenta también errores, correcciones y casos que deben escalarse; no midas solo la velocidad.' },
  { n:'05', time:'55:41', seconds:3341, title:'Gestiona el coste de cada resultado.', summary:'El razonamiento y la ejecución continua o en paralelo consumen recursos. El ponente aconseja ajustar la capacidad del modelo a la dificultad de la tarea.', action:'Define un presupuesto de prueba y un límite de intentos. Compara el coste total por resultado aceptado, incluyendo herramientas, infraestructura y tiempo de revisión.' },
];
export default function PracticalAIPage() {
  return <article className="site-shell page-content guide-article">
    <Link href="/mejores-practicas" className="text-link">← Aprender con MBAI Native</Link>
    <p className="eyebrow mt-10">Guía aplicada · Gestión de agentes</p>
    <h1>De usar IA a<br /><span className="hero-accent">trabajar con agentes.</span></h1>
    <p className="page-intro">Una empresa necesita algo más que acceso a un modelo: contexto, procedimientos, herramientas y una forma de comprobar los resultados.</p>
    <aside className="source-card">
      <p className="eyebrow">La charla que inspira esta guía</p>
      <h2>La IA ya no sorprende: así hay que usarla ahora</h2>
      <p>Carlos Santana (DotCSV) · Publicada por Holded · Evento Inteligencia Emprendedora · 1 h 03 min</p>
      <a href={source} target="_blank" rel="noopener noreferrer" className="button button-outline">Ver la charla en YouTube ↗</a>
      <p className="source-note">Síntesis editorial de MBAI Native a partir de la transcripción automática. Las propuestas de aplicación son nuestras; no implican colaboración ni respaldo del ponente o de Holded. Los ejemplos de productos corresponden al momento de la charla.</p>
    </aside>
    <section className="section-block"><h2>Cinco ideas para llevar al trabajo</h2>
      <div className="lesson-list">{ideas.map(idea => <section className="lesson" key={idea.n}>
        <span className="lesson-number">{idea.n}</span><div><h3>{idea.title}</h3><p>{idea.summary}</p>
          <p className="lesson-action"><strong>Aplicación MBAI.</strong> {idea.action}</p>
          <a className="text-link" href={source+'&t='+idea.seconds+'s'} target="_blank" rel="noopener noreferrer">Escuchar desde {idea.time} ↗</a>
        </div>
      </section>)}</div>
    </section>
    <section className="guide-banner"><div><p className="eyebrow">De la grabación al procedimiento</p><h2>Documenta una tarea mientras la haces.</h2>
      <p>La charla muestra cómo una grabación de pantalla puede convertirse en instrucciones de trabajo. Nuestra propuesta: utiliza un ejemplo sin datos sensibles, comprueba cada paso y guarda una versión aprobada con su responsable.</p>
      <a className="text-link" href={source+'&t=2640s'} target="_blank" rel="noopener noreferrer">Ver el ejemplo desde 44:00 ↗</a></div></section>
    <section className="section-block"><p className="eyebrow">Tu primera prueba</p><h2>Una tarea. Un responsable. Un criterio de éxito.</h2>
      <p className="page-intro">Esta ficha es una propuesta de MBAI para diseñar un piloto. Ajusta los umbrales a tu actividad antes de conceder autonomía.</p>
      <dl className="pilot-sheet">
        <div><dt>Tarea</dt><dd>Preparar un borrador de informe semanal a partir de fuentes aprobadas.</dd></div>
        <div><dt>Contexto</dt><dd>Plantilla, ejemplos revisados, fuentes y reglas sobre información confidencial.</dd></div>
        <div><dt>Permisos</dt><dd>Leer las fuentes y redactar un borrador. La publicación la autoriza una persona.</dd></div>
        <div><dt>Evaluación</dt><dd>Comprobar referencias, cifras, omisiones y utilidad antes de aceptar el informe.</dd></div>
        <div><dt>Coste</dt><dd>Registrar consumo, intentos y tiempo de revisión por informe aceptado.</dd></div>
        <div><dt>Aprendizaje</dt><dd>Documentar las correcciones y actualizar el procedimiento con control de versiones.</dd></div>
      </dl>
      <p className="mt-6 text-slate-300">Si el resultado no se puede verificar, la tarea debe mantenerse bajo supervisión. Aumenta la autonomía solo cuando las pruebas lo justifiquen.</p>
    </section>
    <div className="button-row"><Link className="button" href="/contact?interes=consultoria">Diseñar una prueba para mi empresa ↗</Link><Link className="button button-outline" href="/aplicaciones">Explorar herramientas</Link></div>
  </article>;
}
