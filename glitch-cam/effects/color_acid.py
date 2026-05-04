"""
COLOR ACID — traducción de shaders AcidCam GL a numpy/OpenCV.

Fuentes: color_bars.glsl, color_increase.glsl, color_time.glsl,
         color_xor.glsl, color_timeval.glsl, color_shift_fade.glsl,
         color_corruption.glsl, color_scale.glsl
"""
import cv2
import numpy as np


def color_bars_acid(frame, t, tick):
    """BARS — gradiente horizontal por canal animado + XOR con original.
    (color_bars.glsl: color[i] += tc.x * timeval * alpha_i * 0.8; XOR)
    """
    h, w = frame.shape[:2]
    f = frame.astype(np.float32) / 255.0
    x = np.linspace(0, 1, w, dtype=np.float32)           # (w,) — tc.x
    tv = tick * 0.018 * t                                  # timeval efectivo
    # alpha per canal varia sinusoidalmente — diferente ritmo por canal
    ar = 0.4 + 0.6 * (np.sin(tick * 0.031) * 0.5 + 0.5)
    ag = 0.4 + 0.6 * (np.sin(tick * 0.047 + 2.09) * 0.5 + 0.5)
    ab = 0.4 + 0.6 * (np.sin(tick * 0.038 + 4.19) * 0.5 + 0.5)
    f2 = f.copy()
    f2[:, :, 2] += x * tv * ar * 0.8   # R
    f2[:, :, 1] += x * tv * ag * 0.8   # G
    f2[:, :, 0] += x * tv * ab * 0.8   # B
    mod = np.clip(f2 * 255, 0, 255).astype(np.uint8)
    return frame ^ mod                                      # XOR bit a bit


def color_increase_acid(frame, t, tick):
    """INCR — color = (color*0.5) + 0.5*fract(color*time_f).
    (color_increase.glsl) Posterización que evoluciona con el tiempo.
    """
    f = frame.astype(np.float32) / 255.0
    time_f = tick * t * 0.08 + 1.0
    out = f * 0.5 + 0.5 * np.mod(f * time_f, 1.0)
    return np.clip(out * 255, 0, 255).astype(np.uint8)


def color_time_acid(frame, t, tick):
    """TIME — cada canal: c[i] = 1.5 * c[i] * fract(alpha_i * timeval).
    (color_time.glsl) Strobing asíncrono por canal — R/G/B parpadean distintos.
    """
    f = frame.astype(np.float32) / 255.0
    tv = tick * 0.022
    ar = 0.3 + t * 0.8
    ag = 0.5 + t * 1.2
    ab = 0.2 + t * 0.6
    mr = float(np.mod(ar * tv, 1.0))
    mg = float(np.mod(ag * tv, 1.0))
    mb = float(np.mod(ab * tv, 1.0))
    out = np.empty_like(f)
    out[:, :, 2] = np.clip(1.5 * f[:, :, 2] * mr, 0, 1)  # R
    out[:, :, 1] = np.clip(1.5 * f[:, :, 1] * mg, 0, 1)  # G
    out[:, :, 0] = np.clip(1.5 * f[:, :, 0] * mb, 0, 1)  # B
    return (out * 255).astype(np.uint8)


def color_xor_acid(frame, t, tick):
    """XORT — fract(alpha*timeval) per canal + XOR con original.
    (color_xor.glsl) Como TIME pero en vez de clampear — XOR. Más brutal.
    """
    f = frame.astype(np.float32) / 255.0
    tv = tick * 0.022
    ar = 0.3 + t * 0.8
    ag = 0.5 + t * 1.2
    ab = 0.2 + t * 0.6
    mr = float(np.mod(ar * tv, 1.0))
    mg = float(np.mod(ag * tv, 1.0))
    mb = float(np.mod(ab * tv, 1.0))
    mod = np.empty_like(f)
    mod[:, :, 2] = f[:, :, 2] * mr
    mod[:, :, 1] = f[:, :, 1] * mg
    mod[:, :, 0] = f[:, :, 0] * mb
    mod_u8 = np.clip(mod * 255, 0, 255).astype(np.uint8)
    return frame ^ mod_u8


def color_timeval_acid(frame, t, tick):
    """TVAL — muestra el frame a escala ×1, ×2, ×4 y los cruza por canal + XOR.
    (color_timeval.glsl: col1=tc/2, col2=tc/4 → R×col1.R, G×col2.G → XOR)
    Cada canal ve una versión distinta del frame — caleidoscopio temporal.
    """
    h, w = frame.shape[:2]
    # Simular tc/2: pixel(r,c) muestreado en frame[r//2, c//2] → zoom ×2 del TL
    ys2 = np.minimum(np.arange(h, dtype=np.intp) // 2, h - 1)
    xs2 = np.minimum(np.arange(w, dtype=np.intp) // 2, w - 1)
    ys4 = np.minimum(np.arange(h, dtype=np.intp) // 4, h - 1)
    xs4 = np.minimum(np.arange(w, dtype=np.intp) // 4, w - 1)
    col1 = frame[np.ix_(ys2, xs2)].astype(np.float32) / 255.0   # zoom ×2
    col2 = frame[np.ix_(ys4, xs4)].astype(np.float32) / 255.0   # zoom ×4
    f    = frame.astype(np.float32) / 255.0
    tv   = float(np.mod(tick * t * 0.015, 2.0))                  # timeval acotado
    mod  = np.empty_like(f)
    mod[:, :, 2] = np.clip(f[:, :, 2] * col1[:, :, 2] * tv, 0, 1)  # R × col1.R
    mod[:, :, 1] = np.clip(f[:, :, 1] * col2[:, :, 1] * tv, 0, 1)  # G × col2.G
    mod[:, :, 0] = np.clip(f[:, :, 0] * col2[:, :, 0] * tv, 0, 1)  # B × col2.B
    return frame ^ (mod * 255).astype(np.uint8)


def color_shift_fade_acid(frame, t, tick):
    """FADE — gradiente espacial X/Y por canal × valor fract animado × 4.
    (color_shift_fade.glsl: v=fract(inc/k)*0.5, color1=v*vec4(1,st*fract(tv/a)*6,1))
    R: uniforme / G: gradiente horizontal / B: gradiente vertical.
    """
    h, w = frame.shape[:2]
    f = frame.astype(np.float32) / 255.0
    # Tres valores de incremento que evolucionan a distintas velocidades
    iv_x = tick * t * 0.7
    iv_y = tick * t * 1.3
    iv_z = tick * t * 0.5
    vr = float(np.mod(iv_x / 3.0, 1.0)) * 0.5
    vg = float(np.mod(iv_y / 9.0, 1.0)) * 0.25
    vb = float(np.mod(iv_z / 3.0, 1.0)) * 0.5
    tv_alpha = float(np.mod(tick * 0.012 / max(t, 0.01), 1.0)) * 6.0
    # st = coordenadas de pantalla 0..1
    st_x = np.linspace(0, 1, w, dtype=np.float32).reshape(1, w)
    st_y = np.linspace(0, 1, h, dtype=np.float32).reshape(h, 1)
    # color1: R=vr, G=vg*st.x*tv_alpha, B=vb*st.y*tv_alpha
    c1_r = vr
    c1_g = vg * st_x * tv_alpha
    c1_b = vb * st_y * tv_alpha
    out = np.empty_like(f)
    out[:, :, 2] = np.clip(f[:, :, 2] * c1_r * 4.0, 0, 1)
    out[:, :, 1] = np.clip(f[:, :, 1] * c1_g * 4.0, 0, 1)
    out[:, :, 0] = np.clip(f[:, :, 0] * c1_b * 4.0, 0, 1)
    return (out * 255).astype(np.uint8)


def color_corruption_acid(frame, t, tick):
    """CRRP — ruido per-pixel con balance R+/G-. (color_corruption.glsl)
    Diferente al NOIS base — afecta balance de color, no solo luminancia.
    """
    h, w = frame.shape[:2]
    f = frame.astype(np.float32) / 255.0
    # Ajuste de balance (R+10%, G-10%) antes del ruido
    adjusted = f * np.array([1.0, 0.9, 1.1], dtype=np.float32)
    # Ruido con seed dependiente de tick (pseudo-random reproducible)
    rng = np.random.default_rng(tick % 1000)
    noise = (t * 0.6) * (rng.random((h, w, 3), dtype=np.float32) - 0.5)
    out = np.clip(adjusted + noise, 0.0, 1.0)
    return (out * 255).astype(np.uint8)


def color_scale_acid(frame, t, tick):
    """SCAL — tone mapping no-lineal: píxeles sobre umbral se comprimen y remapean.
    (color_scale.glsl: if(c[i]*255 > 200) { c[i]/=3; c[i]*=pos1[i]; } c*=2)
    Crea inversiones de tono selectivas que varían con t.
    """
    f = frame.astype(np.float32) / 255.0
    pos1 = np.array([0.2, 0.4, 0.6], dtype=np.float32)   # B, G, R
    # Umbral dinámico controlado por intensidad
    threshold = 1.0 - t * 0.4   # 0.6 → 1.0 según t
    out = f.copy()
    for i in range(3):
        m = f[:, :, i] > threshold
        out[:, :, i][m] = (f[:, :, i][m] / 3.0) * pos1[i]
    out = np.clip(out * 2.0, 0, 1)
    return (out * 255).astype(np.uint8)


COLOR_ACID_FUNCS = {
    1: color_bars_acid,
    2: color_increase_acid,
    3: color_time_acid,
    4: color_xor_acid,
    5: color_timeval_acid,
    6: color_shift_fade_acid,
    7: color_corruption_acid,
    8: color_scale_acid,
}
COLOR_ACID_NAMES = {
    0: 'OFF',  1: 'BARS', 2: 'INCR', 3: 'TIME',
    4: 'XORT', 5: 'TVAL', 6: 'FADE', 7: 'CRRP', 8: 'SCAL',
}
