import {allocate} from './electoral.mjs';

// Display groups only: every candidature participates in the allocation.
export const COMPARISON_GROUPS = {
  all: {label:'Todas las candidaturas', ids:null},
  left: {label:'Izquierda', ids:['psoe','sumar','podemos','erc','bildu','bng','aa']},
  right: {label:'Derecha', ids:['pp','vox','salf','upn','ac']}
};

export function provincialComparison(province, group='all') {
  if (!Object.hasOwn(COMPARISON_GROUPS,group)) throw new Error('Grupo desconocido.');
  const result=allocate(province.votes,province.seats,{blank:province.blankVotes,singleMember:['51','52'].includes(province.id)&&province.seats===1});
  const ids=COMPARISON_GROUPS[group].ids;
  const rows=Object.entries(province.votes).filter(([id,votes])=>votes>0&&(!ids||ids.includes(id)))
    .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([id,votes])=>{
      const seats=result.counts[id],eligible=result.eligible.includes(id);
      return {id,votes,share:100*votes/result.validVotes,seats,eligible,
        last:seats?votes/seats:null,next:eligible?votes/(seats+1):null,
        quotients:Array.from({length:province.seats},(_,i)=>({divisor:i+1,value:votes/(i+1),awarded:eligible&&i<seats}))};
    });
  return {rows,result};
}
