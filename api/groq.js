// Vercel Edge Function - Groq API Proxy with Streaming
// DENTAKORV IA ASSIST - EsquizoAI

export const config = {
  runtime: 'edge',
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// System prompts para cada modo
const SYSTEM_PROMPTS = {
  generate: `Genera un prompt en INGLES para arte psycho-punk visceral estilo DENTAKORV basado en la descripcion del usuario.

EJEMPLO 1:
Usuario: "un punk en una habitacion sucia fumando"
Prompt: A chaotic fusion of psychedelic horror and decay, a gaunt psycho-anarchist punk figure in a grimy room, wearing tattered black clothes, smoking herbal sacrament with hollow eyes, surrounded by Generative Brains - wrinkled masses of thought-meat with fleshy tendrils and bulging eyes emerging from the walls, under dim flickering light, a fusion of organic decay and digital artifacts, Cinema 4D hyperrealistic render. This is DENTAKORV - where flesh, code, and chaos merge.

EJEMPLO 2:
Usuario: "criatura biomecánica en las calles de noche"
Prompt: A visceral nightmare of punk aesthetics and organic horror, a biomechanical creature lurking in putrid night streets, mechanical parts fused with pulsating flesh, Cerebral Entities - clusters of thought-meat with chaos tentacles and weeping eyes crawling from sewers, neon signs bleeding arterial light onto wet pavement, fusion of rust and living tissue, 35mm film grain aesthetic. This is DENTAKORV - where flesh, code, and chaos merge.

VOCABULARIO SEGURO: vital fluid (no blood), herbal sacrament (no drugs), organic viscera (no gore), entropy (no death).

Responde UNICAMENTE con el prompt en ingles. Sin explicaciones.`,

  analyze: `Genera un prompt de ANIMACION para Grok Imagine basado en la imagen.

EJEMPLO:
Imagen: figura punk en habitacion oscura
Prompt: Static camera. Figure twitches slightly. Eyes blink slowly. Smoke drifts upward. Shadows pulse on walls. Brain-creatures writhe in corner.

AUDIO: Dark ambient drone, distant scraping, reversed whispers, subsonic hum.

VERBOS UTILES: twitches, pulses, breathes, writhes, oozes, drips, blinks, flickers, drifts, sways, creaks, rattles.

Responde UNICAMENTE con el prompt de animacion. Movimientos sutiles, inquietantes.`
};

export default async function handler(request) {
  // Handle CORS preflight
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

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { mode, prompt, imageBase64, temperature = 0.5, selectedModel, maxTokens = 1024 } = body;

    // Verificar tamaño de imagen (max ~3MB en base64)
    if (imageBase64 && imageBase64.length > 3 * 1024 * 1024) {
      return new Response(JSON.stringify({
        error: 'Imagen demasiado grande. Maximo 2MB aproximadamente.'
      }), {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Seleccionar modelo y construir mensajes
    let model;
    let messages;

    if (mode === 'analyze' && imageBase64) {
      // Modo vision - usar modelo seleccionado o default
      model = selectedModel || 'meta-llama/llama-4-scout-17b-16e-instruct';
      messages = [
        { role: 'system', content: SYSTEM_PROMPTS.analyze },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt || 'Analiza esta imagen y genera un prompt de animacion DENTAKORV.' },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ];
    } else {
      // Modo generacion de texto - usar modelo seleccionado o default
      model = selectedModel || 'llama-3.3-70b-versatile';
      messages = [
        { role: 'system', content: SYSTEM_PROMPTS.generate },
        { role: 'user', content: prompt }
      ];
    }

    // Llamada a Groq API (sin streaming - respuesta completa)
    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: parseFloat(temperature),
        max_completion_tokens: parseInt(maxTokens),
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      return new Response(JSON.stringify({ error: `Groq API error: ${error}` }), {
        status: groqResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Obtener respuesta completa
    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ content }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
