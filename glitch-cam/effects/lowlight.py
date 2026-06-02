"""
LOWLIGHT — REALCE PARA POCA LUZ / OSCURIDAD.

Se aplica al INICIO del pipeline → todos los efectos se combinan sobre la imagen
ya iluminada. Útil cuando la cámara está a oscuras y los efectos de color/glitch
no tienen señal para trabajar.

- GAIN  : levanta sombras con gamma (LUT, muy rápido).
- CLAHE : ecualización adaptativa local en el canal L (LAB) → detalle en sombras
          sin quemar las luces. Lo mejor para poca luz real.
- MAX   : CLAHE + gamma fuerte (máximo rescate; puede subir ruido).

Perillas ajustables EN CALIENTE (editá y pulsá R).
"""
import cv2
import numpy as np

GAMMA_GAIN = 0.60   # <1 levanta sombras (más bajo = más brillo en oscuras)
GAMMA_MAX  = 0.50   # gamma del modo MAX (más agresivo)
GAIN       = 1.15   # multiplicador de brillo extra
CLAHE_CLIP = 3.0    # fuerza del CLAHE (más = más contraste local / más ruido)
CLAHE_GRID = 8      # tamaño de tile del CLAHE

_lut_cache = {}


def _gamma_lut(g, gain):
    key = (round(g, 3), round(gain, 3))
    lut = _lut_cache.get(key)
    if lut is None:
        ramp = np.arange(256, dtype=np.float32) / 255.0
        lut = np.clip(ramp ** g * gain, 0, 1) * 255.0
        lut = lut.astype(np.uint8)
        _lut_cache[key] = lut
    return lut


def _clahe(frame):
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    cl = cv2.createCLAHE(clipLimit=CLAHE_CLIP, tileGridSize=(CLAHE_GRID, CLAHE_GRID))
    lab[:, :, 0] = cl.apply(lab[:, :, 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def ll_gain(frame, t):
    """GAIN — gamma lift de sombras (LUT)."""
    return cv2.LUT(frame, _gamma_lut(GAMMA_GAIN, GAIN))


def ll_clahe(frame, t):
    """CLAHE — ecualización adaptativa local (detalle en sombras)."""
    return _clahe(frame)


def ll_max(frame, t):
    """MAX — CLAHE + gamma fuerte (rescate máximo)."""
    return cv2.LUT(_clahe(frame), _gamma_lut(GAMMA_MAX, GAIN))


LOWLIGHT_FUNCS = {1: ll_gain, 2: ll_clahe, 3: ll_max}
LOWLIGHT_NAMES = {0: 'OFF', 1: 'GAIN', 2: 'CLAHE', 3: 'MAX'}
