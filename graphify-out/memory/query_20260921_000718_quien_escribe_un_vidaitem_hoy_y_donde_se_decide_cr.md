---
type: "query"
date: "2026-09-21T00:07:18.687926+00:00"
question: "Quien escribe un VidaItem hoy y donde se decide crear vs actualizar (FEAT-005)"
contributor: "graphify"
outcome: "useful"
source_nodes: ["planVidaItemSave()", "useSaveVidaItemForActivity()", "VidaActivitySheet()"]
---

# Q: Quien escribe un VidaItem hoy y donde se decide crear vs actualizar (FEAT-005)

## Answer

planVidaItemSave() en src/features/vida/hooks/useSaveVidaItemForActivity.ts:87 es la unica decision create/update, y su unico llamador es VidaActivitySheet() (components/VidaActivitySheet/VidaActivitySheet.tsx:86). No necesita logica nueva para editar por id ni para crear una segunda hora: solo que su parametro 'item' signifique 'el item sobre el que se escribe' en vez de 'el item de esta actividad'. useDeleteVidaItemMutation (hooks/useVidaItems.ts:95) existe sin llamadores. Nota: VidaItem.activity es ActivityFollowUpActivityRef y NO trae categoryId, que es lo que la hoja lee en :106.

## Outcome

- Signal: useful

## Source Nodes

- planVidaItemSave()
- useSaveVidaItemForActivity()
- VidaActivitySheet()