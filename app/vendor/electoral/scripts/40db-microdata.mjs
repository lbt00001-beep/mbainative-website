import {inflateRawSync} from 'node:zlib';
import {parseFragment} from 'parse5';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {validateMicrodata} from '../assets/microdata.mjs';
import {technicalMetadata,extractPdf} from './poll-adapters.mjs';
import {identifyMethodology} from '../assets/methodology.mjs';
import {readPdf} from './pdf-reader.mjs';
import {atomicWrite} from './catalog-store.mjs';

// ZIP entries stay in memory. Bound both compressed and expanded sizes.
export function zipEntries(buffer){
 if(buffer.length<22||buffer.length>20000000)throw Error('ZIP inválido o demasiado grande.');
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0||buffer.readUInt16LE(end+4)||buffer.readUInt16LE(end+6))throw Error('ZIP no compatible.');
 const count=buffer.readUInt16LE(end+10);if(count>200)throw Error('Demasiadas entradas ZIP.');
 let offset=buffer.readUInt32LE(end+16),expanded=0;const result=new Map();
 for(let n=0;n<count;n++){
  if(offset+46>buffer.length||buffer.readUInt32LE(offset)!==0x02014b50)throw Error('Directorio ZIP inválido.');
  const flags=buffer.readUInt16LE(offset+8),method=buffer.readUInt16LE(offset+10),size=buffer.readUInt32LE(offset+20),plain=buffer.readUInt32LE(offset+24),nl=buffer.readUInt16LE(offset+28),extra=buffer.readUInt16LE(offset+30),comment=buffer.readUInt16LE(offset+32),local=buffer.readUInt32LE(offset+42);
  if(offset+46+nl+extra+comment>buffer.length)throw Error('Directorio ZIP truncado.');
  const name=buffer.subarray(offset+46,offset+46+nl).toString('utf8');offset+=46+nl+extra+comment;expanded+=plain;
  if(expanded>60000000||plain>20000000||flags&1||![0,8].includes(method)||local+30>buffer.length||buffer.readUInt32LE(local)!==0x04034b50||result.has(name))throw Error('Entrada ZIP inválida o expansión excesiva.');
  const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);if(start+size>buffer.length)throw Error('Entrada ZIP truncada.');
  const raw=buffer.subarray(start,start+size),bytes=method===0?raw:inflateRawSync(raw,{maxOutputLength:20000000});if(bytes.length!==plain)throw Error('Tamaño ZIP inconsistente.');result.set(name,bytes);
 }return result;
}
const textNode=n=>(n.value||'')+(n.childNodes||[]).map(textNode).join('');
const xmlText=s=>textNode(parseFragment(s.replace(/<\/?(?:t|r|rPr|si)\b[^>]*>/g,'')));
export function xlsxRows(buffer){
 const files=zipEntries(buffer),sheet=files.get('xl/worksheets/sheet1.xml')?.toString('utf8'),strings=files.get('xl/sharedStrings.xml')?.toString('utf8')||'';
 if(!sheet||/<!DOCTYPE|<!ENTITY/i.test(sheet+strings))throw Error('Excel no compatible.');
 const shared=[...strings.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m=>xmlText(m[1]));if(shared.length>50000)throw Error('Demasiadas etiquetas.');
 const rows=[];for(const row of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)){
  const values=[];for(const c of row[1].matchAll(/<c\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/c>)/g)){
   if(/<f\b/.test(c[2]||''))throw Error('Microdatos Excel con fórmulas: requiere revisión.');
   const address=c[1].match(/\br="([A-Z]+)\d+"/)?.[1];if(!address)throw Error('Columna Excel inválida.');
   let column=0;for(const ch of address)column=column*26+ch.charCodeAt(0)-64;if(column>100)throw Error('Demasiadas columnas.');
   const type=c[1].match(/\bt="([^"]+)"/)?.[1],raw=c[2]?.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
   if(type==='s'){const i=Number(raw);if(!Number.isInteger(i)||!Object.hasOwn(shared,i))throw Error('Etiqueta Excel inválida.');values[column-1]=shared[i];}
   else if(type==='inlineStr')values[column-1]=xmlText(c[2]||'');
   else if(raw!==undefined){if(!Number.isFinite(Number(raw)))throw Error('Valor Excel no numérico.');values[column-1]=Number(raw);}else values[column-1]='';
  }rows.push(values);if(rows.length>50001)throw Error('Muestra excesiva.');
 }
 const [headers,...data]=rows;if(!headers?.length||new Set(headers).size!==headers.length)throw Error('Cabeceras Excel inválidas.');
 return data.filter(r=>r.some(v=>v!==''&&v!=null)).map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]])));
}
const parties={PSOE:'psoe',PP:'pp',Vox:'vox','Sumar/Frente Amplio':'sumar',Podemos:'podemos','Se acabó la fiesta':'salf',ERC:'erc',JxCAT:'junts','EAJ':'pnv','EH Bildu':'bildu','Coalición Canaria':'cc','Nueva Canarias':'nc',BNG:'bng',CUP:'cup','España Vaciada':'ev',UPN:'upn',UPL:'upl','Adelante Andalucía':'aa',Otro:'others'};
function category(value,kind){
 const s=String(value??'').trim();
 if(/^No votaría$/.test(s)||/^No voté$/.test(s))return 'abstention';if(/^Votaría en blanco$|^Voté en blanco$/.test(s))return 'blank';if(/^Votaría nulo$|^Voté nulo$/.test(s))return 'null';
 if(/^No lo sé$/.test(s))return kind==='recall'?'norecall':'undecided';if(/^Prefiero no contestar$/.test(s))return 'noanswer';if(/^No tenía edad para votar$/.test(s))return 'underage';
 if(/^Sumar\/Frente Amplio \+ Podemos$/.test(s))return 'sumar';if(/^Sumar$/.test(s))return 'sumar';
 for(const [name,id]of Object.entries(parties))if(s===name||s.startsWith(name+' (')||s.startsWith(name+' –')||s.startsWith(name+' -'))return id;
 throw Error('Categoría 40dB no reconocida: '+s.slice(0,70));
}
export function aggregate40db(rows,meta,pages,note){
 const ft=technicalMetadata(pages.join(' ').replace(/\s+/g,' '),meta.publishedAt);
 if(!ft.sample||ft.sample!==rows.length||!ft.fieldworkEnd||ft.fieldworkEnd>meta.publishedAt||!/40dB\.es/.test(pages.join(' '))||!/panelistas|CINT/i.test(note)||!/ponde/.test(note))throw Error('No coinciden la ficha, la muestra y la nota metodológica.');
 const method=identifyMethodology(note,meta.sourceUrl);if(method.recruitment!=='panel'||method.quotas!=='documented'||method.weighting!=='documented')throw Error('Metodología 40dB no reconocida.');
 const published=extractPdf(pages,meta.reportUrl,{today:meta.publishedAt,publishedAt:meta.publishedAt});if(published.status!=='extracted')throw Error('Estimación publicada no reconocida.');
 const labels={...Object.fromEntries(Object.entries(parties).map(([name,id])=>[id,name])),blank:'Blanco',null:'Voto nulo',abstention:'No votaría / no votó',undecided:'No sabe',noanswer:'No contesta',norecall:'No recuerda',underage:'No tenía edad'};
 const dimensions={total:'Total nacional',age:'Edad',sex:'Sexo',sexAge:'Sexo y edad',education:'Educación',employment:'Situación laboral',socialClass:'Clase social',ideology:'Ideología (0 izquierda, 10 derecha)',recall:'Recuerdo de voto 2023'};
 const build=question=>{
  const cells=new Map();for(const row of rows){
   const required=['sexo','edad','edad_r','educacion_r','situacion_laboral_r','clase_social_r','p1',question,'p9','p10','ponde'];if(required.some(k=>row[k]===undefined))throw Error('Faltan variables 40dB.');
   const w=Number(row.ponde),age=Number(row.edad);if(!Number.isFinite(w)||w<=0||w>100||!Number.isInteger(age)||age<18||age>120||!['Hombre','Mujer'].includes(row.sexo))throw Error('Peso, edad o sexo incompatibles.');
   const intent=category(row[question],'intent'),recall=category(row.p9,'recall'),turn=String(row.p1).match(/^(10|[0-9])(?:\s|$)/)?.[1]||'No disponible',ideology=String(row.p10).match(/^(10|[0-9])(?:\s|$)/)?.[1]||'No disponible';
   const ageGroup=age<=24?'18–24':age<=34?'25–34':age<=44?'35–44':age<=54?'45–54':age<=64?'55–64':'65 o más';
   for(const [dimension,group]of [['total','Total'],['age',ageGroup],['sex',row.sexo],['sexAge',row.sexo+' · '+ageGroup],['education',row.educacion_r],['employment',row.situacion_laboral_r],['socialClass',row.clase_social_r],['ideology',ideology],['recall',recall]]){
    const key=JSON.stringify([dimension,group,recall,intent,turn]),c=cells.get(key)||{dimension,group,recall,intent,turnout:turn,n:0,w:0,w2:0};c.n++;c.w+=w;c.w2+=w*w;cells.set(key,c);
   }
  }return [...cells.values()];
 };
 const cells=build('p2'),total=cells.filter(c=>c.dimension==='total'),weight=total.reduce((s,c)=>s+c.w,0);
 if(Math.abs(weight-rows.length)>rows.length*.01)throw Error('Los pesos no reproducen la muestra.');
 const directPages=pages.filter(p=>/Intención de voto/.test(p)&&/población general/.test(p)&&!/candidatura unitaria|llegaran a un/.test(p)&&/Sumar\s*\/\s*Frente Amplio/.test(p));
 if(directPages.length!==1)throw Error('Tabla de intención directa 40dB no reconocida.');
 const publishedDirect=[...directPages[0].matchAll(/\b(\d{1,2},\d)\b/g)].slice(0,6).map(m=>Number(m[1].replace(',','.'))),directIds=['psoe','pp','vox','sumar','salf','podemos'];
 if(publishedDirect.length!==6||directIds.some((id,i)=>Math.abs(100*total.filter(c=>c.intent===id).reduce((s,c)=>s+c.w,0)/weight-publishedDirect[i])>.051))throw Error('Los microdatos no reproducen la intención directa publicada.');
 const data=validateMicrodata({...meta,schemaVersion:1,institute:'40dB',study:'40db-'+ft.fieldworkEnd.replaceAll('-',''),title:'40dB · '+(/flash/i.test(pages[0])?'encuesta flash':'barómetro')+' · '+ft.fieldworkEnd,...ft,weight:'ponde · raking demográfico publicado',variables:{intent:'P2',recall:'P9',turnout:'P1',sex:'sexo',age:'edad',education:'educacion_r',socialClass:'clase_social_r',ideology:'P10',weight:'ponde'},labels,dimensions,cells,publishedEstimate:published.poll.values,methodology:method,note:'Panel CINT con cuotas y ponderación demográfica. Excluye Ceuta y Melilla. Clase social no equivale a renta. Agregados sin identificadores; alternativas exploratorias no calibradas.'});
 if(rows.every(r=>r.p5!==undefined))data.alternatives=[{id:'joint',title:'Sumar/Frente Amplio + Podemos juntos',cells:build('p5'),variables:{...data.variables,intent:'P5'},labels:{...labels,sumar:'Sumar/Frente Amplio + Podemos'},publishedEstimate:null}];
 return data;
}
export async function update40db({root,catalog,report,archives,fetchDocument}){
 const file=path.join(root,'data/microdata-library.json');let library;try{library=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;library={schemaVersion:1,studies:[],candidates:[],issues:[]};}
 report.microdata=[];report.metadataUpdates=[];
 for(const meta of [...new Map(archives.map(m=>[m.sourceUrl,m])).values()].slice(0,8))try{
  const bytes=await fetchDocument(meta.sourceUrl,true),hash=createHash('sha256').update(bytes).digest('hex');
  let data=library.studies.find(s=>s.sha256===hash&&s.institute==='40dB');const unchanged=!!data;
  if(!data){
   const files=zipEntries(bytes),one=re=>{const matches=[...files].filter(([n])=>re.test(n));if(matches.length!==1)throw Error('Archivo 40dB ambiguo o incompleto.');return matches[0];};
   const [,xlsx]=one(/Datos.*\.xlsx$/i),[noteName,note]=one(/Nota_metodologica.*\.pdf$/i),[reportName,pdf]=one(/Informe.*\.pdf$/i);one(/Cuestionario.*\.pdf$/i);
   const dir=path.join(root,'research/automatic');await mkdir(dir,{recursive:true});const pdfFile=path.join(dir,hash+'-report.pdf'),noteFile=path.join(dir,hash+'-method.pdf');await writeFile(pdfFile,pdf);await writeFile(noteFile,note);
   const [parsed,method]=await Promise.all([readPdf(pdfFile),readPdf(noteFile)]);
   data=aggregate40db(xlsxRows(xlsx),{...meta,sha256:hash,technicalUrl:meta.sourceUrl,questionnaireUrl:meta.sourceUrl,technicalDocument:noteName,reportDocument:reportName,importedAt:new Date().toISOString()},parsed.pages,method.pages.join('\n'));
  }
  const poll=catalog.polls.find(p=>p.institute==='40dB'&&p.fieldworkEnd===data.fieldworkEnd);
  if(poll){if(poll.sample!==data.sample||Object.entries(data.publishedEstimate).some(([id,v])=>Math.abs(poll.values[id]-v)>.051))throw Error('Microdatos y estimación incorporada no coinciden.');
   if(JSON.stringify(poll.methodology)!==JSON.stringify(data.methodology)){poll.methodology=data.methodology;poll.methodologySource={url:meta.sourceUrl,sha256:hash,document:data.technicalDocument};report.metadataUpdates.push(poll.id);}
  }
  if(!unchanged)library.studies=[...library.studies.filter(s=>s.study!==data.study),data].sort((a,b)=>b.fieldworkEnd.localeCompare(a.fieldworkEnd)).slice(0,12);
  report.microdata.push({study:data.study,institute:'40dB',sourceUrl:meta.sourceUrl,status:unchanged?'known':'incorporated',sample:data.sample,fieldworkEnd:data.fieldworkEnd});
 }catch(e){report.microdata.push({sourceUrl:meta.sourceUrl,status:'pending',reason:e.message});}
 if(report.microdata.some(r=>r.status==='incorporated'))await atomicWrite(file,JSON.stringify(library));
 return report;
}
