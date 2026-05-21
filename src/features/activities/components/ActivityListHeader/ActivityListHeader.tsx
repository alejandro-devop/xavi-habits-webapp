import { Button } from '@/shared/ui/Button'
import styles from './ActivityListHeader.module.scss'

type ActivityListHeaderProps = {
  total?: number
  onCreate: () => void
}

export function ActivityListHeader({ total, onCreate }: ActivityListHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <h2 className={styles.title}>Tus actividades</h2>
        {total !== undefined ? (
          <p className={styles.meta}>{total} actividad{total === 1 ? '' : 'es'}</p>
        ) : null}
      </div>
      <Button type="button" className={styles.createBtn} onClick={onCreate}>
        Nueva actividad
      </Button>
    </div>
  )
}
