import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,writeFile,mkdir,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {deflateRawSync} from 'node:zlib';
import {aggregate40db,xlsxRows,zipEntries,update40db} from '../scripts/40db-microdata.mjs';
import {analyzeMicrodata} from '../assets/microdata.mjs';
import {originalReports} from '../scripts/original-reports.mjs';
import {estimate} from '../assets/polling.mjs';

function zip(files){const locals=[],centrals=[];let offset=0;for(const [filename,content]of Object.entries(files)){const bytes=Buffer.from(content),name=Buffer.from(filename),raw=deflateRawSync(bytes),local=Buffer.alloc(30),central=Buffer.alloc(46);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(8,8);local.writeUInt32LE(raw.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(name.length,26);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(8,10);central.writeUInt32LE(raw.length,20);central.writeUInt32LE(bytes.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);locals.push(local,name,raw);centrals.push(central,name);offset+=local.length+name.length+raw.length;}const dir=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,dir,end]);}
const fixture=JSON.parse(readFileSync(new URL('fixtures/40db-flash-pages.json',import.meta.url),'utf8'));
const note='40dB. Panelistas CINT. Cuotas por sexo y edad. Ponderación demográfica iterativa raking; variable ponde.';
const r=originalReports[0],meta={sourceUrl:r.microdataUrl,reportUrl:r.url,studyUrl:r.publicationUrl,publishedAt:r.publishedAt};
const choices=[...Array(184).fill('PSOE'),...Array(164).fill('PP'),...Array(161).fill('Vox'),...Array(34).fill('Sumar/Frente Amplio'),...Array(17).fill('Se acabó la fiesta'),...Array(14).fill('Podemos'),...Array(226).fill('No lo sé')];
const rows=choices.map((p2,i)=>({id:'private-'+i,sexo:i%2?'Hombre':'Mujer',edad:35,edad_r:'35-44',educacion_r:'Educación superior',situacion_laboral_r:'Trabaja',clase_social_r:'Media',p1:i%3?'10 Con toda seguridad, iría a votar':'No lo sé / Prefiero no contestar',p2,p5:['Sumar/Frente Amplio','Podemos'].includes(p2)?'Sumar/Frente Amplio + Podemos':p2,p9:i%2?'PP':'PSOE',p10:'0 Extrema izquierda',ponde:1}));
test('40dB: valida el vector directo, conserva bases y separa candidatura unitaria',()=>{
 const data=aggregate40db(rows,meta,fixture,note),a=analyzeMicrodata(data,{dimension:'total'});
 assert.equal(data.sample,800);assert.equal(a.initial.psoe,184);assert.equal(a.initial.pp,164);assert.equal(a.initial.vox,161);
 assert.equal(data.methodology.recruitment,'panel');assert.equal(data.methodology.weighting,'documented');assert.equal(data.dimensions.income,undefined);assert.ok(data.dimensions.socialClass);assert.ok(data.cells.some(c=>c.dimension==='ideology'&&c.group==='0'));assert.ok(!JSON.stringify(data).includes('private-'));
 assert.equal(data.publishedEstimate.pp,31.9);assert.equal(data.alternatives.length,1);
 const joint=analyzeMicrodata({...data,...data.alternatives[0]},{dimension:'total'});assert.equal(joint.initial.sumar,48);assert.equal(joint.initial.podemos,undefined);
 assert.throws(()=>aggregate40db(rows.slice(1),meta,fixture,note),/muestra/);assert.throws(()=>aggregate40db(rows.map(x=>({...x,p2:'PP'})),meta,fixture,note),/intención directa/);assert.throws(()=>aggregate40db(rows.map(x=>({...x,p2:'Desconocido'})),meta,fixture,note),/Categoría/);
 assert.throws(()=>aggregate40db(rows,meta,fixture,'Sin ficha'),/nota metodológica/);
});
test('Excel ZIP: lee texto etiquetado y rechaza fórmulas, truncado y documentos inválidos',()=>{
 const shared='<sst><si><t>sexo</t></si><si><t>ponde</t></si><si><t>Mujer &amp; dato</t></si></sst>',sheet='<worksheet><sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row><c r="A2" t="s"><v>2</v></c><c r="B2"><v>1.25</v></c></row></sheetData></worksheet>';
 const files={'xl/sharedStrings.xml':shared,'xl/worksheets/sheet1.xml':sheet};assert.deepEqual(xlsxRows(zip(files)),[{sexo:'Mujer & dato',ponde:1.25}]);
 assert.throws(()=>xlsxRows(zip({...files,'xl/worksheets/sheet1.xml':sheet.replace('<v>1.25</v>','<f>1+1</f><v>2</v>')})),/fórmulas/);assert.throws(()=>zipEntries(zip(files).subarray(0,20)));assert.throws(()=>xlsxRows(zip({'wrong.xml':'abc'})),/compatible/);
});
test('Actualizador: ficha completa cambia peso; errores y comprobaciones conservan biblioteca',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'40db-update-'));const data=aggregate40db(rows,meta,fixture,note),bytes=Buffer.from('archive already verified'),{createHash}=await import('node:crypto');data.sha256=createHash('sha256').update(bytes).digest('hex');
 const library={schemaVersion:1,studies:[data,{study:'3577',institute:'CIS'}],candidates:[],issues:[]};await mkdir(path.join(root,'data'));await writeFile(path.join(root,'data/microdata-library.json'),JSON.stringify(library));
 const catalog=JSON.parse(readFileSync(new URL('fixtures/polls-baseline.json',import.meta.url),'utf8')),official=JSON.parse(readFileSync(new URL('../data/official-2023.json',import.meta.url),'utf8'));catalog.polls.push({...JSON.parse(JSON.stringify(catalog.polls.find(p=>p.institute==='40dB'))),id:data.study,url:r.url,fieldworkStart:data.fieldworkStart,fieldworkEnd:data.fieldworkEnd,sample:800,publishedAt:r.publishedAt,values:data.publishedEstimate});catalog.asOf=r.publishedAt;
 try{const before=estimate(catalog,official),report={};await update40db({root,catalog,report,archives:[meta],fetchDocument:async()=>bytes});const after=estimate(catalog,official);assert.equal(after.selected.length,before.selected.length);assert.ok(after.selected.find(p=>p.institute==='40dB').weight>before.selected.find(p=>p.institute==='40dB').weight);assert.notEqual(after.values.psoe,before.values.psoe);assert.equal(report.microdata[0].status,'known');assert.equal(report.metadataUpdates.length,1);
  const saved=await readFile(path.join(root,'data/microdata-library.json'),'utf8');const second={};await update40db({root,catalog,report:second,archives:[meta],fetchDocument:async()=>{throw Error('HTTP 403');}});assert.equal(second.microdata[0].status,'pending');assert.equal(await readFile(path.join(root,'data/microdata-library.json'),'utf8'),saved);
 }finally{assert.ok(root.startsWith(path.join(os.tmpdir(),'40db-update-')));await rm(root,{recursive:true,force:true});}
});
