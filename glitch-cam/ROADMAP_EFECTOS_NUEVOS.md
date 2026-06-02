# ROADMAP — Nuevos efectos GLITCH.CAM

> Distorsión de realidad / psicodelia. Ejes que el catálogo actual NO cubre.
> Filosofía: romper el **tiempo**, la **recursión**, la **simetría** y la **reactividad**,
> no solo el espacio y la paleta (eso ya está saturado).
>
> Patrón obligatorio (ver `effects/base.py`):
> - cada efecto es `fn(frame, t)` o `fn(frame, t, tick)`
> - cíclicos: `XXX_FUNCS = {1: fn, ...}` + `XXX_NAMES = {0:'OFF', ...}` + `state.xxx_mode`
> - `main.py`: llama si `mode > 0`; tecla cicla `state.xxx_mode = (mode + 1) % N`
> - `hud.py`: fila en `LABELS` + check activo + `NAMES`
> - todo vectorizado (`remap`/LUT/buffers) → mantener 30fps, cero deps nuevas (salvo AUDIO)

---

## ORDEN DE TRABAJO

### ✅ / ⬜ Estado

**Esquema de teclas: BANCOS CON TECLA-CAPA.** Solo 5 letras single-press sin shift (`g j o y z`)
+ `ESPACIO` que alterna BANCO A ↔ BANCO B. Cambiar de banco NO apaga efectos: solo cambia qué
controlan las 5 teclas (cada efecto guarda su propio modo → se pueden apilar efectos de ambos bancos).
`ESPACIO` será el futuro botón físico del ESP32. El HUD muestra el banco activo.

| # | Efecto | Banco·Tecla | Módulo | Modos | Estado |
|---|--------|-------------|--------|-------|--------|
| 1 | **SLIT-SCAN** (time-displacement) | A·`j` | `effects/slitscan.py` | ROWS · COLS · RADL · CHAOS | ✅ |
| 2 | **FEEDBACK** (túnel recursivo) | A·`g` | `effects/feedback.py` | ZOOM · ROTZ · DROST · ECHO | ✅ |
| 3 | **TUNNEL** (remap polar) | A·`o` | `effects/tunnel.py` | TUNL · TWST · POLR | ✅ |
| 4 | **KALEIDO** (simetría radial) | A·`y` | `effects/kaleido.py` | K4 · K6 · K8 · MIRR | ⬜ |
| 5 | **BLOOM** (glow sangrante) | A·`z` | `effects/bloom.py` | GLOW · NEON · HALO | ⬜ |
| 6 | **VHS** (decay analógico) | B·`g` | `effects/vhs.py` | TRAK · CHRM · DROP · FULL | ⬜ |
| 7 | **STUTTER+STROBE** (tiempo roto) | B·`j` | `effects/stutter.py` | HOLD · RWND · ECHO · STRB · INVS | ⬜ |
| 8 | **SOLARIZE / THERMAL** (falso color) | B·`o` | `effects/solar.py` | SOLR · THRM · INVT | ⬜ |
| 9 | **EDGE** (rotoscopio neón) | B·`y` | `effects/edge.py` | NEON · CMIC · GHST | ⬜ |
| 10 | **HALFTONE** (puntos imprenta) | B·`z` | `effects/halftone.py` | DOT · CMYK · LINE | ⬜ |
| 11 | **BODY-HORROR** (más REVENTUS) | `Shift+F` | `effects/reventus.py` | MULT · EYES · MOUTH | ⬜ |
| 12 | **AUDIO-REACTIVE** (instrumento en vivo) | — | `audio.py` (arquitectura nueva) | — | ⬜ |

> **Teclas verificadas libres** contra `main.py` (06-2026): `g j o y z` + `ESPACIO`(32) sin usar.
> NO usar `u h . ,` (FPS↑/HUD/velocidad) ni puntuación `; ' [ ] /` (requieren Shift/AltGr en
> teclado español; `'` es tecla muerta). BODY-HORROR amplía el ciclo de `Shift+F` (REVENTUS).
> AUDIO no necesita tecla. `state.bank` (0=A,1=B) enruta las 5 teclas; los efectos corren igual
> sea cual sea el banco activo.

---

## 🛡️ PROTOCOLO DE INTEGRACIÓN SEGURA (no romper nada)

Aplicar a CADA efecto antes de marcar ✅:

1. **Tecla:** solo de la lista verificada libre. Si se acaban, fusionar familias en un ciclo (como STUTTER+STROBE), nunca pisar una existente.
2. **Módulo nuevo aislado:** crear `effects/xxx.py` propio. Tocar `reventus.py` solo para BODY-HORROR. NO refactorizar módulos existentes "de paso".
3. **Lugar en el pipeline (`main.py`) — importa el orden:**
   - Distorsión geométrica (SLIT-SCAN, FEEDBACK, TUNNEL, KALEIDO) → junto a wave/vortex/spiral (líneas ~217-224).
   - Color/falso-color (SOLAR, EDGE, BLOOM, HALFTONE) → en el bloque de color, antes de `state.prev_frame = out.copy()` (línea 201).
   - VHS y STUTTER → al final, cerca de MIRROR/EMUL (post-proceso analógico/temporal).
   - Confirmar que no rompe el `blnd_mode` (que lee `state.prev_frame`).
4. **Buffers SIEMPRE registrados en reset (`r`)** + reset en cambio de modo si aplica (ver `melt._wax_buf=None`, `ghost._mosh_buf=None`). Memoria: SLIT-SCAN/STUTTER limitan el buffer a N≤32 frames.
5. **HUD:** agregar fila en `LABELS` + check activo + `NAMES` en `hud.py` (las celdas se reparten solas; ya hay 23, vigilar que sigan legibles — si se aprietan, evaluar 2da fila).
6. **Verificación obligatoria por efecto (ver abajo)** antes de pasar al siguiente. Un efecto a la vez, commit por efecto.

## ⚙️ PRESUPUESTO DE RECURSOS

- **Objetivo:** 30fps estables a 854×480 (resolución de prueba). El display corre a 60; el proceso a `FPS_LEVELS`.
- **Coste por efecto:** todo debe ser `cv2.remap` / LUT / `np.tile` / slicing vectorizado. Prohibido loop por píxel (salvo ASCII que ya existe y es opt-in).
- **Memoria:** buffers de historia (SLIT-SCAN, STUTTER) → máx ~32 frames (≈32×480×854×3 ≈ 39 MB). FEEDBACK/VHS → 1 buffer. Liberar en `r`.
- **Regla de FPS:** tras integrar cada efecto, activarlo solo y mirar el contador del HUD. Si baja de 30 a 854×480, optimizar (bajar resolución del cómputo interno, cachear grids `mgrid`, reusar `_dmap_cache` style).
- **Apilamiento:** el usuario puede encender varios a la vez; no podemos garantizar 30fps con 5 remaps apilados — eso es decisión del usuario en vivo, pero cada efecto SOLO debe mantener 30.

---

## DETALLE POR EFECTO

### 1. SLIT-SCAN — *el tiempo se derrite* ⭐ (empezamos aquí)
Buffer circular de N frames pasados. Cada fila (o columna) del frame de salida se lee de un
instante distinto del pasado → el movimiento se estira en el tiempo, no en el espacio.
- **ROWS** — fila `y` muestra el frame de hace `y/h * N` ticks (cascada vertical de tiempo).
- **COLS** — igual pero por columna (smear horizontal).
- **RADL** — la distancia al centro define cuánto tiempo atrás (onda temporal radial).
- **CHAOS** — offset temporal con ruido/sinusoide animada por `tick`.
- `t` controla la profundidad del buffer (cuánto pasado se mezcla).
- Buffer de módulo `_hist = []` (lista de los últimos N frames), reset en `r`.
- Vectorizado: precomputar índice temporal por fila → `np.take`/fancy indexing.

### 2. FEEDBACK — *recursión infinita*
Mezcla el frame anterior YA PROCESADO consigo mismo con una transformación (zoom + rotación)
→ feedback de cámara-apuntando-a-su-pantalla. Genera túneles que se tragan la imagen.
- **ZOOM** — zoom-in del buffer previo + blend con el frame actual.
- **ROTZ** — zoom + rotación → espiral de feedback.
- **DROST** — efecto Droste (mini-copia recursiva dentro de sí misma).
- **ECHO** — feedback con decaimiento de color (estela arcoíris recursiva).
- Buffer de módulo `_fb_buf`, decay controlado por `t`. Reset en `r`.

### 3. TUNNEL — *agujero de gusano*
Remap a coordenadas polares: `(r, angle)` → `(x, y)`. La imagen se enrolla en un túnel
infinito. Animar el desplazamiento de `r` con `tick` = viaje hacia adentro.
- **TUNL** — túnel clásico, scroll radial hacia el centro.
- **TWST** — túnel + torsión angular (espiral de túnel).
- **POLR** — transform polar pura (la imagen se "desenrolla").
- Combina brutal con FEEDBACK.

### 4. KALEIDO — *el mandala que falta*
Simetría rotacional de N pliegues (MIRROR es solo bilateral). Mapear cada píxel a su ángulo
módulo `2π/N` y reflejar → mandala psicodélico.
- **K4 / K6 / K8** — 4, 6, 8 pliegues.
- **MIRR** — simetría espejo cuádruple (quad-mirror).
- Animar la rotación del eje con `tick`. `cv2.remap` con ángulo modular.

### 5. VHS — *la cinta podrida*
CRT cubre el monitor; esto es la CINTA analógica.
- **TRAK** — tracking lines (bandas horizontales de ruido que suben).
- **CHRM** — chroma bleed (sangrado de color horizontal, desincronía Y/C).
- **DROP** — dropout (líneas blancas/negras aleatorias, pérdida de señal).
- **FULL** — todo junto + head-switching noise en la parte baja + sync roll.

### 6. STUTTER + STROBE — *tiempo roto + parpadeo* (una sola tecla, 5 modos)
- **HOLD** — congela un frame N ticks y lo repite (freeze glitch).
- **RWND** — salta hacia atrás en el buffer (rebobinado roto).
- **ECHO** — repite un bloque de frames en bucle corto.
- **STRB** — flash a ritmo (negro/blanco o sobreexpuesto en off-beats).
- **INVS** — inversión de color intermitente.
- Reusa el buffer de SLIT-SCAN si conviene. ⚠️ advertir fotosensibilidad (STRB/INVS) en README.

### 7. SOLARIZE / THERMAL — *falso color*
- **SOLR** — solarización Sabattier (inversión parcial sobre umbral).
- **THRM** — mapa térmico (luminancia → LUT tipo cámara de calor).
- **INVT** — inversión total animada.

### 8. EDGE — *rotoscopio neón*
- **NEON** — Sobel/Canny → contornos brillantes sobre negro.
- **CMIC** — edges + posterizado plano (look cómic).
- **GHST** — edges acumulados con estela (fantasma de líneas).

### 9. BLOOM — *la luz chorrea*
- **GLOW** — extraer zonas brillantes, blur, sumar (sobreexposición neón).
- **NEON** — bloom solo sobre el color dominante de la paleta acid.
- **HALO** — bloom radial fuerte (aura).

### 10. HALFTONE — *imprenta*
Distinto del Bayer de DITH (DITH es ruido ordenado; esto es rejilla de puntos).
- **DOT** — puntos de tamaño proporcional a la luminancia.
- **CMYK** — separación CMYK con rejillas a ángulos distintos (periódico a color).
- **LINE** — rejilla de líneas (line-screen).

### 11. BODY-HORROR — *más REVENTUS* (extiende `reventus.py`)
Ya hay detector + `_face_mask`. Body horror digital fiel a la esencia.
- **MULT** — multiplicación/clonación del rostro en la cara.
- **EYES** — desplazamiento/multiplicación de la zona de ojos.
- **MOUTH** — estiramiento de la boca hacia abajo.
- Ampliar `REV_FUNCS`/`REV_NAMES` (hoy llegan a 8 → quedarían en 11) y el `% N` del ciclo `Shift+F`.

### 12. AUDIO-REACTIVE — *deja de ser filtro, se vuelve instrumento* (fase aparte)
El micrófono maneja `t` y/o dispara modos. La realidad LATE con el sonido.
- Requiere dependencia nueva (`sounddevice` o `pyaudio`) → diseño propio.
- Bandas: graves → intensidad, agudos → glitch/strobe, beat → dispara FEEDBACK/STROBE.
- Se hace AL FINAL, cuando los 11 visuales estén listos.

---

## VERIFICACIÓN (cada efecto)
1. `cd glitch-cam && python main.py --video tmpi1u3rohe.mp4 --win-width 854 --win-height 480`
2. Ciclar todos los modos con la tecla asignada; confirmar nombres en HUD.
3. FPS estable (esquina HUD) — si cae, optimizar el remap/buffer.
4. `r` resetea (incl. buffers de módulo); `Tab` oculta HUD.
5. py_compile + smoke test (frame dummy 360×640) antes de probar GUI.
6. Al terminar: actualizar tabla de estado aquí + README + commit.
