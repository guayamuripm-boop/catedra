# ADR-004: Ruta de prototipo a app funcional

**Estado:** Propuesta
**Fecha:** 2026-09-21
**Contexto:** El prototipo HTML es funcional pero usa localStorage, genera preguntas con templates en vez de IA, y no tiene auth ni backend. Este documento traza la ruta critica para convertirlo en una app real.

---

## 1. Lo que hay que verificar PRIMERO (antes de escribir codigo)

### 1.1 Validacion con usuarios reales (Semana 1-2)
- [ ] Reclutar 8-12 estudiantes con examen real en las proximas 4 semanas
- [ ] Darles el prototipo HTML como PWA (deploy a Cloudflare Pages tal cual)
- [ ] Medir: completan onboarding? Generan preguntas? Vuelven al dia siguiente?
- [ ] Entrevistar despues de 3 dias: que les parecio? Que sobra? Que falta?
- [ ] **Criterio go/no-go:** 6/12 vuelven sin que les insistas

### 1.2 Validacion tecnica del stack
- [ ] Confirmar que Supabase free tier aguanta 20-50 usuarios con RLS
- [ ] Probar generacion de preguntas con LLM real (OpenRouter/Groq) — calidad y costo
- [ ] Probar Web Speech API en Chrome Android para transcripcion oral en espanol
- [ ] Medir tiempo de carga en conexion 3G tipica Venezuela/Colombia

---

## 2. Orden de implementacion (de prototipo a MVP)

### Fase A: Fundamentos (Semana 3-4)
**Objetivo:** El prototipo funciona con datos persistentes y auth real.

```
Prioridad 1 — Sin esto no hay app:
1. Proyecto Next.js/Vite + TypeScript
2. Supabase: auth (email + Google), tablas base con RLS
3. PWA manifest + service worker basico
4. Deploy a Cloudflare Pages / Vercel

Prioridad 2 — Sin esto no funciona offline:
5. IndexedDB con Dexie para items, repasos, plan
6. Sync bidireccional Supabase <-> Dexie
7. Service worker para app shell offline
```

### Fase B: Generacion real (Semana 5-6)
**Objetivo:** Las preguntas las genera un LLM, no templates.

```
1. Edge function en Supabase para proxy LLM
2. Prompt engineering: generar 5 tipos de pregunta con cita obligatoria
3. Cascada de proveedores: Groq (gratis) -> OpenRouter -> fallback
4. Cuotas: contador de generaciones por semana
5. Cache: no regenerar si el chunk de texto ya tiene preguntas
```

### Fase C: Motor de repaso real (Semana 7-8)
**Objetivo:** FSRS reemplaza los intervalos hardcodeados.

```
1. Integrar ts-fsrs
2. Cola diaria basada en FSRS
3. Sesion con intercalado entre materias
4. Calibracion metacognitiva (confianza vs. acierto)
5. Dificultad dinamica intra-sesion
```

### Fase D: Evaluacion avanzada (Semana 9-10)
**Objetivo:** Los metodos nuevos funcionan con IA real.

```
1. Respuesta escrita: LLM evalua contra material fuente
2. Sintesis oral: Web Speech API -> transcripcion -> LLM evalua cobertura
3. Opcion multiple: LLM genera distractores con errores tipados
4. Examen simulado: sesion cronometrada sin ayudas
5. Scaffolding: 5 niveles basados en consolidationStreak
```

### Fase E: Habitos y retencion (Semana 11-12)
**Objetivo:** La app retiene porque educa y se adapta.

```
1. Deteccion de habitos (reglas basicas)
2. Micro-lecciones contextuales
3. Re-planificacion al saltarse dias
4. Deteccion de fatiga
5. Feedback post-sesion
6. Racha suave
```

---

## 3. Stack recomendado

| Capa | Tecnologia | Razon |
|---|---|---|
| Frontend | Next.js 15 + TypeScript | SSG para velocidad, PWA nativo |
| Estilo | Tailwind CSS | Consistencia, dark mode nativo |
| Estado local | Dexie (IndexedDB) | Offline-first, sync con Supabase |
| Auth | Supabase Auth | Email + Google, gratis, RLS |
| DB | Supabase PostgreSQL | RLS, free tier generoso |
| LLM | OpenRouter / Groq | Multi-proveedor, costo minimo |
| Speech | Web Speech API + Whisper fallback | Gratis en Chrome, Whisper para calidad |
| SRS | ts-fsrs | FSRS v5, bien mantenido |
| Deploy | Cloudflare Pages | Gratis, CDN global, edge |
| Analytics | Plausible / eventos propios | Privacy-first, GDPR |

**Costo total MVP:** $0/mes (todo en free tiers)

---

## 4. Que NO hacer todavia

- Apps nativas (Capacitor/React Native) — PWA es suficiente para validar
- Panel docente — no hay mercado validado
- Multi-idioma — validar en espanol primero
- Sync con Calendar/Classroom — complejidad innecesaria
- FSRS personalizado por usuario — el default es bueno para empezar
- Marketplace de mazos — no hay contenido generado por usuarios
- LLM en dispositivo — WebLLM aun no es confiable

---

## 5. Metricas de exito por fase

| Fase | Metrica | Objetivo |
|---|---|---|
| A (Fundamentos) | Onboarding completo en <3 min | >80% |
| A | Carga inicial <3s en 4G | Si |
| B (Generacion) | Items aceptados sin edicion | >70% |
| B | Costo IA por generacion | <$0.01 |
| C (Motor) | Sesion completada sin abandonar | >75% |
| D (Evaluacion) | Transcripcion oral usable en espanol | >80% precision |
| E (Retencion) | D7 retencion | >30% |
| E | Usuarios que vuelven 3+ dias/semana | >20% |

---

## 6. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| LLM genera preguntas malas | Media | Alto | Revision humana obligatoria, prompt iterado, cache |
| Web Speech API mala en espanol LatAm | Media | Medio | Whisper como fallback, modo texto siempre disponible |
| Supabase free tier no alcanza | Baja | Alto | Self-host o migrar a otro Postgres |
| Usuarios no entienden la app | Media | Alto | Validacion temprana, onboarding ultra-simple |
| Nadie paga Pro | Alta | Medio | Cobro manual primero, entender por que no pagan |

---

## 7. Checklist pre-codigo

- [ ] Prototipo desplegado como pagina estatica para testing
- [ ] 8+ estudiantes reclutados con examen real
- [ ] Cuenta Supabase creada con proyecto
- [ ] API key de OpenRouter/Groq obtenida
- [ ] Repositorio con CI basico (lint + types)
- [ ] Dominio/subdominio elegido
- [ ] Politica de privacidad borrador (menores)
