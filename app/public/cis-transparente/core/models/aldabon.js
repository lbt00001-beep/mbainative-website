/**
 * Motor Unificado Aldabón-Gemini (Calibración K + Matriz Empírica RV EG23 + Atribución Multimodal)
 * =================================================================================================
 * Modelo integral de estimación electoral transparente que fusiona:
 * 1. Normalización estricta del recuerdo sobre Voto Válido (excluyendo abstención,
 *    menores de edad en 2023, voto nulo y NS/NC) para garantizar compatibilidad
 *    con los resultados oficiales de la Junta Electoral Central (BOE).
 * 2. Factor K de corrección simultánea de sesgo muestral y voto oculto / deseabilidad social:
 *      K_p = Voto_Real_23J(p) / Recuerdo_Valido_Muestra(p)
 * 3. Embudo de Atribución en 3 Niveles para Indecisos, En Blanco y Abstención Declarada:
 *    - Nivel 1: Depuración de abstención estructural (P16 probabilidad 0) y exceso de voto en blanco
 *      temporal frente al nivel real de urnas (0,81% en 23J).
 *    - Nivel 2: Rescate empírico por Simpatía (P19R -> Matriz P19a × Recuerdo 23J de la hoja RV EG23),
 *      corrigiendo la asimetría de respuesta en «Ninguno» entre bloques.
 *    - Nivel 3: Reactivación de indecisos puros (Ninguno + NS + NC), nuevos votantes («No tenía edad»)
 *      y antiguos abstencionistas («No votó») ponderados por su cohorte de origen, escala ideológica
 *      (1–10, especialmente casillas 5 Centro y 6 Centro-Derecha) y valoración de líderes (P20a).
 * 4. Simulación de coyuntura / Momentum (Λ_p) con redistribución intrabloque.
 * 5. Cuantificación de incertidumbre: Intervalos de confianza al 95% con efecto de diseño (deff).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AldabonEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Categorías que NO forman parte del voto válido a candidaturas + blanco
  const NON_VALID_RECALL_CATS = new Set([
    'No Sabe', 'No Contesta', 'No Recuerda', 'N.S.', 'N.C.', 'N.R.',
    'Abstención', 'No votó', 'No votaría',
    'No tenía edad', 'No tenía derecho a voto',
    'Voto Nulo', 'Nulo', 'Ninguno'
  ]);

  const NON_VALID_DIRECT_CATS = new Set([
    'No Sabe', 'No Contesta', 'No Recuerda', 'N.S.', 'N.C.', 'N.R.',
    'Abstención', 'No votó', 'No votaría', 'Ninguno',
    'Voto Nulo', 'Nulo'
  ]);

  const COALICION_TO_SUMAR = new Set([
    'COALICIÓN DE IZQUIERDAS', 'ADELANTE ANDALUCÍA', 'COMPROMÍS', 'IU'
  ]);
  const MICRO_PARTIES_TO_OTROS = new Set([
    'PACMA', 'ALIANÇA CATALANA', 'FRENTE OBRERO'
  ]);

  const MATRIZ_SECTOR_DEFAULT = {
    'PSOE':    { 'SUMAR': 0.50, 'PODEMOS': 0.25, 'En Blanco': 0.25 },
    'PP':      { 'VOX': 0.65, 'SALF': 0.15, 'En Blanco': 0.20 },
    'VOX':     { 'PP': 0.75, 'SALF': 0.15, 'En Blanco': 0.10 },
    'SALF':    { 'VOX': 0.60, 'PP': 0.20, 'En Blanco': 0.20 },
    'SUMAR':   { 'PSOE': 0.55, 'PODEMOS': 0.35, 'En Blanco': 0.10 },
    'PODEMOS': { 'SUMAR': 0.50, 'PSOE': 0.40, 'En Blanco': 0.10 }
  };

  function calcularPorcentajeAbstencion(momentum) {
    if (momentum >= 0.90) return 0.40;
    if (momentum >= 0.80) return 0.50;
    return 0.60;
  }

  /**
   * Calcula los intervalos de confianza al 95% para cada partido estimado,
   * incorporando el efecto de diseño (deff) derivado de la reponderación K.
   */
  function calcularIntervalosConfianza(estimacion, nMuestra = 4000, kFactors = {}) {
    const kVals = Object.values(kFactors).filter(v => typeof v === 'number' && v > 0);
    let deff = 1.20; // Efecto de diseño base en encuestas telefónicas por cuotas
    if (kVals.length > 1) {
      const meanK = kVals.reduce((a, b) => a + b, 0) / kVals.length;
      const varK = kVals.reduce((a, b) => a + Math.pow(b - meanK, 2), 0) / kVals.length;
      const cv2 = meanK > 0 ? varK / (meanK * meanK) : 0;
      deff = Math.min(1.65, Math.max(1.10, 1.0 + cv2));
    }

    // Muestra efectiva de votantes válidos (~75% de la muestra total)
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
   * Calcula la distribución de atribución empírica a partir de la Matriz RV EG23 (P19a / P17R)
   * y el perfil ideológico / de valoración de líderes en la bolsa de indecisos del centro.
   */
  function calcularAtribucionMatrizEmpirica(matrizEmpirica, partidosRef, kFactors, perfilIdeologicoLideres) {
    const estimacionMatriz = {};
    const flujosPonderados = {};

    // 1. Flujos desde cada electorado válido de 2023 ponderado por su peso real en urnas (BOE)
    for (const [origParty, peso23J] of Object.entries(partidosRef || {})) {
      if (peso23J <= 0 || NON_VALID_RECALL_CATS.has(origParty)) continue;

      let sumaDecididosCol = 0;
      const distCol = {};

      for (const [destRaw, colsMap] of Object.entries(matrizEmpirica)) {
        if (NON_VALID_DIRECT_CATS.has(destRaw)) continue;
        const pctTrans = colsMap[origParty] || 0;
        if (pctTrans <= 0) continue;

        let destParty = destRaw;
        if (COALICION_TO_SUMAR.has(destRaw)) destParty = 'SUMAR';
        else if (MICRO_PARTIES_TO_OTROS.has(destRaw)) destParty = 'OTROS';
        const weightFactor = destParty === 'OTROS' ? 0.50 : (destParty === 'En Blanco' ? 0.45 : 1.0);
        distCol[destParty] = (distCol[destParty] || 0) + pctTrans * weightFactor;
        sumaDecididosCol += pctTrans * weightFactor;
      }

      // Indecisos puros dentro de este electorado de origen tras rescate de simpatía (No Sabe + No Contesta + Ninguno)
      const indecisosCol = (matrizEmpirica['No Sabe']?.[origParty] || 0) +
                           (matrizEmpirica['No Contesta']?.[origParty] || 0) +
                           (matrizEmpirica['Ninguno']?.[origParty] || 0);

      // El 50% movilizable de los indecisos de cada cohorte de recuerdo se reactiva siguiendo
      // el comportamiento de su propio bloque electoral
      const factorReactivacion = (sumaDecididosCol > 0 && indecisosCol > 0)
        ? (sumaDecididosCol + indecisosCol * 0.50) / sumaDecididosCol
        : 1.0;

      flujosPonderados[origParty] = {};
      for (const [destParty, pctTrans] of Object.entries(distCol)) {
        const aportacion = peso23J * ((pctTrans * factorReactivacion) / 100.0);
        estimacionMatriz[destParty] = (estimacionMatriz[destParty] || 0) + aportacion;
        flujosPonderados[origParty][destParty] = Math.round(aportacion * 100) / 100;
      }
    }

    // 2. Incorporar nuevos votantes ('No tenía edad') y antiguos abstencionistas movilizados ('No votó')
    // calibrados por K del partido de destino para evitar sesgo de selección muestral
    const pesosNoVotantes23J = { 'No tenía edad': 3.5, 'No votó': 6.5 };
    for (const [colEspecial, pesoCenso] of Object.entries(pesosNoVotantes23J)) {
      for (const [destRaw, colsMap] of Object.entries(matrizEmpirica)) {
        if (NON_VALID_DIRECT_CATS.has(destRaw)) continue;
        const pctTrans = colsMap[colEspecial] || 0;
        if (pctTrans <= 0) continue;
        let destParty = destRaw;
        if (COALICION_TO_SUMAR.has(destRaw)) destParty = 'SUMAR';
        else if (MICRO_PARTIES_TO_OTROS.has(destRaw)) destParty = 'OTROS';
        const weightFactor = destParty === 'OTROS' ? 0.50 : (destParty === 'En Blanco' ? 0.45 : 1.0);
        const kDest = kFactors[destParty] || 1.0;
        const aportacion = pesoCenso * ((pctTrans * weightFactor) / 100.0) * kDest;
        estimacionMatriz[destParty] = (estimacionMatriz[destParty] || 0) + aportacion;
      }
    }

    // 3. Refinamiento por afinidad de liderazgo e ideología en la bolsa de indecisos del Centro (5) y Centro-Derecha (6)
    if (perfilIdeologicoLideres && perfilIdeologicoLideres.notaMediaLideres) {
      const notas = perfilIdeologicoLideres.notaMediaLideres;
      // Índices: 5 = "5 Centro", 6 = "6"
      const notaFeijooCentro = notas['Alberto Núñez Feijóo (PP)']?.[5] || 3.59;
      const notaSanchezCentro = notas['Pedro Sánchez (PSOE)']?.[5] || 2.87;
      const notaAbascalCentro = notas['Santiago Abascal (VOX)']?.[5] || 2.98;
      const notaDiazCentro = notas['Yolanda Díaz (SUMAR)']?.[5] || 2.97;
      const sumaNotas = notaFeijooCentro + notaSanchezCentro + notaAbascalCentro + notaDiazCentro;

      if (sumaNotas > 0) {
        // Bolsa residual de voto en blanco temporal en Centro/Centro-Derecha (~1.2% del censo válido)
        const bolsaCentroDecantable = 1.20;
        estimacionMatriz['PP'] = (estimacionMatriz['PP'] || 0) + bolsaCentroDecantable * (notaFeijooCentro / sumaNotas);
        estimacionMatriz['VOX'] = (estimacionMatriz['VOX'] || 0) + bolsaCentroDecantable * (notaAbascalCentro / sumaNotas);
        estimacionMatriz['PSOE'] = (estimacionMatriz['PSOE'] || 0) + bolsaCentroDecantable * (notaSanchezCentro / sumaNotas);
        estimacionMatriz['SUMAR'] = (estimacionMatriz['SUMAR'] || 0) + bolsaCentroDecantable * (notaDiazCentro / sumaNotas);
      }
    }

    // Normalizar la componente de matriz empírica a la misma escala que estimacionRaw
    const sumaM = Object.values(estimacionMatriz).reduce((a, b) => a + b, 0);
    const normMatriz = {};
    if (sumaM > 0) {
      for (const [p, val] of Object.entries(estimacionMatriz)) {
        normMatriz[p] = (val / sumaM) * 100.0;
      }
    }

    return { normMatriz, flujosPonderados };
  }

  /**
   * Ejecuta el cálculo de estimación electoral transparente unificado Aldabón-Gemini.
   */
  function calcular(votoDirecto, recuerdo, partidosRef, fidelidad = {}, momentum = {}, transvases = {}, matrizSector = MATRIZ_SECTOR_DEFAULT, options = {}) {
    if (!votoDirecto || !recuerdo || Object.keys(votoDirecto).length === 0) {
      return {};
    }

    const nMuestra = options.nMuestra || 4000;
    const matrizEmpirica = options.matrizP19a || options.matrizP17R || null;
    const perfilIdeologicoLideres = options.perfilIdeologicoLideres || null;

    // A. Normalización estricta del Recuerdo sobre VOTO VÁLIDO (excluyendo abstención, nulos, menores, NS/NC)
    const sumRecValido = Object.entries(recuerdo)
      .filter(([k]) => !NON_VALID_RECALL_CATS.has(k))
      .reduce((acc, [, val]) => acc + (typeof val === 'number' ? val : 0), 0);

    const recuerdoNormalizado = {};
    for (const [k, val] of Object.entries(recuerdo)) {
      if (!NON_VALID_RECALL_CATS.has(k) && typeof val === 'number' && sumRecValido > 0) {
        recuerdoNormalizado[k] = Math.round(((val / sumRecValido) * 100) * 100) / 100;
      }
    }

    const kFactors = {};
    for (const [p, votoReal] of Object.entries(partidosRef || {})) {
      if (NON_VALID_RECALL_CATS.has(p)) continue;
      const recNorm = recuerdoNormalizado[p] || 0;
      if (recNorm > 0 && votoReal > 0) {
        kFactors[p] = votoReal / recNorm;
      } else if (p === 'PODEMOS' && recuerdoNormalizado['SUMAR'] > 0 && (partidosRef['SUMAR'] || 0) > 0) {
        // En las generales del 23J Podemos concurrió dentro de Sumar
        kFactors[p] = partidosRef['SUMAR'] / recuerdoNormalizado['SUMAR'];
      } else if (p === 'SALF' && kFactors['VOX']) {
        // Nuevas candidaturas sin papeleta en 23J: factor neutro 1.00
        kFactors[p] = 1.0;
      } else {
        kFactors[p] = 1.0;
      }
    }

    // Asegurar que partidos emergentes tengan K definido
    if (!kFactors['PODEMOS'] && kFactors['SUMAR']) kFactors['PODEMOS'] = kFactors['SUMAR'];
    if (!kFactors['SALF']) kFactors['SALF'] = 1.0;

    // B. Componente 1: Voto Directo Calibrado por Factor K y Fidelidad (E_direct = VD(p) * K(p) * Φ(p))
    const estimacionDirectaK = {};
    const masaPerdida = {};

    for (const [p, vd] of Object.entries(votoDirecto)) {
      if (NON_VALID_DIRECT_CATS.has(p)) continue;

      let k = kFactors[p] !== undefined ? kFactors[p] : 1.0;

      // Amortiguación técnica para voto en blanco temporal y "Otros partidos" espontáneos
      if (p === 'En Blanco') {
        const refVal = (partidosRef && partidosRef['En Blanco']) || 0.81;
        k = vd > 0 ? (refVal / vd) * 0.70 : 0.35;
      } else if (p === 'OTROS') {
        const refOtros = ((partidosRef && partidosRef['OTROS']) || 1.78) + ((partidosRef && partidosRef['PACMA']) || 0.69);
        if (vd > refOtros) {
          k = refOtros / vd;
        }
      }

      const phi = fidelidad[p] !== undefined ? fidelidad[p] : 1.0;
      const baseVal = vd * k * phi;

      // Protección de suelo consistente
      const floorVal = k >= 1.0 ? vd : vd * k;
      estimacionDirectaK[p] = Math.max(floorVal, baseVal);

      if (baseVal < vd * k) {
        masaPerdida[p] = (vd * k) - baseVal;
      }
    }

    // Aplicar Transvases estructurales de masa perdida (cuando phi < 1)
    for (const [origen, masa] of Object.entries(masaPerdida)) {
      if (masa > 0 && transvases[origen]) {
        const destinos = transvases[origen];
        for (const [destino, porcentaje] of Object.entries(destinos)) {
          if (destino in estimacionDirectaK || destino === 'En Blanco') {
            estimacionDirectaK[destino] = (estimacionDirectaK[destino] || 0) + masa * porcentaje;
          }
        }
      }
    }

    // Normalizar Componente 1 a base 100 antes de fusionar con la atribución de Matriz Empírica RV EG23
    const sumaDir = Object.values(estimacionDirectaK).reduce((a, b) => a + b, 0);
    const estimacionRaw = {};
    if (sumaDir > 0) {
      for (const [p, val] of Object.entries(estimacionDirectaK)) {
        estimacionRaw[p] = (val / sumaDir) * 100.0;
      }
    }

    // C. Componente 2: Fusión con Atribución de Matriz de Transferencia Empírica (P19a Simpatía + Indecisos + Ideología/Líderes)
    let modoAtribucion = 'calibracion_k_fidelidad';
    let flujosPonderados = null;

    if (matrizEmpirica && Object.keys(matrizEmpirica).length > 0) {
      modoAtribucion = 'hibrido_k_matriz_rv_eg23_lideres';
      const { normMatriz, flujosPonderados: flujos } = calcularAtribucionMatrizEmpirica(
        matrizEmpirica,
        partidosRef,
        kFactors,
        perfilIdeologicoLideres
      );
      flujosPonderados = flujos;

      // Síntesis profesional Aldabón-Gemini: 65% Voto Directo Calibrado K+Fidelidad + 35% Matriz Empírica P19a/Indecisos/Líderes
      const allParties = new Set([...Object.keys(estimacionRaw), ...Object.keys(normMatriz)]);
      for (const p of allParties) {
        const vDir = estimacionRaw[p] || 0;
        const vMat = normMatriz[p] || vDir;
        estimacionRaw[p] = (vDir * 0.65) + (vMat * 0.35);
      }
    }

    // D. Aplicar Momentum (Λ) con redistribución de pérdidas intrabloque
    const deltas = {};
    for (const [p, base] of Object.entries(estimacionRaw)) {
      const lam = momentum[p] !== undefined ? momentum[p] : 1.0;
      const delta = base * (lam - 1.0);
      deltas[p] = { delta, lam };
    }

    for (const [p, { delta, lam }] of Object.entries(deltas)) {
      if (delta < 0) {
        const perdida = Math.abs(delta);
        estimacionRaw[p] -= perdida;
        const pctAbstencion = calcularPorcentajeAbstencion(lam);
        const pctSector = 1.0 - pctAbstencion;
        estimacionRaw['Abstención'] = (estimacionRaw['Abstención'] || 0) + perdida * pctAbstencion;

        const sectorMapping = matrizSector[p] || MATRIZ_SECTOR_DEFAULT[p];
        if (sectorMapping) {
          for (const [destino, porcentaje] of Object.entries(sectorMapping)) {
            if (destino in estimacionRaw) {
              estimacionRaw[destino] += perdida * pctSector * porcentaje;
            } else if (destino === 'En Blanco') {
              estimacionRaw['En Blanco'] = (estimacionRaw['En Blanco'] || 0) + perdida * pctSector * porcentaje;
            }
          }
        } else {
          estimacionRaw['Abstención'] = (estimacionRaw['Abstención'] || 0) + perdida * pctSector;
        }
      } else if (delta > 0) {
        estimacionRaw[p] += delta;
        if (estimacionRaw['Abstención']) {
          estimacionRaw['Abstención'] = Math.max(0, estimacionRaw['Abstención'] - delta);
        }
      }
    }

    // E. Normalización final a 100.0% sobre Voto Válido (Candidaturas + En Blanco)
    const votoValidoExcluido = new Set(['Abstención', 'Voto Nulo', 'Nulo']);
    const totalValido = Object.entries(estimacionRaw)
      .filter(([k]) => !votoValidoExcluido.has(k))
      .reduce((acc, [, val]) => acc + val, 0);

    if (totalValido <= 0) return {};

    const estimacion = {};
    for (const [p, v] of Object.entries(estimacionRaw)) {
      if (votoValidoExcluido.has(p)) continue;
      estimacion[p] = Math.round((v * 100 / totalValido) * 10) / 10;
    }

    // Ajuste de redondeo en el partido mayoritario para sumar exactamente 100.0%
    const suma = Object.values(estimacion).reduce((a, b) => a + b, 0);
    const diff = Math.round((100.0 - suma) * 10) / 10;
    if (diff !== 0 && Object.keys(estimacion).length > 0) {
      const mayor = Object.keys(estimacion).reduce((a, b) => estimacion[a] > estimacion[b] ? a : b);
      estimacion[mayor] = Math.round((estimacion[mayor] + diff) * 10) / 10;
    }

    // F. Calcular Intervalos de Confianza (95%)
    const { intervalos, deff, nEfectivo } = calcularIntervalosConfianza(estimacion, nMuestra, kFactors);

    return {
      estimacion,
      kFactors,
      recuerdoNormalizado,
      intervalosConfianza: intervalos,
      modoAtribucion,
      flujosPonderados,
      metadatosCalculo: {
        sumRecValido: Math.round(sumRecValido * 100) / 100,
        totalValidoAntesNorm: Math.round(totalValido * 100) / 100,
        deff,
        nEfectivo
      },
      detalles: {
        totalValido,
        estimacionRaw
      }
    };
  }

  return {
    calcular,
    calcularIntervalosConfianza,
    calcularPorcentajeAbstencion,
    MATRIZ_SECTOR_DEFAULT,
    NON_VALID_RECALL_CATS
  };
}));
