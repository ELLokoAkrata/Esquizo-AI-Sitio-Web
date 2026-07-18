# Pruebas de navegador

Este directorio alojará las auditorías automatizadas del sitio con Puppeteer.

## Objetivos

- Abrir el proyecto desde `http://127.0.0.1:8099`.
- Probar vistas de escritorio y móvil.
- Registrar errores de consola y excepciones de página.
- Comprobar interacciones, desbordamientos y estados del DOM.
- Verificar juegos con teclado, Pointer Events, touch, pausa, reinicio, foco del iframe y tamaños de ventana.
- Probar física mínima de PONG_MUTANTE: paleta, rebote, marcador, victoria a 7, dificultad y mutaciones.
- Probar MINAS_666: primera zona segura, clic derecho, pulsación larga, teclado, detonación, victoria y tamaños del tablero.
- Verificar la ráfaga de sintonización y el ADN visual/textual propio de cada frecuencia.
- Confirmar que el pulso generativo sigue activo cuando no existe telemetría.
- Capturar escenas generativas para inspección visual.
- Medir animaciones y rendimiento cuando sea necesario.

## Convenciones

- El servidor local se levanta una sola vez por sesión y se reutiliza.
- Las capturas y reportes son artefactos temporales: no se publican.
- `node_modules/` nunca entra al repositorio.
- La reproducción de audio se valida técnicamente aquí; la escucha final sigue siendo manual.

## Uso

Desde la raíz del repositorio, con el servidor local activo en el puerto `8099`:

```powershell
cd tests/browser
npm install
npm run test:games
npm run test:radio
```

Variantes:

```powershell
npm run test:radio:quick   # omite la espera del vórtice automático
npm run test:radio:headed  # abre Chromium de forma visible
```

También se puede indicar otra URL:

```powershell
node radio-audit.cjs --url=https://esquizo-ai-sitio-web.vercel.app/iptv/
node game-audit.cjs --url=https://esquizo-ai-sitio-web.vercel.app
```

## Estructura prevista

```text
tests/browser/
├── README.md
├── package.json
├── game-audit.cjs
├── radio-audit.cjs
├── screenshots/      # generado, ignorado
└── reports/          # generado, ignorado
```
