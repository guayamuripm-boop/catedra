# Modelo de negocio y camino a escala

Fecha: 2026-10-04. **[V]** verificado en fuente, **[C]** conocimiento previo sin verificar aquí, **[D]** juicio propio. Es un conjunto de hipótesis para medir, no un pronóstico.

---

## 1. A quién y qué problema

Dos segmentos con la misma necesidad de fondo, un **copiloto de estudio**: organizar el tiempo, saber cómo estudiar, recuperar lo aprendido y tomar apuntes en clase.

| Segmento | Quién decide y paga | Momento de mayor intención |
|---|---|---|
| **Secundaria (desde 3.er año, ~14–17)** | Muchas veces el padre/madre; pruebas de admisión como motor | Meses previos a pruebas de admisión y lapsos de exámenes |
| **Universitarios** | Ellos mismos, con presupuesto ajustado | Parciales y finales |

Pregunta abierta: ¿cuál retiene y paga primero? El MVP debe medirlo, no suponerlo.

## 2. Qué se cobra

Principio [D]: **gratis lo que genera hábito y no cuesta; de pago lo que cuesta dinero o da valor a largo plazo.**

| Plan | Incluye | Por qué |
|---|---|---|
| **Gratis** | Diagnóstico y perfil, repaso espaciado ilimitado, 3 materias, notas y Cerebro, cuota semanal de IA (modelo barato) | Es el gancho y el bucle diario; no tiene costo marginal alto |
| **Pro (individual)** | Más IA (foto, evaluación oral/escrita fina, simulacros con IA), sincronización entre dispositivos, historial completo y reportes, recordatorios avanzados | Es donde está el costo y el valor recurrente |
| **Institucional (B2B2C)** | Licencia por alumno para colegios, academias y universidades, con reportes para el docente | Distribución y precio más estable |

## 3. Referencias de mercado

- La conversión de gratis a pago en edtech ronda **2,6 %** [V]; la mediana de software es 8 % [V].
- Precios globales medianos en suscripciones: ~$12,99/mes y ~$38,42/año, **con precios más bajos en LatAm** [V]. De prueba gratuita a pago: ~25,6 % en educación [V].
- Photomath (app masiva de estudio) generó unos **$27,4 M en 2024 con 6,5 M de usuarios activos** [V, estimación de terceros], es decir ~$4,2 por activo al año.
- Knowt ofrece gratis generación con IA y repaso espaciado [V]: **la generación de contenido no es un foso**.

## 4. La aritmética del unicornio

Un umbral habitual para valoración de $1.000 M es ~$100 M de ingresos anuales recurrentes [C; los múltiplos varían mucho]. Usuarios activos necesarios = ingresos ÷ (precio al año × conversión).

| Escenario | Supuestos [D] | Resultado para $100 M |
|---|---|---|
| **A · Solo consumidor LatAm** | $24/año, 2,6 % de conversión | ≈ **160 M** de usuarios activos |
| **B · Con preparación de pruebas y mercados de mayor precio** | $60/año, 4 % | ≈ **42 M** |
| **Referencia Photomath** | $4,2 por activo al año | ≈ **24 M** activos |
| **C · Institucional** | $6 por alumno al año | ≈ **16,7 M** de alumnos con licencia (p. ej. ~830 contratos de 20.000 alumnos) |

**Lectura honesta:** el consumidor puro de LatAm a precios locales **no llega** a esa cifra: el techo de estudiantes de la región es muy inferior a 160 M. Un camino creíble combina varias palancas [D]:
1. **Más mercados** (hispanohablantes de mayor poder adquisitivo, luego Brasil e idiomas nuevos).
2. **Preparación de pruebas de admisión**: tienen fecha, alta intención y precios mucho mayores.
3. **Institucional**: colegios, universidades, academias y alianzas con operadoras (planes con datos incluidos).
4. **Pago por familia** en secundaria (paga el adulto).
5. **Retención por años**: el estudiante vuelve cada lapso y cada curso.

No hay que decidir hoy cuál; hay que **diseñar para que ninguna quede cerrada** (multi-idioma, cuentas y roles, licencias por institución) y usar el piloto para ver cuál responde.

## 5. Economía por usuario (ilustrativa)

Con costo de IA por usuario activo de $0,02 (modelo barato) a $0,10 (Flash) [ver `arquitectura-y-escala.md`] y 2,6 % de pagadores, **cada pagador carga el costo de ~38 usuarios**: entre $0,77 y $3,85 al mes. Con un ingreso de $2–3 por pagador, **solo cierra con ruteo barato, caché y cuotas gratuitas**. A eso se suman infraestructura y la comisión de pasarelas de pago. Por eso el plan gratuito limita IA y el de pago la libera.

**Pagos [C, verificar según mercado]:** Stripe no opera en Venezuela; en Colombia son habituales PSE, Nequi y Wompi; en México, SPEI y OXXO; Mercado Pago tiene presencia amplia. Decisión estratégica a tomar [D]: **aprender dónde es barato y cercano (Venezuela) pero monetizar primero donde los rieles de pago y el poder adquisitivo lo permiten** (p. ej. Colombia o México).

## 6. Crecimiento

Público joven, sin presupuesto de publicidad: [D]
- **Tarjeta compartible del perfil** ("mi perfil de estudio"): es la imagen que se manda por WhatsApp o se sube a redes. Es la palanca más barata y propia del producto.
- **Ciclos de exámenes:** picos previsibles; recordatorios y campañas atadas a fechas.
- **Embajadores** en universidades y colegios, clubes de estudio, centros de estudiantes.
- **Referidos** con semanas de Pro.
- **Alianzas** con academias y operadoras.

## 7. Foso (lo que nos hace difíciles de copiar)

1. **Datos de eficacia:** registro de repasos + perfil + resultados reales. Con volumen permiten optimizar el algoritmo por cohorte y demostrar mejora.
2. **Costo de cambio:** el "segundo cerebro" del estudiante (sus apuntes, su historial) vive aquí.
3. **Marca de método**, no de herramienta.
4. **Localización** (acento, pruebas de admisión, contexto de la región).

Riesgo: Knowt o Quizlet pueden añadir un diagnóstico. La defensa es velocidad, datos propios y foco regional.

## 8. Hitos y qué se decide en cada uno [D]

| Etapa | Métricas objetivo | Decisión que habilita |
|---|---|---|
| **Piloto** (≈12 personas) | ≥8/12 activan; ≥6/12 vuelven solos; ≥70 % de preguntas IA aprobadas | Seguir / ajustar / pivotar |
| **Validación de retención** (≈1.000 usuarios) | D7 ≥ 25 %, D30 ≥ 12–15 %, preguntas por usuario/semana, costo de IA por usuario | Encender cobro |
| **Validación de pago** (≈10.000 activos) | Conversión ≥ 3 %, margen bruto positivo, CAC < $1–2 orgánico | Capital semilla / primer contrato institucional |
| **Escala** | Segundo mercado funcionando, ingresos institucionales | Ronda mayor |

## 9. Riesgos del negocio

| Riesgo | Mitigación |
|---|---|
| Disposición a pagar baja en LatAm | Monetizar primero donde se pueda; institucional y familia; precios regionales |
| Estacionalidad (picos y valles) | Planes por lapso, retención por hábito, contenido continuo |
| Dependencia de proveedores de IA | Interfaz común, ruteo, caché, más de un proveedor |
| Regulación de menores | Diseño de privacidad desde el inicio, consentimiento del tutor, revisión legal |
| Percepción de "IA para hacer trampa" | Posicionarse al revés: la app te hace *recordar*, no te da la respuesta |
| Competidores gratuitos | Diferenciarnos en diagnóstico, adaptación y datos de resultado |

## 10. Decisiones pendientes

1. **Segmento primario del piloto:** secundaria (3.er año), universitarios o ambos con embudos separados.
2. **Mercado de lanzamiento y de primera monetización.**
3. **Orden:** ¿consumidor primero o institucional primero? Recomiendo consumidor para aprender rápido y abrir una conversación institucional con datos en mano [D].
4. **Prueba de precios:** qué precio y límite de IA mostrar en el piloto (aunque no se cobre aún, medir intención).
