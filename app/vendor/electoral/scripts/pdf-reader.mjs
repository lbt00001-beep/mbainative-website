import {Worker} from 'node:worker_threads';
export function readPdf(file,{timeout=30000}={}){
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./pdf-worker.mjs',import.meta.url),{workerData:{file},execArgv:[],resourceLimits:{maxOldGenerationSizeMb:256}});
  let done=false;const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);worker.terminate();error?reject(error):resolve(result);};
  const timer=setTimeout(()=>finish(Error('Extracción PDF agotó el tiempo.')),timeout);
  worker.once('message',r=>finish(r.error?Error(r.error):null,r));worker.once('error',e=>finish(e));worker.once('exit',code=>{if(!done)finish(Error('El lector PDF terminó sin resultados: '+code));});
 });
}
