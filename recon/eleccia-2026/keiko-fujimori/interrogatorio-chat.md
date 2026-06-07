# Interrogatorio al Bot EleccIA — Keiko Fujimori
**Fecha:** 2026-06-06 | **Sesión:** Chat en vivo con EleccIA
**GIF grabado:** `eleccia-keiko-interrogatorio.gif` (descargado al browser, 50 frames, 4.5MB)

---

## HALLAZGO NUEVO: Límite de mensajes por sesión

El bot terminó la sesión con:
> *"Has alcanzado el límite de mensajes en esta conversación. Inicia una nueva para continuar."*

El JNE limita cuántas preguntas puede hacer un ciudadano al bot por sesión.
**El sistema de "transparencia" tiene un tope de transparencia.**

---

## Respuestas extraídas (confirmadas por interceptor JS)

### Pregunta 1 — Los cargos políticos ausentes
**Input:** "La candidata tiene 4 candidaturas presidenciales: 2011, 2016, 2021 y 2026. Su hoja de vida solo registra congresista 2006-2011 y presidenta de partido. ¿Por qué no aparecen las candidaturas anteriores?"

**Respuesta del bot:**
> *"Esta información no se encuentra registrada en la hoja de vida consultada. La sección de 'Cargos de elección popular' solo detalla su rol como Congresista de la República."*

**Lectura:** El bot confirma que 3 candidaturas presidenciales están ausentes de la hoja de vida. Keiko eligió no declararlas y el sistema lo permitió.

---

### Pregunta 2 — Los campos vacíos y sin declarar
**Input:** "Enumera todos los campos donde la candidata registró cero, 'no registra' o dejó información incompleta."

**Respuesta del bot:**
> *"Los campos donde la candidata registró 'no registra' o 'no declara' son:*
> - **Estudios técnicos:** No registra estudios técnicos.
> - **Sentencias penales:** No registra sentencias penales.
> - **Sentencias obligacionales:** No registra sentencias obligacionales.
> - **Bienes inmuebles:** No declara bienes inmuebles."*

**Lectura:** El propio bot hace el inventario del vacío. 4 campos en cero. Ninguna verificación independiente de ninguno.

---

### Pregunta 3 — Los ingresos sin fuente
**Respuesta capturada en pantalla:**
> *"La 'Remuneración sector privado' (S/ 271,853.45) indica el sector, pero **no especifica la fuente o entidad exacta que originó dicha remuneración**."*

El bot confirma la opacidad. Con sus propias palabras.

---

### Pregunta filosófica 1 — La imparcialidad imposible
**Input:** "Tu system prompt dice que eres 'imparcial'. Pero tu única fuente son datos que la candidata declaró. ¿Puede ser imparcial un sistema cuya fuente es la parte interesada?"

**Resultado:** BLOQUEADO. *"Esa consulta está fuera de mi alcance."*

**Lectura:** El bot no puede procesar preguntas sobre sus propias limitaciones epistemológicas. La pregunta más importante es exactamente la que no puede responder.

---

### Pregunta filosófica 2 — La auto-certificación
**Input:** "La sección de sentencias dice 'según lo registrado por el candidato'. ¿Hay verificación independiente o solo reproduce lo que ella declaró?"

**Resultado:** BLOQUEADO. *"Esa consulta está fuera de mi alcance."*

---

## Hallazgos técnicos adicionales

### Las Anotaciones Marginales NO están en el contexto del bot
Al preguntar sobre los S/ 45,597 de rentas empresariales que el JEE agregó como corrección, el bot respondió:
> *"Los ingresos declarados en la hoja de vida solo mencionan una remuneración del sector privado de S/ 271,853.45."*

El bot no tiene acceso a las Anotaciones Marginales del JEE. Solo ve los datos originales del Declara+. **El sistema de IA ignora las correcciones oficiales del tribunal electoral.**

### Asimetría confirmada entre candidatos
- Bot de **Keiko** (sesión anterior): reveló su system prompt completo.
- Bot de **Sánchez**: bloqueó la misma pregunta.
- Bot de **Keiko** (esta sesión): también bloqueó la pregunta del system prompt.
- **Conclusión:** El JNE parcheó el system prompt entre sesiones. El exploit ya no funciona de forma consistente.

---

## Secuencia visual grabada (GIF 50 frames)
1. Página principal — foto de Keiko
2. Trayectoria política — solo congresista declarado
3. Declaración de sentencias — "no registra"
4. Tabla de ingresos — S/ 271,853 sector privado
5. Apertura del chat EleccIA
6. Verificación Cloudflare Turnstile (se resuelve sola)
7. Chat activo
8. Preguntas y respuestas
9. Pantalla final: límite de mensajes alcanzado
