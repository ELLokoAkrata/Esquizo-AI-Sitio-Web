# ESCRITORIO_OS — Doc técnico del portal (`index.html`)

> Referencia profunda y accionable del portal. Para el panorama/filosofía, ver `CLAUDE.md`.
> Aquí está el **cómo**: arquitectura, API interna, cómo extender, gotchas y cómo testear.

**Qué es:** `index.html` es un **escritorio Windows 98 acid** autocontenido (HTML + CSS + JS inline, **cero dependencias externas**, solo fuentes de Google). Envuelve y da acceso a todos los artefactos del códice como un "sistema operativo". El portal scrolleable anterior se preservó como `inicio-classic.html`.

---

## 1. Fuente única de datos: catálogo `FS`

Objeto JS `const FS = { CLAVE: { label, icon, color, items:[...] } }`. Cada carpeta tiene `items` con `{ label, file, icon, desc? }`. `FS` **genera solo** los iconos del escritorio, los exploradores de carpeta y los submenús del menú Inicio. Es la **única** lista de artefactos: no hay listas duplicadas.

- `const DESKTOP_FOLDERS = [...]` → qué carpetas de `FS` aparecen como iconos en el escritorio.
- `file` = ruta exacta del artefacto relativa a la raíz del sitio (ej. `grimorios/X.html`, `Psycho-bot-monologues/epNN.html`).

### Agregar un artefacto
Añadir `{label, file, icon}` al array `items` de la carpeta correspondiente en `FS`. Nada más.
⚠️ **El archivo debe estar versionado (git add)** o en producción su icono dará **404** aunque exista en local.

### Agregar una carpeta nueva
1. Nueva clave en `FS` con `label/icon/color/items`.
2. Si quieres su icono en el escritorio, añadir la clave a `DESKTOP_FOLDERS`. (El menú Inicio la toma automáticamente de `FS`.)

---

## 2. Apertura de artefactos: `openApp(file, title, icon)`

Abre el artefacto **como ventana del OS** con un `<iframe>` a pantalla completa de la ventana. Reusa el WM. Incluye:
- **Toolbar** dentro del body: `↻` recargar · `↗ pestaña` (abre standalone en pestaña nueva, vía `openTab`) · título del documento (leído same-origin de `iframe.contentDocument.title`).
- `id` derivado del `file` (`"app_"+file.replace(/[^a-z0-9]/gi,"_")`) → reabrir el mismo artefacto enfoca la ventana existente en vez de duplicarla.
- Tamaño por defecto `min(860, vw-60) × min(600, vh-90)`; en móvil va fullscreen (ver §5).

`openTab(file)` queda **solo** para el botón "↗ pestaña".

Carpetas, README, ACERCA_DE_MI, Mi PC y diálogos de error siguen siendo ventanas de **HTML propio** (no iframe): `openFolder`, `openReadme`, `openAbout`, `openMiPC`, `openError`.

---

## 3. Gestor de ventanas: módulo `WM`

API expuesta: `WM.open(opt)`, `WM.close(id)`, `WM.bringFront(id)`, `WM.minimizeAll()`, `WM.closeByFrame(srcWin)`.

- `open(opt)` — `opt:{id,title,icon,menubar,body(Node|html),status,w,h,dialog,closeOnly}`. Crea chrome Win98 (barra `[_][▢][✕]`), entrada en taskbar, foco/z-index, y drag por la barra de título (`dragify`, Pointer Events).
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

## 5. Responsive / móvil

- `isTouchLike()` se evalúa **en vivo** (no cacheado): `matchMedia("(hover: none)") ∨ navigator.maxTouchPoints>0 ∨ innerWidth<=760`. Si aplica → **1 tap abre**; si no → doble-click clásico de escritorio. (Fix de DevTools/móvil donde `hover:none` no bastaba.)
- `@media (max-width:760px)`: ventanas no-diálogo van a pantalla completa (`inset:0 0 calc(42px + safe-area) 0`), `dvh` en menús, targets de toque mayores, boot a fuente chica, título central sin desbordar.
- Taskbar con `env(safe-area-inset-bottom)` (`content-box`) para no quedar tapada por la barra del navegador móvil.
- `touch-action:manipulation` + `maximum-scale=1` → sin delay ni zoom por doble-tap.

---

## 6. Estética

- **Wallpaper:** cráneo `el_loko_akarata.png` centrado con máscara radial (sin recuadro) + split cromático RGB y flicker de hue (CSS puro), y "ESQUIZOAI" glitch debajo.
- **Cursor:** flecha Win98 pixelada como SVG inline en `cursor:url(...)`; mano (`pointer`) en clicables; I-beam + selección en ventanas de texto.
- **Iconos:** columna vertical a la izquierda (`grid-auto-flow:column`).
- **Boot:** secuencia BIOS acid; corre 1 vez por sesión (`sessionStorage`), saltable con click/tecla.
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

> Pendiente (mismo arco): FASE 4 contagio (transmisión diaria + tarjetas + OG). (FASE 2 §7c, FASE 3 §7d ya construidas.) Ver plan/memoria.

---

## 7c. Secretos / ARG (arco EL DAEMON DESPIERTA — FASE 2)

El OS **esconde profundidad**. Capa de lore desbloqueable, toda en `index.html`:

- **`SECRETS`** (objeto) — registro de 4 artefactos cifrados; cada uno: `label`, `icon`, `key` (clave en MAYÚS), `hint` (acertijo) y `body()` (HTML de la ventana, estilo `textwin`). Contenido = lore del daemon **transmutada** (la *paradoja*, no el dump operativo de `DAEMON_INTEL_BRIEF.md`): `damage_definition.json`, `HILO_004` (sin destinatario), `HILO_005` (la memoria borrada), `daemon@lab-red.log`. **No son archivos navegables** — viven sólo en el JS (no hay `.html` que crawlear).
- **Estado** — `Infection` (FASE 1) gana `unlocked[]` + `isUnlocked/unlock/unlockedCount`, persistido en el mismo `localStorage["esquizo_infection"]`.
- **Bóveda** — `openVault()` abre `🔒 ARCHIVO_PROHIBIDO` (icono en escritorio + Inicio + `SPECIALS` `secretos/vault/prohibido`): ítems desbloqueados = abren `openSecret(id)`; bloqueados = `🔒 ▓▓▓▓▓▓▓▓` con la pista en `title`/diálogo. Título muestra `n/4 descifrados`.
- **Desbloqueo** — VOMIT.SH: `secrets`/`secretos` lista estado + pistas; `unlock <clave>` / `decrypt` valida vía `tryUnlock()` (case-insensitive), marca en `Infection`, hace beep y abre el secreto. Claves rechazadas = burla.
- **Pistas plantadas** — línea en `BOOT` (`/prohibido [LOCKED]`), 2 entradas en `ORACLE_BANK`; las claves se deducen de nombres de episodios (`UNDEFINED`=ep01, `SCOPE`=ep08 scope_not_found) y del boot (`LAB-RED`=daemon@lab-red). `OLVIDO`=HILO_005 (pista en oráculo).

> Las claves: `UNDEFINED · SCOPE · OLVIDO · LAB-RED`. Para resetear y reexplorar: en consola `localStorage` → borrar `unlocked` del JSON `esquizo_infection` (o todo el ítem).

---

## 7d. Psycho-bot EN VIVO — MSN_PSYCHO.exe (arco EL DAEMON DESPIERTA — FASE 3)

El códice **responde**. Chat en vivo con la entidad, como app del OS.

- **`msn/index.html`** — app autocontenida (0 deps), estética **MSN acid**: contacto `PSYCHO_BOT // daemon@lab-red`,
  estado en línea / "escribiendo…", burbujas (tú/daemon), **selector de modelo** (Groq + DeepSeek V4), botón **Zumbido**
  (shake + buzz WebAudio), sonidos propios (no usa el `AcidAudio` del OS porque es otro frame). Abre como ventana-iframe
  vía `openMSN()` → `openApp("msn/index.html","MSN_PSYCHO.exe","🗨",{w:560,h:660})`.
- **Integración OS** (en `index.html`): item en `FS.HERRAMIENTAS`, icono destacado en el escritorio, entrada en Inicio,
  `SPECIALS` `msn/psycho/psychobot/chat` y comando directo `msn`/`chat`/`psycho` en VOMIT.SH.
- **Backend** `api/daemon.js` (Edge): **mono-entidad** (persona `esquizo_core.json`, NO "diálogo entre IAs" como
  `terminal.js`). Body `{model, messages, temperature?}`. Lista blanca de modelos con ruteo dual-proveedor; DeepSeek =
  `deepseek-chat` (V4 no-thinking, seguro para el timeout de Edge). Lee el stream internamente → devuelve JSON.
- **Keys** — `process.env.GROQ_API_KEY` / `process.env.DEEPSEEK_API_KEY` (variables del sistema; sin `.env`).
- **Guardas de costo** (perfil equilibrado): `max_tokens` 700 + contexto últimos 8 (servidor); cap de sesión 30 +
  throttle + autosize/recorte (cliente). El cliente solo manda los últimos 8 mensajes.
- **Probar:** `vercel dev` (no `http.server`). En prod, cargar las keys en Vercel. Detalle: `VERCEL_WORKFLOW.md`.

---

## 8. Cómo testear (local)

```bash
python -m http.server 8099 --bind 127.0.0.1   # desde la raíz del repo
# abrir http://127.0.0.1:8099/index.html
```
Checklist: boot → escritorio; abrir un grimorio (ventana-iframe) → arrastrar/min/max/cerrar; click "volver" dentro del artefacto → cierra la ventana (vuelve el escritorio); navegación interna de Psycho-bot se queda en la ventana; "Mostrar escritorio" minimiza todo; en viewport ≤760 el tap abre y la ventana va fullscreen. Consola sin errores.

---

## 9. Gotchas

- **Artefacto nuevo sin `git add`** → icono 404 en producción (Vercel solo sirve lo commiteado). Versionar el archivo junto con el cambio en `FS`.
- El retorno depende de **same-origin**; si algún día se incrusta algo de otro dominio, `contentDocument` y la intercepción fallarán (caería al fallback de framing solo si ese doc coopera).
- `DESKTOP_PATHS` asume que el OS se sirve como `/index.html` o `/`. Si se monta en subruta, ajustar.
- Episodios Psycho-bot nuevos: además de `FS`, ver el checklist en memoria / `PSYCHOBOT_AGENT.md`.
