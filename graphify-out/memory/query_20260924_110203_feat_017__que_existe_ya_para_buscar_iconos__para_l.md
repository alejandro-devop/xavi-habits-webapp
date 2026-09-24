---
type: "query"
date: "2026-09-24T11:02:03.470120+00:00"
question: "FEAT-017: que existe ya para buscar iconos, para la paleta de color y para el formulario de categoria de Vida"
contributor: "graphify"
outcome: "useful"
---

# Q: FEAT-017: que existe ya para buscar iconos, para la paleta de color y para el formulario de categoria de Vida

## Answer

icon-search.ts:40 filterAppIcons (AND de tokens sobre name+label+category+keywords); color-palette.ts:47-82 (6 core + 11 extended) con el validador OKLab en habit-colors.test.ts:17-44; el sorteo unico del repo es pickInitialHabitColor (habit-colors.ts:44-65) cableado en HabitCreateWizard.tsx:52-69; crear categoria de Vida vive SOLO en CreateVidaCategoryStep.tsx:38 (VidaCategoriasPage solo lista y edita). Lo que el grafo no sabe y hubo que medir: quedan 554 iconName libres en Font Awesome Free solid (~60-80 utiles, no 100), y el techo real de colores nuevos es ~5 y no 8 una vez se exige la banda de luminosidad de la palomita blanca.

## Outcome

- Signal: useful