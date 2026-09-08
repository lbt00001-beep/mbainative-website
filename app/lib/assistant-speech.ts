import { createHash } from 'node:crypto';
import { escapeHtml, RequestError } from './security';

export type SpeechVoice={id:string;label:string;provider:'azure'|'google';name:string};
export function speechVoices():SpeechVoice[]{
  const result:SpeechVoice[]=[];
  if(process.env.AZURE_SPEECH_KEY&&/^[a-z0-9-]{2,50}$/.test(process.env.AZURE_SPEECH_REGION||''))result.push(
    {id:'azure-elvira',label:'Microsoft Azure · Elvira Neural',provider:'azure',name:'es-ES-ElviraNeural'},
    {id:'azure-alvaro',label:'Microsoft Azure · Álvaro Neural',provider:'azure',name:'es-ES-AlvaroNeural'});
  if(process.env.GOOGLE_TTS_API_KEY)result.push(
    {id:'google-kore',label:'Google Cloud · Kore HD',provider:'google',name:'es-ES-Chirp3-HD-Kore'},
    {id:'google-charon',label:'Google Cloud · Charon HD',provider:'google',name:'es-ES-Chirp3-HD-Charon'});
  return result;
}

export function createSpeechService(transport:typeof fetch=fetch,now=Date.now){
  const cache=new Map<string,Buffer>();const pending=new Map<string,Promise<Buffer>>();let cacheBytes=0;
  let day=-1;let characters=0;let minute=-1;let calls=0;
  return async(text:string,voice:SpeechVoice):Promise<Buffer>=>{
    const key=createHash('sha256').update(voice.id+'\n'+text).digest('hex');
    const cached=cache.get(key);if(cached){cache.delete(key);cache.set(key,cached);return cached;}
    const running=pending.get(key);if(running)return running;
    const today=Math.floor(now()/86_400_000);const currentMinute=Math.floor(now()/60_000);
    if(day!==today){day=today;characters=0;}if(minute!==currentMinute){minute=currentMinute;calls=0;}
    const configured=Number(process.env.ASSISTANT_DAILY_CHAR_LIMIT||100000);
    const limit=Number.isFinite(configured)?Math.max(0,configured):100000;
    if(characters+text.length>limit||calls>=40||pending.size>=4)throw new RequestError('La voz profesional ha alcanzado su límite temporal. Puedes elegir una voz del navegador.',429,60);
    characters+=text.length;calls++;
    const promise=(async()=>{
      let response:Response;
      try{
        if(voice.provider==='azure'){
          response=await transport(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,{
            method:'POST',headers:{'Ocp-Apim-Subscription-Key':process.env.AZURE_SPEECH_KEY||'','Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3'},
            body:`<speak version="1.0" xml:lang="es-ES"><voice name="${voice.name}">${escapeHtml(text)}</voice></speak>`,signal:AbortSignal.timeout(20000),
          });
        }else{
          response=await transport('https://texttospeech.googleapis.com/v1/text:synthesize',{
            method:'POST',headers:{'X-Goog-Api-Key':process.env.GOOGLE_TTS_API_KEY||'','Content-Type':'application/json'},
            body:JSON.stringify({input:{text},voice:{languageCode:'es-ES',name:voice.name},audioConfig:{audioEncoding:'MP3'}}),signal:AbortSignal.timeout(20000),
          });
        }
        if(!response.ok)throw new Error('provider');
        // Speech fragments are bounded; reject unexpectedly large provider responses before buffering.
        const reader=response.body?.getReader();if(!reader)throw Error('empty');const parts:Uint8Array[]=[];let size=0;
        try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000){await reader.cancel();throw Error('large');}parts.push(value);}}finally{reader.releaseLock();}
        let audio=Buffer.concat(parts);
        if(voice.provider==='google'){const content=JSON.parse(audio.toString()).audioContent;if(typeof content!=='string'||!content)throw Error('invalid');audio=Buffer.from(content,'base64');}
        else if(!response.headers.get('content-type')?.startsWith('audio/'))throw Error('invalid');
        if(audio.length<16)throw Error('empty');
        while(cacheBytes+audio.length>24_000_000&&cache.size){const oldest=cache.keys().next().value!;cacheBytes-=cache.get(oldest)!.length;cache.delete(oldest);}
        cache.set(key,audio);cacheBytes+=audio.length;return audio;
      }catch{throw new RequestError('No se pudo obtener la voz profesional. Reintenta o selecciona una voz del navegador.',503);}
    })();
    pending.set(key,promise);try{return await promise;}finally{pending.delete(key);}
  };
}
export const synthesizeSpeech=createSpeechService();
