# Upcoming work — estado de implementación

> **Última actualización:** 2026-06-23  
> Índice de memoria para agentes y desarrolladores. Actualizar este archivo al completar (o abandonar) ítems de los specs en este directorio.

## Resumen

| Documento | Progreso | Estado |
|-----------|----------|--------|
| [layout-improvements.md](./layout-improvements.md) | 4/5 | Casi completo (falta flyout opcional) |
| [habits-module-improvements.md](./habits-module-improvements.md) | 4/6 | En progreso |
| [habit-month-view-and-difficulty-picker.md](./habit-month-view-and-difficulty-picker.md) | 0/2 partes | Pendiente |

---

## layout-improvements.md

**Alcance:** shell global (`AppLayout`, `Sidebar`, `Topbar`, `AppNavLink`).

| ID | Mejora | Estado | Notas |
|----|--------|--------|-------|
| 1 | Sidebar → icon rail colapsada por defecto | ✅ Completada | `localStorage` key `sidebar-collapsed`; default `true`; ancho 2.75rem / 14rem |
| 2 | Eliminar `max-width` global de `.main` | ✅ Completada | `AppLayout.module.scss` |
| 3 | Slim topbar + user area al sidebar footer | ✅ Completada | Email + `LogoutButton` en `Sidebar` footer; topbar sin `userArea` |
| 4 | Reducir padding de `.main` (2rem → 1rem) | ✅ Completada | Incluida en Mejora 2 |
| 5 | Sidebar expandida on hover (flyout) | ⏸️ Pendiente | Opcional; implementar solo si el icon rail no basta |

### Desvíos respecto al spec

- Tooltips en nav colapsado: se usó `Tooltip` de `@/shared/ui` (no tooltip CSS custom del doc).
- Botón colapso: `chevron-right` / `arrow-left` (`AppIcon`) en lugar de `«` / `»`.
- Brand “Xavi” oculta con CSS en `.collapsed .brand` (no mencionado explícitamente en el doc).
- Breadcrumbs contextuales en topbar: **no implementados** (el spec los menciona en criterios de aceptación pero no en los pasos de Mejora 3).

### Archivos tocados (2026-06-23)

- `src/layouts/AppLayout/AppLayout.tsx`
- `src/layouts/AppLayout/AppLayout.module.scss`
- `src/shared/ui/Sidebar/Sidebar.tsx`
- `src/shared/ui/Sidebar/Sidebar.module.scss`
- `src/shared/ui/Topbar/Topbar.module.scss`
- `src/shared/ui/NavLink/AppNavLink.tsx`

### Verificación pendiente (manual)

- [ ] Smoke visual en `/app/today`, `/app/activities`, `/app/todos`, `/app/habits/my-day`, `/app/weekly-routine`, `/app/quarters`
- [ ] Tema claro / oscuro en componentes modificados
- [ ] Mejora 5 (flyout) — solo si se decide implementar

---

## habits-module-improvements.md

**Alcance:** módulo `src/features/habits/` (layout, Mi Día, cards, lista, detalle, persona).

| ID | Mejora | Estado | Archivos principales |
|----|--------|--------|----------------------|
| 1 | `HabitsModuleLayout`: quitar max-width + rediseñar header/tabs | ✅ Completada | 2026-06-23 — sin `PageHeader`; sub-nav estilo tabs vía `className` |
| 2 | `HabitMyDayPage`: fecha hero + grid adaptativo | ✅ Completada | Fecha como `<h1>`; grid 350px alineado a la izq (ajuste manual vs spec) |
| 3 | `HabitDayCard`: limpiar ruido visual | ✅ Completada | Banner solo con propósito asignado; progress label fuera; dots más grandes |
| 4 | `HabitsListPage`: grid 2 columnas | ✅ Completada | `repeat(auto-fill, minmax(18rem, 1fr))` |
| 5 | `HabitDetailPage`: header limpio + `navigate(-1)` | ⬜ Pendiente | `HabitDetailPage.tsx`, `.module.scss` |
| 6 | `HabitPersonaPage`: 3 columnas horizontales DnD | ⬜ Pendiente | `HabitPersonaPage.tsx`, `.module.scss` |

### Contexto actual del código

- `HabitsModuleLayout` ya no impone `max-width`; sub-nav con estilo tab y sin `PageHeader` duplicado.
- Mi Día: grid de cards a **350px** max, gap `0.5rem`, alineación izquierda (preferencia del usuario).
- Orden pendiente: **5 → 6** (detalle y persona).

---

## habit-month-view-and-difficulty-picker.md

**Alcance:** `HabitDifficultyPicker`, `HabitFollowUpForm`, nueva `HabitMonthView`, `HabitCalendarPage`.

### Parte 1 — HabitDifficultyPicker

| ID | Ítem | Estado | Notas |
|----|------|--------|-------|
| 1.1 | Default difficulty `2` en `HabitFollowUpForm` | ⬜ Pendiente | Sigue `?? null` |
| 1.2 | Rediseño picker (slider desktop / stepper mobile) | ⬜ Pendiente | Sigue UI de 5 botones toggle |
| 1.3 | Reescribir `HabitDifficultyPicker.module.scss` | ⬜ Pendiente | — |
| 1.4 | Animación bump al cambiar nivel | ⏸️ Opcional | — |

### Parte 2 — HabitMonthView

| ID | Ítem | Estado | Notas |
|----|------|--------|-------|
| 2.1 | Crear `HabitMonthView` | ⬜ Pendiente | Componente no existe |
| 2.2 | Crear `HabitMonthView.module.scss` | ⬜ Pendiente | — |
| 2.3 | Actualizar `HabitCalendarPage` | ⬜ Pendiente | Sigue `HabitContributionGrid` |
| 2.4 | Export barrel habits | ⬜ Pendiente | — |
| 2.5 | Verificar tipo `HabitFollowUp` | ⬜ Pendiente | — |
| 2.6 | Verificar `AppIcon` `message-circle` | ⬜ Pendiente | — |

### Orden recomendado del spec

1. `HabitFollowUpForm` (default `2`)
2. `HabitDifficultyPicker` (reescritura)
3. `HabitMonthView` (nuevo)
4. `HabitCalendarPage` (integración)

---

## Próximo trabajo sugerido

1. **habits-module-improvements.md → Mejora 5** — `HabitDetailPage`: header limpio + `navigate(-1)`.
2. **habits-module-improvements.md → Mejora 6** — `HabitPersonaPage`: 3 columnas horizontales DnD.
3. **habit-month-view-and-difficulty-picker.md → 1.1 + 1.2** — default difficulty + rediseño picker.

---

## Convenciones para actualizar este archivo

- ✅ Completada — implementada y verificada (typecheck OK; smoke visual si aplica).
- ⏸️ Pendiente / opcional — no iniciada o explícitamente fuera de alcance.
- ⬜ Pendiente — no iniciada.
- Al cerrar un ítem: añadir fecha, archivos tocados y desvíos del spec si los hay.
- No borrar specs originales; este archivo es solo el índice de estado.
