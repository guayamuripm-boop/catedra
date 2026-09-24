# Investigacion pedagogica - Catedra

## Principios implementados

### 1. Practica de recuperacion [ALTA]
Recordar activamente mejora la retencion mas que releer. La app convierte todo estudio en responder preguntas, no en revisar material.

**Requisito critico:** retroalimentacion correctiva despues de cada intento. Sin feedback, el estudiante puede consolidar errores.

### 2. Repeticion espaciada [ALTA]
Separar revisiones en el tiempo mejora retencion a largo plazo. Se implementa con FSRS (ts-fsrs).

**Cuidado:** no forzar demasiadas revisiones diarias. El sistema debe respetar el tiempo disponible del estudiante.

### 3. Practica distribuida [ALTA]
Distribuir el estudio en varios dias supera concentrarlo en una sesion. El planificador reparte sesiones automaticamente.

### 4. Intercalado [MEDIA-ALTA]
Mezclar tipos de ejercicio ayuda a discriminar cuando aplicar cada procedimiento. Especialmente util en matematica, fisica y quimica.

**Cuidado:** no intercalar antes de que el estudiante comprenda lo basico de cada tema.

### 5. Retroalimentacion correctiva [ALTA]
No basta "correcto/incorrecto". Distinguir tipos de error:
- Error de memoria: no recordaba la definicion
- Error conceptual: confundio conceptos
- Error de procedimiento: formula correcta, sustitucion incorrecta
- Error de aplicacion: conoce la formula, no sabe cuando usarla
- Error de interpretacion: leyo mal la pregunta

### 6. Pretesting [MEDIA]
Antes de ensenar un tema, preguntar que sabe el estudiante. Activa conocimiento previo y muestra huecos.

### 7. Desvanecimiento de ayudas [ALTA]
Secuencia: ejemplo resuelto -> parcialmente resuelto -> con pista -> sin ayuda -> contexto diferente.

### 8. Calibracion metacognitiva [MEDIA-ALTA]
Pedir prediccion de confianza antes de responder. Comparar con resultado real. Reduce la "ilusion de saber".

### 9. Sintesis oral (Feynman automatizado) [MEDIA-ALTA]
El estudiante graba una explicacion oral de un concepto. La IA transcribe y evalua cobertura, precision y huecos. Combina autoexplicacion + generacion activa + retroalimentacion correctiva.

**Evidencia:** Explicar en voz alta obliga a organizar el conocimiento, revelando huecos que el reconocimiento esconde. La tecnica Feynman es ampliamente recomendada pero dificil de practicar sola; la IA provee la audiencia y el feedback.

**Cuando activar:** Despues de al menos 3 repasos del tema. Antes de eso, el estudiante no tiene suficiente base para sintetizar.

### 10. Evaluacion escrita con retroalimentacion IA [ALTA]
El estudiante escribe su respuesta en vez de solo auto-calificarse. La IA compara contra el material fuente y da feedback especifico por tipo de error.

**Ventaja sobre auto-calificacion:** Fuerza elaboracion activa y permite detectar auto-engano (el estudiante que cree saber pero escribe imprecisiones).

### 11. Pretesting / diagnostico previo [MEDIA]
Antes de estudiar un tema nuevo, 3-5 preguntas de diagnostico que no afectan racha ni progreso. Activan conocimiento previo y calibran la dificultad inicial de las preguntas generadas.

### 12. Scaffolding progresivo (desvanecimiento de ayudas) [ALTA]
Secuencia de 5 niveles:
1. Ejemplo resuelto completo
2. Parcialmente resuelto
3. Con pista disponible
4. Sin ayuda
5. Transferencia a contexto diferente

La transicion se basa en consolidationStreak del item.

### 13. Examen simulado [MEDIA]
Sesion cronometrada sin pistas ni ayudas que simula condiciones reales. Util 3-5 dias antes del examen. Revela la brecha entre "reconocer" y "recordar bajo presion".

### 14. Opcion multiple con distractores inteligentes [MEDIA-ALTA]
Cada distractor mapea a un tipo de error especifico (memoria, conceptual, procedimiento, aplicacion). Permite retroalimentacion dirigida al error real del estudiante.

---

## Estrategias de adaptabilidad implementadas

### Dificultad dinamica intra-sesion
Si ultimas 3 respuestas son "Lo domine", sube dificultad. Si son "No lo sabia", baja. Evita frustracion y aburrimiento.

### Deteccion de fatiga por patrones
Senales: tiempo de respuesta cae, auto-calificacion uniforme, >45 min sin pausa. Acciones: sugerir pausa, cambiar tipo de pregunta, terminar sesion.

### Perfil adaptativo por materia
Cada materia desarrolla su propio perfil de rendimiento: tipo de error dominante, tiempo de respuesta promedio, duracion optima de sesion.

### Re-planificacion por ausencia
Adapta la carga segun dias sin actividad: 1 dia = redistribuir, 2-3 dias = priorizar debiles, 4+ dias = sesion de reinicio suave.

---

## Tecnicas de baja utilidad (la app desalienta)

- Releer sin practicar
- Subrayar como metodo principal
- Resumir sin recuperar
- Clasificar por "estilo de aprendizaje"

---

## Niveles de practica

| Nivel | Tipo | Ejemplo (Fisica) |
|---|---|---|
| Recordar | Factual | "Cual es la segunda ley de Newton?" |
| Comprender | Explicar | "Que significa que la aceleracion sea proporcional a la fuerza?" |
| Aplicar | Transferir | "Un objeto duplica su masa con la misma fuerza: que pasa?" |

---

## Tipos de pregunta

| Tipo | Uso |
|---|---|
| Recuperacion breve | Hechos, conceptos, formulas |
| Explicacion | Causalidad, relaciones |
| Comparacion | Conceptos confundibles |
| Aplicacion | Transferencia basica |
| Correccion de error | Concepciones erroneas |
| Paso faltante | Procedimientos |

---

## Tono del coach

- Breve, amable, sin culpar
- No: "Estas procrastinando"
- Si: "Esta tarea parece grande. Hagamos 8 minutos para identificar que parte no entiendes."
- No: "Fallaste tu racha"
- Si: "Retomemos con una sesion de reinicio de 5 minutos."

---

## 10 micro-lecciones iniciales

1. Por que recordar > releer
2. Espaciado: repasar poco cada dia
3. Como hacer buenas preguntas de estudio
4. Metodo Feynman: explicar con tus palabras
5. Intercalar temas: incomodidad productiva
6. Ilusion de saber y como detectarla
7. Planes "si-entonces"
8. Sueno, descanso y memoria
9. Que hacer la semana antes de un examen
10. Como usar la IA para estudiar sin que piense por ti
