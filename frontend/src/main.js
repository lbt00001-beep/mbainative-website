import { criteria } from "./score.js";

const app = document.querySelector("#app");

const state = {
  apiKey: "",
  model: "openai/gpt-4.1-mini",
  title: "",
  outlet: "",
  author: "",
  date: "",
  section: "",
  articleText: "",
  pdfFile: null,
  loading: false,
  error: "",
  result: null
};

const BACKEND_CANDIDATES = ["http://127.0.0.1:5174", "http://localhost:5174"];
const MODEL_PRESETS = [
  { region: "OpenAI", id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { region: "OpenAI", id: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { region: "OpenAI", id: "openai/gpt-4.1", label: "GPT-4.1" },
  { region: "China", id: "qwen/qwen3-max", label: "Qwen3 Max" },
  { region: "China", id: "deepseek/deepseek-r1", label: "DeepSeek R1" },
  { region: "China", id: "deepseek/deepseek-chat", label: "DeepSeek V3" },
  { region: "Europa", id: "mistralai/mistral-medium-3", label: "Mistral Medium 3" },
  { region: "Europa", id: "mistralai/mistral-small-3.1-24b-instruct", label: "Mistral Small 3.1" },
  { region: "Europa", id: "mistralai/mistral-small-3.1-24b-instruct:free", label: "Mistral Small 3.1 Free" }
];

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function scoreLabel(score) {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Buena";
  if (score >= 50) return "Aceptable";
  return "Baja";
}

function render() {
  const result = state.result;
  const currentLabel = result ? scoreLabel(result.overallScore) : "Sin evaluar";
  const currentScore = result ? `${result.overallScore}/100` : "-";

  app.innerHTML = `
    <header class="fade-in">
      <span class="badge">Radar editorial</span>
      <h1>Radar de Calidad Periodística</h1>
      <p class="lead">Sube un PDF del artículo, ingresa tu API key de OpenRouter y la app genera una valoración automática.</p>
    </header>

    <section class="grid">
      <div class="card">
        <div class="section-title">
          <h2>Entrada</h2>
          <span class="tag">Automático</span>
        </div>

        <div class="field">
          <label for="apiKey">API key de OpenRouter</label>
          <input id="apiKey" type="password" placeholder="sk-or-v1-..." value="${escapeHtml(state.apiKey)}" />
        </div>

        <div class="field">
          <label for="model">Modelo</label>
          <select id="model">
            <optgroup label="OpenAI (GPT)">
              ${MODEL_PRESETS.filter((m) => m.region === "OpenAI")
                .map(
                  (preset) =>
                    `<option value="${escapeHtml(preset.id)}" ${state.model === preset.id ? "selected" : ""}>${escapeHtml(
                      preset.label
                    )}</option>`
                )
                .join("")}
            </optgroup>
            <optgroup label="China">
              ${MODEL_PRESETS.filter((m) => m.region === "China")
                .map(
                  (preset) =>
                    `<option value="${escapeHtml(preset.id)}" ${state.model === preset.id ? "selected" : ""}>${escapeHtml(
                      preset.label
                    )}</option>`
                )
                .join("")}
            </optgroup>
            <optgroup label="Europa">
              ${MODEL_PRESETS.filter((m) => m.region === "Europa")
                .map(
                  (preset) =>
                    `<option value="${escapeHtml(preset.id)}" ${state.model === preset.id ? "selected" : ""}>${escapeHtml(
                      preset.label
                    )}</option>`
                )
                .join("")}
            </optgroup>
          </select>
        </div>

        <div class="meta-grid">
          ${textField("Título", "title", "Ej. Impacto de...")}
          ${textField("Medio", "outlet", "Ej. Diario Horizonte")}
          ${textField("Autor/a", "author", "Ej. Ana Pérez")}
          ${dateField()}
          ${textField("Sección", "section", "Ej. Economía")}
        </div>

        <div class="field">
          <label for="pdfFile">PDF del artículo</label>
          <input id="pdfFile" type="file" accept="application/pdf" />
          <p class="small-note">${state.pdfFile ? `PDF seleccionado: ${escapeHtml(state.pdfFile.name)}` : "No hay PDF seleccionado."}</p>
        </div>

        <div class="field">
          <label for="articleText">Texto del artículo (opcional, reemplaza el PDF)</label>
          <textarea id="articleText" placeholder="Pega aquí el texto si no quieres subir PDF...">${escapeHtml(state.articleText)}</textarea>
        </div>

        ${state.error ? `<p class="error-box">${escapeHtml(state.error)}</p>` : ""}

        <div class="actions">
          <button class="primary" id="analyze" ${state.loading ? "disabled" : ""}>${state.loading ? "Analizando..." : "Valorar automáticamente"}</button>
          <button class="secondary" id="reset" ${state.loading ? "disabled" : ""}>Limpiar</button>
        </div>
      </div>

      <div class="card">
        <div class="section-title">
          <h2>Resultado IA</h2>
          <span class="score-pill">${escapeHtml(currentLabel)}</span>
        </div>
        <p class="score-big">${escapeHtml(currentScore)}</p>

        ${result ? renderResult(result) : '<p class="small-note">Todavía no hay valoración. Sube el PDF y pulsa "Valorar automáticamente".</p>'}
      </div>
    </section>
  `;

  bindEvents();
}

function textField(label, key, placeholder) {
  return `
    <div class="field">
      <label for="${key}">${label}</label>
      <input id="${key}" type="text" value="${escapeHtml(state[key])}" placeholder="${escapeHtml(placeholder)}" />
    </div>
  `;
}

function dateField() {
  return `
    <div class="field">
      <label for="date">Fecha</label>
      <input id="date" type="date" value="${escapeHtml(state.date)}" />
    </div>
  `;
}

function renderResult(result) {
  const detailRows = criteria
    .map((item) => {
      const detail = result.criteriaDetails?.[item.id] || {};
      return `
        <div class="criterion-detail">
          <div class="signal"><span>${escapeHtml(item.title)}</span><strong>${escapeHtml(detail.score ?? result.scores?.[item.id] ?? "-")}</strong></div>
          <p class="small-note"><strong>Justificación:</strong> ${escapeHtml(detail.rationale || "Sin detalle")}</p>
          <p class="small-note"><strong>Evidencia:</strong> ${escapeHtml(detail.evidence || "No reportada")}</p>
        </div>
      `;
    })
    .join("");

  const strengths = (result.strengths || []).map((v) => `<li>${escapeHtml(v)}</li>`).join("");
  const improvements = (result.improvements || []).map((v) => `<li>${escapeHtml(v)}</li>`).join("");
  const actions = (result.editorialActions || []).map((v) => `<li>${escapeHtml(v)}</li>`).join("");

  return `
    <p class="small-note">Fuente analizada: ${escapeHtml(result.source || "-")} · Caracteres: ${escapeHtml(result.extractedTextLength || 0)}</p>
    <h3>Diagnóstico por criterio</h3>
    <div class="criteria">${detailRows}</div>
    <h3>Fortalezas</h3>
    <ul class="list">${strengths || "<li>Sin datos</li>"}</ul>
    <h3>Mejoras</h3>
    <ul class="list">${improvements || "<li>Sin datos</li>"}</ul>
    <h3>Acciones editoriales</h3>
    <ul class="list">${actions || "<li>Sin acciones</li>"}</ul>
    <h3>Resumen</h3>
    <p>${escapeHtml(result.summary || "Sin resumen")}</p>
    <h3>Veredicto editorial</h3>
    <p>${escapeHtml(result.editorialVerdict || "Sin veredicto")}</p>
    <div class="actions">
      <button class="secondary" id="downloadReport">Descargar informe (.txt)</button>
    </div>
  `;
}

function bindEvents() {
  app.querySelectorAll("input[type='text'], input[type='password'], input[type='date']").forEach((input) => {
    input.addEventListener("input", (event) => {
      state[event.target.id] = event.target.value;
    });
  });
  const modelSelect = app.querySelector("#model");
  if (modelSelect) {
    modelSelect.addEventListener("change", (event) => {
      state.model = event.target.value;
    });
  }

  const textArea = app.querySelector("#articleText");
  if (textArea) {
    textArea.addEventListener("input", (event) => {
      state.articleText = event.target.value;
    });
  }

  const fileInput = app.querySelector("#pdfFile");
  if (fileInput) {
    fileInput.addEventListener("change", (event) => {
      state.pdfFile = event.target.files?.[0] || null;
      state.title = "";
      state.outlet = "";
      state.author = "";
      state.date = "";
      state.section = "";
      state.result = null;
      state.error = "";
      render();
    });
  }

  const analyzeButton = app.querySelector("#analyze");
  if (analyzeButton) {
    analyzeButton.addEventListener("click", analyzeArticle);
  }

  const resetButton = app.querySelector("#reset");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      state.title = "";
      state.outlet = "";
      state.author = "";
      state.date = "";
      state.section = "";
      state.articleText = "";
      state.pdfFile = null;
      state.error = "";
      state.result = null;
      render();
    });
  }

  const downloadButton = app.querySelector("#downloadReport");
  if (downloadButton) {
    downloadButton.addEventListener("click", downloadReport);
  }
}

function buildReportText(result) {
  const meta = result.metadata || {};
  const modelUsed = result.modelUsed || state.model || "(sin dato)";
  const lines = [];
  lines.push("RADAR DE CALIDAD PERIODISTICA - INFORME");
  lines.push("=====================================");
  lines.push(`Fecha de analisis: ${new Date().toISOString()}`);
  lines.push(`Modelo IA: ${modelUsed}`);
  lines.push(`Titulo: ${meta.title || state.title || "(sin dato)"}`);
  lines.push(`Medio: ${meta.outlet || state.outlet || "(sin dato)"}`);
  lines.push(`Autor: ${meta.author || state.author || "(sin dato)"}`);
  lines.push(`Fecha del articulo: ${meta.date || state.date || "(sin dato)"}`);
  lines.push(`Seccion: ${meta.section || state.section || "(sin dato)"}`);
  lines.push(`Fuente usada: ${result.source || "-"}`);
  lines.push(`Caracteres analizados: ${result.extractedTextLength || 0}`);
  lines.push("");
  lines.push(`Puntuacion global: ${result.overallScore}/100 (${result.label || scoreLabel(result.overallScore)})`);
  lines.push("");
  lines.push("DIAGNOSTICO POR CRITERIO");
  lines.push("------------------------");

  for (const item of criteria) {
    const detail = result.criteriaDetails?.[item.id] || {};
    lines.push(`${item.title}: ${detail.score ?? result.scores?.[item.id] ?? "-"}/5`);
    lines.push(`- Justificacion: ${detail.rationale || "Sin detalle"}`);
    lines.push(`- Evidencia: ${detail.evidence || "No reportada"}`);
  }

  lines.push("");
  lines.push("FORTALEZAS");
  lines.push("----------");
  for (const item of result.strengths || []) lines.push(`- ${item}`);

  lines.push("");
  lines.push("MEJORAS");
  lines.push("-------");
  for (const item of result.improvements || []) lines.push(`- ${item}`);

  lines.push("");
  lines.push("ACCIONES EDITORIALES");
  lines.push("--------------------");
  for (const item of result.editorialActions || []) lines.push(`- ${item}`);

  lines.push("");
  lines.push("RESUMEN");
  lines.push("-------");
  lines.push(result.summary || "Sin resumen");

  lines.push("");
  lines.push("VEREDICTO EDITORIAL");
  lines.push("-------------------");
  lines.push(result.editorialVerdict || "Sin veredicto");

  return lines.join("\n");
}

function sanitizeFilename(value) {
  return String(value || "informe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function downloadReport() {
  if (!state.result) return;

  const report = buildReportText(state.result);
  const blob = new Blob(["\uFEFF" + report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const datePart = new Date().toISOString().slice(0, 10);
  const titlePart = sanitizeFilename((state.result.metadata && state.result.metadata.title) || state.title || "articulo");
  const modelPart = sanitizeFilename(state.result.modelUsed || state.model || "modelo");
  anchor.href = url;
  anchor.download = `informe-${titlePart}-${modelPart}-${datePart}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function applyMetadataFromResult(result) {
  const meta = result?.metadata || {};
  for (const key of ["title", "outlet", "author", "date", "section"]) {
    state[key] = String(meta[key] || "").trim();
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el PDF."));
    reader.readAsDataURL(file);
  });
}

async function analyzeArticle() {
  state.error = "";

  if (!state.apiKey.trim()) {
    state.error = "Debes ingresar tu API key de OpenRouter.";
    render();
    return;
  }

  if (!state.articleText.trim() && !state.pdfFile) {
    state.error = "Debes subir un PDF o pegar texto del artículo.";
    render();
    return;
  }

  state.loading = true;
  state.result = null;
  render();

  try {
    const payload = {
      apiKey: state.apiKey.trim(),
      model: state.model.trim() || "openai/gpt-4.1-mini",
      title: state.title.trim(),
      outlet: state.outlet.trim(),
      author: state.author.trim(),
      date: state.date.trim(),
      section: state.section.trim(),
      articleText: state.articleText.trim()
    };

    if (!payload.articleText && state.pdfFile) {
      payload.pdfBase64 = await fileToBase64(state.pdfFile);
    }

    const { response, data } = await postEvaluate(payload);
    if (!response.ok) throw new Error(data?.error || "Error al evaluar el artículo.");

    state.result = data;
    applyMetadataFromResult(data);
  } catch (error) {
    if (String(error?.message || "").includes("BACKEND_UNREACHABLE")) {
      state.error = "No se puede conectar con el backend (puerto 5174). Ejecuta Ejecutar.cmd y vuelve a intentar.";
    } else {
      state.error = error.message || "Error inesperado.";
    }
  } finally {
    state.loading = false;
    render();
  }
}

async function postEvaluate(payload) {
  let lastError = null;

  for (const baseUrl of BACKEND_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}/api/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return { response, data };
    } catch (error) {
      lastError = error;
    }
  }

  const err = new Error(`BACKEND_UNREACHABLE: ${lastError?.message || "sin detalle"}`);
  throw err;
}

render();
