import test from 'node:test';
import assert from 'node:assert/strict';
import {completionBody,completionText,consultAI} from '../assets/ai-client.mjs';
test('IA: límite suficiente, capacidades y texto vacío no tratado como éxito',()=>{
 assert.equal(completionBody({model:'x',question:'q',context:{}}).max_tokens,4096);
 assert.equal(completionBody({model:'x',metadata:{reasoning:{supported_efforts:['low','high']},top_provider:{max_completion_tokens:2048}}}).reasoning.effort,'low');
 assert.throws(()=>completionText({choices:[{message:{content:''},finish_reason:'length'}]}),/agotó/);
 assert.throws(()=>completionText({choices:[{message:{content:'   '}}]}),/no devolvió/);
 assert.deepEqual(completionText({choices:[{message:{content:[{type:'text',text:'Hola'}]},finish_reason:'length'}]}),{text:'Hola',truncated:true});
});
test('IA: errores de saldo, proveedor y formato son visibles sin exponer la clave',async()=>{
 const args={key:'private-key',model:'x',question:'q',context:{}};
 await assert.rejects(consultAI({...args,fetchImpl:async()=>({ok:false,status:402,json:async()=>({})})}),/saldo/);
 await assert.rejects(consultAI({...args,fetchImpl:async()=>({ok:false,status:400,json:async()=>({error:{message:'private-key sk-or-secret'}})})}),e=>!e.message.includes('private-key')&&!e.message.includes('sk-or-secret'));
 await assert.rejects(consultAI({...args,fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:''}}]})})}),/no devolvió/);
 const response=await consultAI({...args,fetchImpl:async(url,opts)=>{assert.equal(JSON.parse(opts.body).max_tokens,4096);return {ok:true,json:async()=>({choices:[{message:{content:'Respuesta'}}]})};}});
 assert.equal(response.text,'Respuesta');
});
