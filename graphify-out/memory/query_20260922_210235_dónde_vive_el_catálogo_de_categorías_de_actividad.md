---
type: "query"
date: "2026-09-22T21:02:35.404049+00:00"
question: "dónde vive el catálogo de categorías de actividad y cómo se invalida"
contributor: "graphify"
outcome: "dead_end"
---

# Q: dónde vive el catálogo de categorías de actividad y cómo se invalida

## Answer

El grafo devolvió sobre todo nodos de archivos .test.tsx (VidaActividadesPage.test.tsx, vida-catalog.utils.test.ts) y no los hooks/api reales. Para la capa de datos de Vida (hooks/useActivityCategories.ts, api/activity-categories.api.ts, utils/invalidate-vida-queries.ts) fue más rápido listar el directorio src/features/vida/{api,hooks,utils} y leer los archivos. Consejo: para preguntas de localización en este repo, ls del directorio de la feature gana al query.

## Outcome

- Signal: dead_end