import type { MetadataRoute } from 'next';
import { SITE_URL, pages } from '@/lib/seo';
export default function sitemap(): MetadataRoute.Sitemap {
  return [...Object.keys(pages), '/plan-de-marketing/index.html', '/benchmarks-ia/index.html', '/evolucion/index.html'].map(path => ({
    url: SITE_URL + path, changeFrequency: path === '/mejores-practicas/noticias' ? 'daily' : 'monthly', priority: path === '/' ? 1 : path === '/aplicaciones' ? 0.9 : 0.7,
  }));
}
