import {estimate} from './polling.mjs';
export const madridDate=(date=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export function estimateForDate(catalog,official,date=madridDate()){
 const eligible=catalog.polls.some(p=>p.institute.trim().toUpperCase()!=='CIS'&&p.measure!=='directVote'&&p.publishedAt<=date&&(p.fieldworkEnd||p.publishedAt)<=date&&(Date.parse(date)-Date.parse(p.fieldworkEnd||p.publishedAt))/86400000<=60);
 const result=estimate(catalog,official,eligible?date:catalog.asOf);
 const lastPublication=result.selected.map(p=>p.publishedAt).sort().at(-1);
 const lastFieldwork=result.selected.map(p=>p.fieldworkEnd).filter(Boolean).sort().at(-1)||null;
 return {...result,calculatedAt:date,expired:!eligible,lastPublication,lastFieldwork,dataAge:Math.max(0,Math.floor((Date.parse(date)-Date.parse(lastPublication))/86400000))};
}
