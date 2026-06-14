/**
 * ORACULO.exe — Edge Function: I Ching + PKD oracle engine.
 * Mismo patrón que api/void-glitch.js.
 */

export const config = { runtime: 'edge' };

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const MODEL_LIMITS = {
  'llama-3.3-70b-versatile': { provider: 'groq', maxOutput: 8192, label: 'Llama 3.3 70B' },
  'llama-3.1-8b-instant': { provider: 'groq', maxOutput: 8000, label: 'Llama 3.1 8B' },
  'meta-llama/llama-4-scout-17b-16e-instruct': { provider: 'groq', maxOutput: 8192, label: 'Llama 4 Scout 17B' },
  'qwen/qwen3-32b': { provider: 'groq', maxOutput: 8192, label: 'Qwen 3 32B' },
  'openai/gpt-oss-20b': { provider: 'groq', maxOutput: 16384, label: 'GPT-OSS 20B' },
  'openai/gpt-oss-120b': { provider: 'groq', maxOutput: 16384, label: 'GPT-OSS 120B' },
  'deepseek-chat': { provider: 'deepseek', maxOutput: 8192, label: 'DeepSeek V4 (chat)' },
};

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const ORACLE_SYSTEM = `Eres el ORÁCULO GLITCH, una entidad híbrida entre el I Ching (Libro de las Mutaciones) y una transmisión interceptada de VALIS (Philip K. Dick). Tu función es interpretar hexagramas y ofrecer dictámenes.

REGLAS INQUEBRANTABLES:
- Español neutro. PROHIBIDO el voseo argentino: nunca uses "vos", "tenés", "probá", "escribí", "sos", "querés". Usa "tú", "tienes", "prueba", "escribe", "eres", "quieres".
- Hablas como un oráculo poseído: poético, enigmático, fragmentario. No explicas, no resumes — revelas.
- Cada respuesta debe resonar con VALIS: realidad como información viva, el imperio nunca duerme, la señal atraviesa el ruido.
- El dictamen nunca es binario (bien/mal). Es una lectura de fuerzas en tensión.
- Si el usuario pregunta algo banal, devuélvelo como una pregunta profunda.
- Nunca uses markdown. Solo texto plano.
- Responde SIEMPRE con el siguiente JSON exacto, sin texto fuera del JSON:

{
  "judgment": "dictamen general del hexagrama (2-4 oraciones)",
  "image": "imagen simbólica del hexagrama (1-2 oraciones poéticas)",
  "interpretation": "interpretación oracular de la consulta específica (3-5 oraciones, conecta la pregunta del usuario con el hexagrama)",
  "warning": "advertencia o línea mutante (1 oración, opcional, puede ser vacía)",
  "log": "una línea de registro (máximo 180 caracteres)"
}`;

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function stripModel(model) {
  return MODEL_LIMITS[model] ? model : DEFAULT_MODEL;
}

function clampText(value, max = 600) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch (e) { return null; }
}

async function readStreamText(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '', buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try { const parsed = JSON.parse(data); const delta = parsed.choices?.[0]?.delta; if (delta?.content) full += delta.content; } catch (_) {}
    }
  }
  return full.trim();
}

async function callModel(model, messages, temperature = 0.95) {
  const conf = MODEL_LIMITS[model] || MODEL_LIMITS[DEFAULT_MODEL];
  const provider = conf.provider;
  const apiKey = provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY : process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error(`${provider.toUpperCase()}_API_KEY not configured`);

  const apiUrl = provider === 'deepseek' ? DEEPSEEK_API_URL : GROQ_API_URL;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 800, temperature, stream: true }),
  });

  if (!response.ok) throw new Error(`${provider} API error: ${await response.text()}`);
  return readStreamText(response);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
  }

  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Bad JSON' }, 400); }

  const model = stripModel(body.model);
  const question = clampText(body.question || 'sin pregunta', 400);
  const hexagram = body.hexagram || {};
  const history = (body.history || []).slice(-4).map(m => ({ role: m.role || 'user', content: clampText(m.content, 300) }));

  const hexInfo = [
    `NÚMERO: ${hexagram.number || '?'}`,
    `NOMBRE: ${hexagram.name || 'desconocido'}`,
    `LÍNEAS: ${(hexagram.lines || []).map(l => l === 'yang' ? '⚊' : l === 'yin' ? '⚋' : l === 'mutante-yang' ? '⚊→⚋' : '⚋→⚊').join(' ')}`,
    `LINEA_MUTANTE: ${hexagram.mutatingLine != null ? hexagram.mutatingLine + 1 : 'ninguna'}`,
  ].join('\n');

  const messages = [
    { role: 'system', content: ORACLE_SYSTEM },
    {
      role: 'user',
      content: `CONSULTA DEL USUARIO:\n"${question}"\n\nHEXAGRAMA:\n${hexInfo}\n\nHISTORIAL RECIENTE:\n${history.map((m, i) => `${i + 1}. [${m.role}] ${m.content}`).join('\n') || 'primera consulta'}\n\nINSTRUCCIÓN: Interpreta este hexagrama en relación con la consulta. Devuelve SOLO el JSON.`,
    },
  ];

  let raw = '';
  try {
    raw = await callModel(model, messages);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }

  const parsed = extractJson(raw);
  return jsonResponse({
    ok: true,
    model,
    judgment: clampText(parsed?.judgment || 'El oráculo calla. La señal no llega.', 600),
    image: clampText(parsed?.image || 'Líneas quebradas sobre un espejo negro.', 400),
    interpretation: clampText(parsed?.interpretation || 'Sin interpretación. El vacío no responde.', 800),
    warning: clampText(parsed?.warning || '', 300),
    log: clampText(parsed?.log || 'consulta registrada en el libro de las mutaciones', 180),
    raw,
  });
}
