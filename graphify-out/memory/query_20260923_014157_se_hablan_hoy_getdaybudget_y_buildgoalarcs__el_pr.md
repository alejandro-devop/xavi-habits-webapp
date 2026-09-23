---
type: "query"
date: "2026-09-23T01:41:57.549602+00:00"
question: "¿Se hablan hoy getDayBudget y buildGoalArcs (el presupuesto del día y los arcos de meta de Vida)?"
contributor: "graphify"
outcome: "useful"
---

# Q: ¿Se hablan hoy getDayBudget y buildGoalArcs (el presupuesto del día y los arcos de meta de Vida)?

## Answer

No. graphify path devuelve 4 saltos vía parseTimeToMinutes(), es decir ninguna relación directa: conviven solo en VidaHoyPage.tsx, que llama a las dos al mismo nivel con dayHours.endTime. FEAT-019 cruza el dato pasando dayEnd ('HH:mm') a buildGoalArcs, no el objeto DayBudget (remainingMinutes está topado en max(0,...) y depende de agenda). Nota: el precedente de 'días de la semana' no está en este repo sino en xavi-platform-node (vida_items.days TEXT[], migración 058; routines.days_of_week 008; enum VidaDayOfWeek ya en vida.schema.ts).

## Outcome

- Signal: useful