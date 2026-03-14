# ESQUIZOAI AUDIO WORKSTATION

Sintetizador modular browser-based. Vanilla JS + Web Audio API. Sin dependencias externas.

**Abrir:** `esquizoai-audio.html` en cualquier navegador moderno.

---

## Módulos de síntesis

| Módulo | Tipo | Presets |
|--------|------|---------|
| DRUMS | 5 voces (kick/snare/hat/clap/perc) | 808, 909, INDUSTRIAL, NOISE |
| BASS | Subtractive monofónico + sub-osc + glide | 10 (ACID_303, SUB_BASS, REESE…) |
| SYNTH | Dual-oscillator subtractive, polifónico | 14 (LEAD, PAD, STAB, STRINGS…) |
| FM | 2-op FM con feedback, polifónico | 8 (BELL, E_PIANO, METALLIC…) |
| SAMPLER | 4 slots con waveform display | — |
| GLITCH | White/Pink/Brown/Electric noise engine | — |

## Cadena de efectos

SSB Shift → Ring Mod → Bitcrusher → Waveshaper → Chorus/Flanger → Delay‖Reverb → Compressor → Tape FX → Sidechain

## Secuenciador

16 steps · 8 patrones (A–H) · 13 tracks · Euclidean · Copy/Paste · Song mode

## Controles de teclado

| Tecla | Acción |
|-------|--------|
| `SPACE` | Play / Stop |
| `Z S X D C V G B H N J M ,` | Notas C–C (una octava) |

La octava base depende del tab activo: Bass = C2, Synth/FM = C3.

---

## Manual completo

`docs/ESQUIZOAI_AUDIO_MANUAL.pdf` — referencia completa de todos los parámetros, rangos, presets y tips de producción.

**Regenerar PDF tras editar el manual:**

```bash
cd docs
npm install   # solo la primera vez
node generate-pdf.js
```

**Editar contenido:** modificar `docs/esquizoai-audio-manual.html` y regenerar.
