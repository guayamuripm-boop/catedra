'use strict';
/* Catedra · Configuración pública para el cliente. Nunca devuelve secretos. */

function safeUrl(u) {
  const s = String(u || '').trim();
  return /^https:\/\/[^\s]{4,300}$/.test(s) ? s : '';
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({
    analytics: !!process.env.POSTHOG_KEY,
    feedbackUrl: safeUrl(process.env.FEEDBACK_URL)
  });
};
