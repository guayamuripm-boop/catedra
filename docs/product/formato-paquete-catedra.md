# Formato abierto "catedra-pack v1"

Para enviar el material de una clase a Catedra desde ZR Note (o cualquier otra herramienta). Catedra lo acepta de tres formas: pegándolo en una materia (botón **Pegar**), en **Importar**, o con **Compartir → Catedra** desde el teléfono (Web Share Target).

## Forma

```json
{
  "catedra_pack": 1,
  "materia": "Cálculo I",
  "unidad": "Clase del 8 oct",
  "titulo": "Regla de la cadena",
  "fuente": "ZR Note",
  "fecha": "2026-10-08",
  "study_aids": { "...": "el bloque StudyAids de ZR Note tal cual" }
}
```

También se acepta **el bloque `study_aids` solo**, sin sobre (entonces la unidad se llama «Clase del <fecha de hoy>»). Puede venir con texto alrededor: se toma el primer `{` y el último `}`.

## Qué hace Catedra con cada campo (`js/pack.js`)

| Campo de ZR Note | En Catedra |
|---|---|
| `study_questions` | Pregunta de recuerdo |
| `worked_examples` | Pregunta de aplicación (problema → cómo se resolvió) |
| `common_mistakes` | Pregunta de error («¿Qué está mal aquí?») |
| `key_concepts` | «¿Qué es X?» con la definición; `why` va como explicación |
| `key_formulas` | «¿Qué expresa X?» con su significado y cuándo usarla |
| `flashcards` | Pregunta de recuerdo (anverso → reverso) |
| `outline`, `exam_notes`, `resources`, `open_questions` | Texto del material de la unidad; `exam_notes` se muestra como «Lo que entra en el examen» |

Reglas: se descartan preguntas vacías o muy cortas, se quitan duplicados, máximo 40 por paquete y **nada entra al repaso sin que el estudiante lo apruebe** (hay «Aprobar las N»). Si `materia` coincide con una materia existente (sin distinguir mayúsculas) va ahí; si no existe, se crea.

## Lo que falta del lado de ZR Note

Un botón «Enviar a Catedra» en la minuta en Modo Clase que haga `navigator.share({text: JSON.stringify(pack)})` en el teléfono, o que copie el JSON en el escritorio. No se tocó el repositorio de ZR Note.
