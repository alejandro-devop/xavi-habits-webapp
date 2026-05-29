# Módulo Todos — resumen de features

Cliente: **xavi-habits-web** · API: **xavi-platform-node** (`POST /graphql`)

Migración etiquetas: `migrations/027_todo_tags.sql`

---

## Tareas

| Feature | GraphQL | Notas |
|---------|---------|--------|
| Listar tareas | `todos` | Paginado, filtros |
| Ver una tarea | `todo(id)` | Incluye subtareas y etiquetas |
| Crear tarea | `todoAdd` | Opcional: `tagIds` |
| Editar tarea | `todoEdit` | Opcional: `tagIds` (reemplaza todas las etiquetas de la tarea) |
| Borrar tarea | `todoRemove` | |
| Completar tarea | `todoComplete` | Atajo: `status` + `completedAt` |

### Campos de una tarea

- Título, descripción
- Estado: `pending` · `in_progress` · `completed` · `cancelled`
- Prioridad: `low` · `medium` · `high` · `urgent`
- Fecha límite (`dueDate`)
- Progreso de subtareas (`subtasksCount`)
- **Etiquetas** (`tags`)

### Filtros en listado (`todos`)

- `status`, `priority`
- `dueBefore`, `dueAfter`
- **`tagId`** — solo tareas que llevan esa etiqueta
- `page`, `limit`

---

## Subtareas (checklist)

| Feature | GraphQL |
|---------|---------|
| Listar (en detalle) | campo `subtasks` en `todo` |
| Añadir | `todoSubtaskAdd` |
| Editar / marcar hecha | `todoSubtaskEdit` |
| Borrar | `todoSubtaskRemove` |

---

## Etiquetas (con color)

Cada usuario tiene sus propias etiquetas. El **color** es hexadecimal de 6 dígitos, p. ej. `#3B82F6`. No puede haber dos etiquetas con el mismo nombre para el mismo usuario.

| Feature | GraphQL |
|---------|---------|
| Listar mis etiquetas | `todoTags` |
| Ver una etiqueta | `todoTag(id)` |
| Crear etiqueta | `todoTagAdd(input: { name, color })` |
| Editar nombre o color | `todoTagEdit` |
| Borrar etiqueta | `todoTagRemove` — quita la etiqueta de todas las tareas |

### Asignar etiquetas a tareas

- Al **crear** tarea: `todoAdd` → `input.tagIds: ["1", "2"]`
- Al **editar** tarea: `todoEdit` → `input.tagIds` (lista completa; `[]` deja la tarea sin etiquetas)
- En listado y detalle: campo `tags { id name color }`

### Ejemplo crear etiqueta

```graphql
mutation TodoTagAdd($input: TodoTagInput!) {
  todoTagAdd(input: $input) {
    id
    name
    color
  }
}
```

Variables: `{ "input": { "name": "Trabajo", "color": "#2563EB" } }`

---

## Pendiente / no incluido aún

- Carpetas o proyectos
- Buscar por texto en el título
- Varias etiquetas a la vez en filtro (`tagIds` AND/OR)
- UI en habits-web (`features/todos/`)

---

## Referencias técnicas

- Backend SDL: `xavi-platform-node/src/graphql/modules/todo/todo.schema.ts`
- Bruno: `xavi-platform-node/docs/graphql/todo-bruno.md`
- Plan frontend: `docs/todos-domain.md`
