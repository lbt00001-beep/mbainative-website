import {parentPort,workerData} from 'node:worker_threads';
import {readFile} from 'node:fs/promises';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {fileURLToPath} from 'node:url';
try{
 const bytes=await readFile(workerData.file);if(bytes.length>12000000)throw Error('PDF demasiado grande.');
 const loading=getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:false,disableFontFace:true,verbosity:0,standardFontDataUrl:fileURLToPath(new URL('../../standard_fonts/',import.meta.resolve('pdfjs-dist/legacy/build/pdf.mjs'))).replaceAll('\\','/')});
 const pdf=await loading.promise;if(pdf.numPages>200)throw Error('PDF supera 200 páginas.');
 const pages=[];let length=0;
 for(let n=1;n<=pdf.numPages;n++){
  const page=await pdf.getPage(n),content=await page.getTextContent();
  let text='',lastY=null;
  for(const item of content.items){if(!('str' in item))continue;const y=item.transform[5];if(lastY!==null&&Math.abs(y-lastY)>2&&!text.endsWith('\n'))text+='\n';text+=item.str+(item.hasEOL?'\n':' ');lastY=y;}
  length+=text.length;if(length>10000000)throw Error('Texto PDF demasiado grande.');pages.push(text);
 }
 await loading.destroy();parentPort.postMessage({pages});
}catch(e){parentPort.postMessage({error:e.message});}
