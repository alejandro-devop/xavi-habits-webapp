# Backlog de fases — rediseño Aura

Fases pedidas y todavía sin render aprobado. El circuito no cambia: **render → feedback → aprobación → spec en `docs/remodel/NN-nombre.spec.md` → subagente `xavi-builder` → verificación → commit**.

| Estado | Fase | Spec | Render |
|---|---|---|---|
| 🔨 En construcción | **Fase 7 — Mi Persona: la identidad se gana** | `06-mi-persona.spec.md` | `assets/06-mi-persona.html` |
| 📋 Spec lista, en cola | **Fase 8 — Un catálogo de iconos que alcance** | `07-catalogo-iconos.spec.md` | — (sin pantalla nueva) |
| 📋 Spec lista, en cola | **Fase 9 — El color del hábito viene puesto** | `08-color-inicial-habito.spec.md` | — (píldoras, ver spec) |

Se construyen **de una en una**: aunque tocan archivos distintos, cada constructor mide lint y tests contra una línea base, y dos a la vez se contaminan las medidas.

---

## Lo que se descubrió al escribir las specs

- **Iconos.** La infraestructura ya era buena (160 iconos, búsqueda sin acentos, sinónimos en español, agrupación). El problema era de inventario: solo **138 visibles**, y la categoría **Social estaba declarada con cero iconos**, así que nunca aparecía. La fase 8 llena el catálogo hasta ~400; no rehace el selector.
- **Color.** La fase 6 pedía píldoras de color y se construyó con **la rueda nativa del sistema**, que además no guardaba nada (`color: null`): el `#10b981` que se veía era una mentira visual. Por eso la fase 9 hace paleta y sorteo juntos — sortear un color detrás de la rueda del sistema no habría resuelto nada.
