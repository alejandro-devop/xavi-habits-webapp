---
type: "query"
date: "2026-09-22T23:13:38.344478+00:00"
question: "¿De dónde pueden salir las notas de sesiones anteriores de una actividad sin pagar consulta nueva en Hoy?"
contributor: "graphify"
outcome: "useful"
---

# Q: ¿De dónde pueden salir las notas de sesiones anteriores de una actividad sin pagar consulta nueva en Hoy?

## Answer

useVidaHistoryWindow sí devuelve followUps en crudo con notes, pero está condicionada en Hoy y no existe en Plantilla/Actividades (la barra de sesión vive en VidaModuleLayout). La vía buena es activityFollowUps(activityId:, limit:), que ya está en el SDL vendorizado (activity.schema.graphql:165) y resuelto por listFollowUps (orden date/start_time DESC, solo cerradas): documento nuevo en la web, sin tocar backend.

## Outcome

- Signal: useful