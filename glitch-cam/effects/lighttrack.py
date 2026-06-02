"""
LIGHTTRACK — seguimiento de la fuente de luz más brillante (linterna del móvil).

Detecta el punto más brillante del frame y devuelve un bbox alrededor, para
alimentar los efectos REVENTUS con ÉL en vez de con la cara → los efectos
(swirl/zoom/balo/kaleido…) orbitan el rayo de la linterna mientras la movés.

`find_light` corre a baja resolución (rápido). `LIGHT_THRESH` ajustable en caliente:
bajalo si tu linterna es tenue, subilo si hay otras luces que lo confunden.
"""
import cv2

LIGHT_THRESH = 165   # brillo mínimo (0-255) para considerar que hay una fuente
LIGHT_BOX    = 0.38   # tamaño del bbox como fracción del lado menor del frame
_DET_W       = 160    # ancho de detección (downscale para velocidad)


def find_light(frame):
    """Devuelve (x, y, w, h) alrededor del punto más brillante, o None si no hay."""
    h, w = frame.shape[:2]
    sw = _DET_W
    sh = max(1, int(h * sw / w))
    small = cv2.resize(frame, (sw, sh))
    gray  = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    gray  = cv2.GaussianBlur(gray, (0, 0), 4)          # difumina → blob, no pixel aislado
    _, maxval, _, maxloc = cv2.minMaxLoc(gray)
    if maxval < LIGHT_THRESH:
        return None
    cx = int(maxloc[0] * w / sw)
    cy = int(maxloc[1] * h / sh)
    b  = int(min(w, h) * LIGHT_BOX)
    bx = max(0, cx - b // 2)
    by = max(0, cy - b // 2)
    return (bx, by, min(b, w - bx), min(b, h - by))
