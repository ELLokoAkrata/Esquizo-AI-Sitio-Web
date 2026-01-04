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

// Guardar datos actuales
function saveData(grimorios) {
  const output = {
    generado: new Date().toISOString(),
    total_grimorios: grimorios.length,
    tokens_totales: grimorios.reduce((sum, g) => sum + g.tokens_original, 0),
    grimorios
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
}

// Funcion principal
async function main() {
  console.log('=== EXTRACTOR DE GRIMORIOS ===\n');
  console.log('Modo: Un grimorio a la vez, guardar después de cada uno\n');

  // Obtener API key
  let apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    try {
      const envFile = fs.readFileSync('.env.local', 'utf8');
      const match = envFile.match(/GROQ_API_KEY=(.+)/);
      if (match) {
        apiKey = match[1].trim();
      }
    } catch (e) {
      console.error('ERROR: No se encontro GROQ_API_KEY');
      process.exit(1);
    }
  }

  if (!apiKey) {
    console.error('ERROR: GROQ_API_KEY vacía');
    process.exit(1);
  }

  // Crear directorio data si no existe
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }

  // Cargar datos existentes
  const existingData = loadExistingData();
  const processedTitles = new Set(Object.keys(existingData));
  console.log(`Ya procesados: ${processedTitles.size}\n`);

  // Recolectar todos los archivos pendientes
  const pendingFiles = [];
  for (const dir of GRIMORIO_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const titulo = file.replace('.html', '');
      if (!processedTitles.has(titulo)) {
        pendingFiles.push({ dir, file, titulo, filePath: path.join(dir, file) });
      }
    }
  }

  console.log(`Pendientes: ${pendingFiles.length}\n`);

  if (pendingFiles.length === 0) {
    console.log('¡Todos los grimorios ya están procesados!');
    return;
  }

  // Array con todos los grimorios (existentes + nuevos)
  const grimorios = Object.values(existingData);

  // Procesar UNO A LA VEZ
  for (let i = 0; i < pendingFiles.length; i++) {
    const { dir, file, titulo, filePath } = pendingFiles[i];

    console.log(`[${i + 1}/${pendingFiles.length}] ${titulo}`);
    console.log(`    Esperando 20s antes de llamar a Groq...`);

    // Esperar ANTES de la llamada (20s para evitar rate limit TPM)
    await new Promise(r => setTimeout(r, 20000));

    // Leer y extraer texto
    const html = fs.readFileSync(filePath, 'utf8');
    const textoCompleto = extractTextFromHTML(html);
    const tokensEstimados = Math.round(textoCompleto.length / 4);

    console.log(`    Llamando a Groq API...`);

    // Estructurar con IA
    const estructura = await structureGrimorio(titulo, textoCompleto, apiKey);

    // Verificar si fue exitoso
    if (estructura.esencia.includes('Error')) {
      console.log(`    ❌ ERROR - se reintentará en próxima ejecución`);
      continue; // No guardar este, seguir con el siguiente
    }

    // Crear fragmentos
    const fragmentos = [];
    const palabras = textoCompleto.split(' ');
    const chunkSize = 400;
    for (let j = 0; j < palabras.length; j += chunkSize) {
      fragmentos.push(palabras.slice(j, j + chunkSize).join(' '));
    }

    const grimorioData = {
      id: titulo.toLowerCase().replace(/_/g, '-'),
      titulo,
      origen: dir,
      archivo: filePath,
      tokens_original: tokensEstimados,
      tokens_comprimido: Math.round(JSON.stringify(estructura).length / 4),
      texto_completo: textoCompleto,
      fragmentos,
      ...estructura
    };

    grimorios.push(grimorioData);

    // GUARDAR INMEDIATAMENTE después de cada éxito
    saveData(grimorios);
    console.log(`    ✅ Guardado (${grimorios.length} total)\n`);
  }

  console.log(`\n=== COMPLETADO ===`);
  console.log(`Total grimorios: ${grimorios.length}`);
}

main().catch(console.error);
