# Infraestructura de Despliegue — MBAI Native & Firebase

## Resumen

Este documento describe la infraestructura de despliegue de **mbainative.com** y todas las apps desplegadas en **Firebase Hosting**, para que cualquier sesión futura pueda entender cómo funciona todo sin investigar de nuevo.

---

## 1. Web principal: mbainative.com

### Tecnología
- **Framework**: Next.js 14.2 (App Router)
- **Código fuente**: `C:\Dev\mbainative-website\app\`
- **Hosting**: Hostinger (conectado a GitHub para deploy automático)

### Deploy
El deploy es **automático vía Git push**:

```
git add . → git commit → git push origin master
       ↓
GitHub (lbt00001-beep/mbainative-website)
       ↓
Hostinger detecta el push y redespliega automáticamente
```

> **⚠️ IMPORTANTE**: No se necesita `firebase deploy`, ni Dockerfile, ni ningún paso manual. Solo `git push origin master` y Hostinger hace el build y deploy.

> **⚠️ CACHÉ HOSTINGER**: Si los cambios no aparecen inmediatamente, puede ser necesario limpiar la caché de Hostinger desde el panel hPanel.

### Estructura del proyecto
```
C:\Dev\mbainative-website\
├── app/                          ← Proyecto Next.js
│   ├── app/                      ← App Router (páginas)
│   │   ├── aplicaciones/
│   │   │   ├── page.tsx          ← Catálogo de apps (AQUÍ se añaden nuevas apps)
│   │   │   ├── corrector-rae/
│   │   │   ├── futuros/
│   │   │   ├── inversion-fundamentales/
│   │   │   └── comparativa-ue/
│   │   ├── about/
│   │   ├── contact/
│   │   ├── services/
│   │   ├── mejores-practicas/
│   │   └── layout.tsx
│   ├── components/
│   ├── public/
│   │   ├── images/
│   │   ├── data/social-content.json
│   │   └── evolucion/            ← App estática servida directamente
│   ├── package.json
│   └── .next/                    ← Build output
├── .github/workflows/            ← GitHub Actions (social media automation)
├── LEEME.md                      ← Documentación general del proyecto
└── MAKE_SETUP.md                 ← Config de Make.com para RRSS
```

### Cómo añadir una nueva app al catálogo

Editar `C:\Dev\mbainative-website\app\app\aplicaciones\page.tsx`:

```tsx
// Buscar el array 'categorias' y añadir una entrada:
{
  nombre: "Nombre de la App",
  descripcion: "Descripción corta.",
  url: "https://mi-app.web.app",    // URL externa (Firebase, Vercel, etc.)
  tipo: "externo",                   // "externo" = abre en nueva pestaña, "interno" = usa Link de Next.js
  estado: "disponible"              // "disponible" | "proximamente"
}
```

Para una nueva **categoría**:
```tsx
{
  id: "mi-categoria",
  nombre: "Mi Categoría",
  icono: "🔧",
  descripcion: "Descripción de la categoría",
  apps: [ /* ... apps ... */ ]
}
```

Después: `git add . && git commit -m "..." && git push origin master`

---

## 2. Firebase Hosting — Apps desplegadas

### Cuenta
- **Email**: lbt00001@gmail.com
- **Consola**: https://console.firebase.google.com

### Proyectos Firebase existentes

| Proyecto | URL | Qué es |
|----------|-----|--------|
| `clonify-dashboard` | https://clonify-dashboard.web.app | Clon virtual interactivo (esta app) |
| `mbai-native-detector-2026` | https://mbai-native-detector-2026.web.app | Detector de textos IA |
| `prensa-resumen-mbai-2266` | https://prensa-resumen-mbai-2266.web.app | Prensa Resumen MBAI |

> **Nota**: Muchas otras apps usan Firebase pero fueron creadas en sesiones anteriores. Siempre verificar la consola de Firebase para la lista completa.

### Cómo desplegar una app estática a Firebase

#### 1. Crear proyecto (si es nuevo)
```bash
# Vía Firebase MCP tool:
firebase_create_project(project_id="mi-app-mbai")

# O vía CLI:
npx -y firebase-tools projects:create mi-app-mbai
```

#### 2. Crear archivos de configuración

**firebase.json** (en la raíz del proyecto):
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "server/**",
      "node_modules/**",
      "firebase-debug.log",
      ".firebaserc",
      "firebase.json"
    ],
    "headers": [
      {
        "source": "**/*.js",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "**/*.css",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      }
    ]
  }
}
```

**.firebaserc**:
```json
{
  "projects": {
    "default": "mi-app-mbai"
  }
}
```

#### 3. Desplegar

**Vía Firebase MCP** (preferido dentro de Gemini):
```
1. firebase_update_environment(project_dir="C:\...\mi-app", project_id="mi-app-mbai")
2. firebase_deploy()
3. firebase_deploy_status(job_id="...")
```

**Vía CLI** (más fiable, funciona siempre):
```bash
cd C:\...\mi-app
npx -y firebase-tools deploy --only hosting --project mi-app-mbai
```

#### 4. Añadir a mbainative.com/aplicaciones
Editar `page.tsx` como se describe arriba y hacer `git push`.

---

## 3. Caso específico: Clonify

### Ubicación del código
```
C:\Dev\herramientas\dady\clon-dady\
├── index.html          ← SPA principal
├── app.js              ← Toda la lógica (speech, API, state)
├── style.css           ← Estilos
├── default_avatar.png  ← Avatar por defecto
├── firebase.json       ← Config Firebase Hosting
├── .firebaserc         ← Asociación con proyecto clonify-dashboard
└── server/             ← Backend WhatsApp Baileys (NO se despliega a Firebase)
```

### Notas importantes
- La **API key de ElevenLabs** fue eliminada del código fuente. Los usuarios deben introducir su propia key en Ajustes.
- El directorio `server/` contiene el backend de WhatsApp (Baileys) que se ejecuta localmente. **No se puede desplegar a Firebase Hosting** — es un servidor Node.js con WebSocket.
- Firebase solo sirve los archivos estáticos (HTML/JS/CSS).

### URL
- **Firebase**: https://clonify-dashboard.web.app
- **Listada en**: https://mbainative.com/aplicaciones → sección "IA Personal"

---

## 4. Otras plataformas de hosting usadas

| Plataforma | Apps | Nota |
|------------|------|------|
| **Firebase Hosting** | Detector IA, Prensa Resumen, Clonify, Correlaciones, CIS, Dashboard Economía, etc. | Deploy con `firebase-tools` |
| **Vercel** | Análisis Político | Deploy automático desde GitHub |
| **Google Cloud Run** | Simulador Empresarial, Coach Comercial IA | Containerizado |
| **PythonAnywhere** | Corrector RAE | Python/Flask |
| **Hostinger** | mbainative.com (Next.js) | Deploy automático vía Git |
| **Subdominios Hostinger** | fotos.mbainative.com (FotoAI Slides) | CNAME en DNS de Hostinger |

---

## 5. Cuentas y accesos

| Servicio | Cuenta | Uso |
|----------|--------|-----|
| **GitHub** | info@mbainative.com (lbt00001-beep) | Repos de apps y web |
| **Firebase** | lbt00001@gmail.com | Hosting de apps estáticas |
| **Hostinger** | hpanel.hostinger.com | Web principal + DNS |
| **Streamlit Cloud** | mbainative | Algunas apps legacy |

---

## 6. Checklist para desplegar una nueva app

- [ ] Crear proyecto Firebase: `npx -y firebase-tools projects:create nombre-app`
- [ ] Crear `firebase.json` y `.firebaserc` en la raíz del proyecto
- [ ] Desplegar: `npx -y firebase-tools deploy --only hosting --project nombre-app`
- [ ] Verificar URL: `https://nombre-app.web.app`
- [ ] Añadir entrada en `C:\Dev\mbainative-website\app\app\aplicaciones\page.tsx`
- [ ] Build: `cd C:\Dev\mbainative-website\app && npm run build`
- [ ] Push: `git add . && git commit -m "..." && git push origin master`
- [ ] Esperar deploy automático de Hostinger (~2-5 minutos)
- [ ] Verificar en https://mbainative.com/aplicaciones
