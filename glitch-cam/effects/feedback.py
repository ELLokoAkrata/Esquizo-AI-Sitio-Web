"""
FEEDBACK — RECURSIÓN INFINITA. Cámara-apuntando-a-su-propia-pantalla.

Mantiene el frame de salida ANTERIOR, lo transforma (zoom / rotación / hue) y lo
mezcla con el frame actual → la imagen se traga a sí misma generando túneles que
no terminan. Es el feedback analógico de video, vectorizado con warpAffine.

`t` controla cuánto persiste el feedback (profundidad del túnel) y la fuerza de la
transformación. `tick` no se usa (la recursión ya es temporal por el buffer).
"""
import cv2
import numpy as np

_fb_buf = None     # frame de salida anterior (uint8) — buffer persistente


def reset():
    global _fb_buf
    _fb_buf = None


def _prep(frame):
    """Garantiza buffer válido del tamaño del frame. Devuelve (h, w)."""
    global _fb_buf
    if _fb_buf is None or _fb_buf.shape != frame.shape:
        _fb_buf = frame.copy()
    return frame.shape[:2]


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def fb_zoom(frame, t, tick):
    """ZOOM — el buffer se agranda cada frame → túnel que se abalanza hacia ti."""
    global _fb_buf
    h, w = _prep(frame)
    zoom  = 1.01 + t * 0.05
    M     = cv2.getRotationMatrix2D((w / 2.0, h / 2.0), 0, zoom)
    warp  = cv2.warpAffine(_fb_buf, M, (w, h), borderMode=cv2.BORDER_REFLECT)
    decay = 0.45 + t * 0.50
    out   = cv2.addWeighted(frame, 1.0 - decay, warp, decay, 0)
    _fb_buf = out
    return out


def fb_rotz(frame, t, tick):
    """ROTZ — zoom + rotación continua → espiral de feedback que gira sin fin."""
    global _fb_buf
    h, w = _prep(frame)
    angle = 0.6 + t * 2.5
    zoom  = 1.008 + t * 0.03
    M     = cv2.getRotationMatrix2D((w / 2.0, h / 2.0), angle, zoom)
    warp  = cv2.warpAffine(_fb_buf, M, (w, h), borderMode=cv2.BORDER_REFLECT)
    decay = 0.50 + t * 0.45
    out   = cv2.addWeighted(frame, 1.0 - decay, warp, decay, 0)
    _fb_buf = out
    return out


def fb_droste(frame, t, tick):
    """DROST — el buffer se ENCOGE cada frame → la imagen dentro de sí misma."""
    global _fb_buf
    h, w = _prep(frame)
    zoom  = 1.0 - (0.03 + t * 0.08)               # zoom OUT → recursión hacia el centro
    angle = 0.4 + t * 2.0
    M     = cv2.getRotationMatrix2D((w / 2.0, h / 2.0), angle, zoom)
    warp  = cv2.warpAffine(_fb_buf, M, (w, h), borderMode=cv2.BORDER_REFLECT)
    decay = 0.55 + t * 0.40
    out   = cv2.addWeighted(frame, 1.0 - decay, warp, decay, 0)
    _fb_buf = out
    return out


def fb_echo(frame, t, tick):
    """ECHO — feedback con rotación de tono → estelas arcoíris recursivas."""
    global _fb_buf
    h, w = _prep(frame)
    hsv = cv2.cvtColor(_fb_buf, cv2.COLOR_BGR2HSV)
    hsv[:, :, 0] = (hsv[:, :, 0].astype(np.int16) + int(2 + t * 7)) % 180
    shifted = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    decay = 0.55 + t * 0.40
    out   = cv2.addWeighted(frame, 1.0 - decay, shifted, decay, 0)
    _fb_buf = out
    return out


FB_FUNCS = {1: fb_zoom, 2: fb_rotz, 3: fb_droste, 4: fb_echo}
FB_NAMES = {0: 'OFF', 1: 'ZOOM', 2: 'ROTZ', 3: 'DROST', 4: 'ECHO'}
