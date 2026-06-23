# Upcoming work — estado de implementación

> **Última actualización:** 2026-06-23 (activities module añadido)  
> Índice de memoria para agentes y desarrolladores. Actualizar este archivo al completar (o abandonar) ítems de los specs en este directorio.

## Resumen

| Documento | Progreso | Estado |
|-----------|----------|--------|
| [layout-improvements.md](./layout-improvements.md) | 4/5 | Casi completo (falta flyout opcional) |
| [habits-module-improvements.md](./habits-module-improvements.md) | 6/6 | ✅ Completado |
| [habit-month-view-and-difficulty-picker.md](./habit-month-view-and-difficulty-picker.md) | 2/2 partes | ✅ Completado |
| [activities-module-improvements.md](./activities-module-improvements.md) | 2/5 | Mejoras 1 + 2 completadas |

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
| 5 | `HabitDetailPage`: header limpio + `navigate(-1)` | ✅ Completada | Badges en fila separada; `goBack()` con fallback a lista |
| 6 | `HabitPersonaPage`: 3 columnas horizontales DnD | ✅ Completada | `.threeColumns` 3→2→1 responsive |

### Contexto actual del código

- `HabitsModuleLayout` ya no impone `max-width`; sub-nav con estilo tab y sin `PageHeader` duplicado.
- Spec **habits-module-improvements.md** completado (6/6).

---

## habit-month-view-and-difficulty-picker.md

**Alcance:** `HabitDifficultyPicker`, `HabitFollowUpForm`, nueva `HabitMonthView`, `HabitCalendarPage`.

### Parte 1 — HabitDifficultyPicker

| ID | Ítem | Estado | Notas |
|----|------|--------|-------|
| 1.1 | Default difficulty `2` en `HabitFollowUpForm` | ✅ Completada | |
| 1.2 | Rediseño picker (slider desktop / stepper mobile) | ✅ Completada | |
| 1.3 | Reescribir `HabitDifficultyPicker.module.scss` | ✅ Completada | |
| 1.4 | Animación bump al cambiar nivel | ✅ Completada | |

### Parte 2 — HabitMonthView

| ID | Ítem | Estado | Notas |
|----|------|--------|-------|
| 2.1 | Crear `HabitMonthView` | ✅ Completada | 2026-06-23 |
| 2.2 | Crear `HabitMonthView.module.scss` | ✅ Completada | |
| 2.3 | Actualizar `HabitCalendarPage` | ✅ Completada | Reemplaza `HabitContributionGrid` + `HabitCalendarLegend` |
| 2.4 | Export barrel habits | ✅ Completada | `HabitMonthView/index.ts` |
| 2.5 | Verificar tipo `HabitFollowUp` | ✅ Completada | Campos ya existían en `habit.types.ts` |
| 2.6 | Verificar `AppIcon` `message-circle` | ✅ Completada | Usado `comments` (no existe `message-circle`) |

### Desvíos respecto al spec

- Ícono de nota: `comments` en lugar de `message-circle` (no disponible en catálogo).
- Invalidación de cache: añadida en `useHabitFollowUps.ts` para `habitKeys.calendar` (requerido para refrescar la vista tras guardar).

### Orden recomendado del spec

1. `HabitFollowUpForm` (default `2`)
2. `HabitDifficultyPicker` (reescritura)
3. `HabitMonthView` (nuevo)
4. `HabitCalendarPage` (integración)

---

## activities-module-improvements.md

**Alcance:** módulo `src/features/activities/` (layout shell, nav tabs, seguimiento, categorías, detalle).

| ID | Mejora | Estado | Archivos principales |
|----|--------|--------|----------------------|
| 1 | `ActivitiesModuleLayout`: quitar `PageHeader` + eliminar `max-width: 72rem` | ✅ Completada | 2026-06-23 |
| 2 | `ActivitiesModuleNav`: convertir a tabs pill sin iconos | ✅ Completada | `NavLink` + estilos pill; fondo `--color-surface-elevated` |
| 3 | `ActivityTrackingPage`: 2 columnas desktop + sticky bar mobile | ⬜ Pendiente | `ActivityTrackingPage.tsx`, `.module.scss` |
| 4 | `ActivityCategoriesPanel`: grid `auto-fill minmax(240px)` + tarjeta "+" | ⬜ Pendiente | `ActivityCategoriesPanel.tsx`, `.module.scss` |
| 5 | `ActivityDetailPage`: 2 columnas desktop + sticky bar mobile | ⬜ Pendiente | `ActivityDetailPage.tsx`, `.module.scss` |

### Notas de diseño

- **Breakpoint desktop/mobile:** `@include md` (≥768px) para mejoras 3 y 5.
- **Seguimiento desktop:** 2 columnas (3fr / 2fr). Tab "Resumen" eliminado en desktop; widgets siempre visibles.
- **Seguimiento mobile:** métricas compactas arriba + tabs "Registro / Resumen" + sticky bar "Iniciar / Registrar".
- **Detalle desktop:** columna derecha fija 280px con metadata + acciones.
- **Detalle mobile:** sticky bar con "Completar" + "Eliminar".
- **Tabs nav:** `overflow-x: auto; scrollbar-width: none` para pantallas estrechas.
- **Sticky bars:** respetar `safe-area-inset-bottom` (notch iPhone).

### Orden recomendado del spec

1 → 2 → 4 → 5 → 3 (Mejora 3 es la más compleja, al final)

---

## Próximo trabajo sugerido

1. **activities-module-improvements.md → Mejora 4** — grid responsive en `ActivityCategoriesPanel`.
2. **activities-module-improvements.md → Mejora 5** — `ActivityDetailPage` 2 columnas + sticky bar.
3. **activities-module-improvements.md → Mejora 3** — `ActivityTrackingPage` (la más compleja).
4. **layout-improvements.md → Mejora 5** — flyout on hover (opcional).

---

## Convenciones para actualizar este archivo

- ✅ Completada — implementada y verificada (typecheck OK; smoke visual si aplica).
- ⏸️ Pendiente / opcional — no iniciada o explícitamente fuera de alcance.
- ⬜ Pendiente — no iniciada.
- Al cerrar un ítem: añadir fecha, archivos tocados y desvíos del spec si los hay.
- No borrar specs originales; este archivo es solo el índice de estado.
