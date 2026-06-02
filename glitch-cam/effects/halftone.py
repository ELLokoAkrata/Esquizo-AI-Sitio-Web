"""
HALFTONE — IMPRENTA. Rejilla de puntos/líneas (distinto del Bayer de DITH).

DOT: puntos de radio ∝ luminancia, coloreados por el frame (semitono a color).
CMYK: separación C/M/Y con rejillas a ángulos distintos sobre blanco (periódico).
LINE: line-screen, grosor de línea ∝ luminancia.

Todo vectorizado (sin loops por píxel). `t` afina el tamaño de celda y la mezcla.
"""
import cv2
import numpy as np

_grid_cache = {}   # (h,w) -> (xx, yy) índices float32


def _xy(frame):
    h, w = frame.shape[:2]
    g = _grid_cache.get((h, w))
    if g is None:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        g = (xx, yy)
        _grid_cache[(h, w)] = g
    return (h, w) + g


def _block(img, cell, w, h, interp_down=cv2.INTER_AREA):
    """Promedio por celda: downscale + upscale nearest."""
    small = cv2.resize(img, (max(1, w // cell), max(1, h // cell)), interpolation=interp_down)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)


def _dose(frame, eff, t):
    a = 0.5 + t * 0.5
    return cv2.addWeighted(frame, 1.0 - a, eff, a, 0)


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def half_dot(frame, t, tick):
    """DOT — puntos de radio ∝ brillo, coloreados por el frame."""
    h, w, xx, yy = _xy(frame)
    cell = int(4 + (1.0 - t) * 6)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    lum  = _block(gray, cell, w, h).astype(np.float32) / 255.0
    col  = _block(frame, cell, w, h)
    cxx  = (xx % cell) - cell / 2.0 + 0.5
    cyy  = (yy % cell) - cell / 2.0 + 0.5
    dist = np.sqrt(cxx * cxx + cyy * cyy)
    mask = dist <= (lum * (cell * 0.75))
    eff  = np.zeros_like(frame)
    eff[mask] = col[mask]
    return _dose(frame, eff, t)


def _screen(xx, yy, cov, cell, angle):
    ca, sa = np.cos(angle), np.sin(angle)
    u = xx * ca + yy * sa
    v = -xx * sa + yy * ca
    cu = (u % cell) - cell / 2.0
    cv_ = (v % cell) - cell / 2.0
    return np.sqrt(cu * cu + cv_ * cv_) <= (cov * (cell * 0.72))


def half_cmyk(frame, t, tick):
    """CMYK — separación C/M/Y con rejillas a 15°/75°/0° sobre blanco."""
    h, w, xx, yy = _xy(frame)
    cell = int(5 + (1.0 - t) * 6)
    blk  = _block(frame, cell, w, h).astype(np.float32) / 255.0
    c = 1.0 - blk[:, :, 2]      # cian absorbe rojo
    m = 1.0 - blk[:, :, 1]      # magenta absorbe verde
    y = 1.0 - blk[:, :, 0]      # amarillo absorbe azul
    out = np.full_like(frame, 255)
    out[_screen(xx, yy, c, cell, np.radians(15)), 2] = 0
    out[_screen(xx, yy, m, cell, np.radians(75)), 1] = 0
    out[_screen(xx, yy, y, cell, np.radians(0)),  0] = 0
    return _dose(frame, out, t)


def half_line(frame, t, tick):
    """LINE — line-screen diagonal: grosor de línea ∝ luminancia."""
    h, w, xx, yy = _xy(frame)
    cell = int(4 + (1.0 - t) * 6)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    lum  = _block(gray, cell, w, h).astype(np.float32) / 255.0
    u = xx * np.cos(np.radians(45)) + yy * np.sin(np.radians(45))
    phase = (u % cell) / float(cell)
    mask  = phase < lum
    col   = _block(frame, cell, w, h)
    eff   = np.zeros_like(frame)
    eff[mask] = col[mask]
    return _dose(frame, eff, t)


HALFTONE_FUNCS = {1: half_dot, 2: half_cmyk, 3: half_line}
HALFTONE_NAMES = {0: 'OFF', 1: 'DOT', 2: 'CMYK', 3: 'LINE'}
