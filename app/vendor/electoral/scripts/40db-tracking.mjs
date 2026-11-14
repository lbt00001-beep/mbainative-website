// The publisher's public campaign series: observed days 1 and 2, dated covers.
// URLs are only retrieval targets. No percentages or assumed publication dates
// enter the catalog until the downloaded report passes all checks below.
const ROOT='https://elpais.com/infografias/encuestas40db/2026/11-tracking-electoral/';
export function trackingReports(today){
 const reports=[];
 for(let day=1;day<=11;day++){
  const date='2026-11-'+String(day+12).padStart(2,'0');
  if(date>today||Date.parse(today)-Date.parse(date)>60*86400000)continue;
  reports.push({institute:'40dB',publishedAt:date,title:'40dB · tracking electoral · día '+day,url:ROOT+(day===1?'Informe':'informe')+'_tracking_dia'+String(day).padStart(2,'0')+'.pdf'});
 }
 return reports;
}
export function isOriginal40dbReport(url){
 const u=new URL(url);
 return ['ep00.epimg.net','elpais.com'].includes(u.hostname)&&/^\/infografias\/encuestas40db\//.test(u.pathname)&&/(?:informe_voto[^/]*|informe_tracking_dia\d{2})\.pdf$/i.test(u.pathname);
}
export function readTrackingVector(pages,url,publication){
 const cover=pages[0]?.replace(/\s+/g,' ').trim()||'',day=cover.match(/^Tracking 29-N \(Día (\d+)\) (\d+) de noviembre de 2026$/i);
 if(!day||Number(day[1])<1||Number(day[1])>11||Number(day[2])!==Number(day[1])+12||publication!=='2026-11-'+day[2].padStart(2,'0'))throw Error('La portada del tracking no coincide con su fecha de publicación.');
 const fileDay=new URL(url).pathname.match(/informe_tracking_dia(\d{2})\.pdf$/i);
 if(!fileDay||Number(fileDay[1])!==Number(day[1]))throw Error('El número de entrega no coincide con la portada.');
 const vectors=[];
 for(const [pageIndex,page]of pages.entries()){
  const text=page.replace(/\s+/g,' ').trim();
  if(!/Estimación de voto Resultado el 23J de 2023/.test(text)||!/porcentajes sobre el total de votos válidos/.test(text))continue;
  if(!/PP PSOE Vox Frente Amplio Se Acabó La Fiesta \(SALF\) Podemos Otras coaliciones territoriales de izquierda\* Otro \+ Blanco/.test(text))continue;
  const firstLabel=text.indexOf(' PP '),nums=text.slice(0,firstLabel).split(' ');
  if(nums.length!==13||!nums.every(n=>/^\d{1,2},\d$/.test(n)))continue;
  const v=nums.map(n=>Number(n.replace(',','.')));
  if(Math.abs(v.slice(0,8).reduce((a,b)=>a+b,0)-100)>.21||v.slice(8).join(',')!=='33.1,31.7,12.4,12.3,10.5')continue;
  // The territorial left is a separate category, not extra Frente Amplio votes.
  const split=[...text.matchAll(/(\d+,\d)%/g)].map(m=>Number(m[1].replace(',','.')));
  if(split.length!==3||Math.abs(split.reduce((a,b)=>a+b,0)-v[6])>.11)continue;
  const ids=['pp','psoe','vox','sumar','salf','podemos'];
  vectors.push({values:Object.fromEntries(ids.map((id,i)=>[id,v[i]])),unmodeledValues:{territorialLeft:v[6]},evidence:Object.fromEntries(ids.map((id,i)=>[id,`PDF página ${pageIndex+1}: vector actual ${nums.slice(0,8).join('; ')}; ${id} = ${nums[i]}. Resultado 2023 y series históricas excluidos.`]))});
 }
 if(vectors.length!==1)throw Error('El tracking no presenta un único vector nacional con categorías y total contrastables.');
 return {...vectors[0],series:'40db-tracking-2026-11',wave:Number(day[1]),note:'Tracking diario; las entregas pueden compartir entrevistas y solo se utiliza la última ola de 40dB. Frente Amplio corresponde a la clave sumar. Las otras coaliciones territoriales de izquierda ('+vectors[0].unmodeledValues.territorialLeft+' %) se conservan como categoría no modelada, sin sumarlas a Frente Amplio ni distribuirlas de forma inventada. El resto incluye otros y blanco. Campo y muestra proceden de la ficha técnica del PDF.'};
}
