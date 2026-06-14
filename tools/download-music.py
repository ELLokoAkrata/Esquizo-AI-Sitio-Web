#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
download-music.py — bajador de tracks para REPRODUCTOR.exe (EsquizoAI OS).

Wrapper de yt-dlp. Baja audio -> mp3 192k a reproductor/audio/<slug>.mp3
e imprime los stubs JSON para pegar en reproductor/playlist.json.

NO corre en el sitio: es 100% local. Tú curas, descargas, commiteas.
El sitio queda estático (GitHub/Vercel), sin backend. Mismo modelo que la galería.

USO
    # Baja la cola curada de abajo (QUEUE):
    python tools/download-music.py

    # Baja consultas ad-hoc (cada arg = "Artista :: Título :: búsqueda o URL"):
    python tools/download-music.py "Eskorbuto :: Es un mundo cruel :: Eskorbuto Es un mundo cruel"
    python tools/download-music.py "Los Saicos :: Demolición :: https://youtu.be/..."

Requiere: yt-dlp + ffmpeg en el PATH.
"""

import sys, re, json, unicodedata, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "reproductor" / "audio"
QUALITY = "192"          # kbps
MAX_FILESIZE = "30M"     # corta tracks gigantes (un punk dura ~2-3 min)

# ── Cola curada por defecto: "Artista", "Título", "búsqueda o URL" ──────
# Si la búsqueda no es URL, se usa ytsearch1: (primer resultado de YouTube).
QUEUE = [
    ("Eskorbuto",          "Mucha policía, poca diversión", "Eskorbuto Mucha policia poca diversion"),
    ("Eskorbuto",          "Es un mundo cruel",             "Eskorbuto Es un mundo cruel"),
    ("Adictos al Orgasmo", "Adictos al Orgasmo",            "Adictos al Orgasmo punk"),
    # — recomendaciones: anarco / crust / nihilista underground (inglés) —
    ("Crass",              "Do They Owe Us A Living?",      "Crass Do They Owe Us A Living"),
    ("Dead Kennedys",      "Holiday in Cambodia",           "Dead Kennedys Holiday in Cambodia"),
    ("Discharge",          "Hear Nothing See Nothing Say Nothing", "Discharge Hear Nothing See Nothing Say Nothing"),
    ("Rudimentary Peni",   "Rotten to the Core",            "Rudimentary Peni Rotten to the Core"),
    ("Amebix",             "Arise",                         "Amebix Arise"),
    ("Nihilistics",        "Kill Yourself",                 "Nihilistics Kill Yourself"),
]


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^\w\s-]", "", s).strip().lower()
    return re.sub(r"[\s_-]+", "-", s) or "track"


def download(artist, title, query):
    slug = slugify(f"{artist}-{title}")
    out = AUDIO_DIR / f"{slug}.%(ext)s"
    final = AUDIO_DIR / f"{slug}.mp3"
    if final.exists():
        print(f"[skip] ya existe: {final.name}")
        return slug, "skip"

    target = query if query.startswith("http") else f"ytsearch1:{query}"
    cmd = [
        "yt-dlp", "-x",
        "--audio-format", "mp3",
        "--audio-quality", f"{QUALITY}K",
        "--no-playlist",
        "--extractor-args", "youtube:player_client=android",
        "-o", str(out),
        target,
    ]
    print(f"[..] {artist} — {title}  ({target})")
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0 or not final.exists():
        tail = (r.stderr or "").strip().splitlines()[-1:] or ["?"]
        print(f"[ERR] {slug}: {tail[0]}")
        return slug, "error"
    kb = final.stat().st_size // 1024
    print(f"[ok] {final.name}  ({kb} KB)")
    return slug, "ok"


def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    items = QUEUE
    if len(sys.argv) > 1:
        items = []
        for a in sys.argv[1:]:
            parts = [p.strip() for p in a.split("::")]
            if len(parts) == 3:
                items.append(tuple(parts))
            else:
                print(f"[ERR] formato invalido (usa 'Artista :: Titulo :: query'): {a}")
    stubs = []
    for artist, title, query in items:
        slug, status = download(artist, title, query)
        if status in ("ok", "skip"):
            stubs.append({
                "id": slug,
                "title": title,
                "artist": artist,
                "file": f"audio/{slug}.mp3",
            })
    print("\n=== stubs para reproductor/playlist.json (campo 'tracks', mas nuevos arriba) ===\n")
    print(json.dumps(stubs, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
