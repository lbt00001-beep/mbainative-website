import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const appRoot=fileURLToPath(new URL('../',import.meta.url));
const sourceArgument=process.argv[2];
if(!sourceArgument)throw Error('Uso: node scripts/sync-observatorio-ccaa.mjs RUTA_AL_DIRECTORIO_DIST');
const source=path.resolve(sourceArgument),target=path.join(appRoot,'public','observatorio-ccaa');
const html=await fs.readFile(path.join(source,'index.html'),'utf8');
if(!html.includes('Observatorio CCAA')||!html.includes('By Luis Benedicto Tuzón with GPT-6 (Codex)'))throw Error('No se reconoce el dashboard o falta su crédito de creación');
const packageInfo=JSON.parse(await fs.readFile(path.join(source,'..','package.json'),'utf8'));
let sourceCommit=null;
try{sourceCommit=execFileSync('git',['-C',path.dirname(source),'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim()}catch{}
const files=[];
async function copy(relative=''){
 for(const entry of await fs.readdir(path.join(source,relative),{withFileTypes:true})){
  if(entry.name.startsWith('.'))continue;
  const name=path.join(relative,entry.name);
  if(entry.isDirectory()){await copy(name);continue}
  if(!entry.isFile()||!['.html','.css','.mjs','.js','.json','.svg','.png','.webp','.jpg','.ico','.woff2'].includes(path.extname(entry.name)))throw Error('Archivo no previsto: '+name);
  const data=await fs.readFile(path.join(source,name)),destination=path.join(target,name);
  await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,data);
  files.push({path:name.split(path.sep).join('/'),bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
 }
}
await copy();
const manifest={app:'Observatorio CCAA',version:packageInfo.version,creationModel:'GPT-6 (Codex)',publishedRoute:'/observatorio-ccaa/index.html',sourceCommit,files:files.sort((a,b)=>a.path.localeCompare(b.path))};
await fs.writeFile(path.join(appRoot,'data','observatorio-ccaa-publication.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Dashboard '+manifest.version+': '+files.length+' archivos preparados en '+manifest.publishedRoute);
