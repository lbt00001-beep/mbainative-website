import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {initializeHelp} from '../vendor/electoral/assets/help.mjs';

async function guide(){
 const html=await readFile(new URL('../vendor/electoral/index.html',import.meta.url),'utf8');
 const {document,window}=parseHTML(html);
 for(const chapter of document.querySelectorAll('.help-chapter'))Object.defineProperty(chapter,'open',{get(){return this.hasAttribute('open');},set(value){if(value)this.setAttribute('open','');else this.removeAttribute('open');}});
 initializeHelp(document);return {document,window};
}
test('Ayuda: búsqueda por varias palabras sin tildes y recuperación del estado de lectura',async()=>{
 const {document,window}=await guide(),input=document.getElementById('help-search');
 const chapters=[...document.querySelectorAll('.help-chapter')],initial=chapters.map(c=>c.open);
 input.value='tamano efectivo';input.dispatchEvent(new window.Event('input'));
 const visible=[...document.querySelectorAll('.help-entry')].filter(e=>!e.hidden);
 assert.ok(visible.length>0);assert.ok(visible.length<document.querySelectorAll('.help-entry').length);
 assert.ok(visible.some(e=>e.textContent.includes('Kish')));
 assert.equal(document.getElementById('help-ai').hidden,true);
 for(const c of chapters.filter(c=>!c.hidden))assert.equal(c.open,true);
 document.getElementById('help-clear-search').click();
 assert.equal(input.value,'');assert.ok(chapters.every(c=>!c.hidden));assert.deepEqual(chapters.map(c=>c.open),initial);
 assert.ok([...document.querySelectorAll('.help-entry')].every(e=>!e.hidden));
});
test('Ayuda: búsqueda sin coincidencias e índice que limpia filtro y abre el capítulo',async()=>{
 const {document,window}=await guide(),input=document.getElementById('help-search');
 input.value='zzzzsincoincidencias';input.dispatchEvent(new window.Event('input'));
 assert.match(document.getElementById('help-search-status').textContent,/^0 apartados/);
 document.querySelector('.help-index a[href="#help-cis"]').click();
 assert.equal(input.value,'');assert.equal(document.getElementById('help-cis').hidden,false);assert.equal(document.getElementById('help-cis').open,true);
});
test('Ayuda integrada: enlaces internos y puntos de actualización de datos resuelven',async()=>{
 const {document}=await guide();
 for(const link of document.querySelectorAll('.help-index a'))assert.ok(document.getElementById(link.getAttribute('href').slice(1)));
 for(const id of ['help-title','help-poll-count','help-data-list','help-data-date'])assert.equal(document.querySelectorAll('#'+id).length,1);
 for(const entry of document.querySelectorAll('.help-entry'))assert.ok(entry.querySelector('.help-example'),'Falta ejemplo en '+entry.querySelector('h3')?.textContent);
});
