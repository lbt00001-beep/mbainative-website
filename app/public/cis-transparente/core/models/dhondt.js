/**
 * Motor Electoral D'Hondt para las 52 Circunscripciones de España
 * ===============================================================
 * Distribuye los 350 escaños del Congreso de los Diputados aplicando:
 * 1. Proyección de swing proporcional provincial sobre la base oficial del 23J (BOE).
 * 2. Barrera legal del 3% sobre voto válido en cada circunscripción (Art. 163 LOREG).
 * 3. Algoritmo de cocientes de la Ley D'Hondt.
 * 4. Horquillas de escaños al 95% de confianza (escenarios límite inferior/superior).
 * 5. Cálculo de bloques parlamentarios y umbral de mayoría absoluta (176 diputados).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DhondtEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const MAYORIA_ABSOLUTA = 176;
  const TOTAL_ESCAÑOS = 350;

  const BLOQUES_DEFAULT = {
    'derecha': ['PP', 'VOX', 'UPN', 'SALF'],
    'izquierda': ['PSOE', 'PSC-PSOE', 'SUMAR', 'PODEMOS'],
    'nacionalistas': ['ERC', 'JUNTS', 'EH BILDU', 'EAJ-PNV', 'BNG', 'CCa']
  };

  /**
   * Ejecuta el reparto D'Hondt para una única circunscripción (Art. 163 LOREG)
   */
  function calcularProvincia(numEscaños, votosOporcentajes, barrera = 3.0) {
    const aptos = {};
    for (const [p, val] of Object.entries(votosOporcentajes)) {
      if (val >= barrera && p !== 'En Blanco' && p !== 'Voto Nulo' && p !== 'OTROS') {
        aptos[p] = val;
      }
    }

    const partidosAptos = Object.keys(aptos);
    if (partidosAptos.length === 0) return { escaños: {} };

    const escaños = {};
    partidosAptos.forEach(p => { escaños[p] = 0; });

    const cocientes = [];
    for (const p of partidosAptos) {
      const v = aptos[p];
      for (let divisor = 1; divisor <= numEscaños; divisor++) {
        cocientes.push({
          partido: p,
          divisor,
          cociente: v / divisor
        });
      }
    }

    cocientes.sort((a, b) => b.cociente - a.cociente);

    for (let i = 0; i < numEscaños && i < cocientes.length; i++) {
      const ganador = cocientes[i].partido;
      escaños[ganador] = (escaños[ganador] || 0) + 1;
    }

    const resultadoLimpio = {};
    for (const [p, count] of Object.entries(escaños)) {
      if (count > 0) resultadoLimpio[p] = count;
    }

    return {
      escaños: resultadoLimpio,
      ultimoCocienteGanador: cocientes[numEscaños - 1]?.cociente || 0
    };
  }

  /**
   * Ejecuta una pasada determinista de los 350 escaños para un vector de estimación nacional.
   */
  function ejecutarRepartoNacional(estimacionNacional, circunscripciones, baseNacional23J) {
    const ratiosSwing = {};
    for (const [p, estVal] of Object.entries(estimacionNacional)) {
      const refVal = baseNacional23J[p] || 0;
      if (refVal > 0) {
        ratiosSwing[p] = estVal / refVal;
      } else {
        ratiosSwing[p] = 0.0;
      }
    }

    const refSumar = baseNacional23J['SUMAR'] || 12.33;
    const refVox = baseNacional23J['VOX'] || 12.38;

    const totalEscaños = {};
    const detalleProvincias = {};

    for (const prov of circunscripciones) {
      const votosProv = {};
      const baseProv = prov.base_23j || {};

      for (const [p, baseVal] of Object.entries(baseProv)) {
        const swingPart = (p === 'PSC-PSOE') ? (ratiosSwing['PSOE'] || 1.0) : (ratiosSwing[p] !== undefined ? ratiosSwing[p] : 1.0);
        votosProv[p] = baseVal * swingPart;
      }

      // Proyección territorial de formaciones sin papeleta separada en el 23J
      if (estimacionNacional['PODEMOS'] > 0 && !votosProv['PODEMOS']) {
        const baseSumarProv = baseProv['SUMAR'] || 8.0;
        votosProv['PODEMOS'] = baseSumarProv * (estimacionNacional['PODEMOS'] / refSumar);
      }
      if (estimacionNacional['SALF'] > 0 && !votosProv['SALF']) {
        const baseVoxProv = baseProv['VOX'] || 10.0;
        votosProv['SALF'] = baseVoxProv * (estimacionNacional['SALF'] / refVox);
      }

      const sumaProv = Object.values(votosProv).reduce((a, b) => a + b, 0);
      if (sumaProv > 0) {
        for (const k of Object.keys(votosProv)) {
          votosProv[k] = (votosProv[k] * 100) / sumaProv;
        }
      }

      const rep = calcularProvincia(prov.escaños, votosProv, 3.0);
      detalleProvincias[prov.nombre] = {
        escaños: rep.escaños,
        votosEstimados: votosProv,
        totalEscañosProvincia: prov.escaños
      };

      for (const [partido, num] of Object.entries(rep.escaños)) {
        const partNormalizado = (partido === 'PSC-PSOE') ? 'PSOE' : partido;
        totalEscaños[partNormalizado] = (totalEscaños[partNormalizado] || 0) + num;
      }
    }

    return { totalEscaños, detalleProvincias };
  }

  /**
   * Simula los 350 escaños en toda España e incluye horquillas al 95% de confianza.
   */
  function simularCongreso(estimacionNacional, circunscripciones, baseNacional23J, intervalosConfianza = null) {
    if (!circunscripciones || !Array.isArray(circunscripciones)) {
      return { totalEscaños: {}, provincias: {} };
    }

    const { totalEscaños, detalleProvincias } = ejecutarRepartoNacional(
      estimacionNacional,
      circunscripciones,
      baseNacional23J
    );

    // Calcular horquillas de escaños (IC 95%) evaluando escenarios de frontera de bloque y partido
    const horquillaEscaños = {};
    const partidosActivos = Object.keys(estimacionNacional).filter(
      p => p !== 'En Blanco' && p !== 'Voto Nulo' && p !== 'OTROS'
    );

    // Escenario A: Bloque derecha en cota superior (95%), izquierda en cota inferior
    // Escenario B: Bloque izquierda en cota superior (95%), derecha en cota inferior
    const estEscenarioDerMax = { ...estimacionNacional };
    const estEscenarioIzqMax = { ...estimacionNacional };
    const setDer = new Set(BLOQUES_DEFAULT.derecha);
    const setIzq = new Set(BLOQUES_DEFAULT.izquierda);

    for (const p of partidosActivos) {
      const margen = intervalosConfianza?.[p]?.margen || Math.max(0.2, Math.sqrt((estimacionNacional[p] || 1) * 0.04));
      if (setDer.has(p)) {
        estEscenarioDerMax[p] = Math.max(0, (estimacionNacional[p] || 0) + margen);
        estEscenarioIzqMax[p] = Math.max(0, (estimacionNacional[p] || 0) - margen);
      } else if (setIzq.has(p)) {
        estEscenarioDerMax[p] = Math.max(0, (estimacionNacional[p] || 0) - margen);
        estEscenarioIzqMax[p] = Math.max(0, (estimacionNacional[p] || 0) + margen);
      }
    }

    const repDerMax = ejecutarRepartoNacional(estEscenarioDerMax, circunscripciones, baseNacional23J).totalEscaños;
    const repIzqMax = ejecutarRepartoNacional(estEscenarioIzqMax, circunscripciones, baseNacional23J).totalEscaños;

    for (const p of Object.keys(totalEscaños)) {
      const c = totalEscaños[p] || 0;
      const v1 = repDerMax[p] || 0;
      const v2 = repIzqMax[p] || 0;
      horquillaEscaños[p] = {
        central: c,
        min: Math.min(c, v1, v2),
        max: Math.max(c, v1, v2)
      };
    }

    const sumarBloque = (mapaEsc, listaPartidos) =>
      listaPartidos.reduce((acc, p) => acc + (mapaEsc[p] || 0), 0);

    const escañosDerecha = sumarBloque(totalEscaños, ['PP', 'VOX', 'UPN', 'SALF']);
    const escañosDerechaMin = Math.min(escañosDerecha, sumarBloque(repIzqMax, ['PP', 'VOX', 'UPN', 'SALF']));
    const escañosDerechaMax = Math.max(escañosDerecha, sumarBloque(repDerMax, ['PP', 'VOX', 'UPN', 'SALF']));

    const escañosIzquierda = sumarBloque(totalEscaños, ['PSOE', 'SUMAR', 'PODEMOS']);
    const escañosIzquierdaMin = Math.min(escañosIzquierda, sumarBloque(repDerMax, ['PSOE', 'SUMAR', 'PODEMOS']));
    const escañosIzquierdaMax = Math.max(escañosIzquierda, sumarBloque(repIzqMax, ['PSOE', 'SUMAR', 'PODEMOS']));

    const escañosNacionalistas = sumarBloque(totalEscaños, ['ERC', 'JUNTS', 'EH BILDU', 'EAJ-PNV', 'BNG', 'CCa']);
    const bloqueInvestidura = escañosIzquierda + escañosNacionalistas;

    return {
      totalEscaños,
      horquillaEscaños,
      bloques: {
        derecha: {
          total: escañosDerecha,
          min: escañosDerechaMin,
          max: escañosDerechaMax,
          mayoria: escañosDerecha >= MAYORIA_ABSOLUTA,
          diferenciaMayoria: escañosDerecha - MAYORIA_ABSOLUTA,
          partidos: {
            'PP': totalEscaños['PP'] || 0,
            'VOX': totalEscaños['VOX'] || 0,
            'UPN': totalEscaños['UPN'] || 0,
            'SALF': totalEscaños['SALF'] || 0
          }
        },
        izquierda: {
          total: escañosIzquierda,
          min: escañosIzquierdaMin,
          max: escañosIzquierdaMax,
          partidos: {
            'PSOE': totalEscaños['PSOE'] || 0,
            'SUMAR': totalEscaños['SUMAR'] || 0,
            'PODEMOS': totalEscaños['PODEMOS'] || 0
          }
        },
        nacionalistas: {
          total: escañosNacionalistas,
          partidos: {
            'ERC': totalEscaños['ERC'] || 0,
            'JUNTS': totalEscaños['JUNTS'] || 0,
            'EH BILDU': totalEscaños['EH BILDU'] || 0,
            'EAJ-PNV': totalEscaños['EAJ-PNV'] || 0,
            'BNG': totalEscaños['BNG'] || 0,
            'CCa': totalEscaños['CCa'] || 0
          }
        },
        bloqueInvestidura: {
          total: bloqueInvestidura,
          min: escañosIzquierdaMin + escañosNacionalistas,
          max: escañosIzquierdaMax + escañosNacionalistas,
          mayoria: bloqueInvestidura >= MAYORIA_ABSOLUTA,
          diferenciaMayoria: bloqueInvestidura - MAYORIA_ABSOLUTA
        }
      },
      detalleProvincias
    };
  }

  return {
    calcularProvincia,
    simularCongreso,
    MAYORIA_ABSOLUTA,
    TOTAL_ESCAÑOS,
    BLOQUES_DEFAULT
  };
}));
