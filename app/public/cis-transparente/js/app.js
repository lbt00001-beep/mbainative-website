/**
 * CIS Abierto & Transparente — Aplicación Interactiva de Auditoría Demoscópica
 * Conecta los modelos matemáticos Aldabón-Gemini (Factor K sobre voto válido),
 * Matriz Empírica RV EG23 Calibrada por Urnas 23J y D'Hondt Provincial con IC 95%.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let studies = [];
  let provincesConfig = null;
  let census2023 = null;
  let activeStudy = null;
  let currentModel = 'aldabon'; // 'aldabon' | 'transfer'
  let momentumState = {};
  let comparisonChart = null;

  const PARTY_COLORS = {
    'PP': '#0056A4',
    'PSOE': '#E30613',
    'PSC-PSOE': '#E30613',
    'VOX': '#63BE21',
    'SUMAR': '#E51C55',
    'PODEMOS': '#672F6C',
    'SALF': '#800080',
    'ERC': '#FFB232',
    'JUNTS': '#00C3B2',
    'EH BILDU': '#00A59A',
    'EAJ-PNV': '#008000',
    'BNG': '#76B3DD',
    'CCa': '#FFD700',
    'UPN': '#003399',
    'UPL': '#990033',
    'CHA': '#B22222',
    'TERUEL EXISTE': '#2E8B57',
    'PAR': '#DAA520',
    'Soria Ya': '#4B0082',
    'Por Ávila': '#FF8C00',
    'OTROS': '#888888',
    'En Blanco': '#CCCCCC',
    'Voto Nulo': '#999999',
    'Abstención': '#555555'
  };

  function getPartyColor(party) {
    return PARTY_COLORS[party] || '#6c757d';
  }

  // 1. Cargar datos base desde /data (con marca temporal anti-caché)
  try {
    const cb = `?v=${Date.now()}`;
    const [studiesRes, provRes, censusRes] = await Promise.all([
      fetch(`data/studies.json${cb}`).then(r => r.json()),
      fetch(`data/provinces_config.json${cb}`).then(r => r.json()),
      fetch(`data/census_2023.json${cb}`).then(r => r.json())
    ]);

    studies = studiesRes;
    provincesConfig = provRes;
    census2023 = censusRes;

    initApp();
  } catch (err) {
    console.error('Error cargando datos:', err);
  }

  function initApp() {
    renderStudyList();
    setupTabNavigation();
    setupModelSelector();
    setupMobileToggle();

    const defaultStudy = studies.find(s => s.id === '3582') ||
                         studies.find(s => s.type === 'AvanceGenerales' || s.type === 'BarometroNacional') ||
                         studies[0];
    if (defaultStudy) {
      selectStudy(defaultStudy.id);
    }
  }

  function renderStudyList() {
    const listEl = document.getElementById('study-list');
    listEl.innerHTML = '';

    studies.forEach(study => {
      const item = document.createElement('div');
      item.className = 'study-item';
      item.id = `study-item-${study.id}`;
      item.onclick = () => selectStudy(study.id);

      const isNacional = study.type === 'AvanceGenerales' || study.type === 'BarometroNacional';
      const badgeClass = isNacional ? 'badge-nacional' : 'badge-autonomica';
      const badgeText = isNacional ? 'General' : 'Autonómica';
      const verifIcon = study.ficha?.verificado ? '✅' : 'ℹ️';

      item.innerHTML = `
        <div>
          <div class="study-name">${verifIcon} ${study.name}</div>
          <div class="study-meta">Estudio ${study.id} · ${study.ficha?.campo || ''}</div>
        </div>
        <span class="study-badge ${badgeClass}">${badgeText}</span>
      `;
      listEl.appendChild(item);
    });
  }

  function selectStudy(studyId) {
    activeStudy = studies.find(s => s.id === studyId);
    if (!activeStudy) return;

    document.querySelectorAll('.study-item').forEach(el => el.classList.remove('active'));
    const currentItem = document.getElementById(`study-item-${studyId}`);
    if (currentItem) currentItem.classList.add('active');

    momentumState = {};
    (activeStudy.mainParties || Object.keys(activeStudy.votoDirecto || {})).forEach(p => {
      momentumState[p] = 1.0;
    });

    renderFichaTecnica();
    renderAllViews();
  }

  function renderFichaTecnica() {
    const fichaSection = document.getElementById('ficha-section');
    const fichaCard = document.getElementById('ficha-card');
    fichaSection.style.display = 'block';

    const f = activeStudy.ficha || {};
    const archivos = (f.archivosOficiales && f.archivosOficiales.length > 0)
      ? f.archivosOficiales.slice(0, 3).join(', ')
      : activeStudy.filename;

    fichaCard.innerHTML = `
      <div class="ficha-row"><span class="ficha-label">Referencia</span><span class="ficha-val">${f.referencia || activeStudy.id}</span></div>
      <div class="ficha-row"><span class="ficha-label">Muestra (N)</span><span class="ficha-val">${f.n || '4.000 entrevistas'}</span></div>
      <div class="ficha-row"><span class="ficha-label">Error Muestral</span><span class="ficha-val">${f.errorMuestral || '±1,5%'}</span></div>
      <div class="ficha-row"><span class="ficha-label">Trabajo de Campo</span><span class="ficha-val">${f.campo || 'N/A'}</span></div>
      <div class="ficha-row"><span class="ficha-label">Ámbito</span><span class="ficha-val">${f.ambito || 'Nacional'}</span></div>
      <div class="ficha-row"><span class="ficha-label">Fuentes Raw</span><span class="ficha-val" style="font-size:.72rem;color:var(--green)">${archivos}</span></div>
      <div class="ficha-row"><span class="ficha-label">Garantía Legal</span><span class="ficha-val" style="font-size:.72rem">${f.cumplimientoLOREG || 'Art. 69 LOREG'}</span></div>
    `;
  }

  function calculateActiveEstimations() {
    if (!activeStudy) return null;

    const base23J = {};
    if (census2023 && census2023.partidos) {
      for (const [p, d] of Object.entries(census2023.partidos)) {
        base23J[p] = d.porcentaje;
      }
    }

    const nMuestra = activeStudy.ficha?.n_num || 4000;
    const refPartidos = activeStudy.partidosReferencia || base23J;

    let estimacionTransparente = {};
    let factoresK = {};
    let recuerdoNormalizado = {};
    let intervalosConfianza = {};
    let metadatosCalculo = {};
    let modoMatriz = null;
    let flujosPonderados = null;

    if (currentModel === 'aldabon' && typeof AldabonEngine !== 'undefined') {
      const res = AldabonEngine.calcular(
        activeStudy.votoDirecto,
        activeStudy.recuerdo,
        refPartidos,
        activeStudy.fidelidad || {},
        momentumState,
        activeStudy.transvases || {},
        undefined,
        { nMuestra }
      );
      estimacionTransparente = res.estimacion || {};
      factoresK = res.kFactors || {};
      recuerdoNormalizado = res.recuerdoNormalizado || {};
      intervalosConfianza = res.intervalosConfianza || {};
      metadatosCalculo = res.metadatosCalculo || {};
    } else if (typeof TransferMatrixEngine !== 'undefined') {
      const res = TransferMatrixEngine.calcular(
        activeStudy.votoDirecto,
        activeStudy.recuerdo,
        refPartidos,
        {},
        {
          nMuestra,
          matrizP19a: activeStudy.matrizP19a || null,
          matrizP17R: activeStudy.matrizP17R || null,
          momentum: momentumState
        }
      );
      estimacionTransparente = res.estimacion || {};
      factoresK = res.factoresCalibracion || {};
      recuerdoNormalizado = res.recuerdoNormalizado || {};
      intervalosConfianza = res.intervalosConfianza || {};
      metadatosCalculo = res.metadatosCalculo || {};
      modoMatriz = res.modoMatriz;
      flujosPonderados = res.flujosPonderados;
    }

    // Proyección de escaños con D'Hondt 52 Provincias e intervalos de confianza
    let escañosCongreso = null;
    const isNacional = activeStudy.type === 'AvanceGenerales' || activeStudy.type === 'BarometroNacional';
    if (isNacional && provincesConfig && typeof DhondtEngine !== 'undefined') {
      escañosCongreso = DhondtEngine.simularCongreso(
        estimacionTransparente,
        provincesConfig.circunscripciones,
        base23J,
        intervalosConfianza
      );
    }

    // Auditoría Demoscópica de Desviaciones
    let auditoria = null;
    if (typeof TezanosAuditEngine !== 'undefined') {
      auditoria = TezanosAuditEngine.auditarEstudio(
        activeStudy.votoDirecto,
        activeStudy.estimacionCIS,
        estimacionTransparente,
        factoresK
      );
    }

    return {
      votoDirecto: activeStudy.votoDirecto,
      estimacionCIS: activeStudy.estimacionCIS,
      margenErrorCIS: activeStudy.margenError || {},
      estimacionTransparente,
      factoresK,
      recuerdoNormalizado,
      intervalosConfianza,
      metadatosCalculo,
      modoMatriz,
      flujosPonderados,
      escañosCongreso,
      auditoria,
      isNacional
    };
  }

  function renderAllViews() {
    const data = calculateActiveEstimations();
    if (!data) return;

    renderMetricsTop(data);
    renderComparisonTable(data);
    renderComparisonChart(data);
    renderCongressHemiciclo(data);
    renderMomentumControls(data);
    renderForensicAudit(data);
    renderMicrodataView(data);
  }

  // Banner dinámico 100% calculado a partir de los datos del estudio activo
  function renderMetricsTop(data) {
    const bannerEl = document.getElementById('forensic-banner');
    if (bannerEl) {
      const kPP = data.factoresK['PP'] ? Math.round(data.factoresK['PP'] * 100) / 100 : null;
      const kPSOE = data.factoresK['PSOE'] ? Math.round(data.factoresK['PSOE'] * 100) / 100 : null;
      const recValPP = data.recuerdoNormalizado['PP'] || activeStudy.recuerdo?.['PP'] || 0;
      const recValPSOE = data.recuerdoNormalizado['PSOE'] || activeStudy.recuerdo?.['PSOE'] || 0;
      const refPP = activeStudy.partidosReferencia?.['PP'] || 33.06;
      const refPSOE = activeStudy.partidosReferencia?.['PSOE'] || 31.68;

      const cisPSOE = data.estimacionCIS['PSOE'] || 0;
      const cisPP = data.estimacionCIS['PP'] || 0;
      const brechaCIS = Math.round((cisPSOE - cisPP) * 10) / 10;

      const estPP = data.estimacionTransparente['PP'] || 0;
      const estPSOE = data.estimacionTransparente['PSOE'] || 0;

      if (kPP && kPP >= 1.25) {
        bannerEl.style.display = 'block';
        const muestraTotalNote = activeStudy.recuerdoMuestraTotal
          ? ` (${activeStudy.recuerdoMuestraTotal['PP']}% vs ${activeStudy.recuerdoMuestraTotal['PSOE']}% sobre el total de N=${activeStudy.ficha?.n_num || 5025} entrevistas)`
          : '';
        const escañosNote = data.escañosCongreso
          ? ` En la proyección D'Hondt por las 52 circunscripciones, el bloque de centro-derecha alcanza <strong>${data.escañosCongreso.bloques.derecha.total} escaños</strong> (IC 95%: ${data.escañosCongreso.bloques.derecha.min}–${data.escañosCongreso.bloques.derecha.max}).`
          : '';

        bannerEl.innerHTML = `
          <div style="display:flex;align-items:flex-start;gap:14px">
            <span style="font-size:1.6rem">📐</span>
            <div>
              <strong style="color:var(--red);font-size:.98rem;display:block;margin-bottom:4px">
                DIAGNÓSTICO METODOLÓGICO (${activeStudy.name} — Estudio ${activeStudy.id}): Desequilibrio de Recuerdo Declarado (${recValPSOE}% PSOE vs ${recValPP}% PP sobre voto válido)
              </strong>
              <div style="font-size:.85rem;line-height:1.55;color:var(--text)">
                En los ficheros oficiales de este estudio, el recuerdo de voto válido de las elecciones de referencia presenta un <strong>${recValPSOE}%</strong> para el PSOE frente a un <strong>${recValPP}%</strong> para el PP${muestraTotalNote}, cuando el resultado real certificado por la Junta Electoral fue de <strong>${refPP}% PP</strong> y <strong>${refPSOE}% PSOE</strong>.
                Ya se deba a sobrerrepresentación muestral o a <strong>voto oculto / pudor declarativo</strong> del electorado conservador (o a la combinación de ambos), no aplicar el factor corrector (<strong>K_PP = ${kPP}x</strong>, <strong>K_PSOE = ${kPSOE}x</strong>) hace que la estimación oficial del CIS otorgue <strong>${brechaCIS > 0 ? '+' + brechaCIS : brechaCIS} puntos al PSOE (${cisPSOE}% vs ${cisPP}%)</strong>, mientras que la calibración sitúa a <strong>PP en ${estPP}%</strong> y a <strong>PSOE en ${estPSOE}%</strong>.${escañosNote}
              </div>
            </div>
          </div>
        `;
      } else {
        bannerEl.style.display = 'none';
      }
    }

    const metricsRow = document.getElementById('metrics-row');
    if (!metricsRow) return;

    const est = data.estimacionTransparente;
    const cis = data.estimacionCIS;
    const topParty = Object.keys(est).reduce((a, b) => est[a] > est[b] ? a : b, 'PP');
    const cisTopParty = Object.keys(cis).reduce((a, b) => cis[a] > cis[b] ? a : b, 'PSOE');
    const icTop = data.intervalosConfianza?.[topParty];
    const icStr = icTop ? `±${icTop.margen}%` : '';

    const idt = data.auditoria?.indiceDistorsionTezanos || 0;
    const infladoPSOE = data.auditoria?.infladoPSOE || 0;

    let escañosTexto = 'Ámbito Autonómico';
    let mayoriaTexto = 'Simulación 350 escaños activa en estudios nacionales';
    if (data.escañosCongreso) {
      const bloqDer = data.escañosCongreso.bloques.derecha;
      escañosTexto = `${bloqDer.total} dip. (${bloqDer.min}–${bloqDer.max})`;
      mayoriaTexto = bloqDer.mayoria
        ? `✅ Bloque Derecha supera mayoría absoluta (176)`
        : `A ${Math.abs(bloqDer.diferenciaMayoria)} escaños de la mayoría absoluta`;
    }

    const modelLabel = currentModel === 'aldabon'
      ? 'Aldabón-Gemini (Factor K)'
      : (data.modoMatriz === 'empirica_rv_eg23' ? 'Matriz Empírica RV EG23' : 'Matriz Calibrada 23J');

    metricsRow.innerHTML = `
      <div class="metric-card card-success">
        <div class="metric-title">1ª Fuerza Estimada (Calibrada)</div>
        <div class="metric-val" style="color:${getPartyColor(topParty)}">${topParty} ${est[topParty] || 0}% <span style="font-size:.85rem;font-weight:500;color:var(--text2)">${icStr}</span></div>
        <div class="metric-sub">Estimación oficial CIS: <strong>${cisTopParty} (${cis[cisTopParty]}%)</strong></div>
      </div>

      <div class="metric-card ${idt > 2.0 ? 'card-danger' : 'card-warning'}">
        <div class="metric-title">Desviación Sistemática (RMSE / IDT)</div>
        <div class="metric-val">${idt} ptos</div>
        <div class="metric-sub">${data.auditoria?.diagnostico || 'Evaluado'} (Diferencial PSOE: ${infladoPSOE > 0 ? '+' : ''}${infladoPSOE} ptos)</div>
      </div>

      <div class="metric-card">
        <div class="metric-title">Proyección D'Hondt (IC 95%)</div>
        <div class="metric-val">${escañosTexto}</div>
        <div class="metric-sub">${mayoriaTexto}</div>
      </div>

      <div class="metric-card">
        <div class="metric-title">Motor Demoscópico Activo</div>
        <div class="metric-val" style="font-size:1.15rem;margin-top:6px">${modelLabel}</div>
        <div class="metric-sub">N efectivo: ${data.metadatosCalculo?.nEfectivo || 3000} · deff: ${data.metadatosCalculo?.deff || 1.2}</div>
      </div>
    `;
  }

  // Tabla comparativa con Intervalos de Confianza al 95%
  function renderComparisonTable(data) {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const parties = Object.keys(data.estimacionTransparente).sort(
      (a, b) => data.estimacionTransparente[b] - data.estimacionTransparente[a]
    );

    parties.forEach(p => {
      const meCIS = data.margenErrorCIS[p] ? ` <span style="font-size:.75rem;color:var(--text3)">(±${data.margenErrorCIS[p]}%)</span>` : '';
      const vd = data.votoDirecto[p] !== undefined ? `${data.votoDirecto[p]}%${meCIS}` : '-';
      const cisVal = data.estimacionCIS[p] !== undefined ? `${data.estimacionCIS[p]}%` : '-';
      const transVal = data.estimacionTransparente[p] !== undefined ? `${data.estimacionTransparente[p]}%` : '-';

      const ic = data.intervalosConfianza?.[p];
      const icHtml = ic
        ? `<span style="font-family:monospace;font-size:.82rem;color:var(--text2)">[${ic.min}% – ${ic.max}%] (±${ic.margen})</span>`
        : '-';

      let diffHtml = '-';
      if (data.estimacionCIS[p] !== undefined && data.estimacionTransparente[p] !== undefined) {
        const diff = Math.round((data.estimacionTransparente[p] - data.estimacionCIS[p]) * 10) / 10;
        const diffClass = diff > 0 ? 'diff-positive' : (diff < 0 ? 'diff-negative' : '');
        const sign = diff > 0 ? '+' : '';
        diffHtml = `<span class="${diffClass}">${sign}${diff} ptos</span>`;
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="party-badge">
            <span class="party-dot" style="background:${getPartyColor(p)}"></span>
            ${p}
          </div>
        </td>
        <td><strong>${vd}</strong></td>
        <td>${cisVal}</td>
        <td><strong style="color:var(--accent)">${transVal}</strong></td>
        <td>${icHtml}</td>
        <td>${diffHtml}</td>
      `;
      tbody.appendChild(row);
    });
  }

  // Gráfico comparativo de barras Chart.js
  function renderComparisonChart(data) {
    const canvas = document.getElementById('comparison-chart');
    if (!canvas) return;

    const parties = Object.keys(data.estimacionTransparente)
      .filter(p => (data.estimacionTransparente[p] || 0) >= 0.8 && p !== 'OTROS')
      .sort((a, b) => data.estimacionTransparente[b] - data.estimacionTransparente[a]);

    const vdData = parties.map(p => data.votoDirecto[p] || 0);
    const cisData = parties.map(p => data.estimacionCIS[p] || 0);
    const transData = parties.map(p => data.estimacionTransparente[p] || 0);

    if (comparisonChart) {
      comparisonChart.destroy();
    }

    comparisonChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: parties,
        datasets: [
          {
            label: 'Voto Directo en Encuesta (% Censo)',
            data: vdData,
            backgroundColor: 'rgba(154, 160, 180, 0.45)',
            borderColor: 'rgba(154, 160, 180, 0.8)',
            borderWidth: 1
          },
          {
            label: 'Estimación Oficial CIS (% Voto Válido)',
            data: cisData,
            backgroundColor: 'rgba(239, 83, 80, 0.65)',
            borderColor: 'rgba(239, 83, 80, 1)',
            borderWidth: 1
          },
          {
            label: 'Estimación Calibrada Transparente (% Voto Válido)',
            data: transData,
            backgroundColor: parties.map(p => getPartyColor(p)),
            borderColor: '#ffffff',
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#e8eaed', font: { family: 'Inter', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const party = parties[ctx.dataIndex];
                const ic = data.intervalosConfianza?.[party];
                if (ctx.datasetIndex === 2 && ic) {
                  return ` ${ctx.dataset.label}: ${ctx.raw}% (IC 95%: ${ic.min}%–${ic.max}%)`;
                }
                return ` ${ctx.dataset.label}: ${ctx.raw}%`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9aa0b4', font: { family: 'Inter', weight: 'bold' } },
            grid: { color: 'rgba(45, 50, 72, 0.5)' }
          },
          y: {
            ticks: { color: '#9aa0b4', callback: v => `${v}%` },
            grid: { color: 'rgba(45, 50, 72, 0.5)' }
          }
        }
      }
    });
  }

  // Hemiciclo y Simulación del Congreso de los Diputados (350 Escaños D'Hondt con Horquillas IC 95%)
  function renderCongressHemiciclo(data) {
    const congresoContainer = document.getElementById('congress-container');
    if (!congresoContainer) return;

    if (!data.isNacional || !data.escañosCongreso) {
      congresoContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏛️</div>
          <h3>Simulación de 350 Escaños reservada a Estudios de Ámbito Nacional</h3>
          <p>El estudio seleccionado (${activeStudy.name}) corresponde a ámbito autonómico. Selecciona un Barómetro Nacional en el panel lateral para ejecutar la proyección D'Hondt en las 52 circunscripciones.</p>
        </div>
      `;
      return;
    }

    const res = data.escañosCongreso;
    const escaños = res.totalEscaños;
    const horquillas = res.horquillaEscaños || {};
    const der = res.bloques.derecha;
    const izq = res.bloques.izquierda;
    const nac = res.bloques.nacionalistas;

    const derPct = (der.total / 350) * 100;
    const izqPct = (izq.total / 350) * 100;
    const nacPct = (nac.total / 350) * 100;

    const partyCardsHtml = Object.entries(escaños)
      .sort((a, b) => b[1] - a[1])
      .map(([p, count]) => {
        const h = horquillas[p];
        const rangeTxt = (h && h.min !== h.max) ? `Horquilla IC 95%: ${h.min}–${h.max} escaños` : `Escaños fijos: ${count}`;
        return `
          <div class="metric-card" style="padding:12px 14px;border-left:4px solid ${getPartyColor(p)}">
            <div class="metric-title">${p}</div>
            <div class="metric-val" style="font-size:1.6rem;color:${getPartyColor(p)}">${count} <span style="font-size:.8rem;color:var(--text3)">diputados</span></div>
            <div class="metric-sub">${data.estimacionTransparente[p] || 0}% voto · <strong>${rangeTxt}</strong></div>
          </div>
        `;
      }).join('');

    congresoContainer.innerHTML = `
      <!-- Majority Track Bar -->
      <div class="majority-bar-container">
        <div class="majority-bar-header">
          <span><strong>Bloque Centro-Derecha (PP + VOX + UPN + SALF):</strong> ${der.total} escaños (IC 95%: ${der.min}–${der.max}) · ${der.mayoria ? '✅ Mayoría Absoluta' : 'A ' + Math.abs(der.diferenciaMayoria) + ' de la mayoría'}</span>
          <span><strong>Bloque Investidura (PSOE + SUMAR + PODEMOS + Nac.):</strong> ${res.bloques.bloqueInvestidura.total} escaños (IC 95%: ${res.bloques.bloqueInvestidura.min}–${res.bloques.bloqueInvestidura.max})</span>
        </div>
        <div class="majority-track">
          <div class="majority-threshold-line"></div>
          <span class="majority-threshold-label">176 MAYORÍA</span>
          <div class="majority-segment" style="width:${derPct}%;background:#0056A4">
            ${der.total >= 40 ? `Derecha: ${der.total} (${der.min}–${der.max})` : der.total}
          </div>
          <div class="majority-segment" style="width:${izqPct}%;background:#E30613">
            ${izq.total >= 40 ? `Izquierda: ${izq.total} (${izq.min}–${izq.max})` : izq.total}
          </div>
          <div class="majority-segment" style="width:${nacPct}%;background:#00A59A">
            ${nac.total >= 20 ? `Nac.: ${nac.total}` : nac.total}
          </div>
        </div>
      </div>

      <!-- Grid de escaños por partido -->
      <div class="metrics-row" style="margin-bottom:24px">
        ${partyCardsHtml}
      </div>

      <!-- Desglose por las 52 provincias -->
      <div class="table-section">
        <h2>📍 Reparto D'Hondt en las 52 Circunscripciones Provinciales (Art. 163 LOREG, Barrera 3%)</h2>
        <div class="table-wrap" style="max-height:420px;overflow-y:auto">
          <table>
            <thead>
              <tr>
                <th>Circunscripción</th>
                <th>Escaños Totales</th>
                <th>Reparto de Escaños Asignados</th>
                <th>1ª Fuerza Provincial Estimada</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(res.detalleProvincias).map(([nombreProv, info]) => {
                const repartoStr = Object.entries(info.escaños)
                  .map(([part, n]) => `<span style="display:inline-block;margin-right:8px;padding:2px 6px;border-radius:4px;background:var(--surface2);font-weight:600"><span style="color:${getPartyColor(part)}">${part}</span>: ${n}</span>`)
                  .join('');

                const topP = Object.keys(info.votosEstimados).reduce((a, b) => (info.votosEstimados[a] || 0) > (info.votosEstimados[b] || 0) ? a : b, 'PP');

                return `
                  <tr>
                    <td><strong>${nombreProv}</strong></td>
                    <td>${info.totalEscañosProvincia}</td>
                    <td>${repartoStr || '<span style="color:var(--text3)">Sin asignación</span>'}</td>
                    <td><span class="party-badge"><span class="party-dot" style="background:${getPartyColor(topP)}"></span>${topP} (${Math.round((info.votosEstimados[topP] || 0) * 10) / 10}%)</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Simulador de Coyuntura (Momentum)
  function renderMomentumControls(data) {
    const grid = document.getElementById('momentum-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const parties = activeStudy.mainParties || Object.keys(data.estimacionTransparente).slice(0, 8);

    parties.forEach(p => {
      const val = momentumState[p] !== undefined ? momentumState[p] : 1.0;
      const item = document.createElement('div');
      item.className = 'momentum-item';
      item.innerHTML = `
        <div class="momentum-top">
          <span class="party-badge"><span class="party-dot" style="background:${getPartyColor(p)}"></span>${p}</span>
          <span id="momentum-val-${p}" style="font-weight:700;color:var(--accent)">${val.toFixed(2)}x</span>
        </div>
        <input type="range" class="momentum-slider" min="0.70" max="1.30" step="0.01" value="${val}" id="slider-${p}">
        <div class="momentum-scale">
          <span>0.70x (Desgaste)</span>
          <span>1.00x (Neutro)</span>
          <span>1.30x (Movilización)</span>
        </div>
      `;

      const slider = item.querySelector(`#slider-${p}`);
      slider.oninput = (e) => {
        const newVal = parseFloat(e.target.value);
        momentumState[p] = newVal;
        document.getElementById(`momentum-val-${p}`).textContent = `${newVal.toFixed(2)}x`;
        renderAllViews();
      };

      grid.appendChild(item);
    });
  }

  // Evaluación de Sesgo Sistemático y Backtesting Histórico
  function renderForensicAudit(data) {
    const auditContainer = document.getElementById('audit-container');
    if (!auditContainer) return;

    const hist = (typeof TezanosAuditEngine !== 'undefined') ? TezanosAuditEngine.getHistorico() : [];
    const glob = (typeof TezanosAuditEngine !== 'undefined') ? TezanosAuditEngine.getMetricasGlobales() : null;
    const aud = data.auditoria;
    const m3582 = glob?.estudioOctubre3582?.matricesTransferencia;

    auditContainer.innerHTML = `
      <div class="metrics-row" style="margin-bottom:20px">
        <div class="metric-card card-danger">
          <div class="metric-title">Frecuencia de Sobreestimación Histórica</div>
          <div class="metric-val" style="color:var(--red)">${glob?.eleccionesSobreestimandoIzquierda || 43} de ${glob?.totalEleccionesAnalizadas || 44}</div>
          <div class="metric-sub">Comicios desde 2018 donde el CIS sobreestimó a la izquierda (<strong>${glob?.porcentajeSesgoIzquierda || 97.7}%</strong> · Fuente: <em>El País</em>)</div>
        </div>

        <div class="metric-card card-warning">
          <div class="metric-title">Desviación Media en Urnas</div>
          <div class="metric-val">~${glob?.desviacionMediaPuntos || 4.8} ptos</div>
          <div class="metric-sub">Error sistemático medio a favor del bloque gubernamental respecto al resultado BOE</div>
        </div>

        <div class="metric-card">
          <div class="metric-title">Divergencia CIS vs. Consenso Demoscópico</div>
          <div class="metric-val" style="color:var(--accent)">${glob?.estudioOctubre3582?.brechaDiscrepanciaBloques || 16.1} ptos</div>
          <div class="metric-sub">Promedio sondeos / 40dB. otorga +14,0 ptos a la derecha; el CIS otorga +2,1 ptos a la izquierda</div>
        </div>
      </div>

      <div class="audit-grid">
        <div class="audit-card">
          <h3>📉 Diagnóstico Estadístico del Estudio Activo (${activeStudy.name})</h3>
          <ul class="audit-list">
            <li><span>Error Cuadrático Medio (RMSE / IDT):</span> <strong>${aud?.indiceDistorsionTezanos || 0} puntos</strong></li>
            <li><span>Diferencial PSOE (CIS − Calibrado):</span> <strong style="color:var(--red)">${(aud?.infladoPSOE || 0) > 0 ? '+' : ''}${aud?.infladoPSOE || 0} ptos</strong></li>
            <li><span>Diferencial PP (Calibrado − CIS):</span> <strong style="color:var(--green)">-${aud?.deflacionPP || 0} ptos</strong></li>
            <li><span>Diferencial VOX (Calibrado − CIS):</span> <strong style="color:var(--green)">-${aud?.deflacionVOX || 0} ptos</strong></li>
            <li><span>Desviación neta acumulada de bloque:</span> <strong>${aud?.distorsionBloques || 0} puntos</strong></li>
          </ul>
        </div>

        <div class="audit-card">
          <h3>🔬 Verificación en Hoja Oficial 'RV EG23' (Estudio 3582/0, N=5.025)</h3>
          <p style="font-size:.83rem;color:var(--text2);margin-bottom:10px">
            Tasas extraídas directamente de las tablas de cruce oficiales del CIS (P17R y P19a):
          </p>
          <ul class="audit-list">
            <li><span>Retención Voto Directo (P17R):</span> <strong>PSOE ${m3582?.psoe.retencionVotoDirecto || 63.63}% vs PP ${m3582?.pp.retencionVotoDirecto || 62.66}%</strong></li>
            <li><span>Retención Voto+Simpatía (P19a):</span> <strong>PSOE ${m3582?.psoe.retencionVotoSimpatia || 70.31}% vs PP ${m3582?.pp.retencionVotoSimpatia || 69.98}%</strong></li>
            <li><span>Bolsa de Indecisión (P17R NS+NC):</span> <strong>PSOE ${m3582?.psoe.indecision || 15.12}% vs PP ${m3582?.pp.indecision || 15.69}%</strong></li>
            <li><span>Causa demostrada del diferencial:</span> <span style="color:var(--accent);text-align:right">${m3582?.conclusionMatematica || ''}</span></li>
          </ul>
        </div>
      </div>

      <!-- Backtesting histórico verificado contra BOE -->
      <div class="table-section">
        <h2>📜 Backtesting Histórico: Estimación Preelectoral CIS vs. Resultados Oficiales (BOE)</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Proceso Electoral</th>
                <th>Referencia Documental</th>
                <th>CIS PSOE</th>
                <th>BOE PSOE</th>
                <th>Error PSOE</th>
                <th>CIS PP</th>
                <th>BOE PP</th>
                <th>Error PP</th>
                <th>1ª Fuerza CIS</th>
                <th>1ª Fuerza BOE</th>
              </tr>
            </thead>
            <tbody>
              ${hist.map(h => `
                <tr>
                  <td><strong>${h.eleccion}</strong><div style="font-size:.73rem;color:var(--text3)">${h.fecha}</div></td>
                  <td style="font-size:.76rem;color:var(--text2)">${h.fuenteCIS}<br><span style="color:var(--text3)">${h.fuenteBOE}</span></td>
                  <td>${h.cis_psoe}%</td>
                  <td>${h.real_psoe}%</td>
                  <td><strong style="color:var(--red)">+${h.desviacion_psoe} ptos</strong></td>
                  <td>${h.cis_pp}%</td>
                  <td>${h.real_pp}%</td>
                  <td><strong style="color:var(--green)">${h.desviacion_pp} ptos</strong></td>
                  <td><span style="color:var(--red);font-weight:600">${h.ganador_cis}</span></td>
                  <td><span style="color:var(--green);font-weight:600">${h.ganador_real}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Vista de Cruces Oficiales RV EG23 y Factores K
  function renderMicrodataView(data) {
    const microContainer = document.getElementById('microdata-container');
    if (!microContainer) return;

    const hasTotalSampleRecall = Boolean(activeStudy.recuerdoMuestraTotal);

    // 1. Tabla de Factores K
    const kRowsHtml = Object.entries(data.factoresK).map(([p, kVal]) => {
      const kRounded = Math.round(kVal * 100) / 100;
      const recMuestra = activeStudy.recuerdoMuestraTotal?.[p] !== undefined
        ? `${activeStudy.recuerdoMuestraTotal[p]}% <span style="font-size:.74rem;color:var(--text3)">(N=${activeStudy.recuerdoN?.[p] || '-'})</span>`
        : '-';
      const recValido = data.recuerdoNormalizado?.[p] !== undefined
        ? `${data.recuerdoNormalizado[p]}%`
        : (activeStudy.recuerdo?.[p] !== undefined ? `${activeStudy.recuerdo[p]}%` : '-');
      const refReal = activeStudy.partidosReferencia?.[p] !== undefined
        ? `${activeStudy.partidosReferencia[p]}%`
        : '-';

      let interp = 'Equilibrio declarativo (0,90 ≤ K ≤ 1,10)';
      if (kRounded > 1.15) interp = '<span style="color:var(--green)">Infrarrepresentado o voto oculto por pudor (requiere K > 1)</span>';
      else if (kRounded > 1.05) interp = '<span style="color:var(--accent)">Ligera infrarrepresentación / voto oculto leve</span>';
      else if (kRounded < 0.90) interp = '<span style="color:var(--red)">Sobrerrepresentado o sobredeclarado por deseabilidad social (requiere K < 1)</span>';

      return `
        <tr>
          <td><span class="party-badge"><span class="party-dot" style="background:${getPartyColor(p)}"></span>${p}</span></td>
          ${hasTotalSampleRecall ? `<td>${recMuestra}</td>` : ''}
          <td><strong>${recValido}</strong></td>
          <td><strong>${refReal}</strong></td>
          <td><strong style="color:var(--accent)">${kRounded}x</strong></td>
          <td>${interp}</td>
        </tr>
      `;
    }).join('');

    // 2. Matriz de Transferencia Empírica P19a / P17R (si el estudio dispone de la hoja RV EG23)
    let matrizHtml = '';
    if (activeStudy.matrizP19a && activeStudy.matrizP17R) {
      const origCols = ['PP', 'PSOE', 'VOX', 'SUMAR', 'ERC', 'JUNTS', 'EH BILDU', 'EAJ-PNV', 'BNG', 'No votó', 'No tenía edad'];
      const destRows = ['PP', 'PSOE', 'VOX', 'SUMAR', 'PODEMOS', 'SALF', 'ERC', 'JUNTS', 'EH BILDU', 'EAJ-PNV', 'BNG', 'OTROS', 'En Blanco', 'Abstención', 'No Sabe', 'Ninguno'];

      const buildMatrixTable = (matrizObj, title, subtitle) => {
        const rowsHtml = destRows
          .filter(d => matrizObj[d])
          .map(dest => {
            const cells = origCols.map(orig => {
              const val = matrizObj[dest]?.[orig] ?? 0;
              const isDiag = dest === orig && val > 25;
              const isHighFlow = !isDiag && val >= 8.0 && !['No Sabe', 'Ninguno', 'Abstención'].includes(dest);
              const style = isDiag
                ? 'background:rgba(59,130,246,0.22);font-weight:700;color:#fff'
                : (isHighFlow ? 'background:rgba(245,158,11,0.18);font-weight:600;color:var(--accent)' : '');
              return `<td style="text-align:right;${style}">${val.toFixed(1)}%</td>`;
            }).join('');
            return `
              <tr>
                <td><span class="party-badge"><span class="party-dot" style="background:${getPartyColor(dest)}"></span>${dest}</span></td>
                ${cells}
              </tr>
            `;
          }).join('');

        const nRowCells = origCols.map(orig => {
          const nVal = activeStudy.recuerdoN?.[orig];
          return `<td style="text-align:right;font-size:.76rem;color:var(--text3)">${nVal !== undefined ? Math.round(nVal) : '-'}</td>`;
        }).join('');

        return `
          <div class="table-section" style="margin-top:24px">
            <h2>${title}</h2>
            <p style="font-size:.84rem;color:var(--text2);margin-bottom:14px">${subtitle}</p>
            <div class="table-wrap" style="overflow-x:auto">
              <table>
                <thead>
                  <tr>
                    <th>Destino Actual ↓ \\ Recuerdo 23J →</th>
                    ${origCols.map(c => `<th style="text-align:right">${c}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                  <tr style="border-top:2px solid var(--border)">
                    <td><strong>Muestra Ponderada CIS (N)</strong></td>
                    ${nRowCells}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      };

      matrizHtml =
        buildMatrixTable(
          activeStudy.matrizP19a,
          "📐 Matriz de Transferencia Oficial CIS — Voto + Simpatía (Pregunta 19a × Recuerdo 23J, Hoja 'RV EG23')",
          "Porcentaje vertical dentro de cada columna de recuerdo del 23J. Las celdas en azul destacan la tasa de retención directa (fidelidad); en ámbar, las principales fugas entre partidos."
        ) +
        buildMatrixTable(
          activeStudy.matrizP17R,
          "📊 Matriz de Transferencia Oficial CIS — Intención Directa de Voto (Pregunta 17R × Recuerdo 23J, Hoja 'RV EG23')",
          "Porcentaje vertical de voto directo espontáneo antes de imputar simpatía (Pregunta 17R)."
        );
    }

    // 3. Nota metodológica oficial del CIS
    const notaHtml = activeStudy.notaMetodologicaCIS
      ? `
        <div class="table-section" style="margin-top:24px">
          <h2>📄 Nota Metodológica Oficial del CIS (Hoja 'Nota estimación')</h2>
          <pre style="white-space:pre-wrap;font-family:inherit;font-size:.83rem;line-height:1.55;color:var(--text2);background:var(--surface2);padding:16px;border-radius:8px;border:1px solid var(--border)">${activeStudy.notaMetodologicaCIS}</pre>
        </div>
      `
      : '';

    microContainer.innerHTML = `
      <div class="table-section">
        <h2>🔬 Calibración por Recuerdo de Voto Válido (Factor K = Urnas 23J / Recuerdo Válido Muestra)</h2>
        <p style="font-size:.85rem;color:var(--text2);margin-bottom:16px">
          Para comparar magnitudes homogéneas, el recuerdo muestral se normaliza exclusivamente sobre el <strong>voto válido recordado</strong> (excluyendo abstención en 2023, menores de edad en 2023, voto nulo y NS/NC), contrastándolo con el porcentaje oficial sobre voto válido certificado por la Junta Electoral Central (BOE).
        </p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Candidatura</th>
                ${hasTotalSampleRecall ? '<th>Recuerdo s/ Muestra Total</th>' : ''}
                <th>Recuerdo s/ Voto Válido</th>
                <th>Resultado Oficial Urnas (BOE)</th>
                <th>Factor K Calibración</th>
                <th>Diagnóstico Muestral</th>
              </tr>
            </thead>
            <tbody>
              ${kRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
      ${matrizHtml}
      ${notaHtml}
    `;
  }

  // Navegación entre pestañas y botón directo de Ayuda
  function setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.classList.add('active');

        if (targetId === 'tab-cocinas' && comparisonChart) {
          comparisonChart.resize();
        }
      };
    });

    const btnOpenHelp = document.getElementById('btn-open-help');
    const navTabAyuda = document.getElementById('nav-tab-ayuda');
    if (btnOpenHelp && navTabAyuda) {
      btnOpenHelp.onclick = () => {
        navTabAyuda.click();
        navTabAyuda.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
    }
  }

  // Selector de modelo en sidebar
  function setupModelSelector() {
    const optAldabon = document.getElementById('model-aldabon');
    const optTransfer = document.getElementById('model-transfer');

    if (optAldabon) {
      optAldabon.onclick = () => {
        currentModel = 'aldabon';
        optAldabon.classList.add('active');
        optTransfer.classList.remove('active');
        renderAllViews();
      };
    }

    if (optTransfer) {
      optTransfer.onclick = () => {
        currentModel = 'transfer';
        optTransfer.classList.add('active');
        optAldabon.classList.remove('active');
        renderAllViews();
      };
    }
  }

  // Toggle de sidebar móvil
  function setupMobileToggle() {
    const toggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggle && sidebar && overlay) {
      toggle.onclick = () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
      };

      overlay.onclick = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      };
    }
  }

});
