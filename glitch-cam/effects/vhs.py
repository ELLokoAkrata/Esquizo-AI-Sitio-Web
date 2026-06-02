"""
VHS — LA CINTA PODRIDA. Decay analógico.

CRT (en base.py) cubre el monitor; esto es la CINTA: tracking lines que suben,
chroma bleed, dropout de señal y, en FULL, head-switching noise + sync roll.
Sin buffer. `t` escala la degradación. Usa ruido aleatorio → parpadeo orgánico.
"""
import cv2
import numpy as np


def vhs_track(frame, t, tick):
    """TRAK — bandas de tracking que scrollean hacia arriba (shift + brillo + ruido)."""
    h, w = frame.shape[:2]
    out = frame.copy()
    n   = int(2 + t * 4)
    speed = 2 + t * 7
    bh    = int(6 + t * 16)
    for i in range(n):
        cy = int((i * h / n + tick * speed) % h)
        y2 = min(h, cy + bh)
        if y2 <= cy:
            continue
        region = out[cy:y2]
        sh = int((np.random.random() - 0.5) * (12 + t * 45))
        region = np.roll(region, sh, axis=1)
        noise  = (np.random.random(region.shape) * (t * 70)).astype(np.uint8)
        out[cy:y2] = cv2.add(cv2.add(region, int(t * 30)), noise)
    return out


def vhs_chroma(frame, t, tick):
    """CHRM — chroma bleed: R/B se corren en sentido opuesto + blur horizontal."""
    b, g, r = cv2.split(frame)
    sh = int(4 + t * 14)
    k  = max(1, int(3 + t * 10)) | 1
    r  = cv2.GaussianBlur(np.roll(r,  sh, axis=1), (k, 1), 0)
    b  = cv2.GaussianBlur(np.roll(b, -sh, axis=1), (k, 1), 0)
    return cv2.merge([b, g, r])


def vhs_drop(frame, t, tick):
    """DROP — dropout: segmentos blancos/negros aleatorios (pérdida de señal)."""
    h, w = frame.shape[:2]
    out = frame.copy()
    n   = int(3 + t * 26)
    for _ in range(n):
        y  = np.random.randint(0, h)
        x1 = np.random.randint(0, w)
        ww = np.random.randint(8, max(9, int(w * 0.3)))
        val = 255 if np.random.random() > 0.5 else 0
        out[y:y + np.random.randint(1, 3), x1:min(w, x1 + ww)] = val
    return out


def vhs_full(frame, t, tick):
    """FULL — todo junto + head-switch noise abajo + sync roll vertical."""
    out = vhs_chroma(frame, t, tick)
    out = vhs_track(out, t, tick)
    out = vhs_drop(out, t * 0.7, tick)
    h, w = out.shape[:2]
    # head-switching noise: franja inferior revuelta
    hs = int(8 + t * 16)
    band = out[h - hs:h]
    if band.size:
        noise = (np.random.random(band.shape) * 255).astype(np.uint8)
        out[h - hs:h] = cv2.addWeighted(band, 0.35, noise, 0.65, 0)
    # sync roll: desplazamiento vertical animado + saltos ocasionales
    roll = int(np.sin(tick * 0.05) * t * 14)
    if np.random.random() < t * 0.1:
        roll += np.random.randint(-int(h * 0.2), int(h * 0.2) + 1)
    return np.roll(out, roll, axis=0)


VHS_FUNCS = {1: vhs_track, 2: vhs_chroma, 3: vhs_drop, 4: vhs_full}
VHS_NAMES = {0: 'OFF', 1: 'TRAK', 2: 'CHRM', 3: 'DROP', 4: 'FULL'}
