import { useEffect, useRef, useState } from 'react'
import { useTodoFoldersQuery, useCreateTodoFolderMutation } from '@/features/todos/hooks/useTodos'
import type { TodoFolder } from '@/features/todos/types/todo.types'
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

export function NotebookTabs({ selectedFolderId, onSelect }: Props) {
  const { data: folders = [] } = useTodoFoldersQuery()
  const createFolder = useCreateTodoFolderMutation()

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
            {folder.todoCount > 0 ? (
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
