import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'

type ActivityEmptyStateProps = {
  onCreate: () => void
  hasFilters?: boolean
}

export function ActivityEmptyState({ onCreate, hasFilters = false }: ActivityEmptyStateProps) {
  return (
    <EmptyState
      title={hasFilters ? 'Sin resultados' : 'Sin actividades'}
      description={
        hasFilters
          ? 'Prueba ajustando los filtros o la búsqueda.'
          : 'Crea tu primera actividad para empezar a organizar tu día.'
      }
      icon={<AppIcon name="list-check" size="lg" decorative />}
      action={
        hasFilters ? null : (
          <Button type="button" onClick={onCreate}>
            Crear actividad
          </Button>
        )
      }
    />
  )
}
