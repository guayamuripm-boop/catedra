# ADR-003: Metodos de evaluacion y estrategias de adaptabilidad

**Estado:** Propuesta
**Fecha:** 2026-09-21
**Contexto:** El prototipo actual tiene un flujo de evaluacion basado en tarjetas (confianza -> revelar -> auto-calificacion) con 5 tipos de pregunta. Se necesita expandir los metodos de evaluacion para cubrir mas niveles cognitivos y mejorar la adaptabilidad del sistema al estudiante.

---

## 1. Analisis del estado actual

### Lo que ya funciona bien
- Practica de recuperacion con auto-calificacion (3 niveles)
- Calibracion metacognitiva (confianza vs. resultado real)
- 5 tipos de pregunta (recuperacion, explicacion, aplicacion, comparacion, correccion)
- Deteccion de sobreconfianza con nudge en tiempo real
- Ajuste de sesion por energia pre-sesion
- Intercalado entre materias
- Metodologia adaptada a capacidad de enfoque (Pomodoro/Bloques/Profundo)

### Brechas identificadas
1. **Evaluacion pasiva:** El estudiante solo se auto-califica; no hay verificacion objetiva de lo que sabe.
2. **Audio sin uso pedagogico:** Las notas de voz se graban pero no se procesan ni evaluan.
3. **Falta de evaluacion escrita:** No hay donde el estudiante escriba respuestas extensas.
4. **Sin adaptacion por rendimiento intra-sesion:** La sesion no cambia si el estudiante esta fallando todo o dominando todo.
5. **Sin scaffolding progresivo:** No hay desvanecimiento de ayudas implementado (esta en la spec pero no en el prototipo).
6. **Sin pretesting:** No hay diagnostico antes de empezar un tema nuevo.

---

## 2. Nuevos metodos de evaluacion propuestos

### 2.1 Sintesis oral con auditoria IA (Audio)

**Concepto:** El estudiante graba un audio explicando un tema con sus palabras (tecnica Feynman). La IA transcribe, analiza cobertura, detecta errores y huecos, y devuelve retroalimentacion especifica.

**Flujo:**
```
1. App presenta un tema/concepto del material
2. Instruccion: "Explica [concepto] como si le ensenaras a un companero"
3. Estudiante graba audio (1-3 min)
4. Speech-to-text (Web Speech API o Whisper)
5. LLM compara transcripcion vs. material original
6. Genera reporte:
   - Conceptos cubiertos correctamente
   - Conceptos omitidos
   - Errores o imprecisiones detectadas
   - Puntuacion de cobertura (%)
   - Sugerencia: "Te falto mencionar X, que es clave porque..."
7. Items debiles se priorizan en proxima sesion
```

**Evidencia:** La autoexplicacion (MEDIA-ALTA) y la generacion activa son superiores a la recuperacion pasiva. Explicar en voz alta obliga a organizar el conocimiento, revelando huecos que el reconocimiento esconde.

**Implementacion tecnica:**
- Web Speech API (gratis, offline en Chrome) para transcripcion basica
- Whisper API como fallback (costo: ~$0.006/min)
- LLM evalua con prompt estructurado contra el material fuente
- Costo estimado por evaluacion: ~$0.01-0.02

**Cuando activar:** Despues de que el estudiante tenga >=3 repasos de un tema. No tiene sentido pedir sintesis de algo que apenas vio.

**Ventaja diferenciadora:** Ninguna app de estudio en el mercado hace esto. Anki, Quizlet, Kahoot son todos texto. La evaluacion oral es mas cercana a lo que pasa en un examen oral o en la vida real.

---

### 2.2 Respuesta escrita con evaluacion IA

**Concepto:** En vez de solo auto-calificarse, el estudiante escribe su respuesta. La IA compara contra la respuesta correcta y el material fuente.

**Flujo:**
```
1. Pregunta aparece (sin opciones)
2. Estudiante escribe respuesta en textarea
3. LLM evalua:
   - Precision: lo que dijo es correcto?
   - Completitud: cubrio los puntos clave?
   - Errores conceptuales especificos
4. Feedback granular (no solo correcto/incorrecto):
   - "Correcto sobre X, pero omitiste Y"
   - "Confundiste A con B, la diferencia es..."
5. Se mantiene la auto-calificacion como segundo paso (metacognicion)
```

**Evidencia:** La retroalimentacion correctiva (ALTA) es mas efectiva cuando distingue tipos de error. La escritura fuerza mayor elaboracion que reconocer una respuesta.

**Cuando activar:** Alternar con preguntas de auto-calificacion. Ratio sugerido: 1 de cada 3 preguntas con evaluacion escrita.

---

### 2.3 Preguntas de opcion multiple con distractores inteligentes

**Concepto:** Generar opciones de respuesta donde los distractores reflejan errores conceptuales comunes, no opciones absurdas.

**Flujo:**
```
1. Pregunta con 4 opciones
2. Cada distractor mapea a un tipo de error:
   - Opcion A: Correcta
   - Opcion B: Error de memoria (dato similar pero incorrecto)
   - Opcion C: Error conceptual (confunde con concepto relacionado)
   - Opcion D: Error de aplicacion (formula correcta, contexto incorrecto)
3. Segun la opcion elegida, el feedback es especifico al tipo de error
4. El sistema registra patrones de error por tipo
```

**Evidencia:** Los distractores bien disenados revelan misconceptions especificas y permiten retroalimentacion dirigida. Mas util que preguntas abiertas para diagnostico rapido.

---

### 2.4 Pretesting (diagnostico pre-tema)

**Concepto:** Antes de estudiar un tema nuevo, hacer 3-5 preguntas para activar conocimiento previo y mapear huecos.

**Flujo:**
```
1. Estudiante agrega material nuevo
2. Antes de generar preguntas de repaso, generar 3-5 preguntas de diagnostico
3. Estudiante responde sin presion (no afecta racha ni progreso)
4. Resultados determinan:
   - Nivel de dificultad inicial de las preguntas generadas
   - Que temas necesitan mas cobertura
   - Que ya sabe (no generar preguntas triviales)
5. Comunicar: "Ya dominas X. Nos enfocamos en Y y Z."
```

**Evidencia:** Pretesting (MEDIA) activa esquemas de conocimiento previo y mejora la codificacion del material nuevo. Tambien calibra expectativas del estudiante.

---

### 2.5 Secuenciacion y ordenamiento

**Concepto:** El estudiante ordena pasos, eventos o etapas en la secuencia correcta. Ideal para procedimientos, procesos historicos, algoritmos.

**Flujo:**
```
1. Presentar 4-6 elementos desordenados
2. Estudiante los arrastra al orden correcto
3. Feedback inmediato: que pasos estan bien, cuales no
4. Mostrar la secuencia correcta con explicacion de por que ese orden
```

**Cuando usar:** Materias con procedimientos (quimica, biologia, historia, programacion, derecho procesal).

---

### 2.6 Identificacion de error en solucion

**Concepto:** Mostrar un problema resuelto con un error intencional. El estudiante debe encontrar y explicar el error.

**Flujo:**
```
1. "Un estudiante resolvio este problema asi: [solucion con error]"
2. "Donde esta el error y por que esta mal?"
3. Estudiante senala el paso erroneo y explica
4. Feedback: tipo de error (memoria, conceptual, procedimiento, aplicacion)
```

**Evidencia:** Correccion de error (ya en la spec) combinada con ejemplos resueltos. El análisis de errores ajenos es metacognitivamente poderoso: activa evaluacion critica sin la carga emocional del propio error.

---

## 3. Estrategias de adaptabilidad

### 3.1 Dificultad dinamica intra-sesion

**Estado actual:** La sesion presenta todas las preguntas con la misma dificultad.

**Propuesta:**
```
Si ultimas 3 respuestas = "Lo domine":
  -> Subir dificultad (preguntas de aplicacion/comparacion)
  -> Reducir ayudas
  -> Nudge: "Estas en racha. Vamos con algo mas retador."

Si ultimas 3 respuestas = "No lo sabia":
  -> Bajar dificultad (preguntas de recuperacion basica)
  -> Agregar pistas
  -> Nudge: "Retrocedamos a lo fundamental."

Si patron mixto:
  -> Mantener nivel actual
  -> Intercalar dificultades
```

**Implementacion:** Agregar campo `dificultad` a cada item (baja/media/alta) y un selector durante la sesion que priorice segun rendimiento acumulado en la sesion.

---

### 3.2 Scaffolding progresivo (desvanecimiento de ayudas)

**Estado actual:** Mencionado en spec y pedagogia.md pero no implementado.

**Propuesta de 5 niveles:**
```
Nivel 1 - Ejemplo resuelto:
  "Asi se resuelve: [solucion completa]"
  Pregunta: "Que concepto se uso en el paso 2?"

Nivel 2 - Parcialmente resuelto:
  "Los primeros pasos son: [pasos 1-2]. Completa el resto."

Nivel 3 - Con pista:
  Pregunta normal + boton "Pista" que da una clave
  (usar pista no penaliza pero se registra)

Nivel 4 - Sin ayuda:
  Pregunta abierta, sin pistas disponibles

Nivel 5 - Transferencia:
  Contexto diferente al del material original
  "Si en vez de [X] fuera [Y], que cambiaria?"
```

**Transicion entre niveles:** Basada en `consolidationStreak`:
- 0 repasos: Nivel 1-2
- 1-2 repasos exitosos: Nivel 3
- 3-4 repasos exitosos: Nivel 4
- 5+ repasos exitosos: Nivel 5

---

### 3.3 Deteccion de fatiga por patrones de respuesta

**Senales de fatiga:**
```
- Tiempo de respuesta cae drasticamente (responde en <2s cuando antes era >10s)
- Auto-calificacion se vuelve uniforme (todo "Lo domine" o todo "No lo sabia")
- Confianza siempre en 2 (no discrimina)
- Mas de X minutos sin pausa
```

**Acciones:**
```
Fatiga leve:
  -> Cambiar tipo de pregunta (de escrita a opcion multiple)
  -> Reducir preguntas restantes

Fatiga moderada:
  -> Sugerir pausa con temporizador
  -> "Llevas 35 min y tu precision bajo. 5 min de pausa?"

Fatiga severa:
  -> Terminar sesion automaticamente
  -> "Mejor parar aqui. Lo que hiciste hoy se consolida con descanso."
```

---

### 3.4 Perfil adaptativo por materia (no global)

**Estado actual:** Un perfil global para todas las materias.

**Propuesta:** Cada materia desarrolla su propio perfil de rendimiento:
```
{
  subjectId: "subj0",
  dominantErrorType: "conceptual",    // tipo de error mas frecuente
  avgResponseTime: 18,                // segundos
  optimalSessionLength: 15,           // minutos antes de caer precision
  bestQuestionType: "aplicacion",     // donde mejor rinde
  worstQuestionType: "comparacion",   // donde mas falla
  scaffoldLevel: 3,                   // nivel actual de ayudas
  retentionCurve: [100, 85, 70, 60]  // % retencion por dia
}
```

**Uso:** La sesion prioriza el tipo de pregunta donde mas falla y ajusta la duracion al punto optimo de esa materia.

---

### 3.5 Modo examen simulado

**Concepto:** Sesion cronometrada que simula condiciones de examen real.

**Diferencias con sesion normal:**
```
- Sin pistas ni ayudas
- Tiempo limite por pregunta
- Sin ver respuesta hasta el final
- Mezcla todos los temas de la materia
- Puntuacion final tipo examen (sobre 20 o sobre 100)
- Comparacion con sesiones normales: "En practica dominas 80%, en examen simulado 65%"
```

**Cuando ofrecer:** 3-5 dias antes del examen. Maximo 2 simulacros por materia.

---

### 3.6 Re-planificacion inteligente por ausencia

**Estado actual:** Redistribuye preguntas no completadas post-sesion.

**Propuesta ampliada:**
```
Si el estudiante no estudia 1 dia:
  -> Redistribuir uniformemente

Si no estudia 2-3 dias:
  -> Priorizar items con consolidationStreak mas bajo
  -> Reducir items nuevos
  -> Nudge empatico al volver

Si no estudia 4+ dias:
  -> "Sesion de reinicio": solo 5-8 preguntas faciles
  -> Recalcular todos los intervalos FSRS
  -> "Bienvenido de vuelta. Empezamos suave."

Si el examen esta cerca y falto mucho:
  -> Modo rescate: solo items debiles + mas frecuentes
  -> "No alcanzamos a cubrir todo. Enfocate en estos X temas."
```

---

## 4. Integracion del audio: flujo completo propuesto

### 4.1 Nota de voz como material de entrada

```
Grabar audio -> Transcribir -> Usar como material fuente -> Generar preguntas
```
- Util para estudiantes que toman notas en clase grabando
- El material transcrito se muestra para revision antes de generar

### 4.2 Sintesis oral como metodo de evaluacion (la idea principal)

```
Sesion de evaluacion oral:
1. App selecciona 1-3 conceptos clave de la materia
2. Por cada concepto:
   a. Muestra el tema (sin el contenido)
   b. "Explica [tema] con tus palabras. Tienes 90 segundos."
   c. Estudiante graba
   d. IA transcribe y analiza:
      - Cobertura: que porcentaje de conceptos clave menciono
      - Precision: lo que dijo es correcto
      - Organizacion: la explicacion tiene estructura logica
      - Huecos: que omitio que es critico
   e. Feedback visual:
      - Barra de cobertura (verde/amarillo/rojo)
      - Lista de conceptos cubiertos vs. omitidos
      - Errores especificos con correccion
3. Resumen: "Cubres bien X y Y, pero Z necesita mas trabajo"
4. Items sobre los huecos se priorizan en proxima sesion
```

### 4.3 "Ensena a la IA" (variante gamificada)

```
Framing: "La IA es tu alumno. Ensenale este tema."
1. Estudiante graba explicacion
2. IA "hace preguntas" basadas en los huecos:
   - "No me quedo claro por que [X]. Puedes explicar?"
   - "Y si [Y] cambiara, que pasaria?"
3. Estudiante responde (segunda grabacion o texto)
4. IA evalua si la aclaracion cerro el hueco
5. Ciclo hasta que la IA "entiende" (cobertura >= 80%)
```

**Beneficio psicologico:** Cambiar el frame de "me estan evaluando" a "estoy ensenando" reduce ansiedad y activa procesamiento mas profundo.

---

## 5. Prioridades de implementacion

### Fase 1 (MVP - sin IA para evaluacion)
1. **Pretesting basico** - 3 preguntas de diagnostico al agregar material (generadas con template, sin IA)
2. **Respuesta escrita simple** - Textarea para escribir antes de revelar (sin evaluacion IA, solo para forzar elaboracion)
3. **Dificultad dinamica intra-sesion** - Ajustar tipo de pregunta segun ultimas 3 respuestas
4. **Deteccion de fatiga basica** - Tiempo + patron de respuestas uniformes

### Fase 2 (Con IA)
5. **Opcion multiple con distractores inteligentes** - LLM genera distractores con errores tipados
6. **Evaluacion escrita con IA** - LLM compara respuesta del estudiante vs. material
7. **Scaffolding progresivo** - 5 niveles basados en consolidationStreak
8. **Re-planificacion inteligente** - Sesion de reinicio adaptada a dias de ausencia

### Fase 3 (Audio + avanzado)
9. **Transcripcion de notas de voz** - Web Speech API / Whisper
10. **Sintesis oral con auditoria** - Evaluacion Feynman automatizada
11. **"Ensena a la IA"** - Modo interactivo oral
12. **Modo examen simulado** - Sesion cronometrada sin ayudas
13. **Perfil adaptativo por materia** - Modelo de rendimiento por materia

---

## 6. Metricas de exito por metodo

| Metodo | Metrica clave | Objetivo |
|---|---|---|
| Sintesis oral | % de cobertura promedio sube entre sesiones | +15% en 2 semanas |
| Respuesta escrita | Precision de auto-calificacion vs. evaluacion IA | Diferencia < 20% |
| Opcion multiple | Reduccion de error conceptual recurrente | -30% en errores tipados |
| Pretesting | Reduccion de items triviales generados | -40% preguntas descartadas |
| Scaffolding | % de estudiantes que llegan a nivel 5 en 30 dias | >25% |
| Examen simulado | Correlacion con nota real del examen | r > 0.6 |
| Dificultad dinamica | Sesiones abandonadas a mitad | -20% |
| Deteccion fatiga | Precision post-pausa vs. pre-pausa | +15% |

---

## 7. Consecuencias

**Ganamos:**
- Evaluacion mas objetiva (no solo auto-reporte)
- Diferenciacion real vs. competencia (nadie hace evaluacion oral automatizada)
- Mayor adaptabilidad = mayor retencion
- Datos mas ricos para ajustar el motor de aprendizaje

**Perdemos / Riesgos:**
- Complejidad de UX (mas modos = mas confusion potencial)
- Costo de IA por evaluacion escrita/oral (~$0.01-0.02 por evaluacion)
- Dependencia de Speech API (calidad variable en espanol latinoamericano)
- Privacidad: audio del estudiante necesita politica clara

**Mitigaciones:**
- Introducir metodos gradualmente (1 por ciclo)
- Modo sin IA siempre disponible (auto-calificacion como fallback)
- Audio se procesa y se descarta; no se almacena en servidor
- Cada metodo nuevo tiene toggle para desactivar
