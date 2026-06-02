"""
KALEIDO — EL MANDALA. Simetría rotacional de N pliegues.

MIRROR (en mirror.py) es bilateral; esto es el caleidoscopio psicodélico real:
el ángulo se pliega a cuñas espejadas de 2π/N → mandala que gira. Todo `cv2.remap`
con grids polares cacheados.

`t` dosifica la mezcla con el original; `tick` gira el eje del mandala.
"""
import cv2
import numpy as np

_grid_cache = {}   # (h,w) -> (x_g, y_g, r, theta, cx, cy)


def _grids(frame):
    h, w = frame.shape[:2]
    c = _grid_cache.get((h, w))
    if c is None:
        cx, cy = w / 2.0, h / 2.0
        y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
        dx, dy = x_g - cx, y_g - cy
        r      = np.sqrt(dx * dx + dy * dy)
        theta  = np.arctan2(dy, dx)
        c = (x_g, y_g, r, theta, cx, cy)
        _grid_cache[(h, w)] = c
    return (h, w) + c


def _dose(frame, warp, t):
    a = 0.45 + t * 0.5
    return cv2.addWeighted(frame, 1.0 - a, warp, a, 0)


def _fold(frame, n, t, tick):
    """Caleidoscopio de n pliegues con cuñas espejadas y eje rotando."""
    h, w, x_g, y_g, r, theta, cx, cy = _grids(frame)
    spin = tick * 0.01 * (0.3 + t)
    seg  = (2 * np.pi) / n
    k    = (theta + spin) / seg
    kf   = k - np.floor(k)
    odd  = (np.floor(k).astype(np.int32) & 1).astype(bool)
    kf   = np.where(odd, 1.0 - kf, kf)          # espejar cuñas alternas
    ang  = kf * seg + spin * 0.5
    mx = np.clip(cx + r * np.cos(ang), 0, w - 1).astype(np.float32)
    my = np.clip(cy + r * np.sin(ang), 0, h - 1).astype(np.float32)
    warp = cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return _dose(frame, warp, t)


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def kal_4(frame, t, tick):
    """K4 — 4 pliegues."""
    return _fold(frame, 4, t, tick)


def kal_6(frame, t, tick):
    """K6 — 6 pliegues (mandala hexagonal)."""
    return _fold(frame, 6, t, tick)


def kal_8(frame, t, tick):
    """K8 — 8 pliegues (mandala denso)."""
    return _fold(frame, 8, t, tick)


def kal_mirror(frame, t, tick):
    """MIRR — espejo cuádruple: la esquina se refleja en los 4 cuadrantes."""
    h, w, x_g, y_g, r, theta, cx, cy = _grids(frame)
    mx = np.minimum(x_g, w - 1 - x_g).astype(np.float32)
    my = np.minimum(y_g, h - 1 - y_g).astype(np.float32)
    warp = cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return _dose(frame, warp, t)


KALEIDO_FUNCS = {1: kal_4, 2: kal_6, 3: kal_8, 4: kal_mirror}
KALEIDO_NAMES = {0: 'OFF', 1: 'K4', 2: 'K6', 3: 'K8', 4: 'MIRR'}
