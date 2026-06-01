"""
EMUL — OVERLAY ACID-OS.

Chrome de escritorio fake psycho-anarco-punk encima del frame: ventanas Win95
mutantes, símbolo anarquía, slogans glitch y taskbar 666. Se dibuja al final del
pipeline (como el HUD). El layout es estable entre frames y muta cada ~200 ticks
para que no tiemble. Texto/rect vía cv2, paleta acid.

Modos:  SLIM = taskbar + slogans + Ⓐ   ·   FULL = + ventanas flotantes
"""
import cv2
import numpy as np

from effects.palette import GREEN, CRIMSON, MAGENTA

WHITE = (225, 225, 225)
DARK  = (18, 6, 12)
FONT  = cv2.FONT_HERSHEY_SIMPLEX

_TITLES = ['ACID EMULATOR v0.666', 'MIND.EXE', 'SYSTEM.HACK', 'REALITY.SH',
           'ANARCHY.OS', 'NUKE.EXE', 'BRAIN_DUMP', 'DEAD_INSIDE.AVI',
           'KILL_COP.SCR', 'NO_FUTURE.BAT']
_BODIES = [
    ['> hack the planet', '> smash the system', '> no gods no masters', '> only chaos'],
    ['REALITY NOT FOUND', 'WOULD YOU LIKE TO', 'DISCONNECT?  [YES] [no]'],
    ['DELETING..', 'SOCIETY'],
    ['uploading conscious..', 'do not resist'],
    ['ERROR: reality not', 'what it seems', 'there is no escape', 'only deeper'],
    ['WAKE UP', 'BREAK CODE', 'LIVE ANARCHY'],
]
_SLOGANS = ['WAKE UP', 'NO GODS', 'NO MASTERS', 'REALITY.SH', 'DESTROY EVERYTHING',
            'KILL YOUR IDOLS', 'YOU ARE THE DREAM', 'NO FUTURE', 'OBEY / CONSUME / DIE']

_layout = {}   # cache: {'key': (w,h,epoch), 'windows': [...], 'slogans': [...]}


def _build_layout(w, h, epoch):
    rng = np.random.default_rng(epoch * 7919 + w * 13 + h)
    n = 4
    t_idx = rng.choice(len(_TITLES), n, replace=False)
    windows = []
    for ti in t_idx:
        ww = int(w * rng.uniform(0.24, 0.36))
        wh = int(h * rng.uniform(0.20, 0.32))
        wx = int(rng.uniform(0, max(1, w - ww)))
        wy = int(rng.uniform(40, max(41, h - wh - 40)))
        body = _BODIES[int(rng.integers(0, len(_BODIES)))]
        progress = bool(rng.random() < 0.5)
        windows.append({'title': _TITLES[ti], 'rect': (wx, wy, ww, wh),
                        'body': body, 'progress': progress})
    s_idx = rng.choice(len(_SLOGANS), 3, replace=False)
    slogans = []
    for si in s_idx:
        sx = int(rng.uniform(0.05, 0.7) * w)
        sy = int(rng.uniform(0.15, 0.85) * h)
        scl = rng.uniform(0.6, 1.1)
        slogans.append((_SLOGANS[si], sx, sy, scl))
    return {'windows': windows, 'slogans': slogans}


def _ensure_layout(w, h, tick):
    epoch = int(tick) // 200
    key = (w, h, epoch)
    if _layout.get('key') != key:
        data = _build_layout(w, h, epoch)
        _layout['key'] = key
        _layout['windows'] = data['windows']
        _layout['slogans'] = data['slogans']
    return _layout['windows'], _layout['slogans']


def _glitch_text(frame, text, org, scale, color, tick, thick=1):
    """Texto con aberración cromática leve (crimson/green desfasados)."""
    x, y = org
    off = 1 + int((np.sin(tick * 0.2 + x * 0.05) * 0.5 + 0.5) * 2)
    cv2.putText(frame, text, (x - off, y), FONT, scale, CRIMSON, thick, cv2.LINE_AA)
    cv2.putText(frame, text, (x + off, y), FONT, scale, (255, 80, 0), thick, cv2.LINE_AA)
    cv2.putText(frame, text, (x, y),       FONT, scale, color,   thick, cv2.LINE_AA)


def _draw_window(frame, win, tick):
    h, w = frame.shape[:2]
    x, y, ww, wh = win['rect']
    x2, y2 = min(x + ww, w), min(y + wh, h)
    if x2 <= x or y2 <= y:
        return
    # fondo casi opaco
    sub = frame[y:y2, x:x2]
    dark = np.full_like(sub, DARK)
    frame[y:y2, x:x2] = cv2.addWeighted(sub, 0.20, dark, 0.80, 0)
    # borde verde tóxico
    cv2.rectangle(frame, (x, y), (x2 - 1, y2 - 1), GREEN, 1)
    # barra de título magenta
    tb = min(16, y2 - y)
    cv2.rectangle(frame, (x, y), (x2 - 1, y + tb), MAGENTA, -1)
    _glitch_text(frame, win['title'], (x + 4, y + tb - 4), 0.34, WHITE, tick)
    cv2.putText(frame, 'X', (x2 - 12, y + tb - 4), FONT, 0.34, WHITE, 1, cv2.LINE_AA)
    # cuerpo
    ly = y + tb + 16
    for line in win['body']:
        if ly > y2 - 6:
            break
        cv2.putText(frame, line, (x + 6, ly), FONT, 0.36, GREEN, 1, cv2.LINE_AA)
        ly += 16
    # barra de progreso animada
    if win['progress'] and ly < y2 - 10:
        pct = (np.sin(tick * 0.03) * 0.5 + 0.5) * 0.4 + 0.59   # 0.59..0.99
        bx2 = x + 6 + int((x2 - x - 12) * pct)
        cv2.rectangle(frame, (x + 6, ly), (x2 - 6, ly + 8), (40, 20, 40), -1)
        cv2.rectangle(frame, (x + 6, ly), (bx2, ly + 8), GREEN, -1)
        cv2.putText(frame, f'{int(pct * 100)}%', (x2 - 40, ly + 7),
                    FONT, 0.30, WHITE, 1, cv2.LINE_AA)


def _draw_anarchy(frame, cx, cy, r):
    cv2.circle(frame, (cx, cy), r, GREEN, 2, cv2.LINE_AA)
    cv2.putText(frame, 'A', (cx - int(r * 0.55), cy + int(r * 0.55)),
                FONT, r / 22.0, GREEN, 2, cv2.LINE_AA)


def _draw_taskbar(frame, tick):
    h, w = frame.shape[:2]
    bh = 22
    sub = frame[h - bh:h]
    cv2.rectangle(sub, (0, 0), (w, bh), DARK, -1)
    frame[h - bh:h] = cv2.addWeighted(frame[h - bh:h], 0.15, sub, 0.85, 0)
    cv2.rectangle(frame, (4, h - bh + 3), (70, h - 3), MAGENTA, -1)
    cv2.putText(frame, 'START', (10, h - 7), FONT, 0.36, WHITE, 1, cv2.LINE_AA)
    cv2.putText(frame, 'DEPROGRAMMED   |   I HATE EVERYONE.EXE',
                (84, h - 7), FONT, 0.36, GREEN, 1, cv2.LINE_AA)
    clock = '666:CHAOS' if (int(tick) // 15) % 2 else '666 CHAOS'
    cv2.putText(frame, clock, (w - 90, h - 7), FONT, 0.38, GREEN, 1, cv2.LINE_AA)


def draw_acid_os(frame, t, tick, mode):
    """mode: 1=SLIM (taskbar+slogans+Ⓐ)  ·  2=FULL (+ ventanas)."""
    h, w = frame.shape[:2]
    windows, slogans = _ensure_layout(w, h, tick)

    if mode >= 2:
        for win in windows:
            _draw_window(frame, win, tick)

    for text, sx, sy, scl in slogans:
        _glitch_text(frame, text, (sx, sy), scl, GREEN, tick, thick=2)

    _draw_anarchy(frame, w - 48, 60, 26)
    _draw_taskbar(frame, tick)
    return frame


EMUL_NAMES = {0: 'OFF', 1: 'SLIM', 2: 'FULL'}
