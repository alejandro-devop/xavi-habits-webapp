import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'

type ActivityCategoryEmptyStateProps = {
  onCreate: () => void
}

export function ActivityCategoryEmptyState({ onCreate }: ActivityCategoryEmptyStateProps) {
  return (
    <EmptyState
      title="Sin categorías"
      description="Crea tu primera categoría para organizar actividades."
      icon={<AppIcon name="list-check" size="lg" decorative />}
      action={
        <Button type="button" onClick={onCreate}>
          Crear categoría
        </Button>
      }
    />
  )
}
