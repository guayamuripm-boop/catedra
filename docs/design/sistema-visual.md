# Sistema visual - Catedra

## Identidad

**Nombre:** Catedra (con acento: Cátedra)
**Tagline:** "Practica con evidencia. Estudia con proposito."
**Tono:** Cercano, directo, sin condescendencia. Habla como un tutor joven, no como un profesor formal ni como un influencer.

## Paleta

| Token | Valor | Uso |
|---|---|---|
| --ink | #10141F | Fondo principal |
| --ink-deep | #0A0D14 | Fondo profundo |
| --brass | #C6A15B | Acento primario, CTAs, progreso |
| --parchment | #EDE8DD | Texto principal |
| --muted | #9AA2B4 | Texto secundario |
| --sage | #7FA087 | Exito, dominado |
| --oxblood | #B25B4A | Error, no sabido |
| --glass-bg | rgba(255,255,255,0.055) | Tarjetas glass |
| --glass-border | rgba(237,232,221,0.16) | Bordes glass |

## Tipografia

- **Titulos:** Fraunces (serif, variable weight)
- **Cuerpo:** IBM Plex Sans (400, 500, 600)
- **Tamanos:** 22px h1, 17px h2, 14px cuerpo, 12.5px small, 11px caption

## Componentes

### Botones
- Primary: brass background, dark text
- Ghost: glass background, border, parchment text
- Danger: oxblood-soft background
- Sizes: default (14px, 14px padding), sm (12.5px, 10px padding)

### Chips
- Default: glass background, border, 999px radius
- Selected: brass border, brass-soft background, brass text

### Cards (Glass)
- Background with backdrop-filter blur
- 16px border-radius, 16px padding
- Subtle shadow

### Inputs
- Glass background, glass border
- Focus: brass border
- 10px border-radius

## Principios de diseno

1. **Movil primero.** Todo se disena para 375px y se adapta hacia arriba.
2. **Una accion por pantalla.** La pantalla "Hoy" tiene un CTA claro.
3. **Carga cognitiva minima.** Pocas opciones, pocas metricas, pocas distracciones.
4. **Feedback inmediato.** Toast para cada accion, animaciones sutiles.
5. **Modo oscuro nativo.** El fondo oscuro no es una opcion, es la identidad.
6. **Accesibilidad.** Contraste suficiente, tamanos de fuente legibles, navegacion por teclado.
