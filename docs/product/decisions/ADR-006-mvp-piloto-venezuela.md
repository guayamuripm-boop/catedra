# ADR-006: MVP para piloto universitario en Venezuela (stack gratuito)

**Estado:** Implementado en el cliente y la API (2026-10-05). Falta que el fundador cree cuentas y variables (ver `guia-lanzamiento-gratis.md`).

## Decisiones del fundador
1. **Venezuela primero**, para aprender barato y cerca; monetizar después donde haya pagos y poder adquisitivo.
2. **Universitarios (18+) primero**; instituciones después de ver retención; 3.er año de secundaria cuando exista consentimiento del tutor.
3. **Sin cobro en el piloto.**

## Decisiones técnicas
- **Repaso:** FSRS v6 (`ts-fsrs`, MIT) vendorizado en `js/vendor/` en vez de CDN, para funcionar sin conexión. Sin pasos de aprendizaje de minutos (la app agenda por días). Se conservan los intervalos fijos como respaldo si la librería no carga.
- **Métrica central:** "Preparación" = probabilidad media de recordar todas las preguntas de una materia en la fecha del examen; las no repasadas cuentan 0; supone que no se repasa más (así se rotula).
- **Medición:** eventos anónimos → `/api/e` → PostHog (lote). Sin SDK (peso y antibloqueadores), cola local sin conexión, solo nombres de evento y propiedades simples; sin texto del estudiante; sin geolocalización. Requiere consentimiento y se puede desactivar.
- **Consentimiento:** casilla 18+ y política en el primer paso; aviso para quienes ya estaban dentro. Aviso de IA explícito: en planes gratuitos los proveedores pueden usar el contenido.
- **Diagnóstico:** 5 preguntas de triaje + 4 dominios nucleares (concentración, tiempo, retención, autoevaluación) con seguimiento solo en la queja principal y máx. 2 extras; los otros 5 dominios llegan como una pregunta tras cada sesión (primeras 5), luego cada 3. La telemetría de uso no crea ni mueve un área hasta tener ≥3 sesiones (≥4 para motivación).
- **Navegación:** 4 pestañas (Hoy, Agenda, Biblioteca, Progreso); Cerebro y Materiales se unen con un control Notas | Materias.
- **Recordatorios:** archivo `.ics` con alarmas en el calendario del teléfono como sustituto gratuito de push (sin servidor). Identificadores estables por fecha para no duplicar al re-exportar.
- **Config pública:** `/api/config` devuelve solo estado de analítica y URL de opinión; nunca secretos.

## Consecuencias y límites
- Sin cuentas ni sincronización: un dispositivo = un perfil; el respaldo manual es el seguro.
- La IA sigue apagada hasta poner claves; mientras tanto las preguntas son plantillas rotuladas "Sin IA".
- El anillo de Preparación depende de que el estudiante repase; con pocos repasos mostrará valores bajos (es lo correcto, pero hay que explicarlo en entrevistas).
- Los pesos del perfil y las metas del piloto siguen sin calibrar con datos reales.
- Probado en navegador y con 23 pruebas automáticas; **no probado en teléfonos reales** (instalación, voz, `share_target`, foto con claves reales).

## Se descartó por ahora
Push con servidor (se sustituye por `.ics`), Supabase y cuentas (después del piloto), cobro, panel institucional.
