import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  useCreateAppIdea,
  useRemoveAppIdea,
  useUpdateAppIdea,
} from '@/features/app-ideas/hooks/useAppIdeas'
import { appIdeasPaths } from '@/features/app-ideas/routes/app-ideas-paths'
import {
  APP_IDEA_STATUS_OPTIONS,
  type AppIdea,
  type AppIdeaStatus,
} from '@/features/app-ideas/types/app-idea.types'
import { Button, Select } from '@/shared/ui'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor'
import styles from './AppIdeaEditor.module.scss'

type Props = {
  mode: 'create' | 'edit'
  idea?: AppIdea | null
}

export function AppIdeaEditor({ mode, idea }: Props) {
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const createIdea = useCreateAppIdea()
  const updateIdea = useUpdateAppIdea()
  const removeIdea = useRemoveAppIdea()

  const isTempIdea = Boolean(idea?.id.startsWith('temp-'))
  const canPersistEdits = mode === 'edit' && Boolean(idea) && !isTempIdea

  const [title, setTitle] = useState(idea?.title ?? '')
  const [content, setContent] = useState(idea?.contentMarkdown ?? '')
  const [savedContent, setSavedContent] = useState(idea?.contentMarkdown ?? '')
  const [status, setStatus] = useState<AppIdeaStatus>(idea?.status ?? 'draft')
  const [saveLabel, setSaveLabel] = useState(
    mode === 'create' || isTempIdea ? 'Creando…' : 'Guardado',
  )

  const canCreate = title.trim().length > 0 && !createIdea.isPending

  const handleTitleBlur = () => {
    if (!canPersistEdits || !idea) return
    const next = title.trim()
    if (!next || next === idea.title) return
    setSaveLabel('Guardando…')
    updateIdea.mutate(
      { id: idea.id, title: next },
      {
        onSuccess: () => setSaveLabel('Guardado'),
        onError: () => setSaveLabel('Error al guardar'),
      },
    )
  }

  const handleStatusChange = (next: string) => {
    const value = next as AppIdeaStatus
    setStatus(value)
    if (!canPersistEdits || !idea || value === idea.status) return
    setSaveLabel('Guardando…')
    updateIdea.mutate(
      { id: idea.id, status: value },
      {
        onSuccess: () => setSaveLabel('Guardado'),
        onError: () => setSaveLabel('Error al guardar'),
      },
    )
  }

  const handleContentSave = (value: string) => {
    setSavedContent(value)
    if (!canPersistEdits || !idea) return
    setSaveLabel('Guardando…')
    updateIdea.mutate(
      { id: idea.id, contentMarkdown: value },
      {
        onSuccess: () => setSaveLabel('Guardado'),
        onError: () => setSaveLabel('Error al guardar'),
      },
    )
  }

  const handleCreate = () => {
    if (!canCreate) return
    const tempId = `temp-${crypto.randomUUID()}`
    createIdea.mutate(
      {
        tempId,
        title: title.trim(),
        contentMarkdown: content,
        status,
      },
      {
        onSuccess: (created) => {
          navigate(appIdeasPaths.idea(created.id), { replace: true })
        },
        onError: () => {
          navigate(appIdeasPaths.root)
        },
      },
    )
    navigate(appIdeasPaths.idea(tempId))
  }

  const handleDelete = async () => {
    if (!idea || isTempIdea) return
    const ok = await confirm({
      title: 'Eliminar idea',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (!ok) return
    removeIdea.mutate(idea.id, {
      onSuccess: () => navigate(appIdeasPaths.root),
    })
  }

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <Button variant="ghost" size="sm" onClick={() => navigate(appIdeasPaths.root)}>
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
              disabled={removeIdea.isPending || isTempIdea}
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
        placeholder="Título de la idea"
        aria-label="Título"
      />

      <div className={styles.statusRow}>
        <Select
          label="Estado"
          value={status}
          onChange={handleStatusChange}
          options={APP_IDEA_STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      </div>

      <div className={styles.editor}>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          onSave={canPersistEdits ? handleContentSave : undefined}
          savedValue={savedContent}
          placeholder="Describe tu idea de app en markdown…"
          aria-label="Contenido de la idea"
        />
      </div>
    </section>
  )
}
