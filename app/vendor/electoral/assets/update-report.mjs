export function issueKind(row){
 if(['access','network','extraction'].includes(row.kind))return row.kind;
 if(/HTTP (?:401|402|403|406|429)|suscripci[oó]n|acceso restringido/i.test(row.reason||''))return 'access';
 if(/HTTP \d+|fetch failed|timeout|tiempo|redirecci[oó]n|ECONN/i.test(row.reason||''))return 'network';
 return 'extraction';
}
export function reportCounts(report){
 const candidates=report.candidates||[];
 return {sources:report.sources?.length||0,accessible:report.sources?.filter(r=>r.status==='ok').length||0,extraction:candidates.filter(r=>issueKind(r)==='extraction').length,access:candidates.filter(r=>issueKind(r)==='access').length,network:candidates.filter(r=>issueKind(r)==='network').length};
}
export function updateSummary(report){
 const c=reportCounts(report),s=report.summary||{};
 return `Fuentes consultadas: ${c.accessible} de ${c.sources}. Sondeos nuevos: ${s.newPolls||0}. Tablas directas CIS nuevas o actualizadas: ${s.newCis||0}. Comparaciones CIS nuevas o actualizadas: ${s.newCisComparisons||0}. Pendientes de lectura o validación: ${c.extraction}; con acceso restringido: ${c.access}; con fallo de conexión: ${c.network}. Ver detalle debajo.`;
}
