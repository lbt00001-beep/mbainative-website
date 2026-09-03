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

## 6. Historial de Incidencias Resueltas (Troubleshooting)

### A. Valor Absurdo de Riesgo Quiebra Altman Z (-1599807034.83)
- **Causa:** En empresas sin balance desglosado o en entidades financieras/bancarias (ej. Santander `SAN.MC`), la partida `totalAssets` faltaba y el código utilizaba un valor por defecto `totalAssets = 1`. Al dividir un pasivo corriente de 1.600 millones de euros entre 1, el capital de trabajo producía un número astronómico negativo (~ -1.600M).
- **Solución:**
  1. Detección automática del sector financiero: el Altman Z-Score **no aplica a bancos ni aseguradoras** (se muestra `N/A - Banca`).
  2. Validación estricta de balance: requiere activos totales reales (> 100.000€) para calcular; en caso contrario devuelve `null` (N/D).
  3. Acotación matemática (`clampedZ`) en el rango `[-15, +50]`.

### B. Error en Localhost HTTP 500 (`Cannot find module './682.js'`)
- **Causa:** Conflicto de fragmentos internos de Webpack en Next.js al alternar entre `npm run build` (modo producción) y `npm run dev` (modo desarrollo).
- **Solución:** Se actualizó [`EJECUTAR.bat`](file:///C:/Users/Gaming/Documents/Proyectos_IA/Antigravity/tradingalpha/EJECUTAR.bat) para que detecte si existe `.next\BUILD_ID` y purgue la caché previa automáticamente antes de arrancar en modo desarrollo.

### C. Despliegue en Hostinger
- Cualquier actualización debe empujarse a `master` en `mbainative-website`. Hostinger compila en segundo plano y publica en menos de 2 minutos.
