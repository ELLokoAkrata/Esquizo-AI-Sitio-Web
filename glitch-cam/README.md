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

### Efectos de distorsión
| Tecla | Efecto | Descripción |
|-------|--------|-------------|
| `w` | WAVE | Onda bidireccional X+Y agresiva |
| `v` | VRTX | Vórtice — succión rotacional desde el centro |
| `0` | SPRL | Espiral logarítmica pulsante |

### Efectos de color / tiempo
| Tecla | Efecto | Descripción |
|-------|--------|-------------|
| `t` | TRAL | Color trails — R/G/B con decay independiente |
| `s` | SORT | Pixel sort vertical por luminancia |

### Modos cíclicos
| Tecla | Modo | Ciclo |
|-------|------|-------|
| `4` | MOSH | OFF → GHST → SOUL → FRAC |
| `c` | CRPT | OFF → BLK → ORG → ALL → PUR |
| `l` | LQID | OFF → LOW → MED → HI → MAX |
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
x + a + l:MAX          →  AcidCam completo
l:HI + v + t           →  liquid vortex arcoíris
x + c:ALL + s          →  XOR corruption sorted
4:GHST + t + 1         →  ghost rainbow RGB
m:KL8 + l:MED          →  kaleido líquido
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
