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
