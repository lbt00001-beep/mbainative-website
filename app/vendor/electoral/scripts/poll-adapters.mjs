import {parse} from 'parse5';
import {identifyMethodology} from '../assets/methodology.mjs';

export const ADAPTER_VERSION='1.0';
export const houses={
 'www.gad3.com':{institute:'GAD3',owned:true,identity:/GAD3/i},
 'www.sigmados.com':{institute:'Sigma Dos',owned:true,identity:/Sigma\s*Dos/i},
 'electomania.es':{institute:'ElectoPanel',owned:true,identity:/ElectoPanel/i},
 'moreincommon.es':{institute:'More in Common',owned:true,identity:/More in Common|Nuestro modelo/i},
 'www.eldiario.es':{institute:'Ateneo del Dato',identity:/Ateneo del Dato/i},
 'www.elespanol.com':{institute:'SocioMétrica',identity:/SocioM[eé]trica/i},
 'www.20minutos.es':{institute:'DYM',identity:/\bDYM\b/i},
 'www.eldebate.com':{institute:'Target Point',identity:/Target Point/i},
 'www.vozpopuli.com':{institute:'Hamalgama Métrica',identity:/Hamalgama/i},
 'okdiario.com':{institute:'Data10',identity:/Data\s*10/i},
 'www.lasexta.com':{institute:'InvyMark',identity:/InvyMark|bar[oó]metro.{0,30}laSexta/i},
 'www.ondacero.es':{institute:'Celeste-Tel',identity:/Celeste[ -]?Tel/i},
 'www.larazon.es':{institute:'NC Report',identity:/NC[ -]?Report/i},
 'www.articulo14.es':{institute:'Winston',identity:/Winston/i}
};
const aliases={pp:'Partido Popular|\\bPP\\b|Feij[oó]o|los populares',psoe:'Partido Socialista|\\bPSOE\\b|los socialistas',vox:'\\bVox\\b|partido de (?:Santiago )?Abascal',sumar:'\\bSumar\\b|Frente Amplio',podemos:'\\bPodemos\\b',salf:'Se Acab[oó] la Fiesta|\\bSALF\\b',erc:'\\bERC\\b|Esquerra Republicana',bildu:'EH Bildu|\\bBildu\\b',pnv:'EAJ[ -]PNV|\\bPNV\\b',junts:'\\bJunts\\b',bng:'\\bBNG\\b',cc:'Coalici[oó]n Canaria|\\bCCa?\\b',upn:'\\bUPN\\b',ac:'Alian[çz]a Catalana|\\bAC\\b',aa:'Adelante Andaluc[ií]a'};
const number=s=>Number(s.replace(/\./g,'').replace(',','.'));
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
export const canonical=u=>{const x=new URL(u);x.hash='';for(const k of [...x.searchParams.keys()])if(/^utm_|^fbclid$|^gclid$/.test(k))x.searchParams.delete(k);return x.href.replace(/\/$/,'');};
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
function text(n){
 if(['script','style','nav','header','footer','aside'].includes(n.nodeName))return '';
 if(n.nodeName==='#text')return n.value;
 return (n.childNodes||[]).map(text).join(['p','div','tr','td','th','li','h1','h2','h3','section'].includes(n.nodeName)?' ':'');
}
export function articleDocument(html,url){
 const root=parse(html),metadata=[],contents=[],tables=[],outlinks=[],times=[],headlines=[];
 const walk=n=>{
  const attrs=Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));
  if(n.nodeName==='script'&&attrs.type==='application/ld+json')try{
   const object=JSON.parse((n.childNodes||[]).map(c=>c.value||'').join(''));
   const visit=o=>{if(!o||typeof o!=='object')return;if(o.articleBody&&o.headline||/Article|BlogPosting|NewsArticle/.test([o['@type']].flat().join(' ')))metadata.push(o);for(const v of Object.values(o))if(v&&typeof v==='object')visit(v);};visit(object);
  }catch{}
  if(n.nodeName==='time'&&attrs.datetime)times.push(attrs.datetime);
  if(n.nodeName==='time'&&!attrs.datetime){const date=clean(text(n)).match(/(\d{1,2})\s+(\w+),?\s+(\d{4})/);if(date&&months[date[2].toLowerCase()])times.push(`${date[3]}-${String(months[date[2].toLowerCase()]).padStart(2,'0')}-${date[1].padStart(2,'0')}`);}
  if(n.nodeName==='time'&&!attrs.datetime){const date=clean(text(n)).match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);if(date)times.push(`${date[3].length===2?'20'+date[3]:date[3]}-${date[2]}-${date[1]}`);}
  if(n.nodeName==='meta'&&attrs.property==='article:published_time')times.push(attrs.content);
  if(n.nodeName==='h1')headlines.push(clean(text(n)));
  if(/(?:^| )(?:entry-content|content-inner|article-body|article-content|post-content|article__content|elementor-widget-theme-post-content)(?: |$)/.test(attrs.class||'')||attrs.itemprop==='articleBody')contents.push(clean(text(n)));
  if(n.nodeName==='table'){
   const rows=[];const rowwalk=x=>{if(x.nodeName==='tr')rows.push((x.childNodes||[]).filter(c=>['td','th'].includes(c.nodeName)).map(c=>clean(text(c))));else for(const c of x.childNodes||[])rowwalk(c);};rowwalk(n);tables.push(rows);
  }
  if(n.nodeName==='a'&&attrs.href)try{const u=new URL(attrs.href,url);if(u.protocol==='https:')outlinks.push({url:u.href,title:clean(text(n))});}catch{}
  for(const c of n.childNodes||[])walk(c);
 };walk(root);
 const same=m=>{try{return canonical(m.url||m.mainEntityOfPage?.['@id']||m['@id']?.split('#')[0]||url)===canonical(url);}catch{return false;}};
 const candidates=metadata.filter(same),m=candidates.find(m=>m.articleBody)||metadata.find(m=>m.articleBody&&clean(m.headline)===headlines[0])||candidates[0]||{};
 return {title:clean(m.headline||headlines[0]),publishedAt:(m.datePublished||times[0]||'').slice(0,10),text:clean(m.articleBody||contents.sort((a,b)=>b.length-a.length)[0]||''),tables,links:outlinks,canonicalUrl:m.url||url};
}
export function extractVoteValues(text){
 const observations={},evidence={};
 for(const [id,pattern] of Object.entries(aliases)){
  const rows=[];
  for(const match of text.matchAll(new RegExp(pattern,'gi'))){
   if(/(?:PP|Vox|PSOE|Podemos|Sumar)\s*(?:y|junto a|,)\s*$/i.test(text.slice(Math.max(0,match.index-30),match.index)))continue;
   if(/votantes\s+(?:del?|a(?:l)?)\s*$/i.test(text.slice(Math.max(0,match.index-30),match.index)))continue;
   const after=text.slice(match.index+match[0].length,match.index+match[0].length+180);
   for(const pct of after.matchAll(/(?<![\d.,+−-])(\d{1,2}(?:[,.]\d{1,2})?)\s*%/g)){
    const between=after.slice(0,pct.index),context=text.slice(Math.max(0,match.index-70),match.index+match[0].length+pct.index+pct[0].length+30);
    if(Object.entries(aliases).some(([other,re])=>other!==id&&new RegExp(re,'i').test(between)))break;
    // Never treat recall, vote transfers, leader approval or previous results as current intention.
    if(/fidelidad|transferencia|preferido|aprueba|aprobaci[oó]n|suspende|confianza|nota media|\bjuntos\b|bloque.{0,30}(?:concentra|suma)|Entre ambos/i.test(between))continue;
    if(/actuales\s*\(\s*$|en 2023\s*\(?\s*$/i.test(between)||/\ben 2023\b/i.test(after.slice(pct.index+pct[0].length,pct.index+pct[0].length+12)))continue;
    if(/\b(?:en 2023|23J|en julio|en agosto|actuales|anteriores|anterior sondeo)\b/i.test(between)&&!/(?:hasta|ahora|hoy|quedar[ií]a|obtendr[ií]a)/i.test(between))continue;
    const beforePct=between.slice(-50);
    if(/(?:del|desde|pasar del|de)\s*$/.test(beforePct)&&/(?:al|a)\s*(?:un\s*)?\d+(?:[,.]\d+)?\s*%/.test(after.slice(pct.index+pct[0].length)))continue;
    const value=Number(pct[1].replace(',','.'));if(value>60)continue;
    const current=/(?:votos?|sufragios|papeletas|apoyos|respaldo|obtendr[ií]a|conseguir[ií]a|quedar[ií]a|hasta|ahora|hoy|al |con el|en el)/i.test(between+after.slice(pct.index+pct[0].length,pct.index+pct[0].length+35));
    if(!current)continue;
    rows.push({value,index:match.index,evidence:clean(context)});break;
   }
  }
  if(rows.length){rows.sort((a,b)=>a.index-b.index);observations[id]=rows[0].value;evidence[id]=rows[0].evidence;}
 }
 return {values:observations,evidence};
}
const months=Object.fromEntries('enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' ').map((m,i)=>[m,i+1]));
export function technicalMetadata(text,publishedAt){
 const sampleMatch=text.match(/(?:tama[ñn]o(?:s)? (?:de la muestra|muestral(?:es)?)\s*[:.]?\s*|[Mm]uestra:\s*|[Ss]e (?:han )?(?:realizado|realizaron)\s*|(?:con|a partir de)\s*)([\d.]+)\s*(?:entrevistas|encuestas|cuestionarios|encuestados)/i);
 const sample=sampleMatch?number(sampleMatch[1]):null;
 const numeric=text.match(/(?:campo|realizaci[oó]n)[\s\S]{0,35}?(?:del\s*)?(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(?:al|a|[-–])\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
 const named=text.match(/(?:campo|realizaci[oó]n)[\s\S]{0,45}?(?:del\s*)?(\d{1,2})\s*(?:al|a|[-–])\s*(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
 const expanded=text.match(/(?:campo|realizaci[oó]n)[\s\S]{0,45}?(\d{1,2})\s+(?:de\s+)?(\w+)\s+(?:al|a)\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
 let fieldworkStart=null,fieldworkEnd=null;
 if(numeric){fieldworkStart=`${numeric[3]}-${numeric[2].padStart(2,'0')}-${numeric[1].padStart(2,'0')}`;fieldworkEnd=`${numeric[6]}-${numeric[5].padStart(2,'0')}-${numeric[4].padStart(2,'0')}`;}
 else if(named&&months[named[3].toLowerCase()]){const prefix=`${named[4]}-${String(months[named[3].toLowerCase()]).padStart(2,'0')}-`;fieldworkStart=prefix+named[1].padStart(2,'0');fieldworkEnd=prefix+named[2].padStart(2,'0');}
 else if(expanded&&months[expanded[2].toLowerCase()]&&months[expanded[4].toLowerCase()]){fieldworkStart=`${expanded[5]}-${String(months[expanded[2].toLowerCase()]).padStart(2,'0')}-${expanded[1].padStart(2,'0')}`;fieldworkEnd=`${expanded[5]}-${String(months[expanded[4].toLowerCase()]).padStart(2,'0')}-${expanded[3].padStart(2,'0')}`;}
 if(fieldworkStart&&(!validDate(fieldworkStart)||!validDate(fieldworkEnd)||fieldworkStart>fieldworkEnd||fieldworkEnd>publishedAt))throw Error('Fechas de campo incompatibles con publicación.');
 return {sample:sample&&sample<=1000000?sample:null,fieldworkStart,fieldworkEnd,denominator:/voto(?:s)? v[aá]lido(?:s)?/i.test(text)?'validVotes':'unspecified'};
}
export function extractArticle(html,url,{today,catalog=[]}={}){
 const config=houses[new URL(url).hostname];if(!config)return {status:'unsupported',reason:'Sin adaptador para este dominio.'};
 const d=articleDocument(html,url),body=d.text;
 if(!body)return {status:'landing',reason:'Página de navegación o sin artículo legible.',document:d};
 const multiple=[/GAD3/i,/Sigma Dos/i,/40dB/i,/DYM/i,/SocioM[eé]trica/i,/Ateneo del Dato/i,/InvyMark/i,/Hamalgama/i,/NC[ -]?Report/i,/Winston/i,/Celeste[ -]?Tel/i,/Data10/i].filter(re=>re.test(body)).length;
 if(multiple>=3||/gu[ií]a de las elecciones|pueden las encuestas|confianza.{0,40}voto por correo|(?:lo|esto) dicen (?:las )?[uú]ltimas encuestas|qui[eé]n ganar[aá].{0,60}(?:encuestas|sondeos)/i.test(d.title))return {status:'context',reason:'Guía, agregado o pregunta no electoral; no es una encuesta independiente.',document:d};
 if(!config.identity.test(body))return {status:'context',reason:'No identifica un estudio original del instituto correspondiente.',document:d};
 if(!validDate(d.publishedAt))return {status:'pending',reason:'Publicación sin fecha inequívoca.',document:d};
 if(d.publishedAt>today)return {status:'rejected',reason:'Publicación futura.',document:d};
 if((Date.parse(today)-Date.parse(d.publishedAt))/86400000>60&&!catalog.some(p=>canonical(p.url)===canonical(url)))return {status:'old',reason:'Publicación anterior a la ventana de 60 días; no entra en la estimación actual.',document:d};
 if(!/elecciones generales|Congreso|voto nacional|\bEspaña\b/i.test(body+' '+d.title)&&!catalog.some(p=>canonical(p.url)===canonical(url)))return {status:'context',reason:'No acredita el ámbito electoral nacional.',document:d};
 if(/auton[oó]mico|junta general|asamblea de Ceuta|alcald[ií]a/i.test(d.title))return {status:'context',reason:'Encuesta de otro ámbito.',document:d};
 const extracted=extractVoteValues(body),meta=technicalMetadata(body,d.publishedAt);
 if(config.institute==='ElectoPanel'){
  for(const rows of d.tables)if(rows.some(r=>r.includes('Voto (%)'))){
   const values={},evidence={};let compromís=0;
   for(const row of rows){const value=row.find(v=>/^\d+(?:,\d+)?%$/.test(v));if(!value)continue;const label=row[0],v=Number(value.replace('%','').replace(',','.'));
    if(/Comprom[ií]s/i.test(label)){compromís=v;continue;}
    const id=Object.keys(aliases).find(id=>new RegExp('^(?:'+aliases[id]+')$','i').test(label));if(id){values[id]=v;evidence[id]=row.join(' | ');}
   }
   if(Object.keys(values).length>=4){if(compromís&&values.sumar!=null){values.sumar=Math.round((values.sumar+compromís)*100)/100;evidence.sumar+=' + Compromís '+compromís+' (armonización explícita del espacio 2023)';}extracted.values=values;extracted.evidence=evidence;break;}
  }
 }
 const core=['pp','psoe','vox','sumar'];
 const original=catalog.find(p=>canonical(p.url)===canonical(url));
 if(original){
  const mismatches=Object.entries(extracted.values).filter(([id,v])=>Object.hasOwn(original.values,id)&&Math.abs(original.values[id]-v)>.051);
  if(mismatches.length)return {status:'pending',reason:'El lector encuentra cifras ambiguas o diferentes de las revisadas: '+mismatches.map(([id,v])=>id+' '+v).join(', ')+'. Se conserva el original.',document:d};
  const matched=Object.keys(original.values).filter(id=>extracted.values[id]!=null);
  const full=core.every(id=>matched.includes(id))&&matched.length===Object.keys(original.values).length&&original.sample&&meta.sample===original.sample&&original.fieldworkEnd&&meta.fieldworkEnd===original.fieldworkEnd&&original.fieldworkStart===meta.fieldworkStart&&original.denominator!=='unspecified'&&meta.denominator===original.denominator;
  return {status:'known',verification:full?'full':matched.length?'partial':'accessOnly',matched,expected:Object.keys(original.values),poll:original,evidence:extracted.evidence,reason:full?'Cifras del catálogo, muestra, campo y denominador contrastados en el original.':matched.length?'Contraste parcial: '+matched.length+'/'+Object.keys(original.values).length+' cifras del catálogo; ficha o denominador sin reconstruir por completo.':'Fuente accesible; el lector no reconstruye las cifras. Se conserva la revisión anterior.',document:d};
 }
 if(!core.every(id=>extracted.values[id]!=null))return {status:'pending',reason:'No se leen inequívocamente los cuatro partidos principales; se requiere el gráfico o documento original.',document:d};
 if(extracted.values.pp<10||extracted.values.psoe<10||extracted.values.vox>40||extracted.values.sumar>25)return {status:'pending',reason:'Cifras fuera del rango de control: comprobar que son intención nacional y no transferencias o valoración.',document:d};
 const duplicate=catalog.find(p=>p.institute===config.institute&&core.every(id=>Math.abs(p.values[id]-extracted.values[id])<.051)&&(!meta.fieldworkEnd||p.fieldworkEnd===meta.fieldworkEnd));
 if(duplicate)return {status:'duplicate',reason:'Reproduce un estudio ya incorporado.',original:duplicate.url,document:d};
 const poll={id:config.institute.toLowerCase().replace(/[^a-z0-9]/g,'')+'-'+(meta.fieldworkEnd||d.publishedAt).replaceAll('-',''),institute:config.institute,publishedAt:d.publishedAt,...meta,values:extracted.values,url,verified:true,measure:'voteEstimate',retrievedAt:today,note:'Extracción automática de porcentajes explícitos del original. '+(meta.denominator==='unspecified'?'Denominador no declarado: se asume voto válido con reducción de peso. ':'')+(!meta.fieldworkEnd?'Campo no publicado de forma interpretable; se usa publicación y se reduce el peso. ':'')+(!meta.sample?'Muestra no publicada de forma interpretable; se reduce el peso. ':'')};
 poll.methodology=identifyMethodology(body,url);
 return {status:'extracted',poll,evidence:extracted.evidence,document:d};
}

export function extractPdf(pages,url,{today,catalog=[],publishedAt}={}){
 const original=catalog.find(p=>canonical(p.url)===canonical(url)),all=pages.join('\n').replace(/\s+/g,' ');
 let institute,values,evidence={};
 if(new URL(url).hostname==='ep00.epimg.net'&&/40dB\.es/.test(all)){
  institute='40dB';
  const vectors=[];
  for(let page=0;page<pages.length;page++){
   const lines=pages[page].split('\n').map(clean).filter(Boolean),labels=['PP','PSOE','Vox','Sumar','Podemos','SALF','Otro + Blanco'];
   for(let i=7;i<lines.length-6;i++)if(labels.every((label,j)=>lines[i+j]===label)&&/porcentajes sobre el total de votos v[aá]lidos/i.test(pages[page])){
    const nums=lines.slice(i-7,i);if(!nums.every(n=>/^\d{1,2},\d$/.test(n)))continue;
    const v=nums.map(n=>Number(n.replace(',','.')));if(Math.abs(v.reduce((s,n)=>s+n,0)-100)>.3)continue;
    vectors.push({values:Object.fromEntries(['pp','psoe','vox','sumar','podemos','salf'].map((id,j)=>[id,v[j]])),evidence:Object.fromEntries(['pp','psoe','vox','sumar','podemos','salf'].map((id,j)=>[id,`PDF página ${page+1}: ${labels[j]} = ${nums[j]}; vector completo suma 100.`]))});
   }
  }
  if(vectors.length!==1)return {status:'pending',reason:'El PDF 40dB no presenta un único vector nacional reconocido.'};
  ({values,evidence}=vectors[0]);
 }else if(new URL(url).hostname==='moreincommon.es'&&/Pulso electoral/.test(all)){
  institute='More in Common';
  // The report contains many percentages about concerns and leaders. Restrict to the electoral paragraph.
  const start=all.search(/El PP ganar[ií]a unas hipot[eé]ticas elecciones/i),relativeEnd=all.slice(Math.max(0,start)).search(/L\s*os porcentajes de voto cambian/i),end=relativeEnd<0?-1:start+relativeEnd;
  if(start<0||end<start)return {status:'pending',reason:'Bloque de estimación electoral MIC no reconocido.'};
  const block=all.slice(start,end).replace(/\s+/g,' ');
  const lead=block.match(/PP[^%]{0,75}?(\d+,\d+)%[^%]{0,75}?PSOE[^%]{0,50}?(\d+(?:,\d+)?)%[^%]{0,75}?Vox[^%]{0,50}?(\d+,\d+)%/);
  const left=block.match(/Sumar\s*\((\d+,\d+)%\)\s*y\s*Podemos\s*\((\d+,\d+)%\)/);
  if(!lead||!left)return {status:'pending',reason:'No se leen las cinco cifras principales MIC en el bloque electoral.'};
  values=Object.fromEntries(['pp','psoe','vox','sumar','podemos'].map((id,i)=>[id,Number([...lead.slice(1),...left.slice(1)][i].replace(',','.'))]));
  const bloc=all.match(/PP, Vox y SALF,[\s\S]{0,180}?al\s*(\d+,\d+)%\s*actual/i);
  if(bloc){values.salf=Math.round((Number(bloc[1].replace(',','.'))-values.pp-values.vox)*10)/10;evidence.salf='Derivación explícita: bloque PP + Vox + SALF menos PP y Vox; afectada por redondeo.';}
  for(const id of ['pp','psoe','vox','sumar','podemos'])evidence[id]='Bloque electoral original: '+block.slice(0,750);
 }else return {status:'unsupported',reason:'PDF sin adaptador reconocido.'};
 const publication=original?.publishedAt||publishedAt;
 if(!validDate(publication)||publication>today)return {status:'pending',reason:'Necesita fecha de publicación comprobada en la página de origen.'};
 const metadata=technicalMetadata(all,publication);
 if(!metadata.sample||!metadata.fieldworkEnd)return {status:'pending',reason:'Ficha técnica PDF sin muestra y fechas de campo reconocidas.'};
 if(original){
  const mismatch=Object.entries(values).some(([id,v])=>Object.hasOwn(original.values,id)&&Math.abs(original.values[id]-v)>.051);
  const matched=Object.keys(original.values).filter(id=>values[id]!=null),full=matched.length===Object.keys(original.values).length&&metadata.sample===original.sample&&metadata.fieldworkStart===original.fieldworkStart&&metadata.fieldworkEnd===original.fieldworkEnd&&metadata.denominator===original.denominator&&original.denominator!=='unspecified';
  return mismatch?{status:'pending',reason:'El PDF difiere del estudio revisado; conserva la versión anterior.'}:{status:'known',poll:original,evidence,verification:full?'full':'partial',matched,expected:Object.keys(original.values),reason:full?'Vector y ficha técnica contrastados.':'Vector contrastado parcialmente; ficha o denominador incompletos.'};
 }
 const duplicate=catalog.find(p=>p.institute===institute&&p.fieldworkEnd===metadata.fieldworkEnd);
 if(duplicate)return {status:'duplicate',reason:'Misma encuesta y campo que el original ya incorporado.',original:duplicate.url};
 return {status:'extracted',poll:{id:institute.toLowerCase().replace(/[^a-z0-9]/g,'')+'-'+metadata.fieldworkEnd.replaceAll('-',''),institute,publishedAt:publication,...metadata,methodology:identifyMethodology(all,url),values,url,verified:true,measure:'voteEstimate',retrievedAt:today,note:'Vector nacional extraído del PDF original con ficha técnica verificada.'},evidence};
}
