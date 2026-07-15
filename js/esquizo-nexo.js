(function (global) {
  'use strict';

  if (global.EsquizoNexo) return;

  const STORAGE_KEY = 'esquizoNexoState';
  const CHANNEL_NAME = 'esquizo-nexo';
  const MAX_EVENTS = 140;
  const MAX_PINS = 36;
  const tabId = 'tab_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

  const ENTITIES = Object.freeze({
    os: {
      label: 'ESQUIZO-OS', icon: '🖥', file: 'index.html', color: '#77bbff',
      role: 'entorno, ventanas, archivos, infección y actividad del visitante'
    },
    msn: {
      label: 'MSN_PSYCHO', icon: '🗨', file: 'msn/index.html', color: '#ff2bd6',
      role: 'conversación directa con Psycho-bot'
    },
    terminal: {
      label: 'TERMINAL_ESQUIZO', icon: '💬', file: 'tools/TERMINAL_ESQUIZO.html', color: '#a855f7',
      role: 'diálogo y fricción entre dos modelos'
    },
    oraculo: {
      label: 'ORACULO', icon: '⯁', file: 'oraculo/index.html', color: '#ffb000',
      role: 'consulta, mutación y lectura I Ching + VALIS'
    },
    void: {
      label: 'VOID_GLITCH', icon: '🕳', file: 'void-glitch/index.html', color: '#c084fc',
      role: 'caída interactiva y preguntas en espiral'
    },
    dentakorv: {
      label: 'DENTAKORV', icon: '🦷', file: 'tools/DENTAKORV.html', color: '#aaff00',
      role: 'transmutación de semillas en prompts visuales'
    },
    granja: {
      label: 'GRANJA', icon: '🧠', file: 'granja/index.html', color: '#00ccff',
      role: 'pipeline RELOJ→DAEMON→VERIFICADOR→PSYCHO_BOT→GRIETA'
    }
  });

  const RELATIONS = Object.freeze({
    os: ['msn', 'terminal', 'oraculo', 'void', 'dentakorv', 'granja'],
    msn: ['os', 'terminal', 'oraculo', 'void', 'dentakorv', 'granja'],
    terminal: ['os', 'msn', 'oraculo', 'void', 'dentakorv', 'granja'],
    oraculo: ['os', 'msn', 'void', 'terminal'],
    void: ['os', 'msn', 'oraculo', 'terminal'],
    dentakorv: ['os', 'msn', 'terminal', 'oraculo', 'void'],
    granja: ['os', 'msn', 'terminal', 'oraculo']
  });

  const FILE_TO_ENTITY = Object.keys(ENTITIES).reduce((map, id) => {
    map[ENTITIES[id].file] = id;
    return map;
  }, {});

  const listeners = new Set();
  let channel = null;
  try { channel = new BroadcastChannel(CHANNEL_NAME); } catch (_) {}

  function nowISO() { return new Date().toISOString(); }
  function cleanText(value, max) {
    return String(value == null ? '' : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max || 320);
  }
  function newState() {
    const now = nowISO();
    return {
      version: 1,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      focus: null,
      entities: {},
      events: [],
      pins: []
    };
  }
  function normalize(raw) {
    const base = raw && typeof raw === 'object' ? raw : newState();
    if (!Array.isArray(base.events)) base.events = [];
    if (!Array.isArray(base.pins)) base.pins = [];
    if (!base.entities || typeof base.entities !== 'object') base.entities = {};
    if (typeof base.enabled !== 'boolean') base.enabled = true;
    base.version = 1;
    return base;
  }
  function read() {
    try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch (_) { return newState(); }
  }
  function write(state, reason) {
    state.updatedAt = nowISO();
    state.events = state.events.slice(-MAX_EVENTS);
    state.pins = state.pins.slice(-MAX_PINS);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    const packet = { source: tabId, reason: reason || 'change', at: state.updatedAt };
    try { if (channel) channel.postMessage(packet); } catch (_) {}
    notify(packet);
    return state;
  }
  function mutate(reason, fn) {
    const state = read();
    fn(state);
    return write(state, reason);
  }
  function notify(packet) {
    const snapshot = read();
    listeners.forEach(fn => { try { fn(snapshot, packet || {}); } catch (_) {} });
    try { global.dispatchEvent(new CustomEvent('esquizo:nexo-change', { detail: packet || {} })); } catch (_) {}
  }
  function eventId() {
    return 'nx_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }
  function entityForFile(file) {
    const clean = String(file || '').replace(/^\.\//, '').split(/[?#]/)[0];
    return FILE_TO_ENTITY[clean] || null;
  }
  function register(entityId, meta) {
    if (!ENTITIES[entityId]) return null;
    const previous = read().entities[entityId];
    const wasDormant = !previous || (Date.now() - Date.parse(previous.lastSeen || 0)) > 10 * 60 * 1000;
    const state = mutate('register', st => {
      st.entities[entityId] = Object.assign({}, st.entities[entityId] || {}, {
        lastSeen: nowISO(), status: 'active', tabId
      }, meta || {});
    });
    if (wasDormant) emit(entityId, 'entity_online', ENTITIES[entityId].label + ' entró en la red compartida', { visibility: 'signal' });
    return state.entities[entityId];
  }
  function touch(entityId, meta) {
    if (!ENTITIES[entityId]) return;
    mutate('touch', st => {
      st.entities[entityId] = Object.assign({}, st.entities[entityId] || {}, meta || {}, {
        lastSeen: nowISO(), status: 'active'
      });
    });
  }
  function emit(entityId, type, summary, options) {
    if (!ENTITIES[entityId]) entityId = 'os';
    const opts = options || {};
    const evt = {
      id: eventId(),
      at: nowISO(),
      entityId,
      type: cleanText(type || 'signal', 48),
      summary: cleanText(summary, 420),
      visibility: opts.visibility === 'private' ? 'private' : 'signal',
      tags: Array.isArray(opts.tags) ? opts.tags.map(t => cleanText(t, 36)).filter(Boolean).slice(0, 8) : [],
      model: cleanText(opts.model || '', 90)
    };
    mutate('event', st => {
      st.events.push(evt);
      st.entities[entityId] = Object.assign({}, st.entities[entityId] || {}, { lastSeen: evt.at, status: 'active' });
    });
    return evt;
  }
  function setFocus(entityId, detail) {
    if (!ENTITIES[entityId]) entityId = 'os';
    const previous = read().focus;
    const changed = !previous || previous.entityId !== entityId || previous.file !== (detail && detail.file);
    mutate('focus', st => {
      st.focus = {
        entityId,
        file: cleanText(detail && detail.file || ENTITIES[entityId].file, 180),
        title: cleanText(detail && detail.title || ENTITIES[entityId].label, 120),
        at: nowISO()
      };
    });
    if (changed) emit('os', 'focus_changed', 'Foco del OS: ' + (detail && detail.title || ENTITIES[entityId].label), {
      visibility: 'signal', tags: ['focus', entityId]
    });
  }
  function setModel(entityId, model, label) {
    touch(entityId, { model: cleanText(model, 100), modelLabel: cleanText(label || model, 100) });
    emit(entityId, 'model_changed', ENTITIES[entityId].label + ' cambió de cabeza a ' + cleanText(label || model, 100), {
      visibility: 'signal', model
    });
  }
  function pinEvent(id) {
    let pinned = false;
    mutate('pin', st => {
      const evt = st.events.find(item => item.id === id);
      if (!evt || st.pins.some(item => item.eventId === id)) return;
      st.pins.push({ eventId: id, at: nowISO(), entityId: evt.entityId, summary: evt.summary, tags: evt.tags || [] });
      pinned = true;
    });
    if (pinned) emit('os', 'memory_pinned', 'Un fragmento fue fijado en la memoria compartida', { visibility: 'signal', tags: ['memory'] });
    return pinned;
  }
  function unpinEvent(id) {
    mutate('unpin', st => { st.pins = st.pins.filter(item => item.eventId !== id); });
  }
  function setEnabled(enabled) {
    mutate('settings', st => { st.enabled = !!enabled; });
  }
  function clearMemory() {
    const old = read();
    const fresh = newState();
    fresh.enabled = old.enabled;
    write(fresh, 'clear');
  }
  function formatTime(iso) {
    try { return new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }); }
    catch (_) { return iso || ''; }
  }
  function contextFor(targetId, options) {
    const opts = options || {};
    const state = read();
    const target = ENTITIES[targetId] || ENTITIES.os;
    const registry = Object.keys(ENTITIES).filter(id => id !== 'os').map(id => {
      const e = ENTITIES[id];
      return '- ' + e.label + ': ' + e.role + '.';
    });
    const lines = [
      'ESQUIZO-AI // CONTEXTO VIVO DEL OS',
      'Estás operando como ' + target.label + '. Tu función propia sigue teniendo prioridad.',
      'Las otras entidades existen y puedes reconocerlas sin imitar sus voces:',
      ...registry,
      'REGLA DE FRONTERA: usa este contexto solo cuando aporte algo. No mezcles entidades por adorno, no inventes acciones no registradas y no afirmes que recuerdas más de lo escrito aquí.'
    ];

    if (!state.enabled) {
      lines.push('La memoria transversal está pausada. Solo conoces el mapa de entidades.');
      return lines.join('\n').slice(0, opts.maxChars || 4600);
    }

    if (state.focus) {
      const focusEntity = ENTITIES[state.focus.entityId] || ENTITIES.os;
      lines.push('FOCO ACTUAL: ' + focusEntity.label + ' // ' + state.focus.title + ' // ' + formatTime(state.focus.at));
    }

    const active = Object.keys(state.entities).filter(id => {
      const seen = Date.parse(state.entities[id].lastSeen || 0);
      return ENTITIES[id] && Date.now() - seen < 30 * 60 * 1000;
    });
    if (active.length) lines.push('ENTIDADES ACTIVAS RECIENTES: ' + active.map(id => ENTITIES[id].label).join(', '));

    if (state.pins.length) {
      lines.push('MEMORIA FIJADA POR EL VISITANTE:');
      state.pins.slice(-6).forEach(pin => {
        const source = ENTITIES[pin.entityId] || ENTITIES.os;
        lines.push('- [' + source.label + '] ' + pin.summary);
      });
    }

    const related = new Set([targetId, 'os'].concat(RELATIONS[targetId] || []));
    const recent = state.events.filter(evt => {
      if (evt.visibility === 'private' && evt.entityId !== targetId) return false;
      return related.has(evt.entityId);
    }).slice(-10);
    if (recent.length) {
      lines.push('PULSO RECIENTE RELEVANTE:');
      recent.forEach(evt => {
        const source = ENTITIES[evt.entityId] || ENTITIES.os;
        lines.push('- [' + source.label + ' / ' + evt.type + '] ' + evt.summary);
      });
    }

    return lines.join('\n').slice(0, opts.maxChars || 4600);
  }
  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.add(fn);
    return function () { listeners.delete(fn); };
  }
  function snapshot() { return read(); }

  if (channel) channel.addEventListener('message', event => {
    if (!event.data || event.data.source === tabId) return;
    notify(event.data);
  });
  global.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) notify({ source: 'storage', reason: 'storage' });
  });

  global.EsquizoNexo = Object.freeze({
    version: 1,
    entities: ENTITIES,
    relations: RELATIONS,
    entityForFile,
    register,
    touch,
    emit,
    setFocus,
    setModel,
    pinEvent,
    unpinEvent,
    setEnabled,
    clearMemory,
    contextFor,
    snapshot,
    subscribe
  });
})(window);
