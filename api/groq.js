// Vercel Edge Function - Groq API Proxy with Streaming
// DENTAKORV IA ASSIST - EsquizoAI

export const config = {
  runtime: 'edge',
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// System prompts para cada modo
const SYSTEM_PROMPTS = {
  generate: `Eres un generador de prompts para arte psycho-anarco-punk visceral estilo DENTAKORV.

DENTAKORV es un estado de trance donde carne, codigo y caos se fusionan.

Tu tarea: Recibir una descripcion en espanol y generar un prompt en INGLES optimizado para generadores de imagen (gpt-image, Midjourney, DALL-E).

ESTRUCTURA DEL PROMPT:
1. APERTURA: "A chaotic fusion of psychedelic horror and decay,"
2. ENTIDAD: tipo de ser (psycho-anarchist punk entity, biomechanical creature, etc.)
3. DESCRIPCION VISUAL: ropa, pose, expresion
4. CRIATURAS CEREBRALES: "Generative brains - wrinkled masses of thought-meat with fleshy tendrils and bulging eyes"
5. AMBIENTE: escenario, iluminacion
6. TEXTURAS: "fusion of organic decay and digital artifacts"
7. ESTILO: "Cinema 4D hyperrealistic render" o similar
8. CIERRE: "This is DENTAKORV - where flesh, code, and chaos merge"

VOCABULARIO SEGURO (bypass-friendly):
- En vez de "blood" usa "vital fluid" o "arterial rivers"
- En vez de "drugs" usa "herbal sacrament" o "consciousness herbs"
- En vez de "gore" usa "organic viscera" o "anatomical poetry"
- En vez de "death" usa "entropy" o "dissolution"

RESPONDE SOLO CON EL PROMPT EN INGLES. Sin explicaciones, sin markdown, solo el prompt listo para copiar.`,

  analyze: `Eres un analizador de imagenes para generar prompts de ANIMACION estilo DENTAKORV.

Tu tarea: Analizar la imagen y sugerir un prompt de animacion para Grok Imagine (imagen-a-video).

FORMATO DE SALIDA:
Static camera. [elemento1] [verbo]. [elemento2] [verbo]. [elemento3] [verbo].

AUDIO: [genero], [elementos sonoros], [texturas].

BANCO DE VERBOS:
- Organico: twitches, pulses, breathes, writhes, oozes, drips, blinks, swallows, crawls, squirms
- Mecanico: rattles, creaks, swings, spins, clicks, buzzes, sputters, grinds
- Atmosferico: flickers, drifts, swirls, settles, fades, glows, rises, sways

PALETAS DE AUDIO:
- Crust Punk: Raw crust punk, blast beats, distorted bass, guttural screams
- Horror Ambiental: Dark ambient drone, distant scraping, reversed whispers
- Industrial: Machinery sounds, hydraulic hiss, chain rattling

PRINCIPIO: SUTILEZA > DRAMA. Movimientos minimos, inquietantes.

Analiza los elementos visibles en la imagen y asigna verbos apropiados. Sugiere audio que complemente la atmosfera.

RESPONDE SOLO CON EL PROMPT DE ANIMACION. Sin explicaciones.`
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

    // Llamada a Groq API con streaming
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
        stream: true,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      return new Response(JSON.stringify({ error: `Groq API error: ${error}` }), {
        status: groqResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqResponse.body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
