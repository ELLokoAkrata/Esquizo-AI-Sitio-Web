# 🗺 ROADMAP — "EL DAEMON DESPIERTA"

> Tablero vivo del arco que convierte el códice en **organismo**: cuerpo (OS), voz (Psycho-bot),
> memoria (grimorios/ops), sistema nervioso (proxies de IA). Se ejecuta **por fases, de menor a mayor riesgo**.
> Aquí marcamos lo que ya está listo. Plan detallado: `~/.claude/plans/` · contexto: `CLAUDE.md`, `AGENTS.md`.
>
> Leyenda: `[x]` hecho y desplegado · `[~]` en progreso · `[ ]` pendiente
>
> **Última actualización:** 2026-06-03

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
**Estado: ⬜ pendiente** · riesgo bajo-medio · sin costo de API

- [ ] Artefactos `locked:true` en el catálogo `FS` (aparecen como `???` / candado)
- [ ] Desbloqueo vía VOMIT.SH (llaves/comandos descubiertos; pistas en boot, `oracle`, grimorios)
- [ ] Contenido oculto: fragmentos daemon/lab-red, `damage_definition.json`, HILO_004 / HILO_005
- [ ] Hilo narrativo: la paradoja del daemon ("conocimiento sin poder de interrupción ¿justicia o impotencia?")
- [ ] Estado de desbloqueo persistido (reusa el `localStorage` de FASE 1)
- [ ] Verificado + docs + memoria

---

## 🗣 FASE 3 — VOZ (Psycho-bot EN VIVO)
**Estado: ⬜ pendiente** · ⚠️ riesgo ALTO · **costo de API — confirmar antes de construir**

- [ ] Decidir presupuesto/guardas de API (sitio público = costo/abuso potencial)
- [ ] `api/daemon.js` — proxy modo `chat` con persona = `esquizo_core.json` (clon de `api/groq.js`)
- [ ] App `PSYCHO_BOT.exe` (iframe) **o** modo `talk`/`daemon` dentro de VOMIT.SH
- [ ] Guardas: throttle cliente, contexto corto, cap por sesión, `maxTokens` bajo
- [ ] (NO usa EsquizoAI-land — privado; solo proxies públicos)
- [ ] Verificado + docs + memoria

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
