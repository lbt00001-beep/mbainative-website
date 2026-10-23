// Estimación de voto IMOP para las generales del 29-N: escaños y porcentaje por partido.
// Fuente: hoja «Gráficos encuestas» (pestaña «IMOP 2a ola», bloques «Intención de voto (pc)» e «Intención de voto (escaños)»).
// Cada serie va en el orden [Resultado 2023, IMOP 1, IMOP 2]. null = sin dato (Podemos y AA no tienen escaños propios en 2023;
// Podemos se presentó dentro de Sumar). SALF no está porque no consigue escaño.
window.DATOS = {
  encuestas: [
    { k: 0, leyenda: 'Resultado 2023' },
    { k: 1, leyenda: 'IMOP (9 oct.)' },
    { k: 2, leyenda: 'IMOP (23 oct.)' }
  ],
  partidos: [
    { id: 'PSOE',  nombre: 'PSOE',                  corto: 'PSOE',          color: '#f60b01', esc: [121, 110, 113],  pct: [31.7, 26.5, 27.1] },
    { id: 'FA',    nombre: 'Frente Amplio (Sumar)', corto: 'Frente Amplio', movil: 'F. Amplio', color: '#da358d', esc: [31, 11, 14],     pct: [12.3, 7.6, 8.9] },
    { id: 'POD',   nombre: 'Podemos',               corto: 'Podemos',       color: '#692772', esc: [null, 1, 1],     pct: [null, 2.3, 1.9] },
    { id: 'ERC',   nombre: 'ERC',                   corto: 'ERC',           color: '#fab43e', esc: [7, 8, 8],        pct: [1.9, 2.2, 2.2] },
    { id: 'BILDU', nombre: 'EH Bildu',              corto: 'EH Bildu',      color: '#adbd22', esc: [6, 6, 6],        pct: [1.4, 1.3, 1.3] },
    { id: 'BNG',   nombre: 'BNG',                   corto: 'BNG',           color: '#a7dafd', esc: [1, 3, 2],        pct: [0.6, 1.1, 1.1] },
    { id: 'AA',    nombre: 'Adelante Andalucía',                   corto: 'AA',            color: '#4fe8a6', esc: [null, 1, 1],     pct: [0, 1, 1] },
    { id: 'CC',    nombre: 'Coalición Canaria',                   corto: 'CC',            color: '#ffd706', esc: [1, 1, 1],        pct: [0.5, 0.6, 0.6] },
    { id: 'JUNTS', nombre: 'Junts',                 corto: 'Junts',         color: '#9de2de', esc: [7, 4, 4],        pct: [1.6, 1.1, 1.2] },
    { id: 'PNV',   nombre: 'PNV',                   corto: 'PNV',           color: '#4e6b40', esc: [5, 4, 5],        pct: [1.1, 0.9, 1] },
    { id: 'VOX',   nombre: 'Vox',                   corto: 'Vox',           color: '#77be2d', esc: [33, 70, 72],     pct: [12.4, 19, 20] },
    { id: 'PP',    nombre: 'PP',                    corto: 'PP',            color: '#48aafd', esc: [138, 131, 123],  pct: [33.3, 30.6, 28.5] }
  ]
};
