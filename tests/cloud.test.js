'use strict';
/* Prueba el flujo real de js/cloud.js (cuenta + sincronización) contra un Supabase simulado:
   dos "dispositivos" (contextos vm con su propio localStorage y estado) comparten una nube falsa. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SYNC = require('../js/sync.js');
const cloudSrc = fs.readFileSync(path.join(__dirname, '../js/cloud.js'), 'utf8');

function makeServer() {
  const rows = new Map(); let tick = 0;
  const ts = () => '2026-10-17T00:00:' + String(++tick).padStart(2, '0') + '.000000+00:00';
  const json = (status, body) => ({ ok: status < 300, status, json: async () => body });
  return {
    rows,
    fetch: async (url, opt = {}) => {
      const u = new URL(url); const p = u.pathname; const m = opt.method || 'GET';
      if (p === '/auth/v1/token') { return json(200, { access_token: 'tok', refresh_token: 'ref', expires_in: 3600, user: { id: 'uid1', email: 'a@b.co' } }); }
      if (p === '/rest/v1/user_state') {
        const uid = (u.searchParams.get('user_id') || '').replace('eq.', '');
        if (m === 'GET') { const r = rows.get(uid); return json(200, r ? [Object.assign({}, r)] : []); }
        if (m === 'POST') { const b = JSON.parse(opt.body); if (rows.has(b.user_id)) return json(409, {}); const r = Object.assign({}, b, { updated_at: ts() }); rows.set(b.user_id, r); return json(201, [r]); }
        if (m === 'PATCH') {
          const exp = decodeURIComponent((u.searchParams.get('updated_at') || '').replace('eq.', ''));
          const r = rows.get(uid); if (!r || r.updated_at !== exp) return json(200, []);
          const n = Object.assign({}, r, JSON.parse(opt.body), { updated_at: ts() }); rows.set(uid, n); return json(200, [n]);
        }
      }
      return json(404, {});
    }
  };
}

function device(server, state, { confirmAnswer = true } = {}) {
  const store = {}; const ctx = {
    S: state, STATE_VERSION: 2, SYNC, console, URL, URLSearchParams, AbortController, setTimeout, clearTimeout, setInterval: () => 0, Date, JSON, encodeURIComponent, Math,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    fetch: server.fetch, toasts: [], confirms: 0, reloads: 0, kv: {},
    showToast(t) { ctx.toasts.push(t); }, esc: s => s,
    confirm() { ctx.confirms++; return confirmAnswer; },
    location: { reload() { ctx.reloads++; } },
    document: { getElementById: () => null, addEventListener() {} }, window: { addEventListener() {} },
    normalizeState: s => s, flushState: async () => {}, kvSet: async (k, v) => { ctx.kv[k] = v; }
  };
  vm.createContext(ctx);
  vm.runInContext(cloudSrc + '\nthis.api={cloudAuth,cloudSync,cloudDirty,cloudMeta,cloudSession};', ctx);
  return ctx;
}
// cloudAuth lanza una sincronización propia sin esperarla; se deja terminar antes de seguir
const login = async d => { const ok = await d.api.cloudAuth('in', 'a@b.co', '12345678'); await new Promise(r => setTimeout(r, 30)); return ok; };
const mk = (n, extra) => Object.assign({ onboarded: true, subjects: [{ id: 's' + n }], notes: [], materials: [], settings: { deviceId: 'dev' + n, pilotCode: 'p' + n } }, extra || {});

test('primer dispositivo sube; segundo (vacío) adopta y conserva su deviceId; sin código ni deviceId en la nube', async () => {
  const srv = makeServer();
  const A = device(srv, mk(1));
  assert.equal(await login(A), true);
  await A.api.cloudSync({ force: true });
  const row = srv.rows.get('uid1');
  assert.ok(row, 'se insertó la fila');
  assert.equal(row.state.settings.deviceId, undefined);
  assert.equal(row.state.settings.pilotCode, undefined);
  assert.equal(A.api.cloudMeta().dirty, false);

  const B = device(srv, { onboarded: false, subjects: [], notes: [], materials: [], settings: { deviceId: 'devB' } });
  await login(B);
  await B.api.cloudSync({ force: true });
  assert.equal(B.reloads, 1, 'recargó tras traer la nube');
  assert.equal(B.S.subjects[0].id, 's1');
  assert.equal(B.S.settings.deviceId, 'devB', 'conserva su identificador');
  assert.equal(B.confirms, 0);
});

test('cambio local pendiente se sube con la versión esperada y otro dispositivo lo adopta', async () => {
  const srv = makeServer();
  const A = device(srv, mk(1)); await login(A); await A.api.cloudSync({ force: true });
  const B = device(srv, { onboarded: false, subjects: [], notes: [], materials: [], settings: {} });
  await login(B); await B.api.cloudSync({ force: true });
  // A cambia y sube
  A.S.subjects.push({ id: 'nueva' }); A.api.cloudDirty();
  assert.equal(A.api.cloudMeta().dirty, true);
  await A.api.cloudSync({ force: true });
  assert.equal(srv.rows.get('uid1').state.subjects.length, 2);
  assert.equal(A.api.cloudMeta().dirty, false);
  // B (limpio) adopta
  B.reloads = 0; await B.api.cloudSync({ force: true });
  assert.equal(B.reloads, 1);
  assert.equal(B.S.subjects.length, 2);
});

test('conflicto: los dos cambiaron -> pregunta; elegir "este equipo" reemplaza la nube; elegir "nube" guarda copia', async () => {
  for (const keepCloud of [false, true]) {
    const srv = makeServer();
    const A = device(srv, mk(1)); await login(A); await A.api.cloudSync({ force: true });
    const B = device(srv, { onboarded: false, subjects: [], notes: [], materials: [], settings: {} }, { confirmAnswer: keepCloud });
    await login(B); await B.api.cloudSync({ force: true });
    A.S.subjects.push({ id: 'deA' }); A.api.cloudDirty(); await A.api.cloudSync({ force: true });
    B.S.subjects.push({ id: 'deB' }); B.api.cloudDirty();
    B.reloads = 0; await B.api.cloudSync({ force: true, interactive: true });
    assert.equal(B.confirms, 1, 'preguntó');
    if (keepCloud) { assert.equal(B.reloads, 1); assert.ok(B.kv['backup-pre-sync'], 'guardó copia local'); assert.ok(B.S.subjects.some(s => s.id === 'deA')); }
    else { assert.ok(srv.rows.get('uid1').state.subjects.some(s => s.id === 'deB')); assert.ok(!srv.rows.get('uid1').state.subjects.some(s => s.id === 'deA')); }
  }
});

test('equipo con datos entrando a cuenta con datos pregunta y no pisa en silencio', async () => {
  const srv = makeServer();
  const A = device(srv, mk(1)); await login(A); await A.api.cloudSync({ force: true });
  const B = device(srv, mk(2), { confirmAnswer: false });
  await login(B); await B.api.cloudSync({ force: true });
  assert.equal(B.confirms, 1);
});

test('contraseña corta o correo inválido no llaman a la red', async () => {
  const srv = makeServer(); let calls = 0; const f = srv.fetch; srv.fetch = async (...a) => { calls++; return f(...a); };
  const A = device(srv, mk(1));
  assert.equal(await A.api.cloudAuth('in', 'mal', '12345678'), false);
  assert.equal(await A.api.cloudAuth('in', 'a@b.co', 'corta'), false);
  assert.equal(calls, 0);
});

test('en segundo plano NUNCA pregunta (antes volvía a preguntar en cada sincronización automática); solo "Sincronizar" pregunta', async () => {
  const srv = makeServer();
  const A = device(srv, mk(1)); await login(A); await A.api.cloudSync({ force: true, interactive: true });
  // B entra con datos propios; confirma "quedarme con este equipo" la primera vez (interactivo)
  const B = device(srv, mk(2), { confirmAnswer: false });
  await login(B); // cloudAuth ya sincroniza interactivo tras entrar
  assert.equal(B.confirms, 1, 'preguntó una vez, al entrar');

  // Si por lo que sea la cuenta no quedó "vinculada" (p.ej. el mismatch que causaba el bug), una
  // sincronización EN SEGUNDO PLANO (sin interactive) nunca debe volver a preguntar.
  B.confirms = 0;
  await B.api.cloudSync({ force: true });              // como el tick automático: sin "interactive"
  await B.api.cloudSync({ force: true });
  await B.api.cloudSync({ force: true });
  assert.equal(B.confirms, 0, 'tres sincronizaciones automáticas seguidas: cero preguntas');
});
