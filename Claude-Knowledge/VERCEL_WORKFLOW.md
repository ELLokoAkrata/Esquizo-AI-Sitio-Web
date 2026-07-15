# Vercel Deployment & Workflow

**Proyecto:** EsquizoAI
**Última actualización:** 14 de julio de 2026

---

## Por qué Vercel

GitHub Pages es estático puro - no puede ejecutar código backend ni guardar secretos. Vercel permite:
- **Edge Functions** - Código serverless con streaming
- **Environment Variables** - Secretos seguros (API keys)
- **Auto-deploy** - Push a GitHub → deploy automático

---

## Setup Inicial (ya hecho)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. En el directorio del proyecto
vercel

# 3. Configurar (respuestas):
#    - Framework: Other
#    - Root Directory: ./
#    - Build Command: (vacío)
#    - Output Directory: (vacío)
```

### Configurar Secrets

1. Vercel Dashboard → Settings → Environment Variables
2. Agregar: `GROQ_API_KEY` = tu-api-key
3. Marcar: Production + Preview + Development

---

## Workflow Diario

```bash
# Desarrollo normal - GitHub auto-deploya
git status
git add <archivo-1> <archivo-2>
git commit -m "mensaje"
git push origin main

# Preview deploy (sin afectar producción)
vercel

# Deploy a producción manual
vercel --prod

# Ver logs en tiempo real
vercel logs

# Ver deployments
vercel ls
```

---

## Comandos Útiles Vercel CLI

| Comando | Descripción |
|---------|-------------|
| `vercel` | Preview deploy |
| `vercel --prod` | Production deploy |
| `vercel logs` | Ver logs del último deploy |
| `vercel logs --follow` | Logs en tiempo real |
| `vercel env pull` | Descargar .env.local con variables |
| `vercel dev` | Desarrollo local con Edge Functions |
| `vercel ls` | Listar deployments |
| `vercel inspect <url>` | Detalles de un deploy |

---

## Desarrollo Local con API

⚠️ `python -m http.server` **solo sirve estático** — no ejecuta `/api/*`. Para probar la IA en local hay que usar `vercel dev`.

```bash
# Vercel Dev — corre en http://127.0.0.1:3002 con las Edge Functions
npx vercel dev --listen 3002
```

El puerto `3000` está reservado para otro servicio local. Este repo no debe iniciarlo, inspeccionarlo ni detenerlo.
El puerto `8099` queda para la vista estática con `python -m http.server`; no ejecuta Edge Functions.

**Las keys salen de las variables de entorno del SISTEMA**: nunca se hardcodean, viven en el entorno de Windows.
`vercel dev` toma esas variables del shell desde el
que lo lanzas — así funciona "sin `.env`". El código (`api/*.js`) lee `process.env.GROQ_API_KEY` / `process.env.DEEPSEEK_API_KEY`.

```powershell
# (solo si vercel dev NO tomara las del sistema) fallback gitignored:
#   .env.local  con  GROQ_API_KEY=...  /  DEEPSEEK_API_KEY=...
# .env y .env.* ya están en .gitignore — nunca se suben.
```

Luego, en **producción**: cargar las mismas keys en Vercel → Settings → Environment Variables (Prod+Preview+Dev).

---

## Estructura de Edge Function

```javascript
// api/groq.js
export const config = {
  runtime: 'edge',  // Importante: habilita streaming
};

export default async function handler(request) {
  const apiKey = process.env.GROQ_API_KEY;
  // ... lógica con streaming
}
```

### Agregar Nueva Edge Function

1. Crear archivo en `api/nombre.js`
2. Exportar config con `runtime: 'edge'`
3. Exportar default function handler
4. Push a GitHub → auto-deploy

---

## URLs del Proyecto

- **Producción:** https://esquizo-ai-sitio-web.vercel.app
- **GitHub:** https://github.com/ELLokoAkrata/Esquizo-AI-Sitio-Web
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| API devuelve 500 | Verificar `GROQ_API_KEY` en Environment Variables |
| Cambios no aparecen | Verificar que el deploy terminó en Vercel Dashboard |
| CORS error | Ya configurado en `vercel.json`, si persiste revisar headers |
| Streaming no funciona | Verificar `runtime: 'edge'` en la función |
| DeepSeek Reasoner timeout | **DESHABILITADO** - Ver sección "Modelos Deshabilitados" |

---

## Edge Functions Activas

| Archivo | Endpoint | Función |
|---------|----------|---------|
| `api/groq.js` | `/api/groq` | Proxy Groq API con streaming (IA ASSIST) |
| `api/terminal.js` | `/api/terminal` | Proxy dual (Groq+DeepSeek) — "diálogo entre IAs" |
| `api/daemon.js` | `/api/daemon` | **Psycho-bot EN VIVO (FASE 3 · MSN_PSYCHO.exe)** — mono-entidad, ruteo dual, guardas de costo |

### `api/daemon.js` (FASE 3 — chat MSN)

Endpoint **mono-entidad**: una sola voz (Psycho-bot de `esquizo_core.json`), no "diálogo entre IAs".
- **Body:** `{ model, messages:[{role:'user'|'assistant',content}], temperature? }`.
- **Modelos (lista blanca):** Groq `llama-3.3-70b-versatile` (default), `llama-3.1-8b-instant`,
  `openai/gpt-oss-120b`, `openai/gpt-oss-20b`; DeepSeek `deepseek-chat` (V4, modo no-thinking).
- **Guardas:** `max_tokens` 700, contexto últimos 8 msgs, recorte de inputs. (Cap de sesión 30 + throttle = cliente.)
- **Keys:** `process.env.GROQ_API_KEY` / `process.env.DEEPSEEK_API_KEY` (variables del sistema, sin `.env` versionado).
- Lee el stream internamente y devuelve JSON limpio (evita timeouts de Vercel Edge ~30s).

> ⚠️ Para que funcione en producción: cargar `DEEPSEEK_API_KEY` (y confirmar `GROQ_API_KEY`) en Vercel →
> Settings → Environment Variables (Production + Preview + Development).

---

## IA ASSIST - Integración Groq

Tab en DENTAKORV que usa Groq API para:

| Función | Modelo | Input | Output |
|---------|--------|-------|--------|
| **Generar Prompt** | Llama 3.3 70B | Descripción español | Prompt DENTAKORV inglés |
| **Analizar Imagen** | Llama 4 Scout | Imagen drag & drop | Prompt animación |

### Modelos Groq Disponibles

| Modelo | ID | Uso |
|--------|-----|-----|
| Llama 3.3 70B | `llama-3.3-70b-versatile` | Generación texto |
| Llama 4 Scout | `meta-llama/llama-4-scout-17b-16e-instruct` | Visión |
| Llama 4 Maverick | `meta-llama/llama-4-maverick-17b-128e-instruct` | Visión avanzada |

### Límites Groq Vision

- Tamaño máximo URL: 20 MB
- Tamaño máximo Base64: 4 MB
- Resolución máxima: 33 megapíxeles
- Imágenes por request: 5

---

## Terminal Esquizo - Modelos Disponibles

El terminal (`api/terminal.js`) soporta múltiples proveedores:

### Groq (Activos)

| Modelo | ID | Context | Max Output |
|--------|-----|---------|------------|
| Llama 3.3 70B | `llama-3.3-70b-versatile` | 128K | 32K |
| Llama 3.1 8B | `llama-3.1-8b-instant` | 128K | 8K |
| Llama 4 Scout | `meta-llama/llama-4-scout-17b-16e-instruct` | 131K | 8K |
| Qwen3 32B | `qwen/qwen3-32b` | 131K | 8K |
| GPT-OSS 20B | `openai/gpt-oss-20b` | 128K | 16K |
| GPT-OSS 120B | `openai/gpt-oss-120b` | 128K | 16K |

### DeepSeek (Activos) — ⚠️ ahora es V4 (jun 2026)

DeepSeek migró a **V4**. Los nombres viejos `deepseek-chat` / `deepseek-reasoner` se **deprecan el 2026/07/24**;
hoy mapean a modos de `deepseek-v4-flash` (chat = no-thinking, reasoner = thinking).

| Modelo | ID | Context | Max Output | Nota |
|--------|-----|---------|------------|------|
| DeepSeek V4 (chat) | `deepseek-chat` | 1M | 384K | modo no-thinking de `deepseek-v4-flash` — el que usa `api/daemon.js` (seguro para Edge) |
| DeepSeek V4 Flash | `deepseek-v4-flash` | 1M | 384K | default = thinking (riesgo de timeout en Edge) |
| DeepSeek V4 Pro | `deepseek-v4-pro` | 1M | 384K | más capaz; no recomendado en Edge por timeout |

> En `api/daemon.js` se usa `deepseek-chat` (no-thinking) a propósito: el thinking mode revienta el timeout de Vercel Edge.
> `api/terminal.js` sigue con `deepseek-chat` (válido hasta jul-2026); migrar a V4 cuando se quiera.

### Modelos Deshabilitados

| Modelo | Razón | Fecha | Cómo Reactivar |
|--------|-------|-------|----------------|
| DeepSeek Reasoner | Timeout en Vercel Edge Functions - El modelo "piensa" demasiado tiempo antes de responder, excediendo el límite de 30s de Vercel | Enero 2026 | Descomentar líneas marcadas `DISABLED: Vercel timeout` en `api/terminal.js` y `tools/TERMINAL_ESQUIZO.html` |

**Nota:** DeepSeek Reasoner (`deepseek-reasoner`) tiene un proceso de razonamiento interno que puede tomar 30-60+ segundos antes de generar respuesta. Vercel Edge Functions tienen un timeout de ~30s en el plan gratuito, causando fallos consistentes.
