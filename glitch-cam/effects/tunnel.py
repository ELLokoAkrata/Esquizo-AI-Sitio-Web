"""
TUNNEL — AGUJERO DE GUSANO. Remap a coordenadas polares.

La imagen se enrolla en un túnel infinito que se mueve hacia el centro. El ángulo
mapea a las columnas, la profundidad (1/radio) a las filas → viaje hacia adentro.
Combina brutal con FEEDBACK. Todo `cv2.remap` con grids polares cacheados.

`t` controla velocidad de scroll / torsión y la mezcla con el original.
"""
import cv2
import numpy as np

_polar_cache = {}   # (h,w) -> dict con arrays estáticos precomputados


def _polar(frame):
    h, w = frame.shape[:2]
    c = _polar_cache.get((h, w))
    if c is None:
        cx, cy = w / 2.0, h / 2.0
        y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
        dx, dy = x_g - cx, y_g - cy
        r      = np.sqrt(dx * dx + dy * dy) + 1e-3
        maxr   = np.sqrt(cx * cx + cy * cy)
        theta  = np.arctan2(dy, dx)
        rn     = r / maxr
        depth  = 1.0 / (rn + 0.07)
        c = dict(
            theta=theta, rn=rn, cx=cx, cy=cy,
            u_base=(theta / (2 * np.pi)) % 1.0,           # ángulo→col (estático)
            mapx_base=(((theta / (2 * np.pi)) % 1.0) * w % w).astype(np.float32),
            depth=depth,
            depth_h=(depth * 0.15 * h).astype(np.float32),  # profundidad en px
            polr_x=(((theta / (2 * np.pi) + 0.5) % 1.0) * w).astype(np.float32),
            polr_y=(np.clip(rn, 0, 1) * (h - 1)).astype(np.float32),
        )
        _polar_cache[(h, w)] = c
    return h, w, c


def _dose(frame, warp, t):
    a = 0.4 + t * 0.55
    return cv2.addWeighted(frame, 1.0 - a, warp, a, 0)


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def tun_tunnel(frame, t, tick):
    """TUNL — túnel clásico, scroll radial hacia el centro."""
    h, w, c = _polar(frame)
    scroll = tick * (0.004 + t * 0.02) * h
    map_y  = ((c['depth_h'] + scroll) % h).astype(np.float32)   # map_x es estático
    warp   = cv2.remap(frame, c['mapx_base'], map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    return _dose(frame, warp, t)


def tun_twist(frame, t, tick):
    """TWST — túnel + torsión angular: espiral de túnel."""
    h, w, c = _polar(frame)
    twist  = c['depth'] * (0.4 + t * 1.2) + tick * 0.02 * (0.5 + t)
    u      = (c['theta'] + twist) * (1.0 / (2 * np.pi))
    map_x  = ((u % 1.0) * w).astype(np.float32)               # u%1 ∈[0,1) → *w ∈[0,w)
    map_y  = ((c['depth_h'] + tick * (0.004 + t * 0.018) * h) % h).astype(np.float32)
    warp   = cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    return _dose(frame, warp, t)


def tun_polar(frame, t, tick):
    """POLR — transform polar pura: la imagen se desenrolla (ángulo→x, radio→y)."""
    h, w, c = _polar(frame)
    spin  = tick * 0.01 * (0.5 + t)
    map_x = (((c['theta'] + spin) / (2 * np.pi) + 0.5) % 1.0 * w).astype(np.float32)
    warp  = cv2.remap(frame, map_x, c['polr_y'], cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    return _dose(frame, warp, t)


TUNNEL_FUNCS = {1: tun_tunnel, 2: tun_twist, 3: tun_polar}
TUNNEL_NAMES = {0: 'OFF', 1: 'TUNL', 2: 'TWST', 3: 'POLR'}
