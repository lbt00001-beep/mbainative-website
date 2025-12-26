# LEEME - Proyecto MBAI Native Website

> **Última actualización:** 26/12/2024  
> **URL producción:** https://mbainative.com  
> **Repositorio:** https://github.com/lbt00001-beep/mbainative-website

---

## 📋 VISIÓN GENERAL

Este proyecto es **la web corporativa de MBAI Native**, construida con:
- **Framework:** Next.js 14 (React)
- **Desarrollo local:** Windows, en `C:\Users\lbt00\OneDrive\Documentos\Proyectos\mbainative-website\app`
- **Hosting:** Hostinger (Web Hosting)
- **Deploy automático:** Conectado a GitHub, cualquier push a `master` actualiza la web

```
┌─────────────────┐      git push      ┌─────────────┐     auto-deploy    ┌─────────────────┐
│   Local (VS)    │  ─────────────────▶│   GitHub    │ ──────────────────▶│   Hostinger     │
│  npm run dev    │                    │   master    │                    │ mbainative.com  │
└─────────────────┘                    └─────────────┘                    └─────────────────┘
```

---

## 🚀 COMANDOS RÁPIDOS

### Desarrollo local
```bash
cd C:\Users\lbt00\OneDrive\Documentos\Proyectos\mbainative-website\app
npm run dev          # Servidor desarrollo → http://localhost:3000
npm run build        # Compilar para producción
```

### Subir cambios a producción
```bash
git add -A
git commit -m "descripción del cambio"
git push origin master
# Hostinger detecta el push y recompila automáticamente (1-2 min)
```

### ⚠️ IMPORTANTE: Si la web no muestra cambios
En el panel de Hostinger → **Purgar caché del servidor**

---

## 📁 ESTRUCTURA DE CARPETAS

```
mbainative-website/
├── app/                          # ← CARPETA PRINCIPAL NEXT.JS
│   ├── app/                      # Páginas (File-based routing)
│   │   ├── page.tsx              # Home (/)
│   │   ├── about/page.tsx        # /about
│   │   ├── services/page.tsx     # /services
│   │   ├── contact/page.tsx      # /contact
│   │   ├── aplicaciones/         # /aplicaciones
│   │   │   ├── page.tsx          # Lista de apps
│   │   │   ├── inversion-fundamentales/page.tsx
│   │   │   └── corrector-rae/page.tsx
│   │   ├── mejores-practicas/    # /mejores-practicas
│   │   │   ├── page.tsx          # Página principal
│   │   │   ├── tecnologia/       # Sector Tecnología (Jensen Huang)
│   │   │   ├── finanzas/
│   │   │   ├── salud/
│   │   │   ├── retail/
│   │   │   ├── manufactura/
│   │   │   └── noticias/page.tsx # Noticias IA automáticas
│   │   └── api/                  # API Routes
│   │       └── quoteSummary/route.ts  # Proxy Yahoo Finance
│   │
│   ├── components/               # Componentes React
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── AINewsWidget.tsx      # Widget noticias IA
│   │   ├── QuoteCard.tsx
│   │   ├── home/                 # Componentes de Home
│   │   └── aplicaciones/         # Apps embebidas
│   │       ├── InversionFundamentales.tsx
│   │       └── InversionFundamentales.module.css
│   │
│   ├── public/                   # Archivos estáticos
│   │   ├── data/
│   │   │   └── ai-news.json      # Noticias IA (generado automáticamente)
│   │   └── images/
│   │
│   ├── scripts/
│   │   └── fetch-ai-news.js      # Script que obtiene noticias de RSS
│   │
│   ├── next.config.mjs           # Configuración Next.js
│   ├── package.json              # Dependencias
│   └── tailwind.config.ts
│
└── .github/
    └── workflows/
        └── update-news.yml       # GitHub Action: actualiza noticias diariamente
```

---

## 🌐 APLICACIONES WEB INTEGRADAS

### 1. Inversión Fundamentales
**URL:** `/aplicaciones/inversion-fundamentales`

Analiza empresas del S&P 500 usando datos de Yahoo Finance:
- Carga lista S&P 500 desde Wikipedia
- Llama a `/api/quoteSummary` (proxy a Yahoo Finance)
- Calcula índice fundamental 0-100
- Genera PDF del informe (client-side con html2canvas + jsPDF)

**Archivos clave:**
- `components/aplicaciones/InversionFundamentales.tsx`
- `app/api/quoteSummary/route.ts`

### 2. Corrector RAE
**URL:** `/aplicaciones/corrector-rae` → redirige a PythonAnywhere

Aplicación Flask separada hospedada en:
- **URL:** https://mbainative.pythonanywhere.com
- **Repo:** https://github.com/lbt00001-beep/correccion-ortotipografica

---

## 📰 AUTOMATIZACIÓN DE NOTICIAS IA

Diariamente a las **06:00 AM hora Madrid**, un GitHub Action:
1. Ejecuta `scripts/fetch-ai-news.js`
2. Obtiene RSS de: Google Cloud, OpenAI, Microsoft, NVIDIA
3. Filtra artículos por keywords de IA
4. Genera `public/data/ai-news.json`
5. Hace commit automático

**Para ejecutar manualmente:**
GitHub → Actions → "Update AI News" → Run workflow

**Archivos:**
- `.github/workflows/update-news.yml`
- `scripts/fetch-ai-news.js`
- `components/AINewsWidget.tsx`
- `app/mejores-practicas/noticias/page.tsx`

---

## 🔧 CONFIGURACIÓN HOSTINGER

**Panel:** hpanel.hostinger.com

### Conexión GitHub
1. Hosting → Git
2. Repositorio: `lbt00001-beep/mbainative-website`
3. Branch: `master`
4. Root directory: `app`
5. Framework: Next.js

### Cuando hay problemas de caché
1. Panel Hostinger → Caché
2. **Purgar caché** (botón rojo)
3. Esperar 1-2 minutos

---

## 🐛 PROBLEMAS CONOCIDOS

| Problema | Solución |
|----------|----------|
| Web muestra versión vieja | Purgar caché en Hostinger |
| CSS no carga (modo texto) | Verificar `next.config.mjs` tiene `output: "standalone"` |
| Dropdown ilegible | Estilos inline en `<select>` y `<option>` |
| API Yahoo falla | Puede ser rate limit, esperar 1h |
| Chrome descarga sin extensión | Bug de Chrome, usar Edge/Firefox |

---

## 📝 CONTACTO Y REDES

- **Email:** info@mbainative.com
- **Dirección:** Calle Romero Robledo, 14, 28008-Madrid
- **Redes:** @MBAInative (X, Instagram, Facebook, YouTube)
- **Plataforma formación:** https://juego-empresa-ia-mbai-797037398090.europe-west1.run.app/

---

## 📚 DEPENDENCIAS CLAVE

```json
{
  "next": "^14.2.3",
  "react": "^18.3.1",
  "html2canvas": "^1.4.1",    // Para exportar PDF
  "jspdf": "^3.0.4",          // Para generar PDF
  "rss-parser": "^3.x",       // Para noticias automáticas
  "mammoth": "^1.11.0"        // Para Corrector RAE (Word)
}
```

---

## 🔄 HISTORIAL DE CAMBIOS RECIENTES

- **26/12/2024:** Automatización noticias IA, fix dropdown sectores
- **25/12/2024:** Sección Mejores Prácticas (5 sectores), Corrector RAE en PythonAnywhere
- **24/12/2024:** Actualización contacto, redes sociales, link plataforma formación
