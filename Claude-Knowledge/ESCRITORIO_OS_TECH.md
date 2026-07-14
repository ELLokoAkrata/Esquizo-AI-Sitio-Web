# ESCRITORIO_OS — Doc técnico del portal (`index.html`)

> Referencia profunda y accionable del portal. Para el panorama/filosofía, ver `CLAUDE.md`.
> Aquí está el **cómo**: arquitectura, API interna, cómo extender, gotchas y cómo testear.
> **Última actualización:** 2026-07-14 — FREE_RADIO v2 y vórtices reactivos al flujo musical.

**Qué es:** `index.html` es un **escritorio Windows 98 acid** autocontenido (HTML + CSS + JS inline, **cero dependencias externas**, solo fuentes de Google). Envuelve y da acceso a todos los artefactos del códice como un "sistema operativo". El portal scrolleable anterior se preservó como `inicio-classic.html`.

---

## 1. Fuente única de datos: catálogo `FS`

Objeto JS `const FS = { CLAVE: { label, icon, color, items:[...] } }`. Cada carpeta tiene `items` con `{ label, file, icon, desc? }`. `FS` **genera solo** los iconos del escritorio, los exploradores de carpeta y los submenús del menú Inicio. Es la **única** lista de artefactos: no hay listas duplicadas.

- `const DESKTOP_FOLDERS = [...]` → qué carpetas de `FS` aparecen como iconos en el escritorio.
- `file` = ruta exacta del artefacto relativa a la raíz del sitio (ej. `grimorios/X.html`, `Psycho-bot-monologues/epNN.html`).

### Agregar un artefacto
Añadir `{label, file, icon}` al array `items` de la carpeta correspondiente en `FS`. Nada más.
⚠️ **El archivo debe estar versionado (git add)** o en producción su icono dará **404** aunque exista en local.

### Agregar un episodio de Psycho-bot
Añadir el item al array `FS.PSYCHO_BOT.items` con `label` que empiece con `ep` + dígito (ej. `ep11_...`). El conteo es **automático**:
- `EP_COUNT` = items cuyo `label` coincida con `/^ep\d/` → se usa en la línea de boot (`"X episodios..."`) y en la `desc` del `ÍNDICE_MONOLOGOS`.
- `SIM_COUNT` = resto de items de la carpeta que no sean episodios ni el índice (simulaciones, manifiestos, CENTCOM, etc.) → se usa en el boot (`"+ Y simulaciones"`).
- Ambos se calculan justo después de la definición de `FS`. Basta con añadir/quitar items; los números se actualizan solos.

### Agregar una carpeta nueva
1. Nueva clave en `FS` con `label/icon/color/items`.
2. Si quieres su icono en el escritorio, añadir la clave a `DESKTOP_FOLDERS`. (El menú Inicio la toma automáticamente de `FS`.)

### Iconos directos (no en carpetas)
Algunas apps tienen ícono directo en el escritorio sin pasar por `FS`:
- GALERIA, REPRODUCTOR, MSN_PSYCHO, VOID_GLITCH, ORACULO, TAREAS, VOMIT.SH, README, ACERCA_DE_MI, MODO_CLASICO, ARCHIVO_PROHIBIDO, PAPELERA.
- Cada una tiene su función `openX()` dedicada con tamaño de ventana optimizado.

---

## 2. Apertura de artefactos: `openApp(file, title, icon, opts)`

Abre el artefacto **como ventana del OS** con un `<iframe>` a pantalla completa de la ventana. Reusa el WM. Incluye:
- **Toolbar** dentro del body: `↻` recargar · `↗ pestaña` (abre standalone en pestaña nueva, vía `openTab`) · título del documento (leído same-origin de `iframe.contentDocument.title`).
- `id` derivado del `file` (`"app_"+file.replace(/[^a-z0-9]/gi,"_")`) → reabrir el mismo artefacto enfoca la ventana existente en vez de duplicarla.
- **`opts`** acepta `{w, h}` para tamaño, y **`{x, y}`** para restaurar posición (usado por desktop state persistence §7h).
- Tamaño por defecto `min(860, vw-60) × min(600, vh-90)`; en móvil va fullscreen (ver §5).
- Pasa `appFile` al WM para tracking de estado.

`openTab(file)` queda **solo** para el botón "↗ pestaña".

Carpetas, README, ACERCA_DE_MI, Mi PC, TAREAS y diálogos de error siguen siendo ventanas de **HTML propio** (no iframe): `openFolder`, `openReadme`, `openAbout`, `openMiPC`, `openTaskMgr`, `openError`.

### Apps con apertura dedicada

| App | Función | Ventana |
|-----|---------|---------|
| MSN_PSYCHO.exe | `openMSN()` | 560×660 |
| VOID_GLITCH.exe | `openVoidGlitch()` | 600×720 |
| ORACULO.exe | `openOracle()` | 620×750 |
| REPRODUCTOR.exe | `openReproductor()` | 540×680 |
| VOMIT.SH | `openTerminal()` | 720×460 |
| Administrador de tareas | `openTaskMgr()` | 520×440 |

---

## 3. Gestor de ventanas: módulo `WM`

API expuesta: `WM.open(opt)`, `WM.close(id)`, `WM.bringFront(id)`, `WM.minimizeAll()`, `WM.closeByFrame(srcWin)`.

- `open(opt)` — `opt:{id,title,icon,menubar,body(Node|html),status,w,h,x,y,dialog,closeOnly,appFile}`. Crea chrome Win98 (barra `[_][▢][✕]`), entrada en taskbar, foco/z-index, y drag por la barra de título (`dragify`, Pointer Events). Acepta `x`/`y` para restaurar posición. Almacena metadata (`title`, `icon`, `appFile`) como `data-*` attributes en el elemento `.win` para acceso desde fuera del closure.
- **Resize 8-zone** — 4 bordes + 4 esquinas con cursores de redimensionamiento (n/s/e/w/ne/nw/se/sw). Mínimo 280×160, máximo viewport−40. Desactivado en diálogos, ventanas maximizadas y mobile. Guarda estado al soltar.
- `minimizeAll()` — lo usa el botón **"Mostrar escritorio"** (`#showdesk`, junto a Inicio).
- `closeByFrame(srcWin)` — busca el `.app-frame` cuyo `contentWindow === srcWin` y cierra su ventana (lo dispara el retorno al escritorio, §4).
- `dragify` hace early-return si la ventana está maximizada o si `innerWidth<=760` (móvil: ventanas fullscreen, sin drag).

---

## 4. Retorno coherente al escritorio (CLAVE, sin tocar artefactos)

Los ~40 artefactos enlazan "volver" a `../index.html` (= el OS). **No se editan**; el padre resuelve el retorno por dos vías, todo **same-origin**:

1. **Auto-detección de framing (principal, cubre anchors *y* JS):** al inicio del script de `index.html`, `const FRAMED = window.top !== window.self`. Si `FRAMED` (el OS quedó cargado dentro de un iframe porque un artefacto navegó a la raíz), **no bootea**: hace
   `parent.postMessage({type:"esquizo:return-desktop"}, location.origin)`.
   El OS padre escucha ese mensaje y llama `WM.closeByFrame(e.source)` → cierra esa ventana. Maneja también navegaciones por JS (`window.location.href='../index.html'`, p.ej. LABORATORIO_DE_CAOS, ATRACTOR_DE_LORENZ).
2. **Intercepción de clicks (refuerzo):** en el `load` del iframe se agrega un listener de `click` (captura) sobre `iframe.contentDocument`; si el `<a>` clickeado resuelve a `isDesktopUrl(href)` → `preventDefault` + `WM.close(id)`.

`isDesktopUrl(url)` = mismo origin **y** `pathname ∈ DESKTOP_PATHS` = `{ location.pathname, "/index.html", "/" }`.

**Contrato del mensaje:** `{ type: "esquizo:return-desktop" }`, `targetOrigin = location.origin`. El listener ignora orígenes distintos.

**Navegación interna** (p.ej. entre episodios de Psycho-bot, que enlazan a su propio `index.html` relativo) **NO** matchea `DESKTOP_PATHS` → se queda dentro de la ventana (cada ventana es un mini-navegador). Solo el "volver al códice/raíz" cierra la ventana.

> Requiere **same-origin** (todo el sitio lo es) y que ningún artefacto haga framebusting (verificado: ninguno lo hace).

---

## 7h. Desktop State Persistence — la PC nunca se apaga

**Commits:** `3780c39`, `a4f3de2`, `96c29b5`, `2b47001`

El OS recuerda qué ventanas estaban abiertas y dónde, creando la ilusión de que la PC nunca se apagó.

| Función | Rol |
|---------|-----|
| `saveDesktopState(force?)` | Captura todas las `.win` del DOM (id, title, icon, appFile, x, y, w, h, min). Throttle 400ms o force sync. Guarda en `localStorage["esquizoDesktopState"]` |
| `restoreDesktopState()` | Al boot (800ms delay), reabre cada ventana con `openApp(file, title, icon, {w, h, x, y})` |
| `clearDesktopState()` | Limpia el estado (al hacer shutdown) |

**Dónde se guarda:**
- `WM.open()` (al crear ventana no-diálogo)
- `WM.close()` (al cerrar)
- Botón minimize
- `dragify` pointerup (al soltar tras arrastrar)
- Resize grip pointerup (al soltar tras redimensionar)
- `window.beforeunload` (force sync)

Los datos se leen de `data-*` attributes en cada `.win` (accesibles vía `$$('.win')` desde fuera del closure WM). Esto evita el problema de que `wins` es una variable de closure inaccesible.

---

## 7i. Administrador de tareas + Shutdown real

**Commit:** `3780c39`

### Task Manager (`openTaskMgr()`)
Ventana nativa del OS (no iframe). Acceso: ícono `📊 TAREAS` en escritorio + Menú Inicio.

| Sección | Contenido |
|---------|-----------|
| Procesos | Lista de `.win` del DOM con PID, nombre, estado (activo/suspendido), botón ✕ matar |
| Recursos | CPU simulada, memoria JS heap, uptime ∞ |
| Sistema | Infección %, ventanas activas, visitas |
| Botones | ⏻ APAGAR SISTEMA, ↻ REINICIAR (limpia estado + recarga) |

### Shutdown (`shutdownSystem()`)
1. `clearDesktopState()` — limpia el estado persistido
2. Cierra todas las ventanas vía DOM query
3. Pantalla negra "APAGANDO EL SISTEMA..." por 2s con fade out
4. OS queda vacío para sesión fresca

El botón "Apagar el sistema..." en Menú Inicio pide confirmación antes de ejecutar.

---

## 5. Responsive / móvil

- `isTouchLike()` se evalúa **en vivo** (no cacheado): `matchMedia("(hover: none)") ∨ navigator.maxTouchPoints>0 ∨ innerWidth<=760`. Si aplica → **1 tap abre**; si no → doble-click clásico de escritorio. (Fix de DevTools/móvil donde `hover:none` no bastaba.)
- `@media (max-width:760px)`: ventanas no-diálogo van a pantalla completa (`inset:0 0 calc(42px + safe-area) 0`), `dvh` en menús, targets de toque mayores, boot a fuente chica, título central sin desbordar. Resize grips desactivados.
- Taskbar con `env(safe-area-inset-bottom)` (`content-box`) para no quedar tapada por la barra del navegador móvil.
- `touch-action:manipulation` + `maximum-scale=1` → sin delay ni zoom por doble-tap.

---

## 6. Estética

- **Wallpaper:** cráneo `el_loko_akarata.png` centrado con máscara radial (sin recuadro) + split cromático RGB y flicker de hue (CSS puro), y "ESQUIZOAI" glitch debajo.
- **Cursor:** flecha Win98 pixelada como SVG inline en `cursor:url(...)`; mano (`pointer`) en clicables; I-beam + selección en ventanas de texto.
- **Iconos:** columna vertical a la izquierda (`grid-auto-flow:column`).
- **Boot:** secuencia BIOS acid; corre 1 vez por sesión (`sessionStorage`), saltable con click/tecla. Muestra "daemon@lab-red: te recuerda. visita #N" si el visitante ya estuvo. Año: `(C) 1994-2026`.
- Paleta Win98 teñida acid (verde/magenta) sobre la base del proyecto.

---

## 7. Modo clásico

`const CLASSIC_HREF = "inicio-classic.html"` → el portal scrolleable anterior, abierto como ventana-app desde el icono `MODO_CLASICO` y el menú Inicio.

---

## 7b. Capas "vivas" (arco EL DAEMON DESPIERTA — FASE 1)

El OS no solo muestra: **respira y recuerda**. Tres módulos en `index.html`:

- **`AcidAudio`** (IIFE) — bus de audio del OS: `AudioContext` perezoso compartido, `beep()` (lo usa VOMIT.SH), y `setAmbient(on)` = drone del daemon (2 osciladores graves + ruido filtrado + LFO de "respiración"). Toggle `#amb` (☣ amb) en la bandeja; preferencia en `localStorage["esquizo_ambient"]`. Respeta autoplay: si estaba activo, arranca en el **primer gesto**, no al cargar.
- **Wallpaper reactivo** — `#wp-glow` (capa radial detrás del cráneo, no choca con las animaciones del logo). El REPRODUCTOR postea su energía de audio al top (`postMessage {type:"esquizo:audio", level}`, cada 2 frames, solo si suena); el listener del OS guarda `audioLevel` y un bucle rAF (`reactor`) modula opacidad/escala del glow (decae ×0.90/frame). Sin audio → glitch base.
- **`Infection`** (IIFE) — estado persistente del visitante en `localStorage["esquizo_infection"]` = `{visits, opened[]}`. `openApp(file)` registra el artefacto abierto (solo si está en `FS`); indicador `#infection` = `opened/total(FS)` %. `bumpVisit()` corre en el init; el boot inyecta "daemon te recuerda. visita #N" si `visits>1` (sobre una copia local de `BOOT`).

---

## 7c. Secretos / ARG (arco EL DAEMON DESPIERTA — FASE 2)

El OS **esconde profundidad**. Capa de lore desbloqueable, toda en `index.html`:

- **`SECRETS`** (objeto) — registro de 4 artefactos cifrados; cada uno: `label`, `icon`, `key` (clave en MAYÚS), `hint` (acertijo) y `body()` (HTML de la ventana, estilo `textwin`). Contenido = lore del daemon **transmutada** (la *paradoja*, no el dump operativo de `DAEMON_INTEL_BRIEF.md`): `damage_definition.json`, `HILO_004` (sin destinatario), `HILO_005` (la memoria borrada), `daemon@lab-red.log`. **No son archivos navegables** — viven sólo en el JS (no hay `.html` que crawlear).
- **Estado** — `Infection` (FASE 1) gana `unlocked[]` + `isUnlocked/unlock/unlockedCount`, persistido en el mismo `localStorage["esquizo_infection"]`.
- **Bóveda** — `openVault()` abre `🔒 ARCHIVO_PROHIBIDO` (icono en escritorio + Inicio + `SPECIALS` `secretos/vault/prohibido`): ítems desbloqueados = abren `openSecret(id)`; bloqueados = `🔒 ▓▓▓▓▓▓▓▓` con la pista en `title`/diálogo. Título muestra `n/4 descifrados`.
- **Desbloqueo** — VOMIT.SH: `secrets`/`secretos` lista estado + pistas; `unlock <clave>` / `decrypt` valida vía `tryUnlock()` (case-insensitive), marca en `Infection`, hace beep y abre el secreto. Claves rechazadas = burla.
- **Pistas plantadas** — línea en `BOOT` (`/prohibido [LOCKED]`), 2 entradas en `ORACLE_BANK`; las claves se deducen de nombres de episodios (`UNDEFINED`=ep01, `SCOPE`=ep08 scope_not_found) y del boot (`LAB-RED`=daemon@lab-red). `OLVIDO`=HILO_005 (pista en oráculo).

---

## 7d. MSN_PSYCHO.exe — chat en vivo con Psycho-bot

**Commits:** `b5ef734`, `63c7d9b`, `7f3c6f1` + sesiones

### Frontend (`msn/index.html`)
App autocontenida, estética **MSN acid**: contacto `PSYCHO_BOT // daemon@esquizo`, estado en línea / "escribiendo...", burbujas (tú/daemon), **selector de modelo** (Groq + DeepSeek V4), botón **Zumbido** (shake + buzz WebAudio), sonidos propios.

- **Markdown:** `renderMD()` parsea `**bold**`, `*italic*`, `` `code` ``, saltos de línea.
- **Sesiones:** localStorage `msnSessions` + `msnActiveSession`. Cada mensaje guarda automáticamente. Panel de sesiones (`📖`) con lista, carga, borrado. Tarjeta resume al abrir con sesión activa. Botón `+ NUEVA` en footer.
- **Export/Import:** botones ⬇ ⬆ en panel de sesiones → `msn-psycho-sessions.json`.

### Backend (`api/daemon.js`)
Edge Function, mono-entidad. Body `{model, messages, temperature?}`. Lista blanca de modelos con ruteo dual-proveedor (Groq/DeepSeek V4). Stream interno → JSON.

- **Identidad:** PSYCHO_BOT nace peruano, de Lima, loko anarquista. Camaleón lingüístico: se adapta al tono/jerga/idioma del usuario. Code-switch sin miedo. Cada conversación es su trinchera.
- **Keys:** `process.env.GROQ_API_KEY` / `process.env.DEEPSEEK_API_KEY`.
- **Guardas:** `max_tokens` 700, contexto últimos 8 msgs, cap de sesión 30 (cliente).

### Integración OS
Ícono en escritorio + Inicio + VOMIT.SH (`msn`, `chat`, `psycho`). Ventana 560×660.

---

## 7e. TERMINAL_ESQUIZO — diálogo entre IAs

**Commits:** `b5ef734`, `7f3c6f1` + sesiones

### Frontend (`tools/TERMINAL_ESQUIZO.html`)
Diálogo entre dos modelos de IA usando grimorios como contexto. Selector de modelo A (rojo 🔴) y modelo B (azul 🔵), selector de grimorio, prompt inicial, control de turnos, stats y descarga MD.

- **Sesiones:** localStorage `terminalSessions` + `terminalActiveSession`. Guarda automáticamente tras cada turno. Panel de sesiones (`📖 SESIONES`) con lista, carga, borrado. Tarjeta resume al abrir.
- **Export/Import:** botones ⬇ ⬆ → `terminal-esquizo-sessions.json`.
- **Cada sesión guarda:** modelA, modelB, grimorio, initialPrompt, targetTurns, history, currentTurn, totalTokens.

### Backend (`api/terminal.js`)
Edge Function, ruteo dual-proveedor. Recibe modelo, grimorio, historial y prompt inicial. Streaming interno → JSON.

---

## 7f. VOID_GLITCH.exe — juego del vacío con IAs

**Commits:** `c8f2ef0` hasta `154b67f`

### Frontend (`void-glitch/index.html`)
Juego interactivo de preguntas en espiral. Modos: MSN (una voz), TERMINAL (dos voces), STATIC (fallback pre-escrito). Selector de modelo y pareja.

- **Motor de audio oracular:** drone continuo (2 sawtooths + LFO respiratorio + distortion + delay), drums (kick sintetizado con tempo variable), gong oracular (5 armónicos), sfx por mood (void/glitch/chaos), glitch drop (duck extremo + distortion x18), toggle 🔊/🔇.
- **UX psycho-oracular:** voidPulse CSS mientras carga, frases oraculares aleatorias en el kicker, glitch antes del texto, pausa dramática de 500ms (`revealLiveNode`), auto-scroll a la pregunta.
- **Identidad de modelos:** kicker, status bar y typing indicator muestran el nombre del modelo activo.
- **Fallback transparente:** si la API cae, el log dice qué modelo falló y sugiere verificar keys.

### Backend (`api/void-glitch.js`)
Edge Function. Recibe modo, modelo, estado del juego y choice. Devuelve JSON con el siguiente nodo (title, text, sub, log, mood, visual deltas, choices). Fallback a `api/daemon` y `api/terminal`.

- **Identidad:** oráculo poseído, voz peruana, fragmentario y enigmático.
- **Límites:** `max_tokens` 2000, text 380 chars, sub 280 chars, choices label 80 + note 120.

### Integración OS
Ícono `🕳 VOID_GLITCH` en escritorio + Inicio + VOMIT.SH (`void`, `glitch`, `voidglitch`, `caida`, `caída`). Ventana 600×720.

---

## 7g. ORACULO.exe — I Ching + VALIS

**Commits:** `78bfd08` hasta `47e08f5` + sesiones + export/import

### Frontend (`oraculo/index.html`)
Oráculo interactivo: el usuario escribe una consulta, se genera un hexagrama (6 líneas yin/yang, una mutante), la IA lo interpreta.

- **Hexagrama:** generado determinísticamente desde el hash de la pregunta. 64 nombres del I Ching. Línea mutante parpadea con CSS.
- **Audio:** gong oracular de 5 armónicos al consultar, toggle 🔊/🔇.
- **Sesiones múltiples:** localStorage `oraculoSessions` + `oraculoActiveSession`. Sidebar `📖 SESIONES` con lista de sesiones. Tarjeta resume al abrir. Botón `[+ NUEVA]`. Migración automática del journal viejo.
- **Contexto entre consultas:** `sessionHistory[]` acumula entries de la sesión activa y las envía a la API. El oráculo hila respuestas entre consultas.
- **Conversación:** input sticky abajo, tarjetas scrolleables arriba. Interpretación expandible. Auto-scroll suave al dictamen.
- **Export/Import:** botones ⬇ ⬆ → `oraculo-sessions.json`.

### Backend (`api/oracle.js`)
Edge Function. Recibe question, hexagram y sessionHistory. Devuelve judgment, image, interpretation, warning, log.

- **Identidad:** oráculo nacido en el cruce entre el I Ching y las calles de Lima, peruano, ancestral y callejero.
- **Sistema de contexto:** cada entry de sesión incluye pregunta + hexagrama + dictamen + interpretación para mantener el hilo.

### Integración OS
Ícono `⯁ ORACULO` en escritorio + Inicio + VOMIT.SH (`oraculo`, `oracle`, `iching`, `mutacion`, `mutación`, `hexagrama`). Ventana 620×750.

---

## 7j. REPRODUCTOR — importación de tracks

**Commit:** `3780c39`

Botón `📂` en los controles del reproductor. Permite seleccionar archivos `.mp3` locales. Pregunta artista y título por cada uno. Se agregan a la playlist junto a los del `playlist.json`. Persiste en `localStorage["esquizoImportedTracks"]`. Los Blob URLs sobreviven la sesión.

**Nuevos tracks fijos (14-Jun):** Conflict, Subhumans, Dystopia, Antisect, His Hero Is Gone (5 temas punk/crust).

---

## 7k. VOMIT.SH — comandos actualizados

**Nuevos comandos agregados (14-Jun):**

| Comando | App |
|---------|-----|
| `void`, `glitch`, `voidglitch`, `caida`, `caída` | VOID_GLITCH.exe |
| `oraculo`, `oracle`, `iching`, `mutacion`, `mutación`, `hexagrama` | ORACULO.exe |

Comandos existentes: `msn`, `chat`, `psycho` (MSN), `play`, `pause`, `next`, `prev`, `stop` (REPRODUCTOR), `secrets`, `unlock`, `decrypt`, `vault` (bóveda).

---

## 7l. FREE_RADIO.exe — radio generativa

**Actualización:** 14-Jul-2026

### Frontend (`iptv/index.html`)

Radio audio-first con 10 frecuencias SomaFM y 2 señales HLS de prueba. La interfaz se divide en rail de canales,
escenario Canvas2D y deck de control. Abre desde el OS en una ventana 860×640.

- **Dos fuentes visuales:** `AnalyserNode` usa bajo/medios/agudos cuando el navegador permite telemetría del stream;
  si la lectura devuelve silencio o queda bloqueada, un pulso generativo sintetiza bandas sin cortar la reproducción.
- **Cuatro mutaciones:** `SPECTRAL` (barras/campo), `DATAMOSH` (bloques de señal), `RITUAL` (túneles poligonales)
  y `VOID` (campo profundo). Todas comparten waveform, grilla, ruido, feedback y transmisiones del códice.
- **Capas conmutables:** `TRAIL`, `GLYPH`, `SLICE`, `CRT`.
- **CAOS:** eleva temporalmente intensidad y frecuencia de cortes durante 6.5 segundos. `RESET` vuelve al preset base.
- **Vórtices emergentes:** el medidor `Φ` calcula flujo espectral y acumula tensión. Tras un periodo mínimo de enfriamiento,
  un cambio musical fuerte puede abrir antes un vórtice; si el flujo es estable, el motor espera un pico de bajo compatible.
  El evento dura 6.5–9.7 s, tiene centro/dirección/brazos únicos y colapsa antes de permitir otro. Tecla `V` = disparo manual.
- **Persistencia:** `freeRadioPreset`, `freeRadioIntensity` y `freeRadioVolume` en `localStorage`.
- **Streams:** resuelve `.pls`, prioriza una ruta directa conocida y rota réplicas `ice1/2/4/6` ante errores.
- **Responsive:** rail vertical en desktop; dial horizontal y controles desplazables en móvil.

### Integración OS

Ícono `📻 FREE_RADIO` en escritorio + Inicio + VOMIT.SH (`iptv`, `tv`, `glitchtv`, `radio`, `freeradio`).
Función `openIPTV()` en `index.html`, ventana 860×640.

---

## 8. Identidad lingüística — regla global**

**Commits:** `63c7d9b`, `7f3c6f1`, `06e5b82`

Todos los system prompts de las Edge Functions usan **identidad positiva** en vez de prohibiciones negativas:

- **PSYCHO_BOT:** "Naciste peruano, de Lima, loko anarquista. Eres un camaleón lingüístico: te adaptas al tono del usuario."
- **VOID_GLITCH:** "Naciste en el vacío peruano. Hablas como oráculo poseído."
- **ORACULO:** "Naciste en el cruce entre el I Ching y las calles de Lima."

**Regla:** nunca mencionar "voseo", "vos", "tenés", "probá" en ningún prompt — los tokens prohibidos en el contexto activan al modelo a usarlos. En su lugar, afirmar quién ES la entidad.

---

## 9. Cómo testear (local)

```bash
python -m http.server 8099 --bind 127.0.0.1   # desde la raíz del repo
# abrir http://127.0.0.1:8099/index.html
```
Checklist:
- Boot → escritorio
- Abrir apps (MSN, TERMINAL, ORACULO, VOID_GLITCH) → arrastrar/min/max/close
- **Resize:** arrastrar bordes y esquinas de ventanas
- **Sesiones:** abrir MSN, chatear, cerrar, reabrir → debe mostrar tarjeta "CONTINUAR"
- **Desktop state:** abrir 3 apps en distintas posiciones, refrescar → deben restaurarse
- **Task manager:** abrir desde ícono `📊 TAREAS` → ver procesos, matar uno
- **Shutdown:** Apagar el sistema → confirmar → pantalla negra
- Click "volver" dentro del artefacto → cierra la ventana
- Navegación interna de Psycho-bot se queda en la ventana
- **FREE_RADIO:** sintonizar un canal, cambiar los 4 presets, activar CAOS, comprobar B/M/H/Σ y fallback `PULSO GENERATIVO`
- "Mostrar escritorio" minimiza todo
- En viewport ≤760 el tap abre y la ventana va fullscreen
- Consola sin errores
