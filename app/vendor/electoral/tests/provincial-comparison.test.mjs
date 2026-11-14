import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {provincialComparison} from '../assets/provincial-comparison.mjs';
import {estimate,projectEstimate} from '../assets/polling.mjs';
const load=file=>JSON.parse(readFileSync(new URL('../data/'+file,import.meta.url),'utf8'));

test('Los filtros conservan competidores, adjudicaciones y datos originales',()=>{
 const p={id:'28',seats:5,blankVotes:20,votes:{pp:400,psoe:300,vox:200,podemos:80,junts:40}};
 const before=structuredClone(p),all=provincialComparison(p),left=provincialComparison(p,'left'),right=provincialComparison(p,'right');
 assert.deepEqual(left.result,all.result);assert.deepEqual(right.result,all.result);
 assert.deepEqual(left.rows.map(r=>r.id),['psoe','podemos']);assert.deepEqual(right.rows.map(r=>r.id),['pp','vox']);
 assert.deepEqual(p,before);assert.throws(()=>provincialComparison(p,'unknown'));
 for(const row of all.rows){
  assert.equal(row.share,100*p.votes[row.id]/1040);
  assert.equal(row.quotients.filter(q=>q.awarded).length,row.seats);
  assert.equal(row.quotients[1].value,row.votes/2);
 }
});

test('La barrera incluye blancos y distingue el 3 % exacto',()=>{
 const p={id:'28',seats:100,blankVotes:0,votes:{pp:970,psoe:30}};
 assert.equal(provincialComparison(p,'left').rows[0].eligible,true);
 const row=provincialComparison({...p,blankVotes:1},'left').rows[0];
 assert.equal(row.eligible,false);assert.equal(row.next,null);assert.equal(row.seats,0);
 assert.ok(row.quotients.every(q=>!q.awarded));
});

test('Uninominales, filtros vacíos y empate con sorteo',()=>{
 const p={id:'51',seats:1,blankVotes:1000,votes:{pp:20,vox:10}};
 assert.equal(provincialComparison(p).result.counts.pp,1);
 assert.deepEqual(provincialComparison(p,'left').rows,[]);
 const tie=provincialComparison({...p,blankVotes:0,votes:{pp:20,psoe:20}});
 assert.equal(tie.result.lotteries.length,1);
 assert.deepEqual(tie,provincialComparison({...p,blankVotes:0,votes:{pp:20,psoe:20}}));
});

test('El catálogo real produce 350 adjudicaciones y porcentajes coherentes en 52 provincias',()=>{
 const official=load('official-2023.json'),territory=load('territory.json'),catalog=load('polls.json');
 const projection=projectEstimate(official,estimate(catalog,official).targets,territory);
 let total=0;
 for(const p of projection){
  const {rows,result}=provincialComparison(p);total+=result.winners.length;
  assert.equal(rows.reduce((s,r)=>s+r.seats,0),p.seats);
  assert.ok(Math.abs(rows.reduce((s,r)=>s+r.share,0)+100*p.blankVotes/result.validVotes-100)<1e-9);
 }
 assert.equal(total,350);
});
