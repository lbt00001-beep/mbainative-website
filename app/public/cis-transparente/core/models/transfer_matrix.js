/**
 * Motor de Matriz de Transferencia de Voto Calibrada por Urnas 23J (RV EG23)
 * ===========================================================================
 * Implementa dos niveles de resolución según la disponibilidad de datos del estudio:
 *
 * 1. MODO MATRIZ EMPÍRICA COMPLETA ('empirica_rv_eg23'):
 *    Opera directamente sobre la tabla de contingencia oficial del CIS (cruce P19a
 *    Voto+Simpatía × Recuerdo 23J o P17R Intención Directa × Recuerdo 23J de la hoja
 *    'RV EG23'). Pondera cada columna j de recuerdo por el peso real en las urnas del
 *    23J (W_j = Voto_Real_23J[j]), lo que equivale algebraicamente a reponderar los
 *    microdatos individuales por K_j = W_j / Recuerdo_Muestra[j].
 *    Asigna la fracción movilizable de indecisos dentro de cada columna j respetando
 *    la estructura interna de fidelidad y fugas de su electorado de origen.
 *
 * 2. MODO MARGINAL CALIBRADO ('marginal_calibrada'):
 *    Para estudios autonómicos o avances donde sólo se dispone de los marginales,
 *    normaliza el recuerdo exclusivamente sobre voto válido (excluyendo abstención,
 *    nulos, menores y NS/NC), aplica K_p e imputa indecisos.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TransferMatrixEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Resultados Oficiales BOE 23J (% sobre Voto Válido)
  const BASE_23J_DEFAULT = {
    'PP': 33.06,
    'PSOE': 31.68,
    'VOX': 12.38,
    'SUMAR': 12.33,
    'ERC': 1.89,
    'JUNTS': 1.60,
    'EH BILDU': 1.36,
    'EAJ-PNV': 1.12,
    'BNG': 0.62,
    'CCa': 0.47,
    'UPN': 0.21,
    'PACMA': 0.69,
    'OTROS': 1.78,
    'En Blanco': 0.81
  };

  const NON_VALID_RECALL_CATS = new Set([
    'No Sabe', 'No Contesta', 'No Recuerda', 'N.S.', 'N.C.', 'N.R.',
    'Abstención', 'No votó', 'No votaría',
    'No tenía edad', 'No tenía derecho a voto',
    'Voto Nulo', 'Nulo', 'Ninguno'
  ]);

  const NON_VALID_DEST_CATS = new Set([
    'No Sabe', 'No Contesta', 'No Recuerda', 'N.S.', 'N.C.', 'N.R.',
    'Abstención', 'No votó', 'No votaría', 'Ninguno',
    'Voto Nulo', 'Nulo'
  ]);

  // Agrupación de marcas aliadas en elecciones generales y micro-partidos
  const COALICION_TO_SUMAR = new Set([
    'COALICIÓN DE IZQUIERDAS', 'ADELANTE ANDALUCÍA', 'COMPROMÍS', 'IU'
  ]);
  const MICRO_PARTIES_TO_OTROS = new Set([
    'PACMA', 'ALIANÇA CATALANA', 'FRENTE OBRERO'
  ]);

  function calcularIntervalosConfianza(estimacion, nMuestra = 4000, factoresK = {}) {
    const kVals = Object.values(factoresK).filter(v => typeof v === 'number' && v > 0);
    let deff = 1.22;
    if (kVals.length > 1) {
      const meanK = kVals.reduce((a, b) => a + b, 0) / kVals.length;
      const varK = kVals.reduce((a, b) => a + Math.pow(b - meanK, 2), 0) / kVals.length;
      const cv2 = meanK > 0 ? varK / (meanK * meanK) : 0;
      deff = Math.min(1.65, Math.max(1.10, 1.0 + cv2));
    }
    const nEfectivo = Math.max(500, (nMuestra * 0.75) / deff);
    const intervalos = {};
    for (const [partido, pct] of Object.entries(estimacion)) {
      const p = Math.max(0.0001, Math.min(0.9999, pct / 100.0));
      const se = Math.sqrt((p * (1.0 - p)) / nEfectivo);
      const margen = Math.round(1.96 * se * 100 * 10) / 10;
      intervalos[partido] = {
        central: pct,
        margen: Math.max(0.1, margen),
        min: Math.max(0.0, Math.round((pct - margen) * 10) / 10),
        max: Math.min(100.0, Math.round((pct + margen) * 10) / 10)
      };
    }
    return { intervalos, deff: Math.round(deff * 100) / 100, nEfectivo: Math.round(nEfectivo) };
  }

  /**
   * Calcula la estimación electoral usando la Matriz de Transferencia Empírica (si existe)
   * o la calibración marginal sobre voto válido.
   */
  function calcular(votoDirecto, recuerdo, base23J = BASE_23J_DEFAULT, simpatia = {}, options = {}) {
    if (!votoDirecto || !recuerdo) return {};

    const nMuestra = options.nMuestra || 4000;
    const matrizEmpirica = options.matrizP19a || options.matrizP17R || null;
    const momentum = options.momentum || {};

    // 1. Normalizar recuerdo excluyendo categorías no válidas para obtener el Recuerdo Válido 23J
    const sumRecValido = Object.entries(recuerdo)
      .filter(([k]) => !NON_VALID_RECALL_CATS.has(k))
      .reduce((acc, [, val]) => acc + (typeof val === 'number' ? val : 0), 0);

    const recuerdoNormalizado = {};
    for (const [k, val] of Object.entries(recuerdo)) {
      if (!NON_VALID_RECALL_CATS.has(k) && typeof val === 'number' && sumRecValido > 0) {
        recuerdoNormalizado[k] = Math.round(((val / sumRecValido) * 100) * 100) / 100;
      }
    }

    const factoresCalibracion = {};
    for (const [partido, refVal] of Object.entries(base23J)) {
      if (NON_VALID_RECALL_CATS.has(partido)) continue;
      const recNorm = recuerdoNormalizado[partido] || 0;
      if (recNorm > 0 && refVal > 0) {
        factoresCalibracion[partido] = refVal / recNorm;
      } else {
        factoresCalibracion[partido] = 1.0;
      }
    }
    if (!factoresCalibracion['PODEMOS'] && factoresCalibracion['SUMAR']) {
      factoresCalibracion['PODEMOS'] = factoresCalibracion['SUMAR'];
    }
    if (!factoresCalibracion['SALF']) {
      factoresCalibracion['SALF'] = 1.0;
    }

    const estimacionPonderada = {};
    const flujosPonderados = {};
    let modoMatriz = 'marginal_calibrada';

    // 2A. MODO MATRIZ EMPÍRICA COMPLETA (RV EG23)
    if (matrizEmpirica && Object.keys(matrizEmpirica).length > 0) {
      modoMatriz = 'empirica_rv_eg23';

      // Para cada columna de origen del 23J con peso conocido en base23J
      for (const [origParty, peso23J] of Object.entries(base23J)) {
        if (peso23J <= 0 || NON_VALID_RECALL_CATS.has(origParty)) continue;

        let sumaDecididosCol = 0;
        const distCol = {};

        for (const [destRaw, colsMap] of Object.entries(matrizEmpirica)) {
          if (NON_VALID_DEST_CATS.has(destRaw)) continue;
          const pctTrans = colsMap[origParty] || 0;
          if (pctTrans <= 0) continue;

          let destParty = destRaw;
          if (COALICION_TO_SUMAR.has(destRaw)) destParty = 'SUMAR';
          else if (MICRO_PARTIES_TO_OTROS.has(destRaw)) destParty = 'OTROS';
          const weightFactor = destParty === 'OTROS' ? 0.50 : (destParty === 'En Blanco' ? 0.45 : 1.0);
          distCol[destParty] = (distCol[destParty] || 0) + pctTrans * weightFactor;
          sumaDecididosCol += pctTrans * weightFactor;
        }

        // Indecisos dentro de este electorado de origen (No Sabe + No Contesta + Ninguno)
        const indecisosCol = (matrizEmpirica['No Sabe']?.[origParty] || 0) +
                             (matrizEmpirica['No Contesta']?.[origParty] || 0) +
                             (matrizEmpirica['Ninguno']?.[origParty] || 0);

        // El 50% de los indecisos de cada electorado de 23J se reactiva siguiendo
        // la distribución de voto decidido de su propia cohorte de recuerdo
        const factorReactivacion = (sumaDecididosCol > 0 && indecisosCol > 0)
          ? (sumaDecididosCol + indecisosCol * 0.50) / sumaDecididosCol
          : 1.0;

        flujosPonderados[origParty] = {};
        for (const [destParty, pctTrans] of Object.entries(distCol)) {
          const aportacion = peso23J * ((pctTrans * factorReactivacion) / 100.0);
          estimacionPonderada[destParty] = (estimacionPonderada[destParty] || 0) + aportacion;
          flujosPonderados[origParty][destParty] = Math.round(aportacion * 100) / 100;
        }
      }

      // Incorporar nuevos votantes ('No tenía edad') y antiguos abstencionistas movilizados ('No votó')
      // calibrados por K del partido de destino para no reintroducir el sesgo de selección muestral
      const pesosNoVotantes23J = { 'No tenía edad': 3.5, 'No votó': 6.5 };
      for (const [colEspecial, pesoCenso] of Object.entries(pesosNoVotantes23J)) {
        for (const [destRaw, colsMap] of Object.entries(matrizEmpirica)) {
          if (NON_VALID_DEST_CATS.has(destRaw)) continue;
          const pctTrans = colsMap[colEspecial] || 0;
          if (pctTrans <= 0) continue;
          let destParty = destRaw;
          if (COALICION_TO_SUMAR.has(destRaw)) destParty = 'SUMAR';
          else if (MICRO_PARTIES_TO_OTROS.has(destRaw)) destParty = 'OTROS';
          const weightFactor = destParty === 'OTROS' ? 0.50 : (destParty === 'En Blanco' ? 0.45 : 1.0);
          const kDest = factoresCalibracion[destParty] || 1.0;
          const aportacion = pesoCenso * ((pctTrans * weightFactor) / 100.0) * kDest;
          estimacionPonderada[destParty] = (estimacionPonderada[destParty] || 0) + aportacion;
        }
      }
    } else {
      // 2B. MODO MARGINAL CALIBRADO (cuando el estudio no incluye la hoja RV EG23 completa)
      let totalPonderado = 0;
      for (const [partido, vd] of Object.entries(votoDirecto)) {
        if (NON_VALID_DEST_CATS.has(partido)) continue;
        const factor = factoresCalibracion[partido] || 1.0;
        const val = vd * factor;
        estimacionPonderada[partido] = val;
        totalPonderado += val;
      }

      const nsNc = (votoDirecto['No Sabe'] || 0) + (votoDirecto['No Contesta'] || 0);
      if (nsNc > 0 && totalPonderado > 0) {
        const indecisosMovilizables = nsNc * 0.50;
        for (const [partido, val] of Object.entries(estimacionPonderada)) {
          const simp = simpatia[partido] || 0;
          const pesoProp = val / totalPonderado;
          const pesoFinal = simp > 0 ? (pesoProp * 0.6 + (simp / 100) * 0.4) : pesoProp;
          estimacionPonderada[partido] += indecisosMovilizables * pesoFinal;
        }
      }
    }

    // 3. Aplicar Momentum (Λ) si el usuario ha ajustado los controles interactivos
    for (const [p, val] of Object.entries(estimacionPonderada)) {
      const lam = momentum[p] !== undefined ? momentum[p] : 1.0;
      if (lam !== 1.0) {
        estimacionPonderada[p] = Math.max(0, val * lam);
      }
    }

    // 4. Normalizar a 100.0% sobre voto válido (candidaturas + blanco)
    const sumaTotal = Object.values(estimacionPonderada).reduce((a, b) => a + b, 0);
    const estimacion = {};

    if (sumaTotal > 0) {
      for (const [p, v] of Object.entries(estimacionPonderada)) {
        estimacion[p] = Math.round((v * 100 / sumaTotal) * 10) / 10;
      }

      const sumaFinal = Object.values(estimacion).reduce((a, b) => a + b, 0);
      const diff = Math.round((100.0 - sumaFinal) * 10) / 10;
      if (diff !== 0 && Object.keys(estimacion).length > 0) {
        const top = Object.keys(estimacion).reduce((a, b) => estimacion[a] > estimacion[b] ? a : b);
        estimacion[top] = Math.round((estimacion[top] + diff) * 10) / 10;
      }
    }

    const nsNcTotal = (votoDirecto['No Sabe'] || 0) + (votoDirecto['No Contesta'] || 0);
    const { intervalos, deff, nEfectivo } = calcularIntervalosConfianza(estimacion, nMuestra, factoresCalibracion);

    return {
      estimacion,
      factoresCalibracion,
      recuerdoNormalizado,
      intervalosConfianza: intervalos,
      modoMatriz,
      flujosPonderados,
      indecisosImputados: nsNcTotal,
      metadatosCalculo: {
        sumRecValido: Math.round(sumRecValido * 100) / 100,
        deff,
        nEfectivo
      }
    };
  }

  return {
    calcular,
    calcularIntervalosConfianza,
    BASE_23J_DEFAULT,
    NON_VALID_RECALL_CATS
  };
}));
