# Choque de realidad: ¿Catedra funciona, y qué falta para un MVP que enseñe algo?

Fecha: 2026-10-08. **[V]** verificado en fuente (enlace al final), **[C]** conocimiento previo no re-verificado hoy, **[D]** juicio propio. Donde no encontré datos, lo digo.

---

## 0. Veredicto en cinco líneas

1. **El problema de fondo es real y está documentado**: los estudiantes estudian sobre todo releyendo y subrayando, y casi no se evalúan [V].
2. **Pero no es el dolor que el estudiante siente.** Nadie se despierta pensando "mi método es malo". Siente: *"tengo examen y no sé por dónde empezar"*, *"no me concentro / lo dejo para última hora"*, *"no entiendo el tema"*. Vendemos una vitamina con lenguaje de vitamina.
3. **La teoría de cómo cambiar el hábito sí nos favorece**: saber qué método es bueno no basta; hacen falta creer que te funciona a ti, comprometerse y planificar (marco KBCP) [V]. Catedra es de las pocas cosas que intentan los cuatro pasos. Eso es lo valioso.
4. **Hoy, si lanzamos, no aprenderíamos nada**: en producción la IA está apagada (`/api/ai` → `enabled:false`) y la analítica también (`/api/config` → `analytics:false`). Las preguntas salen de plantillas y no sabríamos quién se fue ni dónde.
5. **Construimos demasiado antes de hablar con estudiantes.** El plan del 4-oct ya decía que las entrevistas eran "lo más importante"; cuatro días después hay ~10 subsistemas y cero entrevistas. Hay que congelar funciones y salir a medir.

---

## 1. ¿Qué dice la evidencia sobre el problema?

| Hallazgo | Dato | Qué implica |
|---|---|---|
| Los estudiantes releen en vez de evaluarse | En la encuesta de Karpicke, Butler y Roediger (2009) releer fue la estrategia más reportada y la autoevaluación quedó baja [V]. Un meta-análisis de encuestas reporta releer en ~78 % de participantes [V]. (La cifra de "84 %" que circula no pude atribuirla a la fuente original; no la usemos.) | El hueco existe. |
| Saber no es hacer | McDaniel y Einstein (2020): la enseñanza de estrategias suele cubrir solo el *conocimiento*; faltan *creencia* (que me sirve a mí), *compromiso* y *plan* [V]. | Explicarle métodos (nuestra biblioteca) es la parte más débil. Lo fuerte es el ciclo prueba → veredicto con sus datos. |
| Entrenar sí mueve algo, pero necesita acompañamiento | Study Smart (Biwer y col., 2020, N=47): sube el conocimiento y el uso *reportado* de buenas estrategias; la tesis de 2022 concluye que adaptarlas al propio contexto "requiere apoyo continuo"; el efecto a largo plazo sigue sin estar claro [V]. En un curso completo (n=110) mejoró el rendimiento y se cerró la brecha entre mejores y peores [V]. | Un acompañante continuo (lo que queremos ser) es justo lo que la literatura dice que falta. Pero los efectos fuertes se vieron **dentro de un curso**, no en una app suelta. |
| Procrastinación y ansiedad ante exámenes son altas en LatAm | Estudios locales: ~58–62 % procrastina en una muestra de Piura; ansiedad ante exámenes se asocia a peor rendimiento [V, muestras pequeñas, no representativas]. | Este sí es dolor sentido. El modo Enfoque y "siguiente paso" apuntan aquí. |

**Conclusión:** en teoría el mecanismo funciona (evaluarse, repartir, planificar con intención, compromiso con consecuencia). Lo que la teoría **no** garantiza es que un estudiante adopte una app para eso por su cuenta.

---

## 2. ¿Cuál es el dolor real? (más allá de lo que pensamos)

| Dolor | ¿Lo siente? | ¿Quién lo resuelve hoy? | ¿Catedra lo ataca? |
|---|---|---|---|
| "No entiendo el tema" | Mucho | ChatGPT/Gemini, gratis. 92 % de universitarios del Reino Unido usa IA; 88 % para evaluaciones (HEPI 2025) [V]. Chegg perdió 31 % de suscriptores en un año por eso [V]. | No, y no debe. Ahí perdemos. |
| "Tengo examen el X y no sé por dónde empezar / qué entra" | Mucho, y con fecha | Nadie bien: el estudiante improvisa o pregunta en el grupo de WhatsApp. | **Sí**: evaluaciones, "averigua qué entra", ruta por fases, siguiente paso. **Es nuestro mejor ángulo.** |
| "No me concentro, lo dejo para el final" | Mucho | Forest, temporizadores, fuerza de voluntad | Sí (Enfoque con consecuencia suave). Pero Forest ya existe; solo no es diferencial. |
| "Estudio mucho y me va mal" | Sí, después del examen | Nadie | Sí, es la promesa central (método que funciona *para ti*). Pero se siente tarde: después de la nota. |
| "Mi método es malo" | No | — | Es lo que decimos en la llegada. **No vende.** |

**Reformulación recomendada [D]:** dejar de prometer "descubre tu método" y prometer el resultado:
> *"Dime cuándo es tu examen y qué te dieron. Te digo qué hacer cada día hasta ese día, en ratos cortos, y vemos si te está funcionando."*

El método con evidencia sigue siendo el motor, pero pasa a ser el *cómo*, no el *qué*.

---

## 3. Competencia: lo que ya es gratis

| Actor | Qué da gratis | Consecuencia para nosotros |
|---|---|---|
| ChatGPT **Study Mode** (jul-2025, todos los planes) | Tutor socrático, preguntas de comprensión [V] | Explicar contenido = imposible competir. |
| Gemini **Guided Learning** (ago-2025) | Tutor con quizzes, diagramas, videos [V] | Igual. |
| **NotebookLM** flashcards y quizzes (sep-2025) | Convierte tus documentos en tarjetas y quizzes con explicación y cita [V] | **Generar preguntas de tu material ya es commodity.** No es foso. |
| Knowt, StudyFetch | IA + repaso; millones de usuarios declarados [V, cifras inconsistentes] | Igual. |
| Anki / Quizlet | Repaso espaciado | El repaso solo no retiene: en estudios con estudiantes de medicina el uso es irregular [V]. |

**Lo que nadie hace bien [D]:** ser **proactivo a lo largo de días** hasta una fecha concreta (el chatbot espera a que le escribas), **medir si te está funcionando** con tus propios datos, y funcionar **sin conexión, con poca data y con cortes de luz**. Eso no es un foso tecnológico; es un foso de ejecución y de contexto. Es defendible solo si somos muy buenos en el bucle diario.

---

## 4. El mercado: Venezuela como laboratorio, no como caja

| Dato | Valor | Implicación |
|---|---|---|
| Usuarios de internet | 61,6 % de la población, 17,6 M (fin 2025) [V] | Tu público universitario urbano está mayormente conectado, pero no siempre. |
| Electricidad | Cortes de 4–5 h interdiarias en municipios del Zulia; 6–12 h/día en Maracaibo y >10 h en Puerto La Cruz según reportes de 2026 [V, sin cronograma oficial] | **Offline-first no es un lujo: es requisito.** Nuestra PWA ya lo cumple; es una ventaja real. |
| Ingresos | Salario mínimo oficial < 1 USD; ingreso con bonos ~160–240 USD [V] | Disposición a pagar del estudiante: muy baja. |
| Pagos | Pago móvil y USDT/Binance dominan; Stripe no opera [V parcial, C] | Cobrar es posible (USDT, pago móvil) pero manual y pequeño. |
| Retención típica de apps de educación | Día 30: ~2–3 % [V] | Sin un motivo fuerte para volver (examen con fecha + recordatorio) moriremos como el promedio. |
| Conversión a pago | Educación ~2,6 % en general; en LatAm baja más con precios en USD [V, fuente secundaria] | Consumidor venezolano no paga la operación. |

**Lectura honesta:** Venezuela es perfecta para **aprender rápido y barato** (cercanía, problema agudo, offline). No es donde está el dinero. El dinero, si existe, está en: (a) **academias, preparadurías y colegios privados** que pagan por resultados de sus alumnos; (b) **preparación de pruebas de admisión** (alta intención, fecha fija); (c) mercados con rieles de pago (Colombia, México) o la diáspora. Eso ya estaba en `modelo-de-negocio.md`; sigue siendo correcto.

---

## 5. Arquitectura: evaluación técnica

**Lo que está bien**
- PWA sin build, offline, IndexedDB, service worker: barata, rápida de iterar y adecuada para cortes de luz y datos caros.
- Módulos puros con pruebas (`srs`, `space`, `strategies`, `pack`, `focus`, `voice`, `habits`…: 65 pruebas).
- Pasarela de IA propia con varios proveedores y cuota por dispositivo; analítica anónima sin texto del estudiante. Bien diseñadas.
- Privacidad por diseño y lenguaje no clínico.

**Lo que bloquea un MVP**
| Problema | Gravedad | Arreglo |
|---|---|---|
| IA apagada en producción → preguntas de plantilla | **Crítica**: el corazón del bucle se ve mediocre | Poner `GEMINI_API_KEY` o `GROQ_API_KEY` en Vercel (tú, no en el chat). Ver `pegar-en-vercel.txt`. |
| Analítica apagada → un lanzamiento no enseña nada | **Crítica** | `POSTHOG_KEY` en Vercel y `FEEDBACK_URL`. |
| Sin recordatorios push | Alta: retención depende de acordarse | Piloto: recordatorio humano por WhatsApp (concierge). Después: Web Push (Android funciona; iOS solo con la app instalada [V]). |
| Datos solo en el teléfono, sin cuenta | Alta: pierdes el teléfono, pierdes todo; Safari separa datos entre pestaña y app instalada [V] | Piloto: botón "Respaldar" (exportar/importar JSON). Después del piloto: cuentas + sync. |
| `index.html` de ~2.000 líneas con estado global; ~10 subsistemas (diagnóstico, hábitos, enfoque, espacios, estrategias, paquetes, encuesta, voz, cerebro, aplicación, agenda) | Media hoy, alta mañana | No refactorizar ahora. **Congelar funciones** y esconder lo que no sea el bucle central. |
| Detección de salida (Enfoque) y Wake Lock sin probar en teléfono real | Media | Probarlo en Android e iPhone antes del piloto. |
| La encuesta de efecto mide percepción, no resultado | Media | Añadir al piloto la nota real del examen (autorreportada) antes/después. |

**Arquitectura aguanta un piloto de 20–200 personas tal como está.** No necesita reescritura para el MVP; necesita encender lo apagado y recortar.

---

## 6. ¿Funciona en teoría? Sí, con cinco riesgos

| Riesgo | Por qué puede fallar | Cómo lo bajamos |
|---|---|---|
| **Fricción de entrada** | Si cargar material cuesta, no hay preguntas, no hay bucle | Foto/compartir/ZR Note; IA encendida; "empieza sin material" con la evaluación. |
| **Recompensa tardía** | El veredicto "esto te funciona" llega en semanas; la retención cae en días | Recompensa inmediata: plan del día listo, semilla, siguiente paso. Fecha de examen como ancla. |
| **Promesa equivocada** | "Descubre tu método" no es un dolor | Prometer el examen (ver §2). |
| **Demasiadas herramientas** | Más opciones = más esfuerzo de decidir; el usuario dijo "que no le cueste" | Un solo camino por defecto; el resto en "más formas". |
| **Medimos sentir, no rendir** | Una app que se siente bien puede no subir notas | Nota del examen y "¿te sentiste preparado?" antes/después. |

---

## 7. El MVP que enseña algo (recorte)

**Un solo bucle:** *Examen con fecha → material (foto/pegar/ZR Note) → plan diario hasta la fecha → 10–15 min/día de preguntas + una sesión de enfoque → después del examen: "¿cómo te fue?"*

| Se queda visible | Se esconde (sin borrar) hasta validar |
|---|---|
| Hoy con siguiente paso, materias con evaluaciones, generar/aprobar preguntas, repaso, Enfoque, ruta al examen, encuesta corta, hábito (uno) | Biblioteca completa de métodos, Cerebro/notas, diagnóstico largo, simulacros avanzados, espacios múltiples (se activan solos si hay más de uno) |

**Encender antes de invitar a nadie (tú, en Vercel):** clave de IA, `POSTHOG_KEY`, `FEEDBACK_URL`.
**Añadir (código, pequeño):** respaldo exportar/importar; pregunta de nota del examen; aviso de instalar en iPhone.

---

## 8. Plan de validación (3 semanas)

**Semana 1 — Entrevistas (10–15), antes de mostrar la app.** Estilo *The Mom Test* [C]: hablar de su último examen, no de nuestra idea. Preguntas:
1. ¿Cuándo fue tu último examen? Cuéntame qué hiciste los 7 días antes.
2. ¿Qué fue lo más difícil? ¿Qué intentaste para resolverlo?
3. ¿Usas alguna app o IA para estudiar? ¿Para qué exactamente? ¿Cuál dejaste y por qué?
4. ¿Has pagado algo para estudiar (curso, preparaduría, app)? ¿Cuánto y cómo pagaste?
5. Si alguien te mandara cada día qué hacer hasta tu examen, ¿qué tendría que pasar para que lo siguieras?
Además: 3–5 conversaciones con **academias/preparadurías** (¿pagarían por saber qué alumnos van atrasados?).

**Semanas 2–3 — Piloto concierge (12–20 estudiantes con examen en 2–3 semanas).** Grupo de WhatsApp, recordatorio humano diario, código de piloto (`?c=`).

**Métricas y umbrales para decidir [D]:**
| Métrica | Seguir | Revisar |
|---|---|---|
| Activación (material + primer repaso en 24 h) | ≥ 60 % | < 40 % |
| Días de uso por semana (mediana) | ≥ 3 | ≤ 1 |
| Usan hasta el examen | ≥ 50 % | < 25 % |
| "¿Qué tan decepcionado estarías si no pudieras usarla?" → "muy" (prueba de Sean Ellis) [C] | ≥ 40 % | < 20 % |
| Dispuestos a pagar 2–3 USD/mes (preventa real por pago móvil/USDT, no "sí, pagaría") | ≥ 3 personas | 0 |

**Señales de pivote:**
- Solo usan generar preguntas → somos "prepara tu examen con tu material" (cara a NotebookLM; difícil).
- Solo usan Enfoque → app de enfoque para estudiantes (mercado lleno).
- Solo vuelven cuando un humano les escribe → el producto es **el acompañamiento**: herramienta para tutores/academias (B2B2C). Esta es, para mí, la salida más probable si el consumidor no retiene [D].
- Las academias se interesan más que los estudiantes → vender a la academia, el estudiante usa gratis.

---

## 9. Lo que necesito de ti

1. Poner en Vercel: clave de IA, `POSTHOG_KEY`, `FEEDBACK_URL`.
2. Conseguir 10 estudiantes para entrevistar esta semana y 2 academias.
3. Decidir el recorte del §7 (yo lo implemento en un día).

---

## Fuentes
- McDaniel y Einstein (2020), marco KBCP: https://journals.sagepub.com/doi/10.1177/1745691620920723
- Biwer y col., Study Smart: https://pmc.ncbi.nlm.nih.gov/articles/PMC9397154 · https://link.springer.com/10.1007/s10459-022-10149-z
- Karpicke, Butler y Roediger (2009): https://bpb-us-e2.wpmucdn.com/sites.wustl.edu/dist/8/805/files/2026/06/Karpicke-et-al.-2009-Metacognitive-strategies-in-student-learning-Do-students-practise-retrieval-when-they-study-on-thei.pdf
- Miyatsu y col., estrategias populares: https://www.researchgate.net/profile/Toshiya_Miyatsu/publication/324892981
- HEPI Student Generative AI Survey 2025: https://www.hepi.ac.uk/reports/student-generative-ai-survey-2025/
- Chegg, recortes y caída de suscriptores: https://www.maginative.com/article/chegg-slashes-22-of-workforce-amid-ai-disruption-in-edtech/
- ChatGPT Study Mode: https://openai.com/index/chatgpt-study-mode/ · Gemini Guided Learning: https://techcrunch.com/2025/08/06/google-takes-on-chatgpts-study-mode-with-new-guided-learning-tool-in-gemini/
- NotebookLM flashcards y quizzes: https://workspaceupdates.googleblog.com/2025/09/flashcards-quizzes-reports-notebook-lm-google-education.html
- Knowt/StudyFetch (cifras inconsistentes): https://www.stork.ai/compare/studyfetch-vs-knowt
- Retención de apps de educación: https://www.braze.com/resources/articles/mobile-app-retention · https://www.businessofapps.com/?p=98187
- Benchmarks de suscripción en educación: https://adapty.io/blog/markdown/education-app-subscription-benchmarks.md
- Anki en medicina: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12662189/
- DataReportal Venezuela 2026: https://datareportal.com/reports/digital-2026-venezuela
- Cortes eléctricos: https://www.bloomberglinea.com/latinoamerica/venezuela/la-paradoja-electrica-del-zulia-por-que-este-estado-petrolero-de-venezuela-vive-casi-a-oscuras/ · https://lapatilla.com/2026/03/06/caos-electrico-fluctuaciones-y-cortes-diarios-castigan-a-zulianos/ · https://www.ntn24.com/noticias-actualidad/entre-barricadas-quema-de-cauchos-y-cacerolazos-habitantes-en-puerto-la-cruz-intensifican-las-protestas-por-prolongados-cortes-de-luz-643073
- Salario mínimo: https://www.ntn24.com/noticias-economia/la-devaluacion-pulverizo-el-salario-minimo-en-venezuela-y-equivale-a-0-49-dolares-al-mes-594953 · https://www.vanguardia.com/mundo/2025/08/12/venezuela-enfrenta-grave-crisis-salarial-el-sueldo-minimo-es-solo-un-dolar/
- Stablecoins y pagos: https://www.valoraanalitik.com/stablecoins-pagos-en-venezuela/ · https://www.bloomberglinea.com/latinoamerica/venezuela/binance-despliega-su-tarjeta-en-venezuela-en-un-mercado-impulsado-por-el-auge-de-las-stablecoins/
- Procrastinación y ansiedad en LatAm: https://www.redalyc.org/journal/180/18066677016/18066677016.pdf · https://ve.scielo.org/pdf/ric/v5n4/2739-0063-ric-5-04-e504046.pdf
- Límites de PWA en iOS: https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide · https://developer.apple.com/forums/thread/710157
- Duolingo (referencia de lo que logra un producto con hábito fuerte: DAU/MAU 39,6 % y ~12,2 M de pago en 4T-2025): https://www.sec.gov/Archives/edgar/data/1562088/000162828026012494/duol-20251231.htm
