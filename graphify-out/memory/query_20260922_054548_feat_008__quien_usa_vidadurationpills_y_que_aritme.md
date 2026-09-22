---
type: "query"
date: "2026-09-22T05:45:48.806612+00:00"
question: "FEAT-008: quien usa VidaDurationPills y que aritmetica de duracion existe ya"
contributor: "graphify"
outcome: "useful"
source_nodes: ["VidaDurationPills()", "formatDurationMinutes()", "vida-time.utils.ts"]
---

# Q: FEAT-008: quien usa VidaDurationPills y que aritmetica de duracion existe ya

## Answer

VidaDurationPills tiene 5 consumidores (VidaActivitySheet:597, VidaTemplateAddPanel:311, VidaPlaceInGapSheet:214, VidaLogSessionSheet:282, VidaFinishSessionModal:153) y todos pasan solo value:number|null + onChange, asi que una prop aditiva freeInput es segura. El grafo dio el vecindario (17 nodos) pero NO los 5 consumidores: las aristas de VidaDurationPills solo cubren test/index/formatDurationMinutes. Para contar consumidores hizo falta grep. No existe ninguna funcion que reparta minutos en (h,m); lo mas cercano es formatElapsedCompact (vida-session.utils.ts:114), que trabaja en ms y devuelve texto.

## Outcome

- Signal: useful

## Source Nodes

- VidaDurationPills()
- formatDurationMinutes()
- vida-time.utils.ts