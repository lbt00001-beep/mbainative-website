import {estimate} from './polling.mjs';
// Descriptive diagnostics; none of these figures enters the electoral aggregate.
export function cisComparison(study,catalog,official){
 if(study.measure!=='cisComparisonOnly'||study.denominator!=='validVotes')throw Error('La comparación requiere la estimación electoral publicada por el CIS.');
 let reference;
 try{reference=estimate(catalog,official,study.publishedAt);}catch{return {rows:[],selected:[],date:study.publishedAt};}
 const rows=Object.entries(study.values).filter(([id])=>!['others','blank'].includes(id)).map(([id,value])=>{
  const count=reference.coverage[id]||0,average=count?reference.values[id]:null;
  return {id,cis:value,average,gap:average===null?null:value-average,count};
 });
 return {rows,selected:reference.selected,date:study.publishedAt};
}

export function cisDiagnostics(study, official) {
  const direct=study.tables.direct.rows, recall=study.tables.recall?.rows;
  const undecided=(direct['No sabe todavía']||0)+(direct['N.C.']||0);
  const excluded=new Set(['En blanco','Voto nulo','N.R.','N.C.']);
  const known=recall?Object.entries(recall).filter(([label,v])=>!excluded.has(label)&&v!==null):[];
  const denominator=known.reduce((s,[,v])=>s+v,0);
  const votes=official.provinces.reduce((s,p)=>s+p.candidateVotes,0);
  const comparable={PP:'pp',PSOE:'psoe',VOX:'vox',Sumar:'sumar'};
  const recallComparison=Object.entries(comparable).map(([label,id])=>{
    const actual=100*official.provinces.reduce((s,p)=>s+(p.votes[id]||0),0)/votes;
    const recalled=denominator?100*recall[label]/denominator:null;
    return {label,actual,recalled,gap:recalled===null?null:recalled-actual};
  });
  return {undecided,abstention:direct['No votaría'],directGap:direct.PSOE-direct.PP,recallDenominator:denominator,recallComparison};
}
