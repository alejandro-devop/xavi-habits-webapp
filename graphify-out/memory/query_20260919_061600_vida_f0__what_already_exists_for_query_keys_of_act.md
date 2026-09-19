---
type: "query"
date: "2026-09-19T06:16:00.176392+00:00"
question: "Vida F0: what already exists for query keys of activities/categories/follow-ups?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["habitKeys", "activityKeys", "query-keys.ts"]
---

# Q: Vida F0: what already exists for query keys of activities/categories/follow-ups?

## Answer

graphify query habitKeys surfaced src/shared/api/query-keys.ts with an orphan activityKeys (L32-50), zero importers in src/. Plan replaces it with vidaKeys instead of adding a parallel factory.

## Outcome

- Signal: useful

## Source Nodes

- habitKeys
- activityKeys
- query-keys.ts