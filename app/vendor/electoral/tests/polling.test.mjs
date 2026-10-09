import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {estimate,estimateEvolution,validateCatalog,historicalScores,evaluateHistory,projectEstimate} from '../assets/polling.mjs';
import {nationalVotes,nationalAllocation,simulationGenerator} from '../assets/electoral.mjs';
const load=n=>JSON.parse(readFileSync(new URL(`../data/${n}.json`,import.meta.url),'utf8'));
const catalog=JSON.parse(readFileSync(new URL('fixtures/polls-baseline.json',import.meta.url),'utf8')),official=load('official-2023'),territory=load('territory');
test('Catálogo real, fecha de corte y pesos reconstruibles',()=>{
  assert.ok(validateCatalog(catalog));const e=estimate(catalog,official);
  assert.equal(e.selected.length,15);assert.ok(Math.abs(e.selected.reduce((s,p)=>s+p.weightPercent,0)-100)<1e-9);
  for(const p of e.selected)assert.ok(Math.abs(p.weight-p.size*p.recency*p.quality*p.reliability*p.method.factor)<1e-12);
  assert.ok(Math.abs(Object.values(e.values).reduce((s,v)=>s+v,0)-100)<1e-9);
  assert.equal(e.historicalWeighting,false);assert.ok(e.selected.every(p=>p.reliability===1));
});
test('No completa porcentajes ausentes ni repite institutos prolíficos',()=>{
  const c=structuredClone(catalog);c.polls.push({...c.polls[0],id:'old',fieldworkStart:'2026-08-29',fieldworkEnd:'2026-09-01',publishedAt:'2026-09-02',values:{pp:60}});
  const e=estimate(c,official);assert.equal(e.selected.length,15);assert.equal(e.coverage.salf,6);
  assert.ok(!e.selected.find(p=>p.institute==='GAD3').values.podemos);
  assert.ok(!e.selected.find(p=>p.institute==='Celeste-Tel').values.sumar);
});
test('Publicación futura, datos inválidos y cortes sin datos se rechazan',()=>{
  const c=structuredClone(catalog);c.polls[0].publishedAt='2026-10-07';assert.equal(estimate(c,official).selected.length,14);
  assert.throws(()=>estimate(catalog,official,'2027-01-01'));
  for(const patch of [{sample:-1},{fieldworkEnd:'2026-02-30'},{url:'http://example.com'},{values:{pp:NaN}},{verified:false}]){const bad=structuredClone(catalog);Object.assign(bad.polls[0],patch);assert.throws(()=>validateCatalog(bad));}
});
test('No aprende del resultado reservado ni de elecciones posteriores',()=>{
  const scores=historicalScores(catalog,{before:'2023-07-23'});assert.equal(scores.GAD3.elections,2);assert.equal(scores['40dB'],undefined);
  const c=structuredClone(catalog);for(const r of c.results)if(r.date==='2023-07-23')r.values.pp=99;
  assert.deepEqual(historicalScores(c,{before:'2023-07-23'}),scores);
  const ev=evaluateHistory(catalog);assert.equal(ev.rows.length,1);assert.ok(ev.rows[0].weightedMAE>=ev.rows[0].simpleMAE);
});
test('La retirada de un instituto reconstruye la media de cada partido',()=>{
  const e=estimate(catalog,official),removed=e.leaveOneOut.find(r=>r.institute==='40dB');
  for(const id of ['pp','psoe','vox','sumar','podemos','salf']){
    const rows=e.selected.filter(p=>p.institute!=='40dB'&&Object.hasOwn(p.values,id));
    const mean=rows.reduce((s,p)=>s+p.values[id]*p.weight,0)/rows.reduce((s,p)=>s+p.weight,0);
    assert.ok(Math.abs(removed.deltas[id]-(mean-e.values[id]))<1e-10);
  }
});
test('Proyección de sondeos alcanza todos los objetivos y usa 2026 y huellas reales',()=>{
  const e=estimate(catalog,official),p=projectEstimate(official,e.targets,territory),n=nationalVotes(p);
  assert.equal(p.length,52);assert.equal(p.reduce((s,p)=>s+p.seats,0),350);
  for(const[id,v]of Object.entries(e.targets))assert.ok(Math.abs(n.shares[id]-v)<.002,`${id}: ${n.shares[id]} vs ${v}`);
  for(const row of p){assert.equal(row.seats,territory.seats[row.id]);assert.equal(Object.values(row.votes).reduce((s,v)=>s+v,0),row.candidateVotes);if(!['08','17','25','43'].includes(row.id))assert.equal(row.votes.ac,0);}
  assert.notDeepEqual(nationalAllocation(p).counts,nationalAllocation(official.provinces).counts);
  assert.equal(Object.values(nationalAllocation(p).counts).reduce((s,v)=>s+v,0),350);
  const runs=simulationGenerator(p,{runs:2,nationalSigma:0,localSigma:0,seed:1});let r=runs.next();while(!r.done)r=runs.next();
  for(const[id,v]of Object.entries(nationalAllocation(p).counts))assert.equal(r.value.parties[id].median,v);
});

test('El CIS y los datos directos no se mezclan con estimaciones electorales',()=>{
 const c=structuredClone(catalog);c.polls.push({...c.polls[0],id:'cis-estimate-test',institute:'CIS',values:{pp:99}});
 assert.deepEqual(estimate(c,official).values,estimate(catalog,official).values);
 assert.equal(catalog.directSurveys.find(p=>p.study==='3577').values.psoe,23.3);
});

test('Evolución: no usa publicaciones futuras y coincide con el cálculo actual',()=>{
  const points=estimateEvolution(catalog,official,'2026-10-07');
  assert.ok(points.length>1);
  for(const point of points){
    const available={...catalog,polls:catalog.polls.filter(p=>p.publishedAt<=point.date)};
    const expected=estimate(available,official,point.date);
    assert.deepEqual(point.values,expected.values);
    assert.deepEqual(point.coverage,expected.coverage);
    assert.equal(point.count,expected.selected.length);
  }
  assert.deepEqual(points.at(-1).values,estimate(catalog,official,'2026-10-07').values);
  assert.ok(points[0].count<points.at(-1).count);
});
