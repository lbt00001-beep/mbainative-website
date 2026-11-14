import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {csvFromZip,parseCsv,aggregateCsv} from './microdata-service.mjs';
import {readPdf} from './pdf-reader.mjs';
import {nationalVotes} from '../assets/electoral.mjs';
import {reestimateCis,cisSensitivity} from '../assets/cis-estimator.mjs';
const root=new URL('../',import.meta.url),folder=new URL('research/cis-3584-audit/',root);
const load=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const official=await load('data/official-2023.json'),reference=nationalVotes(official.provinces).totals;
const known={PSOE:'psoe',PP:'pp',VOX:'vox',Sumar:'sumar',Podemos:'podemos',ERC:'erc',Junts:'junts','EH Bildu':'bildu','EAJ-PNV':'pnv',BNG:'bng',CCa:'cc',UPN:'upn',PACMA:'pacma','Adelante Andalucía':'aa','Se Acabó la Fiesta':'salf','Coalición de izquierdas':'leftCoalition','No sabe todavía':'undecided','N.C.':'noanswer','N.R.':'norecall','No recuerda':'norecall','No tenía edad':'underage','No tenía derecho a voto':'ineligible','No votó':'abstention','No votaría':'abstention','En blanco':'blank','Voto nulo':'null',Nulo:'null','Otro partido':'others'};
function mapper(){const labels={};return {labels,id(label){if(!label)throw Error('Etiqueta vacía.');const id=known[label]||'original:'+label;labels[id]=label;return id;}};}
const bytes=await readFile(new URL('MD3582.zip',folder)),zipHash=createHash('sha256').update(bytes).digest('hex');
assert.equal(zipHash,'1cfcf43b38ee036bb89dadc7d9b88a70d2098bb2c1a5051921aa517415a00c9f');
const csv=csvFromZip(bytes,'3582'),[headers,...rows]=parseCsv(new TextDecoder('utf-8',{fatal:true}).decode(csv).replace(/^\uFEFF/,''));
assert.equal(rows.length,5024);
const fields=Object.fromEntries(headers.map((h,i)=>[h.split(':')[0],i])),microMap=mapper(),aggregate=new Map();
for(const k of ['INTENCIONGR','RECUERDO','PROBVOTO','SIMPATIAR','PESO'])assert.notEqual(fields[k],undefined);
for(const row of rows){const get=k=>row[fields[k]],w=Number(get('PESO').replace(',','.'));assert.ok(w>0&&Number.isFinite(w));
 const intent=microMap.id(get('INTENCIONGR')),recall=microMap.id(get('RECUERDO')),probability=get('PROBVOTO').match(/^(10|[0-9])(?:\s|$)/),turnout=probability?Number(probability[1]):null;
 const source=get('SIMPATIAR'),sympathy=['N.P.','N.S.','N.C.','Ninguno',''].includes(source)?null:microMap.id(source);
 const key=JSON.stringify([intent,recall,turnout,sympathy]),c=aggregate.get(key)||{intent,recall,turnout,sympathy,n:0,w:0,w2:0};c.n++;c.w+=w;c.w2+=w*w;aggregate.set(key,c);
}
const micro={study:'3582',kind:'microdata',title:'CIS 3582 · Barómetro de octubre',sample:5024,publishedAt:'2026-10-14',fieldworkStart:'2026-10-01',fieldworkEnd:'2026-10-06',labels:microMap.labels,cells:[...aggregate.values()],reference,referenceElection:'2023-07-23',sourceUrl:'https://www.cis.es/documents/20117/14396821/MD3582.zip',sha256:zipHash,technicalUrl:'https://www.cis.es/documents/20117/14396821/FT3582.pdf',note:'Microdatos agregados sin identificadores. PESO conserva el ajuste demográfico publicado; la corrección por recuerdo se aplica después. Coalición de izquierdas es una categoría original separada; no se asigna a Frente Amplio.'};
// Independent check with the validated general-purpose importer and the official technical sheet.
const technical=(await readPdf(fileURLToPath(new URL('FT3582.pdf',folder)))).pages.join('\n');
const generic=aggregateCsv(csv,{study:'3582',title:micro.title,sourceUrl:micro.sourceUrl},technical);
assert.equal(generic.sample,micro.sample);
const fromGeneric={};for(const c of generic.cells.filter(c=>c.dimension==='total'))fromGeneric[c.intent]=(fromGeneric[c.intent]||0)+c.w;
for(const [id,v] of Object.entries(reestimateCis(micro,{recallStrength:0,nsRate:0,ncRate:0}).raw))assert.ok(Math.abs(v-fromGeneric[id])<1e-7);
const workbookBytes=await readFile(new URL('cis-provinces.xlsx',folder)),workbookHash=createHash('sha256').update(workbookBytes).digest('hex');
assert.equal(workbookHash,'526cccaa83d170ee91f8a3c10263b0186e943c7606d5afdea82df50c1113dfcd');
const workbook=JSON.parse(await readFile(new URL('workbook-values.json',folder),'utf8')),sheet=workbook['RV EG23'],start=sheet.findIndex(r=>r[0]==='Pregunta 3R'),end=sheet.findIndex((r,i)=>i>start&&r[0]==='(N)'),names=sheet[start+3],bases=sheet[end],tableMap=mapper(),tableCells=[];
assert.ok(start>0&&end>start);assert.equal(names.length,22);
for(let j=2;j<names.length;j++){let percentage=0;for(let i=start+4;i<end;i++){const v=sheet[i][j];assert.ok(typeof v==='number'&&v>=0&&v<=100);percentage+=v;if(v>0)tableCells.push({recall:tableMap.id(names[j]),intent:tableMap.id(sheet[i][0]),w:bases[j]*v/100});}assert.ok(Math.abs(percentage-100)<1e-7);}
const table={study:'3584',kind:'recallTable',title:'CIS 3584 · Preelectoral',sample:45074,publishedAt:'2026-11-12',fieldworkStart:'2026-10-07',fieldworkEnd:'2026-10-30',labels:tableMap.labels,cells:tableCells,reference,referenceElection:'2023-07-23',sourceUrl:'https://www.cis.es/documents/d/guest/3584-multi_A-xlsx',sha256:workbookHash,technicalUrl:'https://www.cis.es/documents/d/guest/es3584mar_A-pdf',note:'Cruce nacional publicado P3R × participación y recuerdo 2023, hoja RV EG23. Son tablas ponderadas, no entrevistas individuales. Permite corregir recuerdo y repartir indecisos dentro de ese recuerdo. No permite combinar simpatía, edad o participación individual ni construir cocientes provinciales.'};
const tableBaseline=reestimateCis(table,{recallStrength:0,nsRate:0,ncRate:0}),national=workbook['Resultados total nacional'],nationalStart=national.findIndex(r=>r[0]==='Pregunta 3R');
for(const [offset,id]of [[2,'psoe'],[3,'pp'],[4,'vox']])assert.ok(Math.abs(100*tableBaseline.raw[id]/tableBaseline.rawTotal-national[nationalStart+offset][1])<.001);
const originalEstimate=workbook['Estimación de Voto'].slice(9,27).filter(r=>typeof r[3]==='number').map(r=>({label:r[0],value:r[3]}));table.publishedEstimate=originalEstimate;
const history=await load('calibration/microdata-3411.json'),historical={...history,kind:'microdata',reference:history.reference,cells:history.cells.filter(c=>c.dimension==='total').map(c=>({...c,turnout:/^(10|[0-9])$/.test(c.turnout)?+c.turnout:null}))};
const methods=[['PESO sin corrección',{recallStrength:0,nsRate:0,ncRate:0}],['Solo corrección por recuerdo',{nsRate:0,ncRate:0}],['Recuerdo + NS 100 % / NC 50 %',{}],['Recuerdo + reparto + participación lineal',{participation:'declared'}],['Recuerdo + reparto + filtro 9–10',{participation:'certain'}]];
const votes=nationalVotes(official.provinces),valid=votes.total+official.provinces.reduce((s,p)=>s+p.blankVotes,0),ids=['pp','psoe','vox','sumar'];
const validation={study:'3411',election:'2023-07-23',referenceElection:'2019-11-10',sourceUrl:history.sourceUrl,actual:Object.fromEntries(ids.map(id=>[id,100*votes.totals[id]/valid])),rows:methods.map(([label,p])=>{const r=reestimateCis(historical,p),values=Object.fromEntries(ids.map(id=>[id,r.validPercent[id]||0]));return {label,values,mae:ids.reduce((s,id)=>s+Math.abs(values[id]-100*votes.totals[id]/valid),0)/ids.length,effectiveN:r.effectiveN};}),note:'Retrospectiva de una sola elección, 2023, usando recuerdo de 2019. No se han elegido parámetros para minimizar el error. No es validación prospectiva ni acredita superioridad. La variante de simpatía no se evalúa: estos agregados históricos no conservan esa variable.'};
const output={schemaVersion:1,preparedOn:'2026-11-15',referenceSource:official.source.verificationUrl,referenceNote:'Resultados oficiales 2023 entre candidaturas comparables, incluidos votos CERA, frente a una encuesta de residentes en 2026. No se fuerza abstención, nuevos electores o falta de recuerdo. El ajuste puede alterar los márgenes demográficos previamente ponderados.',datasets:[table,micro],validation,methodology:[{title:'YouGov: intención, participación e imputación',url:'https://yougov.com/en-gb/articles/54278-how-yougov-conducts-voting-intention-polling'},{title:'Ipsos: participación y segunda pregunta',url:'https://www.ipsos.com/en-uk/ipsos-political-polling-methodology'},{title:'CIS/REIS: debate sobre recuerdo de voto',url:'https://reis.cis.es/index.php/reis/article/view/2549'}]};
await writeFile(new URL('data/cis-reestimation.json',root),JSON.stringify(output));
const results=output.datasets.map(d=>({study:d.study,kind:d.kind,sample:d.sample,scenarios:methods.filter(([,p])=>d.kind==='microdata'||!p.participation).map(([label,p])=>({label,values:reestimateCis(d,p).validPercent})),sensitivity:cisSensitivity(d)}));
await mkdir(new URL('outputs/',root),{recursive:true});await writeFile(new URL('outputs/cis-reestimation-results.json',root),JSON.stringify({datasets:results,validation},null,2));
console.log(JSON.stringify({datasets:output.datasets.map(d=>({study:d.study,cells:d.cells.length,sample:d.sample})),validation:validation.rows.map(r=>({method:r.label,mae:r.mae}))},null,2));
