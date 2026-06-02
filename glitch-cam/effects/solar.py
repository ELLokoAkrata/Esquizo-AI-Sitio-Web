"""
SOLAR / THERMAL — FALSO COLOR.

SOLR: solarización Sabattier (invierte sobre un umbral) vía LUT.
THRM: mapa térmico (luminancia → colormap tipo cámara de calor).
INVT: negativo animado con rotación de tono.

`t` controla el umbral / la mezcla con el original.
"""
import cv2
import numpy as np

_ramp = np.arange(256, dtype=np.uint8)


def solar_solr(frame, t, tick):
    """SOLR — solarización: los tonos sobre el umbral se invierten (Sabattier)."""
    thr = int(220 - t * 150)                       # más t → más zona invertida
    lut = np.where(_ramp < thr, _ramp, 255 - _ramp).astype(np.uint8)
    sol = cv2.LUT(frame, lut)
    a   = 0.4 + t * 0.6
    return cv2.addWeighted(frame, 1.0 - a, sol, a, 0)


def solar_thermal(frame, t, tick):
    """THRM — mapa térmico: luminancia → colormap de cámara de calor."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    therm = cv2.applyColorMap(gray, cv2.COLORMAP_JET)
    a = 0.45 + t * 0.55
    return cv2.addWeighted(frame, 1.0 - a, therm, a, 0)


def solar_invert(frame, t, tick):
    """INVT — negativo + rotación de tono animada."""
    inv = 255 - frame
    hsv = cv2.cvtColor(inv, cv2.COLOR_BGR2HSV)
    hsv[:, :, 0] = (hsv[:, :, 0].astype(np.int16) + int(tick * (1 + t * 4)) % 180) % 180
    inv = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    a = 0.4 + t * 0.6
    return cv2.addWeighted(frame, 1.0 - a, inv, a, 0)


SOLAR_FUNCS = {1: solar_solr, 2: solar_thermal, 3: solar_invert}
SOLAR_NAMES = {0: 'OFF', 1: 'SOLR', 2: 'THRM', 3: 'INVT'}
