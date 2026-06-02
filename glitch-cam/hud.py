import cv2
import numpy as np

import state
from effects.base       import RGB_NAMES, VORTEX_NAMES, WAVE_NAMES, SPIRAL_NAMES
from effects.color_acid import COLOR_ACID_NAMES
from effects.acid       import XOR_NAMES
from effects.corrupt  import CORRUPT_NAMES
from effects.ghost    import MOSH_NAMES
from effects.reventus import REV_NAMES
from effects.mirror   import MIRROR_NAMES
from effects.palette  import PALT_NAMES
from effects.dither   import DITH_NAMES
from effects.melt     import MELT_NAMES
from effects.emul     import EMUL_NAMES
from effects.slitscan import SLIT_NAMES
from effects.feedback import FB_NAMES
from effects.tunnel   import TUNNEL_NAMES
from effects.kaleido  import KALEIDO_NAMES
from effects.bloom    import BLOOM_NAMES


LABELS = [('1', 'RGB'), ('2', 'DISP'), ('3', 'SCAN'), ('4', 'MOSH'),
          ('5', 'NOIS'), ('6', 'BLOK'), ('7', 'CRT'), ('8', 'COLR'),
          ('9', 'ASCI'), ('c', 'CRPT'), ('k', 'KACD'), ('v', 'VRTX'),
          ('0', 'SPRL'), ('t', 'TRAL'), ('s', 'SORT'), ('w', 'WAVE'),
          ('x', 'XORF'), ('a', 'FRGB'), ('l', 'LQID'),
          ('p', 'PALT'), ('i', 'DITH'), ('n', 'MELT'), ('e', 'EMUL')]
FX_KEYS = ['rgb_split', 'displacement', 'scanlines', None,
           'noise', 'glitch_blocks', 'crt_warp', 'color_cycle', 'ascii', None,
           None, None, 'spiral', 'color_trails', 'pixel_sort', 'wave',
           None, 'frame_blend', None,
           None, None, None, None]

# Mapeo de las 5 teclas de banco (g/j/o/y/z) por banco. Se muestran en la "tira de
# banco" del HUD, no en la barra inferior (a 640px no caben como celdas).
# Pendientes (sin implementar): mode=0, names=None → muestran su abreviatura dim.
def _bank_cells():
    if state.bank == 0:
        return [('g', state.fb_mode,     FB_NAMES,     'FBCK'),
                ('j', state.slit_mode,   SLIT_NAMES,   'SLIT'),
                ('o', state.tunnel_mode,  TUNNEL_NAMES,  'TUNL'),
                ('y', state.kaleido_mode, KALEIDO_NAMES, 'KALD'),
                ('z', state.bloom_mode,   BLOOM_NAMES,   'BLOM')]
    return [('g', 0, None, 'VHS'),
            ('j', 0, None, 'STUT'),
            ('o', 0, None, 'SOLR'),
            ('y', 0, None, 'EDGE'),
            ('z', 0, None, 'HALF')]

LIQUID_NAMES = {0: 'OFF', 1: 'LOW', 2: 'MED', 3: 'HI', 4: 'MAX'}
# intensidad real por nivel (independiente del t global)
LIQUID_LEVELS = {0: 0.0, 1: 0.25, 2: 0.50, 3: 0.75, 4: 1.0}


def draw_hud(frame, fps, t):
    h, w = frame.shape[:2]

    # Barra superior
    bar = frame[:28].copy()
    cv2.rectangle(bar, (0, 0), (w, 28), (8, 0, 4), -1)
    frame[:28] = cv2.addWeighted(bar, 0.75, frame[:28], 0.25, 0)

    cv2.putText(frame, 'ESQUIZOAI // GLITCH.CAM', (8, 17),
                cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 255, 170), 1, cv2.LINE_AA)
    rev_color  = (0, 200, 255) if state.rev_mode    > 0 else (40, 30, 40)
    mirr_color = (255, 140, 0) if state.mirror_mode > 0 else (40, 30, 40)
    BLND_NAMES = {0: 'OFF', 1: 'BLND', 2: 'DIFF', 3: 'SCRN', 4: 'MPLY', 5: 'ADDUP', 6: 'OFST'}
    blnd_color = (0, 255, 170) if state.blnd_mode > 0 else (40, 30, 40)
    cv2.putText(frame, f'REV:{REV_NAMES[state.rev_mode]}',
                (w // 2 - 118, 17), cv2.FONT_HERSHEY_SIMPLEX, 0.32, rev_color,  1, cv2.LINE_AA)
    cv2.putText(frame, f'M:{MIRROR_NAMES[state.mirror_mode]}',
                (w // 2 -  42, 17), cv2.FONT_HERSHEY_SIMPLEX, 0.32, mirr_color, 1, cv2.LINE_AA)
    cv2.putText(frame, f'B:{BLND_NAMES[state.blnd_mode]}',
                (w // 2 + 22, 17), cv2.FONT_HERSHEY_SIMPLEX, 0.32, blnd_color, 1, cv2.LINE_AA)
    # Banco activo (ESPACIO alterna) — A verde, B ámbar. En el hueco antes de spd/fps.
    bank_label = 'A' if state.bank == 0 else 'B'
    bank_color = (0, 255, 170) if state.bank == 0 else (0, 176, 255)
    cv2.putText(frame, f'BNK:{bank_label}', (w - 232, 17),
                cv2.FONT_HERSHEY_SIMPLEX, 0.34, bank_color, 1, cv2.LINE_AA)
    spd = state.SPEED_LEVELS[state.speed_idx]
    spd_str = f'{spd:g}x'
    spd_color = (0, 255, 170) if spd != 1.0 else (40, 30, 40)
    cv2.putText(frame, spd_str, (w - 162, 17),
                cv2.FONT_HERSHEY_SIMPLEX, 0.34, spd_color, 1, cv2.LINE_AA)
    target_fps = state.FPS_LEVELS[state.fps_idx]
    cv2.putText(frame, f'{target_fps}fps / {fps}', (w - 118, 17),
                cv2.FONT_HERSHEY_SIMPLEX, 0.34, (0, 50, 255), 1, cv2.LINE_AA)

    # Barra inferior
    bar_h = 26
    bottom_overlay = frame.copy()
    cv2.rectangle(bottom_overlay, (0, h - bar_h), (w, h), (8, 0, 4), -1)
    frame[h - bar_h:] = cv2.addWeighted(bottom_overlay[h - bar_h:], 0.75,
                                         frame[h - bar_h:], 0.25, 0)

    cell_w = w // len(LABELS)
    for i, (k, name) in enumerate(LABELS):
        x = i * cell_w + 4
        if k == '1':   is_active = state.rgb_mode > 0
        elif k == 'c': is_active = state.corrupt_mode > 0
        elif k == '4': is_active = state.datamosh_mode > 0
        elif k == 'l': is_active = state.hyper_liquid_mode > 0
        elif k == 'v': is_active = state.vortex_mode > 0
        elif k == 'k': is_active = state.color_acid_mode > 0
        elif k == 'x': is_active = state.xor_mode > 0
        elif k == 'w': is_active = state.wave_mode > 0
        elif k == '0': is_active = state.spiral_mode > 0
        elif k == 'b': is_active = state.blnd_mode > 0
        elif k == 'p': is_active = state.palt_mode > 0
        elif k == 'i': is_active = state.dith_mode > 0
        elif k == 'n': is_active = state.melt_mode > 0
        elif k == 'e': is_active = state.emul_mode > 0
        else:          is_active = state.fx.get(FX_KEYS[i], False) if i < len(FX_KEYS) and FX_KEYS[i] else False
        color    = (0, 255, 170) if is_active else (60, 30, 60)
        bg_color = (20, 50, 10) if is_active else (8, 0, 4)
        cv2.rectangle(frame, (i * cell_w, h - bar_h), ((i + 1) * cell_w - 1, h), bg_color, -1)
        if k == '1':   label = RGB_NAMES.get(state.rgb_mode, 'OFF')
        elif k == 'c': label = CORRUPT_NAMES.get(state.corrupt_mode, 'OFF')
        elif k == '4': label = MOSH_NAMES.get(state.datamosh_mode, 'OFF')
        elif k == 'l': label = LIQUID_NAMES.get(state.hyper_liquid_mode, 'OFF')
        elif k == 'v': label = VORTEX_NAMES.get(state.vortex_mode, 'OFF')
        elif k == 'k': label = COLOR_ACID_NAMES.get(state.color_acid_mode, 'OFF')
        elif k == 'x': label = XOR_NAMES.get(state.xor_mode, 'OFF')
        elif k == 'w': label = WAVE_NAMES.get(state.wave_mode, 'OFF')
        elif k == '0': label = SPIRAL_NAMES.get(state.spiral_mode, 'OFF')
        elif k == 'b': label = {0:'OFF',1:'BLND',2:'DIFF',3:'SCRN',4:'MPLY',5:'ADDUP',6:'OFST'}.get(state.blnd_mode, 'OFF')
        elif k == 'p': label = PALT_NAMES.get(state.palt_mode, 'OFF')
        elif k == 'i': label = DITH_NAMES.get(state.dith_mode, 'OFF')
        elif k == 'n': label = MELT_NAMES.get(state.melt_mode, 'OFF')
        elif k == 'e': label = EMUL_NAMES.get(state.emul_mode, 'OFF')
        else:          label = name
        cv2.putText(frame, f'[{k}]', (x, h - 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.28, color, 1)
        cv2.putText(frame, label, (x, h - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.32, color, 1)

    # ─── Tira de BANCO — las 5 teclas g/j/o/y/z del banco activo ──────────────
    by = h - bar_h - 23
    cv2.putText(frame, f'{bank_label}>', (8, by),
                cv2.FONT_HERSHEY_SIMPLEX, 0.40, bank_color, 1, cv2.LINE_AA)
    cx = 32
    for key, mode, names, abbr in _bank_cells():
        if mode > 0 and names is not None:
            txt = f'{key}:{names[mode]}';  col = (0, 255, 170)
        else:
            txt = f'{key}:{abbr}';         col = (95, 60, 95)
        cv2.putText(frame, txt, (cx, by), cv2.FONT_HERSHEY_SIMPLEX, 0.34, col, 1, cv2.LINE_AA)
        (tw, _), _ = cv2.getTextSize(txt, cv2.FONT_HERSHEY_SIMPLEX, 0.34, 1)
        cx += tw + 13

    # Barra de intensidad — encima de la barra inferior, para no tapar las celdas
    bar_w = 100
    bx = w // 2 - bar_w // 2
    iy = h - bar_h - 14
    cv2.putText(frame, f'INT:{int(t * 100)}%', (bx - 55, iy + 6),
                cv2.FONT_HERSHEY_SIMPLEX, 0.30, (0, 255, 170), 1)
    cv2.rectangle(frame, (bx, iy), (bx + bar_w, iy + 6), (40, 20, 40), -1)
    cv2.rectangle(frame, (bx, iy), (bx + int(bar_w * t), iy + 6), (0, 255, 170), -1)

    return frame
