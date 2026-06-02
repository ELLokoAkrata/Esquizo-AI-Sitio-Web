"""
BLOOM — LA LUZ CHORREA. Sobreexposición neón.

Extrae las zonas brillantes, las difumina y las vuelve a sumar → la luz sangra
fuera de sus bordes. GLOW general, NEON saturado y colorido, HALO aura radial.

`t` = umbral (más t → más zonas brillan) y fuerza del glow.
"""
import cv2
import numpy as np

_radial_cache = {}   # (h,w) -> peso radial 0..1 (1 al centro)


def _odd(n):
    n = int(n)
    return n + 1 if n % 2 == 0 else n


def _radial(h, w):
    rf = _radial_cache.get((h, w))
    if rf is None:
        cy, cx = h / 2.0, w / 2.0
        y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
        r    = np.sqrt((x_g - cx) ** 2 + (y_g - cy) ** 2)
        maxr = np.sqrt(cx ** 2 + cy ** 2) + 1e-6
        rf   = (1.0 - np.clip(r / maxr, 0, 1))[:, :, None]   # (h,w,1)
        _radial_cache[(h, w)] = rf
    return rf


def _bright_pass(frame, thr):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, int(thr), 255, cv2.THRESH_BINARY)
    return cv2.bitwise_and(frame, frame, mask=mask)


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def bloom_glow(frame, t, tick):
    """GLOW — bright-pass + blur + suma: sobreexposición neón general."""
    thr  = 170 - t * 80
    k    = _odd(13 + t * 40)
    blur = cv2.GaussianBlur(_bright_pass(frame, thr), (k, k), 0)
    g    = 0.5 + t * 0.9
    return cv2.add(frame, (blur.astype(np.float32) * g).clip(0, 255).astype(np.uint8))


def bloom_neon(frame, t, tick):
    """NEON — satura primero → el glow sale colorido y ácido."""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * (1.4 + t * 1.2), 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * (1.0 + t * 0.3), 0, 255)
    sat = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    thr  = 150 - t * 80
    k    = _odd(17 + t * 48)
    blur = cv2.GaussianBlur(_bright_pass(sat, thr), (k, k), 0)
    g    = 0.6 + t * 1.1
    return cv2.add(sat, (blur.astype(np.float32) * g).clip(0, 255).astype(np.uint8))


def bloom_halo(frame, t, tick):
    """HALO — aura radial fuerte: blur grande pesado hacia el centro."""
    k     = _odd(25 + t * 70)
    blur  = cv2.GaussianBlur(frame, (k, k), 0)
    halo  = blur.astype(np.float32) * _radial(*frame.shape[:2]) * (0.7 + t * 1.0)
    return cv2.add(frame, halo.clip(0, 255).astype(np.uint8))


BLOOM_FUNCS = {1: bloom_glow, 2: bloom_neon, 3: bloom_halo}
BLOOM_NAMES = {0: 'OFF', 1: 'GLOW', 2: 'NEON', 3: 'HALO'}
