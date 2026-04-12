/**
 * Akelarre Generativo — Vercel Edge Function
 * Generación de imágenes directa via Replicate API
 * Modelos: nano-banana, nano-banana-2, seedream-4.5, seedream-5
 *
 * Sin auth, sin créditos — acceso directo desde el códice.
 */

export const config = {
  runtime: 'edge',
};

const REPLICATE_API_URL = 'https://api.replicate.com/v1';

const MODELS = {
  'nano-banana': {
    id: 'google/nano-banana',
    type: 'nano',
  },
  'nano-banana-2': {
    id: 'google/nano-banana-2',
    type: 'nano2',
  },
  'seedream-4.5': {
    id: 'bytedance/seedream-4.5',
    type: 'seedream',
  },
  'seedream-5': {
    id: 'bytedance/seedream-5-lite',
    type: 'seedream',
  },
};

const DEFAULT_MODEL = 'nano-banana-2';

function buildInput(prompt, modelKey, params) {
  const { resolution = '2K', size = '2K', aspect_ratio = '1:1', output_format = 'png' } = params;
  const type = MODELS[modelKey].type;

  if (type === 'nano') {
    return { prompt, resolution, aspect_ratio, output_format };
  }

  if (type === 'nano2') {
    // 4K rechazado por Vertex AI — forzar a 2K
    const safeRes = resolution === '4K' ? '2K' : resolution;
    return { prompt, resolution: safeRes, aspect_ratio, output_format };
  }

  if (type === 'seedream') {
    return { prompt, size, aspect_ratio };
  }

  return { prompt };
}

async function pollPrediction(predictionId, headers, maxWaitMs = 120000) {
  const start = Date.now();
  const interval = 3000;

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, interval));

    const res = await fetch(`${REPLICATE_API_URL}/predictions/${predictionId}`, { headers });
    const data = await res.json();

    if (data.status === 'succeeded') return data;
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Predicción ${data.status}: ${data.error || 'sin detalle'}`);
    }
  }

  throw new Error('Timeout: la imagen tardó demasiado');
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

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { prompt, model = DEFAULT_MODEL, ...params } = body;

  if (!prompt || !prompt.trim()) {
    return new Response(JSON.stringify({ error: 'prompt requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const modelConfig = MODELS[model];
  if (!modelConfig) {
    return new Response(JSON.stringify({
      error: `Modelo '${model}' no soportado. Disponibles: ${Object.keys(MODELS).join(', ')}`,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'wait',
  };

  try {
    const replicateRes = await fetch(`${REPLICATE_API_URL}/models/${modelConfig.id}/predictions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ input: buildInput(prompt, model, params) }),
    });

    if (!replicateRes.ok) {
      const err = await replicateRes.text();
      return new Response(JSON.stringify({ error: `Replicate error: ${err}` }), {
        status: replicateRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    let result = await replicateRes.json();

    // Si no está listo, hacer polling
    if (result.status !== 'succeeded') {
      result = await pollPrediction(result.id, headers);
    }

    const output = Array.isArray(result.output) ? result.output[0] : result.output;

    return new Response(JSON.stringify({
      output,
      id: result.id,
      model_used: model,
      predict_time: result.metrics?.predict_time ?? null,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
