import test from 'node:test';
import assert from 'node:assert/strict';
import {parseIntegerInput,readIntegerInput} from '../assets/integer-input.mjs';
test('Cantidades: puntos de miles y dígitos producen el mismo entero exacto',()=>{
 for(const [text,value]of [['1234',1234],['1.234',1234],['1.234.567',1234567],[' 1.000 ',1000],['0',0],['0001',1]])assert.equal(parseIntegerInput(text),value);
});
test('Cantidades: no aceptar decimales, grupos rotos, signos o notación exponencial',()=>{
 for(const text of ['', '1,5','12.5','12.34','1.23.456','1234.567','1..000','-1','+1','1e3','Infinity','1 000'])assert.throws(()=>parseIntegerInput(text),undefined,text);
 assert.throws(()=>parseIntegerInput('9.007.199.254.740.993'));
 assert.equal(parseIntegerInput('100.000.000',{max:100000000}),100000000);
 assert.throws(()=>parseIntegerInput('100.000.001',{max:100000000}));
 assert.throws(()=>parseIntegerInput('511',{min:512,max:16384}));
});
test('Leer un campo normaliza su presentación sin modificar el entero ni ocultar errores',()=>{
 const input={value:'1234',invalid:false,removeAttribute(){this.invalid=false;},setAttribute(){this.invalid=true;}};assert.equal(readIntegerInput(input),1234);assert.equal(input.value,'1.234');
 input.value='1.234';assert.equal(readIntegerInput(input),1234);
 input.value='1,5';assert.throws(()=>readIntegerInput(input));assert.equal(input.value,'1,5');assert.equal(input.invalid,true);
 input.value='1.000';assert.equal(readIntegerInput(input),1000);assert.equal(input.invalid,false);
});
