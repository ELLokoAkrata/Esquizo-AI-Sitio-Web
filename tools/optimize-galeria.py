#!/usr/bin/env python3
"""
optimize-galeria.py — Optimiza imágenes para GALERIA.exe (EsquizoAI OS).

Toma imágenes de origen (por defecto galeria/_originals/, o rutas/carpeta dadas),
las redimensiona a un lado máximo y las exporta como .webp livianas en galeria/img/.
Al final imprime stubs del manifiesto (galeria/manifest.json) listos para pegar.

Uso:
    python tools/optimize-galeria.py                      # procesa galeria/_originals/
    python tools/optimize-galeria.py inspirations/        # procesa una carpeta
    python tools/optimize-galeria.py a.png b.png          # procesa archivos sueltos
    python tools/optimize-galeria.py --max 1600 --quality 80 inspirations/

Requiere: Pillow.
"""
import sys, os, json, argparse, re
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow. Instala con:  pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "galeria" / "img"
ORIGINALS = ROOT / "galeria" / "_originals"
EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "pieza"


def collect(args_paths):
    paths = []
    if not args_paths:
        if ORIGINALS.exists():
            paths = [p for p in sorted(ORIGINALS.iterdir()) if p.suffix.lower() in EXTS]
        if not paths:
            sys.exit(f"No hay imágenes en {ORIGINALS}. Pasa una carpeta o archivos como argumento.")
        return paths
    for a in args_paths:
        p = Path(a)
        if not p.is_absolute():
            p = ROOT / a
        if p.is_dir():
            paths += [q for q in sorted(p.iterdir()) if q.suffix.lower() in EXTS]
        elif p.is_file() and p.suffix.lower() in EXTS:
            paths.append(p)
    if not paths:
        sys.exit("No se encontraron imágenes válidas en los argumentos.")
    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*", help="carpeta(s) o archivo(s) de origen")
    ap.add_argument("--max", type=int, default=1600, help="lado máximo en px (default 1600)")
    ap.add_argument("--quality", type=int, default=80, help="calidad webp (default 80)")
    ap.add_argument("--prefix", default="", help="prefijo opcional para el nombre de salida")
    args = ap.parse_args()

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    sources = collect(args.paths)
    stubs = []

    for i, src in enumerate(sources, 1):
        try:
            im = Image.open(src)
        except Exception as e:
            print(f"  [skip] {src.name}: {e}")
            continue
        im = im.convert("RGB")
        w, h = im.size
        scale = min(1.0, args.max / max(w, h))
        if scale < 1.0:
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

        base = args.prefix + slugify(src.stem)
        out = IMG_DIR / f"{base}.webp"
        n = 2
        while out.exists():
            out = IMG_DIR / f"{base}-{n}.webp"; n += 1
        im.save(out, "WEBP", quality=args.quality, method=6)
        kb = out.stat().st_size / 1024
        print(f"  [ok] {src.name} -> galeria/img/{out.name}  ({im.size[0]}x{im.size[1]}, {kb:.0f} KB)")

        stubs.append({
            "id": out.stem,
            "title": out.stem.upper().replace("-", "_"),
            "file": f"img/{out.name}",
            "model": "GPT-Image 2.0",
            "date": "2026-05",
            "caption": "",
            "unpublished": True,
        })

    print("\n--- stubs para galeria/manifest.json (campo \"drops\") ---\n")
    print(json.dumps(stubs, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
