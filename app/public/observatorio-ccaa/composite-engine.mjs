export const INDEX_VERSION='IGT-1.0';
export const INDEX_DIMENSIONS=[
 {id:'material',name:'Bienestar material',weight:20,metrics:[{id:'income',name:'Renta neta por persona',direction:1},{id:'poverty',name:'Riesgo de pobreza o exclusión (AROPE)',direction:-1}]},
 {id:'employment',name:'Empleo',weight:20,metrics:[{id:'employment',name:'Tasa de empleo de 20 a 64 años',direction:1}]},
 {id:'education',name:'Educación',weight:20,metrics:[{id:'early',name:'Abandono educativo temprano',direction:-1},{id:'tertiary',name:'Población con educación superior',direction:1}]},
 {id:'health',name:'Salud',weight:20,metrics:[{id:'life',name:'Esperanza de vida al nacer',direction:1}]},
 {id:'digital',name:'Inclusión digital',weight:20,metrics:[{id:'internet',name:'Uso diario de Internet',direction:1}]},
];
export const defaultWeights=()=>Object.fromEntries(INDEX_DIMENSIONS.map(d=>[d.id,d.weight]));
export const defaultSelection=()=>INDEX_DIMENSIONS.flatMap(d=>d.metrics.map(m=>m.id));
export function normalizeScore(value,min,max,direction){if(![value,min,max].every(Number.isFinite))return null;if(max===min)return 50;return 100*(direction===-1?max-value:value-min)/(max-min)}
function activeDimensions(weights,selection){return INDEX_DIMENSIONS.map(d=>({...d,weight:Number(weights[d.id]||0),metrics:d.metrics.filter(m=>selection.includes(m.id))})).filter(d=>d.weight>0&&Number.isFinite(d.weight)&&d.metrics.length)}
export function indexYears(datasets,codes,weights=defaultWeights(),selection=defaultSelection()){
 const metrics=activeDimensions(weights,selection).flatMap(d=>d.metrics);if(!metrics.length)return[];
 const years=[...new Set((datasets[metrics[0].id]?.rows||[]).map(r=>r.year))].filter(y=>/^\d{4}$/.test(y)).sort().reverse();
 return years.filter(year=>metrics.every(m=>codes.every(geo=>Number.isFinite(datasets[m.id]?.rows.find(r=>r.geo===geo&&r.year===year)?.value))));
}
export function calculateIndex(datasets,codes,{year,weights=defaultWeights(),selection=defaultSelection()}={}){
 const dimensions=activeDimensions(weights,selection),sum=dimensions.reduce((n,d)=>n+d.weight,0);if(!dimensions.length)return{ok:false,reason:'Selecciona al menos un indicador y un peso positivo.'};
 const available=indexYears(datasets,codes,weights,selection);year=year||available[0];if(!year||!available.includes(year))return{ok:false,reason:'No hay cobertura completa de los territorios y los indicadores elegidos en este año. No se imputan datos ni se excluyen comunidades.',available};
 const scales={};for(const d of dimensions)for(const m of d.metrics){const values=codes.map(geo=>datasets[m.id].rows.find(r=>r.geo===geo&&r.year===year).value);scales[m.id]={min:Math.min(...values),max:Math.max(...values),direction:m.direction}}
 const rows=codes.map(geo=>{const blocks=dimensions.map(d=>{const items=d.metrics.map(m=>{const observation=datasets[m.id].rows.find(r=>r.geo===geo&&r.year===year),scale=scales[m.id];return{...m,raw:observation.value,flag:observation.flag||'',score:normalizeScore(observation.value,scale.min,scale.max,m.direction),min:scale.min,max:scale.max,source:datasets[m.id].url}}),score=items.reduce((n,m)=>n+m.score,0)/items.length;return{id:d.id,name:d.name,weight:d.weight/sum,score,contribution:score*d.weight/sum,items}});return{geo,score:blocks.reduce((n,d)=>n+d.contribution,0),blocks}}).sort((a,b)=>b.score-a.score||a.geo.localeCompare(b.geo));
 rows.forEach((row,i)=>{row.rank=i&&Math.abs(row.score-rows[i-1].score)<1e-9?rows[i-1].rank:i+1});
 return{ok:true,year,version:INDEX_VERSION,rows,dimensions:dimensions.map(d=>({...d,normalizedWeight:d.weight/sum})),scales,mean:rows.reduce((n,r)=>n+r.score,0)/rows.length,available};
}
export function sensitivityRanks(datasets,codes,options){const base=calculateIndex(datasets,codes,options);if(!base.ok)return{};const ranges=Object.fromEntries(base.rows.map(r=>[r.geo,{min:r.rank,max:r.rank,scenarios:0}]));if(base.dimensions.length<2)return ranges;
 for(const d of base.dimensions){const scenario=calculateIndex(datasets,codes,{...options,year:base.year,weights:{...(options.weights||defaultWeights()),[d.id]:0}});if(!scenario.ok)continue;for(const row of scenario.rows){ranges[row.geo].min=Math.min(ranges[row.geo].min,row.rank);ranges[row.geo].max=Math.max(ranges[row.geo].max,row.rank);ranges[row.geo].scenarios++}}
 return ranges;
}
