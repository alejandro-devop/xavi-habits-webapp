---
type: "path"
date: "2026-09-19T06:16:00.407832+00:00"
question: "Vida F0: is AppLayout connected to habitsRoutes?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AppLayout()", "createCommandActions()"]
---

# Q: Vida F0: is AppLayout connected to habitsRoutes?

## Answer

graphify path found no path; confirmed by reading: AppLayout hard-codes pills from habitsPaths, routes are registered separately in src/app/router/routes.tsx:79-81. Nav and routes are two lists today.

## Outcome

- Signal: useful

## Source Nodes

- AppLayout()
- createCommandActions()