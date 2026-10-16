/**
 * Módulo de Auditoría Demoscópica y Evaluación de Desviación Sistemática del CIS
 * ==============================================================================
 * Cuantifica las desviaciones metodológicas entre la estimación oficial del CIS
 * y:
 *  (a) Los resultados electorales definitivos publicados en el BOE / Junta Electoral Central.
 *  (b) Los modelos de reponderación por recuerdo válido y matriz de transferencia empírica.
 *
 * Referencias documentales verificadas:
 * - Ficheros oficiales de Avance y Cruces del CIS (Estudio 3582/0, Octubre 2026, N=5.025).
 * - Junta Electoral Central / BOE: Resultados definitivos Elecciones Generales 23J (2023),
 *   Europeas 9J (2024), Autonómicas Andalucía (2022), Madrid (2021) y Generales 10N (2019).
 * - Análisis de series históricas del CIS: Borja Andrino, El País (14 de octubre de 2026),
 *   "¿Va por delante la izquierda en los sondeos? Solo para el CIS" (43 de 44 comicios con
 *   sobreestimación del bloque de izquierdas, desviación media de ~4,8 puntos).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TezanosAuditEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Métricas históricas documentadas y verificadas
  const METRICAS_HISTORICAS_GLOBALES = {
    totalEleccionesAnalizadas: 44,
    eleccionesSobreestimandoIzquierda: 43,
    porcentajeSesgoIzquierda: 97.7,
    desviacionMediaPuntos: 4.8,
    fuenteSerieHistorica: "El País (Borja Andrino, 14/10/2026) sobre 44 procesos electorales desde 2018",
    estudioOctubre3582: {
      referenciaOficial: "CIS Estudio 3582/0 (Hoja 'Estimación de Voto' y Hoja 'RV EG23', N=5.025)",
      consensoPrivado: {
        fuente: "Promedio de sondeos publicados y 40dB. (El País, Octubre 2026)",
        bloqueDerecha: 50.0,
        bloqueIzquierda: 36.0,
        ventajaDerecha: +14.0
      },
      cisOficial: {
        fuente: "CIS Barómetro Octubre 2026 (Estudio 3582/0)",
        bloqueDerecha: 41.1, // PP (22.2) + VOX (17.1) + SALF (1.8)
        bloqueIzquierda: 43.2, // PSOE (34.0) + SUMAR (6.1) + PODEMOS (3.1)
        ventajaIzquierda: +2.1
      },
      brechaDiscrepanciaBloques: 16.1,
      matricesTransferencia: {
        psoe: {
          retencionVotoDirecto: 63.63,
          retencionVotoSimpatia: 70.31,
          indecision: 15.12,
          fugaPP: 4.70,
          fugaVox: 2.02,
          fugaSumarPodemos: 4.17
        },
        pp: {
          retencionVotoDirecto: 62.66,
          retencionVotoSimpatia: 69.98,
          indecision: 15.69,
          fugaVox: 13.40,
          fugaSalf: 0.82,
          fugaPsoe: 0.26
        },
        conclusionMatematica:
          "En la hoja oficial 'RV EG23' (Pregunta 17R y 19a), PSOE y PP presentan tasas de retención " +
          "virtualmente idénticas (63,63% vs 62,66% en voto directo; 70,31% vs 69,98% en voto+simpatía) " +
          "y niveles de indecisión equivalentes (15,12% vs 15,69%). Partiendo del resultado real del 23J " +
          "(PP 33,06% vs PSOE 31,68%), la ventaja de +11,8 puntos asignada por el CIS al PSOE (34,0% vs 22,2%) " +
          "se explica por el desequilibrio de recuerdo en la muestra bruta (1.611,33 entrevistados declaran haber " +
          "votado al PSOE en el 23J frente a 823,39 al PP: 42,58% vs 21,76% sobre voto válido recordado) sin " +
          "aplicar ponderación correctora de recuerdo (K_PP = 1,52 vs K_PSOE = 0,74)."
      }
    }
  };

  // Registro histórico verificado: Estimación preelectoral CIS vs. Resultado Oficial BOE
  const HISTORICO_DESVIACIONES = [
    {
      eleccion: "Elecciones Europeas 9J (2024)",
      fecha: "Junio 2024",
      fuenteCIS: "CIS Estudio 3458 (Pre-electoral Europeas)",
      fuenteBOE: "BOE-A-2024-13092 (Junta Electoral Central)",
      cis_psoe: 33.2,
      real_psoe: 30.18,
      desviacion_psoe: +3.02,
      cis_pp: 29.1,
      real_pp: 34.20,
      desviacion_pp: -5.10,
      cis_vox: 10.0,
      real_vox: 9.62,
      desviacion_vox: +0.38,
      sesgo_neto_psoepp: +8.12,
      ganador_cis: "PSOE (+4,1 ptos)",
      ganador_real: "PP (+4,0 ptos)"
    },
    {
      eleccion: "Elecciones Generales 23J (2023)",
      fecha: "Julio 2023",
      fuenteCIS: "CIS Estudio 3415 / Flash 23J",
      fuenteBOE: "BOE-A-2023-18907 (Junta Electoral Central)",
      cis_psoe: 32.2,
      real_psoe: 31.68,
      desviacion_psoe: +0.52,
      cis_pp: 30.8,
      real_pp: 33.06,
      desviacion_pp: -2.26,
      cis_vox: 11.8,
      real_vox: 12.38,
      desviacion_vox: -0.58,
      sesgo_neto_psoepp: +2.78,
      ganador_cis: "PSOE (+1,4 ptos)",
      ganador_real: "PP (+1,38 ptos)"
    },
    {
      eleccion: "Autonómicas Andalucía (2022)",
      fecha: "Junio 2022",
      fuenteCIS: "CIS Estudio 3364 (Pre-electoral Andalucía)",
      fuenteBOE: "BOJA / Junta Electoral de Andalucía",
      cis_psoe: 26.8,
      real_psoe: 24.10,
      desviacion_psoe: +2.70,
      cis_pp: 36.6,
      real_pp: 43.11,
      desviacion_pp: -6.51,
      sesgo_neto_psoepp: +9.21,
      ganador_cis: "PP (sin mayoría absoluta)",
      ganador_real: "PP (mayoría absoluta: 58 escaños)"
    },
    {
      eleccion: "Autonómicas Comunidad de Madrid (2021)",
      fecha: "Mayo 2021",
      fuenteCIS: "CIS Estudio 3320 (Flash Madrid)",
      fuenteBOE: "BOCM / Junta Electoral de Madrid",
      cis_psoe: 23.4,
      real_psoe: 16.80,
      desviacion_psoe: +6.60,
      cis_pp: 36.7,
      real_pp: 44.76,
      desviacion_pp: -8.06,
      sesgo_neto_psoepp: +14.66,
      ganador_cis: "Empate técnico de bloques",
      ganador_real: "PP (65 escaños, más que toda la izquierda)"
    },
    {
      eleccion: "Elecciones Generales 10N (2019)",
      fecha: "Noviembre 2019",
      fuenteCIS: "CIS Estudio 3263 (Macroencuesta 10N)",
      fuenteBOE: "BOE-A-2019-17344 (Junta Electoral Central)",
      cis_psoe: 32.2,
      real_psoe: 28.00,
      desviacion_psoe: +4.20,
      cis_pp: 18.1,
      real_pp: 20.81,
      desviacion_pp: -2.71,
      cis_vox: 7.9,
      real_vox: 15.08,
      desviacion_vox: -7.18,
      sesgo_neto_psoepp: +6.91,
      ganador_cis: "PSOE (+14,1 ptos sobre PP)",
      ganador_real: "PSOE (+7,19 ptos sobre PP)"
    }
  ];

  /**
   * Calcula la desviación cuadrática media (RMSE / IDT) entre la estimación oficial del CIS
   * y la estimación calibrada por recuerdo válido para un estudio dado.
   */
  function auditarEstudio(votoDirecto, estimacionCIS, estimacionTransparente, factoresK = {}) {
    if (!votoDirecto || !estimacionCIS || !estimacionTransparente) {
      return null;
    }

    const partidos = Object.keys(estimacionCIS).filter(
      p => p in estimacionTransparente && p !== 'OTROS' && p !== 'En Blanco' && p !== 'Voto Nulo'
    );

    if (partidos.length === 0) return null;

    let infladoPSOE = 0;
    let deflacionPP = 0;
    let deflacionVOX = 0;
    let desviacionCuadratica = 0;

    for (const p of partidos) {
      const cisVal = estimacionCIS[p] || 0;
      const transVal = estimacionTransparente[p] || 0;
      const diff = cisVal - transVal;

      desviacionCuadratica += Math.pow(diff, 2);

      if (p === 'PSOE') infladoPSOE = diff;
      if (p === 'PP') deflacionPP = -diff;
      if (p === 'VOX') deflacionVOX = -diff;
    }

    const idt = Math.sqrt(desviacionCuadratica / partidos.length);

    let diagnostico = "Desviación Baja (<1,0 ptos RMSE)";
    if (idt > 3.0) diagnostico = "Desviación Sistemática Elevada (>3,0 ptos RMSE)";
    else if (idt > 1.8) diagnostico = "Desviación Sistemática Moderada (1,8–3,0 ptos RMSE)";
    else if (idt > 0.8) diagnostico = "Desviación Leve (0,8–1,8 ptos RMSE)";

    const kPP = factoresK['PP'] ? Math.round(factoresK['PP'] * 100) / 100 : null;
    const kPSOE = factoresK['PSOE'] ? Math.round(factoresK['PSOE'] * 100) / 100 : null;

    return {
      indiceDistorsionTezanos: Math.round(idt * 10) / 10,
      infladoPSOE: Math.round(infladoPSOE * 10) / 10,
      deflacionPP: Math.round(deflacionPP * 10) / 10,
      deflacionVOX: Math.round(deflacionVOX * 10) / 10,
      distorsionBloques: Math.round((infladoPSOE + deflacionPP + deflacionVOX) * 10) / 10,
      diagnostico,
      patronesDetectados: [
        infladoPSOE > 1.0
          ? `Sobreestimación del PSOE en +${Math.round(infladoPSOE * 10) / 10} ptos respecto al modelo calibrado por recuerdo (${kPSOE ? `K_PSOE = ${kPSOE}` : 'sobrerrepresentación muestral'})`
          : null,
        deflacionPP > 1.0
          ? `Subestimación del PP en -${Math.round(deflacionPP * 10) / 10} ptos por ausencia de ponderación de recuerdo 23J (${kPP ? `K_PP = ${kPP}` : 'infrarrepresentación muestral'})`
          : null,
        deflacionVOX > 1.0
          ? `Diferencial en VOX de -${Math.round(deflacionVOX * 10) / 10} ptos frente a la transferencia empírica calibrada`
          : null
      ].filter(Boolean)
    };
  }

  function getHistorico() {
    return HISTORICO_DESVIACIONES;
  }

  function getMetricasGlobales() {
    return METRICAS_HISTORICAS_GLOBALES;
  }

  return {
    auditarEstudio,
    getHistorico,
    getMetricasGlobales
  };
}));
