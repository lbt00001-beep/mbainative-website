# MBAI Native · Web corporativa

Next.js 15.5 (App Router), React 19, TypeScript y Tailwind CSS 3. Node.js 22 recomendado; mínimo 20.9.

## Desarrollo y comprobaciones

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Para mantener una vista de desarrollo durante un build de producción, establece `MBAI_DEV=1` **solo en el proceso de desarrollo**. Utiliza `.next-dev` en lugar de `.next`.

## Contenido

- Recorrido visual: `/empresa-nativa-ia`, `/empresa-nativa-ia/procesos`, `/arquitectura-solucion` y `/empresa-nativa-ia/empezar`. Componentes en `components/journey`, contenido y exportación en `data/ai-journey.ts`, estilos en `app/journey.css`.
- Los ejemplos departamentales son ilustrativos. La ficha de piloto utiliza estado en memoria del navegador y descarga Markdown mediante un Blob; no persiste datos ni llama a API. Los parámetros `proceso` se validan contra los ejemplos disponibles. Los controles de diagramas son botones nativos y las variantes SVG para móvil y escritorio comparten el contenido.
- Arquitectura: NVIDIA PAIR enruta solicitudes independientes; se distingue de la distribución de un modelo entre nodos. Las fuentes oficiales y la fecha de consulta están en cada página. Revisar esas referencias al actualizar capacidades de proveedores.
- `data/applications.ts`: catálogo completo de aplicaciones. El buscador y los filtros están en `components/ApplicationCatalog.tsx`.
- `lib/seo.ts`: títulos, descripciones y rutas del sitemap. Las páginas cliente reciben metadatos desde su layout servidor.
- `app/mejores-practicas/ia-en-la-practica/page.tsx`: guía basada en la charla de Carlos Santana (DotCSV) publicada por Holded. Incluye atribución y marcas de tiempo; las aplicaciones empresariales se identifican como propuestas de MBAI.
- `scripts/fetch-ai-news.js`: recopila noticias. La portada solo muestra publicaciones de los últimos 21 días; el archivo conserva las demás. Si todas las fuentes fallan, no sobrescribe los datos existentes.

## Correo y protección de API

Configura las variables de `.env.example` en Hostinger. Puerto 465 utiliza TLS directo; 587 exige STARTTLS. La validación de certificados permanece activa. El formulario envía **un único correo al destinatario configurado**, sin respuestas automáticas a direcciones arbitrarias. La confirmación se muestra en pantalla.

Los POST requieren un origen permitido, JSON de tamaño limitado y validación de campos. Hay límites de frecuencia por credencial/email y un límite global por proceso. **Estos límites no son persistentes ni compartidos entre instancias**: al ampliar a varios procesos o servidores, configura cuotas compartidas en el proxy o un almacén central antes de escalar. El filtro por origen es una defensa del navegador, no autenticación de clientes externos.

TradingAlpha utiliza exclusivamente la clave personal del visitante. Nunca recurre a una clave del servidor. La clave puede guardarse en `sessionStorage`, se elimina el antiguo guardado persistente en `localStorage`, y se transmite al servidor para consultar OpenRouter. No se registra en logs. El modelo se valida contra `lib/ai-models.ts`, se limita a 4.000 tokens de salida y las llamadas tienen tiempo máximo. Las tarifas son una referencia fechada, no una garantía del coste final.

Los parches de PostCSS y Sharp se fijan también mediante `overrides` para cubrir las dependencias transitivas de Next.js. Revisa estos overrides al actualizar el framework. La auditoría npm comprueba paquetes conocidos, no constituye una prueba completa de penetración.

## Asistente de cada página

`components/assistant/PageAssistant.tsx` monta el reproductor universal `public/assistant/widget.mjs` en cada ruta. Las tres aplicaciones HTML incluyen el mismo módulo. Play inicia la explicación y el desplazamiento por apartados; Pausa conserva la posición (en voces del navegador, desde la última palabra notificada); Stop vuelve al comienzo. Los subtítulos, el selector de apartados, la velocidad y el seguimiento manual son independientes de las voces profesionales. Al salir de la página se cancela la narración.

Los guiones públicos están versionados en `data/assistant-guides.json`. Para actualizar contenido, arranca la vista local y ejecuta `npm run assistant:prepare -- http://127.0.0.1:3007` (o el puerto utilizado), revisa el JSON y confirma los cambios. `scripts/assistant-overrides.mjs` contiene explicaciones editoriales para herramientas interactivas. Nunca se extrae información introducida por visitantes. Los iframes externos se explican desde su página contenedora; no se controla su contenido interno.

Para activar voces profesionales configura en el servidor `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION`, o `GOOGLE_TTS_API_KEY` con Cloud Text-to-Speech habilitado. Sin estas variables, el selector identifica expresamente las voces del navegador. Las claves no llegan al cliente. El endpoint solo admite identificadores de fragmentos editoriales aprobados, con caché de audio de 24 MB, cuatro solicitudes simultáneas, 40 nuevas solicitudes/minuto y `ASSISTANT_DAILY_CHAR_LIMIT` (100.000 caracteres por defecto). Estos límites son por proceso y se reinician al desplegar; configura también las cuotas del proveedor y límites compartidos si utilizas varias instancias. Las llamadas profesionales generan consumo en la cuenta del proveedor.

Las pruebas automatizadas utilizan audio y síntesis simulados; verifican controles, cancelación de eventos atrasados, privacidad, caché y cuotas sin consumir servicios de voz. La calidad acústica real requiere credenciales activas y una comprobación con dispositivos reales.

## Despliegue

La infraestructura existente despliega en **Hostinger desde `master` de GitHub**. Mantén `output: 'standalone'`. No configures `MBAI_DEV` en producción.

Se conserva el renderizado dinámico del layout y la revalidación inmediata del HTML: el commit `be3b463` documenta errores 404 de CSS provocados por HTML obsoleto en la caché del alojamiento. Los recursos con hash conservan caché larga. No cambies las páginas a generación estática hasta verificar que Hostinger invalida el HTML al desplegar y conserva los recursos necesarios durante la transición.

Antes del push ejecuta lint, tipos, pruebas, build y auditoría. `validate.yml` repite las comprobaciones en GitHub. Comprueba después el título de la portada, la guía, `/robots.txt` y `/sitemap.xml`. Si Hostinger conserva contenido anterior, revisa su despliegue y caché.

Las pruebas de correo y OpenRouter utilizan dobles locales: no envían correos ni consumen créditos. La recepción real del formulario depende de la configuración SMTP del alojamiento.
