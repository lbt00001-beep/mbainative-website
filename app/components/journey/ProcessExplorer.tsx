'use client';
import { useState } from 'react';
import Link from 'next/link';
import { autonomy, processes } from '@/data/ai-journey';
import { ProcessDiagram } from './Diagrams';

export default function ProcessExplorer() {
  const [selected,setSelected]=useState(0);const [step,setStep]=useState(0);const [level,setLevel]=useState(1);
  const process=processes[selected];
  return <>
    <section aria-labelledby="process-title">
      <p className="lab-label">Elige un departamento · ejemplos ilustrativos</p>
      <div className="journey-toggle" role="group" aria-label="Departamento">{processes.map((p,i)=><button key={p.id} aria-pressed={selected===i} onClick={()=>{setSelected(i);setStep(0);}}>{p.department}</button>)}</div>
      <div className="process-workbench">
        <div className="process-flow"><p className="lab-label">Un expediente, de principio a fin</p><ProcessDiagram active={step} labels={process.steps.map(s=>s[0])}/><p className="process-caption">Recorrido de ejemplo. No ejecuta operaciones ni utiliza datos de tu empresa.</p></div>
        <div className="process-detail"><h2 id="process-title">{process.title}</h2><p>{process.trigger}</p>
          <div className="step-buttons" role="group" aria-label="Explorar los pasos del proceso">{process.steps.map(([label],i)=><button key={label} aria-pressed={step===i} onClick={()=>setStep(i)}><span>{i+1}</span>{label}</button>)}</div>
          <div className="selected-step" aria-live="polite"><p className="lab-label">Paso {step+1} de 5</p><h3>{process.steps[step][0]}</h3><p>{process.steps[step][1]}</p></div>
          <dl className="process-accountability"><div><dt>Responde por el proceso</dt><dd>{process.owner}</dd></div><div><dt>Supervisa cada expediente</dt><dd>{process.supervisor}</dd></div></dl>
        </div>
      </div>
      <div className="process-contract"><h3>La ficha que define el responsable del departamento</h3><dl>
        <div><dt>Fuentes autorizadas</dt><dd>{process.inputs}</dd></div><div><dt>Agentes asignados</dt><dd>{process.agents.join(' · ')}</dd></div><div><dt>Herramientas y permisos</dt><dd>{process.tools}</dd></div><div><dt>Resultado esperado</dt><dd>{process.output}</dd></div><div><dt>Aprobación</dt><dd>{process.approval}</dd></div><div><dt>Excepción y parada</dt><dd>{process.exception}</dd></div><div><dt>Cómo se mide</dt><dd>{process.metric}</dd></div><div><dt>Punto de comparación</dt><dd>{process.baseline}</dd></div>
      </dl><Link className="text-link" href={'/empresa-nativa-ia/empezar?proceso='+process.id}>Usar este ejemplo para preparar mi piloto →</Link></div>
    </section>
    <section className="journey-section"><p className="lab-label">La autonomía se concede por proceso</p><h2>El mismo agente.<br/>Tres niveles de autorización.</h2><p>La autonomía depende del riesgo, de las pruebas y de las acciones permitidas. Selecciona un nivel para entender qué cambia; elegirlo aquí no modifica el ejemplo ni concede permisos reales.</p>
      <div className="journey-toggle" role="group" aria-label="Nivel de autonomía">{autonomy.map((a,i)=><button key={a.title} aria-pressed={level===i} onClick={()=>setLevel(i)}>{i+1}. {a.title}</button>)}</div>
      <div className="autonomy-result" aria-live="polite"><h3>{autonomy[level].title}</h3><p>{autonomy[level].description}</p><div className="autonomy-line">{autonomy[level].execution}</div><p className="mt-5">En este proceso: {process.approval} {level===2?'Las operaciones reservadas a una persona conservan esa aprobación aunque otras tareas tengan más autonomía.':''}</p></div>
    </section>
    <section className="journey-section"><h2>¿Quién prepara qué?</h2><div className="journey-three"><article><h3>El departamento diseña</h3><p>Inventaría sus procesos, nombra a sus responsables, documenta entradas y excepciones y propone qué tareas delegar.</p></article><article><h3>TI hace posible la ejecución</h3><p>Conecta sistemas, configura identidades y permisos, mantiene la infraestructura y prepara recuperación y monitorización.</p></article><article><h3>Dirección acuerda los límites</h3><p>Asigna presupuesto, valida responsabilidades y decide el avance con resultados de pruebas. Seguridad y otras funciones especializadas participan según el proceso.</p></article></div></section>
  </>;
}
