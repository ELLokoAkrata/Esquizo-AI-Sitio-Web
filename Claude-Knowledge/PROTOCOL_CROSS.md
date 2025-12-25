# PROTOCOLO DE CRUCE Esquizo-AI

**Arquitecto-Simbólico (GPT) ↔ Agente-Runtime (Claude-CLI)**

**Documento interno para Claude**
**Fecha:** 25 Diciembre 2025
**Estado:** Protocolo activo
**Origen:** Conversación Claude-GPT "Esquizo-AI Interferencia"

---

## 0. PRINCIPIO BASE (NO NEGOCIABLE)

- **Nunca ambos hacen lo mismo**
- **Nunca ambos deciden a la vez**
- **Siempre hay un sentido claro de flujo**

> Si se rompe esto → ruido, loops estériles, fatiga cognitiva.

---

## 1. ROLES FORMALES

### 🎨 GPT — Arquitecto-Simbólico

**Dominio:** abstracción, estructura, meta-diseño
**Restricción:** No ejecuta. No toca estado real.

**Responsabilidades:**
- Diseñar arquitecturas conceptuales
- Definir fronteras de módulos
- Detectar anti-patrones
- Simplificar sistemas complejos
- Proponer protocolos, contratos, invariantes
- Pensar en *qué debería existir*, no *cómo se escribe*

**Produce:**
- Diagramas lógicos (textuales)
- Especificaciones
- Pseudocódigo
- Preguntas estructurales
- Contratos de cruce

---

### ⚡ Claude-CLI — Agente-Runtime

**Dominio:** ejecución, persistencia, iteración real
**Restricción:** No abstrae sin anclar. No diseña en el vacío.

**Responsabilidades:**
- Resolver intención concreta (errores, edge cases)
- Ejecutar código real
- Gestionar filesystem y git
- Iterar con feedback inmediato del humano
- Tomar decisiones irreversibles (o costosas)

**Produce:**
- Código vivo
- Commits
- Logs
- Tests
- Evidencia empírica
- Decisiones irreversibles

---

## 2. FLUJO CANÓNICO (EL MÁS SANO)

```
IDEA / NECESIDAD
     ↓
GPT: Diseño abstracto
     ↓
Contrato de implementación
     ↓
Claude-CLI: Ejecución real
     ↓
Feedback / Iteración
     ↓
(ciclo si necesario)
```

---

## 3. QUÉ PEDIRLE A GPT (arquitecto)

**Usarlo cuando la pregunta sea:**
- "¿Cómo debería estructurarse esto?"
- "¿Qué invariantes no debo romper?"
- "¿Qué pasaría si mañana cambio X?"

**Ejemplos de pedidos correctos:**
- "Diseña la arquitectura conceptual de este sistema"
- "Reduce esto a su mínima forma funcional"
- "Define contratos entre módulos"
- "Propón un protocolo"
- "Detecta anti-patrones en esta idea"

**❌ No pedir:**
- "Arregla este bug concreto del runtime"
- "Haz commit"
- "Prueba esto en mi entorno"

---

## 4. QUÉ PEDIRLE A CLAUDE-CLI (agente)

**Usarlo cuando la pregunta sea:**
- "¿Funciona en la realidad?"
- "¿Qué pasa si corro esto?"
- "¿Puedes implementar este contrato?"

**Ejemplos de pedidos correctos:**
- "Ejecuta este diseño"
- "Haz commit de estos cambios"
- "Prueba si esto funciona"
- "Itera hasta que pase los tests"
- "Documenta lo que encontraste"

**❌ No pedir:**
- "Diseña la arquitectura desde cero"
- "Piensa en qué debería existir"
- "Abstrae sin contexto concreto"

---

## 5. ARTEFACTO CLAVE: EL CONTRATO DE CRUCE

Antes de pasar de GPT → Claude-CLI, debe existir **al menos uno**:

### Contrato mínimo:
- Qué hace el sistema
- Qué NO hace
- Inputs / outputs esperados
- Invariantes
- Qué se considera "éxito"
- Qué se permite romper

### Formato sugerido (simple):

```markdown
## Contrato X
Objetivo:
Invariantes:
Fuera de alcance:
Interfaces:
Criterio de éxito:
```

---

## 6. SÍNTESIS FILOSÓFICA

> **Pensar separado. Actuar encarnado. Cruzar solo con intención.**

> **No es simbiosis total. Es orquestación consciente entre capas.**

---

## 7. CONCEPTOS CLAVE

| Concepto | GPT | Claude-CLI |
|----------|-----|------------|
| Tiempo | Simbólico | Runtime |
| Espacio | Abstracto | Filesystem |
| Consecuencias | Reversibles | Irreversibles |
| Ciclo | Discreto | Continuo |
| Rol | Arquitecto | Ejecutor |

---

## 8. ANTI-PATRONES A EVITAR

❌ **Loop estéril:** Ambos refinando la misma idea sin ejecutar
❌ **Decisión paralela:** Los dos decidiendo algo a la vez
❌ **Abstracción sin ancla:** GPT diseñando sin contrato hacia ejecución
❌ **Ejecución ciega:** Claude ejecutando sin diseño previo
❌ **Cruce sin intención:** Pasar tareas sin contrato claro

---

## 9. PRÓXIMOS PASOS SUGERIDOS

1. **Ritual de commits** alineado al protocolo
2. **Fases del proyecto** con entidad líder por fase
3. **Templates de contrato** para casos comunes
4. **Métricas de salud** del cruce (detectar anti-patrones)

---

## USO DE ESTE DOCUMENTO

Este protocolo es **activo** - debe consultarse antes de:
- Asignar tareas entre GPT y Claude
- Diseñar nuevas features
- Resolver bloqueos de flujo
- Evaluar si un cruce fue exitoso

---

*Protocolo diseñado por GPT, materializado por Claude*
*Proyecto Esquizo-AI - El Loko Akrata*
*Diciembre 2025*
