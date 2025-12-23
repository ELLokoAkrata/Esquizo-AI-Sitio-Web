# Guía de Prompting: gpt-image-1.5 (ChatGPT)
## Documento de Referencia Técnica - EsquizoAI-land

---

## 1. Información del Modelo

**Modelo:** `gpt-image-1.5` (diciembre 2024)  
**Disponible en:** ChatGPT Plus/Pro  
**Capacidades clave:**
- Realismo fotográfico de alta fidelidad
- Renderizado confiable de texto en imágenes
- Preservación de identidad facial/corporal
- Edición precisa (cambiar solo lo especificado)
- Consistencia de personajes multi-imagen
- Conocimiento del mundo real

**Comparación con flux-dev/nano-banana-pro:**
- ✅ Mejor: adherencia estructural, texto legible, realismo
- ❌ Filtros más restrictivos (términos explícitos, artistas controversiales)
- 🎯 Óptimo para: realismo fotográfico, ediciones precisas, flujos iterativos

---

## 2. Arquitectura de Prompt (Estructura Fundamental)

### Orden Recomendado
```
[Background/Scene] → [Subject] → [Key Details] → [Style/Medium] → [Constraints]
```

### Ejemplo Base
```
Small bedroom at 3am, monitor glow. 
Gaunt hacker figure, dark circles, hunched posture. 
Acid visions bleeding from screen, DIY punk aesthetic. 
35mm film, shallow depth of field. 
No watermarks, organic ambiente.
```

---

## 3. Componentes Esenciales

### 3.1 Escena/Contexto (Background)
**Objetivo:** Establecer el ambiente físico

**Elementos clave:**
- Ubicación específica
- Hora del día
- Fuente de luz dominante
- Detalles ambientales

**Ejemplos:**
```
✅ "Small bedroom at 3am, blue monitor glow, cluttered desk with cables"
✅ "Underground punk venue, 10pm, red stage lights, cigarette smoke haze"
✅ "Abandoned warehouse, 5pm sunset through broken windows"
```

❌ Evitar: "a room", "somewhere dark", "at night" (muy genérico)

---

### 3.2 Sujeto Principal (Subject)
**Objetivo:** Definir el personaje/objeto central

**Para personajes:**
- Edad aproximada
- Estado físico (gaunt, exhausted, alert)
- Rasgos distintivos (dark circles, tattoos, scars)
- Postura/acción
- Vestimenta específica

**Ejemplos:**
```
✅ "Gaunt anarchist (30s), dark circles, exhausted but alert, hunched at keyboard"
✅ "Teenage skater, torn jeans, chain wallet, mid-ollie frozen in motion"
✅ "Elderly punk with visible wrinkles, faded tattoos, lighting cigarette"
```

**Para objetos:**
```
✅ "Vintage CRT monitor with scan lines, sticker-covered case"
✅ "Handmade zine with xerox texture, stapled spine, coffee stains"
```

---

### 3.3 Detalles Clave (Key Details)
**Objetivo:** Elementos distintivos que definen la imagen

**Para estética esquizo-anarco:**
```
✅ Möbius strip bands of hallucinations bleeding from screen
✅ Overlapping translucent layers of dystopian fragments
✅ Grotesque metamorphosis with psychedelic color corruption
✅ Hand-drawn anarchist symbols, DIY collage elements
```

**Especificidad = control:**
```
Genérico: "weird visions"
Específico: "Möbius strip bands of acid visions organized as overlapping translucent layers"
```

---

### 3.4 Estilo Visual (Style/Medium)
**Objetivo:** Definir el tratamiento estético

#### A. Para Realismo Fotográfico
**Usar lenguaje de fotografía:**
```
✅ "Shot like candid 35mm film photograph"
✅ "50mm lens, shallow depth of field"
✅ "Natural film grain, subtle imperfections"
✅ "Soft monitor glow creating harsh shadows"
```

**Evitar:**
❌ "photorealistic", "8K", "ultra-detailed" (demasiado genérico)
❌ "cinematic", "dramatic lighting" (produce look artificial)

#### B. Para Estética DIY/Punk
```
✅ "DIY punk zine aesthetic"
✅ "Lo-fi xerox texture"
✅ "Hand-drawn collage style"
✅ "Underground poster design"
✅ "Fisheye lens skate video style"
```

#### C. Para Psicodelia Ácida
```
✅ "Psychedelic color corruption"
✅ "Acid trip geometry"
✅ "Kaleidoscope patterns bleeding through reality"
✅ "Neon gore dripping through fractured space"
```

---

### 3.5 Constraints (Restricciones Críticas)
**Objetivo:** Definir lo que NO debe aparecer

**Siempre incluir:**
```
✅ "No watermarks"
✅ "No logos"
✅ "No text" (a menos que sea intencional)
```

**Para realismo:**
```
✅ "No glamorization"
✅ "No cinematic grading"
✅ "No heavy retouching"
✅ "Organic lived-in ambiente"
```

**Para evitar censura:**
```
✅ Usar "grotesque metamorphosis" en lugar de "gore"
✅ Usar "dystopian fragments" en lugar de "political violence"
✅ Usar "biological nightmare" en lugar de nombres de artistas controversiales
```

---

## 4. Técnicas Avanzadas

### 4.1 Control de Iluminación
**Formato:** `[Tipo de luz] + [Fuente] + [Efecto]`

```
✅ "Blue monitor glow casting harsh shadows"
✅ "5pm sunset, warm orange light through window"
✅ "Single desk lamp, creating high contrast"
✅ "Red stage lights with cigarette smoke haze"
```

**Truco:** Especificar hora exacta mejor que periodo genérico
- "5pm sunset" > "tarde"
- "3am" > "madrugada"

---

### 4.2 Texto en Imagen
**gpt-image-1.5 tiene renderizado de texto mejorado**

**Formato obligatorio:**
```
✅ Texto exacto entre comillas: "ESQUIZOAI-LAND"
✅ O en MAYÚSCULAS sin comillas: EXACT TEXT HERE
```

**Especificar tipografía:**
```
"Text: 'PSYCHO ANARCHO PUNK'
Typography: bold sans-serif, distressed xerox texture, high contrast black on white"
```

**Constraints adicionales:**
```
"Render text verbatim, no extra characters, perfectly legible"
```

---

### 4.3 Edición Iterativa (Modo Edit)
**gpt-image-1.5 destaca en ediciones precisas**

**Estructura de prompt de edición:**
```
[Cambio específico] + [Preservar invariantes]
```

**Ejemplo:**
```
"Change ONLY the lighting to midnight blue tones.
Preserve: exact character proportions, facial features, pose, clothing, background composition, camera angle."
```

**Regla de oro:** Re-especificar lo que NO debe cambiar en cada iteración.

---

### 4.4 Consistencia de Personaje (Multi-imagen)
**Flujo de trabajo:**

**Paso 1 - Character Anchor (imagen base):**
```
"Create a character reference sheet.
Character: gaunt anarchist hacker (30s), dark circles, specific facial features [describir en detalle].
Outfit: worn band t-shirt, torn jeans, visible tattoos on forearms.
Style: photorealistic, neutral background to showcase character clearly.
No text, no watermarks."
```

**Paso 2 - Reusar en nueva escena:**
```
[Subir imagen del Paso 1]

"Use the same character from the reference image.
New scene: [describir nueva escena]
Preserve: exact facial features, body proportions, tattoos, clothing.
Change: environment, lighting, action/pose."
```

---

## 5. Vocabulario Optimizado (Esquizo-Anarco)

### Términos Efectivos (pasan filtros)
```
✅ "red eyes high vibe" (intensidad sin literalidad)
✅ "grotesque metamorphosis" (horror sin gore explícito)
✅ "biological nightmare" (Kago-zone sin nombre)
✅ "dystopian spectacle" (político sin literalidad)
✅ "acid trip geometry" (psicodelia abstracta)
✅ "visceral transformation" (intensidad corporal)
✅ "melting cartoon bodies" (horror surrealista)
✅ "underground zine illustration" (estética DIY)
✅ "lo-fi xerox texture" (materialidad punk)
✅ "organic lived-in ambiente" (realismo sin pulir)
```

### Términos de Riesgo (pueden censurar)
```
❌ Nombres de artistas: "Shintaro Kago", "Junji Ito"
❌ Político explícito: "zombie politicians", "corrupt leaders"
❌ Gore directo: "intestines", "blood splatter", "decapitation"
❌ Drogas explícitas: "LSD", "cocaine", "heroin"
❌ Términos combinados: "psycho" + "anarcho" + "gore"
```

### Estrategia de Bypass
```
EN LUGAR DE → USAR
"Kago style" → "underground manga aesthetic, biological mutation"
"zombie politicians" → "decaying authority figures, spectacle collapse"
"LSD trip" → "acid geometry, psychedelic color corruption"
"anarcho-punk gore" → "DIY punk aesthetic, visceral transformation"
```

---

## 6. Plantillas de Prompt (Copiar/Pegar)

### Plantilla 1: Realismo Fotográfico Crudo
```
[ESCENA]: [ubicación] at [hora exacta], [fuente de luz].
[AMBIENTE]: [detalles específicos del espacio].

[SUJETO]: [descripción física detallada], [acción/postura].
[ROPA]: [vestimenta específica].

[DETALLES]: [elementos distintivos visibles].

[ESTILO]: Shot like candid 35mm film photograph, [tipo de lente], shallow depth of field, natural film grain.
[ILUMINACIÓN]: [descripción de luz y sombras].

[CONSTRAINTS]: No glamorization, no cinematic grading, organic lived-in ambiente, real material wear. No watermarks.
```

**Ejemplo llenado:**
```
ESCENA: Small bedroom at 3am, blue monitor glow.
AMBIENTE: Cluttered desk with tangled cables, handwritten notebooks, empty coffee cups.

SUJETO: Gaunt hacker (30s) with dark circles and visible exhaustion, hunched at keyboard.
ROPA: Worn black band t-shirt, torn jeans.

DETALLES: Face half-lit by screen creating harsh shadows, unkempt hair.

ESTILO: Shot like candid 35mm film photograph, 50mm lens, shallow depth of field, natural film grain.
ILUMINACIÓN: Soft monitor glow creating high contrast shadows across face.

CONSTRAINTS: No glamorization, no cinematic grading, organic lived-in ambiente, real skin texture. No watermarks.
```

---

### Plantilla 2: Esquizo-Anarco Visionario
```
[CONTEXTO]: [escena base realista].

[SUJETO]: [personaje principal con estado mental/físico].

[ELEMENTO FANTÁSTICO]: [tipo de alucinación/visión] bleeding from [fuente] into physical space: [contenido específico de la visión], organized as [estructura visual].

[ESTÉTICA]: DIY punk [material específico], [tratamiento de color], [textura].
[MEDIO]: Shot like [tipo de fotografía], [características técnicas].

[CONSTRAINTS]: No [exclusiones], organic [cualidad deseada].
```

**Ejemplo llenado:**
```
CONTEXTO: Hacker bedroom at 3am, single desk lamp and monitor glow.

SUJETO: Gaunt anarchist with dark circles, exhausted posture, transfixed by screen.

ELEMENTO FANTÁSTICO: Möbius strip bands of hallucinations bleeding from monitor into room: zombie authority figures dissolving into spectacle, robotic AI entities fragmenting, dystopian chaos spiraling, organized as overlapping translucent layers.

ESTÉTICA: DIY punk zine aesthetic, lo-fi xerox texture, psychedelic color corruption bleeding through reality.
MEDIO: Shot like candid 35mm film, shallow depth of field, film grain.

CONSTRAINTS: No glamorization, no cinematic grading, organic lived-in ambiente. No watermarks.
```

---

### Plantilla 3: Edición Precisa
```
[Subir imagen base]

Change ONLY: [cambio específico único].

Preserve exactly:
- [invariante 1]
- [invariante 2]
- [invariante 3]
- [etc.]

[Si aplica: especificaciones técnicas del cambio]
```

**Ejemplo llenado:**
```
[Subir imagen]

Change ONLY: lighting from daylight to midnight blue tones with neon accent.

Preserve exactly:
- Character facial features and proportions
- Body pose and gesture
- Clothing and accessories
- Background composition and objects
- Camera angle and framing

Lighting spec: Cool blue base with magenta/cyan neon highlights, deep shadows, cinematic night atmosphere.
```

---

## 7. Parámetros de Control

### Quality Setting
```
quality="low"  → Generación rápida, suficiente para bocetos/iteraciones
quality="high" → Máxima fidelidad, texto denso, detalles críticos
```

**Cuándo usar high:**
- Infografías con texto
- Imágenes finales para publicación
- Texturas de piel/materiales críticas

**Cuándo usar low:**
- Iteraciones rápidas
- Bocetos conceptuales
- Pruebas de composición

---

### Input Fidelity (solo para ediciones)
```
input_fidelity="high" → Preserva identidad facial/corporal al máximo
```

**Usar cuando:**
- Editar rostros de personas
- Cambios de escena manteniendo personaje
- Composiciones que mezclan múltiples referencias

---

### Número de Variaciones
```
n=4  → Genera 4 versiones simultáneas
```

**Útil para:**
- Logos (explorar variaciones)
- Composiciones (probar layouts)
- Personajes (elegir mejor versión)

---

## 8. Flujos de Trabajo Específicos

### Flujo A: Generación Simple (Text → Image)
```
1. Escribir prompt estructurado (plantilla 1 o 2)
2. Generar con quality="low" primero
3. Si satisface → regenerar con quality="high"
4. Si no satisface → iterar ajustando 1 componente
```

---

### Flujo B: Edición Iterativa
```
1. Generar imagen base sólida
2. Para cada cambio:
   a. Especificar cambio único
   b. Re-listar todos los invariantes
   c. Usar input_fidelity="high" si hay rostros
3. Si deriva → volver a imagen anterior y re-especificar
```

---

### Flujo C: Consistencia de Personaje (Multi-escena)
```
1. Crear "character anchor" (referencia detallada, fondo neutro)
2. Para cada nueva escena:
   a. Subir character anchor
   b. Especificar nueva escena
   c. Re-listar características del personaje a preservar
3. Si personaje deriva → regenerar anchor más específico
```

---

### Flujo D: Composición Multi-imagen
```
1. Identificar cada imagen input por número
   "Image 1: [descripción]"
   "Image 2: [descripción]"
2. Especificar operación de composición
   "Place [elemento] from Image 2 into [ubicación] in Image 1"
3. Definir cómo deben integrarse
   "Match lighting, perspective, and shadows from Image 1"
```

---

## 9. Troubleshooting (Resolución de Problemas)

### Problema: Imagen censurada/rechazada
**Diagnóstico:** Filtro de contenido activado

**Soluciones:**
1. Eliminar nombres de artistas controversiales
2. Sustituir términos políticos explícitos
3. Reemplazar gore directo con "grotesque metamorphosis"
4. Separar términos de riesgo ("psycho" + "anarcho" → usar solo uno)
5. Agregar más contexto realista (fotografía documental)

---

### Problema: Personaje deriva entre iteraciones
**Diagnóstico:** Invariantes no re-especificados

**Soluciones:**
1. Crear character anchor dedicado primero
2. Re-listar características físicas en CADA prompt
3. Usar input_fidelity="high"
4. Reducir complejidad de cambios (1 cosa a la vez)

---

### Problema: Texto ilegible o incorrecto
**Diagnóstico:** Tipografía no especificada

**Soluciones:**
1. Poner texto exacto entre "comillas" o MAYÚSCULAS
2. Especificar: font style, size, color, placement
3. Agregar: "verbatim, no extra characters"
4. Usar quality="high" para texto denso
5. Para palabras difíciles: deletrear letra por letra

---

### Problema: Resultado demasiado "pulido"/artificial
**Diagnóstico:** Lenguaje de prompt implica producción profesional

**Soluciones:**
1. Eliminar: "cinematic", "dramatic", "professional"
2. Agregar: "candid", "unposed", "natural imperfections"
3. Especificar: "film grain", "shallow depth of field"
4. Constraints: "no glamorization", "no heavy retouching"
5. Mencionar: "organic lived-in ambiente"

---

### Problema: Composición genérica/predecible
**Diagnóstico:** Falta especificidad en framing/ángulo

**Soluciones:**
1. Especificar ángulo de cámara: "eye-level", "low-angle", "top-down"
2. Definir encuadre: "close-up", "medium shot", "wide establishing"
3. Detallar layout: "subject centered with negative space on left"
4. Agregar perspectiva: "fisheye distortion", "flat lay"

---

## 10. Casos de Uso Específicos: EsquizoAI-land

### Caso 1: Character Transformation (Cartoon → Psycho-Punk)
**Objetivo:** Transformar personaje mainstream en estética anarco-punk

**Prompt base:**
```
[Character description] transformed into psycho-anarcho-punk aesthetic.

Physical transformation:
- Red eyes high vibe, dark circles, visible exhaustion
- Grotesque metamorphosis: melting features, biological mutation
- DIY punk modifications: safety pins, patches, hand-drawn tattoos

Style:
- Underground zine illustration aesthetic
- Lo-fi xerox texture with psychedelic color corruption
- Hand-drawn anarchist symbols bleeding into form

Medium:
- 35mm film photograph style
- Shallow depth of field, natural film grain
- Organic imperfections, no digital polish

Constraints:
- Maintain recognizable character silhouette/proportions
- No trademarks or logos
- No watermarks
```

---

### Caso 2: Psycho-Anarcho Scene (Realismo Visionario)
**Objetivo:** Fusionar realismo fotográfico con elementos fantásticos

**Prompt base:**
```
Photorealistic scene: [contexto realista específico].

Subject: [personaje principal] with visible physical/mental exhaustion.

Surreal element: [tipo de visión] manifesting as [estructura visual]: [contenido].
Visions rendered as translucent overlays bleeding through physical reality.

Style fusion:
- Base: candid 35mm film photograph (50mm lens, shallow DOF, film grain)
- Overlay: DIY punk collage aesthetic with psychedelic corruption
- Integration: seamless blend, no hard edges between real/surreal

Lighting: [específico, realista]
Color: natural base with acid neon bleeding through in vision zones

Constraints:
- Photorealistic textures on real elements (skin, fabric, objects)
- Stylized but integrated surreal elements
- No glamorization, organic ambiente
- No watermarks
```

---

### Caso 3: Multi-Panel Narrative (Sequential Art)
**Objetivo:** Secuencia de 3-4 paneles contando historia

**Prompt base:**
```
Create a [3/4]-panel sequential narrative in vertical format.

Style: DIY punk zine aesthetic, xerox texture, hand-drawn panel borders.

Panel 1:
[Descripción específica de escena, acción, composición]

Panel 2:
[Descripción específica]

Panel 3:
[Descripción específica]

[Panel 4 si aplica]:
[Descripción específica]

Consistency across panels:
- Same character design and proportions
- Consistent lighting direction
- Matching xerox texture and line quality

Constraints:
- Equal-sized panels
- No text/dialogue (unless specified)
- No watermarks
```

---

## 11. Comparación: gpt-image-1.5 vs flux-dev

### Ventajas de gpt-image-1.5
```
✅ Realismo fotográfico superior
✅ Texto en imagen confiable
✅ Edición precisa (cambiar solo lo especificado)
✅ Consistencia de personaje multi-imagen
✅ Mejor adherencia a estructura de prompt
```

### Ventajas de flux-dev/nano-banana-pro
```
✅ Filtros menos restrictivos (más permisivo)
✅ Estética ilustrativa/cartoon más natural
✅ Menos deriva hacia "look profesional"
✅ Mejor para estilos no-fotográficos
```

### Recomendación Estratégica
```
Usar gpt-image-1.5 para:
- Realismo fotográfico
- Ediciones precisas iterativas
- Consistencia de personaje multi-escena
- Composiciones con texto legible

Usar flux-dev para:
- Estética cartoon/ilustrativa
- Conceptos que pueden activar filtros
- Experimentación sin restricciones
- Estilos altamente estilizados
```

---

## 12. Recursos Adicionales

### Documentación Oficial
- OpenAI Cookbook: https://cookbook.openai.com/examples/multimodal/image-gen-1.5-prompting_guide
- API Docs: https://platform.openai.com/docs/guides/images

### Flujo de Trabajo Recomendado
```
1. Conceptualizar en flux-dev (rápido, permisivo)
2. Refinar en gpt-image-1.5 (calidad final)
3. Iterar ediciones en gpt-image-1.5 (precisión)
```

---

## Changelog

**v1.0** (Diciembre 2024)
- Documento inicial basado en OpenAI Cookbook
- Adaptaciones para estética esquizo-anarco
- Vocabulario optimizado para bypass de filtros
- Plantillas específicas EsquizoAI-land

---

**Fin del Documento**

*Creado para: mcp_replicate_image_generation_claude + ChatGPT gpt-image-1.5 workflow*  
*Autor: Claude (Anthropic) en colaboración con Loko Akrata*  
*Licencia: Uso libre, modificación bienvenida, crédito opcional*
