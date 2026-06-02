import { useState, useEffect } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui'
import { FormField } from '@/shared/ui/FormField'
import { Select } from '@/shared/ui/Select'
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor'
import { useCreateSessionLogMutation, useUpdateSessionLogMutation } from '@/features/quarters/hooks/useQuarters'
import type { Quarter, SessionLog } from '@/features/quarters/types/quarter.types'
import styles from './SessionLogModal.module.scss'

type Props = {
  open: boolean
  onClose: () => void
  quarter: Quarter
  log?: SessionLog | null
  defaultProjectId?: string
}

export function SessionLogModal({ open, onClose, quarter, log, defaultProjectId }: Props) {
  const isEdit = Boolean(log)
  const today = new Date().toISOString().split('T')[0]

  const [projectId, setProjectId] = useState('')
  const [sessionDate, setSessionDate] = useState(today)
  const [content, setContent] = useState('')

  const createMutation = useCreateSessionLogMutation(quarter.id, projectId || undefined)
  const updateMutation = useUpdateSessionLogMutation(quarter.id)
  const isPending = createMutation.isPending || updateMutation.isPending

  const projectOptions = quarter.projects.map((qp) => ({
    value: qp.projectId,
    label: qp.project.name,
  }))

  useEffect(() => {
    if (open) {
      setProjectId(log?.projectId ?? defaultProjectId ?? quarter.projects[0]?.projectId ?? '')
      setSessionDate(log?.sessionDate ?? today)
      setContent(log?.content ?? '')
    }
  }, [open, log, defaultProjectId, quarter.projects, today])

  const isValid = projectId && sessionDate && content.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    if (isEdit && log) {
      updateMutation.mutate({ id: log.id, content: content.trim() }, { onSuccess: onClose })
    } else {
      createMutation.mutate(
        { quarterId: quarter.id, projectId, sessionDate, content: content.trim() },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar sesión' : 'Nueva sesión'}
      size="lg"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" form="session-log-form" disabled={!isValid || isPending}>
            {isPending ? 'Guardando…' : isEdit ? 'Guardar' : 'Registrar sesión'}
          </Button>
        </div>
      }
    >
      <form id="session-log-form" onSubmit={handleSubmit} className={styles.form}>
        {!isEdit && (
          <div className={styles.meta}>
            <Select
              id="log-project"
              label="Proyecto"
              options={projectOptions}
              value={projectId}
              onChange={setProjectId}
              placeholder="Selecciona un proyecto"
            />
            <FormField
              id="log-date"
              label="Fecha"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
            />
          </div>
        )}
        <div className={styles.editorWrap}>
          <label className={styles.editorLabel}>¿Qué hicieron hoy?</label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Describe lo que trabajaron esta sesión… Soporta **markdown**"
          />
        </div>
      </form>
    </Modal>
  )
}
