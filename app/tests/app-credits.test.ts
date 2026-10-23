import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findAppCredit, formatAppCredit, appCredits} from '../lib/app-credits';

test('Todas las rutas alojadas tienen autor, modelo, versión y año explícitos', async () => {
  assert.equal(appCredits.length,13);
  assert.equal(new Set(appCredits.map(c=>c.route)).size,13);
  for(const credit of appCredits){
    assert.ok(credit.model.trim());assert.match(credit.version,/^\d+\.\d+(?:\.\d+)?$/);
    assert.equal(credit.year,2026);assert.match(formatAppCredit(credit),/^By Luis Benedicto Tuzón with .+ · versión .+ · 2026$/);
    assert.equal(findAppCredit(credit.route+'/')?.id,credit.id);
  }
  assert.equal(findAppCredit('/contact'),undefined);
  assert.equal(findAppCredit('/aplicaciones'),undefined);
  assert.equal(findAppCredit('/evolucion/')?.id,'evolucion');
  const publicRegistry=JSON.parse(await readFile(new URL('../public/app-credits/registry.json',import.meta.url),'utf8'));
  assert.deepEqual(publicRegistry.apps,appCredits);
});

test('Conserva los modelos de creación documentados y no usa los modelos del servicio de IA',()=>{
  assert.equal(findAppCredit('/benchmarks-ia/index.html')?.model,'Gemini 3.5 Flash (High)');
  assert.equal(findAppCredit('/aplicaciones/inversion-fundamentales')?.model,'Claude Opus 4.5 Thinking');
  assert.equal(findAppCredit('/plan-de-marketing/index.html')?.model,'GPT 5.5. medium');
  for(const route of ['/aplicaciones/tradingalpha','/aplicaciones/observatorio-electoral'])assert.equal(findAppCredit(route)?.model,'modelo de IA desconocido');
});

test('Los accesos independientes incluyen su crédito y la versión electoral coincide con health',async()=>{
  for(const [file,route] of [['benchmarks-ia/index.html','/benchmarks-ia/index.html'],['voto-23j/index.html','/voto-23j/index.html'],['restaurador-super8/index.html','/restaurador-super8/index.html']]){
    const html=await readFile(new URL('../public/'+file,import.meta.url),'utf8');assert.ok(html.includes(formatAppCredit(findAppCredit(route)!)),file);
  }
  const electoral=await readFile(new URL('../vendor/electoral/index.html',import.meta.url),'utf8');assert.ok(electoral.includes(formatAppCredit(findAppCredit('/aplicaciones/observatorio-electoral')!)));
  const handler=await readFile(new URL('../vendor/electoral/deployment/next-handler.mjs',import.meta.url),'utf8');assert.ok(handler.includes("version:'3.6.3'"));
  const evolution=await readFile(new URL('../public/evolucion/index.html',import.meta.url),'utf8');assert.ok(evolution.includes('/app-credits/widget.mjs'));
});
