import guides from '@/data/assistant-guides.json';
import { checkOrigin, jsonError, readJson, RequestError } from '@/lib/security';
import { speechVoices, synthesizeSpeech } from '@/lib/assistant-speech';
export const runtime='nodejs';
export async function POST(request:Request){
  try{
    checkOrigin(request);const body=await readJson(request,2048);
    if(typeof body.id!=='string'||!Object.hasOwn(guides.segments,body.id))throw new RequestError('Fragmento de guía no disponible.',404);
    if(Object.keys(body).some(key=>!['id','voice'].includes(key)))throw new RequestError('Solo se admite la narración editorial de esta web.');
    const voice=speechVoices().find(v=>v.id===body.voice);if(!voice)throw new RequestError('Esta voz profesional no está configurada.',503);
    const text=(guides.segments as Record<string,string>)[body.id];
    const audio=await synthesizeSpeech(text,voice);
    return new Response(new Uint8Array(audio),{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }catch(error){return jsonError(error);}
}
