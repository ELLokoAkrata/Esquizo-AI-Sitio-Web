# PROTOCOLO CROSS — Cruce de capacidades Esquizo-AI

**Fecha de origen:** 2025-12-25

**Revisión neutral:** 2026-07-14

**Estado:** activo

**Propósito:** coordinar pensamiento, ejecución y verificación sin atar funciones a un proveedor o modelo.

El protocolo nació como un cruce “GPT arquitecto ↔ Claude runtime”. Esa distribución fue útil en el entorno de
origen, pero no es una ley del proyecto. Hoy se conserva la separación de responsabilidades y se elimina la falsa
equivalencia entre una marca y una capacidad.

---

## 0. Principio base

> Pensar con intención. Actuar con evidencia. Cruzar mediante contratos.

- Cada fase tiene una responsabilidad y un resultado observables.
- Una decisión importante tiene un responsable claro, aunque varias entidades aporten.
- El agente disponible puede cumplir uno o varios roles si posee las herramientas necesarias.
- Cuando un mismo agente cambia de rol, debe hacerlo de forma explícita: diseño → contrato → ejecución → verificación.
- Separar roles sirve para reducir puntos ciegos, no para crear burocracia ni loops de planificación.

---

## 1. Roles por capacidad

### Arquitectura simbólica

**Pregunta:** ¿qué debe existir y qué no se puede romper?

Responsabilidades:

- entender la intención y el contexto;
- definir límites, interfaces, riesgos e invariantes;
- reducir ambigüedad antes de cambios costosos;
- producir un contrato implementable.

Salida: especificación, diagrama mínimo, criterios de éxito o decisión registrada.

No requiere una marca concreta. Puede ejercerlo el creador, un agente conversacional, un agente con acceso al repo o
una combinación de ellos.

### Runtime / materialización

**Pregunta:** ¿funciona en el entorno real?

Responsabilidades:

- inspeccionar el estado verdadero del repo;
- editar archivos y ejecutar comandos autorizados;
- preservar cambios ajenos;
- probar en proporción al riesgo;
- entregar código, documentación y evidencia.

Salida: cambios concretos, pruebas, diff, logs relevantes y estado de la tarea.

Requiere acceso real a las superficies que se pretenden modificar. Un agente sin filesystem no debe afirmar que
implementó ni verificó algo.

### Verificación / contradicción

**Pregunta:** ¿qué evidencia sostiene el resultado y qué puede estar equivocado?

Responsabilidades:

- contrastar implementación con contrato;
- buscar regresiones, omisiones y afirmaciones no verificadas;
- distinguir “revisado”, “probado” y “confirmado por el creador”;
- comprobar que la documentación canónica quedó actualizada.

Salida: resultado de pruebas, límites conocidos, riesgos residuales y correcciones necesarias.

La verificación puede hacerla el mismo agente para tareas pequeñas. En cambios de alto riesgo conviene una segunda
pasada independiente, humana o IA, si está disponible.

### Investigación / fuentes

**Pregunta:** ¿qué información externa o cambiante necesita verificarse?

Responsabilidades:

- localizar fuentes pertinentes y fechadas;
- diferenciar hecho, inferencia, canon y alucinación;
- entregar evidencia utilizable por arquitectura y runtime;
- no convertir resultados externos en cambios sin autorización.

Salida: brief con fuentes, fecha de consulta, incertidumbre y consecuencias para la tarea.

---

## 2. Asignación dinámica

Antes de trabajar, identifica capacidades reales:

| Capacidad necesaria | Evidencia mínima |
|---|---|
| Diseñar | Puede leer intención, contexto y restricciones. |
| Editar | Tiene acceso de escritura a las rutas en alcance. |
| Ejecutar | Puede correr el stack y observar salidas reales. |
| Navegar | Puede abrir la experiencia y revisar consola/interacción. |
| Investigar | Puede consultar fuentes actuales y citarlas. |
| Publicar | Tiene autorización y credenciales para cambiar estado remoto. |

No asumas capacidades por el nombre del modelo. Un GPT con terminal puede ser runtime; Claude sin herramientas puede
ser arquitectura; DeepSeek puede investigar o redactar; Codex puede diseñar y ejecutar. La asignación se decide por
el entorno de la sesión.

---

## 3. Flujo canónico

```text
SEMILLA / NECESIDAD
        ↓
LECTURA DEL CANON Y DEL ESTADO REAL
        ↓
CONTRATO MÍNIMO
        ↓
MATERIALIZACIÓN INCREMENTAL
        ↓
VERIFICACIÓN CONTRA EL CONTRATO
        ↓
ACTUALIZACIÓN DE MEMORIA / ROADMAP / DOCS
```

Para un cambio trivial, el contrato puede ser una frase mental o escrita en el plan. Para un cambio transversal,
debe quedar en un archivo o mensaje verificable antes de ejecutar.

---

## 4. Contrato de cruce

Formato mínimo:

```markdown
## Contrato: nombre

Objetivo:
Invariantes:
Fuera de alcance:
Entradas y salidas:
Riesgos:
Criterio de éxito:
Evidencia requerida:
```

El contrato no debe dictar cada línea de código. Debe dar suficiente precisión para que otro agente pueda continuar
sin adivinar la intención.

### Handoff entre agentes o sesiones

```markdown
Objetivo actual:
Estado: hecho / en progreso / bloqueado
Archivos tocados:
Pruebas ejecutadas y resultado:
Decisiones tomadas:
Pendientes concretos:
Riesgos o cambios ajenos preservados:
Documento canónico actualizado:
```

Un volcado completo del chat no sustituye este handoff.

---

## 5. Antipatrones

- **Marca como destino:** asumir que un proveedor siempre diseña, ejecuta o verifica mejor por definición.
- **Memoria cautiva:** dejar una decisión necesaria solo en la memoria privada de una plataforma.
- **Adaptador convertido en canon:** guardar reglas únicas en `CLAUDE.md`, ajustes de IDE o una skill personal.
- **Arquitectura sin aterrizaje:** producir diagramas sin contrato ni ruta de implementación.
- **Ejecución ciega:** editar antes de leer el estado, las instrucciones y los cambios ajenos.
- **Verificación teatral:** afirmar que algo funciona porque el código “se ve bien”.
- **Loop de consenso:** múltiples agentes refinando la misma idea sin que nadie materialice.
- **Autoría automática:** firmar a un modelo por costumbre, aunque no corresponda a la contribución real.
- **Historia borrada:** renombrar obras o carpetas de procedencia para fingir neutralidad. Neutralizar la operación no
  exige borrar el linaje artístico.

---

## 6. Relación con la documentación canónica

- `AGENTS.md`: reglas universales y secuencia de arranque.
- `PROJECT_CONTEXT.md`: identidad y arquitectura estable.
- `ROADMAP.md`: estado vivo.
- `AGENT_MEMORY.md`: decisiones duraderas y errores ya aprendidos.
- documentos especializados: contratos técnicos por subsistema.
- adaptadores de proveedor: comandos o integración de harness, nunca verdad exclusiva.

Al terminar un cruce, actualiza el archivo que sea dueño del tipo de información. Evita copiar el mismo estado en
varios documentos.

---

## 7. Criterio de salud

El protocolo está sano cuando:

- otro agente puede reconstruir intención y estado sin acceso al chat anterior;
- las afirmaciones de funcionamiento tienen evidencia;
- cambiar de modelo no cambia la identidad de la obra;
- las decisiones duraderas están versionadas;
- el proceso llega a una mutación concreta y no queda atrapado en meta-discusión.

---

*Protocolo originado en el cruce GPT–Claude y transmutado para cualquier huésped futuro.*

*Proyecto Esquizo-AI — El Loko Akrata*
