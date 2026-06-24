import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'

interface SleepEmptyStateProps {
  onAdd: () => void
}

export function SleepEmptyState({ onAdd }: SleepEmptyStateProps) {
  return (
    <EmptyState
      title="Sin registros de sueño"
      description="Registra tu primera sesión de sueño para comenzar el seguimiento."
      action={
        <Button variant="primary" onClick={onAdd}>
          Registrar sueño
        </Button>
      }
    />
  )
}
