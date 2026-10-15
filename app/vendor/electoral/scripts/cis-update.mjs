import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {articleDocument} from './poll-adapters.mjs';
import {extractCis,extractCisEstimate,reconcileCisAlternative} from './cis-adapter.mjs';
import {readPdf} from './pdf-reader.mjs';

const partyIds={PP:'pp',PSOE:'psoe',VOX:'vox',Sumar:'sumar','Sumar / Frente Amplio':'sumar',Podemos:'podemos','Se Acabó la Fiesta':'salf',ERC:'erc',Junts:'junts','EAJ-PNV':'pnv','EH Bildu':'bildu',BNG:'bng',CCa:'cc',UPN:'upn','Adelante Andalucía':'aa','Aliança Catalana':'ac'};
export function cisDocuments(html,url){
 const d=articleDocument(html,url),items=d.links.filter(l=>new URL(l.url).hostname==='www.cis.es');
 const result=items.find(l=>/\/es\d+mar(?:[_.-]|\.pdf)/i.test(l.url));
 const study=result?.url.match(/\/es(\d+)mar/i)?.[1];
 const technical=items.find(l=>new RegExp('/FT'+study+'\\.pdf','i').test(l.url));
 const estimation=items.find(l=>new RegExp('/'+study+'[_-]Estimacion','i').test(l.url));
 return {title:d.title,publishedAt:d.publishedAt,study,resultUrl:result?.url,technicalUrl:technical?.url,estimateUrl:estimation?.url,links:items};
}

export async function updateCis({root,catalog,report,today,retrieve}){
 const home='https://www.cis.es/es/';
 const pdf=async(url)=>{const bytes=await retrieve(url,true),hash=createHash('sha256').update(bytes).digest('hex'),file=path.join(root,'research/automatic',hash+'.pdf');await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes);return {text:(await readPdf(file)).pages.join('\n'),hash};};
 try{
  const html=await retrieve(home),front=articleDocument(html,home);
  // The CIS announces new studies under /w/ before creating their catalogue page.
  const discovered=front.links.filter(l=>new URL(l.url).hostname==='www.cis.es'&&(/\/estudios\//.test(l.url)&&/bar[oó]metro|pol[ií]tica fiscal/i.test(l.title)||/\/w\/avance-de-resultados/.test(l.url)&&/bar[oó]metro/i.test(l.title)));
  const urls=[...new Set([...discovered.map(l=>l.url),...(catalog.directSurveys||[]).map(p=>p.studyUrl)])].slice(0,8);
  report.sources.push({name:'CIS · datos y estimaciones para consulta',url:home,status:'ok',found:discovered.length});
  const seen=new Set();
  for(const url of urls){
   let docs,existing;
   try{
    docs=cisDocuments(await retrieve(url),url);existing=(catalog.directSurveys||[]).find(p=>p.study===docs.study);
    if(!docs.resultUrl||!docs.study)throw Error('No se han encontrado resultados CIS.');
    if(seen.has(docs.study))continue;seen.add(docs.study);
    const publishedAt=existing?.publishedAt||docs.publishedAt;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)||publishedAt>today)throw Error('Fecha de disponibilidad CIS desconocida o futura.');
    const result=await pdf(docs.resultUrl),technical=docs.technicalUrl?await pdf(docs.technicalUrl):result;
    let tables,sourceNote,sourceUrl=docs.resultUrl,sourceHash=result.hash;
    try{tables=extractCis(result.text,technical.text);}catch(error){
     if(!existing&&!docs.estimateUrl&&/Pregunta directa ambigua/.test(error.message)){report.processed.push({institute:'CIS',url,title:docs.title,status:'context',reason:'Estudio temático sin tabla directa electoral nacional reconocida ni estimación de voto enlazada.'});continue;}
     if(!/Etiqueta numérica/.test(error.message)||!existing?.url||existing.url===docs.resultUrl)throw error;
     const alternative=await pdf(existing.url),resolved=reconcileCisAlternative(result.text,technical.text,alternative.text);
     tables=resolved.tables;sourceNote=resolved.note;sourceUrl=existing.url;sourceHash=alternative.hash;
    }
    if(tables.fieldworkEnd>publishedAt||tables.fieldworkEnd>today)throw Error('Fechas CIS incompatibles.');
    const rows=tables.direct.rows;
    const record={id:'cis-direct-'+docs.study,institute:'CIS',study:docs.study,title:docs.title,publishedAt,fieldworkStart:tables.fieldworkStart,fieldworkEnd:tables.fieldworkEnd,sample:tables.sample,verified:true,measure:'directVote',denominator:'surveyTotal',values:Object.fromEntries(Object.entries(rows).filter(([label])=>partyIds[label]).map(([label,v])=>[partyIds[label],v])),responses:Object.fromEntries(Object.entries(rows).filter(([label])=>!partyIds[label])),tables,question:tables.direct.code+' · respuestas sobre el total de la encuesta',url:sourceUrl,technicalUrl:docs.technicalUrl||docs.resultUrl,studyUrl:url,sha256:sourceHash,...(sourceNote?{sourceNote}:{}),note:'Respuestas directas publicadas. No entran en la media electoral ni en los escaños.'};
    catalog.directSurveys??=[];
    if(!existing||JSON.stringify(existing.tables)!==JSON.stringify(tables)){
     catalog.directSurveys=catalog.directSurveys.filter(p=>p.study!==docs.study);catalog.directSurveys.push(record);
     report.incorporated.push({study:docs.study,url:sourceUrl,measure:'directVote'});
    }
    report.processed.push({institute:'CIS',url,title:docs.title,status:'known',verification:'full',reason:sourceNote||'Pregunta directa y ficha técnica contrastadas. Uso exclusivamente consultivo.',sha256:sourceHash});
    if(docs.estimateUrl)try{
     const document=await pdf(docs.estimateUrl),extracted=extractCisEstimate(document.text,docs.study);
     if(extracted.sample!==tables.sample||['pp','psoe','vox','sumar'].some(id=>Math.abs(extracted.direct[id]-record.values[id])>.051))throw Error('La estimación y las respuestas directas no corresponden al mismo estudio.');
     const estimate={study:docs.study,title:docs.title,publishedAt,fieldworkStart:tables.fieldworkStart,fieldworkEnd:tables.fieldworkEnd,sample:tables.sample,values:extracted.values,denominator:'validVotes',url:docs.estimateUrl,studyUrl:url,sha256:document.hash,verified:true,measure:'cisComparisonOnly'};
     catalog.cisEstimates??=[];const previous=catalog.cisEstimates.find(p=>p.study===docs.study);
     if(!previous||JSON.stringify(previous.values)!==JSON.stringify(estimate.values)||previous.sha256!==estimate.sha256){catalog.cisEstimates=catalog.cisEstimates.filter(p=>p.study!==docs.study);catalog.cisEstimates.push(estimate);report.incorporated.push({study:docs.study,url:docs.estimateUrl,measure:'cisComparisonOnly'});}
    }catch(error){const row={institute:'CIS',url:docs.estimateUrl,title:'Comparación CIS · '+docs.title,status:'pending',reason:error.message};report.processed.push(row);report.candidates.push(row);}
   }catch(error){const row={institute:'CIS',url,title:docs?.title||'Resultados directos CIS',status:existing?'retained':'pending',reason:error.message+(existing?' Se conserva el original revisado disponible.':'')};report.processed.push(row);report.candidates.push(row);}
  }
 }catch(error){report.sources.push({name:'CIS',url:home,status:'error',error:error.message});}
}
