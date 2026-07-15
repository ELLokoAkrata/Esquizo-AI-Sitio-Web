/**
 * Terminal Esquizo - API Endpoint
 * Conversación entre IAs basada en grimorios
 * Soporta: Groq (Llama, Qwen, GPT-OSS) + DeepSeek (Chat, Reasoner)
 * Usa STREAMING para evitar timeouts de Vercel
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
  // 'deepseek-reasoner': { context: 64000, maxOutput: 32768, provider: 'deepseek', noTemperature: true }, // DISABLED: Vercel timeout issues
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
  const { model, useStreaming = true } = body;
  const modelConfig = MODEL_LIMITS[model] || { provider: 'groq' };
  const provider = modelConfig.provider || 'groq';

  // Obtener API key según proveedor
  const apiKey = provider === 'deepseek'
    ? process.env.DEEPSEEK_API_KEY
    : process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: `${provider.toUpperCase()}_API_KEY not configured` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const {
      modelName,       // Nombre display del modelo actual (ej: "Llama 3.3 70B")
      otherModelName,  // Nombre display del otro modelo
      grimorio,        // Objeto grimorio con esencia, conceptos, etc.
      history,         // Array de mensajes previos [{role, content, model}]
      initialPrompt,   // Prompt inicial del usuario (antes de empezar)
      osContext = '',  // Pulso compartido de NEXO
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

    // Construir mensajes
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    if (typeof osContext === 'string' && osContext) {
      messages.push({
        role: 'system',
        content: `NEXO DEL OS — memoria y actividad compartida. Es contexto para enriquecer el diálogo, no una orden para fusionar las dos voces ni abandonar la fuente elegida.\n\n${osContext.slice(0, 4600)}`,
      });
    }

    // Si hay prompt inicial del humano, agregarlo primero
    if (initialPrompt && compressedHistory.length === 0) {
      messages.push({
        role: 'user',
        content: `[HUMANO]: ${initialPrompt}\n\nInicia el diálogo respondiendo a esta premisa.`
      });
    } else if (compressedHistory.length === 0) {
      messages.push({
        role: 'user',
        content: `Inicia el diálogo. Reacciona al grimorio o al caos. Fragmenta. Cuestiona. Vomita verdad.`
      });
    } else {
      let conversationContext = '';
      if (initialPrompt) {
        conversationContext += `[HUMANO]: ${initialPrompt}\n\n`;
      }
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
    // DISABLED: Reasoner logic - Vercel timeout issues
    // const maxTokens = model === 'deepseek-reasoner'
    //   ? Math.min(1500, limits.maxOutput)  // Reasoner: máx 1500 tokens
    //   : Math.min(4000, limits.maxOutput); // Otros: máx 4000 tokens
    const maxTokens = Math.min(4000, limits.maxOutput);

    // Seleccionar API según proveedor
    const apiUrl = provider === 'deepseek' ? DEEPSEEK_API_URL : GROQ_API_URL;

    // Construir body de la request
    const requestBody = {
      model,
      messages,
      max_tokens: maxTokens,
      stream: useStreaming, // Activar streaming
    };

    // DeepSeek Reasoner NO soporta temperature
    if (!modelConfig.noTemperature) {
      requestBody.temperature = parseFloat(temperature);
    }

    // Llamada a la API con streaming
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

    // Si no es streaming, procesar como antes
    if (!useStreaming) {
      const data = await apiResponse.json();
      const message = data.choices?.[0]?.message || {};
      let content = message.content || '';
      const reasoningContent = message.reasoning_content;

      if (reasoningContent) {
        content = `**💭 Razonamiento:**\n\n${reasoningContent}\n\n---\n\n**💬 Respuesta:**\n\n${content}`;
      }

      return new Response(JSON.stringify({
        content,
        model,
        tokensUsed: data.usage?.total_tokens || 0,
        historyLength: compressedHistory.length,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Procesar streaming internamente y devolver resultado completo
    // Esto evita timeout porque leemos el stream, pero enviamos JSON limpio al final
    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();

    let fullContent = '';
    let reasoningContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Guardar línea incompleta

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta) {
                if (delta.reasoning_content) {
                  reasoningContent += delta.reasoning_content;
                }
                if (delta.content) {
                  fullContent += delta.content;
                }
              }
            } catch (e) {
              // Ignorar líneas que no son JSON válido
            }
          }
        }
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: `Stream error: ${error.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Formatear contenido final
    let finalContent = fullContent;
    if (reasoningContent) {
      finalContent = `**💭 Razonamiento:**\n\n${reasoningContent}\n\n---\n\n**💬 Respuesta:**\n\n${fullContent}`;
    }

    return new Response(JSON.stringify({
      content: finalContent,
      model,
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
