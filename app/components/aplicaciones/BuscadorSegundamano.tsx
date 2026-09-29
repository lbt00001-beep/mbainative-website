'use client';

import React, { useState, useEffect, useCallback } from 'react';

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

interface SearchResponse {
  query: string;
  total_results: number;
  total_raw_found: number;
  discarded_approximations: number;
  platform_counts: {
    wallapop: number;
    milanuncios: number;
    vinted: number;
  };
  items: ItemResult[];
}

export default function BuscadorSegundamano() {
  const [query, setQuery] = useState('RTX 3090');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);

  const [wallapopEnabled, setWallapopEnabled] = useState(true);
  const [milanunciosEnabled, setMilanunciosEnabled] = useState(true);
  const [vintedEnabled, setVintedEnabled] = useState(true);

  const [strictMatch, setStrictMatch] = useState(true);
  const [matchInDesc, setMatchInDesc] = useState(false);
  const [sortBy, setSortBy] = useState('price_asc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [maxDistance, setMaxDistance] = useState('');

  const executeSearch = useCallback(
    async (searchQuery = query) => {
      const q = searchQuery.trim();
      if (!q) return;

      const platforms: string[] = [];
      if (wallapopEnabled) platforms.push('wallapop');
      if (milanunciosEnabled) platforms.push('milanuncios');
      if (vintedEnabled) platforms.push('vinted');

      if (platforms.length === 0) {
        setError('Selecciona al menos una plataforma');
        return;
      }

      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        q,
        platforms: platforms.join(','),
        strict_match: strictMatch ? 'true' : 'false',
        match_in_desc: matchInDesc ? 'true' : 'false',
        sort_by: sortBy,
      });

      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (maxDistance) params.append('max_distance_km', maxDistance);

      try {
        const res = await fetch(`/api/marketSearch?${params.toString()}`);
        if (!res.ok) throw new Error(`Error en el servidor: ${res.status}`);
        const result: SearchResponse = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    },
    [query, wallapopEnabled, milanunciosEnabled, vintedEnabled, strictMatch, matchInDesc, sortBy, minPrice, maxPrice, maxDistance]
  );

  useEffect(() => {
    executeSearch('RTX 3090');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChipClick = (term: string) => {
    setQuery(term);
    executeSearch(term);
  };

  const formatPrice = (price: number) => {
    if (!price || price <= 0) return 'Consultar';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const getDistanceBadge = (dist: number | null, loc: string) => {
    if (dist === null) {
      return {
        bg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
        text: `📍 ${loc || 'Envío disponible'}`,
      };
    }
    if (dist <= 15) {
      return {
        bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-700 font-bold',
        text: `📍 Madrid (${dist} km)`,
      };
    }
    if (dist <= 60) {
      return {
        bg: 'bg-teal-950/70 text-teal-300 border-teal-700',
        text: `📍 Com. Madrid (${dist} km)`,
      };
    }
    return {
      bg: 'bg-amber-950/60 text-amber-300 border-amber-800',
      text: `📍 ${loc || 'España'} (${dist} km)`,
    };
  };

  const getPlatformColors = (code: string) => {
    switch (code) {
      case 'wallapop':
        return {
          badge: 'bg-[#13C1AC]/20 text-[#13C1AC] border-[#13C1AC]/40',
          btn: 'bg-[#13C1AC] hover:bg-[#0fb39f] text-slate-900',
          name: 'Wallapop',
        };
      case 'milanuncios':
        return {
          badge: 'bg-[#18A058]/20 text-[#22c55e] border-[#18A058]/40',
          btn: 'bg-[#18A058] hover:bg-[#15803d] text-white',
          name: 'Milanuncios',
        };
      case 'vinted':
        return {
          badge: 'bg-[#09B1BA]/20 text-[#38bdf8] border-[#09B1BA]/40',
          btn: 'bg-[#09B1BA] hover:bg-[#0284c7] text-white',
          name: 'Vinted',
        };
      default:
        return {
          badge: 'bg-slate-800 text-slate-200 border-slate-700',
          btn: 'bg-slate-700 hover:bg-slate-600 text-white',
          name: code,
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Panel de Búsqueda */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch();
          }}
          className="space-y-4"
        >
          {/* Input principal */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué producto buscas exactamente? Ej: RTX 3090, iPhone 15 Pro..."
              className="w-full px-5 py-3.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow transition active:scale-95 text-sm"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {/* Chips de ejemplos */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <span className="font-medium text-neutral-500">Ejemplos:</span>
            {['RTX 3090', 'RTX-3090', 'PlayStation 5', 'iPhone 15 Pro', 'Steam Deck'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleChipClick(item)}
                className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Filtros Principales */}
          <div className="pt-4 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Criterio de Ordenación */}
            <div className="md:col-span-4 flex items-center gap-2">
              <label htmlFor="sortSelect" className="text-xs font-semibold text-neutral-400 shrink-0">
                Ordenar:
              </label>
              <select
                id="sortSelect"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setTimeout(() => executeSearch(), 50);
                }}
                className="w-full text-xs bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="price_asc">💰 Precio: Menor a Mayor</option>
                <option value="price_desc">💰 Precio: Mayor a Menor</option>
                <option value="distance_asc">📍 Cercanía a Madrid</option>
                <option value="date_desc">🕒 Fecha (Más recientes)</option>
              </select>
            </div>

            {/* Plataformas */}
            <div className="md:col-span-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-neutral-400">Tiendas:</span>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium bg-[#13C1AC]/10 border-[#13C1AC]/30 text-[#13C1AC] select-none">
                <input
                  type="checkbox"
                  checked={wallapopEnabled}
                  onChange={(e) => setWallapopEnabled(e.target.checked)}
                  className="accent-[#13C1AC] rounded"
                />
                Wallapop{' '}
                <span className="text-[10px] bg-neutral-950 px-1.5 py-0.5 rounded-full border border-[#13C1AC]/30 font-bold">
                  {data?.platform_counts?.wallapop ?? 0}
                </span>
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium bg-[#18A058]/10 border-[#18A058]/30 text-[#22c55e] select-none">
                <input
                  type="checkbox"
                  checked={milanunciosEnabled}
                  onChange={(e) => setMilanunciosEnabled(e.target.checked)}
                  className="accent-[#18A058] rounded"
                />
                Milanuncios{' '}
                <span className="text-[10px] bg-neutral-950 px-1.5 py-0.5 rounded-full border border-[#18A058]/30 font-bold">
                  {data?.platform_counts?.milanuncios ?? 0}
                </span>
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium bg-[#09B1BA]/10 border-[#09B1BA]/30 text-[#38bdf8] select-none">
                <input
                  type="checkbox"
                  checked={vintedEnabled}
                  onChange={(e) => setVintedEnabled(e.target.checked)}
                  className="accent-[#09B1BA] rounded"
                />
                Vinted{' '}
                <span className="text-[10px] bg-neutral-950 px-1.5 py-0.5 rounded-full border border-[#09B1BA]/30 font-bold">
                  {data?.platform_counts?.vinted ?? 0}
                </span>
              </label>
            </div>

            {/* Filtro Estricto */}
            <div className="md:col-span-3 flex justify-start md:justify-end">
              <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800 select-none">
                <input
                  type="checkbox"
                  checked={strictMatch}
                  onChange={(e) => setStrictMatch(e.target.checked)}
                  className="accent-amber-500 rounded"
                />
                <span>Coincidencia estricta</span>
              </label>
            </div>
          </div>

          {/* Filtros Secundarios */}
          <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Precio mín:</span>
                <input
                  type="number"
                  placeholder="0 €"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-20 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>Precio máx:</span>
                <input
                  type="number"
                  placeholder="Sin tope"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-24 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>Radio Madrid:</span>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  className="px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                >
                  <option value="">Toda España</option>
                  <option value="25">≤ 25 km (Madrid)</option>
                  <option value="50">≤ 50 km (Área metropolitana)</option>
                  <option value="100">≤ 100 km (Comunidad)</option>
                  <option value="300">≤ 300 km (Centro)</option>
                </select>
              </div>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-1.5 text-neutral-400 select-none">
              <input
                type="checkbox"
                checked={matchInDesc}
                onChange={(e) => setMatchInDesc(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>Buscar también en descripción</span>
            </label>
          </div>
        </form>
      </div>

      {/* Barra de Estadísticas */}
      {data && (
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-neutral-400">Resultados exactos:</span>{' '}
              <strong className="text-white text-sm ml-1">{data.total_results}</strong>
            </div>
            <div className="h-4 w-px bg-neutral-700"></div>
            <div className="text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-900">
              🛡️ <strong>{data.discarded_approximations}</strong> aproximaciones eliminadas (3060, 3070...)
            </div>
            <div className="h-4 w-px bg-neutral-700 hidden sm:block"></div>
            <div className="text-neutral-400 hidden sm:block">
              Total brutos analizados: <strong className="text-neutral-200">{data.total_raw_found}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-neutral-300">Consultando Wallapop, Milanuncios y Vinted...</p>
          <p className="text-xs text-neutral-500">Filtrando coincidencias exactas y calculando cercanía a Madrid</p>
        </div>
      )}

      {/* Sin resultados */}
      {!loading && data && data.items.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2">
          <p className="text-lg font-bold text-neutral-200">No se encontraron productos con coincidencia exacta</p>
          <p className="text-xs text-neutral-400">
            Prueba a desactivar la &quot;Coincidencia estricta&quot; o ampliar el rango de precio y distancia.
          </p>
        </div>
      )}

      {/* Grid de Resultados */}
      {!loading && data && data.items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.items.map((item) => {
            const pColors = getPlatformColors(item.platform_code);
            const dist = getDistanceBadge(item.distance_km, item.location_name);
            const formattedPrice = formatPrice(item.price);

            return (
              <article
                key={item.id}
                className="bg-neutral-900/90 rounded-2xl border border-neutral-800 overflow-hidden shadow hover:border-neutral-700 transition flex flex-col group"
              >
                {/* Imagen y badges */}
                <div className="relative w-full pt-[68%] bg-neutral-950 overflow-hidden">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-600">
                      Sin imagen
                    </div>
                  )}
                  <span
                    className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow ${pColors.badge}`}
                  >
                    {pColors.name}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-sm font-extrabold bg-black/85 text-white backdrop-blur shadow">
                    {formattedPrice}
                  </span>
                </div>

                {/* Detalles */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className={`px-2 py-0.5 rounded border ${dist.bg}`}>{dist.text}</span>
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                        🕒 {item.date_display || 'Reciente'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 pt-1 group-hover:text-sky-400 transition">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                  </div>

                  {/* Botón de acción */}
                  <div className="pt-2 border-t border-neutral-800">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1.5 transition shadow active:scale-98 ${pColors.btn}`}
                    >
                      <span>Ver en {pColors.name}</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
