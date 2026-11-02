import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {articleDocument,extractArticle} from '../scripts/poll-adapters.mjs';import{parseTargetVoteChart,loadTargetVoteChart}from '../scripts/target-point.mjs';import{links,isPollPublication,incorporatePoll}from '../scripts/search-sources.mjs';import{estimate}from '../assets/polling.mjs';
const load=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));const f=load('tests/fixtures/target-point-20261102.json');
const chartHtml=(chart=f.chart)=>'<script>window.__DW_SVELTE_PROPS__ = JSON.parse('+JSON.stringify(JSON.stringify(chart))+');</script>';
const html=()=>`<h1>${f.title}</h1><meta property="article:published_time" content="${f.publishedAt}"><div class="entry-content">${f.body}</div><div class="c-detail__box"><h3>ficha técnica</h3>${f.technicalText}</div><iframe title="Porcentaje de voto" src="${f.chartUrl}"></iframe>`;
const read=(chart=f.chart,csv=f.csv,meta={})=>parseTargetVoteChart(chartHtml(chart),csv,{url:f.chartUrl,technicalText:f.technicalText,publishedAt:f.publishedAt,...meta});
test('El Debate: descubre la etiqueta de encuesta fuera del titular sin contaminar enlaces ajenos',()=>{
 const index=`<article class="c-article"><p class="c-article__epigraph">encuesta target point</p><h2><a href="${f.url}">${f.title}</a></h2><h3><a href="/otra">Otra noticia</a></h3></article><article class="c-article"><h2><a href="/sin-etiqueta">Noticia independiente</a></h2></article>`;
 const discovered=links(index,'https://www.eldebate.com/espana/').filter(l=>isPollPublication(l,'https://www.eldebate.com/espana/'));assert.equal(discovered.length,1);assert.equal(discovered[0].url,f.url);
});
test('Target Point: gráfico actual, ficha técnica y método, sin transferencias, valoración ni 2023',()=>{
 const d=articleDocument(html(),f.url);assert.equal(d.voteCharts.length,1);assert.match(d.technicalText,/1.024/);const chart=read();
 const r=extractArticle(html(),f.url,{today:'2026-11-02',voteChart:chart});assert.equal(r.status,'extracted',r.reason);
 assert.deepEqual(r.poll.values,{podemos:2.4,sumar:6.6,psoe:25.5,pp:31.8,vox:19.9,salf:2.6});assert.equal(r.poll.sample,1024);assert.equal(r.poll.fieldworkStart,'2026-10-28');assert.equal(r.poll.fieldworkEnd,'2026-10-30');assert.equal(r.poll.denominator,'unspecified');assert.equal(r.poll.methodology.mode,'online');assert.equal(r.poll.methodology.recruitment,'panel');assert.equal(r.poll.methodology.weighting,'documented');
 assert.equal(extractArticle(html(),f.url,{today:'2026-11-02'}).status,'pending');assert.equal(extractArticle(html(),f.url,{today:'2026-11-01',voteChart:chart}).status,'rejected');
 const c=load('tests/fixtures/polls-baseline.json'),old=c.polls.map(p=>p.id);incorporatePoll(c,r,{hash:'a'.repeat(64),today:'2026-11-02',url:f.url});assert.ok(old.every(id=>c.polls.some(p=>p.id===id)));const selected=estimate(c,load('data/official-2023.json'),'2026-11-02').selected.filter(p=>p.institute==='Target Point');assert.equal(selected.length,1);assert.equal(selected[0].id,'targetpoint-20261030');assert.equal(extractArticle(html(),f.url,{today:'2026-11-02',voteChart:chart,catalog:c.polls}).status,'known');
});
test('Target Point: no acepta gráfico de valoración, otra casa, campo distinto o columnas ambiguas',()=>{
 let other=structuredClone(f.chart);other.chart.title='Valoración de líderes';assert.throws(()=>read(other),/Identidad/);other=structuredClone(f.chart);other.chart.metadata.describe['source-name']='Otra empresa';assert.throws(()=>read(other),/Identidad/);
 assert.throws(()=>read(f.chart,f.csv,{technicalText:f.technicalText.replace('30 de octubre','29 de octubre')}),/mismo trabajo/);
 assert.throws(()=>read(f.chart,f.csv.replace('Porcentaje','Valoración')),/Columnas/);assert.throws(()=>read(f.chart,f.csv.replace('Vox\t19,9\t12,4','Vox\t\t12,4')),/incompleto/);
 assert.throws(()=>read(f.chart,f.csv.replace('Sumar\t\t12,3','Sumar\t12,3\t12,3')),/ambiguo/);
});
test('Target Point: descarga exclusivamente el gráfico permitido y su dataset; un fallo no se oculta',async()=>{
 const document=articleDocument(html(),f.url),called=[];const r=await loadTargetVoteChart(document,async url=>{called.push(url);return url.endsWith('dataset.csv')?f.csv:chartHtml();});assert.equal(r.values.vox,19.9);assert.deepEqual(called,[f.chartUrl,f.chartUrl+'dataset.csv']);
 await assert.rejects(loadTargetVoteChart({...document,voteCharts:[{url:'https://example.com/abcde/1/'}]},async()=>{throw Error('No debe descargarse');}),/no permitido/);
 await assert.rejects(loadTargetVoteChart(document,async()=>{throw Error('HTTP403');}),/HTTP403/);
});
