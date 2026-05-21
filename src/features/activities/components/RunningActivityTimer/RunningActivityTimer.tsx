import type { RunningActivitySession } from '@/features/activities/types/activity-followup.types'
import { useElapsedTimer } from '@/features/activities/hooks/useElapsedTimer'
import { isoToLocalTime } from '@/features/activities/utils/activity-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import styles from './RunningActivityTimer.module.scss'

type RunningActivityTimerProps = {
  session: RunningActivitySession
  onFinish: () => void
  onCancel: () => void
  loading?: boolean
}

export function RunningActivityTimer({
  session,
  onFinish,
  onCancel,
  loading = false,
}: RunningActivityTimerProps) {
  const elapsed = useElapsedTimer(session.startedAt)
  const accentColor = session.categoryColor ?? 'var(--color-primary)'

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span
          className={styles.iconWrap}
          style={{
            color: accentColor,
            borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
            background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
          }}
          aria-hidden
        >
          <AppIcon name={session.categoryIcon ?? 'clock'} size="md" decorative />
        </span>
        <div className={styles.headText}>
          <span className={styles.label}>En curso</span>
          <h3 className={styles.title}>{session.activityTitle}</h3>
          {session.categoryName ? (
            <span className={styles.category}>{session.categoryName}</span>
          ) : null}
        </div>
        <span className={styles.timer} aria-live="polite">
          {elapsed}
        </span>
      </div>

      {session.notes ? <p className={styles.notes}>{session.notes}</p> : null}

      <p className={styles.started}>
        Inicio: <strong>{isoToLocalTime(session.startedAt)}</strong>
      </p>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onFinish} disabled={loading}>
          Finalizar
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </Card>
  )
}
