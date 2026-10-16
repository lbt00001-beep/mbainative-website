import registry from '../data/app-credits.json';

export const appCredits = registry.apps;
export const creditAuthor = registry.author;
export function findAppCredit(pathname: string) {
  const normalize = (value: string) => value.replace(/\/$/, '').replace(/\/index\.html$/, '');
  return appCredits.find(app => normalize(app.route) === normalize(pathname));
}
export function formatAppCredit(credit: {model: string; version: string; year: number}) {
  return `By ${creditAuthor} with ${credit.model} · versión ${credit.version} · ${credit.year}`;
}
