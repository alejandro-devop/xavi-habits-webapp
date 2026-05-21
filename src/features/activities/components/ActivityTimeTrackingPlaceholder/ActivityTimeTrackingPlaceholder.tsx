import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { formatSpentMinutes } from '@/features/activities/utils/activity-date'
import { Button } from '@/shared/ui/Button'
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
      </div>
      <p className={styles.text}>
        Registra bloques de tiempo por día en la timeline del módulo de actividades.
      </p>
      <p className={styles.stat}>
        Tiempo acumulado: <strong>{formatSpentMinutes(spentTimeMinutes)}</strong>
      </p>
      <Button variant="secondary" to={activitiesPaths.tracking}>
        Ir a seguimiento de tiempo
      </Button>
    </Card>
  )
}
