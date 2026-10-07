import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allocate,validateOfficial,nationalAllocation,nationalVotes,project,transfer,votesToGain,simulationGenerator,validatePolls,aggregatePolls} from '../assets/electoral.mjs';
const official=JSON.parse(readFileSync(new URL('../data/official-2023.json',import.meta.url),'utf8'));
const targets={pp:33,psoe:26,vox:18,sumar:6,podemos:3,salf:0};
test('Reproduce las 52 circunscripciones y todos los escaños oficiales de 2023',()=>{
  assert.equal(validateOfficial(official),true);
  const r=nationalAllocation(official.provinces);
  assert.equal(Object.values(r.counts).reduce((s,v)=>s+v,0),350);
  assert.deepEqual(['pp','psoe','vox','sumar','erc','junts','bildu','pnv','bng','cc','upn'].map(id=>r.counts[id]),[137,121,33,31,7,7,6,5,1,1,1]);
  const corrupt=structuredClone(official);corrupt.provinces[0].votes.pp++;assert.throws(()=>validateOfficial(corrupt));
});
test('Barrera del 3 %, frontera exacta y votos en blanco',()=>{
  assert.equal(allocate({a:970,b:30},100).counts.b,3);
  assert.equal(allocate({a:970,b:30},100,{blank:1}).counts.b,0);
  assert.equal(allocate({a:980,b:20},100).counts.b,0);
});
test('Un empate de cocientes favorece más votos; el sorteo declarado alterna',()=>{
  assert.deepEqual(allocate({a:100,b:50},2).counts,{a:2,b:0});
  const r=allocate({a:50,b:50},4,{seed:123});assert.deepEqual(r.counts,{a:2,b:2});assert.equal(r.lotteries.length,2);
  assert.deepEqual(r,allocate({a:50,b:50},4,{seed:123}));
});
test('Circunscripción uninominal: más votos, sin aplicar 3 %',()=>{
  assert.equal(allocate({a:20,b:10},1,{blank:1000,singleMember:true}).counts.a,1);
  assert.throws(()=>allocate({a:20,b:10},1,{blank:1000,singleMember:false}));
});
test('No acepta votos negativos, vacíos ni escaños inválidos',()=>{
  for(const votes of [{a:-1},{a:NaN},{a:1.5},{a:0}])assert.throws(()=>allocate(votes,3));
  assert.throws(()=>allocate({a:100},0));assert.throws(()=>allocate({a:100},3,{blank:-1}));
});
test('Ajuste nacional conserva totales, alcanza objetivos y mantiene presencia territorial',()=>{
  const p=project(official,targets),n=nationalVotes(p);
  for(const[id,target]of Object.entries(targets))assert.ok(Math.abs(n.shares[id]-target)<0.002,`${id}: ${n.shares[id]}`);
  for(const province of p){assert.equal(Object.values(province.votes).reduce((s,v)=>s+v,0),province.candidateVotes);if(!official.provinces.find(x=>x.id===province.id).votes.bng)assert.equal(province.votes.bng,0);}
  assert.equal(Object.values(nationalAllocation(p).counts).reduce((s,v)=>s+v,0),350);
  assert.throws(()=>project(official,{...targets,pp:90}));
  const united=project(official,{...targets,sumar:9,podemos:0});assert.equal(nationalVotes(united).shares.podemos,0);
});
test('Una transferencia entre PP y Vox puede cambiar partidos sin cambiar su suma',()=>{
  const before={pp:400,psoe:350,vox:250},after=transfer(before,'pp','vox',100);
  assert.equal(Object.values(before).reduce((s,v)=>s+v,0),Object.values(after).reduce((s,v)=>s+v,0));
  const a=allocate(before,5).counts,b=allocate(after,5).counts;
  assert.notDeepEqual(a,b);assert.equal(a.pp+a.vox,b.pp+b.vox);
  assert.throws(()=>transfer(before,'pp','vox',401));assert.throws(()=>transfer(before,'pp','pp',1));
});
test('Distancia al siguiente escaño se verifica recalculando, también con un solo partido elegible',()=>{
  const p={votes:{a:400,b:300,c:10},seats:3,blankVotes:20};
  const n=votesToGain(p,'b'),base=allocate(p.votes,p.seats,{blank:p.blankVotes}).counts.b;
  assert.equal(allocate({...p.votes,b:p.votes.b+n-1},p.seats,{blank:p.blankVotes}).counts.b,base);
  assert.equal(allocate({...p.votes,b:p.votes.b+n},p.seats,{blank:p.blankVotes}).counts.b,base+1);
  assert.equal(votesToGain({votes:{a:100,b:1},seats:3,blankVotes:0},'a'),null);
});
function run(p,o){const g=simulationGenerator(p,o);let step;while(!(step=g.next()).done){assert.ok(step.value.point.right+step.value.point.left<=350);}return step.value;}
test('Simulaciones reproducibles y cero incertidumbre reproduce el reparto central',()=>{
  const p=project(official,targets),central=nationalAllocation(p),r=run(p,{runs:8,seed:4,nationalSigma:0,localSigma:0});
  assert.ok(r.points.every(x=>x.right===central.groups.right&&x.left===central.groups.left));
  for(const[id,v]of Object.entries(central.counts)){assert.equal(r.parties[id].low,v);assert.equal(r.parties[id].high,v);}
  assert.deepEqual(run(p,{runs:12,seed:4}),run(p,{runs:12,seed:4}));
  assert.notDeepEqual(run(p,{runs:12,seed:4}).points,run(p,{runs:12,seed:5}).points);
});
const poll=(id,institute,date,pp=33)=>({id,institute,publishedAt:date,fieldworkEnd:date,sample:1000,url:'https://example.com/verified-study',verified:true,denominator:'candidateVotes',values:{pp,psoe:26}});
test('Promedio usa última encuesta por instituto, ventana temporal y ausencias como desconocidas',()=>{
  const polls=[poll('old','A','2026-09-01',30),poll('latest','A','2026-10-01',34),poll('b','B','2026-10-01',32),poll('expired','C','2026-01-01',40),poll('future','D','2026-11-01',40)];
  delete polls[2].values.psoe;
  const avg=aggregatePolls(polls,'2026-10-05');assert.equal(avg.selected.length,2);assert.equal(avg.values.pp,33);assert.equal(avg.values.psoe,26);assert.equal(avg.coverage.psoe,1);
});
test('Encuestas no verificadas, URLs inseguras y duplicados son rechazados',()=>{
  const p=poll('a','A','2026-10-01');assert.equal(validatePolls([p]),true);
  assert.throws(()=>validatePolls([{...p,verified:false}]));assert.throws(()=>validatePolls([{...p,url:'javascript:alert(1)'}]));assert.throws(()=>validatePolls([p,p]));assert.throws(()=>validatePolls([{...p,values:{pp:120}}]));
});
