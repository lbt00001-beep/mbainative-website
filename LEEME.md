# MBAI Native - Empresa AI-Nativa

## Estado Actual (1 ene 2026)

La web ofrece **20 Principios** de empresa AI-nativa y una sección de **Aplicaciones** organizada en 5 categorías.

### URLs de Producción
- **Web**: https://mbainative.com
- **Simulador**: https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/ → *Migrar a Streamlit*
- **Twitter**: @MBAInative (automatizado 3x/día)

### Cuentas y Repositorios
| Servicio | Cuenta | Uso |
|----------|--------|-----|
| **GitHub** | info@mbainative.com | Repositorios de apps |
| **Streamlit Cloud** | https://share.streamlit.io/user/mbainative | Hosting gratuito de apps |
| **Hostinger** | mbainative.com | Web principal (Next.js) |
| **PythonAnywhere** | mbainative.pythonanywhere.com | Corrector RAE |

---

## 📱 Aplicaciones (Reorganizado 1 ene 2026)

| Categoría | Apps | Hosting |
|-----------|------|---------|
| 📊 **Finanzas** | Fundamentales, Correlaciones | Streamlit Cloud |
| 📝 **Lengua** | Corrector RAE | PythonAnywhere |
| 🗳️ **Sondeos** | Estimador CIS | Próximamente |
| 📰 **Prensa** | Generador Artículos | Próximamente |
| 🎬 **Video/Audio** | Guiones, Vídeos IA | Próximamente |

### URLs de Apps
- Correlaciones: https://aplicaciones-correlaciones-finanzas.streamlit.app/
- Corrector RAE: https://mbainative.pythonanywhere.com
- Simulador (migrar): https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/

---

## 🚀 Twitter Automatizado

- **Horario**: 06:00, 12:00, 18:00 (Madrid)
- **Contenido**: Principio del día + noticia/video/podcast
- **Imágenes**: YouTube thumbnails o logo fallback

### Secrets GitHub
| Secret | Uso |
|--------|-----|
| `YOUTUBE_API_KEY` | Videos gurús |
| `TWITTER_API_KEY` | Twitter |
| `TWITTER_API_SECRET` | Twitter |
| `TWITTER_ACCESS_TOKEN` | Twitter |
| `TWITTER_ACCESS_TOKEN_SECRET` | Twitter |

---

## 📋 Próximos Pasos

1. **Migrar Simulador** de Google Cloud a Streamlit (ahorrar costes)
2. **App Estimador CIS** - Subir a Streamlit Cloud
3. **LinkedIn/Instagram** - Pendiente conexiones y Meta App

---

## Comandos

```bash
cd app
npm run dev                              # Desarrollo local
node scripts/generate-social-content.js  # Generar post
node scripts/fetch-ai-news.js            # Actualizar noticias
```

---

## Notas

- **Caché Hostinger**: Limpiar si cambios no aparecen
- **Streamlit Cloud**: Cuenta gratuita, vincular repos desde GitHub (info@mbainative.com)
