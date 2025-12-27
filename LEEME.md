# MBAI Native - Empresa AI-Nativa

## Estado Actual (27 dic 2025)

La web ha sido transformada de un enfoque "MBA en IA" a una **doctrina de empresa AI-nativa**.

### URL de Producción
- **Web**: https://mbainative.com
- **Simulador**: https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/
- **Repositorio**: https://github.com/lbt00001-beep/mbainative-website

### Despliegue
- Los cambios se despliegan automáticamente a mbainative.com cuando se hace `git push` a master.
- El workflow `update-news.yml` se ejecuta diariamente a las 06:00 (Madrid) para actualizar:
  - Noticias de IA (Google, Microsoft, NVIDIA)
  - Videos de Gurús (YouTube API)
  - Podcast destacado (Jon Hernández)
  - Artículos de Consultoras (McKinsey, BCG, Deloitte)
- **IMPORTANTE**: El workflow tiene `permissions: contents: write` para poder hacer git push.

---

## Estructura de la Doctrina

### 20 Doctrinas en 3 Categorías

| Categoría | # | Ubicación |
|-----------|---|-----------|
| 🏢 Organización Empresarial | 12 | `/mejores-practicas/doctrinas#organizacion` |
| ⚙️ Fundamentos Tecnológicos | 4 | `/mejores-practicas/doctrinas#tecnologia` |
| ⚖️ Ética y Responsabilidad | 4 | `/mejores-practicas/doctrinas#etica` |

### Los 8 Principios Fundamentales

1. **El talento artificial se compra** - Tokens de IA para texto, audio, imagen, video
2. **Empleados de Silicio** - Agentes que ejecutan tareas
3. **Organización por Tareas** - No puestos de trabajo
4. **El Nuevo Organigrama** - Ciencia de la eficiencia (incluye Director de IA)
5. **Información Horizontal** - Disponible para personas y agentes
6. **Autonomía Configurable** - Consulta previa vs supervisión posterior
7. **Relaciones Externas Agénticas** - Agentes B2B
8. **Compliance Automatizado** - Agentes de cumplimiento

---

## Secciones de Mejores Prácticas

| Sección | Ruta | Contenido |
|---------|------|-----------|
| 20 Doctrinas | `/mejores-practicas/doctrinas` | Principios organizados por categoría |
| 14 Gurús de la IA | `/mejores-practicas/gurus` | Líderes + videos YouTube + podcast |
| Noticias de IA | `/mejores-practicas/noticias` | RSS de Google, Microsoft, NVIDIA |
| Consultoras | `/mejores-practicas/consultoras` | McKinsey, BCG, Deloitte |
| Sectores | `/mejores-practicas/[sector]` | Tecnología, Finanzas, Salud, Retail, Manufactura |

---

## Archivos Clave

### Componentes Home
- `components/home/Hero.tsx` - "Empresa AI-Nativa" + AI/IA clarification
- `components/home/Doctrine.tsx` - 8 principios en grid
- `components/home/MBAIProfile.tsx` - 8 competencias del líder
- `components/home/TrainingPlatformCTA.tsx` - Link al simulador

### Datos
- `data/doctrines.ts` - 20 doctrinas con tesis, implicaciones, retos
- `data/gurus.ts` - 14 gurús de la IA
- `public/data/ai-news.json` - Noticias (actualizado diariamente)
- `public/data/gurus-videos.json` - Videos YouTube (actualizado diariamente)
- `public/data/featured-podcast.json` - Podcast Jon Hernández
- `public/data/consultoras.json` - Artículos de consultoras

### Scripts de Actualización
- `scripts/fetch-ai-news.js` - RSS de Google, Microsoft Research, NVIDIA
- `scripts/fetch-guru-videos.js` - YouTube API
- `scripts/fetch-featured-podcast.js` - Playlist Jon Hernández
- `scripts/fetch-consultoras.js` - RSS McKinsey, BCG, Deloitte

---

## Workflows de GitHub

### update-news.yml
- **Horario**: 06:00 Madrid (05:00 UTC)
- **Permisos**: `contents: write` (necesario para git push)
- **Acciones**: 
  1. Fetch noticias RSS
  2. Fetch videos YouTube gurús
  3. Fetch podcast destacado
  4. Fetch artículos consultoras
  5. Commit si hay cambios

### Secrets requeridos
- `YOUTUBE_API_KEY` - Para videos de gurús y podcast

---

## Comandos

```bash
# Desarrollo
cd app
npm run dev

# Build
npm run build

# Actualizar contenido manualmente
node scripts/fetch-ai-news.js
YOUTUBE_API_KEY=xxx node scripts/fetch-guru-videos.js
YOUTUBE_API_KEY=xxx node scripts/fetch-featured-podcast.js
node scripts/fetch-consultoras.js

# Deploy (automático al hacer push)
git push
```

---

## Notas Importantes

- **Caché de Hostinger**: Después de un deploy, puede ser necesario limpiar la caché desde el panel de Hostinger si los cambios no aparecen.
- **YOUTUBE_API_KEY**: Debe estar configurado en GitHub Secrets para que funcionen los videos.
