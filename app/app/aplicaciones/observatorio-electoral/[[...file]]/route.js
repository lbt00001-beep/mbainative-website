import path from 'node:path';
import {pathToFileURL} from 'node:url';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=240;
const origin=process.env.ELECTORAL_PUBLIC_ORIGIN||'https://mbainative.com';
let pending;
async function handler(request){
 const packageRoot=path.join(process.cwd(),'vendor/electoral');
 const storageRoot=process.env.ELECTORAL_DATA_DIR;
 if(!storageRoot)return Response.json({error:'El almacenamiento persistente no está configurado.'},{status:503});
 pending??=import(/* webpackIgnore: true */ pathToFileURL(path.join(packageRoot,'deployment/next-handler.mjs')).href).then(({createNextHandler})=>createNextHandler({packageRoot,storageRoot,origin,updateTtl:900000}));
 return (await pending)(request);
}
export const GET=handler;
export const HEAD=handler;
export const POST=handler;
