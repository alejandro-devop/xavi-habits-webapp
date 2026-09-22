---
type: "query"
date: "2026-09-22T06:22:02.761074+00:00"
question: "FEAT-009: donde vive la geometria del hueco en el modulo Vida y quien la duplica"
contributor: "graphify"
outcome: "useful"
source_nodes: ["buildTemplateDay()", "TemplateSegment", "VidaTemplateAddPanel()", "buildDayAgenda()", "VidaPlaceInGapSheet()"]
---

# Q: FEAT-009: donde vive la geometria del hueco en el modulo Vida y quien la duplica

## Answer

buildTemplateDay (vida-template.utils.ts:175-249) ya recorre el dia con cursor y ya calcula los tramos libres con sus dos horas dentro del id (pushGap :216-224). La geometria del hueco existe TRES veces en el modulo, no dos: buildDayAgenda (vida-agenda.utils.ts:152), buildTemplateDay y vida-execution.utils.ts:694 (isSliver del dia contado). Ademas hay dos umbrales gemelos de 15 min: MIN_GAP_MINUTES (vida-time.utils.ts:167) y MIN_PLACEMENT_MINUTES (vida-gap-form.utils.ts:34). El plan de FEAT-009 emite las filas dentro del mismo bucle de buildTemplateDay, sin funcion nueva.

## Outcome

- Signal: useful

## Source Nodes

- buildTemplateDay()
- TemplateSegment
- VidaTemplateAddPanel()
- buildDayAgenda()
- VidaPlaceInGapSheet()