import { useState } from 'react'
import { IconButton } from '@/shared/ui/IconButton'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui'
import {
  useWeekScheduleSlotsQuery,
  useDeleteWeekScheduleSlotMutation,
} from '@/features/quarters/hooks/useQuarters'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { WeekScheduleSlotModal } from '@/features/quarters/components/WeekScheduleSlotModal/WeekScheduleSlotModal'
import { getCurrentWeekStart, formatWeekRange, formatShortDate } from '@/features/quarters/utils/format'
import type { DayOfWeek, Quarter, SessionLog, WeekScheduleSlot } from '@/features/quarters/types/quarter.types'
import styles from './WeeklyPlanner.module.scss'

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

type Props = {
  quarter: Quarter
  logs: SessionLog[]
  onLogSession: (projectId: string) => void
}

export function WeeklyPlanner({ quarter, logs, onLogSession }: Props) {
  const { confirm } = useConfirmDialog()
  const { data: slots = [] } = useWeekScheduleSlotsQuery(quarter.id)
  const deleteMutation = useDeleteWeekScheduleSlotMutation(quarter.id)

  const weekStart = getCurrentWeekStart()
  const weekLabel = formatWeekRange(weekStart)
  const weekLogs = logs
    .filter((l) => l.weekStartDate === weekStart)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))

  const [modalDay, setModalDay] = useState<DayOfWeek | null>(null)
  const [editSlot, setEditSlot] = useState<WeekScheduleSlot | null>(null)

  const openAdd = (day: DayOfWeek) => {
    setEditSlot(null)
    setModalDay(day)
  }

  const openEdit = (slot: WeekScheduleSlot) => {
    setEditSlot(slot)
    setModalDay(slot.dayOfWeek)
  }

  const handleDelete = async (slot: WeekScheduleSlot) => {
    const confirmed = await confirm({
      title: 'Eliminar slot',
      description: `¿Eliminar "${slot.project?.name ?? 'este slot'}" del ${DAY_LABELS[slot.dayOfWeek]}?`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (confirmed) deleteMutation.mutate(slot.id)
  }

  const slotsByDay = DAYS.reduce<Record<DayOfWeek, WeekScheduleSlot[]>>((acc, day) => {
    acc[day] = slots.filter((s) => s.dayOfWeek === day)
    return acc
  }, {} as Record<DayOfWeek, WeekScheduleSlot[]>)

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Esta semana</h3>
        <span className={styles.weekRange}>{weekLabel}</span>
      </div>

      <div className={styles.dayList}>
        {DAYS.map((day) => {
          const daySlots = slotsByDay[day]
          const dayLogs = weekLogs.filter((l) =>
            daySlots.some((s) => s.projectId === l.projectId),
          )
          const hasActivity = dayLogs.length > 0

          return (
            <div key={day} className={`${styles.dayRow} ${hasActivity ? styles.dayActive : ''}`}>
              <div className={styles.dayHeader}>
                <div className={styles.dayTitleRow}>
                  <span
                    className={styles.dayIndicator}
                    aria-hidden="true"
                    data-active={hasActivity}
                  />
                  <span className={styles.dayName}>{DAY_LABELS[day]}</span>
                  {daySlots.length > 0 && (
                    <span className={styles.dayTotal}>
                      {daySlots.reduce((sum, s) => sum + s.hours, 0)}h total
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAdd(day)}
                  disabled={quarter.projects.length === 0}
                >
                  + Añadir
                </Button>
              </div>

              {daySlots.length > 0 && (
                <div className={styles.slotList}>
                  {daySlots.map((slot) => {
                    const loggedThisWeek = weekLogs.filter((l) => l.projectId === slot.projectId).length
                    return (
                      <div key={slot.id} className={styles.slotItem}>
                        <div className={styles.slotInfo}>
                          <span className={styles.slotProject}>{slot.project?.name ?? '—'}</span>
                          <div className={styles.slotMeta}>
                            <span>{slot.hours}h</span>
                            {slot.startTime && <span>· {slot.startTime}</span>}
                            {slot.notes && <span>· {slot.notes}</span>}
                            {loggedThisWeek > 0 && (
                              <Badge variant="success">{loggedThisWeek} sesión{loggedThisWeek !== 1 ? 'es' : ''}</Badge>
                            )}
                          </div>
                        </div>
                        <div className={styles.slotActions}>
                          <IconButton
                            icon="circle-play"
                            size="sm"
                            aria-label="Registrar sesión"
                            title="Registrar sesión"
                            onClick={() => onLogSession(slot.projectId)}
                          />
                          <IconButton
                            icon="pencil"
                            size="sm"
                            aria-label="Editar slot"
                            onClick={() => openEdit(slot)}
                          />
                          <IconButton
                            icon="trash"
                            size="sm"
                            aria-label="Eliminar slot"
                            onClick={() => void handleDelete(slot)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {weekLogs.length > 0 && (
        <div className={styles.logsList}>
          <span className={styles.logsLabel}>Sesiones registradas esta semana</span>
          {weekLogs.map((log) => {
            const project = quarter.projects.find((qp) => qp.projectId === log.projectId)
            const preview = log.content.replace(/#+\s*/g, '').replace(/\*\*/g, '').slice(0, 150)
            return (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.logHeader}>
                  <span className={styles.logDate}>{formatShortDate(log.sessionDate)}</span>
                  {project && <Badge variant="neutral">{project.project.name}</Badge>}
                </div>
                {preview && (
                  <p className={styles.logPreview}>
                    {preview}{log.content.length > 150 ? '…' : ''}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalDay && (
        <WeekScheduleSlotModal
          open={Boolean(modalDay)}
          onClose={() => { setModalDay(null); setEditSlot(null) }}
          quarter={quarter}
          dayOfWeek={modalDay}
          slot={editSlot}
        />
      )}
    </section>
  )
}
