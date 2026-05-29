import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTodoFoldersQuery, useCreateTodoFolderMutation } from '@/features/todos/hooks/useTodos'
import type { TodoCollection, TodoFolder } from '@/features/todos/types/todo.types'
import { todoKeys } from '@/shared/api/query-keys'
import { Modal } from '@/shared/ui/Modal/Modal'
import { Button } from '@/shared/ui/Button/Button'
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
  '#F97316',
  '#14B8A6',
  '#A855F7',
  '#64748B',
]

type Props = {
  selectedFolderId: string | null
  onSelect: (folderId: string | null) => void
}

function computePendingCounts(queryClient: ReturnType<typeof useQueryClient>): Record<string, number> {
  const lists = queryClient.getQueriesData<TodoCollection>({ queryKey: todoKeys.lists() })
  const map: Record<string, number> = {}
  for (const [key, data] of lists) {
    if (!data) continue
    const filters = key[2] as Record<string, unknown>
    const folderId = filters?.folderId
    if (typeof folderId === 'string') {
      map[folderId] = data.todos.filter((t) => t.status !== 'completed').length
    }
  }
  return map
}

function usePendingCountsFromCache() {
  const queryClient = useQueryClient()
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    function compute() {
      const next = computePendingCounts(queryClient)
      // Only update state when counts actually changed — avoids infinite loop
      // caused by subscribe firing on every observer update
      setCounts((prev) => {
        const prevKeys = Object.keys(prev)
        const nextKeys = Object.keys(next)
        if (prevKeys.length !== nextKeys.length) return next
        if (nextKeys.every((k) => prev[k] === next[k])) return prev
        return next
      })
    }
    compute()
    return queryClient.getQueryCache().subscribe(compute)
  }, [queryClient])

  return counts
}

export function NotebookTabs({ selectedFolderId, onSelect }: Props) {
  const { data: folders = [] } = useTodoFoldersQuery()
  const createFolder = useCreateTodoFolderMutation()
  const pendingCounts = usePendingCountsFromCache()

  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showModal) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [showModal])

  const handleClose = () => {
    setShowModal(false)
    setNewName('')
    setNewColor(FOLDER_COLORS[0])
  }

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    createFolder.mutate(
      { name, color: newColor, orderIndex: folders.length },
      {
        onSuccess: (folder: TodoFolder) => {
          handleClose()
          onSelect(folder.id)
        },
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <>
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
            {pendingCounts[folder.id] !== undefined ? (
              pendingCounts[folder.id] > 0 ? (
                <span className={styles.count}>{pendingCounts[folder.id]}</span>
              ) : null
            ) : folder.todoCount > 0 ? (
              <span className={styles.count}>{folder.todoCount}</span>
            ) : null}
          </button>
        ))}

        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setShowModal(true)}
          aria-label="Nueva carpeta"
        >
          +
        </button>
      </div>

      <Modal
        open={showModal}
        onClose={handleClose}
        title="Nueva carpeta"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={!newName.trim() || createFolder.isPending}
            >
              Crear
            </Button>
          </>
        }
      >
        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>Nombre</label>
          <input
            ref={inputRef}
            className={styles.modalInput}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej. Trabajo, Personal…"
            maxLength={100}
          />

          <label className={styles.fieldLabel}>Color</label>
          <div className={styles.colorGrid}>
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={[styles.colorSwatch, newColor === c ? styles.selectedColor : ''].join(' ')}
                style={{ background: c }}
                onClick={() => setNewColor(c)}
                aria-label={c}
              />
            ))}
          </div>

          <div className={styles.preview}>
            <span className={styles.previewDot} style={{ background: newColor }} />
            <span className={styles.previewName}>{newName || 'Sin nombre'}</span>
          </div>
        </div>
      </Modal>
    </>
  )
}
