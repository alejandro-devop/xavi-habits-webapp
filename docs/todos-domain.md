# Dominio Todos — Xavi Habits Web

Módulo de **tareas** con subtareas. El backend GraphQL ya está en **xavi-platform-node**; el frontend (`features/todos/`) se implementa en habits-web siguiendo el patrón de actividades.

## Backend

| Recurso | Ruta en `xavi-platform-node` |
|---------|-------------------------------|
| SDL + resolvers | `src/graphql/modules/todo/` |
| Servicio | `src/services/todo.service.ts` |
| Tipos | `src/types/services/todo.types.ts` |
| Validación Zod | `src/validators/schemas/todo.schemas.ts` |
| Referencia operaciones | `docs/graphql/todo-bruno.md` |
| Colección Bruno | `bruno/xavi-todo-graphql/` |

Cliente HTTP: `graphqlRequest` (`docs/api-core.md`). IDs en API son strings numéricos (`"10"`).

## Estado en habits-web

| Capa | Estado |
|------|--------|
| GraphQL strings + `api/` + hooks | Por implementar |
| Rutas `/app/todos` | Por implementar |
| UI (listado, detalle, subtareas) | Por implementar |
| `todoKeys` en `query-keys.ts` | Definido (usar en hooks) |

## Estructura prevista

```txt
src/features/todos/
  api/
  components/
  graphql/
  hooks/
  pages/          # opcional si las vistas son solo feature-internal
  routes/
  types/
  utils/
```

Página fina en `src/pages/app/` que componga la feature, como en actividades.

## Rutas previstas

| Ruta | Vista | Menú global |
|------|-------|-------------|
| `/app/todos` | Listado paginado + filtros | Sí |
| `/app/todos/new` | Crear tarea | No |
| `/app/todos/:id` | Detalle + subtareas | No |
| `/app/todos/:id/edit` | Editar | No |

## GraphQL — tareas

| Operación | Uso |
|-----------|-----|
| `todos(status, priority, dueBefore, dueAfter, page, limit)` | Listado paginado (`TodoCollection`) |
| `todo(id)` | Detalle con `subtasks` y `subtasksCount` |
| `todoAdd(input)` | Crear |
| `todoEdit(input)` | Editar (`id` + campos opcionales) |
| `todoRemove(id)` | Eliminar → `Boolean!` |
| `todoComplete(id)` | Marcar completada (`status`, `completedAt`) |

### Enums

- **TodoStatus:** `pending` \| `in_progress` \| `completed` \| `cancelled`
- **TodoPriority:** `low` \| `medium` \| `high` \| `urgent`

### Campos `Todo`

`id`, `userId`, `title`, `description`, `status`, `priority`, `dueDate`, `completedAt`, `createdAt`, `updatedAt`, `subtasks[]`, `subtasksCount { total completed }`.

## GraphQL — etiquetas (implementado en backend)

| Operación | Uso |
|-----------|-----|
| `todoTags` | Listar etiquetas del usuario |
| `todoTag(id)` | Detalle etiqueta |
| `todoTagAdd(input: { name, color })` | Crear — color hex `#RRGGBB` |
| `todoTagEdit` | Editar nombre y/o color |
| `todoTagRemove(id)` | Borrar etiqueta |
| `todos(tagId: …)` | Filtrar tareas por etiqueta |
| `todoAdd` / `todoEdit` | `tagIds: [ID!]` para asignar (edit reemplaza la lista) |

Campo `Todo.tags`: `{ id, name, color }`.

Resumen completo: **`docs/todos-module-features.md`**.

## GraphQL — carpetas (implementado en backend)

| Operación | Uso |
|-----------|-----|
| `todoFolders` | Listar carpetas (`todoCount` por carpeta) |
| `todoFolder(id)` | Detalle |
| `todoFolderAdd(input: { name, color, orderIndex? })` | Crear — color hex `#RRGGBB` |
| `todoFolderEdit` | Editar nombre, color u orden |
| `todoFolderRemove(id)` | Borrar carpeta; las tareas quedan sin carpeta |
| `todos(folderId)` / `todos(withoutFolder: true)` | Filtrar listado |
| `todoAdd` / `todoEdit` | `folderId` — `null` quita la carpeta |

Campo `Todo`: `folderId`, `folder { id name color todoCount }`.

Migración: `028_todo_folders.sql`.

Orden manual dentro de carpeta: campo `orderIndex`, mutation `todoReorder`, migración `029_todo_order_index.sql`. Ver `docs/todos-module-features.md`.

## GraphQL — subtareas

| Operación | Uso |
|-----------|-----|
| `todoSubtaskAdd(input)` | `todoId`, `title`, `orderIndex?` |
| `todoSubtaskEdit(input)` | `todoId`, `subtaskId`, `title?`, `isCompleted?`, `orderIndex?` |
| `todoSubtaskRemove(input)` | `todoId`, `subtaskId` → `Boolean!` |

Campo `TodoSubtask`: `id`, `todoId`, `title`, `isCompleted`, `orderIndex`, `createdAt`, `updatedAt`.

## Query keys

```ts
todoKeys.list(serializedFilters)
todoKeys.detail(id)
```

### Invalidaciones sugeridas

| Mutación | Invalidar |
|----------|-----------|
| `todoAdd` / `todoEdit` / `todoRemove` / `todoComplete` | `todoKeys.all` o `list` + `detail(id)` si aplica |
| Subtareas add/edit/remove | `todoKeys.detail(todoId)` + listados que muestren `subtasksCount` |

## Convenciones de implementación

1. Strings GraphQL en `features/todos/graphql/*.graphql.ts` (como `activities.graphql.ts`).
2. Fetchers en `features/todos/api/*.api.ts` tipados con tipos en `features/todos/types/`.
3. Hooks React Query en `features/todos/hooks/` usando `todoKeys`.
4. No duplicar lógica de auth: siempre `graphqlRequest` (token vía `getValidAccessToken`).
5. UI: design system (`docs/design-system-agent-guide.md`); sin REST `/api/todo`.

## Referencias

- Cliente API: `docs/api-core.md`
- Patrón feature completo: `docs/activities-domain.md`, `src/features/activities/`
- AGENTS / backend: `AGENTS.md`, `.cursor/rules/backend-context.mdc`
