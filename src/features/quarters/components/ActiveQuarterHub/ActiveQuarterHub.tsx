import { useState } from 'react'
import { Button } from '@/shared/ui'
import { Badge } from '@/shared/ui/Badge'
import { IconButton } from '@/shared/ui/IconButton'
import { MarkdownContent } from '@/shared/ui/MarkdownContent'
import { SessionLogModal } from '@/features/quarters/components/SessionLogModal/SessionLogModal'
import { AddProjectToQuarterModal } from '@/features/quarters/components/AddProjectToQuarterModal/AddProjectToQuarterModal'
import { ProjectDetailDrawer } from '@/features/quarters/components/ProjectDetailDrawer/ProjectDetailDrawer'
import { WeeklyPlanner } from '@/features/quarters/components/WeeklyPlanner/WeeklyPlanner'
import {
  useSessionLogsQuery,
  useRemoveProjectFromQuarterMutation,
  useDeleteSessionLogMutation,
  useCompleteQuarterMutation,
} from '@/features/quarters/hooks/useQuarters'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { formatDateRange, formatShortDate } from '@/features/quarters/utils/format'
import type { Quarter, SessionLog } from '@/features/quarters/types/quarter.types'
import styles from './ActiveQuarterHub.module.scss'

type Props = {
  quarter: Quarter
}

export function ActiveQuarterHub({ quarter }: Props) {
  const { confirm } = useConfirmDialog()
  const { data: logs = [] } = useSessionLogsQuery(quarter.id)
  const removeProjMutation = useRemoveProjectFromQuarterMutation(quarter.id)
  const deleteLogMutation = useDeleteSessionLogMutation(quarter.id)
  const completeMutation = useCompleteQuarterMutation()

  const [logModalOpen, setLogModalOpen] = useState(false)
  const [editLog, setEditLog] = useState<SessionLog | null>(null)
  const [defaultProjectId, setDefaultProjectId] = useState<string | undefined>()
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(null)

  const openNewLog = (projectId?: string) => {
    setEditLog(null)
    setDefaultProjectId(projectId)
    setLogModalOpen(true)
  }

  const openEditLog = (log: SessionLog) => {
    setEditLog(log)
    setDefaultProjectId(undefined)
    setLogModalOpen(true)
  }

  const handleRemoveProject = async (qpId: string, projectName: string) => {
    const confirmed = await confirm({
      title: 'Quitar proyecto',
      description: `¿Quitar "${projectName}" de este quarter?`,
      confirmLabel: 'Quitar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (confirmed) removeProjMutation.mutate(qpId)
  }

  const handleDeleteLog = async (log: SessionLog) => {
    const confirmed = await confirm({
      title: 'Eliminar sesión',
      description: '¿Eliminar este log de sesión?',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (confirmed) deleteLogMutation.mutate({ id: log.id, logProjectId: log.projectId })
  }

  const handleCompleteQuarter = async () => {
    const confirmed = await confirm({
      title: 'Completar quarter',
      description: `¿Marcar "${quarter.name}" como completado? Ya no podrás agregar sesiones.`,
      confirmLabel: 'Completar',
      cancelLabel: 'Cancelar',
    })
    if (confirmed) completeMutation.mutate({ id: quarter.id })
  }

  const recentLogs = [...logs].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)).slice(0, 10)

  return (
    <div className={styles.hub}>
      <div className={styles.hubHeader}>
        <div className={styles.hubMeta}>
          <Badge variant="success">Activo</Badge>
          <span className={styles.dates}>
            {formatDateRange(quarter.startDate, quarter.endDate)}
          </span>
        </div>
        <div className={styles.hubActions}>
          <Button variant="ghost" size="sm" onClick={handleCompleteQuarter}>
            Completar quarter
          </Button>
          <Button variant="primary" size="sm" onClick={() => openNewLog()}>
            + Nueva sesión
          </Button>
        </div>
      </div>

      <WeeklyPlanner quarter={quarter} logs={logs} onLogSession={openNewLog} />

      <section className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Proyectos del quarter</h3>
          <Button variant="ghost" size="sm" onClick={() => setAddProjectOpen(true)}>
            + Añadir proyecto
          </Button>
        </div>

        {quarter.projects.length === 0 ? (
          <p className={styles.empty}>
            Sin proyectos asignados.{' '}
            <button type="button" className={styles.inlineLink} onClick={() => setAddProjectOpen(true)}>
              Añade uno para comenzar.
            </button>
          </p>
        ) : (
          <div className={styles.projectCards}>
            {quarter.projects.map((qp) => (
              <div
                key={qp.id}
                className={styles.projectChip}
                role="button"
                tabIndex={0}
                onClick={() => setDrawerProjectId(qp.projectId)}
                onKeyDown={(e) => e.key === 'Enter' && setDrawerProjectId(qp.projectId)}
              >
                <div className={styles.projectChipBody}>
                  <span className={styles.projectName}>{qp.project.name}</span>
                  <span className={styles.hours}>{qp.weeklyHours}h/sem</span>
                </div>
                <div className={styles.projectChipActions} onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    icon="circle-play"
                    size="sm"
                    aria-label="Registrar sesión"
                    title="Registrar sesión para este proyecto"
                    onClick={() => openNewLog(qp.projectId)}
                  />
                  <IconButton
                    icon="xmark"
                    size="sm"
                    aria-label="Quitar del quarter"
                    onClick={() => void handleRemoveProject(qp.id, qp.project.name)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {recentLogs.length > 0 && (
        <section className={styles.logsSection}>
          <h3 className={styles.sectionTitle}>Sesiones recientes</h3>
          <div className={styles.logList}>
            {recentLogs.map((log) => {
              const project = quarter.projects.find((qp) => qp.projectId === log.projectId)
              return (
                <div key={log.id} className={styles.logItem}>
                  <div className={styles.logMeta}>
                    <span className={styles.logDate}>{formatShortDate(log.sessionDate)}</span>
                    {project && <Badge variant="neutral">{project.project.name}</Badge>}
                    <div className={styles.logItemActions}>
                      <IconButton icon="pencil" size="sm" aria-label="Editar" onClick={() => openEditLog(log)} />
                      <IconButton icon="trash" size="sm" aria-label="Eliminar" onClick={() => void handleDeleteLog(log)} />
                    </div>
                  </div>
                  <div className={styles.logContent}>
                    <MarkdownContent content={log.content} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <SessionLogModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        quarter={quarter}
        log={editLog}
        defaultProjectId={defaultProjectId}
      />

      <AddProjectToQuarterModal
        open={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        quarter={quarter}
      />

      <ProjectDetailDrawer
        projectId={drawerProjectId}
        open={Boolean(drawerProjectId)}
        onClose={() => setDrawerProjectId(null)}
      />
    </div>
  )
}
