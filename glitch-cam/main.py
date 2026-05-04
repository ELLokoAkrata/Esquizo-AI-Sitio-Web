"""
GLITCH.CAM — EsquizoAI
Efectos glitch en tiempo real sobre webcam.
Uso: python main.py [--cam 0] [--width 1280] [--height 720] [--intensity 50]

Controles:
  1-9   toggle efectos
  v     toggle VÓRTICE
  0     toggle ESPIRAL
  c     cicla CORRUPT (OFF→BLK→ORG→ALL→PUR)
  4     cicla MOSH (OFF→GHST→SOUL→FRAC)
  b     toggle BLND
  Shift+F  cicla REVENTUS
  m     cicla MIRROR
  +/-   intensidad
  h     toggle HUD
  Tab   clean mode (oculta HUD para OBS)
  r     reset todo
  f     toggle fullscreen
  q     salir
"""

import cv2
import numpy as np
import time
import sys

import state
from effects.base    import (rgb_split, displacement, noise, color_cycle,
                              scanlines, glitch_blocks, crt_warp, ascii_mode,
                              vortex, spiral, color_trails, pixel_sort, wave,
                              RGB_FUNCS, VORTEX_FUNCS, WAVE_FUNCS,
                              SPIRAL_FUNCS, SPIRAL_NAMES)
import effects.base as base
from effects.corrupt import CORRUPT_MODES
from effects.acid       import xor_feedback, frame_blend_rgb, hyper_liquid_acid, XOR_FUNCS
import effects.acid as acid
from effects.color_acid import COLOR_ACID_FUNCS, COLOR_ACID_NAMES
from effects.ghost   import MOSH_FUNCS
import effects.ghost as ghost
from effects.reventus import REV_FUNCS, REV_USE_TICK
import effects.reventus as reventus
from effects.mirror  import MIRROR_FUNCS
from hud             import draw_hud, LIQUID_LEVELS


def main():
    print('GLITCH.CAM | EsquizoAI')

    is_video = state.args.video is not None
    if is_video:
        print(f'Abriendo video: {state.args.video}')
        cap = cv2.VideoCapture(state.args.video)
    else:
        print(f'Abriendo cámara {state.args.cam}...')
        cap = cv2.VideoCapture(state.args.cam, cv2.CAP_DSHOW)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH,  state.args.width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, state.args.height)
        cap.set(cv2.CAP_PROP_FPS, 60)

    if not cap.isOpened():
        src = state.args.video if is_video else f'cámara {state.args.cam}'
        print(f'ERROR: No se pudo abrir {src}')
        sys.exit(1)

    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    src_label = 'VIDEO' if is_video else 'CAM'
    print(f'{src_label}: {actual_w}x{actual_h}')
    print('Controles: 1-9 efectos | c corrupt | 4 mosh | b blnd | Shift+F reventus | m mirror | +/- intensidad | h HUD | Tab clean | r reset | f fullscreen | q salir')

    WIN = 'GLITCH.CAM | EsquizoAI — [q] salir'
    cv2.namedWindow(WIN, cv2.WINDOW_NORMAL)
    win_w = state.args.win_width  if state.args.win_width  else actual_w
    win_h = state.args.win_height if state.args.win_height else actual_h
    cv2.resizeWindow(WIN, win_w, win_h)

    # Face detection setup
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    face_small_w  = 320
    face_small_h  = int(actual_h * 320 / actual_w)
    face_scale_x  = actual_w / face_small_w
    face_scale_y  = actual_h / face_small_h
    last_face     = None
    face_det_tick = 0

    fps = 0
    fps_count   = 0
    fps_time    = time.time()
    tick        = 0
    held_frame  = None          # último frame procesado (frame-hold)
    last_proc   = 0.0           # timestamp del último procesamiento real
    tick_f      = 0.0           # tick acumulador float para speed variable

    while True:
        frame_start = time.time()
        ret, frame = cap.read()
        if not ret:
            if is_video:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)   # loop
                continue
            print('WARNING: frame perdido')
            continue

        # ─── FPS counter ─────────────────────────────────────────────────────
        fps_count += 1
        now = time.time()
        if now - fps_time >= 1.0:
            fps = fps_count
            fps_count = 0
            fps_time  = now

        target_dt = 1.0 / state.FPS_LEVELS[state.fps_idx]
        need_process = (now - last_proc) >= target_dt

        if not need_process and held_frame is not None:
            out = held_frame
        else:
            last_proc  = now
            tick_f    += state.SPEED_LEVELS[state.speed_idx]
            tick       = int(tick_f)
            t          = state.intensity
            active     = state.fx.copy()
            out        = frame.copy()

            # XOR / Acid primero
            if state.xor_mode > 0:
                out = XOR_FUNCS[state.xor_mode](out, t) if state.xor_mode == 1 \
                      else XOR_FUNCS[state.xor_mode](out, t, tick)
            if active['frame_blend']:
                out = frame_blend_rgb(out, t)
            if state.hyper_liquid_mode > 0:
                out = hyper_liquid_acid(out, LIQUID_LEVELS[state.hyper_liquid_mode], tick)

            if state.blnd_mode > 0 and state.prev_frame is not None:
                a = t * 0.82
                p = state.prev_frame
                if state.blnd_mode == 1:   # BLND — addWeighted clásico
                    out = cv2.addWeighted(out, 1 - a, p, a, 0)
                elif state.blnd_mode == 2: # DIFF — diferencia absoluta con prev
                    out = cv2.absdiff(out, p)
                elif state.blnd_mode == 3: # SCRN — screen: 1-(1-a)*(1-b)
                    f = out.astype(np.float32) / 255.0
                    fp = p.astype(np.float32) / 255.0
                    out = np.clip((1.0 - (1.0 - f) * (1.0 - fp * a)) * 255, 0, 255).astype(np.uint8)
                elif state.blnd_mode == 4: # MPLY — multiply: a*b/255
                    out = (out.astype(np.float32) * (p.astype(np.float32) * a / 255.0)).clip(0, 255).astype(np.uint8)
            if state.datamosh_mode > 0:
                out = MOSH_FUNCS[state.datamosh_mode](out, state.prev_frame, t, tick)
            if state.rgb_mode > 0:
                fn = RGB_FUNCS[state.rgb_mode]
                out = fn(out, t, tick) if state.rgb_mode == 5 else fn(out, t)
            if active['displacement']:
                out = displacement(out, t)
            if active['noise']:
                out = noise(out, t)
            if active['color_cycle']:
                out = color_cycle(out, t, tick)
            if state.corrupt_mode > 0:
                out = CORRUPT_MODES[state.corrupt_mode](out, t)
            if state.color_acid_mode > 0:
                out = COLOR_ACID_FUNCS[state.color_acid_mode](out, t, tick)

            state.prev_frame = out.copy()

            if active['ascii']:
                out = ascii_mode(out, t)
            else:
                if active['crt_warp']:
                    out = crt_warp(out, t, tick)
                if active['glitch_blocks']:
                    out = glitch_blocks(out, t)
                if active['scanlines']:
                    out = scanlines(out, t)

            if active['color_trails']:
                out = color_trails(out, t)
            if active['pixel_sort']:
                out = pixel_sort(out, t)
            if state.wave_mode > 0:
                out = WAVE_FUNCS[state.wave_mode](out, t, tick)
            if state.vortex_mode > 0:
                out = VORTEX_FUNCS[state.vortex_mode](out, t, tick)
            if state.spiral_mode > 0:
                out = SPIRAL_FUNCS[state.spiral_mode](out, t, tick)

            # ─── REVENTUS ─────────────────────────────────────────────────────
            if state.rev_mode > 0:
                face_det_tick += 1
                if face_det_tick >= 10:
                    face_det_tick = 0
                    small = cv2.resize(frame, (face_small_w, face_small_h))
                    gray  = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
                    faces = face_cascade.detectMultiScale(
                        gray, scaleFactor=1.1, minNeighbors=5, minSize=(25, 25))
                    if len(faces) > 0:
                        areas = [fw * fh for _, _, fw, fh in faces]
                        bx, by, bw, bh = faces[int(np.argmax(areas))]
                        bx = max(0, int(bx * face_scale_x))
                        by = max(0, int(by * face_scale_y))
                        bw = min(int(bw * face_scale_x), actual_w - bx)
                        bh = min(int(bh * face_scale_y), actual_h - by)
                        last_face = (bx, by, bw, bh)
                if last_face is not None:
                    fn = REV_FUNCS[state.rev_mode]
                    out = fn(out, last_face, t, tick) if state.rev_mode in REV_USE_TICK \
                          else fn(out, last_face, t)

            # ─── MIRROR FULL-SCREEN ───────────────────────────────────────────
            if state.mirror_mode > 0:
                out = MIRROR_FUNCS[state.mirror_mode](out)

            held_frame = out

        if state.hud_on and not state.clean_mode:
            out = draw_hud(out.copy(), fps, t)

        cv2.imshow(WIN, out)

        # ─── TECLADO + TIMING ─────────────────────────────────────────────────
        elapsed = time.time() - frame_start
        wait_ms = max(1, int((1.0 / 60 - elapsed) * 1000))  # display siempre a 60
        key_raw = cv2.waitKey(wait_ms)
        key     = key_raw & 0xFF

        if key == ord('q') or key == 27:
            break
        elif key == ord('1'): state.rgb_mode = (state.rgb_mode + 1) % 6
        elif key == ord('2'): state.fx['displacement']  = not state.fx['displacement']
        elif key == ord('3'): state.fx['scanlines']     = not state.fx['scanlines']
        elif key == ord('4'):
            state.datamosh_mode = (state.datamosh_mode + 1) % 4
            ghost._mosh_buf = None
            ghost._frac_buf = None
        elif key == ord('5'): state.fx['noise']         = not state.fx['noise']
        elif key == ord('6'): state.fx['glitch_blocks'] = not state.fx['glitch_blocks']
        elif key == ord('7'): state.fx['crt_warp']      = not state.fx['crt_warp']
        elif key == ord('8'): state.fx['color_cycle']   = not state.fx['color_cycle']
        elif key == ord('9'): state.fx['ascii']          = not state.fx['ascii']
        elif key == ord('v'): state.vortex_mode = (state.vortex_mode + 1) % 6
        elif key == ord('0'): state.spiral_mode = (state.spiral_mode + 1) % 6
        elif key == ord('t'): state.fx['color_trails']   = not state.fx['color_trails']
        elif key == ord('s'): state.fx['pixel_sort']     = not state.fx['pixel_sort']
        elif key == ord('w'): state.wave_mode = (state.wave_mode + 1) % 7
        elif key == ord('x'):
            state.xor_mode = (state.xor_mode + 1) % 8
            acid._xor_buf   = None
            acid._prop_bufs = None
        elif key == ord('a'): state.fx['frame_blend']   = not state.fx['frame_blend']
        elif key == ord('l'):
            state.hyper_liquid_mode = (state.hyper_liquid_mode + 1) % 5
            acid._liquid_buf = None   # reset buffer al cambiar nivel
        elif key == ord('c'): state.corrupt_mode = (state.corrupt_mode + 1) % 6
        elif key == ord('k'): state.color_acid_mode = (state.color_acid_mode + 1) % 9
        elif key == 9:        state.clean_mode = not state.clean_mode  # Tab
        elif key == ord('+'): state.intensity = min(1.0, state.intensity + 0.05)
        elif key == ord('-'): state.intensity = max(0.0, state.intensity - 0.05)
        elif key == ord('='): state.intensity = min(1.0, state.intensity + 0.05)
        elif key == ord('h'): state.hud_on = not state.hud_on
        elif key == ord('r'):
            state.fx = {k: False for k in state.fx}
            state.rgb_mode        = 0
            state.vortex_mode     = 0
            state.datamosh_mode   = 0
            state.color_acid_mode = 0
            state.xor_mode        = 0
            state.wave_mode       = 0
            acid._prop_bufs       = None
            state.blnd_mode  = 0
            state.spiral_mode = 0
            state.prev_frame = None
            ghost._mosh_buf = None
            ghost._frac_buf = None
            base._trail_r = None
            base._trail_g = None
            base._trail_b = None
            state.hyper_liquid_mode = 0
            acid._xor_buf    = None
            acid._rgb_r_buf  = None
            acid._rgb_g_buf  = None
            acid._rgb_b_buf  = None
            acid._liquid_buf = None
        elif key == ord('f'):
            state.fullscreen = not state.fullscreen
            prop = cv2.WINDOW_FULLSCREEN if state.fullscreen else cv2.WINDOW_NORMAL
            cv2.setWindowProperty(WIN, cv2.WND_PROP_FULLSCREEN, prop)
        elif key == ord('u'): state.fps_idx   = min(len(state.FPS_LEVELS)   - 1, state.fps_idx   + 1)
        elif key == ord('d'): state.fps_idx   = max(0, state.fps_idx   - 1)
        elif key == ord('.'): state.speed_idx = min(len(state.SPEED_LEVELS) - 1, state.speed_idx + 1)
        elif key == ord(','): state.speed_idx = max(0, state.speed_idx - 1)
        elif key == ord('b'): state.blnd_mode = (state.blnd_mode + 1) % 5
        elif key == ord('m'): state.mirror_mode = (state.mirror_mode + 1) % 5
        elif key == ord('F'):  # Shift+F — cicla REVENTUS
            state.rev_mode    = (state.rev_mode + 1) % 7
            last_face         = None
            reventus._rev_echo_buf = None

    cap.release()
    cv2.destroyAllWindows()
    print('GLITCH.CAM cerrado.')


if __name__ == '__main__':
    main()
