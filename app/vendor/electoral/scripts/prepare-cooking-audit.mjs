// Reproduce aggregate comparisons from the public, locally extracted 40dB files.
// No respondent records are written to the public bundle.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const cis=(await read('data/cis-reestimation.json')).datasets.find(d=>d.study==='3587');
const parties=[['pp','PP',2],['psoe','PSOE',1],['vox','Vox',3],['fa','Frente Amplio',4],['salf','SALF',6],['podemos','Podemos',5]];
const recallMap={1:'psoe',2:'pp',3:'vox',4:'sumar',5:'erc',6:'junts',7:'pnv',8:'bildu',9:'cc',11:'bng',14:'upn'};
const ref=Object.fromEntries(Object.entries(recallMap).map(([c,id])=>[c,cis.reference[id]]));
const sum=a=>a.reduce((s,v)=>s+v,0),count=(rows,test,w=r=>r.ponde)=>sum(rows.filter(test).map(w));
const out={schemaVersion:1,preparedOn:'2026-11-26',scope:'Auditoría nacional descriptiva. No identifica un algoritmo privado ni valida predicciones.',reference:{url:'https://www.boe.es/buscar/doc.php?id=BOE-A-2023-18907',votes:ref},studies:[]};
const downloads=await read('research/cocina-20261126/downloads.json');
for(const [sub,date,field,n,target]of [['tracking10','2026-11-22','17–21/11/2026',2000,[31.9,31.6,16.9,3.6,1.4,1]],['preelectoral2','2026-11-23','10–21/11/2026',7500,[31.8,30.9,17.3,3.9,1.3,1.1]]]){
 const dir='research/cocina-20261126/'+sub+'/',names=await readdir(new URL(dir,root)),file=names.find(x=>x.endsWith('.dta.json')&&!x.startsWith('._')&&(sub!=='preelectoral2'||x.includes('_voto.'))),rows=await read(dir+file);
 if(rows.length!==n||rows.some(r=>!Number.isFinite(r.ponde)||r.ponde<=0))throw Error('Muestra o pesos inválidos');
 const total=count(rows,()=>true),valid=count(rows,r=>r.p2<=21),rec={},known=count(rows,r=>ref[r.p5]>0),refTotal=sum(Object.values(ref));
 for(const c of Object.keys(ref))rec[c]=count(rows,r=>r.p5===+c);
 const factors=Object.fromEntries(Object.entries(ref).map(([c,v])=>[c,(v/refTotal)/(rec[c]/known)]));
 const models=[];
 // Identical a priori definitions in both waves. These are our experiments.
 for(const [id,label,recall,turnout,impute,sympathy]of [
 ['direct','Solo ponderación demográfica y voto válido',false,false,false,false],
 ['recall','Más corrección por recuerdo, sin imputación',true,false,false,false],
 ['turnout','Más recuerdo y participación lineal',true,true,false,false],
 ['impute','Más recuerdo y reparto NS/NC por recuerdo',true,false,true,false],
 ['sympathy','Más recuerdo, simpatía y reparto residual',true,false,true,true]]){
  const weights=rows.map(r=>r.ponde*(recall?(factors[r.p5]??1):1)*(turnout&&r.p1>=0&&r.p1<=10?r.p1/10:1)),decided={},byRecall={};
  rows.forEach((r,i)=>{if(r.p2<=21){decided[r.p2]=(decided[r.p2]||0)+weights[i];byRecall[r.p5]??={};byRecall[r.p5][r.p2]=(byRecall[r.p5][r.p2]||0)+weights[i];}});
  const values={...decided};
  if(impute)rows.forEach((r,i)=>{if(![24,25].includes(r.p2))return;const w=weights[i];if(sympathy&&r.p3>=1&&r.p3<=20){values[r.p3]=(values[r.p3]||0)+w;return;}const group=byRecall[r.p5]||decided,den=sum(Object.values(group));for(const [c,v]of Object.entries(group))values[c]=(values[c]||0)+w*v/den;});
  const den=sum(Object.values(values)),pct=parties.map(([, ,code])=>100*(values[code]||0)/den);models.push({id,label,values:pct,mae:sum(pct.map((v,i)=>Math.abs(v-target[i])))/6});
 }
 const all=Array.from({length:25},(_,i)=>i+1).map(code=>({code,n:rows.filter(r=>r.p2===code).length,raw:100*rows.filter(r=>r.p2===code).length/n,weighted:100*count(rows,r=>r.p2===code)/total,valid:code<=21?100*count(rows,r=>r.p2===code)/valid:null}));
 out.studies.push({date,fieldwork:field,sample:n,weightedBase:total,validBase:valid,weightMin:Math.min(...rows.map(r=>r.ponde)),weightMax:Math.max(...rows.map(r=>r.ponde)),effectiveN:total**2/sum(rows.map(r=>r.ponde**2)),dataFile:file.replace('.json',''),dataSha256:createHash('sha256').update(await readFile(new URL(dir+file.replace('.json',''),root))).digest('hex'),archive:downloads[sub],report:downloads[sub==='tracking10'?'report22':'report23'],all,parties:parties.map(([id,label,code],i)=>({id,label,...all.find(r=>r.code===code),estimate:target[i],delta:target[i]-all.find(r=>r.code===code).valid})),models,recall:Object.entries(ref).map(([code,v])=>({code:+code,party:recallMap[code],weighted:100*rec[code]/total,referenceVotes:v,factor:factors[code]})),ppWithUpnValid:100*count(rows,r=>[2,13].includes(r.p2))/valid});
}
const totals={};for(const c of cis.cells)totals[c.intent]=(totals[c.intent]||0)+c.w;
const total=sum(Object.values(totals)),valid=sum(Object.entries(totals).filter(([id])=>!['null','abstention','undecided','noanswer'].includes(id)).map(([,w])=>w));
const mapping={pp:'pp',psoe:'psoe',vox:'vox',fa:'original:Frente Amplio (CHA-FA en Aragón y Comuns-FA en Cataluña)',salf:'salf',podemos:'podemos'};
out.cis={study:'3587',sample:8034,fieldwork:'10–17/11/2026',date:'2026-11-23',weightedBase:total,validBase:valid,unweightedAvailable:false,ns:100*totals.undecided/total,nc:100*totals.noanswer/total,source:cis.sourceUrl,sourceSha256:cis.sha256,technicalReport:{url:'https://www.cis.es/documents/d/guest/3587_informetecnico_estimacion',sha256:createHash('sha256').update(await readFile(new URL('research/cocina-20261126/cisReport.pdf',root))).digest('hex')},parties:parties.map(([id,label])=>{const key=mapping[id],estimate={pp:24.7,psoe:34.4,vox:15.6,fa:5.7,salf:1.8,podemos:.8}[id],direct=100*totals[key]/total,normalized=100*totals[key]/valid;return {id,label,weighted:direct,valid:normalized,estimate,delta:estimate-normalized};})};
const cisRecall={};for(const c of cis.cells)cisRecall[c.recall]=(cisRecall[c.recall]||0)+c.w;
const commonRecall=Object.entries(recallMap).filter(([,id])=>cisRecall[id]>0),cisKnown=sum(commonRecall.map(([,id])=>cisRecall[id])),commonReference=sum(commonRecall.map(([code])=>ref[code]));
out.cis.recall=commonRecall.map(([code,id])=>({party:id,weighted:100*cisRecall[id]/total,factor:(ref[code]/commonReference)/(cisRecall[id]/cisKnown)}));
await writeFile(new URL('data/cooking-audit.json',root),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({studies:out.studies.map(s=>({date:s.date,n:s.sample,valid:s.validBase,models:s.models.map(m=>[m.id,m.mae])})),cis:out.cis.parties},null,2));
