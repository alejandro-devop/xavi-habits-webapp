---
type: "query"
date: "2026-09-23T21:32:54.555867+00:00"
question: "Quien lista y filtra las fichas de «Qué» al empezar algo en Vida, y quien sabe de patrones"
contributor: "graphify"
outcome: "useful"
---

# Q: Quien lista y filtra las fichas de «Qué» al empezar algo en Vida, y quien sabe de patrones

## Answer

VidaActivityPicker.tsx:96-135 pinta una ficha por VidaSuggestion; filterActivitiesBySearch (activity-filters.ts:44) busca sobre el catalogo entero (CATALOG_LIMIT=100), no sobre las sugerencias. El precedente de 'la pagina filtra y el picker pinta' es suggestionsForGap (vida-agenda.utils.ts:504), aplicado en VidaHoyPage.tsx:1163. Para patrones la query descriptiva fallo: arranco en VidaActividadesPage. El token que funciona es el nombre de la funcion (buildActivityPatterns, usualDurationsByActivityId), no la descripcion en prosa.

## Outcome

- Signal: useful