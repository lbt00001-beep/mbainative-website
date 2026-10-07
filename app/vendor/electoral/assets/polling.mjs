// All percentages here use valid votes unless explicitly converted.
import {MAIN_IDS,nationalVotes,roundPreservingTotal} from './electoral.mjs';
import {methodologyWeight} from './methodology.mjs';
const sum=a=>a.reduce((s,v)=>s+v,0);
const days=(a,b)=>(Date.parse(a)-Date.parse(b))/86400000;
export function validateCatalog(catalog){
  if(!Array.isArray(catalog.polls)||!catalog.polls.length)throw Error('Catálogo vacío.');
  const ids=new Set();
  for(const p of catalog.polls){
    if(!p.id||ids.has(p.id))throw Error('Sondeo duplicado.');ids.add(p.id);
    if(typeof p.institute!=='string'||!p.institute.trim()||p.verified!==true||(p.sample!==null&&(!Number.isInteger(p.sample)||p.sample<1||p.sample>1000000)))throw Error('Ficha incompleta.');
    for(const key of ['publishedAt','fieldworkEnd'])if(!(key==='fieldworkEnd'&&p[key]===null)&&(!/^\d{4}-\d{2}-\d{2}$/.test(p[key])||!Number.isFinite(Date.parse(p[key]))||new Date(p[key]).toISOString().slice(0,10)!==p[key]))throw Error('Fecha inválida.');
    if(p.fieldworkEnd&&p.fieldworkEnd>p.publishedAt)throw Error('Fecha de campo posterior a publicación.');
    if(p.fieldworkStart!=null&&(!/^\d{4}-\d{2}-\d{2}$/.test(p.fieldworkStart)||!Number.isFinite(Date.parse(p.fieldworkStart))||new Date(p.fieldworkStart).toISOString().slice(0,10)!==p.fieldworkStart||p.fieldworkStart>(p.fieldworkEnd||p.publishedAt)))throw Error('Inicio de campo inválido.');
    if(!['validVotes','candidateVotes','unspecified'].includes(p.denominator))throw Error('Denominador desconocido.');
    if(p.methodology){const m=p.methodology;if(!['online','telephone','mixed','unknown'].includes(m.mode)||!['probability','panel','open','unknown'].includes(m.recruitment)||!['documented','unknown'].includes(m.quotas)||!['documented','unknown'].includes(m.weighting)||new URL(m.sourceUrl).protocol!=='https:'||!Array.isArray(m.evidence))throw Error('Metodología inválida.');}
    if(new URL(p.url).protocol!=='https:')throw Error('Fuente no HTTPS.');
    if(!p.values||!Object.keys(p.values).length||Object.entries(p.values).some(([id,v])=>![...MAIN_IDS,'ac','aa'].includes(id)||!Number.isFinite(v)||v<0||v>100)||sum(Object.values(p.values))>100.11)throw Error('Porcentajes inválidos.');
  }
  const directIds=new Set();
  for(const p of catalog.directSurveys||[]){
    if(!p.id||directIds.has(p.id)||p.measure!=='directVote'||p.denominator!=='surveyTotal'||!Number.isInteger(p.sample)||p.sample<1||p.verified!==true)throw Error('Ficha directa CIS inválida.');
    directIds.add(p.id);
    for(const url of [p.url,p.technicalUrl,p.studyUrl])if(new URL(url).protocol!=='https:')throw Error('Fuente directa no HTTPS.');
    const rows=p.tables?.direct?.rows;
    if(!rows||!Object.keys(rows).length||Object.values(rows).some(v=>v!==null&&(!Number.isFinite(v)||v<0||v>100))||Math.abs(Object.values(rows).reduce((s,v)=>s+(v||0),0)-100)>.8||p.tables.direct.sample!==p.sample)throw Error('Tabla directa incompleta o incompatible.');
  }
  return true;
}
export function historicalScores(catalog,{before='9999-12-31',exclude=null}={}){
  const byHouse=Object.create(null);
  for(const p of catalog.history||[]){
    if(p.electionDate>=before||p.electionDate===exclude)continue;
    const actual=catalog.results.find(r=>r.date===p.electionDate);if(!actual)continue;
    const errors=Object.entries(p.values).filter(([id])=>Object.hasOwn(actual.values,id)).map(([id,v])=>v-actual.values[id]);
    if(errors.length<4)continue;
    (byHouse[p.institute]??=[]).push({electionDate:p.electionDate,mae:sum(errors.map(Math.abs))/errors.length,mse:sum(errors.map(v=>v*v))/errors.length,errors,url:p.url});
  }
  return Object.fromEntries(Object.entries(byHouse).map(([id,rows])=>{
    // Two prior elections at RMS 2 points prevent one lucky result dominating.
    const unique=[...new Map(rows.map(r=>[r.electionDate,r])).values()];
    const mse=(sum(unique.map(r=>r.mse))+2*4)/(unique.length+2);
    return [id,{elections:unique.length,mae:sum(unique.map(r=>r.mae))/unique.length,mse,reliability:Math.max(2/3,Math.min(1.5,4/mse)),rows:unique}];
  }));
}
export function estimate(catalog,official,asOf=catalog.asOf,{halfLife=21,windowDays=60}={}){
  validateCatalog(catalog);if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||!Number.isFinite(Date.parse(asOf))||new Date(asOf).toISOString().slice(0,10)!==asOf)throw Error('Corte inválido.');
  const scores=historicalScores(catalog,{before:asOf});
  const validation=evaluateHistory(catalog);
  // History weighting is not enabled by a single lucky held-out comparison.
  const historicalWeighting=validation.rows.length>=2&&sum(validation.rows.map(r=>r.weightedMAE))<sum(validation.rows.map(r=>r.simpleMAE));
  const latest=new Map();
  for(const p of catalog.polls){if(p.institute.trim().toUpperCase()==='CIS'||p.measure==='directVote')continue;const date=p.fieldworkEnd||p.publishedAt,age=days(asOf,date);if(age<0||age>windowDays||p.publishedAt>asOf)continue;const old=latest.get(p.institute);if(!old||date>(old.fieldworkEnd||old.publishedAt)||(date===(old.fieldworkEnd||old.publishedAt)&&p.publishedAt>old.publishedAt))latest.set(p.institute,p);}
  const valid=sum(official.provinces.map(p=>p.validVotes)),blank=sum(official.provinces.map(p=>p.blankVotes))/valid*100;
  const selected=[...latest.values()].map(p=>{
    const method=methodologyWeight(p),age=days(asOf,p.fieldworkEnd||p.publishedAt),size=p.sample===null?.8:Math.sqrt(Math.min(p.sample,method.cap)/1500),recency=2**(-age/halfLife),quality=(p.denominator==='unspecified'?.8:1)*(p.fieldworkEnd===null?.7:1),reliability=historicalWeighting?(scores[p.institute]?.reliability??1):1;
    const values=Object.fromEntries(Object.entries(p.values).map(([id,v])=>[id,p.denominator==='candidateVotes'?v*(100-blank)/100:v]));
    const baselineWeight=(p.sample===null?.8:Math.sqrt(Math.min(p.sample,3000)/1500))*recency*quality*reliability;
    return {...p,values,age,size,recency,quality,reliability,method,baselineWeight,weight:size*recency*quality*reliability*method.factor};
  });
  if(!selected.length)throw Error('No quedan sondeos vigentes: actualiza el catálogo.');
  const totalWeight=sum(selected.map(p=>p.weight));selected.forEach(p=>p.weightPercent=100*p.weight/totalWeight);
  const base=nationalVotes(official.provinces).totals,values={},coverage={},provenance={};
  for(const id of [...MAIN_IDS,'ac','aa']){
    const rows=selected.filter(p=>Object.hasOwn(p.values,id));coverage[id]=rows.length;
    const prior=(base[id]||0)/valid*100;
    if(rows.length){values[id]=sum(rows.map(p=>p.weight*p.values[id]))/sum(rows.map(p=>p.weight));provenance[id]='sondeos';}
    else{values[id]=prior;provenance[id]='referencia histórica sin sondeo';}
  }
  // Do not renormalize each partial poll: missing parties are not zero.
  const named=sum(Object.values(values));if(named>=100-blank)throw Error('Medias incompatibles: no queda voto residual.');
  values.others=100-blank-named;values.blank=blank;
  const main=['pp','psoe','vox','sumar','podemos','salf'];
  const simple=Object.fromEntries(main.map(id=>{const rows=selected.filter(p=>Object.hasOwn(p.values,id));return [id,rows.length?sum(rows.map(p=>p.values[id]))/rows.length:null];}));
  const withoutMethodology=Object.fromEntries(main.map(id=>{const rows=selected.filter(p=>Object.hasOwn(p.values,id));return [id,rows.length?sum(rows.map(p=>p.values[id]*p.baselineWeight))/sum(rows.map(p=>p.baselineWeight)):null];}));
  const leaveOneOut=selected.map(removed=>({institute:removed.institute,deltas:Object.fromEntries(main.map(id=>{const rows=selected.filter(p=>p.id!==removed.id&&Object.hasOwn(p.values,id));return [id,rows.length?sum(rows.map(p=>p.values[id]*p.weight))/sum(rows.map(p=>p.weight))-values[id]:null];}))}));
  const targets=Object.fromEntries(Object.entries(values).filter(([id])=>!['others','blank'].includes(id)).map(([id,v])=>[id,v*100/(100-blank)]));
  return {asOf,halfLife,windowDays,selected,scores,historicalWeighting,values,targets,simple,withoutMethodology,leaveOneOut,coverage,provenance,blank,totalWeight,effectiveHouses:totalWeight**2/sum(selected.map(p=>p.weight**2)),assumptions:['Blanco: proporción oficial 2023 fija.','Denominador no declarado: se asimila a voto válido y reduce peso 20 %.','Ponderación metodológica editorial, todavía sin calibración histórica propia.','Cada partido usa solo los estudios que publican su cifra.','Otros es el residuo; se reparte entre listas históricas separadas.','Candidaturas y coaliciones futuras pendientes de proclamación.']};
}
export function projectEstimate(official,targets,territory){
  const named=Object.keys(targets);if(named.some(id=>!Number.isFinite(targets[id])||targets[id]<0)||sum(Object.values(targets))>=100)throw Error('Porcentajes nacionales incompatibles.');
  const provinces=official.provinces.map(p=>{
    const votes={...p.votes,podemos:territory.footprints[p.id].podemos,salf:territory.footprints[p.id].salf};
    votes.ac=['08','17','25','43'].includes(p.id)?p.candidateVotes*.01:0;
    votes.aa=p.region==='Andalucía'?p.candidateVotes*.01:0;
    return {...p,seats:territory.seats[p.id],votes};
  });
  return fitProvinceTargets(provinces,targets);
}
export function fitProvinceTargets(provinces,targets){
  const named=Object.keys(targets);
  if(!named.length||named.some(id=>!Number.isFinite(targets[id])||targets[id]<0)||sum(Object.values(targets))>=100)throw Error('Objetivos incompatibles.');
  provinces=provinces.map(p=>({...p,votes:{...p.votes}}));
  const ids=Object.keys(provinces[0].votes),initial=nationalVotes(provinces),total=initial.total;
  const otherIds=ids.filter(id=>!named.includes(id)),otherTotal=sum(otherIds.map(id=>initial.totals[id]||0)),remainder=100-sum(Object.values(targets));
  const desired=Object.fromEntries(ids.map(id=>[id,named.includes(id)?targets[id]*total/100:(initial.totals[id]||0)/otherTotal*remainder*total/100]));
  let error=Infinity;
  for(let i=0;i<500;i++){
    const current=nationalVotes(provinces).totals;
    for(const p of provinces){for(const id of ids)p.votes[id]*=current[id]?desired[id]/current[id]:0;const scale=p.candidateVotes/sum(Object.values(p.votes));for(const id of ids)p.votes[id]*=scale;}
    const check=nationalVotes(provinces).shares;error=Math.max(...ids.map(id=>Math.abs((check[id]||0)-100*desired[id]/total)));if(error<.0001)break;
  }
  if(!Number.isFinite(error)||error>.01)throw Error('El ajuste territorial no converge.');
  return provinces.map(p=>({...p,votes:roundPreservingTotal(p.votes,p.candidateVotes)}));
}
export function evaluateHistory(catalog){
  // Leave entire elections out, including every institute's observations.
  const rows=[];
  for(const actual of catalog.results||[]){
    if(actual.date>catalog.asOf)continue;
    const polls=catalog.history.filter(p=>p.electionDate===actual.date),scores=historicalScores(catalog,{before:actual.date});
    if(polls.length<2)continue;
    const ids=Object.keys(actual.values).filter(id=>polls.every(p=>Object.hasOwn(p.values,id)));
    const simple={},weighted={};
    for(const id of ids){simple[id]=sum(polls.map(p=>p.values[id]))/polls.length;const weights=polls.map(p=>scores[p.institute]?.reliability??1);weighted[id]=sum(polls.map((p,i)=>p.values[id]*weights[i]))/sum(weights);}
    const mae=obj=>sum(ids.map(id=>Math.abs(obj[id]-actual.values[id])))/ids.length;
    rows.push({date:actual.date,polls:polls.length,parties:ids.length,simpleMAE:mae(simple),weightedMAE:mae(weighted),simple,weighted,actual:actual.values});
  }
  const errors=catalog.history.flatMap(p=>{const actual=catalog.results.find(r=>r.date===p.electionDate);return Object.entries(p.values).filter(([id])=>Object.hasOwn(actual.values,id)).map(([id,v])=>v-actual.values[id]);});
  return {rows,individualRMSE:Math.sqrt(sum(errors.map(v=>v*v))/errors.length),status:'partial',note:'La comparación conjunta solo es posible en 2023. Este historial de sondeos no valida probabilidades ni error provincial; el diagnóstico territorial separado se muestra debajo.'};
}

// Retrospective reconstruction from the retained catalog, never future publications.
export function estimateEvolution(catalog,official,through=catalog.asOf){
  validateCatalog(catalog);
  const dates=[...new Set(catalog.polls.filter(p=>p.institute.trim().toUpperCase()!=='CIS'&&p.measure!=='directVote'&&p.publishedAt<=through).map(p=>p.publishedAt).concat(through))].sort();
  return dates.flatMap(date=>{
    const eligible=catalog.polls.filter(p=>p.institute.trim().toUpperCase()!=='CIS'&&p.measure!=='directVote'&&p.publishedAt<=date&&days(date,p.fieldworkEnd||p.publishedAt)<=60);
    if(!eligible.length)return [];
    const result=estimate(catalog,official,date);
    return [{date,values:result.values,coverage:result.coverage,count:result.selected.length}];
  });
}
