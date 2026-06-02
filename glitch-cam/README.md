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

> **Activación rápida de los filtros acid-OS:** `p` PALT · `i` DITH · `n` MELT · `e` EMUL.
> Cada tecla **cicla** sus modos (vuelve a OFF al final) y se pueden **acumular**.
> Los 2 modos de rostro nuevos (**ACDF**, **MELT**) están al final del ciclo de `Shift+F` y
> necesitan una cara detectada en cuadro. Combo recomendado: `p`→512 + `i`→CLR + `e`→FULL.

### 🎛️ Bancos de teclas (distorsión de realidad)
`ESPACIO` alterna **BANCO A ↔ BANCO B**. Las 5 teclas `g j o y z` controlan un efecto
distinto según el banco activo. El HUD muestra el banco (`BNK:A` verde / `BNK:B` ámbar) y una
tira con las 5 teclas. **Cambiar de banco NO apaga efectos** — solo cambia qué controlan las
teclas, así que puedes apilar efectos de ambos bancos a la vez.

| tecla | BANCO A | BANCO B |
|-------|---------|---------|
| `g` | FEEDBACK — túnel recursivo | VHS — decay analógico de cinta |
| `j` | SLIT-SCAN — time-displacement | STUTTER+STROBE — tiempo roto ⚠️ |
| `o` | TUNNEL — remap polar | SOLAR/THERMAL — falso color |
| `y` | KALEIDO — mandala radial | EDGE — rotoscopio neón |
| `z` | BLOOM — glow sangrante | HALFTONE — imprenta |

> ⚠️ **STUTTER** (banco B, `j`) incluye **STRB**/**INVS** → parpadeo fuerte. Fotosensibilidad.

### 🎨 Acidez / saturación (ajustable en caliente)
Los efectos de color **`k`** (KACD/barras), **`x`** (XOR) y **`c`** (CRPT) pasan por un boost
vívido (saturación alta + piso de color + lift de brillo) → colores tipo trip de base, no
apagados. Las perillas están arriba de `effects/color_acid.py`, `effects/acid.py` y
`effects/corrupt.py` (`ACID_SAT`, `ACID_SAT_FLOOR`, `ACID_VAL`, `ACID_HUE_SPIN`). **`8`** (COLR)
tiene las suyas (`COLR_*`) en `effects/base.py`. Editás el número, pulsás `R`, lo ves al instante.

### 🔄 Hot-reload (iterar sin reiniciar)
La tecla **`R`** (Shift+R) recarga en caliente todos los `effects/*` y `hud.py` mientras el
programa corre — la cámara/ventana y los modos activos sobreviven. Editas un efecto, guardas,
pulsas `R` y ves el cambio. (NO recarga `main.py`/`state.py`: agregar un efecto *nuevo* sí
requiere reiniciar.) Si un archivo tiene error de sintaxis, lo atrapa y mantiene el código previo.

### Efectos base (toggle)
| Tecla | Efecto | Descripción |
|-------|--------|-------------|
| `1` | RGB | Split de canales RGB con desplazamiento |
| `2` | DISP | Displacement — filas desplazadas aleatoriamente |
| `3` | SCAN | Scanlines retro |
| `5` | NOIS | Ruido analógico |
| `6` | BLOK | Glitch blocks — bloques desplazados |
| `7` | CRT | Warp sinusoidal estilo CRT |
| `8` | COLR | Trip de color (on/off) — el BANCO elige sabor: **A=FRC** (arcoíris forzado, pinta hasta escenas pálidas) / **B=SOFT** (rota el color existente). Alterná con `ESPACIO` para comparar |
| `9` | ASCI | Modo ASCII |

### Efectos acid / XOR
| Tecla | Efecto | Descripción |
|-------|--------|-------------|
| `x` | XORF | XOR — cicla 6 modos (ver abajo) |
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

### Efectos acid-OS (inspirados en `inspirations/`)
| Tecla | Efecto | Descripción |
|-------|--------|-------------|
| `p` | PALT | Paleta acid — cicla 6 modos (verde tóxico / 512-colores / magenta / acid / ghoul / pink) |
| `i` | DITH | Dithering Bayer ordenado — cicla 3 modos (B&W / verde / color indexado) |
| `n` | MELT | Derretimiento de realidad full-frame — cicla 3 modos (drip / wax / liquid) |
| `e` | EMUL | Overlay Acid-OS — cicla SLIM → FULL (ventanas fake, slogans, taskbar 666, Ⓐ) |

### Modos cíclicos
| Tecla | Modo | Ciclo |
|-------|------|-------|
| `1` | RGB  | OFF → H → V → DIAG → TRI → CHOS |
| `x` | XORF | OFF → FDBK → INCR → POS → SHT1 → SHT2 → STRB → PROP |
| `w` | WAVE | OFF → BIDI → RADL → SHCK → DIAG → TURB → ZIGA |
| `4` | MOSH | OFF → GHST → SOUL → FRAC |
| `c` | CRPT | OFF → BLK → DSLV → ORG → ALL → PUR |
| `k` | KACD | OFF → BARS → INCR → TIME → XORT → TVAL → FADE → CRRP → SCAL |
| `c` | CRPT | OFF → BLK → ORG → ALL → PUR |
| `l` | LQID | OFF → LOW → MED → HI → MAX |
| `v` | VRTX | OFF → SWRL → ANTI → PULS → EXP → DUAL |
| `0` | SPRL | OFF → LOGR → TGHT → WAVE → INWD → MLTK |
| `b` | BLND | OFF → BLND → DIFF → SCRN → MPLY → ADDUP → OFST |
| `Shift+F` | REV | OFF → SWRL → ACID → ZOOM → ECHO → DRNK → BALO → ACDF → MELT → MULT → EYES → MOUT |
| `m` | MIRROR | OFF → MIR2 → KL4 → KL8 → KL16 |
| `p` | PALT | OFF → GRN → 512 → MGTA → ACID → GHUL → PNK |
| `i` | DITH | OFF → BW → GRN → CLR |
| `n` | MELT | OFF → DRIP → WAX → LIQD |
| `e` | EMUL | OFF → SLIM → FULL |
| `g` (A) | FBCK | OFF → ZOOM → ROTZ → DROST → ECHO |
| `j` (A) | SLIT | OFF → ROWS → COLS → RADL → CHAOS |
| `o` (A) | TUNL | OFF → TUNL → TWST → POLR |
| `y` (A) | KALD | OFF → K4 → K6 → K8 → MIRR |
| `z` (A) | BLOM | OFF → GLOW → NEON → HALO |
| `g` (B) | VHS  | OFF → TRAK → CHRM → DROP → FULL |
| `j` (B) | STUT | OFF → HOLD → RWND → ECHO → STRB → INVS |
| `o` (B) | SOLR | OFF → SOLR → THRM → INVT |
| `y` (B) | EDGE | OFF → NEON → CMIC → GHST |
| `z` (B) | HALF | OFF → DOT → CMYK → LINE |

### Sistema
| Tecla | Función |
|-------|---------|
| `ESPACIO` | Alterna BANCO A ⇄ B (enruta `g j o y z`) |
| `L` | LOWLIGHT — realce de poca luz/oscuridad (OFF→GAIN→CLAHE→MAX). Se aplica ANTES de los efectos |
| `R` | Hot-reload de `effects/*` + `hud.py` sin reiniciar (mantiene modos) |
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
- **DSLV** — Corrupción full-frame sin formas rectangulares. Blobs orgánicos (bilinear upscale) con XOR variable por canal. Patrón respira entre grueso y fino, paleta de colores rota lentamente. Misma saturación que BLK pero cubriendo toda la pantalla y mutando continuamente.
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
- **ACDF** — Paleta acid + dither sólo en el rostro + halo de símbolos anarquía (Ⓐ) girando alrededor de la cara. El rostro gritando central de los acid-OS emulators.
- **MELT** — El rostro chorrea hacia abajo: estiramiento vertical creciente desde la cara al borde inferior, ondulando con `tick`. Derretimiento *de rostro* (≠ `n`:MELT, que derrite todo el cuadro).
- **MULT** — Clona la cara en una rejilla (2–4 según intensidad) dentro del bbox. Body horror: caras dentro de la cara.
- **EYES** — Banda de ojos (tercio superior del rostro) duplicada y desplazada a izquierda/derecha → mirada múltiple.
- **MOUT** — La boca (tercio inferior) se estira hacia abajo ondulando con `tick`. Derretimiento localizado de boca.

### PALT (`p`) — Paleta acid
Reduce el frame a paletas limitadas vía LUT de luminancia (`gray → lut[gray]`) — el look dominante de las inspiraciones. Real-time (una indexación por frame).
- **GRN** — Duotone negro→verde tóxico (#00ff41), terminal fosforado.
- **512** — Posterizado a 8 niveles/canal (8³=512 colores) por máscara de bits. A más intensidad baja a 4 niveles.
- **MGTA** — Duotone negro→verde→magenta: sombras verdes, luces magenta.
- **ACID** — Rampa de 6 colores acid (crimson/amber/yellow/green/magenta) mapeada por luminancia; `tick` rota la paleta → muta sola.
- **GHUL** — 3 tonos: negro / verde tóxico / crimson (calavera acid).
- **PNK** — Duotone negro→bruised purple→wet pink.

### DITH (`i`) — Dithering Bayer ordenado
Cuantización con matriz de Bayer tilada (vectorizado). La textura granulosa pixelada retro-PC. Combina con PALT.
- **BW** — Umbral 1-bit blanco/negro con Bayer 4×4. La intensidad sesga el umbral.
- **GRN** — Dither 1-bit a negro / verde tóxico (terminal fosforado).
- **CLR** — Cuantización a pocos niveles/canal (4→3 según intensidad) **con** dither Bayer 8×8 → look indexado clásico.

### MELT (`n`) — Derretimiento de realidad (full-frame)
La realidad chorrea, vía `cv2.remap` + buffer de feedback. Es el derretimiento *de todo el cuadro* (≠ REV:MELT, centrado en rostro).
- **DRIP** — Cada columna se estira hacia abajo, más cuanto más profunda; el goteo ondula y migra con `tick`.
- **WAX** — Feedback persistente: el buffer baja cada frame y se queda con `max(rastro, frame)` → las zonas brillantes chorrean y dejan estela de cera.
- **LIQD** — Liquify guiado por la propia luminancia (suavizada): el color del frame decide cuánto se desplaza cada píxel.

### EMUL (`e`) — Overlay Acid-OS
Chrome de escritorio fake psycho-anarco-punk dibujado al final del pipeline (como el HUD, pero es contenido creativo: se hornea en el frame y **no** se oculta con `Tab`). Layout estable que muta cada ~200 ticks.
- **SLIM** — Taskbar inferior ("START · DEPROGRAMMED · I HATE EVERYONE.EXE · 666:CHAOS"), 3 slogans glitch flotantes y símbolo anarquía Ⓐ.
- **FULL** — Además 4 ventanas Win95 flotantes (barra de título magenta, texto "ACID EMULATOR v0.666 / MIND.EXE / DELETING SOCIETY", barra de progreso animada), bordes verde tóxico y aberración cromática en los textos.

### XORF modes (`x`) — XOR (shaders AcidCam GL)
- **FDBK** — XOR multi-escala ×2/×4/×8 con feedback loop acumulado — el look AcidCam original
- **INCR** — Color × escala animada × 6, XOR con original — pulsaciones de amplitud (`xor_increase.glsl`)
- **POS** — Peso por posición X/Y del píxel, XOR — el patrón varía según dónde está cada píxel (`xor_positional_offset.glsl`)
- **SHT1** — Grid 32px modula G y B con samples ×2/×4, XOR consigo mismo, restaura negros (`xorsheet.glsl`)
- **SHT2** — Grid 64px: `color *= (1 + fract(x/64) + fract(y/64))`, XOR con original (`xorsheet_2.glsl`)
- **STRB** — Escalado cuadrático por canal (`alpha²`), strobing asíncrono R/G/B (`xorstrobe.glsl`)
- **PROP** — 4 zonas en anillo (TL→TR→BR→BL→TL), cada una con XOR distinto. La salida de cada zona contamina la siguiente. Los modos rotan lentamente → el patrón migra y muta entre zonas

### WAVE modes (`w`)
- **BIDI** — Ondas bidireccionales X+Y simultáneas, doble frecuencia horizontal
- **RADL** — Ondas radiales que irradian desde el centro hacia afuera
- **SHCK** — Anillo shockwave expansivo desde el centro, se reinicia al salir de cuadro
- **DIAG** — Ondas a 45°: el desplazamiento depende de x+y
- **TURB** — Turbulencia: 3 frecuencias superpuestas en X e Y, desfasadas
- **ZIGA** — Onda triangular (zigzag) en vez de sinusoidal — más dura y angular

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

### SPRL modes (`0`)
- **LOGR** — Espiral logarítmica pulsante con respiración orgánica (la original)
- **TGHT** — Twist agresivo uniforme + rotación rápida continua
- **WAVE** — Espiral con onda radial superpuesta — el brazo ondula al girar
- **INWD** — Succión espiral hacia el centro — la imagen colapsa
- **MLTK** — Multi-brazo (3): el ángulo se multiplica creando N espirales simultáneas

### BLND modes (`b`)
- **BLND** — addWeighted clásico — trail suave con el frame anterior
- **DIFF** — Diferencia absoluta con prev — zonas sin cambio → negro, cambios → color
- **SCRN** — Screen blend — los colores se suman y aclaran, nunca oscurecen
- **MPLY** — Multiply — los colores se multiplican, resultado más oscuro y saturado
- **ADDUP** — Luminancia suma × alpha → sin(val × color / 0.3), 50/50 con original — distorsión sinusoidal por brillo (`addup_blend.glsl`)
- **OFST** — Motion trail por desplazamiento UV (×1/×2/×3 píxeles) → weighted average → XOR con prev frame — ghosting óptico con aberración cromática (`blur_offset_color_fade.glsl`)

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

## Distorsión de realidad — bancos (`ESPACIO` alterna A/B)

Efectos que rompen el **tiempo**, la **recursión** y la **simetría**. Todos vectorizados
(`remap` / LUT / buffers / `applyColorMap`) → ≥30fps a 640×360. La intensidad (`+`/`-`) dosifica.

### FBCK (A·`g`) — Feedback recursivo
Mezcla el frame de salida anterior (transformado) con el actual → cámara-apuntando-a-su-pantalla.
- **ZOOM** — el buffer se agranda cada frame: túnel que se abalanza hacia ti.
- **ROTZ** — zoom + rotación continua: espiral de feedback infinita.
- **DROST** — el buffer se encoge: la imagen dentro de sí misma (recursión al centro).
- **ECHO** — feedback con rotación de tono → estelas arcoíris recursivas.

### SLIT (A·`j`) — Slit-scan / time-displacement
Ring-buffer de 24 frames; cada fila/columna/anillo muestra un instante distinto del pasado → el
movimiento se derrite en el **tiempo**, no en el espacio. Las bandas llevan glitch cromático
(cada canal RGB lee un instante distinto + RGB-split), escalado por intensidad.
- **ROWS** cascada vertical de tiempo · **COLS** smear horizontal · **RADL** onda temporal radial · **CHAOS** bandas onduladas animadas.

### TUNL (A·`o`) — Túnel polar
Remap a coordenadas polares → la imagen se enrolla en un túnel infinito.
- **TUNL** túnel clásico con scroll · **TWST** túnel + torsión (espiral de túnel) · **POLR** desenrollado polar puro.

### KALD (A·`y`) — Kaleido (mandala radial)
Simetría rotacional de N pliegues con cuñas espejadas y eje girando (≠ MIRROR bilateral).
- **K4 / K6 / K8** — 4/6/8 pliegues · **MIRR** — espejo cuádruple (la esquina en los 4 cuadrantes).

### BLOM (A·`z`) — Bloom (glow sangrante)
Extrae brillos, los difumina y los suma → la luz sangra fuera de sus bordes.
- **GLOW** sobreexposición general · **NEON** satura primero → glow colorido · **HALO** aura radial pesada.

### VHS (B·`g`) — Decay analógico de cinta
La cinta podrida (≠ CRT, que es el monitor).
- **TRAK** tracking lines que suben · **CHRM** chroma bleed (R/B se corren + blur) · **DROP** dropout de señal · **FULL** todo + head-switch noise + sync roll.

### STUT (B·`j`) — Stutter + Strobe (tiempo roto) ⚠️
Ring-buffer + parpadeo. **STRB/INVS parpadean fuerte (fotosensibilidad).**
- **HOLD** congela y repite un frame · **RWND** rebobinado en bucle · **ECHO** bucle corto · **STRB** flash a ritmo · **INVS** inversión intermitente.

### SOLR (B·`o`) — Solarize / Thermal (falso color)
- **SOLR** solarización Sabattier (invierte sobre umbral, LUT) · **THRM** mapa térmico (colormap de calor) · **INVT** negativo + rotación de tono animada.

### EDGE (B·`y`) — Rotoscopio neón
- **NEON** contornos Canny verde tóxico brillando sobre negro · **CMIC** relleno posterizado + líneas negras (cómic) · **GHST** bordes acumulados con decay (estela de líneas).

### HALF (B·`z`) — Halftone (imprenta)
Rejilla de puntos/líneas (≠ Bayer de DITH). Mapas de rejilla cacheados (estáticos) → rápido.
- **DOT** puntos de radio ∝ brillo, coloreados · **CMYK** separación C/M/Y con rejillas anguladas sobre blanco · **LINE** line-screen diagonal.

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
c:DSLV + x:PROP             →  corrupción full-frame + propagación zonal XOR
c:DSLV + w:SHCK             →  manchas de color mutantes + shockwave
w:TURB + x:FDBK             →  turbulencia sobre feedback XOR — máximo caos
w:ZIGA + v:DUAL             →  zigzag + doble vórtice — imagen destrozada
p:ACID + i:CLR              →  look "512 colours" dithered — el acid-OS clásico
e:FULL + p:GRN              →  escritorio acid verde fosforado con ventanas fake
e:FULL + p:512 + i:CLR      →  emulador acid-OS completo (paleta + dither + chrome)
n:WAX + p:MGTA              →  realidad derritiéndose en verde/magenta
n:DRIP + i:GRN              →  terminal fosforado chorreando
Shift+F:ACDF + e:SLIM       →  rostro acid con halo anarquía + chrome de OS
```

### Bancos nuevos (ESPACIO alterna A/B)
```
A g:ROTZ + A o:TWST         →  túnel espiral comiéndose la imagen
A g:ECHO  (con movimiento)  →  estelas de color recursivas infinitas
A j:RADL + A g:ROTZ         →  time-displacement radial dentro de feedback espiral
A y:K6 + B y:NEON           →  mandala de líneas neón
A z:BLOOM + B o:THRM        →  mapa térmico sangrando luz
B g:FULL + A z:HALO         →  cinta VHS podrida con aura
B z:CMYK + B o:SOLR         →  impresión periódico solarizada
B j:STRB + A g:ZOOM         →  ⚠️ túnel estroboscópico (fotosensible)
Shift+F:MULT + A y:K4       →  multiplicación de caras en mandala
```

---

## Estructura del proyecto

```
glitch-cam/
├── main.py              ← entrada, loop, teclado, timing, bancos, reload_effects (hot-reload R)
├── state.py             ← todas las variables globales compartidas (incl. bank + modos nuevos)
├── hud.py               ← HUD overlay + tira de banco
├── effects/
│   ├── base.py          ← rgb_split, displacement, noise, scanlines,
│   │                       glitch_blocks, crt_warp, color_cycle, ascii_mode,
│   │                       color_trails, pixel_sort, wave, vortex, spiral
│   ├── corrupt.py       ← color_corrupt_*, CORRUPT_MODES
│   ├── ghost.py         ← fx_ghst, fx_soul, fx_frac, MOSH_FUNCS
│   ├── reventus.py      ← rev_*, REV_FUNCS (rostro: +MULT/EYES/MOUT body-horror)
│   ├── mirror.py        ← screen_mir2, screen_kl4/8/16, MIRROR_FUNCS
│   ├── acid.py          ← xor_feedback, frame_blend_rgb, hyper_liquid_acid
│   ├── palette.py       ← palt_* (paleta acid vía LUT), PALT_FUNCS
│   ├── dither.py        ← dith_* (Bayer ordenado), DITH_FUNCS
│   ├── melt.py          ← melt_* (derretimiento full-frame), MELT_FUNCS
│   ├── emul.py          ← draw_acid_os (overlay Acid-OS), EMUL_NAMES
│   ├── slitscan.py      ← slit_* (time-displacement), SLIT_FUNCS       [A·j]
│   ├── feedback.py      ← fb_* (recursión), FB_FUNCS                   [A·g]
│   ├── tunnel.py        ← tun_* (polar), TUNNEL_FUNCS                  [A·o]
│   ├── kaleido.py       ← kal_* (mandala radial), KALEIDO_FUNCS        [A·y]
│   ├── bloom.py         ← bloom_* (glow), BLOOM_FUNCS                  [A·z]
│   ├── vhs.py           ← vhs_* (decay analógico), VHS_FUNCS           [B·g]
│   ├── stutter.py       ← stut_* (tiempo roto + strobe), STUTTER_FUNCS [B·j]
│   ├── solar.py         ← solar_* (falso color), SOLAR_FUNCS          [B·o]
│   ├── edge.py          ← edge_* (rotoscopio), EDGE_FUNCS              [B·y]
│   └── halftone.py      ← half_* (imprenta), HALFTONE_FUNCS            [B·z]
├── ROADMAP_EFECTOS_NUEVOS.md  ← plan/estado del lote de efectos nuevos
└── README.md
```

---

*EsquizoAI — El Loko Akrata*
