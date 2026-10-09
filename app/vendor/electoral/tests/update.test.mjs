import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractArticle,extractVoteValues,extractPdf} from '../scripts/poll-adapters.mjs';
import {incorporatePoll,isPollPublication,isOriginal40dbReport} from '../scripts/search-sources.mjs';
import {originalReports} from '../scripts/original-reports.mjs';
import {estimate} from '../assets/polling.mjs';
const load=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const catalog=load('tests/fixtures/polls-baseline.json'),official=load('data/official-2023.json'),fixtures=load('tests/fixtures/poll-articles.json');
const html=f=>`<html><body><h1>${f.title}</h1><script type="application/ld+json">${JSON.stringify({'@type':'NewsArticle',url:f.url,headline:f.title,datePublished:f.publishedAt,articleBody:f.body})}</script>${f.table?'<table>'+f.table.map(row=>'<tr>'+row.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>').join('')+'</table>':''}</body></html>`;
test('40dB flash: incorpora el original en instalaciones existentes y excluye candidatura unitaria',()=>{
 const report=originalReports[0],pages=load('tests/fixtures/40db-flash-pages.json');
 const result=extractPdf(pages,report.url,{today:'2026-10-09',publishedAt:report.publishedAt,catalog:catalog.polls});
 assert.equal(result.status,'extracted',result.reason);
 assert.deepEqual(result.poll.values,{pp:31.9,psoe:28.1,vox:18.9,sumar:5.3,podemos:2.3,salf:1.8});
 assert.equal(result.poll.sample,800);assert.equal(result.poll.fieldworkStart,'2026-10-07');assert.equal(result.poll.fieldworkEnd,'2026-10-08');assert.equal(result.poll.denominator,'validVotes');
 const c=structuredClone(catalog);incorporatePoll(c,result,{hash:'b'.repeat(64),today:'2026-10-09',url:report.url});
 const selected=estimate(c,official).selected.filter(p=>p.institute==='40dB');assert.equal(selected.length,1);assert.equal(selected[0].fieldworkEnd,'2026-10-08');assert.equal(c.polls.length,catalog.polls.length+1);
 assert.equal(extractPdf(pages,report.url,{today:'2026-10-09',publishedAt:report.publishedAt,catalog:c.polls}).status,'known');
 assert.equal(extractPdf([...pages,pages[4]],report.url,{today:'2026-10-09',publishedAt:report.publishedAt}).status,'pending');
});
test('Descubre noticias electorales SER sin la palabra encuesta y reconoce PDF flash',()=>{
 const feed='https://cadenaser.com/tag/encuestas/a/';
 assert.ok(isPollPublication({url:'https://cadenaser.com/nacional/2026/10/09/pp-y-vox/',title:'PP y Vox lograrían una amplia mayoría absoluta con más de 40 escaños de ventaja'},feed));
 assert.equal(isPollPublication({url:'https://cadenaser.com/nacional/2026/10/09/andalucia/',title:'Encuesta autonómica de Andalucía'},feed),false);
 assert.ok(isOriginal40dbReport(originalReports[0].url));assert.equal(isOriginal40dbReport('https://example.com/informe_voto.pdf'),false);
 const article={url:'https://cadenaser.com/nacional/2026/10/09/pp-y-vox/',publishedAt:'2026-10-09',title:'PP y Vox lograrían una amplia mayoría absoluta',body:'La encuesta flash de 40dB da 132 escaños al PP, 112 al PSOE y 66 a Vox en el Congreso. Sumar tendría 5 escaños y Podemos 2.'};
 assert.equal(extractArticle(html(article),article.url,{today:'2026-10-09'}).status,'pending');
});
test('Lee fuentes reales y evita mezclar resultados anteriores, bloques y transferencias',()=>{
 for(const [host,expected] of [['sigmados',{pp:32.6,psoe:25.6,vox:18.3,sumar:6.6}],['elespanol',{pp:33.4,psoe:26.5,vox:18.1,sumar:5.3}],['vozpopuli',{pp:33.6,psoe:25.1,vox:19.3,sumar:5.6}]]){
  const f=fixtures.find(f=>f.url.includes(host)&&!f.url.includes('septiembre-estimacion')&&!f.url.includes('quien-ganara'));
  const result=extractArticle(html(f),f.url,{today:'2026-10-06',catalog:[]});assert.equal(result.status,'extracted',result.reason);
  for(const[id,v]of Object.entries(expected))assert.equal(result.poll.values[id],v,id);
 }
 const roundup=fixtures.find(f=>f.url.includes('quien-ganara'));assert.equal(extractArticle(html(roundup),roundup.url,{today:'2026-10-06'}).status,'context');
});
test('ElectoPanel mantiene Compromís en el espacio Sumar y no añade una ola duplicada',()=>{
 const f=fixtures.find(f=>f.url.includes('electomania')),r=extractArticle(html(f),f.url,{today:'2026-10-06',catalog:[]});
 assert.equal(r.status,'extracted');assert.equal(r.poll.values.sumar,6.3);assert.equal(r.poll.sample,8171);assert.equal(r.poll.fieldworkEnd,'2026-10-03');
 assert.equal(extractArticle(html(f),f.url,{today:'2026-10-06',catalog:catalog.polls}).status,'known');
});
test('PDF 40dB: toma el vector actual y excluye el resultado 2023 y las series',()=>{
 const pages=load('tests/fixtures/40db-pages.json'),url=catalog.polls.find(p=>p.institute==='40dB').url;
 const r=extractPdf(pages,url,{today:'2026-10-06',publishedAt:'2026-10-05',catalog:[]});
 assert.equal(r.status,'extracted',r.reason);assert.equal(r.poll.values.pp,31.6);assert.equal(r.poll.values.psoe,27.4);assert.equal(r.poll.fieldworkEnd,'2026-09-28');
 assert.equal(extractPdf([...pages,pages[0]],url,{today:'2026-10-06',publishedAt:'2026-10-05'}).status,'pending');
});
test('Publicación futura, muestra y fechas incompatibles nunca entran automáticamente',()=>{
 const f=fixtures[0];assert.equal(extractArticle(html({...f,publishedAt:'2026-10-07'}),f.url,{today:'2026-10-06'}).status,'rejected');
 assert.throws(()=>extractArticle(html({...f,body:f.body.replace('22 de septiembre','22 de noviembre')}),f.url,{today:'2026-10-06'}));
 const result=extractVoteValues('Los votantes del PSOE dan un 53% de aprobación y un 6% de dudas. PP y Vox suman un 52,9% de votos.');
 assert.equal(result.values.psoe,undefined);assert.equal(result.values.vox,undefined);
});
test('Una nueva ola validada cambia la estimación, conserva anteriores y se usa solo una por instituto',()=>{
 const f=fixtures[0],updated={...f,publishedAt:'2026-10-06',url:f.url.replace('octubre','nueva-ola-octubre'),body:f.body.replace('32,6','35,0').replace('22 de septiembre','2 de octubre').replace('1 de octubre','5 de octubre')};
 const result=extractArticle(html(updated),updated.url,{today:'2026-10-06',catalog:catalog.polls});assert.equal(result.status,'extracted',result.reason);
 const c=structuredClone(catalog),before=estimate(c,official);assert.ok(incorporatePoll(c,result,{hash:'a'.repeat(64),today:'2026-10-06',url:updated.url}));
 const after=estimate(c,official);assert.equal(after.selected.filter(p=>p.institute==='Sigma Dos').length,1);assert.equal(after.selected.find(p=>p.institute==='Sigma Dos').values.pp,35);assert.ok(after.values.pp>before.values.pp);assert.equal(c.polls.length,catalog.polls.length+1);
 const originalIds=catalog.polls.map(p=>p.id);assert.ok(originalIds.every(id=>c.polls.some(p=>p.id===id)));
});
test('Acceso, contraste parcial y discrepancia no se presentan como verificación completa',()=>{
 const f=fixtures[0],original=catalog.polls.find(p=>p.url===f.url);
 const partial=extractArticle(html(f),f.url,{today:'2026-10-07',catalog:catalog.polls});assert.equal(partial.status,'known');assert.equal(partial.verification,'partial');
 const accessible={...f,body:'Sigma Dos publica su barómetro de elecciones generales en España. Consulta los porcentajes en el gráfico.'};const result=extractArticle(html(accessible),f.url,{today:'2026-10-07',catalog:catalog.polls});assert.equal(result.status,'known');assert.equal(result.verification,'accessOnly');assert.equal(result.matched.length,0);
 const corrected={...f,body:f.body.replace('32,6','34,6')};assert.equal(extractArticle(html(corrected),f.url,{today:'2026-10-07',catalog:catalog.polls}).status,'pending');assert.equal(original.values.pp,32.6);
 const missingGraph={...accessible,url:accessible.url+'nuevo'};assert.equal(extractArticle(html(missingGraph),missingGraph.url,{today:'2026-10-07',catalog:catalog.polls}).status,'pending');
});
test('MIC: conserva lectura de PDF con palabras fragmentadas y derivación SALF explícita',()=>{
 const pages=load('tests/fixtures/mic-pages.json'),original=catalog.polls.find(p=>p.institute==='More in Common');
 const r=extractPdf(pages,original.url,{today:'2026-10-07',catalog:catalog.polls});assert.equal(r.status,'known',r.reason);assert.equal(r.verification,'full');assert.match(r.evidence.salf,/Derivación explícita/);
 const changed=pages.map(p=>p.replace('28,7%','38,7%'));assert.equal(extractPdf(changed,original.url,{today:'2026-10-07',catalog:catalog.polls}).status,'pending');
});
