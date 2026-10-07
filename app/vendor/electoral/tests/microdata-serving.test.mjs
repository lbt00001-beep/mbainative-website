import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,access,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createNextHandler} from '../deployment/next-handler.mjs';
test('Microdatos publicados: agregados versionados no sobrescriben catálogo persistente',async()=>{
 const root=fileURLToPath(new URL('../',import.meta.url)),storage=await mkdtemp(path.join(os.tmpdir(),'micro-serving-'));
 try{const handler=createNextHandler({packageRoot:root,storageRoot:storage,origin:'http://localhost:3036'});
 for(const file of ['microdata-3577.json','microdata-validation.json']){const response=await handler(new Request('http://localhost:3036/aplicaciones/observatorio-electoral/data/'+file));assert.equal(response.status,200);assert.equal((await response.json()).schemaVersion,1);}
 await assert.rejects(access(path.join(storage,'data')));
 const privateFile=await handler(new Request('http://localhost:3036/aplicaciones/observatorio-electoral/calibration/microdata-3411.json'));assert.equal(privateFile.status,404);
 }finally{assert.ok(storage.startsWith(path.join(os.tmpdir(),'micro-serving-')));await rm(storage,{recursive:true,force:true});}
});
test('API de microdatos recupera biblioteca persistente y bloquea origen y cuerpo inválidos',async()=>{
 const root=fileURLToPath(new URL('../',import.meta.url)),storage=await mkdtemp(path.join(os.tmpdir(),'micro-serving-')),base='http://localhost:3036/aplicaciones/observatorio-electoral/api/microdata';
 try{await mkdir(path.join(storage,'data'));await writeFile(path.join(storage,'data/microdata-library.json'),JSON.stringify({schemaVersion:1,studies:[{study:'3577',sample:4042}],candidates:[],checkedAt:'2026-10-07'}));
  const handler=createNextHandler({packageRoot:root,storageRoot:storage,origin:'http://localhost:3036'});
  assert.equal((await (await handler(new Request(base))).json()).studies[0].sample,4042);
  assert.equal((await handler(new Request(base,{method:'POST',headers:{origin:'https://other.test'},body:'{}'}))).status,403);
  assert.equal((await handler(new Request(base,{method:'POST',headers:{origin:'http://localhost:3036'},body:'x'.repeat(1025)}))).status,413);
  assert.equal((await handler(new Request(base,{method:'POST',headers:{origin:'http://localhost:3036'},body:'{'}))).status,400);
  assert.equal((await handler(new Request(base,{method:'POST',headers:{origin:'http://localhost:3036'},body:JSON.stringify({action:'import',study:'9999'})}))).status,400);
  assert.equal((await (await handler(new Request(base))).json()).studies[0].sample,4042);
 }finally{assert.ok(storage.startsWith(path.join(os.tmpdir(),'micro-serving-')));await rm(storage,{recursive:true,force:true});}
});
