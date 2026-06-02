"""
HALFTONE — IMPRENTA. Rejilla de puntos/líneas (distinto del Bayer de DITH).

DOT: puntos de radio ∝ luminancia, coloreados por el frame (semitono a color).
CMYK: separación C/M/Y con rejillas a ángulos distintos sobre blanco (periódico).
LINE: line-screen, grosor de línea ∝ luminancia.

Optimizado: los mapas de la rejilla (distancia al centro de celda, fase de línea)
son ESTÁTICOS → se cachean por (h,w,cell). Por frame solo: 1-3 block-averages +
comparación + `np.where`. Sin sqrt/trig por frame. `t` afina celda y mezcla.
"""
import cv2
import numpy as np

_dist_cache = {}   # (h,w,cell) -> distancia normalizada al centro de celda
_rot_cache  = {}   # (h,w,cell,deg) -> distancia en rejilla rotada
_line_cache = {}   # (h,w,cell,deg) -> fase de línea 0..1


def _dist_map(h, w, cell):
    key = (h, w, cell)
    d = _dist_cache.get(key)
    if d is None:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        cxx = (xx % cell) - cell / 2.0 + 0.5
        cyy = (yy % cell) - cell / 2.0 + 0.5
        d = np.sqrt(cxx * cxx + cyy * cyy).astype(np.float32)
        _dist_cache[key] = d
    return d


def _rot_dist(h, w, cell, deg):
    key = (h, w, cell, deg)
    d = _rot_cache.get(key)
    if d is None:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        a = np.radians(deg)
        u = xx * np.cos(a) + yy * np.sin(a)
        v = -xx * np.sin(a) + yy * np.cos(a)
        cu = (u % cell) - cell / 2.0
        cv_ = (v % cell) - cell / 2.0
        d = np.sqrt(cu * cu + cv_ * cv_).astype(np.float32)
        _rot_cache[key] = d
    return d


def _line_phase(h, w, cell, deg):
    key = (h, w, cell, deg)
    p = _line_cache.get(key)
    if p is None:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        a = np.radians(deg)
        u = xx * np.cos(a) + yy * np.sin(a)
        p = ((u % cell) / float(cell)).astype(np.float32)
        _line_cache[key] = p
    return p


def _block(img, cell, w, h):
    small = cv2.resize(img, (max(1, w // cell), max(1, h // cell)), interpolation=cv2.INTER_AREA)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)


def _dose(frame, eff, t):
    a = 0.5 + t * 0.5
    return cv2.addWeighted(frame, 1.0 - a, eff, a, 0)


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def half_dot(frame, t, tick):
    """DOT — puntos de radio ∝ brillo, coloreados por el frame."""
    h, w = frame.shape[:2]
    cell = int(4 + (1.0 - t) * 6)
    lum  = _block(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cell, w, h).astype(np.float32) / 255.0
    col  = _block(frame, cell, w, h)
    mask = _dist_map(h, w, cell) <= (lum * (cell * 0.75))
    eff  = np.where(mask[:, :, None], col, 0).astype(np.uint8)
    return _dose(frame, eff, t)


def half_cmyk(frame, t, tick):
    """CMYK — separación C/M/Y con rejillas a 15°/75°/0° sobre blanco."""
    h, w = frame.shape[:2]
    cell = int(5 + (1.0 - t) * 6)
    blk  = _block(frame, cell, w, h).astype(np.float32) / 255.0
    c = (1.0 - blk[:, :, 2]) * (cell * 0.72)
    m = (1.0 - blk[:, :, 1]) * (cell * 0.72)
    y = (1.0 - blk[:, :, 0]) * (cell * 0.72)
    mc = _rot_dist(h, w, cell, 15) <= c
    mm = _rot_dist(h, w, cell, 75) <= m
    my = _rot_dist(h, w, cell, 0)  <= y
    out = np.empty((h, w, 3), np.uint8)
    out[:, :, 0] = np.where(my, 0, 255)            # amarillo absorbe azul
    out[:, :, 1] = np.where(mm, 0, 255)            # magenta absorbe verde
    out[:, :, 2] = np.where(mc, 0, 255)            # cian absorbe rojo
    return _dose(frame, out, t)


def half_line(frame, t, tick):
    """LINE — line-screen diagonal: grosor de línea ∝ luminancia."""
    h, w = frame.shape[:2]
    cell = int(4 + (1.0 - t) * 6)
    lum  = _block(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cell, w, h).astype(np.float32) / 255.0
    col  = _block(frame, cell, w, h)
    mask = _line_phase(h, w, cell, 45) < lum
    eff  = np.where(mask[:, :, None], col, 0).astype(np.uint8)
    return _dose(frame, eff, t)


HALFTONE_FUNCS = {1: half_dot, 2: half_cmyk, 3: half_line}
HALFTONE_NAMES = {0: 'OFF', 1: 'DOT', 2: 'CMYK', 3: 'LINE'}
