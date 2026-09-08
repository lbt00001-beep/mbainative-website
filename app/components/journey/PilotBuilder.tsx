'use client';
import { useRef, useState } from 'react';
import { initialPilot, pilotMarkdown, processes, type Pilot } from '@/data/ai-journey';

const fields: {key:keyof Pilot;label:string;hint:string;required?:boolean;short?:boolean}[]=[
  {key:'department',label:'Departamento',hint:'La unidad que conoce y mantiene este proceso.',required:true,short:true},
  {key:'process',label:'Proceso y resultado esperado',hint:'Una tarea acotada que termine en un resultado comprobable.',required:true},
  {key:'owner',label:'Persona responsable del proceso',hint:'Nombre o puesto de quien define el proceso, decide sus cambios y responde por el resultado.',required:true,short:true},
  {key:'supervisor',label:'Persona supervisora',hint:'Nombre o puesto de quien revisa los expedientes y atiende excepciones. Puede coincidir con el responsable.',required:true,short:true},
  {key:'trigger',label:'Qué inicia el trabajo',hint:'Un evento concreto: recibir una solicitud, una factura o un parte.'},
  {key:'inputs',label:'Datos y fuentes autorizadas',hint:'Qué información necesita, dónde está y quién puede acceder a ella.'},
  {key:'agents',label:'Agente o agentes asignados',hint:'Describe su función. Empieza con el menor número que resuelva la tarea.'},
  {key:'tools',label:'Herramientas y permisos',hint:'Separa consultar, redactar, modificar y enviar. Precisa qué acciones están prohibidas.'},
  {key:'approval',label:'Qué debe aprobar una persona',hint:'Indica quién aprueba y en qué momento. Para el piloto, empieza con propuestas sin ejecución externa.'},
  {key:'metric',label:'Cómo compararás el resultado',hint:'Mide calidad, tiempo, coste completo y revisión. Añade muestra de prueba y umbral de aceptación.'},
  {key:'stop',label:'Cuándo detener y escalar',hint:'Datos ausentes, errores, presupuesto agotado o casos fuera del alcance. Indica a quién avisar.'},
];
export default function PilotBuilder({ exampleId }: {exampleId:string}) {
  const example=processes.find(p=>p.id===exampleId)||processes[0];
  const [pilot,setPilot]=useState<Pilot>(()=>initialPilot(example));
  const [template,setTemplate]=useState(example.id);const [message,setMessage]=useState('');const form=useRef<HTMLFormElement>(null);
  function download(){
    if(!form.current?.reportValidity())return;
    const missing=fields.find(f=>f.required&&!pilot[f.key].trim());
    if(missing){setMessage('Completa el campo: '+missing.label+'.');form.current?.querySelector<HTMLInputElement|HTMLTextAreaElement>('#pilot-'+missing.key)?.focus();return;}
    const blob=new Blob(['\uFEFF'+pilotMarkdown(pilot)],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='mi-piloto-empresa-nativa-ia.md';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Ficha descargada. Compártela con el responsable del departamento y TI para concretar la prueba.');
  }
  return <>
    <section className="pilot-introduction"><p className="lab-label">Empieza por una tarea que puedas comprobar</p><div className="journey-three"><article><h3>Frecuente</h3><p>Ocurre suficientes veces como para comparar resultados y aprender de los errores.</p></article><article><h3>Acotada</h3><p>Tiene entradas identificables, una salida clara y una persona disponible para revisar.</p></article><article><h3>Reversible</h3><p>Puedes probar con borradores y parar sin comprometer clientes, pagos ni operaciones críticas.</p></article></div></section>
    <section className="journey-section" aria-labelledby="pilot-title"><p className="lab-label">Tu ficha de trabajo</p><h2 id="pilot-title">Haz concreto el primer cambio.</h2><p>Completa los responsables y adapta el ejemplo. La ficha es un borrador para tu equipo; no constituye una configuración de agentes ni conecta sistemas.</p>
      <div className="pilot-builder"><form ref={form} onSubmit={e=>{e.preventDefault();download();}} className="pilot-form">
        <div className="pilot-template"><label htmlFor="pilot-template">Ejemplo de partida</label><div><select id="pilot-template" value={template} onChange={e=>setTemplate(e.target.value)}>{processes.map(p=><option key={p.id} value={p.id}>{p.department}</option>)}</select><button type="button" className="button button-outline button-small" onClick={()=>{const p=initialPilot(processes.find(p=>p.id===template)!);setPilot({...p,owner:pilot.owner,supervisor:pilot.supervisor});setMessage('Ejemplo cargado. Se han conservado los responsables y sustituido los demás campos.');}}>Cargar ejemplo</button></div><small>Sustituye el contenido de la ficha; conserva los responsables.</small></div>
        {fields.map(f=><div className="pilot-field" key={f.key}><label htmlFor={'pilot-'+f.key}>{f.label}{f.required?' *':''}</label><p id={'hint-'+f.key}>{f.hint}</p>{f.short?<input id={'pilot-'+f.key} aria-describedby={'hint-'+f.key} required={f.required} maxLength={160} value={pilot[f.key]} onChange={e=>{setPilot({...pilot,[f.key]:e.target.value});setMessage('');}}/>:<textarea id={'pilot-'+f.key} aria-describedby={'hint-'+f.key} required={f.required} rows={3} maxLength={2000} value={pilot[f.key]} onChange={e=>{setPilot({...pilot,[f.key]:e.target.value});setMessage('');}}/>}</div>)}
        <p className="pilot-privacy">* Campos obligatorios. El contenido se procesa en este navegador y no se envía al servidor. Descarga la ficha antes de salir; no se guarda al cerrar o recargar esta página.</p><button type="submit" className="button">Descargar mi ficha (.md) ↓</button><p className="pilot-feedback" role="status">{message}</p>
      </form><aside className="pilot-preview"><p className="lab-label">Tu proceso, de un vistazo</p><h3>{pilot.process||'Proceso pendiente'}</h3><dl><div><dt>Departamento</dt><dd>{pilot.department||'Pendiente'}</dd></div><div><dt>Responsable</dt><dd>{pilot.owner.trim()||'Por asignar'}</dd></div><div><dt>Supervisión</dt><dd>{pilot.supervisor.trim()||'Por asignar'}</dd></div><div><dt>Agentes</dt><dd>{pilot.agents||'Por definir'}</dd></div></dl><div className="pilot-preview-note"><strong>Antes de conectarlo</strong><p>Acuerda con TI las fuentes y los permisos. Fija presupuesto, muestra, umbral de aceptación y fecha de revisión. Esos compromisos deben completarse con tu equipo.</p></div></aside></div>
    </section>
    <section className="journey-section"><h2>Cuatro puertas antes de ampliar el piloto.</h2><ol className="architecture-trace">{[
      ['Una referencia de partida','El responsable mide casos actuales y acuerda qué significa un resultado correcto.'],
      ['Una prueba sin acciones externas','El equipo usa datos autorizados y compara los borradores con la referencia.'],
      ['Una revisión conjunta','Departamento y TI comprueban errores, excepciones, coste y carga de supervisión.'],
      ['Una decisión explícita','Se decide parar, corregir o ampliar con permisos limitados. Se nombra a quien puede detener el proceso.'],
    ].map(([title,text],i)=><li key={title}><span>{i+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
  </>;
}
