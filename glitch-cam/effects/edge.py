"""
EDGE — ROTOSCOPIO NEÓN. Contornos sobre negro.

NEON: bordes Canny brillando en verde tóxico sobre negro (look línea ácida).
CMIC: bordes negros + relleno posterizado plano (cómic).
GHST: bordes acumulados con decay → fantasma de líneas (buffer persistente).

`t` baja los umbrales de Canny (más bordes) y la mezcla con el original.
"""
import cv2
import numpy as np

from effects.palette import GREEN

_ghost_buf = None   # buffer persistente de bordes (GHST)


def reset():
    global _ghost_buf
    _ghost_buf = None


def _edges(frame, t):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    lo = int(40 + (1.0 - t) * 60)
    return cv2.Canny(gray, lo, int(lo * 2.5))


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def edge_neon(frame, t, tick):
    """NEON — contornos verde tóxico brillando sobre negro."""
    e = _edges(frame, t)
    e = cv2.dilate(e, None, iterations=1)
    out = np.zeros_like(frame)
    out[e > 0] = GREEN
    out = cv2.GaussianBlur(out, (0, 0), 1.2) + out          # glow
    a = 0.45 + t * 0.55
    return cv2.addWeighted(frame, 1.0 - a, np.clip(out, 0, 255).astype(np.uint8), a, 0)


def edge_comic(frame, t, tick):
    """CMIC — relleno posterizado plano + contornos negros (cómic)."""
    poster = (frame & 0xC0) | 0x20
    e = cv2.dilate(_edges(frame, t), None, iterations=1)
    poster[e > 0] = 0
    a = 0.5 + t * 0.5
    return cv2.addWeighted(frame, 1.0 - a, poster, a, 0)


def edge_ghost(frame, t, tick):
    """GHST — bordes acumulados con decay: estela de líneas fantasma."""
    global _ghost_buf
    e = cv2.dilate(_edges(frame, t), None, iterations=1)
    colored = np.zeros_like(frame)
    colored[e > 0] = GREEN
    cf = colored.astype(np.float32)
    if _ghost_buf is None or _ghost_buf.shape != frame.shape:
        _ghost_buf = cf
    decay = 0.78 + t * 0.18
    _ghost_buf = np.maximum(_ghost_buf * decay, cf)
    return cv2.add(frame, _ghost_buf.clip(0, 255).astype(np.uint8))


EDGE_FUNCS = {1: edge_neon, 2: edge_comic, 3: edge_ghost}
EDGE_NAMES = {0: 'OFF', 1: 'NEON', 2: 'CMIC', 3: 'GHST'}
