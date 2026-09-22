---
type: "query"
date: "2026-09-22T19:37:27.108994+00:00"
question: "Dónde se pinta la lista de la agenda de Hoy y qué precedente hay de un nodo colgado dentro del <ol>"
contributor: "graphify"
outcome: "useful"
---

# Q: Dónde se pinta la lista de la agenda de Hoy y qué precedente hay de un nodo colgado dentro del <ol>

## Answer

VidaHoyPage.tsx:642-795 (execution.entries.map en :647). El precedente es VidaBlockHint (components/VidaBlockHint/VidaBlockHint.tsx:44-79), montado en VidaHoyPage.tsx:733-740: <li class=row> + <span class=gutter> + <section class=card>, hermano del bloque y sin tocar VidaAgendaBlock. El segundo es VidaAgendaNoData.

## Outcome

- Signal: useful