import test from 'node:test';
import assert from 'node:assert/strict';
import{readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{calculateIndex}from'../public/observatorio-ccaa/composite-engine.mjs';
import{regions}from'../public/observatorio-ccaa/data-engine.mjs';

test('el dashboard publicado conserva todos los archivos de la entrega, incluido su crédito independiente',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../data/observatorio-ccaa-publication.json',import.meta.url),'utf8'));
 assert.equal(manifest.version,'1.3.0');assert.equal(manifest.creationModel,'GPT-6 (Codex)');
 assert.equal(manifest.publishedRoute,'/observatorio-ccaa/index.html');
 for(const file of manifest.files){const bytes=await readFile(new URL('../public/observatorio-ccaa/'+file.path,import.meta.url));assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path)}
 const html=await readFile(new URL('../public/observatorio-ccaa/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('By Luis Benedicto Tuzón with GPT-6 (Codex) · versión 1.3.0 · 2026'));
 assert.ok(html.includes('src="app.mjs"'));assert.ok(html.includes('href="style.css"'));
 assert.doesNotMatch(html,/observatorio-ccaa-lbt\.aldabon\.chatgpt\.site|file:\/\//);
});

test('la instantánea trasladada permite calcular el índice para las 17 comunidades sin servicios privados',async()=>{
 const state=JSON.parse(await readFile(new URL('../public/observatorio-ccaa/snapshot.json',import.meta.url),'utf8'));
 const codes=regions.filter(([geo])=>!['ES63','ES64'].includes(geo)).map(([geo])=>geo);
 const index=calculateIndex(state.datasets,codes);
 assert.ok(index.ok);assert.equal(index.rows.length,17);assert.equal(index.version,'IGT-1.1');
 assert.ok(index.rows.every(row=>Number.isFinite(row.score)));
 assert.ok(state.datasets.access_surgical_wait_days.rows.some(row=>row.geo==='ES30'));
});
