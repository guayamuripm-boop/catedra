# Materiales, instituciones, enfoque fuera de la app y conexión con ZR Note (2026-10-08)

Marcas: **[V]** visto en fuente esta sesión, **[C]** leído en nuestro código o en el de ZR Note, **[D]** decisión o juicio nuestro.

## 1. Verificación: ¿soportamos varias materias, instituciones y materiales?

| Necesidad real | Hoy [C] | Veredicto |
|---|---|---|
| Varias materias | `S.subjects` es una lista sin tope en el código | Sí, pero el onboarding crea una sola y la lista es plana |
| Varios lugares de estudio (universidad + curso + academia + bachillerato a la vez) | No existe el concepto: una materia no pertenece a nada | **No** |
| Ritmo distinto por tipo (semestre con parciales, lapsos del bachillerato, módulos de un curso, simulacros de academia) | Una sola fecha de examen por materia (`examDate`) | **No**: no cabe más de una evaluación |
| Material de cada clase (apuntes, audio, foto, PDF, enlace) | El texto pegado se convierte en preguntas y **no se guarda como material**; las notas del Cerebro sí guardan texto, con `subjectId` opcional; los audios se guardan sin transcribir | **Parcial**: no hay "material" como objeto con estado |
| Saber qué temas no tienen práctica aún | Las preguntas llevan `origen`, `cita` y `noteId`, pero no unidad ni tema | **No** |
| Entrada rápida desde otras apps | Hay Web Share Target (texto y archivos entran como nota) y el parser de "Pregunta/Respuesta" | Sí, base útil |

## 2. Modelo propuesto: se adapta a cualquier formato [D]

```
Espacio  (dónde estudias: universidad · bachillerato · academia · curso en línea · por mi cuenta)
 └─ Materia
     ├─ Unidades / temas      (capítulo, módulo, clase, lapso: el nombre depende del espacio)
     ├─ Materiales            (texto · audio de clase · foto · PDF · video · enlace)  → cada uno con estado
     ├─ Preguntas             (ligadas a material y unidad, con cita)
     └─ Evaluaciones          (varias: fecha, peso opcional, qué unidades cubre)
```

Reglas para que sea simple y no un LMS:
1. **El Espacio es solo un perfil de plantilla**, no una pantalla extra: al crear una materia se elige un ícono (universidad, colegio, academia, curso, propio) y eso cambia el vocabulario ("parcial", "lapso", "módulo", "simulacro") y la fase por defecto de la ruta al examen.
2. **Las unidades son opcionales**: se crean solas al subir un material ("Clase del 8 de octubre") y se pueden renombrar o agrupar. Quien no quiera orden, no lo ve.
3. **Cada material nace con estado**: *recibido → leído → convertido en preguntas → practicado*. Hoy se pierde en el paso 2.
4. **Evaluaciones múltiples por materia**, cada una con su alcance; la ruta por fases ya hecha pasa a calcularse por evaluación.
5. **Cobertura visible**: "Unidad 3: sin preguntas todavía" es la información más útil para un estudiante que recibe material de cada clase.
6. Migración sin riesgo: lo existente cae en un espacio "Mis materias" con una unidad "General".

Formatos que esto cubre [D, sin entrevistas todavía]: universidad (semestre, parciales, finales), bachillerato (lapsos, trabajos, exámenes por objetivo), academia preuniversitaria (módulos, simulacros, prueba de admisión), curso en línea (módulos y certificación), autodidacta (sin fechas, modo cuaderno).

## 3. Audio de clase al estilo ZR Note dentro de Catedra

Lo que ya existe en ZR Note [C, repositorio `C:\Dev\ZR Note`]: graba o sube audio, transcribe con Whisper (Groq), y en **"Modo Clase"** genera un objeto de ayudas de estudio: temario, glosario, fórmulas, ejemplos resueltos, **errores que el docente advirtió, preguntas de repaso, tarjetas y qué entra en el examen**; todo con normalización defensiva del JSON (`study-aids.ts`) y mazo Leitner (`flashcard-deck.ts`). Tiene también búsqueda semántica (pgvector), extensión de Chrome para Meet/Zoom/Teams y un paquete Android (`twa`).

Tres caminos, de menor a mayor esfuerzo [D]:

| Camino | Qué es | Esfuerzo | Cuándo |
|---|---|---|---|
| **A. Paquete compartido** | ZR Note exporta el Modo Clase en un formato que Catedra ya entiende (texto "Pregunta/Respuesta" por Web Share Target o un JSON `catedra-pack v1` con materia, unidad, conceptos, preguntas, tarjetas, pistas del examen). Catedra lo importa como **material + unidad + preguntas con cita** | Bajo: un importador en Catedra y un botón "Enviar a Catedra" en ZR Note | **Primero** |
| **B. Modo clase nativo** | Grabar la clase dentro de Catedra, transcribir y generar las ayudas con el mismo prompt portado a `api/ai.js` | Medio: transcripción de audio largo con límites gratuitos (Groq tiene tope por minuto) y manejo de archivos grandes | Cuando el camino A demuestre uso |
| **C. Cuenta única** | Mismo inicio de sesión (Supabase en ambos) y biblioteca compartida | Alto | Junto con cuentas y sincronización |

Riesgos que hay que decidir antes de B [D]: grabar clases requiere permiso del docente y, con menores, consentimiento del tutor; el audio no debe salir del teléfono sin que el estudiante lo pida.

## 4. Estudiar fuera de la app con "consecuencia" estilo Forest

### Qué es posible en una PWA y qué no [V salvo indicación]
| Capacidad | Realidad |
|---|---|
| Detectar que el estudiante salió de la app | **Sí**, con la API de visibilidad de página (se dispara al cambiar de app o bloquear pantalla). No sabe a dónde fue, y bloquear la pantalla se confunde con salir [C, comportamiento estándar; no verifiqué instalado en iOS/Android] |
| Bloquear otras apps | **No** en una PWA. Forest lo hace con permisos del sistema en Android y listas permitidas en iOS 16 o superior; en iOS 15 o menos el árbol se marchita al salir [V, [Forest en X](https://x.com/forestapp_cc/status/1255331240045162498?lang=en) y ficha de App Store] |
| Mantener la pantalla encendida | Solo con Wake Lock: funciona en Chrome y en Safari desde iOS 16.4, pero hay reportes de que **falla en PWA instalada en iOS** y se suelta al ocultar la página [V, [caniuse](https://caniuse.com/wake-lock) y reporte de WebKit; hay que probar en un iPhone] |
| Sonar al terminar con la app cerrada | Solo con notificaciones push (servidor + permiso; en iOS requiere PWA instalada). Los temporizadores se pausan en segundo plano, así que el tiempo **debe calcularse con marcas de hora** al volver [C] |
| Bloqueo real y alarma fiable | Requiere app nativa; ya existe un paquete Android en ZR Note (`twa`) y Capacitor sería la ruta [D] |

### Evidencia de que sirve
- Forest fue 1 de 4 de 13 apps eficaces para reducir el uso del teléfono en un estudio con **solo 26 personas**; hay poca evidencia sólida [V, [JMIR 2023](https://www.jmir.org/2023/1/e42541)].
- **Pomodoro 25/5 no superó a las pausas autorregladas** en 94 universitarios; el tiempo estructurado dio más fatiga y menos motivación a medida que avanzaba la sesión, sin diferencias globales de productividad [V, [Smits, Wenzel y de Bruin 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12292963/)]. Otro estudio de pausas fijas de 6 minutos cada 24 dio mejor ánimo y eficiencia que las autorreguladas [V, mismo resultado de búsqueda]. Conclusión: **ofrecer estructura sin imponer 25/5**; que el perfil del estudiante (concentración) sugiera la duración, como ya hacemos.
- Las rachas movilizan por aversión a la pérdida, pero el todo-o-nada produce ansiedad y abandono [V, evidencia sobre todo de blogs de producto; no encontré estudios controlados]. Los diseños sugeridos son racha limitada a la semana y un respiro protegido [V, mismas fuentes].

### Diseño recomendado: "Sesión de enfoque" [D]
1. **Elige qué harás**: leer, ver un video, ejercicios en papel, clase, escribir apuntes. Duración sugerida por su perfil, editable. Pausa propia o fija, a elección.
2. **Dos modos honestos**:
   - **En la app** (video incrustado, lector o tarjetas): salir de la app se detecta y cuenta. Hay *consecuencia suave*: la semilla pierde una etapa y se recupera con la siguiente sesión (nada de borrar semanas de racha).
   - **Fuera de la app** (libro, cuaderno, clase): el teléfono queda con la pantalla encendida y la sesión **cuenta el tiempo con la app visible**; al terminar, el estudiante confirma y responde 2 preguntas de lo leído. Sin pretender vigilarlo de forma que no podemos.
3. **Videos recomendados sin inventar enlaces**: la IA propone el tema y el término de búsqueda; abrimos la búsqueda de YouTube (o un video que el estudiante pega) dentro de la app con su reproductor incrustado para detectar reproducción y pausa. **Después del video, 3 preguntas de recuerdo**, porque ver video pasivo tiene poca utilidad frente a recuperar (Dunlosky 2013).
4. **Racha semanal, no diaria**: meta de minutos de enfoque por semana (por ejemplo 90), con un día de respiro protegido; la semilla crece con minutos reales de enfoque.
5. **Qué mide el piloto**: minutos de enfoque por semana, salidas por sesión, sesiones completadas, y si quienes usan Enfoque vuelven más (retención D7) [D].

## 5. Qué decidir y orden propuesto [D]

1. **Modelo de datos** (espacio, unidades, material con estado, varias evaluaciones) antes de seguir añadiendo funciones, porque lo demás depende de él.
2. **Importador de paquetes de clase** (camino A con ZR Note) como primera conexión real: da material estructurado desde el día uno.
3. **Sesión de enfoque en la app** (modo con video y recuerdo) y semana en vez de racha diaria.
4. Probar en un iPhone y un Android reales la visibilidad y el Wake Lock antes de prometer detección.
5. Modo clase nativo y cuenta única después de ver uso del importador.
6. Bloqueo real: solo si el piloto muestra que la gente lo pide, vía paquete Android.

## Fuentes
- [Forest: permisos y árbol que muere](https://x.com/forestapp_cc/status/1255331240045162498?lang=en) · [Forest (Wikipedia)](https://en.wikipedia.org/wiki/Forest_(application))
- [Apps para reducir el uso del móvil, JMIR 2023](https://www.jmir.org/2023/1/e42541)
- [Wake Lock: compatibilidad](https://caniuse.com/wake-lock) · [Guía de Chrome](https://developer.chrome.com/docs/capabilities/web-apis/wake-lock)
- [Pomodoro, flowtime y pausas autorreguladas en estudiantes (2025)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12292963/)
- [Diseño de rachas a largo plazo](https://www.mindtheproduct.com/designing-streaks-for-long-term-user-growth/) y [ansiedad por rachas](https://habitdoom.com/blog/streak-anxiety-habit-trackers) (blogs de producto: orientativo)
