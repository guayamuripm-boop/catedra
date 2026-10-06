# Validación científica del diagnóstico y de la metodología

Fecha: 2026-10-05. Marca: **[V]** visto en una fuente consultada en esta sesión (enlace abajo), **[C]** conocimiento previo, sin verificar aquí (hay que comprobarlo antes de citarlo), **[D]** decisión nuestra.

## 1. Veredicto honesto sobre el diagnóstico actual

El diagnóstico de 9 dominios (`js/diag.js`) es **una hipótesis de producto, no un instrumento validado**. Lo que sí hay:

| Pieza | Respaldo | Estado |
|---|---|---|
| Los 9 dominios (ansiedad, actitud/motivación, concentración, procesamiento, autoevaluación, estrategias de examen, tiempo, recursos…) | Son constructos de LASSI y MSLQ, instrumentos publicados con décadas de uso [V][C] | Los constructos tienen base; **nuestras preguntas no están validadas** (son originales, nunca se probaron con estudiantes) |
| Poder predictivo de un autoinforme de hábitos | Moderado y desigual: en un metaanálisis del MSLQ (67 muestras, 19 900 universitarios) las correlaciones con las notas van de ρ≈.40 (regulación del esfuerzo) a ρ≈.05 (búsqueda de ayuda) [V]. En LASSI (158 estudios, 71 852 estudiantes) la motivación es lo que más se asocia con notas y persistencia, y las asociaciones son más bajas en educación postsecundaria que en escolar [V] | **Un autoinforme explica poco de las notas.** No debe venderse como "diagnóstico" |
| Qué hábitos importan | Práctica con pruebas (recuperación) y práctica distribuida: utilidad alta; releer, subrayar y resumir: baja (Dunlosky et al., 2013) [V] | Respalda nuestras recomendaciones (`RX.PRO`, `RX.AUT`) |
| Ilusión de saber | Releer da fluidez que se confunde con aprendizaje (Bjork) [V]; en Roediger & Karpicke (2006) estudiar de nuevo aumentaba la confianza pero recordaba menos a la semana [V] | Respalda medir **calibración** (confianza vs. acierto), que ya hacemos con datos reales |
| Estilos de aprendizaje | Sin evidencia de que adaptar la enseñanza al "estilo" mejore resultados (Pashler et al., 2008) [V] | Correcto que NO clasifiquemos por estilos |
| Poblaciones | Estos instrumentos se validaron sobre todo en EE. UU./Europa; **no hay validación en Venezuela** [C] | Riesgo cultural y de lenguaje real |

## 2. Qué cambiar para que no sea solo hipótesis [D]

1. **Cambiar el lenguaje**: es un "perfil de hábitos autodeclarados", no un diagnóstico. Ya decimos "No es un diagnóstico clínico"; falta quitar la palabra de la promesa principal.
2. **Medir conducta antes que autoinforme**. Los datos observados (acierto por tema, brecha confianza-acierto, retención a 7 días, simulacro vs. práctica) ya alimentan el perfil. Dar más peso a eso y menos a lo declarado.
3. **Validar nuestras propias preguntas con el piloto** (esto sí podemos hacerlo, y es publicable):
   - *Validez de criterio*: ¿la respuesta a "¿cuántas veces miraste el celular?" predice la duración real de sesión o los abandonos? ¿"Me pruebo sin apuntes" predice mejor retención a 7 días?
   - *Fiabilidad test-retest*: repetir 6 preguntas a los 7 días en 30+ estudiantes; objetivo r ≥ .70.
   - *Eliminar* las preguntas que no predigan nada.
4. **Anclar en instrumentos abiertos**: MSLQ es de dominio público citando a los autores [V, ver `diagnostico-segundo-cerebro.md`]. Para los dominios donde usemos ítems propios, comparar contra ítems del MSLQ en una submuestra.
5. **Entrevistas** (el pendiente más grande del proyecto): 10-15 universitarios en Venezuela. Sin ellas, ni siquiera sabemos si "método de estudio" es su dolor.

## 3. Lectura adicional para validar la metodología "Aplica"

| Idea | Evidencia | Estado |
|---|---|---|
| Practicar recuperando mejora la retención a largo plazo | Roediger & Karpicke (2006) [V] | Sólido |
| La recuperación también mejora la **transferencia** a preguntas nuevas e inferencias en otro tema | Butler (2010), *JEP:LMC* [V] | Sólido, pero con textos breves en laboratorio |
| Mezclar tipos de problema (intercalar) supera al bloque: 72 % vs. 38 % en un experimento de aula; +25 pts a la semana en matemáticas (Rohrer & Taylor) [V, cifras de resúmenes secundarios] | Verificar con el artículo original antes de citar números |
| Conectar el contenido con la vida propia (valor de utilidad) sube interés y notas, sobre todo en quienes dudan de su capacidad (Hulleman & Harackiewicz, 2009, *Science*) | Existe [V]; el detalle del efecto es [C] | Respalda el "para qué te sirve" |
| Preguntas de orden superior mejoran el rendimiento en pruebas de orden superior; las de hechos no (Agarwal, 2019, *J. Educ. Psychol.*) [V] | Respalda que Aplica incluya preguntas de uso y no solo de recuerdo | Sólido, 3 experimentos |
| Entrenar autorregulación en universitarios: g≈0.38 sobre el rendimiento (49 estudios, 5 786 personas; Theobald, 2021) [V]; el feedback aumenta el efecto | Respalda enseñar a dirigir el propio estudio | Programas largos, no un onboarding breve |
| IA sin límites como muleta: +48 % en práctica pero −17 % en el examen sin ayuda; con guardas el daño casi desaparece (Bastani et al., 2025, *PNAS*) [V] | Respalda exigir intento antes de ver la respuesta | Bachillerato, matemáticas |
| Lo que **no** está probado: que un escenario *generado por IA* sea mejor que un ejemplo corriente | — | **Hipótesis nuestra.** Medirla en el piloto (ver §5) |

## 4. Prompt para Perplexity (modo Deep Research / Academic)

> Actúa como revisor de literatura científica. Necesito evidencia **primaria** (artículos con DOI, tesis doctorales, metaanálisis) y entrevistas o charlas de investigadores reconocidos sobre los puntos siguientes. Para cada uno dame: referencia completa con DOI/enlace, tamaño de muestra, tamaño del efecto, población (edad, país), limitaciones y si replica. Marca explícitamente lo que NO encuentres y no inventes citas.
>
> Contexto: construyo una app de estudio para universitarios y últimos años de secundaria en Venezuela/Latinoamérica. Hace un diagnóstico de hábitos de estudio por autoinforme (9 dominios basados en LASSI y MSLQ), recomienda hábitos, y practica con repetición espaciada y con **problemas de la vida diaria** donde el estudiante debe aplicar lo visto en clase.
>
> 1. **Validez predictiva y fiabilidad de LASSI, MSLQ y el SSHA/ASSIST** respecto a notas y retención, especialmente en universitarios hispanohablantes y latinoamericanos. Incluye los metaanálisis de Crede & Phillips (2011) sobre MSLQ y el metaanálisis reciente de LASSI, validaciones al español y estudios en Venezuela, Colombia, México, Chile.
> 2. **Sesgos del autoinforme de hábitos de estudio**: deseabilidad social, ilusión de competencia, discrepancia entre lo declarado y lo observado (trazas de uso). Estudios que comparen cuestionario vs. registros conductuales.
> 3. **Intervenciones de "diagnóstico + feedback personalizado" sobre hábitos** (p. ej. programas de habilidades de estudio, "study skills" para primer año): ¿mejoran notas de verdad? Metaanálisis de Hattie, Biggs & Purdie (1996) y revisiones posteriores (Donoghue & Hattie 2021, Dunlosky 2013).
> 4. **Transferencia con problemas del mundo real o contextualizados**: ¿aprender con situaciones cotidianas mejora la transferencia o solo el interés? Revisiones sobre *situated learning*, *problem-based learning*, el efecto de contextos familiares en matemáticas (p. ej. Koedinger, Nathan; "concreteness fading", Fyfe et al.), y los riesgos (distractores contextuales, Kaminski & Sloutsky).
> 5. **Utility-value interventions** (Hulleman & Harackiewicz y réplicas): resultados en universitarios, en contextos de bajos recursos y fuera de EE. UU.
> 6. **Práctica de recuperación con preguntas de aplicación** frente a preguntas de recuerdo (Butler 2010; Agarwal; McDaniel): ¿qué tipo de pregunta mejora más el examen real?
> 7. **Retroalimentación generada por modelos de lenguaje** en tareas de aplicación: precisión de la evaluación automática de respuestas abiertas, alucinaciones y efectos en el aprendizaje.
> 8. **Evidencia en Venezuela/Latinoamérica**: deserción universitaria, causas académicas vs. económicas, y qué estrategias de estudio se asocian con rendimiento allí. Tesis doctorales en repositorios (UCV, USB, UCAB, SciELO, Redalyc, Dialnet).
> 9. Entrevistas, charlas o podcasts con **Bjork, Dunlosky, Roediger, Karpicke, Rohrer, Hattie, Harackiewicz, Zimmerman, Pintrich** donde discutan cómo llevar estas técnicas a productos reales.
>
> Termina con una tabla "afirmación → fuente → fuerza de la evidencia (alta/media/baja) → aplicable a mi caso (sí/parcial/no)" y una lista de lo que sigue sin respaldo.

## 5. Cómo medir "Aplica" en el piloto [D]

Eventos ya instrumentados: `apply_start`, `apply_done` (n, con IA o sin ella, promedio). Pregunta del piloto: ¿los ítems practicados con "Aplica" tienen mejor recuerdo a 7-14 días que los repasados solo con tarjeta? Corrección tras revisión externa: tarjeta vs. escenario **no aísla** el efecto del contexto (cambia también el formato). La comparación limpia es pregunta de aplicación convencional vs. la misma pregunta contextualizada, con tiempo y dificultad comparables, aleatorizando por ítem y contrabalanceando contenidos. Tarjeta vs. escenario sirve solo como prueba del paquete completo. No hay un tamaño de muestra que garantice validación; con ~30 estudiantes es una señal, no una prueba.

## Fuentes (añadidas tras la revisión con Perplexity, verificadas que existen)
- [Bastani et al. 2025, PNAS](https://ideas.repec.org/a/nas/journl/v122y2025pe2422633122.html)
- [Agarwal 2019](https://retrievalpractice.org/blooms)
- [Theobald 2021](https://link.springer.com/10.1007/s11409-023-09356-9) (resultados citados desde búsqueda, abrir el artículo antes de citar cifras)
- Cleary, Callan & Zimmerman 2012, DOI 10.1155/2012/428639 (existe; no aporta evidencia sobre IA conversacional)
- Sin verificar todavía: Michie 2011, Svartdal & Løkke 2022, y las tres tesis (UAM, TU Dublin, UNACH).

## Fuentes consultadas hoy
- [Metaanálisis del MSLQ (Crede & Phillips)](https://works.bepress.com/marcus-crede/6)
- [Metaanálisis del LASSI](https://digital.library.txstate.edu/items/e18c9a49-0a04-4179-bb83-c8f31c068d47)
- [Dunlosky et al. 2013 (resumen APS)](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html)
- [Pashler et al. 2008, estilos de aprendizaje](https://deansforimpact.org/learning-styles-what-does-the-research-say/)
- [Roediger & Karpicke 2006](https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf)
- [Butler 2010, transferencia](https://scholars.duke.edu/publication/1292911)
- [Rohrer & Taylor, intercalado](https://digitalcommons.usf.edu/psy_facpub/1760/)
- [Dificultades deseables (APS)](https://www.psychologicalscience.org/observer/desirable-difficulties)
