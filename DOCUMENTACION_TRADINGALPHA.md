# TRADINGALPHA INVERSIONES — DOCUMENTACIÓN MAESTRA DEL SISTEMA
> **Propósito de este documento:** Permitir que cualquier desarrollador o modelo de IA (Antigravity / Gemini / Claude) comprenda al 100% la arquitectura, estructura de código, fuentes de datos, modelos de IA y procedimientos operativos de **TradingAlpha** de forma inmediata.

---

## 1. Visión General del Proyecto
**TradingAlpha Inversiones** es una suite institucional de análisis bursátil que combina en un único panel interactivo:
1. **Análisis Fundamental Cuantitativo**: Modelo de Descuento de Flujos de Caja (DCF) bi-etápico, cálculo de Valor Intrínseco y Margen de Seguridad.
2. **Radar Cuantitativo de 5 Dimensiones**: Evaluación de Valor, Crecimiento, Rentabilidad (Performance), Salud Financiera e Historial.
3. **Auditoría Forense Contable**: Desglose Piotroski F-Score (0 a 9) y Altman Z-Score acotado.
4. **Estados Financieros Normalizados a 4 Años**: Cuenta de Resultados, Balance de Situación y Estado de Flujos con Descomposición DuPont de 3 fases.
5. **Terminal Técnico Multitemporal**: Gráfico interactivo con velas japonesas, medias móviles exponenciales/simples (EMA 20, SMA 50, SMA 200), RSI(14) y MACD (12, 26, 9).
6. **Finanzas Conductuales & Pulso de Sentimiento:** Extracción y análisis de titulares de noticias en tiempo real vía Yahoo RSS, cálculo del *Net Sentiment Index* (NSI) y matriz cuadrante de oportunidad (Sentimiento vs Fundamentales).
7. **Centro Pedagógico de Ayuda (Nivel Bachillerato):** 8 módulos didácticos interactivos con explicaciones intuitivas y buscador de conceptos financieros.
8. **Motor de Equity Research con IA (OpenRouter):** Generación de tesis ejecutivas con GLM 5.3 Flash, Gemini 3.5 Flash Lite y otros modelos punteros, con desglose de costes y tarifas en tiempo real.
9. **Panel de Ajustes & Diagnóstico:** Semáforo de salud y latencia en ms para los 4 conectores, selector de modelos y almacenamiento seguro de API keys en cliente.

---

## 2. Ubicaciones del Código y Entornos

El proyecto convive en dos ubicaciones complementarias:

### A. Repositorio Local Autónomo (Desarrollo y Testing)
- **Ruta:** `C:\Users\Gaming\Documents\Proyectos_IA\Antigravity\tradingalpha\`
- **Ejecución Local:** Archivo [`EJECUTAR.bat`](file:///C:/Users/Gaming/Documents/Proyectos_IA/Antigravity/tradingalpha/EJECUTAR.bat)
  - Mata procesos previos en puertos 3000/3001 a bajo nivel con PowerShell.
  - Sanea la caché `.next` si detecta conflictos de compilación previos.
  - Abre el navegador en `http://localhost:3000` y arranca `next dev`.

### B. Plataforma de Producción Web (mbainative.com)
- **Ruta:** `C:\Users\Gaming\Documents\Proyectos_IA\Antigravity\mbainative-website\`
- **Página de la App:** `app/app/aplicaciones/tradingalpha/page.tsx` (`https://mbainative.com/aplicaciones/tradingalpha`)
- **Catálogo de Apps:** `app/app/aplicaciones/page.tsx` (registrada bajo la categoría *Finanzas*).
- **Despliegue:** Conectado directamente a **Hostinger** mediante Auto-Deploy de GitHub en la rama `master`. Al hacer `git push origin master` en `mbainative-website`, Hostinger compila y publica automáticamente.
- **Regla Estricta:** La aplicación existente `Inversión con Fundamentales` (`/aplicaciones/inversion-fundamentales`) se mantiene intacta e inalterada.

---

## 3. Arquitectura de Archivos y Componentes

```text
tradingalpha/ (y mbainative-website/app/components/tradingalpha/)
├── components/
│   ├── TradingAlpha.tsx         -> Componente orquestador principal (KPIs, tickers, pestañas)
│   ├── financialEngine.ts       -> Motor matemático puro (SMA, EMA, RSI, MACD, DuPont, Piotroski, Altman Z, DCF, Snowflake)
│   ├── CandleChart.tsx          -> Gráfico vectorial de velas japonesas y osciladores técnicos
│   ├── SnowflakeRadar.tsx       -> Visualizador pentagonal de salud y valor en SVG
│   ├── DCFSimulator.tsx         -> Simulador interactivo de flujos descontados con sliders
│   ├── StatementsDuPont.tsx     -> Estados contables normalizados, matriz DuPont y auditoría Piotroski/Altman Z
│   ├── SentimentPulse.tsx       -> Monitor conductual, índice NSI y cuadrante de oportunidad
│   ├── HelpGuide.tsx            -> Guía didáctica de 8 módulos con buscador de términos
│   └── SettingsPanel.tsx        -> Diagnóstico de conectores, API keys y tarifas OpenRouter
│
├── app/api/
│   ├── stockChart/route.ts      -> Proxy a Yahoo Finance Chart API (velas y volumen)
│   ├── quoteSummary/route.ts    -> Proxy a Yahoo Finance QuoteSummary (ratios, balances y flujos)
│   ├── stockSentiment/route.ts  -> Parser de feeds RSS de noticias y motor de análisis de sentimiento
│   ├── aiAnalysis/route.ts      -> Inferencia con IA vía OpenRouter (hasta 2.500 tokens, soporte para reasoning)
│   └── testConnector/route.ts   -> Comprobación de latencia y salud de APIs sin consumo de saldo
```

---

## 4. Arquitectura de Seguridad (Zero-Secret Policy)

1. **Sin Claves en Servidor ni Repositorio:**
   - No existe ninguna clave de API hardcodeada en el código fuente (`route.ts`).
   - El archivo `.env.local` con claves privadas fue eliminado y reemplazado por [`.env.example`](file:///C:/Users/Gaming/Documents/Proyectos_IA/Antigravity/tradingalpha/.env.example).
2. **Almacenamiento Aislado en Cliente (`localStorage`):**
   - La clave personal del usuario se almacena únicamente en su navegador (`localStorage.getItem('tradingalpha_openrouter_key')`).
   - Si otro usuario accede a la web o clona el repositorio, no consume saldo del propietario.
3. **Manejo Desacoplado de Errores:**
   - Si no se introduce clave, el conector de OpenRouter se muestra en rojo/inactivo y la app guía amigablemente al usuario hacia la pestaña de Ajustes (⚙️).

---

## 5. Modelos de IA Disponibles y Tarifas de OpenRouter

El selector de modelos en `SettingsPanel.tsx` incluye las tarifas oficiales actualizadas de OpenRouter:

| Modelo | ID en OpenRouter | Entrada (/1M) | Salida (/1M) | Coste Medio por Informe | Informes / 1\$ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ⚡ **GLM 5.3 Flash** | `z-ai/glm-5.3-flash` | **\$0.075** | **\$0.250** | **~\$0.00019** | **≈ 5.200** |
| 🚀 **Gemini 3.5 Flash Lite** | `google/gemini-3.5-flash-lite` | **\$0.300** | **\$2.500** | **~\$0.00150** | **≈ 660** |
| 💡 **Gemini 2.5 Flash Lite** | `google/gemini-2.5-flash-lite` | **\$0.100** | **\$0.400** | **~\$0.00030** | **≈ 3.300** |
| 🧠 **DeepSeek V3** | `deepseek/deepseek-chat` | **\$0.257** | **\$1.028** | **~\$0.00070** | **≈ 1.400** |
| ⚙️ **OpenAI GPT-4o Mini** | `openai/gpt-4o-mini` | **\$0.150** | **\$0.600** | **~\$0.00045** | **≈ 2.200** |
| 🖋️ **Claude 3.5 Sonnet** | `anthropic/claude-3.5-sonnet` | **\$3.000** | **\$15.000** | **~\$0.01000** | **≈ 100** |
| 🎁 **GLM 5.2 (Free)** | `z-ai/glm-5.2:free` | **\$0.000** | **\$0.000** | **\$0.00 (Gratis)** | **Ilimitado** |

---

## 6. Directorio Sectorial S&P 500 y Buscador Universal

### A. Arquitectura del Megamenú (`components/sp500Data.ts`)
- Clasificación completa de más de 400 constituyentes en los **11 sectores oficiales GICS**:
  1. 💻 Tecnología de la Información
  2. 🏥 Salud y Farmacia
  3. 🏦 Finanzas y Banca
  4. 🛒 Consumo Discrecional
  5. 📱 Servicios de Comunicación
  6. 🏭 Industria y Aeroespacial
  7. 🥫 Consumo Básico
  8. ⚡ Energía y Petróleo
  9. ⛏️ Materiales Básicos
  10. 💡 Servicios Públicos (Utilities)
  11. 🏢 Inmobiliario y REITs (SOCIMIs)
- Cada empresa cuenta con `ticker`, `name` y `subIndustry`.

### B. Comportamiento UX / Interacción
- **Hover & Focus:** Al situar el cursor (`onMouseEnter`) o hacer clic (`onFocus`) en el cajetín de búsqueda, se despliega un megamenú flotante tipo terminal financiero. Cuenta con un retardo suave de cierre (350 ms) para navegar con el ratón sin parpadeos.
- **Búsqueda Libre Universal (Cualquier Bolsa del Mundo):** El usuario no está limitado al S&P 500. Puede teclear libremente acciones del Mercado Continuo español (`SAN.MC`, `ITX.MC`), bolsas europeas (`AIR.PA`, `ASML`, `SAP.DE`), materias primas o criptomonedas.
- **Acción Rápida:** Al empezar a teclear, la cabecera ofrece un botón prioritario `Analizar [TICKER] ➔`, permitiendo además pulsar `Enter` en cualquier momento.

---

## 7. Baremos Visuales y Auditoría Contable

1. **Margen de Seguridad (Graham / Buffett):**
   - Aguja dinámica sobre barra tricolor calibrada:
     - 🟢 **Infravalorada (>20%):** Margen de seguridad holgado.
     - 🟡 **Rango Justo (-10% a +20%):** Cotiza cerca de su valor intrínseco.
     - 🔴 **Sobrevalorada (<-10%):** Riesgo de corrección por múltiplos exigentes.
2. **Riesgo de Quiebra (Altman Z-Score):**
   - Aguja interactiva sobre las 3 zonas canónicas de Edward Altman:
     - 🔴 **Zona de Peligro (< 1.8):** Elevada probabilidad de insolvencia o reestructuración.
     - 🟡 **Zona Gris (1.8 - 3.0):** Situación vulnerable que exige monitorización.
     - 🟢 **Zona Segura (> 3.0):** Solvencia financiera sólida.
   - **Exención Bancaria:** Los bancos y aseguradoras muestran `N/A Banca`, explicando que se auditan bajo la regulación de capital CET1 y colchón de liquidez de Basilea III.

---

## 8. Sincronización Atómica de Tickers y Prevención de Mezcla de Datos

- **Función `selectTicker`:** Al seleccionar un nuevo ticker:
  1. Sanea y limpia inmediatamente el valor de búsqueda.
  2. Purga el estado en memoria (`setQuoteData(null)`, `setChartBars([])`, `setSentimentData(null)`, `setAiReport(null)`).
  3. Actualiza `activeTickerRef.current`. Si llega una respuesta de red tardía de una acción previa, se descarta automáticamente.
  4. `safeQuoteData`: valida que `quoteData.price.symbol === ticker` antes de renderizar nombres o precios en las tarjetas.

---

## 9. Historial de Incidencias Técnicas Resueltas (Troubleshooting)

### A. Fallo 500 y Altman Z no calculado en `SAN.MC` (y valores europeos)
- **Causa:** La función `sanitizeTicker` en `quoteSummary/route.ts` reemplazaba todos los puntos por guiones (`replaceAll(".", "-")`), transformando `SAN.MC` en `SAN-MC`. Yahoo Finance devolvía error 404 para `SAN-MC`.
- **Solución:** Se corrigió `sanitizeTicker` para preservar siempre los sufijos bursátiles internacionales (`.MC`, `.PA`, `.DE`, `.AS`, `.L`, etc.), aplicando el reemplazo únicamente a clases de acciones de EE.UU. (ej. `BRK.B` $\rightarrow$ `BRK-B`).

### B. Error "Yahoo Quote no funciona en la web" (Error 500 en `testConnector`)
- **Causa:** En la pestaña Ajustes, el test de diagnóstico de Yahoo Quote ejecutaba en el servidor un bucle interno reflexivo (`fetch(request.url)`). El firewall y proxy inverso de Hostinger bloquean las peticiones en bucle local hacia la propia IP pública (*hairpin NAT*), lanzando `fetch failed`.
- **Solución:**
  1. En el servidor ([`testConnector/route.ts`](file:///C:/Users/Gaming/Documents/Proyectos_IA/Antigravity/tradingalpha/app/api/testConnector/route.ts)): se eliminó el loopback y se prueba la conectividad directamente contra el clúster oficial `query2.finance.yahoo.com`.
  2. En el cliente ([`SettingsPanel.tsx`](file:///C:/Users/Gaming/Documents/Proyectos_IA/Antigravity/tradingalpha/components/SettingsPanel.tsx)): `testQuote` consulta directamente el endpoint de la aplicación (`/api/quoteSummary?t=AAPL&modules=price`), midiendo la latencia real de extremo a extremo.

### C. Informes de IA generados en inglés con GLM 5.3 Flash
- **Causa:** `z-ai/glm-5.3-flash` tiene razonamiento obligatorio activado por defecto en OpenRouter (`mandatory: true`), generando miles de tokens de pensamiento en inglés que consumían el presupuesto y dejaban el informe principal truncado.
- **Solución:**
  1. Se envió `reasoning: { effort: 'low', exclude: true }` y se amplió el límite a `max_tokens: 4000`.
  2. Se eliminó el fallback a `msg.reasoning`.
  3. Se añadió un corte estricto en cliente y servidor previo a `### 1. Veredicto Estratégico Ejecutivo` para descartar cualquier borrador preliminar.

### D. Colisión de Chunks de Webpack en Localhost (`./682.js`)
- **Causa:** Al ejecutar `npm run build` y luego arrancar `next dev` (o viceversa), Next.js reutiliza fragmentos incompatibles en `.next`.
- **Solución:** [`EJECUTAR.bat`](file:///C:/Users/Gaming/Documents/Proyectos_IA/Antigravity/tradingalpha/EJECUTAR.bat) purga `.next` automáticamente si detecta conflicto antes de iniciar el entorno de desarrollo.

---

## 10. Procedimiento de Despliegue en Producción (Hostinger)

1. Las compilaciones y cambios deben probarse primero en local:
   ```bash
   npx tsc --noEmit
   ```
2. Replicar los componentes y rutas en el repositorio web:
   ```text
   tradingalpha/components/         -> mbainative-website/app/components/tradingalpha/
   tradingalpha/app/api/            -> mbainative-website/app/app/api/
   ```
3. Compilar en `mbainative-website/app`:
   ```bash
   npm run build
   ```
4. Publicar mediante Git en la rama `master`:
   ```bash
   git add .
   git commit -m "mensaje del cambio"
   git push origin master
   ```
5. Hostinger detecta el commit mediante Webhook y ejecuta el Auto-Deploy de forma automática en 1-2 minutos sin intervención manual.

