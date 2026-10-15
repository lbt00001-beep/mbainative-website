import {issueKind} from '../assets/update-report.mjs';
export {issueKind};
// Publisher discovery is separate from the institute that produced a poll.
export const feeds=[
 ['GAD3','https://www.gad3.com/feed/'],['Sigma Dos','https://www.sigmados.com/feed/'],
 ['ElectoPanel','https://electomania.es/feed/'],['More in Common','https://moreincommon.es/'],
 ['40dB / EL PAÍS','https://elpais.com/espana/'],['40dB / Cadena SER','https://cadenaser.com/tag/encuestas/a/'],
 ['Ateneo / elDiario','https://www.eldiario.es/politica/'],['SocioMétrica / EL ESPAÑOL','https://www.elespanol.com/espana/politica/'],
 ['DYM / 20minutos','https://www.20minutos.es/nacional/'],['Target Point / El Debate','https://www.eldebate.com/espana/'],
 ['Hamalgama / Vozpópuli','https://www.vozpopuli.com/espana'],['Data10 / OKDIARIO','https://okdiario.com/espana'],
 ['InvyMark / laSexta','https://www.lasexta.com/noticias/nacional/'],['Celeste-Tel / Onda Cero','https://www.ondacero.es/noticias/espana/'],
 ['NC Report / La Razón','https://www.larazon.es/espana/'],['Winston / Artículo14','https://www.articulo14.es/politica/'],
 ['GESOP / El Periódico','https://www.elperiodico.com/es/politica/'],['GESOP · originales','https://gesop.net/es/feed/'],
 ['Ipsos / La Vanguardia','https://www.lavanguardia.com/politica'],['Ipsos · originales','https://www.ipsos.com/es-es/news-and-events/news'],
 ['GAD3 / ABC','https://www.abc.es/espana/']
];

export function contextReason(title){
 if(/encuestas elecciones generales.{0,80}(?:resultados|ganador|ganar)|ganador seg[uú]n.{0,40}sondeos/i.test(title))return 'Recopilación de encuestas; se buscan los estudios originales y no se añade como una encuesta independiente.';
 if(/preservar el efectivo|pagar en efectivo|conf[ií]a.{0,40}sistema electoral|temas.{0,50}(?:preocupan|importantes)|(?:preferido|preferida) para liderar|qui[eé]n.{0,30}(?:liderar|encabezar)|sociólogos no se creen|solo para el CIS|sesgo en la muestra/i.test(title))return 'Artículo de opinión, valoración o preguntas temáticas; no publica una estimación de voto nacional independiente.';
 if(/por comunidad aut[oó]noma|reparto territorial/i.test(title))return 'Desglose territorial de un estudio; se busca su publicación nacional y no se cuenta como otra encuesta.';
 return null;
}

export function reconcileRelatedArticles(report,catalog){
 // A dated publisher story with no complete vector is context when there is
 // already a validated original from that same house and publication date.
 // This does not assert that it is a duplicate or import any of its figures.
 for(const row of report.processed){
  if(row.status!=='pending'||!row.relatedInstitute||!row.publishedAt||row.hasDiscrepancy)continue;
  const originals=catalog.polls.filter(p=>p.institute===row.relatedInstitute&&p.publishedAt===row.publishedAt);
  if(originals.length!==1)continue;
  if(Object.entries(row.observedValues||{}).some(([id,value])=>Object.hasOwn(originals[0].values||{},id)&&Math.abs(originals[0].values[id]-value)>.051))continue;
  row.status='context';row.original=originals[0].url;
  row.reason='Crónica sin vector completo. Ya hay un original validado de este instituto publicado ese día; se enlaza para consulta. No se añade una encuesta a partir de esta crónica.';
 }
 const contextUrls=new Set(report.processed.filter(r=>r.status==='context').map(r=>r.url));
 report.candidates=report.candidates.filter(r=>!contextUrls.has(r.url));
}
