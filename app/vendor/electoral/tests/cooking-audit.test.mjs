import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('Auditoría: bases completas, categorías y cambios de denominador',async()=>{
 const d=JSON.parse(await read('data/cooking-audit.json'));
 assert.deepEqual(d.studies.map(s=>s.sample),[2000,7500]);
 for(const s of d.studies){assert.equal(s.all.length,25);assert.equal(s.all.reduce((n,r)=>n+r.n,0),s.sample);assert.ok(Math.abs(s.all.reduce((n,r)=>n+r.weighted,0)-100)<1e-8);assert.ok(Math.abs(s.all.filter(r=>r.valid!==null).reduce((n,r)=>n+r.valid,0)-100)<1e-8);assert.ok(s.validBase<s.weightedBase);for(const p of s.parties){assert.ok(Math.abs(p.estimate-p.valid-p.delta)<1e-10);assert.equal(p.n,s.all.find(r=>r.code===p.code).n);}assert.equal(s.models.length,5);assert.ok(s.models.every(m=>m.values.length===6&&m.mae>.05));}
 const latest=d.studies[1];assert.equal(latest.parties[0].n,1670);assert.equal(latest.all[12].n,14);assert.ok(Math.abs(latest.parties[0].valid-25.267621934966733)<1e-8);
 assert.equal(d.cis.unweightedAvailable,false);assert.ok(Math.abs(d.cis.parties[0].weighted-18.04656776762182)<1e-9);assert.equal(d.cis.parties[0].estimate,24.7);assert.ok(d.cis.parties[1].delta<0);
});
test('Auditoría: publicación estática y límites de atribución',async()=>{
 const html=await read('index.html'),ui=await read('assets/cooking-audit.mjs'),handler=await read('deployment/next-handler.mjs'),build=await read('scripts/build.mjs');
 assert.equal((html.match(/id="cocina"/g)||[]).length,1);assert.ok(html.includes('id="help-cooking"'));assert.ok(html.includes('versión 3.13.0'));assert.ok(ui.includes('identidad de la fórmula final no demostrable'));assert.ok(ui.includes('24,4 %'));assert.ok(handler.includes("BUNDLED_DATA=['cooking-audit.json'"));assert.ok(build.includes("'data/cooking-audit.json'"));assert.ok(!ui.includes('innerHTML'));
});
