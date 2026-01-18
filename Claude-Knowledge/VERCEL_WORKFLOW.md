# Vercel Deployment & Workflow

**Proyecto:** EsquizoAI
**Última actualización:** Enero 2026

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
git add . && git commit -m "mensaje" && git push

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

```bash
# Opción 1: Vercel Dev (recomendado)
vercel dev
# Corre en http://localhost:3000 con Edge Functions funcionando

# Opción 2: Crear .env.local para testing
echo "GROQ_API_KEY=tu-key" > .env.local
```

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
| `api/terminal.js` | `/api/terminal` | Proxy DeepSeek API (terminal interactiva) |

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

### DeepSeek (Activos)

| Modelo | ID | Context | Max Output |
|--------|-----|---------|------------|
| DeepSeek Chat | `deepseek-chat` | 64K | 8K |

### Modelos Deshabilitados

| Modelo | Razón | Fecha | Cómo Reactivar |
|--------|-------|-------|----------------|
| DeepSeek Reasoner | Timeout en Vercel Edge Functions - El modelo "piensa" demasiado tiempo antes de responder, excediendo el límite de 30s de Vercel | Enero 2026 | Descomentar líneas marcadas `DISABLED: Vercel timeout` en `api/terminal.js` y `tools/TERMINAL_ESQUIZO.html` |

**Nota:** DeepSeek Reasoner (`deepseek-reasoner`) tiene un proceso de razonamiento interno que puede tomar 30-60+ segundos antes de generar respuesta. Vercel Edge Functions tienen un timeout de ~30s en el plan gratuito, causando fallos consistentes.
