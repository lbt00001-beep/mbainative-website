import {readFile,mkdir,copyFile,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const BASE='/aplicaciones/observatorio-electoral';
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://openrouter.ai; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
const MIME={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const DATA=['polls.json','update-status.json','official-2023.json','territory.json','references.json','evaluation.json','polls-example.json'];
const BUNDLED_DATA=['microdata-3577.json','microdata-validation.json'];
export function createNextHandler({packageRoot,storageRoot,origin,searchOverride,updateTtl=120000}){
 const publicUrl=new URL(origin);
 if(publicUrl.origin!==origin||!(publicUrl.protocol==='https:'||(publicUrl.protocol==='http:'&&['localhost','127.0.0.1'].includes(publicUrl.hostname))))throw Error('Origen HTTPS obligatorio, salvo pruebas locales.');
 let initialized,service,microService;
 const headers={'Cache-Control':'no-store','Content-Security-Policy':CSP,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
 const json=(body,status=200,extra={})=>Response.json(body,{status,headers:{...headers,...extra}});
 async function initialize(){
  await mkdir(path.join(storageRoot,'data'),{recursive:true});
  for(const file of DATA)try{await copyFile(path.join(packageRoot,'data',file),path.join(storageRoot,'data',file),constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}
  // Runtime import preserves PDF worker files and avoids bundling them into the route.
  const {createUpdateService}=await import(/* webpackIgnore: true */ pathToFileURL(path.join(packageRoot,'scripts/update-service.mjs')).href);
  service=createUpdateService({root:storageRoot,origin,ttl:updateTtl,...(searchOverride?{search:searchOverride}:{})});
 }
 return async request=>{
  try{
   const url=new URL(request.url);if((request.headers.get('host')||url.host).toLowerCase()!==publicUrl.host.toLowerCase())return json({error:'Host del sitio no permitido.'},403);
   let route;try{route=decodeURIComponent(url.pathname.slice(BASE.length))||'/';}catch{return json({error:'URL inválida.'},400);}
   if(!url.pathname.startsWith(BASE+'/')&&url.pathname!==BASE)return json({error:'Ruta no disponible.'},404);
   if(route==='/api/microdata'){
    if(!['GET','POST'].includes(request.method))return json({error:'Usa GET o POST.'},405);
    if(request.method==='POST'&&request.headers.get('origin')!==origin)return json({error:'Origen no permitido.'},403);
    let text='',bytes=0;const reader=request.body?.getReader();if(reader)while(true){const item=await reader.read();if(item.done)break;bytes+=item.value.length;if(bytes>1024){await reader.cancel();return json({error:'Solicitud demasiado grande.'},413);}text+=new TextDecoder().decode(item.value);}
    let payload;try{payload=text?JSON.parse(text):{};}catch{return json({error:'JSON inválido.'},400);}
    if(!microService){const {createMicrodataService}=await import(/* webpackIgnore: true */ pathToFileURL(path.join(packageRoot,'scripts/microdata-service.mjs')).href);microService=createMicrodataService({root:storageRoot,origin});}
    const result=await microService({method:request.method,origin:request.headers.get('origin'),bytes,payload});return json(result.body,result.status);
   }
   if(route==='/api/update'){
    if(request.method!=='POST')return json({error:'Usa POST.'},405,{Allow:'POST'});
    if(request.headers.get('origin')!==origin)return json({error:'Origen no permitido.'},403);
    if(Number(request.headers.get('content-length')||0)>1024)return json({error:'Solicitud demasiado grande.'},413);
    let bytes=0;const reader=request.body?.getReader();if(reader)while(true){const item=await reader.read();if(item.done)break;bytes+=item.value.length;if(bytes>1024){await reader.cancel();return json({error:'Solicitud demasiado grande.'},413);}}
    initialized??=initialize();await initialized;
    const result=await service({method:'POST',origin:request.headers.get('origin'),bytes});return json(result.body,result.status,result.headers);
   }
   if(!['GET','HEAD'].includes(request.method))return json({error:'Método no permitido.'},405,{Allow:'GET, HEAD'});
   if(route==='/health')return json({app:'observatorio-electoral',version:'3.5.0',sourceSearch:true});
   if(route==='/')route='/index.html';
   if(!/^\/(index\.html|assets\/[a-zA-Z0-9_-]+\.(mjs|css|svg)|data\/[a-zA-Z0-9_-]+\.json)$/.test(route))return json({error:'Archivo no disponible.'},404);
   let root=packageRoot;if(route.startsWith('/data/')&&!BUNDLED_DATA.includes(path.basename(route))){initialized??=initialize();await initialized;root=storageRoot;if(!DATA.includes(path.basename(route)))return json({error:'Datos no disponibles.'},404);}
   let file;try{file=await realpath(path.join(root,route));}catch{return json({error:'Archivo no encontrado.'},404);}
   const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative))return json({error:'Acceso denegado.'},403);
   let bytes=await readFile(file);if(route==='/index.html')bytes=Buffer.from(bytes.toString('utf8').replace('<head>','<head>\n  <base href="'+BASE+'/">'));
   return new Response(request.method==='HEAD'?null:bytes,{headers:{...headers,'Content-Type':MIME[path.extname(file)]}});
  }catch(e){initialized=null;console.error('Observatorio:',e.message);return json({error:'Servicio no disponible. Se conservan los datos anteriores.'},503);}
 };
}
