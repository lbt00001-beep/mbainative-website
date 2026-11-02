import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractArticle,canonical,technicalMetadata} from '../scripts/poll-adapters.mjs';
import {links,isPollPublication,incorporatePoll} from '../scripts/search-sources.mjs';
import {feeds} from '../scripts/source-policy.mjs';
import {originalReports} from '../scripts/original-reports.mjs';
import {estimate} from '../assets/polling.mjs';
const load=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const f=load('tests/fixtures/sigma-20261102.json');
const html=body=>`<header><h1>${f.title}</h1></header><time datetime="${f.publishedAt}">2 de noviembre de 2026</time><section class="news-detail-content"><div class="news-body">${body??f.body}</div></section>`;
const feed='https://www.sigmados.com/noticias.php?lang=es';
test('Sigma Dos: nuevo índice conserva el título frente a Leer más y unifica .php sin perder id',()=>{
 assert.ok(feeds.some(([name,url])=>name==='Sigma Dos'&&url===feed));
 const page=`<a href="noticia.php?id=sa0OT7jgxEjay6E">${f.title}</a><a href="noticia.php?id=sa0OT7jgxEjay6E">Leer más <i></i></a><a href="noticia?id=sa0OT7jgxEjay6E&lang=es">ES</a>`;
 const found=links(page,feed);assert.equal(found.length,1);assert.equal(found[0].title,f.title);assert.equal(found[0].url,f.url);assert.ok(isPollPublication(found[0],feed));
 assert.notEqual(canonical(f.url),canonical(f.url.replace('sa0OT7jgxEjay6E','otro-estudio')));
 assert.equal(isPollPublication({title:'Sondeo 19 de octubre - Mapa de escaños por provincia para las Elecciones Generales del 29-N',url:f.url},feed),false);
 assert.ok(originalReports.some(r=>r.url===f.url&&r.publishedAt==='2026-11-02'));
});
test('Sigma Dos: texto y ficha 2/11, campo 29 y 30/10 y porcentajes sin confundir escaños',()=>{
 const r=extractArticle(html(),f.url,{today:'2026-11-02'});assert.equal(r.status,'extracted',r.reason);
 assert.equal(r.poll.sample,2505);assert.equal(r.poll.fieldworkStart,'2026-10-29');assert.equal(r.poll.fieldworkEnd,'2026-10-30');
 assert.equal(r.poll.denominator,'unspecified');assert.equal(r.poll.methodology.mode,'mixed');assert.equal(r.poll.methodology.recruitment,'panel');
 assert.deepEqual(r.poll.values,{pp:31.1,psoe:24.6,vox:19.3,sumar:7.1,podemos:1.9,erc:3,bildu:1.3,pnv:.9,junts:1.1,bng:1,cc:.4,aa:1.4});
 assert.equal(r.poll.values.salf,undefined);assert.deepEqual(r.poll.unmodeledValues,{fv:.9});assert.match(r.poll.note,/sin sumarlo a Sumar/);
 assert.equal(extractArticle(html(),f.url,{today:'2026-11-01'}).status,'rejected');
 assert.throws(()=>technicalMetadata(f.body.replace('29 y 30 de octubre','30 y 29 de octubre'),f.publishedAt),/Fechas/);
});
test('Sigma Dos: actualización conserva historial, selecciona la nueva ola y no reimporta variantes',()=>{
 const c=load('tests/fixtures/polls-baseline.json'),o=load('data/official-2023.json'),oldIds=c.polls.map(p=>p.id);
 const r=extractArticle(html(),f.url,{today:'2026-11-02'});incorporatePoll(c,r,{hash:'a'.repeat(64),today:'2026-11-02',url:f.url});
 const selected=estimate(c,o,'2026-11-02').selected.filter(p=>p.institute==='Sigma Dos');assert.equal(selected.length,1);assert.equal(selected[0].id,'sigmados-20261030');
 assert.ok(oldIds.every(id=>c.polls.some(p=>p.id===id)));
 const variant=f.url.replace('/noticia?','/noticia.php?')+'&lang=es';assert.equal(extractArticle(html(),variant,{today:'2026-11-02',catalog:c.polls}).status,'known');
 assert.equal(extractArticle(html(),f.url,{today:'2026-11-02',catalog:[{...r.poll,url:'https://www.elmundo.es/original'}]}).status,'duplicate');
});
