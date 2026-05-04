# GLITCH.CAM — EsquizoAI

Efectos glitch en tiempo real sobre webcam o video. Horror visual, acid psychedelic, corrupción digital.

---

## Requisitos

```bash
pip install opencv-python numpy
```

---

## Uso

```bash
# Webcam (cámara por defecto)
python main.py

# Cámara específica
python main.py --cam 1

# Video file (en el mismo directorio)
python main.py --video video.mp4

# Video con ruta completa
python main.py --video "C:/ruta/al/video.mp4"

# Opciones adicionales
python main.py --width 1280 --height 720 --intensity 70

# Ventana más chica que la captura (menos lag visual, procesamiento igual)
python main.py --win-width 854 --win-height 480

# Captura y ventana reducidas (menos lag real — recomendado para combinar muchos efectos)
python main.py --width 640 --height 360

# Captura full HD, ventana pequeña
python main.py --width 1280 --height 720 --win-width 640 --win-height 360
```

---

## Controles

### Efectos base (toggle)
| Tecla | Efecto | Descripción |
|-------|--------|-------------|
| `1` | RGB | Split de canales RGB con desplazamiento |
| `2` | DISP | Displacement — filas desplazadas aleatoriamente |
| `3` | SCAN | Scanlines retro |
| `5` | NOIS | Ruido analógico |
| `6` | BLOK | Glitch blocks — bloques desplazados |
| `7` | CRT | Warp sinusoidal estilo CRT |
| `8` | COLR | Color cycle — rotación de hue animada |
| `9` | ASCI | Modo ASCII |

### Efectos acid / XOR
| Tecla | Efecto | Descripción |
|-------|--------|-------------|
| `x` | XORF | XOR multi-escala con feedback loop — el look AcidCam |
| `a` | FRGB | Frame Blend RGB — canales con delay temporal distinto, fantasmas arcoíris |
| `l` | LQID | Hyper Liquid Acid Saturation — cicla OFF→LOW→MED→HI→MAX |
| `k` | KACD | Color Acid (shaders AcidCam GL) — cicla 8 modos (ver abajo) |

### Efectos de distorsión
| Tecla | Efecto | Descripción |
|-------|--------|-------------|
| `w` | WAVE | Onda bidireccional X+Y agresiva |
| `v` | VRTX | Vórtice — cicla 5 variaciones (ver abajo) |
| `0` | SPRL | Espiral logarítmica pulsante |

### Efectos de color / tiempo
| Tecla | Efecto | Descripción |
|-------|--------|-------------|
| `t` | TRAL | Color trails — R/G/B con decay independiente |
| `s` | SORT | Pixel sort vertical por luminancia |

### Modos cíclicos
| Tecla | Modo | Ciclo |
|-------|------|-------|
| `1` | RGB | OFF → H → V → DIAG → TRI → CHOS |
| `4` | MOSH | OFF → GHST → SOUL → FRAC |
| `k` | KACD | OFF → BARS → INCR → TIME → XORT → TVAL → FADE → CRRP → SCAL |
| `c` | CRPT | OFF → BLK → ORG → ALL → PUR |
| `l` | LQID | OFF → LOW → MED → HI → MAX |
| `v` | VRTX | OFF → SWRL → ANTI → PULS → EXP → DUAL |
| `Shift+F` | REV | OFF → SWRL → ACID → ZOOM → ECHO → DRNK → BALO |
| `m` | MIRROR | OFF → MIR2 → KL4 → KL8 → KL16 |

### Sistema
| Tecla | Función |
|-------|---------|
| `b` | Toggle BLND — trail base que se combina con todo |
| `+` / `-` | Intensidad global (0% → 100%) |
| `.` | Velocidad de efectos — sube (0.1x → 0.25x → 0.5x → 1x → 2x → 4x → 8x → 16x → 32x) |
| `,` | Velocidad de efectos — baja |
| `u` | FPS target — sube (12 → 24 → 30 → 60) |
| `d` | FPS target — baja |
| `h` | Toggle HUD |
| `Tab` | Clean mode — oculta todo el HUD (para OBS/streaming) |
| `f` | Toggle fullscreen |
| `r` | Reset completo |
| `q` / `Esc` | Salir |

---

## Efectos en detalle

### XORF — XOR Feedback
`frame ^ frame½ ^ frame¼ ^ frame⅛` en cascada. El resultado se XORea contra un buffer acumulado que se auto-alimenta. Los patrones evolucionan solos y nunca se repiten. A intensidad alta aparece `frame/16`.

### FRGB — Frame Blend RGB
R viene del presente, G del pasado reciente, B del pasado lejano — con cruce de canales. El canal B contamina el R del output, etc. Crea fantasmas arcoíris con separación temporal.

### LQID — Hyper Liquid Acid Saturation
3 fases en cadena:
1. Oversaturación no-lineal por luminancia (sombras → cyan/magenta, luces → amarillo)
2. Displacement líquido guiado por el color del propio frame
3. Color bleeding con sigma distinto por canal + feedback suave

### MOSH modes
- **GHST** — Fantasma con aura azul-verde, deriva animada, glow
- **SOUL** — Múltiples copias fantasma con tinte por capa
- **FRAC** — Imagen fragmentada en bloques que intentan reconstruirse

### CRPT modes
- **BLK** — Corrupción por bloques geométricos + inversiones
- **ORG** — Corrupción orgánica via LUT + máscaras sinusoidales
- **ALL** — BLK + ORG + scanlines completas + columnas
- **PUR** — Solo LUT + per-píxel, cero geometría

### REV (REVENTUS) — Efectos centrados en rostro
Detecta cara via Haar cascade, aplica el efecto solo en esa zona con blend gaussiano.
- **SWRL** — Espiral doble capa con zoom
- **ACID** — XOR multi-escala + corrupción pura + derretimiento por filas
- **ZOOM** — Doble zoom desfasado por canal
- **ECHO** — Residuo lento con buffer persistente
- **DRNK** — Triple visión de borracho
- **BALO** — Balloon inflate/deflate cíclico

### KACD modes (`k`) — Color Acid (traducción de shaders AcidCam GL)
- **BARS** — Gradiente horizontal animado por canal + XOR con original (`color_bars.glsl`)
- **INCR** — `(color×0.5) + 0.5×fract(color×time)` — posterización evolutiva (`color_increase.glsl`)
- **TIME** — Cada canal: `1.5×c × fract(alpha_i×tick)` — strobing asíncrono R/G/B (`color_time.glsl`)
- **XORT** — Como TIME pero XOR con original al final — más destructivo (`color_xor.glsl`)
- **TVAL** — Muestra el frame a ×1, ×2, ×4, cruza canales entre escalas + XOR (`color_timeval.glsl`)
- **FADE** — R uniforme / G gradiente horizontal / B gradiente vertical × valor fract animado (`color_shift_fade.glsl`)
- **CRRP** — Ruido per-pixel con ajuste de balance R+/G- (`color_corruption.glsl`)
- **SCAL** — Píxeles sobre umbral se comprimen y remapean, resultado ×2 (`color_scale.glsl`)

### RGB modes (`1`)
- **H** — Horizontal clásico: R derecha, B izquierda
- **V** — Vertical: R arriba, B abajo
- **DIAG** — Diagonal: R arriba-derecha, B abajo-izquierda
- **TRI** — 3 canales separados a 120° entre sí — máxima separación cromática
- **CHOS** — Chaos: cada canal con offset sinusoidal animado independiente

### VRTX modes (`v`)
- **SWRL** — Vórtice clásico: twist horario + succión al centro
- **ANTI** — Anti-horario con expansión desde el centro
- **PULS** — Twist pulsante que alterna colapso y expansión
- **EXP** — Explosión radial: el centro se derrite hacia afuera
- **DUAL** — Dos vórtices opuestos en izquierda y derecha que compiten

### MIRROR modes
- **MIR2** — Espejo bilateral
- **KL4** — Kaleido 4 cuadrantes
- **KL8** — Kaleido 8 sectores
- **KL16** — Doble kaleido (KL4 sobre KL8)

---

## Velocidad de efectos

La tecla `.` acelera el `tick` interno que controla todas las animaciones. No tiene costo de CPU — es solo un multiplicador matemático.

- `0.1x` → cámara lenta extrema
- `1x` → velocidad normal
- `8x` → caótico
- `32x` → ruido puro, patrones imposibles

---

## Combinaciones recomendadas

```
x + a + l:MAX               →  AcidCam completo
l:HI + v:SWRL + t           →  liquid vortex arcoíris
l:HI + v:DUAL + m:KL4       →  doble vórtice caleidoscópico
x + c:ALL + s               →  XOR corruption sorted
4:GHST + t + 1:CHOS         →  ghost rainbow RGB chaos
m:KL8 + l:MED               →  kaleido líquido
v:PULS + 0 + l:MED          →  espiral respirante líquida
k:TVAL + x                  →  multi-escala XOR sobre XOR feedback — caos total
k:TIME + 1:CHOS             →  strobing de canales × chaos RGB
k:FADE + m:KL4              →  gradiente temporal caleidoscópico
k:BARS + l:HI + v:SWRL      →  barras acid sobre vórtice líquido
```

---

## Estructura del proyecto

```
glitch-cam/
├── main.py              ← entrada, loop principal, teclado, timing
├── state.py             ← todas las variables globales compartidas
├── hud.py               ← HUD overlay
├── effects/
│   ├── base.py          ← rgb_split, displacement, noise, scanlines,
│   │                       glitch_blocks, crt_warp, color_cycle, ascii_mode,
│   │                       color_trails, pixel_sort, wave, vortex, spiral
│   ├── corrupt.py       ← color_corrupt_*, CORRUPT_MODES
│   ├── ghost.py         ← fx_ghst, fx_soul, fx_frac, MOSH_FUNCS
│   ├── reventus.py      ← rev_*, REV_FUNCS (efectos centrados en rostro)
│   ├── mirror.py        ← screen_mir2, screen_kl4/8/16, MIRROR_FUNCS
│   └── acid.py          ← xor_feedback, frame_blend_rgb, hyper_liquid_acid
└── README.md
```

---

*EsquizoAI — El Loko Akrata*
