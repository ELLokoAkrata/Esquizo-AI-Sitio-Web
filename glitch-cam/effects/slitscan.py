"""
SLIT-SCAN — TIME-DISPLACEMENT. El tiempo se derrite.

Buffer circular de N frames pasados; cada fila / columna / anillo del frame de
salida se lee de un instante DISTINTO del pasado → el movimiento se estira en el
TIEMPO, no en el espacio. Es el efecto más "distortion of reality" del catálogo:
una cara que se mueve deja una estela temporal, no espacial.

Vectorizado: ring-buffer pre-asignado (sin re-stack por frame) + gather con fancy
indexing `_buf[buf_idx, y_grid, x_grid]`. Mantiene 30fps.

`t` controla cuánto pasado se mezcla (profundidad del smear). `tick` anima CHAOS.
"""
import numpy as np

_N      = 24       # profundidad del buffer (frames de historia) — ~29 MB a 480×854
_buf    = None     # (N, h, w, 3) uint8 — ring buffer
_widx   = 0        # próxima posición de escritura
_count  = 0        # frames escritos (satura en N)
_shape  = None     # (h, w) actual; si cambia → reset

_grid_cache   = {}   # (h,w) -> (y_grid, x_grid)
_radial_cache = {}   # (h,w) -> lag_factor radial normalizado 0..1


def reset():
    """Limpia el buffer (llamado desde el reset global 'r')."""
    global _buf, _widx, _count, _shape
    _buf = None; _widx = 0; _count = 0; _shape = None


def _ensure(frame):
    global _buf, _widx, _count, _shape
    h, w = frame.shape[:2]
    if _shape != (h, w):
        _buf   = np.zeros((_N, h, w, 3), np.uint8)
        _widx  = 0
        _count = 0
        _shape = (h, w)


def _push(frame):
    global _widx, _count
    _buf[_widx] = frame
    _widx  = (_widx + 1) % _N
    _count = min(_count + 1, _N)


def _grids(h, w):
    g = _grid_cache.get((h, w))
    if g is None:
        y_grid = np.broadcast_to(np.arange(h)[:, None], (h, w))
        x_grid = np.broadcast_to(np.arange(w)[None, :], (h, w))
        g = (y_grid, x_grid)
        _grid_cache[(h, w)] = g
    return g


def _radial(h, w):
    rf = _radial_cache.get((h, w))
    if rf is None:
        y_grid, x_grid = _grids(h, w)
        cy, cx = h / 2.0, w / 2.0
        r    = np.sqrt((x_grid - cx) ** 2 + (y_grid - cy) ** 2)
        maxr = np.sqrt(cx ** 2 + cy ** 2) + 1e-6
        rf   = (r / maxr).astype(np.float32)        # 0 centro → 1 esquina
        _radial_cache[(h, w)] = rf
    return rf


def _maxlag(t):
    """Máximo desfase temporal (en frames) según intensidad y buffer disponible."""
    return max(1, int(t * (_count - 1)))


def _gather(lag_map, h, w, t):
    """lag_map (h,w) int = 'frames atrás' → frame compuesto, CON glitch cromático.

    Corrupción de color sobre las bandas: cada canal RGB lee un instante DISTINTO
    del pasado (aberración cromática temporal) + un corrimiento horizontal propio
    (RGB-split). Las costuras entre zonas de tiempo se desgarran en color.
    Escala con `t`: a intensidad 0 = slit limpio; alta = glitch sangrante.
    """
    cmax = _count - 1
    lag_map = np.clip(lag_map, 0, cmax)
    y_grid, x_grid = _grids(h, w)
    dt = int(t * 6)            # separación temporal entre canales (frames atrás)
    dx = int(t * 12)          # separación espacial horizontal (px)
    out = np.empty((h, w, 3), np.uint8)
    # (canal BGR, lag extra, shift x) — B y R divergen, G ancla
    for c, dlag, sx in ((0, dt, dx), (1, 0, 0), (2, dt, -dx)):
        idx = np.clip(lag_map + dlag, 0, cmax)
        bi  = (_widx - 1 - idx) % _N
        xg  = np.clip(x_grid + sx, 0, w - 1) if sx else x_grid
        out[..., c] = _buf[bi, y_grid, xg, c]
    return out


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def slit_rows(frame, t, tick):
    """ROWS — cada fila muestra un instante distinto: cascada vertical de tiempo."""
    _ensure(frame); _push(frame)
    h, w = frame.shape[:2]
    if _count < 2:
        return frame
    ml      = _maxlag(t)
    lag_col = ((np.arange(h) / max(1, h - 1)) * ml).astype(np.int32)   # (h,)
    lag_map = np.broadcast_to(lag_col[:, None], (h, w))
    return _gather(lag_map, h, w, t)


def slit_cols(frame, t, tick):
    """COLS — cada columna muestra un instante distinto: smear horizontal."""
    _ensure(frame); _push(frame)
    h, w = frame.shape[:2]
    if _count < 2:
        return frame
    ml      = _maxlag(t)
    lag_row = ((np.arange(w) / max(1, w - 1)) * ml).astype(np.int32)   # (w,)
    lag_map = np.broadcast_to(lag_row[None, :], (h, w))
    return _gather(lag_map, h, w, t)


def slit_radial(frame, t, tick):
    """RADL — la distancia al centro define cuánto pasado: onda temporal radial."""
    _ensure(frame); _push(frame)
    h, w = frame.shape[:2]
    if _count < 2:
        return frame
    ml      = _maxlag(t)
    lag_map = (_radial(h, w) * ml).astype(np.int32)
    return _gather(lag_map, h, w, t)


def slit_chaos(frame, t, tick):
    """CHAOS — desfase temporal en bandas onduladas que se desplazan (animado)."""
    _ensure(frame); _push(frame)
    h, w = frame.shape[:2]
    if _count < 2:
        return frame
    ml = _maxlag(t)
    y_grid, x_grid = _grids(h, w)
    pattern = np.sin(y_grid * 0.05 + tick * 0.07) + np.sin(x_grid * 0.04 - tick * 0.05)
    norm    = (pattern + 2.0) * 0.25                 # 0..1
    lag_map = (norm * ml).astype(np.int32)
    return _gather(lag_map, h, w, t)


SLIT_FUNCS = {1: slit_rows, 2: slit_cols, 3: slit_radial, 4: slit_chaos}
SLIT_NAMES = {0: 'OFF', 1: 'ROWS', 2: 'COLS', 3: 'RADL', 4: 'CHAOS'}
