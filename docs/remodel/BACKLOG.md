# Backlog de fases — rediseño Aura

Fases pedidas y todavía sin render aprobado. El circuito no cambia: **render → feedback → aprobación → spec en `docs/remodel/NN-nombre.spec.md` → subagente `xavi-builder` → verificación → commit**.

| Estado | Fase | Spec | Render |
|---|---|---|---|
| ✅ Publicada | **Fase 7 — Mi Persona: la identidad se gana** | `06-mi-persona.spec.md` | `assets/06-mi-persona.html` |
| ✅ Publicada | **Fase 8 — Un catálogo de iconos que alcance** | `07-catalogo-iconos.spec.md` | — |
| ✅ Publicada | **Fase 9 — El color del hábito viene puesto** | `08-color-inicial-habito.spec.md` | — |
| ✅ Publicada | **Fase 10 — El panel del hábito** | `09-panel-habito.spec.md` | `assets/09-panel-habito.html` |
| ✅ Publicada | **Fase 11 — Una app de hábitos, y nada más** | `10-solo-habitos.spec.md` | `assets/10-solo-habitos.html` |

Se construyen **de una en una**: aunque tocan archivos distintos, cada constructor mide lint y tests contra una línea base, y dos a la vez se contaminan las medidas.

## Decidido — fase 10

Las tres preguntas que el render dejaba abiertas, cerradas en la spec:

1. **Convive.** Tercera pestaña, `Panel`, y es la que abre por defecto. Sustituir la pantalla de detalle obligaba a rehacer editar, archivar, restaurar y ocultar, que no tienen nada que ver con métricas.
2. **90 días, recortados a la vida del hábito.** El reparo —un hábito nuevo lo ve vacío— no se arregla con 30 días, se arregla recortando el eje a `max(startDate, hoy − rango)`. «Todo» no entra: eso ya es la pestaña `Historial completo`.
3. **Se queda, cambiada de lado.** No cuenta las recaídas: cuenta **las veces que volviste**. Mismo dato, leído por el lado que predice que sigas. El fallo se sigue viendo en la línea semanal, en el peor día y en los huecos entre rachas.

## Deuda anotada, sin hacer

- **Nada del área autenticada se ha probado en vivo.** Las fases 7, 8, 9 y 10 se verificaron en arneses aislados: ni yo ni los constructores introdujimos credenciales. Sin ver: el hito real en Mi Día, «Ahora no», Mi Persona con datos de verdad, el selector de iconos en el wizard, el paso 1 a 375 px, y el cableado de las dos consultas del panel con sus estados de carga y error.
- **`docs/habits-implementation-plan.md` sigue documentando `HabitStatsBanner`** (líneas ~1336 y ~1420), que ya no existe.
- **El bundle sigue siendo un único chunk**, ahora de 1,1 MB (era 2,1). La fase 11 se llevó nueve dependencias; lo que queda por hacer es sacar el `IconPicker` a un chunk perezoso.
- **`habit.category` no llega en la consulta de hábitos**, así que en Mi Persona las identidades se proponen solo por el nombre del hábito.
- **La rueda de color del sistema sigue** en las categorías (`CreateHabitCategoryStep`, `HabitCategoryForm`). La fase 9 la quitó solo de los hábitos, que era su alcance.
- **`features/settings` no está migrado a Aura.** Es la única pantalla que queda con la pinta vieja, y tiene su propio ámbito para que no herede los tokens.
- **La portada pública (`/`)** sigue vendiendo una app que hace de todo.
- **En oscuro, menta y ámbar** quedan por encima de la banda de luminosidad ideal (siguen legibles: el contraste pasa). Arreglarlo de verdad pide guardar el *nombre* del color en vez del hex, que es cambio de datos.

---

## Lo que se descubrió al escribir las specs

- **Iconos.** La infraestructura ya era buena (160 iconos, búsqueda sin acentos, sinónimos en español, agrupación). El problema era de inventario: solo **138 visibles**, y la categoría **Social estaba declarada con cero iconos**, así que nunca aparecía. La fase 8 llena el catálogo hasta ~400; no rehace el selector.
- **Color.** La fase 6 pedía píldoras de color y se construyó con **la rueda nativa del sistema**, que además no guardaba nada (`color: null`): el `#10b981` que se veía era una mentira visual. Por eso la fase 9 hace paleta y sorteo juntos — sortear un color detrás de la rueda del sistema no habría resuelto nada.
