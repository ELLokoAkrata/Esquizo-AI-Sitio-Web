// js/nav.js
// Navegación prev/next entre episodios EsquizoAI
// Importar en cada epNN.html: import { renderNav } from './js/nav.js';

import { getAdjacentEpisodes } from './episodes.js';

/**
 * Inyecta el bloque de navegación prev/next en el elemento con id=mountId.
 * @param {string} currentEpisodeId - ID canónico del episodio actual (ej: 'ep01')
 * @param {string} mountId - ID del div donde montar la nav (default: 'ep-nav')
 */
export function renderNav(currentEpisodeId, mountId = 'ep-nav') {
  const { prev, next } = getAdjacentEpisodes(currentEpisodeId);
  const mount = document.getElementById(mountId);
  if (!mount) return;

  mount.innerHTML = `
    <nav class="ep-nav">
      <div class="nav-prev">
        ${prev
          ? `<a href="${prev.slug}" class="nav-link">
               <span class="nav-label">← EPISODIO ${prev.numero}</span>
               <span class="nav-title">${prev.titulo}</span>
             </a>`
          : `<span class="nav-disabled">// INICIO_DE_ARCHIVO</span>`
        }
      </div>
      <a href="index.html" class="nav-index">[ ÍNDICE ]</a>
      <div class="nav-next">
        ${next
          ? `<a href="${next.slug}" class="nav-link nav-link-right">
               <span class="nav-label">EPISODIO ${next.numero} →</span>
               <span class="nav-title">${next.titulo}</span>
             </a>`
          : `<span class="nav-disabled nav-disabled-right">FILE_NOT_FOUND //</span>`
        }
      </div>
    </nav>
  `;
}

/*
CSS necesario — agregar al <style> de cada episodio o a shared.css:

.ep-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #552255;
  padding: 1.5rem 0;
  margin-top: 3rem;
  gap: 1rem;
}
.nav-prev, .nav-next { flex: 1; }
.nav-next { text-align: right; }
.nav-link {
  display: flex;
  flex-direction: column;
  color: var(--corrupt);
  text-decoration: none;
  font-size: 11px;
  letter-spacing: .1em;
  transition: color .2s;
}
.nav-link-right { align-items: flex-end; }
.nav-link:hover { color: var(--acid); }
.nav-label { font-size: 9px; color: #aa44bb; margin-bottom: .3rem; }
.nav-title { color: var(--white); }
.nav-index {
  color: var(--acid);
  text-decoration: none;
  font-size: 10px;
  letter-spacing: .2em;
  border: 1px solid #662266;
  padding: .4rem .8rem;
  white-space: nowrap;
  transition: background .2s;
}
.nav-index:hover { background: rgba(170,255,0,.05); }
.nav-disabled { color: #552255; font-size: 10px; letter-spacing: .1em; }
.nav-disabled-right { display: block; text-align: right; }
*/
