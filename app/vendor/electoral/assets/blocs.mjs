import {INVESTITURE_IDS,MAJORITY,nationalAllocation,nationalVotes} from './electoral.mjs';
export const BLOC_DEFINITIONS=[{id:'right',label:'PP + Vox',ids:['pp','vox']},{id:'investiture',label:'Apoyos de la investidura de 2023',ids:INVESTITURE_IDS}];
export function compareBlocs(provinces){
 const allocation=nationalAllocation(provinces),votes=nationalVotes(provinces);
 const blank=provinces.reduce((sum,p)=>sum+p.blankVotes,0),validVotes=votes.total+blank;
 const included=new Set(BLOC_DEFINITIONS.flatMap(b=>b.ids));
 const otherIds=[...new Set([...Object.keys(votes.totals),...Object.keys(allocation.counts)])].filter(id=>!included.has(id));
 const rows=[...BLOC_DEFINITIONS,{id:'other',label:'Resto de candidaturas',ids:otherIds}].map(b=>{
  const members=b.ids.map(id=>({id,votes:votes.totals[id]||0,share:100*(votes.totals[id]||0)/validVotes,seats:allocation.counts[id]||0}));
  const seats=members.reduce((sum,p)=>sum+p.seats,0),total=members.reduce((sum,p)=>sum+p.votes,0);
  return {...b,members,seats,votes:total,share:100*total/validVotes,toMajority:Math.max(0,MAJORITY-seats),aboveMajority:Math.max(0,seats-MAJORITY),hasMajority:seats>=MAJORITY};
 });
 return {rows,validVotes,blank,blankShare:100*blank/validVotes,totalSeats:rows.reduce((sum,b)=>sum+b.seats,0),seatGap:rows[0].seats-rows[1].seats,voteGap:rows[0].share-rows[1].share};
}
