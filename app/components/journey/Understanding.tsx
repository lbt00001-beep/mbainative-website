'use client';
import { useState } from 'react';
import Link from 'next/link';
import { OperatingDiagram } from './Diagrams';

export default function Understanding() {
  const [native,setNative]=useState(true);
  return <>
    <section className="journey-split opening-lab" aria-labelledby="change-title">
      <div><p className="lab-label">01 / Una forma distinta de trabajar</p><h2 id="change-title">El trabajo se diseña<br/>alrededor del resultado.</h2>
        <p>En una empresa nativa en IA, cada proceso combina personas, software y agentes desde su diseño. La dirección decide qué resultado busca; un responsable define cómo conseguirlo y quién lo supervisa.</p>
        <p>El agente puede interpretar información y utilizar herramientas. Su actuación forma parte de un proceso con permisos, comprobaciones y una persona que responde por él.</p>
        <div className="journey-toggle" role="group" aria-label="Comparar formas de trabajo"><button aria-pressed={!native} onClick={()=>setNative(false)}>Trabajo fragmentado</button><button aria-pressed={native} onClick={()=>setNative(true)}>Proceso con IA</button></div>
        <div className="journey-observation" aria-live="polite"><strong>{native?'Lo que cambia: coordinación incorporada.':'El cuello de botella: coordinación manual.'}</strong><p>{native?'El contexto, las reglas y la revisión forman parte del mismo circuito. La persona puede dedicar más atención a las excepciones y a mejorar el proceso.':'La misma persona busca datos, cambia de aplicación y persigue aprobaciones. Añadir un chat puede ayudar, pero la coordinación sigue dependiendo de ella.'}</p></div>
      </div><div className="diagram-surface"><OperatingDiagram native={native}/></div>
    </section>
    <section className="journey-section"><p className="lab-label">Qué significa cada pieza</p><h2>Cuatro conceptos. Funciones diferentes.</h2>
      <div className="concept-grid">{[
        ['Modelo','Interpreta y genera información.','Es una capacidad que el proceso utiliza; no es por sí solo un empleado ni una aplicación completa.'],
        ['Agente','Decide pasos y utiliza herramientas.','Necesita un objetivo, contexto, permisos y límites. Puede equivocarse y debe poder detenerse.'],
        ['Proceso','Coordina el trabajo hasta un resultado.','Define entradas, reglas, responsables, aprobaciones y qué ocurre si algo falla. Algunos pasos pueden ser software determinista.'],
        ['Persona','Asume responsabilidad y criterio.','Diseña el proceso, revisa excepciones y autoriza cambios. El supervisor del día a día puede ser distinto del dueño del proceso.'],
      ].map(([title,lead,text],i)=><article key={title}><span className="concept-index">0{i+1}</span><h3>{title}</h3><strong>{lead}</strong><p>{text}</p></article>)}</div>
    </section>
    <section className="journey-section journey-statement"><p className="lab-label">La transformación empieza en el departamento</p><h2>Tu primera unidad de cambio<br/>puede ser un solo proceso.</h2><p>Un responsable elige una tarea repetida, describe sus pasos y fija una prueba. TI habilita las conexiones. El supervisor comprueba resultados. La dirección decide si merece la pena ampliar el alcance.</p><Link className="text-link" href="/empresa-nativa-ia/procesos">Ver cómo se prepara una compra →</Link></section>
    <section className="journey-section"><h2>Cómo reconocer un avance real</h2><div className="journey-three"><article><h3>Un resultado verificable</h3><p>Una oferta revisada, un expediente conciliado o una incidencia preparada. Define qué debe contener para aceptarlo.</p></article><article><h3>Un coste completo</h3><p>Cuenta modelos, infraestructura, integración y revisión humana. Compara por resultado aceptado, no solo por llamada al modelo.</p></article><article><h3>Un límite explícito</h3><p>El equipo conoce cuándo el agente debe preguntar, detenerse o devolver el trabajo a una persona.</p></article></div></section>
  </>;
}
