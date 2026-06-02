import { useState } from 'react'
import { Drawer } from '@/shared/ui/Drawer'
import { Button } from '@/shared/ui'
import { FormField } from '@/shared/ui/FormField'
import { MarkdownContent } from '@/shared/ui/MarkdownContent'
import { IconButton } from '@/shared/ui/IconButton'
import { useProjectQuery, useAddObjectiveMutation, useUpdateObjectiveMutation, useRemoveObjectiveMutation, useProjectSessionLogsQuery } from '@/features/quarters/hooks/useQuarters'
import { formatShortDate } from '@/features/quarters/utils/format'
import type { ObjectiveStatus, ProjectObjective } from '@/features/quarters/types/quarter.types'
import styles from './ProjectDetailDrawer.module.scss'

const OBJECTIVE_STATUS_LABEL: Record<ObjectiveStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completado',
}

const OBJECTIVE_STATUS_NEXT: Record<ObjectiveStatus, ObjectiveStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
}

type Props = {
  projectId: string | null
  open: boolean
  onClose: () => void
}

function ObjectiveItem({
  objective,
  projectId,
}: {
  objective: ProjectObjective
  projectId: string
}) {
  const updateMutation = useUpdateObjectiveMutation(projectId)
  const removeMutation = useRemoveObjectiveMutation(projectId)

  const cycleStatus = () => {
    updateMutation.mutate({ id: objective.id, status: OBJECTIVE_STATUS_NEXT[objective.status] })
  }

  return (
    <div className={styles.objectiveItem}>
      <button
        type="button"
        className={[styles.statusDot, styles[`status-${objective.status}`]].join(' ')}
        onClick={cycleStatus}
        title={`Estado: ${OBJECTIVE_STATUS_LABEL[objective.status]} · Click para cambiar`}
        aria-label={`Cambiar estado de ${objective.title}`}
      />
      <span className={[styles.objectiveTitle, objective.status === 'completed' ? styles.done : ''].filter(Boolean).join(' ')}>
        {objective.title}
      </span>
      <IconButton
        icon="trash"
        size="sm"
        aria-label="Eliminar objetivo"
        onClick={() => removeMutation.mutate(objective.id)}
        className={styles.removeObjective}
      />
    </div>
  )
}

function AddObjectiveForm({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState('')
  const addMutation = useAddObjectiveMutation(projectId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addMutation.mutate({ projectId, title: title.trim() }, { onSuccess: () => setTitle('') })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.addObjectiveForm}>
      <FormField
        id="new-objective"
        label=""
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="+ Añadir objetivo…"
        aria-label="Nuevo objetivo"
      />
      {title.trim() && (
        <Button type="submit" variant="primary" size="sm" disabled={addMutation.isPending}>
          Añadir
        </Button>
      )}
    </form>
  )
}

export function ProjectDetailDrawer({ projectId, open, onClose }: Props) {
  const { data: project, isLoading } = useProjectQuery(projectId ?? undefined)
  const { data: logs = [] } = useProjectSessionLogsQuery(projectId ?? undefined)

  return (
    <Drawer open={open} onClose={onClose} title={project?.name ?? 'Proyecto'} side="right">
      {isLoading && <p className={styles.loading}>Cargando…</p>}

      {project && (
        <>
          {project.description && (
            <p className={styles.description}>{project.description}</p>
          )}

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Objetivos</h3>
            {project.objectives.length === 0 && (
              <p className={styles.empty}>Sin objetivos aún.</p>
            )}
            <div className={styles.objectivesList}>
              {project.objectives.map((obj) => (
                <ObjectiveItem key={obj.id} objective={obj} projectId={project.id} />
              ))}
            </div>
            <AddObjectiveForm projectId={project.id} />
          </section>

          {logs.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Sesiones</h3>
              <div className={styles.logTimeline}>
                {logs.map((log) => (
                  <div key={log.id} className={styles.logEntry}>
                    <span className={styles.logDate}>{formatShortDate(log.sessionDate)}</span>
                    <div className={styles.logContent}>
                      <MarkdownContent content={log.content} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Drawer>
  )
}
