import {validateCatalog,estimate} from '../assets/polling.mjs';
import {mkdir,cp,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validateOfficial,validatePolls} from '../assets/electoral.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'dist');
const official=JSON.parse(await readFile(path.join(root,'data/official-2023.json'),'utf8'));
const refs=JSON.parse(await readFile(path.join(root,'data/references.json'),'utf8'));
validateOfficial(official);validatePolls(refs.polls);
const catalog=JSON.parse(await readFile(path.join(root,'data/polls.json'),'utf8'));validateCatalog(catalog);estimate(catalog,official);
const territory=JSON.parse(await readFile(path.join(root,'data/territory.json'),'utf8'));if(Object.keys(territory.seats).length!==52||Object.values(territory.seats).reduce((s,v)=>s+v,0)!==350)throw Error('Reparto territorial inválido.');
await mkdir(out,{recursive:true});
// Exact asset manifest: source, backups, runtimes and research are never shipped.
const files=['assets/cooking-audit.mjs','data/cooking-audit.json','index.html','assets/app.mjs','assets/integer-input.mjs','assets/help.mjs','assets/blocs.mjs','assets/provincial-comparison.mjs','assets/polling.mjs','assets/methodology.mjs','assets/freshness.mjs','assets/cis.mjs','assets/cis-estimator.mjs','assets/cis-estimator-ui.mjs','assets/update-report.mjs','assets/ai-client.mjs','assets/tooltips.mjs','assets/microdata.mjs','assets/microdata-ui.mjs','assets/electoral.mjs','assets/simulation-worker.mjs','assets/styles.css','assets/favicon.svg','data/official-2023.json','data/references.json','data/polls.json','data/territory.json','data/evaluation.json','data/update-status.json','data/polls-example.json','data/microdata-3577.json','data/microdata-validation.json','data/cis-reestimation.json'];
for(const file of files){await mkdir(path.dirname(path.join(out,file)),{recursive:true});await cp(path.join(root,file),path.join(out,file));}
await writeFile(path.join(out,'.htaccess'),`Options -Indexes\n<IfModule mod_mime.c>\n  AddType text/javascript .mjs\n  AddType application/json .json\n</IfModule>\n<IfModule mod_headers.c>\n  Header set X-Content-Type-Options "nosniff"\n  Header set Referrer-Policy "strict-origin-when-cross-origin"\n  Header set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://openrouter.ai; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"\n  Header set Cache-Control "no-cache"\n</IfModule>\n`);
console.log(`Build validado: ${files.length} archivos + .htaccess en dist/. Publicable en una subcarpeta.`);
