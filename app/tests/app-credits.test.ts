import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findAppCredit, formatAppCredit, appCredits} from '../lib/app-credits';

test('Todas las rutas alojadas tienen autor, modelo, versión y año explícitos', async () => {
  assert.equal(appCredits.length,17);
  assert.equal(new Set(appCredits.map(c=>c.route)).size,17);
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
  assert.equal(findAppCredit('/aplicaciones/tradingalpha')?.model,'modelo de IA desconocido');
  assert.equal(findAppCredit('/observatorio-ccaa/index.html')?.model,'GPT-6 (Codex)');
  assert.equal(findAppCredit('/huelga-general-11n/index.html')?.model,'Claude Fable 5.1');
  assert.equal(findAppCredit('/aplicaciones/observatorio-electoral')?.model,'GPT 6.1 Sol Medio');
  assert.equal(findAppCredit('/aplicaciones/elecciones-generales-2026')?.model,'Gemini 4 Hydrogen Extra');
  assert.equal(findAppCredit('/elecciones-2026/index.html')?.model,'Gemini 4 Hydrogen Extra');
});

test('Los accesos independientes incluyen su crédito y la versión electoral coincide con health',async()=>{
  for(const [file,route] of [['benchmarks-ia/index.html','/benchmarks-ia/index.html'],['voto-23j/index.html','/voto-23j/index.html'],['restaurador-super8/index.html','/restaurador-super8/index.html'],['observatorio-ccaa/index.html','/observatorio-ccaa/index.html'],['huelga-general-11n/index.html','/huelga-general-11n/index.html'],['elecciones-2026/index.html','/elecciones-2026/index.html']]){
    const html=await readFile(new URL('../public/'+file,import.meta.url),'utf8');assert.ok(html.includes(formatAppCredit(findAppCredit(route)!)),file);
  }
  const electoral=await readFile(new URL('../vendor/electoral/index.html',import.meta.url),'utf8');assert.ok(electoral.includes(formatAppCredit(findAppCredit('/aplicaciones/observatorio-electoral')!)));
  const handler=await readFile(new URL('../vendor/electoral/deployment/next-handler.mjs',import.meta.url),'utf8');assert.ok(handler.includes("version:'"+findAppCredit('/aplicaciones/observatorio-electoral')!.version+"'"));
  const evolution=await readFile(new URL('../public/evolucion/index.html',import.meta.url),'utf8');assert.ok(evolution.includes('/app-credits/widget.mjs'));
});
