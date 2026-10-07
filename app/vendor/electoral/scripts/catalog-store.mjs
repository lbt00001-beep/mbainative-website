import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import lockfile from 'proper-lockfile';
export async function withCatalogLock(root,task){
 const dir=path.join(root,'.run');await mkdir(dir,{recursive:true});
 let release;
 // Atomic mkdir and a heartbeat: an interrupted deployment cannot leave a permanent lock.
 // Every process must use the same stale/update values. Compromised ownership fails closed.
 try{release=await lockfile.lock(path.join(dir,'catalog'),{realpath:false,lockfilePath:path.join(dir,'catalog.lease'),stale:120000,update:10000,retries:0});}catch(e){if(e.code==='ELOCKED')throw Error('Hay otra actualización del catálogo en curso. Reintenta después.');throw e;}
 try{return await task();}finally{await release();}
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
