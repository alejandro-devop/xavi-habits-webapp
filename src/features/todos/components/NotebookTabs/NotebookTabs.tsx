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

export const TODAY_FOLDER_ID = '__today__'
export const SUGGESTED_FOLDER_ID = '__suggested__'

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
    if (filters?.selectedToday === true) {
      map[TODAY_FOLDER_ID] = data.todos.filter((t) => t.status !== 'completed').length
    }
    // Suggested: selectedToday === false (ya filtrado por pendingOnly en el servidor)
    if (filters?.selectedToday === false) {
      map[SUGGESTED_FOLDER_ID] = data.todos.length
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
          className={[styles.tab, styles.todayTab, selectedFolderId === TODAY_FOLDER_ID ? styles.active : ''].join(' ')}
          onClick={() => onSelect(TODAY_FOLDER_ID)}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v6l4 2.4-1 1.7-5-3V7z"/>
          </svg>
          Hoy
          {pendingCounts[TODAY_FOLDER_ID] != null && pendingCounts[TODAY_FOLDER_ID] > 0 ? (
            <span className={styles.count}>{pendingCounts[TODAY_FOLDER_ID]}</span>
          ) : null}
        </button>

        <button
          type="button"
          className={[styles.tab, styles.suggestedTab, selectedFolderId === SUGGESTED_FOLDER_ID ? styles.active : ''].join(' ')}
          onClick={() => onSelect(SUGGESTED_FOLDER_ID)}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a7 7 0 0 0-7 7c0 2.6 1.4 4.8 3.5 6.1V17a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-1.9C17.6 13.8 19 11.6 19 9a7 7 0 0 0-7-7zm-1 14v-1h2v1h-2zm3-3.2-.6.4-.4.3V14h-2v-.5l-.4-.3-.6-.4A5 5 0 0 1 7 9a5 5 0 0 1 10 0 5 5 0 0 1-3 4.8z"/>
          </svg>
          Suggested
          {pendingCounts[SUGGESTED_FOLDER_ID] != null && pendingCounts[SUGGESTED_FOLDER_ID] > 0 ? (
            <span className={styles.count}>{pendingCounts[SUGGESTED_FOLDER_ID]}</span>
          ) : null}
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
