---
type: "query"
date: "2026-09-20T22:04:12.413721+00:00"
question: "que existe en el repo para la sesion viva de Vida (follow-ups, cronometro, cruce plan vs real)"
contributor: "graphify"
outcome: "dead_end"
---

# Q: que existe en el repo para la sesion viva de Vida (follow-ups, cronometro, cruce plan vs real)

## Answer

El grafo no lo sabe: devolvio docs/activities-domain.md y activity.types.ts. Lo util: src/features/vida/hooks/useActivityFollowUps.ts (capa F0 sin estrenar), utils/vida-agenda.utils.ts, y el modulo borrado en 79bece0 (useElapsedTimer, modales de sesion, activity-day-metrics). Se llega con git ls-tree -r 79bece0 y lectura por rangos, no con query.

## Outcome

- Signal: dead_end