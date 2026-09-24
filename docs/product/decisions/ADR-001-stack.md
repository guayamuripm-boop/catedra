# ADR-001: Stack tecnologico

**Estado:** Aceptada
**Fecha:** 2026-09-20

## Contexto

Necesitamos un stack que permita:
- Costo de infraestructura $0 durante validacion
- PWA offline-first para LatAm (conexion inestable, moviles de gama baja)
- Desarrollo rapido con equipo pequeno (2-4 personas)
- TypeScript estricto para mantenibilidad

## Decision

| Capa | Eleccion | Alternativa descartada | Razon |
|---|---|---|---|
| Frontend | React + TypeScript + Vite | Next.js SSR | Export estatico es suficiente; Vite mas rapido en dev |
| UI | Tailwind + shadcn/ui | Material UI | Bundle menor, mas customizable |
| PWA | Workbox + Dexie | localForage | Workbox es mas maduro; Dexie da queries sobre IndexedDB |
| Backend | Supabase | Firebase | Postgres > Firestore para queries complejas; RLS nativo |
| Hosting | Cloudflare Pages | Vercel Hobby | Vercel Hobby prohibe uso comercial |
| Repaso | ts-fsrs | SM-2 propio | FSRS es estado del arte abierto |
| PDF | pdf.js | unpdf | Mas maduro, mejor documentado |
| LLM | Cascada multi-proveedor | Un solo proveedor | Planes gratuitos son volatiles |
| Validacion | Zod | io-ts | Mas ergonomico, mejor DX |
| Tests | Vitest + Playwright | Jest | Mas rapido, nativo ESM |

## Consecuencias

- El equipo debe conocer React y TypeScript
- Dependencia de Supabase para auth, BD y storage (mitigable con SQL estandar)
- Cloudflare Pages requiere verificar terminos comerciales vigentes
- Supabase free puede pausar proyectos inactivos (mitigar con ping)
