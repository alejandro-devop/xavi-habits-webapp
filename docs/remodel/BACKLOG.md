# Backlog de fases — rediseño Aura

Fases pedidas y todavía sin render aprobado. El circuito no cambia: **render → feedback → aprobación → spec en `docs/remodel/NN-nombre.spec.md` → subagente `xavi-builder` → verificación → commit**.

| Estado | Fase | Spec | Render |
|---|---|---|---|
| ✅ Publicada | **Fase 7 — Mi Persona: la identidad se gana** | `06-mi-persona.spec.md` | `assets/06-mi-persona.html` |
| ✅ Publicada | **Fase 8 — Un catálogo de iconos que alcance** | `07-catalogo-iconos.spec.md` | — |
| ✅ Publicada | **Fase 9 — El color del hábito viene puesto** | `08-color-inicial-habito.spec.md` | — |
| 🎨 Render montado, esperando 3 decisiones | **Fase 10 — El panel del hábito** | pendiente | `assets/09-panel-habito.html` |

Se construyen **de una en una**: aunque tocan archivos distintos, cada constructor mide lint y tests contra una línea base, y dos a la vez se contaminan las medidas.

## Pendiente de decidir — fase 10

1. ¿El panel **sustituye** la pantalla de detalle, o convive como pestaña junto a «Semana» e «Historial»?
2. ¿Rango por defecto **90 días o 30**? 90 da tendencia; un hábito recién creado lo verá casi vacío.
3. ¿Se queda la ficha **«Veces que recaíste»**? Es el único número del panel que habla de fallo.

## Deuda anotada, sin hacer

- **El bundle es un único chunk de 2 MB** y Vite avisa en cada build. El catálogo de iconos le sumó un 13 %. La palanca no es podar iconos: es sacar el `IconPicker` a un chunk perezoso.
- **`HabitPurposeCard` y `HabitPurposeForm` quedaron huérfanos** al quitar el kanban de Mi Persona.
- **`habit.category` no llega en la consulta de hábitos**, así que en Mi Persona las identidades se proponen solo por el nombre del hábito.
- **La rueda de color del sistema sigue** en las categorías (`CreateHabitCategoryStep`, `HabitCategoryForm`) y en `features/activities`. La fase 9 la quitó solo de los hábitos, que era su alcance.
- **En oscuro, menta y ámbar** quedan por encima de la banda de luminosidad ideal (siguen legibles: el contraste pasa). Arreglarlo de verdad pide guardar el *nombre* del color en vez del hex, que es cambio de datos.

---

## Lo que se descubrió al escribir las specs

- **Iconos.** La infraestructura ya era buena (160 iconos, búsqueda sin acentos, sinónimos en español, agrupación). El problema era de inventario: solo **138 visibles**, y la categoría **Social estaba declarada con cero iconos**, así que nunca aparecía. La fase 8 llena el catálogo hasta ~400; no rehace el selector.
- **Color.** La fase 6 pedía píldoras de color y se construyó con **la rueda nativa del sistema**, que además no guardaba nada (`color: null`): el `#10b981` que se veía era una mentira visual. Por eso la fase 9 hace paleta y sorteo juntos — sortear un color detrás de la rueda del sistema no habría resuelto nada.
