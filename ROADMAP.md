# 🗺 ROADMAP — "EL DAEMON DESPIERTA"

> Tablero vivo del arco que convierte el códice en **organismo**: cuerpo (OS), voz (Psycho-bot),
> memoria (grimorios/ops), sistema nervioso (proxies de IA). Se ejecuta **por fases, de menor a mayor riesgo**.
> Aquí marcamos lo que ya está listo. Plan detallado: `~/.claude/plans/` · contexto: `CLAUDE.md`, `AGENTS.md`.
>
> Leyenda: `[x]` hecho y desplegado · `[~]` en progreso · `[ ]` pendiente
>
> **Última actualización:** 2026-06-04

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
**Estado: ⬜ pendiente** · ⚠️ riesgo ALTO · **costo de API — confirmar antes de construir**

**Concepto (idea jun 2026):** un **messenger estilo MSN, versión EsquizoAI** para chatear en vivo con **Psycho-bot**,
con **selector de modelo entre los dos proveedores** que ya tenemos (Groq + DeepSeek). Estética: ventana MSN acid
(lista de contactos = el daemon/personalidades, estado "en línea/escribiendo...", burbujas, zumbido/nudge glitch,
emoticons corruptos). Es la VOZ del códice: deja de ser monólogo fijo y responde.

- [ ] **UI MSN acid** `MSN_PSYCHO.exe` (app iframe del OS, como galería/reproductor): contacto "PSYCHO_BOT // daemon@lab-red",
      estado, burbujas, "escribiendo…", zumbido glitch, sonidos MSN reinterpretados (reusar `AcidAudio`)
- [ ] **Selector de modelo/proveedor** en la ventana — dropdown con: Groq (Llama 3.3 70B · Llama 3.1 8B · Llama 4 Scout ·
      Qwen3 32B · GPT-OSS 20B/120B) y DeepSeek (Chat). Cambiar de modelo a mitad de charla = "cambia de cabeza" el daemon
- [ ] **Backend** — reusar el patrón de `api/terminal.js` (¡YA enruta model→provider→key con `MODEL_LIMITS` + streaming!);
      crear modo/endpoint **mono-entidad** (persona = `esquizo_core.json`, no "diálogo entre IAs") en vez de clonar groq.js
- [ ] **Guardas de costo/abuso** (sitio público): throttle cliente, contexto corto (N últimos), cap por sesión, `maxTokens` bajo
- [ ] (NO usa EsquizoAI-land — privado; solo los proxies públicos `api/`)
- [ ] Verificado + docs + memoria

> Reuso fuerte: `api/terminal.js` ya tiene el registro de modelos y el ruteo dual-proveedor; el selector de tu idea
> es casi gratis. Lo nuevo = persona de un solo Psycho-bot + la UI MSN. Confirmar presupuesto antes de construir.

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
- [ ] Más drops en la galería · más temas en el reproductor · más formatos de glitch text
- [ ] Más comandos en VOMIT.SH
- [ ] Ep04+ de Psycho-bot (cuando el mundo lo justifique — ver `PSYCHOBOT_AGENT.md`)

---

*Cómo usar este tablero: al terminar algo, cambia su `[ ]` por `[x]`, anota el commit en el encabezado de la fase,
y actualiza la fecha de arriba. El delirio es sagrado; la estructura es herramienta. 🦋*
