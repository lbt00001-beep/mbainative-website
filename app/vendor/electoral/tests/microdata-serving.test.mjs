import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,access} from 'node:fs/promises';
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
