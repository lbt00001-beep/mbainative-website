import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractArticle} from '../scripts/poll-adapters.mjs';
import {reviewedCharts,verifyReviewedChart} from '../scripts/original-reports.mjs';
import {isPollPublication} from '../scripts/search-sources.mjs';
import {feeds} from '../scripts/source-policy.mjs';
const d=JSON.parse(readFileSync(new URL('./fixtures/imop-20261009.json',import.meta.url)));
const chart=reviewedCharts[0],bytes=readFileSync(new URL('./fixtures/imop-20261009.png',import.meta.url));
const html=(text=d.text)=>`<h1>${d.title}</h1><meta property="article:published_time" content="${d.publishedAt}"><article class="entry-content">${text}<img src="${chart.imageUrl}"></article>`;
const options={today:'2026-10-23',reviewedChart:verifyReviewedChart(chart,html(),bytes)};
test('IMOP: contrasta gráfico original y ficha; conserva decimales y ausencias',()=>{
 const r=extractArticle(html(),chart.url,options);
 assert.equal(r.status,'extracted',r.reason);assert.deepEqual(r.poll.values,{pp:30.4,psoe:26.5,vox:19,sumar:7.6});
 assert.equal(r.poll.sample,900);assert.equal(r.poll.fieldworkEnd,'2026-10-07');assert.equal(r.poll.fieldworkStart,'2026-10-05');
 assert.equal(r.poll.methodology.mode,'mixed');assert.equal(r.poll.methodology.recruitment,'panel');assert.equal(r.poll.denominator,'validVotes');
 assert.match(r.poll.note,/redondea/);assert.equal(r.poll.values.podemos,undefined);assert.equal(r.poll.values.salf,undefined);
 assert.equal(extractArticle(html(),chart.url,{...options,catalog:[r.poll]}).verification,'full');
});
test('IMOP: no incorpora el texto redondeado ni reutiliza un gráfico o ficha modificados',()=>{
 assert.equal(extractArticle(html(),chart.url,{today:'2026-10-23'}).status,'pending');
 assert.throws(()=>verifyReviewedChart(chart,html(),Buffer.from('otro gráfico')),/ha cambiado/);
 assert.throws(()=>verifyReviewedChart(chart,'<article class="entry-content">sin imagen</article>',bytes),/ha cambiado/);
 assert.equal(extractArticle(html(d.text.replace('900 entrevistas','901 entrevistas')),chart.url,options).status,'pending');
 assert.equal(extractArticle(html(),chart.url,{...options,today:'2026-10-08'}).status,'rejected');
});
test('IMOP y El Confidencial: dos fuentes y una sola encuesta',()=>{
 for(const host of ['www.imop.es','www.elconfidencial.com'])assert.ok(feeds.some(([,url])=>new URL(url).hostname===host));
 const poll=extractArticle(html(),chart.url,options).poll;
 const article=`<h1>Encuesta IMOP de elecciones generales</h1><meta property="article:published_time" content="2026-10-09"><article class="entry-content">IMOP: elecciones generales en España. PP con el 30,4% de votos. PSOE con el 26,5% de votos. Vox con el 19% de votos. Sumar con el 7,6% de votos. Fechas de campo: del 5 al 7 de octubre de 2026. Tamaño muestral: 900 entrevistas.</article>`;
 assert.equal(extractArticle(article,'https://www.elconfidencial.com/espana/2026-10-09/encuesta-imop/',{today:'2026-10-23',catalog:[poll]}).status,'duplicate');
 assert.equal(extractArticle(article.replace('IMOP:','Otra empresa:'),'https://www.elconfidencial.com/espana/encuesta/',{today:'2026-10-23'}).status,'context');
});


test('IMOP: noticias electorales sin convertir servicios o barómetros financieros en incidencias',()=>{
 const feed='https://www.imop.es/noticias/';
 assert.equal(isPollPublication({title:'Encuesta pre-electoral para El Confidencial 2026'},feed),true);
 for(const title of ['Encuesta telefónica','Encuestas online con panel propio','Barómetro de Innovación Financiera','Encuesta sobre la imagen de la Corona'])assert.equal(isPollPublication({title},feed),false);
});
