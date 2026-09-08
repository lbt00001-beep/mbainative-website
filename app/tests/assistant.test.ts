import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpeechService, type SpeechVoice} from '../lib/assistant-speech';
import {POST} from '../app/api/assistant/speech/route';
import {GET} from '../app/api/assistant/config/route';
import guides from '../data/assistant-guides.json';

const voice:SpeechVoice={id:'azure-test',label:'Test',provider:'azure',name:'es-ES-ElviraNeural'};
const request=(data:unknown,origin='https://mbainative.com')=>new Request('https://mbainative.com/api/assistant/speech',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)});
test('every published guide resolves all its narration fragments', async()=>{
  assert.equal(Object.keys(guides.pages).length,33);
  for(const path of Object.keys(guides.pages)){
    const response=GET(new Request('https://mbainative.com/api/assistant/config?path='+encodeURIComponent(path)));
    assert.equal(response.status,200);
    const body=await response.json();
    assert.ok(body.chapters.length);
    for(const chapter of body.chapters) for(const chunk of chapter.chunks){assert.ok(chunk.text.trim());assert.ok(chunk.text.length<350);}
    assert.doesNotMatch(JSON.stringify(body),/AZURE_SPEECH_KEY|GOOGLE_TTS_API_KEY/);
  }
  assert.equal(GET(new Request('https://mbainative.com/api/assistant/config?path=__proto__')).status,404);
});
test('speech API rejects foreign origins, unapproved text and unconfigured voices',async()=>{
  const id=Object.keys(guides.segments)[0];
  assert.equal((await POST(request({id,voice:'invalid'},'https://foreign.example'))).status,403);
  assert.equal((await POST(request({id:'__proto__',voice:'invalid'}))).status,404);
  assert.equal((await POST(request({id,voice:'invalid',text:'Texto arbitrario'}))).status,400);
  assert.equal((await POST(request({id,voice:'invalid'}))).status,503);
});
test('speech escapes SSML, shares simultaneous requests and caches completed audio',async()=>{
  let calls=0;let body='';
  const service=createSpeechService(async(_url,options)=>{calls++;body=String(options?.body);await new Promise(r=>setTimeout(r,5));return new Response(new Uint8Array(32),{headers:{'content-type':'audio/mpeg'}});});
  const [a,b]=await Promise.all([service('A < B & C',voice),service('A < B & C',voice)]);
  assert.equal(calls,1);assert.deepEqual(a,b);assert.match(body,/A &lt; B &amp; C/);
  await service('A < B & C',voice);assert.equal(calls,1);
});
test('Google audio is decoded and upstream errors remain private',async()=>{
  const service=createSpeechService(async()=>Response.json({audioContent:Buffer.alloc(32,7).toString('base64')}));
  assert.deepEqual(await service('Hola',{...voice,provider:'google'}),Buffer.alloc(32,7));
  const failed=createSpeechService(async()=>{throw Error('secret-key-provider-detail');});
  await assert.rejects(failed('Hola',voice),(error:unknown)=>{assert.doesNotMatch(String(error),/secret-key/);return true;});
});
test('daily character budget blocks new speech while cached speech remains usable',async t=>{
  const old=process.env.ASSISTANT_DAILY_CHAR_LIMIT;process.env.ASSISTANT_DAILY_CHAR_LIMIT='4';
  t.after(()=>{if(old===undefined)delete process.env.ASSISTANT_DAILY_CHAR_LIMIT;else process.env.ASSISTANT_DAILY_CHAR_LIMIT=old;});
  let calls=0;
  const service=createSpeechService(async()=>{calls++;return new Response(new Uint8Array(32),{headers:{'content-type':'audio/mpeg'}});});
  await service('Hola',voice);await service('Hola',voice);
  await assert.rejects(service('Otra',voice),{status:429});assert.equal(calls,1);
});
