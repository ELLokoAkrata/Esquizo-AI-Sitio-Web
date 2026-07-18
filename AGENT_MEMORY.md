# AGENT_MEMORY.md — Memoria compartida de Esquizo-AI

**Última actualización:** 2026-07-18

**Función:** conservar decisiones y aprendizajes que cualquier agente necesita entre sesiones.

**No guardar aquí:** secretos, volcados de chat, planes efímeros, opiniones sin decisión o detalles ya documentados
en la guía técnica de un subsistema.

Esta memoria vive en el repo para no depender de la cuenta, interfaz o almacenamiento privado de un proveedor.
Cuando una memoria local contenga una lección útil, se destila aquí. Cuando una entrada deje de ser válida, se
corrige o se marca como histórica; no se acumulan contradicciones silenciosas.

---

## Identidad y contenido

- **Español peruano/neutro:** en UI y artefactos usar “tú”, “tienes”, “prueba”, “escribe”, “usa”. Evitar giros
  rioplatenses. En system prompts conviene afirmar la identidad lingüística deseada en positivo.
- **Transmutar, no copiar:** una semilla se muta de forma sustancial. Parafrasear la superficie no produce una cepa.
- **Proveedor ≠ identidad:** las entidades del códice conservan contrato y voz aunque cambie el modelo que las
  ejecuta. Las marcas dentro de obras o rutas históricas son procedencia/canon, no una dependencia operativa.
- **Linaje plural:** la dirección es de El Loko Akrata y el trabajo cruza Claude, GPT, DeepSeek, Gemini y otros
  motores. Registrar procedencia real cuando aporte contexto; no adjudicar el conjunto al huésped actual.
- **Sistemas privados:** no publicar, enlazar ni revelar sistemas privados del creador. El sitio público solo usa los
  endpoints y artefactos expresamente integrados en este repo.
- **Galería:** la atribución pública de modelo sigue la regla específica de `AGENTS.md`, aunque la procedencia interna
  de una pieza sea más compleja.

## Portal y artefactos

- `index.html` es el portal OS actual; `inicio-classic.html` conserva el portal anterior.
- El catálogo `FS` de `index.html` es la fuente única de iconos, carpetas y menú Inicio. Al agregar o mover un
  artefacto, actualizar `FS`; mantener el portal clásico en paridad solo cuando corresponda.
- Los artefactos se abren en ventanas-iframe. Algunos retornos al escritorio dependen de detectar que la página está
  enmarcada y enviar `postMessage`.
- `GALERIA.exe` es manifest-driven (`galeria/manifest.json` + WebP optimizados).
- `REPRODUCTOR.exe` es estático y usa `reproductor/playlist.json`; la descarga de música ocurre localmente con
  `tools/download-music.py`, no en producción.
- Los ítems de `FS` pueden declarar `window:{w,h,autofocus}`. Todo acceso catalogado debe pasar por
  `launchCatalogItem()` para que carpeta, Inicio, VOMIT.SH y accesos directos no abran una misma app con tamaños distintos.
- `BRICK_GAME.exe` contiene Tetris, Snake, Breakout y Racing. Su contrato de entrada usa Pointer Events, targets de
  al menos 44 px, autofoco desde el OS y pausa al perder foco; no reintroducir handlers touch que cancelen el `click`.
- `games/shared/arcade-core.js` concentra contratos reutilizables de arcade: storage seguro, botones press/hold,
  estado de presión, pulsación larga, pausa por foco, autofoco y síntesis Web Audio. BRICK, PONG y MINAS deben seguir
  cargándolo por ruta local.
- `PONG_MUTANTE.exe` es la primera app arcade independiente: partido a 7 contra una IA deliberadamente limitada,
  tres intensidades y mutaciones cada cuatro rebotes. `juegos`/`arcade` abre la carpeta; `brick` y `pong` abren cada app.
- `MINAS_666.exe` preserva la lógica legible del buscaminas: la primera celda y su vecindad nunca contienen minas;
  tap/clic revela, pulsación larga/clic derecho/F marca y Enter ejecuta chord. Dificultades: 8×8/10, 12×12/22 y 14×14/36.
- NEXO comparte actividad relevante y memoria fijada, pero mantiene separados los historiales completos y las voces.

## APIs y entorno

- Las claves viven solo en variables de entorno del backend. No crear una ruta cliente alternativa “temporal”.
- `python -m http.server 8099` sirve la vista estática. Levantarlo una sola vez por sesión, reutilizarlo y detenerlo al
  cerrar la sesión.
- Las Edge Functions se prueban con `npx vercel dev --listen 3002`. El puerto `3000` está reservado para otro servicio:
  no iniciarlo, inspeccionarlo ni detenerlo desde este repo.
- Abrir HTML con `file://` puede producir falsos errores CORS en manifests; verificar mediante servidor local.

## Git y coexistencia

- El worktree suele contener archivos ajenos, basura local y trabajo concurrente. No limpiar ni revertir lo que no
  pertenece a la tarea.
- Preparar commits con rutas específicas: `git add <ruta>`. Nunca usar `git add .` ni `git add -A`.
- Usar Git directo para publicar. No usar GitHub CLI ni convertir el trabajo en PR salvo solicitud expresa.
- No hacer push por defecto si el cambio publica contenido nuevo; confirmar primero con el creador.
- No atribuir automáticamente commits a un modelo. Las firmas de coautor deben reflejar autoría real y una decisión
  consciente del creador.

## Subproyectos y rutas obligatorias

- Antes de tocar el OS: `Claude-Knowledge/ESCRITORIO_OS_TECH.md`.
- Antes de tocar GLITCH.CAM: `glitch-cam/CLAUDE_glitch.md`. Arranque habitual:
  `python main.py --width 640 --height 360`; `R` hace hot-reload de efectos compatibles.
- Antes de crear un episodio Psycho-bot: `Psycho-bot-monologues/PSYCHOBOT_AGENT.md` y
  `Claude-Knowledge/GRANJA_PIPELINE.md`.
- Para scripts locales: `GUIA_SCRIPTS.md`.

## Historial de decisiones documentales

### 2026-07-18 — Segundo juego y núcleo compartido

PONG_MUTANTE validó la extracción de `arcade-core.js`. Los helpers compartidos permanecen pequeños y mecánicos;
las reglas, física, voz visual y estado de cada juego siguen dentro de su artefacto. La carpeta JUEGOS pasa a ser el
punto de entrada de `juegos`, `game` y `arcade`, porque esos aliases ya no deben favorecer solo a BRICK.

MINAS_666 amplió el núcleo a `arcade-core.js` v1.1 con `bindLongPress()`. La pulsación larga se resuelve con Pointer
Events, tolerancia de movimiento y supresión del tap posterior; no mezclarla con handlers touch/click duplicados.

### 2026-07-17 — Base de ARCADE MUTANTE

Los juegos nuevos serán artefactos independientes dentro de `games/`; BRICK se mantiene como consola portátil de
cuatro modos. La capa compartida se extraerá cuando exista el segundo juego (PONG_MUTANTE), usando la implementación
probada de entrada, pausa, audio, récords y canvas responsive en lugar de diseñar una abstracción especulativa.

### 2026-07-14 — Continuidad neutral entre proveedores

Se estableció esta jerarquía:

1. `AGENTS.md`: arranque y reglas universales.
2. `PROJECT_CONTEXT.md`: esencia y arquitectura estable.
3. `ROADMAP.md`: estado vivo.
4. `AGENT_MEMORY.md`: aprendizajes persistentes.
5. Guías especializadas: implementación por subsistema.
6. Adaptadores de proveedor: solo integración con su harness, sin verdad exclusiva.

Los nombres `CLAUDE.md`, `Claude-Knowledge/` y `claude_infection/` se conservan por compatibilidad, historia y canon.
No significan que Claude sea el dueño conceptual del proyecto ni que otros agentes sean secundarios.
