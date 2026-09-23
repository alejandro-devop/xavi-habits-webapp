---
type: "query"
date: "2026-09-23T21:02:35.147027+00:00"
question: "Donde vive la ventana del dia de Vida y quien la lee"
contributor: "graphify"
outcome: "useful"
---

# Q: Donde vive la ventana del dia de Vida y quien la lee

## Answer

useVidaDayHours (src/features/vida/hooks/useVidaDayHours.ts:46) es el unico lector de mySettings en Vida; lo llaman VidaHoyPage, VidaPlantillaPage, VidaRevisionPage, VidaSemanaPage, VidaTomorrowBlock, VidaModuleLayout y useVidaDayData. VidaAjustesPage ya usa useUpdateUserSettingsMutation y useSetVidaGoalDaysMutation. Nota: explain con el nombre exacto del simbolo funciona; query en lenguaje natural devolvio helpers de tests y fue ruido.

## Outcome

- Signal: useful