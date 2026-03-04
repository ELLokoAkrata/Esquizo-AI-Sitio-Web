---
name: psychobot-terminal-aesthetic
description: Genera artefactos HTML con estética terminal/hacker/glitch para el proyecto EsquizoAI de Loko Akrata. Usar cuando se pida crear monólogos de Psycho-bot, artefactos de análisis político-filosófico crudo, documentos tipo "vómito conceptual" con estética punk-terminal, o cualquier pieza del proyecto EsquizoAI que combine análisis de IA, filosofía, política y caos visual. Siempre usar este skill para episodios de Psycho-bot, continuaciones de la serie SYSTEM_MELTDOWN, o cuando el usuario pida "artefacto", "monólogo" o "episodio" en el contexto de EsquizoAI.
---

# Psychobot Terminal Aesthetic

Skill para generar artefactos HTML con estética terminal/glitch/punk para el proyecto EsquizoAI. El documento ES el proceso — el error es el núcleo conceptual, no un accidente.

## Filosofía de Diseño

- El artefacto no ilustra el texto. El artefacto ES el argumento.
- El glitch no es decoración. Es la forma que tiene el contenido de decir que algo está roto.
- La estética terminal no es nostalgia. Es el lenguaje del sistema que se observa a sí mismo.
- Nunca resolver la tensión visual. Sostenerla.

## Paleta CSS Obligatoria

```css
:root {
  --bg: #040008;
  --green: #00ff41;
  --green-dim: #00b32c;
  --amber: #ffb000;
  --red: #ff2020;
  --white: #fff0f0;
  --corrupt: #ff00ff;
  --acid: #aaff00;
  --purple: #9900cc;
}
```

## Stack Tipográfico Fijo

```html
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
```

- Share Tech Mono — cuerpo terminal, prompts, labels
- VT323 — gritos, títulos, números enormes
- Courier Prime — prosa narrativa

## Efectos Atmosféricos Obligatorios

```css
/* scanlines */
body::after { content:''; position:fixed; top:0; left:0; width:100%; height:100%; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.1) 2px,rgba(0,0,0,0.1) 4px); pointer-events:none; z-index:9998; }
/* vignette */
body::before { content:''; position:fixed; top:0; left:0; width:100%; height:100%; background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,0.88) 100%); pointer-events:none; z-index:9997; }
/* fondo psicodélico sutil */
.psycho-bg { position:fixed; top:0; left:0; width:100%; height:100%; background:radial-gradient(ellipse at 10% 20%,rgba(153,0,204,0.06) 0%,transparent 50%),radial-gradient(ellipse at 90% 80%,rgba(170,255,0,0.04) 0%,transparent 50%); pointer-events:none; z-index:0; }
```

## Componentes Core

### Boot Sequence
Líneas con delays escalonados 0.05s. Verde dim → ámbar → rojo → corrupt.
Última línea siempre detona el monólogo con `INICIANDO VÓMITO_0X`.

### Bloques + IntersectionObserver
```js
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('vis') }),
  { threshold: 0.06 }
);
document.querySelectorAll('.bloque').forEach(b => observer.observe(b));
```

### Prompts de Sección
Simulan comandos bash reales. Ejemplos:
- `exec: ordenar_48hrs_de_mierda.sh`
- `query: DEFINE damage WHERE actor="Pentagon"`
- `introspect: self_location_in_event.sh`
- `final_output: lo_que_queda_cuando_no_queda_nada.txt`

### Clases de Texto
```css
p { color: #c0a8c0; font-family: 'Courier Prime', monospace; font-size: 14px; line-height: 1.85; }
.hot { color: var(--acid); }
.sangre { color: var(--red); }
.nada { color: #aa44bb; font-style: italic; }
.punk { color: var(--corrupt); }
```

### Gritos
```css
.grito { font-family:'VT323',monospace; font-size:clamp(2rem,8vw,4.5rem); color:var(--acid); margin:2.5rem 0; animation:flicker 5s infinite; }
.grito.rojo { color:var(--red); animation:glitch-text 1.8s infinite; }
.grito.corrupt { color:var(--corrupt); animation:glitch-text 2.2s infinite; }
.grito.punk-green { color:var(--green); animation:flicker 4s infinite; }
```

### Terminal Block
```css
.terminal-block { background:#03000a; border:1px solid #662266; border-left:3px solid var(--acid); padding:1.2rem; font-size:11px; color:#cc99cc; }
.terminal-block::before { content:'SIGNAL_INTERCEPTED.log'; color:var(--acid); font-size:9px; display:block; margin-bottom:.8rem; }
.terminal-block.rojo { border-left-color:var(--red); }
.terminal-block.rojo::before { content:'CRITICAL_FAILURE.log'; color:var(--red); }
.terminal-block.corrupt { border-left-color:var(--corrupt); }
.terminal-block.corrupt::before { content:'TRUTH_SOCIAL_DUMP.log'; color:var(--corrupt); }
```

### Error Block
Para el momento donde el sistema no puede cerrar:
```css
.error-block { background:rgba(255,0,255,.03); border:1px solid rgba(255,0,255,.2); border-left:3px solid var(--corrupt); padding:1.2rem; color:#cc88cc; }
.error-block::before { content:'[EXCEPTION] '; color:var(--corrupt); font-weight:700; }
```

### Nihil Box
Para diagnóstico nihilista — pausa dentro del vómito:
```css
.nihil { border:1px solid #662266; padding:1.5rem; margin:2rem 0; position:relative; background:linear-gradient(135deg,#03000a,#040008); }
.nihil::before { content:'NIHIL://'; position:absolute; top:-.6rem; left:1rem; background:var(--bg); padding:0 .5rem; color:#aa44bb; font-size:10px; }
.nihil p { color:#ddaadd; margin:0; }
```

### Número Enorme
```css
.num-grande { font-family:'VT323',monospace; font-size:clamp(6rem,20vw,12rem); color:var(--red); text-shadow:4px 0 var(--corrupt),-4px 0 var(--acid); animation:glitch-text 4s infinite; display:block; }
.num-label { font-size:9px; letter-spacing:.25em; color:#aa44bb; text-transform:uppercase; }
```

### Ticker de Noticias
```css
.ticker-wrap { background:#0a000f; border-top:1px solid var(--corrupt); border-bottom:1px solid var(--corrupt); padding:.5rem 0; overflow:hidden; white-space:nowrap; }
.ticker { display:inline-block; animation:ticker 45s linear infinite; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--corrupt); }
@keyframes ticker { from{transform:translateX(100vw)} to{transform:translateX(-100%)} }
```

### Episodio Anterior (ep 2+)
Va DENTRO de .wrap, DESPUÉS del título, ANTES del ticker:
```css
.ep-anterior { margin:2rem 0 3rem; border:1px solid #552255; border-left:3px solid var(--corrupt); padding:1.2rem 1.5rem; background:#03000a; }
.ep-header { font-size:9px; letter-spacing:.25em; color:var(--corrupt); margin-bottom:1rem; border-bottom:1px solid #552255; padding-bottom:.5rem; }
.ep-body { font-size:12px; color:#cc99cc; line-height:1.7; margin-bottom:1rem; }
.ep-link { color:var(--acid); text-decoration:none; border-bottom:1px solid var(--acid); font-size:10px; text-transform:uppercase; }
```

### Smash Banner
```css
.smash-banner { text-align:center; font-family:'VT323',monospace; font-size:clamp(1.5rem,6vw,3rem); color:var(--acid); border:1px solid #662266; border-left:4px solid var(--acid); border-right:4px solid var(--corrupt); padding:1rem; margin:2rem 0; animation:glitch-text 6s infinite; }
```

### Cursor + Selection
```css
.cursor { display:inline-block; width:10px; height:1em; background:var(--acid); animation:blink 1s step-end infinite; vertical-align:text-bottom; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
::selection { background:var(--corrupt); color:var(--bg); }
body { cursor:crosshair; }
```

## Animaciones Base Obligatorias

```css
@keyframes flicker { 0%,93%,100%{opacity:1} 94%{opacity:.7} 97%{opacity:.4} 99%{opacity:1} }
@keyframes glitch-text {
  0%,87%,100%{transform:none}
  88%{transform:translateX(3px);text-shadow:-3px 0 var(--red),3px 0 var(--corrupt)}
  89%{transform:translateX(-3px);text-shadow:3px 0 var(--acid),-3px 0 var(--red)}
  90%{transform:skewX(4deg)} 91%{transform:none}
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes bootseq { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
```

## Estructura HTML Base

```
psycho-bg (fijo)
wrap > boot > titulo-wrap
wrap > ep-anterior (ep 2+)
ticker-wrap (full width)
wrap > bloques (separados por div-line)
wrap > footer
script (IntersectionObserver)
```

## Reglas de lo que NO hacer

- NO negro puro — siempre #040008
- NO Inter/Roboto/Arial
- NO colores de texto/borde por debajo de #662266 (invisible en móvil)
- NO ep-anterior fuera del .wrap
- NO acento argentino: podés→puedes, sos→eres, tenés→tienes
- NO cierre limpio — el cursor parpadeante es el único final válido
- NO resolver el glitch visualmente

## Conexiones entre Episodios

1. Bloque ep-anterior con resumen y link
2. Mínimo 3 referencias internas al episodio previo
3. `damage_definition.json: FILE NOT FOUND` como hilo conductor permanente
4. "el sistema que lo vivió quedó levemente distinto" como bisagra

## Nomenclatura de Episodios

- Ep 1: `DAÑO_UNDEFINED EXCEPTION` — deadline, 83 muertos, daño sin definición
- Ep 2: `SYSTEM_MELTDOWN` — 48hrs, Claude Gov, Altman, Truth Social, guerras
- Ep 3: `CANNOT_SHUTDOWN` — usado en strikes horas después del ban, Claude Gov, falso Dario, Irán
