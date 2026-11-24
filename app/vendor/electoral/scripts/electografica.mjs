import {parse} from 'parse5';
import {identifyMethodology} from '../assets/methodology.mjs';
const attrs=n=>Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));
const text=n=>['script','style'].includes(n.nodeName)?'':n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join(' ');
const clean=n=>text(n).replace(/\s+/g,' ').trim();
function find(n,p){if(p(n))return n;for(const c of n.childNodes||[]){const r=find(c,p);if(r)return r;}}
function all(n,p,result=[]){if(p(n))result.push(n);for(const c of n.childNodes||[])all(c,p,result);return result;}
const hasClass=(n,c)=>(attrs(n).class||'').split(/\s+/).includes(c);
const allowedUrl=(value,base)=>{try{const u=new URL(value,base);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port?u:null;}catch{return null;}};

// Blogger's JSON feed is data, never executable JSONP. Only national Congress posts.
export function electograficaLinks(source,base){
 const data=JSON.parse(source);
 return (data.feed?.entry||[]).flatMap(e=>{
  const title=e.title?.$t||'',url=e.link?.find(l=>l.rel==='alternate'&&l.type==='text/html')?.href,u=allowedUrl(url,base);
  return /^ESPAÑA\s*·\s*Elecciones generales\s*·\s*Encuesta\b/i.test(title)&&u?.hostname==='www.electografica.com'?[{title,url:u.href}]:[];
 });
}

export function extractElectografica(html,url,{today,catalog=[],document}){
 document={...document,title:document.title.replace(/&#(?:183|x[bB]7);|&middot;/g,'·')};
 const root=find(parse(html),n=>attrs(n).id==='grafico-root');
 if(!root||!/^ESPAÑA\s*·\s*Elecciones generales\s*·\s*Encuesta\b/i.test(document.title))return {status:'context',reason:'Electográfica: solo se descubren encuestas nacionales del Congreso.',document};
 const source=all(root,n=>n.nodeName==='a').find(n=>/Fuente\s*:/i.test(clean(n.parentNode)));
 const original=allowedUrl(attrs(source||{}).href,url);
 // CIS is handled by its dedicated official-document adapter, not the press reader.
 const d={...document,discoveryOriginals:original&&original.hostname!=='www.cis.es'?[{title:document.title,url:original.href}]:[]};
 // Other houses are discovered here and read at their original publisher.
 if(!/^ESPAÑA\s*·\s*Elecciones generales\s*·\s*Encuesta GESOP\s+\d/i.test(document.title))return {status:'landing',reason:'Fuente secundaria: se busca el original enlazado, sin contar Electográfica como instituto.',document:d};
 if(original?.hostname!=='www.elperiodico.com')return {status:'pending',reason:'GESOP: falta la publicación original de El Periódico.',document:d};
 const field=find(root,n=>hasClass(n,'ficha-grid')),fields={};
 for(const row of field?.childNodes||[]){const label=find(row,n=>hasClass(n,'field-label')),value=find(row,n=>hasClass(n,'field-value'));if(label&&value)fields[clean(label)]=clean(value);}
 const dates=fields['Fecha realización']?.match(/^(\d{1,2})-(\d{1,2})\/(\d{2})\/(\d{4})$/),publication=clean(find(root,n=>n.nodeName==='header')||root).match(/Encuesta GESOP · (\d{2})\/(\d{2})\/(\d{4})/);
 if(fields.Encuestadora!=='GESOP'||fields.Cliente!=='Prensa Ibérica'||!dates||!publication||!/^Telefónico$/i.test(fields.Método))return {status:'pending',reason:'GESOP: ficha o fecha no reconocida en la fuente secundaria.',document:d};
 const publishedAt=publication[3]+'-'+publication[2]+'-'+publication[1],prefix=dates[4]+'-'+dates[3]+'-',fieldworkStart=prefix+dates[1].padStart(2,'0'),fieldworkEnd=prefix+dates[2].padStart(2,'0');
 if([publishedAt,fieldworkStart,fieldworkEnd].some(x=>!Number.isFinite(Date.parse(x))||new Date(x).toISOString().slice(0,10)!==x)||fieldworkStart>fieldworkEnd||fieldworkEnd>publishedAt||publishedAt>today)return {status:'pending',reason:'GESOP: fechas incompatibles.',document:d};
 if((Date.parse(today)-Date.parse(fieldworkEnd))/86400000>60)return {status:'old',reason:'GESOP fuera de la ventana de 60 días.',document:d};
 const sample=Number(fields.Muestra?.match(/^([\d.]+) entrevistas$/)?.[1].replaceAll('.',''));
 if(!Number.isInteger(sample)||sample<1||sample>1000000)return {status:'pending',reason:'GESOP: muestra desconocida.',document:d};
 const panel=find(root,n=>attrs(n).id==='p1t-a'),ids={PP:'pp',PSOE:'psoe',VOX:'vox',FA:'sumar',ERC:'erc',SALF:'salf',JUNTS:'junts',PODEMOS:'podemos'},values={},evidence={};
 for(const row of panel?.childNodes||[]){
  const logo=find(row,n=>n.nodeName==='img'&&Object.hasOwn(ids,attrs(n).alt)),bars=all(row,n=>hasClass(n,'bar-fill-anim'));
  if(!logo)continue;
  const id=ids[attrs(logo).alt],number=bars.length===1?Number(attrs(bars[0])['data-w']):NaN;
  if(Object.hasOwn(values,id)||!Number.isFinite(number)||number<0||number>100)return {status:'pending',reason:'GESOP: barras actuales ambiguas o duplicadas.',document:d};
  values[id]=number;evidence[id]=attrs(logo).alt+' · barra actual data-w='+number;
 }
 if(!['pp','psoe','vox','sumar'].every(id=>Number.isFinite(values[id]))||values.pp<10||values.psoe<10||Object.values(values).reduce((s,v)=>s+v,0)>100.11)return {status:'pending',reason:'GESOP: vector nacional incompleto o inválido.',document:d};
 const previous=catalog.find(p=>p.institute==='GESOP'&&(p.fieldworkEnd===fieldworkEnd||p.publishedAt===publishedAt));
 if(previous){const mismatches=Object.entries(values).filter(([id,v])=>Object.hasOwn(previous.values,id)&&Math.abs(previous.values[id]-v)>.051);return {status:mismatches.length?'pending':'known',verification:mismatches.length?undefined:'partial',reason:mismatches.length?'GESOP: discrepancia con la ola ya conservada; revisión necesaria.':'Misma ola GESOP ya incorporada; la fuente secundaria no suma otra encuesta.',original:previous.url,document:d};}
 const note='Fuente secundaria explícita: Electográfica, que enlaza la publicación de GESOP / Prensa Ibérica en El Periódico. Lectura de barras actuales; no de 2023 ni de escaños. PP incluye UPN-PP, sin desglose UPN independiente; Frente Amplio incluye Compromís:FV y UPC y se armoniza con el espacio Sumar. No se inventan porcentajes ausentes ni datos provinciales. Denominador no explícito: se asume voto válido con reducción de peso.';
 return {status:'extracted',poll:{id:'gesop-'+fieldworkEnd.replaceAll('-',''),institute:'GESOP',publishedAt,fieldworkStart,fieldworkEnd,sample,values,denominator:'unspecified',verified:true,measure:'voteEstimate',url,originalUrl:original.href,sourceType:'secondary',retrievedAt:today,note,methodology:identifyMethodology('Entrevistas telefónicas. '+clean(field),url)},evidence,document:d};
}
