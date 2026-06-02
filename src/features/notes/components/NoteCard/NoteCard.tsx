import { useState, useCallback } from 'react'
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor'
import { MarkdownContent } from '@/shared/ui/MarkdownContent'
import { TagChip } from '@/features/todos/components/TagChip/TagChip'
import { useUpdateNote, useRemoveNote } from '@/features/notes/hooks/useNotes'
import { useCreateTodoTagMutation } from '@/features/todos/hooks/useTodos'
import type { Note, TodoTag } from '@/features/notes/types/note.types'
import styles from './NoteCard.module.scss'

const TAG_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16']
const sanitizeTagName = (raw: string) => raw.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 25)

type Props = {
  note: Note
  availableTags: TodoTag[]
}

export function NoteCard({ note, availableTags }: Props) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(note.content)
  const [savedContent, setSavedContent] = useState(note.content)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  const { mutate: updateNote } = useUpdateNote()
  const { mutate: removeNote, isPending: isRemoving } = useRemoveNote()
  const createTag = useCreateTodoTagMutation()

  const handleSave = useCallback(
    (value: string) => {
      setSavedContent(value)
      updateNote({ id: note.id, content: value })
    },
    [note.id, updateNote],
  )

  const handleTagToggle = (tag: TodoTag) => {
    const currentIds = note.tags.map((t) => t.id)
    const next = currentIds.includes(tag.id)
      ? currentIds.filter((id) => id !== tag.id)
      : [...currentIds, tag.id]
    updateNote({ id: note.id, tagIds: next })
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.stopPropagation()
    const name = newTagName.trim()
    if (!name) return

    const existing = availableTags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      if (!note.tags.some((t) => t.id === existing.id)) {
        updateNote({ id: note.id, tagIds: [...note.tags.map((t) => t.id), existing.id] })
      }
      setNewTagName('')
      return
    }

    const color = TAG_COLORS[availableTags.length % TAG_COLORS.length]
    createTag.mutate(
      { name, color },
      {
        onSuccess: (newTag) => {
          updateNote({ id: note.id, tagIds: [...note.tags.map((t) => t.id), newTag.id] })
          setNewTagName('')
        },
      },
    )
  }

  const time = new Date(note.createdAt).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <span className={styles.time}>{time}</span>

        <div className={styles.tags}>
          {note.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
          <button
            type="button"
            className={styles.tagBtn}
            onClick={() => setShowTagPicker((v) => !v)}
            aria-label="Editar etiquetas"
          >
            #
          </button>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => {
              setContent(note.content)
              setSavedContent(note.content)
              setEditing((v) => !v)
            }}
            aria-label={editing ? 'Ver nota' : 'Editar nota'}
          >
            {editing ? '✓' : '✎'}
          </button>
          <button
            type="button"
            className={[styles.actionBtn, styles.danger].join(' ')}
            onClick={() => removeNote(note.id)}
            disabled={isRemoving}
            aria-label="Eliminar nota"
          >
            ✕
          </button>
        </div>
      </div>

      {showTagPicker && (
        <div className={styles.tagPicker}>
          {availableTags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              selected={note.tags.some((t) => t.id === tag.id)}
              onToggle={handleTagToggle}
            />
          ))}
          <input
            className={styles.tagInput}
            value={newTagName}
            onChange={(e) => setNewTagName(sanitizeTagName(e.target.value))}
            onKeyDown={handleTagKeyDown}
            placeholder="Nueva etiqueta… (Enter)"
          />
        </div>
      )}

      <div className={styles.body}>
        {editing ? (
          <MarkdownEditor
            value={content}
            onChange={setContent}
            onSave={handleSave}
            savedValue={savedContent}
            variant="notebook"
            placeholder="Escribe tu nota…"
          />
        ) : (
          <div onClick={() => setEditing(true)} className={styles.preview}>
            <MarkdownContent content={note.content || '_Sin contenido_'} />
          </div>
        )}
      </div>
    </article>
  )
}
