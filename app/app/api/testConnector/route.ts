import { type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, apiKey } = body;
    const start = Date.now();

    if (type === 'openrouter') {
      const keyToUse = (apiKey && apiKey.trim())
        ? apiKey.trim()
        : process.env.OPENROUTER_API_KEY;

      if (!keyToUse) {
        return new Response(JSON.stringify({
          ok: false,
          unconfigured: true,
          status: 401,
          latency: 0,
          error: "Clave no configurada. Introduce tu API Key de OpenRouter abajo para activar el motor de IA.",
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: {
          "Authorization": `Bearer ${keyToUse}`,
        },
      });

      const latency = Date.now() - start;

      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({
          ok: false,
          status: res.status,
          latency,
          error: `Error de autenticación (${res.status}): Verifique la clave ingresada.`,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify({
        ok: true,
        status: 200,
        latency,
        label: data?.data?.label || "Clave Válida",
        usage: data?.data?.usage ? `$${Number(data.data.usage).toFixed(4)}` : "$0.00",
        isFreeTier: data?.data?.is_free_tier ?? false,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (type === 'yahooChart') {
      const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d", {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const latency = Date.now() - start;
      return new Response(JSON.stringify({
        ok: res.ok,
        status: res.status,
        latency,
        error: res.ok ? null : `Fallo en Yahoo Chart API (${res.status})`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (type === 'yahooQuote') {
      const res = await fetch("https://query2.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d", {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const latency = Date.now() - start;
      return new Response(JSON.stringify({
        ok: res.ok,
        status: res.status,
        latency,
        error: res.ok ? null : `Fallo en Yahoo Quote Server (${res.status})`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (type === 'sentiment') {
      const res = await fetch("https://query1.finance.yahoo.com/v1/finance/search?q=AAPL&newsCount=1", {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const latency = Date.now() - start;
      return new Response(JSON.stringify({
        ok: res.ok,
        status: res.status,
        latency,
        error: res.ok ? null : `Fallo en News API (${res.status})`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: "Tipo de conector desconocido" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ ok: false, error: error?.message || "Error al probar conector" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
