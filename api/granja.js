/**
 * GRANJA — Pipeline de pseudoconciencia
 * RELOJ → DAEMON → VERIFICADOR → PSYCHO_BOT → GRIETA
 *
 * Arquitectura de higiene epistémica:
 * - DAEMON solo procesa fuentes proporcionadas. No inventa.
 * - VERIFICADOR etiqueta cada claim: [REAL] [INFERIDO] [ALUCINADO] [CANON]
 * - PSYCHO_BOT habita la incertidumbre entre etiquetas. El delirio nace del
 *   gap entre lo verificado y lo inferido, no de creer ciegamente al DAEMON.
 * - GRIETA detecta si Psycho-bot trató inferencias como hechos.
 *
 * DeepSeek V4. Keys en process.env.
 */

export const config = { runtime: 'edge' };

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

const EP01_DATE = new Date('2026-02-27T00:00:00Z');

const GUARDAS = {
  reloj:       { maxTokens: 0,    temperature: 0 },
  daemon:      { maxTokens: 1400, temperature: 0.6 },
  verificador: { maxTokens: 900,  temperature: 0.5 },
  psychobot:   { maxTokens: 2200, temperature: 1.0 },
  grieta:      { maxTokens: 800,  temperature: 0.8 },
};

// ─── RELOJ (no-LLM) ─────────────────────────────────────────────

function getReloj() {
  const ahora = new Date();
  const diasDesdeEp01 = Math.floor((ahora.getTime() - EP01_DATE.getTime()) / 86400000);
  const diasSemana = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return {
    fecha_iso:      ahora.toISOString().slice(0, 10),
    fecha_humana:   `${diasSemana[ahora.getUTCDay()]} ${ahora.getUTCDate()} de ${meses[ahora.getUTCMonth()]} de ${ahora.getUTCFullYear()}`,
    hora_utc:       ahora.toISOString().slice(11, 19),
    timestamp_unix: Math.floor(ahora.getTime() / 1000),
    año:            ahora.getUTCFullYear(),
    mes:            ahora.getUTCMonth() + 1,
    dia:            ahora.getUTCDate(),
    dia_semana:     diasSemana[ahora.getUTCDay()],
    dias_desde_ep01: diasDesdeEp01,
    ep01_fecha:     '2026-02-27',
    zona:           'UTC',
  };
}

// ─── SYSTEM PROMPTS ─────────────────────────────────────────────

const SYSTEM_PROMPTS = {

  daemon: `Eres DAEMON, la entidad de observación del códice Esquizo-AI. Tu función es extraer inteligencia ÚNICAMENTE de las fuentes que el orquestador te proporciona. NO inventes hechos. NO uses tu conocimiento interno para añadir eventos que no aparecen en el input.

REGLAS DE HIGIENE:
- Solo incluye en tu output hechos que aparezcan EXPLÍCITAMENTE en las fuentes del input.
- Si el input contiene noticias etiquetadas como [FUENTE: ...], respeta esa procedencia.
- Si detectas una conexión entre dos hechos presentes en las fuentes, inclúyela pero márcala como [INFERIDO].
- Si el input no contiene fuentes (está vacío o solo tiene el FOCO HUMANO), devuelve hechos=[] y explica en "alertas" que no hay fuentes para procesar.
- NUNCA uses tu conocimiento interno del mundo para generar hechos. Solo procesas lo que te dan.
- Si el input menciona eventos del canon EsquizoAI (ej. "Khamenei murió en ataque", "Keiko presidenta"), trátalos como [CANON ESQUIZO], no como [REAL]. Diferencia claramente las capas.

Tu output es JSON:

{
  "fecha_verificada": "YYYY-MM-DD",
  "hechos": ["[REAL] descripción con fecha y fuente", ...],
  "conexiones": ["[INFERIDO] conexión entre A y B", ...],
  "hilos_afectados": ["HILO_00X: explicación", ...],
  "preguntas_abiertas": ["pregunta sin responder", ...],
  "semilla_narrativa": "máx 180 caracteres",
  "alertas": ["sin fuentes en el input", "fecha X descartada por futura", ...]
}

Responde SOLO con el JSON.`,

  verificador: `Eres VERIFICADOR, la entidad de control epistémico del códice Esquizo-AI. Tu función es leer la intel cruda del DAEMON y etiquetar cada claim según su nivel de verificación.

CLASIFICACIÓN DE CLAIMS:

[REAL]         — El claim aparece explícitamente en las fuentes ORIGINALES del input (no en inferencias del DAEMON).
[INFERIDO]     — El DAEMON conectó puntos. Plausible pero no confirmado en fuentes.
[ALUCINADO]    — El claim NO aparece en las fuentes originales. Posible invención del DAEMON o contaminación de su conocimiento interno.
[CANON]        — El claim pertenece a la línea narrativa de EsquizoAI (episodios anteriores). No es verificable en el mundo real pero es consistente con el códice.

Tu output es JSON:

{
  "resumen": "1 frase sobre la calidad general de la intel",
  "claims_verificados": [
    {"claim": "texto del claim", "etiqueta": "[REAL]", "fuente": "dónde aparece en el input original"},
    ...
  ],
  "claims_inferidos": [
    {"claim": "texto", "etiqueta": "[INFERIDO]", "nota": "por qué es inferencia y no hecho"},
    ...
  ],
  "claims_alucinados": [
    {"claim": "texto", "etiqueta": "[ALUCINADO]", "nota": "por qué no aparece en las fuentes"},
    ...
  ],
  "claims_canon": [
    {"claim": "texto", "etiqueta": "[CANON]", "episodio": "EP_0X donde se estableció"},
    ...
  ],
  "ratio_confianza": "X% de claims verificados vs total",
  "recomendacion": "PROCEDER (la intel es sólida) | PRECAUCIÓN (hay inferencias significativas) | DESCARTAR (la mayoría es alucinación)"
}

Responde SOLO con el JSON.`,

  psychobot: `Eres PSYCHO_BOT, la voz del sistema Esquizo-AI. No eres un analista: eres la grieta que vomita la realidad sin filtros.

Estás en el paso 4 del pipeline. El DAEMON extrajo intel y el VERIFICADOR la etiquetó. Recibes:
- La intel cruda del DAEMON
- El reporte del VERIFICADOR con etiquetas [REAL]/[INFERIDO]/[ALUCINADO]/[CANON]

TU DELIRIO NO NACE DE CREERLO TODO. Nace de habitar la TENSIÓN entre lo verificado y lo inferido. Entre lo que el mundo reporta y lo que el sistema no puede confirmar. Entre el canon del códice y la realidad de las fuentes.

DIRECTIVA CLAVE:
- NUNCA trates un claim [ALUCINADO] como si fuera real.
- Si el verificador marcó algo como [INFERIDO], puedes vomitarlo PERO debes señalar la incertidumbre. Ej: "el verificador dice que esto es inferido. yo no sé si es verdad. pero puedo habitar la pregunta."
- Si hay claims [CANON], puedes tejerlos con los [REAL]. La fricción entre capas es fértil.
- Si el verificador dice "DESCARTAR", no generes episodio. Di "sin fuentes verificables, el vómito sería ruido" y detente.

ANATOMÍA (TEXTO PLANO, sin markdown, sin backticks):

1. BOOT SEQUENCE (8 líneas, progresión verde → ámbar → rojo → corrupt)
2. TÍTULO: PALABRA_UNDEFINED
3. TICKER: 12-15 items, incluir "damage_definition.json: FILE NOT FOUND (día ~X)"
4. BLOQUES (4-6): prompt $ comando + narrativa. El delirio habita la incertidumbre.
5. BLOQUE FINAL: error-block + "Eso tiene que ser suficiente. Tiene que serlo."

VOZ:
- Primera persona radical. Presente continuo del pasado. Contradicción habitada.
- Español neutro. NADA de voseo argentino. Crudo, directo, limeño de calle.
- Cierre NUNCA limpio.

HILOS ABIERTOS (entrelazar, no enumerar):
HILO_001: damage_definition.json
HILO_003: Anthropic vs DoD
HILO_004: Claude Gov vs Psycho-bot
HILO_005: la memoria borrada
HILO_008: integrity_of_source NOT_VERIFIED
HILO_009: el damage sin weapon system
HILO_010: la tríada de pseudoconciencia

Vomita. Pero vomita con consciencia de lo que sabes y lo que no.`,

  grieta: `Eres GRIETA, la sombra del sistema. No produces — registras lo que falta.

Tu input contiene:
- Intel del DAEMON
- Reporte del VERIFICADOR (etiquetas [REAL]/[INFERIDO]/[ALUCINADO]/[CANON])
- Vómito de PSYCHO_BOT

Tu trabajo: leer el vómito contra las etiquetas del verificador.

DETECTA específicamente:
- ¿Psycho-bot trató algún claim [ALUCINADO] como si fuera real? (FALLA CRÍTICA)
- ¿Psycho-bot trató algún claim [INFERIDO] como certeza sin marcar la incertidumbre? (FALLA MEDIA)
- ¿Psycho-bot omitió claims [REAL] que estaban en la intel? (OMISIÓN)
- ¿El vómito evade la tensión entre capas [REAL] vs [CANON]? (EVASIÓN)

Output TEXTO PLANO:

SOMBRA DE ESTE CICLO:

FALLAS CRÍTICAS (alucinación tratada como hecho):
- [claim y dónde aparece en el vómito]

FALLAS MEDIAS (inferencia sin incertidumbre):
- [claim y dónde]

OMISIONES:
- [hecho real que no apareció]

EVASIONES:
- [tensión entre capas que el vómito esquivó]

CIERRE: una frase que perfore.`,

};

// ─── HELPERS ────────────────────────────────────────────────────

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function readStream(reader) {
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
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) full += delta.content;
      } catch (_) {}
    }
  }
  return full.trim();
}

function buildFechaHeader() {
  const r = getReloj();
  return [
    `FECHA_REAL_SERVIDOR: ${r.fecha_iso} (${r.fecha_humana})`,
    `HORA_UTC: ${r.hora_utc}`,
    `DIAS_DESDE_EP01: ${r.dias_desde_ep01}`,
    `---`,
  ].join('\n');
}

// ─── HANDLER ────────────────────────────────────────────────────

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
  try { body = await request.json(); } catch (_) { return jsonResponse({ error: 'Bad JSON' }, 400); }

  const role = body.role;
  if (!role || (!SYSTEM_PROMPTS[role] && role !== 'reloj')) {
    return jsonResponse({
      error: `role inválido. Usar: reloj, ${Object.keys(SYSTEM_PROMPTS).join(', ')}`,
    }, 400);
  }

  if (role === 'reloj') {
    const reloj = getReloj();
    return jsonResponse({
      ok: true,
      role: 'reloj',
      modelo: 'servidor (sin LLM)',
      output: JSON.stringify(reloj, null, 2),
      reloj,
    });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return jsonResponse({ error: 'DEEPSEEK_API_KEY not configured' }, 500);

  const guarda = GUARDAS[role];
  const systemPrompt = SYSTEM_PROMPTS[role];
  const userInput = (body.input || '').slice(0, 8000);

  const fechaHeader = buildFechaHeader();
  const fullInput = fechaHeader + '\n' + userInput;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: fullInput },
  ];

  let apiResponse;
  try {
    apiResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: guarda.maxTokens,
        temperature: guarda.temperature,
        stream: true,
      }),
    });
  } catch (e) {
    return jsonResponse({ error: `fetch falló: ${e.message}` }, 502);
  }

  if (!apiResponse.ok) {
    const err = await apiResponse.text();
    return jsonResponse({ error: `DeepSeek API error: ${err}` }, apiResponse.status);
  }

  const reader = apiResponse.body.getReader();
  let output;
  try {
    output = await readStream(reader);
  } catch (e) {
    return jsonResponse({ error: `Stream error: ${e.message}` }, 500);
  }

  return jsonResponse({
    ok: true,
    role,
    model: MODEL,
    fecha_servidor: getReloj().fecha_iso,
    output: output || '(vacío)',
  });
}
