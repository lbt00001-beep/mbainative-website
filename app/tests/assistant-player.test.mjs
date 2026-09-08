import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {extractGuide,splitSpeech,pickVoice} from '../public/assistant/core.mjs';

test('editorial extraction excludes forms, private content and hidden elements',()=>{
  const {document}=parseHTML('<html><body><main><h1>Guía</h1><p>Contenido público.</p><form><p>Dato personal</p></form><div data-assistant-private><p>Documento privado</p></div><p hidden>Oculto</p></main></body></html>');
  const guide=JSON.stringify(extractGuide(document,'/'));
  assert.match(guide,/Contenido público/);assert.doesNotMatch(guide,/Dato personal|Documento privado|Oculto/);
  const text='Explicación sencilla sobre agentes y personas. '.repeat(20).trim();
  assert.equal(splitSpeech(text).join(' '),text);
  assert.equal(pickVoice([{lang:'en-US',name:'Google'},{lang:'es-ES',name:'Microsoft Elvira Natural'}]).name,'Microsoft Elvira Natural');
});

test('Play, Pause, resume, Stop and navigation reject stale speech callbacks',async t=>{
  const {window,document}=parseHTML('<html><head></head><body><main><h1>Guía</h1><h2>Segundo</h2></main></body></html>');
  const spoken=[];let cancelled=0;
  const synth={getVoices:()=>[{lang:'es-ES',name:'Microsoft Test',voiceURI:'test'}],addEventListener(){},removeEventListener(){},resume(){},cancel(){cancelled++;},speak:u=>spoken.push(u)};
  class Utterance{constructor(text){this.text=text;}}
  const config={voices:[],chapters:[{title:'Guía',match:'Guía',chunks:[{id:'a',text:'Primera explicación sencilla.'}]},{title:'Segundo',match:'Segundo',chunks:[{id:'b',text:'Segunda explicación.'}]}]};
  const names={window,document,HTMLElement:window.HTMLElement,customElements:window.customElements,location:{pathname:'/',origin:'https://mbainative.com'},matchMedia:()=>({matches:true}),SpeechSynthesisUtterance:Utterance};
  const originals=new Map(Object.keys(names).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  for(const [key,value] of Object.entries(names))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  window.speechSynthesis=synth;window.SpeechSynthesisUtterance=Utterance;
  // linkedom exposes select.value as read-only; supply the browser's setter for this DOM test.
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(value){for(const option of this.querySelectorAll('option')){if(option.value===String(value))option.setAttribute('selected','');else option.removeAttribute('selected');}}});
  window.HTMLElement.prototype.getClientRects=()=>[{}];window.HTMLElement.prototype.scrollIntoView=function(){this.scrolled=true;};
  t.mock.method(globalThis,'fetch',async()=>Response.json(config));
  t.after(()=>{document.querySelector('mbai-assistant')?.remove();for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
  await import('../public/assistant/widget.mjs');
  const player=document.createElement('mbai-assistant');document.body.append(player);
  await new Promise(r=>setTimeout(r,0));
  player.ui.launcher.click();assert.equal(player.state,'playing');assert.equal(spoken.length,1);
  assert.equal(document.querySelector('h1').hasAttribute('data-mbai-narrating'),true);
  const stale=spoken[0].onend;spoken[0].onboundary({name:'word',charIndex:8});
  player.ui.pause.click();assert.equal(player.state,'paused');assert.ok(cancelled);
  stale();assert.equal(player.chapter,0);
  player.ui.play.click();assert.equal(spoken[1].text,'explicación sencilla.');
  const staleResume=spoken[1].onend;player.ui.stop.click();staleResume();
  assert.equal(player.state,'idle');assert.equal(player.chapter,0);assert.equal(player.offset,0);assert.equal(document.querySelector('[data-mbai-narrating]'),null);
  player.ui.next.click();assert.equal(player.chapter,1);player.ui.play.click();assert.equal(spoken.at(-1).text,'Segunda explicación.');
  player.remove();assert.equal(player.state,'idle');assert.equal(document.body.classList.contains('mbai-guide-reserved'),false);
  config.voices.push({id:'azure-test',label:'Test professional'});
  let finishSpeech;
  t.mock.method(globalThis,'fetch',async url=>String(url).includes('/speech')?new Promise(resolve=>{finishSpeech=resolve;}):Response.json(config));
  const cloud=document.createElement('mbai-assistant');document.body.append(cloud);
  await new Promise(r=>setTimeout(r,0));
  const pending=cloud.play();assert.equal(cloud.state,'loading');
  cloud.stop();finishSpeech(new Response(new Uint8Array(32)));await pending;
  assert.equal(cloud.state,'idle');assert.ok(cloud.audio==null);
  cloud.remove();
});
