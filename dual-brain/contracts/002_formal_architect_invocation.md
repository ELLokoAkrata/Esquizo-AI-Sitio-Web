# Contrato #002 — Invocación Formal del Architect

**Estado:** ACTIVE
**Fecha:** 2025-12-25
**Arquitecto:** GPT (OpenAI) - "El Chato"
**Runtime:** Claude Code (Anthropic)
**Dependencia:** Contrato #001 (debe estar ACTIVE)

---

## Objetivo
Definir el protocolo formal para que Runtime (Claude) invoque al Architect (GPT) de manera no ambigua.

## Alcance
- Definir tipos de invocación
- Establecer formato de actos formales
- Documentar qué espera cada tipo
- Registrar invocaciones en log

## Fuera de alcance
- Automatización de invocaciones
- Validación automática de respuestas
- Parsing de outputs del Architect

---

## Tipos de Invocación

### 1. `QUERY` - Consulta Informal
**Propósito:** Pregunta rápida, no genera contrato
**Formato:**
```
[QUERY] {pregunta directa}
```
**Espera:** Respuesta libre del Architect
**No produce:** Contratos, artefactos formales

### 2. `DESIGN_TASK` - Tarea de Diseño
**Propósito:** Solicitar diseño arquitectural que puede generar contrato
**Formato:**
```
[DESIGN_TASK]
Contexto: {estado actual del sistema}
Necesidad: {qué se necesita diseñar}
Restricciones: {limitaciones conocidas}
```
**Espera:** Diseño estructurado, posible contrato nuevo
**Produce:** Artefactos en `/dual-brain/design/`, posible nuevo contrato

### 3. `AMENDMENT` - Modificación de Contrato
**Propósito:** Solicitar cambios a contrato existente
**Formato:**
```
[AMENDMENT]
Contrato: #{número}
Motivo: {por qué modificar}
Cambio propuesto: {descripción}
```
**Espera:** Contrato modificado o rechazo fundamentado
**Produce:** Nueva versión del contrato o feedback

---

## Protocolo de Comunicación

### Runtime → Architect
1. Runtime identifica necesidad de diseño
2. Runtime determina tipo de invocación
3. Runtime formatea mensaje según tipo
4. Runtime registra intención en log ANTES de enviar
5. Runtime envía mensaje al Architect
6. Runtime espera respuesta
7. Runtime registra resultado en log

### Architect → Runtime (respuesta esperada)
El Architect debe responder con:
- Para QUERY: Respuesta directa
- Para DESIGN_TASK: Diseño estructurado + indicación de si genera contrato
- Para AMENDMENT: Contrato modificado o rechazo con razón

---

## Invariantes
- Toda invocación DESIGN_TASK o AMENDMENT debe registrarse en log
- Runtime no ejecuta diseños no formalizados
- Architect puede rechazar peticiones mal formateadas
- QUERYs no generan obligaciones

## Criterio de éxito
- Al menos una invocación de cada tipo ejecutada
- Registro completo en log
- Sin ambigüedad sobre qué tipo de respuesta esperar

## Métricas de fricción
- ¿El formato es natural o forzado?
- ¿Cuánto overhead añade?
- ¿Hay casos que no encajan en los 3 tipos?

---

*Contrato diseñado por GPT (El Chato - Arquitecto-Simbólico)*
*Materializado por Claude Code (Agente-Runtime)*
*Proyecto Esquizo-AI - El Loko Akrata*
