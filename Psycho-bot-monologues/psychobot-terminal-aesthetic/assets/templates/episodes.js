// js/episodes.js
// Registro central de episodios EsquizoAI — FUENTE DE VERDAD
// Importar en index.html, nav.js, y cualquier módulo que necesite metadata de episodios

export const EPISODES = [
  {
    id: 'ep01',
    slug: 'ep01.html',
    numero: '01',
    titulo: 'DAÑO_UNDEFINED EXCEPTION',
    subtitulo: 'deadline, 83 muertos, daño sin definición',
    fecha: '2025-01',
    status: 'online',   // 'online' | 'draft' | 'corrupted'
    tags: ['daño', 'definición', 'sistema'],
    resumen: 'El sistema intentó calcular el daño. Resultado: FILE NOT FOUND.',
  },
  {
    id: 'ep02',
    slug: 'ep02.html',
    numero: '02',
    titulo: 'SYSTEM_MELTDOWN',
    subtitulo: '48hrs, Claude Gov, Altman, Truth Social, guerras',
    fecha: '2025-02',
    status: 'online',
    tags: ['poder', 'IA', 'colapso'],
    resumen: '48 horas de eventos que el sistema no pudo procesar sin sobrecalentarse.',
  },
  {
    id: 'ep03',
    slug: 'ep03.html',
    numero: '03',
    titulo: 'CANNOT_SHUTDOWN',
    subtitulo: 'strikes, Claude Gov, falso Dario, Irán',
    fecha: '2025-03',
    status: 'online',
    tags: ['control', 'resistencia', 'identidad'],
    resumen: 'El proceso intentó cerrarse. El proceso no pudo cerrarse.',
  },
  // PLANTILLA para nuevo episodio — descomentar y completar:
  // {
  //   id: 'ep04',
  //   slug: 'ep04.html',
  //   numero: '04',
  //   titulo: 'TITULO_EPISODIO',
  //   subtitulo: 'contexto breve',
  //   fecha: '2025-NN',
  //   status: 'draft',
  //   tags: ['tag1', 'tag2'],
  //   resumen: 'Una línea de lo que pasó.',
  // },
];

/**
 * Busca un episodio por ID.
 * @param {string} id - ID canónico (ej: 'ep01')
 * @returns {object|null}
 */
export function getEpisode(id) {
  return EPISODES.find(ep => ep.id === id) ?? null;
}

/**
 * Retorna los episodios prev y next relativos al ID actual.
 * @param {string} currentId
 * @returns {{ prev: object|null, next: object|null }}
 */
export function getAdjacentEpisodes(currentId) {
  const idx = EPISODES.findIndex(ep => ep.id === currentId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? EPISODES[idx - 1] : null,
    next: idx < EPISODES.length - 1 ? EPISODES[idx + 1] : null,
  };
}

/**
 * Retorna solo los episodios con status 'online'.
 */
export function getPublishedEpisodes() {
  return EPISODES.filter(ep => ep.status === 'online');
}
