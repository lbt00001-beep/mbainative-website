# MBAI Native - Empresa AI-Nativa

## Estado Actual (27 dic 2025)

La web ha sido transformada de un enfoque "MBA en IA" a una **doctrina de empresa AI-nativa**.

### URL de Producción
- **Web**: https://mbainative.com
- **Simulador**: https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/
- **Repositorio**: https://github.com/lbt00001-beep/mbainative-website

### Despliegue
- Los cambios se despliegan automáticamente a mbainative.com cuando se hace `git push` a master.
- El workflow `update-news.yml` se ejecuta diariamente a las 06:00 (Madrid) para actualizar noticias y videos.

---

## Estructura de la Doctrina

### 20 Doctrinas en 3 Categorías

| Categoría | # | Ubicación |
|-----------|---|-----------|
| 🏢 Organización Empresarial | 12 | `/mejores-practicas/doctrinas#organizacion` |
| ⚙️ Fundamentos Tecnológicos | 4 | `/mejores-practicas/doctrinas#tecnologia` |
| ⚖️ Ética y Responsabilidad | 4 | `/mejores-practicas/doctrinas#etica` |

### Los 8 Principios Fundamentales (del usuario)

1. **Inteligencia Comprable** - Tokens de IA para texto, audio, imagen, video
2. **Empleados de Silicio** - Agentes que ejecutan tareas
3. **Organización por Tareas** - No puestos de trabajo
4. **El Nuevo Organigrama** - Ciencia de la eficiencia
5. **Información Horizontal** - Disponible para todos
6. **Autonomía Configurable** - Consulta previa vs supervisión posterior
7. **Relaciones Externas Agénticas** - Agentes B2B
8. **Compliance Automatizado** - Agentes de cumplimiento

### 4 Principios Adicionales (propuestos)

9. Capital Humano se Transforma (ejecutores → supervisores)
10. Memoria Institucional Digital
11. Escalabilidad Instantánea
12. Dashboard como Centro de Mando

---

## Archivos Clave

### Componentes Home
- `components/home/Hero.tsx` - "Empresa AI-Nativa"
- `components/home/Doctrine.tsx` - 8 principios en grid
- `components/home/MBAIProfile.tsx` - 8 competencias del líder
- `components/home/TrainingPlatformCTA.tsx` - Link al simulador

### Datos
- `data/doctrines.ts` - 20 doctrinas con tesis, implicaciones, retos
- `data/gurus.ts` - 14 gurús de la IA
- `public/data/ai-news.json` - Noticias (actualizado diariamente)
- `public/data/gurus-videos.json` - Videos YouTube (actualizado diariamente)

### Scripts de Actualización
- `scripts/fetch-ai-news.js` - RSS de Google, Microsoft Research, NVIDIA
- `scripts/fetch-guru-videos.js` - YouTube API (requiere YOUTUBE_API_KEY en secrets)

---

## Workflows de GitHub

### update-news.yml
- **Horario**: 06:00 Madrid (05:00 UTC)
- **Permisos**: `contents: write` (necesario para git push)
- **Acciones**: Fetch noticias RSS, fetch videos YouTube, commit si hay cambios

---

## Próximos Pasos Posibles

- [ ] Añadir más contenido a las páginas de sectores (tecnología, finanzas, salud, retail, manufactura)
- [ ] Mejorar las páginas individuales de cada gurú
- [ ] Añadir casos de estudio de empresas AI-nativas
- [ ] Crear página "Sobre Nosotros" con la visión
- [ ] Internacionalización (inglés)

---

## Comandos

```bash
# Desarrollo
cd app
npm run dev

# Build
npm run build

# Actualizar noticias manualmente
node scripts/fetch-ai-news.js

# Actualizar videos (requiere API key)
YOUTUBE_API_KEY=xxx node scripts/fetch-guru-videos.js

# Deploy (automático al hacer push)
git push
```
