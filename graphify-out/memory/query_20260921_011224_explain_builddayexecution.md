---
type: "explain"
date: "2026-09-21T01:12:24.746781+00:00"
question: "explain buildDayExecution"
contributor: "graphify"
outcome: "useful"
source_nodes: ["buildDayExecution"]
---

# Q: explain buildDayExecution

## Answer

Devolvio source_file+loc (src/features/vida/utils/vida-execution.utils.ts L713) y sus 8 llamadas internas (describeBlockExecution, buildNoDataSlices, getExecutedBudget, toSessionSpans, isDayClosed, sliceGap, findInsteadSession, matchSessionsToBlocks, describeMissingBlock): el mapa completo del cruce plan/real en una llamada.

## Outcome

- Signal: useful

## Source Nodes

- buildDayExecution