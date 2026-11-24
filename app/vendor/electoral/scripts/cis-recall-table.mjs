const known={PSOE:'psoe',PP:'pp',VOX:'vox',Sumar:'sumar',Podemos:'podemos',ERC:'erc',Junts:'junts','EH Bildu':'bildu','EAJ-PNV':'pnv',BNG:'bng',CCa:'cc',UPN:'upn',PACMA:'pacma','Adelante Andalucía':'aa','Se Acabó la Fiesta':'salf','No sabe todavía':'undecided','N.C.':'noanswer','N.R.':'norecall','No recuerda':'norecall','No tenía edad':'underage','No tenía derecho a voto':'ineligible','No votó':'abstention','No votaría':'abstention','En blanco':'blank','Voto nulo':'null',Nulo:'null','Otro partido':'others'};

// Weighted contingency cells, not reconstructed respondent records.
export function recallTableDataset({recallRows,nationalRows,reference,metadata}){
 const start=recallRows.findIndex(r=>r[0]===metadata.question),end=recallRows.findIndex((r,i)=>i>start&&r[0]==='(N)'),nationalStart=nationalRows.findIndex(r=>r[0]===metadata.question);
 if(start<0||end<=start+4||nationalStart<0)throw Error('Cruce CIS o marginal nacional ausente.');
 const names=recallRows[start+3],bases=recallRows[end],labels={},cells=[],raw={};
 const id=label=>{if(typeof label!=='string'||!label.trim())throw Error('Etiqueta CIS ausente.');const key=known[label]||'original:'+label;labels[key]=label;return key;};
 const baseTotal=bases.slice(2).reduce((s,n)=>s+n,0);
 if(names.length!==bases.length||new Set(names.slice(2)).size!==names.length-2||names.slice(2).some(n=>typeof n!=='string')||bases.slice(2).some(n=>!Number.isFinite(n)||n<=0)||Math.abs(baseTotal-metadata.sample)>.1||Math.abs(bases[1]-baseTotal)>1e-6)throw Error('Bases del cruce CIS incompatibles.');
 for(let j=2;j<names.length;j++){
  let percentage=0;
  for(let i=start+4;i<end;i++){
   const v=recallRows[i][j];if(!Number.isFinite(v)||v<0||v>100)throw Error('Porcentaje del cruce CIS inválido.');
   const intent=id(recallRows[i][0]),recall=id(names[j]);percentage+=v;
   if(v>0){const w=bases[j]*v/100;cells.push({recall,intent,w});raw[intent]=(raw[intent]||0)+w;}
  }
  if(Math.abs(percentage-100)>1e-6)throw Error('Una columna del cruce CIS no suma 100.');
 }
 for(let i=start+4;i<end;i++){
  const row=recallRows[i],national=nationalRows.slice(nationalStart+2).find(r=>r[0]===row[0]);
  if(!national||!Number.isFinite(national[1])||Math.abs(100*(raw[id(row[0])]||0)/baseTotal-national[1])>1e-6)throw Error('El cruce no reproduce las frecuencias nacionales CIS: '+row[0]);
 }
 return {...metadata,kind:'recallTable',labels,cells,reference,referenceElection:'2023-07-23',weightedBase:baseTotal};
}
