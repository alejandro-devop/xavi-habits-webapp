---
type: "query"
date: "2026-09-22T03:07:53.369428+00:00"
question: "FEAT-007: ventana de 42 dias, derivado de patrones y sugerencia con respuesta guardada en Vida"
contributor: "graphify"
outcome: "useful"
source_nodes: ["useVidaWeekPlans()", "useVidaWeekFollowUps()", "buildTemplateBridge()", "useVidaDeviceNotesStore", "vidaKeys"]
---

# Q: FEAT-007: ventana de 42 dias, derivado de patrones y sugerencia con respuesta guardada en Vida

## Answer

La referencia es la tajada 4 de FEAT-006: useVidaWeekPlans.ts:56 (una consulta por dia con vidaKeys.dayPlan.byDate), useActivityFollowUps.ts:37 (useActivityFollowUpsInDatesQuery -> vidaKeys.followUps.range, ya usado para 14 dias en VidaRevisionPage.tsx:966), vida-week-review.utils.ts:266/412 (buildWeekReview y buildTemplateBridge, el derivado puro y la sugerencia con dos salidas), VidaReviewBridge y VidaRevisionPage.tsx:945 (VidaReviewBridgeSection monta sus consultas solo con su seccion abierta), vida-device-notes.store.ts (dismissedBridges: campo extra en la unica clave xavi.vida.deviceNotes). No existe consulta de plan por rango en el SDL (activity-day-plan.schema.graphql:40 solo activityDayPlan(date)). shiftYmd esta duplicada privada en vida-window.utils.ts:39 y VidaRevisionPage.tsx:87.

## Outcome

- Signal: useful

## Source Nodes

- useVidaWeekPlans()
- useVidaWeekFollowUps()
- buildTemplateBridge()
- useVidaDeviceNotesStore
- vidaKeys