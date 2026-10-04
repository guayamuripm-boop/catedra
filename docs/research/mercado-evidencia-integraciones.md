# Mercado, evidencia y herramientas existentes

Fecha: 2026-10-04. **[V]** verificado en fuente consultada, **[C]** conocimiento previo sin verificar aquí, **[D]** juicio propio.

---

## 1. El problema: ¿es real?

**La conducta está bien documentada.** La revisión de Dunlosky et al. (2013) evaluó 10 técnicas: la práctica de recuperación (autoexaminarse) y la práctica distribuida tuvieron la mayor utilidad; resumir, subrayar y releer tuvieron utilidad baja, y son justo las más usadas por los estudiantes [V]. Sin guía, los estudiantes sobreestiman cuánto entienden y recuerdan, y la mayoría nunca recibe instrucción sobre cómo estudiar [V, estudio de la app *Ace Your Self-Study*].

**Enseñar a estudiar funciona, pero la evidencia es de aulas, no de apps.** La EEF (Reino Unido) clasifica metacognición y autorregulación como de alto impacto y bajo costo: +7 a +8 meses de progreso en promedio [V]. Esos resultados vienen de programas guiados por docentes; que una app reproduzca el efecto **no está probado** [D]. Es la hipótesis central que hay que medir, no un hecho.

**Matiz de posicionamiento [D, por validar en entrevistas]:** casi nadie se describe como "alguien que no sabe estudiar"; suele decir "no tengo tiempo", "no me concentro" o "no entiendo". Vender "aprende a estudiar" puede generar rechazo. Vender el resultado ("llega listo a tu examen con menos horas") y entregar el método por debajo probablemente convierte mejor.

## 2. Qué existe

| Herramienta | Qué hace bien | Hueco frente a Catedra |
|---|---|---|
| **Anki** | Repaso espaciado con FSRS-6; retención a largo plazo [V] | UX dura; no diagnostica ni enseña método |
| **Quizlet** | 60M+ usuarios; *Magic Notes*: PDF/notas → tarjetas, guía y práctica; modo *Learn* adaptativo [V] | Muro de pago; adapta contenido, no el método del estudiante |
| **Knowt** | Gratis: sube notas, PDF o video de clase → tarjetas y exámenes; repaso espaciado; tutor IA con voz (fines de 2025) [V] | Mismo hueco: genera y repasa, no diagnostica hábitos |
| **RemNote** | Notas + tarjetas + repaso; tutor IA, explicaciones de errores [V] | Orientado a quien ya sabe organizar notas |
| **Gizmo** | Recuperación gamificada con racha diaria; 4,8 en App Store [V] | Juego de repaso; sin perfil de estudio |
| **NotebookLM** | Preguntas ancladas a tus fuentes | Sin API de consumidor [V]; no hace seguimiento ni plan |
| **Duolingo** (referencia de retención) | Racha: con 10 días de racha se abandona menos; las notificaciones de "salva tu racha" y hasta un punto rojo en el ícono (+1,6 % DAU) mueven el uso diario [V] | Es de idiomas; engagement no equivale a aprendizaje |
| **Prototipos académicos** (*Ace Your Self-Study*, *Minerva*) | Apps que inducen estrategias cognitivas y metacognitivas, planificación y reflexión [V] | Son investigación, no producto de consumo |

**Lectura honesta:** en lo que revisé, los productos masivos compiten en *generar y repasar contenido*; ninguno que encontré hace de **diagnosticar y re-entrenar el método del estudiante** su centro, y lo académico existe pero no llegó a consumo [D; no puedo garantizar que no exista algo que no encontré]. Ese es el espacio. Pero la generación de preguntas desde tus apuntes ya es *estándar de mercado y gratis* (Knowt): si Catedra no la iguala, nadie se queda a ver el diagnóstico.

## 3. Lo que no hay que construir desde cero

| Necesidad | Adoptar | Notas | Prioridad |
|---|---|---|---|
| Algoritmo de repaso | **ts-fsrs** (FSRS v6, TypeScript, build UMD/ESM, mantenido; último push abr-2026) [V] | Reemplaza los intervalos fijos `[1,3,7,14,30]`. Además permite estimar la probabilidad de recordar el día del examen | Alta |
| Generar preguntas (texto) | **Groq** (gratis: 14.400 solicitudes/día con modelo 8B; 1.000/día con 70B) [V] o **Gemini 2.5 Flash** (gratis ≈1.500/día, 15/min) [V] | Revisar términos de uso de datos con menores: la capa gratuita de Gemini puede usar el contenido para mejorar productos [C, verificar] | Alta |
| Foto de apuntes / pizarrón | **Gemini Flash (visión)**: error de caracteres ≈1–2 % en benchmarks de manuscrita [V]. Tesseract falla con letra cursiva [V] | La foto es probablemente la entrada de menor fricción para jóvenes [D] | Alta |
| Backend de IA | **Función serverless en Vercel (`/api`)** [C] | Misma URL (sin CORS), clave en variable de entorno; evita montar Cloudflare aparte | Alta |
| Analítica | **PostHog** (capa gratuita) o **Umami** [C] | Sin esto no se puede medir D1/D7 ni dónde se abandona | Alta |
| Recordatorios | Web Push: Android maduro; en iOS solo con la PWA instalada [V]. Requiere servidor que programe envíos: **OneSignal** o VAPID propio con cron [C] | Sin recordatorios la retención dependerá solo de la memoria del usuario | Media |
| Cuentas y sincronización | **Supabase** (Auth Google + Postgres + RLS) | Hoy todo vive en el dispositivo; aceptable para piloto, no para escalar | Media |
| Calendario | Exportar **.ics** (sin API ni backend) [D] | Agenda del examen y bloques en el calendario del teléfono | Media |
| Traer mazos existentes | Importar texto exportado de **Quizlet/Anki** (columnas separadas por tab) [C] | Arranque en frío: quien ya tiene mazos entra con contenido | Media |
| Voz | Web Speech (hecho); luego **Whisper vía Groq** [C] para iOS/consistencia | Subsiguiente | Baja |
| Celebración visual | Canvas + `navigator.vibrate`, o **canvas-confetti** (~4 KB) [C] | Microinteracciones, bajo costo | Baja |
| Tarjeta compartible | Canvas + Web Share API [D] | Palanca de crecimiento: el resultado del diagnóstico como imagen | Media |

**Hosting [V]:** el plan *Hobby* de Vercel no permite uso comercial; *Pro* cuesta $20/usuario/mes. Sirve para el piloto con amigos, no para cobrar. Alternativas para después: Vercel Pro o mover el sitio estático a otro host.

## 4. Fuentes
- [Dunlosky et al. 2013: Which study strategies make the grade? (APS)](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html)
- [EEF: Metacognition and self-regulated learning](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition)
- [Ace Your Self-Study: una app para apoyar el aprendizaje autorregulado](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9110801/)
- [Best AI Study Tools 2026 (ranking)](https://www.fast.io/resources/best-ai-study-tools-2026.md)
- [Cómo Duolingo reactivó su crecimiento (Lenny's Newsletter)](https://www.lennysnewsletter.com/i/104096876/the-streak-vector)
- [ts-fsrs en npm](https://npmjs.com/package/ts-fsrs)
- [PWA y notificaciones push en iOS (2026)](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=es)
- [LLM OCR vs OCR tradicional, benchmark 2026](https://parsli.co/blog/llm-ocr-vs-traditional-ocr)
- [Límites de la capa gratuita de Gemini API 2026](https://tinkerllm.com/blog/gemini-api-free-tier-limits-rate-quotas/)
- [Límites de la capa gratuita de Groq](https://benchlm.ai/free-tier/groq)
- [Planes y uso comercial de Vercel](https://livemy.app/blog/vercel-pricing)
