"""
PALT — PALETA ACID.

Reduce el frame a paletas limitadas psycho-anarco-punk (verde tóxico, crimson,
magenta, amber, purple) replicando el look "512 COLOURS" de los acid-OS emulators.

Todo se resuelve vía LUT de luminancia (gray → lut[gray]) o máscaras de bits, así
que es real-time: una sola indexación por frame, cero loops por píxel.

Paleta DENTAKORV (CLAUDE.md), en BGR para OpenCV.
"""
import cv2
import numpy as np


# ─── PALETA (BGR) ───────────────────────────────────────────────────────────────
BLACK   = (6,   3,   4)      # DEEP BLACK (casi negro, leve tinte)
GREEN   = (65,  255, 0)      # TOXIC GREEN  #00ff41
CRIMSON = (24,  0,   192)    # ARTERIAL CRIMSON
PURPLE  = (173, 13,  106)    # BRUISED PURPLE
AMBER   = (0,   176, 255)    # AMBER
PINK    = (149, 45,  255)    # WET PINK
YELLOW  = (0,   255, 234)    # HARSH YELLOW
MAGENTA = (255, 0,   255)    # magenta puro


def _gradient_lut(stops):
    """Construye una LUT (256,3) BGR interpolando entre stops [(pos0..1, bgr), ...]."""
    xs  = np.linspace(0.0, 1.0, 256)
    pos = [p for p, _ in stops]
    lut = np.zeros((256, 3), np.float32)
    for c in range(3):
        vals = [col[c] for _, col in stops]
        lut[:, c] = np.interp(xs, pos, vals)
    return lut.astype(np.uint8)


# LUTs cacheadas (se construyen una sola vez al importar)
_LUT_GREEN = _gradient_lut([(0.0, BLACK), (1.0, GREEN)])
_LUT_MGTA  = _gradient_lut([(0.0, BLACK), (0.5, GREEN), (1.0, MAGENTA)])
_LUT_GHUL  = _gradient_lut([(0.0, BLACK), (0.5, GREEN), (1.0, CRIMSON)])
_LUT_PNK   = _gradient_lut([(0.0, BLACK), (0.45, PURPLE), (1.0, PINK)])
# ACID: rampa cíclica de 6 colores (vuelve al inicio para poder rotar sin costura)
_LUT_ACID  = _gradient_lut([
    (0.0,  CRIMSON), (0.2, AMBER),  (0.4, YELLOW),
    (0.6,  GREEN),   (0.8, MAGENTA), (1.0, CRIMSON),
])


def _apply_lut(frame, lut, t):
    """gray → lut → mezcla con original según t (dosificación)."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mapped = lut[gray]                       # (h,w,3)
    alpha = 0.45 + t * 0.55                  # 0.45 → 1.0
    return cv2.addWeighted(mapped, alpha, frame, 1.0 - alpha, 0)


# ─── MODOS ───────────────────────────────────────────────────────────────────────
def palt_green(frame, t):
    """GRN — duotone negro→verde tóxico (terminal acid clásico)."""
    return _apply_lut(frame, _LUT_GREEN, t)


def palt_512(frame, t):
    """512 — posterizado a 8 niveles/canal (8³=512 colores), el look '512 COLOURS'.
    A más t, menos niveles (más brutal): 8 → 4 niveles."""
    bits = 0xE0 if t < 0.5 else 0xC0          # 3 bits (8 niveles) → 2 bits (4 niveles)
    half = 0x10 if t < 0.5 else 0x20          # recentrar el nivel
    post = (frame & bits) | half
    alpha = 0.5 + t * 0.5
    return cv2.addWeighted(post, alpha, frame, 1.0 - alpha, 0)


def palt_magenta(frame, t):
    """MGTA — duotone negro→verde→magenta (sombras verdes, luces magenta)."""
    return _apply_lut(frame, _LUT_MGTA, t)


def palt_acid(frame, t, tick):
    """ACID — rampa de 6 colores acid mapeada por luminancia; tick rota la paleta."""
    off = int(tick * (0.6 + t * 2.0)) % 256
    lut = np.roll(_LUT_ACID, off, axis=0)
    return _apply_lut(frame, lut, t)


def palt_ghoul(frame, t):
    """GHUL — 3 tonos: negro / verde tóxico / crimson (calavera acid)."""
    return _apply_lut(frame, _LUT_GHUL, t)


def palt_pink(frame, t):
    """PNK — duotone negro→purple→wet pink."""
    return _apply_lut(frame, _LUT_PNK, t)


PALT_FUNCS = {1: palt_green, 2: palt_512, 3: palt_magenta,
              4: palt_acid,  5: palt_ghoul, 6: palt_pink}
PALT_NAMES = {0: 'OFF', 1: 'GRN', 2: '512', 3: 'MGTA',
              4: 'ACID', 5: 'GHUL', 6: 'PNK'}
