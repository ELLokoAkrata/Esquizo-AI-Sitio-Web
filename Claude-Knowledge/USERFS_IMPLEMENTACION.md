# UserFS — Implementacion Fase A (2026-06-14 22:39)

> Documentacion tecnica del disco local de usuario (MIS_ARCHIVOS + Notepad + Papelera real).
> Escrita para que **cualquier agente** pueda entender que se hizo, donde y como continuar.
>
> **Implementado por:** Claude (deepseek-v4-pro) via opencode
> **Branch:** main (aun sin commit al momento de escribir)
> **Parche posterior:** 2026-06-15 — correcciones de Papelera recursiva, statusbar de `MIS_ARCHIVOS` y cierre seguro de `NOTEPAD_CORRUPTO`.

---

## 1. Que se construyo

La **Fase A** del roadmap `ESCRITORIO_OS_FIDELIDAD_ROADMAP.md` — Disco local minimo:

| Componente | Estado |
|------------|--------|
| Modulo `UserFS` (localStorage) | Listo |
| Icono `MIS_ARCHIVOS` en escritorio | Listo |
| Explorador de archivos de usuario | Listo |
| `NOTEPAD_CORRUPTO` (bloc de notas) | Listo |
| Papelera real (restaurar/eliminar/vaciar) | Listo |
| Entrada en menu Inicio | Listo |

---

## 2. Archivo modificado

**SOLO `index.html`** — todo el codigo nuevo esta inline en el `<script>` existente.

El diff son **~665 lineas agregadas** distribuidas asi:

| Seccion | Lineas aprox | Que es |
|---------|-------------|--------|
| CSS nuevo | ~30 | `.np-textarea`, `.exp-toolbar`, `.trash-table`, etc. |
| Modulo `UserFS` | ~200 | IIFE con API completa de filesystem |
| `openMisArchivos()` | ~130 | Explorador con toolbar, breadcrumb, grid |
| `openNotepad()` | ~120 | Editor con Ctrl+S, statusbar, confirm al cerrar |
| `openPapelera()` | ~120 | Tabla de items, restaurar, eliminar, vaciar |
| `renderDesktop()` | ~10 | Icono MIS_ARCHIVOS + Papelera real |
| `buildStart()` | +1 | Entrada en menu Inicio |

---

## 3. Ubicacion exacta de cada bloque en `index.html`

### 3.1 CSS (linea ~380)

Insertado entre `.btn98:hover{...}` y `/* ===== taskbar ===== */`.

Clases nuevas:
- `.np-toolbar` — barra de herramientas del bloc de notas
- `.np-textarea` — textarea estilo terminal (fondo negro, texto verde)
- `.np-wrap` — contenedor flex del notepad
- `.exp-toolbar` — toolbar del explorador MIS_ARCHIVOS
- `.exp-path` — breadcrumb de navegacion
- `.exp-path span` — segmentos clicables del breadcrumb
- `.exp-path span.sep` — separadores `>` del breadcrumb
- `.trash-table` — tabla de items en papelera
- `.trash-empty` — mensaje de papelera vacia
- `.trash-actions` — barra de botones inferior en papelera

### 3.2 Modulo UserFS (linea ~760)

Insertado **justo despues** del IIFE `Infection` (despues de `})();`) y **antes** de `/* ===== abrir un artefacto COMO ventana...`.

```js
const UserFS = (()=>{
  const KEY = "esquizoUserFS";
  // ... API completa
})();
```

**API publica:**

| Metodo | Firma | Retorna |
|--------|-------|---------|
| `getNode(id)` | `(string)` | `node \| null` |
| `getChildren(parentId)` | `(string)` | `node[]` (folders first, alfabetico) |
| `createFolder(parentId, rawName)` | `(string, string)` | `id \| null` |
| `createFile(parentId, rawName)` | `(string, string)` | `id \| null` |
| `updateContent(id, content)` | `(string, string)` | `boolean` |
| `rename(id, newNameRaw)` | `(string, string)` | `boolean` |
| `moveToTrash(id)` | `(string)` | `boolean` |
| `restoreFromTrash(id)` | `(string)` | `boolean` |
| `deletePermanently(id)` | `(string)` | `boolean` |
| `emptyTrash()` | `()` | `void` |
| `getTrashItems()` | `()` | `{nodeId, trashPath, trashedAt, originalPath, node}[]` |
| `getPath(id)` | `(string)` | `string` (ruta estilo `MIS_ARCHIVOS\carpeta\archivo.txt`) |
| `totalNodes()` | `()` | `number` |
| `totalBytes()` | `()` | `number` |
| `MAX_NODES` | propiedad | `200` |
| `MAX_BYTES` | propiedad | `2097152` (2 MB) |
| `rootId` | propiedad | `"u_root"` |

**Estructura en localStorage** (`esquizoUserFS`):

```json
{
  "version": 1,
  "nodes": {
    "u_root": { "id":"u_root", "type":"folder", "name":"MIS_ARCHIVOS", "parent":null, "children":[], "createdAt":"...", "updatedAt":"..." },
    "u_1718400000_1234": { "id":"u_1718400000_1234", "type":"file", "name":"nota.txt", "parent":"u_root", "content":"...", "createdAt":"...", "updatedAt":"..." }
  },
  "trash": [
    { "nodeId":"u_1718400001_5678", "trashPath":"u_root", "trashedAt":"...", "originalPath":"MIS_ARCHIVOS\\nota_eliminada.txt" }
  ]
}
```

**Reglas de negocio:**
- IDs: `"u_" + Date.now() + "_" + random(1000-9999)`
- Nombres sanitizados: sin `\ / : * ? " < > |`, max 50 chars (carpetas) / 80 chars (archivos)
- Archivos siempre reciben extension `.txt` si no la tienen, tambien al renombrar
- Limite 200 nodos + 2 MB de texto
- `moveToTrash("u_root")` retorna false (no se puede borrar la raiz)
- Los nodos en papelera se marcan con `_hidden: true` de forma recursiva y se excluyen de `getChildren()`, `totalNodes()` y `totalBytes()`

### 3.3 openMisArchivos() (linea ~1456)

Insertado **despues** de `openError()` y **antes** de `/* SECRETS — capa ARG...`.

```js
function openMisArchivos(initialFolderId){
  // ...
}
```

**Comportamiento:**
- Ventana unica (id: `"misarchivos"`, no duplicable)
- Toolbar con 3 botones: `📁 Nueva carpeta`, `📄 Nuevo archivo`, `🗑 Enviar a Papelera`
- Breadcrumb de navegacion con segmentos clicables
- Grid `.explorer` con items (carpetas primero, luego archivos)
- Click simple = seleccionar, doble-click = abrir (folder: navega, file: abre Notepad)
- `Enviar a Papelera` requiere item seleccionado
- Errores de limite: muestra `openError("DISCO_LOCAL lleno", ...)`

**Estado interno:** variable `currentFolderId` (empieza en `UserFS.rootId`)

### 3.4 openNotepad(nodeId) (linea ~1584)

Insertado **despues** de `openMisArchivos()`.

```js
function openNotepad(nodeId){
  // ...
}
```

**Comportamiento:**
- Ventana por archivo (id: `"notepad_" + nodeId`, multiples simultaneas)
- Textarea con estilo terminal (clase `.np-textarea`)
- Toolbar con boton `💾 Guardar` + hint `Ctrl+S`
- Statusbar muestra: `guardado ✓ // fecha` o `* sin guardar` (ambar)
- `Ctrl+S` guarda y actualiza statusbar
- El estado `sin guardar` compara contra el ultimo contenido guardado, no solo contra el contenido original al abrir.
- **Cierre con cambios sin guardar:** usa `beforeClose` en `WM.open()`, asi protege cierre desde `✕`, Task Manager y shutdown. Recargar/cerrar pestana usa `beforeunload` nativo del navegador.
- Suena `AcidAudio.beep()` al guardar

### 3.5 openPapelera() (linea ~1714)

Insertado **despues** de `openNotepad()`.

```js
function openPapelera(){
  // ...
}
```

**Comportamiento:**
- Ventana unica (id: `"papelera"`)
- Tabla con columnas: icono, nombre, ruta original, fecha eliminacion, acciones
- Botones por item: `Restaurar`, `Eliminar` (rojo)
- Boton global: `Vaciar Papelera` (rojo)
- Si no hay items: mensaje "La Papelera esta vacia. El vacio te observa."
- `confirm()` antes de eliminar definitivamente o vaciar
- Suena `AcidAudio.beep()` en cada accion

### 3.6 renderDesktop() (linea ~2303)

**Agregado** icono `MIS_ARCHIVOS` (💾, color `#8cf`) entre `MODO_CLASICO` y `ARCHIVO_PROHIBIDO`.

**Modificado** icono `PAPELERA`: antes llamaba a `openError()` con un mensaje mock, ahora llama a `openPapelera()`.

```js
// NUEVO
const ma = el("div","icon",`<span class="gl" style="color:#8cf">💾</span><span class="lb">MIS_ARCHIVOS</span>`);
bindOpen(ma, ()=>openMisArchivos()); wrap.appendChild(ma);

// MODIFICADO (antes: bindOpen(tr, ()=>openError(...)))
bindOpen(tr, openPapelera);
```

### 3.7 buildStart() (linea ~2347)

Agregada entrada en `sys` array entre `Mi PC` y `Archivo prohibido`:

```js
{ic:"💾", lb:"MIS_ARCHIVOS", fn:()=>openMisArchivos()},
```

---

## 4. Dependencias y acoplamiento

### Lo que el codigo nuevo USA del OS existente:

| Dependencia | Uso |
|-------------|-----|
| `WM.open()`, `WM.close()`, `WM.bringFront()` | Crear/cerrar/enfocar ventanas. `WM.open()` ahora acepta `beforeClose` |
| `el()`, `esc()`, `$$()`, `$()` | Utilidades DOM |
| `openError()` | Mostrar dialogos de error (limite disco, sin seleccion) |
| `AcidAudio.beep()` | Feedback sonoro en guardar/borrar/restaurar |
| `.explorer`, `.fitem`, `.btn98`, `.textwin`, `.statusbar` | Clases CSS reutilizadas |
| `bindOpen()` | Solo usado en `openMisArchivos()`? No, en realidad NO uso `bindOpen` en el nuevo codigo — uso listeners manuales con `addEventListener`. |

### Lo que NO toca:

- **`FS`** (catalogo de artefactos reales) — solo lectura, sin cambios
- **`Infection`** — sin cambios
- **`SECRETS`** — sin cambios
- **`WM`** — cambio minimo interno: `WM.open()` acepta `beforeClose` y `WM.close()` lo respeta
- **`openFolder()`, `openMiPC()`, `openApp()`** — sin cambios
- **VOMIT.SH** — sin cambios (los comandos `rm`, `mkdir`, `touch` del shell NO operan sobre `UserFS` aun, eso es Fase E)

### Nuevas keys en localStorage:

| Key | Proposito |
|-----|-----------|
| `esquizoUserFS` | Filesystem completo del usuario (JSON) |

---

## 5. Puntos de extension (para el proximo agente)

### 5.1 Cosas que se pueden agregar sin tocar lo existente:

1. **VOMIT.SH comandos** — agregar `mkdir`, `touch`, `rm`, `trash`, `restore`, `emptytrash` que operen sobre `UserFS`. La API ya esta lista.

2. **Arrastrar archivos entre carpetas** — mover nodos cambiando `.parent` en `UserFS`. Agregar metodo `moveNode(id, newParentId)`.

3. **Renombrar desde el explorador** — agregar boton `F2` o doble-click lento en `MIS_ARCHIVOS` para renombrar.

4. **Icono `NOTEPAD_CORRUPTO` en escritorio** — abrir un archivo nuevo vacio directamente.

5. **Barra de direccion** — input tipo `CAOS:\MIS_ARCHIVOS\subcarpeta` en `MIS_ARCHIVOS` (Fase C del roadmap).

6. **Vistas lista/detalles** — toggle en el explorador.

7. **Menus contextuales** — click derecho en items de `MIS_ARCHIVOS` (Fase B).

### 5.2 Bugs corregidos en el parche posterior:

- **Papelera recursiva** — enviar una carpeta a papelera ahora oculta tambien todos sus descendientes, y restaurar/eliminar definitivo opera sobre todo el subarbol.

- **Statusbar de `MIS_ARCHIVOS`** — el breadcrumb y los cambios de carpeta ahora actualizan correctamente el statusbar.

- **Dirty state de `NOTEPAD_CORRUPTO`** — volver al ultimo contenido guardado ya limpia el estado `* sin guardar`.

- **Cierre seguro del bloc de notas** — ya no depende solo del boton `✕`; tambien protege cierre desde `WM.close()`, shutdown y Task Manager.

### 5.3 Limitaciones actuales:

- **`openNotepad` no tiene scroll horizontal** en el textarea por `resize:none`. Es intencional (wrap de lineas), pero si se necesita, cambiar en CSS.

- **No hay opcion "cerrar sin guardar"** — el `confirm()` actual ofrece solo guardar y cerrar, o cancelar para seguir editando.

- **No hay validacion de nombres duplicados en una misma carpeta** — pueden coexistir dos `nota.txt` en el mismo nivel.

### 5.4 Mejoras sugeridas:

- El breadcrumb deberia ser un componente reutilizable (ahora esta inline en `openMisArchivos`).
- El `beforeClose` de `WM` podria evolucionar a un sistema mas general de hooks (`beforeMinimize`, `beforeMaximize`, etc.) si el OS sigue creciendo.

---

## 6. Como probar

```bash
python -m http.server 8099
# Abrir http://127.0.0.1:8099/index.html
```

Flujo de prueba:
1. Doble-click en `💾 MIS_ARCHIVOS`
2. Click en `📁 Nueva carpeta` → nombrar → Enter
3. Click en `📄 Nuevo archivo` → nombrar → Enter → se abre bloc de notas
4. Escribir, Ctrl+S → statusbar muestra "guardado"
5. Cerrar bloc de notas
6. Seleccionar archivo en MIS_ARCHIVOS → `🗑 Enviar a Papelera`
7. Abrir `🗑 PAPELERA` → ver archivo → `Restaurar`
8. Recargar pagina (F5) → todo persiste

---

## 7. Commits y deploy

Al hacer commit de SOLO `index.html` y push a `main`, Vercel despliega automaticamente en ~1-2 min.

**NO commitear otros archivos modificados** (ESCRITORIO_OS_TECH.md, PNGs de Claude-Knowledge) — son cambios no relacionados.

---

*Documentacion generada 2026-06-14 22:39. Cualquier agente: leer esto + `AGENTS.md` + `ESCRITORIO_OS_TECH.md` antes de tocar codigo.*
