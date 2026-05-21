import { formatSpentMinutes } from '@/features/activities/utils/activity-date'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'
import styles from './ActivityTimeTrackingPlaceholder.module.scss'

type ActivityTimeTrackingPlaceholderProps = {
  spentTimeMinutes: number
}

export function ActivityTimeTrackingPlaceholder({
  spentTimeMinutes,
}: ActivityTimeTrackingPlaceholderProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Seguimiento de tiempo</h2>
        <Badge variant="neutral">Próximamente</Badge>
      </div>
      <p className={styles.text}>
        En la próxima fase podrás registrar follow-ups y ver el historial de tiempo por actividad.
      </p>
      <p className={styles.stat}>
        Tiempo acumulado: <strong>{formatSpentMinutes(spentTimeMinutes)}</strong>
      </p>
    </Card>
  )
}
