import { useEffect, useRef, useState } from 'react'
import { useTodoFoldersQuery, useCreateTodoFolderMutation } from '@/features/todos/hooks/useTodos'
import type { TodoFolder } from '@/features/todos/types/todo.types'
import styles from './NotebookTabs.module.scss'

const FOLDER_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
]

type Props = {
  selectedFolderId: string | null
  onSelect: (folderId: string | null) => void
}

export function NotebookTabs({ selectedFolderId, onSelect }: Props) {
  const { data: folders = [] } = useTodoFoldersQuery()
  const createFolder = useCreateTodoFolderMutation()

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showNew) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [showNew])

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    createFolder.mutate(
      { name, color: newColor, orderIndex: folders.length },
      {
        onSuccess: (folder: TodoFolder) => {
          setNewName('')
          setNewColor(FOLDER_COLORS[0])
          setShowNew(false)
          onSelect(folder.id)
        },
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') {
      setShowNew(false)
      setNewName('')
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={[styles.tab, selectedFolderId === null ? styles.active : ''].join(' ')}
        onClick={() => onSelect(null)}
      >
        Todas
      </button>

      {folders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          className={[styles.tab, selectedFolderId === folder.id ? styles.active : ''].join(' ')}
          onClick={() => onSelect(folder.id)}
        >
          <span className={styles.dot} style={{ background: folder.color }} />
          {folder.name}
          {folder.todoCount > 0 ? (
            <span className={styles.count}>{folder.todoCount}</span>
          ) : null}
        </button>
      ))}

      <div className={styles.addWrapper}>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setShowNew((v) => !v)}
          aria-label="Nueva carpeta"
        >
          +
        </button>

        {showNew ? (
          <div className={styles.newFolderRow}>
            <div className={styles.colorPicker}>
              {FOLDER_COLORS.map((c) => (
                <span
                  key={c}
                  className={[styles.colorSwatch, newColor === c ? styles.selectedColor : ''].join(' ')}
                  style={{ background: c }}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </div>
            <input
              ref={inputRef}
              className={styles.newFolderInput}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nombre de carpeta…"
              maxLength={100}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
