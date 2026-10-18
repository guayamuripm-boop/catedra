# Arquitectura y ruta de crecimiento

Decisión de 2026-10-13. Se revisa cuando se cumpla alguno de los **disparadores** de la sección 4.

## 1. Decisión: no reescribir en React ahora

Se evaluó la rama `react-refactor` (3 commits del 2026-10-12: React 18 + TypeScript + Vite + Zustand). Medido, no opinado:

| Criterio | App actual (`master`) | `react-refactor` |
|---|---|---|
| Compila | Sí (estática, sin build) | **No**: `vite build` falla y `tsc` da 396 errores |
| Funciones | Todas: espacios/unidades/evaluaciones, experimento 48 h, hub de herramientas, voz, estrategias por área, asesor IA, paquetes de ZR Note, foco, simulacro… | ~Un tercio: cada pantalla es un archivo de 45–263 líneas; faltan experimento, hub, voz, paquetes, estrategias, espacios |
| Pruebas | 85 (SRS, hábitos, asesor, API de IA, voz…) | La suite de la rama no corre |
| Datos de usuarios | IndexedDB con `STATE_VERSION` y migración | Sin migración: los estudiantes del piloto **perderían su progreso** |
| Despliegue | Funciona hoy | Reescribe `index.html` y añade un build: subirla rompería producción |

Una reescritura total frena el producto meses para cambiar la tecnología, no lo que el estudiante vive. Mientras no haya validación del piloto, es el riesgo equivocado. La rama se conserva intacta por si más adelante conviene rescatar algo (los tipos de `src/types`, por ejemplo). **No se fusiona ni se sube a `master`.**

## 2. El verdadero activo: el núcleo de dominio

Los módulos puros `js/srs.js`, `habits.js`, `space.js`, `strategies.js`, `areas.js`, `coach.js`, `voice.js`, `experiment.js`, `pack.js` están escritos como módulos UMD: corren igual en el navegador y en Node, sin tocar el DOM, y tienen pruebas. Eso es lo que vale (la ciencia del aprendizaje y la medición). Cualquier interfaz futura (React, nativa, otra) puede reutilizarlos sin cambios. Por eso modernizar la interfaz después es barato **si el núcleo se mantiene puro y probado**. Regla: la lógica nueva va al núcleo con su prueba; `app.html` solo pinta y llama.

## 3. Dónde está el riesgo real de una startup (y qué hacer)

Orden por impacto, no por comodidad técnica:

1. **Validar con estudiantes reales** (3–5 en el piloto): ¿el plan del asesor les resulta creíble?, ¿lo siguen?, ¿mejora una métrica? Sin esto lo demás es teoría. (Ver `docs/product/asesor-ia-propuestas.md`.)
2. **Cuentas y sincronización (hecho 2026-10-17, ver bitácora; pendiente SMTP propio y recuperación de contraseña).** Hoy los datos viven solo en cada navegador: el iPhone y el PC se ven distintos. Ruta: mantener IndexedDB como fuente local (la app funciona sin red) y añadir sincronización a una base en la nube (Supabase: autenticación + Postgres con seguridad por fila). Se hace cuando el piloto confirme que la gente se queda; antes, el costo (privacidad, soporte, cuentas) no se justifica. Mientras tanto: Respaldar/Restaurar.
3. **IA robusta.** Desde 2026-10-16 la IA es abierta (sin código) con topes por IP, por código y global. Esos contadores viven en memoria del servidor (se reinician): pasarlos a almacenamiento persistente (Upstash/Supabase) cuando haya cientos de usuarios o se note abuso. Si todos los proveedores fallan, la app cae a preguntas locales y lo avisa. El autotest (`/api/ai?check=1&debug=1&c=CODIGO`) ya dice qué proveedor falla; los modelos se cambian por variables de entorno sin tocar código.
4. **Observabilidad.** Medición anónima con PostHog ya existe; añadir reporte de errores cuando haya usuarios fuera del piloto.

## 4. Modernización por etapas (sin parar el producto)

| Etapa | Qué | Disparador para pasar a la siguiente |
|---|---|---|
| **0 (hecha)** | plantilla de CI (`docs/ci.yml.example`, pendiente de activar) y `npm test`, `package.json` con script de pruebas, datos versionados (`STATE_VERSION`), bitácora | — |
| **1** | Sacar CSS y JS de `app.html` a archivos (hoy ~2.400 líneas mezcladas); más módulos puros; `// @ts-check` + JSDoc en el núcleo para tener tipos sin build | `app.html` se vuelve difícil de tocar sin romper algo, o entra una segunda persona al código |
| **2** | Bundler ligero (esbuild/Vite) y módulos ES; sin cambiar la interfaz | La carga inicial o el número de scripts sea un problema real |
| **3** | Framework de interfaz (React u otro), pantalla por pantalla, reutilizando el núcleo, con migración de datos probada | Equipo de 2+ personas de front, o errores de estado de la interfaz dominando el soporte |

Cada etapa se hace solo si su disparador ocurre. Hacer la 3 sin la 1 es repetir lo que pasó con `react-refactor`.

## 5. Reglas de oro para no endeudarse

- Nada se despliega con pruebas rotas (CI).
- Cambios en el formato de datos: subir `STATE_VERSION`, escribir la migración y una prueba con un estado viejo.
- La IA nunca inventa enlaces ni cifras; el cliente valida todo lo que devuelve el modelo.
- Un cambio importante = una entrada en `docs/BITACORA.md`.
