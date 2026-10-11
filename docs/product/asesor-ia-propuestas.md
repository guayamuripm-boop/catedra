# Asesor con IA: qué se construyó, qué se propone y cómo lo evalúo

Fecha: 2026-10-10. Norte: entender al estudiante con datos que usamos y convertirlos en una acción concreta y comprobable.

## 1. Lo construido hoy (probado con IA simulada, pendiente de probar con claves reales)

| Pieza | Qué hace | Dónde |
|---|---|---|
| **Plan de la semana** (`plan`) | La IA recibe un resumen numérico del estudiante (sin nombre): exámenes, dominio por materia, temas débiles, acierto, recuerdo tras 5+ días, calibración, días de práctica, hora fuerte, hábito en prueba, lo que escribió en sus "puentes". Devuelve sesiones (materia, día, minutos, actividad, por qué), cosas **por fuera de Catedra** y **qué medir**. | `api/ai.js`, `js/coach.js` |
| **Medición y bucle adaptativo** | El plan guarda su línea base. Al pedir el siguiente, la IA recibe cuántas sesiones se cumplieron y si cada métrica llegó a su meta. Catedra mide; la IA solo redacta y ajusta. | `COACH.progress` / `COACH.save` |
| **Entender material** (`digest`) | Resumen corto, 3–8 ideas clave **con cita literal verificada**, sesiones para estudiarlo, 3 casos de la vida diaria (usa lo que el estudiante escribió que le interesa) y dudas frecuentes. Se guarda en Cerebro o se convierte en preguntas. | botón "Entenderlo y planear…" en Materias; ícono de bombilla en una nota |
| **Recomendaciones externas sin inventar** | La IA propone una *frase de búsqueda*; Catedra arma la búsqueda en YouTube/Google. Para tutor con IA o persona, copia una instrucción. | `COACH.searchUrl` |

Protecciones: el servidor descarta materias que no se enviaron, actividades fuera de catálogo, minutos sobre el tope del estudiante y **cualquier enlace** escrito por el modelo; las métricas y metas se acotan; el texto del estudiante viaja marcado como datos (no instrucciones). 82 pruebas pasan.

## 2. Honestidad sobre "acceso a internet"

Los modelos que usamos (Groq/OpenRouter/Gemini por la vía compatible) **no navegan**. Si les pedimos "recomienda un video", inventan títulos y enlaces que no existen: es el peor error posible en una app educativa. Por eso la IA propone *qué buscar* y Catedra abre la búsqueda real. Navegar de verdad (Gemini con búsqueda de Google, o Tavily/Brave) es posible más adelante, pero cuesta, hay que mostrar fuentes y no cabe en el plan gratis estable. No lo recomiendo aún.

## 3. Propuestas siguientes, evaluadas

Criterio: ¿mejora el conocimiento del estudiante con datos que ya tenemos y se convierte en una acción comprobable? Costo = esfuerzo + cupo de IA gratis.

| # | Propuesta | Valor | Riesgo / costo | Veredicto |
|---|---|---|---|---|
| 1 | **Probar lo ya hecho con claves reales y 3–5 estudiantes** (¿el plan es creíble? ¿lo siguen? ¿mejora la métrica?) | Altísimo: sin esto todo lo demás es teoría | Bajo | **Hacer ya** |
| 2 | **Casos de vida diaria dentro de la práctica**, no solo en el resumen: cada semana un caso por tema débil, ligado a lo que el estudiante dijo que le interesa | Alto (Aplica ya existe; falta personalizar con los puentes) | Bajo: reutiliza `scenario` | Hacer después de 1 |
| 3 | **Material largo por partes** (PDF de 40 págs): resumir por secciones y luego unir | Alto para universitarios | Medio: multiplica llamadas; el límite gratis de Groq (~12k tokens/min) manda | Hacer, con aviso de cuántas llamadas gasta |
| 4 | **Plan que se reajusta solo** cuando fallas dos sesiones seguidas o cambia una fecha, sin pedirlo | Alto (es "ser adaptativo") | Medio: riesgo de agobiar; mejor sugerirlo con un toque | Hacer, como sugerencia no automática |
| 5 | **Mapa de dominio por unidad** (lo que sabes / lo que falta) para que el plan apunte a huecos, no a materias enteras | Alto | Medio: requiere que las preguntas estén ligadas a unidades (ya existe `unitId`) | Hacer |
| 6 | **Aprender qué actividad te funciona a ti** (comparar acierto tras `autoprueba` vs `explicar` en tus datos y pesarlo en el plan) | Altísimo y es el diferencial real | Medio: necesita volumen de datos | Hacer cuando haya ~3 semanas de uso |
| 7 | Cuentas/sincronización entre dispositivos | Medio | Alto | Esperar al piloto |
| 8 | Chat libre con el asesor | Bajo | Alto (cupo, desvío, tono) | **No**: la competencia ya lo da gratis; nuestro valor es medir, no conversar |
| 9 | Predicción de nota | Bajo | Alto: prometer sin evidencia | **No** (ver visión: "mejora comprobable") |

## 4. Límites que el estudiante debe ver

- El plan es una **propuesta** basada en sus datos, no un diagnóstico. Con pocos datos la IA debe decirlo y dar un plan de arranque sencillo (está en el prompt, pero hay que comprobarlo con el modelo real).
- "Estilos de aprendizaje" queda prohibido en el prompt.
- Los hábitos siguen saliendo de reglas con literatura citada; la IA no decide hábitos.
- Cada plan gasta 1 llamada y cada resumen 1; el tope diario por estudiante (`AI_DAILY_LIMIT_PER_USER`) lo protege.

## 5. Cómo verificar en producción (lo único que me falta)

1. En Vercel: `GROQ_API_KEY` (y/o las otras) y `PILOT_CODES`. Redespliega.
2. Abre `/api/ai?check=1&c=TU_CODIGO`: debe mostrar cada proveedor con `ok:true`. (Sin código `/api/ai` responde `enabled:false` aunque todo esté bien: es a propósito.)
3. Abre la app con `/app?c=TU_CODIGO`, añade una materia con preguntas y práctica, y pulsa **Armar mi plan** en Hoy.
4. Revisa si el diagnóstico cita números reales tuyos y si las sesiones respetan tus minutos. Si algo suena inventado, cópiame el resultado y ajusto el prompt.
