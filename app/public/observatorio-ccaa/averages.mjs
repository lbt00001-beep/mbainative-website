// A territory has one vote in a simple mean. Missing values never become zero.
export function simpleMean(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

export function territorialMean(rows, codes, year, requireComplete = false) {
  const values = codes.map(geo => rows.find(row => row.geo === geo && row.year === year)?.value).filter(Number.isFinite);
  return {
    value: requireComplete && values.length !== codes.length ? null : simpleMean(values),
    count: values.length,
    total: codes.length,
  };
}

export function territorialMeanSeries(rows, codes) {
  return [...new Set(rows.map(row => row.year))].sort().flatMap(year => {
    const result = territorialMean(rows, codes, year, true);
    return Number.isFinite(result.value) ? [{ year, ...result }] : [];
  });
}

// Median across territories: one value per territory, no population weighting.
export function simpleMedian(values){const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b),n=sorted.length;return n?(n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2):null}
export function territorialMedian(rows,codes,year,requireComplete=false){const values=codes.map(geo=>rows.find(r=>r.geo===geo&&r.year===year)?.value).filter(Number.isFinite);return{value:requireComplete&&values.length!==codes.length?null:simpleMedian(values),count:values.length,total:codes.length}}
export function territorialMedianSeries(rows,codes){return [...new Set(rows.map(r=>r.year))].sort().flatMap(year=>{const r=territorialMedian(rows,codes,year,true);return Number.isFinite(r.value)?[{year,...r}]:[]})}
