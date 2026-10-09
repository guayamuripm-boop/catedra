const VERSION = 'catedra-v25';
const SHARE_CACHE = 'catedra-share';
const PRECACHE = ['./app.html', './index.html', './manifest.json', './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png', './js/vendor/ts-fsrs.umd.js', './js/srs.js', './js/study.js', './js/tutor.js', './js/voice.js', './js/diag.js', './js/data.js', './js/ai.js', './js/apply.js','./js/habits.js','./js/survey.js','./js/space.js','./js/strategies.js','./js/areas.js','./js/experiment.js','./js/hub.js','./js/pack.js','./js/focus.js','./js/brain.js', './js/track.js', './privacidad.html', './acerca.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== SHARE_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function handleShare(request) {
  try {
    const form = await request.formData();
    const cache = await caches.open(SHARE_CACHE);
    const meta = {
      title: String(form.get('title') || ''),
      text: String(form.get('text') || ''),
      url: String(form.get('url') || ''),
      files: []
    };
    const files = form.getAll('files').filter(f => f && typeof f === 'object' && f.size > 0);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const key = './share/file-' + i;
      await cache.put(key, new Response(f, { headers: { 'Content-Type': f.type || 'application/octet-stream' } }));
      meta.files.push({ key, name: f.name, type: f.type, size: f.size });
    }
    await cache.put('./share/meta', new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } }));
  } catch (err) {
    // si falla, se abre la app igual
  }
  return Response.redirect('./app?shared=1', 303);
}

// Archivos propios: red primero (siempre version coherente), cache como respaldo sin conexion
async function networkFirst(req) {
  const p = new URL(req.url).pathname;
  const key = req.mode === 'navigate' ? (p === '/' || p.endsWith('/index.html') ? './index.html' : './app.html') : req;
  const net = fetch(req.url, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(key, copy)); }
    return res;
  });
  const timeout = new Promise(r => setTimeout(() => r(null), 5000));
  try {
    const first = await Promise.race([net, timeout]);
    if (first) return first;
  } catch (e) { /* sin red */ }
  const cached = await caches.match(key);
  if (cached) return cached;
  return net;
}

// Externos (fuentes, pdf.js): cache primero y se actualiza en segundo plano
function staleWhileRevalidate(req) {
  return caches.match(req).then(cached => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => cached);
    return cached || net;
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith(handleShare(req));
    return;
  }
  if (req.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  if (url.origin === location.origin) e.respondWith(networkFirst(req));
  else e.respondWith(staleWhileRevalidate(req));
});
