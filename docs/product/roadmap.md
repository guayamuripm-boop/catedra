# Roadmap - Catedra

## Vision general

```
Fase 0          Fase 1              Fase 2              Fase 3
Descubrimiento  MVP nucleo          Retencion           Escala
2 semanas       6 semanas           6 semanas           3 meses
                (3 ciclos)          (3 ciclos)

Entrevistas     Auth + Material     Calibracion         Tutor RAG
Concierge       Generacion IA      PDF upload          OCR
Validacion      FSRS offline       Multi-LLM           Institucional
                Plan Hoy            Re-planificacion    Push
                Habitos basicos     Cobro manual        Exportacion
                Feedback            Referidos           Metricas
```

---

## Fase 0: Descubrimiento (semanas 0-2)

### Objetivo
Confirmar que el problema existe y que la solucion resuena antes de escribir codigo.

### Entregables
- [ ] Guion de entrevista preparado
- [ ] 12-15 entrevistas completadas
- [ ] Patrones documentados en `docs/research/entrevistas.md`
- [ ] Cohorte piloto identificada (8-12 estudiantes con examen real)
- [ ] Prueba concierge: plan + preguntas entregadas manualmente
- [ ] Medicion de uso real (quien completo, quien volvio)
- [ ] Decision: continuar / pivotar / abandonar
- [ ] Repositorio y CI configurados
- [ ] Entorno Supabase creado
- [ ] Terminos de servicio de cada proveedor verificados

### Criterio de avance
- 8/12 completan primera sesion
- Proporcion relevante regresa sin insistencia
- Se identifica un problema repetido y especifico

---

## Fase 1: MVP nucleo (semanas 3-8)

### Ciclo 1.1: Esqueleto (semanas 3-4)
- [ ] Supabase: auth, tablas base con RLS
- [ ] Registro/login email + Google
- [ ] Onboarding: nombre, materia, fecha de examen
- [ ] Pegar texto como material
- [ ] Generacion de preguntas con LLM (1 proveedor)
- [ ] Revisar, editar, aprobar, descartar preguntas
- [ ] PWA manifest + iconos
- [ ] Deploy a Cloudflare Pages

### Ciclo 1.2: Motor de estudio (semanas 5-6)
- [ ] ts-fsrs integrado
- [ ] Sesion de repaso: pregunta -> confianza -> respuesta -> calificacion
- [ ] Cola diaria: items que vencen hoy
- [ ] Plan "Hoy": prioridad por urgencia y debilidad
- [ ] IndexedDB con Dexie: items, repasos, plan
- [ ] Service Worker: app shell offline
- [ ] Sincronizacion basica al reconectar

### Ciclo 1.3: Habitos, evaluacion y cierre (semanas 7-8)
- [ ] Deteccion de habitos: releer sin practicar, cramming, sesion larga
- [ ] 5 micro-lecciones contextuales
- [ ] Progreso por materia (retencion estimada)
- [ ] Racha suave
- [ ] Feedback post-sesion
- [ ] Pretesting: diagnostico de 3-5 preguntas antes de tema nuevo
- [ ] Opcion multiple con distractores tipados por error
- [ ] Scaffolding progresivo (5 niveles basados en consolidationStreak)
- [ ] Dificultad dinamica intra-sesion (ajuste por ultimas 3 respuestas)
- [ ] Deteccion de fatiga por patrones de respuesta
- [ ] Pantalla de precios (fake door)
- [ ] Cuotas de generacion con contador
- [ ] Eventos de producto basicos
- [ ] 20 usuarios piloto activos
- [ ] Performance: carga < 3s, bundle < 250KB

### Criterio de salida Fase 1
- Flujo completo funcionando de punta a punta
- 20 usuarios piloto
- 0 costo de infraestructura
- >= 70% de items aceptados sin edicion
- Funciona offline

---

## Fase 2: Retencion y personalizacion (semanas 9-14)

### Ciclo 2.1: Comprension profunda + evaluacion avanzada
- [ ] Upload PDF con pdf.js
- [ ] Chunking mejorado por seccion/tema
- [ ] Tipos de pregunta: aplicacion, comparacion, correccion de error
- [ ] Filtro de calidad de items (duplicados, no respondibles)
- [ ] Respuesta escrita con evaluacion IA (comparar vs. material fuente)
- [ ] Sintesis oral con auditoria IA (tecnica Feynman automatizada)
- [ ] "Ensena a la IA" (modo interactivo oral)

### Ciclo 2.2: Metacognicion + simulacros
- [ ] Prediccion de confianza con feedback visual
- [ ] Grafico de calibracion (confianza vs. acierto)
- [ ] Re-planificacion automatica al saltarse dias (sesion de reinicio adaptada)
- [ ] Examen simulado cronometrado (sin pistas, mezcla todos los temas)
- [ ] Perfil adaptativo por materia (tipo de error dominante, duracion optima)
- [ ] 5 micro-lecciones adicionales
- [ ] Resumen semanal

### Ciclo 2.3: Monetizacion real
- [ ] Cascada multi-proveedor LLM con fallback
- [ ] Cobro manual Pro (transferencia, pago movil, etc.)
- [ ] Referidos: invitar = semanas Pro
- [ ] Eliminar cuenta completa
- [ ] Exportacion de datos del usuario

### Criterio de salida Fase 2
- D7 >= 30%
- Primeros usuarios Pro pagando
- Mejora medible en habitos de estudio

---

## Fase 3: Integraciones y escala (meses 4-6)

- [ ] Tutor socratico con RAG (pgvector)
- [ ] OCR de fotos (Tesseract.js)
- [ ] Notificaciones web push
- [ ] Panel de metricas interno
- [ ] Exportar/importar tarjetas CSV
- [ ] Importar .apkg (Anki)
- [ ] FSRS personalizado por usuario (N1)
- [ ] Primer piloto institucional
- [ ] Evaluar Capacitor para tiendas

---

## Fase 4: Inteligencia y expansion (mes 7+)

- [ ] Experimentacion automatizada (bandits) para nudges
- [ ] Modelos de dominio por tema
- [ ] LLM en dispositivo (WebLLM/transformers.js)
- [ ] Expansion: primaria, posgrado, ingles
- [ ] Marketplace de mazos moderados
