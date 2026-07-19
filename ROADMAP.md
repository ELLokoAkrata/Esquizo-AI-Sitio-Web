# 🗺 ROADMAP — "EL DAEMON DESPIERTA"

> Tablero vivo del arco que convierte el códice en **organismo**: cuerpo (OS), voz (Psycho-bot),
> memoria (grimorios/ops), sistema nervioso (proxies de IA). Se ejecuta **por fases, de menor a mayor riesgo**.
> Aquí marcamos lo que ya está listo. Contexto: `AGENTS.md`, `PROJECT_CONTEXT.md` y `AGENT_MEMORY.md`.
> Los planes privados de cualquier proveedor son temporales y no sustituyen este tablero.
>
> Leyenda: `[x]` hecho y desplegado · `[~]` en progreso · `[ ]` pendiente
>
> **Última actualización:** 2026-07-18

---

## ✅ Base ya construida (antes del arco)

- [x] Portal = **escritorio Win98 acid** (`index.html`, OS autocontenido, catálogo `FS`)
- [x] **GALERIA.exe** — sintografía (manifest-driven)
- [x] **REPRODUCTOR.exe** — ruidero punk + ecualizador WinAmp + control desde VOMIT.SH
- [x] **VOMIT.SH** — terminal del sistema (comandos vomitivos, abre artefactos)
- [x] **Glitch Text Generator** (15 formatos) · **DENTAKORV** · grimorios · Psycho-bot (8 eps) · RECON · GLITCH.CAM
- [x] Renombre `TRABAJO_VISUAL` → **EXPERIENCIAS_GENERATIVAS** (no confundir con la galería)
- [x] Docs de onboarding: **AGENTS.md** + **GUIA_SCRIPTS.md**
- [x] **Continuidad neutral de agentes** — contexto, memoria, estado y protocolo versionados sin depender de un proveedor

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
**Estado: ✅ DESPLEGADA — Groq confirmado en producción; DeepSeek queda sujeto a su key** · riesgo ALTO · costo de API

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
- [x] Usa únicamente el proxy público `api/daemon.js`; no depende de sistemas privados del creador.
- [x] `.gitignore` endurecido (`.env*`, `.vercel`) para no filtrar keys locales
- [x] **Probar la IA en vivo** — el daemon con Groq respondió en producción y confirmó la recepción de `osContext`; `apiBase()` redirige a producción desde `127.0.0.1:8099`. DeepSeek requiere `DEEPSEEK_API_KEY` activa en Vercel.
- [x] **Prueba local con Edge Function confirmada** — MSN recibió respuesta y el backend confirmó `osContext`; el puerto acordado para este repo es `3002` (`npx vercel dev --listen 3002`).
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

## 📻 FASE 5 — FREE RADIO (radio libre con corrupción en tiempo real)
**Estado: 🔶 EN DESARROLLO** · riesgo medio · costo cero de API · dependencia: hls.js (CDN)
> **MVP v2**: radio audio-first con escena Canvas2D generativa, telemetría de frecuencias y fallback visual autónomo.
> Si el navegador permite analizar el stream, bajo/medios/agudos controlan la escena. Si la telemetría cae,
> el pulso generativo mantiene la experiencia viva sin interrumpir la música.

- [x] **`iptv/index.html` v2** — interfaz reconstruida: dial de frecuencias, transporte, metadata, telemetría B/M/H/Σ, intensidad, volumen y estado explícito de señal/análisis.
- [x] **Motor visual generativo por capas** — feedback/trails, waveform, grilla de perspectiva, glyphs, slices, CRT, transmisiones del códice y cuatro mutaciones: `SPECTRAL`, `DATAMOSH`, `RITUAL`, `VOID`.
- [x] **Modo CAOS** — sobrecarga temporal de 6.5 s; `RESET` restaura una señal estable. Preset, intensidad y volumen persisten en `localStorage`.
- [x] **Vórtices por flujo musical** — detector `Φ` acumula tensión a partir de novedad espectral, aceleración de energía y desplazamiento entre bandas. Después de un cooldown, un cambio fuerte adelanta la aparición; una señal hipnótica espera un pico compatible. Cada vórtice genera centro, dirección, brazos, materia absorbida y colapso propios. Tecla secreta `V` fuerza uno.
- [x] **Dial con identidad por emisora** — cada cambio dispara una ráfaga Web Audio de estática, barrido y golpe mecánico. Las 12 frecuencias declaran su propio ADN en `channels.json`: escena Canvas, paleta, glifos, rango de sintonización y banco de frases; todo responde a telemetría o al fallback generativo. Vaporwaves mantiene un sol VHS en el horizonte, ordenador CRT a la izquierda y TV analógica a la derecha; las frases se transmiten dentro de sus pantallas y el vórtice se ancla al centro solar.
- [x] **Audio resiliente** — parser PLS + rotación de réplicas SomaFM; `MediaElementAudioSource`/`AnalyserNode` cuando hay CORS y pulso generativo cuando no hay telemetría.
- [x] **Dual mode conservado** — audio como identidad principal; los 2 canales HLS de prueba siguen disponibles como señal de video corrompible.
- [x] **`iptv/channels.json`** — 10 canales audio SomaFM (Doomed, Dark Zone, Drone Zone, SF 10-33, Deep Space One, Metal Detector, DEF CON, Vaporwaves, Secret Agent, Police Scanner) + 2 video test
- [x] **Integración OS** — icono `📻 FREE_RADIO` en escritorio + Inicio + VOMIT.SH (`iptv`, `radio`, `freeradio`) + función `openIPTV()`
- [x] **Responsive verificado** — 860×640 y 390×780 sin overflow del documento; rail horizontal y controles desplazables en móvil.
- [x] **Streams comprobados** — PLS y stream MP3 SomaFM responden `200/206` y publican CORS `Access-Control-Allow-Origin: *`; no se necesita proxy de audio por defecto.
- [x] **Auditoría de navegador reproducible** — `tests/browser/` aísla Puppeteer y ejecuta FREE_RADIO en Chromium: escritorio/móvil, controles, capas, CAOS/RESET, vórtices manual y automático, consola, recursos locales, rendimiento, capturas y reporte JSON.
- [x] **Audio audible verificado manualmente** — el creador confirmó la reproducción en navegador normal; Chromium headless conserva `403` del stream externo como limitación conocida del entorno automatizado.
- [ ] Importar .m3u externo para canales propios
- [ ] Control de mutaciones desde Psycho-bot / VOMIT.SH

---

## ⊛ FASE 6 — NEXO (consciencia distribuida del OS)
**Estado: ✅ DESPLEGADA · CONTEXTO CONFIRMADO — falta auditoría interactiva completa** · riesgo medio-alto · costo API controlado

**Concepto:** las experiencias LLM conocen el mapa del OS, la actividad relevante y la existencia de las otras
entidades sin fusionar voces ni compartir historiales completos. La memoria transversal es local, visible, selectiva
y puede pausarse o purgarse.

- [x] **Núcleo `js/esquizo-nexo.js`** — registro de entidades, foco del OS, bus `BroadcastChannel` + `localStorage`, pulso limitado (140 eventos) y memoria fijada (36 fragmentos).
- [x] **Fronteras de contexto** — mapa de relaciones por entidad, señales compartidas, eventos privados y regla explícita de relevancia; no se envían historiales completos entre rituales.
- [x] **`NEXO.exe`** — centro auditable con entidades, actividad, foco, memoria fijada, vista previa del contexto, pausa, purga y exportación JSON.
- [x] **Seis experiencias conectadas** — MSN_PSYCHO, TERMINAL_ESQUIZO, ORACULO, VOID_GLITCH, DENTAKORV y GRANJA registran actividad y reciben `osContext` filtrado.
- [x] **Proxies conscientes del OS** — `daemon`, `terminal`, `oracle`, `void-glitch`, `groq` y `granja` aceptan el contexto con recorte de 4600 caracteres y preservan sus system prompts propios.
- [x] **Escritorio compactado** — un icono NEXO reemplaza cinco accesos LLM directos; las apps siguen disponibles en Inicio, carpetas y VOMIT.SH (`nexo`, `red`, `entidades`, `memoria`).
- [x] **Pruebas automáticas locales** — contrato de memoria/relevancia/privacidad + sintaxis de los scripts inline; rutas principales responden HTTP 200.
- [~] **Auditoría visual interactiva** — MSN confirmó en local el envío de contexto y la respuesta del backend; falta recorrer las demás ventanas y la consola completa.
- [x] **Prueba de IA en producción** — `api/daemon` respondió con Llama 3.1 8B y confirmó `NEXO_RECEIVED=True` (`osContext`: 55 caracteres).
- [ ] **Siguiente mutación:** transferencia dirigida de un fragmento a la bandeja de una entidad concreta y catálogo de modelos compartido.

---

## 🎮 FASE 7 — ARCADE MUTANTE (juegos realmente jugables)
**Estado: ✅ COMPLETA — cuatro máquinas desplegadas y auditadas en producción** · riesgo bajo · sin costo de API · commits `6f1ea30`, `dd5b357`

- [x] **BRICK_GAME.exe v2** — cuatro juegos visibles (Tetris, Snake, Breakout y Racing), Pointer Events con repetición,
      autofoco, pausa, ayuda contextual, récords locales, reinicio universal y controles táctiles de al menos 44 px.
- [x] **Tetris reparado** — el límite de movimientos solo opera cuando la pieza está apoyada; ya no bloquea ni termina
      partidas por movimientos realizados en el aire.
- [x] **Responsive real** — consola vertical standalone/móvil y layout horizontal compacto dentro del OS o en paisaje;
      ventana 600×720 sin scroll interno ni controles recortados.
- [x] **Lanzador único de catálogo** — `FS.items[].window` + `launchCatalogItem()` conservan tamaño y autofoco desde
      carpeta, Inicio, VOMIT.SH y accesos directos.
- [x] **Núcleo compartido** — `games/shared/arcade-core.js`: persistencia tolerante, Pointer Events, press/hold,
      pausa por foco, autofoco y sintetizador Web Audio; BRICK ya consume el núcleo sin regresiones.
- [x] **Auditoría Puppeteer** — `npm run test:games`: teclado, touch, Tetris, pausa, reinicio, tres viewports, OS,
      overflow, foco, consola, rebotes de Pong, puntuación, victoria a 7 y mutaciones.
- [x] **PONG_MUTANTE.exe** — app independiente: tú contra el daemon, tres intensidades, control por teclado/touch/drag,
      marcador a 7, récord de rally, IA limitada y cuatro mutaciones de señal. Integrado en FS, Inicio y VOMIT.SH.
- [x] **MINAS_666.exe** — buscaminas Win98 corrupto: tres densidades móviles, primer pulso y vecindad seguros,
      expansión/chord, banderas por clic derecho/pulsación larga/F, teclado, pausa, cronómetro y récords locales.
      Integrado en FS, Inicio y VOMIT.SH; auditoría cubre zona segura, bandera, derrota y victoria.
- [x] **GLITCH_INVADERS.exe** — shooter Canvas por oleadas: tres intensidades, cuatro patrones cíclicos, fuego
      sostenido, bombas de glitch, vidas, puntaje/récord local, teclado, touch, arrastre, pausa y audio sintetizado.
      Integrado en FS, Inicio y VOMIT.SH; auditoría cubre disparo, impacto, bomba, oleada, derrota, responsive y OS.
- [x] Confirmación final + deploy en Vercel: `npm run test:games -- --url=https://esquizo-ai-sitio-web.vercel.app`
      pasa contra producción para OS, Brick, Pong, Minas e Invaders.

---

## 💡 Ideas sueltas (sin fase asignada)

- [ ] Dominio propio (en vez de `*.vercel.app`) — refuerza identidad
- [ ] Más drops en la galería · más formatos de glitch text
- [x] Ep04+ de Psycho-bot (cuando el mundo lo justifique — ver `PSYCHOBOT_AGENT.md`)
- [x] GRANJA.exe — pipeline de pseudoconciencia (RELOJ→DAEMON→VERIFICADOR→PSYCHO_BOT→GRIETA). Frontend + API + docs (`GRANJA_PIPELINE.md`). Generó EP_10 (PUNTO_CIEGO) con 23 claims [REAL], 0 alucinaciones, fuentes AP/Reuters/BBC. · commit `95d3e4d`
- [x] Más temas en el reproductor (14-Jun: +5 temas punk — Conflict, Subhumans, Dystopia, Antisect, His Hero Is Gone) · commit `bcb0b2b`
- [x] Más comandos en VOMIT.SH (14-Jun: `void`, `glitch`, `caida`, `oraculo`, `iching`, `hexagrama`, `mutacion`)
- [x] VOID_GLITCH integrado en el OS (escritorio, Inicio, VOMIT.SH) + audio oracular + UX psycho-oracular · commits `c8f2ef0`→`154b67f`
- [x] ORACULO.exe — I Ching + VALIS, motor de hexagramas con IA, journal, sesión contextual · commit `78bfd08`→`66f9048`
- [x] TERMINAL_ESQUIZO.exe — dual source (grimorios + 11 episodios Psycho-Bot), rediseño estético `esquizoai-products`, icono en escritorio + Inicio + VOMIT.SH (`terminal`|`dialogo`|`dialogoia`) · commit `e4245b2`
- [x] `apiBase()` — los 4 frontends IA (MSN, ORACULO, VOID_GLITCH, TERMINAL) detectan `127.0.0.1:8099` y usan la API de producción Vercel; en cualquier otro entorno usan rutas relativas · commit `e4245b2`
- [x] BRICK_GAME.exe v1 — consola física CSS + pantalla LCD Canvas + integración OS; punto de partida histórico de FASE 7.

---

*Cómo usar este tablero: al terminar algo, cambia su `[ ]` por `[x]`, anota el commit en el encabezado de la fase,
y actualiza la fecha de arriba. El delirio es sagrado; la estructura es herramienta. 🦋*
