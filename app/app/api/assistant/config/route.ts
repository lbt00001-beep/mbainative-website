import guides from '@/data/assistant-guides.json';
import { speechVoices } from '@/lib/assistant-speech';
type Chapter={title:string;match:string;selector:string;tag?:string;segments:string[]};
export function GET(request:Request){
  let path=new URL(request.url).searchParams.get('path')||'/';
  if(path.length>1)path=path.replace(/\/$/,'');
  if(['/evolucion','/benchmarks-ia','/plan-de-marketing'].includes(path))path+='/index.html';
  if(!Object.hasOwn(guides.pages,path))return Response.json({error:'Esta página no tiene un recorrido disponible.'},{status:404,headers:{'Cache-Control':'no-store'}});
  const chapters=(guides.pages as Record<string,Chapter[]>)[path];
  const segments=guides.segments as Record<string,string>;
  return Response.json({chapters:chapters.map(c=>({...c,chunks:c.segments.map(id=>({id,text:segments[id]}))})),voices:speechVoices().map(({id,label})=>({id,label})),updatedAt:guides.updatedAt},{headers:{'Cache-Control':'no-store'}});
}
