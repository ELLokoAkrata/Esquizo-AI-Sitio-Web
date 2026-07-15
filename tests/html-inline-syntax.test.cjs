const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const files = [
  'index.html',
  'nexo/index.html',
  'msn/index.html',
  'oraculo/index.html',
  'void-glitch/index.html',
  'tools/TERMINAL_ESQUIZO.html',
  'granja/index.html',
];

let checked = 0;
for (const relative of files) {
  const html = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    if (/\bsrc\s*=/.test(match[1])) continue;
    assert.doesNotThrow(() => new Function(match[2]), `${relative} contiene JavaScript inline inválido`);
    checked += 1;
  }
}

assert.ok(checked >= 7, 'deben comprobarse los scripts inline principales');
console.log(`HTML inline: ${checked} scripts válidos`);
