---
name: project-todos-module
description: Estado y decisiones de diseño del módulo Todos implementado en xavi-habits-web
metadata:
  type: project
---

Módulo Todos implementado con UI estética de notebook de papel en `/app/todos`.

**Why:** El usuario quería una experiencia visual diferente al resto de la app — un cuaderno de papel con líneas guía, margen rojo, y navegación por teclado completa.

**Decisiones clave:**
- `todoEdit({ status: "pending" })` se usa para *descompletar* (no existe `todoUncomplete` en el backend — confirmado en schema).
- Autosave en el drawer: título y descripción guardan al `onBlur`, prioridad y etiquetas guardan al instante al hacer click.
- 4 niveles de prioridad incluidos: `low | medium | high | urgent`.
- La ruta es `/app/todos`, registrada en `src/app/router/routes.tsx`.

**Estructura:**
```
src/features/todos/
  graphql/todos.graphql.ts
  types/todo.types.ts
  api/todos.api.ts
  hooks/useTodos.ts
  components/
    NotebookList/   ← componente principal con keyboard nav
    NotebookItem/   ← fila = renglón del cuaderno
    NotebookInput/  ← renglón vacío para nueva tarea
    TodoDrawer/     ← drawer de detalle con autosave
    SubtaskList/    ← subtareas inline
    PriorityBadge/  ← chips low/medium/high/urgent
    TagChip/        ← chips con color de etiqueta
  routes/todos.routes.tsx
  index.ts
src/pages/app/TodosPage/TodosPage.tsx
```

**How to apply:** Al extender el módulo (filtros, ordenación, vistas por prioridad) seguir el patrón de `NotebookList` pasando `filters` como prop. Los hooks ya están preparados para recibir `TodoFilters`.
