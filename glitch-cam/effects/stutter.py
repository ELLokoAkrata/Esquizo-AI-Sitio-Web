"""
STUTTER + STROBE — TIEMPO ROTO + PARPADEO. (5 modos en una tecla)

HOLD/RWND/ECHO juegan con un ring-buffer de frames (tartamudeo, rebobinado,
bucle corto). STRB/INVS son parpadeo a ritmo. Opera el frame YA compuesto.

⚠️ FOTOSENSIBILIDAD: STRB e INVS parpadean fuerte. Documentar en README.

`t`: en HOLD = duración del congelado; en STRB/INVS = frecuencia del parpadeo.
"""
import numpy as np

_N      = 24
_buf    = None
_widx   = 0
_count  = 0
_shape  = None
_hold_frame = None
_hold_left  = 0
_rwnd_ptr   = 0


def reset():
    global _buf, _widx, _count, _shape, _hold_frame, _hold_left, _rwnd_ptr
    _buf = None; _widx = 0; _count = 0; _shape = None
    _hold_frame = None; _hold_left = 0; _rwnd_ptr = 0


def _push(frame):
    global _buf, _widx, _count, _shape
    h, w = frame.shape[:2]
    if _shape != (h, w):
        _buf = np.zeros((_N, h, w, 3), np.uint8); _widx = 0; _count = 0; _shape = (h, w)
    _buf[_widx] = frame
    _widx  = (_widx + 1) % _N
    _count = min(_count + 1, _N)


def _ago(k):
    k = int(min(k, _count - 1))
    return _buf[(_widx - 1 - k) % _N]


# ─── MODOS ─────────────────────────────────────────────────────────────────────
def stut_hold(frame, t, tick):
    """HOLD — congela un frame N ticks y lo repite (freeze glitch)."""
    global _hold_frame, _hold_left
    _push(frame)
    if _hold_left <= 0 or _hold_frame is None or _hold_frame.shape != frame.shape:
        _hold_frame = frame.copy()
        _hold_left  = int(2 + t * 16)
    _hold_left -= 1
    return _hold_frame


def stut_rwnd(frame, t, tick):
    """RWND — recorre el buffer hacia atrás (rebobinado roto en bucle)."""
    global _rwnd_ptr
    _push(frame)
    if _count < 2:
        return frame
    _rwnd_ptr = (_rwnd_ptr + 1) % _count
    return _ago(_rwnd_ptr)


def stut_echo(frame, t, tick):
    """ECHO — repite un bloque corto de frames en bucle."""
    _push(frame)
    if _count < 2:
        return frame
    block = max(2, int(3 + t * 14))
    return _ago(tick % block)


def stut_strobe(frame, t, tick):
    """STRB — flash a ritmo (fotosensible)."""
    period = max(2, int(10 - t * 8))
    if (tick // period) % 2 == 0:
        return frame
    flash = np.full_like(frame, 255)
    if t > 0.66:
        return flash                                  # flash blanco puro
    return (frame * 0.2 + flash * 0.8).astype(np.uint8)


def stut_invs(frame, t, tick):
    """INVS — inversión de color intermitente (fotosensible)."""
    period = max(2, int(12 - t * 9))
    if (tick // period) % 2 == 0:
        return frame
    return (255 - frame).astype(np.uint8)


STUTTER_FUNCS = {1: stut_hold, 2: stut_rwnd, 3: stut_echo, 4: stut_strobe, 5: stut_invs}
STUTTER_NAMES = {0: 'OFF', 1: 'HOLD', 2: 'RWND', 3: 'ECHO', 4: 'STRB', 5: 'INVS'}
