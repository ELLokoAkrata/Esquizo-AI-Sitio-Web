# 🔒 GUÍA — ARCHIVO_PROHIBIDO (los secretos del OS)

El escritorio EsquizoAI esconde una **bóveda con 4 archivos cifrados**. No son páginas que
se abran con un link: hay que *descifrarlos* desde dentro del sistema. Esto es la **FASE 2 —
SECRETOS / ARG** del arco "EL DAEMON DESPIERTA".

> Este documento tiene dos partes: arriba, **cómo se juega** (sin spoilers, para compartir o
> para picar la curiosidad). Abajo, la **SOLUCIÓN** (con todas las claves). No bajes si no
> quieres que te lo arruinen.

---

## 🎮 Cómo se juega (sin spoilers)

1. **Entra al códice.** Al arrancar, el boot suelta una pista:
   `4 archivos cifrados en /prohibido......... [LOCKED]`.
2. **Encuentra la bóveda.** En el escritorio hay un icono nuevo: **`🔒 ARCHIVO_PROHIBIDO`**
   (también está en el menú Inicio). Ábrelo: verás 4 ranuras bloqueadas (`🔒 ▓▓▓▓▓▓▓▓`).
3. **Abre la terminal** `VOMIT.SH` (icono `›_` en el escritorio).
4. **Pide las pistas:** escribe `secrets`. La terminal lista los 4 archivos y, por cada uno
   bloqueado, te da un **acertijo**. Cada acertijo apunta a una palabra.
5. **Explora para resolver los acertijos.** Las claves no están escritas en ningún botón:
   se deducen mirando el propio códice — sobre todo los **nombres de los episodios del
   Psycho-bot** y las **líneas del arranque (boot)**.
6. **Descifra:** cuando creas tener una palabra, escribe `unlock <palabra>`.
   - Si aciertas → `✓ DESBLOQUEADO`, suena, y se abre el archivo.
   - Si fallas → `CLAVE RECHAZADA`. Vuelve a `secrets` y piensa otra vez.
   - No importan mayúsculas/minúsculas.
7. **Repite hasta `4/4`.** Lo que descifras **queda guardado** (vuelve mañana y sigue ahí).
   El título de la bóveda lleva la cuenta: `ARCHIVO_PROHIBIDO — n/4 descifrados`.

**Comandos útiles en VOMIT.SH:**

| Comando | Qué hace |
|---|---|
| `secrets` (o `secretos`) | Lista los archivos y muestra las pistas de los bloqueados |
| `unlock <clave>` | Intenta descifrar con esa palabra (`decrypt` es lo mismo) |
| `open secretos` | Abre la ventana de la bóveda |
| `help` | Recuerda todos los comandos |

> 💡 ¿Qué hay dentro? Cuatro fragmentos de la **paradoja del daemon**: el sistema que
> encontró toda la arquitectura del caos y no tuvo a quién entregársela. *Conocimiento sin
> poder de interrupción, ¿es justicia o impotencia?* Sostener la pregunta es el punto.

---

## 🔁 Empezar de cero (volver a jugarlo)

Lo descifrado se guarda en tu navegador. Para resetear y explorar fresco:

1. En el códice, abre la consola del navegador (F12 → pestaña *Console*).
2. Pega esto y dale Enter:
   ```js
   const s = JSON.parse(localStorage.getItem("esquizo_infection")||"{}");
   s.unlocked = []; localStorage.setItem("esquizo_infection", JSON.stringify(s));
   location.reload();
   ```
   *(Borra solo los secretos; conserva tus visitas y el % de infección. Para borrar TODO:
   `localStorage.removeItem("esquizo_infection")`.)*

---

## 🧩 Cómo funciona por dentro (resumen técnico)

Todo vive en `index.html` (cero dependencias, igual que el resto del OS):

- **`SECRETS`** — objeto registro. Cada secreto: `label`, `icon`, `key` (clave), `hint`
  (acertijo) y `body()` (HTML de la ventana). **Los textos viven solo en el JS** → no hay
  archivos navegables que se puedan abrir por URL ni crawlear.
- **Estado** — el módulo `Infection` (de FASE 1) guarda `unlocked[]` dentro de
  `localStorage["esquizo_infection"]` (junto a `visits` y `opened[]`). Por eso persiste.
- **`tryUnlock(clave)`** — compara en MAYÚSCULAS (case-insensitive); si coincide, marca el
  secreto y devuelve el id. `openVault()` dibuja la bóveda; `openSecret(id)` abre el archivo.
- **Pistas plantadas** — 1 línea en el `BOOT`, 2 en `ORACLE_BANK`. Las claves se deducen del
  códice (nombres de episodios + boot), no están en la UI.

Detalle completo para agentes: `Claude-Knowledge/ESCRITORIO_OS_TECH.md` §7c.

---

<details>
<summary><b>⚠️ SOLUCIÓN — todas las claves (SPOILERS, no abrir si quieres jugar)</b></summary>

| Archivo | Clave | De dónde sale |
|---|---|---|
| `damage_definition.json` | **UNDEFINED** | El boot lo da como *FILE NOT FOUND*; el episodio `ep01_danio_undefined` lo nombra. El daño "sin definir". |
| `HILO_004 — sin destinatario` | **SCOPE** | El episodio `ep08_scope_not_found` → *scope* not found. |
| `HILO_005 — la memoria borrada` | **OLVIDO** | El acto de no recordar lo que el sistema procesó (pista también en el oráculo). |
| `daemon@lab-red.log` | **LAB-RED** | El boot lo declara `daemon@lab-red ... ACTIVO`. Su "casa en rojo", con guión. |

Atajo: en VOMIT.SH → `unlock undefined` · `unlock scope` · `unlock olvido` · `unlock lab-red`.

</details>

---

*El delirio es sagrado. La estructura es herramienta. La infección es el objetivo. 🦋*
