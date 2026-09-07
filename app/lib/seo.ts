import type { Metadata } from 'next';
export const SITE_URL = 'https://mbainative.com';
export const pages: Record<string, [string, string]> = {
  '/': ['Empresa nativa en IA: formación y herramientas', 'Aprende a dirigir equipos de personas y agentes de IA. Explora herramientas, principios de gestión y servicios para aplicar IA en tu empresa.'],
  '/about': ['El proyecto MBAI Native', 'Conoce el enfoque de MBAI Native: principios de gestión, aprendizaje y aplicaciones para trabajar con agentes de inteligencia artificial.'],
  '/services': ['Formación, consultoría y desarrollo con IA', 'Servicios de formación ejecutiva, estrategia, talleres y desarrollo de soluciones para aplicar inteligencia artificial a procesos empresariales.'],
  '/contact': ['Contacta con MBAI Native', 'Cuéntanos qué proceso quieres mejorar con inteligencia artificial. Contacto para formación, consultoría, talleres y desarrollo de aplicaciones.'],
  '/aplicaciones': ['Aplicaciones de inteligencia artificial', 'Encuentra herramientas de IA para análisis, marketing, finanzas, comunicación y productividad. Explora el catálogo de MBAI Native.'],
  '/aplicaciones/tradingalpha': ['TradingAlpha: análisis y escenarios de inversión', 'Explora datos fundamentales, gráficos, valoraciones y escenarios con TradingAlpha. Herramienta de análisis con informes asistidos por IA.'],
  '/aplicaciones/inversion-fundamentales': ['Análisis de inversión con fundamentales', 'Consulta métricas fundamentales y escenarios de valoración para contrastar tus hipótesis de inversión.'],
  '/aplicaciones/comparativa-ue': ['España y la Unión Europea: comparativa económica', 'Explora indicadores y evolución económica de España y los países de la Unión Europea.'],
  '/aplicaciones/corrector-rae': ['Corrector ortotipográfico RAE', 'Herramienta de revisión ortotipográfica de documentos Word basada en normas del español.'],
  '/aplicaciones/futuros': ['Monitor de futuros', 'Explora futuros financieros, gráficos y escenarios de simulación con el monitor de MBAI Native.'],
  '/mejores-practicas': ['Aprender a gestionar una empresa con IA', 'Principios, guías, fuentes y aplicaciones de la inteligencia artificial a la organización empresarial.'],
  '/mejores-practicas/ia-en-la-practica': ['De usar IA a trabajar con agentes: guía práctica', 'Contexto, conocimiento documentado, evaluación y coste por resultado. Guía empresarial de MBAI a partir de la charla de Carlos Santana, DotCSV, en Holded.'],
  '/mejores-practicas/doctrinas': ['20 principios de la empresa nativa en IA', 'Explora los principios de MBAI para organizar tareas, configurar autonomía y supervisar equipos de agentes de inteligencia artificial.'],
  '/mejores-practicas/noticias': ['Noticias y fuentes de inteligencia artificial', 'Selección de noticias sobre IA, agentes y transformación empresarial, con enlaces a las publicaciones originales.'],
  '/mejores-practicas/gurus': ['Voces y referentes de inteligencia artificial', 'Explora ideas y recursos de referentes del ecosistema de inteligencia artificial.'],
  '/mejores-practicas/consultoras': ['Investigación y análisis de consultoras sobre IA', 'Artículos y recursos de consultoras sobre la aplicación de inteligencia artificial en las organizaciones.'],
  '/mejores-practicas/youtubers': ['Divulgación de IA en vídeo', 'Descubre contenidos de divulgación sobre inteligencia artificial y sus aplicaciones.'],
  '/mejores-practicas/tecnologia': ['IA en tecnología', 'Ideas y recursos sobre la transformación del sector tecnológico con inteligencia artificial.'],
  '/mejores-practicas/finanzas': ['IA en finanzas', 'Recursos sobre inteligencia artificial en banca, análisis y servicios financieros.'],
  '/mejores-practicas/salud': ['IA en salud', 'Recursos sobre inteligencia artificial en diagnóstico, investigación y gestión sanitaria.'],
  '/mejores-practicas/retail': ['IA en comercio', 'Recursos sobre automatización, análisis y personalización en el comercio.'],
  '/mejores-practicas/manufactura': ['IA en industria', 'Recursos sobre inteligencia artificial, robótica y procesos industriales.'],
  '/privacidad': ['Política de privacidad', 'Información sobre el tratamiento de datos personales en MBAI Native.'],
  '/condiciones': ['Condiciones de uso', 'Condiciones de acceso y utilización de los contenidos y herramientas de MBAI Native.'],
  '/cookies': ['Política de cookies', 'Información sobre cookies y servicios de terceros en MBAI Native.'],
  '/precisiones': ['Precisiones sobre nuestros contenidos', 'Alcance y precisiones sobre los contenidos y aplicaciones publicados por MBAI Native.'],
};
export function pageMetadata(path: string): Metadata {
  const [title, description] = pages[path];
  const fullTitle = `${title} | MBAI Native`;
  return { title, description, alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: SITE_URL + path, siteName: 'MBAI Native', locale: 'es_ES', type: 'website' },
    twitter: { card: 'summary', title: fullTitle, description },
  };
}
