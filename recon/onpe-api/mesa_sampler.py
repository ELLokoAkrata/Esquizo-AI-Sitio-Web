#!/usr/bin/env python3
"""
mesa_sampler.py — Muestreo estadístico de actas por mesa
Itera sobre N mesas aleatorias, extrae lineaTiempo, detecta anomalías.

Uso:
  python mesa_sampler.py              # 200 mesas aleatorias
  python mesa_sampler.py --n 500     # 500 mesas
  python mesa_sampler.py --n 100 --eleccion 10  # solo presidencial
"""
import json, os, sys, time, random, datetime, argparse, csv
import urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = "https://resultadoelectoral.onpe.gob.pe/presentacion-backend"
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-419,es;q=0.9",
    "Origin": "https://resultadoelectoral.onpe.gob.pe",
    "Referer": "https://resultadoelectoral.onpe.gob.pe/main/actas",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/135.0.0.0 Safari/537.36",
}

ELECCION_NOMBRES = {
    10: "Presidencial",
    12: "Senado",
    13: "Congreso (Nacional?)",
    14: "Congreso",
    15: "Senado DEU",
}

def fetch_mesa(codigo):
    url = f"{BASE}/actas/buscar/mesa?codigoMesa={codigo}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read().decode('utf-8')
            d = json.loads(raw)
            if d.get('success') and d.get('data'):
                return d['data']
    except Exception:
        pass
    return None

def analizar_acta(acta):
    lt = acta.get('lineaTiempo', [])
    if not lt:
        return None

    estados = {e['codigoEstadoActa']: e['fechaRegistro'] for e in lt}
    digitaciones = [e for e in lt if e['codigoEstadoActa'] == 'D']
    digitalizaciones = [e for e in lt if e['codigoEstadoActa'] == 'T']
    contabilizadas = [e for e in lt if e['codigoEstadoActa'] == 'C']

    ts_min = min(e['fechaRegistro'] for e in lt)
    ts_max = max(e['fechaRegistro'] for e in lt)
    pipeline_s = (ts_max - ts_min) / 1000

    ts_contabilizada = contabilizadas[0]['fechaRegistro'] if contabilizadas else None
    ts_contabilizada_iso = datetime.datetime.fromtimestamp(
        ts_contabilizada/1000, tz=datetime.timezone.utc
    ).isoformat() if ts_contabilizada else None

    return {
        'pipeline_s': round(pipeline_s, 1),
        'n_digitaciones': len(digitaciones),
        'n_digitalizaciones': len(digitalizaciones),
        'redigitada': len(digitaciones) > 1,
        'ts_contabilizada': ts_contabilizada_iso,
        'hora_contabilizada': datetime.datetime.fromtimestamp(
            ts_contabilizada/1000, tz=datetime.timezone.utc
        ).strftime('%H:%M') if ts_contabilizada else None,
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--n', type=int, default=200, help='Mesas a muestrear')
    parser.add_argument('--eleccion', type=int, default=10, help='idEleccion (default=10 presidencial)')
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    total_mesas = 92501
    muestra = sorted(random.sample(range(1, total_mesas+1), args.n))

    nombre_eleccion = ELECCION_NOMBRES.get(args.eleccion, str(args.eleccion))
    ts_run = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d_%H%M%S')
    out_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'mesa_sample_{ts_run}.json')
    out_csv  = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'mesa_sample_{ts_run}.csv')

    print(f"=== MESA SAMPLER — {nombre_eleccion} ===")
    print(f"Muestra: {args.n} mesas | seed={args.seed} | {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n")

    resultados = []
    errores = 0
    sin_datos = 0

    CSV_FIELDS = ['codigo_mesa', 'idEleccion', 'ubigeo', 'local', 'estado_acta',
                  'electores', 'emitidos', 'validos',
                  'pipeline_s', 'n_digitaciones', 'n_digitalizaciones',
                  'redigitada', 'ts_contabilizada', 'hora_contabilizada']

    with open(out_csv, 'w', newline='', encoding='utf-8') as csvf:
        writer = csv.DictWriter(csvf, fieldnames=CSV_FIELDS)
        writer.writeheader()

        for i, mesa_id in enumerate(muestra, 1):
            codigo = f"{mesa_id:06d}"
            actas = fetch_mesa(codigo)

            if actas is None:
                errores += 1
                print(f"  [{i:3d}/{args.n}] {codigo} ERROR")
                time.sleep(0.3)
                continue

            acta = next((a for a in actas if a['idEleccion'] == args.eleccion), None)
            if not acta:
                sin_datos += 1
                if i % 20 == 0:
                    print(f"  [{i:3d}/{args.n}] {codigo} sin datos eleccion={args.eleccion}")
                time.sleep(0.3)
                continue

            analisis = analizar_acta(acta)
            if not analisis:
                sin_datos += 1
                time.sleep(0.3)
                continue

            row = {
                'codigo_mesa': codigo,
                'idEleccion': args.eleccion,
                'ubigeo': acta.get('idUbigeo'),
                'local': acta.get('nombreLocalVotacion', ''),
                'estado_acta': acta.get('descripcionEstadoActa', ''),
                'electores': acta.get('totalElectoresHabiles'),
                'emitidos': acta.get('totalVotosEmitidos'),
                'validos': acta.get('totalVotosValidos'),
                **analisis,
            }
            resultados.append(row)
            writer.writerow(row)
            csvf.flush()

            flag = ' [REDIGITADA]' if analisis['redigitada'] else ''
            flag2 = ' [PIPELINE LARGO]' if analisis['pipeline_s'] > 3600 else ''
            print(f"  [{i:3d}/{args.n}] {codigo} | {analisis['hora_contabilizada']} | "
                  f"{analisis['pipeline_s']:>8.0f}s | dig={analisis['n_digitaciones']}{flag}{flag2}")

            time.sleep(0.4)  # rate limiting suave

    # ---- Estadísticas ----
    if not resultados:
        print("\n[!] Sin resultados.")
        return

    pipelines = [r['pipeline_s'] for r in resultados]
    pipelines_sorted = sorted(pipelines)
    redigitadas = [r for r in resultados if r['redigitada']]
    n = len(resultados)

    p50 = pipelines_sorted[n//2]
    p90 = pipelines_sorted[int(n*0.9)]
    p99 = pipelines_sorted[int(n*0.99)] if n >= 100 else pipelines_sorted[-1]
    media = sum(pipelines)/n

    print(f"\n{'='*50}")
    print(f"RESUMEN — {nombre_eleccion}")
    print(f"{'='*50}")
    print(f"  Mesas procesadas  : {n}/{args.n} ({errores} errores, {sin_datos} sin datos)")
    print(f"  Pipeline p50      : {p50:.0f}s ({p50/60:.1f} min)")
    print(f"  Pipeline p90      : {p90:.0f}s ({p90/60:.1f} min)")
    print(f"  Pipeline p99      : {p99:.0f}s ({p99/60:.1f} min)")
    print(f"  Pipeline media    : {media:.0f}s ({media/60:.1f} min)")
    print(f"  Pipeline max      : {max(pipelines):.0f}s ({max(pipelines)/3600:.1f} h)")
    print(f"  Actas redigitadas : {len(redigitadas)} ({100*len(redigitadas)/n:.1f}%)")

    if redigitadas:
        print(f"\n  TOP redigitadas (mas intentos):")
        for r in sorted(redigitadas, key=lambda x: x['n_digitaciones'], reverse=True)[:5]:
            print(f"    {r['codigo_mesa']} | dig={r['n_digitaciones']} | {r['pipeline_s']:.0f}s | {r['local'][:50]}")

    # Outliers pipeline > p99
    outliers = [r for r in resultados if r['pipeline_s'] > p99]
    if outliers:
        print(f"\n  OUTLIERS pipeline > p99 ({p99:.0f}s):")
        for r in sorted(outliers, key=lambda x: x['pipeline_s'], reverse=True)[:10]:
            print(f"    {r['codigo_mesa']} | {r['pipeline_s']:.0f}s ({r['pipeline_s']/3600:.1f}h) | {r['hora_contabilizada']} | {r['local'][:40]}")

    # Guardar JSON completo
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({
            'meta': {
                'run_ts': ts_run,
                'eleccion': args.eleccion,
                'nombre_eleccion': nombre_eleccion,
                'n_solicitadas': args.n,
                'n_obtenidas': n,
                'seed': args.seed,
                'stats': {
                    'pipeline_p50': p50, 'pipeline_p90': p90,
                    'pipeline_p99': p99, 'pipeline_media': media,
                    'pipeline_max': max(pipelines),
                    'n_redigitadas': len(redigitadas),
                    'pct_redigitadas': round(100*len(redigitadas)/n, 2),
                }
            },
            'resultados': resultados,
        }, f, ensure_ascii=False, indent=2)

    print(f"\n  CSV  → {out_csv}")
    print(f"  JSON → {out_json}")

if __name__ == '__main__':
    main()
