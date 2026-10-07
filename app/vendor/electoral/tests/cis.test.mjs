import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cisDiagnostics} from '../assets/cis.mjs';
import {links} from '../scripts/search-sources.mjs';
import {validateCatalog} from '../assets/polling.mjs';
const load=n=>JSON.parse(readFileSync(new URL('../data/'+n+'.json',import.meta.url),'utf8'));
const catalog=load('polls'),official=load('official-2023');
test('CIS: denominadores, indecisos y recuerdo comparables sin usar estimación',()=>{
 const p=catalog.directSurveys.find(p=>p.study==='3577'),d=cisDiagnostics(p,official);
 assert.equal(p.values.upn,0);assert.ok(Math.abs(d.undecided-16.9)<1e-9);assert.ok(Math.abs(d.directGap-5)<1e-9);
 assert.ok(d.recallComparison.find(r=>r.label==='PSOE').gap>7);
 assert.ok(d.recallComparison.find(r=>r.label==='PP').gap< -7);
 const c=structuredClone(catalog);c.directSurveys[0].tables.direct.rows.PSOE=NaN;assert.throws(()=>validateCatalog(c));
});
test('Descubrimiento deduplica enlaces y descarta destinos externos y protocolos',()=>{
 const html='<a href="/nuevo">Encuesta nueva</a><a href="/nuevo">Repetida</a><a href="https://attacker.example/x">Otra</a><a href="javascript:alert(1)">X</a>';
 assert.deepEqual(links(html,'https://www.cis.es/'),[{url:'https://www.cis.es/nuevo',title:'Repetida'}]);
});
