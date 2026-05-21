import { EmptyState } from '@/shared/ui/EmptyState'
import { Button } from '@/shared/ui/Button'

type ActivityTrackingEmptyStateProps = {
  onStart?: () => void
  onLogPast?: () => void
  hasRunningSession?: boolean
}

export function ActivityTrackingEmptyState({
  onStart,
  onLogPast,
  hasRunningSession = false,
}: ActivityTrackingEmptyStateProps) {
  const showActions = !hasRunningSession && (onStart || onLogPast)

  return (
    <EmptyState
      title="Sin registros este día"
      description={
        hasRunningSession
          ? 'Finaliza la actividad en curso para guardar el tiempo en la timeline.'
          : 'Inicia el cronómetro o registra un bloque de tiempo pasado con hora y duración.'
      }
      action={
        showActions ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {onStart ? (
              <Button variant="primary" onClick={onStart}>
                Iniciar nueva actividad
              </Button>
            ) : null}
            {onLogPast ? (
              <Button variant="secondary" onClick={onLogPast}>
                Registrar tiempo pasado
              </Button>
            ) : null}
          </div>
        ) : undefined
      }
    />
  )
}
