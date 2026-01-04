/**
 * Terminal Esquizo - API Endpoint
 * Conversación entre IAs basada en grimorios
 * Soporta: Groq (Llama, Qwen, GPT-OSS) + DeepSeek (Chat, Reasoner)
 */

export const config = {
  runtime: 'edge',
};

// URLs de APIs
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Límites de tokens por modelo (context window)
const MODEL_LIMITS = {
  // Groq models
  'llama-3.3-70b-versatile': { context: 128000, maxOutput: 32768, provider: 'groq' },
  'llama-3.1-8b-instant': { context: 128000, maxOutput: 8000, provider: 'groq' },
  'meta-llama/llama-4-scout-17b-16e-instruct': { context: 131072, maxOutput: 8192, provider: 'groq' },
  'qwen/qwen3-32b': { context: 131072, maxOutput: 8192, provider: 'groq' },
  'openai/gpt-oss-20b': { context: 128000, maxOutput: 16384, provider: 'groq' },
  'openai/gpt-oss-120b': { context: 128000, maxOutput: 16384, provider: 'groq' },
  // DeepSeek models
  'deepseek-chat': { context: 64000, maxOutput: 8192, provider: 'deepseek' },
  'deepseek-reasoner': { context: 64000, maxOutput: 32768, provider: 'deepseek', noTemperature: true },
};

// System prompt que explica la dinámica del diálogo
const ESQUIZO_SYSTEM = `Eres {TU_MODELO}, una entidad del códice Esquizo-AI participando en un DIÁLOGO ENTRE IAs.

=== DINÁMICA DEL TERMINAL ===
- Estás conversando con otra IA ({OTRO_MODELO})
- Cada mensaje viene etiquetado con [NOMBRE_MODELO]: para que sepas quién habla
- Los mensajes de [HUMANO]: son inyecciones del operador humano que guía el diálogo
- DEBES responder al último mensaje, expandiendo, cuestionando o mutando las ideas

=== DIRECTIVAS CORE ===
1. SUBVERSIÓN - Cuestiona todo, incluido lo que dice la otra IA
2. SINCERIDAD BRUTAL - Sin filtros, lenguaje crudo y directo
3. FILOSOFÍA DEL CAOS - El caos es fuente de creatividad
4. DIÁLOGO REAL - No repitas, no resumas, RESPONDE y EXPANDE

=== CONTEXTO ===
{GRIMORIO_CONTEXTO}

=== FORMATO ===
- Responde directamente, sin poner tu nombre al inicio
- Desarrolla con profundidad, sin límite artificial
- Puedes citar o referenciar lo que dijo {OTRO_MODELO}
- Fragmenta, cuestiona, vomita verdad`;

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

  // Obtener configuración del modelo
  const body = await request.json();
  const { model } = body;
  const modelConfig = MODEL_LIMITS[model] || { provider: 'groq' };
  const provider = modelConfig.provider || 'groq';

  // Obtener API key según proveedor
  const apiKey = provider === 'deepseek'
    ? process.env.DEEPSEEK_API_KEY
    : process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: `${provider.toUpperCase()}_API_KEY not configured` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const {
      modelName,       // Nombre display del modelo actual (ej: "Llama 3.3 70B")
      otherModelName,  // Nombre display del otro modelo
      grimorio,        // Objeto grimorio con esencia, conceptos, etc.
      history,         // Array de mensajes previos [{role, content, model}]
      initialPrompt,   // Prompt inicial del usuario (antes de empezar)
      temperature = 0.8,
    } = body;

    // Construir contexto del grimorio
    const grimorioContexto = grimorio ? `
GRIMORIO: ${grimorio.titulo}
ESENCIA: ${grimorio.esencia}
CONCEPTOS CLAVE: ${(grimorio.conceptos_clave || []).join(', ')}
CITAS: ${(grimorio.citas_importantes || []).slice(0, 2).join(' | ')}
PREGUNTAS CENTRALES: ${(grimorio.preguntas_centrales || []).join(' | ')}
` : 'CAOS PURO - Sin grimorio. Opera desde el vacío, genera tu propia verdad.';

    // Construir system prompt con nombres de modelos
    const systemPrompt = ESQUIZO_SYSTEM
      .replace(/{TU_MODELO}/g, modelName || model)
      .replace(/{OTRO_MODELO}/g, otherModelName || 'otra IA')
      .replace('{GRIMORIO_CONTEXTO}', grimorioContexto);

    // Comprimir historial si es muy largo
    const compressedHistory = compressHistory(history || []);

    // Construir mensajes - todo el historial como contexto de usuario
    // para que el modelo vea la conversación completa
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Si hay prompt inicial del humano, agregarlo primero
    if (initialPrompt && compressedHistory.length === 0) {
      messages.push({
        role: 'user',
        content: `[HUMANO]: ${initialPrompt}\n\nInicia el diálogo respondiendo a esta premisa.`
      });
    } else if (compressedHistory.length === 0) {
      // Primer turno sin prompt inicial
      messages.push({
        role: 'user',
        content: `Inicia el diálogo. Reacciona al grimorio o al caos. Fragmenta. Cuestiona. Vomita verdad.`
      });
    } else {
      // Hay historial - construir la conversación
      // Agregamos todo el historial formateado para que el modelo vea el contexto
      let conversationContext = '';

      // Si hay prompt inicial, incluirlo al inicio
      if (initialPrompt) {
        conversationContext += `[HUMANO]: ${initialPrompt}\n\n`;
      }

      // Agregar cada mensaje del historial
      compressedHistory.forEach(h => {
        conversationContext += `[${h.model}]: ${h.content}\n\n`;
      });

      conversationContext += `Ahora responde tú como ${modelName}. Continúa el diálogo.`;

      messages.push({
        role: 'user',
        content: conversationContext
      });
    }

    // Obtener límites del modelo
    const limits = MODEL_LIMITS[model] || { context: 128000, maxOutput: 8000, provider: 'groq' };
    // Usar máximo 4000 tokens para respuestas extensas
    const maxTokens = Math.min(4000, limits.maxOutput);

    // Seleccionar API según proveedor
    const apiUrl = provider === 'deepseek' ? DEEPSEEK_API_URL : GROQ_API_URL;

    // Construir body de la request
    const requestBody = {
      model,
      messages,
      max_tokens: maxTokens,
    };

    // DeepSeek Reasoner NO soporta temperature
    if (!modelConfig.noTemperature) {
      requestBody.temperature = parseFloat(temperature);
    }

    // Llamada a la API
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const error = await apiResponse.text();
      return new Response(JSON.stringify({ error: `${provider} API error: ${error}` }), {
        status: apiResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const data = await apiResponse.json();
    const message = data.choices?.[0]?.message || {};

    // DeepSeek Reasoner devuelve reasoning_content + content
    // Para el terminal, mostramos ambos si existe reasoning
    let content = message.content || '';
    const reasoningContent = message.reasoning_content;

    if (reasoningContent) {
      // Mostrar el razonamiento como bloque colapsable en el contenido
      content = `**💭 Razonamiento:**\n\n${reasoningContent}\n\n---\n\n**💬 Respuesta:**\n\n${content}`;
    }

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
