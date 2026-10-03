# Proxy de IA (opcional)

La app funciona sin esto. Con esto, genera preguntas y evalúa respuestas orales/escritas con un LLM.
La clave vive en el Worker; nunca llega al navegador.

1. Cuenta gratuita en Cloudflare y una clave de API de un proveedor compatible con OpenAI (p. ej. Groq).
2. `npx wrangler init catedra-ai`, reemplaza el código por `ai-proxy.js`.
3. `npx wrangler secret put AI_API_KEY` y pega tu clave.
4. Opcional: variables `AI_BASE_URL`, `AI_MODEL`, `ALLOWED_ORIGIN` (por defecto el sitio de GitHub Pages).
5. `npx wrangler deploy` y copia la URL.
6. En la app: Progreso > Tus datos > IA avanzada > pega la URL.

Seguridad: solo responde al origen permitido, limita el tamaño del texto y trata el material del estudiante como datos.
Pendiente antes de abrirlo a más gente: regla de límite de tasa en Cloudflare para controlar el costo.
La app valida lo que devuelve: descarta preguntas cuya cita no exista literalmente en el texto fuente.
