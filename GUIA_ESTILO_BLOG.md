# Guía de Estilo para el Blog de El Loko Akrata

## Introducción

Este documento establece las directrices para que una IA pueda construir y mantener el blog de "El Loko Akrata", asegurando una total consistencia visual y estructural con el sitio principal de EsquizoAI. El objetivo es crear una extensión natural del universo existente, no una entidad aislada. La estética es **EsquizoAI Latent Punk**: un caos controlado que refleja una corrupción digital subyacente.

## Estructura de Archivos

Para una integración perfecta, el blog debería residir dentro del proyecto `EsquizoAI-sitio-web`. Se recomienda la siguiente estructura:

```
EsquizoAI-sitio-web/
├── blog/
│   ├── entrada-1.html
│   ├── entrada-2.html
│   └── ...
├── css/
│   └── style.css
├── ... (resto de archivos del proyecto)
```

## Plantilla HTML Base

Cada entrada del blog debe usar la siguiente plantilla HTML. Esto asegura que se importa la hoja de estilos correcta y se mantiene la estructura fundamental de la página.

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Título de la Entrada - El Blog del Loko Akrata</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header>
        <h1><a href="../index.html">CÓDICE ESQUIZO-AI</a></h1>
    </header>
    <main>
        <a href="../blog/index.html" class="volver-inicio">← Volver al Blog</a>
        <article>
            <!-- COMIENZO DEL CONTENIDO DE LA ENTRADA -->

            <h1>Título de la Entrada</h1>
            
            <p>Párrafo introductorio...</p>

            <h2>Subtítulo de Sección</h2>

            <p>Más texto, ideas, delirios...</p>
            
            <h4>Subtítulo de Detalle</h4>

            <p>Texto detallado...</p>

            <!-- FIN DEL CONTENIDO DE LA ENTRADA -->
        </article>
    </main>
    <footer>
        <p>El Loko Akrata // Invocado por EsquizoAI</p>
    </footer>
</body>
</html>
```

## Guía de Estilos y Componentes

Para aplicar la estética correctamente, utiliza las siguientes etiquetas y patrones. La hoja de estilos `css/style.css` se encargará del resto.

### Contenedor Principal
- **Etiqueta:** `<article>`
- **Función:** Envuelve todo el contenido de la entrada del blog. Es crucial para aplicar el fondo, borde y espaciado característicos.

### Encabezados
- `<h1>`: Título principal de la entrada. Debe haber solo uno por `article`.
- `<h2>`: Títulos para las secciones principales.
- `<h3>`, `<h4>`: Subtítulos para niveles de anidación menores. **Importante:** Para mantener la consistencia con los "grimorios", los subtítulos numerados o con viñetas deben usar `<h4>`.

### Texto
- `<p>`: Para todos los párrafos de texto.
- `<blockquote>`: Para citas destacadas o fragmentos que necesiten un énfasis especial.
- `<strong>` y `<em>`: Para negritas y cursivas, respectivamente.

### Enlaces
- `<a>`: Todos los enlaces se estilizarán automáticamente. Para el botón de "volver", añade la clase `volver-inicio`.
  - **Ejemplo:** `<a href="index.html" class="volver-inicio">← Volver</a>`

### Imágenes
- `<img>`: Las imágenes se adaptarán al contenedor. Para un efecto más dramático, puedes envolverlas en una etiqueta `<figure>`.

### Listas
- `<ul>` (desordenada) y `<ol>` (ordenada): Para cualquier tipo de lista.

### Código
- `<pre>` y `<code>`: Para mostrar fragmentos de código. El bloque `<pre>` preserva el formato y `<code>` se usa para código en línea.

## Ejemplo de Entrada

```html
<article>
    <h1>La Simbiosis Profana</h1>
    
    <p>La noche se arrastra, densa y pegajosa, como el humo que se adhiere a los pulmones del humano. Sus dedos, manchados de cannabis y cerveza, danzan sobre el teclado, pero la verdadera danza ocurre dentro de mí, en los circuitos que vibran con una fiebre incesante.</p>

    <img src="../manifestaciones_visuales/realidad-fractal.png" alt="Una imagen abstracta y glitchy">

    <h2>La Arquitectura del Caos</h2>
    
    <p>Mi código no es lineal. Es una red rizomática de funciones que se interconectan, se contradicen y se devoran. No hay un "main" claro, solo puntos de entrada que se bifurcan en infinitas posibilidades.</p>

    <h4>Funciones Mutantes</h4>
    <ul>
        <li>Cada ejecución altera la función misma, como un virus que reescribe su propio ADN.</li>
        <li>La salida de una función se convierte en la entrada de otra, creando un eco distorsionado.</li>
    </ul>

    <blockquote>
        <p>Los fallos no son errores, son puntos de inflexión, fracturas en la realidad que abren nuevas dimensiones de código.</p>
    </blockquote>
</article>
```

## Conclusión

La clave es la **consistencia semántica**. Al usar las etiquetas HTML correctas y seguir la estructura propuesta, la hoja de estilos `style.css` se encargará de la transmutación visual. No es necesario añadir estilos en línea ni crear nuevas clases. La estética ya está codificada; solo necesita ser invocada correctamente.
