# Validación del sistema y cómo medir si funciona (2026-10-07)

Marcas: **[V]** visto en fuente esta sesión, **[C]** leído en nuestro código, **[D]** decisión nuestra. Complementa `validacion-diagnostico.md`.

## 1. Respuesta directa: ¿somos un diagnóstico clínico o psicopedagógico?

**No, y no debemos parecerlo.** Lo que hacemos es una **retroalimentación formativa sobre hábitos de estudio**: un perfil de estrategias que se puede practicar y cambiar. Un diagnóstico etiqueta a la persona; nosotros proponemos un experimento. Tres razones:

1. Nuestras 9 áreas son constructos de LASSI y MSLQ, pero **nuestras preguntas no están validadas** (originales, sin probar con estudiantes) y estos cuestionarios explican poco de las notas [V, ver `validacion-diagnostico.md`].
2. La literatura de retroalimentación formativa apoya presentar los resultados como **material para que el estudiante se autoevalúe y actúe**, con fortalezas junto a las áreas a trabajar y con pasos concretos; decir "esfuérzate más" no funciona [V, resumen de búsqueda sobre Hattie y Timperley, Nicol y Sadler; el consejo de no etiquetar con déficit es razonamiento propio, no una cita directa].
3. Las escalas de LASSI se llaman "Ansiedad" y "Actitud": sin contexto suenan a etiqueta [V, [LASSI en EduTech Wiki](https://edutechwiki.unige.ch/en/Self-regulated_learning/Learning_and_Study_Skills_Inventory_(LASSI))].

### Cambios hechos hoy [C]
- El reporte ya no dice "es tu prioridad": empieza por **lo que mejor te funciona** y luego "lo que vamos a probar".
- Sin puntajes ni rojos de alarma: cada área se muestra como **por explorar / en camino / sólido**.
- Se quitó la metáfora clínica del código y de los textos ("Diagnóstico previo" ahora es "Punto de partida"); el aviso final dice: *"Esto sale de tus respuestas y de cómo practicas. Cambia contigo: son ideas para probar, no etiquetas."*
- Se mantiene el mensaje responsable ante bloqueo severo en exámenes (orientarse con un profesional).
- Pendiente: algunas opciones de respuesta son duras ("No soy bueno en esto"); se redactan así para medir conducta, pero conviene probar versiones más neutras en el piloto.

## 2. Qué parte del sistema tiene respaldo y cuál no

| Pieza | Respaldo | Estado |
|---|---|---|
| Recuperar en vez de releer; repartir en el tiempo | Dunlosky 2013; Roediger y Karpicke 2006; Cepeda 2006 [V] | **Sólido** |
| Calibración (confianza frente a acierto) | Roediger y Karpicke; ilusión de saber [V] | Sólido, y lo medimos con datos reales |
| Hábitos como "hipótesis y prueba de unos días" | Diseños de caso único y N-de-1: cada persona es su propio control; los protocolos de apps de autoexperimentación piden **al menos 3 observaciones por fase** [V, [StudyMe](https://link.springer.com/article/10.1186/s13063-022-06893-7)] | **Coherente con el método, pero nuestras pruebas de 7 a 10 días no alternan fases (sin retirada)**: es un antes y después, no un N-de-1 estricto. Hay que decirlo así |
| Nuestras 9 áreas y sus preguntas | Constructos de LASSI y MSLQ, preguntas propias | **Sin validar** |
| Reglas "señal → hábito" (`habits.js`) | Cada hábito cita su fuente; la regla que lo elige es nuestra | **Hipótesis pendiente de revisión humana** |
| Voz y tips | Contenido citado de la literatura | Sin evaluar el efecto del tono |

Lo honesto: **no podemos "validarlo todo" hoy**. Podemos dejar claro qué es sólido, qué es hipótesis, y medir las hipótesis en el piloto.

## 3. Cómo sabremos si funciona (implementado hoy)

La búsqueda de evaluación de apps indica que la **satisfacción percibida no equivale a aprendizaje** (la percepción y el rendimiento pueden divergir) y que lo recomendable es medir una ganancia además de la encuesta [V, resumen de la búsqueda; ver fuentes]. Por eso medimos las dos cosas y las contrastamos:

**Lo observado (no se pregunta):** acierto al inicio frente a ahora, recuerdo tras 5 o más días, días de práctica por semana, hábitos probados que sí funcionaron.

**Lo percibido (encuesta visual de un toque, máximo una al día, nunca durante una sesión):**

| Cuándo | Pregunta | Para qué |
|---|---|---|
| Primera sesión | Preparación para su próximo examen (1 a 5) | Línea base |
| Día 3 | Si dejara de usarla, ¿cómo se sentiría? | Ajuste producto-mercado (prueba de Sean Ellis) |
| Día 4 | ¿Entiende qué método le conviene y por qué? | Si la adaptación se *nota* |
| Día 4 | Qué es lo que más le sirve | Qué pagaría |
| Día 5 | Qué la frena | Fricción |
| Día 7 | ¿Estudia mejor que antes? | Cambio percibido |
| Día 7 | ¿La recomendaría? | Referencia |
| Día 10 | Preparación (1 a 5), otra vez | **Diferencia que importa** |
| En línea | Caritas tras sesión, perfil, hábito, preguntas de IA | Calidad de cada pieza |

- El estudiante ve su propio resumen en **Progreso → "¿Te está funcionando?"** (acierto antes y ahora, hábitos que funcionaron, preparación).
- El equipo puede **copiar las respuestas** desde Progreso → "Copiar respuestas" (CSV) y, con la medición anónima activa, llegan como eventos `survey`.

### Cómo leerlo
- Éxito mínimo del piloto [D]: la mayoría de quienes pasan del día 10 declara mejora **y** su acierto observado sube. Si solo sube lo declarado, es agrado, no efecto.
- Si "Sean" da menos del 40 % de "muy decepcionado", el producto aún no resuelve un dolor [C, umbral habitual de la prueba; verificar la cifra antes de citarla].
- Con 12 a 30 estudiantes es una **señal, no una prueba**; no hay grupo de control. Para algo más firme: lista de espera como control o fases alternadas por estudiante (mínimo 3 observaciones por fase).

## Fuentes
- [LASSI (EduTech Wiki)](https://edutechwiki.unige.ch/en/Self-regulated_learning/Learning_and_Study_Skills_Inventory_(LASSI))
- [Retroalimentación generativa para autorregulación (arXiv)](https://arxiv.org/pdf/2311.13984) y [guía de evaluación formativa (arXiv)](https://arxiv.org/pdf/2505.23405)
- [StudyMe: app para ensayos N-de-1](https://link.springer.com/article/10.1186/s13063-022-06893-7) y [diseños de caso único con tecnología (JMIR)](https://www.jmir.org/2013/2/e22/)
- [Efectividad de una app para primer año](https://www.researchgate.net/publication/372653933_What_impacts_learning_effectiveness_of_a_mobile_learning_app_focused_on_first-year_students)
