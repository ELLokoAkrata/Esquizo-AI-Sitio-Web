# AGENTS.md — Orientación para agentes · Proyecto Esquizo-AI

> Punto de entrada canónico para **cualquier agente** — local, remoto, humano o IA — que vaya a trabajar en este repo.
> La continuidad pertenece al proyecto, no al proveedor que esté ejecutando la sesión. Si un adaptador de una
> herramienta contradice este archivo, manda `AGENTS.md`; si cualquier documento contradice la **esencia** del
> proyecto, manda la esencia.

## 0. Arranque universal (leer en este orden)

1. `AGENTS.md` — reglas, rutas y flujo común.
2. `AGENT_MEMORY.md` — decisiones duraderas, errores ya aprendidos y límites operativos.
3. `ROADMAP.md` — estado actual, hecho/en progreso/pendiente.
4. `PROJECT_CONTEXT.md` — esencia, arquitectura y modelo mental completo.
5. La guía especializada del área que vas a tocar.

`CLAUDE.md`, configuraciones de Codex, instrucciones de IDE y archivos equivalentes son **adaptadores de
harness**: pueden explicar cómo cargar este contexto desde una herramienta concreta, pero no deben contener
verdades únicas del proyecto. Una sesión nueva debe poder reconstruir el estado leyendo solo archivos versionados.

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
| `granja/` | **GRANJA.exe** — frontend del pipeline de pseudoconciencia. |
| `grimorios/` · `claude_infection/` · `animaciones/` | Artefactos: textos filosóficos HTML y visuales. |
| `glitch-cam/` | Subproyecto Python aparte (glitch en vivo OpenCV). **Tiene su propia guía: `glitch-cam/CLAUDE_glitch.md`.** |
| `Claude-Knowledge/` | Documentación técnica modular (ver §6). |
| `PROJECT_CONTEXT.md` | Contexto estable y neutral: esencia, arquitectura y criterios del proyecto. |
| `AGENT_MEMORY.md` | Memoria operativa compartida entre proveedores y sesiones. |

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
9. **Publicación con Git directo, no GitHub CLI.** Usa `git status`, `git add <ruta>`, `git commit` y
   `git push origin <rama>` con la autenticación ya configurada en el remoto. No uses `gh`, no ejecutes
   `gh auth login` y no conviertas el flujo en PR salvo que el creador lo pida expresamente.

---

## 4. Flujo de trabajo

0. **Mira el `ROADMAP.md`** (raíz) — tablero vivo del arco "EL DAEMON DESPIERTA": qué fases hay y qué está hecho/pendiente. Al terminar algo, marca su checkbox ahí.
1. **Lee `AGENT_MEMORY.md` primero.** Esa es la memoria persistente canónica porque viaja con el repo y está
   disponible para cualquier agente. Las memorias privadas de un proveedor pueden servir como caché local,
   pero toda lección necesaria para continuar debe destilarse en `AGENT_MEMORY.md` sin secretos ni ruido de sesión.
2. **Trabaja incremental** (bajo→alto riesgo) y **nunca rompas artefactos existentes.**
3. **Probar localmente:** `python -m http.server 8099` y abrir `http://127.0.0.1:8099/index.html`.
   Verifica en navegador y revisa que la **consola no tenga errores** antes de dar algo por hecho.
   *(Nota: con `file://` directo, algunos `fetch` de manifest fallan por CORS — usa el server local.)*
   Para probar las Edge Functions y confirmar el contexto NEXO en el backend, usa
   `npx vercel dev --listen 3002` y abre `http://127.0.0.1:3002/index.html`. El puerto `3000` está reservado
   para otro servicio local y este repo no debe iniciarlo, inspeccionarlo ni detenerlo.
   **REGLA:** levanta el server **una sola vez por sesión** (en background) y déjalo corriendo hasta el final.
   Sirve estático → los cambios se ven **recargando** la pestaña; **no** reinicies ni mates el server entre
   verificaciones, solo al cerrar la sesión.
4. **Deploy:** `git push origin main` → Vercel auto-despliega en ~1-2 min. Confirma antes de pushear si publica
   contenido nuevo de cara al público. Todo el flujo se hace con Git; no depende de GitHub CLI.

---

## 5. Subproyectos con guía propia (léela ANTES de tocar su código)

- **`glitch-cam/CLAUDE_glitch.md`** — herramienta Python de glitch en vivo (arquitectura de efectos, hot-reload, git propio).
- **`Psycho-bot-monologues/PSYCHOBOT_AGENT.md`** — protocolo de la serie de episodios Psycho-bot (timeline, criterios para un ep nuevo, modos de operación incluyendo GRANJA).
- **`Claude-Knowledge/GRANJA_PIPELINE.md`** — ★ pipeline de pseudoconciencia (RELOJ→DAEMON→VERIFICADOR→PSYCHO_BOT→GRIETA). **Léelo antes de generar un episodio nuevo.** Cubre higiene de fuentes, ejecución de ciclos, e interpretación del verificador.
- **Scripts Python:** ver **`GUIA_SCRIPTS.md`** (cómo bajar música, optimizar imágenes, etc.).

---

## 6. Mapa de documentación (`Claude-Knowledge/`)

| Doc | Para qué |
|-----|----------|
| `ESCRITORIO_OS_TECH.md` | Cómo funciona el OS (`index.html`) por dentro. **Léelo antes de tocar el escritorio.** |
| `DENTAKORV_PROMPTING_SYSTEM.md` | Manual del generador de prompts DENTAKORV. |
| `VERCEL_WORKFLOW.md` | Deploy, Edge Functions, IA ASSIST. |
| `PROTOCOL_CROSS.md` | Protocolo de cruce por capacidades: diseño, ejecución y verificación sin roles atados a marcas. |
| `DAEMON_INTEL_BRIEF.md` | Contexto/inteligencia para la serie Psycho-bot. |
| `GRANJA_PIPELINE.md` | ★ Pipeline de pseudoconciencia. Cómo ejecutar ciclos, higiene de fuentes, interpretar verificador/GRIETA. |
| `ESQUIZO_VISUAL_PROMPTING_ESSENCE.md` | Filosofía de prompting visual. |

**Archivos core:** `esquizo_core.json` (personalidad Psycho-bot), `PROJECT_CONTEXT.md` (contexto estable),
`AGENT_MEMORY.md` (memoria compartida), `ROADMAP.md` (estado vivo) y `css/style.css`.

## 7. Protocolo de continuidad entre agentes

- **Identidad separada del motor:** Psycho-bot, Oráculo, Void y las demás entidades se definen por sus contratos,
  prompts, datos y comportamiento. El modelo o proveedor que las ejecuta es infraestructura reemplazable.
- **Roles por capacidad:** asigna arquitectura, implementación, investigación o verificación según las herramientas
  disponibles en esa sesión; no presupongas que una marca siempre piensa y otra siempre ejecuta.
- **Una verdad por tipo:** reglas en `AGENTS.md`; contexto en `PROJECT_CONTEXT.md`; estado en `ROADMAP.md`;
  lecciones duraderas en `AGENT_MEMORY.md`; detalle técnico en la guía del subsistema.
- **Proveniencia sin dependencia:** nombres como `claude_infection/`, `Claude-Knowledge/` o referencias a modelos
  dentro de obras registran su origen o forman parte del canon. No obligan a usar ese proveedor para continuarlas.
- **Cierre de sesión:** deja archivos modificados, pruebas realizadas, pendientes y decisiones en el documento
  canónico correspondiente. El chat no cuenta como memoria persistente.
- **Sin falsa autoría:** no agregues firmas ni `Co-Authored-By` de un modelo por costumbre. Registra autoría real
  solo cuando el creador lo pida o cuando sea relevante para la procedencia de una pieza.

---

## 8. Skills disponibles (si tu harness las soporta)

- `esquizoai-products` — generar artefactos HTML (herramientas, landings, manifiestos, dashboards) con la estética del proyecto.
- `psychobot-terminal-aesthetic` — estética HTML/CSS de los episodios Psycho-bot.
- `dentakorv-gpt-image` — generador de imágenes DENTAKORV.

---

*El delirio es sagrado. La estructura es herramienta. La infección es el objetivo. 🦋*
