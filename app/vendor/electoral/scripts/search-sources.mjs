import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validateCatalog,estimate} from '../assets/polling.mjs';
import {ADAPTER_VERSION,articleDocument,extractArticle,extractPdf,canonical} from './poll-adapters.mjs';
import {readPdf} from './pdf-reader.mjs';
import {extractCis} from './cis-adapter.mjs';
import {withCatalogLock,commitCatalog,atomicWrite} from './catalog-store.mjs';
import {estimateForDate} from '../assets/freshness.mjs';
import {originalReports} from './original-reports.mjs';
import {update40db} from './40db-microdata.mjs';

const defaultRoot=fileURLToPath(new URL('../',import.meta.url));
const feeds=[
 ['GAD3','https://www.gad3.com/feed/'],['Sigma Dos','https://www.sigmados.com/feed/'],
 ['ElectoPanel','https://electomania.es/feed/'],['More in Common','https://moreincommon.es/'],
 ['40dB / EL PAÍS','https://elpais.com/espana/'],['40dB / Cadena SER','https://cadenaser.com/tag/encuestas/a/'],['Ateneo / elDiario','https://www.eldiario.es/politica/'],
 ['SocioMétrica / EL ESPAÑOL','https://www.elespanol.com/espana/politica/'],
 ['DYM / 20minutos','https://www.20minutos.es/nacional/'],['Target Point / El Debate','https://www.eldebate.com/espana/'],
 ['Hamalgama / Vozpópuli','https://www.vozpopuli.com/espana'],['Data10 / OKDIARIO','https://okdiario.com/espana'],
 ['InvyMark / laSexta','https://www.lasexta.com/noticias/nacional/'],
 ['Celeste-Tel / Onda Cero','https://www.ondacero.es/noticias/espana/'],
 ['NC Report / La Razón','https://www.larazon.es/espana/'],['Winston / Artículo14','https://www.articulo14.es/politica/']
];
const hosts=new Set([...feeds.map(([,u])=>new URL(u).hostname),'www.cis.es','ep00.epimg.net','cadenaser.com']);
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#8217;',"'").replaceAll('&quot;','"').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function isPollPublication(link,feedUrl){
 const recognized=/sondeo|encuesta|bar[oó]metro|electopanel|pulso electoral/i.test(link.title);
 const serElection=feedUrl==='https://cadenaser.com/tag/encuestas/a/'&&new URL(link.url).pathname.startsWith('/nacional/')&&/escaños|mayor[ií]a|voto|elecciones/i.test(link.title);
 return (recognized||serElection)&&!/auton[oó]mic|municipal|alcald|asamblea|junta general|empresari|alemania|valència|valencia|andaluc|catalu|castilla|europea|internacional|argentin|francia|portugal|chile/i.test(link.title);
}
export function isOriginal40dbReport(url){const u=new URL(url);return u.hostname==='ep00.epimg.net'&&/^\/infografias\/encuestas40db\//.test(u.pathname)&&/informe_voto[^/]*\.pdf$/i.test(u.pathname);}
export function links(html,base){
 const found=[];
 for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  try{const u=new URL(decode(m[1]),base);if(u.protocol==='https:'&&u.hostname===new URL(base).hostname)found.push({url:u.href.split('#')[0],title:decode(m[2])});}catch{}
 }
 for(const item of html.matchAll(/<item\b[\s\S]*?<\/item>/gi)){
  const title=decode(item[0].match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'');
  const url=decode(item[0].match(/<link>([\s\S]*?)<\/link>/i)?.[1]||'');
  try{const u=new URL(url);if(u.protocol==='https:'&&u.hostname===new URL(base).hostname)found.push({url:u.href,title});}catch{}
 }
 return [...new Map(found.filter(x=>x.title).map(x=>[x.url,x])).values()];
}
async function retrieve(url,binary=false){
 for(let redirects=0;redirects<4;redirects++){
  const u=new URL(url);if(u.protocol!=='https:'||!hosts.has(u.hostname)||u.username||u.password||u.port)throw Error('Destino externo no permitido.');
  const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'ObservatorioElectoral/3.1 (consulta de fuentes publicas)'}});
  if(response.status>=300&&response.status<400){url=new URL(response.headers.get('location'),url).href;continue;}
  if(!response.ok)throw Error('HTTP '+response.status);
  const limit=binary?12000000:4000000,chunks=[];let bytes=0;
  for await(const chunk of response.body){bytes+=chunk.length;if(bytes>limit)throw Error('Documento demasiado grande.');chunks.push(chunk);}
  const buffer=Buffer.concat(chunks);return binary?buffer:buffer.toString('utf8');
 }throw Error('Demasiadas redirecciones.');
}
const extract=async(pdf,technical)=>extractCis((await readPdf(pdf)).pages.join('\n'),(await readPdf(technical)).pages.join('\n'));
async function mapLimited(items,fn,limit=4){const results=[];for(let i=0;i<items.length;i+=limit)results.push(...await Promise.all(items.slice(i,i+limit).map(fn)));return results;}

export function incorporatePoll(catalog,result,{hash,today,url}){
 if(!['known','extracted'].includes(result.status))return false;
 const poll=result.poll;
 if(result.status==='known')return false;
 const evidence={adapter:ADAPTER_VERSION,sha256:hash,checkedAt:today,fragments:result.evidence};
 const newPoll={...poll,extraction:evidence};
 const sameId=catalog.polls.find(p=>p.id===newPoll.id);
 if(sameId&&canonical(sameId.url)!==canonical(newPoll.url))throw Error('Conflicto de identidad de estudio; no se sobrescribe otra fuente.');
 const candidate={...catalog,polls:[...catalog.polls.filter(p=>p.id!==newPoll.id),newPoll],asOf:poll.publishedAt>catalog.asOf?poll.publishedAt:catalog.asOf};
 validateCatalog(candidate);
 catalog.polls=candidate.polls;catalog.asOf=candidate.asOf;return true;
}
async function processPublications(catalog,report,publications,today,root,depth=0){
 const deduped=[...new Map(publications.map(p=>[canonical(p.url),p])).values()],downloadedHashes=new Map();
 const fetched=await mapLimited(deduped,async p=>{
  try{const bytes=await retrieve(p.url,true),hash=createHash('sha256').update(bytes).digest('hex');const ext=bytes.subarray(0,5).toString()==='%PDF-'?'.pdf':'.html';
   const dir=path.join(root,'research/automatic');await mkdir(dir,{recursive:true});const file=path.join(dir,hash+ext);await writeFile(file,bytes);
   if(ext==='.pdf'){const {pages}=await readPdf(file);return {p,hash,result:extractPdf(pages,p.url,{today,catalog:catalog.polls,publishedAt:p.publishedAt})};}
   const html=bytes.toString('utf8'),result=extractArticle(html,p.url,{today,catalog:catalog.polls});return {p,hash,result,document:result.document||articleDocument(html,p.url)};
  }catch(e){return {p,result:{status:'pending',reason:e.message}};}
 });
 const follow=[];
 for(const {p,hash,result,document} of fetched){
  if(hash&&downloadedHashes.has(hash)){report.processed.push({...p,status:'duplicate',reason:'Mismo documento que '+downloadedHashes.get(hash)});continue;}
  if(hash)downloadedHashes.set(hash,p.url);
  const row={...p,status:result.status,verification:result.verification,matched:result.matched,expected:result.expected,reason:result.reason,sha256:hash,original:result.original};
  if(result.status==='extracted')try{
   const before=structuredClone(catalog);incorporatePoll(catalog,result,{hash,today,url:p.url});
   const official=JSON.parse(await readFile(path.join(root,'data/official-2023.json'),'utf8'));
   try{estimate(catalog,official);}catch(error){Object.assign(catalog,before);throw error;}
   row.status='incorporated';row.values=result.poll.values;row.fieldworkEnd=result.poll.fieldworkEnd;
   report.incorporated.push({url:p.url,institute:result.poll.institute,measure:'voteEstimate',id:result.poll.id});
  }catch(e){row.status='pending';row.reason='Validación rechazada: '+e.message;}
  report.processed.push(row);
  if(row.status==='pending')report.candidates.push(row);
  if(depth<2 && document && ['landing','context','pending'].includes(row.status)){
   // Resolve portals and summaries to original reports, not their quoted figures.
   for(const link of document.links){
    const host=new URL(link.url).hostname;
    if(/\/category\/|\/temas\/|cis|auton[oó]mic|andaluc|catalu/i.test(link.url+' '+link.title)||!hosts.has(host)||deduped.some(p=>canonical(p.url)===canonical(link.url)))continue;
    if(host==='ep00.epimg.net'&&/^\/infografias\/encuestas40db\//.test(new URL(link.url).pathname)&&/descargables\.zip$/i.test(new URL(link.url).pathname)&&document.publishedAt<=today){report.microdataTargets.push({sourceUrl:link.url,publishedAt:document.publishedAt,studyUrl:p.url,reportUrl:document.links.find(l=>isOriginal40dbReport(l.url))?.url});continue;}
    if((host==='moreincommon.es'&&/\/pdfs\/pulso-electoral\/.*\.pdf/.test(link.url))||isOriginal40dbReport(link.url)||(host==='elpais.com'&&/consulte-todos-los-datos-internos-de-la-encuesta/.test(link.url))||((['www.lasexta.com','www.20minutos.es','www.sigmados.com','www.gad3.com','electomania.es'].includes(host))&&/bar[oó]metro|estimaci[oó]n de voto|electopanel/i.test(link.title))){
     follow.push({...link,institute:p.institute,publishedAt:document.publishedAt});
    }
   }
  }
 }
 // At most two link hops: publisher -> download page -> original report.
 if(follow.length){
  const seen=new Set(report.processed.map(p=>canonical(p.url)));
  const unique=[...new Map(follow.map(p=>[canonical(p.url),p])).values()].filter(p=>!seen.has(canonical(p.url))).slice(0,20);
  if(unique.length)await processPublications(catalog,report,unique,today,root,depth+1);
 }
}
const partyIds={PP:'pp',PSOE:'psoe',VOX:'vox',Sumar:'sumar',Podemos:'podemos','Se Acabó la Fiesta':'salf',ERC:'erc',Junts:'junts','EAJ-PNV':'pnv','EH Bildu':'bildu',BNG:'bng',CCa:'cc',UPN:'upn','Adelante Andalucía':'aa','Aliança Catalana':'ac'};
export function searchSources({root=defaultRoot}={}){return withCatalogLock(root,()=>searchUnlocked(root));}
async function searchUnlocked(root){
 const originalText=await readFile(path.join(root,'data/polls.json'),'utf8'),catalog=JSON.parse(originalText);
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date());
 const report={checkedAt:new Date().toISOString(),sources:[],candidates:[],processed:[],incorporated:[],microdataTargets:[],note:'Extracción automática de originales HTML y PDF con formato reconocido. Se valida identidad, ámbito, fechas y porcentajes, y se conservan fuente, evidencia y huella del documento. Las guías, agregados, duplicados y estudios antiguos se clasifican sin contarlos como nuevos. Un bloqueo o formato ambiguo conserva los datos anteriores; la cobertura no es exhaustiva.'};
 const publications=[...catalog.polls.map(p=>({url:p.url,institute:p.institute,title:p.id})),...originalReports.filter(p=>p.publishedAt<=today&&(Date.parse(today)-Date.parse(p.publishedAt))/86400000<=60)];
 const known=new Set(catalog.polls.map(p=>p.url.replace(/\/$/,'')));
 await Promise.allSettled(feeds.map(async([name,url])=>{
  try{const html=await retrieve(url);const candidates=links(html,url).filter(x=>isPollPublication(x,url));
   report.sources.push({name,url,status:'ok',found:candidates.length});
   for(const c of candidates.slice(0,8))if(!known.has(c.url.replace(/\/$/,'')))publications.push({...c,institute:name});
  }catch(e){report.sources.push({name,url,status:'error',error:e.message});}
 }));
 await processPublications(catalog,report,publications,today,root);
 const archives=[...originalReports.filter(p=>p.microdataUrl&&p.publishedAt<=today&&(Date.parse(today)-Date.parse(p.publishedAt))/86400000<=60).map(p=>({sourceUrl:p.microdataUrl,publishedAt:p.publishedAt,studyUrl:p.publicationUrl,reportUrl:p.url})),...report.microdataTargets.filter(p=>p.reportUrl)];
 await update40db({root,catalog,report,archives,fetchDocument:retrieve});
 delete report.microdataTargets;
 for(const issue of report.microdata.filter(x=>x.status==='pending'))report.candidates.push({url:issue.sourceUrl,title:'Microdatos 40dB',institute:'40dB',reason:issue.reason});
 try{
  const home='https://www.cis.es/es/',html=await retrieve(home);
  const discovered=links(html,home).filter(x=>/\/estudios\//.test(x.url)&&/bar[oó]metro|pol[ií]tica fiscal|electoral/i.test(x.title));
  const studies=[...new Set([...discovered.map(x=>x.url),...(catalog.directSurveys||[]).map(x=>x.studyUrl)])].filter(Boolean).slice(0,8);
  report.sources.push({name:'CIS',url:home,status:'ok',found:discovered.length});
  await Promise.allSettled(studies.map(async url=>{
   try{
    const page=await retrieve(url),pdf=page.match(/https:\/\/www\.cis\.es\/documents\/\d+\/\d+\/es(\d+)mar\.pdf/),technical=page.match(/https:\/\/www\.cis\.es\/documents\/\d+\/\d+\/FT\d+\.pdf/);
    if(!pdf||!technical)throw Error('No se han encontrado resultados y ficha técnica.');
    const id=pdf[1],publishedAt=page.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/)?.[1];
    if(!publishedAt)throw Error('Fecha de disponibilidad desconocida.');
    const bytes=await retrieve(pdf[0],true),tech=await retrieve(technical[0],true);
    const hash=createHash('sha256').update(bytes).digest('hex'),dir=path.join(root,'research/automatic');await mkdir(dir,{recursive:true});
    const resultPath=path.join(dir,id+'-'+hash+'.pdf'),techPath=path.join(dir,'FT'+id+'.pdf');await writeFile(resultPath,bytes);await writeFile(techPath,tech);
    const tables=await extract(resultPath,techPath);
    const existing=(catalog.directSurveys||[]).find(x=>x.study===id);
    if(tables.fieldworkEnd>today||tables.fieldworkEnd>publishedAt||publishedAt>today)throw Error('Fechas CIS incompatibles.');
    const rows=tables.direct.rows;
    const record={id:'cis-direct-'+id,institute:'CIS',study:id,title:decode(page.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'Estudio CIS '+id),publishedAt:existing?.publishedAt||publishedAt,metadataDate:publishedAt,fieldworkStart:tables.fieldworkStart,fieldworkEnd:tables.fieldworkEnd,sample:tables.sample,verified:true,measure:'directVote',denominator:'surveyTotal',values:Object.fromEntries(Object.entries(rows).filter(([label])=>partyIds[label]).map(([label,v])=>[partyIds[label],v])),responses:Object.fromEntries(Object.entries(rows).filter(([label])=>!partyIds[label])),tables,question:tables.direct.code+' · respuestas sobre el total de la encuesta',url:pdf[0],technicalUrl:technical[0],studyUrl:url,sha256:hash,note:'Respuestas directas publicadas y recodificadas, con ponderación de muestra. Sin estimación electoral ni redistribución de indecisos. No entran en la media de estimaciones.'};
    catalog.directSurveys??=[];
    if(!existing||JSON.stringify(existing.tables)!==JSON.stringify(tables)){
     catalog.directSurveys=catalog.directSurveys.filter(x=>x.study!==id);catalog.directSurveys.push(record);report.incorporated.push({study:id,url:pdf[0],measure:'directVote'});
    }
    report.processed.push({institute:'CIS',url,title:record.title,status:'known',verification:'full',reason:'Pregunta directa y ficha técnica contrastadas; no se utiliza la estimación electoral.',sha256:hash});
   }catch(e){const existing=(catalog.directSurveys||[]).find(p=>p.studyUrl===url);const row={institute:'CIS',url,title:'Resultados directos CIS',status:existing?'retained':'pending',reason:e.message+(existing?' Se conserva el original revisado disponible.':'')};report.processed.push(row);report.candidates.push(row);}
  }));
 }catch(e){report.sources.push({name:'CIS',url:'https://www.cis.es/es/',status:'error',error:e.message});}
 validateCatalog(catalog);const official=JSON.parse(await readFile(path.join(root,'data/official-2023.json'),'utf8'));estimate(catalog,official);
 report.candidates=[...new Map(report.candidates.map(x=>[x.url,x])).values()];
 report.sources.sort((a,b)=>a.name.localeCompare(b.name));
 const current=estimateForDate(catalog,official,today),before=estimateForDate(JSON.parse(originalText),official,today);
 report.estimateChange={calculatedAt:today,before:before.values,after:current.values,changed:JSON.stringify(before.values)!==JSON.stringify(current.values),note:'Mismo día de cálculo y método: compara el catálogo antes y después de consultar. Una nueva ola sustituye al estudio anterior del mismo instituto; los microdatos no se añaden como otra encuesta.'};
 report.summary={newMicrodata:report.microdata.filter(p=>p.status==='incorporated').length,updatedMetadata:report.metadataUpdates.length,newPolls:report.incorporated.filter(p=>p.measure==='voteEstimate').length,newCis:report.incorporated.filter(p=>p.measure==='directVote').length,known:report.processed.filter(p=>p.status==='known').length,fullyVerified:report.processed.filter(p=>p.verification==='full').length,partiallyVerified:report.processed.filter(p=>p.verification==='partial').length,accessOnly:report.processed.filter(p=>p.verification==='accessOnly').length,duplicates:report.processed.filter(p=>p.status==='duplicate').length,context:report.processed.filter(p=>['context','landing'].includes(p.status)).length,old:report.processed.filter(p=>p.status==='old').length,pending:report.candidates.length,activePolls:current.expired?0:current.selected.length,calculatedAt:today,lastPublication:current.lastPublication,lastFieldwork:current.lastFieldwork,expired:current.expired};
 // Never overwrite a catalog changed by a concurrent manual review.
 if(report.incorporated.length||report.metadataUpdates.length)await commitCatalog(root,originalText,catalog);
 await atomicWrite(path.join(root,'data/update-status.json'),JSON.stringify(report,null,2)+'\n');
 return {catalog,report};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify((await searchSources()).report,null,2));
