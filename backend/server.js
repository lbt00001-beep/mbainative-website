import http from "node:http";
import pdfParse from "pdf-parse";

const port = Number(process.env.PORT || 5174);

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

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function extractJson(text) {
  const cleaned = String(text || "").trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : cleaned;
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

function cleanArray(value, min = 0, max = 4) {
  const arr = Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  return arr.slice(0, Math.max(min, max));
}

function isWeakText(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return true;
  return text.includes("sin detalle") || text.includes("no reportada") || text.includes("sin datos");
}

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
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 220);
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
  const lowered = candidates.map((s) => s.toLowerCase());

  for (let i = 0; i < lowered.length; i += 1) {
    if (keywords.some((k) => lowered[i].includes(k))) {
      return candidates[i].slice(0, 180);
    }
  }

  return (candidates[0] || String(articleText || "").slice(0, 180) || "No se identificó evidencia textual sólida.")
    .slice(0, 180);
}

function fallbackRationale(criterionId, score) {
  const low = "La evidencia disponible en el texto es insuficiente para sostener un estándar alto en este criterio.";
  const mid = "El criterio se cumple parcialmente: hay señales útiles, pero falta mayor precisión o contraste.";
  const high = "El artículo presenta señales consistentes para este criterio y sostiene la evaluación con elementos verificables.";
  const byCriterion = {
    claridad: "La redacción muestra tramos comprensibles, pero puede mejorar en precisión y definición de ideas clave.",
    veracidad: "Se observan afirmaciones con soporte limitado; faltan elementos de verificación más explícitos.",
    fuentes: "La diversidad y trazabilidad de fuentes no queda suficientemente demostrada en el texto analizado.",
    contexto: "Se aporta algo de marco, aunque no siempre conecta de forma completa causas, antecedentes y consecuencias.",
    balance: "Predomina una perspectiva; faltan contrapuntos desarrollados para equilibrar la cobertura.",
    estructura: "Existe hilo narrativo básico, pero la progresión argumental puede organizarse mejor.",
    dato: "Aparecen datos puntuales, pero falta comparación o atribución robusta para fortalecer conclusiones.",
    transparencia: "No se explicitan con suficiente detalle límites metodológicos o incertidumbres de la información."
  };
  const base = byCriterion[criterionId] || mid;
  if (score <= 2) return `${base} ${low}`;
  if (score >= 4) return `${base} ${high}`;
  return `${base} ${mid}`;
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

function validateAiJson(aiJson) {
  const errors = [];
  const details = buildCriteriaDetails(aiJson);

  for (const item of RUBRIC) {
    const detail = details[item.id];
    if (!detail || isWeakText(detail.rationale)) {
      errors.push(`Falta justificación sólida en ${item.id}.`);
    }
    if (!detail || isWeakText(detail.evidence)) {
      errors.push(`Falta evidencia textual en ${item.id}.`);
    }
  }

  const strengths = cleanArray(aiJson?.strengths);
  const improvements = cleanArray(aiJson?.improvements);
  if (strengths.length < 3) errors.push("strengths debe incluir al menos 3 elementos.");
  if (improvements.length < 3) errors.push("improvements debe incluir al menos 3 elementos.");

  const summary = String(aiJson?.summary || "").trim();
  const verdict = String(aiJson?.editorialVerdict || "").trim();
  if (summary.length < 80) errors.push("summary es demasiado breve.");
  if (verdict.length < 20) errors.push("editorialVerdict es demasiado breve.");

  return { ok: errors.length === 0, errors };
}

function extractMetadataHeuristic(articleText) {
  const lines = String(articleText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const titleCandidate = lines.find((line) => line.length > 20 && line.length < 140) || "";
  return {
    title: titleCandidate,
    outlet: "",
    author: "",
    date: "",
    section: ""
  };
}

function normalizeMetadata(payload, aiJson, heuristicMeta) {
  const aiMeta = aiJson?.metadataExtracted || {};
  const take = (key) => {
    const user = String(payload?.[key] || "").trim();
    if (user) return user;
    const ai = String(aiMeta?.[key] || "").trim();
    if (ai) return ai;
    return String(heuristicMeta?.[key] || "").trim();
  };

  return {
    title: take("title"),
    outlet: take("outlet"),
    author: take("author"),
    date: take("date"),
    section: take("section")
  };
}

function fillMinimumItems(items, fallback, total = 3) {
  const output = [...items];
  for (const extra of fallback) {
    if (output.length >= total) break;
    output.push(extra);
  }
  return output.slice(0, total);
}

function buildNormalizedResult(aiJson, articleText, payload) {
  const criteriaDetails = enforceCriteriaDetails(buildCriteriaDetails(aiJson), articleText);
  const scores = {};
  for (const item of RUBRIC) {
    scores[item.id] = criteriaDetails[item.id].score;
  }

  const avg = RUBRIC.reduce((sum, item) => sum + scores[item.id], 0) / RUBRIC.length;
  const overallScore = Math.round(avg * 20);

  let label = "Baja";
  if (overallScore >= 85) label = "Excelente";
  else if (overallScore >= 70) label = "Buena";
  else if (overallScore >= 50) label = "Aceptable";

  const text = String(articleText || "").trim();
  const words = text ? text.split(/\s+/).length : 0;
  const sentences = text ? text.split(/[.!?]+/).filter(Boolean).length : 0;

  const strengthsRaw = cleanArray(aiJson?.strengths, 0, 5);
  const improvementsRaw = cleanArray(aiJson?.improvements, 0, 5);
  const editorialActionsRaw = cleanArray(aiJson?.editorialActions, 0, 5);

  const strengths = fillMinimumItems(strengthsRaw, [
    "Presenta hilo narrativo identificable.",
    "Contiene información contextual útil.",
    "Permite construir una hipótesis editorial."
  ]);

  const improvements = fillMinimumItems(improvementsRaw, [
    "Añadir fuentes verificables con cita explícita.",
    "Diferenciar hechos de opinión.",
    "Incluir datos comparables y trazables."
  ]);

  const editorialActions = fillMinimumItems(editorialActionsRaw, improvements, 3);

  const summary = String(aiJson?.summary || "").trim();
  const editorialVerdict = String(aiJson?.editorialVerdict || "").trim() || improvements[0];
  const heuristicMeta = extractMetadataHeuristic(articleText);

  return {
    overallScore,
    label,
    scores,
    criteriaDetails,
    strengths,
    improvements,
    editorialActions,
    summary,
    editorialVerdict,
    metadata: normalizeMetadata(payload, aiJson, heuristicMeta),
    signals: {
      words,
      sentences
    }
  };
}

async function readJsonBody(req, maxBytes = 8 * 1024 * 1024) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new Error("Payload demasiado grande (máximo 8MB).");
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw || "{}");
}

async function extractArticleText({ pdfBase64, articleText }) {
  const manualText = String(articleText || "").trim();
  if (manualText) {
    return { articleText: manualText, source: "manual" };
  }

  const encoded = String(pdfBase64 || "").trim();
  if (!encoded) {
    throw new Error("Debes subir un PDF o pegar el texto del artículo.");
  }

  const buffer = Buffer.from(encoded, "base64");
  const parsed = await pdfParse(buffer);
  const text = String(parsed.text || "").trim();

  if (!text) {
    throw new Error("No se pudo extraer texto útil del PDF.");
  }

  return { articleText: text, source: "pdf" };
}

function buildPrompt(payload, articleText) {
  const criteriaText = RUBRIC.map((item) => `- ${item.id}: ${item.title}`).join("\n");

  return [
    "Eres editor senior de calidad periodística y fact-checking.",
    "Evalúa con rigor editorial real, evita generalidades y justifica cada nota con evidencia textual del artículo.",
    "Devuelve SOLO JSON válido (sin markdown) con esta forma exacta:",
    "{",
    '  "criteriaDetails": {',
    '    "claridad": { "score": 1-5, "rationale": "...", "evidence": "..." },',
    '    "veracidad": { "score": 1-5, "rationale": "...", "evidence": "..." },',
    '    "fuentes": { "score": 1-5, "rationale": "...", "evidence": "..." },',
    '    "contexto": { "score": 1-5, "rationale": "...", "evidence": "..." },',
    '    "balance": { "score": 1-5, "rationale": "...", "evidence": "..." },',
    '    "estructura": { "score": 1-5, "rationale": "...", "evidence": "..." },',
    '    "dato": { "score": 1-5, "rationale": "...", "evidence": "..." },',
    '    "transparencia": { "score": 1-5, "rationale": "...", "evidence": "..." }',
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
    "- editorialVerdict: una recomendación final breve para redacción.",
    "- Si falta evidencia para un criterio, baja la puntuación y explica por qué.",
    "Rúbrica:",
    criteriaText,
    "\nMetadata aportada por usuario:",
    JSON.stringify(
      {
        title: payload.title || "",
        outlet: payload.outlet || "",
        author: payload.author || "",
        date: payload.date || "",
        section: payload.section || ""
      },
      null,
      2
    ),
    "\nTexto del artículo:",
    articleText
  ].join("\n");
}

function buildRepairPrompt(rawModelOutput, validationErrors) {
  return [
    "Corrige tu salida anterior y devuelve SOLO JSON válido.",
    "No añadas markdown ni texto adicional.",
    "Errores detectados:",
    ...validationErrors.map((err) => `- ${err}`),
    "Salida anterior del modelo:",
    rawModelOutput
  ].join("\n");
}

async function callOpenRouterRaw({ apiKey, model, prompt }) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Radar de Calidad Periodistica"
    },
    body: JSON.stringify({
      model: model || "openai/gpt-4.1-mini",
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter error (${response.status}): ${raw.slice(0, 300)}`);
  }

  const json = JSON.parse(raw);
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter no devolvió contenido evaluable.");
  }

  return content;
}

async function evaluateWithRetry({ apiKey, model, prompt }) {
  const firstContent = await callOpenRouterRaw({ apiKey, model, prompt });

  let firstJson;
  try {
    firstJson = extractJson(firstContent);
  } catch {
    firstJson = null;
  }

  if (firstJson) {
    const check = validateAiJson(firstJson);
    if (check.ok) return firstJson;

    const repairPrompt = buildRepairPrompt(firstContent, check.errors);
    const secondContent = await callOpenRouterRaw({ apiKey, model, prompt: repairPrompt });
    const secondJson = extractJson(secondContent);
    const secondCheck = validateAiJson(secondJson);
    if (secondCheck.ok) return secondJson;
    return secondJson;
  }

  const repairPrompt = buildRepairPrompt(firstContent, ["JSON inválido en la primera respuesta."]);
  const secondContent = await callOpenRouterRaw({ apiKey, model, prompt: repairPrompt });
  return extractJson(secondContent);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (req.method === "POST" && req.url === "/api/evaluate") {
      const body = await readJsonBody(req);
      const apiKey = String(body.apiKey || "").trim();
      const selectedModel = String(body.model || "").trim() || "openai/gpt-4.1-mini";
      if (!apiKey) {
        sendJson(res, 400, { error: "Falta la API key de OpenRouter." });
        return;
      }

      const { articleText, source } = await extractArticleText(body);
      const prompt = buildPrompt(body, articleText);
      const aiJson = await evaluateWithRetry({
        apiKey,
        model: selectedModel,
        prompt
      });

      const result = buildNormalizedResult(aiJson, articleText, body);
      sendJson(res, 200, {
        source,
        modelUsed: selectedModel,
        extractedTextLength: articleText.length,
        ...result
      });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Error interno" });
  }
});

server.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
