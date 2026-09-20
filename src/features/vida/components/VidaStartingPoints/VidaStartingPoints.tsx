import { useState } from 'react'
import {
  getRecommendedStartingPointIds,
  VIDA_STARTING_POINTS,
  type VidaStartingPoint,
} from '@/features/vida/data/vida-starting-points'
import {
  useCreateStartingActivities,
  type StartingActivityFailure,
} from '@/features/vida/hooks/useCreateStartingActivities'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import styles from './VidaStartingPoints.module.scss'

/**
 * El primer minuto: sin nada creado no hay formulario, hay puntos de partida.
 * Se tocan los propios y existen, con su categoría ya puesta.
 */
export function VidaStartingPoints() {
  const [selectedIds, setSelectedIds] = useState<string[]>(getRecommendedStartingPointIds)
  const [failed, setFailed] = useState<StartingActivityFailure[]>([])
  const createStarting = useCreateStartingActivities()

  const selectedCount = selectedIds.length
  // `isPending` cierra el botón mientras crea: una doble pulsación no duplica.
  const isCreating = createStarting.isPending

  function toggle(point: VidaStartingPoint) {
    setSelectedIds((current) =>
      current.includes(point.id)
        ? current.filter((id) => id !== point.id)
        : [...current, point.id],
    )
  }

  function handleCreate() {
    if (selectedCount === 0 || isCreating) return
    const points = VIDA_STARTING_POINTS.filter((point) => selectedIds.includes(point.id))

    setFailed([])
    createStarting.mutate(points, {
      onSuccess: (result) => {
        setFailed(result.failed)
        // Lo creado deja de estar marcado; lo que falló sigue ahí para reintentar.
        const createdTitles = new Set(result.created.map((activity) => activity.title))
        setSelectedIds((current) =>
          current.filter((id) => {
            const point = VIDA_STARTING_POINTS.find((candidate) => candidate.id === id)
            return point ? !createdTitles.has(point.title) : false
          }),
        )
      },
    })
  }

  return (
    <section className={styles.root} aria-labelledby="vida-starting-points-title">
      <p id="vida-starting-points-title" className={styles.lead}>
        Empieza con las que casi todo el mundo hace. <b>Toca las tuyas</b> — luego las ajustas.
      </p>

      <ul className={styles.points}>
        {VIDA_STARTING_POINTS.map((point) => {
          const isSelected = selectedIds.includes(point.id)
          return (
            <li key={point.id}>
              <button
                type="button"
                className={[styles.point, isSelected ? styles.pointOn : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={isSelected}
                disabled={isCreating}
                onClick={() => toggle(point)}
              >
                <AppIcon name={point.icon} size="xs" decorative />
                <span className={styles.pointName}>{point.title}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {failed.length > 0 ? (
        <Alert variant="danger" title="Algunas no se pudieron crear">
          <ul className={styles.failures}>
            {failed.map((failure) => (
              <li key={failure.name}>
                <b>{failure.name}</b>: {failure.reason}
              </li>
            ))}
          </ul>
          <p className={styles.failuresNote}>
            Lo que sí se creó ya está en tu catálogo. Las demás siguen marcadas.
          </p>
        </Alert>
      ) : null}

      <div className={styles.actions}>
        <p className={styles.summary} aria-live="polite">
          {selectedCount === 0
            ? 'Toca las que hagas para empezar'
            : `${selectedCount} ${selectedCount === 1 ? 'elegida' : 'elegidas'} · con su categoría puesta`}
        </p>
        <Button
          onClick={handleCreate}
          disabled={selectedCount === 0 || isCreating}
          isLoading={isCreating}
        >
          {selectedCount === 0
            ? 'Crear'
            : selectedCount === 1
              ? 'Crear la 1'
              : `Crear las ${selectedCount}`}
        </Button>
      </div>

      <p className={styles.footnote}>
        Ejercicio, tareas y lo demás se enlazan después — no hace falta pensarlo ahora.
      </p>
    </section>
  )
}
