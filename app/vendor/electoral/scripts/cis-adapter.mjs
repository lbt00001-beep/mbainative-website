// Published response tables only; electoral estimation annexes are never inputs.
export function extractCis(content,technical,{allowNumericLabels=false}={}){
 content=content.split('\n').map(s=>s.trim()).filter(Boolean).join('\n');
 const parts=content.split(/^Pregunta\s+([^\n]+)\n/gm),tables=[];
 for(let i=1;i<parts.length;i+=2){const code=parts[i].trim(),block=parts[i+1],rows={};
  for(const line of block.split('\n')){const m=line.trim().match(/^(.+?)\s+(\d{1,3},\d+|-)\s*$/);if(m)rows[m[1]]=m[2]==='-'?null:Number(m[2].replace(',','.'));}
  const n=block.match(/\(N\)\s*\(([\d.]+)\)/);if(Object.keys(rows).length&&n)tables.push({code,rows,sample:Number(n[1].replaceAll('.','')),wording:block.split(Object.keys(rows)[0])[0].trim().replace(/\s+/g,' ')});
 }
 const candidates=tables.filter(q=>q.code.endsWith('R')&&/a qué partido votaría/i.test(q.wording)&&/Parlamento español|elecciones generales/i.test(q.wording)&&['No votaría','No sabe todavía','PSOE','PP'].every(k=>Object.hasOwn(q.rows,k)));
 if(candidates.length!==1)throw Error('Pregunta directa ambigua o formato desconocido: revisión necesaria.');
 const direct=candidates[0];if(!allowNumericLabels&&Object.keys(direct.rows).some(k=>/^\d+$/.test(k)))throw Error('Etiqueta numérica sin partido: revisión necesaria.');
 if(Math.abs(Object.values(direct.rows).reduce((s,v)=>s+(v||0),0)-100)>.8)throw Error('La tabla directa no suma aproximadamente 100.');
 const sample=technical.match(/Realizada:\s*([\d.]+)\s*entrevistas/i);if(!sample||Number(sample[1].replaceAll('.',''))!==direct.sample)throw Error('Muestra de tabla y ficha técnica no coinciden.');
 const dates=technical.match(/Del\s+(\d+)\s+al\s+(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/i),months='enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' ');
 if(!dates||!months.includes(dates[3].toLowerCase()))throw Error('Fecha de campo no interpretable.');
 const prefix=dates[4]+'-'+String(months.indexOf(dates[3].toLowerCase())+1).padStart(2,'0')+'-',fieldworkStart=prefix+dates[1].padStart(2,'0'),fieldworkEnd=prefix+dates[2].padStart(2,'0');
 if(new Date(fieldworkStart).toISOString().slice(0,10)!==fieldworkStart||new Date(fieldworkEnd).toISOString().slice(0,10)!==fieldworkEnd||fieldworkStart>fieldworkEnd)throw Error('Campo CIS inválido.');
 const error=technical.match(/±\s*(\d+,\d+)/);
 return {direct,rawDirect:tables.find(q=>q.code===direct.code.slice(0,-1))||null,recall:tables.find(q=>q.wording.includes('¿Y podría decirme a qué partido o coalición votó?')&&Object.hasOwn(q.rows,'PP')&&q.code.endsWith('R'))||null,sympathy:tables.find(q=>q.wording.startsWith('VOTO+SIMPATÍA')&&!q.code.endsWith('R'))||null,fieldworkStart,fieldworkEnd,sample:direct.sample,theoreticalError:error?Number(error[1].replace(',','.')):null,method:'CATI; selección de teléfonos y cuotas de sexo y edad; ponderación PESO publicada.'};
}

// A malformed label can only be resolved against another complete original,
// never by assigning a party to a numeric code from memory.
export function reconcileCisAlternative(content,technical,alternative){
 const primary=extractCis(content,technical,{allowNumericLabels:true}),other=extractCis(alternative,technical);
 const unknown=Object.keys(primary.direct.rows).filter(k=>/^\d+$/.test(k));
 const added=Object.keys(other.direct.rows).filter(k=>!Object.hasOwn(primary.direct.rows,k));
 if(unknown.length!==1||added.length!==1||primary.direct.code!==other.direct.code||primary.sample!==other.sample||primary.fieldworkStart!==other.fieldworkStart||primary.fieldworkEnd!==other.fieldworkEnd||primary.direct.rows[unknown[0]]!==other.direct.rows[added[0]]||Object.keys(primary.direct.rows).length!==Object.keys(other.direct.rows).length||Object.entries(primary.direct.rows).some(([k,v])=>k!==unknown[0]&&other.direct.rows[k]!==v))throw Error('El original alternativo no resuelve inequívocamente la etiqueta CIS.');
 return {tables:other,note:`La etiqueta «${unknown[0]}» del PDF CIS se contrasta con «${added[0]}» en el avance original alternativo. Coinciden pregunta, muestra y todas las cifras de la tabla directa.`};
}

export function extractCisEstimate(content,study){
 if(!new RegExp('Estudio\\s+n[º°o]?\\s*'+study+'\\b','i').test(content)||!/sobre el\s+voto v[aá]lido/i.test(content))throw Error('Identidad o denominador de la estimación CIS desconocidos.');
 const labels={PSOE:'psoe',PP:'pp',VOX:'vox',SUMAR:'sumar',Podemos:'podemos',ERC:'erc','Se Acabó la Fiesta':'salf','EH Bildu':'bildu',BNG:'bng',Junts:'junts','EAJ-PNV':'pnv',CCa:'cc',UPN:'upn','Otros partidos':'others','En blanco':'blank'};
 const values={},direct={},evidence={};
 for(const line of content.split('\n')){
  const m=line.trim().match(/^(.+?)\s+(\d+(?:,\d+)?)\s+±\s*\d+(?:,\d+)?\s+(\d+(?:,\d+)?)\s*$/);
  if(!m)continue;const label=m[1].replace(/\*+/g,'').replace(/\s*\/\s*Frente Amplio/i,'').trim(),id=labels[label];
  if(!id)throw Error('Categoría de estimación CIS desconocida: '+label);
  if(Object.hasOwn(values,id))throw Error('Tabla de estimación CIS duplicada.');
  values[id]=Number(m[3].replace(',','.'));direct[id]=Number(m[2].replace(',','.'));evidence[id]=line.trim();
 }
 if(!['pp','psoe','vox','sumar'].every(k=>Number.isFinite(values[k]))||Object.values(values).some(v=>v<0||v>100)||Math.abs(Object.values(values).reduce((s,v)=>s+v,0)-100)>.8)throw Error('Vector de estimación CIS incompleto o incompatible.');
 const n=content.match(/\(N\)\s*\(([\d.]+)\)/);if(!n)throw Error('Estimación CIS sin muestra.');
 return {values,direct,evidence,sample:Number(n[1].replaceAll('.','')),denominator:'validVotes'};
}
