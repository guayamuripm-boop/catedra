'use strict';
/* Catedra · Recibe eventos de uso anónimos y los reenvía a PostHog (lote). Sin POSTHOG_KEY no hace nada.
   Nunca llegan textos del estudiante: solo nombres de evento y propiedades simples. */

const MAX_EVENTS = 50;
const NAME_RE = /^[a-z0-9_]{1,40}$/;
const DID_RE = /^[a-zA-Z0-9-]{8,64}$/;

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch (e) { return false; }
}
function cleanProps(p) {
  const out = {};
  if (!p || typeof p !== 'object') return out;
  let n = 0;
  for (const k of Object.keys(p)) {
    if (n >= 20) break;
    if (!/^[a-z0-9_]{1,30}$/.test(k)) continue;
    const v = p[k];
    if (typeof v === 'number' && isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string') out[k] = v.slice(0, 60);
    else continue;
    n++;
  }
  return out;
}
function validTs(t) {
  const d = new Date(t);
  const now = Date.now();
  if (isNaN(d) || d.getTime() > now + 60000 || d.getTime() < now - 7 * 864e5) return new Date().toISOString();
  return d.toISOString();
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).end(); return; }
  if (!sameOrigin(req)) { res.status(403).end(); return; }
  const key = process.env.POSTHOG_KEY;
  if (!key) { res.status(204).end(); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const did = body && body.did, events = body && body.events;
  if (!DID_RE.test(String(did || '')) || !Array.isArray(events) || !events.length) { res.status(400).end(); return; }

  const batch = events.slice(0, MAX_EVENTS)
    .filter(e => e && NAME_RE.test(String(e.name || '')))
    .map(e => ({
      event: e.name,
      properties: Object.assign({ distinct_id: did, app: 'catedra', $lib: 'catedra-web', $geoip_disable: true }, cleanProps(e.props)),
      timestamp: validTs(e.ts)
    }));
  if (!batch.length) { res.status(400).end(); return; }

  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 8000);
  try {
    const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
    const r = await fetch(host + '/batch/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, batch }), signal: ctl.signal
    });
    res.status(r.ok ? 204 : 502).end();
  } catch (e) {
    res.status(502).end();
  } finally { clearTimeout(to); }
}

module.exports = handler;
module.exports._internals = { cleanProps, validTs };
