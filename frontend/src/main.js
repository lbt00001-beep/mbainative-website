import { criteria } from "./score.js";

const app = document.querySelector("#app");

/* ============ STATE ============ */
const state = {
  apiKey: localStorage.getItem("radar_apiKey") || "",
  model: localStorage.getItem("radar_model") || "openai/gpt-4.1-mini",
  title: "", outlet: "", author: "", date: "", section: "",
  articleText: "",
  pdfFile: null,
  loading: false,
  loadingStep: 0,
  error: "",
  result: null,
  activeTab: "analyze", // analyze | history | compare | batch
  historyItems: JSON.parse(localStorage.getItem("radar_history") || "[]"),
  compareA: null,
  compareB: null,
  enableOcr: false,
  // Batch processing
  batchFiles: [],
  batchRunning: false,
  batchCurrent: -1,
  batchResults: [],   // { file, result?, error? }
  batchAutoDownload: true,
};

/* ============ CONSTANTS ============ */
const BACKEND_CANDIDATES = ["", "http://127.0.0.1:5174", "http://localhost:5174"];

const MODEL_PRESETS = [
  { region: "Google", id: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro" },
  { region: "Google", id: "google/gemini-2.5-flash-preview", label: "Gemini 2.5 Flash" },
  { region: "Google", id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
  { region: "OpenAI", id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { region: "OpenAI", id: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { region: "OpenAI", id: "openai/gpt-4.1", label: "GPT-4.1" },
  { region: "China", id: "qwen/qwen3-max", label: "Qwen3 Max" },
  { region: "China", id: "deepseek/deepseek-r1", label: "DeepSeek R1" },
  { region: "China", id: "deepseek/deepseek-chat", label: "DeepSeek V3" },
  { region: "Europa", id: "mistralai/mistral-medium-3", label: "Mistral Medium 3" },
  { region: "Europa", id: "mistralai/mistral-small-3.1-24b-instruct", label: "Mistral Small 3.1" },
  { region: "Europa", id: "mistralai/mistral-small-3.1-24b-instruct:free", label: "Mistral Small Free" },
];

const REGIONS = [...new Set(MODEL_PRESETS.map(m => m.region))];

const LOADING_STEPS = [
  "Preparando artículo...",
  "Enviando al modelo IA...",
  "Analizando criterios...",
  "Generando diagnóstico...",
  "Finalizando evaluación...",
];

/* ============ UTILS ============ */
function esc(v) {
  return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function scoreLabel(s) { return s >= 85 ? "Excelente" : s >= 70 ? "Buena" : s >= 50 ? "Aceptable" : "Baja"; }
function scoreCssClass(s) { return s >= 85 ? "excellent" : s >= 70 ? "good" : s >= 50 ? "acceptable" : "low"; }
function criterionColorClass(val) { return `score-${Math.min(5, Math.max(1, Math.round(Number(val) || 3)))}` }

function saveHistory() { localStorage.setItem("radar_history", JSON.stringify(state.historyItems.slice(0, 50))); }
function saveApiKey() { localStorage.setItem("radar_apiKey", state.apiKey); }
function saveModel() { localStorage.setItem("radar_model", state.model); }

/* ============ RENDER ============ */
function render() {
  const r = state.result;
  const label = r ? scoreLabel(r.overallScore) : "Sin evaluar";
  const labelClass = r ? scoreCssClass(r.overallScore) : "";
  const scoreText = r ? `${r.overallScore}/100` : "—";

  app.innerHTML = `
    <header class="fade-in">
      <span class="badge">Radar editorial · IA</span>
      <h1>Radar de Calidad Periodística</h1>
      <p class="lead">Sube un PDF, selecciona un modelo de IA y obtén un diagnóstico profesional con puntuación 0-100.</p>
    </header>

    <nav class="tabs">
      <button class="tab-btn ${state.activeTab === 'analyze' ? 'active' : ''}" data-tab="analyze">🔍 Analizar</button>
      <button class="tab-btn ${state.activeTab === 'batch' ? 'active' : ''}" data-tab="batch">📦 Lote ${state.batchRunning ? '<span class="tag">' + (state.batchCurrent + 1) + '/' + state.batchFiles.length + '</span>' : ''}</button>
      <button class="tab-btn ${state.activeTab === 'history' ? 'active' : ''}" data-tab="history">📋 Historial <span class="tag">${state.historyItems.length}</span></button>
      <button class="tab-btn ${state.activeTab === 'compare' ? 'active' : ''}" data-tab="compare">⚖️ Comparar</button>
    </nav>

    ${state.activeTab === "analyze" ? renderAnalyze(r, label, labelClass, scoreText) : ""}
    ${state.activeTab === "batch" ? renderBatch() : ""}
    ${state.activeTab === "history" ? renderHistory() : ""}
    ${state.activeTab === "compare" ? renderCompare() : ""}
  `;
  bindEvents();
  if (state.activeTab === "analyze" && r) drawRadar(r);
  if (state.activeTab === "compare" && state.compareA) drawRadar(state.compareA, "radarA");
  if (state.activeTab === "compare" && state.compareB) drawRadar(state.compareB, "radarB");
}

/* ----- Analyze Tab ----- */
function renderAnalyze(r, label, labelClass, scoreText) {
  return `
    <section class="grid slide-up">
      <div class="card">
        <div class="section-title"><h2>Entrada</h2><span class="tag">Automático</span></div>

        <div class="field">
          <label for="apiKey">API key OpenRouter</label>
          <input id="apiKey" type="password" placeholder="sk-or-v1-..." value="${esc(state.apiKey)}" />
        </div>

        <div class="field">
          <label for="model">Modelo de IA</label>
          <select id="model">
            ${REGIONS.map(region => `
              <optgroup label="${esc(region)}">
                ${MODEL_PRESETS.filter(m => m.region === region).map(p =>
    `<option value="${esc(p.id)}" ${state.model === p.id ? "selected" : ""}>${esc(p.label)}</option>`
  ).join("")}
              </optgroup>`).join("")}
          </select>
        </div>

        <div class="meta-grid">
          ${metaField("Título", "title", "Ej. Impacto de...")}
          ${metaField("Medio", "outlet", "Ej. El País")}
          ${metaField("Autor/a", "author", "Ej. Ana Pérez")}
          <div class="field"><label for="date">Fecha</label><input id="date" type="date" value="${esc(state.date)}" /></div>
          ${metaField("Sección", "section", "Ej. Economía")}
        </div>

        <div class="field">
          <label for="pdfFile">PDF del artículo</label>
          <input id="pdfFile" type="file" accept="application/pdf" />
          <p class="small-note">${state.pdfFile ? `📄 ${esc(state.pdfFile.name)}` : "No hay PDF seleccionado."}</p>
        </div>

        <div class="field">
          <label for="articleText">Texto (alternativa al PDF)</label>
          <textarea id="articleText" placeholder="Pega aquí el texto si no quieres subir PDF...">${esc(state.articleText)}</textarea>
        </div>

        <div class="ocr-toggle">
          <input type="checkbox" id="ocrToggle" ${state.enableOcr ? "checked" : ""} />
          <label for="ocrToggle" style="margin:0;color:var(--text)">OCR para PDFs escaneados</label>
          ${state.enableOcr ? '<span class="ocr-status">⚠ Más lento</span>' : ''}
        </div>

        ${state.error ? `<p class="error-box">${esc(state.error)}</p>` : ""}

        <div class="actions">
          <button class="primary" id="analyze" ${state.loading ? "disabled" : ""}>${state.loading ? "⏳ Analizando..." : "🚀 Valorar artículo"}</button>
          <button class="secondary" id="reset" ${state.loading ? "disabled" : ""}>🗑 Limpiar</button>
        </div>

        ${renderHelp()}
      </div>

      <div class="card">
        <div class="section-title">
          <h2>Resultado IA</h2>
          <span class="score-pill ${labelClass}">${esc(label)}</span>
        </div>

        ${state.loading ? renderLoading() : ""}
        ${!state.loading && r ? renderResult(r) : ""}
        ${!state.loading && !r ? '<p class="small-note text-center mt-2">Sube un PDF y pulsa "Valorar artículo" para ver el diagnóstico.</p>' : ""}
      </div>
    </section>`;
}

function metaField(lbl, key, ph) {
  return `<div class="field"><label for="${key}">${lbl}</label><input id="${key}" type="text" value="${esc(state[key])}" placeholder="${esc(ph)}" /></div>`;
}

/* ----- Loading ----- */
function renderLoading() {
  return `
    <div class="loading-overlay fade-in">
      <div class="spinner"></div>
      <p>Procesando con <strong>${esc(state.model.split("/").pop())}</strong></p>
      <div class="loading-steps">
        ${LOADING_STEPS.map((step, i) => {
    const cls = i < state.loadingStep ? "done" : i === state.loadingStep ? "active" : "";
    const icon = i < state.loadingStep ? "✓" : i === state.loadingStep ? "●" : "○";
    return `<div class="loading-step ${cls}"><span class="step-icon">${icon}</span>${esc(step)}</div>`;
  }).join("")}
      </div>
    </div>`;
}

/* ----- Result ----- */
function renderResult(r) {
  const meta = r.metadata || {};
  return `
    <p class="score-big">${r.overallScore}/100</p>

    <div class="signals">
      <div class="signal"><span>📝</span><strong>${r.signals?.words || 0}</strong> palabras</div>
      <div class="signal"><span>📊</span><strong>${r.signals?.sentences || 0}</strong> oraciones</div>
      <div class="signal"><span>🤖</span>${esc(r.modelUsed?.split("/").pop() || state.model)}</div>
    </div>

    ${meta.title ? `<p class="small-note mt-1"><strong>${esc(meta.title)}</strong>${meta.outlet ? ` — ${esc(meta.outlet)}` : ""}${meta.author ? ` · ${esc(meta.author)}` : ""}</p>` : ""}

    <h3>📊 Radar de criterios</h3>
    <div class="radar-wrap"><canvas id="radarChart" width="320" height="320"></canvas></div>

    <h3>📋 Diagnóstico por criterio</h3>
    <div class="criteria">${criteria.map(c => renderCriterion(c, r)).join("")}</div>

    <h3>✅ Fortalezas</h3>
    <ul class="list">${(r.strengths || []).map(s => `<li>${esc(s)}</li>`).join("") || "<li>Sin datos</li>"}</ul>

    <h3>🔧 Mejoras</h3>
    <ul class="list">${(r.improvements || []).map(s => `<li>${esc(s)}</li>`).join("") || "<li>Sin datos</li>"}</ul>

    <h3>📌 Acciones editoriales</h3>
    <ul class="list">${(r.editorialActions || []).map(s => `<li>${esc(s)}</li>`).join("") || "<li>Sin acciones</li>"}</ul>

    <h3>📝 Resumen</h3>
    <p class="small-note">${esc(r.summary || "Sin resumen")}</p>

    <h3>⚖️ Veredicto editorial</h3>
    <p class="small-note">${esc(r.editorialVerdict || "Sin veredicto")}</p>

    <div class="actions">
      <button class="secondary" id="downloadTxt">📄 Informe .txt</button>
      <button class="secondary" id="downloadPdf">📑 Informe .pdf</button>
    </div>`;
}

function renderCriterion(c, r) {
  const d = r.criteriaDetails?.[c.id] || {};
  const sc = d.score ?? r.scores?.[c.id] ?? 3;
  const colorClass = criterionColorClass(sc);
  return `
    <div class="criterion-detail ${colorClass}">
      <div class="criterion-header">
        <span>${esc(c.title)}</span>
        <span class="criterion-score ${colorClass}">${sc}/5</span>
      </div>
      <div class="progress-track"><div class="progress-fill fill-${sc}"></div></div>
      <p class="small-note"><strong>Justificación:</strong> ${esc(d.rationale || "Sin detalle")}</p>
      <p class="small-note"><strong>Evidencia:</strong> ${esc(d.evidence || "No reportada")}</p>
    </div>`;
}

/* ----- History Tab ----- */
function renderHistory() {
  if (!state.historyItems.length) {
    return `<div class="card slide-up"><h2>📋 Historial de análisis</h2><p class="small-note mt-2">No hay análisis guardados aún. Evalúa un artículo y aparecerá aquí.</p></div>`;
  }
  return `
    <div class="card slide-up">
      <div class="flex-between">
        <h2>📋 Historial de análisis</h2>
        <button class="danger small-btn" id="clearHistory">🗑 Borrar todo</button>
      </div>
      <div class="history-list">
        ${state.historyItems.map((item, i) => `
          <div class="history-item" data-idx="${i}">
            <div class="hi-score score-pill ${scoreCssClass(item.overallScore)}">${item.overallScore}</div>
            <div class="hi-meta">
              <strong>${esc(item.metadata?.title || "Sin título")}</strong>
              ${esc(item.metadata?.outlet || "")} · ${esc(item.metadata?.date || item.analyzedAt?.slice(0, 10) || "")} · ${esc(item.modelUsed?.split("/").pop() || "")}
            </div>
            <div class="hi-actions">
              <button class="secondary small-btn hi-view" data-idx="${i}" title="Ver">👁</button>
              <button class="secondary small-btn hi-compare" data-idx="${i}" title="Añadir a comparar">⚖️</button>
              <button class="danger small-btn hi-delete" data-idx="${i}" title="Eliminar">✕</button>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
}

/* ----- Compare Tab ----- */
function renderCompare() {
  return `
    <div class="card slide-up">
      <h2>⚖️ Comparar artículos</h2>
      <p class="small-note mb-1">Selecciona dos análisis del historial para compararlos lado a lado.</p>
      ${!state.compareA && !state.compareB ? '<p class="small-note mt-2">Ve al historial y pulsa ⚖️ en dos artículos para compararlos.</p>' : ""}
    </div>
    ${state.compareA || state.compareB ? `
    <div class="compare-grid slide-up">
      ${renderCompareCol(state.compareA, "A", "radarA")}
      ${renderCompareCol(state.compareB, "B", "radarB")}
    </div>` : ""}`;
}

function renderCompareCol(item, label, canvasId) {
  if (!item) return `<div class="compare-col"><p class="text-center small-note">Artículo ${label}: sin seleccionar</p></div>`;
  return `
    <div class="compare-col">
      <div class="flex-between">
        <h3>${esc(item.metadata?.title || `Artículo ${label}`)}</h3>
        <span class="score-pill ${scoreCssClass(item.overallScore)}">${item.overallScore}/100</span>
      </div>
      <p class="small-note">${esc(item.metadata?.outlet || "")} · ${esc(item.modelUsed?.split("/").pop() || "")}</p>
      <div class="radar-wrap"><canvas id="${canvasId}" width="260" height="260"></canvas></div>
      <div class="criteria">
        ${criteria.map(c => {
    const d = item.criteriaDetails?.[c.id] || {};
    const sc = d.score ?? 3;
    return `<div class="criterion-detail ${criterionColorClass(sc)}">
            <div class="criterion-header"><span>${esc(c.title)}</span><span class="criterion-score ${criterionColorClass(sc)}">${sc}/5</span></div>
            <div class="progress-track"><div class="progress-fill fill-${sc}"></div></div>
          </div>`;
  }).join("")}
      </div>
      <button class="danger small-btn mt-1" data-clear-compare="${label}">✕ Quitar</button>
    </div>`;
}

/* ----- Batch Tab ----- */
function renderBatch() {
  const total = state.batchFiles.length;
  const done = state.batchResults.length;
  const successes = state.batchResults.filter(r => r.result).length;
  const errors = state.batchResults.filter(r => r.error).length;

  return `
    <div class="card slide-up">
      <div class="section-title"><h2>📦 Procesamiento por lotes</h2><span class="tag">Batch</span></div>
      <p class="small-note">Sube varios PDFs y la app los evaluará uno a uno, generando un informe PDF por cada artículo.</p>

      <div class="field mt-2">
        <label for="batchApiKey">API key OpenRouter</label>
        <input id="batchApiKey" type="password" placeholder="sk-or-v1-..." value="${esc(state.apiKey)}" />
      </div>

      <div class="field">
        <label for="batchModel">Modelo de IA</label>
        <select id="batchModel">
          ${REGIONS.map(region => `
            <optgroup label="${esc(region)}">
              ${MODEL_PRESETS.filter(m => m.region === region).map(p =>
    `<option value="${esc(p.id)}" ${state.model === p.id ? "selected" : ""}>${esc(p.label)}</option>`
  ).join("")}
            </optgroup>`).join("")}
        </select>
      </div>

      <div class="field">
        <label for="batchFiles">Seleccionar PDFs (múltiples)</label>
        <input id="batchFiles" type="file" accept="application/pdf" multiple />
        <p class="small-note">${total ? `📁 ${total} PDF(s) seleccionado(s)` : "Selecciona uno o más PDFs."}</p>
      </div>

      <div class="ocr-toggle">
        <input type="checkbox" id="batchAutoDownload" ${state.batchAutoDownload ? "checked" : ""} />
        <label for="batchAutoDownload" style="margin:0;color:var(--text)">Descargar PDF automáticamente tras cada análisis</label>
      </div>

      ${!state.batchRunning && total > 0 ? `
      <div class="actions">
        <button class="primary" id="batchStart">🚀 Procesar ${total} artículo(s)</button>
        <button class="secondary" id="batchClear">🗑 Limpiar</button>
      </div>` : ""}

      ${state.batchRunning ? renderBatchProgress(total, done) : ""}

      ${!state.batchRunning && done > 0 ? renderBatchResults(successes, errors) : ""}
    </div>`;
}

function renderBatchProgress(total, done) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const currentFile = state.batchFiles[state.batchCurrent];
  return `
    <div class="batch-progress mt-2 fade-in">
      <div class="flex-between">
        <span>Procesando <strong>${done + 1}</strong> de <strong>${total}</strong></span>
        <span class="tag">${pct}%</span>
      </div>
      <div class="progress-track" style="height:10px;margin:.6rem 0">
        <div class="progress-fill" style="width:${pct}%;background:var(--accent);transition:width .4s"></div>
      </div>
      ${currentFile ? `<p class="small-note">📄 ${esc(currentFile.name)}</p>` : ""}
      <div class="loading-overlay" style="padding:.5rem">
        <div class="spinner" style="width:28px;height:28px"></div>
      </div>
    </div>`;
}

function renderBatchResults(successes, errors) {
  return `
    <div class="mt-2 slide-up">
      <h3>Resultados del lote</h3>
      <div class="signals">
        <div class="signal"><span>✅</span><strong>${successes}</strong> exitosos</div>
        <div class="signal"><span>❌</span><strong>${errors}</strong> errores</div>
      </div>
      <div class="history-list mt-1">
        ${state.batchResults.map((br, i) => {
    if (br.result) {
      const sc = br.result.overallScore;
      return `
              <div class="history-item">
                <div class="hi-score score-pill ${scoreCssClass(sc)}">${sc}</div>
                <div class="hi-meta">
                  <strong>${esc(br.file)}</strong>
                  ${esc(br.result.metadata?.title || "")} · ${esc(scoreLabel(sc))}
                </div>
                <div class="hi-actions">
                  <button class="secondary small-btn batch-dl-pdf" data-batch-idx="${i}" title="Descargar PDF">📑</button>
                  <button class="secondary small-btn batch-view" data-batch-idx="${i}" title="Ver detalle">👁</button>
                </div>
              </div>`;
    } else {
      return `
              <div class="history-item" style="border-color:var(--red)">
                <div class="hi-score" style="color:var(--red)">✕</div>
                <div class="hi-meta">
                  <strong>${esc(br.file)}</strong>
                  <span style="color:var(--red)">${esc(br.error)}</span>
                </div>
              </div>`;
    }
  }).join("")}
      </div>
      <div class="actions mt-1">
        <button class="secondary" id="batchDownloadAll">📦 Descargar todos los PDFs</button>
        <button class="secondary" id="batchClearResults">🗑 Limpiar resultados</button>
      </div>
    </div>`;
}

/* ----- Help ----- */
function renderHelp() {
  return `
    <details class="help-box mt-1">
      <summary>Ayuda: cómo usar la app</summary>
      <ol>
        <li>Escribe tu API key de <a href="https://openrouter.ai/keys" target="_blank">OpenRouter</a>.</li>
        <li>Elige un modelo de IA.</li>
        <li>Sube un PDF o pega texto del artículo.</li>
        <li>Pulsa "Valorar artículo" y espera el diagnóstico.</li>
        <li>Descarga el informe en .txt o .pdf.</li>
        <li>Usa la pestaña <strong>Lote</strong> para procesar varios PDFs a la vez.</li>
        <li>El historial guarda automáticamente cada análisis.</li>
      </ol>
    </details>`;
}

/* ============ RADAR CHART (Canvas) ============ */
function drawRadar(result, canvasId = "radarChart") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * 0.38;
  const N = criteria.length;
  const scores = criteria.map(c => (result.criteriaDetails?.[c.id]?.score ?? result.scores?.[c.id] ?? 3));

  ctx.clearRect(0, 0, W, H);

  // Grid circles
  for (let ring = 1; ring <= 5; ring++) {
    const r = R * ring / 5;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(148,163,184,.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Axes
  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = "rgba(148,163,184,.1)";
    ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const idx = i % N;
    const angle = (Math.PI * 2 * idx / N) - Math.PI / 2;
    const val = scores[idx] / 5;
    const x = cx + R * val * Math.cos(angle);
    const y = cy + R * val * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.fillStyle = "rgba(99,102,241,.2)";
  ctx.fill();
  ctx.strokeStyle = "#818cf8";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Points + labels
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
    const val = scores[i] / 5;
    const px = cx + R * val * Math.cos(angle);
    const py = cy + R * val * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#818cf8";
    ctx.fill();

    const lx = cx + (R + 18) * Math.cos(angle);
    const ly = cy + (R + 18) * Math.sin(angle);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(criteria[i].title, lx, ly + 4);
  }
}

/* ============ EVENTS ============ */
function bindEvents() {
  // Tabs
  app.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => { state.activeTab = btn.dataset.tab; render(); });
  });

  // Inputs
  app.querySelectorAll("input[type='text'], input[type='password'], input[type='date']").forEach(inp => {
    inp.addEventListener("input", e => {
      state[e.target.id] = e.target.value;
      if (e.target.id === "apiKey") saveApiKey();
    });
  });

  const sel = app.querySelector("#model");
  if (sel) sel.addEventListener("change", e => { state.model = e.target.value; saveModel(); });

  const ta = app.querySelector("#articleText");
  if (ta) ta.addEventListener("input", e => { state.articleText = e.target.value; });

  const fi = app.querySelector("#pdfFile");
  if (fi) fi.addEventListener("change", e => {
    state.pdfFile = e.target.files?.[0] || null;
    state.title = ""; state.outlet = ""; state.author = ""; state.date = ""; state.section = "";
    state.result = null; state.error = "";
    render();
  });

  const ocrBox = app.querySelector("#ocrToggle");
  if (ocrBox) ocrBox.addEventListener("change", e => { state.enableOcr = e.target.checked; render(); });

  const analyzeBtn = app.querySelector("#analyze");
  if (analyzeBtn) analyzeBtn.addEventListener("click", analyzeArticle);

  const resetBtn = app.querySelector("#reset");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    state.title = ""; state.outlet = ""; state.author = ""; state.date = ""; state.section = "";
    state.articleText = ""; state.pdfFile = null; state.error = ""; state.result = null;
    render();
  });

  const dlTxt = app.querySelector("#downloadTxt");
  if (dlTxt) dlTxt.addEventListener("click", downloadTxtReport);

  const dlPdf = app.querySelector("#downloadPdf");
  if (dlPdf) dlPdf.addEventListener("click", downloadPdfReport);

  // History events
  const clearHist = app.querySelector("#clearHistory");
  if (clearHist) clearHist.addEventListener("click", () => {
    state.historyItems = []; saveHistory(); render();
  });

  app.querySelectorAll(".hi-view").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const item = state.historyItems[Number(btn.dataset.idx)];
      if (item) { state.result = item; state.activeTab = "analyze"; render(); }
    });
  });

  app.querySelectorAll(".hi-compare").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const item = state.historyItems[Number(btn.dataset.idx)];
      if (!item) return;
      if (!state.compareA) { state.compareA = item; }
      else if (!state.compareB) { state.compareB = item; state.activeTab = "compare"; }
      else { state.compareA = state.compareB; state.compareB = item; state.activeTab = "compare"; }
      render();
    });
  });

  app.querySelectorAll(".hi-delete").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      state.historyItems.splice(Number(btn.dataset.idx), 1);
      saveHistory(); render();
    });
  });

  app.querySelectorAll("[data-clear-compare]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.clearCompare === "A") state.compareA = null;
      else state.compareB = null;
      render();
    });
  });

  // --- Batch events ---
  const batchApiKey = app.querySelector("#batchApiKey");
  if (batchApiKey) batchApiKey.addEventListener("input", e => { state.apiKey = e.target.value; saveApiKey(); });

  const batchModel = app.querySelector("#batchModel");
  if (batchModel) batchModel.addEventListener("change", e => { state.model = e.target.value; saveModel(); });

  const batchFileInput = app.querySelector("#batchFiles");
  if (batchFileInput) batchFileInput.addEventListener("change", e => {
    state.batchFiles = Array.from(e.target.files || []);
    state.batchResults = [];
    render();
  });

  const batchAutoBox = app.querySelector("#batchAutoDownload");
  if (batchAutoBox) batchAutoBox.addEventListener("change", e => { state.batchAutoDownload = e.target.checked; });

  const batchStart = app.querySelector("#batchStart");
  if (batchStart) batchStart.addEventListener("click", runBatch);

  const batchClear = app.querySelector("#batchClear");
  if (batchClear) batchClear.addEventListener("click", () => {
    state.batchFiles = []; state.batchResults = []; render();
  });

  const batchClearResults = app.querySelector("#batchClearResults");
  if (batchClearResults) batchClearResults.addEventListener("click", () => {
    state.batchResults = []; render();
  });

  app.querySelectorAll(".batch-dl-pdf").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const br = state.batchResults[Number(btn.dataset.batchIdx)];
      if (br?.result) downloadPdfForResult(br.result, br.file);
    });
  });

  app.querySelectorAll(".batch-view").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const br = state.batchResults[Number(btn.dataset.batchIdx)];
      if (br?.result) { state.result = br.result; state.activeTab = "analyze"; render(); }
    });
  });

  const batchDlAll = app.querySelector("#batchDownloadAll");
  if (batchDlAll) batchDlAll.addEventListener("click", downloadAllBatchPdfs);
}

/* ============ ANALYZE ============ */
async function analyzeArticle() {
  state.error = "";
  if (!state.apiKey.trim()) { state.error = "Introduce tu API key de OpenRouter."; render(); return; }
  if (!state.articleText.trim() && !state.pdfFile) { state.error = "Sube un PDF o pega el texto."; render(); return; }

  state.loading = true; state.loadingStep = 0; state.result = null;
  render();

  // Animate loading steps
  const stepInterval = setInterval(() => {
    if (state.loadingStep < LOADING_STEPS.length - 1) {
      state.loadingStep++;
      const overlay = app.querySelector(".loading-overlay");
      if (overlay) overlay.innerHTML = renderLoading().replace(/<div class="loading-overlay[^>]*>/, "").replace(/<\/div>$/, "");
    }
  }, 2000);

  try {
    const payload = {
      apiKey: state.apiKey.trim(),
      model: state.model.trim() || "openai/gpt-4.1-mini",
      title: state.title.trim(), outlet: state.outlet.trim(),
      author: state.author.trim(), date: state.date.trim(), section: state.section.trim(),
      articleText: state.articleText.trim(),
      enableOcr: state.enableOcr,
    };

    if (!payload.articleText && state.pdfFile) {
      payload.pdfBase64 = await fileToBase64(state.pdfFile);
    }

    const { response, data } = await postEvaluate(payload);
    if (!response.ok) throw new Error(data?.error || "Error al evaluar.");

    state.result = data;
    applyMeta(data);

    // Save to history
    const historyEntry = { ...data, analyzedAt: new Date().toISOString() };
    state.historyItems.unshift(historyEntry);
    saveHistory();

  } catch (err) {
    state.error = String(err?.message || "").includes("BACKEND_UNREACHABLE")
      ? "No se puede conectar con el backend (puerto 5174). Ejecuta Ejecutar.cmd."
      : err.message || "Error inesperado.";
  } finally {
    clearInterval(stepInterval);
    state.loading = false;
    render();
  }
}

function applyMeta(result) {
  const m = result?.metadata || {};
  for (const k of ["title", "outlet", "author", "date", "section"]) state[k] = String(m[k] || "").trim();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const s = String(r.result || ""); resolve(s.includes(",") ? s.split(",")[1] : s); };
    r.onerror = () => reject(new Error("No se pudo leer el PDF."));
    r.readAsDataURL(file);
  });
}

async function postEvaluate(payload) {
  let lastErr = null;
  for (const base of BACKEND_CANDIDATES) {
    try {
      const res = await fetch(`${base}/api/evaluate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return { response: res, data: await res.json() };
    } catch (e) { lastErr = e; }
  }
  throw new Error(`BACKEND_UNREACHABLE: ${lastErr?.message || ""}`);
}

/* ============ DOWNLOADS ============ */
function sanitize(v) {
  return String(v || "informe").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\-_]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function buildReportText(r) {
  const meta = r.metadata || {};
  const lines = [
    "RADAR DE CALIDAD PERIODISTICA - INFORME",
    "=======================================",
    `Fecha: ${new Date().toISOString()}`,
    `Modelo IA: ${r.modelUsed || state.model}`,
    `Titulo: ${meta.title || state.title || "(?)"}`,
    `Medio: ${meta.outlet || state.outlet || "(?)"}`,
    `Autor: ${meta.author || state.author || "(?)"}`,
    `Fecha articulo: ${meta.date || state.date || "(?)"}`,
    `Seccion: ${meta.section || state.section || "(?)"}`,
    `Fuente: ${r.source || "-"} · ${r.extractedTextLength || 0} caracteres`,
    "",
    `PUNTUACION GLOBAL: ${r.overallScore}/100 (${r.label || scoreLabel(r.overallScore)})`,
    "",
    "DIAGNOSTICO POR CRITERIO",
    "------------------------",
  ];
  for (const c of criteria) {
    const d = r.criteriaDetails?.[c.id] || {};
    lines.push(`${c.title}: ${d.score ?? "-"}/5`);
    lines.push(`  Justificacion: ${d.rationale || "Sin detalle"}`);
    lines.push(`  Evidencia: ${d.evidence || "No reportada"}`);
  }
  lines.push("", "FORTALEZAS", "----------");
  for (const s of r.strengths || []) lines.push(`- ${s}`);
  lines.push("", "MEJORAS", "-------");
  for (const s of r.improvements || []) lines.push(`- ${s}`);
  lines.push("", "ACCIONES EDITORIALES", "--------------------");
  for (const s of r.editorialActions || []) lines.push(`- ${s}`);
  lines.push("", "RESUMEN", "-------", r.summary || "Sin resumen");
  lines.push("", "VEREDICTO EDITORIAL", "-------------------", r.editorialVerdict || "Sin veredicto");
  return lines.join("\n");
}

function downloadTxtReport() {
  if (!state.result) return;
  const text = buildReportText(state.result);
  download(new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" }),
    `informe-${sanitize(state.result.metadata?.title || state.title)}-${sanitize(state.result.modelUsed)}-${new Date().toISOString().slice(0, 10)}.txt`);
}

/* ---- Shared PDF generation (used by single + batch) ---- */
function ensureJsPdf() {
  return new Promise((resolve, reject) => {
    if (typeof window.jspdf !== "undefined") { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar jsPDF."));
    document.head.appendChild(script);
  });
}

function generatePdfBlob(r) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const margin = 15;
  let y = 20;
  const pageW = doc.internal.pageSize.getWidth() - margin * 2;
  const meta = r.metadata || {};

  const addLine = (text, opts = {}) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(opts.size || 10);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    if (opts.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(String(text), pageW);
    doc.text(lines, margin, y);
    y += lines.length * (opts.size || 10) * 0.45 + 3;
  };

  addLine("RADAR DE CALIDAD PERIODÍSTICA", { size: 18, bold: true, color: [99, 102, 241] });
  addLine(`Puntuación: ${r.overallScore}/100 (${scoreLabel(r.overallScore)})`, { size: 14, bold: true });
  y += 3;
  addLine(`Modelo IA: ${r.modelUsed || state.model}`);
  addLine(`Título: ${meta.title || "(?)"}`);
  addLine(`Medio: ${meta.outlet || "(?)"} · Autor: ${meta.author || "(?)"}`);
  addLine(`Fecha: ${meta.date || "(?)"} · Sección: ${meta.section || "(?)"}`);
  y += 5;
  addLine("DIAGNÓSTICO POR CRITERIO", { size: 13, bold: true, color: [99, 102, 241] });
  for (const c of criteria) {
    const d = r.criteriaDetails?.[c.id] || {};
    addLine(`${c.title}: ${d.score ?? "-"}/5`, { bold: true });
    addLine(`  ${d.rationale || "Sin detalle"}`);
    addLine(`  Evidencia: ${d.evidence || "No reportada"}`);
  }
  y += 3;
  addLine("FORTALEZAS", { size: 12, bold: true, color: [34, 197, 94] });
  for (const s of r.strengths || []) addLine(`• ${s}`);
  y += 3;
  addLine("MEJORAS", { size: 12, bold: true, color: [249, 115, 22] });
  for (const s of r.improvements || []) addLine(`• ${s}`);
  y += 3;
  addLine("RESUMEN", { size: 12, bold: true, color: [99, 102, 241] });
  addLine(r.summary || "Sin resumen");
  addLine("VEREDICTO", { size: 12, bold: true });
  addLine(r.editorialVerdict || "Sin veredicto");

  return { doc, filename: `informe-${sanitize(meta.title || "articulo")}-${new Date().toISOString().slice(0, 10)}.pdf` };
}

async function downloadPdfForResult(r, sourceFilename) {
  await ensureJsPdf();
  const { doc, filename } = generatePdfBlob(r);
  const name = sourceFilename
    ? `informe-${sanitize(sourceFilename.replace(/\.pdf$/i, ""))}-${new Date().toISOString().slice(0, 10)}.pdf`
    : filename;
  doc.save(name);
}

async function downloadPdfReport() {
  if (!state.result) return;
  try {
    await ensureJsPdf();
    downloadPdfForResult(state.result);
  } catch {
    state.error = "No se pudo cargar la librería PDF.";
    render();
  }
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============ BATCH PROCESSING ============ */
async function runBatch() {
  if (!state.apiKey.trim()) { state.error = "Introduce tu API key."; render(); return; }
  if (!state.batchFiles.length) { state.error = "Selecciona al menos un PDF."; render(); return; }

  state.batchRunning = true;
  state.batchResults = [];
  state.batchCurrent = 0;
  state.error = "";
  render();

  // Pre-load jsPDF if auto-download is on
  if (state.batchAutoDownload) {
    try { await ensureJsPdf(); } catch { }
  }

  for (let i = 0; i < state.batchFiles.length; i++) {
    state.batchCurrent = i;
    render();

    const file = state.batchFiles[i];
    try {
      const pdfBase64 = await fileToBase64(file);
      const payload = {
        apiKey: state.apiKey.trim(),
        model: state.model.trim() || "openai/gpt-4.1-mini",
        pdfBase64,
        title: "", outlet: "", author: "", date: "", section: "",
        articleText: "",
        enableOcr: false,
      };

      const { response, data } = await postEvaluate(payload);
      if (!response.ok) throw new Error(data?.error || "Error al evaluar.");

      state.batchResults.push({ file: file.name, result: data });

      // Save to history
      const historyEntry = { ...data, analyzedAt: new Date().toISOString() };
      state.historyItems.unshift(historyEntry);
      saveHistory();

      // Auto-download PDF
      if (state.batchAutoDownload && typeof window.jspdf !== "undefined") {
        downloadPdfForResult(data, file.name);
      }

    } catch (err) {
      const msg = String(err?.message || "").includes("BACKEND_UNREACHABLE")
        ? "Backend no disponible"
        : (err.message || "Error desconocido");
      state.batchResults.push({ file: file.name, error: msg });
    }

    render();

    // Small delay between requests to avoid rate limiting
    if (i < state.batchFiles.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  state.batchRunning = false;
  state.batchCurrent = -1;
  render();
}

async function downloadAllBatchPdfs() {
  try {
    await ensureJsPdf();
  } catch {
    state.error = "No se pudo cargar jsPDF."; render(); return;
  }
  for (const br of state.batchResults) {
    if (br.result) {
      downloadPdfForResult(br.result, br.file);
      await new Promise(r => setTimeout(r, 300)); // stagger downloads
    }
  }
}

/* ============ INIT ============ */
render();
