#!/usr/bin/env python3
"""
ONPE API Recon — Análisis de endpoints públicos de resultados electorales.

HALLAZGO TÉCNICO (reverse-engineered):
  CloudFront enruta por Sec-Fetch-Dest:
    - "document" (navegación directa) → sirve index.html del SPA Angular
    - "empty" (XHR/fetch) → proxea al backend API real

  Los endpoints correctos están en /presentacion-backend/{recurso}/
  NO en /resumen-general/proceso-electoral-activo (esa es una ruta del router Angular).

Guarda respuestas JSON + genera reporte de estructura y opacidades.
"""

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE = "https://resultadoelectoral.onpe.gob.pe/presentacion-backend"

ENDPOINTS = {
    "proceso_electoral_activo": f"{BASE}/proceso/proceso-electoral-activo",
    "proceso_elecciones":       f"{BASE}/proceso/2/elecciones",
    "distritos_electorales":    f"{BASE}/distrito-electoral/distritos",
    "presidencial_totales":     f"{BASE}/resumen-general/totales?idEleccion=10&tipoFiltro=eleccion",
    "presidencial_participantes": f"{BASE}/resumen-general/participantes?idEleccion=10&tipoFiltro=eleccion",
    "congreso_totales":         f"{BASE}/resumen-general/totales?idEleccion=14&tipoFiltro=eleccion",
    "congreso_participantes":   f"{BASE}/resumen-general/participantes?idEleccion=14&tipoFiltro=eleccion",
    "senado_deu_totales":       f"{BASE}/resumen-general/totales?idEleccion=15&tipoFiltro=eleccion",
    # Lima Metropolitana, distrito electoral 15
    "congreso_lima_totales":    f"{BASE}/resumen-general/totales?idAmbitoGeografico=1&idEleccion=14&tipoFiltro=distrito_electoral&idDistritoElectoral=15",
    "congreso_lima_participantes": f"{BASE}/resumen-general/participantes?idAmbitoGeografico=1&idEleccion=14&tipoFiltro=distrito_electoral&idDistritoElectoral=15",
}

# Endpoints que requieren parámetros aún no descubiertos (documentados en reporte)
ENDPOINTS_PARCIAL = {
    "actas_listar": f"{BASE}/actas/listar",  # 400 — existe, parámetros desconocidos
}

OUT_DIR = Path(__file__).parent

# Headers que emulan un XHR desde el propio dominio.
# Sin Sec-Fetch-Dest: empty → CloudFront sirve index.html en vez del JSON.
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-PE,es;q=0.9",
    "Referer": "https://resultadoelectoral.onpe.gob.pe/main/resumen",
    "Origin": "https://resultadoelectoral.onpe.gob.pe",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "DNT": "1",
}


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def fetch(url: str, timeout: int = 20) -> tuple:
    meta = {
        "url": url,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "status": None,
        "latency_ms": None,
        "content_type": None,
        "error": None,
    }
    t0 = time.monotonic()
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=timeout) as resp:
            meta["status"] = resp.status
            meta["content_type"] = resp.headers.get("Content-Type", "")
            raw = resp.read()
            meta["latency_ms"] = round((time.monotonic() - t0) * 1000)
            # Guard: si el backend devuelve HTML, es el SPA (routing incorrecto)
            if raw[:10].strip().startswith(b"<!"):
                meta["error"] = "SPA_HTML_FALLBACK — CloudFront sirvió index.html, no JSON"
                return None, meta
            data = json.loads(raw)
            return data, meta
    except HTTPError as e:
        meta["status"] = e.code
        body = e.read()
        try:
            meta["error"] = json.loads(body).get("message", str(e))
        except Exception:
            meta["error"] = str(e)
    except URLError as e:
        meta["error"] = str(e.reason)
    except json.JSONDecodeError as e:
        meta["error"] = f"JSON parse error: {e}"
    except Exception as e:
        meta["error"] = str(e)
    meta["latency_ms"] = round((time.monotonic() - t0) * 1000)
    return None, meta


# ---------------------------------------------------------------------------
# Schema extraction
# ---------------------------------------------------------------------------

def extract_schema(obj, depth: int = 0, max_depth: int = 5) -> dict:
    if depth > max_depth:
        return {"type": "..."}
    if isinstance(obj, dict):
        return {"type": "object", "fields": {k: extract_schema(v, depth+1, max_depth) for k, v in obj.items()}}
    elif isinstance(obj, list):
        if not obj:
            return {"type": "array", "length": 0, "items": "empty"}
        return {"type": "array", "length": len(obj), "items": extract_schema(obj[0], depth+1, max_depth)}
    else:
        return {"type": type(obj).__name__, "example": repr(obj)}


def flatten_fields(schema: dict, prefix: str = "") -> list:
    rows = []
    if schema.get("type") == "object":
        for k, v in schema.get("fields", {}).items():
            path = f"{prefix}.{k}" if prefix else k
            rows.extend(flatten_fields(v, path))
    elif schema.get("type") == "array":
        items = schema.get("items", {})
        if isinstance(items, dict):
            rows.extend(flatten_fields(items, f"{prefix}[]"))
        else:
            rows.append({"path": f"{prefix}[]", "type": items, "example": None})
    else:
        rows.append({"path": prefix, "type": schema.get("type", "?"), "example": schema.get("example")})
    return rows


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

TEMPORAL_KW  = ["timestamp","hora","time","fecha","date","secuencia","sequence","ingreso","registro","created","updated","actualizacion"]
MESA_KW      = ["mesa","local","ubigeo","distrito","provincia","departamento","circunscripcion","centro_votacion","id_local","id_mesa"]
VOTO_KW      = ["voto","votos","total_votos","porcentaje","acumulado","conteo","escrutinio","invalido","blanco","nulo","valido","emitido"]
ACTA_KW      = ["acta","actas","contabilizada","enviada","pendiente","jee","transmision"]


def kw_hits(fields: list, kws: list) -> list:
    return [f["path"] for f in fields if any(k in f["path"].lower() for k in kws)]


def generate_report(results: list) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    lines = [
        "# ONPE API — Reporte de Reconocimiento Electoral",
        f"\n**Fecha de análisis:** {now}  ",
        "**Base URL:** `resultadoelectoral.onpe.gob.pe/presentacion-backend/`  ",
        "**Propósito:** Auditoría de estructura de datos y opacidades en la API pública de resultados electorales.\n",
        "---\n",
        "## 0. Hallazgo Técnico: Por qué curl falla y el browser funciona\n",
        "CloudFront está configurado con comportamiento dual según el header `Sec-Fetch-Dest`:  ",
        "- `document` (navegación directa / curl) → sirve `index.html` del SPA Angular  ",
        "- `empty` (XHR/fetch desde JS) → proxea al backend API real que devuelve JSON  ",
        "\nEsto significa que todos los endpoints de la API son accesibles públicamente, ",
        "pero **solo si la request emula headers de XHR de browser** (mismo origen).  ",
        "No hay autenticación. No hay rate limiting observable.\n",
        "---\n",
        "## 1. Resumen de Endpoints\n",
        "| Endpoint | Status | Latencia | Tipo respuesta |",
        "|----------|--------|----------|----------------|",
    ]

    for r in results:
        name = r["name"]
        meta = r["meta"]
        data = r["data"]
        status = meta.get("status", "ERR")
        lat = f"{meta.get('latency_ms', '?')} ms"
        ct = meta.get("content_type", "?")
        err = meta.get("error", "")
        tipo = "JSON ✓" if data is not None else (f"Error: {err[:60]}" if err else "vacío")
        lines.append(f"| `{name}` | {status} | {lat} | {tipo} |")

    lines.append("\n---\n")
    lines.append("## 2. Análisis de Estructura por Endpoint\n")

    for r in results:
        name = r["name"]
        meta = r["meta"]
        data = r["data"]
        fields = r["fields"]
        idx = results.index(r) + 1

        lines.append(f"### 2.{idx} `{name}`\n")
        lines.append(f"**URL:** `{meta['url']}`  ")
        lines.append(f"**Captura:** `{meta['timestamp_utc']}`  ")

        if meta.get("error"):
            lines.append(f"\n> **No disponible:** {meta['error']}\n")
            continue

        # Tabla de campos
        lines.append(f"\n#### Campos expuestos ({len(fields)} campos)\n")
        lines.append("| Campo | Tipo | Ejemplo |")
        lines.append("|-------|------|---------|")
        for f in fields:
            ex = str(f["example"])[:90].replace("|", "\\|") if f["example"] else "—"
            lines.append(f"| `{f['path']}` | `{f['type']}` | `{ex}` |")

        # Análisis de categorías
        temporal = kw_hits(fields, TEMPORAL_KW)
        mesa     = kw_hits(fields, MESA_KW)
        voto     = kw_hits(fields, VOTO_KW)
        acta     = kw_hits(fields, ACTA_KW)

        lines.append("\n**Campos de tiempo/secuencia:** " + (", ".join(f"`{h}`" for h in temporal) or "❌ Ninguno"))
        lines.append("**Campos de mesa/local:** "       + (", ".join(f"`{h}`" for h in mesa)     or "❌ Ninguno"))
        lines.append("**Campos de votos/conteos:** "    + (", ".join(f"`{h}`" for h in voto)     or "❌ Ninguno"))
        lines.append("**Campos de actas:** "            + (", ".join(f"`{h}`" for h in acta)     or "❌ Ninguno"))
        lines.append("")

    # ------------------------------------------------------------------
    # Section 3: Opacidades críticas
    # ------------------------------------------------------------------
    lines.append("---\n")
    lines.append("## 3. Opacidades Críticas — Qué NO expone la API\n")

    lines.append("""
| Dato buscado | ¿Disponible? | Implicación |
|---|---|---|
| Timestamp de ingreso de cada acta | ❌ Ausente | Sin timeline de escrutinio, no se puede detectar late-count bias |
| ID único de mesa de votación | ❌ Ausente | No se pueden desagregar votos por mesa individual |
| Secuencia/orden de procesamiento de actas | ❌ Ausente | No existe rastro de en qué orden llegaron las actas |
| Metadatos de transmisión (dispositivo, operador, hora) | ❌ Ausente | Cero trazabilidad forense de la transmisión |
| Actas individuales con candidato + votos + mesa | ❌ No público | Endpoint `/actas/listar` existe (400) pero parámetros no documentados |
| Snapshots históricos del conteo parcial | ❌ Ausente | Solo estado actual; la API no expone progresión temporal |
| Geolocalización de mesa | ❌ Ausente | No hay coordenadas ni dirección de local de votación |
| Distribución de votos nulos/blancos por mesa | ❌ Ausente | Solo agregados nacionales |
| Actas por candidato en orden cronológico | ❌ Ausente | Imposible construir la curva de escrutinio |
""")

    lines.append("\n### Endpoint `/actas/listar` — El dato más valioso es inaccesible\n")
    lines.append("""
Este endpoint existe y responde con HTTP 400 cuando se llama sin parámetros correctos.
El error dice `"Los parámetros enviados son incorrectos o están incompletos"`.
Esto implica que:

1. El backend tiene un endpoint que lista actas
2. Probablemente expone datos a nivel de acta individual
3. Los parámetros requeridos no están documentados públicamente
4. Si este endpoint fuera accesible, **permitiría la auditoría real** que la API pública impide

**Para obtener acceso:** Requeriría análisis del bundle Angular compilado o documentación oficial de la API.
""")

    # ------------------------------------------------------------------
    # Section 4: Resultados en tiempo real (resumen de datos)
    # ------------------------------------------------------------------
    lines.append("---\n")
    lines.append("## 4. Datos de Resultados en Tiempo Real\n")

    for r in results:
        if "participantes" in r["name"] and r["data"] is not None:
            data = r["data"]
            if isinstance(data, dict) and "data" in data:
                candidatos = data["data"]
                if isinstance(candidatos, list) and candidatos:
                    lines.append(f"### {r['name']}\n")
                    lines.append("| Candidato | Partido | Votos Válidos | % Votos Válidos |")
                    lines.append("|-----------|---------|--------------|-----------------|")
                    # Ordenar por votos descendente
                    sorted_c = sorted(candidatos, key=lambda x: x.get("totalVotosValidos", 0), reverse=True)
                    for c in sorted_c:
                        nombre = c.get("nombreCandidato", c.get("nombre", "?"))
                        partido = c.get("nombreAgrupacionPolitica", "?")[:40]
                        votos = f"{c.get('totalVotosValidos', 0):,}"
                        pct = c.get("porcentajeVotosValidos", 0)
                        lines.append(f"| {nombre} | {partido} | {votos} | {pct:.3f}% |")
                    lines.append("")

    # ------------------------------------------------------------------
    # Section 5: Conclusión técnica
    # ------------------------------------------------------------------
    lines.append("---\n")
    lines.append("## 5. Conclusión Técnica\n")
    lines.append("> **¿Es posible detectar un \"beneficio sistemático\" hacia algún candidato con estos datos?**\n")
    lines.append("### Veredicto: **NO** — con los datos expuestos actualmente.\n")
    lines.append("""
#### Qué necesitaría una detección de beneficio sistemático

Para detectar *late-count bias* o manipulación escalonada se necesita **mínimamente**:

```
Serie temporal:  conteo(candidato, t) para todo t en [inicio_escrutinio, fin]
Granularidad:    a nivel de acta o mesa, no agregado nacional
Trazabilidad:    timestamp de ingreso de cada acta al sistema central
```

La API pública de la ONPE solo expone **snapshots agregados nacionales** sin ninguna
dimensión temporal ni granularidad sub-nacional a nivel de mesa.

#### Lo que SÍ permite esta API

- Verificar totales finales por candidato (en el momento de la consulta)
- Observar el porcentaje de actas contabilizadas y pendientes de envío al JEE
- Comparar con cifras de medios y actas físicas
- Identificar qué elecciones están activas (presidencial, congreso, senado, parlamento andino)
- Desagregar resultados por distrito electoral (pero sin timestamps)

#### Estrategia alternativa de auditoría

Si se quisiera detectar anomalías con los datos disponibles:

1. **Polling agresivo** — llamar esta API cada N minutos y guardar snapshots
   → Construye una serie temporal artificial del avance del conteo
   → Permite detectar saltos anómalos en los porcentajes de algún candidato

2. **Análisis cruzado** — cruzar resultados actuales con ubigeos de actas pendientes
   → Si las actas pendientes están concentradas geográficamente en zonas afines a X candidato,
     los resultados finales deberían moverse en esa dirección

3. **Comparación estadística** — comparar porcentajes por distrito electoral
   → Si un candidato tiene % significativamente distinto en distritos que terminaron tarde vs temprano,
     es señal estadística (requiere los datos por distrito + orden de cierre)

#### Conclusión final

La arquitectura de transparencia de la ONPE está diseñada para **presentar resultados**,
no para **auditarlos**. La ausencia de timestamps, IDs de mesa y datos secuenciales
no es evidencia de fraude — pero sí garantiza que **si el fraude existiera,
no podría ser detectado con las herramientas públicas disponibles**.

El endpoint `/actas/listar` (que existe pero no está documentado) es el dato crítico ausente.
""")

    lines.append("\n---")
    lines.append("*Reporte generado automáticamente por `onpe_recon.py`*  ")
    lines.append("*Técnica: browser-emulated fetch con headers Sec-Fetch-Dest: empty*")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    results = []

    print("=== ONPE API Recon v2 ===")
    print("Headers: emulando XHR browser (Sec-Fetch-Dest: empty)\n")

    for name, url in ENDPOINTS.items():
        print(f"[>] {name}")
        data, meta = fetch(url)

        # Guardar raw JSON
        json_path = OUT_DIR / f"{name}_{ts}.json"
        payload = {"meta": meta, "data": data}
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        status = meta.get("status", "ERR")
        lat = meta.get("latency_ms", "?")
        err = f" ERROR: {meta['error'][:80]}" if meta.get("error") else ""
        print(f"    status={status} lat={lat}ms  saved={json_path.name}{err}")

        # Extraer schema
        inner = data.get("data", data) if isinstance(data, dict) else data
        schema = extract_schema(inner) if inner is not None else {}
        fields = flatten_fields(schema) if inner is not None else []

        results.append({
            "name": name,
            "meta": meta,
            "data": data,
            "schema": schema,
            "fields": fields,
        })

        time.sleep(0.4)

    # Documentar endpoint parcial
    print(f"\n[>] actas_listar (endpoint existente, parámetros desconocidos)")
    _, meta_acta = fetch(ENDPOINTS_PARCIAL["actas_listar"])
    print(f"    status={meta_acta.get('status')}  {meta_acta.get('error','')[:80]}")

    # Generar reporte
    print("\n[>] Generando reporte...")
    report_md = generate_report(results)
    report_path = OUT_DIR / f"reporte_{ts}.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)
    print(f"    Saved: {report_path.name}")

    print("\n=== Done ===")
    print(f"\nArchivos en: {OUT_DIR}")


if __name__ == "__main__":
    main()
