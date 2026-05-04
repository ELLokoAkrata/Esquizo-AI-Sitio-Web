import cv2
import numpy as np
import inspect

from effects.corrupt import color_corrupt_pure


_rev_echo_buf = None  # buffer persistente para ECHO


def _face_mask(shape, bbox, feather=0.8):
    h, w = shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw / 2.0, by + bh / 2.0
    sx = bw * feather;  sy = bh * feather
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    mask = np.exp(-0.5 * ((x_g - cx)**2 / sx**2 + (y_g - cy)**2 / sy**2))
    return mask[:, :, np.newaxis]


def _blend(original, effected, mask):
    o = original.astype(np.float32)
    e = effected.astype(np.float32)
    return (o + (e - o) * mask).clip(0, 255).astype(np.uint8)


def _expand_bbox(bbox, frame_shape, factor=1.6):
    """Expande el bbox alrededor del centro para evitar bordes duros en kaleido."""
    h, w = frame_shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw // 2, by + bh // 2
    nw, nh = int(bw * factor), int(bh * factor)
    x1 = max(0, cx - nw // 2);  y1 = max(0, cy - nh // 2)
    x2 = min(w, cx + nw // 2);  y2 = min(h, cy + nh // 2)
    return (x1, y1, x2 - x1, y2 - y1)


def rev_swrl(frame, bbox, t, tick):
    """Espiral esquizo — 2 capas girando a velocidades distintas + zoom."""
    h, w = frame.shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw / 2.0, by + bh / 2.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = x_g - cx;  dy = y_g - cy
    r     = np.sqrt(dx**2 + dy**2) + 0.001
    angle = np.arctan2(dy, dx)

    result = np.zeros_like(frame, dtype=np.float32)
    for i, (spd, zmul) in enumerate([(0.04, 0.0), (0.025, 0.18)]):
        twist  = t * (2.8 + i * 1.4) * np.sin(tick * spd) / (1.0 + r * 0.005)
        zoom   = 1.0 + zmul * t * np.cos(tick * spd * 0.6)
        new_a  = angle + twist
        r2     = r / max(0.01, zoom)
        mx = np.clip(cx + r2 * np.cos(new_a), 0, w - 1).astype(np.float32)
        my = np.clip(cy + r2 * np.sin(new_a), 0, h - 1).astype(np.float32)
        layer = cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        result += layer.astype(np.float32) * (0.6 if i == 0 else 0.5)

    eff = (result / 1.1).clip(0, 255).astype(np.uint8)
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.2))


def rev_acid(frame, bbox, t, tick):
    """XOR multi-escala + corrupción pura + derretimiento por filas."""
    h, w = frame.shape[:2]
    s2 = cv2.resize(cv2.resize(frame, (w // 2, h // 2)), (w, h))
    s4 = cv2.resize(cv2.resize(frame, (w // 4, h // 4)), (w, h))
    s8 = cv2.resize(cv2.resize(frame, (max(1, w // 8), max(1, h // 8))), (w, h))
    phase = int(tick * max(0.3, t) * 2) % 3
    if phase == 0:   eff = frame ^ s2 ^ s4
    elif phase == 1: eff = s2    ^ s4 ^ s8
    else:            eff = frame ^ s4 ^ s8
    eff = color_corrupt_pure(eff, t * 0.85)
    y_g2, x_g2 = np.mgrid[0:h, 0:w].astype(np.float32)
    row_shift = (np.random.normal(0, t * 18, h)).astype(np.float32)
    mx = np.clip(x_g2 + row_shift.reshape(h, 1), 0, w - 1).astype(np.float32)
    eff = cv2.remap(eff, mx, y_g2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.1))


def rev_zoom(frame, bbox, t, tick):
    """2 zooms desfasados — cada uno en canal distinto, pulsan juntos."""
    h, w = frame.shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw / 2.0, by + bh / 2.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    layers = []
    for i, phase_off in enumerate([0.0, 2.1]):
        pulse = 1.0 + t * (0.4 + i * 0.2) * np.sin(tick * 0.07 + phase_off)
        mx = np.clip(cx + (x_g - cx) / pulse, 0, w - 1).astype(np.float32)
        my = np.clip(cy + (y_g - cy) / pulse, 0, h - 1).astype(np.float32)
        layers.append(cv2.remap(frame, mx, my, cv2.INTER_LINEAR,
                                borderMode=cv2.BORDER_REFLECT))
    eff = layers[0].copy()
    eff[:, :, 1] = layers[1][:, :, 1]
    eff[:, :, 2] = cv2.addWeighted(
        layers[0][:, :, 2], 0.5, layers[1][:, :, 2], 0.5, 0)
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.0))


def rev_echo(frame, bbox, t):
    """Residuo slow — buffer persistente con decay lento."""
    global _rev_echo_buf
    h, w = frame.shape[:2]
    if _rev_echo_buf is None or _rev_echo_buf.shape != frame.shape:
        _rev_echo_buf = frame.astype(np.float32).copy()
    decay = 0.82 + t * 0.12
    _rev_echo_buf = _rev_echo_buf * decay + frame.astype(np.float32) * (1.0 - decay)
    half = cv2.resize(cv2.resize(frame, (w // 2, h // 2)), (w, h))
    eff  = (_rev_echo_buf * 0.75 + half.astype(np.float32) * 0.35).clip(0, 255).astype(np.uint8)
    eff  = eff ^ (frame & int(t * 35))
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.3))


def rev_drunk(frame, bbox, t, tick):
    """Múltiples yos fantasma — doble triple visión de borracho."""
    h, w = frame.shape[:2]
    n_ghosts = int(t * 3) + 2
    result = frame.astype(np.float32) * 0.4
    for i in range(1, n_ghosts + 1):
        phase = i * 2.09 + tick * 0.022
        ox = int(t * 38 * np.sin(phase))
        oy = int(t * 24 * np.cos(phase * 0.71))
        ghost = np.roll(np.roll(frame, ox, axis=1), oy, axis=0).astype(np.float32)
        ghost[:, :, i % 3] = np.clip(ghost[:, :, i % 3] * 1.4, 0, 255)
        result += ghost * (0.55 / i)
    eff = result.clip(0, 255).astype(np.uint8)
    return _blend(frame, eff, _face_mask(frame.shape, bbox, 1.3))


def rev_balo(frame, bbox, t, tick):
    """Balloon inflate — balloon.glsl centrado en el rostro."""
    h, w = frame.shape[:2]
    bx, by, bw, bh = bbox
    cx, cy = bx + bw / 2.0, by + bh / 2.0
    rx, ry = bw * 0.6, bh * 0.6

    cp = (tick % 300) / 300.0
    ep = cp * 2.0 if cp < 0.5 else (1.0 - cp) * 2.0
    effect_r = (0.75 + t * 0.55) * np.sin(ep * np.pi)
    if effect_r < 0.01:
        return frame

    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (x_g - cx) / rx;  ny = (y_g - cy) / ry
    dist = np.sqrt(nx**2 + ny**2) + 0.001
    within   = dist < effect_r
    strength = np.where(within, 10.0 - (dist / effect_r), 0.0)
    bulge    = np.where(within, effect_r - dist, 0.0)
    scale    = 1.0 + strength * bulge * np.sin(ep * np.pi) * (0.08 + t * 0.18)
    scale    = np.maximum(0.05, scale)

    map_x = np.clip(cx + nx * scale * rx, 0, w - 1).astype(np.float32)
    map_y = np.clip(cy + ny * scale * ry, 0, h - 1).astype(np.float32)
    inflated = cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR,
                         borderMode=cv2.BORDER_REFLECT)
    return _blend(frame, inflated, _face_mask(frame.shape, bbox, 1.1))


REV_FUNCS    = {1: rev_swrl, 2: rev_acid, 3: rev_zoom,
                4: rev_echo, 5: rev_drunk, 6: rev_balo}
REV_NAMES    = {0: 'OFF', 1: 'SWRL', 2: 'ACID', 3: 'ZOOM',
                4: 'ECHO', 5: 'DRNK', 6: 'BALO'}
REV_USE_TICK = {k for k, fn in REV_FUNCS.items()
                if 'tick' in inspect.signature(fn).parameters}
