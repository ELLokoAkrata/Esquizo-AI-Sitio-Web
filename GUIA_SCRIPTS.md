# 🛠 GUÍA DE SCRIPTS — Esquizo-AI (para El Loko Akrata)

Cómo usar tú mismo las herramientas del proyecto, sin depender de un agente. Todo corre **en tu PC**;
el sitio queda estático (GitHub/Vercel), sin backend.

> Abre la terminal **dentro de la carpeta del proyecto**:
> `C:\Users\Ricardo Ruiz\Desktop\EsquizoAI-sitio-web`
> En PowerShell: `cd "C:\Users\Ricardo Ruiz\Desktop\EsquizoAI-sitio-web"`

---

## 0. Requisitos (instalar una sola vez)

| Herramienta | Para qué | Verificar | Instalar |
|-------------|----------|-----------|----------|
| **Python 3** | correr los scripts | `python --version` | python.org |
| **yt-dlp** | bajar música | `yt-dlp --version` | `pip install -U yt-dlp` |
| **ffmpeg** | convertir audio a mp3 | `ffmpeg -version` | https://ffmpeg.org (o `winget install ffmpeg`) |
| **Pillow** | optimizar imágenes | `python -c "import PIL"` | `pip install Pillow` |

*(Ya tienes los cuatro instalados.)* Si `yt-dlp` falla raro al bajar, casi siempre se arregla actualizándolo:
`pip install -U yt-dlp`.

---

## 1. 🎵 Agregar música al REPRODUCTOR

Script: **`tools/download-music.py`**. Baja audio de YouTube (u otra URL) → lo convierte a mp3 192k →
lo guarda en `reproductor/audio/` → imprime el "stub" JSON listo para pegar.

### Opción A — un tema suelto (lo más común)
```powershell
python tools/download-music.py "Artista :: Título :: búsqueda o URL"
```
Ejemplos:
```powershell
python tools/download-music.py "Discharge :: State Violence :: Discharge State Violence"
python tools/download-music.py "Eskorbuto :: Maldito país :: https://youtu.be/XXXXXXXX"
```
- Si el 3er campo **no** es una URL, usa el primer resultado de búsqueda de YouTube (`ytsearch1`).
- Si quieres apuntar a un video exacto, pega la URL completa en el 3er campo.

### Opción B — un lote (la "cola" curada)
Edita la lista `QUEUE` arriba del archivo `tools/download-music.py` (formato `("Artista","Título","búsqueda")`),
guarda, y corre sin argumentos:
```powershell
python tools/download-music.py
```

### Después de bajar (PASO QUE NO HAY QUE OLVIDAR)
1. El script imprime al final un bloque JSON ("stubs"). **Copia los objetos que quieras.**
2. Ábre `reproductor/playlist.json` y pégalos dentro de `"tracks": [ ... ]`. **Los más nuevos van arriba.**
   Cada tema se ve así:
   ```json
   {
     "id": "discharge-state-violence",
     "title": "State Violence",
     "artist": "Discharge",
     "file": "audio/discharge-state-violence.mp3"
   }
   ```
3. Revisa que el `title` quedó bien escrito (acentos, etc.) — puedes editarlo a mano.
4. Prueba local (ver §4) → si suena, sube (ver §5).

**Notas:**
- Corta temas de más de 30 MB (`--max-filesize 30M` en el script) para no inflar el repo. Un punk dura ~2-3 min ≈ 3-6 MB.
- Si un tema ya existe (mismo nombre de archivo), lo salta (`[skip]`).
- Si ves `[ERR] ... SABR` o `416`, YouTube está raro con ese video: prueba otra búsqueda o pega una URL distinta.

---

## 2. 🖼 Agregar imágenes a la GALERIA

Script: **`tools/optimize-galeria.py`**. Redimensiona a un lado máximo y exporta `.webp` liviano en `galeria/img/`.

```powershell
# procesa una carpeta entera
python tools/optimize-galeria.py inspirations/

# procesa archivos sueltos
python tools/optimize-galeria.py imagen1.png imagen2.jpg

# por defecto (sin args) procesa galeria/_originals/
python tools/optimize-galeria.py

# ajustar tamaño/calidad
python tools/optimize-galeria.py --max 1600 --quality 80 inspirations/
```
**Después:** igual que la música — el script imprime stubs; pégalos en `galeria/manifest.json` dentro de `"drops": [ ... ]`
(más nuevos arriba). Cada pieza lleva `id`, `title` (acepta texto glitch unicode), `file`, `model` (público: "GPT-Image 2.0"),
`date`, `caption` (opcional), `unpublished` (`true` = badge INÉDITO).

- Los originales full-res van en `galeria/_originals/` (gitignored — **no** se suben).
- Solo se commitea el `.webp` optimizado.

---

## 3. 🎥 GLITCH.CAM (glitch en vivo sobre webcam/video)

Subproyecto Python aparte, en `glitch-cam/`. Tiene su **propia guía**: `glitch-cam/CLAUDE_glitch.md` y `glitch-cam/README.md`.
Arranque típico:
```powershell
cd glitch-cam
python main.py --width 640 --height 360
```
Controles en el README. Tecla **R** = recarga efectos en vivo (hot-reload).

---

## 4. ✅ Probar el sitio en tu PC antes de subir

```powershell
python -m http.server 8099
```
Luego abre en el navegador: **http://127.0.0.1:8099/index.html**
- Prueba lo que cambiaste (que el tema suene, que la imagen aparezca en la galería, etc.).
- Para detener el server: **Ctrl + C** en la terminal.

> ⚠️ Abrir el `index.html` con doble clic (`file://`) **no** funciona bien: la galería y el reproductor cargan sus
> listas con `fetch`, que el navegador bloquea en `file://`. Siempre usa el server local de arriba.

---

## 5. 🚀 Subir (deploy a Vercel)

Vercel despliega solo cuando subes a `main`. Sube **solo los archivos que tocaste**:

```powershell
# música nueva (ejemplo)
git add reproductor/audio/ reproductor/playlist.json
git commit -m "music: agrega temas nuevos al reproductor"
git push origin main
```
```powershell
# imágenes nuevas (ejemplo)
git add galeria/img/ galeria/manifest.json
git commit -m "galeria: nuevos drops"
git push origin main
```
En ~1-2 min está en https://esquizo-ai-sitio-web.vercel.app

> No uses `git add .` — el repo tiene archivos sueltos que no quieres subir (node_modules, capturas de pantalla,
> el archivo `nul`, los originales de la galería). Agrega siempre las rutas concretas.

---

## 6. Otros scripts (referencia)

- **`recon/onpe-api/*.py`** (`onpe_recon.py`, `poll.py`, `mesa_sampler.py`, `cruce_redigitadas.py`) — subproyecto de
  auditoría técnica de la API electoral ONPE. Es su propio mundo; no es parte del flujo del sitio.

---

## Resumen ultra-rápido

| Quiero… | Comando | Después |
|---------|---------|---------|
| Agregar una canción | `python tools/download-music.py "Artista :: Título :: búsqueda"` | pegar stub en `reproductor/playlist.json` |
| Agregar imágenes | `python tools/optimize-galeria.py <carpeta>` | pegar stub en `galeria/manifest.json` |
| Probar local | `python -m http.server 8099` → http://127.0.0.1:8099 | Ctrl+C para parar |
| Subir | `git add <rutas>` · `git commit -m "..."` · `git push origin main` | espera ~2 min, mira el sitio |

*Cualquier duda, pregúntale a un agente apuntándolo a este archivo y a `AGENTS.md`.*
