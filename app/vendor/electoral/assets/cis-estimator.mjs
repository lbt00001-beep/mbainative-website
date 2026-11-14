// Independent, auditable scenarios. Published CIS estimates are never model inputs.
const EXCLUDED=new Set(['undecided','noanswer','abstention','null']);
const UNDECIDED=new Set(['undecided','noanswer']);
const total=o=>Object.values(o).reduce((a,b)=>a+b,0);
const add=(o,id,w)=>{o[id]=(o[id]||0)+w;};
export const DEFAULT_REESTIMATION={recallStrength:1,nsRate:1,ncRate:.5,participation:'none',sympathy:false,shrinkage:20};

export function reestimateCis(data,options={}){
 const p={...DEFAULT_REESTIMATION,...options};
 for(const field of ['recallStrength','nsRate','ncRate'])if(!Number.isFinite(p[field])||p[field]<0||p[field]>1)throw Error('Parámetro fuera de 0–1: '+field);
 if(!['none','declared','certain'].includes(p.participation)||typeof p.sympathy!=='boolean'||!Number.isFinite(p.shrinkage)||p.shrinkage<0||p.shrinkage>200)throw Error('Parámetros de estimación inválidos.');
 if(!['microdata','recallTable'].includes(data.kind)||!Array.isArray(data.cells)||!data.cells.length)throw Error('Datos de estimación inválidos.');
 if(!data.reference||Object.values(data.reference).some(v=>!Number.isFinite(v)||v<0))throw Error('Referencia electoral inválida.');
 if(data.kind==='recallTable'&&(p.participation!=='none'||p.sympathy))throw Error('El cruce agregado no permite unir participación o simpatía con intención y recuerdo individualmente.');
 for(const c of data.cells){if(!c.intent||!c.recall||!Number.isFinite(c.w)||c.w<=0)throw Error('Celda inválida.');if(data.kind==='microdata'&&(!Number.isInteger(c.n)||c.n<1||!Number.isFinite(c.w2)||c.w2+1e-7<c.w*c.w/c.n))throw Error('Celda de microdatos inválida.');}
 if(data.kind==='microdata'&&cellsSample(data.cells)!==data.sample)throw Error('La muestra y los agregados no coinciden.');
 const cells=data.cells,baseTotal=cells.reduce((s,c)=>s+c.w,0),recall={},factors={},clipped=[];
 for(const c of cells)add(recall,c.recall,c.w);
 const comparable=Object.keys(data.reference).filter(id=>!EXCLUDED.has(id)&&!['blank','others','norecall','underage','ineligible'].includes(id)&&data.reference[id]>0&&recall[id]>0);
 const knownTotal=comparable.reduce((s,id)=>s+recall[id],0),referenceTotal=comparable.reduce((s,id)=>s+data.reference[id],0);
 if(p.recallStrength&&(!knownTotal||!referenceTotal))throw Error('No hay recuerdo comparable con el resultado anterior.');
 for(const id of comparable){const raw=1-p.recallStrength+p.recallStrength*(data.reference[id]/referenceTotal)/(recall[id]/knownTotal);factors[id]=Math.max(.25,Math.min(4,raw));if(factors[id]!==raw)clipped.push(id);}
 let unknownTurnoutWeight=0;
 const turnout=c=>{if(p.participation==='none')return 1;if(c.turnout===null||c.turnout===undefined||!Number.isFinite(c.turnout)||c.turnout<0||c.turnout>10){unknownTurnoutWeight+=c.w;return 1;}return p.participation==='declared'?c.turnout/10:c.turnout>=9?1:0;};
 const weighted=cells.map(c=>({...c,factor:(factors[c.recall]??1)*turnout(c)})).map(c=>({...c,weight:c.w*c.factor}));
 const decided={},byRecall={},compatible=new Set(cells.filter(c=>!EXCLUDED.has(c.intent)).map(c=>c.intent));
 for(const c of weighted)if(!EXCLUDED.has(c.intent)){add(decided,c.intent,c.weight);byRecall[c.recall]??={};add(byRecall[c.recall],c.intent,c.weight);}
 const decidedTotal=total(decided),raw={},adjusted={},values={},assigned={undecided:0,noanswer:0},assignedBySympathy={undecided:0,noanswer:0};
 let weightTotal=0,squares=0;
 for(const c of weighted){add(raw,c.intent,c.w);add(adjusted,c.intent,c.weight);weightTotal+=c.weight;if(data.kind==='microdata')squares+=c.w2*c.factor**2;
  if(!UNDECIDED.has(c.intent)){add(values,c.intent,c.weight);continue;}
  const amount=c.weight*(c.intent==='undecided'?p.nsRate:p.ncRate);
  if(!amount||!decidedTotal){add(values,c.intent,c.weight);continue;}
  const source=byRecall[c.recall]||{},sourceTotal=total(source),distribution={};
  if(p.sympathy&&c.sympathy&&compatible.has(c.sympathy)){distribution[c.sympathy]=1;assignedBySympathy[c.intent]+=amount;}
  else for(const [id,v]of Object.entries(decided))distribution[id]=sourceTotal?( (source[id]||0)+p.shrinkage*v/decidedTotal)/(sourceTotal+p.shrinkage):v/decidedTotal;
  for(const [id,share]of Object.entries(distribution))add(values,id,amount*share);
  assigned[c.intent]+=amount;add(values,c.intent,c.weight-amount);
 }
 if(!weightTotal)throw Error('El filtro de participación deja la muestra sin peso.');
 const valid=Object.fromEntries(Object.entries(values).filter(([id])=>!EXCLUDED.has(id))),validTotal=total(valid);
 if(!validTotal)throw Error('No hay voto válido en este escenario.');
 const calibratedRecall={};for(const c of cells)add(calibratedRecall,c.recall,c.w*(factors[c.recall]??1));
 const calibratedKnown=comparable.reduce((s,id)=>s+calibratedRecall[id],0);
 return {parameters:p,raw,rawTotal:baseTotal,adjusted,values,total:weightTotal,validTotal,validPercent:Object.fromEntries(Object.entries(valid).map(([id,v])=>[id,100*v/validTotal])),assigned,assignedBySympathy,unassigned:{undecided:values.undecided||0,noanswer:values.noanswer||0},effectiveN:data.kind==='microdata'&&squares?weightTotal**2/squares:null,unknownTurnoutWeight,clipped,recallAudit:comparable.map(id=>({id,before:100*recall[id]/knownTotal,target:100*data.reference[id]/referenceTotal,after:100*calibratedRecall[id]/calibratedKnown,factor:factors[id]}))};
}

function cellsSample(cells){return cells.reduce((s,c)=>s+c.n,0);}

export function cisSensitivity(data){
 const results=[];
 for(const recallStrength of [.5,1])for(const nsRate of [0,.5,1])for(const ncRate of [0,.5,1]){
  for(const participation of data.kind==='microdata'?['none','declared','certain']:['none']){
   try{results.push(reestimateCis(data,{recallStrength,nsRate,ncRate,participation}));}catch{/* Empty turnout scenarios are excluded, never replaced by zero. */}
  }
 }
 const ids=[...new Set(results.flatMap(r=>Object.keys(r.validPercent)))];
 return {scenarios:results.length,parties:Object.fromEntries(ids.map(id=>[id,{low:Math.min(...results.map(r=>r.validPercent[id]||0)),high:Math.max(...results.map(r=>r.validPercent[id]||0))}]))};
}

// Explicit external calibration, kept separate from the independent CIS model.
export function combineCisConsensus(result,consensus,weight=.5){
 if(!Number.isFinite(weight)||weight<0||weight>1)throw Error('Peso del consenso fuera de 0–1.');
 if(consensus.expired&&weight>0)throw Error('No se combina con un promedio archivado sin sondeos vigentes.');
 // ERC, Frente Amplio and territorial coalitions can cover different electorates.
 // Only these unambiguous categories are currently matched between the sources.
 const compatible=['pp','psoe','vox','podemos','salf'].filter(id=>(consensus.coverage[id]||0)>0&&Object.hasOwn(result.validPercent,id));
 if(!compatible.length)throw Error('No hay categorías con cobertura comparable en la media.');
 const reference=Object.fromEntries(compatible.map(id=>[id,consensus.values[id]]));
 if(Object.values(reference).some(v=>!Number.isFinite(v)||v<0||v>100)||total(reference)>100)throw Error('Porcentajes de consenso incompatibles.');
 const values={...result.validPercent};for(const id of compatible)values[id]=(1-weight)*result.validPercent[id]+weight*reference[id];
 const rest=Object.keys(values).filter(id=>!compatible.includes(id)),restTotal=rest.reduce((s,id)=>s+result.validPercent[id],0),remaining=100-compatible.reduce((s,id)=>s+values[id],0);
 if(remaining< -1e-8||(!restTotal&&remaining>1e-8))throw Error('No hay voto residual para conservar el total combinado.');
 for(const id of rest)values[id]=restTotal?result.validPercent[id]*Math.max(0,remaining)/restTotal:0;
 const mae=percent=>compatible.reduce((s,id)=>s+Math.abs(percent[id]-reference[id]),0)/compatible.length;
 return {validPercent:values,weight,compatible,reference,distanceBefore:mae(result.validPercent),distanceAfter:mae(values),referenceDate:consensus.calculatedAt||consensus.asOf,note:'Calibración externa explícita. Se aproxima a la media por construcción; no es una estimación independiente del CIS. El resto se escala proporcionalmente para conservar 100 %, sin asignar coaliciones territoriales a Frente Amplio.'};
}
