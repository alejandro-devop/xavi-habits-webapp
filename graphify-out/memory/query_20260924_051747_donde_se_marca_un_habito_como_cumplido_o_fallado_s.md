---
type: "query"
date: "2026-09-24T05:17:47.055984+00:00"
question: "donde se marca un habito como cumplido o fallado seguimiento del dia"
contributor: "graphify"
outcome: "dead_end"
---

# Q: donde se marca un habito como cumplido o fallado seguimiento del dia

## Answer

Callejon sin salida: la query devuelve nodos de docs/features/*.md (secciones de dossieres de Vida), no codigo. Para hábitos la via rapida fue grep de useAddHabitFollowUpMutation: los unicos 4 escritores son HabitDayRow.tsx:110, HabitFollowUpForm.tsx:77-146, useHabitLifelineAction.ts:31 y HabitLifelineButton.tsx:13, todos via src/features/habits/hooks/useHabitFollowUps.ts. Nota general: el grafo esta dominado por los .md de docs/features y ahoga las consultas en español sobre codigo de habitos.

## Outcome

- Signal: dead_end