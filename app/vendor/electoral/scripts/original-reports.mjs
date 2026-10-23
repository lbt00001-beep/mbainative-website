import {createHash} from 'node:crypto';
// Public originals checked against their dated publication. These are retrieval
// targets, not poll values: every update downloads and validates the PDF again.
// Keeping them in code also reaches persistent installations seeded previously.
export const originalReports=[{
 institute:'40dB',publishedAt:'2026-10-09',title:'40dB · encuesta flash de octubre de 2026',
 publicationUrl:'https://elpais.com/espana/2026-10-09/consulte-todos-los-datos-internos-de-la-encuesta-de-el-pais-cuestionarios-cruces-y-respuestas-individuales.html',
 url:'https://ep00.epimg.net/infografias/encuestas40db/2026/10-08-barometro-flash/2026_10_informe_voto_barometro_flash.pdf',
 microdataUrl:'https://ep00.epimg.net/infografias/encuestas40db/2026/10-08-barometro-flash/2026_10_08_barometro_flash_descargables.zip'
},{
 institute:'IMOP',publishedAt:'2026-10-09',title:'IMOP · encuesta preelectoral para El Confidencial',
 url:'https://www.imop.es/encuesta-pre-electoral-para-el-confidencial-2026/'
},{
 institute:'IMOP',publishedAt:'2026-10-23',title:'IMOP · segunda oleada para El Confidencial',
 url:'https://www.elconfidencial.com/espana/2026-10-23/encuesta-imop-elecciones-29n-bloque-psoe-frente-amplio_4450302/'
}];

// Manual transcription of the original graph, guarded by its exact bytes.
// The article rounds PP and PSOE; never substitute those rounded figures.
export const reviewedCharts=[{
 url:'https://www.elconfidencial.com/espana/2026-10-23/encuesta-imop-elecciones-29n-bloque-psoe-frente-amplio_4450302/',
 imageUrl:'https://datos.elconfidencial.com/encuestas_IMOP-231026/',
 dataUrl:'https://datos.elconfidencial.com/encuestas_IMOP-231026/datos.js',
 sha256:'868b7c7f873c10cd69ecca69e417584f8750b342fc7f3b8986cc0399bf5f9794',
 publishedAt:'2026-10-23',fieldworkStart:'2026-10-13',fieldworkEnd:'2026-10-16',sample:1000,
 values:{pp:28.5,psoe:27.1,vox:20,sumar:8.9,podemos:1.9,erc:2.2,bildu:1.3,bng:1.1,aa:1,cc:.6,junts:1.2,pnv:1},
 note:'Datos de la serie IMOP (23 oct.) del gráfico público original, no resultado 2023 ni IMOP (9 oct.). Frente Amplio (Sumar) se armoniza con Sumar; PP incluye la agrupación con UPN del gráfico, sin desglose independiente. SALF no aparece: no se añade ni se deduce. No se importan los escaños de la casa. Denominador no explícito, con reducción de peso; margen general orientativo no utilizado como intervalo por partido.'
},{
 url:'https://www.imop.es/encuesta-pre-electoral-para-el-confidencial-2026/',
 imageUrl:'https://www.imop.es/wp-content/uploads/2026/10/estimacion-voto-2.png',
 sha256:'c70e7402fee0544f9295b25a81b035c169a5ce0a05b67bc42d7683bc63115bdf',
 publishedAt:'2026-10-09',fieldworkStart:'2026-10-05',fieldworkEnd:'2026-10-07',sample:900,
 values:{pp:30.4,psoe:26.5,vox:19,sumar:7.6},
 note:'Cifras del gráfico original revisado: PP 30,4 y PSOE 26,5; el texto redondea a 30 y 26. No se desglosan Podemos ni SALF. El gráfico parcial no suma 100: no se normaliza ni se completa el residuo. Estudio presentado como fotografía inicial de alcance reducido. La parte online no es probabilística; el ±3,3 orientativo no se utiliza como intervalo de confianza.'
}];
export function verifyReviewedChart(chart,html,bytes){
 if(!html.includes(chart.imageUrl)||createHash('sha256').update(bytes).digest('hex')!==chart.sha256)throw Error('El gráfico original revisado ha cambiado; se requiere una nueva revisión.');
 return chart;
}

