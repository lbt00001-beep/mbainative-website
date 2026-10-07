import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {readPdf} from '../scripts/pdf-reader.mjs';
import {extractCis} from '../scripts/cis-adapter.mjs';
// Small real PDF, exercising the isolated reader without shipping full publications.
function pdf(lines){
 const content='BT /F1 10 Tf 20 800 Td 12 TL '+lines.map(line=>'('+line.replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)')+') Tj T*').join(' ')+' ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 900] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Length '+Buffer.byteLength(content,'latin1')+' >>\nstream\n'+content+'\nendstream'];
 let text='%PDF-1.4\n';const offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(text,'latin1'));text+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';}const start=Buffer.byteLength(text,'latin1');text+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';return Buffer.from(text,'latin1');
}
test('Lector Node: extrae tabla de un PDF real y rechaza un archivo corrupto',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'electoral-pdf-'));const file=path.join(dir,'table.pdf');
 try{await writeFile(file,pdf(['CIS publicado','PP 18,6','PSOE 25,4','(N) (4.020)']));const {pages}=await readPdf(file);assert.match(pages[0],/PP 18,6/);assert.match(pages[0],/PSOE 25,4/);await writeFile(file,'not a PDF');await assert.rejects(readPdf(file));}finally{await rm(dir,{recursive:true,force:true});}
});
test('CIS: pregunta directa publicada, muestra incompatible y etiqueta desconocida',async()=>{
 const content=await readFile(new URL('./fixtures/cis-direct.txt',import.meta.url),'utf8'),technical='Realizada: 4.020 entrevistas. Del 1 al 6 de julio de 2026. ± 1,6';
 const tables=extractCis(content,technical);assert.equal(tables.sample,4020);assert.equal(tables.direct.rows.PP,18.6);assert.equal(tables.fieldworkEnd,'2026-07-06');
 assert.throws(()=>extractCis(content,technical.replace('4.020','4.000')),/Muestra/);assert.throws(()=>extractCis(content.replace(/PSOE\s+25,4/,'PSOE 25,4\n999 0,1'),technical),/Etiqueta/);
});
