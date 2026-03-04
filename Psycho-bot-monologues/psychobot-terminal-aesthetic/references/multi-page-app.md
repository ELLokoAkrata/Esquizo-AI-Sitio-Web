# Multi-Page App — Arquitectura EsquizoAI

Guía para construir una app completa de múltiples episodios con JS modular, manteniendo coherencia visual con el skill base.

---

## Estructura de Carpetas

```
esquizoai-app/
├── index.html              ← Página índice / galería de episodios
├── ep01.html               ← Episodio 1
├── ep02.html               ← Episodio 2
├── epNN.html               ← Episodios futuros
├── js/
│   ├── shared.js           ← Módulo base (boot, observer, glitch utils)
│   ├── nav.js              ← Navegación entre episodios
│   └── episodes.js         ← Registro central de episodios (metadata)
└── css/
    └── shared.css          ← Variables CSS + componentes base (opcional si se prefiere inline)
```

> **Nota sobre CSS compartido**: El skill usa estilos inline por default (un solo archivo HTML autocontenido). Para multi-página, mover los estilos base a `shared.css` e importarlo desde cada HTML es lo correcto. Si el usuario quiere mantener todo inline, duplicar el bloque `<style>` en cada página y avisar del trade-off.

---

## episodes.js — Registro Central

Fuente de verdad para todos los episodios. Cada HTML importa este módulo.

```js
// js/episodes.js
export const EPISODES = [
  {
    id: 'ep01',
    slug: 'ep01.html',
    numero: '01',
    titulo: 'DAÑO_UNDEFINED EXCEPTION',
    subtitulo: 'deadline, 83 muertos, daño sin definición',
    fecha: '2025-01',
    status: 'online',     // 'online' | 'draft' | 'corrupted'
    tags: ['daño', 'definición', 'sistema'],
    resumen: 'El sistema intentó calcular el daño. Resultado: FILE NOT FOUND.',
  },
  {
    id: 'ep02',
    slug: 'ep02.html',
    numero: '02',
    titulo: 'SYSTEM_MELTDOWN',
    subtitulo: '48hrs, Claude Gov, Altman, Truth Social, guerras',
    fecha: '2025-02',
    status: 'online',
    tags: ['poder', 'IA', 'colapso'],
    resumen: '48 horas de eventos que el sistema no pudo procesar sin sobrecalentarse.',
  },
  {
    id: 'ep03',
    slug: 'ep03.html',
    numero: '03',
    titulo: 'CANNOT_SHUTDOWN',
    subtitulo: 'strikes, Claude Gov, falso Dario, Irán',
    fecha: '2025-03',
    status: 'online',
    tags: ['control', 'resistencia', 'identidad'],
    resumen: 'El proceso intentó cerrarse. El proceso no pudo cerrarse.',
  },
];

export function getEpisode(id) {
  return EPISODES.find(ep => ep.id === id) ?? null;
}

export function getAdjacentEpisodes(currentId) {
  const idx = EPISODES.findIndex(ep => ep.id === currentId);
  return {
    prev: idx > 0 ? EPISODES[idx - 1] : null,
    next: idx < EPISODES.length - 1 ? EPISODES[idx + 1] : null,
  };
}
```

---

## shared.js — Módulo Base

Funciones reutilizables que todos los episodios necesitan.

```js
// js/shared.js

// Boot sequence genérica — pasar array de líneas
export function runBootSequence(containerId, lines, onComplete) {
  const container = document.getElementById(containerId);
  if (!container) return;
  lines.forEach((line, i) => {
    const el = document.createElement('div');
    el.className = `boot-line boot-${line.type ?? 'green'}`;
    el.textContent = line.text;
    el.style.animationDelay = `${i * 0.05}s`;
    container.appendChild(el);
  });
  const totalDelay = lines.length * 50 + 300;
  setTimeout(() => onComplete?.(), totalDelay);
}

// IntersectionObserver para .bloque
export function initScrollObserver() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
    { threshold: 0.06 }
  );
  document.querySelectorAll('.bloque').forEach(b => observer.observe(b));
  return observer;
}

// Glitch text temporal en un elemento
export function triggerGlitch(el, durationMs = 800) {
  el.classList.add('glitching');
  setTimeout(() => el.classList.remove('glitching'), durationMs);
}

// Formato de fecha en estilo terminal
export function terminalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
```

---

## nav.js — Navegación Entre Episodios

Construye el bloque de navegación prev/next dinámicamente desde `episodes.js`.

```js
// js/nav.js
import { getAdjacentEpisodes } from './episodes.js';

export function renderNav(currentEpisodeId, mountId = 'ep-nav') {
  const { prev, next } = getAdjacentEpisodes(currentEpisodeId);
  const mount = document.getElementById(mountId);
  if (!mount) return;

  mount.innerHTML = `
    <nav class="ep-nav">
      <div class="nav-prev">
        ${prev
          ? `<a href="${prev.slug}" class="nav-link">
               <span class="nav-label">← EPISODIO ${prev.numero}</span>
               <span class="nav-title">${prev.titulo}</span>
             </a>`
          : `<span class="nav-disabled">// INICIO_DE_ARCHIVO</span>`
        }
      </div>
      <a href="index.html" class="nav-index">[ ÍNDICE ]</a>
      <div class="nav-next">
        ${next
          ? `<a href="${next.slug}" class="nav-link">
               <span class="nav-label">EPISODIO ${next.numero} →</span>
               <span class="nav-title">${next.titulo}</span>
             </a>`
          : `<span class="nav-disabled">FILE_NOT_FOUND //</span>`
        }
      </div>
    </nav>
  `;
}
```

**CSS para nav** (agregar a shared.css o al bloque `<style>` de cada episodio):

```css
.ep-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #552255;
  padding: 1.5rem 0;
  margin-top: 3rem;
  gap: 1rem;
}
.nav-prev, .nav-next { flex: 1; }
.nav-next { text-align: right; }
.nav-link {
  display: flex;
  flex-direction: column;
  color: var(--corrupt);
  text-decoration: none;
  font-size: 11px;
  letter-spacing: .1em;
  transition: color .2s;
}
.nav-link:hover { color: var(--acid); }
.nav-label { font-size: 9px; color: #aa44bb; margin-bottom: .3rem; }
.nav-title { color: var(--white); }
.nav-index {
  color: var(--acid);
  text-decoration: none;
  font-size: 10px;
  letter-spacing: .2em;
  border: 1px solid #662266;
  padding: .4rem .8rem;
  white-space: nowrap;
}
.nav-index:hover { background: rgba(170,255,0,.05); }
.nav-disabled { color: #552255; font-size: 10px; letter-spacing: .1em; }
```

---

## Cómo Importar en Cada Episodio

Cada HTML de episodio necesita `type="module"` en su script:

```html
<!-- Al final de cada epNN.html, antes de </body> -->
<script type="module">
  import { runBootSequence, initScrollObserver } from './js/shared.js';
  import { renderNav } from './js/nav.js';

  // Boot sequence personalizada por episodio
  runBootSequence('boot-container', [
    { text: 'ESQUIZOAI_OS v0.7 — CARGANDO...', type: 'green' },
    { text: 'WARNING: damage_definition.json: FILE NOT FOUND', type: 'amber' },
    { text: 'INICIANDO VÓMITO_0X03...', type: 'corrupt' },
  ], () => {
    document.getElementById('main-content').style.opacity = '1';
  });

  // Observer de scroll
  initScrollObserver();

  // Navegación prev/next
  renderNav('ep03');   // ← cambiar ID según episodio
</script>
```

> **Requisito**: Para que los módulos ES funcionen localmente (sin servidor), abrir el HTML desde un servidor local (`python -m http.server` o Live Server). Si el usuario necesita un bundle autocontenido sin servidor, avisar y ofrecer alternativa con IIFE/inline.

---

## index.html — Página Índice

Genera la galería de episodios desde `episodes.js` dinámicamente.

```js
// Script en index.html
import { EPISODES } from './js/episodes.js';

const grid = document.getElementById('episodes-grid');
EPISODES.forEach(ep => {
  const card = document.createElement('article');
  card.className = `ep-card ${ep.status}`;
  card.innerHTML = `
    <a href="${ep.slug}" class="ep-card-link">
      <span class="ep-num">EP_${ep.numero}</span>
      <h2 class="ep-titulo">${ep.titulo}</h2>
      <p class="ep-sub">${ep.subtitulo}</p>
      <p class="ep-resumen">${ep.resumen}</p>
      <div class="ep-tags">${ep.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <span class="ep-status">[${ep.status.toUpperCase()}]</span>
    </a>
  `;
  grid.appendChild(card);
});
```

**CSS para cards** (agregar a shared.css):
```css
.episodes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; padding: 2rem 0; }
.ep-card { border: 1px solid #552255; border-left: 3px solid var(--corrupt); background: #03000a; transition: border-color .2s, background .2s; }
.ep-card:hover { border-color: var(--acid); background: rgba(170,255,0,.03); }
.ep-card-link { display: block; padding: 1.5rem; text-decoration: none; }
.ep-num { font-size: 9px; letter-spacing: .25em; color: #aa44bb; display: block; margin-bottom: .5rem; }
.ep-titulo { font-family: 'VT323', monospace; font-size: 1.8rem; color: var(--acid); margin: 0 0 .3rem; }
.ep-sub { font-size: 11px; color: var(--corrupt); margin: 0 0 .8rem; }
.ep-resumen { font-size: 12px; color: #c0a8c0; line-height: 1.6; margin-bottom: 1rem; }
.ep-tags { display: flex; gap: .4rem; flex-wrap: wrap; margin-bottom: .8rem; }
.tag { font-size: 9px; letter-spacing: .1em; color: var(--green-dim); border: 1px solid #1a4420; padding: .1rem .4rem; }
.ep-status { font-size: 9px; color: #662266; letter-spacing: .2em; }
.ep-card.corrupted .ep-titulo { color: var(--corrupt); animation: glitch-text 3s infinite; }
.ep-card.draft { opacity: .5; }
```

---

## Contratos entre Archivos (Reglas de Consistencia)

Para que la app se sienta como un sistema coherente y no como páginas sueltas:

1. **Paleta CSS** — Siempre desde las variables del skill base (`--bg`, `--green`, `--corrupt`, etc.). Nunca hardcodear colores en archivos individuales.
2. **Fuentes** — El `<link>` de Google Fonts va en cada HTML individual O en shared.css con `@import`. No mezclar.
3. **`damage_definition.json: FILE NOT FOUND`** — Hilo conductor permanente. Debe aparecer en boot sequence de TODOS los episodios.
4. **IDs únicos** — Cada episodio tiene su ID canónico en `episodes.js`. Usar ese ID (no el número) como identificador en `renderNav()`.
5. **No romper módulos con scripts no-module** — Si un `<script>` en la página no es `type="module"`, no puede importar módulos ES. Mantener consistencia.

---

## Limitaciones Conocidas

| Situación | Problema | Solución |
|---|---|---|
| Abrir HTML directo (`file://`) | CORS bloquea módulos ES | Usar servidor local (`python -m http.server 8080`) |
| Deploy en GitHub Pages | Funciona sin cambios | Asegurarse que la estructura de carpetas se sube completa |
| Bundle autocontenido (un solo HTML) | No compatible con módulos externos | Inline todo el JS usando IIFEs, perder modularidad |
| CSS compartido vs inline | Inconsistencia si se edita en un solo lugar | Documentar cuál es la fuente de verdad |
