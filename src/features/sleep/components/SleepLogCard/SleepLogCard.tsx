import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import type { SleepLog } from '@/features/sleep/types/sleep.types'
import {
  formatMoodOnWaking,
  formatSleepDuration,
  formatSleepQuality,
  sleepDateToInputValue,
} from '@/features/sleep/utils/sleep.utils'
import styles from './SleepLogCard.module.scss'

interface SleepLogCardProps {
  log: SleepLog
  onEdit: (log: SleepLog) => void
  onDelete: (id: string) => void
  deleteLoading?: boolean
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(sleepDate: string): string {
  return new Date(`${sleepDateToInputValue(sleepDate)}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function SleepLogCard({ log, onEdit, onDelete, deleteLoading = false }: SleepLogCardProps) {
  const qualityLabel = formatSleepQuality(log.quality)
  const moodLabel = formatMoodOnWaking(log.moodOnWaking)

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span className={styles.date}>{formatDate(log.sleepDate)}</span>
        <span className={styles.duration}>{formatSleepDuration(log.durationMinutes)}</span>
      </div>

      <div className={styles.times}>
        <div className={styles.timeItem}>
          <span className={styles.timeLabel}>Se durmió</span>
          <span className={styles.timeValue}>{formatTime(log.bedtime)}</span>
        </div>
        <div className={styles.divider}>→</div>
        <div className={styles.timeItem}>
          <span className={styles.timeLabel}>Se despertó</span>
          <span className={styles.timeValue}>{formatTime(log.wakeTime)}</span>
        </div>
      </div>

      {(qualityLabel || moodLabel) && (
        <div className={styles.quality}>
          {qualityLabel ? (
            <span>
              Calidad: <strong>{qualityLabel}</strong>
            </span>
          ) : null}
          {qualityLabel && moodLabel ? <span> · </span> : null}
          {moodLabel ? (
            <span>
              Al despertar: <strong>{moodLabel}</strong>
            </span>
          ) : null}
        </div>
      )}

      {log.notes && <p className={styles.notes}>{log.notes}</p>}

      <div className={styles.actions}>
        <Button size="sm" variant="ghost" onClick={() => onEdit(log)}>
          Editar
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => onDelete(log.id)}
          disabled={deleteLoading}
          isLoading={deleteLoading}
        >
          Eliminar
        </Button>
      </div>
    </Card>
  )
}
