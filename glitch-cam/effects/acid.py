import cv2
import numpy as np


_xor_buf    = None   # buffer feedback para xor_feedback
_prop_bufs  = None   # 4 buffers de zona para xor_propagate
_rgb_r_buf  = None   # canal R retrasado para frame_blend_rgb
_rgb_g_buf  = None
_rgb_b_buf  = None
_liquid_buf = None   # buffer acumulador para hyper_liquid_acid


def xor_feedback(frame, t):
    """
    XOR multi-escala + feedback loop — EL efecto ácido de AcidCam.
    Frame actual XOR contra sí mismo a 1/2, 1/4, 1/8 escala + buffer acumulado.
    A cada iteración el buffer se alimenta del resultado → patrones que evolucionan.
    """
    global _xor_buf
    h, w = frame.shape[:2]

    # Versiones del frame a distintas escalas (baja + sube → pixelado blocky)
    s2  = cv2.resize(cv2.resize(frame, (w // 2,        h // 2)),       (w, h), interpolation=cv2.INTER_NEAREST)
    s4  = cv2.resize(cv2.resize(frame, (w // 4,        h // 4)),       (w, h), interpolation=cv2.INTER_NEAREST)
    s8  = cv2.resize(cv2.resize(frame, (max(1, w // 8), max(1, h // 8)), ), (w, h), interpolation=cv2.INTER_NEAREST)

    # XOR en cascada: cada escala adiciona una capa de patrón
    xored = frame ^ s2 ^ s4 ^ s8
    if t > 0.55:
        s16 = cv2.resize(cv2.resize(frame, (max(1, w//16), max(1, h//16))), (w, h), interpolation=cv2.INTER_NEAREST)
        xored = xored ^ s16

    if _xor_buf is None:
        _xor_buf = xored.copy()
        return xored

    # Feedback: XOR el resultado con el buffer acumulado → el patrón se auto-alimenta
    mask = np.uint8(min(255, int(t * 220 + 35)))
    result = xored ^ (_xor_buf & mask)

    # El buffer decae lentamente para que los patrones persistan y muten
    decay  = 0.72 + t * 0.22
    _xor_buf = (
        _xor_buf.astype(np.float32) * decay
        + result.astype(np.float32) * (1.0 - decay)
    ).clip(0, 255).astype(np.uint8)

    return result


def frame_blend_rgb(frame, t):
    """
    FrameBlendRGB — cada canal del output viene de un instante distinto en el tiempo.
    R = más fresco  |  G = medio  |  B = más viejo
    La separación temporal crea arcoíris de fantasmas, el look de las capturas de AcidCam.
    """
    global _rgb_r_buf, _rgb_g_buf, _rgb_b_buf
    b, g, r = [c.astype(np.float32) for c in cv2.split(frame)]

    if _rgb_r_buf is None:
        _rgb_r_buf = r.copy()
        _rgb_g_buf = g.copy()
        _rgb_b_buf = b.copy()
        return frame

    # Cada buffer acumula su canal a velocidad distinta
    dr = 0.35 + t * 0.40   # R: decay rápido  → imagen casi actual
    dg = 0.62 + t * 0.30   # G: decay medio
    db = 0.84 + t * 0.13   # B: decay lento   → trail más largo

    _rgb_r_buf = _rgb_r_buf * dr + r * (1.0 - dr)
    _rgb_g_buf = _rgb_g_buf * dg + g * (1.0 - dg)
    _rgb_b_buf = _rgb_b_buf * db + b * (1.0 - db)

    # Cruce de canales: cada canal output mezcla su presente con el pasado de otro canal
    # Esto es lo que genera los colores ácidos (un canal desfasado contamina a los demás)
    out_r = np.clip(r * 0.35 + _rgb_b_buf * 0.65, 0, 255)   # R con cola de B
    out_g = np.clip(g * 0.25 + _rgb_r_buf * 0.75, 0, 255)   # G con cola de R
    out_b = np.clip(b * 0.15 + _rgb_g_buf * 0.85, 0, 255)   # B con cola de G (más larga)

    return cv2.merge([
        out_b.astype(np.uint8),
        out_g.astype(np.uint8),
        out_r.astype(np.uint8),
    ])


def hyper_liquid_acid(frame, t, tick):
    """
    Hyper Liquid Acid Saturation — 3 fases en cadena:

    FASE 1 — Oversaturación no-lineal por luminancia
      Sombras → hue deriva a cyan/magenta con boost de saturación extremo.
      Luces   → hue deriva a amarillo, menos boost.
      El shift oscila con tick → la paleta muta sola frame a frame.

    FASE 2 — Liquid displacement guiado por el propio color
      B desplaza X, R desplaza Y, G escala la amplitud.
      Zonas del mismo color fluyen juntas como aceite en agua.

    FASE 3 — Color bleeding + feedback suave
      Cada canal se difumina con sigma distinto (R sangra más que B).
      El resultado se mezcla con un buffer acumulado → la 'mancha' persiste.
    """
    global _liquid_buf
    h, w = frame.shape[:2]

    # ── FASE 1: Oversaturación no-lineal ─────────────────────────────────────
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.float32)
    lum = hsv[:, :, 2] / 255.0                         # 0→1

    # Hue shift agresivo: rota toda la paleta + oscilación local por luminancia
    hue_drift = t * 160.0 * np.sin(lum * np.pi + tick * 0.022)
    hue_drift += tick * t * 0.8   # rotación global continua
    hsv[:, :, 0] = (hsv[:, :, 0] + hue_drift) % 180

    # Saturación: doble pasada — boost global + boost extra en sombras
    # Primera pasada: satura todo
    sat1 = hsv[:, :, 1] * (2.5 + t * 5.0)
    # Segunda pasada: las sombras reciben boost adicional
    shadow_boost = (1.0 - lum) * t * 180.0
    hsv[:, :, 1] = np.clip(sat1 + shadow_boost, 0, 255)

    # Value: medios tonos explotan, sombras suben también
    val_boost = 1.0 + t * 0.8 * np.sin(lum * np.pi) + t * 0.3 * (1.0 - lum)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * val_boost, 0, 255)

    saturated = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    # Segunda pasada de saturación directa en BGR — fuerza colores imposibles
    # Amplifica cada canal lejos de gris (128) → neones más puros
    sat2 = saturated.astype(np.float32)
    sat2 = (sat2 - 128.0) * (1.5 + t * 2.5) + 128.0
    saturated = np.clip(sat2, 0, 255).astype(np.uint8)

    # ── FASE 2: Liquid displacement guiado por color ──────────────────────────
    bf, gf, rf = [c.astype(np.float32) for c in cv2.split(saturated)]
    y_g, x_g  = np.mgrid[0:h, 0:w].astype(np.float32)

    amp = t * 22.0 + 5.0
    # Fase por canal: cada pixel se mueve según su propio valor de color
    phase_x = np.sin(tick * 0.025 + bf * (np.pi / 128.0))
    phase_y = np.cos(tick * 0.019 + rf * (np.pi / 128.0))
    scale   = 0.4 + gf / 255.0 * 0.9              # G escala la amplitud local

    map_x = np.clip(x_g + phase_x * amp * scale,       0, w - 1).astype(np.float32)
    map_y = np.clip(y_g + phase_y * amp * scale * 0.6, 0, h - 1).astype(np.float32)

    liquid = cv2.remap(saturated, map_x, map_y, cv2.INTER_LINEAR,
                       borderMode=cv2.BORDER_REFLECT)

    # ── FASE 3: Color bleeding + feedback ────────────────────────────────────
    # Cada canal se difumina con sigma distinto → bordes "sangran" de forma asimétrica
    sig_b = 2.5 + t * 5.0
    sig_g = 1.8 + t * 3.5
    sig_r = 3.5 + t * 7.0    # R sangra más
    bl_b = cv2.GaussianBlur(liquid[:, :, 0], (0, 0), sig_b)
    bl_g = cv2.GaussianBlur(liquid[:, :, 1], (0, 0), sig_g)
    bl_r = cv2.GaussianBlur(liquid[:, :, 2], (0, 0), sig_r)

    bleed_strength = 0.45 + t * 0.45
    bled = np.stack([
        np.clip(bl_b * (1 + t * 0.7) - liquid[:, :, 0] * t * 0.25, 0, 255),
        np.clip(bl_g * (1 + t * 0.4) - liquid[:, :, 1] * t * 0.15, 0, 255),
        np.clip(bl_r * (1 + t * 0.9) - liquid[:, :, 2] * t * 0.35, 0, 255),
    ], axis=2).astype(np.uint8)

    result = cv2.addWeighted(liquid, 1.0 - bleed_strength, bled, bleed_strength, 0)

    # Feedback suave: el resultado se mezcla con iteraciones previas
    # → la mancha de color "persiste" como en una pantalla quemada
    if _liquid_buf is None or _liquid_buf.shape != result.shape:
        _liquid_buf = result.astype(np.float32)
        return result

    decay = 0.65 + t * 0.28
    _liquid_buf = (_liquid_buf * decay + result.astype(np.float32) * (1.0 - decay)).clip(0, 255)
    return cv2.addWeighted(result, 0.6, _liquid_buf.astype(np.uint8), 0.4, 0)


# ─── XOR VARIANTS (shaders AcidCam GL) ───────────────────────────────────────

def xor_increase(frame, t, tick):
    """INCR — color × scale_animado × 6.0, XOR con original.
    (xor_increase.glsl: color = color * inc_valuex/255*2 * 6; XOR)
    El scale oscila → la amplitud del XOR sube y baja creando pulsaciones.
    """
    scale = float(np.mod(tick * t * 0.025, 2.0)) * 2.0 + 0.1   # 0.1 → 4.1
    mod = np.clip(frame.astype(np.float32) * scale * 6.0, 0, 255).astype(np.uint8)
    return frame ^ mod


def xor_pos(frame, t, tick):
    """POS — peso por posición X/Y del píxel × valor animado, XOR con original.
    (xor_positional_offset.glsl: color=(color+a)*vec4(pos+alpha,1,1)*0.08; XOR)
    R se modula por X, G por Y — el patrón XOR varía según dónde está el píxel.
    """
    h, w = frame.shape[:2]
    iv = float(np.mod(tick * t * 0.03, 6.0))
    xs = np.linspace(0, 1, w, dtype=np.float32).reshape(1, w) * iv / 6.0
    ys = np.linspace(0, 1, h, dtype=np.float32).reshape(h, 1) * iv / 6.0
    f = frame.astype(np.float32) / 255.0
    mod = np.empty_like(f)
    mod[:, :, 2] = (f[:, :, 2] + 0.2) * (xs + t) * 0.08   # R × posición X
    mod[:, :, 1] = (f[:, :, 1] + 0.5) * (ys + t) * 0.08   # G × posición Y
    mod[:, :, 0] = (f[:, :, 0] + 0.8) * 0.08               # B uniforme
    return frame ^ np.clip(mod * 255, 0, 255).astype(np.uint8)


def xor_sheet1(frame, t, tick):
    """SHT1 — grid 32px modula G y B con multi-escala × 2/× 4, XOR consigo mismo.
    (xorsheet.glsl: d=fract(fragCoord/32), G=(G+col1.G)*d, B=(B+col2.B)*d; color_blend)
    Restaura píxeles casi-negros desde el original — el grid late.
    """
    h, w = frame.shape[:2]
    ys_g = np.arange(h, dtype=np.float32).reshape(h, 1)
    xs_g = np.arange(w, dtype=np.float32).reshape(1, w)
    d = np.mod(xs_g / 32.0, 1.0) + np.mod(ys_g / 32.0, 1.0)   # (h, w)
    # Multi-escala
    ys2 = np.minimum(np.arange(h, dtype=np.intp) // 2, h - 1)
    xs2 = np.minimum(np.arange(w, dtype=np.intp) // 2, w - 1)
    ys4 = np.minimum(np.arange(h, dtype=np.intp) // 4, h - 1)
    xs4 = np.minimum(np.arange(w, dtype=np.intp) // 4, w - 1)
    col1 = frame[np.ix_(ys2, xs2)].astype(np.float32) / 255.0
    col2 = frame[np.ix_(ys4, xs4)].astype(np.float32) / 255.0
    f = frame.astype(np.float32) / 255.0
    f2 = f.copy()
    f2[:, :, 1] = (f[:, :, 1] + col1[:, :, 1]) * d   # G
    f2[:, :, 0] = (f[:, :, 0] + col2[:, :, 0]) * d   # B
    src_u8    = np.clip(f2 * 255, 0, 255).astype(np.uint8)
    scaled_u8 = np.clip(f2 * t * 255, 0, 255).astype(np.uint8)
    result = src_u8 ^ scaled_u8
    # Restaurar píxeles casi-negros (color_blend: if color < 0.2 → original)
    mask = result < 51
    result[mask] = src_u8[mask]
    return result


def xor_sheet2(frame, t, tick):
    """SHT2 — grid 64px: color *= (1 + fract(x/64) + fract(y/64)), XOR original.
    (xorsheet_2.glsl: val=fract(fragCoord/64), color[i]+=color[i]*(val.x+val.y); XOR)
    El patrón de tiles se quema en el XOR — más sutil que SHT1 pero más global.
    """
    h, w = frame.shape[:2]
    val_x = np.mod(np.arange(w, dtype=np.float32).reshape(1, w) / 64.0, 1.0)
    val_y = np.mod(np.arange(h, dtype=np.float32).reshape(h, 1) / 64.0, 1.0)
    scale = 1.0 + (val_x + val_y) * (1.0 + t * 3.0)   # (h, w)
    mod = np.clip(
        frame.astype(np.float32) * scale[:, :, np.newaxis], 0, 255
    ).astype(np.uint8)
    return frame ^ mod


def xor_strobe(frame, t, tick):
    """STRB — escalado cuadrático por canal (color × alpha²), XOR con original.
    (xorstrobe.glsl: colorval=source*alpha/255, color=colorval*alpha; XOR)
    Cada canal tiene su propio alpha oscilante → strobing asíncrono R/G/B.
    """
    ar = float(0.3 + t * 0.7 + np.sin(tick * 0.05) * t * 0.3)
    ag = float(0.5 + t * 0.5 + np.sin(tick * 0.07 + 1.0) * t * 0.3)
    ab = float(0.2 + t * 0.8 + np.sin(tick * 0.03 + 2.0) * t * 0.3)
    f = frame.astype(np.float32)
    mod = np.empty_like(f)
    mod[:, :, 2] = f[:, :, 2] * ar * ar / 255.0   # R: alpha²
    mod[:, :, 1] = f[:, :, 1] * ag * ag / 255.0   # G: alpha²
    mod[:, :, 0] = f[:, :, 0] * ab * ab / 255.0   # B: alpha²
    return frame ^ np.clip(mod, 0, 255).astype(np.uint8)


def xor_propagate(frame, t, tick):
    """PROP — 4 zonas en anillo, cada una con XOR distinto que se alimentan entre sí.
    La salida de la zona i se XORea con el buffer de la zona i+1 → propagación circular.
    Los modos rotan lentamente → el patrón migra y muta entre zonas.
    Anillo: TL → TR → BR → BL → TL
    """
    global _prop_bufs
    h, w = frame.shape[:2]
    hh, hw = h // 2, w // 2

    # Zonas en orden de anillo (no Z-order, sino circular)
    zones = [
        (slice(0, hh),  slice(0, hw)),   # 0: TL
        (slice(0, hh),  slice(hw, w)),   # 1: TR
        (slice(hh, h),  slice(hw, w)),   # 2: BR
        (slice(hh, h),  slice(0, hw)),   # 3: BL
    ]

    if _prop_bufs is None:
        _prop_bufs = [frame[sl].copy() for sl in zones]

    # Rotación de modos: cada zona usa un XOR distinto, y rotan con el tiempo
    # A más intensidad, la rotación es más rápida
    period   = max(15, int(70 * (1.0 - t)))
    base     = (tick // period) % 5
    fn_pool  = [xor_increase, xor_pos, xor_sheet1, xor_sheet2, xor_strobe]
    zone_fns = [fn_pool[(base + i) % 5] for i in range(4)]

    result     = frame.copy()
    new_bufs   = []
    decay      = 0.68 + t * 0.24                          # cuánto persiste cada zona
    blend_mask = np.uint8(min(255, int(t * 200 + 40)))    # fuerza de la propagación

    for i, sl in enumerate(zones):
        zf    = frame[sl].copy()
        xored = zone_fns[i](zf, t, tick)                  # XOR propio de esta zona

        # Propagar: XOR con el buffer de la zona anterior del anillo
        pb = _prop_bufs[(i - 1) % 4]
        if pb.shape == xored.shape:
            xored = xored ^ (pb & blend_mask)

        result[sl] = xored

        # Actualizar buffer con decay suave → la zona "recuerda" su historia
        new_bufs.append(
            (_prop_bufs[i].astype(np.float32) * decay
             + xored.astype(np.float32) * (1.0 - decay)
             ).clip(0, 255).astype(np.uint8)
        )

    _prop_bufs = new_bufs
    return result


XOR_FUNCS = {
    1: xor_feedback,
    2: xor_increase,
    3: xor_pos,
    4: xor_sheet1,
    5: xor_sheet2,
    6: xor_strobe,
    7: xor_propagate,
}
XOR_NAMES = {
    0: 'OFF',  1: 'FDBK', 2: 'INCR', 3: 'POS',
    4: 'SHT1', 5: 'SHT2', 6: 'STRB', 7: 'PROP',
}
