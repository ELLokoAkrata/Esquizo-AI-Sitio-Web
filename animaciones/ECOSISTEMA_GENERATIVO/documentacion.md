# Documentación del Proyecto "Experimento Generativo Tech-Glitch"

Este documento tiene como objetivo explicar detalladamente el funcionamiento de cada parte del código para que puedas entenderlo al 100%.

---

## 1. Descripción General

El proyecto es una experiencia generativa interactiva que combina gráficos en 2D con síntesis y procesamiento de audio usando [Tone.js](https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js). Se simulan efectos visuales en un elemento `<canvas>` (como partículas psicodélicas, efectos Matrix, remolinos y simulación de Game of Life) y se genera una experiencia sonora modulada según diferentes fases (introducción, construcción, pico, vórtice, lluvia digital y glitch final).

---

## 2. Estructura del Proyecto

- **ecosistema.html**  
  Contiene la estructura HTML de la experiencia, con la interfaz de usuario (botones, contenedores y displays) y la inclusión de los archivos de estilo y el script principal.

- **style.css**  
  Define la apariencia visual de la interfaz y los elementos de la experiencia (botones, textos, canvas, etc.). Se utilizan gradientes, animaciones y estilos para acentuar el look tech-glitch.

- **script.js**  
  Es el núcleo funcional del proyecto y contiene:
  - La configuración y manipulación del canvas.
  - La lógica de la simulación de Game of Life.
  - La generación de partículas y efectos visuales (incluyendo el efecto Matrix).
  - La configuración de nodos de audio y patrones musicales con Tone.js.
  - La gestión de fases de la experiencia (cambio de intensidad, distorsión y filtros).
  - Manejo de eventos (teclas, redimensionamiento y botones de pausa/reinicio).

---

## 3. Documentación Detallada de `script.js`

### Variables Globales y Configuración Inicial

- **Selección de elementos HTML:**  
  Se obtienen referencias a los elementos por su ID:
  - `startButton`, `pauseContainer`, `canvas`, `visualizer`, `timeDisplay`, `phaseDisplay`, `restartButton`, `resetButton`.
  
- **Configuración del canvas y visualizador:**  
  Se asigna el ancho y alto del canvas según el tamaño de la ventana. El visualizador se configura con dimensiones fijas.

- **Variables de Control:**  
  - `mainNodes`: Contenedor de los nodos de audio.
  - `particles`: Arreglo para partículas psicodélicas.
  - `matrixDrops`: Arreglo para simular el efecto de lluvia digital ("Matrix").
  - `isPaused`, `startTime`, `elapsedTime` y `phase`: Variables para controlar el flujo de la experiencia y la fase actual.

---

### Simulación de Game of Life

- **Constantes:**  
  - `GOL_COLS` y `GOL_ROWS`: Número de columnas y filas, calculados en función del tamaño del canvas.
  - `TILE_WIDTH` y `TILE_HEIGHT`: Dimensiones de cada celda en la cuadrícula.

- **Funciones:**
  - `initGOL()`: Inicializa el grid de Game of Life asignando valores aleatorios (0 o 1) a cada celda.
  - `seedGOL()`: “Siembra” el grid fijando algunas celdas en 1.
  - `updateGOL()`: Aplica las reglas del Juego de la Vida para actualizar el grid, utilizando la función `countNeighbors()`.
  - `countNeighbors(x, y)`: Cuenta los vecinos vivos de una celda y devuelve la suma (restando el valor de la celda actual).

---

### Generación de Partículas Psicodélicas

- **createParticle(amp, x, y, hue):**  
  Crea una partícula con propiedades aleatorias o basadas en parámetros (posición, ángulo, velocidad, color, tamaño, vida). Estas partículas se usan para crear efectos visuales dinámicos relacionados con la amplitud de la señal de audio.

---

### Efecto Matrix

- **initMatrixEffect():**  
  Inicializa el arreglo `matrixDrops` que simula gotas de caracteres cayendo (efecto “Matrix”) en el canvas, dividiendo la pantalla en columnas.
  
- **generateRandomChars(length):**  
  Genera una cadena de caracteres aleatorios basada en un conjunto predefinido. Se usa para cada gota que se dibuja en el efecto Matrix.

---

### Configuración y Control de Audio (Tone.js)

En `startMainExperience()`:
- **Configuración de Nodos de Audio:**  
  Se crean y conectan diversos nodos:
  - `Distortion`, `Filter`, `Reverb` y `Phaser` para el procesamiento de sonido.
  - Síntesis de percusión (kick), síntesis FM (`fmSynth`) y sintetizador de bajo (`bass`), además de un sintetizador de ruido (`impact`).
  
- **Analizadores y Patrones Musicales:**
  - Se emplean `Tone.Analyser` para obtener datos de la forma de onda y frecuencia.
  - Patrones (`Tone.Loop`, `Tone.Pattern`, `Tone.Sequence`) programan la secuencia rítmica.
  
- **Control de Transporte:**  
  Se configura y arranca el transporte de Tone.js, se ajusta el BPM y se inicia la secuencia evolutiva.

---

### Gestión de Fases (updatePhase)

La función `updatePhase()` controla el flujo de la experiencia basándose en el tiempo transcurrido (`elapsedTime`) y define seis fases:
  - **intro:** Fase inicial.
  - **build:** Fase de construcción, donde se incrementa progresivamente la intensidad (BPM, distorsión y frecuencia del filtro).
  - **peak:** Fase de pico con máxima intensidad.
  - **vortex:** Fase de vórtice, donde se modifican gradualmente los parámetros para simular un remolino.
  - **matrix:** Fase donde se activa el efecto de lluvia digital (Matrix).
  - **glitch:** Fase final de glitch con parámetros extremos (BPM bajo, distorsión alta).

Cada fase ajusta parámetros de audio (distorsión, frecuencia del filtro y phaser) y actualiza la visualización (color, velocidad y comportamiento de partículas).

---

### Función de Animación Principal (animate)

- **Ciclo de Animación:**  
  Utiliza `requestAnimationFrame` para un loop constante en el cual:
  - Se actualiza y muestra el tiempo transcurrido.
  - Se dibuja un fondo con desenfoque de movimiento.
  - Se obtienen los datos de audio de los analizadores.
  - Se generan nuevas partículas basadas en la amplitud de la señal.
  - Se dibuja la simulación de Game of Life (excepto en la fase Matrix).
  - Se aplican efectos especiales basados en la fase actual (por ejemplo, remolinos en la fase vortex, efecto Matrix, etc.).
  - Se actualiza el visualizador de audio tanto la forma de onda como las barras de frecuencia.

---

### Manejo de Eventos

- **Eventos de Teclado:**
  - La tecla `'F'` alterna entre pausar y resumir la experiencia.
  - La tecla `'1'` activa un efecto de distorsión máxima temporal.
  - La tecla `'2'` genera una explosión de partículas.

- **Eventos de Botones:**  
  - `startButton`: Inicia la experiencia.
  - `restartButton`: Reanuda de la pausa.
  - `resetButton`: Recarga la página para reiniciar la experiencia.

- **Evento de Redimensionamiento:**  
  Se actualizan las dimensiones del canvas y se reinicia el efecto Matrix cuando el tamaño de la ventana cambia.

---

## 4. Estilos en `style.css`

- **Estilos Globales y Body:**  
  Se define un fondo basado en un gradiente, se centra el contenido usando Flexbox, y se aplican efectos de brillo mediante `text-shadow`.

- **Canvas y Elementos UI:**  
  El canvas (donde se dibujan los efectos) se posiciona en absoluto para ocupar toda la pantalla.  
  Los contenedores de UI (para iniciar la experiencia, pausa, visualizador y displays de tiempo/fase) tienen estilos con transparencia, bordes y animaciones (como `titleGlow` y `pauseGlow`) para reforzar el estilo tech-glitch.

- **Botones y Transiciones:**  
  Los botones tienen animaciones de transformación y sombra para incentivar la interacción del usuario.

---

## 5. Estructura HTML en `ecosistema.html`

- **Estructura del Documento HTML:**
  - Se incluye el `<head>` con enlaces al archivo de estilos y a la librería Tone.js.
  - El `<body>` contiene:
      - Un contenedor de UI (`#uiContainer`) con título, subtítulo, instrucciones y botón para iniciar.
      - Un contenedor de pausa (`#pauseContainer`) con funciones para continuar o reiniciar.
      - Dos `<canvas>`: uno para los efectos visuales y otro para el visualizador de audio.
      - Elementos para mostrar el tiempo y la fase actual.
  - Se importa el script `script.js` al final del `<body>`.

---

## 6. Conclusión

Este proyecto integra de forma interactiva audio y gráficos generativos. La documentación anterior detalla cada módulo, función y sección del código para que puedas comprender cómo se combinan los elementos de audio (mediante Tone.js) y las visualizaciones (usando el canvas y animaciones dinámicas).

Revisa cada sección para entender de qué forma se generan los efectos visuales, cómo se configura y controla el audio, y cómo se orquesta la evolución de la experiencia a lo largo del tiempo.

---

¡Ahora cuentas con una guía completa para entender y modificar el código según tus necesidades!