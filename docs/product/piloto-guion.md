# Guion del piloto: qué medir, qué preguntar y cómo decidir

Fecha: 2026-10-05. Piloto: 10–15 universitarios de 18+ en Venezuela, 2 semanas, una materia cada uno. **No prueba eficacia**: busca bloqueos de uso y señales de valor. Sin cuentas ni IA propia, así que los datos viajan solo si el estudiante acepta la medición anónima.

## 1. Preguntas dentro de la app (un toque, nunca texto libre)
Código: `js/survey.js`. Cada respuesta se guarda en el teléfono (`S.survey`, va en el respaldo) y se envía como evento `survey` con `k` (pregunta) y `v` (respuesta).

| Clave `k` | Pregunta | Cuándo aparece | Qué decide |
|---|---|---|---|
| `sesion_util` | ¿Te ayudó esta sesión? | Al cerrar cada sesión (hasta 6 veces, una por día) | Valor percibido del núcleo |
| `perfil_valido` | ¿Este perfil describe cómo estudias? | Al ver el perfil de hábitos (hasta 2) | **Valida el diagnóstico** |
| `habito_util` | ¿Este hábito te pareció útil? | Tras el veredicto de un hábito | **Valida el motor de hábitos** |
| `aplica_real` / `aplica_propia` | ¿La situación se parece a tu vida? / ¿Pensar tu propia situación te sirvió? | Tras cada Aplica (hasta 4) | **Valida las situaciones cotidianas** |
| `recuerda_util` | ¿Te sirvió escribir lo que recuerdas? | Tras Recuerda (hasta 4) | Valida Recuerda |
| `ia_calidad` | ¿Las preguntas reflejan tu material? | Al generar con IA (hasta 3) | **Calidad real de la IA** |
| `sean` | Si dejaras de usar Catedra, ¿cómo te sentirías? | Día 3+ y 3+ sesiones | Ajuste producto-mercado |
| `beneficio` | ¿Qué es lo que más te sirve? | Día 4+ | Qué conservar |
| `freno` | ¿Qué te frena más para usarla? | Día 5+ | Qué arreglar |
| `recomienda` | ¿Se la recomendarías a un compañero? | Día 7+ | Boca a boca |

Reglas: máximo una pregunta programada por día, nunca durante una sesión, siempre con "Ahora no" (se registra como `omitida`), y las en línea no se repiten el mismo día.

## 2. Métricas objetivo (umbrales míos: ajústalos con criterio)
| Métrica | Cómo se lee | Meta orientativa para seguir adelante |
|---|---|---|
| Activación | Quienes aceptan los términos y hacen 1 sesión en 24 h (`terms_accepted` → `session_done`) | ≥ 70 % |
| Retención | Vuelven en día 3 y en día 7 (`app_open` por `day`) | ≥ 40 % al día 7 |
| Valor percibido | `sesion_util` = Sí o Más o menos | ≥ 70 % |
| Ajuste al producto | `sean` = Muy decepcionado | ≥ 40 % es la regla empírica de Sean Ellis (heurística de startups, no un estándar científico) |
| Perfil | `perfil_valido` = Sí o En parte | ≥ 70 % |
| Hábitos | `habito_util` = Sí o Más o menos y `habit_verdict` = mejoró | ≥ 50 % útil; ≥ 30 % mejoró |
| Situaciones | `aplica_real` = Sí o Más o menos | ≥ 70 % |
| IA | `ia_calidad` = Sí o Algunas | ≥ 80 % |
| Problemas | `item_reported` | < 10 % de las situaciones |
| Aprendizaje (exploratorio) | `recallScores` de los mismos ítems a 7 días | solo tendencia |

Con 10–15 personas esto da **señales, no pruebas**. Un resultado debajo de la meta no condena la idea: dirige qué mejorar.

## 3. Cómo leerlo en PostHog (gratis)
Con `POSTHOG_KEY` puesta: Insights → evento `survey` → desglose por `k` y luego por `v`. Embudo: `app_open` → `terms_accepted` → `subject_added` → `questions_generated` → `session_start` → `session_done`. Retención: evento `app_open`, cohorte por primer uso. Sin PostHog, las respuestas quedan en cada teléfono: pídeles "Exportar respaldo" al final y lee `state.survey.log`.

## 4. Observación en vivo (5–8 personas, 20 min, sin ayudar)
Tareas, en este orden, midiendo si la persona las logra sola y en cuánto tiempo:
1. Abrir el enlace, instalar la app y completar "Tu ritmo".
2. Añadir una materia y pegar un texto de su clase; aprobar 3 preguntas.
3. Hacer "Estudiar ahora" y usar la pista o "Ver respuesta" a propósito.
4. Probar **Recuerda** y **Aplica**.
5. Encontrar dónde ve su hábito y qué debe hacer esta semana.
6. Cerrar y decir cuándo volvería a repasar.
Preguntas finales: «¿Qué crees que te está recomendando y por qué?», «¿Qué quitarías?», «¿Qué te faltó?», «¿Cuándo la usarías de verdad?». Anota dónde dudan, qué tocan por error y qué no encuentran. No expliques hasta el final.

## 5. Revisión de calidad antes de abrir
- [ ] 3 textos reales de clase → ¿las preguntas de la IA reflejan el texto? (anota los fallos).
- [ ] 10 situaciones de Aplica → ¿alguna inventa un dato que no está en el texto? ¿suena a Venezuela/Latinoamérica?
- [ ] Instalada en 2 celulares distintos (Android e iPhone si es posible): instalar, voz, foto, modo avión, recarga a mitad de sesión.
- [ ] Tras 1 sesión y 1 hábito de prueba, el estudiante entiende qué le pedimos.
- [ ] La política de privacidad dice lo mismo que hace la app (registro de práctica local, eventos anónimos, borrado desde Ajustes).
- [ ] Una persona con formación en psicología educativa o docencia revisó `docs/product/habitos-catalogo.md`.

## 6. Decisión al final de las 2 semanas
- **Seguir** si se cumplen activación, retención y valor percibido, aunque los hábitos aún no convenzan.
- **Cambiar** lo que `freno` y `beneficio` señalen antes de ampliar.
- **Frenar** si la mayoría no vuelve al día 3: el problema sería de valor, no de pulido.
