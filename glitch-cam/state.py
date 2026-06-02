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
color_cycle_mode   = 0  # COLR (tecla 8): 0=off 1=on. El BANCO elige sabor: A=FRC (forzado) B=SOFT (no forzado)
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
rev_mode      = 0  # REVENTUS: 0=off 1=swrl 2=acid 3=zoom 4=echo 5=drnk 6=balo 7=acdf 8=melt
mirror_mode   = 0  # MIRROR full-screen: 0=off 1=mir2 2=kl4 3=kl8 4=kl16
palt_mode     = 0  # PALT paleta acid: 0=off 1=GRN 2=512 3=MGTA 4=ACID 5=GHUL 6=PNK
dith_mode     = 0  # DITH dithering Bayer: 0=off 1=BW 2=GRN 3=CLR
melt_mode     = 0  # MELT derretimiento realidad: 0=off 1=DRIP 2=WAX 3=LIQD
emul_mode     = 0  # EMUL overlay acid-OS: 0=off 1=SLIM 2=FULL

# ─── BANCOS DE TECLAS (ROADMAP_EFECTOS_NUEVOS) ─────────────────────────────────
# ESPACIO alterna banco; las 5 teclas g/j/o/y/z enrutan según el banco activo.
# Cambiar de banco NO apaga efectos, solo cambia qué controlan las teclas.
bank          = 0  # 0=A  1=B   (futuro botón físico ESP32)
# Banco A:  g=feedback  j=slit  o=tunnel  y=kaleido  z=bloom
# Banco B:  g=vhs       j=stutter o=solar  y=edge     z=halftone
slit_mode     = 0  # SLIT-SCAN time-displacement: 0=off 1=ROWS 2=COLS 3=RADL 4=CHAOS
fb_mode       = 0  # FEEDBACK recursión: 0=off 1=ZOOM 2=ROTZ 3=DROST 4=ECHO
tunnel_mode   = 0  # TUNNEL polar: 0=off 1=TUNL 2=TWST 3=POLR
kaleido_mode  = 0  # KALEIDO simetría radial: 0=off 1=K4 2=K6 3=K8 4=MIRR
bloom_mode    = 0  # BLOOM glow: 0=off 1=GLOW 2=NEON 3=HALO
vhs_mode      = 0  # VHS decay analógico: 0=off 1=TRAK 2=CHRM 3=DROP 4=FULL
stutter_mode  = 0  # STUTTER+STROBE: 0=off 1=HOLD 2=RWND 3=ECHO 4=STRB 5=INVS
solar_mode    = 0  # SOLAR/THERMAL falso color: 0=off 1=SOLR 2=THRM 3=INVT
edge_mode     = 0  # EDGE rotoscopio: 0=off 1=NEON 2=CMIC 3=GHST
halftone_mode = 0  # HALFTONE imprenta: 0=off 1=DOT 2=CMYK 3=LINE

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
