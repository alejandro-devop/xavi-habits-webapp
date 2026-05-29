import { useTodoFoldersQuery } from '@/features/todos/hooks/useTodos'
import type { TodoFolder } from '@/features/todos/types/todo.types'
import { Checkbox } from '@/shared/ui/Checkbox'
import { FormField } from '@/shared/ui/FormField'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './ActivityTodoFoldersField.module.scss'

type ActivityTodoFoldersFieldProps = {
  value: string[]
  onChange: (folderIds: string[]) => void
  disabled?: boolean
}

function toggleFolder(folderIds: string[], folderId: string): string[] {
  return folderIds.includes(folderId)
    ? folderIds.filter((id) => id !== folderId)
    : [...folderIds, folderId]
}

function FolderOption({
  folder,
  checked,
  disabled,
  onToggle,
}: {
  folder: TodoFolder
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <label className={styles.option}>
      <Checkbox checked={checked} onChange={onToggle} disabled={disabled} aria-label={folder.name} />
      <span className={styles.dot} style={{ backgroundColor: folder.color }} aria-hidden />
      <span className={styles.name}>{folder.name}</span>
      <span className={styles.count}>{folder.todoCount} tareas</span>
    </label>
  )
}

export function ActivityTodoFoldersField({
  value,
  onChange,
  disabled = false,
}: ActivityTodoFoldersFieldProps) {
  const { data: folders = [], isLoading } = useTodoFoldersQuery()

  return (
    <FormField
      id="activity-todo-folders"
      label="Carpetas de tareas"
      hint="Al iniciar el seguimiento de tiempo, podrás elegir una tarea pendiente de estas carpetas."
    >
      {isLoading ? (
        <Skeleton height={80} />
      ) : folders.length === 0 ? (
        <p className={styles.empty}>No tienes carpetas de tareas. Créalas en Todos → Ajustes.</p>
      ) : (
        <div className={styles.list}>
          {folders.map((folder) => (
            <FolderOption
              key={folder.id}
              folder={folder}
              checked={value.includes(folder.id)}
              disabled={disabled}
              onToggle={() => onChange(toggleFolder(value, folder.id))}
            />
          ))}
        </div>
      )}
    </FormField>
  )
}
