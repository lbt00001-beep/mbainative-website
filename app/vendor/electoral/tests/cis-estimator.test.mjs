import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reestimateCis,cisSensitivity,combineCisConsensus} from '../assets/cis-estimator.mjs';
const bundle=JSON.parse(readFileSync(new URL('../data/cis-reestimation.json',import.meta.url),'utf8'));
const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
const toy=()=>({kind:'microdata',sample:100,reference:{pp:50,psoe:50},cells:[
 {recall:'pp',intent:'pp',n:10,w:10,w2:10,turnout:10},
 {recall:'pp',intent:'undecided',n:5,w:5,w2:5,turnout:8,sympathy:'psoe'},
 {recall:'pp',intent:'noanswer',n:5,w:5,w2:5,turnout:6},
 {recall:'psoe',intent:'psoe',n:40,w:40,w2:40,turnout:10},
 {recall:'psoe',intent:'undecided',n:20,w:20,w2:20,turnout:8},
 {recall:'psoe',intent:'abstention',n:10,w:10,w2:10,turnout:0},
 {recall:'psoe',intent:'null',n:10,w:10,w2:10,turnout:null}
]});

test('CIS propio: calibración condicional exacta y ninguna mutación de fuentes',()=>{
 const d=toy(),copy=structuredClone(d),r=reestimateCis(d,{nsRate:0,ncRate:0});
 assert.deepEqual(d,copy);close(r.recallAudit.find(r=>r.id==='pp').factor,2.5);close(r.recallAudit.find(r=>r.id==='psoe').factor,.625);
 for(const row of r.recallAudit)close(row.after,row.target);
 close(r.validPercent.pp,50);close(r.validPercent.psoe,50);
});
test('CIS propio: NS y NC tienen tasas separadas; no se reparten abstención ni nulos',()=>{
 const d=toy(),r=reestimateCis(d,{nsRate:1,ncRate:0,shrinkage:0});
 close(r.assigned.undecided,25);close(r.assigned.noanswer,0);
 close(r.unassigned.undecided,0);close(r.unassigned.noanswer,12.5);
 close(r.values.abstention,6.25);close(r.values.null,6.25);
 close(Object.values(r.values).reduce((s,v)=>s+v),r.total);
 close(r.values.pp,37.5);close(r.values.psoe,37.5);
});
test('CIS propio: simpatía individual tiene prioridad y no se inventa una equivalencia de partido',()=>{
 const d=toy(),a=reestimateCis(d,{sympathy:true,ncRate:0,shrinkage:0});
 close(a.assignedBySympathy.undecided,12.5);close(a.values.pp,25);close(a.values.psoe,50);
 d.cells[1].sympathy='partido-no-observado';const b=reestimateCis(d,{sympathy:true,ncRate:0,shrinkage:0});
 close(b.assignedBySympathy.undecided,0);close(b.values.pp,37.5);
});
test('CIS propio: participación, bases desconocidas y tamaño efectivo antes de imputar',()=>{
 const d=toy(),before=reestimateCis(d,{participation:'declared',nsRate:0,ncRate:0}),after=reestimateCis(d,{participation:'declared'});
 close(before.effectiveN,after.effectiveN);assert.ok(after.effectiveN<=d.sample);close(after.unknownTurnoutWeight,10);
 close(after.adjusted.abstention,0);close(after.adjusted.null,6.25);
 const certain=reestimateCis(d,{participation:'certain'});close(certain.adjusted.undecided,0);
});
test('CIS propio: suavizado limita una transición de recuerdo escasa',()=>{
 const d=toy(),raw=reestimateCis(d,{shrinkage:0,ncRate:0}),shrunk=reestimateCis(d,{shrinkage:50,ncRate:0});
 assert.notEqual(raw.values.pp,shrunk.values.pp);close(Object.values(shrunk.values).reduce((s,v)=>s+v),shrunk.total);
});
test('CIS propio: los cruces agregados no se presentan como entrevistas ni admiten ingredientes sin cruce',()=>{
 const d=bundle.datasets.find(d=>d.study==='3584'),r=reestimateCis(d);
 assert.equal(r.effectiveN,null);assert.throws(()=>reestimateCis(d,{participation:'declared'}));assert.throws(()=>reestimateCis(d,{sympathy:true}));
 const source=structuredClone(d);source.publishedEstimate=[{label:'Dato ficticio ignorado',value:99}];assert.deepEqual(r,reestimateCis(source));
});
test('CIS propio: porcentajes nacionales originales y categorías territoriales se conservan',()=>{
 const d=bundle.datasets.find(d=>d.study==='3584'),r=reestimateCis(d,{recallStrength:0,nsRate:0,ncRate:0});
 close(100*r.raw.psoe/r.rawTotal,28.712792619287363,.001);close(100*r.raw.pp/r.rawTotal,17.190520923554104,.001);
 close(100*r.raw.vox/r.rawTotal,14.987126020438014,.001);
 assert.ok(Object.values(d.labels).includes('Compromís: Front Valencià'));assert.ok(!Object.hasOwn(r.raw,'sumar'));
 close(Object.values(r.validPercent).reduce((s,v)=>s+v),100);
});
test('CIS propio: microdatos 3582 y Coalición de izquierdas son una categoría separada',()=>{
 const d=bundle.datasets.find(d=>d.study==='3582'),r=reestimateCis(d);
 assert.equal(d.cells.reduce((s,c)=>s+c.n,0),5024);assert.ok(r.raw.leftCoalition>0);assert.ok(r.raw.sumar>0);
 assert.equal(d.labels.leftCoalition,'Coalición de izquierdas');
});
test('CIS propio: sensibilidad reproducible, no intervalo de confianza',()=>{
 for(const d of bundle.datasets){const r=cisSensitivity(d);assert.equal(r.scenarios,d.kind==='microdata'?54:18);assert.deepEqual(r,cisSensitivity(d));for(const v of Object.values(r.parties))assert.ok(v.low<=v.high&&v.low>=0&&v.high<=100);}
});
test('CIS propio: entradas inválidas se rechazan y una muestra sin decididos no se inventa votos',()=>{
 for(const p of [{nsRate:-1},{ncRate:NaN},{recallStrength:2},{shrinkage:-1},{participation:'unknown'},{sympathy:'true'}])assert.throws(()=>reestimateCis(toy(),p));
 assert.throws(()=>reestimateCis({...toy(),sample:99}));
 const d=toy();d.cells.forEach(c=>c.intent='undecided');assert.throws(()=>reestimateCis(d));
});
test('CIS propio: retrospectiva conserva referencia anterior y comunica resultados desfavorables',()=>{
 const v=bundle.validation;assert.equal(v.referenceElection,'2019-11-10');assert.equal(v.election,'2023-07-23');
 for(const row of v.rows){const expected=['pp','psoe','vox','sumar'].reduce((s,id)=>s+Math.abs(row.values[id]-v.actual[id]),0)/4;close(row.mae,expected);}
 assert.ok(v.rows.slice(1).every(r=>r.mae>v.rows[0].mae));
});

test('Consenso: peso visible reduce a la mitad la distancia, conserva 100 % y no modifica el CIS independiente',()=>{
 const d=bundle.datasets[0],r=reestimateCis(d),copy=structuredClone(r),consensus={values:{pp:31,psoe:27,vox:19,podemos:2,salf:2},coverage:{pp:10,psoe:10,vox:10,podemos:8,salf:5},asOf:'2026-11-14'};
 const c=combineCisConsensus(r,consensus,.5);close(c.distanceAfter,c.distanceBefore/2);close(Object.values(c.validPercent).reduce((s,v)=>s+v),100);assert.deepEqual(r,copy);
 const independent=combineCisConsensus(r,consensus,0),reference=combineCisConsensus(r,consensus,1);
 for(const id of Object.keys(r.validPercent))close(independent.validPercent[id],r.validPercent[id]);
 for(const id of c.compatible)close(reference.validPercent[id],consensus.values[id]);
});
test('Consenso: ausencias y coaliciones no se convierten en referencias inventadas',()=>{
 const d=bundle.datasets[0],r=reestimateCis(d),c=combineCisConsensus(r,{values:{pp:31,psoe:27,vox:19,podemos:2,salf:0,erc:5,sumar:7},coverage:{pp:10,psoe:10,vox:10,podemos:8,salf:0,erc:5,sumar:10}},.5);
 assert.ok(!c.compatible.includes('salf'));assert.ok(!c.compatible.includes('erc'));assert.ok(!c.compatible.includes('sumar'));
 const uncovered=Object.keys(r.validPercent).filter(id=>!c.compatible.includes(id));
 close(c.validPercent[uncovered[0]]/c.validPercent[uncovered[1]],r.validPercent[uncovered[0]]/r.validPercent[uncovered[1]]);
});
test('Consenso: referencias archivadas o imposibles se rechazan',()=>{
 const r=reestimateCis(toy()),c={values:{pp:40,psoe:60},coverage:{pp:1,psoe:1}};
 assert.throws(()=>combineCisConsensus(r,c,2));assert.throws(()=>combineCisConsensus(r,{...c,expired:true},.5));
 assert.throws(()=>combineCisConsensus(r,{...c,values:{pp:80,psoe:80}},.5));
 assert.doesNotThrow(()=>combineCisConsensus(r,{...c,expired:true},0));
});
