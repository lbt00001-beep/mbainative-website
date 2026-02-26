export const criteria = [
  {
    id: "claridad",
    title: "Claridad",
    description: "¿El texto es comprensible y directo?",
    rubric: {
      1: "Confuso, párrafos enredados, términos sin explicar.",
      3: "Se entiende, pero hay frases densas o tecnicismos sin contexto.",
      5: "Redacción limpia y precisa; cualquier lector lo sigue."
    }
  },
  {
    id: "veracidad",
    title: "Verificabilidad",
    description: "¿Afirma hechos comprobables con evidencia?",
    rubric: {
      1: "Afirmaciones sin datos o fuentes claras.",
      3: "Menciona datos, pero faltan detalles para verificar.",
      5: "Datos específicos, consistentes y verificables."
    }
  },
  {
    id: "fuentes",
    title: "Fuentes",
    description: "¿Incluye diversidad y calidad de fuentes?",
    rubric: {
      1: "Sin fuentes o una sola voz.",
      3: "Algunas fuentes, pero limitadas en variedad.",
      5: "Varias fuentes, con voces contrastadas."
    }
  },
  {
    id: "contexto",
    title: "Contexto",
    description: "¿Sitúa el hecho en su marco histórico o social?",
    rubric: {
      1: "Hecho aislado, sin explicación de causas o antecedentes.",
      3: "Aporta algo de contexto, pero es superficial.",
      5: "Conecta antecedentes, causas y consecuencias."
    }
  },
  {
    id: "balance",
    title: "Balance",
    description: "¿Reconoce perspectivas diferentes o contrapuntos?",
    rubric: {
      1: "Solo una perspectiva dominante.",
      3: "Menciona otra visión, pero no la desarrolla.",
      5: "Expone y contrasta varias posturas."
    }
  },
  {
    id: "estructura",
    title: "Estructura",
    description: "¿Organización lógica con un hilo claro?",
    rubric: {
      1: "Salta entre ideas sin orden.",
      3: "Tiene orden básico, con transiciones mejorables.",
      5: "Fluye de forma natural y consistente."
    }
  },
  {
    id: "dato",
    title: "Uso de datos",
    description: "¿Integra cifras, comparaciones y evidencia?",
    rubric: {
      1: "Sin cifras ni elementos cuantitativos.",
      3: "Incluye algunos datos, pero sin comparación.",
      5: "Datos relevantes, explicados y comparados."
    }
  },
  {
    id: "transparencia",
    title: "Transparencia",
    description: "¿Aclara limitaciones, dudas o metodología?",
    rubric: {
      1: "No reconoce incertidumbres.",
      3: "Menciona límites, sin profundizar.",
      5: "Aclara fuentes, límites y decisiones editoriales."
    }
  }
];

export const defaultScores = Object.fromEntries(criteria.map((item) => [item.id, 3]));

export function computeScore(scores) {
  const values = criteria.map((item) => Number(scores[item.id] ?? 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  const avg = values.length ? total / values.length : 0;
  return Math.round(avg * 20);
}

export function getScoreLabel(score) {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Buena";
  if (score >= 50) return "Aceptable";
  return "Baja";
}

export function extractSignals(text) {
  const cleaned = text.trim();
  const words = cleaned ? cleaned.split(/\s+/).length : 0;
  const sentences = cleaned ? cleaned.split(/[.!?]+/).filter(Boolean).length : 0;
  const numbers = cleaned ? (cleaned.match(/\d+/g) || []).length : 0;
  const quotes = cleaned ? (cleaned.match(/"|“|”|«|»/g) || []).length : 0;
  const sourceHits = cleaned
    ? (cleaned.match(/según|de acuerdo|fuente|informó|indicó|dijo|señaló/gi) || []).length
    : 0;

  return [
    { label: "Palabras", value: words },
    { label: "Oraciones", value: sentences },
    { label: "Cifras", value: numbers },
    { label: "Comillas", value: quotes },
    { label: "Menciones a fuentes", value: sourceHits }
  ];
}

export function buildInsights(scores) {
  const sorted = [...criteria].sort((a, b) => scores[a.id] - scores[b.id]);
  const weak = sorted.slice(0, 2);
  return weak.map(
    (item) =>
      `Refuerza ${item.title.toLowerCase()}: ${item.description.toLowerCase()}`
  );
}
