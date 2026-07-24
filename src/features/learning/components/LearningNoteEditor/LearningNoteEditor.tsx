import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { LearningTagChip } from '@/features/learning/components/LearningTagChip'
import {
  useCreateLearningNote,
  useCreateLearningTag,
  useRemoveLearningNote,
  useUpdateLearningNote,
} from '@/features/learning/hooks/useLearningNotes'
import { learningPaths } from '@/features/learning/routes/learning-paths'
import type { LearningNote, LearningTag } from '@/features/learning/types/learning-note.types'
import { Button } from '@/shared/ui'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor'
import styles from './LearningNoteEditor.module.scss'

type Props = {
  mode: 'create' | 'edit'
  note?: LearningNote | null
  availableTags: LearningTag[]
}

export function LearningNoteEditor({ mode, note, availableTags }: Props) {
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const createNote = useCreateLearningNote()
  const updateNote = useUpdateLearningNote()
  const removeNote = useRemoveLearningNote()
  const createTag = useCreateLearningTag()

  const isTempNote = Boolean(note?.id.startsWith('temp-'))
  const canPersistEdits = mode === 'edit' && Boolean(note) && !isTempNote

  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.contentMarkdown ?? '')
  const [savedContent, setSavedContent] = useState(note?.contentMarkdown ?? '')
  const [selectedTags, setSelectedTags] = useState<LearningTag[]>(note?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')
  const [saveLabel, setSaveLabel] = useState(
    mode === 'create' || isTempNote ? 'Creando…' : 'Guardado',
  )

  const canCreate = title.trim().length > 0 && !createNote.isPending

  const persistTags = useCallback(
    (nextTags: LearningTag[]) => {
      setSelectedTags(nextTags)
      if (!canPersistEdits || !note) return
      updateNote.mutate({
        id: note.id,
        tagIds: nextTags.map((t) => t.id).filter((id) => !id.startsWith('temp-')),
        tags: nextTags,
      })
    },
    [canPersistEdits, note, updateNote],
  )

  const handleTitleBlur = () => {
    if (!canPersistEdits || !note) return
    const next = title.trim()
    if (!next || next === note.title) return
    setSaveLabel('Guardando…')
    updateNote.mutate(
      { id: note.id, title: next },
      {
        onSuccess: () => setSaveLabel('Guardado'),
        onError: () => setSaveLabel('Error al guardar'),
      },
    )
  }

  const handleContentSave = (value: string) => {
    setSavedContent(value)
    if (!canPersistEdits || !note) return
    setSaveLabel('Guardando…')
    updateNote.mutate(
      { id: note.id, contentMarkdown: value },
      {
        onSuccess: () => setSaveLabel('Guardado'),
        onError: () => setSaveLabel('Error al guardar'),
      },
    )
  }

  const handleCreate = () => {
    if (!canCreate) return
    const tempId = `temp-${crypto.randomUUID()}`
    const tagIds = selectedTags.map((t) => t.id).filter((id) => !id.startsWith('temp-'))
    createNote.mutate(
      {
        tempId,
        title: title.trim(),
        contentMarkdown: content,
        tagIds: tagIds.length ? tagIds : undefined,
      },
      {
        onSuccess: (created) => {
          navigate(learningPaths.note(created.id), { replace: true })
        },
        onError: () => {
          navigate(learningPaths.root)
        },
      },
    )
    navigate(learningPaths.note(tempId))
  }

  const handleDelete = async () => {
    if (!note || isTempNote) return
    const ok = await confirm({
      title: 'Eliminar nota',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    removeNote.mutate(note.id, {
      onSuccess: () => navigate(learningPaths.root),
    })
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const name = tagDraft.trim()
    if (!name) return

    const existing = availableTags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      if (!selectedTags.some((t) => t.id === existing.id)) {
        persistTags([...selectedTags, existing])
      }
      setTagDraft('')
      return
    }

    const tempId = `temp-${crypto.randomUUID()}`
    createTag.mutate(
      { name, tempId },
      {
        onSuccess: (tag) => {
          persistTags([...selectedTags.filter((t) => t.id !== tempId), tag])
          setTagDraft('')
        },
      },
    )
  }

  const suggestions = useMemo(() => {
    const q = tagDraft.trim().toLowerCase()
    if (!q) return []
    return availableTags
      .filter((t) => t.name.toLowerCase().includes(q) && !selectedTags.some((s) => s.id === t.id))
      .slice(0, 6)
  }, [availableTags, selectedTags, tagDraft])

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <Button variant="ghost" size="sm" onClick={() => navigate(learningPaths.root)}>
          ← Volver
        </Button>
        <div className={styles.toolbar}>
          {mode === 'edit' ? <span className={styles.status}>{saveLabel}</span> : null}
          {mode === 'create' ? (
            <Button variant="primary" size="sm" disabled={!canCreate} onClick={handleCreate}>
              Crear
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => void handleDelete()}
              disabled={removeNote.isPending || isTempNote}
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <input
        className={styles.titleInput}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        placeholder="Título de la nota"
        aria-label="Título"
      />

      <div className={styles.tagsRow}>
        {selectedTags.map((tag) => (
          <LearningTagChip
            key={tag.id}
            tag={tag}
            onRemove={() => persistTags(selectedTags.filter((t) => t.id !== tag.id))}
          />
        ))}
        <input
          className={styles.tagInput}
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="+ etiqueta (Enter)"
          aria-label="Añadir etiqueta"
        />
        {suggestions.map((tag) => (
          <LearningTagChip
            key={`suggest-${tag.id}`}
            tag={tag}
            onToggle={() => {
              persistTags([...selectedTags, tag])
              setTagDraft('')
            }}
          />
        ))}
      </div>

      <div className={styles.editor}>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          onSave={canPersistEdits ? handleContentSave : undefined}
          savedValue={savedContent}
          placeholder="Escribe tu conocimiento en markdown…"
          aria-label="Contenido de la nota"
        />
      </div>
    </section>
  )
}
