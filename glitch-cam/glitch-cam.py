"""
GLITCH.CAM — EsquizoAI
Efectos glitch en tiempo real sobre webcam.
Uso: python glitch-cam.py [--cam 0] [--width 1280] [--height 720] [--intensity 50]

Controles:
  1-9   toggle efectos
  0     modo CAOS
  +/-   intensidad
  h     toggle HUD
  r     reset todo
  f     toggle fullscreen
  q     salir
"""

import cv2
import numpy as np
import argparse
import time
import sys
import inspect

# ─── ARGUMENTOS ───────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description='GLITCH.CAM | EsquizoAI')
parser.add_argument('--cam',       type=int, default=0,    help='Índice de cámara (default 0)')
parser.add_argument('--width',     type=int, default=1280, help='Ancho captura')
parser.add_argument('--height',    type=int, default=720,  help='Alto captura')
parser.add_argument('--intensity', type=int, default=50,   help='Intensidad inicial 0-100')
args = parser.parse_args()

# ─── ESTADO ───────────────────────────────────────────────────────────────────
fx = {
    'rgb_split':     False,  # 1
    'displacement':  False,  # 2
    'scanlines':     False,  # 3
    'noise':         False,  # 5
    'glitch_blocks': False,  # 6
    'crt_warp':      False,  # 7
    'color_cycle':   False,  # 8
    'ascii':         False,  # 9
}
corrupt_mode  = 0  # 0=off  1=bloques  2=orgánico  3=completo
datamosh_mode = 0  # 0=off  1=ghst  2=soul  3=frac
blnd_on       = False  # trail base — combina con cualquier modo del 4
rev_mode      = 0  # REVENTUS: 0=off 1=swrl 2=acid 3=zoom 4=echo 5=drnk 6=balo
mirror_mode   = 0  # MIRROR full-screen: 0=off 1=mir2 2=kl4 3=kl8 4=kl16

intensity  = args.intensity / 100.0
hud_on     = True
clean_mode = False   # Tab — oculta TODO el HUD (tecla secreta para OBS)
fullscreen = False
prev_frame = None

# ─── EFECTOS ──────────────────────────────────────────────────────────────────

def rgb_split(frame, t):
    off = int(t * 25) + 2
    b, g, r = cv2.split(frame)
    h, w = frame.shape[:2]
    M = lambda dx: np.float32([[1,0,dx],[0,1,0]])
    r2 = cv2.warpAffine(r, M( off), (w,h), borderMode=cv2.BORDER_REFLECT)
    b2 = cv2.warpAffine(b, M(-off), (w,h), borderMode=cv2.BORDER_REFLECT)
    return cv2.merge([b2, g, r2])

def displacement(frame, t):
    h, w = frame.shape[:2]
    max_shift = int(t * 40) + 4
    prob = t * 0.65
    result = frame.copy()
    mask = np.random.random(h) < prob
    shifts = np.random.randint(-max_shift, max_shift + 1, h)
    for y in range(h):
        if mask[y]:
            result[y] = np.roll(frame[y], shifts[y], axis=0)
    return result

def noise(frame, t):
    n = np.random.normal(0, t * 55, frame.shape).astype(np.int16)
    return np.clip(frame.astype(np.int16) + n, 0, 255).astype(np.uint8)

_mosh_buf  = None   # buffer ghost/soul
_frac_buf  = None   # offsets de bloques para FRAC

MOSH_NAMES = {0:'OFF', 1:'GHST', 2:'SOUL', 3:'FRAC'}

def fx_ghst(frame, prev, t, tick=0):
    """GHOST — fantasma pronunciado con aura, deriva y glow."""
    global _mosh_buf
    h, w = frame.shape[:2]
    if _mosh_buf is None:
        _mosh_buf = frame.astype(np.float32); return frame
    decay     = 0.92 + t * 0.07          # más alto = persiste mucho más
    _mosh_buf = _mosh_buf * decay + frame.astype(np.float32) * (1 - decay)
    ghost     = _mosh_buf.clip(0, 255).astype(np.uint8)
    # Glow: blur suave sobre el fantasma le da cuerpo
    ghost = cv2.GaussianBlur(ghost, (7, 7), 0)
    # Deriva más pronunciada
    dx = int(t * 7 * np.sin(tick * 0.018))
    dy = int(t * 5 * np.cos(tick * 0.013))
    if dx or dy:
        ghost = cv2.warpAffine(ghost, np.float32([[1,0,dx],[0,1,dy]]),
                               (w, h), borderMode=cv2.BORDER_REFLECT)
    # Tinte azul-verde / aura más intensa
    ghost_f = ghost.astype(np.float32)
    ghost_f[:, :, 0] = np.clip(ghost_f[:, :, 0] * 1.4,  0, 255)  # +B
    ghost_f[:, :, 1] = np.clip(ghost_f[:, :, 1] * 1.1,  0, 255)  # +G leve
    ghost_f[:, :, 2] = np.clip(ghost_f[:, :, 2] * 0.65, 0, 255)  # -R
    alpha = 0.3 + t * 0.60               # visible incluso a baja intensidad
    return np.clip(frame.astype(np.float32) * (1-alpha) +
                   ghost_f * alpha, 0, 255).astype(np.uint8)

def fx_soul(frame, prev, t, tick=0):
    """SOUL — múltiples copias fantasma driftando, alma separándose del cuerpo."""
    global _mosh_buf
    if _mosh_buf is None:
        _mosh_buf = frame.astype(np.float32); return frame
    decay     = 0.86 + t * 0.11
    _mosh_buf = _mosh_buf * decay + frame.astype(np.float32) * (1 - decay)
    ghost     = _mosh_buf.clip(0, 255).astype(np.uint8)
    n_souls   = int(t * 2) + 2           # 2 a 4 almas
    result    = frame.astype(np.float32) * 0.35
    for i in range(n_souls):
        phase = i * 2.09 + tick * 0.017
        dx = int(t * (18 + i * 12) * np.sin(phase))
        dy = int(t * (12 + i *  8) * np.cos(phase * 0.78))
        soul = np.roll(np.roll(ghost, dx, axis=1), dy, axis=0).astype(np.float32)
        soul[:, :, i % 3] = np.clip(soul[:, :, i % 3] * 1.6, 0, 255)
        result += soul * (0.52 / (i + 1))
    return result.clip(0, 255).astype(np.uint8)

def fx_frac(frame, prev, t, tick=0):
    """FRAC — imagen se rompe en bloques que intentan reconstruirse sin lograrlo."""
    global _frac_buf
    h, w  = frame.shape[:2]
    block = max(12, int(56 - t * 40))      # bloques más pequeños con más intensidad
    n_bh  = (h + block - 1) // block
    n_bw  = (w + block - 1) // block

    if _frac_buf is None or _frac_buf.shape[:2] != (n_bh, n_bw):
        _frac_buf = np.zeros((n_bh, n_bw, 2), dtype=np.float32)

    # Todos los bloques decaen hacia 0 — intento de reconstrucción
    _frac_buf *= (0.80 + t * 0.13)

    # Nuevas fracturas aleatorias
    new_frac = np.random.random((n_bh, n_bw)) < (0.04 + t * 0.20)
    count    = int(new_frac.sum())
    if count > 0:
        max_d = 18 + int(t * 95)
        _frac_buf[new_frac] = np.random.uniform(-max_d, max_d, (count, 2)).astype(np.float32)

    # Expandir offsets de bloques a nivel de píxel (vectorizado)
    ox_px = np.repeat(np.repeat(_frac_buf[:, :, 0], block, axis=0),
                      block, axis=1)[:h, :w]
    oy_px = np.repeat(np.repeat(_frac_buf[:, :, 1], block, axis=0),
                      block, axis=1)[:h, :w]
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    map_x = np.clip(x_g + ox_px, 0, w-1).astype(np.float32)
    map_y = np.clip(y_g + oy_px, 0, h-1).astype(np.float32)
    return cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_REFLECT)

MOSH_FUNCS = {1: fx_ghst, 2: fx_soul, 3: fx_frac}

def color_cycle(frame, t, tick):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.float32)
    shift = (tick * t * 1.8) % 180
    hsv[:, :, 0] = (hsv[:, :, 0] + shift) % 180
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * (1 + t * 0.5), 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

def scanlines(frame, t):
    result = frame.copy()
    alpha = 0.12 + t * 0.3
    result[::3] = (result[::3] * (1 - alpha)).astype(np.uint8)
    return result

def glitch_blocks(frame, t):
    result = frame.copy()
    h, w = frame.shape[:2]
    count = int(t * 14) + 2
    for _ in range(count):
        if np.random.random() > 0.45:
            continue
        bx = np.random.randint(0, w)
        by = np.random.randint(0, h)
        bw = np.random.randint(15, max(16, int(w * 0.4)))
        bh = np.random.randint(2, 48)
        dx = int((np.random.random() - 0.5) * t * 90)
        sx1, sx2 = max(0, bx),    min(w, bx + bw)
        sy1, sy2 = max(0, by),    min(h, by + bh)
        dx1, dx2 = max(0, bx+dx), min(w, bx+dx+bw)
        if sx2>sx1 and sy2>sy1 and dx2>dx1:
            chunk_w = min(sx2-sx1, dx2-dx1)
            result[sy1:sy2, dx1:dx1+chunk_w] = frame[sy1:sy2, sx1:sx1+chunk_w]
    return result

def crt_warp(frame, t, tick):
    h, w = frame.shape[:2]
    ys = np.arange(h, dtype=np.float32)
    xs = np.arange(w, dtype=np.float32)
    map_x = np.tile(xs, (h, 1))
    warp_vals = (np.sin(ys * 0.022 + tick * 0.015) * t * 12).reshape(h, 1)
    map_x = (map_x + warp_vals).astype(np.float32)
    map_y = np.tile(ys.reshape(h,1), (1, w)).astype(np.float32)
    return cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_REFLECT)

# ─── COLOR CORRUPT — MODO 1: BLOQUES ─────────────────────────────────────────
def color_corrupt_blocks(frame, t):
    result = frame.copy()
    h, w = frame.shape[:2]
    num_regions = int(t * 18) + 3
    max_rw = max(9,  int(w * (0.08 + t * 0.92)))
    max_rh = max(3,  int(h * (0.04 + t * 0.70)))
    for _ in range(num_regions):
        if np.random.random() > 0.55: continue
        rx  = np.random.randint(0, max(1, w - 10))
        ry  = np.random.randint(0, max(1, h - 10))
        rx2 = min(rx + np.random.randint(8, max_rw), w)
        ry2 = min(ry + np.random.randint(2, max_rh), h)
        result[ry:ry2, rx:rx2, np.random.randint(0,3)] ^= np.random.randint(20, 240)
    num_inv = int(t * 7) + 1
    for _ in range(num_inv):
        if np.random.random() < 0.45: continue
        rx  = np.random.randint(0, w)
        ry  = np.random.randint(0, h)
        rw  = np.random.randint(15, max(16, int(w * (0.15 + t * 0.85))))
        rh  = np.random.randint(3,  max(4,  int(h * (0.05 + t * 0.55))))
        result[ry:min(ry+rh,h), rx:min(rx+rw,w)] = \
            255 - result[ry:min(ry+rh,h), rx:min(rx+rw,w)]
    if t > 0.6 and np.random.random() < (t - 0.6) * 1.2:
        result[:, :, np.random.randint(0,3)] ^= np.random.randint(15, 80)
    return result

# ─── COLOR CORRUPT — MODO 2: ORGÁNICO (sin rayas ni bloques) ─────────────────
def color_corrupt_organic(frame, t):
    result = frame.copy()
    h, w = frame.shape[:2]
    # LUT — remapeo puro de valores, sin forma geométrica
    for ch in range(3):
        if np.random.random() > 0.55: continue
        lut = np.arange(256, dtype=np.uint8)
        mask = np.random.random(256) < (t * 0.35)
        lut[mask] = lut[mask] ^ np.random.randint(20, 220, 256).astype(np.uint8)[mask]
        result[:, :, ch] = lut[result[:, :, ch]]
    # Máscara sinusoidal 2D — ola de corrupción sin bordes rectos
    ys = np.arange(h, dtype=np.float32).reshape(h, 1)
    xs = np.arange(w, dtype=np.float32).reshape(1, w)
    for _ in range(int(t * 3) + 1):
        wave = np.sin(ys * np.random.uniform(0.01, 0.09)
                    + xs * np.random.uniform(0.005, 0.04)
                    + np.random.uniform(0, 6.28))
        sine_mask = wave > (1.0 - t * 0.85)
        ch = np.random.randint(0, 3)
        result[:, :, ch][sine_mask] ^= np.random.randint(40, 200)
    # Per-píxel — entropía sin forma
    if t > 0.4:
        swap_mask = np.random.random((h, w)) < (t - 0.4) * 0.5
        ch1, ch2  = np.random.choice(3, 2, replace=False)
        tmp = result[:, :, ch1][swap_mask].copy()
        result[:, :, ch1][swap_mask] = result[:, :, ch2][swap_mask]
        result[:, :, ch2][swap_mask] = tmp
    # Marea global a intensidad alta
    if t > 0.65 and np.random.random() < (t - 0.65) * 1.5:
        result[:, :, np.random.randint(0,3)] ^= np.random.randint(10, 70)
    return result

# ─── COLOR CORRUPT — MODO 3: COMPLETO (bloques + rayas + orgánico) ────────────
def color_corrupt_full(frame, t):
    result = color_corrupt_blocks(frame, t * 0.6)
    result = color_corrupt_organic(result, t)
    # Scanlines y columnas completas
    h, w = result.shape[:2]
    rows = np.where(np.random.random(h) < t * 0.45)[0]
    for y in rows:
        ch1, ch2 = np.random.choice(3, 2, replace=False)
        result[y, :, [ch1, ch2]] = result[y, :, [ch2, ch1]]
    cols = np.where(np.random.random(w) < t * 0.25)[0]
    for x in cols:
        result[:, x, np.random.randint(0,3)] ^= np.random.randint(30, 210)
    return result

# ─── COLOR CORRUPT — MODO 4: PURO (solo LUT + per-píxel, cero geometría) ─────
def color_corrupt_pure(frame, t):
    result = frame.copy()
    h, w = frame.shape[:2]

    # Solo remapeo de valores — sin ningún patrón espacial
    for ch in range(3):
        lut = np.arange(256, dtype=np.uint8)
        mask = np.random.random(256) < (t * 0.45)
        lut[mask] = lut[mask] ^ np.random.randint(20, 220, 256).astype(np.uint8)[mask]
        result[:, :, ch] = lut[result[:, :, ch]]

    # Intercambio per-píxel aleatorio — pura entropía sin forma
    pixel_prob = t * 0.55
    swap_mask  = np.random.random((h, w)) < pixel_prob
    ch1, ch2   = np.random.choice(3, 2, replace=False)
    tmp = result[:, :, ch1][swap_mask].copy()
    result[:, :, ch1][swap_mask] = result[:, :, ch2][swap_mask]
    result[:, :, ch2][swap_mask] = tmp

    # Marea global de color a intensidad alta
    if t > 0.5 and np.random.random() < (t - 0.5) * 1.8:
        result[:, :, np.random.randint(0,3)] ^= np.random.randint(10, 90)

    return result

CORRUPT_MODES = {1: color_corrupt_blocks,
                 2: color_corrupt_organic,
                 3: color_corrupt_full,
                 4: color_corrupt_pure}
CORRUPT_NAMES = {0:'OFF', 1:'BLK', 2:'ORG', 3:'ALL', 4:'PUR'}

# ─── REVENTUS — zona de efecto centrada en presencia detectada ────────────────

_rev_echo_buf = None  # buffer persistente para ECHO

def _face_mask(shape, bbox, feather=0.8):
    h, w = shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw / 2.0, by + bh / 2.0
    sx = bw * feather;  sy = bh * feather
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    mask = np.exp(-0.5 * ((x_g - cx)**2 / sx**2 + (y_g - cy)**2 / sy**2))
    return mask[:, :, np.newaxis]

def _blend(original, effected, mask):
    o = original.astype(np.float32)
    e = effected.astype(np.float32)
    return (o + (e - o) * mask).clip(0, 255).astype(np.uint8)

def _expand_bbox(bbox, frame_shape, factor=1.6):
    """Expande el bbox alrededor del centro para evitar bordes duros en kaleido."""
    h, w = frame_shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw // 2, by + bh // 2
    nw, nh = int(bw * factor), int(bh * factor)
    x1 = max(0, cx - nw // 2);  y1 = max(0, cy - nh // 2)
    x2 = min(w, cx + nw // 2);  y2 = min(h, cy + nh // 2)
    return (x1, y1, x2 - x1, y2 - y1)

def rev_swrl(frame, bbox, t, tick):
    """Espiral esquizo — 2 capas girando a velocidades distintas + zoom."""
    h, w = frame.shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw / 2.0, by + bh / 2.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = x_g - cx;  dy = y_g - cy
    r     = np.sqrt(dx**2 + dy**2) + 0.001
    angle = np.arctan2(dy, dx)

    result = np.zeros_like(frame, dtype=np.float32)
    for i, (spd, zmul) in enumerate([(0.04, 0.0), (0.025, 0.18)]):
        twist  = t * (2.8 + i * 1.4) * np.sin(tick * spd) / (1.0 + r * 0.005)
        zoom   = 1.0 + zmul * t * np.cos(tick * spd * 0.6)
        new_a  = angle + twist
        r2     = r / max(0.01, zoom)
        mx = np.clip(cx + r2 * np.cos(new_a), 0, w-1).astype(np.float32)
        my = np.clip(cy + r2 * np.sin(new_a), 0, h-1).astype(np.float32)
        layer = cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        result += layer.astype(np.float32) * (0.6 if i == 0 else 0.5)

    eff = (result / 1.1).clip(0, 255).astype(np.uint8)
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.2))

def rev_acid(frame, bbox, t, tick):
    """XOR multi-escala + corrupción pura + derretimiento por filas."""
    h, w = frame.shape[:2]
    s2 = cv2.resize(cv2.resize(frame, (w//2, h//2)), (w, h))
    s4 = cv2.resize(cv2.resize(frame, (w//4, h//4)), (w, h))
    s8 = cv2.resize(cv2.resize(frame, (max(1,w//8), max(1,h//8))), (w, h))
    phase = int(tick * max(0.3, t) * 2) % 3
    if phase == 0:   eff = frame ^ s2 ^ s4
    elif phase == 1: eff = s2    ^ s4 ^ s8
    else:            eff = frame ^ s4 ^ s8
    # Corrupción de color pura encima
    eff = color_corrupt_pure(eff, t * 0.85)
    # Derretimiento vectorizado por filas
    y_g2, x_g2 = np.mgrid[0:h, 0:w].astype(np.float32)
    row_shift = (np.random.normal(0, t * 18, h)).astype(np.float32)
    mx = np.clip(x_g2 + row_shift.reshape(h, 1), 0, w-1).astype(np.float32)
    eff = cv2.remap(eff, mx, y_g2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.1))

def rev_zoom(frame, bbox, t, tick):
    """2 zooms desfasados — cada uno en canal distinto, pulsan juntos."""
    h, w = frame.shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw / 2.0, by + bh / 2.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    layers = []
    for i, phase_off in enumerate([0.0, 2.1]):
        pulse = 1.0 + t * (0.4 + i * 0.2) * np.sin(tick * 0.07 + phase_off)
        mx = np.clip(cx + (x_g - cx) / pulse, 0, w-1).astype(np.float32)
        my = np.clip(cy + (y_g - cy) / pulse, 0, h-1).astype(np.float32)
        layers.append(cv2.remap(frame, mx, my, cv2.INTER_LINEAR,
                                borderMode=cv2.BORDER_REFLECT))
    # Canal split entre capas
    eff = layers[0].copy()
    eff[:, :, 1] = layers[1][:, :, 1]   # G de la segunda capa
    eff[:, :, 2] = cv2.addWeighted(      # R promediado
        layers[0][:,:,2], 0.5, layers[1][:,:,2], 0.5, 0)
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.0))

def rev_echo(frame, bbox, t):
    """Residuo slow — buffer persistente con decay lento."""
    global _rev_echo_buf
    h, w = frame.shape[:2]
    if _rev_echo_buf is None or _rev_echo_buf.shape != frame.shape:
        _rev_echo_buf = frame.astype(np.float32).copy()
    decay = 0.82 + t * 0.12        # más intensidad = decay más lento
    _rev_echo_buf = _rev_echo_buf * decay + frame.astype(np.float32) * (1.0 - decay)
    half = cv2.resize(cv2.resize(frame, (w//2, h//2)), (w, h))
    eff  = (_rev_echo_buf * 0.75 + half.astype(np.float32) * 0.35).clip(0,255).astype(np.uint8)
    eff  = eff ^ (frame & int(t * 35))
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.3))

def rev_drunk(frame, bbox, t, tick):
    """Múltiples yos fantasma — doble triple visión de borracho."""
    h, w = frame.shape[:2]
    n_ghosts = int(t * 3) + 2   # 2 a 5 copias según intensidad
    result = frame.astype(np.float32) * 0.4
    for i in range(1, n_ghosts + 1):
        phase = i * 2.09 + tick * 0.022   # cada fantasma en su propia fase
        ox = int(t * 38 * np.sin(phase))
        oy = int(t * 24 * np.cos(phase * 0.71))
        ghost = np.roll(np.roll(frame, ox, axis=1), oy, axis=0).astype(np.float32)
        ghost[:, :, i % 3] = np.clip(ghost[:, :, i % 3] * 1.4, 0, 255)  # tinte por copia
        result += ghost * (0.55 / i)
    eff = result.clip(0, 255).astype(np.uint8)
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.3))

def rev_balo(frame, bbox, t, tick):
    """Balloon inflate — balloon.glsl centrado en el rostro."""
    h, w = frame.shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw / 2.0, by + bh / 2.0
    rx, ry = bw * 0.6, bh * 0.6

    # Ciclo inflate/deflate ~10 s a 30 fps
    cp = (tick % 300) / 300.0
    ep = cp * 2.0 if cp < 0.5 else (1.0 - cp) * 2.0
    effect_r = (0.75 + t * 0.55) * np.sin(ep * np.pi)
    if effect_r < 0.01:
        return frame

    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (x_g - cx) / rx;  ny = (y_g - cy) / ry
    dist = np.sqrt(nx**2 + ny**2) + 0.001
    within   = dist < effect_r
    strength = np.where(within, 10.0 - (dist / effect_r), 0.0)
    bulge    = np.where(within, effect_r - dist, 0.0)
    scale    = 1.0 + strength * bulge * np.sin(ep * np.pi) * (0.08 + t * 0.18)
    scale    = np.maximum(0.05, scale)

    map_x = np.clip(cx + nx * scale * rx, 0, w-1).astype(np.float32)
    map_y = np.clip(cy + ny * scale * ry, 0, h-1).astype(np.float32)
    inflated = cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR,
                         borderMode=cv2.BORDER_REFLECT)
    return _blend(frame, inflated, _face_mask(frame.shape, bbox, 1.1))

REV_FUNCS    = {1: rev_swrl, 2: rev_acid, 3: rev_zoom,
                4: rev_echo, 5: rev_drunk, 6: rev_balo}
REV_NAMES    = {0:'OFF', 1:'SWRL', 2:'ACID', 3:'ZOOM',
                4:'ECHO', 5:'DRNK', 6:'BALO'}
REV_USE_TICK = {k for k, fn in REV_FUNCS.items()
                if 'tick' in inspect.signature(fn).parameters}

ASCII_CHARS = " .'`-_:,;!|/()?1iltfr*<>+=oxzXYUJCQ0OZmwqbdkh#%@"

def ascii_mode(frame, t):
    h, w = frame.shape[:2]
    cell = max(6, int(14 - t * 8))
    result = np.zeros_like(frame)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    for y in range(0, h - cell, cell):
        for x in range(0, w - cell, cell):
            lum = gray[y + cell//2, x + cell//2] / 255.0
            idx = int(lum * (len(ASCII_CHARS) - 1))
            b, g, r = frame[y + cell//2, x + cell//2]
            cv2.putText(result, ASCII_CHARS[idx], (x, y + cell),
                        cv2.FONT_HERSHEY_SIMPLEX, cell / 18.0,
                        (int(b), int(g), int(r)), 1, cv2.LINE_AA)
    return result

# ─── MIRROR FULL-SCREEN ───────────────────────────────────────────────────────

def screen_mir2(frame):
    """Espejo bilateral — mitad izquierda reflejada a la derecha."""
    h, w = frame.shape[:2]
    result = frame.copy()
    result[:, w//2:] = cv2.flip(frame[:, :w//2], 1)[:, :w - w//2]
    return result

def screen_kl4(frame):
    """Kaleido 4 cuadrantes — de vértice a vértice."""
    h, w = frame.shape[:2]
    tl  = frame[:h//2, :w//2].copy()
    top = np.concatenate([tl, cv2.flip(tl, 1)], axis=1)
    return np.concatenate([top, cv2.flip(top, 0)], axis=0)

def screen_kl8(frame):
    """Kaleido 8 sectores — triángulo reflejado radialmente."""
    h, w = frame.shape[:2]
    s   = min(h//2, w//2)
    tl  = cv2.resize(frame[:h//2, :w//2], (s, s))
    anti = cv2.transpose(cv2.flip(tl, 1))
    y_g, x_g = np.mgrid[0:s, 0:s].astype(np.float32)
    diag = (y_g < x_g).astype(np.float32)[:, :, np.newaxis]
    seg  = (tl.astype(np.float32) * (1-diag) + anti.astype(np.float32) * diag).astype(np.uint8)
    top  = np.concatenate([seg, cv2.flip(seg, 1)], axis=1)
    k    = np.concatenate([top, cv2.flip(top, 0)], axis=0)
    return cv2.resize(k, (w, h))

def screen_kl16(frame):
    """Kaleido 16 — doble kaleido, máxima potencia de espejo."""
    return screen_kl4(screen_kl8(frame))

MIRROR_FUNCS = {1: screen_mir2, 2: screen_kl4, 3: screen_kl8, 4: screen_kl16}
MIRROR_NAMES = {0:'OFF', 1:'MIR2', 2:'KL4', 3:'KL8', 4:'KL16'}

# ─── HUD ──────────────────────────────────────────────────────────────────────
LABELS = [('1','RGB'), ('2','DISP'), ('3','SCAN'), ('4','MOSH'),
          ('5','NOIS'), ('6','BLOK'), ('7','CRT'), ('8','COLR'),
          ('9','ASCI'), ('c','CRPT')]
FX_KEYS = ['rgb_split','displacement','scanlines',None,
           'noise','glitch_blocks','crt_warp','color_cycle','ascii',None]

def draw_hud(frame, fps, t):
    h, w = frame.shape[:2]

    # Barra superior
    bar = frame[:28].copy()
    cv2.rectangle(bar, (0,0), (w, 28), (8,0,4), -1)
    frame[:28] = cv2.addWeighted(bar, 0.75, frame[:28], 0.25, 0)

    cv2.putText(frame, 'ESQUIZOAI // GLITCH.CAM', (10, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 170), 1, cv2.LINE_AA)
    rev_color  = (0, 200, 255) if rev_mode    > 0 else (40, 30, 40)
    mirr_color = (255, 140, 0) if mirror_mode > 0 else (40, 30, 40)
    blnd_color = (0, 255, 170) if blnd_on          else (40, 30, 40)
    cv2.putText(frame, f'REV:{REV_NAMES[rev_mode]}',
                (w//2 - 95, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.38, rev_color,  1, cv2.LINE_AA)
    cv2.putText(frame, f'M:{MIRROR_NAMES[mirror_mode]}',
                (w//2 -  5, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.38, mirr_color, 1, cv2.LINE_AA)
    cv2.putText(frame, 'BLND',
                (w//2 + 60, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.38, blnd_color, 1, cv2.LINE_AA)
    cv2.putText(frame, f'LIVE  {fps}fps', (w - 120, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 50, 255), 1, cv2.LINE_AA)

    # Barra inferior
    bar_h = 26
    bottom_overlay = frame.copy()
    cv2.rectangle(bottom_overlay, (0, h-bar_h), (w, h), (8,0,4), -1)
    frame[h-bar_h:] = cv2.addWeighted(bottom_overlay[h-bar_h:], 0.75,
                                       frame[h-bar_h:], 0.25, 0)

    cell_w = w // len(LABELS)
    for i, (k, name) in enumerate(LABELS):
        x = i * cell_w + 4
        if k == 'c':   is_active = corrupt_mode > 0
        elif k == '4': is_active = datamosh_mode > 0
        else:          is_active = fx.get(FX_KEYS[i], False) if i < len(FX_KEYS) and FX_KEYS[i] else False
        color = (0, 255, 170) if is_active else (60, 30, 60)
        bg_color = (20, 50, 10) if is_active else (8, 0, 4)
        cv2.rectangle(frame, (i*cell_w, h-bar_h), ((i+1)*cell_w-1, h), bg_color, -1)
        if k == 'c':   label = CORRUPT_NAMES.get(corrupt_mode, 'OFF')
        elif k == '4': label = MOSH_NAMES.get(datamosh_mode, 'OFF')
        else:          label = name
        cv2.putText(frame, f'[{k}]', (x, h-14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.28, color, 1)
        cv2.putText(frame, label, (x, h-4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.32, color, 1)

    # Barra de intensidad
    bar_w = 100
    bx = w//2 - bar_w//2
    cv2.putText(frame, f'INT:{int(t*100)}%', (bx-55, h-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.30, (0,255,170), 1)
    cv2.rectangle(frame, (bx, h-18), (bx+bar_w, h-13), (40,20,40), -1)
    cv2.rectangle(frame, (bx, h-18), (bx+int(bar_w*t), h-13), (0,255,170), -1)

    return frame

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    global intensity, hud_on, clean_mode, fullscreen, prev_frame, fx, corrupt_mode, datamosh_mode, blnd_on, rev_mode, mirror_mode, _mosh_buf, _frac_buf

    print('GLITCH.CAM | EsquizoAI')
    print(f'Abriendo cámara {args.cam}...')

    cap = cv2.VideoCapture(args.cam, cv2.CAP_DSHOW)  # CAP_DSHOW más estable en Windows
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  args.width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, args.height)
    cap.set(cv2.CAP_PROP_FPS, 30)

    if not cap.isOpened():
        print('ERROR: No se pudo abrir la cámara.')
        sys.exit(1)

    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f'Cámara activa: {actual_w}x{actual_h}')
    print('Controles: 1-9 efectos | 0 caos | +/- intensidad | h HUD | r reset | f fullscreen | q salir')

    WIN = 'GLITCH.CAM | EsquizoAI — [q] salir'
    cv2.namedWindow(WIN, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(WIN, actual_w, actual_h)

    # Face detection setup
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    face_small_w  = 320
    face_small_h  = int(actual_h * 320 / actual_w)
    face_scale_x  = actual_w / face_small_w
    face_scale_y  = actual_h / face_small_h
    last_face     = None
    face_det_tick = 0

    fps = 0
    fps_count = 0
    fps_time = time.time()
    tick = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print('WARNING: frame perdido')
            continue

        tick += 1
        fps_count += 1
        now = time.time()
        if now - fps_time >= 1.0:
            fps = fps_count
            fps_count = 0
            fps_time = now

        # Determinar efectos activos
        t      = intensity
        active = fx.copy()


        # Pipeline de efectos
        out = frame.copy()

        if blnd_on and prev_frame is not None:
            out = cv2.addWeighted(out, 1 - t * 0.82, prev_frame, t * 0.82, 0)
        if datamosh_mode > 0:
            out = MOSH_FUNCS[datamosh_mode](out, prev_frame, t, tick)
        if active['rgb_split']:
            out = rgb_split(out, t)
        if active['displacement']:
            out = displacement(out, t)
        if active['noise']:
            out = noise(out, t)
        if active['color_cycle']:
            out = color_cycle(out, t, tick)
        if corrupt_mode > 0:
            out = CORRUPT_MODES[corrupt_mode](out, t)

        prev_frame = out.copy()

        if active['ascii']:
            out = ascii_mode(out, t)
        else:
            if active['crt_warp']:
                out = crt_warp(out, t, tick)
            if active['glitch_blocks']:
                out = glitch_blocks(out, t)
            if active['scanlines']:
                out = scanlines(out, t)

        # ─── REVENTUS ─────────────────────────────────────────────────────
        if rev_mode > 0:
            face_det_tick += 1
            if face_det_tick >= 10:
                face_det_tick = 0
                small = cv2.resize(frame, (face_small_w, face_small_h))
                gray  = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=5, minSize=(25, 25))
                if len(faces) > 0:
                    areas = [fw * fh for _, _, fw, fh in faces]
                    bx, by, bw, bh = faces[int(np.argmax(areas))]
                    bx = max(0, int(bx * face_scale_x))
                    by = max(0, int(by * face_scale_y))
                    bw = min(int(bw * face_scale_x), actual_w - bx)
                    bh = min(int(bh * face_scale_y), actual_h - by)
                    last_face = (bx, by, bw, bh)

            if last_face is not None:
                fn = REV_FUNCS[rev_mode]
                out = fn(out, last_face, t, tick) if rev_mode in REV_USE_TICK \
                      else fn(out, last_face, t)

        # ─── MIRROR FULL-SCREEN ───────────────────────────────────────────
        if mirror_mode > 0:
            out = MIRROR_FUNCS[mirror_mode](out)

        if hud_on and not clean_mode:
            out = draw_hud(out, fps, t)

        cv2.imshow(WIN, out)

        # ─── TECLADO ──────────────────────────────────────────────────────────
        key = cv2.waitKey(1) & 0xFF

        if key == ord('q') or key == 27:
            break
        elif key == ord('1'): fx['rgb_split']    = not fx['rgb_split']
        elif key == ord('2'): fx['displacement']  = not fx['displacement']
        elif key == ord('3'): fx['scanlines']     = not fx['scanlines']
        elif key == ord('4'):
            datamosh_mode = (datamosh_mode + 1) % 4
            _mosh_buf = None; _frac_buf = None
        elif key == ord('5'): fx['noise']         = not fx['noise']
        elif key == ord('6'): fx['glitch_blocks'] = not fx['glitch_blocks']
        elif key == ord('7'): fx['crt_warp']      = not fx['crt_warp']
        elif key == ord('8'): fx['color_cycle']   = not fx['color_cycle']
        elif key == ord('9'): fx['ascii']          = not fx['ascii']
        elif key == ord('c'): corrupt_mode = (corrupt_mode + 1) % 5
        elif key == 9:        clean_mode = not clean_mode  # Tab — tecla secreta
        elif key == ord('+'): intensity = min(1.0, intensity + 0.05)
        elif key == ord('-'): intensity = max(0.0, intensity - 0.05)
        elif key == ord('='): intensity = min(1.0, intensity + 0.05)  # = sin shift
        elif key == ord('h'): hud_on = not hud_on
        elif key == ord('r'):
            fx = {k: False for k in fx}
            
            datamosh_mode = 0
            blnd_on   = False
            _mosh_buf = None
            _frac_buf = None
            prev_frame = None
        elif key == ord('f'):
            fullscreen = not fullscreen
            prop = cv2.WINDOW_FULLSCREEN if fullscreen else cv2.WINDOW_NORMAL
            cv2.setWindowProperty(WIN, cv2.WND_PROP_FULLSCREEN, prop)
        elif key == ord('b'): blnd_on = not blnd_on                  # toggle trail base
        elif key == ord('m'): mirror_mode = (mirror_mode + 1) % 5   # cicla MIRROR
        elif key == ord('F'):  # Shift+F — cicla REVENTUS
            rev_mode       = (rev_mode + 1) % 7
            last_face      = None
            _rev_echo_buf  = None  # reset buffer echo al cambiar modo

    cap.release()
    cv2.destroyAllWindows()
    print('GLITCH.CAM cerrado.')

if __name__ == '__main__':
    main()
