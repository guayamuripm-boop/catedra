'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const SOURCE = 'La segunda ley de Newton establece que la fuerza neta sobre un objeto es igual al producto de su masa por su aceleración. Esto significa que los objetos más masivos requieren más fuerza para acelerar.';
let upstreamMode = 'ok';
let lastUpstreamBody = null;

function startMock() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let b = ''; req.on('data', d => b += d);
      req.on('end', () => {
        lastUpstreamBody = JSON.parse(b);
        const sys = lastUpstreamBody.messages[0].content;
        let content;
        if (upstreamMode === 'garbage') content = 'no es json';
        else if (sys.startsWith('Eres un generador')) {
          content = JSON.stringify({ items: [
            { pregunta: '¿Qué establece la segunda ley de Newton?', respuesta: 'F = m·a', explicacion: '', cita: 'la fuerza neta sobre un objeto es igual al producto de su masa por su aceleración', tipo: 'recuperacion', dificultad: 'media' },
            { pregunta: 'Pregunta con cita inventada', respuesta: 'x', explicacion: '', cita: 'esta frase no aparece en el texto fuente original', tipo: 'recuperacion', dificultad: 'media' },
            { pregunta: 'Tipo raro', respuesta: 'y', explicacion: '', cita: 'los objetos más masivos requieren más fuerza para acelerar', tipo: 'inventado', dificultad: 'extrema' }
          ] });
        } else if (sys.startsWith('Evalúas')) {
          content = JSON.stringify({ results: [{ state: 'covered', note: 'bien' }, { state: 'missed', note: 'falta' }], feedback: 'Sigue así' });
          if (upstreamMode === 'short_eval') content = JSON.stringify({ results: [{ state: 'covered', note: 'x' }], feedback: '' });
        } else content = JSON.stringify({ text: 'Apuntes de física', legible: true });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ choices: [{ message: { content } }], usage: { prompt_tokens: 100, completion_tokens: 50 } }));
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

function mkReq(method, body, headers) {
  return { method, body, headers: Object.assign({ host: 'catedra.test' }, headers || {}) };
}
function mkRes() {
  const r = { code: 200, headers: {}, payload: null };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = c => { r.code = c; return r; };
  r.json = p => { r.payload = p; return r; };
  return r;
}
async function call(handler, method, body, headers) {
  const res = mkRes();
  await handler(mkReq(method, body, headers), res);
  return res;
}
function freshHandler() {
  delete require.cache[require.resolve('../api/ai.js')];
  return require('../api/ai.js');
}
function resetEnv() {
  for (const k of Object.keys(process.env)) if (/^(GROQ|GEMINI|AI_|PILOT_)/.test(k)) delete process.env[k];
}

test('pasarela de IA', async t => {
  const srv = await startMock();
  const base = 'http://127.0.0.1:' + srv.address().port;
  t.after(() => srv.close());

  await t.test('cerrada por defecto: sin claves ni acceso no habilita nada', async () => {
    resetEnv();
    const h = freshHandler();
    let r = await call(h, 'GET');
    assert.equal(r.payload.enabled, false);
    process.env.GROQ_API_KEY = 'k';
    r = await call(freshHandler(), 'GET');
    assert.equal(r.payload.enabled, false, 'con clave pero sin PILOT_CODES/AI_OPEN sigue cerrada');
    r = await call(freshHandler(), 'POST', { task: 'generate', payload: { text: SOURCE } });
    assert.equal(r.code, 503);
  });

  await t.test('con código: exige el código correcto', async () => {
    resetEnv();
    process.env.GROQ_API_KEY = 'k'; process.env.GROQ_BASE_URL = base; process.env.PILOT_CODES = 'abc,def';
    const h = freshHandler();
    let r = await call(h, 'GET');
    assert.equal(r.payload.enabled, false, 'sin código no se anuncia como activa');
    r = await call(h, 'GET', null, { 'x-pilot-code': 'abc' });
    assert.deepEqual(r.payload.tasks, ['generate', 'evaluate']);
    r = await call(h, 'POST', { task: 'generate', payload: { text: SOURCE } });
    assert.equal(r.code, 401);
    r = await call(h, 'POST', { task: 'generate', payload: { text: SOURCE } }, { 'x-pilot-code': 'mala' });
    assert.equal(r.code, 401);
  });

  await t.test('generate: descarta citas inventadas y normaliza tipos', async () => {
    upstreamMode = 'ok';
    const h = freshHandler();
    const r = await call(h, 'POST', { task: 'generate', payload: { text: SOURCE } }, { 'x-pilot-code': 'abc', 'x-device': 'd1' });
    assert.equal(r.code, 200);
    assert.equal(r.payload.items.length, 2, 'la cita inventada se descarta');
    assert.equal(r.payload.items[1].tipo, 'recuperacion');
    assert.equal(r.payload.items[1].dificultad, 'media');
    assert.ok(lastUpstreamBody.messages[1].content.includes('<fuente>'), 'el texto va delimitado como datos');
    assert.equal(lastUpstreamBody.response_format.type, 'json_object');
  });

  await t.test('generate: texto corto y salida basura', async () => {
    const h = freshHandler();
    let r = await call(h, 'POST', { task: 'generate', payload: { text: 'corto' } }, { 'x-pilot-code': 'abc' });
    assert.equal(r.code, 400);
    upstreamMode = 'garbage';
    r = await call(h, 'POST', { task: 'generate', payload: { text: SOURCE } }, { 'x-pilot-code': 'abc' });
    assert.equal(r.code, 502);
    upstreamMode = 'ok';
  });

  await t.test('evaluate: exige un resultado por concepto', async () => {
    const h = freshHandler();
    const payload = { items: [{ pregunta: 'a', respuesta: 'b' }, { pregunta: 'c', respuesta: 'd' }], answer: 'mi respuesta' };
    let r = await call(h, 'POST', { task: 'evaluate', payload }, { 'x-pilot-code': 'abc' });
    assert.equal(r.code, 200);
    assert.equal(r.payload.results.length, 2);
    upstreamMode = 'short_eval';
    r = await call(h, 'POST', { task: 'evaluate', payload }, { 'x-pilot-code': 'abc' });
    assert.equal(r.code, 502);
    upstreamMode = 'ok';
  });

  await t.test('transcribe: solo con clave de Gemini y valida la imagen', async () => {
    let h = freshHandler();
    let r = await call(h, 'POST', { task: 'transcribe', payload: { image: 'data:image/jpeg;base64,AAAA' } }, { 'x-pilot-code': 'abc' });
    assert.equal(r.code, 400, 'sin clave de Gemini la tarea no está habilitada');
    process.env.GEMINI_API_KEY = 'g'; process.env.GEMINI_BASE_URL = base;
    h = freshHandler();
    r = await call(h, 'GET', null, { 'x-pilot-code': 'abc' });
    assert.ok(r.payload.tasks.includes('transcribe'));
    r = await call(h, 'POST', { task: 'transcribe', payload: { image: 'http://evil/x.png' } }, { 'x-pilot-code': 'abc' });
    assert.equal(r.code, 400);
    r = await call(h, 'POST', { task: 'transcribe', payload: { image: 'data:image/jpeg;base64,AAAA' } }, { 'x-pilot-code': 'abc' });
    assert.equal(r.code, 200);
    assert.equal(r.payload.text, 'Apuntes de física');
    assert.equal(lastUpstreamBody.messages[1].content[1].type, 'image_url');
  });

  await t.test('límite diario por usuario y rechazo de otros orígenes', async () => {
    process.env.AI_DAILY_LIMIT_PER_USER = '2';
    const h = freshHandler();
    const hd = { 'x-pilot-code': 'abc', 'x-device': 'lim' };
    const body = { task: 'generate', payload: { text: SOURCE } };
    assert.equal((await call(h, 'POST', body, hd)).code, 200);
    assert.equal((await call(h, 'POST', body, hd)).code, 200);
    assert.equal((await call(h, 'POST', body, hd)).code, 429);
    const r = await call(h, 'GET', null, { origin: 'https://otro-sitio.com' });
    assert.equal(r.code, 403);
    const ok = await call(h, 'GET', null, { origin: 'https://catedra.test' });
    assert.equal(ok.code, 200);
  });

  await t.test('interruptor de emergencia', async () => {
    process.env.AI_ENABLED = 'false';
    const r = await call(freshHandler(), 'GET', null, { 'x-pilot-code': 'abc' });
    assert.equal(r.payload.enabled, false);
  });
});
