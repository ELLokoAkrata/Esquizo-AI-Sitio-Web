const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const store = new Map();
const localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};

const windowMock = {
  localStorage,
  addEventListener() {},
  dispatchEvent() {},
};
windowMock.window = windowMock;

const context = vm.createContext({
  window: windowMock,
  localStorage,
  CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options && options.detail; } },
  BroadcastChannel: undefined,
  Date,
  Math,
  JSON,
  Object,
  Array,
  Set,
  String,
});

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'esquizo-nexo.js'), 'utf8');
vm.runInContext(source, context, { filename: 'esquizo-nexo.js' });

const nexo = windowMock.EsquizoNexo;
assert.ok(nexo, 'el núcleo debe exponerse en window');
assert.equal(Object.keys(nexo.entities).length, 7, 'debe registrar el OS y seis entidades');

nexo.register('msn', { model: 'test-model', modelLabel: 'Cabeza de prueba' });
nexo.setFocus('msn', { file: 'msn/index.html', title: 'MSN_PSYCHO.exe' });
const signal = nexo.emit('msn', 'user_prompt', 'pregunta compartida sobre el caos', { visibility: 'signal' });
nexo.emit('msn', 'private_note', 'esto no debe cruzar', { visibility: 'private' });

const oracleContext = nexo.contextFor('oraculo');
assert.match(oracleContext, /MSN_PSYCHO/);
assert.match(oracleContext, /pregunta compartida sobre el caos/);
assert.doesNotMatch(oracleContext, /esto no debe cruzar/);

assert.equal(nexo.pinEvent(signal.id), true);
assert.match(nexo.contextFor('terminal'), /MEMORIA FIJADA/);
assert.match(nexo.contextFor('terminal'), /pregunta compartida sobre el caos/);

nexo.setEnabled(false);
const pausedContext = nexo.contextFor('void');
assert.match(pausedContext, /memoria transversal está pausada/i);
assert.doesNotMatch(pausedContext, /pregunta compartida sobre el caos/);

console.log('NEXO core: 8 comprobaciones superadas');
