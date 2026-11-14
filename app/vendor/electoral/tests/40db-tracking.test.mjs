import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractPdf} from '../scripts/poll-adapters.mjs';
import {isPollPublication,incorporatePoll} from '../scripts/search-sources.mjs';
import {isOriginal40dbReport,trackingReports} from '../scripts/40db-tracking.mjs';
import {estimate} from '../assets/polling.mjs';
const load=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const [day1,day2]=load('tests/fixtures/40db-tracking-202611.json');
const extract=(f,options={})=>extractPdf(f.pages,f.sourceUrl,{today:'2026-11-14',publishedAt:f.publishedAt,...options});
test('40dB: descubre tracking sin encuesta y consulta solo entregas no futuras de la campaña',()=>{
 assert.ok(isPollPublication({title:'La diferencia entre PP y PSOE se estrecha, según el tracking diario de 40dB.',url:'https://elpais.com/espana/elecciones-generales/2026-11-14/noticia.html'},'https://elpais.com/espana/elecciones-generales/'));
 assert.equal(trackingReports('2026-11-12').length,0);assert.equal(trackingReports('2026-11-14').length,2);assert.equal(trackingReports('2026-11-30').length,11);assert.equal(trackingReports('2027-03-01').length,0);
 assert.equal(trackingReports('2026-11-14')[0].url,day1.sourceUrl);assert.equal(trackingReports('2026-11-14')[1].url,day2.sourceUrl);
 assert.ok(isOriginal40dbReport(day1.sourceUrl));assert.ok(isOriginal40dbReport(day2.sourceUrl));assert.equal(isOriginal40dbReport(day1.sourceUrl.replace('elpais.com','example.com')),false);
});
test('40dB: lee ambos vectores nacionales y separa 2023 y coaliciones territoriales',()=>{
 const first=extract(day1),second=extract(day2);assert.equal(first.status,'extracted',first.reason);assert.equal(second.status,'extracted',second.reason);
 assert.deepEqual(first.poll.values,{pp:31.5,psoe:29.4,vox:18.8,sumar:3.5,salf:1.7,podemos:1.3});
 assert.deepEqual(second.poll.values,{pp:31.1,psoe:29.8,vox:18.5,sumar:3.5,salf:1.6,podemos:1.3});
 assert.equal(first.poll.sample,1000);assert.equal(second.poll.sample,1500);assert.equal(first.poll.fieldworkStart,'2026-11-10');assert.equal(first.poll.fieldworkEnd,'2026-11-12');assert.equal(second.poll.fieldworkEnd,'2026-11-13');
 assert.equal(first.poll.unmodeledValues.territorialLeft,1.6);assert.equal(second.poll.unmodeledValues.territorialLeft,1.7);assert.equal(second.poll.methodology.quotas,'documented');assert.equal(second.poll.methodology.recruitment,'unknown');assert.match(second.poll.note,/solo se utiliza la última/);
});
test('40dB: portada, vector, desglose y ficha incompatibles quedan para revisión',()=>{
 for(const mutate of [f=>f.publishedAt='2026-11-12',f=>f.pages[0]=f.pages[0].replace('Día 1','Día 2'),f=>f.pages[5]=f.pages[5].replace('31,5','40,5'),f=>f.pages[5]=f.pages[5].replace('1,1%','3,1%'),f=>f.pages.push(f.pages[5]),f=>f.pages[5]=f.pages[5].replace('Frente Amplio','Otra candidatura'),f=>f.pages[23]=f.pages[23].replace('12/11/2026','15/11/2026')]){
  const f=structuredClone(day1);mutate(f);let r;try{r=extract(f);}catch(e){assert.match(e.message,/Fechas/);continue;}assert.equal(r.status,'pending',r.reason);
 }
 assert.equal(extract(day2,{today:'2026-11-13'}).status,'pending');
});
test('40dB: incorpora historial, cambia la media y utiliza una sola entrega diaria',()=>{
 const c=load('tests/fixtures/polls-baseline.json'),o=load('data/official-2023.json'),ids=c.polls.map(p=>p.id),before=estimate(c,o,'2026-11-14');
 for(const f of [day1,day2])incorporatePoll(c,extract(f),{hash:'a'.repeat(64),today:'2026-11-14',url:f.sourceUrl});
 const current=estimate(c,o,'2026-11-14'),selected=current.selected.filter(p=>p.institute==='40dB');assert.equal(selected.length,1);assert.equal(selected[0].id,'40db-20261113');assert.notEqual(current.values.psoe,before.values.psoe);assert.ok(ids.every(id=>c.polls.some(p=>p.id===id)));
 assert.equal(estimate(c,o,'2026-11-13').selected.find(p=>p.institute==='40dB').id,'40db-20261112');
 assert.equal(extract(day2,{catalog:c.polls}).status,'known');assert.equal(extract(day2,{catalog:[{...extract(day2).poll,url:'https://ep00.epimg.net/otro-original.pdf'}]}).status,'duplicate');
 const retained=JSON.stringify(c);assert.equal(incorporatePoll(c,{status:'pending'},{today:'2026-11-14'}),false);assert.equal(JSON.stringify(c),retained);
});
