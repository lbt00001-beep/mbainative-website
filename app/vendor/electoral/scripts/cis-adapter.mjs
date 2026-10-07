// Published response tables only; electoral estimation annexes are never inputs.
export function extractCis(content,technical){
 content=content.split('\n').map(s=>s.trim()).filter(Boolean).join('\n');
 const parts=content.split(/^Pregunta\s+([^\n]+)\n/gm),tables=[];
 for(let i=1;i<parts.length;i+=2){const code=parts[i].trim(),block=parts[i+1],rows={};
  for(const line of block.split('\n')){const m=line.trim().match(/^(.+?)\s+(\d{1,3},\d+|-)\s*$/);if(m)rows[m[1]]=m[2]==='-'?null:Number(m[2].replace(',','.'));}
  const n=block.match(/\(N\)\s*\(([\d.]+)\)/);if(Object.keys(rows).length&&n)tables.push({code,rows,sample:Number(n[1].replaceAll('.','')),wording:block.split(Object.keys(rows)[0])[0].trim().replace(/\s+/g,' ')});
 }
 const candidates=tables.filter(q=>q.code.endsWith('R')&&/a qué partido votaría/i.test(q.wording)&&/Parlamento español|elecciones generales/i.test(q.wording)&&['No votaría','No sabe todavía','PSOE','PP'].every(k=>Object.hasOwn(q.rows,k)));
 if(candidates.length!==1)throw Error('Pregunta directa ambigua o formato desconocido: revisión necesaria.');
 const direct=candidates[0];if(Object.keys(direct.rows).some(k=>/^\d+$/.test(k)))throw Error('Etiqueta numérica sin partido: revisión necesaria.');
 if(Math.abs(Object.values(direct.rows).reduce((s,v)=>s+(v||0),0)-100)>.8)throw Error('La tabla directa no suma aproximadamente 100.');
 const sample=technical.match(/Realizada:\s*([\d.]+)\s*entrevistas/i);if(!sample||Number(sample[1].replaceAll('.',''))!==direct.sample)throw Error('Muestra de tabla y ficha técnica no coinciden.');
 const dates=technical.match(/Del\s+(\d+)\s+al\s+(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/i),months='enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' ');
 if(!dates||!months.includes(dates[3].toLowerCase()))throw Error('Fecha de campo no interpretable.');
 const prefix=dates[4]+'-'+String(months.indexOf(dates[3].toLowerCase())+1).padStart(2,'0')+'-',fieldworkStart=prefix+dates[1].padStart(2,'0'),fieldworkEnd=prefix+dates[2].padStart(2,'0');
 if(new Date(fieldworkStart).toISOString().slice(0,10)!==fieldworkStart||new Date(fieldworkEnd).toISOString().slice(0,10)!==fieldworkEnd||fieldworkStart>fieldworkEnd)throw Error('Campo CIS inválido.');
 const error=technical.match(/±\s*(\d+,\d+)/);
 return {direct,rawDirect:tables.find(q=>q.code===direct.code.slice(0,-1))||null,recall:tables.find(q=>q.wording.includes('¿Y podría decirme a qué partido o coalición votó?')&&Object.hasOwn(q.rows,'PP')&&q.code.endsWith('R'))||null,sympathy:tables.find(q=>q.wording.startsWith('VOTO+SIMPATÍA')&&!q.code.endsWith('R'))||null,fieldworkStart,fieldworkEnd,sample:direct.sample,theoreticalError:error?Number(error[1].replace(',','.')):null,method:'CATI; selección de teléfonos y cuotas de sexo y edad; ponderación PESO publicada.'};
}
