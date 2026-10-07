import {readFile,mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {inflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {parse} from 'parse5';
import {readPdf} from './pdf-reader.mjs';
import {withCatalogLock,atomicWrite} from './catalog-store.mjs';
import {validateMicrodata} from '../assets/microdata.mjs';

const HOME='https://www.cis.es/es/';
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function officialUrl(value){const u=new URL(value);if(u.protocol!=='https:'||u.hostname!=='www.cis.es'||u.port||u.username||u.password)throw Error('Solo se admiten documentos del CIS.');return u.href;}
async function retrieve(url,binary=false){
 for(let n=0;n<4;n++){
  url=officialUrl(url);const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'User-Agent':'ObservatorioElectoral/3.4 (fuentes publicas)'}});
  if(response.status>=300&&response.status<400){url=new URL(response.headers.get('location'),url).href;continue;}
  if(!response.ok)throw Error('CIS: HTTP '+response.status);
  let size=0;const chunks=[];for await(const chunk of response.body){size+=chunk.length;if(size>(binary?20000000:4000000))throw Error('El documento supera el tamaño admitido.');chunks.push(chunk);}
  const buffer=Buffer.concat(chunks);return binary?buffer:buffer.toString('utf8');
 }throw Error('Demasiadas redirecciones del CIS.');
}
export function documentLinks(html,base){
 const result=[],text=node=>(node.value||'')+(node.childNodes||[]).map(text).join('');
 function visit(node){if(node.tagName==='a'){const href=node.attrs?.find(a=>a.name==='href')?.value;try{result.push({url:officialUrl(new URL(href,base).href),title:text(node).replace(/\s+/g,' ').trim()});}catch{}}for(const child of node.childNodes||[])visit(child);}
 visit(parse(html));
 // CIS also publishes downloads in data-file elements and JSON-LD distributions.
 for(const match of html.matchAll(/https:\/\/www\.cis\.es\/documents\/\d+\/\d+\/(?:MD|FT|cues)\d{4}\.(?:zip|pdf)/gi))result.push({url:officialUrl(match[0]),title:'Documento oficial'});
 return [...new Map(result.map(x=>[x.url,x])).values()];
}
// Read only stored/deflated CSV entries. No paths from an archive are extracted to disk.
export function csvFromZip(buffer,study,depth=0){
 if(buffer.length<22||buffer.length>20000000||depth>1)throw Error('ZIP inválido o demasiado grande.');
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0||buffer.readUInt16LE(end+4)||buffer.readUInt16LE(end+6))throw Error('ZIP no compatible.');
 const count=buffer.readUInt16LE(end+10);let offset=buffer.readUInt32LE(end+16),expanded=0;const matches=[];
 if(count>200)throw Error('Demasiadas entradas ZIP.');
 for(let n=0;n<count;n++){
  if(offset+46>buffer.length||buffer.readUInt32LE(offset)!==0x02014b50)throw Error('Directorio ZIP inválido.');
  const flags=buffer.readUInt16LE(offset+8),method=buffer.readUInt16LE(offset+10),size=buffer.readUInt32LE(offset+20),plain=buffer.readUInt32LE(offset+24),nameLength=buffer.readUInt16LE(offset+28),extra=buffer.readUInt16LE(offset+30),comment=buffer.readUInt16LE(offset+32),local=buffer.readUInt32LE(offset+42);
  const name=buffer.subarray(offset+46,offset+46+nameLength).toString('utf8');offset+=46+nameLength+extra+comment;expanded+=plain;
  if(expanded>100000000||plain>60000000)throw Error('Expansión ZIP excesiva.');
  const csv=new RegExp('(?:^|/)'+study+'_etiq\\.csv$','i').test(name),nested=new RegExp('(?:^|/)'+study+'csv\\.zip$','i').test(name);
  if(!csv&&!nested)continue;
  if(flags&1||![0,8].includes(method)||local+30>buffer.length||buffer.readUInt32LE(local)!==0x04034b50)throw Error('Entrada ZIP no compatible.');
  const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);if(start+size>buffer.length)throw Error('Entrada ZIP truncada.');
  const raw=buffer.subarray(start,start+size),bytes=method===0?raw:inflateRawSync(raw,{maxOutputLength:60000000});if(bytes.length!==plain)throw Error('Tamaño ZIP inconsistente.');
  if(csv)matches.push(bytes);else matches.push(csvFromZip(bytes,study,depth+1));
 }
 if(matches.length!==1)throw Error('No hay un único CSV etiquetado compatible.');return matches[0];
}
export function parseCsv(text){
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===';'||c==='\n')){row.push(value.replace(/\r$/,''));value='';if(c==='\n'){if(row.some(Boolean))rows.push(row);row=[];}}else value+=c;}
 if(quoted)throw Error('CSV con comillas sin cerrar.');if(value||row.length){row.push(value.replace(/\r$/,''));rows.push(row);}if(rows.length>50001)throw Error('Muestra excesiva.');return rows;
}
const RESPONSES={'PSOE':'psoe','PSOE/PSC':'psoe','PP':'pp','VOX':'vox','Sumar':'sumar','Podemos':'podemos','Se Acabó la Fiesta':'salf','ERC':'erc','Junts':'junts','EH Bildu':'bildu','EAJ-PNV':'pnv','BNG':'bng','CCa':'cc','UPN':'upn','PACMA':'pacma','Adelante Andalucía':'aa','Otro partido':'others','En blanco':'blank','Voto nulo':'null','Nulo':'null','No votaría':'abstention','No votó':'abstention','No sabe todavía':'undecided','N.C.':'noanswer','N.R.':'norecall','No tenía edad':'underage','No tenía derecho a voto':'ineligible'};
export function aggregateCsv(bytes,metadata,technical){
 let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw Error('Codificación CSV no reconocida: requiere revisión.');}
 const [headers,...rows]=parseCsv(text.replace(/^\uFEFF/,'')),keys=Object.fromEntries(headers.map((h,i)=>[h.split(':')[0],i]));
 const required=['INTENCIONGR','RECUERDO','PROBVOTO','SEXO','EDAD','INGRESHOG','ESCIDEOL','PESO'];if(required.some(k=>keys[k]===undefined))throw Error('Faltan variables compatibles para este laboratorio.');
 if(!/generales.*2023/.test(normalize(headers[keys.RECUERDO]))||!normalize(headers[keys.INTENCIONGR]).includes('elecciones generales'))throw Error('El recuerdo o la intención no corresponden a las generales de referencia.');
 const ft=technical.replace(/\s+/g,' '),sample=Number(ft.match(/Realizada:\s*([\d.]+)\s*entrevistas/i)?.[1]?.replaceAll('.',''));
 const months='enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' '),dates=ft.match(/Del\s+(\d+)\s+al\s+(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/i);
 if(!new RegExp('(?:N[º°o]?\\.?\\s*|ESTUDIO\\s+)'+metadata.study+'\\b','i').test(ft)||!normalize(ft).includes('ambito: nacional')||!dates||!months.includes(dates[3].toLowerCase())||sample!==rows.length||sample<1000)throw Error('La ficha técnica, el estudio y la muestra no se han podido contrastar.');
 const prefix=dates[4]+'-'+String(months.indexOf(dates[3].toLowerCase())+1).padStart(2,'0')+'-',start=prefix+dates[1].padStart(2,'0'),end=prefix+dates[2].padStart(2,'0');
 if(start>end||end>new Date().toISOString().slice(0,10)||start<'2023-07-24'||[start,end].some(d=>!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d))throw Error('Fechas de campo incompatibles.');
 const cells=new Map(),labels={...Object.fromEntries(Object.entries(RESPONSES).map(([k,v])=>[v,k]))};
 const category=value=>{if(Object.hasOwn(RESPONSES,value))return RESPONSES[value];if(/^\d{1,3}$/.test(value)){const id='unidentified'+value;labels[id]='Categoría '+value+' sin identificar';return id;}throw Error('Categoría nueva sin correspondencia: '+value.slice(0,60)+'. Requiere revisión.');};
 for(const row of rows){if(row.length!==headers.length)throw Error('Fila CSV incompatible.');const v=k=>row[keys[k]],age=Number(v('EDAD')),w=Number(v('PESO').replace(',','.'));if(!Number.isInteger(age)||age<18||age>120||!Number.isFinite(w)||w<=0||w>100)throw Error('Edad o peso inválidos.');
  const group=age<=24?'18–24':age<=34?'25–34':age<=44?'35–44':age<=54?'45–54':age<=64?'55–64':'65 o más',intent=category(v('INTENCIONGR')),recall=category(v('RECUERDO')),turn=v('PROBVOTO').match(/^(10|[0-9])(?:\s|$)/)?.[1]||'No disponible',ideology=v('ESCIDEOL').match(/^(10|[1-9])(?:\s|$)/)?.[1]||v('ESCIDEOL');
  for(const [dimension,g]of [['total','Total'],['age',group],['sex',v('SEXO')],['sexAge',v('SEXO')+' · '+group],['income',v('INGRESHOG')],['ideology',ideology],['recall',recall]]){const key=JSON.stringify([dimension,g,recall,intent,turn]),cell=cells.get(key)||{dimension,group:g,recall,intent,turnout:turn,n:0,w:0,w2:0};cell.n++;cell.w+=w;cell.w2+=w*w;cells.set(key,cell);}
 }
 return validateMicrodata({...metadata,schemaVersion:1,sample,fieldworkStart:start,fieldworkEnd:end,weight:'PESO publicado por el CIS',variables:Object.fromEntries(required.map(k=>[({INTENCIONGR:'intent',RECUERDO:'recall',PROBVOTO:'turnout',SEXO:'sex',EDAD:'age',INGRESHOG:'income',ESCIDEOL:'ideology',PESO:'weight'})[k],headers[keys[k]]])),labels,dimensions:{total:'Total nacional',age:'Edad',sex:'Sexo',sexAge:'Sexo y edad',income:'Ingresos del hogar',ideology:'Ideología (1 izquierda, 10 derecha)',recall:'Recuerdo de voto 2023'},note:'Agregados de entrevistas anonimizadas. Las categorías numéricas sin etiqueta se conservan sin asignarlas a partidos. No se utiliza la estimación electoral del CIS.',cells:[...cells.values()]});
}
export function createMicrodataService({root,origin,fetchDocument=retrieve,pdfText=async bytes=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'cis-micro-'));try{const file=path.join(dir,'ficha.pdf');await writeFile(file,bytes);return (await readPdf(file)).pages.join('\n');}finally{await rm(dir,{recursive:true,force:true});}
},now=Date.now}){
 const file=path.join(root,'data/microdata-library.json');let running=false,lastSearch=0;
 async function library(){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return {schemaVersion:1,studies:[],candidates:[],checkedAt:null,issues:[]};throw e;}}
 return async request=>{
  if(request.method==='GET')return {status:200,body:await library()};
  if(request.method!=='POST')return {status:405,body:{error:'Usa GET o POST.'}};
  if(request.origin!==origin)return {status:403,body:{error:'Origen no permitido.'}};
  if(request.bytes>1024)return {status:413,body:{error:'Solicitud demasiado grande.'}};
  const {action,study}=request.payload||{};if(!['search','import'].includes(action)||action==='import'&&!/^\d{4}$/.test(study||''))return {status:400,body:{error:'Selecciona una acción y un estudio válido.'}};
  if(running)return {status:409,body:{error:'Hay otra consulta de microdatos en curso.'}};
  if(action==='search'&&lastSearch&&now()-lastSearch<120000)return {status:200,body:{...await library(),cached:true}};
  running=true;
  try{return await withCatalogLock(root,async()=>{
   const catalog=await library();await mkdir(path.dirname(file),{recursive:true});
   if(action==='search'){
    const html=await fetchDocument(HOME),pages=[...new Set([...documentLinks(html,HOME).filter(x=>/\/estudios\//.test(x.url)&&/barometro/.test(normalize(x.title))).map(x=>x.url),'https://www.cis.es/es/estudios/barometro-de-septiembre-2026',...catalog.studies.map(x=>x.studyUrl)])].slice(0,8),candidates=[],issues=[];
    for(const url of pages)try{const page=await fetchDocument(url),all=documentLinks(page,url),zip=all.find(x=>/\/MD\d{4}\.zip(?:\?|$)/i.test(x.url));if(!zip){issues.push({url,error:'Sin ZIP de microdatos reconocido.'});continue;}const id=zip.url.match(/MD(\d{4})\.zip/i)[1],technical=all.find(x=>new RegExp('/FT'+id+'\\.pdf(?:\\?|$)','i').test(x.url)),questionnaire=all.find(x=>new RegExp('/cues'+id+'\\.pdf(?:\\?|$)','i').test(x.url)),title=page.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s*[-|]\s*CIS.*$/i,'').trim()||'Barómetro CIS '+id;
     if(!technical||!questionnaire)throw Error('Faltan ficha técnica o cuestionario.');candidates.push({study:id,title,studyUrl:url,sourceUrl:zip.url,technicalUrl:technical.url,questionnaireUrl:questionnaire.url});
    }catch(e){issues.push({url,error:e.message});}
    if(!candidates.length)throw Error('No se ha podido comprobar ningún fichero de microdatos. Se conserva la búsqueda anterior.');
    const result={...catalog,candidates:[...new Map(candidates.map(x=>[x.study,x])).values()].sort((a,b)=>Number(b.study)-Number(a.study)),checkedAt:new Date(now()).toISOString(),issues};await atomicWrite(file,JSON.stringify(result));lastSearch=now();return {status:200,body:result};
   }
   const candidate=catalog.candidates.find(x=>x.study===study);if(!candidate)return {status:400,body:{error:'Primero busca y selecciona un estudio localizado en el CIS.'}};
   const [zip,ft]=await Promise.all([fetchDocument(candidate.sourceUrl,true),fetchDocument(candidate.technicalUrl,true)]),sha256=createHash('sha256').update(zip).digest('hex');
   const existing=catalog.studies.find(x=>x.study===study);if(existing?.sha256===sha256)return {status:200,body:{...catalog,selectedStudy:study,unchanged:true}};
   const data=aggregateCsv(csvFromZip(zip,study),{...candidate,sha256,importedAt:new Date(now()).toISOString()},await pdfText(ft));
   const result={...catalog,studies:[...catalog.studies.filter(x=>x.study!==study),data].sort((a,b)=>b.fieldworkEnd.localeCompare(a.fieldworkEnd)).slice(0,12)};await atomicWrite(file,JSON.stringify(result));return {status:200,body:{...result,selectedStudy:study}};
  });}catch(e){return {status:422,body:{error:e.message+' Los estudios incorporados se conservan.'}};}finally{running=false;}
 };
}
