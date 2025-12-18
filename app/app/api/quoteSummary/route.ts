import { type NextRequest } from 'next/server'
// Using native fetch instead of undici to rule out library-specific issues.
// import { fetch } from 'undici';

// -------------------- Utils --------------------
function sanitizeTicker(t: string | null): string | null {
  if (!t) return null;
  const up = String(t).trim().toUpperCase().replaceAll(".", "-"); // BRK.B -> BRK-B
  if (!/^[A-Z0-9=\-]{1,16}$/.test(up)) return null;
  return up;
}

const ALLOWED_MODULES = new Set([
  "price",
  "summaryDetail",
  "defaultKeyStatistics",
  "financialData",
  "assetProfile",
]);

function sanitizeModules(modStr: string | null): string[] {
  const mods = (modStr || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((m) => ALLOWED_MODULES.has(m));

  return mods.length
    ? mods
    : ["price", "summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile"];
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function cookieFromSetCookies(setCookies: string[]): string {
  const pairs: string[] = [];
  for (const c of setCookies || []) {
    const first = String(c).split(";")[0].trim();
    if (first) pairs.push(first);
  }
  return pairs.join("; ");
}

// -------------------- Yahoo session cache (cookie + crumb) --------------------
let SESSION = { cookie: null as string | null, crumb: null as string | null, ts: 0 };
let refreshing: Promise<any> | null = null;
const TTL_MS = 20 * 60 * 1000;

function isFresh(): boolean {
  return !!(SESSION.cookie && SESSION.crumb && Date.now() - SESSION.ts < TTL_MS);
}

async function getCookieViaFC(): Promise<string | null> {
  console.log("DEBUG: Attempting to get cookie from fc.yahoo.com");
  const r = await fetch("https://fc.yahoo.com/", {
    redirect: "manual",
    headers: {
      "User-Agent": UA,
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
    },
  });
  console.log("DEBUG: Response status from fc.yahoo.com:", r.status);
  console.log("DEBUG: Response headers from fc.yahoo.com:", r.headers);


  const setCookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  console.log("DEBUG: Raw Set-Cookie header:", setCookies);

  const cookie = cookieFromSetCookies(setCookies);
  console.log("DEBUG: Extracted cookie:", cookie);
  return cookie || null;
}

async function getCrumb(cookie: string): Promise<string> {
  console.log("DEBUG: Attempting to get crumb with cookie:", cookie);
  const r = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: {
      "User-Agent": UA,
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      Cookie: cookie,
      Referer: "https://finance.yahoo.com/",
    },
  });

  const text = (await r.text()).trim();

  if (!r.ok || !text || text.includes("<html")) {
    console.error("DEBUG: Failed to get crumb. Status:", r.status, "Body:", text.slice(0, 500));
    const err = new Error(`No se pudo obtener crumb (HTTP ${r.status}).`);
    (err as any).status = 502;
    (err as any).body = text.slice(0, 800);
    throw err;
  }
  console.log("DEBUG: Successfully got crumb:", text);
  return text;
}

async function refreshSession(): Promise<{ cookie: string, crumb: string, ts: number }> {
  if (isFresh()) return SESSION as { cookie: string, crumb: string, ts: number };;
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const cookie = await getCookieViaFC();
    if (!cookie) {
      const err = new Error("No se pudieron obtener cookies de Yahoo (bloqueo/consent).");
      (err as any).status = 502;
      (err as any).body = "No hubo Set-Cookie desde fc.yahoo.com.";
      throw err;
    }
    const crumb = await getCrumb(cookie);
    SESSION = { cookie, crumb, ts: Date.now() };
    return SESSION;
  })();

  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

function parseQuoteSummary(text: string): any {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    const err = new Error("Respuesta no-JSON desde Yahoo");
    (err as any).status = 502;
    (err as any).body = text.slice(0, 800);
    throw err;
  }

  const error = json?.quoteSummary?.error;
  if (error) {
    const err = new Error(error?.description || "Error quoteSummary");
    (err as any).status = 502;
    (err as any).body = JSON.stringify(error);
    throw err;
  }

  const result = json?.quoteSummary?.result?.[0];
  if (!result) {
    const err = new Error("Yahoo devolvió result vacío (ticker inválido o bloqueo).");
    (err as any).status = 502;
    (err as any).body = text.slice(0, 800);
    throw err;
  }
  return result;
}

async function fetchQuoteSummary(ticker: string, modules: string[]): Promise<any> {
  const { cookie, crumb } = await refreshSession();
  const qs = encodeURIComponent(modules.join(","));

  const url =
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}` +
    `?modules=${qs}&crumb=${encodeURIComponent(crumb)}`;

  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json,text/plain,*/*",
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      Cookie: cookie,
      Referer: `https://finance.yahoo.com/quote/${ticker}`,
    },
  });

  const text = await r.text();

  if (r.status === 401 || r.status === 403) {
    SESSION = { cookie: null, crumb: null, ts: 0 };
    const { cookie: c2, crumb: cr2 } = await refreshSession();

    const url2 =
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}` +
      `?modules=${qs}&crumb=${encodeURIComponent(cr2)}`;

    const r2 = await fetch(url2, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
        Cookie: c2,
        Referer: `https://finance.yahoo.com/quote/${ticker}`,
      },
    });

    const text2 = await r2.text();
    if (!r2.ok) {
      const err = new Error(`Yahoo HTTP ${r2.status}`);
      (err as any).status = r2.status;
      (err as any).body = text2.slice(0, 800);
      throw err;
    }
    return parseQuoteSummary(text2);
  }

  if (!r.ok) {
    const err = new Error(`Yahoo HTTP ${r.status}`);
    (err as any).status = r.status;
    (err as any).body = text.slice(0, 800);
    throw err;
  }

  return parseQuoteSummary(text);
}


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const t = sanitizeTicker(searchParams.get('t'));
    if (!t) {
      return new Response(JSON.stringify({ error: "Ticker inválido" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const modules = sanitizeModules(searchParams.get('modules'));
    const data = await fetchQuoteSummary(t, modules);

    return new Response(JSON.stringify({ ticker: t, modules, data }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
       },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({
      error: e.message || "Error",
      status: e.status || 500,
      details: e.body || null,
    }), {
      status: e.status || 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
