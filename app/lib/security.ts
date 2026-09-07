import { createHash } from 'node:crypto';

export class RequestError extends Error {
  constructor(message: string, public status = 400, public retryAfter?: number) { super(message); }
}

export function jsonError(error: unknown) {
  const known = error instanceof RequestError;
  return Response.json({ error: known ? error.message : 'No se pudo completar la solicitud. Inténtalo más tarde.' }, {
    status: known ? error.status : 500,
    headers: { 'Cache-Control': 'no-store', ...(known && error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}) },
  });
}

export function checkOrigin(request: Request) {
  const allowed = new Set(['https://mbainative.com', 'https://www.mbainative.com']);
  if (process.env.NODE_ENV !== 'production') allowed.add(new URL(request.url).origin);
  if (!allowed.has(request.headers.get('origin') || '')) throw new RequestError('Origen de solicitud no permitido.', 403);
}

export async function readJson(request: Request, maxBytes = 16_384): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RequestError('Envía la solicitud en formato JSON.', 415);
  }
  if (Number(request.headers.get('content-length')) > maxBytes) throw new RequestError('La solicitud es demasiado grande.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError('La solicitud está vacía.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new RequestError('La solicitud es demasiado grande.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const data: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data as Record<string, unknown>;
  } catch { throw new RequestError('La solicitud no contiene un objeto JSON válido.'); }
}

// Process-local protection; shared limits belong at the reverse proxy when scaling.
// No trust in client-supplied forwarded IP addresses.
export function createRateLimiter(now = Date.now) {
  const buckets = new Map<string, { count: number; reset: number }>();
  return (key: string, limit: number, windowMs: number) => {
    const time = now();
    for (const [id, bucket] of buckets) if (bucket.reset <= time) buckets.delete(id);
    const bucket = buckets.get(key) || { count: 0, reset: time + windowMs };
    if (bucket.count >= limit || (!buckets.has(key) && buckets.size >= 2000)) {
      throw new RequestError('Has alcanzado el límite temporal. Inténtalo más tarde.', 429, Math.max(1, Math.ceil((bucket.reset - time) / 1000)));
    }
    bucket.count++;
    buckets.set(key, bucket);
  };
}
export const rateLimit = createRateLimiter();
export const fingerprint = (value: string) => createHash('sha256').update(value).digest('hex');

export function requiredText(value: unknown, label: string, max: number, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    throw new RequestError(`${label}: introduce entre ${min} y ${max} caracteres.`);
  }
  return value.trim();
}
export function userApiKey(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new RequestError('Introduce tu clave de OpenRouter en Ajustes para utilizar la IA.', 401);
  const key = value.trim();
  if (!/^[A-Za-z0-9_-]{20,256}$/.test(key)) throw new RequestError('El formato de la clave de OpenRouter no es válido.');
  return key;
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
