import cv2
import numpy as np


# ─── MODO 1: BLOQUES ──────────────────────────────────────────────────────────
def color_corrupt_blocks(frame, t):
    result = frame.copy()
    h, w = frame.shape[:2]
    num_regions = int(t * 18) + 3
    max_rw = max(9,  int(w * (0.08 + t * 0.92)))
    max_rh = max(3,  int(h * (0.04 + t * 0.70)))
    for _ in range(num_regions):
        if np.random.random() > 0.55: continue
        rx  = np.random.randint(0, max(1, w - 10))
        ry  = np.random.randint(0, max(1, h - 10))
        rx2 = min(rx + np.random.randint(8, max_rw), w)
        ry2 = min(ry + np.random.randint(2, max_rh), h)
        result[ry:ry2, rx:rx2, np.random.randint(0, 3)] ^= np.random.randint(20, 240)
    num_inv = int(t * 7) + 1
    for _ in range(num_inv):
        if np.random.random() < 0.45: continue
        rx  = np.random.randint(0, w)
        ry  = np.random.randint(0, h)
        rw  = np.random.randint(15, max(16, int(w * (0.15 + t * 0.85))))
        rh  = np.random.randint(3,  max(4,  int(h * (0.05 + t * 0.55))))
        result[ry:min(ry + rh, h), rx:min(rx + rw, w)] = \
            255 - result[ry:min(ry + rh, h), rx:min(rx + rw, w)]
    if t > 0.6 and np.random.random() < (t - 0.6) * 1.2:
        result[:, :, np.random.randint(0, 3)] ^= np.random.randint(15, 80)
    return result


# ─── MODO 2: ORGÁNICO (sin rayas ni bloques) ──────────────────────────────────
def color_corrupt_organic(frame, t):
    result = frame.copy()
    h, w = frame.shape[:2]
    # LUT — remapeo puro de valores, sin forma geométrica
    for ch in range(3):
        if np.random.random() > 0.55: continue
        lut = np.arange(256, dtype=np.uint8)
        mask = np.random.random(256) < (t * 0.35)
        lut[mask] = lut[mask] ^ np.random.randint(20, 220, 256).astype(np.uint8)[mask]
        result[:, :, ch] = lut[result[:, :, ch]]
    # Máscara sinusoidal 2D — ola de corrupción sin bordes rectos
    ys = np.arange(h, dtype=np.float32).reshape(h, 1)
    xs = np.arange(w, dtype=np.float32).reshape(1, w)
    for _ in range(int(t * 3) + 1):
        wave = np.sin(ys * np.random.uniform(0.01, 0.09)
                    + xs * np.random.uniform(0.005, 0.04)
                    + np.random.uniform(0, 6.28))
        sine_mask = wave > (1.0 - t * 0.85)
        ch = np.random.randint(0, 3)
        result[:, :, ch][sine_mask] ^= np.random.randint(40, 200)
    # Per-píxel — entropía sin forma
    if t > 0.4:
        swap_mask = np.random.random((h, w)) < (t - 0.4) * 0.5
        ch1, ch2  = np.random.choice(3, 2, replace=False)
        tmp = result[:, :, ch1][swap_mask].copy()
        result[:, :, ch1][swap_mask] = result[:, :, ch2][swap_mask]
        result[:, :, ch2][swap_mask] = tmp
    # Marea global a intensidad alta
    if t > 0.65 and np.random.random() < (t - 0.65) * 1.5:
        result[:, :, np.random.randint(0, 3)] ^= np.random.randint(10, 70)
    return result


# ─── MODO 3: COMPLETO (bloques + rayas + orgánico) ────────────────────────────
def color_corrupt_full(frame, t):
    result = color_corrupt_blocks(frame, t * 0.6)
    result = color_corrupt_organic(result, t)
    h, w = result.shape[:2]
    rows = np.where(np.random.random(h) < t * 0.45)[0]
    for y in rows:
        ch1, ch2 = np.random.choice(3, 2, replace=False)
        result[y, :, [ch1, ch2]] = result[y, :, [ch2, ch1]]
    cols = np.where(np.random.random(w) < t * 0.25)[0]
    for x in cols:
        result[:, x, np.random.randint(0, 3)] ^= np.random.randint(30, 210)
    return result


# ─── MODO 4: PURO (solo LUT + per-píxel, cero geometría) ─────────────────────
def color_corrupt_pure(frame, t):
    result = frame.copy()
    h, w = frame.shape[:2]
    for ch in range(3):
        lut = np.arange(256, dtype=np.uint8)
        mask = np.random.random(256) < (t * 0.45)
        lut[mask] = lut[mask] ^ np.random.randint(20, 220, 256).astype(np.uint8)[mask]
        result[:, :, ch] = lut[result[:, :, ch]]
    pixel_prob = t * 0.55
    swap_mask  = np.random.random((h, w)) < pixel_prob
    ch1, ch2   = np.random.choice(3, 2, replace=False)
    tmp = result[:, :, ch1][swap_mask].copy()
    result[:, :, ch1][swap_mask] = result[:, :, ch2][swap_mask]
    result[:, :, ch2][swap_mask] = tmp
    if t > 0.5 and np.random.random() < (t - 0.5) * 1.8:
        result[:, :, np.random.randint(0, 3)] ^= np.random.randint(10, 90)
    return result


CORRUPT_MODES = {1: color_corrupt_blocks,
                 2: color_corrupt_organic,
                 3: color_corrupt_full,
                 4: color_corrupt_pure}
CORRUPT_NAMES = {0: 'OFF', 1: 'BLK', 2: 'ORG', 3: 'ALL', 4: 'PUR'}
