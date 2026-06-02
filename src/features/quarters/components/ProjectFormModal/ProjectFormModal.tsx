import { useState, useEffect } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui'
import { FormField } from '@/shared/ui/FormField'
import { Select } from '@/shared/ui/Select'
import { useCreateProjectMutation, useUpdateProjectMutation } from '@/features/quarters/hooks/useQuarters'
import type { Project, ProjectStatus } from '@/features/quarters/types/quarter.types'
import styles from './ProjectFormModal.module.scss'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'En pausa' },
  { value: 'completed', label: 'Completado' },
  { value: 'archived', label: 'Archivado' },
]

type Props = {
  open: boolean
  onClose: () => void
  project?: Project | null
}

export function ProjectFormModal({ open, onClose, project }: Props) {
  const isEdit = Boolean(project)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')

  const createMutation = useCreateProjectMutation()
  const updateMutation = useUpdateProjectMutation()
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (open) {
      setName(project?.name ?? '')
      setDescription(project?.description ?? '')
      setStatus(project?.status ?? 'active')
    }
  }, [open, project])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (isEdit && project) {
      updateMutation.mutate(
        { id: project.id, name: name.trim(), description: description.trim() || undefined, status },
        { onSuccess: onClose },
      )
    } else {
      createMutation.mutate(
        { name: name.trim(), description: description.trim() || undefined, status },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
      size="sm"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" form="project-form" disabled={!name.trim() || isPending}>
            {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear proyecto'}
          </Button>
        </div>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className={styles.form}>
        <FormField id="project-name" label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Aprender piano" required autoFocus />
        <FormField id="project-desc" label="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿De qué trata este proyecto?" />
        <Select
          id="project-status"
          label="Estado"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => setStatus(v as ProjectStatus)}
        />
      </form>
    </Modal>
  )
}
