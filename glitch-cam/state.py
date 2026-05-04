import argparse

# ─── ARGUMENTOS ───────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description='GLITCH.CAM | EsquizoAI')
parser.add_argument('--cam',       type=int,   default=0,    help='Índice de cámara (default 0)')
parser.add_argument('--video',     type=str,   default=None, help='Path a video file (mp4, avi, etc.)')
parser.add_argument('--width',     type=int,   default=1280, help='Ancho captura')
parser.add_argument('--height',    type=int,   default=720,  help='Alto captura')
parser.add_argument('--intensity', type=int,   default=50,   help='Intensidad inicial 0-100')
parser.add_argument('--win-width',  type=int,   default=None, help='Ancho ventana display (default: igual a captura)')
parser.add_argument('--win-height', type=int,   default=None, help='Alto ventana display (default: igual a captura)')
args = parser.parse_args()

# ─── ESTADO DE EFECTOS ────────────────────────────────────────────────────────
fx = {
    'rgb_split':     False,  # legacy — reemplazado por rgb_mode
    'displacement':  False,  # 2
    'scanlines':     False,  # 3
    'noise':         False,  # 5
    'glitch_blocks': False,  # 6
    'crt_warp':      False,  # 7
    'color_cycle':   False,  # 8
    'ascii':         False,  # 9
    'vortex':        False,  # legacy — reemplazado por vortex_mode
    'spiral':        False,  # legacy — reemplazado por spiral_mode
    'color_trails':  False,  # t
    'pixel_sort':    False,  # s
    'wave':          False,  # legacy — reemplazado por wave_mode
    'xor_feedback':  False,  # legacy — reemplazado por xor_mode
    'frame_blend':   False,  # a
}
rgb_mode           = 0  # 0=off  1=H  2=V  3=DIAG  4=TRI  5=CHAOS
vortex_mode        = 0  # 0=off  1=SWRL  2=ANTI  3=PULS  4=EXP  5=DUAL
color_acid_mode    = 0  # 0=off  1=BARS 2=INCR 3=TIME 4=XORT 5=TVAL 6=FADE 7=CRRP 8=SCAL
xor_mode           = 0  # 0=off  1=FDBK 2=INCR 3=POS 4=SHT1 5=SHT2 6=STRB 7=PROP
wave_mode          = 0  # 0=off  1=BIDI 2=RADL 3=SHCK 4=DIAG 5=TURB 6=ZIGA
spiral_mode        = 0  # 0=off  1=LOGR 2=TGHT 3=WAVE 4=INWD 5=MLTK
blnd_mode          = 0  # 0=off  1=BLND 2=DIFF 3=SCRN 4=MPLY
corrupt_mode       = 0  # 0=off  1=BLK  2=DSLV  3=ORG  4=ALL  5=PUR
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
