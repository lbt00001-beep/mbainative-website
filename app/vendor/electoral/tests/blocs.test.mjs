import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compareBlocs} from '../assets/blocs.mjs';
import {projectEstimate,estimate} from '../assets/polling.mjs';
const load=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const official=load('data/official-2023.json');
test('Bloques: referencia electoral 2023 disjunta; CC dentro, UPN fuera y sin duplicar Podemos',()=>{
 const r=compareBlocs(official.provinces),[right,support,other]=r.rows;
 assert.equal(right.seats,170);assert.equal(support.seats,179);assert.equal(other.seats,1);assert.equal(r.totalSeats,350);
 assert.equal(support.hasMajority,true);assert.equal(support.aboveMajority,3);assert.equal(right.toMajority,6);
 assert.ok(support.ids.includes('cc'));assert.ok(other.ids.includes('upn'));assert.ok(!right.ids.includes('upn'));
 assert.ok(Math.abs(r.rows.reduce((s,b)=>s+b.share,0)+r.blankShare-100)<1e-8);
 assert.equal(r.rows.reduce((s,b)=>s+b.votes,0)+r.blank,r.validVotes);
});
test('Bloques: frontera 175/176 y voto blanco en denominador, sin mayoría ficticia',()=>{
 const p=[{id:'x',name:'Prueba',seats:350,blankVotes:100,votes:{pp:175,psoe:175}}];
 const r=compareBlocs(p);assert.equal(r.rows[0].seats,175);assert.equal(r.rows[1].seats,175);assert.equal(r.rows[0].hasMajority,false);assert.equal(r.rows[0].toMajority,1);assert.equal(r.seatGap,0);assert.equal(r.voteGap,0);
 assert.equal(r.rows[0].share,100*175/450);
 const q=compareBlocs([{...p[0],votes:{pp:176,psoe:174}}]);assert.equal(q.rows[0].seats,176);assert.equal(q.rows[0].hasMajority,true);assert.equal(q.rows[0].aboveMajority,0);assert.equal(q.rows[0].toMajority,0);
});
test('Bloques: la comparación no modifica sondeos, escenario ni proyección y el resto completa 350',()=>{
 const catalog=load('data/polls.json'),territory=load('data/territory.json'),before=JSON.stringify(catalog);
 const e=estimate(catalog,official,'2026-10-23'),provinces=projectEstimate(official,e.targets,territory),snapshot=JSON.stringify(provinces);
 const r=compareBlocs(provinces);assert.equal(r.totalSeats,350);assert.equal(JSON.stringify(provinces),snapshot);assert.equal(JSON.stringify(catalog),before);
 assert.ok(r.rows.every(b=>Number.isFinite(b.share)&&b.share>=0));
});
