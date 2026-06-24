import type { SleepLog } from '@/features/sleep/types/sleep.types'
import {
  formatDuration,
  formatTime,
  getQualityColor,
  MOOD_LABELS,
  QUALITY_LABELS,
} from '@/features/sleep/utils/sleep-month.utils'
import { sleepDateToInputValue } from '@/features/sleep/utils/sleep.utils'
import styles from './SleepTimeline.module.scss'

interface SleepTimelineProps {
  logs: SleepLog[]
  onEdit: (log: SleepLog) => void
  onDelete: (log: SleepLog) => void
  deletingId: string | null
}

const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatShortDate(sleepDate: string): { day: string; month: string } {
  const d = new Date(`${sleepDateToInputValue(sleepDate)}T12:00:00`)
  return {
    day: String(d.getDate()),
    month: SHORT_MONTHS[d.getMonth()],
  }
}

export function SleepTimeline({ logs, onEdit, onDelete, deletingId }: SleepTimelineProps) {
  const sorted = [...logs].sort((a, b) => b.sleepDate.localeCompare(a.sleepDate))

  if (sorted.length === 0) {
    return <p className={styles.empty}>No hay registros para este mes.</p>
  }

  return (
    <div className={styles.list}>
      {sorted.map((log, idx) => {
        const { day, month } = formatShortDate(log.sleepDate)
        const color = getQualityColor(log.quality)
        const isLast = idx === sorted.length - 1

        return (
          <div key={log.id} className={`${styles.item} ${isLast ? styles.last : ''}`}>
            <div className={styles.dateCol}>
              <span className={styles.day}>{day}</span>
              <span className={styles.month}>{month}</span>
            </div>

            <div className={styles.accent} style={{ background: color }} />

            <div className={styles.content}>
              <div className={styles.contentTop}>
                <span className={styles.duration}>{formatDuration(log.durationMinutes)}</span>
                {log.quality && (
                  <span className={styles.quality} style={{ color }}>
                    {QUALITY_LABELS[log.quality]}
                  </span>
                )}
              </div>
              <p className={styles.meta}>
                🌙 {formatTime(log.bedtime)} → ☀️ {formatTime(log.wakeTime)}
                {log.moodOnWaking ? ` · ${MOOD_LABELS[log.moodOnWaking]}` : ''}
              </p>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => onEdit(log)}
                aria-label="Editar registro"
              >
                ✏️
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={() => onDelete(log)}
                disabled={deletingId === log.id}
                aria-label="Eliminar registro"
              >
                🗑️
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
