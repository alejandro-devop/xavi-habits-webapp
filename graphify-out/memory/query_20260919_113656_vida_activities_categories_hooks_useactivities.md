---
type: "query"
date: "2026-09-19T11:36:56.879235+00:00"
question: "vida activities categories hooks useActivities"
contributor: "graphify"
outcome: "dead_end"
---

# Q: vida activities categories hooks useActivities

## Answer

La consulta arrancó el BFS desde los nodos god 'Hooks' y 'categories' y devolvió docs/project-conventions.md y HabitFormModal.test.tsx: ni un solo nodo de src/features/vida. El grafo no indexa el vocabulario de Vida con esos tokens. Lo que funcionó fue leer directo src/features/vida/{hooks,utils,types,api,graphql} y src/features/habits/{pages,components,data}.

## Outcome

- Signal: dead_end