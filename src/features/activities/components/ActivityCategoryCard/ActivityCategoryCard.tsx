import type { ActivityCategory } from '@/features/activities/types/activity-category.types'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import styles from './ActivityCategoryCard.module.scss'

type ActivityCategoryCardProps = {
  category: ActivityCategory
  onEdit: (category: ActivityCategory) => void
  onDelete: (category: ActivityCategory) => void
  deleting?: boolean
}

export function ActivityCategoryCard({
  category,
  onEdit,
  onDelete,
  deleting = false,
}: ActivityCategoryCardProps) {
  const accent = category.color ?? 'var(--color-border)'

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span
          className={styles.iconWrap}
          style={{ backgroundColor: `${accent}22`, color: accent, borderColor: accent }}
          aria-hidden
        >
          {category.icon ? (
            <AppIcon name={category.icon} size="md" decorative />
          ) : (
            <AppIcon name="list-check" size="md" decorative />
          )}
        </span>
        <div className={styles.meta}>
          <h3 className={styles.name}>{category.name}</h3>
          <span className={styles.order}>Orden {category.orderIndex}</span>
        </div>
      </div>

      {category.description ? (
        <p className={styles.description}>{category.description}</p>
      ) : (
        <p className={styles.descriptionMuted}>Sin descripción</p>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(category)}>
          Editar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(category)}
          disabled={deleting}
        >
          Eliminar
        </Button>
      </div>
    </Card>
  )
}
