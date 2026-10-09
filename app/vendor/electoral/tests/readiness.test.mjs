import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm,utimes} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {identifyMethodology,methodologyWeight} from '../assets/methodology.mjs';
import {estimateForDate,madridDate} from '../assets/freshness.mjs';
import {withCatalogLock,atomicWrite,commitCatalog} from '../scripts/catalog-store.mjs';
import {createUpdateService} from '../scripts/update-service.mjs';
import {createNextHandler} from '../deployment/next-handler.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const catalog=JSON.parse(await readFile(path.join(root,'tests/fixtures/polls-baseline.json'),'utf8')),official=JSON.parse(await readFile(path.join(root,'data/official-2023.json'),'utf8'));
test('Metodología: estar en línea no acredita selección probabilística ni ponderación',()=>{
 const m=identifyMethodology('Procedimiento: CAWI. Tamaño: 8000 entrevistas.','https://example.com');assert.equal(m.mode,'online');assert.equal(m.recruitment,'unknown');assert.equal(m.weighting,'unknown');
 const panel=identifyMethodology('Ficha técnica Encuestadora: X. Panelistas fijos, cuotas por sexo y ponderación demográfica.','https://example.com');assert.equal(panel.recruitment,'panel');assert.equal(methodologyWeight({methodology:panel}).cap,1500);
 assert.equal(methodologyWeight({methodology:panel,sample:8000}).factor,.8);
 const probability=identifyMethodology('Muestreo probabilístico, cuotas y ponderación.','https://example.com');assert.equal(methodologyWeight({methodology:probability}).cap,3000);assert.equal(methodologyWeight({methodology:probability}).factor,1);
 assert.ok(methodologyWeight({methodology:{...panel,recruitment:'open'}}).factor<methodologyWeight({methodology:panel}).factor);
});
test('Fechas: una consulta sin sondeos nuevos no rejuvenece las observaciones',()=>{
 const a=estimateForDate(catalog,official,'2026-10-06'),b=estimateForDate(catalog,official,'2026-10-07');assert.equal(b.lastPublication,'2026-10-05');assert.equal(b.calculatedAt,'2026-10-07');assert.equal(b.dataAge,2);assert.equal(catalog.asOf,'2026-10-06');
 for(const p of a.selected){const q=b.selected.find(q=>q.id===p.id);assert.ok(Math.abs(q.recency/p.recency-2**(-1/21))<1e-10);assert.ok(Math.abs(q.weightPercent-p.weightPercent)<1e-10);}
 const c=estimateForDate(catalog,official,'2026-11-04');assert.ok(c.selected.length<a.selected.length);assert.ok(c.selected.every(p=>p.age<=60));
 const expired=estimateForDate(catalog,official,'2027-01-01');assert.equal(expired.expired,true);assert.equal(expired.calculatedAt,'2027-01-01');assert.equal(expired.asOf,catalog.asOf);
 assert.equal(madridDate(new Date('2026-10-06T22:30:00Z')),'2026-10-07');
});
test('Catálogo: exclusión mutua, fallo de escritura y evaluación fallida conservan datos',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'electoral-store-'));await mkdir(path.join(dir,'data'));const file=path.join(dir,'data/polls.json'),original='{"asOf":"2026-10-06"}\n';await writeFile(file,original);
 try{
  let release;const held=withCatalogLock(dir,()=>new Promise(r=>release=r));await new Promise(r=>setTimeout(r,20));await assert.rejects(withCatalogLock(dir,async()=>{}),/otra actualización/);release();await held;
  await assert.rejects(commitCatalog(dir,original,{asOf:'2026-10-07'},{writer:async()=>{throw Error('Disco lleno');}}),/Disco lleno/);assert.equal(await readFile(file,'utf8'),original);
  await assert.rejects(commitCatalog(dir,original,{asOf:'2026-10-07'},{verify:async()=>{throw Error('Evaluación fallida');}}),/Evaluación/);assert.equal(await readFile(file,'utf8'),original);
  await atomicWrite(file,'{"manual":true}');await assert.rejects(commitCatalog(dir,original,{asOf:'2026-10-07'}),/cambió/);assert.equal(await readFile(file,'utf8'),' {"manual":true}'.trim());
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('El bloqueo abandonado por un reinicio se recupera sin abrir un bloqueo reciente',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'electoral-orphan-')),lease=path.join(dir,'.run/catalog.lease');
 try{await mkdir(lease,{recursive:true});await assert.rejects(withCatalogLock(dir,async()=>{}),/otra actualización/);const old=new Date(Date.now()-180000);await utimes(lease,old,old);let completed=false;await withCatalogLock(dir,async()=>{completed=true;});assert.equal(completed,true);}finally{await rm(dir,{recursive:true,force:true});}
});
test('Servicio: consultas concurrentes comparten trabajo; errores tienen pausa y permiten recuperación',async()=>{
 let count=0,release,time=100;const origin='https://mbainative.com',request={method:'POST',origin,bytes:2};
 const service=createUpdateService({origin,now:()=>time,search:async()=>{count++;await new Promise(r=>release=r);return {catalog,report:{checkedAt:'original'}};}});
 assert.equal((await service({...request,origin:'https://attacker.example'})).status,403);assert.equal((await service({...request,bytes:1025})).status,413);
 const a=service(request),b=service(request);await Promise.resolve();release();assert.equal((await a).status,200);assert.equal((await b).status,200);assert.equal(count,1);assert.equal((await service(request)).body.cached,true);
 let failed=true,attempts=0;const recover=createUpdateService({origin,now:()=>time,search:async()=>{attempts++;if(failed)throw Error('Fallo simulado de red');return {catalog};}});
 assert.equal((await recover(request)).status,503);assert.equal((await recover(request)).status,503);assert.equal(attempts,1);failed=false;time+=30001;assert.equal((await recover(request)).status,200);
});
test('Integración Next.js: subcarpeta, origen, archivos privados y catálogo conservado al reiniciar',async()=>{
 const storage=await mkdtemp(path.join(tmpdir(),'electoral-next-')),origin='https://mbainative.com';
 const handler=createNextHandler({packageRoot:root,storageRoot:storage,origin,searchOverride:async({root:runtime})=>{const c=JSON.parse(await readFile(path.join(runtime,'data/polls.json'),'utf8'));c.releaseTest='persisted';await atomicWrite(path.join(runtime,'data/polls.json'),JSON.stringify(c));return {catalog:c,report:{}};}});
 const req=(route,options)=>new Request(origin+'/aplicaciones/observatorio-electoral'+route,options);
 try{
  const html=await handler(req(''));assert.equal(html.status,200);assert.match(await html.text(),/<base href="\/aplicaciones\/observatorio-electoral\/">/);
  const proxied=await handler(new Request('http://localhost:3000/aplicaciones/observatorio-electoral',{headers:{Host:'mbainative.com'}}));assert.equal(proxied.status,200);
  const hostile=await handler(new Request(origin+'/aplicaciones/observatorio-electoral',{headers:{Host:'attacker.example','X-Forwarded-Host':'mbainative.com'}}));assert.equal(hostile.status,403);
  assert.equal((await handler(req('/assets/freshness.mjs'))).status,200);assert.equal((await handler(req('/scripts/search-sources.mjs'))).status,404);
  assert.equal((await handler(req('/api/update',{method:'POST',headers:{Origin:'https://attacker.example'}}))).status,403);
  assert.equal((await handler(req('/api/update',{method:'POST',headers:{Origin:origin},body:'x'.repeat(1025)}))).status,413);
  const update=await handler(req('/api/update',{method:'POST',headers:{Origin:origin},body:'{}'}));assert.equal(update.status,200);assert.equal((await update.json()).catalog.releaseTest,'persisted');
  const restarted=createNextHandler({packageRoot:root,storageRoot:storage,origin});const json=await restarted(req('/data/polls.json'));assert.equal((await json.json()).releaseTest,'persisted');
  const head=await restarted(req('/data/polls.json',{method:'HEAD'}));assert.equal(await head.text(),'');
 }finally{await rm(storage,{recursive:true,force:true});}
});
