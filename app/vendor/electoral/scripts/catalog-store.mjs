import {open,mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export async function withCatalogLock(root,task){
 const dir=path.join(root,'.run');await mkdir(dir,{recursive:true});const file=path.join(dir,'catalog.lock');
 let handle;
 try{handle=await open(file,'wx');}catch(e){if(e.code==='EEXIST')throw Error('Hay otra actualización del catálogo en curso. Reintenta después.');throw e;}
 try{await handle.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));await handle.close();return await task();}
 finally{await handle.close().catch(()=>{});await unlink(file).catch(()=>{});}
}
export async function atomicWrite(file,text){
 const temporary=file+'.'+randomUUID()+'.tmp';
 try{await writeFile(temporary,text,{flag:'wx'});await rename(temporary,file);}finally{await unlink(temporary).catch(()=>{});}
}
export async function commitCatalog(root,originalText,candidate,{verify=async()=>{},writer=atomicWrite}={}){
 const file=path.join(root,'data/polls.json');if(await readFile(file,'utf8')!==originalText)throw Error('El catálogo cambió durante la actualización; no se sobrescribe.');
 const backup=path.join(root,'research/automatic','catalog-before-'+Date.now()+'-'+randomUUID()+'.json');await mkdir(path.dirname(backup),{recursive:true});await writeFile(backup,originalText,{flag:'wx'});
 try{await writer(file,JSON.stringify(candidate,null,2)+'\n');await verify();}
 catch(error){if(await readFile(file,'utf8')!==originalText)await atomicWrite(file,originalText);throw error;}
 return backup;
}
