import { checkOrigin, fingerprint, jsonError, rateLimit, readJson, RequestError, userApiKey } from '@/lib/security';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await readJson(request, 2048);
    rateLimit('connectors:global', 240, 60_000);
    const started = Date.now();
    if (body.type === 'openrouter') {
      const key = userApiKey(body.apiKey);
      rateLimit('connector:' + fingerprint(key), 12, 60_000);
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', { headers:{Authorization:'Bearer '+key}, signal:AbortSignal.timeout(10_000), cache:'no-store' });
      if (!res.ok) throw new RequestError('OpenRouter no ha aceptado la clave. Comprueba que sigue activa.', 401);
      return Response.json({ok:true,status:200,latency:Date.now()-started,label:'Clave personal verificada'}, {headers:{'Cache-Control':'no-store'}});
    }
    const urls: Record<string,string> = {
      yahooChart:'https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d',
      yahooQuote:'https://query2.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d',
      sentiment:'https://query1.finance.yahoo.com/v1/finance/search?q=AAPL&newsCount=1',
    };
    if (typeof body.type !== 'string' || !Object.hasOwn(urls, body.type)) throw new RequestError('Tipo de conector desconocido.');
    const res = await fetch(urls[body.type], {headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(10_000)});
    return Response.json({ok:res.ok,status:res.status,latency:Date.now()-started,error:res.ok ? null : 'La fuente de datos no está disponible temporalmente.'},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return jsonError(error); }
}
