const fs = require('fs');
const path = require('path');

async function updateBenchmarks() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR: La variable de entorno OPENROUTER_API_KEY no está definida.");
    process.exit(1);
  }

  const htmlPath = path.join(__dirname, '..', '..', 'app', 'public', 'benchmarks-ia', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ ERROR: No se encontró el archivo HTML en: ${htmlPath}`);
    process.exit(1);
  }

  console.log("📖 Leyendo el archivo HTML...");
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Extraer el JSON actual de initialData usando los marcadores
  const startMarker = '// /* START_INITIAL_DATA */';
  const endMarker = '// /* END_INITIAL_DATA */';
  
  const startIndex = htmlContent.indexOf(startMarker);
  const endIndex = htmlContent.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    console.error("❌ ERROR: No se encontraron los marcadores de delimitación en el HTML.");
    process.exit(1);
  }

  const blockText = htmlContent.substring(startIndex + startMarker.length, endIndex).trim();
  
  // Limpiar el prefijo 'const initialData = ' y el sufijo ';' para quedarnos solo con el objeto JSON literal
  let jsonText = blockText.replace(/^\s*const\s+initialData\s*=\s*/, '');
  if (jsonText.endsWith(';')) {
    jsonText = jsonText.slice(0, -1);
  }

  let currentData;
  try {
    // Evaluamos el JS de forma segura para obtener el objeto o usamos JSON.parse si es JSON puro
    // Como en el HTML está formateado como objeto de JS (con claves opcionales sin comillas dobles), 
    // lo convertimos a JSON estándar o lo evaluamos de forma simple
    currentData = eval(`(${jsonText})`);
  } catch (err) {
    console.error("❌ ERROR al parsear los datos locales existentes:", err.message);
    process.exit(1);
  }

  console.log("🤖 Consultando actualizaciones a OpenRouter...");
  const promptSystem = `Eres un analista de mercado de IA experto. Tu única tarea es actualizar un objeto JSON que representa un catálogo de modelos de IA, sus metadatos de API y sus puntuaciones de benchmarks.
Debes responder EXCLUSIVAMENTE con el objeto JSON crudo y actualizado. No incluyas explicaciones, introducciones, ni bloques de código de markdown (\`\`\`json). Solo el JSON plano parseable.`;

  const promptUser = `Esta es la base de datos actual de benchmarks de modelos de IA en formato JSON:

${JSON.stringify(currentData, null, 2)}

Tu tarea es:
1. Actualizar las puntuaciones en el Elo de Chatbot Arena de LMSYS de los modelos existentes con los registros reales y oficiales a la fecha actual (2026).
2. Si existen nuevos modelos líderes de OpenAI, Anthropic, Google u otros que hayan salido y superen a los actuales, añádelos en la propiedad 'models' respetando exactamente el mismo formato de propiedades y asignando estimaciones rigurosas para el resto de benchmarks si no hay datos oficiales.
3. Actualizar los precios por millón de tokens (priceInput / priceOutput en dólares) de las APIs que hayan tenido rebajas de precios.
4. Mantener la consistencia estructural del objeto JSON (debe contener la propiedad 'benchmarks' y la propiedad 'models').
5. No alucines datos excesivamente inflados ni inventes benchmarks fuera de la realidad técnica.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mbainative.com",
        "X-Title": "MBAI Native Benchmarks Updater"
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash-lite",
        messages: [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`Error en API de OpenRouter: ${response.statusText} (${response.status})`);
    }

    const resJson = await response.json();
    let rawReply = resJson.choices[0].message.content.trim();

    // Limpiar posibles bloques markdown envueltos en ```json ... ```
    if (rawReply.startsWith("```")) {
      rawReply = rawReply.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    // Validar que sea un JSON correcto
    const updatedData = JSON.parse(rawReply);
    if (!updatedData.benchmarks || !updatedData.models) {
      throw new Error("El JSON recibido no contiene la estructura requerida (benchmarks y models).");
    }

    console.log("🎉 Datos actualizados con éxito. Formateando y escribiendo en el archivo HTML...");
    
    // Formatear el JS resultante de forma bonita
    const replacementBlock = `\n    const initialData = ${JSON.stringify(updatedData, null, 2)};\n  `;
    
    // Construir el nuevo HTML
    const newHtmlContent = htmlContent.substring(0, startIndex + startMarker.length) 
                         + replacementBlock 
                         + htmlContent.substring(endIndex);

    fs.writeFileSync(htmlPath, newHtmlContent, 'utf8');
    console.log("✅ El archivo HTML ha sido actualizado correctamente con los datos de benchmarks en vivo.");
    process.exit(0);

  } catch (err) {
    console.error("❌ ERROR durante el proceso de actualización:", err.message);
    process.exit(1);
  }
}

updateBenchmarks();
