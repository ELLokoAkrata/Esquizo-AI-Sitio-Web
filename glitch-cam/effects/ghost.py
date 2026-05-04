import cv2
import numpy as np


_mosh_buf = None   # buffer ghost/soul
_frac_buf = None   # offsets de bloques para FRAC

MOSH_NAMES = {0: 'OFF', 1: 'GHST', 2: 'SOUL', 3: 'FRAC'}


def fx_ghst(frame, prev, t, tick=0):
    """GHOST — fantasma pronunciado con aura, deriva y glow."""
    global _mosh_buf
    h, w = frame.shape[:2]
    if _mosh_buf is None:
        _mosh_buf = frame.astype(np.float32)
        return frame
    decay     = 0.92 + t * 0.07
    _mosh_buf = _mosh_buf * decay + frame.astype(np.float32) * (1 - decay)
    ghost     = _mosh_buf.clip(0, 255).astype(np.uint8)
    ghost = cv2.GaussianBlur(ghost, (7, 7), 0)
    dx = int(t * 7 * np.sin(tick * 0.018))
    dy = int(t * 5 * np.cos(tick * 0.013))
    if dx or dy:
        ghost = cv2.warpAffine(ghost, np.float32([[1, 0, dx], [0, 1, dy]]),
                               (w, h), borderMode=cv2.BORDER_REFLECT)
    ghost_f = ghost.astype(np.float32)
    ghost_f[:, :, 0] = np.clip(ghost_f[:, :, 0] * 1.4,  0, 255)  # +B
    ghost_f[:, :, 1] = np.clip(ghost_f[:, :, 1] * 1.1,  0, 255)  # +G leve
    ghost_f[:, :, 2] = np.clip(ghost_f[:, :, 2] * 0.65, 0, 255)  # -R
    alpha = 0.3 + t * 0.60
    return np.clip(frame.astype(np.float32) * (1 - alpha) +
                   ghost_f * alpha, 0, 255).astype(np.uint8)


def fx_soul(frame, prev, t, tick=0):
    """SOUL — múltiples copias fantasma driftando, alma separándose del cuerpo."""
    global _mosh_buf
    if _mosh_buf is None:
        _mosh_buf = frame.astype(np.float32)
        return frame
    decay     = 0.86 + t * 0.11
    _mosh_buf = _mosh_buf * decay + frame.astype(np.float32) * (1 - decay)
    ghost     = _mosh_buf.clip(0, 255).astype(np.uint8)
    n_souls   = int(t * 2) + 2
    result    = frame.astype(np.float32) * 0.35
    for i in range(n_souls):
        phase = i * 2.09 + tick * 0.017
        dx = int(t * (18 + i * 12) * np.sin(phase))
        dy = int(t * (12 + i *  8) * np.cos(phase * 0.78))
        soul = np.roll(np.roll(ghost, dx, axis=1), dy, axis=0).astype(np.float32)
        soul[:, :, i % 3] = np.clip(soul[:, :, i % 3] * 1.6, 0, 255)
        result += soul * (0.52 / (i + 1))
    return result.clip(0, 255).astype(np.uint8)


def fx_frac(frame, prev, t, tick=0):
    """FRAC — imagen se rompe en bloques que intentan reconstruirse sin lograrlo."""
    global _frac_buf
    h, w  = frame.shape[:2]
    block = max(12, int(56 - t * 40))
    n_bh  = (h + block - 1) // block
    n_bw  = (w + block - 1) // block

    if _frac_buf is None or _frac_buf.shape[:2] != (n_bh, n_bw):
        _frac_buf = np.zeros((n_bh, n_bw, 2), dtype=np.float32)

    _frac_buf *= (0.80 + t * 0.13)

    new_frac = np.random.random((n_bh, n_bw)) < (0.04 + t * 0.20)
    count    = int(new_frac.sum())
    if count > 0:
        max_d = 18 + int(t * 95)
        _frac_buf[new_frac] = np.random.uniform(-max_d, max_d, (count, 2)).astype(np.float32)

    ox_px = np.repeat(np.repeat(_frac_buf[:, :, 0], block, axis=0),
                      block, axis=1)[:h, :w]
    oy_px = np.repeat(np.repeat(_frac_buf[:, :, 1], block, axis=0),
                      block, axis=1)[:h, :w]
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    map_x = np.clip(x_g + ox_px, 0, w - 1).astype(np.float32)
    map_y = np.clip(y_g + oy_px, 0, h - 1).astype(np.float32)
    return cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_REFLECT)


MOSH_FUNCS = {1: fx_ghst, 2: fx_soul, 3: fx_frac}
