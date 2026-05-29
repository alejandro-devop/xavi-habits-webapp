import { useState } from 'react'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import {
  useTodoFoldersQuery,
  useTodoTagsQuery,
  useUpdateTodoTagMutation,
  useRemoveTodoTagMutation,
  useUpdateTodoFolderMutation,
  useRemoveTodoFolderMutation,
} from '@/features/todos/hooks/useTodos'
import type { TodoFolder, TodoTag } from '@/features/todos/types/todo.types'
import styles from './TodosSettings.module.scss'

const TAG_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#A855F7',
]

const FOLDER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

type ColorPickerProps = {
  colors: string[]
  current: string
  onChange: (color: string) => void
}

function ColorPicker({ colors, current, onChange }: ColorPickerProps) {
  return (
    <div className={styles.colorPicker}>
      {colors.map((c) => (
        <span
          key={c}
          className={[styles.swatch, c === current ? styles.active : ''].join(' ')}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}

type TagRowProps = {
  tag: TodoTag
  pickerOpen: boolean
  onTogglePicker: () => void
}

function TagRow({ tag, pickerOpen, onTogglePicker }: TagRowProps) {
  const updateTag = useUpdateTodoTagMutation()
  const removeTag = useRemoveTodoTagMutation()
  const { confirm } = useConfirmDialog()
  const [name, setName] = useState(tag.name)

  const commitName = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === tag.name) { setName(tag.name); return }
    updateTag.mutate({ id: tag.id, name: trimmed })
  }

  const handleColorChange = (color: string) => {
    updateTag.mutate({ id: tag.id, color })
    onTogglePicker()
  }

  const handleRemove = () => {
    void confirm({
      title: `¿Eliminar etiqueta "${tag.name}"?`,
      description: 'Se quitará de todas las tareas que la usen.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      onConfirm: () => removeTag.mutate(tag.id),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className={styles.item}>
        <button
          type="button"
          className={styles.colorBtn}
          style={{ background: tag.color }}
          onClick={onTogglePicker}
          aria-label="Cambiar color"
        />
        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          maxLength={25}
        />
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => void handleRemove()}
          aria-label={`Eliminar etiqueta ${tag.name}`}
        >
          ×
        </button>
      </div>
      {pickerOpen ? (
        <ColorPicker colors={TAG_COLORS} current={tag.color} onChange={handleColorChange} />
      ) : null}
    </div>
  )
}

type FolderRowProps = {
  folder: TodoFolder
  pickerOpen: boolean
  onTogglePicker: () => void
}

function FolderRow({ folder, pickerOpen, onTogglePicker }: FolderRowProps) {
  const updateFolder = useUpdateTodoFolderMutation()
  const removeFolder = useRemoveTodoFolderMutation()
  const { confirm } = useConfirmDialog()
  const [name, setName] = useState(folder.name)

  const commitName = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === folder.name) { setName(folder.name); return }
    updateFolder.mutate({ id: folder.id, name: trimmed })
  }

  const handleColorChange = (color: string) => {
    updateFolder.mutate({ id: folder.id, color })
    onTogglePicker()
  }

  const handleRemove = () => {
    void confirm({
      title: `¿Eliminar carpeta "${folder.name}"?`,
      description: 'Las tareas dentro no se eliminarán, solo quedarán sin carpeta.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      onConfirm: () => removeFolder.mutate(folder.id),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className={styles.item}>
        <button
          type="button"
          className={styles.colorBtn}
          style={{ background: folder.color }}
          onClick={onTogglePicker}
          aria-label="Cambiar color"
        />
        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          maxLength={100}
        />
        {folder.todoCount > 0 ? (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            {folder.todoCount} tarea{folder.todoCount !== 1 ? 's' : ''}
          </span>
        ) : null}
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => void handleRemove()}
          aria-label={`Eliminar carpeta ${folder.name}`}
        >
          ×
        </button>
      </div>
      {pickerOpen ? (
        <ColorPicker colors={FOLDER_COLORS} current={folder.color} onChange={handleColorChange} />
      ) : null}
    </div>
  )
}

export function TodosSettings() {
  const { data: tags = [] } = useTodoTagsQuery()
  const { data: folders = [] } = useTodoFoldersQuery()
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)

  const togglePicker = (id: string) =>
    setOpenPickerId((prev) => (prev === id ? null : id))

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <span className={styles.sectionTitle}>Carpetas</span>
        <div className={styles.list}>
          {folders.length === 0 ? (
            <p className={styles.empty}>Sin carpetas creadas.</p>
          ) : (
            folders.map((folder) => (
              <FolderRow
                key={folder.id}
                folder={folder}
                pickerOpen={openPickerId === `folder-${folder.id}`}
                onTogglePicker={() => togglePicker(`folder-${folder.id}`)}
              />
            ))
          )}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.sectionTitle}>Etiquetas</span>
        <div className={styles.list}>
          {tags.length === 0 ? (
            <p className={styles.empty}>Sin etiquetas creadas.</p>
          ) : (
            tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                pickerOpen={openPickerId === `tag-${tag.id}`}
                onTogglePicker={() => togglePicker(`tag-${tag.id}`)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
