# AGENTS.md

## Proyecto: Radar de Calidad Periodística (`prensa`)

### Objetivo funcional obligatorio
- El flujo principal es: **PDF/texto -> evaluación OpenRouter -> diagnóstico por criterio -> descarga de informe `.txt`**.
- La app debe permitir analizar **múltiples artículos seguidos sin reiniciar**.

### Entorno (Windows)
- Usar `npm install --cache .npm-cache` en `frontend` y `backend` para evitar `EPERM` en cache global.
- Arranque estándar: `cmd /c Ejecutar.cmd`.
- Backend esperado en `5174`; frontend en `5173`.

### Reglas backend
- Archivo clave: `backend/server.js`.
- Mantener endpoint `POST /api/evaluate` compatible con frontend actual.
- La salida debe incluir siempre:
  - `modelUsed`
  - `overallScore`, `label`, `scores`
  - `criteriaDetails` con `score`, `rationale`, `evidence`
  - `strengths`, `improvements`, `editorialActions`
  - `summary`, `editorialVerdict`, `metadata`
- Si el modelo responde débil/incompleto, usar reintento y fallback local para evitar textos tipo `Sin detalle` / `No reportada`.

### Reglas frontend
- Archivo clave: `frontend/src/main.js`.
- El selector de IA debe ser **desplegable** y mantener opciones OpenAI/China/Europa.
- Al cargar nuevo PDF:
  - limpiar metadatos del artículo anterior
  - limpiar resultado previo
  - permitir autocompletar metadatos del nuevo análisis
- Nombre del informe exportado debe incluir modelo IA (`modelUsed`).

### Exportación de informe
- Exportar como `.txt` con BOM UTF-8 (`\uFEFF`) para compatibilidad de acentos en Windows/Notepad.
- Incluir en contenido: modelo IA, metadatos, diagnóstico por criterio, fortalezas, mejoras, acciones editoriales, resumen y veredicto.

### Verificación mínima antes de cerrar tarea
1. `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`
2. `node --check backend/server.js`
3. `node --check frontend/src/main.js`
4. (si se tocó backend) `GET /health` debe responder `{"status":"ok"}`

### Nota de logs
- `GET /.well-known/appspecific/com.chrome.devtools.json` con `404` en `http-server` es normal de Chrome DevTools y no es bug funcional.
