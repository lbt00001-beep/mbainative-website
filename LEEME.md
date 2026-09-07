# MBAI Native · Empresa nativa en IA

Web: https://mbainative.com
Actualización de esta documentación: 7 de septiembre de 2026.

El proyecto reúne principios de gestión, formación, servicios y 28 aplicaciones catalogadas (incluidas dos en preparación), agrupadas en 11 categorías. Conserva el simulador empresarial y los enlaces a las herramientas externas.

## Estructura

- app/: aplicación Next.js 15.5, React 19, TypeScript y Tailwind CSS 3.
- app/data/applications.ts: datos del catálogo.
- app/lib/seo.ts: metadatos por ruta y rutas del sitemap.
- app/app/mejores-practicas/ia-en-la-practica/: guía aplicada de la charla de Carlos Santana (DotCSV), publicada por Holded.
- app/scripts/: recopilación de noticias y automatizaciones de contenido.
- .github/workflows/: automatizaciones existentes y comprobaciones de calidad.
- app/README.md: desarrollo, seguridad y configuración de correo.
- DEPLOY_INFRA.md: infraestructura y despliegue.

## Trabajar con la web

Desde app/, instala con npm ci y arranca con npm run dev. Node.js 22 recomendado; mínimo 20.9.

Antes de publicar: npm run lint, npm run typecheck, npm test, npm run build y npm audit. El despliegue existente se activa al enviar cambios a master en GitHub; Hostinger construye y publica la web.

Mantén el renderizado dinámico y la política de caché documentada hasta verificar la invalidación de HTML en Hostinger. Una configuración anterior producía errores 404 en los estilos después de desplegar.

## Funciones y protecciones

- Portada orientada a tareas, aplicaciones destacadas y servicios con entregables.
- Catálogo con búsqueda y filtros; conserva todas las URLs anteriores.
- Guía del vídeo con cinco ideas, marcas de tiempo y propuesta de piloto empresarial.
- Metadatos en español, enlaces canónicos, robots y sitemap.
- Menú móvil accesible, cierre al navegar y soporte de Escape.
- Formulario con validación, límites de frecuencia, protección de HTML y TLS verificado.
- TradingAlpha utiliza la clave personal de OpenRouter del visitante, guardada opcionalmente durante la sesión. La web pública no usa una clave del servidor.
- Noticias con fechas explícitas: la portada excluye las de más de 21 días; el archivo conserva el resto.
- Pruebas automáticas de seguridad sin enviar correos ni consumir créditos.

Las aplicaciones externas se mantienen en sus alojamientos habituales. Esta actualización no migra sus servidores ni modifica sus cuentas.
