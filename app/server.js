import express from "express";
import pdfParse from "pdf-parse";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const FRONTEND_DIR = resolve(__dirname, "public");

const app = express();

/* ============ CONFIG ============ */
// Support .env file for API key
let envApiKey = "";
try {
  if (existsSync(".env")) {
    const envContent = readFileSync(".env", "utf8");
    const match = envContent.match(/OPENROUTER_API_KEY\s*=\s*(.+)/);
    if (match) envApiKey = match[1].trim().replace(/^["']|["']$/g, "");
  }
} catch { }
envApiKey = process.env.OPENROUTER_API_KEY || envApiKey;

const port = Number(process.env.PORT || 5174);

/* ============ RUBRIC ============ */
const RUBRIC = [
  { id: "claridad", title: "Claridad" },
  { id: "veracidad", title: "Verificabilidad" },
  { id: "fuentes", title: "Fuentes" },
  { id: "contexto", title: "Contexto" },
  { id: "balance", title: "Balance" },
  { id: "estructura", title: "Estructura" },
  { id: "dato", title: "Uso de datos" },
  { id: "transparencia", title: "Transparencia" }
];

const RUBRIC_IDS = new Set(RUBRIC.map(r => r.id));

/* ============ RESPONSE SCHEMA ============ */
const RESPONSE_SCHEMA = {
  required: ["criteriaDetails", "strengths", "improvements", "editorialActions", "summary", "editorialVerdict"],
  criteriaDetailKeys: ["score", "rationale", "evidence"],
  arrayFields: { strengths: 3, improvements: 3, editorialActions: 3 },
  stringMinLengths: { summary: 80, editorialVerdict: 20 },
};

function validateSchema(aiJson) {
  const errors = [];

  // Check top-level required fields
  for (const field of RESPONSE_SCHEMA.required) {
    if (aiJson[field] === undefined || aiJson[field] === null) {
      errors.push(`Campo requerido ausente: ${field}`);
    }
  }

  // Validate criteriaDetails structure
  const details = aiJson?.criteriaDetails || {};
  for (const item of RUBRIC) {
    const d = details[item.id];
    if (!d) {
      errors.push(`Falta criterio: ${item.id}`);
      continue;
    }
    if (typeof d.score !== "number" || d.score < 1 || d.score > 5) {
      errors.push(`${item.id}.score debe ser 1-5, recibido: ${d.score}`);
    }
    if (isWeakText(d.rationale)) {
      errors.push(`${item.id}.rationale es débil o vacío.`);
    }
    if (isWeakText(d.evidence)) {
      errors.push(`${item.id}.evidence es débil o vacío.`);
    }
  }

  // Validate arrays
  for (const [field, minLen] of Object.entries(RESPONSE_SCHEMA.arrayFields)) {
    const arr = cleanArray(aiJson?.[field]);
    if (arr.length < minLen) {
      errors.push(`${field} necesita al menos ${minLen} elementos, tiene ${arr.length}.`);
    }
  }

  // Validate string lengths
  for (const [field, minLen] of Object.entries(RESPONSE_SCHEMA.stringMinLengths)) {
    const val = String(aiJson?.[field] || "").trim();
    if (val.length < minLen) {
      errors.push(`${field} demasiado breve (${val.length} < ${minLen} chars).`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/* ============ HELPERS ============ */
function sendJson(res, statusCode, data) {
  res.status(statusCode).json(data);
}

function extractJson(text) {
  const cleaned = String(text || "").trim();
  // Remove <think>...</think> blocks from reasoning models
  const noThink = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced = noThink.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : noThink;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No se encontró JSON válido en la respuesta del modelo.");
  }
  return JSON.parse(candidate.slice(first, last + 1));
}

function clampScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 3;
  return Math.min(5, Math.max(1, Math.round(num)));
}

function cleanArray(value, min = 0, max = 5) {
  const arr = Array.isArray(value)
    ? value.map(item => String(item || "").trim()).filter(Boolean)
    : [];
  return arr.slice(0, Math.max(min, max));
}

function isWeakText(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text || text.length < 10) return true;
  return text.includes("sin detalle") || text.includes("no reportada") || text.includes("sin datos");
}

/* ============ CRITERIA DETAILS ============ */
function buildCriteriaDetails(aiJson) {
  const detailsInput = aiJson?.criteriaDetails || {};
  const details = {};
  for (const item of RUBRIC) {
    const detail = detailsInput[item.id] || {};
    details[item.id] = {
      score: clampScore(detail.score ?? aiJson?.scores?.[item.id]),
      rationale: String(detail.rationale || "").trim(),
      evidence: String(detail.evidence || "").trim()
    };
  }
  return details;
}

function getSentenceCandidates(articleText) {
  return String(articleText || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 40 && s.length <= 220);
}

function pickEvidence(articleText, criterionId) {
  const keywordsByCriterion = {
    claridad: ["explica", "describe", "señala", "afirma"],
    veracidad: ["dato", "%", "cifra", "según", "informe"],
    fuentes: ["según", "fuente", "declaró", "dijo", "entrevista"],
    contexto: ["antes", "después", "históric", "contexto", "antecedente"],
    balance: ["sin embargo", "por otro lado", "aunque", "mientras"],
    estructura: ["primero", "luego", "finalmente", "además"],
    dato: ["%", "millones", "miles", "estadística", "encuesta"],
    transparencia: ["limitación", "metodología", "no se pudo", "margen de error"]
  };
  const candidates = getSentenceCandidates(articleText);
  const keywords = keywordsByCriterion[criterionId] || [];
  const lowered = candidates.map(s => s.toLowerCase());
  for (let i = 0; i < lowered.length; i++) {
    if (keywords.some(k => lowered[i].includes(k))) return candidates[i].slice(0, 180);
  }
  return (candidates[0] || String(articleText || "").slice(0, 180) || "No se identificó evidencia textual sólida.").slice(0, 180);
}

function fallbackRationale(criterionId, score) {
  const byCriterion = {
    claridad: "La redacción muestra tramos comprensibles, pero puede mejorar en precisión.",
    veracidad: "Se observan afirmaciones con soporte limitado; faltan elementos de verificación.",
    fuentes: "La diversidad y trazabilidad de fuentes no queda suficientemente demostrada.",
    contexto: "Se aporta algo de marco, aunque no siempre conecta causas y consecuencias.",
    balance: "Predomina una perspectiva; faltan contrapuntos desarrollados.",
    estructura: "Existe hilo narrativo básico, pero la progresión puede organizarse mejor.",
    dato: "Aparecen datos puntuales, pero falta comparación o atribución robusta.",
    transparencia: "No se explicitan con suficiente detalle límites o incertidumbres."
  };
  const base = byCriterion[criterionId] || "El criterio se cumple parcialmente.";
  if (score <= 2) return `${base} La evidencia disponible es insuficiente para un estándar alto.`;
  if (score >= 4) return `${base} El artículo presenta señales consistentes y verificables.`;
  return `${base} Hay señales útiles, pero falta mayor precisión o contraste.`;
}

function enforceCriteriaDetails(details, articleText) {
  const output = {};
  for (const item of RUBRIC) {
    const current = details[item.id] || {};
    output[item.id] = {
      score: clampScore(current.score),
      rationale: isWeakText(current.rationale)
        ? fallbackRationale(item.id, clampScore(current.score))
        : String(current.rationale).trim(),
      evidence: isWeakText(current.evidence)
        ? pickEvidence(articleText, item.id)
        : String(current.evidence).trim().slice(0, 180)
    };
  }
  return output;
}

/* ============ METADATA ============ */
function extractMetadataHeuristic(articleText) {
  const lines = String(articleText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const titleCandidate = lines.find(l => l.length > 20 && l.length < 140) || "";
  return { title: titleCandidate, outlet: "", author: "", date: "", section: "" };
}

function normalizeMetadata(payload, aiJson, heuristicMeta) {
  const aiMeta = aiJson?.metadataExtracted || {};
  const take = key => {
    const user = String(payload?.[key] || "").trim();
    if (user) return user;
    const ai = String(aiMeta?.[key] || "").trim();
    if (ai) return ai;
    return String(heuristicMeta?.[key] || "").trim();
  };
  return { title: take("title"), outlet: take("outlet"), author: take("author"), date: take("date"), section: take("section") };
}

/* ============ RESULT BUILDER ============ */
function fillMinimumItems(items, fallback, total = 3) {
  const output = [...items];
  for (const extra of fallback) { if (output.length >= total) break; output.push(extra); }
  return output.slice(0, total);
}

function buildNormalizedResult(aiJson, articleText, payload) {
  const criteriaDetails = enforceCriteriaDetails(buildCriteriaDetails(aiJson), articleText);
  const scores = {};
  for (const item of RUBRIC) scores[item.id] = criteriaDetails[item.id].score;

  const avg = RUBRIC.reduce((sum, item) => sum + scores[item.id], 0) / RUBRIC.length;
  const overallScore = Math.round(avg * 20);

  let label = "Baja";
  if (overallScore >= 85) label = "Excelente";
  else if (overallScore >= 70) label = "Buena";
  else if (overallScore >= 50) label = "Aceptable";

  const text = String(articleText || "").trim();
  const words = text ? text.split(/\s+/).length : 0;
  const sentences = text ? text.split(/[.!?]+/).filter(Boolean).length : 0;

  const strengths = fillMinimumItems(cleanArray(aiJson?.strengths, 0, 5), [
    "Presenta hilo narrativo identificable.",
    "Contiene información contextual útil.",
    "Permite construir una hipótesis editorial."
  ]);
  const improvements = fillMinimumItems(cleanArray(aiJson?.improvements, 0, 5), [
    "Añadir fuentes verificables con cita explícita.",
    "Diferenciar hechos de opinión.",
    "Incluir datos comparables y trazables."
  ]);
  const editorialActions = fillMinimumItems(cleanArray(aiJson?.editorialActions, 0, 5), improvements, 3);

  return {
    overallScore, label, scores, criteriaDetails,
    strengths, improvements, editorialActions,
    summary: String(aiJson?.summary || "").trim(),
    editorialVerdict: String(aiJson?.editorialVerdict || "").trim() || improvements[0],
    metadata: normalizeMetadata(payload, aiJson, extractMetadataHeuristic(articleText)),
    signals: { words, sentences }
  };
}

/* ============ NETWORK ============ */

async function extractArticleText({ pdfBase64, articleText, enableOcr }) {
  const manualText = String(articleText || "").trim();
  if (manualText) return { articleText: manualText, source: "manual" };

  const encoded = String(pdfBase64 || "").trim();
  if (!encoded) throw new Error("Debes subir un PDF o pegar el texto del artículo.");

  const buffer = Buffer.from(encoded, "base64");
  const parsed = await pdfParse(buffer);
  let text = String(parsed.text || "").trim();

  // If text is too short and OCR is enabled, mark it
  if (text.length < 100 && enableOcr) {
    return {
      articleText: text || "[PDF escaneado sin texto extraíble — se requiere OCR del lado del cliente]",
      source: "pdf-ocr-needed",
      ocrHint: true
    };
  }

  if (!text) throw new Error("No se pudo extraer texto útil del PDF.");
  return { articleText: text, source: "pdf" };
}

/* ============ PROMPT ============ */
function buildPrompt(payload, articleText) {
  const criteriaText = RUBRIC.map(item => `- ${item.id}: ${item.title}`).join("\n");
  return [
    "Eres editor senior de calidad periodística y fact-checking.",
    "Evalúa con rigor editorial real, evita generalidades y justifica cada nota con evidencia textual del artículo.",
    "Devuelve SOLO JSON válido (sin markdown ni texto adicional) con esta forma exacta:",
    "{",
    '  "criteriaDetails": {',
    ...RUBRIC.map(item => `    "${item.id}": { "score": 1-5, "rationale": "...", "evidence": "..." },`),
    "  },",
    '  "strengths": ["...", "...", "..."],',
    '  "improvements": ["...", "...", "..."],',
    '  "editorialActions": ["...", "...", "..."],',
    '  "summary": "...",',
    '  "editorialVerdict": "...",',
    '  "metadataExtracted": { "title": "", "outlet": "", "author": "", "date": "", "section": "" }',
    "}",
    "Reglas estrictas:",
    "- score entero entre 1 y 5.",
    "- rationale: 1-2 frases concretas (sin relleno).",
    "- evidence: cita breve literal del texto (max 180 caracteres).",
    "- strengths/improvements/editorialActions: exactamente 3 elementos cada lista.",
    "- summary: 4-6 frases con conclusión editorial.",
    "- editorialVerdict: una recomendación final breve.",
    "- Si falta evidencia para un criterio, baja la puntuación y explica por qué.",
    "- IMPORTANTE: Devuelve SOLO el JSON, sin texto antes ni después.",
    "Rúbrica:", criteriaText,
    "\nMetadata aportada por usuario:",
    JSON.stringify({ title: payload.title || "", outlet: payload.outlet || "", author: payload.author || "", date: payload.date || "", section: payload.section || "" }, null, 2),
    "\nTexto del artículo:",
    articleText
  ].join("\n");
}

function buildRepairPrompt(rawModelOutput, validationErrors) {
  return [
    "Corrige tu salida anterior y devuelve SOLO JSON válido.",
    "No añadas markdown, texto adicional, ni bloques think.",
    "Errores detectados:",
    ...validationErrors.map(err => `- ${err}`),
    "Salida anterior del modelo:",
    rawModelOutput.slice(0, 3000)
  ].join("\n");
}

/* ============ OPENROUTER ============ */
async function callOpenRouterRaw({ apiKey, model, prompt }) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.RENDER_EXTERNAL_URL || "http://localhost:5173",
      "X-Title": "Radar de Calidad Periodistica"
    },
    body: JSON.stringify({
      model: model || "openai/gpt-4.1-mini",
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`OpenRouter error (${response.status}): ${raw.slice(0, 300)}`);
  const json = JSON.parse(raw);
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter no devolvió contenido evaluable.");
  return content;
}

async function evaluateWithRetry({ apiKey, model, prompt }) {
  const firstContent = await callOpenRouterRaw({ apiKey, model, prompt });
  let firstJson;
  try { firstJson = extractJson(firstContent); } catch { firstJson = null; }

  if (firstJson) {
    const check = validateSchema(firstJson);
    if (check.ok) return firstJson;

    console.log(`[Retry] Schema validation failed (${check.errors.length} errors), attempting repair...`);
    const repairPrompt = buildRepairPrompt(firstContent, check.errors);
    const secondContent = await callOpenRouterRaw({ apiKey, model, prompt: repairPrompt });
    const secondJson = extractJson(secondContent);
    return secondJson; // Best effort
  }

  console.log("[Retry] JSON parse failed, attempting repair...");
  const repairPrompt = buildRepairPrompt(firstContent, ["JSON inválido en la primera respuesta."]);
  const secondContent = await callOpenRouterRaw({ apiKey, model, prompt: repairPrompt });
  return extractJson(secondContent);
}

/* ============ SERVER ============ */

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// JSON body parsing (8MB limit for PDFs)
app.use(express.json({ limit: "8mb" }));

// API routes
app.get("/health", (req, res) => {
  sendJson(res, 200, { status: "ok", envKeySet: !!envApiKey });
});

app.post("/api/evaluate", async (req, res) => {
  try {
    const body = req.body;
    const apiKey = String(body.apiKey || "").trim() || envApiKey;
    const selectedModel = String(body.model || "").trim() || "openai/gpt-4.1-mini";

    if (!apiKey) {
      return sendJson(res, 400, { error: "Falta la API key de OpenRouter (ni en body ni en .env)." });
    }

    const { articleText, source, ocrHint } = await extractArticleText(body);
    const prompt = buildPrompt(body, articleText);
    const aiJson = await evaluateWithRetry({ apiKey, model: selectedModel, prompt });
    const result = buildNormalizedResult(aiJson, articleText, body);

    sendJson(res, 200, {
      source, modelUsed: selectedModel,
      extractedTextLength: articleText.length,
      ...(ocrHint ? { ocrHint: true } : {}),
      ...result
    });
  } catch (error) {
    console.error("[Error]", error.message);
    sendJson(res, 500, { error: error.message || "Error interno" });
  }
});

// Serve frontend static files
app.use(express.static(FRONTEND_DIR));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(resolve(FRONTEND_DIR, "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Backend escuchando en http://localhost:${port}`);
  if (envApiKey) console.log("🔑 API key cargada desde .env");
  else console.log("⚠️  Sin API key en .env — se requiere desde el frontend");
});
