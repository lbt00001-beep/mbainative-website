import {initializeMicrodata} from './microdata-ui.mjs';
import {estimate,estimateEvolution,projectEstimate,validateCatalog,evaluateHistory} from './polling.mjs';
import {estimateForDate,madridDate} from './freshness.mjs';
import {methodologyLabels} from './methodology.mjs';
import {cisDiagnostics} from './cis.mjs';
import {consultAI} from './ai-client.mjs';
import {helpButton,parameterHelp,enhanceParameterHelp,installTooltips} from './tooltips.mjs';
import {allocate,validateOfficial,MAIN_IDS,NAMES,COLORS,GROUPS,MAJORITY,INVESTITURE_IDS,INVESTITURE_SOURCE,nationalAllocation,nationalVotes,project,transfer,votesToGain,groupSeats,validatePolls,aggregatePolls} from './electoral.mjs';

const $=id=>document.getElementById(id), fmt=(n,d=0)=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:d,minimumFractionDigits:d});
const state={official:null,references:null,targets:null,provinces:null,central:null,local:null,localResult:null,simulation:null,worker:null,valid:false};
const dateLabel=date=>date.split('-').reverse().join('/');
const controlled=['pp','psoe','vox','sumar','podemos','salf'];
const name=id=>NAMES[id]||state.official?.parties[id]?.name||id;
const color=id=>COLORS[id]||'#8b97ac';
function node(tag,attrs={},...children){const el=document.createElement(tag);for(const [k,v]of Object.entries(attrs)){if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k==='style')Object.assign(el.style,v);else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else el.setAttribute(k,String(v));}for(const c of children.flat())if(c!=null)el.append(c instanceof Node?c:document.createTextNode(String(c)));return el;}
function put(id,...children){$(id).replaceChildren(...children.flat());}
function partyLabel(id){return node('span',{class:'party-label'},node('span',{class:'dot',style:{background:color(id)},'aria-hidden':'true'}),name(id));}
function table(headers,rows,caption){const t=node('table',{},caption?node('caption',{},caption):null,node('thead',{},node('tr',{},headers.map((h,i)=>node('th',{scope:'col',class:i?'number':''},h,parameterHelp(h)?helpButton(parameterHelp(h),h):null)))),node('tbody',{},rows.map(row=>node('tr',{},row.map((c,i)=>node('td',{class:i?'number':''},c))))));return node('div',{class:'table-scroll',tabindex:0,'aria-label':caption||'Tabla de resultados desplazable'},t);}
function bar(label,value,max,display,barColor){return node('div',{class:'vote-row'},node('span',{class:'bar-label'},label),node('div',{class:'bar-track'},node('div',{class:'bar-fill',style:{width:`${Math.max(0,Math.min(100,value/max*100))}%`,background:barColor}})),node('strong',{},display));}
function download(filename,data,type='application/json'){const blob=new Blob([type==='application/json'?JSON.stringify(data,null,2):data],{type});const u=URL.createObjectURL(blob),a=node('a',{href:u,download:filename});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
function switchTab(id){document.querySelectorAll('.tab-panel').forEach(el=>el.hidden=el.id!==id);document.querySelectorAll('[data-tab]').forEach(el=>el.dataset.tab===id?el.setAttribute('aria-current','page'):el.removeAttribute('aria-current'));if(id==='help'){$('help-title').focus({preventScroll:true});$('help').scrollIntoView({block:'start'});}}
function status(id,text,error=false){$(id).textContent=text;$(id).classList.toggle('error',error);}
async function getJSON(path){const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw new Error(`No se puede cargar ${path} (${r.status}).`);return r.json();}

function renderEstimateTrend(){
  const points=estimateEvolution(state.catalog,state.official,state.estimate.expired?state.catalog.asOf:state.estimate.calculatedAt);
  if(!points.length){put('estimate-trend',node('p',{},'No hay sondeos disponibles para reconstruir la evolución.'));return;}
  const ids=[...new Set(points.flatMap(p=>Object.keys(p.coverage).filter(id=>p.coverage[id]>0)))];
  const ns='http://www.w3.org/2000/svg',svg=(tag,attrs={},text)=>{const el=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;return el;};
  const chart=svg('svg',{viewBox:'0 0 1100 650',class:'trend-svg',role:'img','aria-labelledby':'trend-title trend-desc'});
  chart.append(svg('title',{id:'trend-title'},'Evolución de la estimación ponderada por partido'),svg('desc',{id:'trend-desc'},'Eje horizontal: fecha de publicación. Eje vertical: porcentaje de voto válido. Las cifras y cobertura están disponibles en la tabla inferior.'));
  const start=Date.parse(points[0].date),end=Date.parse(points.at(-1).date),top=Math.max(10,Math.ceil(Math.max(...points.flatMap(p=>ids.map(id=>p.coverage[id]?p.values[id]:0)))/5)*5);
  const ranges={all:[0,top],upper:[25,Math.max(40,top)],middle:[10,25],lower:[0,10]},[low,high]=ranges[state.trendRange||'all'];
  const x=date=>68+(Date.parse(date)-start)/Math.max(86400000,end-start)*900,y=v=>575-(v-low)/(high-low)*520;
  const defs=svg('defs');chart.append(defs);
  const clip=svg('clipPath',{id:'trend-clip'});clip.append(svg('rect',{x:68,y:55,width:900,height:520}));defs.append(clip);
  for(let v=low;v<=high;v+=1){const major=v%5===0||high-low<=15;chart.append(svg('line',{x1:68,x2:968,y1:y(v),y2:y(v),stroke:major?'#34445c':'#1c293b'}));if(major)chart.append(svg('text',{x:58,y:y(v)+5,fill:'#a4b1c7','font-size':14,'text-anchor':'end'},v+' %'));}
  const ticks=[...new Set([0,Math.floor((points.length-1)/2),points.length-1])];
  for(const i of ticks)chart.append(svg('text',{x:x(points[i].date),y:607,fill:'#a4b1c7','font-size':14,'text-anchor':i===0?'start':i===points.length-1?'end':'middle'},dateLabel(points[i].date)));
  const legend=node('div',{class:'trend-legend','aria-label':'Partidos visibles en la gráfica'});
  const latest=points.at(-1),topFive=ids.filter(id=>latest.coverage[id]).sort((a,b)=>latest.values[b]-latest.values[a]).slice(0,5);
  const labels={pp:'PP',psoe:'PSOE',vox:'VOX',sumar:'SUMAR',podemos:'PODEMOS'};
  for(const id of ids){
    const group=svg('g',{'clip-path':'url(#trend-clip)'});let path='',previous=false;
    for(const p of points){if(!p.coverage[id]){previous=false;continue;}path+=`${previous?'L':'M'}${x(p.date)},${y(p.values[id])} `;previous=true;const dot=svg('circle',{cx:x(p.date),cy:y(p.values[id]),r:3,fill:color(id)});dot.append(svg('title',{},`${name(id)} · ${dateLabel(p.date)}: ${fmt(p.values[id],2)} % · ${p.coverage[id]} sondeos`));group.append(dot);}
    group.prepend(svg('path',{d:path,fill:'none',stroke:color(id),'stroke-width':2.5}));chart.append(group);
    let endLabel;
    if(topFive.includes(id)&&latest.values[id]>=low&&latest.values[id]<=high){endLabel=svg('text',{x:x(latest.date)+12,y:y(latest.values[id])+5,fill:color(id),'font-size':14,'font-weight':700},labels[id]||name(id));chart.append(endLabel);}
    const input=node('input',{type:'checkbox',checked:'checked',onchange:()=>{group.style.display=input.checked?'':'none';if(endLabel)endLabel.style.display=input.checked?'':'none';}});legend.append(node('label',{},input,partyLabel(id)));
  }
  const scale=node('select',{'aria-label':'Escala vertical de la evolución',onchange:event=>{state.trendRange=event.target.value;renderEstimateTrend();}},[['all','Todos los porcentajes'],['upper','Ampliar: 25 % o más'],['middle','Ampliar: 10–25 %'],['lower','Ampliar: 0–10 %']].map(([value,label])=>node('option',{value},label)));scale.value=state.trendRange||'all';
  put('estimate-trend',node('label',{class:'trend-scale'},'Escala vertical ',scale),node('p',{class:'small muted'},state.trendRange&&state.trendRange!=='all'?`Vista ampliada: ${low}–${high} %. Las series fuera de este intervalo quedan fuera de la gráfica; sus cifras siguen disponibles en la tabla.`:'Escala completa. Puedes ampliar un intervalo para apreciar variaciones pequeñas.'),chart,legend,node('details',{},node('summary',{},'Ver cifras y cobertura por fecha'),node('p',{class:'small muted'},'Cada celda indica porcentaje y número de sondeos con cifra para ese partido. — significa sin cobertura.'),table(['Fecha','Institutos',...ids.map(name)],points.map(p=>[dateLabel(p.date),p.count,...ids.map(id=>p.coverage[id]?`${fmt(p.values[id],2)} % (${p.coverage[id]})`:'—')]),'Evolución reconstruida con el catálogo disponible')));
  enhanceParameterHelp($('estimate-trend'));
}

function renderObservatory(){
  state.microRender?.();
  $('estimate-title').textContent=state.estimate.expired?'Archivo: sin sondeos vigentes':`Estimación propia · cálculo ${dateLabel(state.estimate.calculatedAt)}`;
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const age=state.estimate.dataAge;
  $('catalog-warning').hidden=age<=7&&!state.estimate.expired; $('catalog-warning').textContent=state.estimate.expired?'No quedan sondeos dentro de los últimos 60 días. Se muestra el último escenario archivado, para exploración histórica. Actualiza las fuentes para recuperar una estimación vigente.':`El último sondeo se publicó hace ${age} días. El cálculo es de hoy, pero no se han obtenido datos nuevos por recalcular.`;
  $('help-poll-count').textContent=state.estimate.selected.length;
  const ref=state.references.references[0],actual=state.central;
  put('reference-bars',controlled.map(id=>bar(partyLabel(id),state.estimate.values[id],40,`${fmt(state.estimate.values[id],2)} %`,color(id))));
  $('reference-link').href=ref.url;
  renderEstimateTrend();
  put('official-bars',['pp','psoe','vox','sumar'].map(id=>bar(partyLabel(id),actual.counts[id],160,`${actual.counts[id]} esc.`,color(id))),bar('Otras candidaturas',350-['pp','psoe','vox','sumar'].reduce((s,id)=>s+(actual.counts[id]||0),0),160,`${350-['pp','psoe','vox','sumar'].reduce((s,id)=>s+(actual.counts[id]||0),0)} esc.`,'#8b97ac'));
  $('official-check').textContent='Proyección propia: 52 circunscripciones; 350 escaños. Consulta supuestos y evaluación.';
  $('data-date').textContent=`Corte del catálogo: ${state.catalog.asOf.split('-').reverse().join('/')}`;
  const sources=[
    [ref.title,ref.url,'Referencia publicada el 3 de octubre de 2026; cifras aproximadas.'],
    [state.official.source.name,state.official.source.url,'Votos, blancos, censo y escaños definitivos de 2023.'],
    ['Junta Electoral Central · resumen oficial',state.official.source.verificationUrl,'Publicación del escrutinio general en el BOE.'],
    ['Convocatoria de 2026 · reparto provincial',state.territory.seatSource,'Reparto vigente: se utiliza en la proyección.'],
    ['LOREG · artículos 162 y 163','https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672','Distribución territorial, barrera y procedimiento de adjudicación.'],
    ['Constitución · artículo 99','https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229','Reglas de las votaciones de investidura.']
  ];
  put('source-list',node('ul',{},sources.map(([title,url,note])=>node('li',{},node('a',{href:url,target:'_blank',rel:'noopener noreferrer'},title),node('br'),note))));

  put('help-data-list',table(['Fuente consultable','Fecha del dato','Para qué se usa'],[
    [node('a',{href:state.official.source.url,target:'_blank',rel:'noopener noreferrer'},'Ministerio del Interior · fichero original'),dateLabel(state.official.electionDate),'Votos, blancos, censos y escaños de las provincias.'],
    [node('a',{href:state.official.source.verificationUrl,target:'_blank',rel:'noopener noreferrer'},'Junta Electoral Central · resultados en el BOE'),'01/09/2023','Contrastar la publicación oficial del escrutinio.'],
    [node('a',{href:'./data/polls.json',target:'_blank',rel:'noopener noreferrer'},'Catálogo real de sondeos y originales'),dateLabel(state.catalog.asOf),'Estimar voto nacional; fechas, pesos y cobertura en Observatorio.'],
    [node('a',{href:state.territory.seatSource,target:'_blank',rel:'noopener noreferrer'},'BOE · convocatoria 2026'),'06/10/2026','Número de escaños vigente en cada circunscripción.'],
    [node('a',{href:state.territory.footprintSource,target:'_blank',rel:'noopener noreferrer'},'Interior · europeas 2024'),'09/06/2024','Huella provincial observable de Podemos y SALF.'],
    [node('a',{href:ref.url,target:'_blank',rel:'noopener noreferrer'},ref.title),dateLabel(ref.date),'Contexto editorial; sus cifras no alimentan la estimación propia.'],
    [node('a',{href:'https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672#a163',target:'_blank',rel:'noopener noreferrer'},'LOREG · texto consolidado'),'Consulta la versión y fecha en el BOE','Barrera, cocientes y desempates electorales.']
  ],'Consulta los originales para conocer el alcance de cada dato.'));
  $('help-data-date').textContent=`Cálculo: ${dateLabel(state.estimate.calculatedAt)}. Último sondeo publicado: ${dateLabel(state.estimate.lastPublication)}. Último campo conocido: ${state.estimate.lastFieldwork?dateLabel(state.estimate.lastFieldwork):'No publicado'}. Corte del catálogo: ${dateLabel(state.catalog.asOf)}. Base histórica descargada: ${dateLabel(state.official.retrievedAt)}. Estas fechas no implican actualización automática.`;
}
function createNationalControls(){
  put('national-controls',controlled.map(id=>{
    const number=node('input',{type:'number',id:`pct-${id}`,min:0,max:60,step:0.01,value:Number((state.targets[id]*(100-state.estimate.blank)/100).toFixed(2)),'aria-label':`${name(id)}, porcentaje nacional`});
    const range=node('input',{type:'range',id:`range-${id}`,min:0,max:60,step:0.1,value:Number((state.targets[id]*(100-state.estimate.blank)/100).toFixed(1)),'aria-label':`Ajustar porcentaje de ${name(id)}`});
    const update=(source,other)=>{other.value=source.value;state.targets[id]=source.value===''?NaN:Number(source.value)*100/(100-state.estimate.blank);invalidateSimulation();scheduleCentral();};
    number.addEventListener('input',()=>update(number,range));range.addEventListener('input',()=>update(range,number));
    return node('div',{class:'range-row'},node('div',{class:'range-heading'},partyLabel(id),number),range);
  }));
  enhanceParameterHelp($('national-controls'));
}
let centralTimer;
function scheduleCentral(){clearTimeout(centralTimer);state.valid=false;$('run-simulation').disabled=true;$('export-scenario').disabled=true;$('central-total').textContent='Recalculando…';centralTimer=setTimeout(updateCentral,120);}
function invalidateSimulation(){if(state.worker)cancelSimulation();state.simulation=null;$('simulation-results').hidden=true;status('simulation-status','Los parámetros han cambiado. Ejecuta una nueva simulación.');}
function updateCentral(){
  try {
    const manual=JSON.stringify(state.targets)!==JSON.stringify(state.estimate.targets);$('scenario-origin').textContent=manual?'Escenario manual: has cambiado las hipótesis nacionales.':'Estimación de los sondeos: parámetros nacionales originales.';$('province-basis').querySelector('option[value="scenario"]').textContent=manual?'Escenario nacional manual':'Proyección actual de los sondeos';state.provinces=projectEstimate(state.official,state.targets,state.territory);state.central=nationalAllocation(state.provinces);state.valid=true;
    const remainder=100-controlled.reduce((s,id)=>s+state.targets[id],0);status('remaining',`Partidos territoriales y demás candidaturas: ${fmt(remainder*(100-state.estimate.blank)/100,1)} %. Blanco supuesto: ${fmt(state.estimate.blank,2)} %. Todos los porcentajes visibles se expresan sobre voto válido.`);
    $('central-total').textContent='350 / 350';$('central-table').classList.remove('stale');
    put('central-coalitions',[
      ['PP + Vox',state.central.groups.right],['PSOE + Sumar + Podemos',state.central.groups.left],['Resto de candidaturas',350-state.central.groups.right-state.central.groups.left]
    ].map(([label,v],i)=>node('div',{class:'metric'},node('small',{},label),node('strong',{},v),node('span',{},i===2?'Fuera de las dos sumas':v>=176?'Alcanza 176':`${176-v} hasta 176`))));
    const supportingSeats=INVESTITURE_IDS.reduce((sum,id)=>sum+(state.central.counts[id]||0),0);
    put('investiture-total',node('div',{class:'metric investiture-metric'},node('small',{},'PSOE y apoyos de la investidura de 2023'),node('strong',{},supportingSeats+' escaños'),node('span',{},supportingSeats>=176?'Alcanza 176':`${176-supportingSeats} hasta 176`)),node('p',{class:'small muted'},'Suma en este escenario: '+INVESTITURE_IDS.map(id=>`${name(id)} (${state.central.counts[id]||0})`).join(' + ')+'. Podemos se cuenta por separado porque concurre como candidatura distinta en el escenario, aunque sus diputados formaban parte de Sumar en la investidura.'),node('p',{class:'small muted'},'Es una comparación aritmética con quienes apoyaron el inicio de la legislatura, no una previsión de acuerdos futuros ni de apoyo a todas las leyes. '),node('a',{href:INVESTITURE_SOURCE,target:'_blank',rel:'noopener noreferrer'},'Consultar la votación del Congreso del 16/11/2023 ↗'));
    const counts=state.central.counts,others=Object.entries(counts).filter(([id])=>!MAIN_IDS.includes(id)).reduce((s,[,v])=>s+v,0);
    const rows=MAIN_IDS.filter(id=>(counts[id]||0)>0||(state.central.shares[id]||0)>0.01).map(id=>[partyLabel(id),`${fmt((state.central.shares[id]||0)*(100-state.estimate.blank)/100,1)} %`,fmt(counts[id]||0)]);
    rows.push(['Otras candidaturas (separadas en el cálculo)',`${fmt(Object.entries(state.central.shares).filter(([id])=>!MAIN_IDS.includes(id)).reduce((s,[,v])=>s+v,0)*(100-state.estimate.blank)/100,1)} %`,fmt(others)]);
    put('central-table',table(['Candidatura','Voto válido esperado','Escaños'],rows,'Proyección provincial a partir de sondeos; escaños de la convocatoria de 2026.'));
    put('seat-strip',Object.entries(counts).filter(([,v])=>v).sort((a,b)=>b[1]-a[1]).map(([id,v])=>node('span',{class:'seat-segment',title:`${name(id)}: ${v} escaños`,style:{width:`${v/350*100}%`,background:color(id)}})));
    $('fit-status').textContent='Los porcentajes nacionales se trasladan a 52 provincias mediante ajuste territorial. Podemos y SALF usan su huella europea de 2024; los demás, el voto de 2023. AC y AA usan una distribución uniforme dentro de sus territorios: supuesto provisional. Volumen provincial y blancos fijos de 2023.';
    const fingerprint=JSON.stringify(state.targets);
    if(state.lastTargets!==fingerprint&&$('province-basis').value==='scenario'&&state.local)resetProvince();
    state.lastTargets=fingerprint;
    $('run-simulation').disabled=false;$('export-scenario').disabled=false;
    enhanceParameterHelp(document);
  }catch(error){state.valid=false;status('remaining',error.message,true);$('central-total').textContent='Escenario inválido';put('central-coalitions');put('investiture-total');put('seat-strip');put('central-table',node('p',{class:'notice error'},'Corrige los porcentajes nacionales para obtener un reparto.'));$('fit-status').textContent='';$('run-simulation').disabled=true;$('export-scenario').disabled=true;}
}
function applyPreset(){
  const ref=state.references.references[0].values;
  const presets={base:{...state.estimate.targets},left:{pp:30,psoe:30,vox:16,sumar:7,podemos:3,salf:0},right:{pp:35,psoe:24,vox:19,sumar:5,podemos:3,salf:0},united:{...ref,sumar:9,podemos:0,salf:0}};
  state.targets={...state.estimate.targets,...presets[$('preset').value]};createNationalControls();invalidateSimulation();updateCentral();
}
function options(){return {runs:Number($('runs').value),seed:Number($('seed').value),nationalSigma:Number($('national-sigma').value),localSigma:Number($('local-sigma').value)};}
function stopWorker(){state.worker?.terminate();state.worker=null;$('run-simulation').disabled=!state.valid;$('cancel-simulation').hidden=true;$('simulation-progress').hidden=true;}
function cancelSimulation(){stopWorker();status('simulation-status','Simulación cancelada. No se han guardado resultados parciales.');}
function startSimulation(){
  clearTimeout(centralTimer);updateCentral();if(!state.valid)return;
  const params=options();if(!Number.isInteger(params.seed)||params.seed<0||params.seed>4294967295||!Number.isFinite(params.nationalSigma)||params.nationalSigma<0||params.nationalSigma>6||!Number.isFinite(params.localSigma)||params.localSigma<0||params.localSigma>4){status('simulation-status','Revisa la semilla y las escalas de error.',true);return;}
  stopWorker();state.simulation=null;$('simulation-results').hidden=true;
  try {
    const worker=new Worker(new URL('./simulation-worker.mjs',import.meta.url),{type:'module'});state.worker=worker;
    $('run-simulation').disabled=true;$('cancel-simulation').hidden=false;$('simulation-progress').hidden=false;$('simulation-progress').value=0;
    status('simulation-status',`Simulando ${fmt(params.runs)} elecciones…`);
    worker.onmessage=({data})=>{if(state.worker!==worker)return;if(data.type==='progress'){$('simulation-progress').value=100*data.completed/params.runs;status('simulation-status',`${fmt(data.completed)} / ${fmt(params.runs)} elecciones calculadas.`);}else if(data.type==='error'){stopWorker();status('simulation-status',data.message,true);}else if(data.type==='result'){state.simulation=data.result;stopWorker();renderSimulation();status('simulation-status',`${fmt(params.runs)} simulaciones completas. Semilla ${params.seed}.`);}};
    worker.onerror=()=>{stopWorker();status('simulation-status','No se pudo ejecutar el cálculo en segundo plano. Comprueba que sirves la app por HTTP y que el alojamiento admite módulos JavaScript.',true);};
    worker.postMessage({provinces:state.provinces,options:params});
  }catch(error){stopWorker();status('simulation-status',error.message,true);}
}
function renderSimulation(){
  const r=state.simulation;$('simulation-results').hidden=false;
  $('simulation-caption').textContent=`${fmt(r.runs)} simulaciones · σ nacional ${fmt(r.nationalSigma,1)} · σ local ${fmt(r.localSigma,1)} · semilla ${r.seed}`;
  put('frequency-bars',bar('PP en solitario',r.ppAlone,1,`${fmt(r.ppAlone*100,1)} %`,color('pp')),Object.entries(GROUPS).map(([id,g])=>bar(g.name,r.groups[id].frequency,1,`${fmt(r.groups[id].frequency*100,1)} %`,id==='right'?color('pp'):id==='ppPartners'?color('pnv'):color('psoe'))));
  put('interval-table',table(['Candidatura','Mediana','P10','P90'],MAIN_IDS.filter(id=>r.parties[id]).map(id=>[partyLabel(id),fmt(r.parties[id].median,1),fmt(r.parties[id].low,1),fmt(r.parties[id].high,1)]),'Intervalos bajo los parámetros elegidos.'));
  renderScatter(r.points);enhanceParameterHelp(document);
}
function renderScatter(points){
  const ns='http://www.w3.org/2000/svg',svg=(tag,a={},text)=>{const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(a))n.setAttribute(k,String(v));if(text)n.textContent=text;return n;};
  const chart=svg('svg',{viewBox:'0 0 760 400',class:'scatter-svg',role:'img','aria-label':`Dispersión de ${fmt(points.length)} simulaciones. Eje horizontal: PP y Vox. Eje vertical: PSOE, Sumar y Podemos.`});chart.append(svg('title',{},'Mayorías bajo los supuestos de simulación'));
  const x=v=>70+v/350*640,y=v=>335-v/350*280;
  for(const v of [0,100,176,250,350]){chart.append(svg('line',{x1:x(v),x2:x(v),y1:55,y2:335,stroke:v===176?'#e2b659':'#263449','stroke-dasharray':v===176?'6 5':'0'}),svg('text',{x:x(v),y:355,fill:'#a4b1c7','font-size':12,'text-anchor':'middle'},String(v)),svg('line',{x1:70,x2:710,y1:y(v),y2:y(v),stroke:v===176?'#e2b659':'#263449','stroke-dasharray':v===176?'6 5':'0'}),svg('text',{x:55,y:y(v)+4,fill:'#a4b1c7','font-size':12,'text-anchor':'end'},String(v)));}
  const grouped=new Map();for(const p of points){const key=`${p.right},${p.left}`;grouped.set(key,{...p,count:(grouped.get(key)?.count||0)+1});}
  for(const p of grouped.values())chart.append(svg('circle',{cx:x(p.right),cy:y(p.left),r:Math.min(6,2+Math.log1p(p.count)/2),fill:p.right>=176?'#65a5ff':'#ff8391',opacity:.35}));
  chart.append(svg('text',{x:390,y:385,fill:'#c9d3e4','text-anchor':'middle','font-size':13},'Escaños PP + Vox'),svg('text',{x:75,y:30,fill:'#c9d3e4','font-size':13},'Escaños PSOE + Sumar + Podemos'));
  put('scatter',chart);
}
function resetProvince(){
  const basis=$('province-basis').value;if(basis==='scenario'&&!state.valid){status('province-status','El escenario nacional es inválido. Corrige sus porcentajes.',true);return;}
  const p=(basis==='scenario'?state.provinces:state.official.provinces).find(p=>p.id===$('province-select').value);
  state.local=structuredClone(p);state.local.votes.podemos??=0;state.local.votes.salf??=0;renderProvinceInputs();renderProvince();put('transfer-result');
  $('province-meta').textContent=`${p.seats} escaños (${basis==='official'?'2023':'2026'}) · censo 2023: ${fmt(p.census)} · ${basis==='official'?'votos oficiales':'votos de escenario'}`;
}
function localIds(){return Object.keys(state.local.votes).filter(id=>state.local.votes[id]>0||MAIN_IDS.includes(id)).sort((a,b)=>state.local.votes[b]-state.local.votes[a]);}
function renderProvinceInputs(){
  const ids=localIds();put('province-inputs',ids.map(id=>node('label',{},name(id),node('input',{type:'number',min:0,max:100000000,step:1,value:state.local.votes[id],id:`local-${id}`,'data-party':id}))));
  $('province-blank').value=state.local.blankVotes;$('province-seats').value=state.local.seats;
  for(const select of ['transfer-from','transfer-to'])put(select,ids.map(id=>node('option',{value:id},name(id))));
  $('transfer-from').value=ids.includes('vox')?'vox':ids[0];$('transfer-to').value=ids.includes('pp')?'pp':ids[1];
  enhanceParameterHelp($('province-form'));
}
function readLocalInputs(){
  const votes={...state.local.votes};document.querySelectorAll('[data-party]').forEach(input=>{if(input.value==='')throw new Error('Completa todos los votos con un número, también si es cero.');votes[input.dataset.party]=Number(input.value);});
  const seats=Number($('province-seats').value),blank=Number($('province-blank').value);
  if(!$('province-seats').value||!$('province-blank').value)throw new Error('Completa los escaños y los votos en blanco.');
  if(!Number.isInteger(seats)||seats<1||seats>52)throw new Error('El escenario provincial admite entre 1 y 52 escaños.');
  const singleMember=['51','52'].includes(state.local.id)&&seats===1;
  const r=allocate(votes,seats,{blank,singleMember});
  state.local={...state.local,votes,seats,blankVotes:blank,candidateVotes:r.candidateVotes,validVotes:r.validVotes};return r;
}
function renderProvince(){
  const p=state.local,r=allocate(p.votes,p.seats,{blank:p.blankVotes,singleMember:['51','52'].includes(p.id)&&p.seats===1});state.localResult=r;
  const ids=localIds(),eligible=new Set(r.eligible);
  put('province-allocation',table(['Candidatura','Votos','% válidos','Escaños','Siguiente cociente','Votos extra para +1'],ids.map(id=>[partyLabel(id),fmt(p.votes[id]),`${fmt(100*p.votes[id]/r.validVotes,2)} %`,fmt(r.counts[id]||0),eligible.has(id)?fmt(p.votes[id]/((r.counts[id]||0)+1),2):'Bajo barrera',fmtOrDash(votesToGain({...p},id))]),'Los votos extra aumentan el total válido; no describen una transferencia. El sorteo, si aparece, es simulado.'));
  const last=r.last,next=r.next[0];
  const same=Object.values(GROUPS).some(g=>g.ids.includes(last.id)&&g.ids.includes(next.id));
  $('marginal-note').textContent=`Último cociente ganador: ${name(last.id)} (${fmt(last.value,2)}). Mejor siguiente cociente: ${name(next.id)} (${fmt(next.value,2)}). ${last.id===next.id?'La misma candidatura tiene el siguiente cociente.':same?'Ambas candidaturas comparten alguna suma de partidos del método; un intercambio no implica cambiar esa suma.':'Para saber a quién se desplaza, compara un cambio concreto de votos.'}${r.lotteries.length?' Hay empate de votos y cocientes: se ha simulado un sorteo con semilla 1 y alternancia.':''}`;
  put('quotient-table',table(['Escaño','Candidatura','Divisor','Cociente'],r.winners.map((q,i)=>[i+1,partyLabel(q.id),q.divisor,fmt(q.value,2)])));
  status('province-status',`${fmt(r.candidateVotes)} votos a candidaturas + ${fmt(p.blankVotes)} blancos = ${fmt(r.validVotes)} válidos. ${p.seats} escaños asignados.`);
  $('export-province').disabled=false;
  const nationalPP=state.targets.pp*(100-state.estimate.blank)/100,localPP=100*(p.votes.pp||0)/r.validVotes;
  put('province-explanation',node('strong',{},'¿Por qué el porcentaje provincial difiere del nacional?'),node('p',{},$('province-basis').value==='official'?`Esta pantalla usa resultados oficiales de 2023: no son la estimación actual. El porcentaje del PP en ${p.name} es ${fmt(localPP,2)} % del voto válido de esa circunscripción.`:`El PP tiene ${fmt(nationalPP,2)} % en el escenario nacional elegido y ${fmt(localPP,2)} % en este escenario de ${p.name}. El primero corresponde a toda España; el segundo se calcula con los votos y blancos de esta provincia. No se exige que todas las provincias tengan el mismo porcentaje.`),node('p',{},'El modelo parte de la distribución provincial de las elecciones de 2023, incorpora las huellas de las nuevas candidaturas y ajusta los votos hasta alcanzar los objetivos nacionales. Si el PP tenía más apoyo relativo en Madrid que en el conjunto de España, ese patrón orienta la proyección madrileña. La media nacional se reconstruye ponderando cada provincia por su volumen de votos, no haciendo una media simple de 52 porcentajes.'),node('p',{},'El porcentaje provincial es una hipótesis del modelo, no una encuesta actual de esa provincia. Los totales y blancos históricos se mantienen como supuesto. Si editas los votos o aplicas una transferencia, cambiarás este escenario local y su porcentaje, sin modificar la estimación nacional.'));
}
const fmtOrDash=n=>n===null?'—':fmt(n);
function compareTransfer(event){event.preventDefault();try{
  readLocalInputs();renderProvince();const p=state.local,amount=Number($('transfer-amount').value);if(!$('transfer-amount').value)throw new Error('Introduce el número de votos.');
  const changed=transfer(p.votes,$('transfer-from').value,$('transfer-to').value,amount),after=allocate(changed,p.seats,{blank:p.blankVotes,singleMember:['51','52'].includes(p.id)&&p.seats===1}),before=state.localResult;
  const rows=localIds().filter(id=>before.counts[id]||after.counts[id]||id===$('transfer-from').value||id===$('transfer-to').value).map(id=>[partyLabel(id),fmt(p.votes[id]||0),fmt(changed[id]||0),fmt(100*(p.votes[id]||0)/before.validVotes,2)+' %',fmt(100*(changed[id]||0)/after.validVotes,2)+' %',before.counts[id]||0,after.counts[id]||0,(after.counts[id]||0)-(before.counts[id]||0)]);
  const oldGroups=groupSeats(before.counts),newGroups=groupSeats(after.counts);
  const noSeatChange=Object.keys(after.counts).every(id=>after.counts[id]===before.counts[id]);
  const from=$('transfer-from').value,to=$('transfer-to').value;
  put('transfer-result',node('p',{class:'notice'},`${fmt(amount)} votos pasan de ${name(from)} a ${name(to)}. ${noSeatChange?'Los votos y porcentajes cambian, pero esta cantidad todavía no cambia ningún escaño.':'Esta transferencia cambia el reparto de escaños.'} La comparación aún no se ha aplicado al laboratorio.`),table(['Candidatura','Votos antes','Votos después','% antes','% después','Escaños antes','Escaños después','Cambio'],rows),node('p',{class:'small muted space-top'},`Cambio en PP + Vox: ${newGroups.right-oldGroups.right}. Cambio en PSOE + Sumar + Podemos: ${newGroups.left-oldGroups.left}. Se conservan ${fmt(before.candidateVotes)} votos a candidaturas.`),node('button',{type:'button',class:'secondary',id:'apply-transfer',onclick:()=>{state.local={...state.local,votes:changed};renderProvinceInputs();$('transfer-from').value=from;$('transfer-to').value=to;renderProvince();put('transfer-result',node('p',{class:'notice success'},`Transferencia aplicada: ${fmt(amount)} votos de ${name(from)} a ${name(to)}. Se han actualizado los campos, porcentajes y cocientes del laboratorio. Restaurar base recupera los datos iniciales.`));}},'Aplicar esta transferencia al laboratorio'),node('p',{class:'small space-top'},'El resultado compara esta transferencia concreta. No es una recomendación automática de voto.'));
}catch(error){put('transfer-result',node('p',{class:'notice error'},error.message));}}
function csvProvince(){const p=state.local;const q=v=>`"${String(v).replaceAll('"','""')}"`;const rows=[['Circunscripción','Base','Candidatura','Votos','Escaños','Blancos','Escaños provinciales'],...localIds().map(id=>[p.name,$('province-basis').value,name(id),p.votes[id],state.localResult.counts[id]||0,p.blankVotes,p.seats])];download(`escenario-${p.id}.csv`,'\uFEFF'+rows.map(r=>r.map(q).join(';')).join('\r\n'),'text/csv;charset=utf-8');}
function scenarioExport(){return {schemaVersion:1,modelVersion:'3.5.0',type:'sensitivity-not-calibrated',source:state.official.source,pollEstimate:state.estimate,catalog:state.catalog,territory:state.territory,officialBase:state.official,provincialProjection:state.provinces,seatBasis:{year:2026,url:state.territory.seatSource},evaluation:state.evaluation,territorialDiagnostics:state.diagnostics,scenarioMode:JSON.stringify(state.targets)===JSON.stringify(state.estimate.targets)?'poll-estimate':'manual',targets:state.targets,targetDenominator:'candidateVotes',assumptions:{podemosFootprint:'Resultado europeo 2024 por provincia',salfFootprint:'Resultado europeo 2024 por provincia',otherParties:'Territoriales estimados con sondeos; residuo entre listas históricas separadas',turnout:'Total de votos a candidaturas de 2023 fijo por provincia'},central:state.central,simulation:state.simulation};}
async function importPolls(event){try{
  const file=event.target.files[0];if(!file)return;if(file.size>2000000)throw new Error('El fichero supera 2 MB.');
  const parsed=JSON.parse(await file.text()),polls=parsed.polls;validateCatalog({polls});const candidate={...state.catalog,...parsed,polls,asOf:parsed.asOf||state.catalog.asOf};estimate(candidate,state.official,candidate.asOf);state.catalog=candidate;refreshEstimate();renderObservatory();renderPolls(polls);status('poll-status',`${polls.length} sondeos cargados en esta sesión. Datos declarados verificados por el autor del fichero.`);
}catch(error){status('poll-status',error.message,true);}finally{event.target.value='';}}
async function updatePublishedCatalog(){
  const button=$('update-polls');button.disabled=true;status('poll-status','Consultando sondeos, fichas y microdatos públicos compatibles…');
  const previous=structuredClone(state.estimate);
  try{
    const response=await fetch('./api/update',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(240000)});
    if(!response.ok)throw Error('El servicio de búsqueda no está disponible (HTTP '+response.status+'). La búsqueda real necesita un servidor; una publicación solo estática no la ejecuta.');
    const result=await response.json();if(result.error)throw Error(result.error);
    const candidate=result.catalog;
    validateCatalog(candidate);estimate(candidate,state.official,candidate.asOf);
    if(candidate.asOf<state.catalog.asOf)throw Error('El catálogo publicado es anterior al que tienes cargado. Se conserva el actual.');
    
    state.catalog=candidate;refreshEstimate();renderObservatory();renderPolls(candidate.polls);
    try{await state.microRender?.reloadLibrary?.();}catch{const box=$('micro-update-status');if(box)box.textContent='El catálogo se ha actualizado, pero la biblioteca no se ha podido recargar. Recarga la página para consultarla.';}
    renderSearchReport(result.report);
    renderUpdateComparison(previous.values,state.estimate.values,'Comparación con la estimación que mostraba esta sesión');
    status('poll-status',`${result.cached?'Se muestra una consulta reciente compartida entre visitantes. ':''}Búsqueda: ${result.report.sources.filter(s=>s.status==='ok').length}/${result.report.sources.length} fuentes accesibles · ${result.report.summary?.newPolls||0} sondeos añadidos · ${result.report.summary?.newCis||0} tablas CIS incorporadas o actualizadas · ${result.report.summary?.newMicrodata||0} estudios de microdatos añadidos · ${result.report.summary?.updatedMetadata||0} fichas completadas · ${result.report.summary?.fullyVerified||0} verificaciones completas · ${result.report.summary?.partiallyVerified||0} parciales · ${result.report.summary?.accessOnly||0} solo accesibles · ${result.report.candidates.length} incidencias pendientes. Cálculo: ${state.estimate.calculatedAt}. Último sondeo publicado: ${state.estimate.lastPublication}.`);
  }catch(error){status('poll-status','No se ha actualizado: '+error.message,true);}finally{button.disabled=false;}
}
function renderUpdateComparison(before,after,title='Efecto de la última actualización del catálogo'){
  const rows=controlled.map(id=>[name(id),fmt(before[id],2)+' %',fmt(after[id],2)+' %',(after[id]-before[id]>0?'+':'')+fmt(after[id]-before[id],3)]);
  put('estimate-update-change',node('details',{},node('summary',{},title),table(['Partido','Antes','Después','Cambio · puntos'],rows),node('p',{},'Se muestran dos decimales y cambios en puntos porcentuales. Actualizar sin nuevos sondeos o cambios de ficha puede dejar la media igual. Se utiliza una sola ola por instituto.')));
}
function renderSearchReport(report){
  if(!report)return;
  if(report.estimateChange)renderUpdateComparison(report.estimateChange.before,report.estimateChange.after);
  put('update-report',node('h3',{},'Resultado de la búsqueda automática'),node('p',{},`${report.summary?.newPolls||0} sondeos añadidos · ${report.summary?.newCis||0} tablas CIS incorporadas o actualizadas · ${report.summary?.fullyVerified||0} verificaciones completas · ${report.summary?.partiallyVerified||0} parciales · ${report.summary?.accessOnly||0} solo accesibles · ${report.candidates.length} incidencias de extracción. ${report.summary?.newMicrodata||0} estudios de microdatos añadidos; ${report.summary?.updatedMetadata||0} fichas completadas. ${report.summary?.activePolls||state.estimate?.selected?.length||15} estudios utilizados en el promedio.`),node('p',{},'Última consulta: '+new Date(report.checkedAt).toLocaleString('es-ES',{timeZone:'Europe/Madrid'})+'. '+report.note),table(['Fuente','Acceso','Información'],report.sources.map(s=>[node('a',{href:s.url,target:'_blank',rel:'noopener noreferrer'},s.name),s.status==='ok'?'Consultada':'No accesible',s.error||`${s.found} publicaciones candidatas detectadas`])),node('details',{},node('summary',{},`${report.candidates.length} incidencias que requieren revisión`),table(['Publicación','Fuente','Motivo'],report.candidates.map(c=>[node('a',{href:c.url,target:'_blank',rel:'noopener noreferrer'},c.title),c.institute,c.reason]))),node('details',{},node('summary',{},'Publicaciones clasificadas automáticamente'),table(['Publicación','Clasificación','Motivo'],(report.processed||[]).map(c=>[node('a',{href:c.url,target:'_blank',rel:'noopener noreferrer'},c.title||c.institute||c.url),({known:c.verification==='full'?'Verificación completa':c.verification==='partial'?'Verificación parcial':'Solo accesible',incorporated:'Añadido',duplicate:'Duplicado',context:'Contexto',landing:'Portal',old:'Antiguo',retained:'Datos conservados',pending:'Revisión necesaria',unsupported:'Sin adaptador'})[c.status]||c.status,c.reason||'Clasificación completada']))));
  if(report.microdata?.length)$('update-report').append(node('h4',{},'Archivos de microdatos comprobados'),table(['Archivo original','Estado','Información'],report.microdata.map(r=>[node('a',{href:r.sourceUrl,target:'_blank',rel:'noopener noreferrer'},r.study||'Descarga pública'),({known:'Ya incorporado',incorporated:'Añadido',pending:'Pendiente de revisión'})[r.status]||r.status,r.reason||`${r.sample} entrevistas · campo hasta ${r.fieldworkEnd}`])));
}
function renderCis(){
  const studies=state.catalog.directSurveys||[];
  if(!studies.length){put('cis-direct');return;}
  const ids=['pp','psoe','vox','sumar','podemos','salf'];
  put('cis-direct',node('h3',{class:'space-top'},'CIS: analizar las respuestas sin la estimación electoral'),node('p',{},'Porcentajes sobre el total de la encuesta, con ponderaciones y recodificaciones publicadas. No son votos válidos ni microdatos sin tratamiento. Ninguna de estas cifras alimenta el promedio electoral.'),table(['Estudio','Campo','Entrevistas',...ids.map(name),'No sabe + no contesta'],[...studies].sort((a,b)=>a.fieldworkEnd.localeCompare(b.fieldworkEnd)).map(p=>[node('a',{href:p.url,target:'_blank',rel:'noopener noreferrer'},p.title),`${p.fieldworkStart} → ${p.fieldworkEnd}`,fmt(p.sample),...ids.map(id=>p.values[id]==null?'No publicado':fmt(p.values[id],1)),fmt(cisDiagnostics(p,state.official).undecided,1)])),node('p',{},'Julio y septiembre no entrevistan a las mismas personas. El estudio fiscal utiliza otro cuestionario y contexto: no se trata como una segunda ola idéntica del barómetro. Las diferencias pequeñas no acreditan por sí solas una tendencia.'),...studies.map(p=>{
    const d=cisDiagnostics(p,state.official);
    return node('details',{class:'card space-top'},node('summary',{},`${p.title} · ${fmt(p.sample)} entrevistas · ver datos y diagnóstico`),node('p',{},p.question+' · '+p.tables.method),node('p',{},`Margen teórico máximo publicado: ±${fmt(p.tables.theoreticalError,1)} puntos, al 95,5 % y bajo muestreo aleatorio simple. No incluye todos los sesgos ni es el error de la predicción.`),table(['Respuesta directa','% total encuesta'],Object.entries(p.tables.direct.rows).map(([label,v])=>[label,v===null?'Sin menciones':fmt(v,1)])),p.tables.rawDirect?node('details',{},node('summary',{},'Respuestas antes de agrupar partidos (pregunta '+p.tables.rawDirect.code+')'),table(['Respuesta publicada sin recodificar','% total encuesta'],Object.entries(p.tables.rawDirect.rows).map(([label,v])=>[label,v===null?'Sin menciones':fmt(v,1)])),node('p',{},'Esta tabla conserva las categorías originales publicadas, pero sigue siendo una distribución ponderada. La recodificación agrupa menciones de candidaturas; no equivale a repartir indecisos.')):node('p',{},'Este informe publica la pregunta recodificada; para reconstruir respuestas sin agrupar se necesitan los microdatos y el libro de códigos. No se inventa ese desglose.'),node('h4',{},'¿Qué revela el recuerdo de voto?'),node('p',{},'Para comparar denominadores, recalculamos el recuerdo entre quienes mencionan una candidatura, excluyendo blanco, nulo, no recuerdo y no respuesta. Es un diagnóstico aproximado: la población de 2026 y el recuerdo declarado no son el electorado de 2023, que incluye CERA. No demuestra por sí solo cómo se eligió la muestra ni manipulación.'),table(['Partido','Recuerdo normalizado','Resultado 2023 sobre candidaturas','Diferencia (puntos)'],d.recallComparison.map(r=>[r.label,r.recalled===null?'No disponible':fmt(r.recalled,1),fmt(r.actual,1),r.gap===null?'—':fmt(r.gap,1)])),node('p',{},`No sabe/no contesta: ${fmt(d.undecided,1)} %; no votaría: ${fmt(d.abstention,1)} %. No se adjudican a partidos. La ventaja directa PSOE−PP es ${fmt(d.directGap,1)} puntos sobre el total de la encuesta; no equivale a una ventaja electoral proyectada.`),p.tables.sympathy?node('details',{},node('summary',{},'Intención directa y voto + simpatía: operaciones distintas'),table(['Partido','Directa','Voto + simpatía'],['PSOE','PP','VOX','Sumar','Podemos'].map(label=>[label,fmt(p.tables.direct.rows[label],1),fmt(p.tables.sympathy.rows[label],1)])),node('p',{},'Voto + simpatía añade afinidad declarada por quienes no eligen una candidatura. No es su respuesta a la pregunta de intención de voto ni la estimación electoral.')):null,node('p',{},p.sourceNote||p.note),node('a',{href:p.url,target:'_blank',rel:'noopener noreferrer'},'Resultados originales ↗'),' · ',node('a',{href:p.technicalUrl,target:'_blank',rel:'noopener noreferrer'},'Ficha técnica ↗'),' · ',node('a',{href:p.studyUrl,target:'_blank',rel:'noopener noreferrer'},'Estudio y microdatos ↗'));
  }));
}
function refreshEstimate(){
  state.estimate=estimateForDate(state.catalog,state.official);state.evaluation=evaluateHistory(state.catalog);state.targets={...state.estimate.targets};
  invalidateSimulation();createNationalControls();updateCentral();
}
function renderPolls(polls){
  const avg=state.estimate;
  renderCis();
  put('poll-table',table(['Encuestadora','Campo hasta','Publicación','Muestra','Peso orientativo','Fuente'],avg.selected.map(p=>[p.institute,p.fieldworkEnd||'No publicado',p.publicationPrecision==='month'?p.publishedAt.slice(0,7)+' (mes)':p.publishedAt,p.sample===null?'No publicada':fmt(p.sample),`${fmt(p.weightPercent,1)} %`,node('a',{href:p.url,target:'_blank',rel:'noopener noreferrer'},'Original ↗')])));
  status('poll-status',`${avg.selected.length} estudios independientes utilizados de ${polls.length} incorporados · cálculo ${avg.calculatedAt} · último sondeo publicado ${avg.lastPublication}. ${fmt(avg.effectiveHouses,1)} institutos efectivos por concentración de pesos.`);
  const details=avg.selected.map(p=>node('details',{},node('summary',{},`${p.institute}: ficha y cálculo del peso`),node('p',{},p.note||'Sin observaciones adicionales.'),node('p',{},`${methodologyLabels[p.methodology?.mode]||'Modo no documentado'}. ${methodologyLabels[p.method.recruitment]}. Límite de muestra en el peso: ${fmt(p.method.cap)}; no es una muestra efectiva calculada. Cuotas: ${p.methodology?.quotas==='documented'?'documentadas':'sin acreditar'}. Ponderación: ${p.methodology?.weighting==='documented'?'documentada':'sin acreditar'}.`),node('a',{href:p.methodology?.weightingSourceUrl||p.methodology?.sourceUrl||p.url,target:'_blank',rel:'noopener noreferrer'},'Consultar metodología ↗'),node('p',{},`Tamaño ${fmt(p.size,3)} × actualidad ${fmt(p.recency,3)} × calidad ${fmt(p.quality,2)} × metodología ${fmt(p.method.factor,3)} × historial ${fmt(p.reliability,3)} = ${fmt(p.weight,4)}. El peso por partido se renormaliza entre los estudios que publican ese dato.`)));
  put('poll-average',node('h3',{class:'space-top'},'Estimación propia conectada con los escaños'),table(['Candidatura','Voto válido','Sondeos con cifra'],Object.entries(avg.values).map(([id,v])=>{const rows=avg.selected.filter(p=>Object.hasOwn(p.values,id)),total=rows.reduce((s,p)=>s+p.weight,0);return [id==='others'?'Otras candidaturas':id==='blank'?'Blanco (supuesto histórico)':partyLabel(id),`${fmt(v,2)} %`,rows.length?node('details',{},node('summary',{},`${rows.length} · ver cálculo`),table(['Instituto','Porcentaje','Peso en este partido'],rows.map(p=>[p.institute,`${fmt(p.values[id],2)} %`,`${fmt(100*p.weight/total,2)} %`]))):'Residuo / supuesto'];})),node('p',{class:'small muted'},'Las cifras de los partidos se promedian con su cobertura real; un dato ausente no se sustituye por cero. El residuo completa el 100 %, sin aumentar artificialmente el voto de los partidos territoriales.'),...details,node('details',{class:'space-top'},node('summary',{},'Comprobar robustez: media sencilla y retirada de cada instituto'),table(['Partido','Ponderada','Sin ajuste metodológico','Media sencilla'],controlled.map(id=>[partyLabel(id),`${fmt(avg.values[id],2)} %`,`${fmt(avg.withoutMethodology[id],2)} %`,`${fmt(avg.simple[id],2)} %`])),node('p',{},'Los factores metodológicos son una política editorial prudente, no una clasificación de precisión demostrada. Esta comparación permite ver su efecto. No se considera representativa una muestra solo por ser grande.'),node('p',{},'La tabla siguiente indica cuánto cambia el porcentaje al retirar un instituto y recalcular los pesos restantes. Es un diagnóstico de dependencia, no un intervalo de confianza.'),table(['Instituto retirado',...controlled.map(name)],avg.leaveOneOut.map(r=>[r.institute,...controlled.map(id=>r.deltas[id]===null?'Sin cobertura':`${r.deltas[id]>=0?'+':''}${fmt(r.deltas[id],2)} puntos`)]))),node('h3',{class:'space-top'},'Cobertura pendiente'),table(['Instituto o producto','Estado','Motivo'],state.catalog.pending.map(p=>[p.institute,({excluded:'Excluido',partial:'Información parcial'})[p.status]||p.status,p.reason])));
  const ev=state.evaluation;
  put('evaluation-table',node('h4',{},'Pesos de sondeos'),table(['Elección reservada','Estudios','Error media simple (puntos)','Error con historial previo'],ev.rows.map(r=>[r.date,r.polls,fmt(r.simpleMAE,3),fmt(r.weightedMAE,3)])),node('p',{class:'small muted'},`${avg.historicalWeighting?'Factor histórico activado.':'Factor histórico no activado: falta mejora acreditada en varias elecciones reservadas.'} ${ev.note} Error RMS de estudios individuales: ${fmt(ev.individualRMSE,2)} puntos. No equivale al error del agregado ni justifica la escala provincial.`),table(['Instituto','Elecciones verificadas','Error absoluto medio','Factor candidato (no aplicado)'],Object.entries(avg.scores).map(([id,r])=>[id,r.elections,fmt(r.mae,2),fmt(r.reliability,3)])),node('h4',{class:'space-top'},'Diagnóstico territorial con voto nacional conocido'),table(['Base → elección','MAE ajuste exacto','MAE cambio uniforme','Desajuste nacional uniforme'],state.diagnostics.territorial.map(r=>[`${r.from} → ${r.to}`,`${fmt(r.mae,2)} puntos`,`${fmt(r.alternative.mae,2)} puntos`,`${fmt(r.alternative.maxNationalTargetError,3)} puntos`])),node('p',{},`La banda aproximada del 80 % basada solo en el error de 2019 cubre ${fmt(100*state.diagnostics.territorialValidation.reservedCoverage80,1)} % de los porcentajes provinciales comparables de 2023. ${state.diagnostics.territorialValidation.note}`));
  put('province-projection',table(['Provincia','Escaños 2026','PP','PSOE','Vox','Sumar','Podemos','SALF'],state.provinces.toSorted((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>[p.name,p.seats,...controlled.map(id=>`${fmt(100*p.votes[id]/p.validVotes,1)} %`)]),'Voto esperado sobre voto válido: estimación del modelo, no sondeos provinciales observados.'));
}
async function loadModels(){
  $('load-models').disabled=true;status('ai-status','Consultando el catálogo de OpenRouter…');
  try{const r=await fetch('https://openrouter.ai/api/v1/models',{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`Catálogo no disponible (${r.status}).`);const data=await r.json();const models=data.data.filter(m=>m.architecture?.output_modalities?.includes('text')||m.architecture?.modality?.endsWith('text')).sort((a,b)=>a.id.localeCompare(b.id));
    state.aiModels=new Map(models.map(m=>[m.id,m]));
    put('ai-model',node('option',{value:''},'Selecciona un modelo'),models.map(m=>node('option',{value:m.id},`${m.name} · ${m.id}`)));status('ai-status',`${models.length} modelos del catálogo. Consultar puede consumir saldo según el modelo.`);
  }catch(error){status('ai-status',error.message,true);}finally{$('load-models').disabled=false;}
}
let aiController;
async function askAI(){
 const key=$('api-key').value.trim(),model=$('ai-model').value,question=$('ai-question').value.trim();
 if(!key||!model||!question){status('ai-status','Introduce la clave, selecciona un modelo y escribe una pregunta.',true);return;}
 if(!state.valid){status('ai-status','Corrige primero el escenario nacional.',true);return;}
 const maxTokens=Number($('ai-max-tokens').value);
 aiController=new AbortController();$('ask-ai').disabled=true;$('cancel-ai').hidden=false;$('ai-answer').textContent='';
 const started=Date.now(),timer=setInterval(()=>status('ai-status','El proveedor sigue procesando la consulta · '+Math.floor((Date.now()-started)/1000)+' segundos. Puedes cancelarla.'),1000);
 status('ai-status','Enviando la consulta y el escenario seleccionado…');
 const context={targets:state.targets,targetDenominator:'candidateVotes',seats:state.central.counts,groups:state.central.groups,seatBasis:'2026',assumptions:scenarioExport().assumptions,province:state.local?{name:state.local.name,votes:state.local.votes,blankVotes:state.local.blankVotes,basis:$('province-basis').value,denominator:'provincial valid votes',note:'Proyección territorial histórica ajustada; no encuesta provincial actual.'}:null};
 try{const result=await consultAI({key,model,question,context,maxTokens,metadata:state.aiModels?.get(model)||{},signal:AbortSignal.any([aiController.signal,AbortSignal.timeout(120000)])});$('ai-answer').textContent=result.text;status('ai-status',result.truncated?'Respuesta incompleta: el modelo alcanzó el límite de tokens. Puedes ampliar el límite para otra consulta.':'Respuesta de '+model+'. Contrástala con los cálculos de la app.');
 }catch(error){status('ai-status',error.message,true);}finally{clearInterval(timer);$('ask-ai').disabled=false;$('cancel-ai').hidden=true;aiController=null;}
}
async function initialize(){try{
  // Remove keys saved by the previous version when opening the same local origin.
  try{localStorage.removeItem('openrouter_api_key');localStorage.removeItem('openrouter_model');}catch{}
  [state.official,state.references,state.catalog,state.territory,state.diagnostics]=await Promise.all([getJSON('./data/official-2023.json'),getJSON('./data/references.json'),getJSON('./data/polls.json'),getJSON('./data/territory.json'),getJSON('./data/evaluation.json')]);validateOfficial(state.official);validateCatalog(state.catalog);
  refreshEstimate();$('local-sigma').value=state.diagnostics.recommendedSensitivity.localSigma;renderObservatory();renderPolls(state.catalog.polls);
  put('province-select',state.official.provinces.toSorted((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>node('option',{value:p.id},p.name)));$('province-select').value='28';resetProvince();
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
  $('use-reference').addEventListener('click',()=>{$('preset').value='base';applyPreset();switchTab('scenarios');});
  $('use-official').addEventListener('click',()=>{$('province-basis').value='official';resetProvince();switchTab('province');});
  $('apply-preset').addEventListener('click',applyPreset);$('run-simulation').addEventListener('click',startSimulation);$('cancel-simulation').addEventListener('click',cancelSimulation);
  for(const id of ['national-sigma','local-sigma','runs','seed'])$(id).addEventListener('input',invalidateSimulation);
  for(const id of ['province-select','province-basis'])$(id).addEventListener('change',resetProvince);
  $('reset-province').addEventListener('click',resetProvince);$('province-form').addEventListener('submit',e=>{e.preventDefault();try{readLocalInputs();renderProvince();put('transfer-result');}catch(error){status('province-status',error.message,true);}});
  $('transfer-form').addEventListener('submit',compareTransfer);$('transfer-form').addEventListener('input',()=>put('transfer-result'));$('export-province').addEventListener('click',csvProvince);
  $('province-form').addEventListener('input',()=>{$('export-province').disabled=true;status('province-status','Hay cambios pendientes. Recalcula el reparto antes de exportar.');put('transfer-result');});
  $('export-scenario').addEventListener('click',()=>{clearTimeout(centralTimer);updateCentral();if(state.valid)download('escenario-electoral.json',scenarioExport());});$('export-simulation').addEventListener('click',()=>download('simulaciones-electorales.json',scenarioExport()));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.estimate.calculatedAt!==madridDate()){refreshEstimate();renderObservatory();renderPolls(state.catalog.polls);}});$('update-polls').addEventListener('click',updatePublishedCatalog);$('poll-import').addEventListener('change',importPolls);renderPolls(state.catalog.polls);getJSON('./data/update-status.json').then(renderSearchReport).catch(()=>{});
  $('open-ai').addEventListener('click',()=>$('ai-dialog').showModal());$('clear-key').addEventListener('click',()=>{$('api-key').value='';status('ai-status','Clave borrada de esta sesión.');});$('load-models').addEventListener('click',loadModels);$('ask-ai').addEventListener('click',askAI);$('cancel-ai').addEventListener('click',()=>aiController?.abort());installTooltips();enhanceParameterHelp(document);
  state.microRender=await initializeMicrodata({official:state.official,getEstimate:()=>state.estimate});$('loading').hidden=true;$('application').hidden=false;
}catch(error){$('loading').hidden=true;$('app-error').hidden=false;$('app-error').textContent=`No se puede iniciar el observatorio: ${error.message}. Comprueba la conexión y vuelve a cargar. Si lo usas en local, arranca con EJECUTAR.bat o npm start.`;}}
initialize();
