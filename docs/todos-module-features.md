# Módulo Todos — resumen de features

Cliente: **xavi-habits-web** · API: **xavi-platform-node** (`POST /graphql`)

Migraciones: `027_todo_tags.sql`, `028_todo_folders.sql`

---

## Tareas

| Feature | GraphQL | Notas |
|---------|---------|--------|
| Listar tareas | `todos` | Paginado, filtros |
| Ver una tarea | `todo(id)` | Subtareas, etiquetas, carpeta |
| Crear tarea | `todoAdd` | Opcional: `tagIds`, `folderId` |
| Editar tarea | `todoEdit` | Opcional: `tagIds`, `folderId` (`null` = sin carpeta) |
| Borrar tarea | `todoRemove` | |
| Completar tarea | `todoComplete` | |

### Campos de una tarea

- Título, descripción, estado, prioridad, fechas
- `subtasksCount`, `subtasks`
- **`folderId`** / **`folder`** — una carpeta como máximo
- **`tags`** — varias etiquetas

### Filtros en listado (`todos`)

- `status`, `priority`, `dueBefore`, `dueAfter`
- `tagId` — tareas con esa etiqueta
- **`folderId`** — tareas en esa carpeta
- **`withoutFolder: true`** — tareas sin carpeta
- `page`, `limit`

---

## Carpetas (agrupar tareas)

Una tarea puede estar en **una carpeta** o en ninguna. Cada carpeta tiene nombre, color y orden.

| Feature | GraphQL |
|---------|---------|
| Listar mis carpetas | `todoFolders` (incluye `todoCount`) |
| Ver una carpeta | `todoFolder(id)` |
| Crear carpeta | `todoFolderAdd(input: { name, color, orderIndex? })` |
| Editar carpeta | `todoFolderEdit` |
| **Eliminar carpeta** | `todoFolderRemove` — las tareas **quedan** sin carpeta (`folder_id` → null) |

### Asignar carpeta a una tarea

- Crear: `todoAdd` → `folderId: "3"`
- Mover o quitar: `todoEdit` → `folderId: "3"` o `folderId: null`
- Filtrar: `todos(folderId: "3")` o `todos(withoutFolder: true)`

---

## Etiquetas (con color)

Varias etiquetas por tarea. CRUD global + asignación vía `tagIds` en `todoAdd` / `todoEdit`.

| Feature | GraphQL |
|---------|---------|
| Listar | `todoTags` |
| Crear | `todoTagAdd` |
| Editar | `todoTagEdit` |
| Eliminar (permanente) | `todoTagRemove` |
| Quitar de una tarea | `todoEdit` con `tagIds` sin esa etiqueta (o `[]`) |

---

## Subtareas

| Feature | GraphQL |
|---------|---------|
| Listar | `todo` → `subtasks` |
| Añadir | `todoSubtaskAdd` |
| Editar | `todoSubtaskEdit` |
| Borrar | `todoSubtaskRemove` |

---

## Pendiente en frontend

- UI `features/todos/` en habits-web
- Rutas `/app/todos`, sidebar de carpetas, chips de etiquetas

---

## Referencias

- SDL: `xavi-platform-node/src/graphql/modules/todo/todo.schema.ts`
- Bruno: `xavi-platform-node/docs/graphql/todo-bruno.md`
- Plan: `docs/todos-domain.md`
