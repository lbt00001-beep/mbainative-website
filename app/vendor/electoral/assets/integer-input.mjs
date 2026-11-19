// Vote quantities accept plain digits or correctly grouped Spanish thousands.
// A dot is never interpreted as a decimal separator in these integer fields.
export function parseIntegerInput(value,{label='Cantidad',min=0,max=Number.MAX_SAFE_INTEGER}={}){
 const text=String(value).trim();
 if(!text)throw Error(`${label}: introduce un número entero.`);
 if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(text))throw Error(`${label}: usa un entero sin decimales, como 1234 o 1.234.`);
 const number=Number(text.replaceAll('.',''));
 if(!Number.isSafeInteger(number)||number<min||number>max)throw Error(`${label}: introduce un entero entre ${min.toLocaleString('es-ES',{useGrouping:'always'})} y ${max.toLocaleString('es-ES',{useGrouping:'always'})}.`);
 return number;
}
export function readIntegerInput(input,options){
 let number;try{number=parseIntegerInput(input.value,options);}catch(error){input.setAttribute('aria-invalid','true');throw error;}
 input.value=number.toLocaleString('es-ES',{useGrouping:'always',maximumFractionDigits:0});
 input.removeAttribute('aria-invalid');return number;
}
export function bindIntegerInput(input,options){
 input.type='text';input.inputMode='numeric';input.autocomplete='off';input.spellcheck=false;
 const normalize=()=>{try{readIntegerInput(input,options);}catch{input.setAttribute('aria-invalid','true');}};
 input.addEventListener('blur',normalize);
 input.addEventListener('input',()=>input.removeAttribute('aria-invalid'));
 if(input.value.trim())normalize();
}
