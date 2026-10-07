import {searchSources} from './search-sources.mjs';
export function createUpdateService({root,origin,ttl=120000,retryDelay=30000,search=searchSources,now=Date.now}){
 let running=null,cached=null,failedAt=null;
 return async request=>{
  if(request.method!=='POST')return {status:405,headers:{Allow:'POST'},body:{error:'Usa POST.'}};
  if(request.origin!==origin)return {status:403,body:{error:'Origen no permitido.'}};
  if(request.bytes>1024)return {status:413,body:{error:'Solicitud demasiado grande.'}};
  if(cached&&now()-cached.at<ttl)return {status:200,body:{...cached.data,cached:true}};
  if(failedAt!==null&&now()-failedAt<retryDelay)return {status:503,headers:{'Retry-After':String(Math.ceil(retryDelay/1000))},body:{error:'La última consulta no pudo completarse. Se conservan los datos anteriores; reintenta después.'}};
  running??=Promise.resolve().then(()=>search({root})).then(data=>{cached={at:now(),data};failedAt=null;return data;}).catch(e=>{failedAt=now();console.error('Actualización electoral:',e.message);throw e;}).finally(()=>{running=null;});
  try{return {status:200,body:await running};}catch{return {status:503,body:{error:'No se ha completado la actualización. Los datos anteriores se conservan; consulta el registro del servicio.'}};}
 };
}
