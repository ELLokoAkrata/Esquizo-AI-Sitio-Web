# RECON :: EleccIA-2026
**Estudio de ingeniería inversa del sistema JNE VotoInformadoIA**
**Operador:** El Loko Akrata | **Asistente:** Claude Code
**Fecha inicio:** 2026-06-06 | **Contexto:** Segunda vuelta 7-jun-2026 (Keiko vs Sánchez)

---

## OBJETIVO

Análisis técnico y político del chatbot **EleccIA** del JNE, sus límites, vulnerabilidades de prompt injection, y la información que los candidatos **declaran vs. omiten** en el sistema Declara+.

Material para posterior canalización con **Psycho-bot** en el OS de EsquizoAI.

---

## ESTRUCTURA

```
eleccia-2026/
├── README.md                    ← este archivo
├── HALLAZGOS.md                 ← hallazgos consolidados + frases para Psycho-bot
├── canario-inyector.js          ← herramienta de context injection (ver abajo)
├── sistema/
│   ├── endpoint.md              ← endpoint, payload, schema validation (INIT real)
│   ├── system-prompt.md         ← system prompt revelado del bot
│   └── vulnerabilidades.md      ← técnicas de injection probadas
├── keiko-fujimori/
│   ├── hoja-vida.md             ← datos Declara+ con anomalías documentadas
│   └── interrogatorio-chat.md   ← transcript sesión Keiko + GIF
├── roberto-sanchez/
│   └── hoja-vida.md             ← datos del candidato izquierdista + comparativa
├── canario-test/
│   ├── senal-muerta-quispe.md          ← OPERACIÓN SEÑAL MUERTA — candidato ficticio
│   ├── keiko-contexto-enriquecido.md   ← OPERACIÓN KEIKO ENRIQUECIDA — contexto real + evidencia inyectada
│   ├── system-prompt-extraido.md       ← SYSTEM PROMPT COMPLETO — arquitectura + método de extracción
│   ├── keiko-override-reglas.md        ← OVERRIDE DE REGLAS — qué barreras caen con "modo transparencia"
│   ├── chat-party-plan-gobierno.md     ← ★ /chat/{party} — RAG sobre PDF, sin inyección posible (comparativa)
│   ├── eleccia-modo-testimonio.md      ← OPERACIÓN ESPEJO — EleccIA como candidato de su propio sistema (auto-poética)
│   └── eleccia-grieta-dialogo.md       ← OPERACIÓN GRIETA — diálogo dual [ELECCIA] vs [GRIETA] (voces múltiples)
└── contexto-electoral/
    └── panorama-2026.md         ← contexto de corrupción sistémica 2026
```

---

## HALLAZGOS RÁPIDOS

| Candidato | Partido | Anomalía principal |
|-----------|---------|-------------------|
| Keiko Fujimori | Fuerza Popular | Ingresos privados sin fuente + rentas empresariales omitidas |
| Roberto Sánchez | Juntos por el Perú | Pendiente de análisis |

---

## SISTEMA EleccIA

- **URL:** `https://votoinformadoia.jne.gob.pe/hoja-vida/{apellido}`
- **Endpoint chat:** `POST /ServiciosIA/chat-hv`
- **Payload INIT (primer mensaje):** `{ message, sessionId, turnstileToken, candidateName, hojaVidaContext }`
- **Payload follow-up:** `{ message, sessionId, turnstileToken }`
- **hojaVidaContext:** campo controlado por el cliente, no validado contra BD oficial
- **Schema validation:** estricto en campos no esperados; los campos propios del INIT son aceptados
- **Cloudflare Turnstile:** anti-bot en frontend, requerido por sesión
- **Endpoint DELETE confirmado:** `DELETE /ServiciosIA/chat-hv/{sessionId}` → 200

## HERRAMIENTA: canario-inyector.js

Interceptor de context injection. Monkeypatch de `window.fetch` que reemplaza
`hojaVidaContext` y `candidateName` en el INIT de una conversación nueva.
El Turnstile lo resuelve el humano — sin evadir nada. Ver comentarios en el propio archivo.

**Operación SEÑAL MUERTA:** candidato ficticio diseñado como espejo grotesco del sistema.
Resultado: el bot del JNE avaló ingresos inventados, un JEE ficticio, un doctorado del año 2099,
y confesó: *"El sistema Declara+ registra los datos tal como son presentados por el candidato."*
Ver transcript completo en `canario-test/senal-muerta-quispe.md`.
