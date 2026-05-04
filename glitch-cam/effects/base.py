import cv2
import numpy as np

# buffers persistentes para color_trails
_trail_r = None
_trail_g = None
_trail_b = None


def rgb_split(frame, t):
    """H — horizontal clásico: R derecha, B izquierda."""
    off = int(t * 25) + 2
    b, g, r = cv2.split(frame)
    h, w = frame.shape[:2]
    Mx = lambda dx: np.float32([[1, 0, dx], [0, 1,  0]])
    r2 = cv2.warpAffine(r, Mx( off), (w, h), borderMode=cv2.BORDER_REFLECT)
    b2 = cv2.warpAffine(b, Mx(-off), (w, h), borderMode=cv2.BORDER_REFLECT)
    return cv2.merge([b2, g, r2])


def rgb_split_v(frame, t):
    """V — vertical: R arriba, B abajo, G quieto."""
    off = int(t * 25) + 2
    b, g, r = cv2.split(frame)
    h, w = frame.shape[:2]
    My = lambda dy: np.float32([[1, 0, 0], [0, 1, dy]])
    r2 = cv2.warpAffine(r, My(-off), (w, h), borderMode=cv2.BORDER_REFLECT)
    b2 = cv2.warpAffine(b, My( off), (w, h), borderMode=cv2.BORDER_REFLECT)
    return cv2.merge([b2, g, r2])


def rgb_split_diag(frame, t):
    """DIAG — diagonal: R arriba-derecha, B abajo-izquierda, G quieto."""
    off = int(t * 18) + 2
    b, g, r = cv2.split(frame)
    h, w = frame.shape[:2]
    M = lambda dx, dy: np.float32([[1, 0, dx], [0, 1, dy]])
    r2 = cv2.warpAffine(r, M( off, -off), (w, h), borderMode=cv2.BORDER_REFLECT)
    b2 = cv2.warpAffine(b, M(-off,  off), (w, h), borderMode=cv2.BORDER_REFLECT)
    return cv2.merge([b2, g, r2])


def rgb_split_tri(frame, t):
    """TRI — 3 canales a 120° entre sí, máxima separación cromática."""
    off = int(t * 22) + 2
    b, g, r = cv2.split(frame)
    h, w = frame.shape[:2]
    M = lambda dx, dy: np.float32([[1, 0, dx], [0, 1, dy]])
    # R → 0°, G → 120°, B → 240°
    r2 = cv2.warpAffine(r, M( off,    0  ), (w, h), borderMode=cv2.BORDER_REFLECT)
    g2 = cv2.warpAffine(g, M(-off//2, int(off * 0.87)), (w, h), borderMode=cv2.BORDER_REFLECT)
    b2 = cv2.warpAffine(b, M(-off//2,-int(off * 0.87)), (w, h), borderMode=cv2.BORDER_REFLECT)
    return cv2.merge([b2, g2, r2])


def rgb_split_chaos(frame, t, tick):
    """CHAOS — cada canal tiene su propio offset sinusoidal animado."""
    h, w = frame.shape[:2]
    b, g, r = cv2.split(frame)
    amp = t * 30 + 4
    M = lambda dx, dy: np.float32([[1, 0, dx], [0, 1, dy]])
    ox_r = int(amp * np.sin(tick * 0.031))
    oy_r = int(amp * 0.4 * np.cos(tick * 0.019))
    ox_g = int(amp * 0.5 * np.sin(tick * 0.047 + 2.09))
    oy_g = int(amp * 0.6 * np.cos(tick * 0.023 + 2.09))
    ox_b = int(amp * np.sin(tick * 0.038 + 4.19))
    oy_b = int(amp * 0.4 * np.cos(tick * 0.027 + 4.19))
    r2 = cv2.warpAffine(r, M(ox_r, oy_r), (w, h), borderMode=cv2.BORDER_REFLECT)
    g2 = cv2.warpAffine(g, M(ox_g, oy_g), (w, h), borderMode=cv2.BORDER_REFLECT)
    b2 = cv2.warpAffine(b, M(ox_b, oy_b), (w, h), borderMode=cv2.BORDER_REFLECT)
    return cv2.merge([b2, g2, r2])


RGB_FUNCS = {1: rgb_split, 2: rgb_split_v, 3: rgb_split_diag,
             4: rgb_split_tri, 5: rgb_split_chaos}
RGB_NAMES = {0: 'OFF', 1: 'H', 2: 'V', 3: 'DIAG', 4: 'TRI', 5: 'CHOS'}


def displacement(frame, t):
    h, w = frame.shape[:2]
    max_shift = int(t * 40) + 4
    prob = t * 0.65
    result = frame.copy()
    mask = np.random.random(h) < prob
    shifts = np.random.randint(-max_shift, max_shift + 1, h)
    for y in range(h):
        if mask[y]:
            result[y] = np.roll(frame[y], shifts[y], axis=0)
    return result


def noise(frame, t):
    n = np.random.normal(0, t * 55, frame.shape).astype(np.int16)
    return np.clip(frame.astype(np.int16) + n, 0, 255).astype(np.uint8)


def color_cycle(frame, t, tick):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.float32)
    shift = (tick * t * 1.8) % 180
    hsv[:, :, 0] = (hsv[:, :, 0] + shift) % 180
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * (1 + t * 0.5), 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def scanlines(frame, t):
    result = frame.copy()
    alpha = 0.12 + t * 0.3
    result[::3] = (result[::3] * (1 - alpha)).astype(np.uint8)
    return result


def glitch_blocks(frame, t):
    result = frame.copy()
    h, w = frame.shape[:2]
    count = int(t * 14) + 2
    for _ in range(count):
        if np.random.random() > 0.45:
            continue
        bx = np.random.randint(0, w)
        by = np.random.randint(0, h)
        bw = np.random.randint(15, max(16, int(w * 0.4)))
        bh = np.random.randint(2, 48)
        dx = int((np.random.random() - 0.5) * t * 90)
        sx1, sx2 = max(0, bx),     min(w, bx + bw)
        sy1, sy2 = max(0, by),     min(h, by + bh)
        dx1, dx2 = max(0, bx + dx), min(w, bx + dx + bw)
        if sx2 > sx1 and sy2 > sy1 and dx2 > dx1:
            chunk_w = min(sx2 - sx1, dx2 - dx1)
            result[sy1:sy2, dx1:dx1 + chunk_w] = frame[sy1:sy2, sx1:sx1 + chunk_w]
    return result


def crt_warp(frame, t, tick):
    h, w = frame.shape[:2]
    ys = np.arange(h, dtype=np.float32)
    xs = np.arange(w, dtype=np.float32)
    map_x = np.tile(xs, (h, 1))
    warp_vals = (np.sin(ys * 0.022 + tick * 0.015) * t * 12).reshape(h, 1)
    map_x = (map_x + warp_vals).astype(np.float32)
    map_y = np.tile(ys.reshape(h, 1), (1, w)).astype(np.float32)
    return cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_REFLECT)


def color_trails(frame, t):
    """ColorTrails — R/G/B con decay distinto, fantasmas arcoíris superpuestos."""
    global _trail_r, _trail_g, _trail_b
    b, g, r = cv2.split(frame.astype(np.float32))
    if _trail_r is None:
        _trail_r = r.copy(); _trail_g = g.copy(); _trail_b = b.copy()
        return frame
    # Cada canal persiste a velocidad diferente → el fantasma se separa en colores
    _trail_r = _trail_r * (0.90 + t * 0.09) + r * (0.10 - t * 0.09)
    _trail_g = _trail_g * (0.80 + t * 0.15) + g * (0.20 - t * 0.15)
    _trail_b = _trail_b * (0.68 + t * 0.22) + b * (0.32 - t * 0.22)
    alpha = 0.35 + t * 0.55
    out_r = (r * (1 - alpha) + _trail_r * alpha).clip(0, 255)
    out_g = (g * (1 - alpha) + _trail_g * alpha).clip(0, 255)
    out_b = (b * (1 - alpha) + _trail_b * alpha).clip(0, 255)
    return cv2.merge([out_b.astype(np.uint8), out_g.astype(np.uint8), out_r.astype(np.uint8)])


def pixel_sort(frame, t):
    """VerticalSort — columnas ordenadas por luminancia, derretimiento hacia abajo."""
    h, w = frame.shape[:2]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    # Índices de sort por columna (vectorizado, sin loops)
    sort_idx = np.argsort(gray, axis=0)          # (h, w)
    col_idx  = np.arange(w, dtype=np.intp)       # (w,)
    sorted_frame = frame[sort_idx, col_idx]      # fancy indexing → (h, w, 3)
    # Blend: a baja intensidad se mezcla con el original para que no sea puro
    alpha = 0.3 + t * 0.65
    return (frame * (1 - alpha) + sorted_frame * alpha).astype(np.uint8)


def wave(frame, t, tick):
    """Wave bidireccional — ondas X e Y simultáneas, más agresivo que CRT warp."""
    h, w = frame.shape[:2]
    ys = np.arange(h, dtype=np.float32)
    xs = np.arange(w, dtype=np.float32)
    amp_x = t * 30 + 6
    amp_y = t * 18 + 4
    # Desplazamiento horizontal (varía por fila)
    shift_x = (np.sin(ys * (0.025 + t * 0.03) + tick * 0.05) * amp_x +
               np.sin(ys * 0.011 + tick * 0.031) * amp_x * 0.4).reshape(h, 1)
    # Desplazamiento vertical (varía por columna)
    shift_y = (np.sin(xs * (0.03 + t * 0.02) + tick * 0.038) * amp_y).reshape(1, w)
    map_x = np.clip(np.tile(xs, (h, 1)) + shift_x, 0, w - 1).astype(np.float32)
    map_y = np.clip(np.tile(ys.reshape(h, 1), (1, w)) + shift_y, 0, h - 1).astype(np.float32)
    return cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def vortex(frame, t, tick):
    """SWRL — twist horario + succión al centro."""
    h, w = frame.shape[:2]
    cx, cy = w / 2.0, h / 2.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = x_g - cx;  dy = y_g - cy
    r     = np.sqrt(dx**2 + dy**2) + 0.001
    angle = np.arctan2(dy, dx)
    twist = t * 5.5 * np.pi / (1.0 + r * 0.006)
    spin  = tick * 0.025 * t
    new_a = angle + twist + spin
    pull  = 1.0 - t * 0.22 * np.exp(-r * 0.004)
    new_r = np.maximum(0.0, r * pull)
    mx = np.clip(cx + new_r * np.cos(new_a), 0, w - 1).astype(np.float32)
    my = np.clip(cy + new_r * np.sin(new_a), 0, h - 1).astype(np.float32)
    return cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def vortex_anti(frame, t, tick):
    """ANTI — twist anti-horario + expansión desde el centro."""
    h, w = frame.shape[:2]
    cx, cy = w / 2.0, h / 2.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = x_g - cx;  dy = y_g - cy
    r     = np.sqrt(dx**2 + dy**2) + 0.001
    angle = np.arctan2(dy, dx)
    twist = -t * 5.5 * np.pi / (1.0 + r * 0.006)
    spin  = -tick * 0.025 * t
    new_a = angle + twist + spin
    push  = 1.0 + t * 0.18 * np.exp(-r * 0.004)
    new_r = np.maximum(0.0, r * push)
    mx = np.clip(cx + new_r * np.cos(new_a), 0, w - 1).astype(np.float32)
    my = np.clip(cy + new_r * np.sin(new_a), 0, h - 1).astype(np.float32)
    return cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def vortex_pulse(frame, t, tick):
    """PULS — twist pulsante que respira entre colapso y expansión."""
    h, w = frame.shape[:2]
    cx, cy = w / 2.0, h / 2.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = x_g - cx;  dy = y_g - cy
    r     = np.sqrt(dx**2 + dy**2) + 0.001
    angle = np.arctan2(dy, dx)
    phase = np.sin(tick * 0.04)                             # -1 → 1
    twist = t * 6.0 * np.pi * phase / (1.0 + r * 0.005)
    spin  = tick * 0.02 * t
    new_a = angle + twist + spin
    breathe = 1.0 + t * 0.28 * np.sin(tick * 0.04 + r * 0.003)
    new_r = np.maximum(0.0, r * breathe)
    mx = np.clip(cx + new_r * np.cos(new_a), 0, w - 1).astype(np.float32)
    my = np.clip(cy + new_r * np.sin(new_a), 0, h - 1).astype(np.float32)
    return cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def vortex_exp(frame, t, tick):
    """EXP — explosión radial + twist suave, la imagen se derrite hacia afuera."""
    h, w = frame.shape[:2]
    cx, cy = w / 2.0, h / 2.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = x_g - cx;  dy = y_g - cy
    r     = np.sqrt(dx**2 + dy**2) + 0.001
    angle = np.arctan2(dy, dx)
    twist = t * 2.5 * np.pi / (1.0 + r * 0.003)
    spin  = tick * 0.018 * t
    new_a = angle + twist + spin
    # Expansión no-lineal: los píxeles del centro se estiran más
    push  = 1.0 + t * 0.45 / (1.0 + r * 0.012)
    new_r = np.maximum(0.0, r * push)
    mx = np.clip(cx + new_r * np.cos(new_a), 0, w - 1).astype(np.float32)
    my = np.clip(cy + new_r * np.sin(new_a), 0, h - 1).astype(np.float32)
    return cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def vortex_dual(frame, t, tick):
    """DUAL — dos vórtices opuestos en izq/der que compiten."""
    h, w = frame.shape[:2]
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)

    def _apply_vortex(x_g, y_g, cx, cy, sign):
        dx = x_g - cx;  dy = y_g - cy
        r     = np.sqrt(dx**2 + dy**2) + 0.001
        angle = np.arctan2(dy, dx)
        twist = sign * t * 4.5 * np.pi / (1.0 + r * 0.008)
        spin  = sign * tick * 0.022 * t
        new_a = angle + twist + spin
        pull  = 1.0 - t * 0.18 * np.exp(-r * 0.006)
        new_r = np.maximum(0.0, r * pull)
        return cx + new_r * np.cos(new_a), cy + new_r * np.sin(new_a)

    mx_l, my_l = _apply_vortex(x_g, y_g, w * 0.28, h * 0.5,  1)
    mx_r, my_r = _apply_vortex(x_g, y_g, w * 0.72, h * 0.5, -1)
    # Blend: lado izquierdo domina en x<w/2, derecho en x>=w/2
    blend = np.clip((x_g - w * 0.5) / (w * 0.3) + 0.5, 0, 1)   # 0→1 de izq a der
    mx = np.clip(mx_l * (1 - blend) + mx_r * blend, 0, w - 1).astype(np.float32)
    my = np.clip(my_l * (1 - blend) + my_r * blend, 0, h - 1).astype(np.float32)
    return cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


VORTEX_FUNCS = {1: vortex, 2: vortex_anti, 3: vortex_pulse,
                4: vortex_exp, 5: vortex_dual}
VORTEX_NAMES = {0: 'OFF', 1: 'SWRL', 2: 'ANTI', 3: 'PULS', 4: 'EXP', 5: 'DUAL'}


def spiral(frame, t, tick):
    """Espiral — desenrollado logarítmico pulsante con respiración orgánica."""
    h, w = frame.shape[:2]
    cx, cy = w / 2.0, h / 2.0
    y_g, x_g = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = x_g - cx;  dy = y_g - cy
    r     = np.sqrt(dx**2 + dy**2) + 0.001
    angle = np.arctan2(dy, dx)
    # Espiral logarítmica: twist proporcional a log(r)
    phase = np.sin(tick * 0.018) * 0.5 + 0.5   # 0→1 oscilando
    twist = t * 3.8 * np.log1p(r * 0.025) * (phase * 1.4 + 0.3)
    # Respiración radial — ondulación concéntrica
    breathe = 1.0 + t * 0.18 * np.sin(tick * 0.035 + r * 0.018)
    new_a = angle + twist
    new_r = np.maximum(0.0, r * breathe)
    mx = np.clip(cx + new_r * np.cos(new_a), 0, w - 1).astype(np.float32)
    my = np.clip(cy + new_r * np.sin(new_a), 0, h - 1).astype(np.float32)
    return cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


ASCII_CHARS = " .'`-_:,;!|/()?1iltfr*<>+=oxzXYUJCQ0OZmwqbdkh#%@"


def ascii_mode(frame, t):
    h, w = frame.shape[:2]
    cell = max(6, int(14 - t * 8))
    result = np.zeros_like(frame)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    for y in range(0, h - cell, cell):
        for x in range(0, w - cell, cell):
            lum = gray[y + cell // 2, x + cell // 2] / 255.0
            idx = int(lum * (len(ASCII_CHARS) - 1))
            b, g, r = frame[y + cell // 2, x + cell // 2]
            cv2.putText(result, ASCII_CHARS[idx], (x, y + cell),
                        cv2.FONT_HERSHEY_SIMPLEX, cell / 18.0,
                        (int(b), int(g), int(r)), 1, cv2.LINE_AA)
    return result
