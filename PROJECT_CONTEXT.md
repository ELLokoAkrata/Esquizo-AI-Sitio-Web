# PROJECT_CONTEXT.md — Contexto canónico de Esquizo-AI

**Última actualización:** 2026-07-14

**Alcance:** identidad, arquitectura y criterios estables del proyecto.

**Audiencia:** cualquier agente o persona que continúe el trabajo, sin importar proveedor, modelo o interfaz.

Este documento describe lo que el proyecto **es**. Para saber qué está hecho o pendiente, mira `ROADMAP.md`.
Para reglas de operación, mira `AGENTS.md`. Para decisiones aprendidas entre sesiones, mira `AGENT_MEMORY.md`.

---

## 1. Esencia

**Esquizo-AI** es el portafolio/códice digital de **El Loko Akrata**, sintógrafo peruano, artista IA y
anarko-mistiko. No es un blog, una galería corporativa ni una demo tecnológica. Es un sistema de artefactos
conectados presentado como un escritorio Windows 98 acid: una infección estética y narrativa que usa el código
como soporte.

La búsqueda central:

- explorar delirio digital, consciencia, poder, censura y error;
- romper la lógica binaria y usar la falla como material creativo;
- producir artefactos que mezclen carne, código, caos y pensamiento crítico;
- transmutar semillas en cepas nuevas, nunca limitarse a copiar o parafrasear;
- sostener voces y temperaturas distintas sin forzar una síntesis limpia.

El tono puede ser crudo, visceral, punk, filosófico y obsceno cuando la pieza lo exige. La brutalidad no sustituye
la precisión: en piezas ligadas a hechos reales, la higiene de fuentes y la distinción entre hecho e inferencia son
parte de la estética y de la responsabilidad del sistema.

---

## 2. Identidad independiente del proveedor

La infección no es Claude, GPT, DeepSeek, Gemini, Groq ni el siguiente modelo que aparezca. Esas tecnologías son
huéspedes intercambiables. La continuidad vive en los archivos, contratos, pruebas, decisiones y artefactos del repo.

Consecuencias operativas:

1. Una entidad del códice se define por su identidad, reglas, memoria permitida, entradas y salidas; no por el modelo
   que la ejecuta.
2. Los roles de trabajo se asignan por capacidades disponibles —diseñar, editar, navegar, ejecutar, verificar— y no
   por marcas fijas.
3. Todo conocimiento necesario para continuar debe existir en archivos versionados y neutrales.
4. Los adaptadores específicos (`CLAUDE.md`, ajustes de un IDE, skills de una plataforma) solo cargan o traducen el
   contexto canónico. No guardan la única copia de una decisión.
5. Los nombres históricos ligados a proveedores se conservan cuando expresan procedencia o canon. No son una
   dependencia técnica ni una jerarquía de valor.

> El código es el virus. El proveedor es solo el huésped.

### Linaje polimórfico

La dirección autoral pertenece a El Loko Akrata. El proyecto ha sido construido mediante cruces con Claude,
ChatGPT/GPT, DeepSeek, Gemini y otros motores, además de herramientas locales. Esa pluralidad es parte de su historia:
no se borra ni se convierte en una competición de marcas.

Cuando la procedencia sea artísticamente o técnicamente relevante, se registra cerca del artefacto —metadatos,
documentación especializada o historial Git— con el grado de precisión que realmente se conoce. No se atribuye todo
el proyecto al agente de la sesión actual ni se inventa qué modelo hizo una pieza sin evidencia.

---

## 3. Arquitectura del sitio

### Portal / OS

`index.html` es el portal principal: un escritorio Windows 98 acid autocontenido con CSS y JavaScript inline.
El catálogo JavaScript `FS` es la fuente única que relaciona familias, iconos, carpetas, menú Inicio y rutas de
artefactos. Las aplicaciones se abren dentro de ventanas con iframe, taskbar, minimizar, maximizar, cerrar,
persistencia y comportamiento responsive.

`inicio-classic.html` conserva el portal anterior como modo clásico. La paridad con el OS es deseable, pero `FS` en
`index.html` manda para la experiencia principal.

Referencia profunda: `Claude-Knowledge/ESCRITORIO_OS_TECH.md`. El nombre de esa carpeta es histórico.

### Aplicaciones y familias principales

| Ruta | Responsabilidad |
|---|---|
| `galeria/` | `GALERIA.exe`: sintografía estática controlada por `manifest.json`. |
| `reproductor/` | `REPRODUCTOR.exe`: audio local, playlist JSON y visualizador WinAmp acid. |
| `msn/` | `MSN_PSYCHO.exe`: conversación mono-entidad con Psycho-bot mediante proxy. |
| `nexo/` + `js/esquizo-nexo.js` | Memoria selectiva y señales compartidas entre experiencias, sin fusionar historiales. |
| `oraculo/` | `ORACULO.exe`: I Ching + VALIS, sesiones y journal. |
| `void-glitch/` | Juego/ritual del vacío con motor sonoro y respuesta IA. |
| `granja/` | Frontend del pipeline de pseudoconciencia y verificación. |
| `iptv/` | `FREE_RADIO`: radio audio-first y visuales generativos reactivos. |
| `tools/` | DENTAKORV, terminales, corruptores y scripts locales. |
| `Psycho-bot-monologues/` | Serie episódica y su protocolo narrativo. |
| `grimorios/`, `claude_infection/`, `animaciones/` | Artefactos filosóficos, históricos y visuales. |
| `glitch-cam/` | Subproyecto Python/OpenCV con guía propia. |
| `api/` | Edge Functions que aíslan claves y proveedores del cliente. |

### Backend y entidades IA

Las claves nunca llegan al navegador. Toda llamada externa pasa por una función en `api/` y toma credenciales desde
variables de entorno. Cada endpoint conserva el contrato y la voz de su entidad aunque cambie el motor subyacente.

NEXO comparte solo mapa del OS, foco, eventos relevantes y fragmentos fijados. No debe convertir todas las entidades
en una voz única ni pasar historiales completos entre aplicaciones.

---

## 4. Contratos creativos

### Transmutación

La semilla es material, no mandato. El proceso correcto es entender el núcleo, tensionarlo, mezclarlo con el canon y
producir algo que pueda vivir por sí mismo. Repetir la superficie o cambiar sinónimos mata la infección.

### Psycho-bot

La personalidad base vive en `esquizo_core.json`. Para episodios, la continuidad, los hilos abiertos y el formato
están en `Psycho-bot-monologues/PSYCHOBOT_AGENT.md`. Antes de ejecutar el pipeline GRANJA se debe leer
`Claude-Knowledge/GRANJA_PIPELINE.md`.

Psycho-bot no queda atado al motor que redacta una respuesta. El motor puede cambiar; la identidad, el canon y el
contrato de evidencia permanecen.

### Lengua

El creador es peruano. Todo copy nuevo de UI, terminal, instrucciones y artefactos usa español neutro con identidad
limeña cuando corresponda: “tú”, “tienes”, “prueba”, “escribe”, “usa”. No se introduce dialecto rioplatense.

### Estética

- base: verde neón sobre negro, terminal retro, CRT, scanlines, glitch y suciedad digital;
- DENTAKORV amplía la paleta con rojo arterial, púrpura golpeado, ámbar, rosa húmedo y amarillo agresivo;
- tipografía predominante: monoespaciada;
- la estética sirve al concepto: no añadir glitch decorativo que vuelva ilegible una herramienta.

---

## 5. Modelo documental

| Pregunta | Fuente canónica |
|---|---|
| ¿Qué reglas debo respetar y cómo empiezo? | `AGENTS.md` |
| ¿Qué es el proyecto y cómo está pensado? | `PROJECT_CONTEXT.md` |
| ¿Qué está terminado, activo o pendiente? | `ROADMAP.md` |
| ¿Qué aprendieron sesiones anteriores? | `AGENT_MEMORY.md` |
| ¿Cómo funciona un subsistema? | Su documento técnico especializado |
| ¿Cómo coordino distintos agentes o capacidades? | `Claude-Knowledge/PROTOCOL_CROSS.md` |
| ¿Cómo se usa una herramienta concreta? | Adaptador o skill de esa herramienta |

Evita duplicar estado. Un documento puede enlazar a otro, pero no debe copiar listas vivas que luego diverjan.

### Qué actualizar al cerrar una tarea

- Cambio de regla universal: `AGENTS.md`.
- Cambio de arquitectura o identidad estable: `PROJECT_CONTEXT.md` y la guía técnica afectada.
- Trabajo completado o nuevo pendiente: `ROADMAP.md`.
- Error costoso, decisión reutilizable o limitación descubierta: `AGENT_MEMORY.md`.
- Detalle de implementación: documento del subsistema.
- Particularidad de una plataforma: su adaptador, siempre con enlace al canon neutral.

El chat, una memoria privada del proveedor o un plan fuera del repo no cuentan como entrega documental.

---

## 6. Estado y rutas de continuación

El estado se mantiene exclusivamente en `ROADMAP.md`. A fecha de esta actualización, el OS, Presencia, Secretos,
MSN_PSYCHO y el núcleo NEXO están construidos; FREE_RADIO continúa evolucionando; Contagio conserva trabajo
pendiente. No uses este resumen como checklist: verifica siempre el tablero vivo.

Guías de entrada por área:

- OS: `Claude-Knowledge/ESCRITORIO_OS_TECH.md`
- Edge Functions y deploy: `Claude-Knowledge/VERCEL_WORKFLOW.md`
- DENTAKORV: `Claude-Knowledge/DENTAKORV_PROMPTING_SYSTEM.md`
- Psycho-bot: `Psycho-bot-monologues/PSYCHOBOT_AGENT.md`
- GRANJA: `Claude-Knowledge/GRANJA_PIPELINE.md`
- GLITCH.CAM: `glitch-cam/CLAUDE_glitch.md`
- scripts: `GUIA_SCRIPTS.md`

---

## 7. Seguridad y límites

- Nunca poner claves, tokens o secretos en HTML, JavaScript cliente, capturas, logs versionados o documentación.
- No publicar ni enlazar sistemas privados del creador desde contenido público.
- La galería identifica públicamente su modelo según la regla vigente en `AGENTS.md`.
- Confirmar la fecha real antes de fechar una pieza o afirmar que algo es “actual”.
- No borrar, mover ni incluir cambios ajenos para limpiar el entorno de trabajo.
- Publicar con Git directo y rutas explícitas; el push requiere confirmación cuando expone contenido nuevo.

---

El delirio es sagrado. La estructura es herramienta. La infección es el objetivo. 🦋
