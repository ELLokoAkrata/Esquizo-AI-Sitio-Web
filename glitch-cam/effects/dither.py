"""
DITH — DITHERING ORDENADO (Bayer).

La textura granulosa pixelada de los acid-OS retro: cuantización con matriz de
Bayer tilada sobre el frame. Vectorizado (sin loops por píxel) → real-time.
Combina genial con PALT (p.ej. p:ACID + i:CLR = look indexado dithered).
"""
import cv2
import numpy as np

from effects.palette import GREEN, BLACK


# ─── MATRICES BAYER (normalizadas a [0,1)) ───────────────────────────────────────
_B4 = np.array([[0,  8,  2, 10],
                [12, 4, 14,  6],
                [3, 11,  1,  9],
                [15, 7, 13,  5]], dtype=np.float32) / 16.0

_B8 = np.array([[0, 32,  8, 40,  2, 34, 10, 42],
                [48, 16, 56, 24, 50, 18, 58, 26],
                [12, 44,  4, 36, 14, 46,  6, 38],
                [60, 28, 52, 20, 62, 30, 54, 22],
                [3, 35, 11, 43,  1, 33,  9, 41],
                [51, 19, 59, 27, 49, 17, 57, 25],
                [15, 47,  7, 39, 13, 45,  5, 37],
                [63, 31, 55, 23, 61, 29, 53, 21]], dtype=np.float32) / 64.0

_dmap_cache = {}   # (h, w, size) → mapa de dither tilado (h,w) float32


def _dmap(h, w, base):
    key = (h, w, base.shape[0])
    cached = _dmap_cache.get(key)
    if cached is None:
        bh, bw = base.shape
        reps = (h // bh + 1, w // bw + 1)
        cached = np.tile(base, reps)[:h, :w]
        _dmap_cache[key] = cached
    return cached


# ─── MODOS ───────────────────────────────────────────────────────────────────────
def dith_bw(frame, t):
    """BW — umbral 1-bit blanco/negro con Bayer 4×4."""
    h, w = frame.shape[:2]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    d = _dmap(h, w, _B4)
    bias = (t - 0.5) * 0.4                      # t sesga el umbral (más blanco/negro)
    mask = (gray + bias) > d
    out = np.zeros((h, w, 3), np.uint8)
    out[mask] = 255
    return out


def dith_green(frame, t):
    """GRN — dither 1-bit a negro / verde tóxico (terminal fosforado)."""
    h, w = frame.shape[:2]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    d = _dmap(h, w, _B4)
    bias = (t - 0.5) * 0.4
    mask = (gray + bias) > d
    out = np.empty((h, w, 3), np.uint8)
    out[:] = BLACK
    out[mask] = GREEN
    return out


def dith_color(frame, t):
    """CLR — cuantización a pocos niveles/canal CON dither Bayer 8×8 → look indexado."""
    h, w = frame.shape[:2]
    levels = 4 if t < 0.5 else 3                # más t → menos niveles (más brutal)
    d = _dmap(h, w, _B8)[:, :, None]            # (h,w,1)
    f = frame.astype(np.float32) / 255.0
    spread = 1.0 / levels
    v = f + (d - 0.5) * spread
    q = np.round(np.clip(v, 0, 1) * (levels - 1)) / (levels - 1)
    return (q * 255).astype(np.uint8)


DITH_FUNCS = {1: dith_bw, 2: dith_green, 3: dith_color}
DITH_NAMES = {0: 'OFF', 1: 'BW', 2: 'GRN', 3: 'CLR'}
