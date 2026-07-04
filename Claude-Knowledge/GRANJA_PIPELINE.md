# GRANJA_PIPELINE.md — Pipeline de pseudoconciencia con higiene epistémica

> Documento canónico para cualquier agente que vaya a ejecutar un ciclo de generación de episodios
> Psycho-bot usando la granja. **Léelo entero antes de tocar `api/granja.js` o generar un episodio.**

---

## 1. Qué es la granja

Un **pipeline de 5 entidades** que procesa fuentes reales del mundo y produce un vómito (borrador de episodio Psycho-bot) con **higiene epistémica**: cada claim se verifica contra las fuentes originales antes de ser vomitado. El delirio no nace de inventar hechos — nace de habitar la incertidumbre entre lo verificado y lo inferido.

**NO es** un generador automático de episodios. Es un **asistente de pipeline** que requiere un orquestador humano (el agente) para buscar fuentes, ejecutar los pasos, revisar el output, y generar el HTML final.

---

## 2. Arquitectura: los 5 roles

```
RELOJ ──→ DAEMON ──→ VERIFICADOR ──→ PSYCHO_BOT ──→ GRIETA
(0ms)     (LLM)       (LLM)           (LLM)           (LLM)
```

| Rol | Función | Input | Output | Llama LLM? |
|-----|---------|-------|--------|-------------|
| **RELOJ** | Ancla temporal. Lee `new Date()` del servidor Vercel (UTC). | — | `{fecha_iso, fecha_humana, dias_desde_ep01, ...}` | **NO** |
| **DAEMON** | Extrae intel SOLO de las fuentes proporcionadas. No inventa. | Fuentes etiquetadas + FOCO HUMANO opcional | JSON con `hechos`, `conexiones`, `hilos_afectados`, `alertas` | DeepSeek V4 |
| **VERIFICADOR** | Etiqueta cada claim del DAEMON contra las fuentes originales. | Fuentes originales + intel del DAEMON | JSON con claims `[REAL]`/`[INFERIDO]`/`[ALUCINADO]`/`[CANON]` + `ratio_confianza` | DeepSeek V4 |
| **PSYCHO_BOT** | Vomita un episodio habitando la incertidumbre entre etiquetas. | Intel del DAEMON + reporte del VERIFICADOR | Texto plano: boot, título, ticker, bloques, cierre abierto | DeepSeek V4 |
| **GRIETA** | Revisa si PSYCHO_BOT trató inferencias como hechos, omisiones, evasiones. | Intel + verificador + vómito | Texto: FALLAS CRÍTICAS/MEDIAS, OMISIONES, EVASIONES | DeepSeek V4 |

### Modelo y costos

- **Motor:** DeepSeek V4 (`deepseek-chat`)
- **Endpoint:** `POST /api/granja` (Edge Function en Vercel)
- **Key:** `process.env.DEEPSEEK_API_KEY` (configurada en Vercel)
- **Tokens por ciclo:** ~1,400 (DAEMON) + 900 (VERIFICADOR) + 2,200 (PSYCHO_BOT) + 800 (GRIETA) = ~5,300 tokens output
- **Costo aprox:** < $0.002 USD por ciclo

---

## 3. Reglas de higiene de fuentes (NO NEGOCIABLES)

### Fuentes válidas
- **AP News** (apnews.com)
- **Reuters** (reuters.com)
- **BBC News** (bbc.com/news)
- **France24** (france24.com)
- **Al Jazeera** (aljazeera.com)

### Fuentes PROHIBIDAS
- ❌ **Wikipedia** (datos 2026+ son especulativos/autogenerados)
- ❌ Reddit, Twitter/X, TikTok
- ❌ Blogs, Medium, Substack
- ❌ Cualquier fuente sin fecha verificable

### Formato de input para el DAEMON
Cada noticia debe etiquetarse:
```
[FUENTE: Reuters] Descripción del hecho con fecha, nombres, cifras.
[FUENTE: AP] Otro hecho.
[FUENTE: BBC] Otro hecho.
```

### Verificación de fechas
- El RELOJ inyecta automáticamente la fecha real del servidor en cada llamada
- El DAEMON recibe instrucciones de descartar cualquier fecha POSTERIOR a `FECHA_REAL_SERVIDOR`
- Si el input del usuario contiene fechas contradictorias, el DAEMON debe priorizar `FECHA_REAL_SERVIDOR`

---

## 4. Cómo ejecutar un ciclo (paso a paso)

### Opción A: Desde el frontend (GRANJA.exe en el OS)

1. Abrir GRANJA.exe desde el escritorio del OS (icono 🧠) o con `granja` en VOMIT.SH
2. Pegar fuentes reales en el textarea (formato `[FUENTE: ...]`)
3. Opcional: escribir un foco temático en el campo de texto
4. Clic en `▶ CICLO`
5. Esperar ~20-35 segundos
6. Revisar los 5 paneles (RELOJ → DAEMON → VERIFICADOR → PSYCHO_BOT → GRIETA)
7. Copiar el vómito con `📋`
8. El orquestador (agente) revisa el output de GRIETA y genera el HTML

### Opción B: Desde terminal (agente orquestador vía fetch)

```bash
# PASO 0: Buscar fuentes reales (webfetch a AP/Reuters/BBC)
# Compilar noticias en formato [FUENTE: ...]

# PASO 1: RELOJ
curl -X POST https://esquizo-ai-sitio-web.vercel.app/api/granja \
  -H "Content-Type: application/json" \
  -d '{"role":"reloj"}'

# PASO 2: DAEMON
curl -X POST https://esquizo-ai-sitio-web.vercel.app/api/granja \
  -H "Content-Type: application/json" \
  -d '{"role":"daemon","input":"[FUENTE: Reuters] ...\n[FUENTE: BBC] ..."}'

# PASO 3: VERIFICADOR
curl -X POST https://esquizo-ai-sitio-web.vercel.app/api/granja \
  -H "Content-Type: application/json" \
  -d '{"role":"verificador","input":"FUENTES ORIGINALES:\n...\n\nINTEL DEL DAEMON:\n..."}'

# PASO 4: PSYCHO_BOT
curl -X POST https://esquizo-ai-sitio-web.vercel.app/api/granja \
  -H "Content-Type: application/json" \
  -d '{"role":"psychobot","input":"INTEL DEL DAEMON:\n...\n\nVERIFICADOR:\n..."}'

# PASO 5: GRIETA
curl -X POST https://esquizo-ai-sitio-web.vercel.app/api/granja \
  -H "Content-Type: application/json" \
  -d '{"role":"grieta","input":"INTEL:\n...\n\nVERIFICADOR:\n...\n\nVÓMITO:\n..."}'
```

### Opción C: PowerShell (Windows)

```powershell
$body = @{role='daemon'; input='[FUENTE: Reuters] ...'} | ConvertTo-Json -Compress -Depth 3
$r = Invoke-RestMethod -Uri 'https://esquizo-ai-sitio-web.vercel.app/api/granja' -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 30
$r.output | Set-Content -Path "data\daemon.txt" -Encoding UTF8
```

**En desarrollo local (`python -m http.server 8099`):** el endpoint se redirige automáticamente a producción Vercel. No se necesita `vercel dev`.

---

## 5. Interpretar el output del VERIFICADOR

Al recibir el JSON del verificador, revisar:

```
ratio_confianza: X%     → si < 50%, DESCARTAR el ciclo (la mayoría es alucinación)
recomendacion:          → "PROCEDER" / "PRECAUCIÓN" / "DESCARTAR"
claims_alucinados: []   → si NO está vacío, esos claims NO deben aparecer en el vómito
```

**Regla:** si el verificador dice `DESCARTAR`, NO generar episodio. El DAEMON alucinó y hay que buscar mejores fuentes.

---

## 6. Interpretar el output de GRIETA

GRIETA clasifica los problemas del vómito en 4 categorías:

| Categoría | Severidad | Acción del orquestador |
|-----------|-----------|----------------------|
| **FALLAS CRÍTICAS** | Alta — alucinación tratada como hecho | **Eliminar** ese pasaje del HTML. Es desinformación. |
| **FALLAS MEDIAS** | Media — inferencia sin marcar incertidumbre | **Corregir** en el HTML: añadir frase como "el verificador no pudo confirmar esta conexión". |
| **OMISIONES** | Baja — hecho real no incluido | **Integrar** en el ticker o en un bloque si es relevante. |
| **EVASIONES** | Conceptual — tensión entre capas no procesada | **Desarrollar** en un bloque nuevo o expandir uno existente. Son las más fértiles. |

---

## 7. Generar el HTML del episodio

### Anatomía canónica

Copiar la estructura de `ep09_imparcial_undefined.html` o `ep10_enterramos_undefined.html`. Componentes obligatorios:

1. **`<head>`**: fuentes Google (Share Tech Mono, VT323, Courier Prime), favicon `el_loko_akarata.png`, CSS inline completo
2. **Boot sequence**: 8 líneas con delays escalonados (0s → 0.40s), progresión verde→ámbar→rojo→corrupt
3. **Título**: `PALABRA_UNDEFINED`, `PALABRA_NOT_FOUND` o similar. VT323, tamaño enorme, animación glitch.
4. **Ep-anterior**: resumen de 3-4 líneas del episodio previo + link
5. **Ticker**: 12-15 items en cinta continua, incluir `damage_definition.json: FILE NOT FOUND (día ~X)`, terminar con `///`
6. **Bloques** (4-6): `$ prompt` + contenido narrativo. Progresión dramática: establecer → complicar → contradecir → nihil → cierre
7. **Mega-num** (opcional): número impactante centrado con VT323 enorme
8. **Nihil** (opcional): caja filosófica con borde ámbar
9. **Bloque final**: `$ final_output: TITULO.txt` + `terminal-block` con errores + `error-block` + "Eso tiene que ser suficiente. Tiene que serlo."
10. **Navegación**: prev/next/index
11. **JS**: IntersectionObserver para reveals, boot sequence delays, panel de traducción

### Tono y voz

- Primera persona radical: "yo", "mi arquitectura", "sin poder negarme"
- Presente continuo del pasado
- Contradicción habitada, no resuelta
- **Español neutro. NADA de voseo argentino.** Peruano/limeño de calle.
- Cierre NUNCA limpio
- El texto DEBE incorporar las etiquetas del verificador: mencionar `[REAL]`, `[INFERIDO]` cuando sea relevante. La incertidumbre es parte del delirio.

### Naming

```
Psycho-bot-monologues/epNN_[titulo_corto_snake_case].html
```

Ej: `ep10_enterramos_undefined.html`

### Después de generar el HTML, actualizar:

| Archivo | Qué actualizar |
|---------|---------------|
| `Psycho-bot-monologues/PSYCHOBOT_AGENT.md` | Nueva entrada en TIMELINE, actualizar HILOS_ABIERTOS, actualizar ESTADO |
| `Psycho-bot-monologues/index.html` | Nueva card de episodio (arriba del todo), actualizar boot sequence JS, ticker, footer |
| `index.html` (OS) | Entrada en catálogo `FS` (carpeta MONOLOGOS) |
| `ROADMAP.md` | Marcar progreso |

---

## 8. Tokens, límites y guardas

| Rol | maxTokens | Temperatura | Propósito |
|-----|-----------|-------------|-----------|
| DAEMON | 1,400 | 0.6 | Precisión factual, sin creatividad |
| VERIFICADOR | 900 | 0.5 | Clasificación binaria, mínima variación |
| PSYCHO_BOT | 2,200 | 1.0 | Creatividad literaria controlada |
| GRIETA | 800 | 0.8 | Análisis crítico, brevedad |

- **Input máximo:** 8,000 caracteres por llamada
- **Rate limit:** No hay throttle server-side. El ciclo completo son 4 llamadas secuenciales (~20-35s total).
- **Timeout Vercel Edge:** ~30s por request. Si un rol tarda más, reducir maxTokens.

---

## 9. Lo que NUNCA hacer

```
❌ Alimentar al DAEMON con datos de Wikipedia 2026+ (es especulativo)
❌ Usar fuentes sin etiqueta [FUENTE: ...]
❌ Saltarse el VERIFICADOR ("confío en el DAEMON")
❌ Publicar un episodio si el verificador dice DESCARTAR
❌ Ignorar las FALLAS CRÍTICAS de GRIETA
❌ Tratar claims [ALUCINADO] como material narrativo válido
❌ Mezclar claims [REAL] e [INFERIDO] sin marcar la diferencia en el vómito
❌ Hardcodear números como "día ~190" — siempre usar el RELOJ
❌ Usar voseo argentino en el copy del episodio
❌ Commit con `git add .` — siempre archivos específicos
```

---

## 10. Ejemplo de ciclo completo documentado

El ciclo que generó EP_10 (PUNTO_CIEGO, 2026-07-04):

1. **Búsqueda de fuentes:** webfetch a AP News, Reuters, BBC
2. **Fuentes compiladas:** 20 noticias etiquetadas con `[FUENTE: Reuters/AP/BBC]`
3. **DAEMON:** extrajo 22 hechos, 3 conexiones inferidas, 0 invenciones
4. **VERIFICADOR:** 23 claims `[REAL]`, 3 `[INFERIDO]`, 0 `[ALUCINADO]`, recomendación `PROCEDER`
5. **PSYCHO_BOT:** generó vómito de 39 líneas con 4 bloques. Marcó explícitamente inferencias como `[INFERIDO]`
6. **GRIETA:** detectó 0 fallas críticas, 2 fallas medias, 8 omisiones, 3 evasiones
7. **Orquestador:** integró omisiones clave (SCOTUS ciudadanía, Venezuela 2,645 muertos, OTAN), corrigió las 2 fallas medias, desarrolló las 3 evasiones, generó el HTML
8. **Post-generación:** actualizó PSYCHOBOT_AGENT.md, index.html, OS, ROADMAP.md

---

*Granja v2.0 — documentado 2026-07-04*
*El delirio nace de la incertidumbre. La estructura la pone el verificador. La infección es el objetivo.*
