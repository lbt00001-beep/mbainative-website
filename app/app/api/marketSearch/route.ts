import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Coordenadas de referencia: Madrid Centro (km 0)
const MADRID_LAT = 40.416775;
const MADRID_LON = -3.70379;

const PROVINCES_COORDS: Record<string, [number, number]> = {
  madrid: [40.4168, -3.7038],
  'alcala de henares': [40.4819, -3.3635],
  mostoles: [40.3232, -3.8649],
  fuenlabrada: [40.2842, -3.7942],
  leganes: [40.3282, -3.7635],
  getafe: [40.3083, -3.7327],
  alcorcon: [40.3458, -3.8249],
  alcobendas: [40.5475, -3.642],
  'las rozas': [40.4929, -3.8737],
  guadalajara: [40.6337, -3.1674],
  toledo: [39.8628, -4.0273],
  segovia: [40.9429, -4.1088],
  avila: [40.6565, -4.6818],
  cuenca: [40.0704, -2.1374],
  valladolid: [41.6523, -4.7245],
  salamanca: [40.9701, -5.6635],
  'ciudad real': [38.9861, -3.9273],
  soria: [41.764, -2.4688],
  burgos: [42.3439, -3.6969],
  palencia: [42.0095, -4.5288],
  zamora: [41.5038, -5.7445],
  albacete: [38.9943, -1.8585],
  zaragoza: [41.6488, -0.8891],
  valencia: [39.4699, -0.3763],
  castellon: [39.9864, -0.0513],
  alicante: [38.3452, -0.481],
  murcia: [37.9922, -1.1307],
  cordoba: [37.8882, -4.7794],
  sevilla: [37.3891, -5.9845],
  jaen: [37.7796, -3.7849],
  granada: [37.1773, -3.5986],
  malaga: [36.7213, -4.4214],
  cadiz: [36.5271, -6.2886],
  huelva: [37.2614, -6.9447],
  almeria: [36.834, -2.4637],
  badajoz: [38.8794, -6.9706],
  caceres: [39.4753, -6.3722],
  barcelona: [41.3851, 2.1734],
  tarragona: [41.1189, 1.2445],
  lleida: [41.6176, 0.62],
  girona: [41.9794, 2.8214],
  bilbao: [43.263, -2.935],
  bizkaia: [43.263, -2.935],
  donostia: [43.3183, -1.9812],
  'san sebastian': [43.3183, -1.9812],
  vitoria: [42.8469, -2.6716],
  pamplona: [42.8125, -1.6458],
  navarra: [42.8125, -1.6458],
  logroño: [42.4627, -2.445],
  santander: [43.4623, -3.8099],
  asturias: [43.3619, -5.8494],
  oviedo: [43.3619, -5.8494],
  'a coruña': [43.3623, -8.4115],
  'la coruña': [43.3623, -8.4115],
  lugo: [43.0097, -7.5568],
  ourense: [42.3358, -7.8639],
  pontevedra: [42.4336, -8.648],
  vigo: [42.2406, -8.7207],
  palma: [39.5696, 2.6502],
  baleares: [39.5696, 2.6502],
  'las palmas': [28.1235, -15.4363],
  'santa cruz de tenerife': [28.4636, -16.2518],
};

function haversineDistance(lat1: number, lon1: number, lat2 = MADRID_LAT, lon2 = MADRID_LON): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function getDistanceByName(name?: string | null): number | null {
  if (!name) return null;
  const clean = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (PROVINCES_COORDS[clean]) {
    const [lat, lon] = PROVINCES_COORDS[clean];
    return haversineDistance(lat, lon);
  }
  for (const [key, coords] of Object.entries(PROVINCES_COORDS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return haversineDistance(coords[0], coords[1]);
    }
  }
  return null;
}

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function buildEquivalentRegex(query: string): RegExp {
  const cleanQ = stripAccents(query.trim());
  const splitTokens = cleanQ.match(/[a-zA-Z]+|\d+|[^\s\w]+/g) || [];
  const alnumTokens = splitTokens.filter((t) => /^[a-zA-Z0-9]+$/.test(t));
  if (alnumTokens.length === 0) {
    return new RegExp(cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  const innerPattern = alnumTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\-_/]*');
  return new RegExp(`\\b${innerPattern}\\b`, 'i');
}

function matchesExactQuery(query: string, title: string, description = '', matchInDesc = false): boolean {
  if (!query || !query.trim()) return true;
  const textToCheck = matchInDesc ? `${title} ${description}` : title;
  const cleanText = stripAccents(textToCheck);
  const regex = buildEquivalentRegex(query);
  return regex.test(cleanText);
}

interface ItemResult {
  id: string;
  platform: string;
  platform_code: 'wallapop' | 'milanuncios' | 'vinted';
  title: string;
  description: string;
  price: number;
  currency: string;
  location_name: string;
  distance_km: number | null;
  date_iso: string | null;
  date_display: string;
  image_url: string | null;
  link: string;
}

async function searchWallapop(query: string): Promise<ItemResult[]> {
  try {
    const params = new URLSearchParams({
      keywords: query,
      latitude: String(MADRID_LAT),
      longitude: String(MADRID_LON),
      source: 'search_box',
    });
    const res = await fetch(`https://api.wallapop.com/api/v3/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'Wallapop/8.10.0 (iPhone; iOS 17.4; Scale/3.00)',
        'X-DeviceOS': '1',
        Accept: 'application/json',
        'Accept-Language': 'es-ES',
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data?.section?.payload?.items || [];
    return items.map((item: any) => {
      const price = Number(item?.price?.amount || 0);
      const loc = item?.location || {};
      const city = loc?.city || loc?.region || 'España';
      let dist: number | null = null;
      if (loc?.latitude && loc?.longitude) {
        dist = haversineDistance(Number(loc.latitude), Number(loc.longitude));
      }
      let dateDisplay = 'Reciente';
      let dateIso: string | null = null;
      if (item?.created_at) {
        const ts = Number(item.created_at);
        const dt = new Date(ts > 1e11 ? ts : ts * 1000);
        dateIso = dt.toISOString();
        dateDisplay = dt.toLocaleDateString('es-ES');
      }
      const imgs = item?.images || [];
      const imgUrl = imgs[0]?.urls?.medium || imgs[0]?.urls?.big || imgs[0]?.urls?.small || null;
      return {
        id: `wallapop_${item.id}`,
        platform: 'Wallapop',
        platform_code: 'wallapop',
        title: (item.title || '').trim(),
        description: (item.description || '').trim(),
        price,
        currency: 'EUR',
        location_name: city,
        distance_km: dist,
        date_iso: dateIso,
        date_display: dateDisplay,
        image_url: imgUrl,
        link: `https://es.wallapop.com/item/${item.web_slug || item.id}`,
      };
    });
  } catch {
    return [];
  }
}

async function searchMilanuncios(query: string): Promise<ItemResult[]> {
  try {
    const slug = query
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const url = `https://www.milanuncios.com/anuncios/${slug}.htm`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const prefix = 'window.__INITIAL_PROPS__ = JSON.parse(';
    const start = html.indexOf(prefix);
    if (start === -1) return [];
    const contentStart = start + prefix.length;
    let end = html.indexOf(');\n', contentStart);
    if (end === -1) end = html.indexOf(');', contentStart);
    if (end === -1) return [];
    const rawJsonStr = html.substring(contentStart, end).trim();
    const unescaped = JSON.parse(rawJsonStr);
    const data = typeof unescaped === 'string' ? JSON.parse(unescaped) : unescaped;
    const ads = data?.adListPagination?.adList?.ads || [];
    return ads.map((ad: any) => {
      const price = Number(ad?.price?.cashPrice?.value || 0);
      const loc = ad?.location || {};
      const cityName = loc?.city?.name || null;
      const provName = loc?.province?.name || null;
      const locDisplay = cityName && provName && cityName !== provName ? `${cityName} (${provName})` : cityName || provName || 'España';
      const dist = getDistanceByName(cityName) ?? getDistanceByName(provName);
      let dateDisplay = 'Reciente';
      let dateIso: string | null = null;
      if (ad?.publishDate) {
        const dt = new Date(ad.publishDate);
        dateIso = dt.toISOString();
        dateDisplay = dt.toLocaleDateString('es-ES');
      }
      const pics = ad?.pictures || [];
      const imgUrl = pics[0]?.url || pics[0]?.medium || null;
      const adUrl = ad?.url || ad?.friendlyUrl;
      const link = adUrl?.startsWith('http') ? adUrl : `https://www.milanuncios.com${adUrl || `/anuncios/${ad.id}.htm`}`;
      return {
        id: `milanuncios_${ad.id}`,
        platform: 'Milanuncios',
        platform_code: 'milanuncios',
        title: (ad.title || '').trim(),
        description: (ad.description || '').trim(),
        price,
        currency: 'EUR',
        location_name: locDisplay,
        distance_km: dist,
        date_iso: dateIso,
        date_display: dateDisplay,
        image_url: imgUrl,
        link,
      };
    });
  } catch {
    return [];
  }
}

async function searchVinted(query: string): Promise<ItemResult[]> {
  try {
    const url = `https://www.vinted.es/catalog?search_text=${encodeURIComponent(query)}&order=newest_first`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const results: ItemResult[] = [];
    const itemRegex = /href=["'](\/items\/(\d+)[^"']*)["'][^>]*title=["']([^"']+)["']/g;
    let match;
    const seen = new Set<string>();
    while ((match = itemRegex.exec(html)) !== null && results.length < 40) {
      const href = match[1];
      const id = match[2];
      const titleAttr = match[3];
      if (seen.has(id)) continue;
      seen.add(id);

      const parts = titleAttr.split(',');
      const title = parts[0]?.trim() || titleAttr;
      const priceMatch = titleAttr.match(/(\d+(?:[.,]\d{1,2})?)\s*€/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

      // Extract image associated with this item ID if possible
      const imgRegex = new RegExp(`product-item-id-${id}[\\s\\S]*?<img[^>]+src=["']([^"']+)["']`);
      const imgMatch = html.match(imgRegex);
      const imgUrl = imgMatch ? imgMatch[1] : null;

      results.push({
        id: `vinted_${id}`,
        platform: 'Vinted',
        platform_code: 'vinted',
        title,
        description: titleAttr,
        price,
        currency: 'EUR',
        location_name: 'Envío Vinted (España / UE)',
        distance_km: null,
        date_iso: null,
        date_display: 'Reciente',
        image_url: imgUrl,
        link: `https://www.vinted.es${href.split('?')[0]}`,
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  if (!q) {
    return NextResponse.json({ error: 'Parámetro de búsqueda q requerido' }, { status: 400 });
  }

  const platforms = (searchParams.get('platforms') || 'wallapop,milanuncios,vinted').split(',').map((p) => p.trim().toLowerCase());
  const strictMatch = searchParams.get('strict_match') !== 'false';
  const matchInDesc = searchParams.get('match_in_desc') === 'true';
  const sortBy = searchParams.get('sort_by') || 'price_asc';
  const minPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : null;
  const maxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : null;
  const maxDist = searchParams.get('max_distance_km') ? Number(searchParams.get('max_distance_km')) : null;

  const tasks: Promise<ItemResult[]>[] = [];
  if (platforms.includes('wallapop')) tasks.push(searchWallapop(q));
  if (platforms.includes('milanuncios')) tasks.push(searchMilanuncios(q));
  if (platforms.includes('vinted')) tasks.push(searchVinted(q));

  const fetched = await Promise.all(tasks);
  const allItems = fetched.flat();
  const totalRaw = allItems.length;

  let discardedCount = 0;
  const filtered = allItems.filter((item) => {
    if (strictMatch && !matchesExactQuery(q, item.title, item.description, matchInDesc)) {
      discardedCount++;
      return false;
    }
    if (minPrice !== null && item.price < minPrice) return false;
    if (maxPrice !== null && maxPrice > 0 && item.price > maxPrice) return false;
    if (maxDist !== null && maxDist > 0 && item.distance_km !== null && item.distance_km > maxDist) return false;
    return true;
  });

  if (sortBy === 'price_asc') {
    filtered.sort((a, b) => (a.price <= 0 ? 1 : 0) - (b.price <= 0 ? 1 : 0) || a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'distance_asc') {
    filtered.sort((a, b) => (a.distance_km === null ? 1 : 0) - (b.distance_km === null ? 1 : 0) || (a.distance_km || 9999) - (b.distance_km || 9999));
  } else if (sortBy === 'date_desc') {
    filtered.sort((a, b) => (b.date_iso || '').localeCompare(a.date_iso || ''));
  }

  const platformCounts = {
    wallapop: filtered.filter((i) => i.platform_code === 'wallapop').length,
    milanuncios: filtered.filter((i) => i.platform_code === 'milanuncios').length,
    vinted: filtered.filter((i) => i.platform_code === 'vinted').length,
  };

  return NextResponse.json(
    {
      query: q,
      total_results: filtered.length,
      total_raw_found: totalRaw,
      discarded_approximations: discardedCount,
      platform_counts: platformCounts,
      items: filtered,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    }
  );
}
