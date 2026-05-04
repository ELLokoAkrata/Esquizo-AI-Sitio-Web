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


# ─── MODO 2: DISSOLVE (corrupción full-frame, blobs orgánicos mutantes) ───────
_dslv_tick = 0

def color_corrupt_dissolve(frame, t):
    """DSLV — misma corrupción XOR que BLK pero full-frame y sin formas rectangulares.
    Ruido a baja resolución escalado con bilinear → blobs orgánicos sin bordes rectos.
    Cada canal R/G/B cambia a distinta velocidad → se desincronizan → misma
    saturación corrupta que BLK pero cubriendo toda la pantalla y mutando.
    """
    global _dslv_tick
    _dslv_tick += 1
    k = _dslv_tick

    h, w = frame.shape[:2]

    # ── Tamaño de blob oscilante — el patrón respira entre grueso y fino ──────
    blob_base = 22 - t * 14
    blob_osc  = np.sin(k * 0.018) * 6   # oscila lentamente entre -6 y +6
    blob = max(4, int(blob_base + blob_osc))
    nh, nw = max(3, h // blob), max(3, w // blob)

    # ── Rango XOR variable por canal — cada canal tiene su propio "estado" ────
    # Los rangos oscilan: a veces valores oscuros (sutil), a veces brillantes (brutal)
    lo_r = int(20  + abs(np.sin(k * 0.011)) * 80)
    hi_r = int(180 + abs(np.sin(k * 0.009)) * 70)
    lo_g = int(20  + abs(np.sin(k * 0.017 + 2.09)) * 80)
    hi_g = int(180 + abs(np.sin(k * 0.013 + 2.09)) * 70)
    lo_b = int(20  + abs(np.sin(k * 0.023 + 4.19)) * 80)
    hi_b = int(180 + abs(np.sin(k * 0.019 + 4.19)) * 70)

    # Cada canal evoluciona a distinta velocidad → desincronización cromática
    r_lo = np.random.default_rng(k // 2        ).integers(lo_r, max(lo_r+1, hi_r), (nh, nw), dtype=np.uint8)
    g_lo = np.random.default_rng(k // 3 + 1111 ).integers(lo_g, max(lo_g+1, hi_g), (nh, nw), dtype=np.uint8)
    b_lo = np.random.default_rng(k // 5 + 2222 ).integers(lo_b, max(lo_b+1, hi_b), (nh, nw), dtype=np.uint8)

    # Bilinear upscale → bordes disueltos, sin aristas rectas
    r_pat = cv2.resize(r_lo.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR).astype(np.uint8)
    g_pat = cv2.resize(g_lo.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR).astype(np.uint8)
    b_pat = cv2.resize(b_lo.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR).astype(np.uint8)

    xor_mask = np.stack([b_pat, g_pat, r_pat], axis=2)

    # ── Offset global de paleta que rota lentamente ───────────────────────────
    # XOR con un valor distinto por canal que cicla → toda la paleta se desplaza
    pal_r = np.uint8(int(k * 2.3 * t) % 256)
    pal_g = np.uint8(int(k * 3.7 * t + 85)  % 256)
    pal_b = np.uint8(int(k * 1.9 * t + 170) % 256)
    xor_mask[:, :, 2] ^= pal_r
    xor_mask[:, :, 1] ^= pal_g
    xor_mask[:, :, 0] ^= pal_b

    result = frame ^ xor_mask

    # Inversión orgánica a intensidad alta
    if t > 0.5:
        inv_lo = np.random.default_rng(k // 4 + 3333).integers(0, 2, (max(2, nh//2), max(2, nw//2)), dtype=np.uint8)
        inv_mask = cv2.resize(inv_lo.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR)
        inv_mask = (inv_mask > 0.5).astype(np.float32)[:, :, np.newaxis] * (t - 0.5) * 1.8
        result = (result.astype(np.float32) * (1 - inv_mask)
                  + (255 - result).astype(np.float32) * inv_mask).clip(0, 255).astype(np.uint8)

    alpha = 0.25 + t * 0.75
    return (frame.astype(np.float32) * (1.0 - alpha)
            + result.astype(np.float32) * alpha).clip(0, 255).astype(np.uint8)


# ─── MODO 3: ORGÁNICO (sin rayas ni bloques) ──────────────────────────────────
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
                 2: color_corrupt_dissolve,
                 3: color_corrupt_organic,
                 4: color_corrupt_full,
                 5: color_corrupt_pure}
CORRUPT_NAMES = {0: 'OFF', 1: 'BLK', 2: 'DSLV', 3: 'ORG', 4: 'ALL', 5: 'PUR'}
