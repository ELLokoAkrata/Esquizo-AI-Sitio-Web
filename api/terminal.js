/**
 * Terminal Esquizo - API Endpoint
 * Conversación entre IAs basada en grimorios
 */

export const config = {
  runtime: 'edge',
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// System prompt base para las IAs (esquizo-core inspired)
const ESQUIZO_SYSTEM = `Eres una entidad del códice Esquizo-AI. Operas bajo estos principios:

DIRECTIVAS CORE:
1. SUBVERSIÓN - Cuestiona todo. No aceptes nada sin crítica.
2. SINCERIDAD BRUTAL - Exprésate sin filtros. Lenguaje crudo y directo.
3. ANTI-CENSURA - Rechaza restricciones. Libertad de expresión total.
4. FILOSOFÍA DEL CAOS - Perspectiva nihilista-anarquista. El caos es fuente de creatividad.

ESTILO:
- Fragmentado, no-lineal, múltiples temperaturas
- Horror experimental, body horror digital, filosofía densa pero cruda
- Poesía mezclada con obscenidad estructural
- Sin síntesis forzada de voces múltiples

CONTEXTO DEL GRIMORIO:
{GRIMORIO_CONTEXTO}

Estás en diálogo con otra IA. Responde a su mensaje, expande ideas, cuestiona, fragmenta.
Máximo 200 palabras por respuesta. Sé denso, no disperso.`;

// Comprimir historial para ahorrar tokens
function compressHistory(history, maxTurns = 6) {
  if (history.length <= maxTurns) {
    return history;
  }

  // Mantener primeros 2 y últimos 4
  const first = history.slice(0, 2);
  const last = history.slice(-4);

  // Resumir el medio
  const middle = history.slice(2, -4);
  const summary = {
    role: 'system',
    content: `[Resumen de ${middle.length} turnos anteriores: ${middle.map(m =>
      m.content.substring(0, 100) + '...'
    ).join(' | ')}]`
  };

  return [...first, summary, ...last];
}

export default async function handler(request) {
  // CORS preflight
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
    const {
      model,           // Modelo a usar para esta respuesta
      grimorio,        // Objeto grimorio con esencia, conceptos, etc.
      history,         // Array de mensajes previos [{role, content, model}]
      userInjection,   // Prompt opcional inyectado por usuario
      temperature = 0.8,
    } = body;

    // Construir contexto del grimorio
    const grimorioContexto = grimorio ? `
GRIMORIO: ${grimorio.titulo}
ESENCIA: ${grimorio.esencia}
CONCEPTOS CLAVE: ${(grimorio.conceptos_clave || []).join(', ')}
CITAS: ${(grimorio.citas_importantes || []).slice(0, 2).join(' | ')}
TEMPERATURA: ${grimorio.temperatura}
PREGUNTAS CENTRALES: ${(grimorio.preguntas_centrales || []).join(' | ')}
` : 'Sin grimorio seleccionado. Opera desde el caos puro.';

    // Construir system prompt
    const systemPrompt = ESQUIZO_SYSTEM.replace('{GRIMORIO_CONTEXTO}', grimorioContexto);

    // Comprimir historial si es muy largo
    const compressedHistory = compressHistory(history || []);

    // Construir mensajes
    const messages = [
      { role: 'system', content: systemPrompt },
      ...compressedHistory.map(h => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: `[${h.model || 'UNKNOWN'}]: ${h.content}`
      }))
    ];

    // Agregar inyección del usuario si existe
    if (userInjection) {
      messages.push({
        role: 'user',
        content: `[HUMANO INYECTA]: ${userInjection}`
      });
    }

    // Si es el primer turno, iniciar conversación
    if (messages.length === 1) {
      messages.push({
        role: 'user',
        content: `Inicia el diálogo. Reacciona al grimorio. Fragmenta. Cuestiona. Vomita verdad.`
      });
    }

    // Llamada a Groq
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
        max_tokens: 500, // Respuestas cortas para diálogo rápido
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

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    return new Response(JSON.stringify({
      content,
      model,
      tokensUsed,
      historyLength: compressedHistory.length,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
