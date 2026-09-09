export const normalize = (text='') => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
export const clean = (text='') => text.replace(/[↗→←↓📌💡⚠️🎓🤖⚙️]/gu,' ').replace(/\s+/g,' ').trim();

// Short phrases avoid the long-utterance stalls of some browser speech engines.
export function splitSpeech(text, max=220) {
  const words=clean(text).split(' ');const chunks=[];let current='';
  for(const word of words){if(current.length+word.length+1>max&&current){chunks.push(current);current='';}current+=(current?' ':'')+word;if(/[.!?;:]$/.test(word)&&current.length>95){chunks.push(current);current='';}}
  if(current)chunks.push(current);return chunks;
}

export const explanations={
  'modelo':'Piensa en el modelo como la capacidad de interpretar y redactar. Para hacer un trabajo necesita recibir información y estar conectado a un proceso.',
  'agente':'Un agente utiliza esa capacidad para dar pasos y usar herramientas. Por ejemplo, consultar un catálogo y preparar una propuesta. Sus permisos determinan hasta dónde puede llegar.',
  'proceso':'Un proceso convierte una petición en un resultado. Define los pasos, las reglas, las personas responsables y qué hacer cuando aparece una excepción.',
  'persona':'La responsabilidad sigue siendo humana. Una persona diseña y responde por el proceso; otra puede supervisar los expedientes de cada día.',
  'tu empresa ya tiene una base':'No necesitas empezar de cero. El sistema de gestión, el programa comercial, las carpetas y los equipos actuales siguen siendo útiles. La nueva capa de agentes los conecta mediante permisos definidos.',
  'tres maneras de situar la inteligencia':'Centralizada significa compartir un servidor. Distribuida significa repartir trabajo entre equipos. Híbrida combina recursos internos y servicios externos. Los botones permiten comparar las tres alternativas.',
  'repartir peticiones entre equipos':'NVIDIA PAIR es un repartidor de solicitudes. Envía cada petición a un equipo que pueda atenderla. No convierte varias tarjetas gráficas en una sola ni junta su memoria.',
  'seis capas para convertir capacidad en trabajo fiable':'Recorre las capas de arriba abajo. Primero definimos quién responde. Después, cómo avanza el trabajo, qué herramientas usa, qué información consulta, dónde se ejecuta el modelo y cómo se mantiene todo en funcionamiento.',
  'el mismo agente tres niveles de autorizacion':'La autonomía se concede por tarea. Puede limitarse a preparar borradores, permitir ejecutar después de una aprobación o autorizar casos concretos dentro de reglas probadas.',
  'un coste completo':'No basta con mirar el precio de los tokens. Cuenta también el tiempo de revisar, la integración y el mantenimiento. La comparación útil es cuánto cuesta un resultado que realmente aceptas.',
  'un limite explicito':'Un límite evita que el agente continúe cuando no debería. Por ejemplo: faltan datos, aparece un proveedor nuevo o se supera el presupuesto de prueba.',
  'rag':'Recuperar información significa buscar en las fuentes autorizadas los fragmentos relevantes y dárselos al modelo. La información sigue necesitando permisos, fecha y procedencia.',
};

// Used only at authoring time on the public server-rendered page, never on visitor input.
export function extractGuide(document, path) {
  const root=document.querySelector('#contenido, main')||document.body;
  const chapters=[];let current=null;
  const ignored='nav,footer,form,input,textarea,select,button,pre,code,script,style,[hidden],[aria-hidden="true"],[contenteditable],[data-assistant-private],.sr-only';
  for(const node of root.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,figcaption')){
    if(node.closest(ignored))continue;
    if(node.tagName==='LI'&&node.querySelector('p,h1,h2,h3,h4,li'))continue;
    const spoken=node.cloneNode(true);for(const br of spoken.querySelectorAll('br'))br.replaceWith(' ');
    const text=clean(spoken.textContent||'');if(!text)continue;
    if(/^H[1-4]$/.test(node.tagName)){
      current={title:text,match:clean(node.textContent||''),text:explanations[normalize(text)]||'',tag:node.tagName.toLowerCase()};chapters.push(current);
    }else if(current){current.text+=(current.text?' ':'')+text+( /[.!?]$/.test(text)?'':'.');}
  }
  if(!chapters.length)chapters.push({title:'Cómo utilizar esta página',match:'',text:'Esta página contiene una herramienta incrustada. Puedes explorar sus controles y consultar su ayuda. El asistente de MBAI no puede recorrer el contenido interno de una aplicación de otro dominio.',tag:'main'});
  return {path,chapters:chapters.map((c,i)=>({...c,id:String(i),chunks:splitSpeech(c.title+'. '+c.text)}))};
}

export function browserFamily(userAgent='') {
  if(/Edg(?:e|A|iOS)?\//i.test(userAgent))return 'edge';
  if(/(?:Chrome|CriOS)\//i.test(userAgent))return 'chrome';
  return '';
}
export function pickVoice(voices,userAgent='') {
  const browser=browserFamily(userAgent);
  const preference=v=>/^es-ES$/i.test(v.lang)&&(
    browser==='chrome'&&normalize(v.name)==='google espanol'||
    browser==='edge'&&normalize(v.name).startsWith('microsoft alvaro online natural'))?1000:0;
  return [...voices].filter(v=>/^es(?:-|_)/i.test(v.lang)).sort((a,b)=>preference(b)+score(b)-preference(a)-score(a))[0]||null;
}
function score(v){return (/^es-ES$/i.test(v.lang)?20:0)+(/Microsoft|Google/i.test(v.name)?30:0)+(/Natural|Neural|Online/i.test(v.name)?25:0)+(v.default?1:0);}

// Own playback callbacks carry a generation id: old completions cannot restart a stopped tour.
export class PlaybackGate {
  value=0;
  next(){return ++this.value;}
  valid(value){return this.value===value;}
}
