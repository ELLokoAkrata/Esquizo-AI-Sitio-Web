# ChatGPT - Hacks y Hallazgos Técnicos

**Fecha inicio:** 2026-01-18
**Propósito:** Documentar técnicas para inspeccionar/automatizar ChatGPT

---

## 1. INSPECCIÓN DE SIDEBAR VÍA REACT FIBER

**Descubierto:** 2026-01-18
**Contexto:** Buscando forma de identificar prompts duplicados sin abrir cada chat

### Problema
La sidebar de ChatGPT solo muestra títulos generados, no los prompts originales. Necesitábamos identificar duplicados.

### Hallazgo
ChatGPT usa React. Los elementos del DOM tienen acceso al React Fiber que contiene props con datos de la conversación.

### Código para extraer datos de chats

```javascript
// Obtener todos los links de chats
const chatLinks = document.querySelectorAll('a[href^="/c/"]');
const titleGroups = {};

chatLinks.forEach(link => {
  // Encontrar la key del React Fiber
  const fiberKey = Object.keys(link).find(k => k.startsWith('__reactFiber'));
  const fiber = link[fiberKey];

  // Función para navegar el fiber y encontrar conversation
  function getConversation(f, depth = 0) {
    if (depth > 15) return null;
    if (f?.memoizedProps?.conversation) return f.memoizedProps.conversation;
    if (f?.return) return getConversation(f.return, depth + 1);
    return null;
  }

  const conv = getConversation(fiber);
  if (conv) {
    // conv tiene: id, title, create_time, etc.
    const title = conv.title;
    if (!titleGroups[title]) titleGroups[title] = [];
    titleGroups[title].push(conv.id);
  }
});

// Agrupar por título para identificar duplicados
const duplicates = Object.entries(titleGroups)
  .filter(([title, ids]) => ids.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(duplicates);
```

### Datos disponibles en `conversation`

| Campo | Descripción |
|-------|-------------|
| `id` | UUID de la conversación |
| `title` | Título generado por ChatGPT |
| `create_time` | Timestamp ISO de creación |
| `mapping` | (vacío en sidebar) |
| `snippet` | (null en sidebar) |

### Limitaciones

- **No hay acceso al prompt** desde la sidebar
- El título es generado por ChatGPT, no es el prompt original
- Títulos iguales NO garantizan prompts iguales
- Para confirmar el prompt hay que abrir el chat o hacer fetch a la API

### Uso práctico

Sirve para **priorizar** revisión:
1. Agrupar chats por título
2. Los grupos grandes (mismo título) son candidatos a duplicados
3. Revisar 1 chat de cada grupo para obtener el prompt base
4. Comparar el resto del grupo contra ese prompt

---

## 2. ANÁLISIS REALIZADO (2026-01-18)

### Resultado del script en cuenta de El Loko

```
Total chats: 28
Títulos únicos: 13
Duplicados probables: ~15

Grupos con mismo título:
- "Sticker psicodélico horror": 6 chats
- "Sticker visceral psicodélico": 5 chats
- "Sticker psicodélico rata": 4 chats
- "Sticker psicodélico perro": 3 chats
- "Sticker psicodélico bizarro": 2 chats
```

### Verificación manual (Bloque 1: 10 chats)

Al revisar manualmente encontramos que títulos iguales a veces tienen prompts diferentes:
- "Sticker psicodélico perro" incluía: weimaraner Y golden skater (diferentes!)

**Conclusión:** Los títulos ayudan a priorizar pero no reemplazan verificación manual.

---

## 3. API INTERNA - INTENTOS Y RESULTADOS

**Fecha:** 2026-01-18

### Intento: Fetch a `/backend-api/conversation/{id}`

```javascript
fetch('/backend-api/conversation/' + conversationId, {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log(data));
```

### Resultado: BLOQUEADO

```json
{
  "detail": {
    "message": "Conversation {id} not found.",
    "code": "conversation_not_found"
  }
}
```

### Análisis

- La API existe y responde
- Devuelve "not found" incluso para chats que SÍ existen (verificado navegando manualmente)
- **Causa probable:** Cookies httpOnly que el fetch no puede usar correctamente
- localStorage y sessionStorage no tienen tokens de auth accesibles

### Verificación

- Al navegar a `/c/{id}` manualmente, el chat carga correctamente
- El título aparece en la pestaña del navegador
- La API debe usar autenticación server-side que no es accesible desde fetch en JS

### Conclusión

**No es posible hacer fetch masivo** a la API de ChatGPT desde el navegador.

**Alternativa viable:** Extraer el prompt del DOM después de navegar a cada chat.

---

## 4. MÉTODO RECOMENDADO: DOM SCRAPING

Dado que la API no es accesible, el flujo más eficiente es:

1. Usar **React Fiber** para obtener lista de chats con títulos
2. **Agrupar por título** para identificar probables duplicados
3. **Navegar** a un chat de cada grupo
4. **Extraer prompt** del DOM: `document.querySelector('[data-message-author-role="user"]')`
5. Comparar con prompts conocidos y borrar duplicados

### Código para extraer prompt del chat abierto

```javascript
// Después de navegar a un chat
const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
const firstPrompt = userMessages[0]?.textContent || 'No prompt found';
console.log(firstPrompt);
```

---

## NOTAS

- La estructura de React puede cambiar con updates de ChatGPT
- Estos hacks son para uso personal, no para scraping masivo
- Documentar cambios si algo deja de funcionar

---

*Documentado por Claude + El Loko*
