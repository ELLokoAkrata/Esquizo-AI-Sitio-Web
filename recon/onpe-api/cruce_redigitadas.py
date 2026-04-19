#!/usr/bin/env python3
"""
cruce_redigitadas.py — Para cada mesa redigitada del Senado DEU,
fetcha votos por partido y compara con mesas normales del mismo muestreo.
Pregunta: ¿las re-digitaciones favorecen sistemáticamente a alguien?
"""
import json, os, sys, time, urllib.request
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = "https://resultadoelectoral.onpe.gob.pe/presentacion-backend"
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://resultadoelectoral.onpe.gob.pe",
    "Referer": "https://resultadoelectoral.onpe.gob.pe/main/actas",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/135.0.0.0 Safari/537.36",
}

DIR = os.path.dirname(os.path.abspath(__file__))
SENADO_JSON = os.path.join(DIR, 'mesa_sample_20260419_155856.json')
ELECCION = 15  # Senado DEU


def fetch_mesa(codigo):
    url = f"{BASE}/actas/buscar/mesa?codigoMesa={codigo}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            d = json.loads(r.read().decode('utf-8'))
            if d.get('success') and d.get('data'):
                return d['data']
    except Exception as e:
        print(f"    ERROR {codigo}: {e}")
    return None


def top_partido(detalle):
    """Devuelve el partido ganador y sus votos."""
    validos = [x for x in detalle if x.get('adDescripcion') not in ('VOTOS EN BLANCO', 'VOTOS NULOS', 'IMPUGNADOS')]
    if not validos:
        return None, 0
    ganador = max(validos, key=lambda x: x.get('adVotos') or 0)
    return ganador.get('adDescripcion', '?'), ganador.get('adVotos', 0)


def analizar_detalle(actas, codigo):
    acta = next((a for a in actas if a['idEleccion'] == ELECCION), None)
    if not acta:
        return None
    detalle = acta.get('detalle', [])
    partido, votos = top_partido(detalle)
    total_validos = acta.get('totalVotosValidos') or 0
    pct = round(100 * votos / total_validos, 1) if total_validos > 0 else 0
    return {
        'codigo_mesa': codigo,
        'local': acta.get('nombreLocalVotacion', ''),
        'ubigeo': acta.get('idUbigeo'),
        'total_validos': total_validos,
        'ganador': partido,
        'votos_ganador': votos,
        'pct_ganador': pct,
        'estado': acta.get('descripcionEstadoActa', ''),
    }


# ---- Cargar muestra Senado ----
senado = json.load(open(SENADO_JSON, encoding='utf-8'))
todos = senado['resultados']
redigitadas = [r for r in todos if r['redigitada']]
normales = [r for r in todos if not r['redigitada']]

print(f"=== CRUCE REDIGITADAS SENADO DEU ===")
print(f"Mesas redigitadas : {len(redigitadas)}")
print(f"Mesas normales    : {len(normales)}")
print()

# ---- Fetch votos de mesas redigitadas ----
print(">> Fetching mesas redigitadas...")
resultados_redigitadas = []
for r in sorted(redigitadas, key=lambda x: x['n_digitaciones'], reverse=True):
    codigo = r['codigo_mesa']
    dig = r['n_digitaciones']
    actas = fetch_mesa(codigo)
    if not actas:
        continue
    ana = analizar_detalle(actas, codigo)
    if ana:
        ana['n_digitaciones'] = dig
        resultados_redigitadas.append(ana)
        print(f"  {codigo} dig={dig} | {ana['ganador'][:35]:<35} {ana['pct_ganador']}% | {ana['local'][:35]}")
    time.sleep(0.4)

# ---- Fetch muestra de 30 mesas normales para comparar ----
print()
print(">> Fetching muestra de normales (30)...")
import random
random.seed(99)
muestra_normales = random.sample(normales, min(30, len(normales)))
resultados_normales = []
for r in muestra_normales:
    codigo = r['codigo_mesa']
    actas = fetch_mesa(codigo)
    if not actas:
        continue
    ana = analizar_detalle(actas, codigo)
    if ana:
        ana['n_digitaciones'] = r['n_digitaciones']
        resultados_normales.append(ana)
    time.sleep(0.4)

# ---- Análisis comparativo ----
def conteo_ganadores(lista):
    conteo = {}
    for r in lista:
        g = r['ganador'] or 'DESCONOCIDO'
        conteo[g] = conteo.get(g, 0) + 1
    return dict(sorted(conteo.items(), key=lambda x: x[1], reverse=True))

print()
print("=" * 60)
print("ANÁLISIS COMPARATIVO")
print("=" * 60)

ganadores_redigitadas = conteo_ganadores(resultados_redigitadas)
ganadores_normales = conteo_ganadores(resultados_normales)

n_r = len(resultados_redigitadas)
n_n = len(resultados_normales)

print(f"\n[MESAS REDIGITADAS — n={n_r}]")
for partido, cnt in ganadores_redigitadas.items():
    pct = round(100 * cnt / n_r, 1)
    bar = '█' * int(pct / 3)
    print(f"  {partido[:45]:<45} {cnt:2d} ({pct:4.1f}%) {bar}")

print(f"\n[MESAS NORMALES (muestra={n_n})]")
for partido, cnt in ganadores_normales.items():
    pct = round(100 * cnt / n_n, 1)
    bar = '█' * int(pct / 3)
    print(f"  {partido[:45]:<45} {cnt:2d} ({pct:4.1f}%) {bar}")

# ---- Delta: sobre/sub-representación en redigitadas ----
print(f"\n[DELTA — sobre-representación en redigitadas vs normales]")
todos_partidos = set(list(ganadores_redigitadas.keys()) + list(ganadores_normales.keys()))
for partido in todos_partidos:
    pct_r = 100 * ganadores_redigitadas.get(partido, 0) / n_r if n_r > 0 else 0
    pct_n = 100 * ganadores_normales.get(partido, 0) / n_n if n_n > 0 else 0
    delta = pct_r - pct_n
    if abs(delta) > 3:  # solo mostrar diferencias relevantes
        signo = '+' if delta > 0 else ''
        flag = ' <<< SOBRE-REPRESENTADO' if delta > 8 else (' <<< sub-representado' if delta < -8 else '')
        print(f"  {partido[:45]:<45} {signo}{delta:+.1f}pp{flag}")

# ---- Guardar resultado ----
out = os.path.join(DIR, 'cruce_redigitadas.json')
json.dump({
    'redigitadas': resultados_redigitadas,
    'normales_muestra': resultados_normales,
    'ganadores_redigitadas': ganadores_redigitadas,
    'ganadores_normales': ganadores_normales,
}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f"\nJSON guardado: {out}")
