# MBAI Native - Empresa AI-Nativa

## Estado Actual (30 dic 2025)

La web ha sido transformada a una **doctrina de empresa AI-nativa** con **20 Principios** (antes llamados Doctrinas).

### URLs de Producción
- **Web**: https://mbainative.com
- **Simulador**: https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/
- **Repositorio**: https://github.com/lbt00001-beep/mbainative-website
- **Twitter**: @MBAInative (automatizado)

---

## 🚀 Sistema de Publicación Automática en Redes Sociales

### Twitter ✅ FUNCIONANDO
- **3 publicaciones diarias**: 06:00, 12:00, 18:00 (hora Madrid)
- **Contenido dinámico**: Noticias, videos de gurús, podcasts, consultoras
- **Principio del día**: Rota entre los 20 principios por día del año
- **Imágenes**: Thumbnails de YouTube o logo como fallback

### LinkedIn ⏸️ PENDIENTE
- Script creado: `scripts/post-to-linkedin.js`
- **Bloqueado**: Necesita Company Page (requiere conexiones de LinkedIn)
- Cuando tenga conexiones, añadir secrets:
  - `LINKEDIN_ACCESS_TOKEN`
  - `LINKEDIN_ORGANIZATION_ID`

### Instagram ⏸️ EN PROGRESO
- **Requisitos completados**:
  - ✅ Cuenta Instagram Creator
  - ✅ Facebook Page creada
- **Siguiente paso**: Conectar Instagram con Facebook Page en Meta Business Suite
- Luego crear app en developers.facebook.com

### Facebook ⏸️ PENDIENTE
- Facebook Page creada
- Necesita configurar Meta App y tokens

---

## Workflows de GitHub Actions

### generate-social-content.yml
- **Horario**: 05:00, 11:00, 17:00 UTC (06:00, 12:00, 18:00 Madrid)
- **Acciones**:
  1. Fetch noticias AI (9 fuentes: TechCrunch, OpenAI, Anthropic, etc.)
  2. Generar contenido con Principio del día
  3. Publicar en Twitter (con imagen)
  4. Publicar en LinkedIn (cuando esté configurado)

### update-news.yml
- **Horario**: 05:00 UTC (06:00 Madrid)
- **Acciones**: Actualizar videos gurús, podcast, consultoras

### Secrets Configurados
| Secret | Uso |
|--------|-----|
| `YOUTUBE_API_KEY` | Videos de gurús y podcast |
| `TWITTER_API_KEY` | Publicar en Twitter |
| `TWITTER_API_SECRET` | Publicar en Twitter |
| `TWITTER_ACCESS_TOKEN` | Publicar en Twitter |
| `TWITTER_ACCESS_TOKEN_SECRET` | Publicar en Twitter |

---

## Archivos Clave de Redes Sociales

| Archivo | Función |
|---------|---------|
| `scripts/generate-social-content.js` | Genera contenido dinámico |
| `scripts/post-to-twitter.js` | Publica en Twitter con imagen |
| `scripts/post-to-linkedin.js` | Publica en LinkedIn (preparado) |
| `scripts/fetch-ai-news.js` | 9 fuentes RSS de noticias AI |
| `public/data/social-content.json` | Contenido generado actual |
| `public/data/doctrines-social.json` | 20 principios para posts |

---

## Estructura de 20 Principios

Renombrados de "Doctrinas" a "Principios" (30 dic 2025):

| # | Principio | Categoría |
|---|-----------|-----------|
| 1 | El talento artificial se compra | Organización |
| 2 | Los empleados de silicio | Organización |
| 3 | Organización por tareas, no por puestos | Organización |
| 4 | El nuevo organigrama es una ciencia | Organización |
| 5 | La información fluye horizontalmente | Organización |
| 6 | Decisiones con autonomía configurable | Organización |
| 7 | Relaciones externas agénticas | Organización |
| 8 | Cumplimiento normativo automatizado | Organización |
| 9-20 | (Ver doctrines-social.json) | Varios |

---

## Comandos

```bash
# Desarrollo
cd app
npm run dev

# Generar contenido social manualmente
node scripts/generate-social-content.js

# Publicar manualmente
TWITTER_API_KEY=xxx TWITTER_API_SECRET=xxx ... node scripts/post-to-twitter.js

# Actualizar noticias
node scripts/fetch-ai-news.js
```

---

## Próximos Pasos

1. **Instagram**: Conectar cuenta con Facebook Page en Meta Business Suite
2. **LinkedIn**: Esperar conexiones para crear Company Page
3. **Facebook**: Configurar Meta App cuando Instagram esté listo

---

## Notas Importantes

- **Twitter funciona**: Los posts se publican 3x/día con Principio + contenido + imagen
- **Principios rotan**: Cada día muestra un principio diferente (basado en día del año)
- **Imágenes automáticas**: YouTube thumbnails o logo MBAI Native como fallback
- **Caché Hostinger**: Limpiar desde panel si cambios web no aparecen
