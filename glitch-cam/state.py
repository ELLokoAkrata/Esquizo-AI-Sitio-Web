import argparse

# ─── ARGUMENTOS ───────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description='GLITCH.CAM | EsquizoAI')
parser.add_argument('--cam',       type=int,   default=0,    help='Índice de cámara (default 0)')
parser.add_argument('--video',     type=str,   default=None, help='Path a video file (mp4, avi, etc.)')
parser.add_argument('--width',     type=int,   default=1280, help='Ancho captura')
parser.add_argument('--height',    type=int,   default=720,  help='Alto captura')
parser.add_argument('--intensity', type=int,   default=50,   help='Intensidad inicial 0-100')
args = parser.parse_args()

# ─── ESTADO DE EFECTOS ────────────────────────────────────────────────────────
fx = {
    'rgb_split':     False,  # 1
    'displacement':  False,  # 2
    'scanlines':     False,  # 3
    'noise':         False,  # 5
    'glitch_blocks': False,  # 6
    'crt_warp':      False,  # 7
    'color_cycle':   False,  # 8
    'ascii':         False,  # 9
    'vortex':        False,  # v
    'spiral':        False,  # 0
    'color_trails':  False,  # t
    'pixel_sort':    False,  # s
    'wave':          False,  # w
    'xor_feedback':  False,  # x
    'frame_blend':   False,  # a
}
corrupt_mode       = 0  # 0=off  1=bloques  2=orgánico  3=completo  4=puro
datamosh_mode      = 0  # 0=off  1=ghst  2=soul  3=frac
hyper_liquid_mode  = 0  # 0=off  1=LOW  2=MED  3=HI  4=MAX
blnd_on       = False  # trail base — combina con cualquier modo del 4
rev_mode      = 0  # REVENTUS: 0=off 1=swrl 2=acid 3=zoom 4=echo 5=drnk 6=balo
mirror_mode   = 0  # MIRROR full-screen: 0=off 1=mir2 2=kl4 3=kl8 4=kl16

# ─── ESTADO GENERAL ───────────────────────────────────────────────────────────
intensity  = args.intensity / 100.0
hud_on     = True
clean_mode = False   # Tab — oculta TODO el HUD (tecla secreta para OBS)
fullscreen = False
prev_frame = None

# ─── FPS TARGET ───────────────────────────────────────────────────────────────
FPS_LEVELS  = [12, 24, 30, 60]
fps_idx     = 2        # default: 30fps

# ─── SPEED ────────────────────────────────────────────────────────────────────
SPEED_LEVELS = [0.1, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0]
speed_idx    = 3       # default: 1.0x
