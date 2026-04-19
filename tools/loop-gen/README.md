# LOOP_GEN v1.0
**EsquizoAI-land · El Loko Akrata + Claude**

CLI wrapper sobre FFmpeg nativo. Toma cualquier video y lo convierte en loop ×N con tres modos: lossless copy, crossfade seamless, o ping-pong boomerang. Sin UI, sin browser, sin bullshit.

---

## REQUISITOS

- **Node.js** ≥ 18
- **FFmpeg** instalado y en PATH (`ffmpeg --version` debe funcionar)
- **FFprobe** (viene con FFmpeg)

---

## USO

```bash
node loop-gen.js <input> [opciones]
```

### Opciones

| Flag | Alias | Descripción | Default |
|------|-------|-------------|---------|
| `-n` | `--loops` | Número de repeticiones | `3` |
| `-m` | `--mode` | Modo: `normal`, `crossfade`, `pingpong` | `normal` |
| `-f` | `--fade` | Duración del fade en segundos (crossfade) | `0.5` |
| `-q` | `--crf` | Calidad re-encode H.264 (0=lossless, 18=visual lossless, 51=peor) | `18` |
| `-o` | `--output` | Nombre del archivo de salida | auto |
| `-h` | `--help` | Ayuda | — |

### Output auto-naming

Si no se especifica `-o`, el nombre se genera como: `{nombre_original}_{modo}_x{loops}.mp4`

Ejemplo: `clip.mp4 -n 4 -m pingpong` → `clip_pingpong_x4.mp4`

---

## MODOS

### `normal` — Lossless concat
```
ffmpeg -y -f concat -safe 0 -i list.txt -c copy output.mp4
```
- **Sin re-encode.** Copia el bitstream bit a bit.
- Máxima velocidad (casi instantáneo).
- Calidad 100% idéntica al original.
- Sin efectos de transición — corte seco entre repeticiones.
- Usa archivo temporal `_loopgen_tmp_*.txt` que se limpia al terminar.

**Cuándo usarlo:** Cuando necesitás N repeticiones exactas sin perder un solo bit de calidad.

---

### `crossfade` — Fundido cruzado
```
ffmpeg -y -i input -filter_complex "
  [0:v]split=N[v0][v1]...[vN-1];
  [v0][v1]xfade=transition=fade:duration=F:offset=O1[xv0];
  [xv0][v2]xfade=transition=fade:duration=F:offset=O2[xv1];
  ...
  [vN-2][vN-1]xfade=...duration=F:offset=ON-1[vout];
  [0:a]asplit=N[a0][a1]...;
  [a0][a1]acrossfade=d=F[xa0];
  ...
  [aN-2][aN-1]acrossfade=d=F[aout]
" -map [vout] -map [aout] -c:v libx264 -crf CRF -preset fast output.mp4
```

**Fórmula del offset:** `offset = (i + 1) × (duration - fade)`

- Re-encode (H.264 + AAC).
- El final de cada repetición se disuelve con el inicio de la siguiente.
- El fade se capea automáticamente al 40% de la duración del clip para evitar artefactos.
- Resultado: transición suave y continua, casi imperceptible si el fade es corto.

**Cuándo usarlo:** Cuando querés que el loop se sienta fluido y cinematográfico.

---

### `pingpong` — Adelante/Reversa alternados
```
ffmpeg -y -i input -filter_complex "
  [0:v]split=N[v0][v1]...[vN-1];
  [v1]reverse[vr1];
  [v3]reverse[vr3];
  ...
  [v0][vr1][v2][vr3]...concat=n=N:v=1[vout];
  [0:a]asplit=N[a0][a1]...;
  [a1]areverse[ar1];
  [a0][ar1]...concat=n=N:v=0:a=1[aout]
" -map [vout] -map [aout] -c:v libx264 -crf CRF -preset fast output.mp4
```

- Re-encode (H.264 + AAC).
- Pares impares se invierten: adelante → reversa → adelante → reversa...
- El último frame del forward es el primer frame del reverse → **seamless natural**.
- No necesita fade porque la física del movimiento crea la ilusión de continuidad.
- Es el modo más lento (reverse de cada repetición impar).

**Cuándo usarlo:** Para loops de movimiento orgánico donde el boomerang tiene sentido visual — agua, fuego, baile, ondas.

---

## EJEMPLOS

```bash
# 4 repeticiones lossless
node loop-gen.js clip.mp4 -n 4

# 3 loops con crossfade de 0.8s
node loop-gen.js clip.mp4 -n 3 -m crossfade -f 0.8

# 6 loops ping-pong calidad alta
node loop-gen.js clip.mp4 -n 6 -m pingpong -q 16

# Crossfade con output nombrado
node loop-gen.js clip.mp4 -n 3 -m crossfade -f 1 -o seamless.mp4

# Ping-pong ×3 desde otra carpeta
node loop-gen.js ../videos/raw/toma.mp4 -n 3 -m pingpong
```

---

## OUTPUT DEL PROCESO

Al ejecutar, el CLI imprime:

```
╔══════════════════════════════════════════╗
║  LOOP_GEN v1.0 — EsquizoAI-land         ║
╚══════════════════════════════════════════╝

// INPUT    : clip.mp4
// DURACIÓN : 00:11.0  (11.000s)
// VIDEO    : H264 834×1112 30fps
// AUDIO    : AAC 44100Hz
// OUTPUT   : clip_pingpong_x3.mp4
// MODO     : PINGPONG ×3

> PING-PONG ×3 — re-encode CRF18
> ffmpeg -y -i clip.mp4 -filter_complex [...]

▶ frame=  1234  time=00:00:41  speed=2.3x  size=28.1MB  elapsed=28.4s

// ─────────────────────────────────────────
// COMPLETADO ✓
// OUTPUT   : clip_pingpong_x3.mp4
// DURACIÓN : 00:33.0
// PESO     : 30.24 MB
// TIEMPO   : 64.32s
// ─────────────────────────────────────────
```

---

## NOTAS DE AUDIO

- El script detecta automáticamente si el video tiene pista de audio via `ffprobe`.
- Si tiene audio: se procesa y sincroniza con el video (crossfade usa `acrossfade`, pingpong usa `areverse`).
- Si no tiene audio: se agrega `-an` al comando (output sin audio).

---

## RENDIMIENTO ESPERADO

| Modo | Video 11s 834×1112 ×3 | Notas |
|------|----------------------|-------|
| normal | ~0.3s | Stream copy, sin límite de velocidad |
| pingpong | ~64s | Reverse + concat + re-encode H.264 |
| crossfade | ~30-60s | xfade chain + re-encode |

El tiempo depende de: longitud del clip, resolución, número de loops, hardware.

---

## ARQUITECTURA — POR QUÉ CLI Y NO BROWSER

Esta herramienta nació como UI browser con FFmpeg.wasm. Murió ahí también.

**El camino del browser (FFmpeg.wasm):**
1. FFmpeg.wasm v0.12.6 pesa ~22MB (core.wasm + core.js + worker.js)
2. `worker.js` tiene imports relativos `./const.js` / `./errors.js` que se rompen en blob: URLs
3. Incluso parcheando los imports, `ffmpeg-core.js` es formato UMD no ESM — `import().default` devuelve undefined
4. `toBlobURL()` de `@ffmpeg/util@0.12.1` tiene bug: re-lee el stream cuando `progress=true` → error "body stream already read"
5. SharedArrayBuffer requiere headers `COOP/COEP` para multi-thread — Vercel los sirve, file:// no
6. Después de 6+ horas de debugging: el módulo simplemente no carga

**El camino CLI (nativo):**
- FFmpeg nativo = mismo binario de siempre, 0 overhead
- Sin CORS, sin module workers, sin blob URLs, sin WASM
- `filter_complex` es más potente en CLI que en wasm
- El output va directo al filesystem → sin limitación de RAM del browser
- `ffprobe` da metadata limpia en JSON

La lesson: FFmpeg.wasm es útil para demos simples. Para procesamiento real con filter_complex y re-encode, el CLI es 10× más confiable.

---

---

# GLOSARIO PSYCHO-ENGINEER

*Términos que todo ingeniero de medios debe dominar. Con las cicatrices de haberlos debuggeado de noche.*

---

### FFmpeg
La navaja suiza del video. Binario de línea de comando que procesa video, audio e imagen usando libavcodec, libavformat y libavfilter. Lleva 20 años de desarrollo. Puede hacer casi cualquier cosa con medios digitales — convertir formatos, re-encodear, filtrar, concatenar, transmitir.

---

### FFprobe
Hermano de lectura de FFmpeg. Lee un archivo y devuelve metadata en JSON, XML o texto: codec, resolución, fps, duración, bitrate, pistas de audio/video, chapters. Esencial para inspección antes de procesar.

```bash
ffprobe -v quiet -print_format json -show_streams -show_format video.mp4
```

---

### Stream Copy (`-c copy`)
Copia el bitstream sin decodificar ni re-encodear. El video llega comprimido → se escribe comprimido, bit a bit. Resultado: velocidad máxima + calidad 100% preservada. Solo funciona cuando el contenedor destino soporta el codec fuente.

---

### Codec
Algoritmo de compresión/descompresión para video o audio. H.264 (AVC), H.265 (HEVC), VP9, AV1 son video codecs. AAC, MP3, Opus son audio codecs. El **contenedor** (`.mp4`, `.mkv`, `.webm`) es solo el envoltorio — puede contener distintos codecs.

---

### Bitrate
Bits por segundo procesados. Mayor bitrate = mayor calidad y mayor tamaño de archivo. Hay bitrate constante (CBR) y variable (VBR). H.264 con CRF usa VBR — asigna más bits donde hay más detalle, menos donde hay zonas planas.

---

### CRF (Constant Rate Factor)
Control de calidad para H.264/H.265. 0 = lossless (enorme), 18 = visualmente lossless para la mayoría del contenido, 23 = default de libx264, 51 = basura pixelada. No controla bitrate directamente — controla la calidad objetivo y deja que el encoder use los bits necesarios.

---

### Concat Demuxer
Método FFmpeg para concatenar archivos usando un archivo de lista `.txt`:
```
file 'clip.mp4'
file 'clip.mp4'
file 'clip.mp4'
```
```bash
ffmpeg -f concat -safe 0 -i lista.txt -c copy output.mp4
```
`-safe 0` permite rutas absolutas. La forma más rápida de hacer loops — sin re-encode.

---

### filter_complex
Sistema de grafos de filtros en FFmpeg. Permite encadenar operaciones en múltiples streams de entrada/salida con sintaxis `[input]filtro=params[output]`. Es el corazón del procesamiento avanzado: split, merge, overlay, crossfade, reverse, scale, todo en una sola pasada.

```
-filter_complex "[0:v]split=3[v0][v1][v2]; [v1]reverse[vr1]; [v0][vr1][v2]concat=n=3:v=1[vout]"
```

---

### split / asplit
Filtros que duplican un stream en N ramas. `split` para video, `asplit` para audio. Necesario cuando querés aplicar diferentes operaciones a distintas copias del mismo clip.

---

### concat (filtro)
Une N streams video/audio en secuencia temporal. `concat=n=3:v=1:a=1` une 3 pares video+audio. Distinto del concat demuxer — este re-encodea.

---

### xfade
Filtro de crossfade entre dos streams de video. `[v0][v1]xfade=transition=fade:duration=0.5:offset=10.5[out]`. El `offset` es cuándo empieza la transición (en segundos desde el inicio del primer clip). El `duration` es cuánto dura la disolución. Tiene 30+ transiciones: fade, wipeleft, circleopen, pixelize, etc.

---

### acrossfade
Equivalente de `xfade` para audio. `[a0][a1]acrossfade=d=0.5[aout]`. Hace crossfade de audio entre dos streams — el volumen del primero baja mientras el del segundo sube.

---

### reverse / areverse
Filtros que invierten un stream. `[v0]reverse[vr0]` reproduce el video al revés. `[a0]areverse[ar0]` invierte el audio. Requieren cargar el stream completo en memoria antes de procesar — pueden ser lentos y pesados para clips largos. La base del modo ping-pong.

---

### Seamless Loop
Loop donde el último frame conecta visualmente con el primero — sin salto, sin parpadeo. Hay dos técnicas:
1. **Ping-pong**: el video se reproduce adelante → reversa → adelante. El punto de inversión es naturalmente seamless.
2. **Crossfade**: el final se disuelve con el inicio en cada juntura. No es "real" seamless pero lo parece.

---

### Ping-pong / Boomerang
Patrón de animación donde el clip va adelante luego reversa en loop. Popular en GIFs, motion design, loops de arte generativo. El resultado tiene duración doble pero se siente continuo si el movimiento es orgánico.

---

### FFmpeg.wasm
FFmpeg compilado a WebAssembly para correr en el browser. Permite procesamiento de video 100% local sin servidor. Pesa ~22MB solo el core. Versión v0.12.x usa arquitectura multi-worker. Potente pero complejo de configurar correctamente — problemas de CORS, module workers, SharedArrayBuffer, y bugs en las utilidades de carga.

---

### WebAssembly (WASM)
Formato binario que permite correr código compilado (C, C++, Rust) en el browser a velocidad casi nativa. No es JavaScript — es un bytecode que la VM del browser ejecuta directamente. La base de FFmpeg.wasm, Figma, AutoCAD web, Google Earth, etc.

---

### Module Worker
Web Worker que usa `type: 'module'` — permite `import` estático/dinámico dentro del worker. Chrome tiene restricciones estrictas: el script del worker debe ser same-origin o tener CORS apropiado. Los blob: URLs no cuentan como same-origin con https:// → causa errores de acceso.

---

### Blob URL
URL del tipo `blob:https://origen/uuid` creada desde datos en memoria. `URL.createObjectURL(new Blob([texto], {type: 'text/javascript'}))`. Permite cargar recursos dinámicamente sin fetch. Tiene scope de origen — no comparte origen con URLs HTTPS externas, lo cual rompe module workers cuando intentan importar desde CDN.

---

### CORS (Cross-Origin Resource Sharing)
Mecanismo de seguridad del browser. Cuando JS en `origen-A.com` hace fetch a `origen-B.com`, el servidor B debe responder con `Access-Control-Allow-Origin: *` o `Access-Control-Allow-Origin: origen-A.com`. Sin ese header, el browser bloquea la respuesta. CDNs públicos como jsDelivr y unpkg lo tienen habilitado. Archivos locales (`file://`) tienen origen `null` — algunas operaciones se vuelven imposibles.

---

### SharedArrayBuffer
Tipo de datos JavaScript que permite memoria compartida entre el thread principal y Web Workers. Requerido para el modo multi-thread de FFmpeg.wasm (procesa en paralelo, mucho más rápido). Requiere que la página sirva headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Sin estos headers: `SharedArrayBuffer is not defined`. Vercel los puede servir; `file://` no puede.

---

### CDN (Content Delivery Network)
Red de servidores distribuidos geográficamente que sirven archivos estáticos desde el nodo más cercano al usuario. jsDelivr y unpkg son CDNs especializados en paquetes npm. Para FFmpeg.wasm: jsDelivr sirve los 22MB más rápido y con mejor uptime que unpkg para archivos grandes.

---

### toBlobURL
Función de `@ffmpeg/util` que descarga un archivo y devuelve un blob: URL. `v0.12.1` tiene un bug: cuando `progress=true`, lee el ReadableStream para el callback de progreso pero luego intenta leerlo de nuevo para crear el blob — falla con `"body stream already read"`. Fix: no usar `progress=true`, o implementar download manual con `resp.body.getReader()`.

---

### ReadableStream / getReader()
API del browser para consumir datos de forma streaming. `fetch(url)` devuelve un Response cuyo `.body` es un ReadableStream. `.getReader()` da acceso chunk a chunk — útil para progress tracking. **Crítico:** un stream solo puede tener un reader activo. Si algo ya lo leyó, no podés leerlo de nuevo.

---

### ESM vs UMD
Dos formatos de módulos JavaScript:
- **ESM** (ES Modules): `import foo from './foo.js'` — nativo del browser moderno y Node ≥ 12
- **UMD** (Universal Module Definition): patrón que funciona en CommonJS, AMD, y como global del browser. `import(umdFile).default` devuelve `undefined` porque UMD no exporta via `default` en ESM — es un gotcha clásico.

`ffmpeg-core.js` es UMD. Importarlo como ESM no funciona sin patch manual.

---

### requestAnimationFrame (RAF)
API del browser que ejecuta una callback antes del próximo repintado visual (~60fps en monitores estándar). La forma correcta de hacer animaciones suaves en JS — no usar `setInterval` para animaciones porque no sincroniza con el ciclo de render del browser. RAF automáticamente pausa cuando la tab no está visible → ahorra batería.

---

### ffprobe JSON output
```json
{
  "streams": [
    {"codec_type": "video", "codec_name": "h264", "width": 834, "height": 1112, "r_frame_rate": "30/1"},
    {"codec_type": "audio", "codec_name": "aac", "sample_rate": "44100"}
  ],
  "format": {
    "duration": "11.000000",
    "size": "5242880",
    "bit_rate": "3814697"
  }
}
```
`r_frame_rate` es la framerate como fracción. `duration` en segundos como string float. `size` en bytes.

---

### Preset (H.264)
Compromiso velocidad/compresión de libx264. `ultrafast` → `superfast` → `veryfast` → `faster` → `fast` → `medium` → `slow` → `slower` → `veryslow`. Más lento = mejor compresión al mismo CRF. `fast` es el punto dulce para procesamiento interactivo — buena compresión sin esperar eternidades.

---

### Virtual Filesystem (VFS)
En FFmpeg.wasm, el sistema de archivos emulado en memoria. Los archivos del browser no existen en disco — se escriben al VFS (`ffmpeg.writeFile()`), se procesan, y se leen de vuelta (`ffmpeg.readFile()`). En CLI nativo: no hay VFS, se trabaja directo con el filesystem del OS.

---

### Scope mínimo viable
MVP (Minimum Viable Product). La versión más pequeña y funcional de algo — la que resuelve el problema core sin features extra. El antídoto contra el overengineering. Primero hacés que funcione, luego lo hacés bien, luego lo hacés rápido.

---

*Glosario generado con sangre y ffprobe. EsquizoAI-land · El Loko Akrata + Claude · 2026.*
