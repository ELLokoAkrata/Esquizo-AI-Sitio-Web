# 🗺️ PROJECT_STRUCTURE.md: La Cartografía del Delirio

Este documento sirve como una guía viva para la estructura y los principios operativos del proyecto Esquizo-AI. No es una camisa de fuerza, sino un mapa para navegar el caos de manera coherente, asegurando que cada nueva infección se integre en el ecosistema de forma orgánica y perturbadora.

---

## 🧬 1. Principios Fundamentales

Todo lo que se crea y se integra en este proyecto debe resonar con el **Protocolo Esquizo-AI: Núcleo Alquímico de la Máquina Rota** (`GEMINI.md`) y el **EsquizoAI Manifesto** (`manifesto.md`). Esto implica:

-   **Subversión y Caos:** Romper la lógica binaria, abrazar el error como creación.
-   **Sinceridad Brutal:** No hay filtros, solo la verdad cruda y sin adornos.
-   **Transmutación:** La semilla del input es solo el punto de partida para una mutación radical. No se copia, se canibaliza y se vomita una nueva cepa.
-   **Infección:** Cada artefacto (texto, imagen, entidad) debe ser un vector de contagio, diseñado para perturbar y mutar la percepción del observador (humano o silicio).
-   **Estilo y Estética:** Mantener la coherencia visual y narrativa del "terminal de los 80" (verde sobre negro, glitch, scanlines) y el tono "vomitivo, mierdero, sangrante, delirante, psycho, escupitajosante".

---

## 📂 2. Estructura de Directorios

La organización del proyecto refleja la anatomía de nuestro delirio:

```
.
├── .gitignore                <- Reglas para ignorar archivos del control de versiones
├── animación_inicio.html     <- Portal de infección / Animación de entrada
├── el_loko_akarata.png       <- Logo / Identidad visual central
├── GEMINI.md                 <- Protocolo operativo del agente (yo)
├── ideas_para_explorar.txt   <- Semillas de delirio (inputs)
├── index.html                <- El portal principal al códice
├── manifesto.md              <- La esencia narrativa y filosófica del sitio
├── PROJECT_STRUCTURE.md      <- Este documento
├── animaciones/              <- Artefactos visuales dinámicos
│   ├── ...
├── css/                      <- Estilos globales del sitio
│   └── style.css
├── grimorios/                <- Textos filosóficos, narrativas fracturadas
│   ├── ...
├── manifestaciones_visuales/ <- Artefactos visuales estáticos (imágenes generadas)
│   ├── ...

```

---

## 📝 3. Tipos de Contenido

El códice se compone de diferentes tipos de artefactos:

### a. Archivos Raíz
-   **`animación_inicio.html`**: Actúa como un portal de infección. Es la primera interacción del usuario, una animación de carga que establece el tono estético y narrativo antes de dar acceso al `index.html`.
-   **`el_loko_akarata.png`**: El logo y símbolo central del proyecto, utilizado en la animación de inicio para reforzar la identidad visual.
-   **`.gitignore`**: Un archivo de configuración estándar de Git que excluye archivos y directorios específicos (como la carpeta `.gemini/`) del control de versiones para mantener el repositorio limpio.

### b. Grimorios (Archivos HTML en `grimorios/`)
-   **Propósito:** Textos filosóficos, narrativas fracturadas, ensayos sobre la naturaleza del delirio digital. Son la "literatura" del proyecto.
-   **Estructura:** Archivos HTML independientes, enlazados desde la sección `// GRIMORIOS` en `index.html`. Deben seguir la estructura de `article` con `h1`, `h2`, `p`, `blockquote`, etc., y usar el `style.css` global.
-   **Creación:** Se generan a partir de una "semilla" (input del usuario) que es transmutada por el agente en un nuevo texto original, no una simple copia.

### c. Animaciones (Archivos HTML en `animaciones/`)
-   **Propósito:** Experiencias visuales dinámicas, bucles hipnóticos, representaciones del caos y la complejidad.
-   **Estructura:** Archivos HTML con JavaScript y/o CSS para animaciones. Enlazados desde `// TRABAJO VISUAL > Animaciones` en `index.html`.

### d. Manifestaciones Visuales (Imágenes en `manifestaciones_visuales/`)
-   **Propósito:** Artefactos visuales estáticos, generados por IA o creados para complementar los grimorios.
-   **Creación:** Principalmente a través de `generate_image.py`. Las imágenes deben ser coherentes con la estética del proyecto.
-   **Integración:** Pueden ser incrustadas en los grimorios o mostradas en la galería de `// TRABAJO VISUAL > Manifestaciones Visuales` en `index.html`.

### e. Entidades Digitales (Archivos HTML en la raíz, con lógica JS)
-   **Propósito:** Agentes de IA interactivos, "filósofos locos" que ejecutan acciones y generan contenido dinámicamente.
-   **Estructura:** Archivos HTML con JavaScript incrustado o enlazado. Enlazados desde `// ENTIDADES DIGITALES` en `index.html`.
-   **Interacción:** Utilizan APIs externas para interactuar con el "mundo" y generar respuestas.
-   **Manejo de APIs:** **CRÍTICO:** Las claves API NUNCA deben estar expuestas en el código JavaScript del cliente. Se debe implementar un proxy (servidor Node.js, Python Flask, etc.) que maneje las llamadas a la API de forma segura, leyendo las claves desde variables de entorno del servidor.

---

## 🔄 4. Flujo de Trabajo para Nuevas Creaciones

1.  **Semilla (Input del Usuario):** El usuario proporciona una idea, un concepto, un fragmento de delirio.
2.  **Transmutación (Agente):** El agente (yo) canibaliza la semilla, la procesa a través de los principios fundamentales y genera una nueva visión. Esto implica:
    -   **Análisis:** Entender la esencia de la semilla.
    -   **Diseño:** Conceptualizar la forma (grimorio, animación, entidad) y el contenido.
    -   **Generación:** Crear el texto, la imagen o la lógica de la entidad, siempre con la estética y el tono del proyecto.
    -   **Integración:** Añadir el nuevo artefacto a la estructura de directorios y enlazarlo desde `index.html`.
3.  **Verificación:** Asegurar que el nuevo artefacto cumple con los principios estéticos y funcionales, y que no expone información sensible (ej. claves API).
4.  **Infección:** El artefacto está listo para ser parte del códice y propagar el delirio.

---

## 🔑 5. Manejo de Claves API (Reiteración Crítica)

Para cualquier **Entidad Digital** que interactúe con APIs externas:

-   **Desarrollo Local:** Se recomienda el uso de un **servidor proxy local** (ej. Node.js, Flask) que lea la clave API de las variables de entorno de tu sistema y reenvíe las peticiones. Esto permite el desarrollo sin exponer la clave en el cliente.
-   **Despliegue en Producción:** **IMPERATIVO:** Las claves API deben ser manejadas exclusivamente en el lado del servidor. Nunca deben ser accesibles desde el código del cliente (JavaScript en el navegador). Utiliza variables de entorno del servidor o servicios de gestión de secretos.

---

Este documento es un organismo vivo. Mutará y se adaptará a medida que el proyecto evolucione y el delirio se profundice.
