import cv2
import numpy as np

import state
from effects.base       import RGB_NAMES, VORTEX_NAMES, WAVE_NAMES
from effects.color_acid import COLOR_ACID_NAMES
from effects.acid       import XOR_NAMES
from effects.corrupt  import CORRUPT_NAMES
from effects.ghost    import MOSH_NAMES
from effects.reventus import REV_NAMES
from effects.mirror   import MIRROR_NAMES


LABELS = [('1', 'RGB'), ('2', 'DISP'), ('3', 'SCAN'), ('4', 'MOSH'),
          ('5', 'NOIS'), ('6', 'BLOK'), ('7', 'CRT'), ('8', 'COLR'),
          ('9', 'ASCI'), ('c', 'CRPT'), ('k', 'KACD'), ('v', 'VRTX'),
          ('0', 'SPRL'), ('t', 'TRAL'), ('s', 'SORT'), ('w', 'WAVE'),
          ('x', 'XORF'), ('a', 'FRGB'), ('l', 'LQID')]
FX_KEYS = ['rgb_split', 'displacement', 'scanlines', None,
           'noise', 'glitch_blocks', 'crt_warp', 'color_cycle', 'ascii', None,
           None, None, 'spiral', 'color_trails', 'pixel_sort', 'wave',
           None, 'frame_blend', None]

LIQUID_NAMES = {0: 'OFF', 1: 'LOW', 2: 'MED', 3: 'HI', 4: 'MAX'}
# intensidad real por nivel (independiente del t global)
LIQUID_LEVELS = {0: 0.0, 1: 0.25, 2: 0.50, 3: 0.75, 4: 1.0}


def draw_hud(frame, fps, t):
    h, w = frame.shape[:2]

    # Barra superior
    bar = frame[:28].copy()
    cv2.rectangle(bar, (0, 0), (w, 28), (8, 0, 4), -1)
    frame[:28] = cv2.addWeighted(bar, 0.75, frame[:28], 0.25, 0)

    cv2.putText(frame, 'ESQUIZOAI // GLITCH.CAM', (10, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 170), 1, cv2.LINE_AA)
    rev_color  = (0, 200, 255) if state.rev_mode    > 0 else (40, 30, 40)
    mirr_color = (255, 140, 0) if state.mirror_mode > 0 else (40, 30, 40)
    blnd_color = (0, 255, 170) if state.blnd_on          else (40, 30, 40)
    cv2.putText(frame, f'REV:{REV_NAMES[state.rev_mode]}',
                (w // 2 - 95, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.38, rev_color,  1, cv2.LINE_AA)
    cv2.putText(frame, f'M:{MIRROR_NAMES[state.mirror_mode]}',
                (w // 2 -  5, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.38, mirr_color, 1, cv2.LINE_AA)
    cv2.putText(frame, 'BLND',
                (w // 2 + 60, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.38, blnd_color, 1, cv2.LINE_AA)
    spd = state.SPEED_LEVELS[state.speed_idx]
    spd_str = f'{spd:g}x'
    spd_color = (0, 255, 170) if spd != 1.0 else (40, 30, 40)
    cv2.putText(frame, spd_str, (w - 200, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.40, spd_color, 1, cv2.LINE_AA)
    target_fps = state.FPS_LEVELS[state.fps_idx]
    cv2.putText(frame, f'{target_fps}fps / {fps}', (w - 140, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 50, 255), 1, cv2.LINE_AA)

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
        else:          label = name
        cv2.putText(frame, f'[{k}]', (x, h - 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.28, color, 1)
        cv2.putText(frame, label, (x, h - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.32, color, 1)

    # Barra de intensidad
    bar_w = 100
    bx = w // 2 - bar_w // 2
    cv2.putText(frame, f'INT:{int(t * 100)}%', (bx - 55, h - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.30, (0, 255, 170), 1)
    cv2.rectangle(frame, (bx, h - 18), (bx + bar_w, h - 13), (40, 20, 40), -1)
    cv2.rectangle(frame, (bx, h - 18), (bx + int(bar_w * t), h - 13), (0, 255, 170), -1)

    return frame
