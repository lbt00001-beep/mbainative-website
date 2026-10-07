// Aggregated CIS interview cells: no interview IDs or personal records are needed in the browser.
export const NON_VALID=new Set(['null','abstention','undecided','noanswer']);
export const UNDECIDED=new Set(['undecided','noanswer']);
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const add=(o,k,v)=>{o[k]=(o[k]||0)+v;};
export function validateMicrodata(data){
 if(data.schemaVersion!==1||!Number.isInteger(data.sample)||!data.cells?.length)throw Error('Formato de microdatos no compatible.');
 for(const c of data.cells)if(!Number.isInteger(c.n)||c.n<1||!Number.isFinite(c.w)||c.w<=0||!Number.isFinite(c.w2)||c.w2<=0||c.w2+1e-6<c.w*c.w/c.n)throw Error('Celda agregada inválida.');
 const totals=data.cells.filter(c=>c.dimension==='total');
 if(totals.reduce((a,c)=>a+c.n,0)!==data.sample)throw Error('Las entrevistas agregadas no coinciden con la ficha.');
 for(const dimension of Object.keys(data.dimensions))if(data.cells.filter(c=>c.dimension===dimension).reduce((a,c)=>a+c.n,0)!==data.sample)throw Error('Un desglose no conserva todas las entrevistas.');
 return data;
}
export function analyzeMicrodata(data,{basis='published',recallStrength=0,participation='none',undecided='none',dimension='age',reference={},profileTarget=null}={}){
 if(!['published','equal'].includes(basis)||!['none','declared'].includes(participation)||!['none','overall','recall'].includes(undecided)||!Number.isFinite(recallStrength)||recallStrength<0||recallStrength>1||!Object.hasOwn(data.dimensions,dimension))throw Error('Parámetros de microdatos inválidos.');
 const totals=data.cells.filter(c=>c.dimension==='total'),base=c=>basis==='equal'?c.n:c.w,base2=c=>basis==='equal'?c.n:c.w2;
 const recall={},factors={},clips=[];for(const c of totals)add(recall,c.recall,base(c));
 const comparable=Object.keys(reference).filter(id=>reference[id]>0&&recall[id]>0),recallTotal=comparable.reduce((a,id)=>a+recall[id],0),refTotal=comparable.reduce((a,id)=>a+reference[id],0);
 if(recallStrength&&(!recallTotal||!refTotal))throw Error('No hay categorías de recuerdo comparables con la referencia.');
 for(const id of comparable){const raw=(1-recallStrength)+recallStrength*(reference[id]/refTotal)/(recall[id]/recallTotal);factors[id]=Math.max(.25,Math.min(4,raw));if(factors[id]!==raw)clips.push(id);}
 const turnout=c=>participation==='none'?1:/^(?:[0-9]|10)$/.test(c.turnout)?Number(c.turnout)/10:0;
 const factor=c=>(factors[c.recall]||1)*turnout(c),weight=c=>base(c)*factor(c);
 const byRecall={},overall={};for(const c of totals)if(!NON_VALID.has(c.intent)){byRecall[c.recall]??={};add(byRecall[c.recall],c.intent,weight(c));add(overall,c.intent,weight(c));}
 const distribution=(c,w)=>{
  if(!UNDECIDED.has(c.intent)||undecided==='none')return {[c.intent]:w};
  const local=undecided==='recall'&&sum(byRecall[c.recall]||{})>0?byRecall[c.recall]:overall,total=sum(local);
  return total?Object.fromEntries(Object.entries(local).map(([id,v])=>[id,w*v/total])):{[c.intent]:w};
 };
 const initial={},adjusted={},raw={};let wsum=0,w2sum=0,unknownTurnout=0;
 for(const c of totals){add(initial,c.intent,base(c));add(raw,c.intent,c.n);const w=weight(c);add(adjusted,c.intent,w);wsum+=w;w2sum+=base2(c)*factor(c)**2;if(c.turnout==='No disponible')unknownTurnout+=c.n;}
 const calculate=cells=>{
  const values={};let weightSum=0,weightSquareSum=0,n=0,validN=0,validWeight=0,validSquares=0;
  for(const c of cells){const w=weight(c);n+=c.n;if(!NON_VALID.has(c.intent)){validN+=c.n;validWeight+=w;validSquares+=base2(c)*factor(c)**2;}weightSum+=w;weightSquareSum+=base2(c)*factor(c)**2;for(const [id,v]of Object.entries(distribution(c,w)))add(values,id,v);}
  const valid=Object.fromEntries(Object.entries(values).filter(([id])=>!NON_VALID.has(id))),validSum=sum(valid);
  return {n,validN,validEffectiveN:validSquares?validWeight**2/validSquares:0,weightSum,effectiveN:weightSquareSum?weightSum**2/weightSquareSum:0,values,validPercent:Object.fromEntries(Object.entries(valid).map(([id,v])=>[id,validSum?100*v/validSum:0])),validSum};
 };
 const national=calculate(totals),groups=new Map();for(const c of data.cells.filter(c=>c.dimension===dimension)){if(!groups.has(c.group))groups.set(c.group,[]);groups.get(c.group).push(c);}
 // This view fixes the national vote by construction. It does not estimate that vote independently.
 const profileFactors={};if(profileTarget){const targetTotal=sum(profileTarget);if(targetTotal<=0)throw Error('Referencia de perfiles vacía.');for(const [id,v]of Object.entries(profileTarget)){if(v>0&&!national.validPercent[id])throw Error('La muestra no permite ajustar la categoría '+id);profileFactors[id]=v?100*v/(targetTotal*national.validPercent[id]):0;}}
 const profiles=[...groups].map(([group,cells])=>{const r=calculate(cells);r.analysisN=r.validN;r.analysisEffectiveN=r.validEffectiveN;if(profileTarget){let obs=0,obsW=0,obsW2=0;for(const c of cells)if(Object.hasOwn(profileTarget,c.intent)){obs+=c.n;obsW+=weight(c);obsW2+=base2(c)*factor(c)**2;}r.analysisN=obs;r.analysisEffectiveN=obsW2?obsW**2/obsW2:0;const valid=Object.fromEntries(Object.keys(profileTarget).map(id=>[id,(r.values[id]||0)*(profileFactors[id]||0)])),total=sum(valid);r.profilePercent=Object.fromEntries(Object.entries(valid).map(([id,v])=>[id,total?100*v/total:0]));}return {group,...r};});
 const transitions=[];for(const group of new Set(totals.map(c=>c.recall))){const cells=totals.filter(c=>c.recall===group),values={};let n=0,total=0,squares=0;for(const c of cells){n+=c.n;squares+=base2(c)*factor(c)**2;add(values,c.intent,weight(c));total+=weight(c);}transitions.push({group,n,effectiveN:squares?total**2/squares:0,percent:Object.fromEntries(Object.entries(values).map(([id,w])=>[id,total?100*w/total:0]))});}
 return {initial,initialTotal:sum(initial),raw,adjusted,total:wsum,effectiveN:w2sum?wsum**2/w2sum:0,unknownTurnout,recallFactors:factors,clipped:clips,national,profiles,transitions,options:{basis,recallStrength,participation,undecided,dimension},profileTarget};
}
