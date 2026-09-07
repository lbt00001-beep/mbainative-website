// Availability and token rates checked against OpenRouter's public models API, 2026-09-07.
// Estimates are illustrative: 2,000 input + 1,000 output tokens, excluding extra tools/reasoning.
export interface AIModelOption {
  id: string; name: string; provider: string; badge: string;
  inputCost: string; outputCost: string; costPerReport: string;
  reportsPerDollar: string; desc: string; isFree?: boolean;
}
export const DEFAULT_AI_MODEL = 'google/gemini-3.5-flash-lite';
const models = [
  { id:'z-ai/glm-5.3-flash', name:'GLM 5.3 Flash', provider:'Z.ai', input:0.075, output:0.25, desc:'Modelo de propósito general orientado a respuestas rápidas.' },
  { id:DEFAULT_AI_MODEL, name:'Gemini 3.5 Flash Lite', provider:'Google', input:0.3, output:2.5, desc:'Opción predeterminada para generar un borrador estructurado.' },
  { id:'google/gemini-2.5-flash-lite', name:'Gemini 2.5 Flash Lite', provider:'Google', input:0.1, output:0.4, desc:'Alternativa de bajo consumo para tareas de texto.' },
  { id:'deepseek/deepseek-chat', name:'DeepSeek V3', provider:'DeepSeek', input:0.32, output:0.89, desc:'Alternativa para contrastar el análisis y su redacción.' },
  { id:'openai/gpt-4o-mini', name:'GPT-4o mini', provider:'OpenAI', input:0.15, output:0.6, desc:'Modelo compacto para tareas de redacción y síntesis.' },
];
export const AVAILABLE_MODELS: AIModelOption[] = models.map(m => {
  const estimate = (m.input * 2000 + m.output * 1000) / 1_000_000;
  return { ...m, badge:m.id === DEFAULT_AI_MODEL ? 'Predeterminado' : 'Alternativa', inputCost:`$${m.input} / 1M`, outputCost:`$${m.output} / 1M`, costPerReport:`~$${estimate.toFixed(5)}`, reportsPerDollar:`≈ ${Math.floor(1/estimate).toLocaleString('es-ES')} (estimación)` };
});
export const AI_MODEL_IDS: string[] = models.map(m => m.id);
