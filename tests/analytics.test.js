'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

let received = null;
function startMock() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let b = ''; req.on('data', d => b += d);
      req.on('end', () => { received = { url: req.url, body: JSON.parse(b) }; res.statusCode = 200; res.end('{}'); });
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
function mkRes() {
  const r = { code: 200, ended: false, payload: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = c => { r.code = c; return r; };
  r.end = () => { r.ended = true; return r; };
  r.json = p => { r.payload = p; r.ended = true; return r; };
  return r;
}
async function call(handler, method, body, headers) {
  const res = mkRes();
  await handler({ method, body, headers: Object.assign({ host: 'catedra.test' }, headers || {}) }, res);
  return res;
}
const fresh = f => { delete require.cache[require.resolve(f)]; return require(f); };
const reset = () => { for (const k of Object.keys(process.env)) if (/^(POSTHOG|FEEDBACK)/.test(k)) delete process.env[k]; };

test('eventos de uso', async t => {
  const srv = await startMock();
  t.after(() => srv.close());
  const host = 'http://127.0.0.1:' + srv.address().port;

  await t.test('sin clave no hace nada (204) y no reenvía', async () => {
    reset(); received = null;
    const h = fresh('../api/e.js');
    const r = await call(h, 'POST', { did: 'abcdefgh-1234', events: [{ name: 'app_open' }] });
    assert.equal(r.code, 204);
    assert.equal(received, null);
  });

  await t.test('reenvía en lote con clave, id anónimo y sin geolocalización', async () => {
    reset(); process.env.POSTHOG_KEY = 'phc_test'; process.env.POSTHOG_HOST = host;
    const h = fresh('../api/e.js');
    const r = await call(h, 'POST', { did: 'abcdefgh-1234', events: [{ name: 'session_done', ts: new Date().toISOString(), props: { n: 5, ok: true, minutes: 7 } }] });
    assert.equal(r.code, 204);
    assert.equal(received.url, '/batch/');
    assert.equal(received.body.api_key, 'phc_test');
    const ev = received.body.batch[0];
    assert.equal(ev.event, 'session_done');
    assert.equal(ev.properties.distinct_id, 'abcdefgh-1234');
    assert.equal(ev.properties.n, 5);
    assert.equal(ev.properties.$geoip_disable, true);
  });

  await t.test('limpia propiedades: descarta objetos, claves raras y recorta textos', async () => {
    const { cleanProps } = fresh('../api/e.js')._internals;
    const out = cleanProps({ ok: 1, texto: 'x'.repeat(200), obj: { a: 1 }, arr: [1], 'Mala Clave': 1, nul: null, fn: () => 1 });
    assert.equal(out.ok, 1);
    assert.equal(out.texto.length, 60);
    assert.equal('obj' in out, false);
    assert.equal('arr' in out, false);
    assert.equal('Mala Clave' in out, false);
  });

  await t.test('valida: método, origen, id, nombre de evento y tamaño', async () => {
    reset(); process.env.POSTHOG_KEY = 'phc_test'; process.env.POSTHOG_HOST = host;
    const h = fresh('../api/e.js');
    assert.equal((await call(h, 'GET')).code, 405);
    assert.equal((await call(h, 'POST', { did: 'abcdefgh-1234', events: [{ name: 'a' }] }, { origin: 'https://otro.com' })).code, 403);
    assert.equal((await call(h, 'POST', { did: 'x', events: [{ name: 'a' }] })).code, 400);
    assert.equal((await call(h, 'POST', { did: 'abcdefgh-1234', events: [{ name: 'Nombre Con Espacios' }] })).code, 400);
    received = null;
    const many = Array.from({ length: 80 }, () => ({ name: 'tick' }));
    assert.equal((await call(h, 'POST', { did: 'abcdefgh-1234', events: many })).code, 204);
    assert.equal(received.body.batch.length, 50);
  });

  await t.test('timestamps absurdos se reemplazan por ahora', async () => {
    const { validTs } = fresh('../api/e.js')._internals;
    const now = Date.now();
    assert.ok(Math.abs(new Date(validTs('1999-01-01')).getTime() - now) < 5000);
    assert.ok(Math.abs(new Date(validTs('basura')).getTime() - now) < 5000);
  });

  await t.test('config pública: solo estado y URL https segura, nunca la clave', async () => {
    reset(); process.env.POSTHOG_KEY = 'phc_secreta'; process.env.FEEDBACK_URL = 'https://wa.me/580000000000?text=Hola';
    let r = await call(fresh('../api/config.js'), 'GET');
    assert.deepEqual(r.payload, { analytics: true, feedbackUrl: 'https://wa.me/580000000000?text=Hola' });
    assert.ok(!JSON.stringify(r.payload).includes('phc_secreta'));
    process.env.FEEDBACK_URL = 'javascript:alert(1)';
    r = await call(fresh('../api/config.js'), 'GET');
    assert.equal(r.payload.feedbackUrl, '');
    reset();
    r = await call(fresh('../api/config.js'), 'GET');
    assert.deepEqual(r.payload, { analytics: false, feedbackUrl: '' });
  });
});
