"""
MELT — DERRETIMIENTO DE LA REALIDAD (full-frame).

La realidad chorrea. Distintos modos de derretimiento sobre todo el cuadro,
vía cv2.remap (mismo patrón que vortex/spiral en base.py) y un buffer de feedback
para el goteo persistente. Es el "derretimiento de realidad" (≠ el de rostro, que
vive en reventus.py como modo MELT).
"""
import cv2
import numpy as np


_wax_buf = None   # buffer persistente para WAX


def melt_drip(frame, t, tick):
    """DRIP — cada columna se estira hacia abajo, más cuanto más profunda.
    El goteo ondula y migra con tick → la imagen se derrite viva."""
    h, w = frame.shape[:2]
    x = np.arange(w, dtype=np.float32)
    # Goteo por columna: dos sinusoides desfasadas → patrón orgánico que migra
    drip = (np.sin(x * 0.030 + tick * 0.05)
            + np.sin(x * 0.011 + tick * 0.021) * 0.6)
    drip = (drip * 0.5 + 0.5)                       # 0..1
    amp  = t * h * 0.55
    drip = (drip * amp).reshape(1, w)
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    map_y = y_g - drip * (y_g / h)                  # estiramiento proporcional a la profundidad
    map_x = x_g
    return cv2.remap(frame, map_x, np.clip(map_y, 0, h - 1),
                     cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def melt_wax(frame, t, tick):
    """WAX — feedback persistente: las zonas brillantes chorrean y dejan rastro.
    buf desplazado hacia abajo + max con el frame → cera derritiéndose."""
    global _wax_buf
    h, w = frame.shape[:2]
    f = frame.astype(np.float32)
    if _wax_buf is None or _wax_buf.shape != f.shape:
        _wax_buf = f.copy()
    drop  = 1 + int(t * 5)                           # px que baja el rastro por frame
    decay = 0.90 + t * 0.08                          # 0.90 → 0.98
    shifted = np.roll(_wax_buf, drop, axis=0) * decay
    shifted[:drop] = f[:drop]                         # reinyecta la fila superior fresca
    _wax_buf = np.maximum(shifted, f)                 # lo brillante persiste y baja
    alpha = 0.4 + t * 0.55
    out = cv2.addWeighted(_wax_buf.clip(0, 255).astype(np.uint8), alpha,
                          frame, 1.0 - alpha, 0)
    return out


def melt_liquid(frame, t, tick):
    """LIQD — liquify guiado por la propia luminancia: el color del frame
    decide cuánto se desplaza cada píxel → derretimiento que sigue al contenido."""
    h, w = frame.shape[:2]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    gray = cv2.GaussianBlur(gray, (0, 0), 3)          # suaviza → flujo orgánico
    amp = t * 32.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    map_x = x_g + amp * np.sin(gray * 6.283 + tick * 0.04)
    map_y = y_g + amp * np.cos(gray * 6.283 + tick * 0.05)
    map_x = np.clip(map_x, 0, w - 1).astype(np.float32)
    map_y = np.clip(map_y, 0, h - 1).astype(np.float32)
    return cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_REFLECT)


MELT_FUNCS = {1: melt_drip, 2: melt_wax, 3: melt_liquid}
MELT_NAMES = {0: 'OFF', 1: 'DRIP', 2: 'WAX', 3: 'LIQD'}
