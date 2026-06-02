import { useState } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui'
import { Select } from '@/shared/ui/Select'
import { FormField } from '@/shared/ui/FormField'
import { useProjectsQuery, useAddProjectToQuarterMutation } from '@/features/quarters/hooks/useQuarters'
import type { Quarter } from '@/features/quarters/types/quarter.types'
import styles from './AddProjectToQuarterModal.module.scss'

type Props = {
  open: boolean
  onClose: () => void
  quarter: Quarter
}

export function AddProjectToQuarterModal({ open, onClose, quarter }: Props) {
  const { data: allProjects = [] } = useProjectsQuery()
  const addMutation = useAddProjectToQuarterMutation(quarter.id)

  const [projectId, setProjectId] = useState('')
  const [weeklyHours, setWeeklyHours] = useState('5')

  const assignedIds = new Set(quarter.projects.map((qp) => qp.projectId))
  const available = allProjects.filter((p) => !assignedIds.has(p.id) && p.status === 'active')

  const projectOptions = available.map((p) => ({ value: p.id, label: p.name }))
  const isValid = projectId && Number(weeklyHours) > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    addMutation.mutate(
      { quarterId: quarter.id, projectId, weeklyHours: Number(weeklyHours) },
      {
        onSuccess: () => {
          setProjectId('')
          setWeeklyHours('5')
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Añadir proyecto al quarter"
      size="sm"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" form="add-project-form" disabled={!isValid || addMutation.isPending}>
            {addMutation.isPending ? 'Añadiendo…' : 'Añadir'}
          </Button>
        </div>
      }
    >
      {available.length === 0 ? (
        <p className={styles.empty}>
          Todos tus proyectos activos ya están asignados a este quarter.
        </p>
      ) : (
        <form id="add-project-form" onSubmit={handleSubmit} className={styles.form}>
          <Select
            id="add-project-select"
            label="Proyecto"
            options={projectOptions}
            value={projectId}
            onChange={setProjectId}
            placeholder="Selecciona un proyecto"
          />
          <FormField
            id="weekly-hours"
            label="Horas semanales"
            type="number"
            min="0.5"
            max="168"
            step="0.5"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            helperText="¿Cuántas horas por semana dedicarán a este proyecto?"
          />
        </form>
      )}
    </Modal>
  )
}
