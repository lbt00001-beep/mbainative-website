import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractArticle,extractVoteValues} from '../scripts/poll-adapters.mjs';
import {extractCis,extractCisEstimate,reconcileCisAlternative} from '../scripts/cis-adapter.mjs';
import {cisDocuments} from '../scripts/cis-update.mjs';
import {feeds,reconcileRelatedArticles} from '../scripts/source-policy.mjs';
import {cisComparison} from '../assets/cis.mjs';
import {estimate,sortPollsByFieldwork,validateCatalog} from '../assets/polling.mjs';
import {reportCounts,updateSummary} from '../assets/update-report.mjs';
const load=file=>JSON.parse(readFileSync(new URL('../'+file,import.meta.url),'utf8'));
const articles=load('tests/fixtures/update-20261015.json'),cis=load('tests/fixtures/cis-comparison-20261015.json');
const catalog=load('tests/fixtures/polls-baseline.json'),official=load('data/official-2023.json');
const html=f=>`<h1>${f.title}</h1><script type="application/ld+json">${JSON.stringify({'@type':'NewsArticle',url:f.url,headline:f.title,datePublished:f.publishedAt,articleBody:f.body})}</script>`;

test('GAD3 octubre: lee Vox tras una coma, conserva porcentajes y ficha del original',()=>{
 const f=articles.find(r=>r.url.includes('gad3.com/barometro-abc')),r=extractArticle(html(f),f.url,{today:'2026-10-15'});
 assert.equal(r.status,'extracted',r.reason);assert.deepEqual(r.poll.values,{pp:31.4,psoe:26.4,vox:18.2,sumar:7.4});
 assert.equal(r.poll.sample,1077);assert.equal(r.poll.fieldworkStart,'2026-10-06');assert.equal(r.poll.fieldworkEnd,'2026-10-08');assert.equal(r.poll.methodology.mode,'telephone');
 assert.equal(r.poll.denominator,'unspecified');
 assert.equal(extractArticle(html(f),f.url,{today:'2026-10-15',catalog:[{...r.poll,url:'https://www.abc.es/original'}]}).status,'duplicate');
 const bounds=extractVoteValues('Podemos no alcanza la marca mínima del 3% de votos. PP y Vox suman un 51% de votos.');
 assert.equal(bounds.values.podemos,undefined);assert.equal(bounds.values.vox,undefined);
});

test('Separa artículos temáticos y desgloses territoriales de encuestas nacionales',()=>{
 for(const key of ['preservar-el-efectivo','por-comunidad-autonoma','sistema-electoral','tres-temas-mas-importantes','preferido-para-liderar']){
  const f=articles.find(r=>r.url.includes(key));assert.ok(f,key);
  assert.equal(extractArticle(html(f),f.url,{today:'2026-10-15'}).status,'context',f.title);
 }
 const f=articles.find(r=>r.url.includes('15-oct'));
 const r=extractArticle(html(f),f.url,{today:'2026-10-15'});assert.equal(r.status,'pending');assert.equal(r.kind,'access');
});

test('Nuevas fuentes identifican el instituto y no cuentan dos veces la publicación',()=>{
 for(const host of ['www.elperiodico.com','gesop.net','www.lavanguardia.com','www.ipsos.com','www.abc.es','www.larazon.es'])assert.ok(feeds.some(([,url])=>new URL(url).hostname===host),host);
 const original=articles.find(r=>r.url.includes('gad3.com/barometro-abc'));
 for(const [host,institute] of [['www.elperiodico.com','GESOP'],['gesop.net','GESOP'],['www.lavanguardia.com','Ipsos'],['www.ipsos.com','Ipsos'],['www.abc.es','GAD3']]){
  const f={...original,url:'https://'+host+'/original',body:original.body.replaceAll('GAD3',institute)},r=extractArticle(html(f),f.url,{today:'2026-10-15'});
  assert.equal(r.status,'extracted',r.reason);assert.equal(r.poll.institute,institute);
  assert.equal(extractArticle(html(f),f.url,{today:'2026-10-15',catalog:[{...r.poll,url:'https://example.com/original'}]}).status,'duplicate');
 }
 const gad3={...original,url:'https://www.lavanguardia.com/original'};
 assert.equal(extractArticle(html(gad3),gad3.url,{today:'2026-10-15'}).poll.institute,'GAD3');
});

test('CIS: resuelve la etiqueta 29 solo contrastando la tabla completa con el avance alternativo',()=>{
 assert.throws(()=>extractCis(cis.primary,cis.technical),/Etiqueta/);
 const result=reconcileCisAlternative(cis.primary,cis.technical,cis.alternative);
 assert.equal(result.tables.direct.rows['Coalición de izquierdas'],.5);assert.match(result.note,/29/);
 assert.throws(()=>reconcileCisAlternative(cis.primary,cis.technical,cis.alternative.replace('23,3','23,4')),/no resuelve/);
 assert.throws(()=>reconcileCisAlternative(cis.primary,cis.technical,cis.alternative.replace('(4.042)','(4.040)')),/Muestra/);
});

test('CIS: descubre el avance con ficha integrada y lee la columna estimada, no la directa',()=>{
 const url='https://www.cis.es/es/w/avance',page=html({url,title:'Barómetro de octubre',publishedAt:'2026-10-14',body:''})+'<a href="/documents/d/guest/es3582mar_A-pdf">Frecuencias</a><a href="/documents/d/guest/3582_estimacion-pdf">Estimación</a>';
 const d=cisDocuments(page,url);assert.equal(d.study,'3582');assert.equal(d.publishedAt,'2026-10-14');assert.equal(d.technicalUrl,undefined);assert.match(d.estimateUrl,/3582_estimacion/);
 assert.equal(extractCis(cis.october,cis.octoberTechnical).sample,5025);
 const r=extractCisEstimate(cis.octoberEstimate,'3582');assert.equal(r.values.psoe,34);assert.equal(r.direct.psoe,25.3);assert.equal(r.values.pp,22.2);assert.equal(r.values.sumar,6.1);
 assert.throws(()=>extractCisEstimate(cis.octoberEstimate,'3577'),/Identidad/);
 assert.throws(()=>extractCisEstimate(cis.octoberEstimate.replace('voto válido','total encuesta'),'3582'),/denominador/);
 assert.throws(()=>extractCisEstimate(cis.octoberEstimate.replace('PSOE   25,3   ±1,2   34',''),'3582'),/incompleto/);
});

test('Comparación CIS: referencia a fecha de publicación, cobertura real y exclusión del promedio',()=>{
 const c=structuredClone(catalog),extracted=extractCisEstimate(cis.octoberEstimate,'3582');
 const p={study:'3582',title:'Octubre',publishedAt:'2026-10-14',fieldworkStart:'2026-10-01',fieldworkEnd:'2026-10-06',sample:5025,values:extracted.values,denominator:'validVotes',measure:'cisComparisonOnly',verified:true,url:'https://www.cis.es/documents/d/guest/3582_estimacion-pdf',studyUrl:'https://www.cis.es/es/w/avance'};
 const before=estimate(c,official,'2026-10-15');c.cisEstimates=[p];assert.equal(validateCatalog(c),true);assert.deepEqual(estimate(c,official,'2026-10-15').values,before.values);
 const comparison=cisComparison(p,c,official),reference=estimate(c,official,p.publishedAt);assert.deepEqual(comparison.selected.map(r=>r.id),reference.selected.map(r=>r.id));
 assert.equal(comparison.rows.find(r=>r.id==='psoe').gap,34-reference.values.psoe);
 const noCoverage=cisComparison({...p,values:{...p.values,ac:1}}, {...c,polls:c.polls.map(r=>{const values={...r.values};delete values.ac;return {...r,values};})},official);
 assert.equal(noCoverage.rows.find(r=>r.id==='ac').average,null);
 assert.throws(()=>cisComparison({...p,measure:'directVote'},c,official));
 const bad=structuredClone(c);bad.cisEstimates[0].values.pp=NaN;assert.throws(()=>validateCatalog(bad));
});

test('Sondeos ordenados por fin de campo descendente; publicación solo como sustituto o desempate',()=>{
 const polls=[{id:'a',institute:'A',fieldworkEnd:'2026-10-01',publishedAt:'2026-10-14'},{id:'b',institute:'B',fieldworkEnd:'2026-10-09',publishedAt:'2026-10-10'},{id:'c',institute:'C',fieldworkEnd:null,publishedAt:'2026-10-08'},{id:'d',institute:'D',fieldworkEnd:'2026-10-09',publishedAt:'2026-10-12'}];
 assert.deepEqual(sortPollsByFieldwork(polls).map(p=>p.id),['d','b','c','a']);assert.equal(polls[0].id,'a');
});

test('Informe: fuentes y documentos son recuentos diferentes; acceso y lectura aparecen separados',()=>{
 const report={sources:Array.from({length:17},(_,i)=>({status:i===16?'error':'ok'})),summary:{newPolls:0},candidates:[{reason:'HTTP 403'},{reason:'No se leen las cifras'},{reason:'HTTP 500'}]};
 assert.deepEqual(reportCounts(report),{sources:17,accessible:16,access:1,extraction:1,network:1});assert.match(updateSummary(report),/16 de 17/);
 const row={url:'https://cadenaser.com/cronica',status:'pending',relatedInstitute:'40dB',publishedAt:'2026-10-09'},r={processed:[row],candidates:[row]};
 reconcileRelatedArticles(r,{polls:[{institute:'40dB',publishedAt:'2026-10-09',url:'https://example.com/original.pdf'}]});assert.equal(r.candidates.length,0);assert.equal(row.status,'context');assert.match(row.original,/original/);
 const discrepancy={...row,status:'pending',observedValues:{pp:40}},unresolved={processed:[discrepancy],candidates:[discrepancy]};
 reconcileRelatedArticles(unresolved,{polls:[{institute:'40dB',publishedAt:'2026-10-09',values:{pp:32},url:'https://example.com/original.pdf'}]});assert.equal(unresolved.candidates.length,1);assert.equal(discrepancy.status,'pending');
});
