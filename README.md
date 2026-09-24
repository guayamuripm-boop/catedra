# Cátedra

**Sube tu material. Recibe tu sesión de hoy.**

App de estudio basada en ciencia del aprendizaje para estudiantes de bachillerato y universidad en Latinoamérica.

## Problema

La mayoría de los estudiantes no sabe estudiar: releen, subrayan, dejan todo para la víspera y sufren la "ilusión de saber". Las herramientas existentes resuelven partes aisladas (Anki: memorización; Notion: organización; ChatGPT: explicación) y exigen que el estudiante arme su propio sistema.

## Propuesta

Una sola app que convierte el material del estudiante en práctica de recuperación activa, repaso espaciado y un plan diario accionable — con evidencia de lo que funciona, no adivinanzas.

## Estado actual

- **Fase**: Pre-MVP / Validación
- **Prototipo**: `prototype/index.html`
- **Spec completa**: `docs/product/spec.md`

## Estructura

```
Catedra/
├── docs/
│   ├── product/        # Spec, roadmap, metodología
│   ├── research/       # Investigación pedagógica, competencia, mercado
│   ├── design/         # Decisiones de diseño, sistema visual
│   └── legal/          # Privacidad, menores, términos
├── prototype/          # Prototipo HTML interactivo
├── src/                # Código fuente (cuando inicie desarrollo)
└── assets/             # Recursos visuales
```

## Stack planeado

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind + shadcn/ui |
| PWA/Offline | Service Worker + Dexie (IndexedDB) |
| Backend | Supabase (Auth, Postgres, RLS, Edge Functions) |
| Hosting | Cloudflare Pages |
| Repaso | ts-fsrs |
| PDF | pdf.js |
| LLM | Cascada multi-proveedor con caché |
| Tests | Vitest + Playwright |
