import {createHash} from 'node:crypto';
import {technicalMetadata} from './poll-adapters.mjs';
const monthNames='enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' ');
const partyIds={'PP':'pp','PSOE':'psoe','Vox':'vox','Frente Amplio':'sumar','Sumar':'sumar','Podemos':'podemos','Se acabó la fiesta':'salf'};
export function parseTargetVoteChart(html,csv,{url,technicalText,publishedAt}){
 const u=new URL(url);if(u.hostname!=='datawrapper.dwcdn.net'||u.protocol!=='https:'||!/^\/[A-Za-z0-9]{5}\/\d+\/$/.test(u.pathname)||u.search||u.username||u.password||u.port)throw Error('Gráfico electoral no permitido.');
 const match=html.match(/window\.__DW_SVELTE_PROPS__\s*=\s*JSON\.parse\(("(?:\\.|[^"\\])*")\)/);
 if(!match)throw Error('Formato del gráfico Target Point no reconocido.');
 const props=JSON.parse(JSON.parse(match[1])),chart=props.chart,describe=chart?.metadata?.describe;
 if(chart?.title!=='Porcentaje de voto'||describe?.['source-name']!=='Target Point'||props.assets?.['dataset.csv']?.url!=='dataset.csv'||chart.publicId!==u.pathname.split('/')[1])throw Error('Identidad o medida del gráfico incompatible.');
 const meta=technicalMetadata(technicalText,publishedAt),date=describe.intro?.match(/(?:del?\s+)?(\d{1,2}) de (\w+)/i);
 if(!meta.fieldworkEnd||!meta.sample||!date||Number(meta.fieldworkEnd.slice(8))!==Number(date[1])||Number(meta.fieldworkEnd.slice(5,7))!==monthNames.indexOf(date[2].toLowerCase())+1)throw Error('El gráfico y la ficha no acreditan el mismo trabajo de campo.');
 const rows=csv.replace(/^\uFEFF/,'').replace(/(?:\r?\n)+$/,'').split(/\r?\n/).map(row=>row.split('\t'));
 if(rows[0]?.[0]!=='Partido'||rows[0]?.[1]!=='Porcentaje'||!/^GEN\.\s*2023$/.test(rows[0]?.[2]||''))throw Error('Columnas del gráfico de voto no reconocidas.');
 const values={},evidence={};
 for(const row of rows.slice(1)){
  if(row.length!==3)throw Error('Fila del gráfico incompatible.');
  const[label,current]=row;if(!current.trim())continue; // Historical Sumar is not a current zero.
  const id=Object.hasOwn(partyIds,label)?partyIds[label]:null;if(!id||Object.hasOwn(values,id)||!/^\d{1,2}(?:[,.]\d{1,2})?$/.test(current.trim()))throw Error('Categoría o porcentaje ambiguo en el gráfico.');
  values[id]=Number(current.replace(',','.'));evidence[id]=label+' · columna Porcentaje: '+current+'; '+url+'dataset.csv';
 }
 if(!['pp','psoe','vox','sumar'].every(id=>Object.hasOwn(values,id))||Object.values(values).reduce((s,v)=>s+v,0)>100.11)throw Error('Vector electoral incompleto o incompatible.');
 return {values,evidence,url,dataUrl:url+'dataset.csv',sha256:createHash('sha256').update(csv).digest('hex'),fieldworkEnd:meta.fieldworkEnd};
}
export async function loadTargetVoteChart(document,fetchDocument){
 if(document.voteCharts?.length!==1)throw Error('Se requiere un único gráfico de porcentaje de voto.');
 const url=document.voteCharts[0].url,u=new URL(url);if(u.hostname!=='datawrapper.dwcdn.net'||u.protocol!=='https:'||!/^\/[A-Za-z0-9]{5}\/\d+\/$/.test(u.pathname)||u.search||u.username||u.password||u.port)throw Error('Gráfico electoral no permitido.');
 const html=await fetchDocument(url),csv=await fetchDocument(url+'dataset.csv');
 return {...parseTargetVoteChart(html,csv,{url,technicalText:document.technicalText,publishedAt:document.publishedAt}),csv};
}
