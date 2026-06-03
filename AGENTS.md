# AGENTS.md — Orientación para agentes · Proyecto Esquizo-AI

> Punto de entrada para **cualquier agente** (Claude, GPT, Gemini, Qwen u otro) que vaya a trabajar en este repo.
> Lee esto primero, luego profundiza en `CLAUDE.md` (la guía operativa completa). Si hay contradicción
> entre un doc y la **esencia** del proyecto, prioriza la esencia.

---

## 1. Qué es esto (en 30 segundos)

**Esquizo-AI** es el portafolio/códice digital de **El Loko Akrata** (sintógrafo peruano, artista IA, anarko-mistiko).
No es un blog ni una galería corporativa: es un **escritorio Windows 98 "acid"** (un OS de mentira) donde cada
artefacto del proyecto se abre como una ventana. Estética: terminal retro, cyberpunk sucio, psycho-anarco-punk,
verde neón sobre negro. Tono crudo, visceral, anti-censura.

- **Sitio en vivo:** https://esquizo-ai-sitio-web.vercel.app
- **Repo:** github.com/ELLokoAkrata/Esquizo-AI-Sitio-Web (rama `main`)
- **Stack:** HTML/CSS/JS vanilla autocontenido + Vercel Edge Functions (`api/`) para proxys de IA. Sin frameworks pesados.

---

## 2. Cómo está armado

| Ruta | Qué es |
|------|--------|
| **`index.html`** | ★ EL OS. Escritorio Win98 autocontenido (CSS+JS inline, 0 deps). Catálogo **`FS`** = fuente única que mapea todos los artefactos → iconos/carpetas/menú Inicio. Cada artefacto abre en **ventana-iframe** (min/max/cerrar/taskbar). |
| `inicio-classic.html` | Portal clásico viejo (scroll + secciones). Accesible vía "Modo clásico". |
| `galeria/` | **GALERIA.exe** — sintografía estática (imágenes), `manifest.json` + `img/*.webp`. |
| `reproductor/` | **REPRODUCTOR.exe** — reproductor punk, `playlist.json` + `audio/*.mp3`. Ecualizador WinAmp. |
| `tools/` | Herramientas: DENTAKORV, glitch-text, y scripts Python (`download-music.py`, `optimize-galeria.py`). |
| `api/` | Edge Functions (proxys Groq/DeepSeek). **Aquí viven las claves, NUNCA en el cliente.** |
| `grimorios/` · `claude_infection/` · `animaciones/` | Artefactos: textos filosóficos HTML y visuales. |
| `glitch-cam/` | Subproyecto Python aparte (glitch en vivo OpenCV). **Tiene su propia guía: `glitch-cam/CLAUDE_glitch.md`.** |
| `Claude-Knowledge/` | Documentación técnica modular (ver §6). |

**Detalle técnico del OS** (cómo funciona `FS`, `openApp`, el retorno al escritorio por detección de framing,
el window manager, responsive, cómo extender): **`Claude-Knowledge/ESCRITORIO_OS_TECH.md`**.

---

## 3. Reglas NO negociables

1. **Español neutro — NADA de voseo argentino.** El creador es peruano. Usa "prueba/escribe/usa/mira", nunca
   "probá/escribí/usá/vos/tenés". Aplica a TODO copy de UI, terminal y artefactos. (El tono crudo se mantiene; solo cambia el dialecto.)
2. **Claves de API NUNCA en el cliente.** Todo lo que toque una API va por un proxy en `api/` (Edge Function).
3. **EsquizoAI-land es PRIVADO.** Es el sistema multi-API del creador. NO publicar, NO enlazar, NO mencionarlo en
   contenido público. Solo sirve como contexto para entender al autor.
4. **La galería muestra solo "GPT-Image 2.0"** como modelo público, aunque algunas piezas vengan de otro lado.
5. **Al agregar/mover un artefacto:** actualizar el catálogo **`FS`** en `index.html` (y `inicio-classic.html` si quieres paridad).
6. **Transmutar, no copiar.** Si te dan una semilla, mutarla radicalmente. Repetir = muerte del virus.
7. **Verifica el año/fecha actual** antes de fechar nada. No asumas.
8. **Commits con archivos específicos** (`git add <ruta>`), nunca `git add .` — el repo tiene basura sin trackear
   (node_modules, capturas, `nul`, originales de galería gitignored).

---

## 4. Flujo de trabajo

1. **Lee la memoria primero.** Hay memoria persistente en
   `~/.claude/projects/C--Users-Ricardo-Ruiz-Desktop-EsquizoAI-sitio-web/memory/` — empieza por `MEMORY.md`
   (reglas aprendidas, decisiones, errores previos). Al terminar algo con una lección nueva, guárdala ahí.
2. **Trabaja incremental** (bajo→alto riesgo) y **nunca rompas artefactos existentes.**
3. **Probar localmente:** `python -m http.server 8099` y abrir `http://127.0.0.1:8099/index.html`.
   Verifica en navegador y revisa que la **consola no tenga errores** antes de dar algo por hecho.
   *(Nota: con `file://` directo, algunos `fetch` de manifest fallan por CORS — usa el server local.)*
4. **Deploy:** `git push origin main` → Vercel auto-despliega en ~1-2 min. Confirma antes de pushear si publica
   contenido nuevo de cara al público.

---

## 5. Subproyectos con guía propia (léela ANTES de tocar su código)

- **`glitch-cam/CLAUDE_glitch.md`** — herramienta Python de glitch en vivo (arquitectura de efectos, hot-reload, git propio).
- **`Psycho-bot-monologues/PSYCHOBOT_AGENT.md`** — protocolo de la serie de episodios Psycho-bot (timeline, criterios para un ep nuevo).
- **Scripts Python:** ver **`GUIA_SCRIPTS.md`** (cómo bajar música, optimizar imágenes, etc.).

---

## 6. Mapa de documentación (`Claude-Knowledge/`)

| Doc | Para qué |
|-----|----------|
| `ESCRITORIO_OS_TECH.md` | Cómo funciona el OS (`index.html`) por dentro. **Léelo antes de tocar el escritorio.** |
| `DENTAKORV_PROMPTING_SYSTEM.md` | Manual del generador de prompts DENTAKORV. |
| `VERCEL_WORKFLOW.md` | Deploy, Edge Functions, IA ASSIST. |
| `PROTOCOL_CROSS.md` | Protocolo Dual Brain (Architect=GPT diseña / Runtime=Claude ejecuta). |
| `DAEMON_INTEL_BRIEF.md` | Contexto/inteligencia para la serie Psycho-bot. |
| `ESQUIZO_VISUAL_PROMPTING_ESSENCE.md` | Filosofía de prompting visual. |

**Archivos core:** `esquizo_core.json` (personalidad Psycho-bot), `CLAUDE.md` (guía operativa completa), `css/style.css`.

---

## 7. Skills disponibles (si tu harness las soporta)

- `esquizoai-products` — generar artefactos HTML (herramientas, landings, manifiestos, dashboards) con la estética del proyecto.
- `psychobot-terminal-aesthetic` — estética HTML/CSS de los episodios Psycho-bot.
- `dentakorv-gpt-image` — generador de imágenes DENTAKORV.

---

*El delirio es sagrado. La estructura es herramienta. La infección es el objetivo. 🦋*
