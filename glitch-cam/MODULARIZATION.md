# GLITCH.CAM — Guía de Modularización

> Documento para agentes/instancias futuras. Seguir en orden. No saltar pasos.

---

## Estado actual

- **Archivo monolítico:** `../glitch-cam.py` (754 líneas)
- **Backup:** `../glitch-cam.backup.py` (no tocar)
- **Directorio destino:** `glitch-cam/` (este directorio)

---

## Estructura objetivo

```
glitch-cam/
├── main.py               ← entrada, loop principal, teclado, HUD
├── state.py              ← todas las variables globales compartidas
├── effects/
│   ├── __init__.py
│   ├── base.py           ← rgb_split, displacement, noise, scanlines,
│   │                        glitch_blocks, crt_warp, color_cycle, ascii_mode
│   ├── corrupt.py        ← color_corrupt_blocks/organic/full/pure
│   │                        CORRUPT_MODES, CORRUPT_NAMES
│   ├── ghost.py          ← fx_ghst, fx_soul, fx_frac
│   │                        MOSH_NAMES, MOSH_FUNCS, _mosh_buf, _frac_buf
│   ├── reventus.py       ← _face_mask, _blend, _expand_bbox,
│   │                        rev_swrl, rev_acid, rev_zoom, rev_echo,
│   │                        rev_drunk, rev_balo
│   │                        REV_FUNCS, REV_NAMES, REV_USE_TICK
│   │                        _rev_echo_buf
│   └── mirror.py         ← screen_mir2, screen_kl4, screen_kl8, screen_kl16
│                            MIRROR_FUNCS, MIRROR_NAMES
└── hud.py                ← draw_hud, LABELS, FX_KEYS
```

---

## Variables globales compartidas (state.py)

Estas variables son accedidas por múltiples módulos. Deben vivir en `state.py` y ser importadas donde se necesiten con `from state import *` o importación explícita.

```python
# state.py
import argparse
import numpy as np

# --- args ---
parser = argparse.ArgumentParser(description='GLITCH.CAM | EsquizoAI')
parser.add_argument('--cam',       type=int, default=0)
parser.add_argument('--width',     type=int, default=1280)
parser.add_argument('--height',    type=int, default=720)
parser.add_argument('--intensity', type=int, default=50)
args = parser.parse_args()

# --- estado de efectos ---
fx = {
    'rgb_split': False, 'displacement': False, 'scanlines': False,
    'noise': False, 'glitch_blocks': False, 'crt_warp': False,
    'color_cycle': False, 'ascii': False,
}
corrupt_mode  = 0
datamosh_mode = 0
blnd_on       = False
rev_mode      = 0
mirror_mode   = 0

# --- estado general ---
intensity  = args.intensity / 100.0
hud_on     = True
clean_mode = False
fullscreen = False
prev_frame = None
```

> **Importante:** los módulos de efectos que usan buffers persistentes
> (`_mosh_buf`, `_frac_buf`, `_rev_echo_buf`) deben declarar esas variables
> en su propio módulo como `_var = None` a nivel de módulo, NO en `state.py`.
> Se resetean desde `main.py` importando el módulo y asignando directamente:
> `ghost._mosh_buf = None`.

---

## Plan de migración paso a paso

### Paso 1 — Crear estructura de archivos vacíos

```bash
cd glitch-cam
mkdir effects
touch effects/__init__.py
touch effects/base.py
touch effects/corrupt.py
touch effects/ghost.py
touch effects/reventus.py
touch effects/mirror.py
touch state.py
touch hud.py
touch main.py
```

### Paso 2 — Migrar `state.py`

Copiar el bloque `# ─── ARGUMENTOS ───` y `# ─── ESTADO ───` del monolítico.
Eliminar de allí las líneas de buffers (`_mosh_buf`, `_frac_buf`, `_rev_echo_buf`).

**Verificar:** `python -c "import state; print(state.args)"` debe funcionar sin error.

### Paso 3 — Migrar `effects/base.py`

Copiar estas funciones del monolítico:
- `rgb_split`
- `displacement`
- `noise`
- `color_cycle`
- `scanlines`
- `glitch_blocks`
- `crt_warp`
- `ASCII_CHARS`
- `ascii_mode`

Añadir al inicio del archivo:
```python
import cv2
import numpy as np
```

**Verificar:** `python -c "from effects.base import rgb_split; print('ok')`

### Paso 4 — Migrar `effects/corrupt.py`

Copiar:
- `color_corrupt_blocks`
- `color_corrupt_organic`
- `color_corrupt_full`
- `color_corrupt_pure`
- `CORRUPT_MODES`
- `CORRUPT_NAMES`

> `color_corrupt_full` llama a `color_corrupt_blocks` y `color_corrupt_organic` —
> todas están en el mismo archivo, no hay dependencia cruzada.

**Verificar:** `python -c "from effects.corrupt import CORRUPT_NAMES; print(CORRUPT_NAMES)"`

### Paso 5 — Migrar `effects/ghost.py`

Copiar:
- `_mosh_buf = None`
- `_frac_buf = None`
- `MOSH_NAMES`
- `fx_ghst`
- `fx_soul`
- `fx_frac`
- `MOSH_FUNCS`

> `fx_soul` usa `_mosh_buf` (mismo buffer que `fx_ghst`). Ambas en el mismo archivo, no hay problema.

**Verificar:** `python -c "from effects.ghost import MOSH_FUNCS; print(MOSH_FUNCS)"`

### Paso 6 — Migrar `effects/reventus.py`

Copiar:
- `_rev_echo_buf = None`
- `_face_mask`
- `_blend`
- `_expand_bbox`
- `rev_swrl`
- `rev_acid` ← **depende de `color_corrupt_pure`**
- `rev_zoom`
- `rev_echo`
- `rev_drunk`
- `rev_balo`
- `REV_FUNCS`
- `REV_NAMES`
- `REV_USE_TICK`

> `rev_acid` llama a `color_corrupt_pure`. Añadir al inicio:
> ```python
> from effects.corrupt import color_corrupt_pure
> ```

**Verificar:** `python -c "from effects.reventus import REV_NAMES; print(REV_NAMES)"`

### Paso 7 — Migrar `effects/mirror.py`

Copiar:
- `screen_mir2`
- `screen_kl4`
- `screen_kl8`
- `screen_kl16`
- `MIRROR_FUNCS`
- `MIRROR_NAMES`

**Verificar:** `python -c "from effects.mirror import MIRROR_NAMES; print(MIRROR_NAMES)"`

### Paso 8 — Migrar `hud.py`

Copiar:
- `LABELS`
- `FX_KEYS`
- `draw_hud`

`draw_hud` accede a estas variables globales del estado: `chaos` (eliminado),
`corrupt_mode`, `datamosh_mode`, `rev_mode`, `mirror_mode`, `blnd_on`,
`REV_NAMES`, `CORRUPT_NAMES`, `MOSH_NAMES`, `MIRROR_NAMES`.

Añadir imports al inicio:
```python
import cv2
import numpy as np
import state
from effects.corrupt import CORRUPT_NAMES
from effects.ghost   import MOSH_NAMES
from effects.reventus import REV_NAMES
from effects.mirror  import MIRROR_NAMES
```

Y reemplazar las referencias directas a globales por `state.corrupt_mode`, etc.

> Este es el paso más delicado. Hacer un test visual después.

### Paso 9 — Construir `main.py`

Estructura del nuevo `main.py`:

```python
import cv2
import numpy as np
import time
import sys
import inspect

import state
from effects.base    import rgb_split, displacement, noise, color_cycle, \
                            scanlines, glitch_blocks, crt_warp, ascii_mode
from effects.corrupt import CORRUPT_MODES
from effects.ghost   import fx_ghst, fx_soul, fx_frac, MOSH_FUNCS
import effects.ghost as ghost
from effects.reventus import REV_FUNCS, REV_USE_TICK, _rev_echo_buf
import effects.reventus as reventus
from effects.mirror  import MIRROR_FUNCS
from hud             import draw_hud

def main():
    # Mismo código del loop actual pero usando state.variable
    # en vez de variables locales/globales directas
    ...
```

> Para modificar estado desde main: `state.intensity = 0.5`, `state.rev_mode = 1`, etc.
> Para resetear buffers: `ghost._mosh_buf = None`, `reventus._rev_echo_buf = None`

---

## Dependencias entre módulos

```
state.py         ← sin dependencias
effects/base.py  ← cv2, numpy
effects/corrupt.py ← cv2, numpy
effects/ghost.py   ← cv2, numpy
effects/reventus.py ← cv2, numpy, effects/corrupt.py (color_corrupt_pure)
effects/mirror.py  ← cv2, numpy
hud.py             ← cv2, numpy, state, effects/corrupt, effects/ghost,
                      effects/reventus, effects/mirror
main.py            ← todo lo anterior
```

---

## Cómo añadir un efecto nuevo (flujo futuro)

1. Identificar a qué módulo pertenece (base, corrupt, ghost, reventus, mirror)
   o crear uno nuevo en `effects/`
2. Escribir la función en ese módulo
3. Añadirla al dict correspondiente (`MOSH_FUNCS`, `REV_FUNCS`, etc.)
4. Actualizar el dict `*_NAMES` con el nuevo nombre para el HUD
5. Incrementar el módulo del ciclo en `main.py` (`% N` → `% N+1`)
6. Si necesita `tick`: añadir al set `*_USE_TICK`
7. No tocar otros módulos

---

## Checklist de verificación post-migración

- [ ] `python main.py` abre la cámara sin errores
- [ ] Teclas 1-9 activan/desactivan efectos correctamente
- [ ] Tecla `c` cicla modos de corrupción (OFF→BLK→ORG→ALL→PUR)
- [ ] Tecla `4` cicla ghost modes (OFF→GHST→SOUL→FRAC)
- [ ] Tecla `b` toggle BLND visible en HUD
- [ ] Tecla `Shift+F` cicla REVENTUS (OFF→SWRL→ACID→ZOOM→ECHO→DRNK→BALO)
- [ ] Tecla `m` cicla mirror full-screen (OFF→MIR2→KL4→KL8→KL16)
- [ ] Tecla `Tab` oculta HUD completo (clean mode para OBS)
- [ ] Tecla `h` toggle HUD
- [ ] Tecla `+/-` ajusta intensidad (funciona también en caos)
- [ ] Tecla `r` resetea todo sin crashear
- [ ] Tecla `f` toggle fullscreen
- [ ] Tecla `q` cierra limpiamente

---

## Rollback

Si algo se rompe durante la migración:

```bash
cp ../glitch-cam.backup.py ../glitch-cam.py
```

El backup está en `../glitch-cam.backup.py` y es el estado estable pre-modularización.
