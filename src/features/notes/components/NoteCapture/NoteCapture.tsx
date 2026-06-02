import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TagChip } from '@/features/todos/components/TagChip/TagChip'
import { useCreateNote } from '@/features/notes/hooks/useNotes'
import { useCreateTodoTagMutation } from '@/features/todos/hooks/useTodos'
import type { TodoTag } from '@/features/notes/types/note.types'
import styles from './NoteCapture.module.scss'

const TAG_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16']
const sanitizeTagName = (raw: string) => raw.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 25)

type Props = {
  open: boolean
  onClose: () => void
  availableTags: TodoTag[]
}

export function NoteCapture({ open, onClose, availableTags }: Props) {
  const [content, setContent] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutate: createNote, isPending } = useCreateNote()
  const createTag = useCreateTodoTagMutation()

  useEffect(() => {
    if (open) {
      setContent('')
      setSelectedTagIds([])
      setNewTagName('')
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSave = () => {
    if (!content.trim()) return
    createNote(
      { content: content.trim(), tagIds: selectedTagIds },
      { onSuccess: onClose },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  const toggleTag = (tag: TodoTag) => {
    setSelectedTagIds((prev) =>
      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
    )
  }

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTagName(sanitizeTagName(e.target.value))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.stopPropagation()
    const name = newTagName.trim()
    if (!name) return

    const existing = availableTags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      setSelectedTagIds((prev) => prev.includes(existing.id) ? prev : [...prev, existing.id])
      setNewTagName('')
      return
    }

    const color = TAG_COLORS[availableTags.length % TAG_COLORS.length]
    createTag.mutate(
      { name, color },
      { onSuccess: (newTag) => { setSelectedTagIds((prev) => [...prev, newTag.id]); setNewTagName('') } },
    )
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-label="Captura rápida de nota"
          >
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="¿Qué hiciste? Soporta **markdown**…"
              rows={5}
            />

            <div className={styles.tags}>
              {availableTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  selected={selectedTagIds.includes(tag.id)}
                  onToggle={toggleTag}
                />
              ))}
              <input
                className={styles.tagInput}
                value={newTagName}
                onChange={handleTagInput}
                onKeyDown={handleTagKeyDown}
                placeholder="Nueva etiqueta… (Enter)"
              />
            </div>

            <div className={styles.footer}>
              <span className={styles.hint}>⌘↩ para guardar · Esc para cerrar</span>
              <div className={styles.footerActions}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={!content.trim() || isPending}
                >
                  {isPending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
