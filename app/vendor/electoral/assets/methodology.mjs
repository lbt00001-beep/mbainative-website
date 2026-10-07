// Editorial safeguards, not an empirically calibrated ranking of polling houses.
export const METHOD_POLICY='2026-10-v1';
export function identifyMethodology(text,sourceUrl){
 const starts=[...text.matchAll(/Ficha t[eé]cnica\s+(?:Poblaci[oó]n|Encuestadora|[ÁA]mbito)|TAMAÑO DE LA MUESTRA/gi)];
 if(starts.length)text=text.slice(starts[0].index).split(/Accede a los|Más noticias|Artículos relacionados/i)[0].slice(0,6000);
 const mode=/CATI/i.test(text)&&/CAWI/i.test(text)?'mixed':/CAWI|online|on line/i.test(text)?'online':/CATI|telef[oó]nic/i.test(text)?'telephone':'unknown';
 const recruitment=/participaci[oó]n abierta|enlace abierto|autoselecci[oó]n|participantes voluntarios/i.test(text)?'open':/panelistas|panel\b/i.test(text)?'panel':/muestreo probabil[ií]stico/i.test(text)?'probability':'unknown';
 const quotas=/cuotas|asignaci[oó]n proporcional por sexo/i.test(text)?'documented':'unknown';
 const weighting=/ponderaci[oó]n|ponderad[oa]s?|calibraci[oó]n/i.test(text)?'documented':'unknown';
 const fragments=text.split(/(?<=[.!?])\s+|\n/).filter(s=>/CATI|CAWI|panel|cuotas|ponder|calibr|probabil|selecci[oó]n|online/i.test(s)).map(s=>s.slice(0,500)).slice(0,5);
 return {mode,recruitment,quotas,weighting,sourceUrl,evidence:fragments};
}
export function methodologyWeight(p){
 const m=p.methodology||{},recruitment=m.recruitment||'unknown';
 const recruitmentFactor=({probability:1,panel:.8,open:.5,unknown:.7})[recruitment];
 const disclosure=(m.quotas==='documented'?1:.9)*(m.weighting==='documented'?1:.9);
 return {policy:METHOD_POLICY,factor:recruitmentFactor*disclosure,cap:recruitment==='probability'?3000:1500,recruitment,disclosure};
}
export const methodologyLabels={probability:'Selección probabilística documentada',panel:'Panel documentado; reclutamiento probabilístico no acreditado',open:'Participación abierta documentada',unknown:'Selección no documentada en la fuente consultada',online:'En línea',telephone:'Telefónica',mixed:'Mixta',documented:'Documentado'};
