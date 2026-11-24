import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractArticle} from '../scripts/poll-adapters.mjs';
import {electograficaLinks} from '../scripts/electografica.mjs';
import {extractCis,extractCisEstimate} from '../scripts/cis-adapter.mjs';
import {verifyCisEstimate} from '../scripts/cis-update.mjs';
import {recallTableDataset} from '../scripts/cis-recall-table.mjs';
import {reestimateCis} from '../assets/cis-estimator.mjs';
import {estimate,validateCatalog} from '../assets/polling.mjs';
import {cisComparison,cisDiagnostics} from '../assets/cis.mjs';
const read=f=>readFileSync(new URL(f,import.meta.url),'utf8'),fixture=JSON.parse(read('./fixtures/cis3587.json')),html=read('./fixtures/electografica-gesop.html'),url='https://www.electografica.com/2026/11/encuesta-gesop-261123.html';
const catalog=JSON.parse(read('../data/polls.json')),official=JSON.parse(read('../data/official-2023.json'));

test('GESOP: barras actuales, ficha, fuente secundaria y coaliciones sin votos inventados',()=>{
 const r=extractArticle(html,url,{today:'2026-11-24'});assert.equal(r.status,'extracted',r.reason);
 assert.deepEqual(r.poll.values,{pp:32.9,psoe:29,vox:17.5,sumar:6.7,erc:2.5,salf:1.3,junts:1.1,podemos:.7});
 assert.equal(r.poll.sample,905);assert.equal(r.poll.fieldworkStart,'2026-11-18');assert.equal(r.poll.fieldworkEnd,'2026-11-21');assert.equal(r.poll.publishedAt,'2026-11-23');assert.equal(r.poll.sourceType,'secondary');assert.equal(r.poll.methodology.mode,'telephone');assert.equal(r.poll.denominator,'unspecified');assert.match(r.poll.originalUrl,/elperiodico/);
 assert.equal(r.poll.values.upn,undefined);assert.equal(r.poll.values.bildu,undefined);
 assert.equal(extractArticle(html,url,{today:'2026-11-22'}).status,'pending');
 assert.equal(extractArticle(html.replace('data-w="32.9"','data-w="132.9"'),url,{today:'2026-11-24'}).status,'pending');
 assert.equal(extractArticle(html.replace('España','Cataluña').replace('ESPAÑA ·','CATALUÑA ·'),url,{today:'2026-11-24'}).status,'context');
 const previous={...r.poll,url:'https://www.elperiodico.com/original'};
 assert.equal(extractArticle(html,url,{today:'2026-11-24',catalog:[previous]}).status,'known');
 assert.equal(extractArticle(html,url,{today:'2026-11-24',catalog:[{...previous,values:{...previous.values,pp:31}}]}).status,'pending');
});

test('Electográfica: descubre solo Congreso nacional en HTTPS; otra casa remite al original',()=>{
 const entry=(title,url)=>({title:{$t:title},link:[{rel:'alternate',type:'text/html',href:url}]}),title='ESPAÑA · Elecciones generales · Encuesta GESOP 23/11/2026';
 const feed=JSON.stringify({feed:{entry:[entry(title,url),entry('CATALUÑA · Encuesta GESOP',url),entry(title,'https://evil.example/x'),entry(title,'javascript:alert(1)')]}});
 assert.deepEqual(electograficaLinks(feed,url),[{title,url}]);
 const result=extractArticle(html.replaceAll('GESOP','Ipsos'),url,{today:'2026-11-24'});assert.equal(result.status,'landing');assert.equal(result.poll,undefined);assert.match(result.document.discoveryOriginals[0].url,/elperiodico/);
});

test('CIS 3587: lee votará sin confundir la pregunta autonómica y conserva NS/NC',()=>{
 const d=extractCis(fixture.marginal,fixture.marginal);assert.equal(d.direct.code,'10R');assert.equal(d.sample,8034);assert.equal(d.direct.rows.PP,18);assert.equal(d.direct.rows.PSOE,28.4);assert.equal(d.fieldworkEnd,'2026-11-17');assert.equal(d.theoreticalError,1.1);
 const diagnostic=cisDiagnostics({tables:d},official);assert.ok(Math.abs(diagnostic.undecided-16.8)<1e-8);assert.equal(diagnostic.abstention,3.8);assert.ok(diagnostic.recallComparison.every(r=>r.recalled===null||Number.isFinite(r.recalled)));
 assert.throws(()=>extractCis(fixture.marginal+fixture.marginal,fixture.marginal),/ambigua/);
});

test('CIS 3587: intervalos y categorías originales; discrepancia solo con ambos documentos revisados',()=>{
 const e=extractCisEstimate(fixture.estimate,'3587');assert.equal(e.values.psoe,34.4);assert.equal(e.values.pp,24.7);assert.equal(e.values['original:Frente Amplio'],5.7);assert.equal(e.values['original:ERC-Podemos'],2.7);assert.equal(e.values.sumar,undefined);assert.equal(e.values.erc,undefined);
 assert.deepEqual(e.originalRows.find(r=>r.label==='PSOE').interval,[33.7,35.1]);assert.equal(e.originalRows.find(r=>r.label==='En blanco').interval,null);
 const record={study:'3587',sample:8034,values:{pp:18,psoe:28.4,vox:11.6}},hashes={resultHash:'6e36865f3ab9e490e785103aa6f75e03739990d1ccebb1d0835457a7c7330126',estimateHash:'1f3e9bb2545994c9e88c1f2101177ec5f4faa46994e5ce7102f8fd211190d42f'};
 assert.match(verifyCisEstimate(e,record,hashes),/18,0/);assert.throws(()=>verifyCisEstimate(e,record,{...hashes,estimateHash:'changed'}),/no corresponden/);
 assert.throws(()=>extractCisEstimate(fixture.estimate.replace('34,4   33,7','34,4   35,0'),'3587'),/Intervalo/);
 assert.throws(()=>extractCisEstimate(fixture.estimate.replace('Democracia 21','Categoría desconocida'),'3587'),/desconocida/);
});

test('CIS 3587: cruce reproduce todos los marginales y rechaza bases o porcentajes incoherentes',()=>{
 const reference=JSON.parse(read('../data/cis-reestimation.json')).datasets.find(d=>d.study==='3587').reference,metadata={study:'3587',question:'Pregunta 10R',sample:8034};
 const build=(rows=fixture.recallRows)=>recallTableDataset({recallRows:rows,nationalRows:fixture.nationalRows,reference,metadata});
 const d=build(),r=reestimateCis(d);assert.equal(d.cells.length,302);assert.equal(r.effectiveN,null);assert.ok(Math.abs(r.validPercent.pp-28.4752570956)<1e-7);assert.ok(Math.abs(r.validPercent.psoe-28.2145425464)<1e-7);assert.ok(Math.abs(Object.values(r.validPercent).reduce((s,v)=>s+v)-100)<1e-8);
 assert.throws(()=>reestimateCis(d,{participation:'declared'}));assert.throws(()=>reestimateCis(d,{sympathy:true}));
 const broken=structuredClone(fixture.recallRows);broken[4][2]+=1;assert.throws(()=>build(broken),/suma 100/);
 const wrong=structuredClone(fixture.recallRows);wrong.at(-1)[2]+=2;assert.throws(()=>build(wrong),/Bases/);
});

test('CIS 3587: comparación conserva coaliciones sin correspondencia y no entra en media ni escaños',()=>{
 const e=extractCisEstimate(fixture.estimate,'3587'),p={study:'3587',title:'Noviembre',publishedAt:'2026-11-23',fieldworkStart:'2026-11-10',fieldworkEnd:'2026-11-17',sample:8034,values:e.values,labels:e.labels,verified:true,measure:'cisComparisonOnly',denominator:'validVotes',url:'https://www.cis.es/documents/d/guest/3587_estimacion-pdf',studyUrl:'https://www.cis.es/es/w/avance'};
 const c={...catalog,cisEstimates:[...(catalog.cisEstimates||[]).filter(p=>p.study!=='3587'),p]},before=estimate({...c,cisEstimates:[]},official,'2026-11-24');assert.equal(validateCatalog(c),true);assert.deepEqual(estimate(c,official,'2026-11-24').values,before.values);
 const comparison=cisComparison(p,c,official);assert.equal(comparison.rows.find(r=>r.id==='original:Frente Amplio').average,null);assert.equal(comparison.rows.find(r=>r.id==='original:ERC-Podemos').count,0);assert.ok(comparison.rows.find(r=>r.id==='pp').count>0);
});
