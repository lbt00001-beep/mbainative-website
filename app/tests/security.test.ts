import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { NextRequest } from 'next/server';
import { checkOrigin, createRateLimiter, escapeHtml, readJson, RequestError } from '../lib/security';
import { POST as contact } from '../app/api/contact/route';
import { POST as analysis } from '../app/api/aiAnalysis/route';
import { POST as connector } from '../app/api/testConnector/route';
import { DEFAULT_AI_MODEL } from '../lib/ai-models';
const key = 'sk-or-test-only-not-a-real-key-123456';
const request = (data: unknown, origin = 'https://mbainative.com') => new NextRequest('https://mbainative.com/api/test', {
  method: 'POST', headers: { origin, 'content-type':'application/json' }, body:JSON.stringify(data),
});

test('cross-origin and missing-origin POSTs are refused', () => {
  assert.throws(() => checkOrigin(request({}, 'https://evil.example')), {status:403});
  assert.throws(() => checkOrigin(new Request('https://mbainative.com/api/contact')), {status:403});
  assert.doesNotThrow(() => checkOrigin(request({})));
});
test('body limit counts UTF-8 bytes even without Content-Length', async () => {
  await assert.rejects(readJson(request({message:'é'.repeat(100)}),100),{status:413});
});
test('JSON must be an object and have the correct content type', async () => {
  await assert.rejects(readJson(request([])),{status:400});
  await assert.rejects(readJson(new Request('https://mbainative.com',{method:'POST',body:'{}'})),{status:415});
});
test('limiter blocks excess requests and allows a fresh time window', () => {
  let now=1000; const limit=createRateLimiter(() => now);
  limit('a',2,1000); limit('a',2,1000);
  assert.throws(() => limit('a',2,1000),e => e instanceof RequestError && e.status===429 && e.retryAfter===1);
  limit('b',2,1000); now=2000; assert.doesNotThrow(() => limit('a',2,1000));
});
test('email text cannot inject HTML', () => {
  assert.equal(escapeHtml('<img src="x" onerror=\'bad\'> &'), '&lt;img src=&quot;x&quot; onerror=&#39;bad&#39;&gt; &amp;');
});
test('contact rejects malformed values before creating a transport', async t => {
  const transport=t.mock.method(nodemailer,'createTransport',() => {throw Error('must not send');});
  for(const data of [{name:{},email:'a@b.es',message:'Mensaje de prueba'}, {name:'Persona',email:'bad\r\nBcc:x@y.es',message:'Mensaje de prueba'}, {name:'Persona',email:'a@b.es',message:42}]) {
    assert.equal((await contact(request(data))).status,400);
  }
  assert.equal(transport.mock.callCount(),0);
});
test('honeypot never sends an email', async t => {
  const transport=t.mock.method(nodemailer,'createTransport',() => {throw Error('must not send');});
  assert.equal((await contact(request({website:'spam'}))).status,200);
  assert.equal(transport.mock.callCount(),0);
});
test('contact sends only to owner with escaped HTML and verified TLS', async t => {
  const saved={...process.env};
  process.env.EMAIL_USER='owner@example.com'; process.env.EMAIL_PASS='local-test'; process.env.EMAIL_PORT='587'; delete process.env.EMAIL_TO;
  t.after(() => {for(const k of ['EMAIL_USER','EMAIL_PASS','EMAIL_PORT','EMAIL_TO']) {if(saved[k]===undefined) delete process.env[k]; else process.env[k]=saved[k];}});
  const messages: Record<string,unknown>[]=[]; let options: Record<string,unknown>={};
  t.mock.method(nodemailer,'createTransport',((o: Record<string,unknown>) => { options=o; return {sendMail:async (m:Record<string,unknown>) => {messages.push(m);return {};}}; }) as typeof nodemailer.createTransport);
  const result=await contact(request({name:'Nombre <b>falso</b>',email:'visitor@example.org',message:'Un mensaje <img src=x> de prueba.'}));
  assert.equal(result.status,200); assert.equal(messages.length,1);
  assert.equal(messages[0].to,'owner@example.com'); assert.equal(messages[0].replyTo,'visitor@example.org');
  assert.match(String(messages[0].html),/&lt;img src=x&gt;/);
  assert.equal(options.requireTLS,true); assert.equal((options.tls as {rejectUnauthorized:boolean}).rejectUnauthorized,true);
});
test('public AI and connector endpoints cannot use a server API key', async t => {
  const old=process.env.OPENROUTER_API_KEY; process.env.OPENROUTER_API_KEY=key;
  t.after(() => {if(old===undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY=old;});
  const fetch=t.mock.method(globalThis,'fetch',async () => {throw Error('must not fetch');});
  assert.equal((await analysis(request({ticker:'AAPL'}))).status,401);
  assert.equal((await connector(request({type:'openrouter'}))).status,401);
  assert.equal(fetch.mock.callCount(),0);
});
test('AI rejects unapproved models and structured prompt input before a provider call', async t => {
  const fetch=t.mock.method(globalThis,'fetch',async () => {throw Error('must not fetch');});
  assert.equal((await analysis(request({userApiKey:key,ticker:'AAPL',model:'unapproved/expensive-model'}))).status,400);
  assert.equal((await analysis(request({userApiKey:key,ticker:'AAPL',model:DEFAULT_AI_MODEL,topHeadlines:{injected:true}}))).status,400);
  assert.equal(fetch.mock.callCount(),0);
});
test('AI calls use the personal key, bounded tokens, and private responses', async t => {
  let body: Record<string,unknown>={}; let auth='';
  t.mock.method(globalThis,'fetch',async (_url: unknown, options?:RequestInit) => {
    body=JSON.parse(String(options?.body)); auth=new Headers(options?.headers).get('authorization') || '';
    return Response.json({choices:[{message:{content:'<think>private</think>### 1. Resultado\nInforme de prueba'}}]});
  });
  const result=await analysis(request({userApiKey:key,ticker:'AAPL',model:DEFAULT_AI_MODEL,price:100}));
  assert.equal(result.status,200); assert.equal(auth,'Bearer '+key); assert.equal(body.max_tokens,4000);
  assert.equal(result.headers.get('cache-control'),'no-store'); assert.doesNotMatch((await result.json()).report,/private/);
});
test('provider failures do not expose raw errors or keys', async t => {
  t.mock.method(globalThis,'fetch',async () => new Response('secret upstream detail '+key,{status:500}));
  const result=await analysis(request({userApiKey:key,ticker:'AAPL',model:DEFAULT_AI_MODEL}));
  assert.equal(result.status,502); assert.doesNotMatch(await result.text(),/secret upstream|sk-or-test/);
});
