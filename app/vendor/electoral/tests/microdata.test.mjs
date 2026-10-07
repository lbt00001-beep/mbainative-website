import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateMicrodata,analyzeMicrodata} from '../assets/microdata.mjs';
const data=JSON.parse(await readFile(new URL('../data/microdata-3577.json',import.meta.url),'utf8'));
test('Microdatos CIS: 4.042 entrevistas y PESO reproducen intención publicada',()=>{
 validateMicrodata(data);const r=analyzeMicrodata(data);
 assert.equal(Object.values(r.raw).reduce((a,b)=>a+b),4042);
 for(const [id,value]of Object.entries({pp:18.3,psoe:23.3,vox:12.0,sumar:4.6,podemos:3.0}))assert.ok(Math.abs(100*r.initial[id]/r.initialTotal-value)<.051);
 assert.ok(r.raw.unidentified29>0);assert.ok(r.effectiveN<=4042);
 assert.throws(()=>validateMicrodata({...data,sample:4041}));
});
test('Microdatos: pesos iguales, indecisos y participación conservan denominadores explícitos',()=>{
 const raw=analyzeMicrodata(data,{basis:'equal'});assert.equal(raw.effectiveN,4042);
 const base=analyzeMicrodata(data),prop=analyzeMicrodata(data,{undecided:'overall'}),local=analyzeMicrodata(data,{undecided:'recall'});
 assert.ok(!Object.hasOwn(prop.national.values,'undecided'));
 assert.ok(Math.abs(base.national.validPercent.pp-prop.national.validPercent.pp)<1e-9);
 assert.equal(prop.national.values.abstention,base.national.values.abstention);
 assert.equal(prop.national.values.null,base.national.values.null);
 assert.ok(Math.abs(Object.values(local.national.values).reduce((a,b)=>a+b)-local.total)<1e-7);
 const vote=analyzeMicrodata(data,{participation:'declared'});assert.equal(vote.unknownTurnout,7);assert.ok(vote.total<base.total);
 assert.throws(()=>analyzeMicrodata(data,{recallStrength:2}));
});
test('Microdatos: ajuste al promedio fija perfiles y no cambia alternativa nacional',()=>{
 const options={dimension:'sex',profileTarget:{pp:30,psoe:25,vox:20,sumar:15,podemos:10}},r=analyzeMicrodata(data,options),plain=analyzeMicrodata(data,{dimension:'sex'});
 assert.deepEqual(r.national.validPercent,plain.national.validPercent);
 for(const id of Object.keys(options.profileTarget)){let num=0,den=0;for(const g of r.profiles){let t=0;for(const [p,v]of Object.entries(options.profileTarget))t+=(g.values[p]||0)*v/r.national.validPercent[p];num+=(g.values[id]||0)*options.profileTarget[id]/r.national.validPercent[id];den+=t;}assert.ok(Math.abs(100*num/den-options.profileTarget[id])<1e-9);}
});
test('Microdatos: límite de recuerdos y pesos cuadrados calculan tamaño efectivo',()=>{
 const r=analyzeMicrodata(data,{recallStrength:1,reference:{pp:99,psoe:1}});
 assert.ok(r.clipped.includes('psoe'));assert.equal(r.recallFactors.psoe,.25);
 assert.ok(r.effectiveN>0&&r.effectiveN<=4042);
 for(const g of r.profiles)assert.ok(g.effectiveN<=g.n+1e-7);
});
test('Microdatos: evaluación histórica usa recuerdo 2019 y no acredita superioridad',async()=>{
 const check=JSON.parse(await readFile(new URL('../data/microdata-validation.json',import.meta.url),'utf8'));
 assert.equal(check.referenceElection,'2019-11-10');assert.equal(check.election,'2023-07-23');assert.equal(check.sample,29201);
 assert.ok(check.rows.find(r=>r.name==='PESO + recuerdo 2019').mae>check.rows.find(r=>r.name==='PESO publicado').mae);
});

test('Microdatos: una muestra amplia con pocos votos declarados no justifica un perfil',()=>{
 const cells=[{intent:'pp',n:5,w:5,w2:5},{intent:'undecided',n:35,w:35,w2:35}].flatMap(c=>['total','age'].map(dimension=>({...c,dimension,group:'Grupo',recall:'norecall',turnout:'10'})));
 const fixture={schemaVersion:1,sample:40,dimensions:{total:'Total',age:'Edad'},cells};validateMicrodata(fixture);
 const r=analyzeMicrodata(fixture,{dimension:'age',profileTarget:{pp:100},undecided:'overall'});
 assert.equal(r.profiles[0].n,40);assert.equal(r.profiles[0].analysisN,5);assert.equal(r.profiles[0].analysisEffectiveN,5);
});
