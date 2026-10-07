import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {deflateRawSync} from 'node:zlib';
import {aggregateCsv,csvFromZip,parseCsv,createMicrodataService} from '../scripts/microdata-service.mjs';
const studyUrl='https://www.cis.es/es/estudios/barometro-de-septiembre-2026',base='https://www.cis.es/documents/20117/14250083/';
const headers=['INTENCIONGR: Intención de voto elecciones generales','RECUERDO: Recuerdo de elecciones generales de 2023','PROBVOTO','SEXO','EDAD','INGRESHOG','ESCIDEOL','PESO'];
const csv=Buffer.from(headers.join(';')+'\n'+Array.from({length:1000},(_,i)=>[i%2?'PP':'PSOE',i%2?'PP':'PSOE','10','Mujer','35','1.000 a 2.000','5','1'].join(';')).join('\n'));
const technical='ESTUDIO CIS Nº 3577 Ámbito: Nacional. Realizada: 1.000 entrevistas. Del 1 al 4 de septiembre de 2026.';
function zip(bytes){const name=Buffer.from('3577_etiq.csv'),compressed=deflateRawSync(bytes),local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(8,8);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(name.length,26);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(8,10);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(bytes.length,24);central.writeUInt16LE(name.length,28);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+name.length,12);end.writeUInt32LE(local.length+name.length+compressed.length,16);return Buffer.concat([local,name,compressed,central,name,end]);}
test('CSV conserva campos citados; ZIP rechazado y categorías desconocidas no inventan partidos',()=>{
 assert.deepEqual(parseCsv('a;b\n"uno;dos";"tres""cuatro"\n'),[['a','b'],['uno;dos','tres"cuatro']]);
 assert.deepEqual(csvFromZip(zip(csv),'3577'),csv);assert.throws(()=>csvFromZip(Buffer.from('invalid'),'3577'));
 const data=aggregateCsv(csv,{study:'3577'},technical);assert.equal(data.sample,1000);assert.equal(data.cells.filter(c=>c.dimension==='total').reduce((n,c)=>n+c.n,0),1000);
 assert.throws(()=>aggregateCsv(Buffer.from(csv.toString().replace('PSOE;PSOE','Partido desconocido;PSOE')),{study:'3577'},technical),/Categoría nueva/);
 assert.throws(()=>aggregateCsv(csv,{study:'3577'},technical.replace('1.000','2.000')),/muestra/);
 assert.throws(()=>aggregateCsv(Buffer.from(csv.toString().replace('generales de 2023','generales de 2019')),{study:'3577'},technical),/referencia/);
});
test('Buscar no importa; incorporación explícita persiste y errores conservan estudios anteriores',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'micro-update-'));let calls=0,broken=false;
 const fetchDocument=async(url,binary)=>{calls++;if(broken)throw Error('CIS no accesible');if(url.endsWith('/es/'))return '<a href="'+studyUrl+'">Barómetro septiembre</a>';if(url===studyUrl)return '<title>Barómetro septiembre - CIS</title><data-file url="'+base+'MD3577.zip"></data-file><a href="'+base+'FT3577.pdf">Ficha</a><a href="'+base+'cues3577.pdf">Cuestionario</a>';if(binary)return url.endsWith('.zip')?zip(csv):Buffer.from('ficha');throw Error('URL inesperada');};
 const options={root,origin:'https://example.com',fetchDocument,pdfText:async()=>technical,now:()=>Date.parse('2026-10-07T10:00Z')};
 try{let service=createMicrodataService(options);const post=payload=>service({method:'POST',origin:options.origin,bytes:20,payload});
  assert.equal((await service({method:'GET'})).body.studies.length,0);assert.equal(calls,0);
  assert.equal((await service({method:'POST',origin:'https://evil.test',payload:{action:'search'}})).status,403);assert.equal(calls,0);
  assert.equal((await post({action:'import',study:'9999'})).status,400);assert.equal(calls,0);
  const searched=await post({action:'search'});assert.equal(searched.status,200);assert.equal(searched.body.candidates.length,1);assert.equal(searched.body.studies.length,0);
  const imported=await post({action:'import',study:'3577'});assert.equal(imported.status,200);assert.equal(imported.body.studies[0].sample,1000);
  const persisted=await readFile(path.join(root,'data/microdata-library.json'),'utf8');service=createMicrodataService(options);assert.equal((await service({method:'GET'})).body.studies[0].study,'3577');
  broken=true;assert.equal((await post({action:'search'})).status,422);assert.equal(await readFile(path.join(root,'data/microdata-library.json'),'utf8'),persisted);
  assert.equal((await post({action:'import',study:'3577'})).status,422);assert.equal(await readFile(path.join(root,'data/microdata-library.json'),'utf8'),persisted);
 }finally{assert.ok(root.startsWith(path.join(os.tmpdir(),'micro-update-')));await rm(root,{recursive:true,force:true});}
});
