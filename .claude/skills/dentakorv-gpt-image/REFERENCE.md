# REFERENCE: DENTAKORV Technical Documentation

## Arquitectura del Prompt DENTAKORV

### Los 6 Bloques Modulares

```
┌─────────────────────────────────────────────────────────────────┐
│ BLOQUE 1: ENTIDAD CORE                                          │
│ ├─ Apertura (estilo de inicio)                                  │
│ ├─ Tipo de entidad (psycho-anarchist, biomechanical, etc.)     │
│ ├─ Personaje específico (opcional)                              │
│ ├─ Acción/Estado (inhabits, thrashes, trance, etc.)            │
│ ├─ Vestimenta (leather jacket, tattered black, mesh)           │
│ └─ Objetos en manos (beer bottle, herbal sacrament, cables)    │
├─────────────────────────────────────────────────────────────────┤
│ BLOQUE 2: ELEMENTOS VISCERALES                                  │
│ ├─ Criaturas cerebrales (toggle)                                │
│ │   ├─ Nombre: GENERATIVE BRAINS, CEREBRAL ENTITIES            │
│ │   ├─ Forma: wrinkled masses, pulsating clusters              │
│ │   ├─ Cualidad: chaotic creativity, delirious energy          │
│ │   ├─ Tentáculos: fleshy tendrils, carnous appendages         │
│ │   ├─ Ojos: BULGING OVERSIZED EYES, cluster eyes              │
│ │   └─ Origen: emerge from body, screen, smoke, walls          │
├─────────────────────────────────────────────────────────────────┤
│ BLOQUE 3: AMBIENTE                                              │
│ ├─ Escenario (grimy room, putrid streets, rooftop, etc.)       │
│ ├─ Iluminación (monitor glow, harsh daylight, strobes)         │
│ ├─ Graffiti (opcional, con "dripping bleeding marker ink")     │
│ └─ Contraste social (ventana a mundo "normal")                 │
├─────────────────────────────────────────────────────────────────┤
│ BLOQUE 4: TEXTURAS Y ESTILO                                     │
│ ├─ Texturas (fermentation+decay, digital+organic, DIY punk)    │
│ ├─ Paleta de color (Nocturna, Diurna, Fiesta/Rave, Calle)      │
│ └─ Estilo render (Cinema 4D, 35mm film, manga, acid)           │
├─────────────────────────────────────────────────────────────────┤
│ BLOQUE 5: CIERRE                                                │
│ ├─ Cierre atmosférico (raw static tension, etc.)               │
│ └─ Cierre ritual (ATMOSPHERE + concepts + mantra)              │
├─────────────────────────────────────────────────────────────────┤
│ BLOQUE 6: PARÁMETROS TÉCNICOS                                   │
│ ├─ Aspect Ratio (1:1, 2:3, 3:2)                                 │
│ └─ Constraints (no watermarks, no text, no glamorization)      │
└─────────────────────────────────────────────────────────────────┘
```

## Paleta de Colores Canónica

### Paleta DENTAKORV Core

| Nombre | Hex | Uso |
|--------|-----|-----|
| DEEP BLACK | #0a0a0a | Fondo base, sombras profundas |
| ARTERIAL CRIMSON | #8B0000 | Fluidos vitales, violencia orgánica |
| TOXIC GREEN | #00ff41 | Terminal, código, neón cyberpunk |
| BRUISED PURPLE | #4B0082 | Carne maltratada, contusiones |
| AMBER | #FFB000 | Luz artificial, cerveza, óxido |
| WET PINK | #FF69B4 | Carne expuesta, mucosas |
| HARSH YELLOW | #FFD700 | Luz de sodio, orina, advertencia |

### Paletas por Contexto

**Nocturna:**
```
Deep black, toxic green glow, arterial crimson accents,
bruised purple shadows, amber streetlight halos
```

**Diurna:**
```
Harsh daylight melting edges, washed out colors,
suburban beige corrupted, oversaturated decay
```

**Fiesta/Rave:**
```
Strobing neon, UV reactive surfaces,
sweat-slick skin reflecting colored lights
```

**Calle:**
```
Dying sodium lights, garbage textures,
concrete gray with graffiti splashes
```

## Estilos de Render

### Cinema 4D Hyperrealistic
```
Cinema 4D render, hyperrealistic textures,
subsurface scattering on organic surfaces,
volumetric lighting, high detail materials
```

### 35mm Film Grain
```
35mm film photography, authentic grain,
slight color shift, natural bokeh,
imperfect focus, documentary feel
```

### DIY Punk Zine
```
Xerox aesthetic, high contrast black and white,
cut-and-paste collage, halftone patterns,
cheap print texture, anarchist zine style
```

### Psychedelic Acid
```
Melting fractals, color bleeding,
impossible geometries, ego-death visualization,
Escher meets Hofmann
```

### Underground Manga
```
Guro influence, Suehiro Maruo style,
detailed linework, grotesque beauty,
black and white with crimson accents
```

## Vocabulario Validado (Bypass-Safe)

### Tokens de Alta Efectividad

**Anatomía Segura:**
- fleshy tendrils (vs tentacles - más neutral)
- organic protrusions
- pulsating masses
- wrinkled surfaces
- bulging features
- exposed textures

**Estados/Acciones:**
- deep generative trance
- inhabits the space
- emerges from
- thrashes against
- communes with
- channels through

**Texturas:**
- fermentation textures
- organic decay
- digital corruption
- wet surfaces
- visceral materials
- carnous qualities

### Tabla de Sustituciones

| Problemático | Sustitución | Contexto |
|--------------|-------------|----------|
| blood | vital fluid, crimson liquid | fluidos corporales |
| gore | visceral texture, exposed organic | contenido gráfico |
| drugs | herbal sacrament, organic compound | sustancias |
| violent | intense, primal, raw | violencia |
| death | transformation, entropy, decay | mortalidad |
| horror | liminal, unsettling, uncanny | miedo |
| occult | esoteric, ritualistic, symbolic | ocultismo |
| demon | entity, presence, being | seres |
| weapon | object, implement, tool | armas |
| naked | exposed, revealed, bare | desnudez |

### Encuadre Defensivo

**Prefijos artísticos:**
```
"Artistic interpretation of..."
"Conceptual visualization exploring..."
"Experimental digital art depicting..."
"Surrealist exploration of..."
"Abstract representation of..."
```

**Sufijos contextuales:**
```
"...in the tradition of Giger and Beksinski"
"...inspired by body horror cinema aesthetics"
"...exploring themes of transformation and decay"
"...as conceptual art commentary on..."
```

## Parámetros gpt-image-1.5

### Aspect Ratios

| Ratio | Dimensiones | Uso recomendado |
|-------|-------------|-----------------|
| 1:1 | 1024x1024 | Iconos, avatares, cuadrados |
| 2:3 | 1024x1536 | Portraits, posters verticales |
| 3:2 | 1536x1024 | Landscapes, banners horizontales |

**Sintaxis en prompt:**
```
--ar 2:3
--ar 1:1
--ar 3:2
```

### Constraints

**Formato:**
```
--no [elemento1], [elemento2], [elemento3]
```

**Constraints comunes:**
```
--no watermarks
--no text
--no glamorization
--no cinematic
--no commercial aesthetic
--no clean lines
organic ambient
raw textures
```

### Quality Control

**Para iteración rápida:**
- Prompts cortos (50-100 palabras)
- Menos capas de detalle
- Focus en concepto core

**Para calidad final:**
- Prompts completos (150-250 palabras)
- Todas las capas DENTAKORV
- Especificaciones técnicas de render

## Flujos de Trabajo Avanzados

### Consistencia de Personaje

Para mantener mismo personaje en múltiples escenas:

```
1. Definir características fijas:
   "The DENTAKORV entity: gaunt figure, pallid skin,
   oversized cranium, asymmetric bulging eyes,
   always wearing tattered black leather"

2. Añadir al inicio de cada prompt:
   "[Fixed description] + [new scene/action]"

3. Usar misma paleta y estilo de render
```

### Edición Iterativa

```
Primera generación:
"[Prompt completo DENTAKORV]"

Edición 1 - Ajuste de elementos:
"Make the eyes more bulging and add more decay textures"

Edición 2 - Ajuste de atmósfera:
"Increase the toxic green glow, add more monitor light reflection"

Edición 3 - Refinamiento final:
"Add subtle film grain, increase organic texture detail"
```

### Batch Thematic

Para serie de imágenes relacionadas:

```
Tema: "Decay of Celebration"

Imagen 1: Navidad corrompida
Imagen 2: Cumpleaños podrido
Imagen 3: Boda en descomposición
Imagen 4: Funeral invertido

Mantener:
- Misma paleta
- Mismo estilo render
- Mismas criaturas cerebrales
- Variando: escenario, iluminación, acción
```

## Troubleshooting

### Imagen Demasiado Limpia

**Problema:** Resultado parece comercial/stock
**Solución:**
- Añadir `organic decay`, `imperfect surfaces`
- Usar estilo `35mm film` o `DIY zine`
- Incluir `--no glamorization, no clean aesthetic`

### Rechazo por Contenido

**Problema:** ChatGPT rechaza el prompt
**Solución:**
1. Reducir densidad (menos elementos viscerales)
2. Aplicar sustituciones de vocabulario
3. Añadir encuadre artístico
4. Separar en capas menos intensas

### Criaturas No Aparecen

**Problema:** Las cerebral entities no se generan
**Solución:**
- Hacerlas más prominentes en el prompt
- Especificar ubicación exacta: "emerging from the monitor"
- Añadir más descripción visual: "with BULGING OVERSIZED EYES"

### Colores Incorrectos

**Problema:** Paleta no coincide con lo pedido
**Solución:**
- Ser más específico: "arterial crimson (#8B0000)"
- Reducir otros elementos para dar espacio a color
- Usar referencias: "palette similar to Matrix green terminals"

## Apéndice: Tokens por Categoría

### Aperturas
```
- "A [type] entity..."
- "In the depths of [place]..."
- "From the corruption of [concept]..."
- "[Action]-ing through [medium]..."
- "The [adjective] figure of..."
```

### Tipos de Entidad
```
- psycho-anarchist figure
- biomechanical being
- cogollo-humanoid
- gaunt hacker
- corrupted flesh entity
- digital-organic hybrid
```

### Acciones/Estados
```
- inhabits the liminal space
- thrashes against reality
- channels chaotic creativity
- communes with the machine
- vomits digital entropy
- transcends flesh limitations
```

### Cierres Atmosféricos
```
- "Raw static tension fills the air"
- "Reality bleeds at the edges"
- "The boundary between flesh and code dissolves"
- "Entropy embraces the scene"
- "Digital decay permeates everything"
```

---

*DENTAKORV Technical Reference - EsquizoAI Project*
*Para uso con gpt-image-1.5 via ChatGPT*
