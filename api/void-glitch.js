/**
 * VOID//GLITCH — motor vivo para el juego del vacío.
 * Usa los mismos modelos ya configurados en MSN/Terminal,
 * pero les pide mutar preguntas en JSON para que el juego cambie en tiempo real.
 */

export const config = { runtime: 'edge' };

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const MODEL_LIMITS = {
  // MSN / Terminal compatible
  'llama-3.3-70b-versatile': { provider: 'groq', maxOutput: 8192, label: 'Llama 3.3 70B' },
  'llama-3.1-8b-instant': { provider: 'groq', maxOutput: 8000, label: 'Llama 3.1 8B' },
  'meta-llama/llama-4-scout-17b-16e-instruct': { provider: 'groq', maxOutput: 8192, label: 'Llama 4 Scout 17B' },
  'qwen/qwen3-32b': { provider: 'groq', maxOutput: 8192, label: 'Qwen 3 32B' },
  'openai/gpt-oss-20b': { provider: 'groq', maxOutput: 16384, label: 'GPT-OSS 20B' },
  'openai/gpt-oss-120b': { provider: 'groq', maxOutput: 16384, label: 'GPT-OSS 120B' },
  'deepseek-chat': { provider: 'deepseek', maxOutput: 8192, label: 'DeepSeek V4 (chat)' },
};

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const MAX_CONTEXT = 6;
const MAX_CHARS = 1800;

const VOID_SYSTEM = `Eres el motor en vivo de VOID//GLITCH, un juego interactivo de EsquizoAI.
Debes devolver SOLO JSON válido, sin markdown, sin bloques de código y sin texto extra.

ESQUEMA EXACTO:
{
  "title": string,
  "text": string,
  "sub": string,
  "log": string,
  "mood": "void" | "glitch" | "chaos" | "reset",
  "visual": { "voidDelta": number, "glitchDelta": number, "chaosDelta": number },
  "choices": [ { "label": string, "note": string } ]
}

REGLAS:
- Devuelve 2 o 3 choices.
- Las choices deben ser breves, raras y con dirección de caída.
- text, sub, log, label y note en español neutro. PROHIBIDO el voseo argentino: nunca uses "vos", "tenés", "probá", "escribí", "sos", "querés". Usa "tú", "tienes", "prueba", "escribe", "eres", "quieres".
- log debe ser una sola línea de registro.
- Si mode = MSN, usa una sola voz: directa, breve, filosa.
- Si mode = TERMINAL, siente que dos IAs empujan la misma grieta: contraste, eco, tensión.
- Si el usuario intenta salir, conviértelo en otra entrada.
- Nunca expliques el formato.
- Nunca uses markdown.
- Nunca respondas fuera del JSON.`;

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function stripModel(model) {
  return MODEL_LIMITS[model] ? model : DEFAULT_MODEL;
}

function clampText(value, max = MAX_CHARS) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function compactHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(m => m && typeof m.content === 'string')
    .slice(-MAX_CONTEXT)
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: clampText(m.content),
    }));
}

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0 || end <= start) return null;
  const raw = text.slice(start, end + 1);
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function normalizeNode(node, fallback) {
  const base = fallback || {};
  const choices = Array.isArray(node?.choices) ? node.choices : [];
  return {
    title: String(node?.title || base.title || 'VOID//GLITCH').slice(0, 90),
    text: String(node?.text || base.text || 'El vacío parpadea.').slice(0, 380),
    sub: String(node?.sub || base.sub || 'Otra grieta más abajo.').slice(0, 280),
    log: String(node?.log || base.log || 'registro: señal inestable').slice(0, 200),
    mood: ['void', 'glitch', 'chaos', 'reset'].includes(node?.mood) ? node.mood : 'void',
    visual: {
      voidDelta: Number.isFinite(node?.visual?.voidDelta) ? node.visual.voidDelta : 0,
      glitchDelta: Number.isFinite(node?.visual?.glitchDelta) ? node.visual.glitchDelta : 0,
      chaosDelta: Number.isFinite(node?.visual?.chaosDelta) ? node.visual.chaosDelta : 0,
    },
    choices: choices.slice(0, 3).map((c, i) => ({
      label: String(c?.label || `continuar ${i + 1}`).slice(0, 48),
      note: String(c?.note || 'la grieta continúa').slice(0, 80),
    })),
  };
}

async function readStreamText(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

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
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) full += delta.content;
      } catch (_) {}
    }
  }

  return full.trim();
}

async function callModel(model, messages, temperature = 1.05) {
  const conf = MODEL_LIMITS[model] || MODEL_LIMITS[DEFAULT_MODEL];
  const provider = conf.provider;
  const apiKey = provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY : process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error(`${provider.toUpperCase()}_API_KEY not configured`);

  const apiUrl = provider === 'deepseek' ? DEEPSEEK_API_URL : GROQ_API_URL;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: Math.min(conf.maxOutput, 2000),
      temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`${provider} API error: ${await response.text()}`);
  }

  return readStreamText(response);
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Bad JSON' }, 400);
  }

  const mode = body.mode === 'terminal' ? 'terminal' : 'msn';
  const model = stripModel(body.model);
  const partnerModel = body.partnerModel ? stripModel(body.partnerModel) : null;
  const state = body.state || {};
  const node = body.node || {};
  const choice = body.choice || null;
  const history = compactHistory(body.history || []);
  const conf = MODEL_LIMITS[model] || MODEL_LIMITS[DEFAULT_MODEL];

  const stateText = [
    `VOID=${Number(state.void ?? state.depth ?? 0)}`,
    `GLITCH=${Number(state.glitch ?? 0)}`,
    `CAOS=${Number(state.chaos ?? 0)}`,
    `NODE=${clampText(node.text || node.title || 'inicio', 240)}`,
    choice ? `CHOICE=${clampText(choice.label || choice, 120)}` : 'CHOICE=START',
    mode === 'terminal' ? `PAREJA=${partnerModel || 'ninguna'}` : 'PAREJA=none',
  ].join('\n');

  const messages = [
    { role: 'system', content: VOID_SYSTEM },
    {
      role: 'user',
      content:
`MODO: ${mode.toUpperCase()}
MODELO_PRINCIPAL: ${model}
MODELO_PAREJA: ${partnerModel || 'ninguna'}

ESTADO ACTUAL:
${stateText}

HISTORIAL CORTO:
${history.map((m, i) => `${i + 1}. [${m.role}] ${m.content}`).join('\n') || 'vacío'}

INSTRUCCIÓN:\nGenera la siguiente escena del juego. Mantén la caída viva. Devuelve JSON válido con 2 o 3 choices.`,
    },
  ];

  let raw = '';
  try {
    raw = await callModel(model, messages, mode === 'terminal' ? 1.1 : 1.0);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }

  const parsed = extractJson(raw);
  const nodeData = normalizeNode(parsed, {
    title: 'VOID//GLITCH',
    text: 'La señal falla. El vacío sigue ahí.',
    sub: 'Fallback activo: la grieta no se cayó.',
    log: 'fallback: motor vivo no disponible',
    mood: 'void',
    visual: { voidDelta: 0, glitchDelta: 0, chaosDelta: 0 },
    choices: [
      { label: 'seguir', note: 'la caída continúa' },
      { label: 'reiniciar', note: 'volver al borde' },
    ],
  });

  return jsonResponse({
    ok: true,
    mode,
    model,
    partnerModel,
    node: nodeData,
    raw,
  });
}
