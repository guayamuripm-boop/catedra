'use strict';
/* Revisa la sintaxis de todo el JavaScript de la app (navegador, API y service worker). Lo usa el CI: npm run check */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..');
const files = ['sw.js']
  .concat(fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f))
  .concat(fs.readdirSync(path.join(root, 'api')).filter(f => f.endsWith('.js')).map(f => 'api/' + f));
let bad = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'pipe' }); }
  catch (e) { bad++; console.error('✖ ' + f + '\n' + String(e.stderr || e.message)); }
}
console.log((bad ? '✖ ' + bad + ' con errores' : '✔ sintaxis correcta') + ' en ' + files.length + ' archivos');
process.exit(bad ? 1 : 0);
