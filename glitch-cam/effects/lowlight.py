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

# ── NVG (visión nocturna verde fósforo) ──
NVG_GAMMA = 0.48    # amplificación de brillo del intensificador (más bajo = más brillo)
NVG_GRAIN = 18      # ruido/scintillation (0 = limpio)
NVG_VIG   = 0.55    # fuerza del viñeteo (0 = sin viñeta)

_lut_cache  = {}
_ramp_cache = {}
_vig_cache  = {}


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


def _ramp_lut(bgr):
    """LUT luminancia → negro→color (rampa fósforo). Cacheada por color BGR."""
    lut = _ramp_cache.get(bgr)
    if lut is None:
        ramp = np.arange(256, dtype=np.float32) / 255.0
        lut = np.zeros((256, 3), np.uint8)
        for i in range(3):
            lut[:, i] = (ramp * bgr[i]).astype(np.uint8)
        _ramp_cache[bgr] = lut
    return lut


def _vignette(h, w):
    v = _vig_cache.get((h, w))
    if v is None:
        cy, cx = h / 2.0, w / 2.0
        y, x = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        v = (1.0 - NVG_VIG * np.clip(r / (np.sqrt(cx*cx + cy*cy) + 1e-6), 0, 1))
        v = v.astype(np.float32)[:, :, None]
        _vig_cache[(h, w)] = v
    return v


def _amplify(frame):
    """Luminancia amplificada (intensificador) + grano de scintillation."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.LUT(gray, _gamma_lut(NVG_GAMMA, GAIN))
    if NVG_GRAIN > 0:
        noise = np.random.normal(0, NVG_GRAIN, gray.shape).astype(np.int16)
        gray = np.clip(gray.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return gray


def _vig(out, h, w):
    if NVG_VIG > 0:
        out = (out.astype(np.float32) * _vignette(h, w)).astype(np.uint8)
    return out


def ll_nvg(frame, t):
    """NVG — visión nocturna verde fósforo (#00ff41)."""
    g = _amplify(frame)
    return _vig(_ramp_lut((65, 255, 0))[g], *g.shape)


def ll_amber(frame, t):
    """AMBR — visión nocturna ámbar (#ffb000): mira ámbar / monitor retro."""
    g = _amplify(frame)
    return _vig(_ramp_lut((0, 176, 255))[g], *g.shape)


def ll_thermal(frame, t):
    """THRM — térmica: amplifica + colormap de calor (FLIR). Va al inicio del pipeline."""
    g = _amplify(frame)
    return _vig(cv2.applyColorMap(g, cv2.COLORMAP_INFERNO), *g.shape)


LOWLIGHT_FUNCS = {1: ll_gain, 2: ll_clahe, 3: ll_max, 4: ll_nvg, 5: ll_amber, 6: ll_thermal}
LOWLIGHT_NAMES = {0: 'OFF', 1: 'GAIN', 2: 'CLAHE', 3: 'MAX', 4: 'NVG', 5: 'AMBR', 6: 'THRM'}
