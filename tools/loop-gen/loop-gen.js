#!/usr/bin/env node
/**
 * LOOP_GEN v1.0 — Video Loop Generator CLI
 * EsquizoAI-land · El Loko Akrata + Claude
 *
 * Uso: node loop-gen.js <input> [opciones]
 */

import { execSync, spawn } from 'child_process';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { basename, extname } from 'path';

// ── COLORES ANSI ──────────────────────────────────────────────────────────────
const C = {
    green:  '\x1b[32m',
    acid:   '\x1b[92m',
    amber:  '\x1b[33m',
    red:    '\x1b[31m',
    corrupt:'\x1b[35m',
    dim:    '\x1b[2m',
    bold:   '\x1b[1m',
    reset:  '\x1b[0m',
};

const log  = (msg, col = 'green') => console.log(`${C[col]}${msg}${C.reset}`);
const die  = (msg) => { console.error(`\n${C.red}// ERROR: ${msg}${C.reset}\n`); process.exit(1); };

// ── AYUDA ─────────────────────────────────────────────────────────────────────
const HELP = `
${C.green}${C.bold}LOOP_GEN v1.0${C.reset} ${C.dim}// EsquizoAI-land · FFmpeg CLI wrapper${C.reset}

${C.amber}USO:${C.reset}
  node loop-gen.js <input> [opciones]

${C.amber}OPCIONES:${C.reset}
  -n  --loops <N>       Número de loops          (default: 3)
  -m  --mode  <modo>    normal | crossfade | pingpong  (default: normal)
  -f  --fade  <seg>     Duración fade crossfade   (default: 0.5)
  -q  --crf   <N>       Calidad re-encode 0-51    (default: 18)
  -o  --output <file>   Nombre del output         (auto si no se especifica)
  -h  --help            Esta ayuda

${C.amber}MODOS:${C.reset}
  ${C.acid}normal${C.reset}     Concat lossless (-c copy). Sin re-encode. Máxima velocidad.
  ${C.acid}crossfade${C.reset}  Disuelve final con inicio en cada juntura. Re-encode.
  ${C.acid}pingpong${C.reset}   Alterna adelante→reversa. Seamless natural. Re-encode.

${C.amber}EJEMPLOS:${C.reset}
  node loop-gen.js clip.mp4 -n 4
  node loop-gen.js clip.mp4 -n 3 -m crossfade -f 0.8
  node loop-gen.js clip.mp4 -n 6 -m pingpong
  node loop-gen.js clip.mp4 -n 3 -m crossfade -f 1 -o seamless.mp4
`;

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(HELP); process.exit(0);
}

// ── PARSE ARGS ────────────────────────────────────────────────────────────────
const getArg = (flags, def) => {
    for (const f of flags) {
        const i = args.indexOf(f);
        if (i !== -1 && args[i + 1] && !args[i + 1].startsWith('-')) return args[i + 1];
    }
    return def;
};

const input   = args[0];
const loops   = parseInt(getArg(['-n', '--loops'],  '3'));
const mode    = getArg(['-m', '--mode'],   'normal');
const fade    = parseFloat(getArg(['-f', '--fade'], '0.5'));
const crf     = getArg(['-q', '--crf'],    '18');
const outArg  = getArg(['-o', '--output'], null);

// ── VALIDACIONES ──────────────────────────────────────────────────────────────
if (!input)                                          die('Especificá un archivo de entrada.');
if (!existsSync(input))                              die(`Archivo no encontrado: ${input}`);
if (!['normal','crossfade','pingpong'].includes(mode)) die(`Modo inválido: "${mode}". Opciones: normal, crossfade, pingpong`);
if (isNaN(loops) || loops < 2 || loops > 500)        die('--loops debe ser un número entre 2 y 500.');
if (isNaN(fade)  || fade <= 0)                       die('--fade debe ser un número positivo (ej: 0.5).');

const ext    = extname(input);
const base   = basename(input, ext);
const output = outArg || `${base}_${mode}_x${loops}.mp4`;

// ── FFPROBE HELPERS ───────────────────────────────────────────────────────────
function probe(file) {
    try {
        const raw = execSync(
            `ffprobe -v quiet -print_format json -show_streams -show_format "${file}"`,
            { encoding: 'utf8' }
        );
        return JSON.parse(raw);
    } catch(e) { die('No se pudo leer el archivo. ¿FFprobe instalado?'); }
}

const info     = probe(input);
const vidStream = info.streams.find(s => s.codec_type === 'video');
const audStream = info.streams.find(s => s.codec_type === 'audio');
const duration  = parseFloat(info.format.duration);
const hasAudio  = !!audStream;

// ── HEADER ───────────────────────────────────────────────────────────────────
console.log(`\n${C.green}╔══════════════════════════════════════════╗${C.reset}`);
console.log(`${C.green}║  LOOP_GEN v1.0 — EsquizoAI-land         ║${C.reset}`);
console.log(`${C.green}╚══════════════════════════════════════════╝${C.reset}\n`);
log(`// INPUT    : ${input}`,                           'dim');
log(`// DURACIÓN : ${fmtDur(duration)}  (${duration.toFixed(3)}s)`, 'dim');
log(`// VIDEO    : ${vidStream?.codec_name?.toUpperCase()} ${vidStream?.width}×${vidStream?.height} ${vidStream?.r_frame_rate?.split('/')[0]}fps`, 'dim');
log(`// AUDIO    : ${hasAudio ? audStream.codec_name.toUpperCase() + ' ' + audStream.sample_rate + 'Hz' : 'SIN AUDIO'}`, 'dim');
log(`// OUTPUT   : ${output}`,                          'dim');
log(`// MODO     : ${mode.toUpperCase()} ×${loops}`,   'dim');
if (mode === 'crossfade') log(`// FADE     : ${fade}s`, 'dim');
if (mode !== 'normal')    log(`// CRF      : ${crf}`,   'dim');
console.log();

// ── BUILD COMMAND ─────────────────────────────────────────────────────────────
function buildCmd() {

    // ── NORMAL: lossless concat ──────────────────────────────────────────────
    if (mode === 'normal') {
        const listFile = `_loopgen_tmp_${Date.now()}.txt`;
        writeFileSync(listFile, Array(loops).fill(`file '${input}'`).join('\n'));
        return {
            ffArgs:  ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', output],
            cleanup: () => { try { unlinkSync(listFile); } catch(_) {} },
            modeLabel: 'LOSSLESS COPY — SIN RE-ENCODE'
        };
    }

    // ── PING-PONG: alternating forward/reverse ───────────────────────────────
    if (mode === 'pingpong') {
        const N       = loops;
        const vSplit  = Array.from({length: N}, (_, i) => `[v${i}]`).join('');
        const filters = [`[0:v]split=${N}${vSplit}`];
        const vSeq    = [];

        for (let i = 0; i < N; i++) {
            if (i % 2 === 1) { filters.push(`[v${i}]reverse[vr${i}]`); vSeq.push(`[vr${i}]`); }
            else               vSeq.push(`[v${i}]`);
        }
        filters.push(`${vSeq.join('')}concat=n=${N}:v=1[vout]`);

        const maps = ['-map', '[vout]'];

        if (hasAudio) {
            const aSplit = Array.from({length: N}, (_, i) => `[a${i}]`).join('');
            filters.push(`[0:a]asplit=${N}${aSplit}`);
            const aSeq = [];
            for (let i = 0; i < N; i++) {
                if (i % 2 === 1) { filters.push(`[a${i}]areverse[ar${i}]`); aSeq.push(`[ar${i}]`); }
                else               aSeq.push(`[a${i}]`);
            }
            filters.push(`${aSeq.join('')}concat=n=${N}:v=0:a=1[aout]`);
            maps.push('-map', '[aout]');
        }

        return {
            ffArgs: [
                '-y', '-i', input,
                '-filter_complex', filters.join(';'),
                ...maps,
                '-c:v', 'libx264', '-crf', crf, '-preset', 'fast',
                ...(hasAudio ? ['-c:a', 'aac'] : ['-an']),
                output
            ],
            cleanup: () => {},
            modeLabel: `PING-PONG ×${N} — re-encode CRF${crf}`
        };
    }

    // ── CROSSFADE: xfade entre cada juntura ──────────────────────────────────
    if (mode === 'crossfade') {
        const N  = loops;
        const F  = Math.min(fade, duration * 0.4); // cap al 40% de la duración
        const vC = Array.from({length: N}, (_, i) => `[v${i}]`).join('');
        const filters = [`[0:v]split=${N}${vC}`];

        for (let i = 0; i < N - 1; i++) {
            const offset = ((i + 1) * (duration - F)).toFixed(4);
            const vIn  = i === 0     ? `[v0][v1]`           : `[xv${i-1}][v${i+1}]`;
            const vOut = i === N - 2 ? `[vout]`              : `[xv${i}]`;
            filters.push(`${vIn}xfade=transition=fade:duration=${F}:offset=${offset}${vOut}`);
        }

        const maps = ['-map', '[vout]'];

        if (hasAudio) {
            const aC = Array.from({length: N}, (_, i) => `[a${i}]`).join('');
            filters.push(`[0:a]asplit=${N}${aC}`);
            for (let i = 0; i < N - 1; i++) {
                const aIn  = i === 0     ? `[a0][a1]`           : `[xa${i-1}][a${i+1}]`;
                const aOut = i === N - 2 ? `[aout]`              : `[xa${i}]`;
                filters.push(`${aIn}acrossfade=d=${F}${aOut}`);
            }
            maps.push('-map', '[aout]');
        }

        log(`// FADE efectivo: ${F.toFixed(3)}s${F < fade ? ` (ajustado desde ${fade}s — máx 40% clip)` : ''}`, 'amber');

        return {
            ffArgs: [
                '-y', '-i', input,
                '-filter_complex', filters.join(';'),
                ...maps,
                '-c:v', 'libx264', '-crf', crf, '-preset', 'fast',
                ...(hasAudio ? ['-c:a', 'aac'] : ['-an']),
                output
            ],
            cleanup: () => {},
            modeLabel: `CROSSFADE fade=${F.toFixed(2)}s — re-encode CRF${crf}`
        };
    }
}

// ── RUN ───────────────────────────────────────────────────────────────────────
const { ffArgs, cleanup, modeLabel } = buildCmd();

log(`> ${modeLabel}`, 'amber');
log(`> ffmpeg ${ffArgs.join(' ')}\n`, 'dim');

const start = Date.now();
const proc  = spawn('ffmpeg', ffArgs);
let   lastFrame = '';

proc.stderr.on('data', chunk => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
        if (line.includes('frame=')) {
            const frame = /frame=\s*(\d+)/.exec(line)?.[1] ?? '';
            const time  = /time=\s*([\d:.]+)/.exec(line)?.[1] ?? '';
            const speed = /speed=\s*([\d.]+)x/.exec(line)?.[1] ?? '';
            const size  = /size=\s*(\d+)kB/.exec(line)?.[1];
            const sizeMB = size ? (parseInt(size)/1024).toFixed(1)+'MB' : '';
            const elapsed = ((Date.now()-start)/1000).toFixed(1);
            process.stdout.write(
                `\r${C.green}▶ ${C.reset}frame=${C.acid}${frame.padStart(6)}${C.reset}  time=${C.acid}${time}${C.reset}  speed=${C.amber}${speed}${C.reset}  size=${C.dim}${sizeMB}${C.reset}  elapsed=${C.dim}${elapsed}s${C.reset}  `
            );
        }
    }
});

proc.on('close', code => {
    process.stdout.write('\n');
    cleanup();
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    if (code !== 0) { die(`FFmpeg terminó con error (código ${code}).`); }

    const out = probe(output);
    const outDur  = parseFloat(out.format.duration);
    const outSize = parseInt(out.format.size);

    console.log();
    log('// ─────────────────────────────────────────', 'green');
    log('// COMPLETADO ✓', 'acid');
    log(`// OUTPUT   : ${output}`, 'acid');
    log(`// DURACIÓN : ${fmtDur(outDur)}  (${outDur.toFixed(3)}s)`, 'acid');
    log(`// PESO     : ${(outSize/1024/1024).toFixed(2)} MB`, 'acid');
    log(`// TIEMPO   : ${elapsed}s`, 'acid');
    log('// ─────────────────────────────────────────', 'green');
    console.log();
});

proc.on('error', e => { cleanup(); die(`No se pudo ejecutar FFmpeg: ${e.message}`); });

// ── UTILS ─────────────────────────────────────────────────────────────────────
function fmtDur(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = (sec % 60).toFixed(1);
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(parseFloat(s).toFixed(1)).padStart(4,'0')}`
                 : `${String(m).padStart(2,'0')}:${String(parseFloat(s).toFixed(1)).padStart(4,'0')}`;
}
