# Cómo funciona Catedra (MVP) y qué te toca a ti

Fecha: 2026-10-08. Complementa `evaluacion-realidad-mvp.md`. **[V]** verificado en fuente, **[C]** conocimiento previo, **[D]** juicio propio.

---

## 1. Lo que corregimos de la evaluación anterior

Tu objeción era correcta en lo esencial:

| Tu punto | Qué dice la evidencia | Cómo cambia el producto |
|---|---|---|
| "No lo pregunta porque no sabe que existen otros métodos" | Solo 18 % de los estudiantes encuestados por Kornell y Bjork (2007) usaba autoevaluarse *porque aprende más así* [V, vía resumen]. Además, la mayoría cree que releer funciona mejor. | Sí hay un desconocimiento real. |
| …pero decírselo no basta | Incluso cuando su propio resultado muestra lo contrario, la gente sigue creyendo que su método de siempre es mejor (Yan, Bjork y Bjork 2016) [V]. Releer **gana** si te preguntan a los 5 minutos; recordar gana a los 2 días y a la semana (Roediger y Karpicke 2006) [V]. Por eso, lo que se siente al estudiar engaña. | No basta con *contarle* los métodos: tiene que **verlo en sí mismo, con espera**. → **Experimento de 48 h**. |
| "El método que más se adapte a ti" | Adaptar según "estilos de aprendizaje" (visual, auditivo…) **no tiene evidencia** (Pashler y col. 2008) [V]. | Adaptamos según *contexto y resultados propios* (tiempo, tipo de evaluación, tipo de materia, qué te funcionó), **nunca** por estilo. Hay que evitar esa promesa en el marketing. |
| "Enfocarnos en un examen que no se sabe cómo será es complejo" | Correcto: el examen es incierto, y no todos tienen uno cerca. | El examen es **opcional**. El ancla por defecto es tu semana (meta de enfoque + repaso). Si hay evaluación, la app te ayuda a *averiguar cómo será* antes de planificar. |
| "Nadie unifica lo que hacen las apps de IA" | Hay estudios pequeños: estudiantes que pierden hasta 16 de cada 120 min cambiando de app y que piden un sistema integrado [V, muestra no reportada]. | No competimos con ChatGPT, Gemini ni NotebookLM: **los orquestamos**. Catedra decide qué herramienta conviene, te prepara la instrucción y te trae de vuelta a evaluarte. → **¿Atascado?** |

**La nueva promesa [D]:** *"Tu copiloto de estudio: descubre qué te funciona a ti, úsalo cada día con tu material y con las herramientas que ya tienes, y comprueba si te está sirviendo."*

---

## 2. Cómo funciona, paso a paso

**Día 0 (5 minutos)**
1. Llega → 3 preguntas visuales → una idea con fuente → nombre y primera materia (fecha de evaluación opcional).
2. Hoy le ofrece **"Descubre qué te funciona · 4 min"**: dos textos cortos (Salto Ángel y la danza de las abejas). Uno lo relee dos veces y el otro lo lee una vez y lo recuerda sin mirar. Antes de empezar apuesta cuál recordará más.
3. Añade el material de su clase (pegar, foto, voz, PDF, NotebookLM o paquete de ZR Note) → la app propone preguntas → él aprueba las que quiere.

**Días 1–2**
4. Hoy muestra **una sola cosa**: repasar lo que vence, una sesión de enfoque de 15 min o el siguiente paso. Cada sesión termina con *"siguiente paso"* de un toque.
5. Si no entiende algo → **¿Atascado?** → elige entre tutor con IA (copia la instrucción socrática y abre ChatGPT o Gemini), NotebookLM, un video o preguntarle a alguien (con la pregunta ya redactada) → *"Ya lo entendí: crear preguntas"*.

**Día 2 — el momento clave**
6. Hoy cambia a **"¿Qué te funcionó a ti?"** → 8 preguntas → ve sus barras: recordar contra releer, y si su apuesta fue correcta. Esto convierte la teoría en algo que creyó por sí mismo.

**Semanas siguientes**
7. Hábito de 1–2 semanas (prueba → veredicto con sus datos), racha semanal de enfoque, ruta por fases si hay evaluación, *"averigua qué entra"*.
8. Pasada la evaluación: **"¿Cómo te fue?"** (carita, si llegó preparado y nota opcional). Es el dato que dice si Catedra sirve.
9. Encuestas cortas: *"¿Te está funcionando?"*

---

## 3. Qué te toca a ti (en orden)

| # | Tarea | Por qué | Tiempo |
|---|---|---|---|
| 1 | **Vercel → Environment Variables**: `GEMINI_API_KEY` (o `GROQ_API_KEY`), `POSTHOG_KEY`, `FEEDBACK_URL`. Guía: `pegar-en-vercel.txt`. Luego redeploy. | Sin IA las preguntas son plantillas; sin analítica el piloto no enseña nada. | 30 min |
| 2 | Probar en **tu teléfono**: experimento completo (puedes adelantar la fecha solo en pruebas), enfoque saliendo de la app, ¿Atascado? | Detectar lo que solo falla en un teléfono real. | 30 min |
| 3 | **10 entrevistas** (ver §8 de la evaluación). Pregunta extra: *"¿Sabías que intentar recordar funciona mejor que releer? ¿Lo haces?"* | Confirma o refuta tu hipótesis del desconocimiento. | 1 semana |
| 4 | **2–3 academias o preparadurías**: ¿pagarían por saber qué alumnos van atrasados o por darles esto? | El dinero probable está ahí. | 1 semana |
| 5 | Reclutar **12–20 estudiantes** para el piloto, con grupo de WhatsApp y enlace con `?c=CODIGO`. | Piloto concierge: tú les escribes cada día. | 2–3 semanas |
| 6 | Revisar cada semana: activación, días de uso, % que termina el experimento, resultados de "¿Cómo te fue?". | Decidir si seguir, ajustar o pivotar. | 1 h/semana |

**Lo que me toca a mí:** arreglar lo que salga de tus pruebas, el aviso de instalación en iPhone, sumar los resultados de las evaluaciones al panel "¿Te está funcionando?" y, cuando tengas las claves, verificar la IA real en producción.

---

## Fuentes
- Kornell y Bjork (2007) y Hartwig y Dunlosky (2012), resumen: https://www.learningscientists.org/blog/2018/2/8-1 · original: https://Www.Gwern.net/doc/psychology/spaced-repetition/2012-hartwig.pdf
- Yan, Bjork y Bjork (2016): https://sites.lifesci.ucla.edu/psych-bjorklab/wp-content/uploads/sites/13/2016/11/YanBjorkBjork2016.pdf
- Roediger y Karpicke (2006): https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf
- Pashler y col. (2008), estilos de aprendizaje: https://digitalcommons.usf.edu/psy_facpub/1765/ · https://deansforimpact.org/learning-styles-what-does-the-research-say/
- Cambio entre apps al estudiar (2025): https://proceedings.aijr.org/index.php/ap/article/view/92
- McDaniel y Einstein (2020): https://journals.sagepub.com/doi/10.1177/1745691620920723

---

## 4. Esquema de procesos

Catedra habla como un profe en primera persona (decisión del 2026-10-08): una idea por burbuja, y el estudiante responde con un toque. Siempre puede decir "Ahora no".

```mermaid
flowchart TD
  A[Llega y se presenta<br/>3 preguntas + una materia] --> B[Descubre qué le funciona<br/>Experimento de 48 h]
  B --> C[Trae su material<br/>foto · texto · voz · NotebookLM · ZR Note]
  C --> D[Practica cada día<br/>repaso · enfoque · ¿Atascado?]
  D --> E[Comprobamos juntos<br/>veredicto del hábito · ¿cómo te fue?]
  E -- ajusto el método --> D
  D -. no entiende .-> H[¿Atascado?<br/>tutor IA · NotebookLM · video · persona]
  H -. vuelve y crea preguntas .-> C
```

**Qué propone Catedra hoy:** revisa en orden y propone lo primero que aplique: experimento listo → repaso que vence → preguntas por revisar → material sin convertir → evaluación cercana (averigua qué entra) → resultado de una evaluación pasada → enfoque semanal → descanso.

**Dónde viven los datos:** todo en el teléfono (IndexedDB, funciona sin conexión). Al servidor solo van el texto que el estudiante pide convertir con IA (`/api/ai`, sin guardarlo) y eventos anónimos de uso, sin texto (`/api/e` → PostHog). El respaldo se hace desde Progreso → Respaldar.
