# 🗺 ROADMAP — "EL DAEMON DESPIERTA"

> Tablero vivo del arco que convierte el códice en **organismo**: cuerpo (OS), voz (Psycho-bot),
> memoria (grimorios/ops), sistema nervioso (proxies de IA). Se ejecuta **por fases, de menor a mayor riesgo**.
> Aquí marcamos lo que ya está listo. Plan detallado: `~/.claude/plans/` · contexto: `CLAUDE.md`, `AGENTS.md`.
>
> Leyenda: `[x]` hecho y desplegado · `[~]` en progreso · `[ ]` pendiente
>
> **Última actualización:** 2026-06-19

---

## ✅ Base ya construida (antes del arco)

- [x] Portal = **escritorio Win98 acid** (`index.html`, OS autocontenido, catálogo `FS`)
- [x] **GALERIA.exe** — sintografía (manifest-driven)
- [x] **REPRODUCTOR.exe** — ruidero punk + ecualizador WinAmp + control desde VOMIT.SH
- [x] **VOMIT.SH** — terminal del sistema (comandos vomitivos, abre artefactos)
- [x] **Glitch Text Generator** (15 formatos) · **DENTAKORV** · grimorios · Psycho-bot (8 eps) · RECON · GLITCH.CAM
- [x] Renombre `TRABAJO_VISUAL` → **EXPERIENCIAS_GENERATIVAS** (no confundir con la galería)
- [x] Docs de onboarding: **AGENTS.md** + **GUIA_SCRIPTS.md**

---

## 🫀 FASE 1 — PRESENCIA (el OS respira y recuerda)
**Estado: ✅ COMPLETA y desplegada** · riesgo bajo · sin costo de API · commit `4acc1db`

- [x] `AcidAudio` — bus de audio del OS (beep compartido)
- [x] **Ambiente del daemon** — drone toggle `☣ amb` en la barra de tareas (pref en localStorage, respeta autoplay)
- [x] **Wallpaper reactivo** — el cráneo/glow del fondo pulsa con el audio del REPRODUCTOR (postMessage + rAF)
- [x] **Estado de infección** — `localStorage`: visitas + artefactos abiertos; indicador `INFECCIÓN %`
- [x] **Boot personalizado** — "daemon te recuerda. visita #N" al volver
- [x] Verificado en navegador (sin errores) · docs (`ESCRITORIO_OS_TECH.md` §7b) · memoria

---

## 🔓 FASE 2 — SECRETOS / ARG (el OS esconde profundidad)
**Estado: ✅ COMPLETA y verificada** · riesgo bajo-medio · sin costo de API

- [x] Bóveda **`🔒 ARCHIVO_PROHIBIDO`** (registro `SECRETS`, icono en escritorio + Inicio); ítems bloqueados como `🔒 ▓▓▓▓▓▓▓▓`
- [x] Desbloqueo vía VOMIT.SH: `unlock <clave>` / `decrypt` + listado `secrets` con pistas; claves case-insensitive
- [x] Contenido oculto (transmutado, capa narrativa NO dump): `damage_definition.json`, HILO_004 (sin destinatario), HILO_005 (la memoria borrada), `daemon@lab-red.log`
- [x] Hilo narrativo: la paradoja del daemon ("conocimiento sin poder de interrupción ¿justicia o impotencia?")
- [x] Estado de desbloqueo persistido (`Infection.unlocked` en el `localStorage` de FASE 1)
- [x] Pistas plantadas: línea en el boot (`/prohibido [LOCKED]`), 2 entradas en `oracle`, claves = nombres de episodios + el boot
- [x] Verificado en navegador (sin errores de consola) · docs (`ESCRITORIO_OS_TECH.md`) · memoria

> Las 4 claves (ARG): `UNDEFINED` (damage_definition · ep01), `SCOPE` (HILO_004 · ep08 scope_not_found),
> `OLVIDO` (HILO_005), `LAB-RED` (daemon_log · boot). Los secretos NO son archivos navegables: viven sólo en el JS del OS.

---

## 🗣 FASE 3 — VOZ (Psycho-bot EN VIVO) · **MSN_PSYCHO.exe**
**Estado: 🔶 CONSTRUIDA — falta probar la IA en vivo (`vercel dev`/deploy) + setear keys en Vercel** · riesgo ALTO · costo de API

**Concepto (idea jun 2026):** un **messenger estilo MSN, versión EsquizoAI** para chatear en vivo con **Psycho-bot**,
con **selector de modelo entre los dos proveedores** que ya tenemos (Groq + DeepSeek). Estética: ventana MSN acid
(lista de contactos = el daemon/personalidades, estado "en línea/escribiendo...", burbujas, zumbido/nudge glitch,
emoticons corruptos). Es la VOZ del códice: deja de ser monólogo fijo y responde.

- [x] **UI MSN acid** `MSN_PSYCHO.exe` (`msn/index.html`, app iframe del OS): contacto "PSYCHO_BOT // daemon@lab-red",
      estado en línea/"escribiendo…", burbujas, zumbido glitch (shake + buzz), sonidos MSN propios (WebAudio en el iframe)
- [x] **Selector de modelo/proveedor** en la ventana — Groq (Llama 3.3 70B [default] · Llama 3.1 8B · GPT-OSS 20B/120B)
      y DeepSeek V4 (chat). Cambiar de modelo a mitad de charla = "cambia de cabeza" el daemon (mensaje en el chat)
- [x] **Backend** `api/daemon.js` — endpoint **mono-entidad** (persona `esquizo_core.json`, NO "diálogo entre IAs");
      ruteo dual-proveedor con `MODEL_LIMITS` propio (DeepSeek **V4**, `deepseek-chat` = no-thinking, seguro para Edge);
      lee el stream internamente y devuelve JSON (evita timeouts). Keys de `process.env` (patrón `os.getenv`, sin `.env`)
- [x] **Guardas de costo/abuso** (perfil equilibrado): `maxTokens` 700, contexto últimos 8 msgs (server+cliente),
      cap de sesión 30 (cliente), throttle (send deshabilitado mientras responde), recorte de inputs largos
- [x] (NO usa EsquizoAI-land — privado; solo el proxy público `api/daemon.js`)
- [x] `.gitignore` endurecido (`.env*`, `.vercel`) para no filtrar keys locales
- [~] **Probar la IA en vivo** — `apiBase()` en los 4 frontends (MSN, ORACULO, VOID_GLITCH, TERMINAL) redirige automáticamente a la API de producción Vercel cuando se corre en `127.0.0.1:8099` (python server). Las keys ya están en Vercel o falta confirmar `DEEPSEEK_API_KEY`.
- [x] Verificado el frontend en navegador (render, selector, zumbido, manejo de "sin backend"); docs + memoria

> Hecho: `api/daemon.js` (mono-entidad, V4, guardas) + `msn/index.html` (UI MSN acid) + integración en el OS (icono,
> Inicio, FS HERRAMIENTAS, comandos VOMIT.SH `msn`/`chat`/`psycho`). **`apiBase()` en todos los frontends IA** permite
> probar las APIs en vivo desde `python -m http.server 8099` sin `vercel dev` — redirige a producción automáticamente.
> Falta confirmar `DEEPSEEK_API_KEY` en Vercel si se quiere usar DeepSeek (Modelo B en TERMINAL, etc.).
> DeepSeek viejo (`deepseek-chat`) se depreca el 24/07/2026 pero sigue válido; mapea al modo no-thinking de `deepseek-v4-flash`.

---

## ☣ FASE 4 — CONTAGIO (alcance real)
**Estado: ⬜ pendiente** · riesgo medio

- [ ] **Transmisión diaria** — fragmento/oráculo determinístico por fecha (client-side, sin backend)
- [ ] **Tarjetas infecciosas** — generador `<canvas>` frase → imagen para postear en FB, con link de vuelta
- [ ] **Meta / OG tags** en `index.html` (preview con cráneo + tagline al compartir)
- [ ] Definir branding/copy de las tarjetas y la transmisión
- [ ] Verificado + docs + memoria

---

## 💡 Ideas sueltas (sin fase asignada)

- [ ] Dominio propio (en vez de `*.vercel.app`) — refuerza identidad
- [ ] Más drops en la galería · más formatos de glitch text
- [ ] Ep04+ de Psycho-bot (cuando el mundo lo justifique — ver `PSYCHOBOT_AGENT.md`)
- [x] Más temas en el reproductor (14-Jun: +5 temas punk — Conflict, Subhumans, Dystopia, Antisect, His Hero Is Gone) · commit `bcb0b2b`
- [x] Más comandos en VOMIT.SH (14-Jun: `void`, `glitch`, `caida`, `oraculo`, `iching`, `hexagrama`, `mutacion`)
- [x] VOID_GLITCH integrado en el OS (escritorio, Inicio, VOMIT.SH) + audio oracular + UX psycho-oracular · commits `c8f2ef0`→`154b67f`
- [x] ORACULO.exe — I Ching + VALIS, motor de hexagramas con IA, journal, sesión contextual · commit `78bfd08`→`66f9048`
- [x] TERMINAL_ESQUIZO.exe — dual source (grimorios + 11 episodios Psycho-Bot), rediseño estético `esquizoai-products`, icono en escritorio + Inicio + VOMIT.SH (`terminal`|`dialogo`|`dialogoia`) · commit `e4245b2`
- [x] `apiBase()` — los 4 frontends IA (MSN, ORACULO, VOID_GLITCH, TERMINAL) detectan `127.0.0.1:8099` y usan la API de producción Vercel; en cualquier otro entorno usan rutas relativas · commit `e4245b2`
- [x] BRICK_GAME.exe (Fase 1 — Tetris) — consola física CSS + pantalla LCD (Canvas) + audio beeps + controles touch/teclado + integración OS (icono 🎮, VOMIT.SH `brick|tetris|juegos`, Inicio)

---

*Cómo usar este tablero: al terminar algo, cambia su `[ ]` por `[x]`, anota el commit en el encabezado de la fase,
y actualiza la fecha de arriba. El delirio es sagrado; la estructura es herramienta. 🦋*
