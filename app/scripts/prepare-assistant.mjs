import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseHTML } from 'linkedom';
import { extractGuide, splitSpeech } from '../public/assistant/core.mjs';
import { overrides } from './assistant-overrides.mjs';
const base=new URL(process.argv[2]||'http://127.0.0.1:3007');
if(!['127.0.0.1','localhost'].includes(base.hostname))throw Error('La preparación debe leer la vista local del proyecto.');
const seo=await fs.readFile('lib/seo.ts','utf8');
const paths=[...seo.matchAll(/^\s*'([^']+)':\s*\[/gm)].map(m=>m[1]);
paths.push('/plan-de-marketing/index.html','/benchmarks-ia/index.html','/evolucion/index.html');
const pages={};const segments={};
for(const path of paths){
  let chapters;
  if(overrides[path])chapters=overrides[path];
  else {const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(90000)});if(!response.ok)throw Error(path+': '+response.status);const {document}=parseHTML(await response.text());chapters=extractGuide(document,path).chapters;}
  const occurrences=new Map();
  pages[path]=chapters.map(({title,text,match='',selector='',tag=''})=>{const occurrence=occurrences.get(match)||0;occurrences.set(match,occurrence+1);return {title,match,selector,tag,occurrence,segments:splitSpeech(title+'. '+text).map(text=>{const id=createHash('sha256').update(text).digest('hex').slice(0,24);segments[id]=text;return id;})};});
}
const result={updatedAt:new Date().toISOString(),pages,segments};
await fs.writeFile('data/assistant-guides.json',JSON.stringify(result,null,2)+'\n');
console.log(`Guías preparadas: ${paths.length} páginas, ${Object.keys(segments).length} fragmentos. Solo contenido editorial público.`);
