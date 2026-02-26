# LEEME.md

## 1) Estado del proyecto
Proyecto: **Radar de Calidad Periodística** (`prensa`)

Objetivo actual:
- Subir un artículo en PDF (o pegar texto manual).
- Evaluarlo automáticamente con un modelo elegido en OpenRouter.
- Mostrar diagnóstico por criterio (score + justificación + evidencia).
- Exportar informe en `.txt` incluyendo el modelo IA utilizado.

Stack actual:
- Frontend: HTML + JS vanilla + CSS (`frontend/`), servido con `http-server` en `5173`.
- Backend: Node.js HTTP server (`backend/server.js`) en `5174`.
- Parsing PDF: `pdf-parse`.
- Integración IA: OpenRouter (`/api/evaluate`).

## 2) Estructura relevante
- `Ejecutar.cmd`: arranca backend + frontend y abre Chrome en `http://localhost:5173`.
- `backend/server.js`: lógica API, validación de salida IA, reintentos y normalización.
- `backend/package.json`: dependencia `pdf-parse`.
- `frontend/src/main.js`: UI, subida PDF, selección de modelo, descarga informe.
- `frontend/src/score.js`: etiquetas de criterios.
- `frontend/src/style.css`: estilos UI.
- `scripts/verify.ps1`: verificación mínima de archivos obligatorios.
- `recursos/`: ejemplos de informes exportados.

## 3) Flujo funcional actual
1. Usuario abre app en `5173`.
2. Ingresa API key OpenRouter y selecciona modelo en desplegable.
3. Sube PDF o pega texto.
4. Frontend envía `POST http://localhost:5174/api/evaluate` con:
   - `apiKey`, `model`, metadatos (`title/outlet/author/date/section`)
   - `pdfBase64` o `articleText`.
5. Backend:
   - Extrae texto (si viene PDF).
   - Construye prompt estricto.
   - Llama OpenRouter.
   - Si salida débil/incorrecta: intenta reparación (`evaluateWithRetry`).
   - Normaliza y fuerza `criteriaDetails` con fallback local si faltan justificación/evidencia.
6. Frontend muestra resultado y permite descargar `.txt`.

## 4) Endpoint backend
### `GET /health`
Respuesta:
```json
{"status":"ok"}
```

### `POST /api/evaluate`
Errores comunes:
- `400`: falta API key.
- `500`: error interno o OpenRouter.

Respuesta exitosa (resumen):
- `source`: `pdf` | `manual`
- `modelUsed`: modelo utilizado (se usa en el nombre del `.txt`)
- `overallScore`, `label`
- `scores` (por criterio)
- `criteriaDetails[criterio] = { score, rationale, evidence }`
- `strengths`, `improvements`, `editorialActions`
- `summary`, `editorialVerdict`
- `metadata` detectada/normalizada
- `signals` (`words`, `sentences`)

## 5) Modelos disponibles en la UI
En `frontend/src/main.js`, `MODEL_PRESETS` está agrupado por región en un `<select>`:
- OpenAI (GPT): `openai/gpt-4.1-mini`, `openai/gpt-4o-mini`, `openai/gpt-4.1`
- China: `qwen/qwen3-max`, `deepseek/deepseek-r1`, `deepseek/deepseek-chat`
- Europa: `mistralai/mistral-medium-3`, `mistralai/mistral-small-3.1-24b-instruct`, `mistralai/mistral-small-3.1-24b-instruct:free`

## 6) Exportación de informe
- Botón: `Descargar informe (.txt)`.
- Incluye BOM UTF-8 (`\uFEFF`) para evitar problemas de acentos en Windows.
- Nombre: `informe-<titulo>-<modelo-ia>-<fecha>.txt`.

## 7) Comandos de trabajo (Windows / PowerShell)
Arranque rápido:
```powershell
cmd /c Ejecutar.cmd
```

Backend manual:
```powershell
cd backend
npm install --cache .npm-cache
npm run dev
```

Frontend manual:
```powershell
cd frontend
npm install --cache .npm-cache
npm run dev
```

Verificación mínima:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify.ps1
```

Chequeo sintaxis JS:
```powershell
node --check backend/server.js
node --check frontend/src/main.js
```

## 8) Decisiones técnicas importantes
- Se usa caché local npm (`--cache .npm-cache`) para evitar errores EPERM en cache global de Windows.
- Frontend prueba backend en dos hosts: `127.0.0.1` y `localhost`.
- Si la IA devuelve salida incompleta, backend intenta reparar y además aplica fallback local para evitar `Sin detalle / No reportada`.
- Al cargar nuevo PDF, frontend limpia metadatos del artículo anterior y tras nueva evaluación los rellena con `metadata` devuelta.

## 9) Problemas conocidos
- PDFs escaneados (imagen sin texto OCR) pueden dar análisis flojo.
- Disponibilidad/coste de modelos OpenRouter puede variar.
- `GET /.well-known/appspecific/com.chrome.devtools.json` con `404` en logs de `http-server` es normal de Chrome (ignorable).

## 10) Próximos pasos recomendados
- Añadir OCR opcional para PDFs escaneados.
- Añadir tests automáticos de contrato para `/api/evaluate`.
- Añadir selector de nivel de rigor (rápido / estándar / estricto).
- Añadir historial local de informes generados.

## 11) Contexto git remoto
Remoto usado:
- `https://github.com/lbt00001-beep/mbainative-website.git`

Rama subida con esta implementación:
- `prensa-openrouter`

PR sugerido:
- `https://github.com/lbt00001-beep/mbainative-website/pull/new/prensa-openrouter`

## 12) Nota para otra IA/agente
Si retomas este proyecto:
1. Verifica backend y frontend levantados en puertos `5174` y `5173`.
2. Ejecuta `scripts/verify.ps1` y `node --check` antes de tocar código.
3. Para cambios en evaluación, revisar primero `buildPrompt`, `evaluateWithRetry`, `buildNormalizedResult` en `backend/server.js`.
4. Para cambios de UX, revisar `render`, `bindEvents`, `downloadReport` en `frontend/src/main.js`.
5. Mantener compatibilidad del formato de respuesta de `/api/evaluate` (frontend depende de esas claves).
