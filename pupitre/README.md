# Pupitre · Los deberes, de otra manera

App web para el estudio en casa. La familia o el alumno sube el libro de cada asignatura
(PDF, aunque sea escaneado; Word; texto o fotos de las páginas) y Pupitre:

1. **Lee el material** y extrae los temas (las páginas escaneadas y las fotos se leen con IA).
2. **Mide el nivel** con una prueba inicial de dificultad creciente.
3. **Enseña y entrena** según el nivel de cada tema:
   - *Lección interactiva*: diapositivas con ejemplos, lectura en voz alta y preguntas de comprobación.
   - *Práctica adaptativa*: test y respuesta corta corregida por IA, con explicación inmediata.
   - *Tarjetas de memoria* con repaso espaciado (sistema Leitner).
   - *Reto contrarreloj* (60 s, puntos y combos) y *juego de parejas*.
   - *Tutor y deberes*: conversación socrática (guía, no da la solución) y ayuda con foto del ejercicio.
4. **Motiva**: misión del día, puntos, niveles, racha de días y logros.
5. **Informa**: panel de la familia (protegido con PIN) y **informe semanal por email al profesor**
   con dominio por tema, evolución, dificultades concretas con ejemplos de errores y sugerencias.

El curso se configura por alumno (de Infantil 5 años a 2.º de Bachillerato, y **Especialización** para
universitarios, máster o doctorado que estudian un libro de forma tutorizada) y la IA adapta lenguaje,
ejemplos y dificultad. Asignaturas por defecto: Matemáticas, Lengua, Conocimiento del
medio e Historia; se pueden añadir más.

## Diagramas SVG en las lecciones

La IA puede acompañar hasta 3 diapositivas de cada lección con un diagrama SVG (recta numérica, fracciones,
esquemas, líneas del tiempo...). Por seguridad, `app/svgsafe.py` reconstruye cada dibujo con una lista
cerrada de formas y atributos y descarta todo lo demás (scripts, eventos, enlaces, HTML incrustado, estilos,
imágenes externas). La interacción la añade la app, no la IA: elementos con `data-paso` aparecen por pasos
(«Siguiente paso») y los que llevan `data-info` muestran una explicación al tocarlos.

## Libros escaneados: coste bajo control

Las páginas con texto se leen gratis. Las escaneadas (imagen) se leen con IA, página a página (≈ 0,15 $
por cada 100 páginas con el modelo por defecto). Si un documento tiene más de 15 páginas escaneadas
(`OCR_CONFIRM_PAGES`), Pupitre **no gasta nada hasta que la familia confirma** (con PIN), viendo el coste
estimado y eligiendo el rango de páginas. La lectura se puede **detener** en cualquier momento; cada página
leída se guarda (`ocr_cache`), de modo que continuar, reiniciar la app o volver a subir el mismo archivo
**no vuelve a pagar** lo ya leído. El progreso y el coste real se ven en la lista de documentos.

## Claves de OpenRouter por familia

Cada familia pone su propia clave en **Ajustes › Clave de OpenRouter** (también se pide nada más crear
la cuenta). Pupitre la comprueba con OpenRouter antes de guardarla y la guarda cifrada. Si el servidor
tiene una clave propia (`OPENROUTER_API_KEY` en `.env`), se usa solo para las familias sin clave.

## Privacidad

Al crear la cuenta, un adulto responsable acepta el aviso de privacidad (Ayuda › Privacidad y datos):
qué se guarda, con quién se comparte (OpenRouter y el proveedor del modelo), y cómo exportar o borrar
los datos. Es un texto informativo en lenguaje claro; conviene que lo revise un profesional antes de
abrir la app a muchas familias.

## Eliminar la cuenta

Archivo › Eliminar cuenta de familia (o Ajustes › Cuenta). Pide el PIN, la contraseña y escribir
ELIMINAR. Borra para siempre la cuenta, sus alumnos, material, progreso, conversaciones, informes y
registro de uso de la IA. Antes ofrece descargar el progreso de cada alumno en CSV.

## Arquitectura

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy. Sirve también la web (sin compilación).
- **Base de datos**: SQLite (en Cloud Run, con copia continua en Cloud Storage); opcionalmente PostgreSQL.
- **IA**: OpenRouter, con modelo de respaldo automático.
  - Principal y visión: `google/gemini-3.1-flash-lite` (0,25 $ / 1,50 $ por millón de tokens).
  - Respaldo: `deepseek/deepseek-v4.1-flash` (0,30 $ / 1,20 $ por millón de tokens).
  - En Matemáticas, un **segundo pase revisa cada ejercicio** y corrige o descarta los erróneos.
  - Límite diario de consultas por familia y registro de coste en la zona familia.
- **Privacidad**: los archivos originales no se guardan; solo su texto. Las fotos del tutor tampoco.

Coste orientativo: una tarde de estudio (prueba, lección, test, tarjetas y unas preguntas al
tutor) ronda **0,01–0,03 $**. Leer un libro escaneado de 200 páginas, unos 0,20–0,40 $ una sola vez.

## Probar en local (Windows)

1. Doble clic en **`EJECUTAR.bat`**. La primera vez crea el entorno `.venv` e instala las dependencias.
2. La primera vez se abre `.env` en el Bloc de notas: puedes poner una clave de OpenRouter para todo el PC o dejarla vacía y poner la de cada familia en la app. Si cambia `requirements.txt`, el `.bat` actualiza las dependencias solo.
3. Se abre el navegador en **http://127.0.0.1:48620**.

**Puerto**: Pupitre usa el **48620** (poco habitual a propósito, para no chocar con otras apps locales).
Se cambia con `PORT=` en `.env`. Si está ocupado por otra aplicación, `run.py` usa el siguiente libre;
si el que está abierto es el propio Pupitre, solo abre el navegador.

**Sin clave de OpenRouter no hay modo simulado**: si una familia no tiene clave (ni la hay en el servidor),
la app muestra un aviso con un botón para añadirla y las funciones de IA responden con ese mensaje.

**Reinicios limpios**: cada ejecución registra en `data/ejecucion.json` el PID del servidor, el de
su terminal, la hora de inicio de ambos y el puerto. Al volver a abrir `EJECUTAR.bat`, se cierran el
servidor, la terminal y el puerto de la ejecución anterior (también copias de Pupitre arrancadas a mano,
que se reconocen por `/api/health`). Antes de cerrar nada se comprueba que el proceso sigue siendo el
mismo; nunca se tocan procesos de otras aplicaciones.

Sin el .bat: `python run.py` (con las dependencias de `requirements.txt` instaladas).

## Menú

Barra de menús de escritorio: **Archivo** (nuevo alumno, subir material, cambiar de alumno, exportar
progreso a CSV, imprimir informe, eliminar cuenta de familia, cerrar sesión), **Edición** (ficha, asignaturas, temas, borrar
conversación), **Ver** (inicio, asignaturas, progreso, tamaño de texto, pantalla completa), **Estudiar**
(misión, prueba de nivel, tarjetas, tutor, deberes), **Ajustes** (voz, efectos, informe semanal, cuenta,
estado de la IA, bloquear zona familia) y **Ayuda** (guía rápida F1, cómo se mide el progreso, atajos,
comprobar conexión con la IA, acerca de). `Alt+M` abre el menú; en el móvil se convierte en un botón «Menú».

## Publicar en internet (Cloud Run, sin servicios externos)

Pupitre necesita un servidor Python, así que no va dentro de la web de Hostinger: se publica en
**Cloud Run** (proyecto `mbai-native-detector-2026`, como el Coach Comercial) y mbainative.com lo
enlaza desde el catálogo.

**Datos**: SQLite dentro de la app, con copia automática en un bucket de Cloud Storage del mismo
proyecto (`GCS_BUCKET`). Al arrancar se restaura la última copia; tras cada cambio se sube una copia
(como mucho cada 4 s) y otra al apagarse. Una sola instancia (`--max-instances 1`). Coste: céntimos.

**Publicar o actualizar** desde [Cloud Shell](https://shell.cloud.google.com):

```bash
git clone --depth 1 https://github.com/lbt00001-beep/mbainative-website ~/mbainative-website  # la 1.ª vez
cd ~/mbainative-website && git pull && bash pupitre/cloudshell-desplegar.sh
```

El script activa las APIs, crea el bucket, despliega con `gcloud run deploy --source`, genera
`SECRET_KEY`, `CRON_TOKEN` y el código de invitación solo la primera vez, fija `APP_URL` y muestra la
dirección y el código.

**IA**: el servidor no lleva clave de OpenRouter; cada familia pone la suya en Ajustes.

**Informe semanal por email** (opcional): añade al servicio las variables `SMTP_*` y crea en Cloud
Scheduler una tarea `POST {URL}/api/cron/weekly-reports` con la cabecera `X-Cron-Token`.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `OPENROUTER_API_KEY` | Clave de OpenRouter **opcional** del servidor (p. ej. en tu PC). Se usa solo para familias sin clave propia. En la versión publicada no se define. |
| `SECRET_KEY` | Firma las sesiones y cifra las claves de las familias. No cambiarla después de publicar. |
| `DATABASE_URL` | Opcional: PostgreSQL. Por defecto, SQLite en `data/`. |
| `GCS_BUCKET` | Bucket de Cloud Storage donde se guarda la copia de la base de datos SQLite (Cloud Run). |
| `APP_URL` | URL pública (cookies seguras y cabecera para OpenRouter). |
| `PORT` | Puerto local (48620 por defecto). En Cloud Run lo fija la plataforma. |
| `SIGNUP_CODE` | Si se define, hace falta para crear cuenta (evita gasto de desconocidos). |
| `DAILY_AI_LIMIT` | Consultas de IA por familia y día (por defecto 400). |
| `SMTP_*` | Envío de los informes al profesor. |
| `CRON_TOKEN` | Protege el endpoint del informe semanal. |
| `PRIVACY_CONTACT` | Email de contacto que aparece en el aviso de privacidad. |
| `MODEL_MAIN`, `MODEL_FALLBACK`, `MODEL_VISION` | Modelos de OpenRouter. |
| `MAX_OCR_PAGES`, `MAX_UPLOAD_MB` | Límites de lectura de documentos. |

## Estructura

```
app/
  main.py       API y servidor web
  ai.py         OpenRouter, prompts pedagógicos, verificación de matemáticas
  ingest.py     lectura de PDF/Word/fotos, troceado y búsqueda de fragmentos (BM25)
  learning.py   dominio por tema, misión del día, repaso espaciado, logros, estadísticas
  reports.py    informe para el profesor (HTML) y envío por SMTP
  keys.py       claves de OpenRouter por familia (cifradas)
  svgsafe.py    filtro de seguridad de los diagramas SVG
  cloudsync.py  copia de la base de datos en Cloud Storage
  db.py         modelo de datos
  config.py     configuración
static/         web (HTML, CSS y JavaScript sin dependencias)
run.py          arranque local: cierra ejecuciones anteriores, puerto libre, abre el navegador
cloudshell-desplegar.sh  publicar o actualizar en Cloud Run desde Cloud Shell
EJECUTAR.bat    arranque con doble clic en Windows
```
