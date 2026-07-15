# CLAUDE_glitch.md — Guía operativa de GLITCH.CAM

> Sub-guía histórica del proyecto `glitch-cam`. `AGENTS.md` referencia este archivo.
> Al trabajar dentro de `glitch-cam/`, esta es la guía principal. Para el contexto
> general del proyecto EsquizoAI, ver `PROJECT_CONTEXT.md` en la raíz.

---

## 🎥 QUÉ ES

Herramienta de **glitch en tiempo real sobre webcam o video**, en Python (OpenCV + numpy).
Horror visual, acid psychedelic, corrupción digital — la estética terminal verde tóxico
(#00ff41) del proyecto, pero en vivo. Pensada para VJ / grabación / streaming (OBS).

**Stack:** solo `opencv-python` + `numpy`. Sin servidor, sin web — es una ventana `cv2.imshow`.

## ▶️ CÓMO ARRANCAR

```bash
python main.py --width 640 --height 360          # webcam (arranque por defecto del usuario)
python main.py --video tmpi1u3rohe.mp4           # video (ya procesa a 640x360 → explota igual que cam)
```
> `--width/--height` = **resolución de PROCESAMIENTO** (cam y video): el frame se redimensiona a eso
> al entrar al loop (`main.py`, tras `cap.read()`). Es CLAVE: los efectos tienen parámetros en px
> tuneados para ~640; procesar el video a su resolución nativa los debilita y baja los FPS.
> `--win-width/--win-height` solo cambian el tamaño de la ventana, no el procesamiento.

## 🗂️ ARQUITECTURA

```
main.py      ← loop, captura, teclado, timing, reload_effects() (hot-reload)
state.py     ← TODAS las variables globales compartidas (modos, bank, intensidad…)
hud.py       ← overlay HUD + tira de banco
effects/*.py ← un módulo por familia de efecto
```

**Patrón de cada efecto** (seguir SIEMPRE):
- función `fn(frame, t)` o `fn(frame, t, tick)` — `t`=intensidad 0..1, `tick`=contador de animación.
- cíclicos: dict `XXX_FUNCS = {1: fn, …}` + `XXX_NAMES = {0:'OFF', …}` + var `state.xxx_mode`.
- `main.py`: llama si `mode > 0`; tecla cicla `state.xxx_mode = (mode+1) % N`.
- `hud.py`: etiqueta + check de activo + `NAMES`.
- **Todo vectorizado** (`cv2.remap` / LUT / `applyColorMap` / slicing / buffers). Prohibido loop por píxel. Grids `mgrid` cacheados por `(h,w)`.
- Buffers persistentes → función `reset()` registrada en el reset global (`r`) y en el hot-reload.

## 🎛️ SISTEMAS CLAVE

- **Bancos de teclas:** `ESPACIO` alterna BANCO A ↔ B. Las teclas `g j o y z` controlan un efecto
  distinto según el banco (`state.bank` 0/1). Cambiar de banco NO apaga efectos, solo reenruta.
- **Hot-reload (`R` = Shift+R):** `reload_effects()` recarga `effects/*` + `hud.py` en caliente
  (importlib.reload en orden de dependencias) y rebindea los `*_FUNCS`/funciones que usa el pipeline.
  **NO recarga `main.py`/`state.py`.** → editar lógica de un efecto = `R`; agregar efecto/tecla
  nueva (toca main/state) = **reiniciar**. Atrapa errores de sintaxis y mantiene el código previo.
- **LOWLIGHT (`L` = Shift+L):** realce de poca luz AL INICIO del pipeline (los efectos se combinan
  sobre la imagen ya iluminada). Cicla OFF→GAIN→CLAHE→MAX→NVG(verde)→AMBR(ámbar)→THRM(térmica).
  Ciclo dinámico (`% len(LOWLIGHT_FUNCS)+1`) → sumar modos nuevos no requiere reiniciar.
- **LIGHTTRACK (`T` = Shift+T):** REVENTUS sigue la fuente de luz más brillante (linterna) en vez
  de la cara. Prendé un efecto con `Shift+F` y togglealo.

> **Teclas:** numéricas (0-9) y minúsculas están TODAS usadas. Teclas de *setup* (no de performance
> en vivo) usan Shift (`F` reventus, `R` reload, `L` lowlight, `T` lighttrack) — el Shift ahí no
> molesta. Para los bancos se eligieron single-press sin shift (`g j o y z` + `ESPACIO`).

**Mapa de teclas completo + detalle de cada efecto:** `README.md`.

## 🎨 BOOST DE COLOR (ajustable en caliente)

`k` KACD, `x` XOR, `c` CRPT pasan por un boost vívido (saturación alta + piso de color + lift de
brillo) — perillas `ACID_*` arriba de `color_acid.py`/`acid.py`/`corrupt.py`. `8` COLR tiene FRC
(arcoíris forzado) / SOFT (rota color existente) elegibles por banco; perillas `COLR_*` en `base.py`.
Todo se tunea editando el número + `R`.

## ✅ WORKFLOW

1. **Un efecto a la vez.** Crear `effects/X.py` aislado (no refactorizar módulos existentes "de paso").
2. **Verificación headless** (sin GUI) antes de commitear:
   `py_compile` + smoke test (frame dummy 360×640: cada modo, shape `(h,w,3)`/dtype uint8, `reset()`)
   + `import main` (resuelve el pipeline) + `hud.draw_hud` en banco A y B.
3. **Presupuesto:** ≥30fps a 640×360 con el efecto solo. Si baja, cachear grids / bajar resolución interna.
4. **Commit por efecto.** Estilo: `feat(glitch-cam): #N NOMBRE (banco·tecla)` + cuerpo con bullets.
   No agregar firmas de modelos por defecto; si el creador quiere registrar procedencia, usar la autoría real.
5. Actualizar `ROADMAP_EFECTOS_NUEVOS.md` (estado) y `README.md` cuando corresponda.

## 🔧 GIT (coexistencia con otra terminal)

- El repo está en la **raíz** (`EsquizoAI-sitio-web`); git funciona desde `glitch-cam/` sin problema.
- **Stagear solo por ruta explícita** (`git add hud.py main.py …`) — NUNCA `git add .` / `-A`
  (otra terminal puede estar editando fuera de `glitch-cam/`).
- **Commit local, NO pushear** por defecto: la otra terminal hace el `push` (comparten el mismo `.git`).
  Al terminar, decirle al usuario el rango de commits para que la otra terminal los suba.
- Commitear/pushear solo cuando el usuario lo pide.

## 📌 ESTADO / PENDIENTES

- Hecho: 11 efectos nuevos (SLIT-SCAN, FEEDBACK, TUNNEL, KALEIDO, BLOOM, VHS, STUTTER+STROBE,
  SOLAR/THERMAL, EDGE, HALFTONE + body-horror MULT/EYES/MOUT), bancos, hot-reload, boost de color,
  LOWLIGHT (incl. 3 visiones nocturnas), LIGHTTRACK.
- **Pendiente (fase aparte):** #12 **AUDIO-REACTIVE** — micrófono manejando intensidad/disparando
  modos. Mete dependencia nueva (`sounddevice`) + un hilo → diseño propio.
- Plan/estado detallado: `ROADMAP_EFECTOS_NUEVOS.md`.

---

*EsquizoAI — GLITCH.CAM · El Loko Akrata + colaboradores IA*
