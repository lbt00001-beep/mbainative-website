// Pure electoral functions shared by the browser, worker and Node tests.
export const MAJORITY = 176;
export const INVESTITURE_IDS = ['psoe','sumar','podemos','erc','junts','bildu','pnv','bng','cc'];
export const INVESTITURE_SOURCE = 'https://www.congreso.es/es/notas-de-prensa?_notasprensa_mvcPath=detalle&_notasprensa_notaId=45970';
export const MAIN_IDS = ['pp', 'psoe', 'vox', 'sumar', 'podemos', 'salf', 'erc', 'junts', 'bildu', 'pnv', 'bng', 'cc', 'upn', 'ac', 'aa'];
export const NAMES = {ac:'Aliança Catalana (hipótesis)',aa:'Adelante Andalucía (hipótesis)',pp:'PP',psoe:'PSOE / PSC',vox:'Vox',sumar:'Sumar',podemos:'Podemos',salf:'SALF',erc:'ERC',junts:'Junts',bildu:'EH Bildu',pnv:'PNV',bng:'BNG',cc:'Coalición Canaria',upn:'UPN'};
export const COLORS = {pp:'#65a5ff',psoe:'#ff667a',vox:'#8ccc55',sumar:'#f394bb',podemos:'#ba95f7',salf:'#b4bac8',erc:'#f5bb52',junts:'#54c8bc',bildu:'#bccb64',pnv:'#73bc97',bng:'#81c5e7',cc:'#ded17e',upn:'#969fe0'};
export const GROUPS = {
  right: { name: 'PP + Vox', ids: ['pp','vox'] },
  left: { name: 'PSOE + Sumar + Podemos', ids: ['psoe','sumar','podemos'] },
  leftPartners: { name: 'PSOE + Sumar + Podemos + ERC + Bildu + PNV + BNG', ids: ['psoe','sumar','podemos','erc','bildu','pnv','bng'] },
  leftWithJunts: { name: 'Suma anterior + Junts', ids: ['psoe','sumar','podemos','erc','bildu','pnv','bng','junts'] },
  ppPartners: { name: 'PP + PNV + CC + UPN', ids: ['pp','pnv','cc','upn'] }
};
const sum = values => values.reduce((a,b) => a+b,0);
const integer = (n, label) => { if (!Number.isSafeInteger(n) || n < 0) throw new Error(`${label}: se requiere un entero no negativo.`); };
export function rng(seed = 20261129) {
  let a = Number(seed) >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function allocate(votes, seats, {blank = 0, singleMember = seats === 1, seed = 1} = {}) {
  integer(seats,'Escaños'); integer(blank,'Votos en blanco');
  if(blank>1000000000)throw new Error('Votos en blanco fuera de rango.');
  if (seats < 1 || seats > 350) throw new Error('Escaños fuera de rango.');
  const entries = Object.entries(votes);
  if (!entries.length) throw new Error('No hay candidaturas.');
  for (const [id, value] of entries) { if (!id || ['__proto__','constructor','prototype'].includes(id)) throw new Error('Identificador inválido.'); integer(value,'Votos'); if(value>1000000000)throw new Error('Votos fuera de rango.'); }
  const candidateVotes = sum(entries.map(([,v])=>v)), validVotes = candidateVotes + blank;
  if (!validVotes) throw new Error('No hay votos válidos.');
  const counts = Object.fromEntries(entries.map(([id])=>[id,0]));
  const eligible = entries.filter(([,v]) => v > 0 && (singleMember || v * 100 >= validVotes * 3));
  if (!eligible.length) throw new Error('Ninguna candidatura alcanza la barrera legal.');
  const winners = [], lotteries = [], rotations = new Map(), random = rng(seed);
  for (let seat = 0; seat < seats; seat++) {
    let contenders = [], best;
    for (const [id, value] of eligible) {
      const q = {id, votes:value, divisor:counts[id]+1};
      const diff = best ? q.votes * best.divisor - best.votes * q.divisor : 1;
      if (diff > 0) { best=q; contenders=[q]; } else if (diff===0) contenders.push(q);
    }
    const mostVotes = Math.max(...contenders.map(q=>q.votes));
    contenders = contenders.filter(q=>q.votes===mostVotes);
    let chosen = contenders[0];
    if (contenders.length > 1) {
      // Equal quotient AND equal vote totals: simulated first draw, then alternation.
      // The real official draw cannot be predicted. Always report the assumption.
      const ordered = contenders.map(q=>q.id).sort(), key=ordered.join('|');
      if (!rotations.has(key)) rotations.set(key, Math.floor(random()*ordered.length));
      const offset=rotations.get(key); chosen=contenders.find(q=>q.id===ordered[offset % ordered.length]);
      rotations.set(key,offset+1); lotteries.push({seat:seat+1,ids:ordered,winner:chosen.id});
    }
    counts[chosen.id]++; winners.push({...chosen,value:chosen.votes/chosen.divisor});
  }
  const next = eligible.map(([id,value])=>({id,votes:value,divisor:counts[id]+1,value:value/(counts[id]+1)}))
    .sort((a,b)=> b.votes*a.divisor-a.votes*b.divisor || b.votes-a.votes || a.id.localeCompare(b.id));
  return {counts,winners,next,last:winners.at(-1),validVotes,candidateVotes,eligible:eligible.map(([id])=>id),lotteries};
}
export function validateOfficial(data) {
  if (data.schemaVersion !== 1 || !Array.isArray(data.provinces) || data.provinces.length!==52) throw new Error('La base debe contener 52 circunscripciones.');
  const ids = new Set();
  for (const p of data.provinces) {
    if (ids.has(p.id)) throw new Error('Circunscripción duplicada.'); ids.add(p.id);
    integer(p.seats,'Escaños'); integer(p.blankVotes,'Blancos'); integer(p.census,'Censo');
    const r=allocate(p.votes,p.seats,{blank:p.blankVotes});
    if (r.candidateVotes!==p.candidateVotes || r.validVotes!==p.validVotes || sum(Object.values(p.officialSeats))!==p.seats) throw new Error(`Totales incompatibles en ${p.name}.`);
    for (const [id,v] of Object.entries(r.counts)) if (v!==(p.officialSeats[id]||0)) throw new Error(`El reparto no reproduce el resultado oficial en ${p.name}: ${id}.`);
  }
  if (sum(data.provinces.map(p=>p.seats))!==350) throw new Error('El Congreso debe sumar 350 escaños.');
  return true;
}
export function nationalVotes(provinces) {
  const totals={}; for (const p of provinces) for (const [id,v] of Object.entries(p.votes)) totals[id]=(totals[id]||0)+v;
  const total=sum(Object.values(totals)); return {totals,total,shares:Object.fromEntries(Object.entries(totals).map(([id,v])=>[id,100*v/total]))};
}
export function nationalAllocation(provinces) {
  const counts={},details=[];
  for (const p of provinces) {
    const result=allocate(p.votes,p.seats,{blank:p.blankVotes}); details.push({id:p.id,name:p.name,result});
    for (const [id,v] of Object.entries(result.counts)) counts[id]=(counts[id]||0)+v;
  }
  return {counts,details,groups:groupSeats(counts),shares:nationalVotes(provinces).shares};
}
export function groupSeats(counts) { return Object.fromEntries(Object.entries(GROUPS).map(([id,g])=>[id,sum(g.ids.map(p=>counts[p]||0))])); }
export function roundPreservingTotal(values,total) {
  integer(total,'Total'); const items=Object.entries(values);
  const rawTotal=sum(items.map(([,v])=>v));
  if (!rawTotal) { if(total===0) return Object.fromEntries(items.map(([k])=>[k,0])); throw new Error('Distribución sin votos.'); }
  const scaled=items.map(([id,v])=>({id,value:v*total/rawTotal}));
  const out=Object.fromEntries(scaled.map(x=>[x.id,Math.floor(x.value)]));
  const remaining=total-sum(Object.values(out));
  scaled.sort((a,b)=>(b.value-Math.floor(b.value))-(a.value-Math.floor(a.value)) || a.id.localeCompare(b.id));
  for (let i=0;i<remaining;i++) out[scaled[i].id]++;
  return out;
}
export function project(official, targets, {podemosSplit=1/3} = {}) {
  const controlled = ['pp','psoe','vox','sumar','podemos','salf'];
  if (!Number.isFinite(podemosSplit) || podemosSplit<=0 || podemosSplit>=1) throw new Error('La separación de Sumar debe estar entre 0 y 1.');
  for (const id of controlled) if (!Number.isFinite(targets[id]) || targets[id]<0 || targets[id]>100) throw new Error(`Porcentaje inválido para ${id}.`);
  if (sum(controlled.map(id=>targets[id]))>=100) throw new Error('Debe quedar voto para las demás candidaturas.');
  const provinces=official.provinces.map(p=>{
    const votes={...p.votes}; votes.podemos=votes.sumar*podemosSplit; votes.sumar*=1-podemosSplit;
    // SALF has no 2023 result: explicitly assumed footprint, never historical data.
    votes.salf=(votes.pp+votes.vox)*0.02;
    return {...p,votes};
  });
  const ids=Object.keys(provinces[0].votes), initial=nationalVotes(provinces);
  const others=ids.filter(id=>!controlled.includes(id));
  const otherTotal=sum(others.map(id=>initial.totals[id]||0));
  const total=sum(provinces.map(p=>p.candidateVotes));
  const desired={};
  for (const id of controlled) desired[id]=targets[id]*total/100;
  for (const id of others) desired[id]=(initial.totals[id]||0)/otherTotal*(100-sum(controlled.map(id=>targets[id])))*total/100;
  let maxError=Infinity;
  for (let n=0;n<300;n++) {
    const current=nationalVotes(provinces).totals;
    for (const p of provinces) {
      for (const id of ids) p.votes[id] *= current[id] ? desired[id]/current[id] : 0;
      const rowTotal=sum(Object.values(p.votes));
      if (!rowTotal) throw new Error(`Escenario incompatible en ${p.name}.`);
      const scale=p.candidateVotes/rowTotal; for (const id of ids) p.votes[id]*=scale;
    }
    const check=nationalVotes(provinces).shares;
    maxError=Math.max(...ids.map(id=>Math.abs((check[id]||0)-100*desired[id]/total)));
    if(maxError<0.0001) break;
  }
  if(maxError>0.01) throw new Error('El ajuste territorial no converge con estos porcentajes.');
  return provinces.map(p=>({...p,votes:roundPreservingTotal(p.votes,p.candidateVotes)}));
}
export function transfer(votes,from,to,amount) {
  integer(amount,'Transferencia');
  if (from===to) throw new Error('El origen y el destino deben ser diferentes.');
  if (!Object.hasOwn(votes,from)||!Object.hasOwn(votes,to)) throw new Error('Candidatura desconocida.');
  if (amount>votes[from]) throw new Error('La transferencia supera los votos de origen.');
  return {...votes,[from]:votes[from]-amount,[to]:votes[to]+amount};
}
export function votesToGain(p,id) {
  const settings={blank:p.blankVotes,singleMember:p.id?['51','52'].includes(p.id)&&p.seats===1:p.seats===1};
  const initial=allocate(p.votes,p.seats,settings).counts[id]||0;
  const gains=n=>(allocate({...p.votes,[id]:(p.votes[id]||0)+n},p.seats,settings).counts[id]||0)>initial;
  if(initial===p.seats) return null;
  let hi=1; while (!gains(hi)&&hi<100000000) hi*=2;
  if(!gains(hi)) return null;
  let lo=0; while(hi-lo>1){const mid=Math.floor((hi+lo)/2); if(gains(mid))hi=mid;else lo=mid;}
  return hi;
}
export function quantile(sorted,p) { const x=(sorted.length-1)*p,i=Math.floor(x); return sorted[i]+(sorted[Math.min(i+1,sorted.length-1)]-sorted[i])*(x-i); }
export function simulationGenerator(provinces,{runs=1000,seed=20261129,nationalSigma=2,localSigma=0.8}={}) {
  integer(runs,'Simulaciones'); if(runs<1||runs>20000)throw new Error('Entre 1 y 20.000 simulaciones.');
  for(const v of [nationalSigma,localSigma]) if(!Number.isFinite(v)||v<0||v>10)throw new Error('Incertidumbre fuera de rango.');
  const random=rng(seed), normal=()=>Math.sqrt(-2*Math.log(Math.max(random(),1e-12)))*Math.cos(2*Math.PI*random());
  const baseShares=nationalVotes(provinces).shares, ids=Object.keys(baseShares), drawCounts=[], draws=[], samples={};
  const bloc=id=>['pp','vox','salf','upn'].includes(id)?1:['psoe','sumar','podemos'].includes(id)?-1:0;
  const nationalFactor=(id,common,individual)=>Math.exp(Math.max(-2,Math.min(2,(nationalSigma*(0.75*bloc(id)*common+0.66*individual))/(Math.max(baseShares[id],3)))));
  function* run() {
    for(let n=0;n<runs;n++) {
      const common=normal(), factors=Object.fromEntries(ids.map(id=>[id,nationalFactor(id,common,normal())]));
      const varied=provinces.map(p=>{
        const local=normal(), values={};
        for(const [id,v] of Object.entries(p.votes)) {
          const share=100*v/p.candidateVotes;
          // Shared national shock correlates provinces. A provincial shock varies locally.
          values[id]=v*factors[id]*Math.exp(Math.max(-2,Math.min(2,localSigma*(0.7*bloc(id)*local+0.71*normal())/Math.max(share,3))));
        }
        return {...p,votes:roundPreservingTotal(values,p.candidateVotes)};
      });
      const r=nationalAllocation(varied); drawCounts.push(r.counts); draws.push(r.groups);
      for(const [id,v] of Object.entries(r.counts)) (samples[id]??=[]).push(v);
      yield {completed:n+1,total:runs,point:{right:r.groups.right,left:r.groups.left}};
    }
    const parties={};
    for(const [id,values] of Object.entries(samples)) { values.sort((a,b)=>a-b); parties[id]={median:quantile(values,0.5),low:quantile(values,0.1),high:quantile(values,0.9)}; }
    const groups={};
    for(const id of Object.keys(GROUPS)) {const values=draws.map(d=>d[id]).sort((a,b)=>a-b); groups[id]={median:quantile(values,0.5),low:quantile(values,0.1),high:quantile(values,0.9),frequency:values.filter(v=>v>=MAJORITY).length/runs};}
    return {runs,seed,nationalSigma,localSigma,parties,groups,points:draws.map(d=>({right:d.right,left:d.left})),ppAlone:drawCounts.filter(d=>(d.pp||0)>=MAJORITY).length/runs};
  }
  return run();
}
export function validatePolls(polls) {
  if(!Array.isArray(polls))throw new Error('Se requiere un array polls.');
  const ids=new Set();
  for(const p of polls){
    if(!p.id||ids.has(p.id))throw new Error('Encuesta duplicada o sin identificador.');ids.add(p.id);
    if(typeof p.institute!=='string'||!p.institute.trim())throw new Error('Falta la encuestadora.');
    for(const field of ['publishedAt','fieldworkEnd']) if(typeof p[field]!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p[field])||Number.isNaN(Date.parse(p[field]))||new Date(p[field]).toISOString().slice(0,10)!==p[field])throw new Error('Fecha de encuesta inválida.');
    if(p.fieldworkEnd>p.publishedAt)throw new Error('El trabajo de campo termina después de publicar.');
    if(!Number.isInteger(p.sample)||p.sample<1||p.sample>1000000)throw new Error('Muestra inválida.');
    if(p.verified!==true||p.denominator!=='candidateVotes')throw new Error('Solo se admiten encuestas verificadas sobre voto a candidaturas.');
    let url; try{url=new URL(p.url);}catch{throw new Error('Fuente inválida.');}if(url.protocol!=='https:')throw new Error('La fuente debe usar HTTPS.');
    if(!p.values||!Object.keys(p.values).length)throw new Error('Faltan porcentajes.');
    if(Object.entries(p.values).some(([id,v])=>!MAIN_IDS.includes(id)||!Number.isFinite(v)||v<0||v>100)||sum(Object.values(p.values))>100.1)throw new Error('Porcentajes inválidos.');
  }return true;
}
export function aggregatePolls(polls,asOf,{windowDays=60,halfLife=21}={}) {
  validatePolls(polls);const now=Date.parse(asOf+'T12:00:00Z');if(!Number.isFinite(now))throw new Error('Fecha de corte inválida.');
  // One latest observation per institute avoids weighting prolific houses repeatedly.
  const latest=new Map();
  for(const p of polls){const age=(now-Date.parse(p.fieldworkEnd+'T12:00:00Z'))/86400000;if(age<0||age>windowDays||p.publishedAt>asOf)continue; if(!latest.has(p.institute)||p.fieldworkEnd>latest.get(p.institute).fieldworkEnd)latest.set(p.institute,p);}
  const selected=[...latest.values()].map(p=>({...p,weight:Math.sqrt(p.sample)*Math.exp(-Math.LN2*((now-Date.parse(p.fieldworkEnd+'T12:00:00Z'))/86400000)/halfLife)}));
  const values={},coverage={};
  for(const id of MAIN_IDS){const rows=selected.filter(p=>Object.hasOwn(p.values,id));if(rows.length){values[id]=sum(rows.map(p=>p.values[id]*p.weight))/sum(rows.map(p=>p.weight));coverage[id]=rows.length;}}
  return {values,coverage,selected,asOf,windowDays,halfLife};
}
