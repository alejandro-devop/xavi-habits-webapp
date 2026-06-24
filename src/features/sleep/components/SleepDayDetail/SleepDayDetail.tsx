import { Button } from '@/shared/ui/Button'
import type { SleepLog } from '@/features/sleep/types/sleep.types'
import {
  formatDuration,
  formatTime,
  getQualityColor,
  getMonthName,
  MOOD_LABELS,
  QUALITY_LABELS,
} from '@/features/sleep/utils/sleep-month.utils'
import styles from './SleepDayDetail.module.scss'

interface SleepDayDetailProps {
  day: number | null
  month: number
  year: number
  log: SleepLog | undefined
  onAdd: (date: string) => void
  onEdit: (log: SleepLog) => void
}

export function SleepDayDetail({ day, month, year, log, onAdd, onEdit }: SleepDayDetailProps) {
  if (day === null) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyHint}>Selecciona un día en el calendario para ver el detalle.</p>
      </div>
    )
  }

  const dateLabel = `${day} de ${getMonthName(month)} ${year}`
  const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  if (!log) {
    return (
      <div className={styles.noLog}>
        <p className={styles.dateLabel}>{dateLabel}</p>
        <p className={styles.noLogText}>Sin registro de sueño para este día.</p>
        <Button size="sm" variant="primary" onClick={() => onAdd(dateValue)}>
          Registrar
        </Button>
      </div>
    )
  }

  const color = getQualityColor(log.quality)
  const bedtimePct = (new Date(log.bedtime).getHours() * 60 + new Date(log.bedtime).getMinutes()) / (24 * 60)
  const wakePct = (new Date(log.wakeTime).getHours() * 60 + new Date(log.wakeTime).getMinutes()) / (24 * 60)

  const barStart = bedtimePct > wakePct ? bedtimePct : bedtimePct
  const barEnd = bedtimePct > wakePct ? 1 : wakePct
  const barStartPct = `${(barStart * 100).toFixed(1)}%`
  const barWidthPct = `${((barEnd - barStart) * 100).toFixed(1)}%`

  return (
    <div className={styles.detail}>
      <p className={styles.dateLabel}>{dateLabel}</p>

      <div className={styles.duration} style={{ color }}>
        {formatDuration(log.durationMinutes)}
      </div>

      <div className={styles.badges}>
        {log.quality && (
          <span className={styles.badge} style={{ background: `${color}20`, color }}>
            {QUALITY_LABELS[log.quality]}
          </span>
        )}
        {log.moodOnWaking && (
          <span className={styles.badgeGray}>
            {MOOD_LABELS[log.moodOnWaking]}
          </span>
        )}
      </div>

      <div className={styles.times}>
        <span className={styles.timeRow}>
          <span className={styles.timeIcon}>🌙</span>
          <span>{formatTime(log.bedtime)}</span>
        </span>
        <div className={styles.timeBar}>
          <div className={styles.timeBarTrack}>
            <div
              className={styles.timeBarFill}
              style={{ left: barStartPct, width: barWidthPct, background: color }}
            />
          </div>
        </div>
        <span className={styles.timeRow}>
          <span className={styles.timeIcon}>☀️</span>
          <span>{formatTime(log.wakeTime)}</span>
        </span>
      </div>

      {log.notes && <p className={styles.notes}>{log.notes}</p>}

      <div className={styles.actions}>
        <Button size="sm" variant="ghost" onClick={() => onEdit(log)}>
          Editar
        </Button>
      </div>
    </div>
  )
}
