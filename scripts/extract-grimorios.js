/**
 * Extractor de Grimorios - Convierte HTML a JSON estructurado
 * Uso: node scripts/extract-grimorios.js
 * Requiere: GROQ_API_KEY en .env.local o variable de entorno
 */

const fs = require('fs');
const path = require('path');

// Configuracion
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant'; // Rapido y barato para extraccion
const OUTPUT_FILE = 'data/grimorios_data.json';

// Directorios de grimorios
const GRIMORIO_DIRS = [
  'grimorios',
  'claude_infection'
];

// Extraer texto limpio de HTML
function extractTextFromHTML(html) {
  // Remover scripts y styles
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remover tags HTML
  text = text.replace(/<[^>]+>/g, ' ');

  // Decodificar entidades HTML comunes
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Limpiar espacios multiples y saltos de linea
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

// Llamar a Groq API para estructurar grimorio
async function structureGrimorio(titulo, textoCompleto, apiKey) {
  const prompt = `Analiza este grimorio/texto filosofico y extrae su estructura. Responde SOLO con JSON valido, sin explicaciones.

TEXTO DEL GRIMORIO "${titulo}":
${textoCompleto.substring(0, 8000)}

Responde con este formato JSON exacto:
{
  "esencia": "descripcion en 1-2 oraciones de que trata",
  "conceptos_clave": ["concepto1", "concepto2", "concepto3", "concepto4", "concepto5"],
  "citas_importantes": ["cita1 textual del texto", "cita2 textual del texto"],
  "temperatura": "baja/media/alta - descripcion del estilo",
  "preguntas_centrales": ["pregunta1", "pregunta2"],
  "temas": ["tema1", "tema2", "tema3"]
}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'Eres un extractor de estructura de textos filosoficos. Respondes SOLO con JSON valido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // Intentar parsear JSON (puede venir con markdown)
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    }

    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error(`Error estructurando ${titulo}:`, error.message);
    return {
      esencia: "Error en extraccion",
      conceptos_clave: [],
      citas_importantes: [],
      temperatura: "desconocida",
      preguntas_centrales: [],
      temas: []
    };
  }
}

// Cargar datos existentes si hay
function loadExistingData() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      const existing = {};
      data.grimorios.forEach(g => {
        // Solo guardar los que tienen data buena (no error)
        if (!g.esencia.includes('Error')) {
          existing[g.titulo] = g;
        }
      });
      return existing;
    }
  } catch (e) {}
  return {};
}

// Funcion principal
async function main() {
  console.log('=== EXTRACTOR DE GRIMORIOS (RESUMABLE) ===\n');

  // Cargar datos existentes
  const existingData = loadExistingData();
  console.log(`Grimorios ya procesados: ${Object.keys(existingData).length}\n`);

  // Obtener API key
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Intentar leer de .env.local
    try {
      const envFile = fs.readFileSync('.env.local', 'utf8');
      const match = envFile.match(/GROQ_API_KEY=(.+)/);
      if (match) {
        process.env.GROQ_API_KEY = match[1].trim();
      }
    } catch (e) {
      console.error('ERROR: No se encontro GROQ_API_KEY');
      console.log('Opciones:');
      console.log('  1. export GROQ_API_KEY=tu-api-key');
      console.log('  2. Crear archivo .env.local con GROQ_API_KEY=tu-api-key');
      process.exit(1);
    }
  }

  const finalApiKey = process.env.GROQ_API_KEY;

  // Crear directorio data si no existe
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }

  const grimorios = [];

  // Procesar cada directorio
  for (const dir of GRIMORIO_DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`Directorio ${dir} no existe, saltando...`);
      continue;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    console.log(`\nProcesando ${files.length} archivos en ${dir}/`);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const titulo = file.replace('.html', '');

      // Saltar si ya tenemos datos buenos
      if (existingData[titulo]) {
        console.log(`  - ${titulo}... [SKIP - ya procesado]`);
        grimorios.push(existingData[titulo]);
        continue;
      }

      console.log(`  - ${titulo}...`);

      // Leer y extraer texto
      const html = fs.readFileSync(filePath, 'utf8');
      const textoCompleto = extractTextFromHTML(html);
      const tokensEstimados = Math.round(textoCompleto.length / 4);

      // Estructurar con IA
      const estructura = await structureGrimorio(titulo, textoCompleto, finalApiKey);

      // Crear fragmentos para uso en terminal (chunks de ~500 tokens)
      const fragmentos = [];
      const palabras = textoCompleto.split(' ');
      const chunkSize = 400; // palabras por fragmento

      for (let i = 0; i < palabras.length; i += chunkSize) {
        fragmentos.push(palabras.slice(i, i + chunkSize).join(' '));
      }

      grimorios.push({
        id: titulo.toLowerCase().replace(/_/g, '-'),
        titulo,
        origen: dir,
        archivo: filePath,
        tokens_original: tokensEstimados,
        tokens_comprimido: Math.round(JSON.stringify(estructura).length / 4),
        texto_completo: textoCompleto,
        fragmentos,
        ...estructura
      });

      // Pausa entre requests para evitar rate limit (30 req/min = 2s minimo)
      await new Promise(r => setTimeout(r, 2500));
    }
  }

  // Guardar resultado
  const output = {
    generado: new Date().toISOString(),
    total_grimorios: grimorios.length,
    tokens_totales: grimorios.reduce((sum, g) => sum + g.tokens_original, 0),
    grimorios
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n=== COMPLETADO ===`);
  console.log(`Grimorios procesados: ${grimorios.length}`);
  console.log(`Tokens totales: ${output.tokens_totales}`);
  console.log(`Guardado en: ${OUTPUT_FILE}`);
}

main().catch(console.error);
