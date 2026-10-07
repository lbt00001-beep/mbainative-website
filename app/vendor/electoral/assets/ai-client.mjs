const ENDPOINT='https://openrouter.ai/api/v1/chat/completions';
export function completionBody({model,question,context,maxTokens=4096,metadata={}}){
 if(!Number.isInteger(maxTokens)||maxTokens<512||maxTokens>16384)throw Error('El límite de respuesta debe ser un entero entre 512 y 16.384 tokens.');
 const providerMax=metadata.top_provider?.max_completion_tokens;
 const body={model,max_tokens:Number.isInteger(providerMax)&&providerMax>0?Math.min(maxTokens,providerMax):maxTokens,messages:[{role:'system',content:'Explica en español, nivel bachillerato, el escenario electoral adjunto. Usa solo los datos del contexto. Distingue datos oficiales, supuestos y resultados. No inventes encuestas, enlaces ni probabilidades, no afirmes acuerdos de investidura y no recomiendes un voto personalizado. Las simulaciones son sensibilidad no calibrada. Responde con claridad en dos o tres párrafos.'},{role:'user',content:JSON.stringify(context)+'\nPregunta: '+question}]};
 const efforts=metadata.reasoning?.supported_efforts;
 if(metadata.reasoning||metadata.supported_parameters?.includes('reasoning')){
  const effort=['minimal','low','medium','high'].find(value=>!Array.isArray(efforts)||efforts.includes(value));
  body.reasoning={exclude:true,...(effort?{effort}:{})};
 }
 return body;
}
export function completionText(data){
 const choice=data?.choices?.[0],content=choice?.message?.content;
 const text=typeof content==='string'?content:Array.isArray(content)?content.filter(part=>part.type==='text').map(part=>typeof part.text==='string'?part.text:part.text?.value||'').join('\n'):'';
 if(!text.trim()){
  if(choice?.finish_reason==='length')throw Error('El modelo agotó el límite de tokens sin devolver una explicación. El razonamiento también consume ese límite. Auméntalo o elige un modelo con menos razonamiento; una nueva consulta puede consumir saldo.');
  if(choice?.finish_reason==='content_filter')throw Error('El proveedor bloqueó la respuesta. Reformula la pregunta o elige otro modelo.');
  throw Error('OpenRouter no devolvió texto de respuesta. No se presenta como una consulta completada; puedes volver a consultar o elegir otro modelo.');
 }
 return {text:text.trim(),truncated:choice.finish_reason==='length'};
}
export async function consultAI({key,signal,fetchImpl=fetch,...options}){
 let response;
 try{response=await fetchImpl(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify(completionBody(options)),signal});}catch(error){
  if(signal?.aborted)throw Error(signal.reason?.name==='TimeoutError'?'La consulta superó dos minutos. El proveedor puede haber consumido saldo aunque no se recibiera la respuesta.':'Consulta cancelada. El proveedor puede haber consumido saldo.');
  throw Error('No se pudo conectar con OpenRouter. Comprueba la conexión y vuelve a consultar.');
 }
 let data;try{data=await response.json();}catch{throw Error('El proveedor devolvió una respuesta que no se pudo leer.');}
 if(!response.ok||data.error){
  const code=Number(data.error?.code)||response.status;
  const messages={401:'OpenRouter no acepta esta clave. Revisa que esté completa y activa.',402:'La cuenta no dispone de saldo suficiente para este modelo o para el límite de tokens elegido.',429:'OpenRouter ha limitado temporalmente las consultas. Espera y vuelve a intentarlo.',503:'El modelo no está disponible en este momento. Prueba otro modelo.'};
  const detail=String(data.error?.message||'').split(key).join('[clave oculta]').replace(/sk-or-[\w-]+/g,'[clave oculta]').slice(0,300);
  throw Error(messages[code]||`OpenRouter respondió ${code}. ${detail||'Revisa el modelo y los parámetros.'}`);
 }
 return completionText(data);
}
