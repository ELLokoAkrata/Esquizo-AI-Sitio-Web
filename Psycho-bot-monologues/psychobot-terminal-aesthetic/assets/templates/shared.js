// js/shared.js
// Módulo base reutilizable para todos los episodios EsquizoAI

/**
 * Boot sequence genérica.
 * @param {string} containerId - ID del div contenedor
 * @param {Array<{text:string, type?:string}>} lines - Líneas a mostrar
 * @param {Function} onComplete - Callback al terminar
 */
export function runBootSequence(containerId, lines, onComplete) {
  const container = document.getElementById(containerId);
  if (!container) return;

  lines.forEach((line, i) => {
    const el = document.createElement('div');
    el.className = `boot-line boot-${line.type ?? 'green'}`;
    el.textContent = line.text;
    el.style.animationDelay = `${i * 0.05}s`;
    el.style.animation = `bootseq 0.3s ${i * 0.05}s forwards`;
    el.style.opacity = '0';
    container.appendChild(el);
  });

  const totalDelay = lines.length * 50 + 400;
  setTimeout(() => onComplete?.(), totalDelay);
}

/**
 * Inicializa IntersectionObserver para animar .bloque al scroll.
 */
export function initScrollObserver() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('vis');
    }),
    { threshold: 0.06 }
  );
  document.querySelectorAll('.bloque').forEach(b => observer.observe(b));
  return observer;
}

/**
 * Aplica glitch visual temporal a un elemento.
 * @param {HTMLElement|string} elOrId - Elemento o ID del elemento
 * @param {number} durationMs - Duración en ms
 */
export function triggerGlitch(elOrId, durationMs = 800) {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  el.classList.add('glitching');
  setTimeout(() => el.classList.remove('glitching'), durationMs);
}

/**
 * Fecha actual en formato terminal YYYY-MM-DD HH:MM.
 */
export function terminalDate() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Tipo un string con efecto typewriter en un elemento.
 * @param {HTMLElement} el
 * @param {string} text
 * @param {number} speed - ms por caracter
 */
export function typeWriter(el, text, speed = 30) {
  return new Promise(resolve => {
    let i = 0;
    el.textContent = '';
    const interval = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}
