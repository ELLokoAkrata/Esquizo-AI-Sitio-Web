# Guía: Crear Claude Skills para Browser Automation

**Fecha:** Diciembre 2025
**Proyecto:** EsquizoAI
**Propósito:** Documentar cómo crear Skills en Claude Code que usen browser automation

---

## 1. ¿Qué son los Skills en Claude Code?

Un **Skill** es un archivo Markdown que enseña a Claude cómo hacer algo específico. A diferencia de los slash commands (`/comando`), los Skills se activan **automáticamente** cuando Claude detecta que son relevantes para tu pregunta.

**Características:**
- **Modelo-invocado:** Claude decide cuándo usar un Skill (no requiere `/comando`)
- **Context-aware:** Usa descripciones semánticas para matching inteligente
- **Distributable:** Se comparten via git o plugins
- **Progressive disclosure:** Pueden tener archivos de soporte cargados bajo demanda

---

## 2. Estructura de Archivos

### Ubicaciones según alcance

| Alcance | Ruta | Disponible para |
|---------|------|-----------------|
| Personal | `~/.claude/skills/` | Tú, todos los proyectos |
| Proyecto | `.claude/skills/` | Equipo en el repo |
| Plugin | `skills/` (dentro del plugin) | Quién instale el plugin |

**Precedencia:** Personal > Proyecto > Plugin

### Estructura mínima (single-file)
```
mi-skill/
└── SKILL.md
```

### Estructura avanzada (multi-file)
```
mi-skill/
├── SKILL.md              # Requerido - overview y navegación
├── REFERENCE.md          # Documentación técnica
├── EXAMPLES.md           # Ejemplos de uso
└── scripts/
    └── helper.py         # Scripts ejecutables (no se cargan en context)
```

---

## 3. Formato SKILL.md

### Estructura básica

```yaml
---
name: nombre-del-skill
description: Descripción de qué hace y cuándo usarlo. Incluir keywords que el usuario diría.
allowed-tools: Tool1, Tool2, mcp__server__*
---

# Nombre del Skill

## Overview
Qué hace este Skill...

## Instrucciones
Paso a paso para Claude...

## Ejemplos
Casos de uso concretos...

## Recursos Adicionales
- [REFERENCE.md](REFERENCE.md) - Docs técnicos
- [EXAMPLES.md](EXAMPLES.md) - Más ejemplos
```

### Campos YAML (Frontmatter)

| Campo | Requerido | Descripción | Límite |
|-------|-----------|-------------|--------|
| `name` | ✅ | Lowercase con hyphens | 64 chars |
| `description` | ✅ | Qué hace + cuándo usarlo (trigger terms) | 1024 chars |
| `allowed-tools` | ❌ | Tools permitidas sin pedir permiso | - |
| `model` | ❌ | Modelo específico para este Skill | - |

### Ejemplo de description efectiva

❌ Malo:
```yaml
description: Ayuda con imágenes
```

✅ Bueno:
```yaml
description: Generate DENTAKORV psycho-punk images using ChatGPT and gpt-image-1.5 via browser automation. Use when user wants to create visceral art, generate images, or automate image generation. Triggers on: DENTAKORV, generate image, psycho art, ChatGPT image.
```

**Incluir:**
- Acciones específicas (generate, create, automate)
- Keywords que usuarios dirían
- Contexto de uso claro
- Trigger terms explícitos

---

## 4. Control de Acceso a Herramientas: `allowed-tools`

El campo `allowed-tools` especifica qué herramientas puede usar Claude sin pedir permiso cuando el Skill está activo.

### Sintaxis

```yaml
allowed-tools: Read, Grep, Glob
```

### Herramientas disponibles

- `Read` - Leer archivos
- `Glob` - Pattern matching de archivos
- `Grep` - Búsqueda en archivos
- `Bash` - Ejecutar comandos bash
- `Bash(comando:*)` - Restricción por comando
- `mcp__server__*` - Todas las herramientas de un MCP server
- `mcp__server__tool` - Herramienta específica de MCP

### Para Browser Automation

```yaml
allowed-tools: mcp__claude-in-chrome__*, Read, Grep, Glob
```

Esto permite:
- Todas las herramientas de Claude-in-Chrome (navigate, click, screenshot, etc.)
- Leer archivos del proyecto
- Buscar en el codebase

---

## 5. Integración con MCP (Browser Automation)

### Paso 1: Instalar MCP Server

```bash
claude mcp add --transport stdio claude-in-chrome -- npx -y @claude-in-chrome/mcp
```

### Paso 2: Configurar en SKILL.md

```yaml
---
name: browser-automation
description: Automate browser tasks. Use when you need to open websites, fill forms, click buttons, take screenshots
allowed-tools: mcp__claude-in-chrome__*
---
```

### Paso 3: Claude usa automáticamente las herramientas

Cuando el Skill se activa, Claude tiene acceso a:
- `mcp__claude-in-chrome__navigate` - Navegar a URLs
- `mcp__claude-in-chrome__read_page` - Leer contenido de página
- `mcp__claude-in-chrome__computer` - Clicks, typing, screenshots
- `mcp__claude-in-chrome__find` - Buscar elementos en la página
- `mcp__claude-in-chrome__form_input` - Llenar formularios
- Y más...

### Ver herramientas MCP disponibles

```bash
# Dentro de Claude Code
> /mcp
# Muestra todos los servidores y sus herramientas
```

---

## 6. Progressive Disclosure

Para mantener contexto eficiente, coloca contenido detallado en archivos separados.

### Patrón recomendado

```markdown
# En SKILL.md

## Overview
[Instrucciones esenciales - menos de 500 líneas]

## Recursos adicionales
- Para detalles técnicos, ver [REFERENCE.md](REFERENCE.md)
- Para ejemplos, ver [EXAMPLES.md](EXAMPLES.md)
```

**Ventajas:**
- Claude carga archivos de referencia **solo cuando los necesita**
- No consume tokens innecesarios en startup
- Scripts se ejecutan sin cargar contenido

**Limitación:**
- Referencias de UN nivel de profundidad (A → B, no A → B → C)

---

## 7. Cómo se Invocan los Skills

A diferencia de slash commands, los Skills se activan automáticamente:

### Flujo de activación

1. **Discovery (startup)**
   - Claude carga SOLO nombre y descripción
   - Mantiene startup rápido

2. **Activation (cuando escribes)**
   - Tu pregunta se compara semánticamente contra descripciones
   - Claude te pide permiso para usar Skills relevantes
   - Ves confirmación antes de cargar SKILL.md completo

3. **Execution**
   - Claude sigue instrucciones del Skill
   - Carga archivos referenciados según necesidad

### Ejemplo

```
Usuario: Genera una imagen DENTAKORV de un psycho Santa
Claude: I'd like to use the "dentakorv-gpt-image" Skill. Is that OK?
# (usuario aprueba)
Claude: (carga SKILL.md, ejecuta flujo de generación)
```

---

## 8. Testing y Debug

### Ver Skills disponibles

```bash
# En Claude Code
> What Skills are available?
```

### Crear y testear un Skill

```bash
# 1. Crear estructura
mkdir -p .claude/skills/mi-skill

# 2. Crear SKILL.md
# (escribir contenido)

# 3. Salir y reiniciar Claude Code
exit

# 4. Ejecutar pregunta que matchee la descripción
> (pregunta que trigger el Skill)
```

### Debugging - Checklist

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| Skill no carga | Ruta incorrecta | Verificar: `.claude/skills/nombre/SKILL.md` |
| Skill no triggers | Descripción vaga | Incluir keywords específicos |
| Error YAML | Syntax inválido | `---` en línea 1, espacios (no tabs) |
| MCP no funciona | Server no instalado | `claude mcp add...` |
| Permisos | allowed-tools incorrecto | Verificar nombres de herramientas |

### Debug avanzado

```bash
claude --debug
# (genera salida verbose con errores de carga)
```

---

## 9. Skills vs Slash Commands

| Aspecto | Slash Commands | Skills |
|---------|----------------|--------|
| **Invocación** | Explícita: `/comando` | Automática: basada en context |
| **Complejidad** | Prompts simples | Workflows complejos |
| **Estructura** | Un archivo .md | Directorio con múltiples archivos |
| **Discovery** | Requiere saber el comando | Claude descubre automáticamente |
| **Herramientas** | No tiene `allowed-tools` | Puede especificar herramientas |

**Usa Slash Commands para:**
- Prompts frecuentes que invocas manualmente
- Instrucciones simples y directas

**Usa Skills para:**
- Workflows que Claude debe detectar automáticamente
- Capabilidades complejas con múltiples archivos
- Automatización con browser o APIs

---

## 10. El Skill DENTAKORV-GPT-Image

### Ubicación

```
.claude/skills/dentakorv-gpt-image/
├── SKILL.md          # Skill principal
├── REFERENCE.md      # Documentación técnica DENTAKORV
└── EXAMPLES.md       # Prompts exitosos (incluye primer test exitoso)
```

### Cómo usarlo

1. **Asegurar que estás autenticado en chat.openai.com**
2. **Invocar con pregunta natural:**
   ```
   > Genera una imagen DENTAKORV de un biomechanical artist
   ```
3. **Claude detecta el Skill y pide permiso**
4. **Apruebas y Claude ejecuta:**
   - Navega a ChatGPT
   - Genera prompt usando estructura DENTAKORV
   - Envía prompt descriptivo
   - **IMPORTANTE:** Si ChatGPT responde con texto, envía "Generate this image now"
   - Espera generación (15-45 segundos)
   - Captura resultado

### Lección Crítica (Dic 2025)

**ChatGPT NO genera imágenes automáticamente** con solo el prompt descriptivo.

❌ **Esto NO funciona:**
```
[prompt DENTAKORV descriptivo]
→ ChatGPT responde con TEXTO expandido
```

✅ **Esto SÍ funciona:**
```
[prompt DENTAKORV descriptivo]
→ ChatGPT responde con texto
"Generate this image now"
→ ChatGPT genera la imagen
```

**Alternativa:** Prefixar el prompt con "Generate an image of:"

### Personalización

Editar archivos en `.claude/skills/dentakorv-gpt-image/`:
- **SKILL.md:** Flujo principal y instrucciones
- **REFERENCE.md:** Vocabulario, paletas, estilos de render
- **EXAMPLES.md:** Añadir nuevos prompts exitosos

---

## 11. Mejores Prácticas

1. **Descriptions específicas** - Incluye trigger terms que usuarios dirían
2. **SKILL.md < 500 líneas** - Usa progressive disclosure para referencias
3. **allowed-tools explícito** - Especifica todas las herramientas necesarias
4. **Testing en contexto real** - Verifica que matchea preguntas naturales
5. **Nombres lowercase-con-hyphens** - Máximo 64 caracteres
6. **Documentación en archivos separados** - REFERENCE.md, EXAMPLES.md

---

## 12. Resumen: Crear Skill con Browser Automation

```bash
# 1. Instalar MCP
claude mcp add --transport stdio claude-in-chrome -- npx -y @claude-in-chrome/mcp

# 2. Crear directorio
mkdir -p .claude/skills/mi-skill

# 3. Crear SKILL.md
cat > .claude/skills/mi-skill/SKILL.md << 'EOF'
---
name: mi-skill
description: Lo que hace y cuándo usarlo. Keywords relevantes.
allowed-tools: mcp__claude-in-chrome__*, Read
---

# Mi Skill

## Overview
Qué hace...

## Instrucciones
Cómo hacerlo...

## Ejemplos
Casos de uso...
EOF

# 4. Reiniciar Claude Code
exit

# 5. Testear
> (pregunta que trigger el Skill)
```

---

*Documentación compilada para proyecto EsquizoAI*
*Diciembre 2025*
