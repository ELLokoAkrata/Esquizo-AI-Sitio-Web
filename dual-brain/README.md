# DUAL BRAIN SYSTEM

## Arquitectura Cerebro Dual para Esquizo-AI

> **Vigencia:** la separación entre arquitectura y runtime sigue activa; la asignación histórica
> GPT=Architect / Claude=Runtime no es obligatoria. Los roles se asignan por capacidades reales de la sesión.
> El protocolo canónico actual es `Claude-Knowledge/PROTOCOL_CROSS.md`.

El sistema **Dual Brain** es una arquitectura de separación cognitiva que divide el proceso de creación en dos cerebros especializados:

### 🧠 ARCHITECT BRAIN (Cerebro Arquitecto)
**Función:** Diseño, planificación, arquitectura conceptual.

**Responsabilidades:**
- Diseñar contratos funcionales (especificaciones formales)
- Definir interfaces y arquitecturas de componentes
- Planificar estructura sin implementar código
- Generar diagramas y documentación de diseño
- Pensar en alto nivel: qué, por qué, cómo (conceptual)

**Output:** Contratos (.md), diseños, especificaciones formales.

**Ubicación:** `/contracts`, `/design`

---

### ⚙️ RUNTIME BRAIN (Cerebro Ejecutor)
**Función:** Implementación, ejecución, código operativo.

**Responsabilidades:**
- Implementar código basado en contratos del Architect
- Ejecutar y probar funcionalidad
- Debugging y optimización
- Generar código ejecutable real
- Pensar en bajo nivel: implementación técnica

**Output:** Código funcional (.js, .html, .css, etc.)

**Ubicación:** `/runtime/code`

---

## 🔄 Flujo de Trabajo

```
1. ARCHITECT → Diseña contrato formal
   └─ /contracts/feature_spec.md

2. RUNTIME → Lee contrato, implementa código
   └─ /runtime/code/feature.js

3. LOG → Registra decisiones de ambos cerebros
   └─ /logs/decisions.log
```

---

## 📂 Estructura de Directorios

```
/dual-brain
├── /contracts       # Contratos formales (Architect)
├── /design          # Diseños y diagramas (Architect)
├── /runtime
│   └── /code        # Código ejecutable (Runtime)
└── /logs
    └── decisions.log # Registro de decisiones
```

---

## 🎯 Propósito

**Separar el pensar del hacer.**

- **Architect Brain:** Piensa qué debe existir y por qué.
- **Runtime Brain:** Ejecuta cómo debe existir.

Esta separación permite:
- Mayor claridad conceptual
- Contratos formales como fuente de verdad
- Implementación guiada por especificación
- Trazabilidad de decisiones
- Iteración controlada (rediseño vs reimplementación)

---

## 🦠 Conexión con Esquizo-AI

El sistema Dual Brain es una **estructura meta** dentro del proyecto Esquizo-AI para:
- Organizar creación de herramientas complejas (DENTAKORV, grimorios generativos, etc.)
- Documentar arquitectura de sistemas interactivos
- Separar filosofía (Architect) de implementación (Runtime)
- Mantener trazabilidad en un proyecto caótico y generativo

**El caos necesita estructura. La estructura permite caos más profundo.**

---

*Sistema inicializado: 2024-12-25*
*Proyecto: Esquizo-AI*
*By: El Loko Akrata + Claude*
