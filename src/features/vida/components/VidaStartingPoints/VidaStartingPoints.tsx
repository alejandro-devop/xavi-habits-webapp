import { useState } from 'react'
import {
  getRecommendedStartingPointIds,
  getScheduledRecommendedIds,
  getScheduledStartingPoints,
  VIDA_STARTING_POINTS,
  type VidaStartingPoint,
} from '@/features/vida/data/vida-starting-points'
import {
  useCreateStartingActivities,
  type StartingActivityFailure,
} from '@/features/vida/hooks/useCreateStartingActivities'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import { describeDaysPhrase } from '@/features/vida/utils/vida-template.utils'
import {
  formatDurationMinutes,
  formatTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import styles from './VidaStartingPoints.module.scss'

type VidaStartingPointsProps = {
  /**
   * **El primer minuto de la plantilla** (FEAT-005, criterio 36): con esta prop
   * se pintan **los seis puntos con hora**, el selector de días, el contador
   * «3 elegidas · de lunes a viernes» y «Ponerlas en mi plantilla», y cada
   * punto entra en la plantilla con su hora y su duración.
   *
   * **Sin ella el componente es exactamente el de FEAT-002** —los trece puntos,
   * «Crear las N», sin días y sin plantilla—, que es lo que sigue montando el
   * catálogo.
   */
  schedule?: { defaultDays: VidaDayOfWeek[] }
}

/**
 * El primer minuto: sin nada creado no hay formulario, hay puntos de partida.
 * Se tocan los propios y existen, con su categoría ya puesta.
 *
 * En la plantilla (`schedule`) el mismo cartel hace una cosa más: las pone **a
 * una hora**. Las horas que propone no son un compromiso y la pantalla lo dice
 * —«Horas de partida · las ajustas en un toque después»—, porque lo que el
 * render decide es que una plantilla vacía no pide «crea tu semana», pide **tu
 * mañana**.
 */
export function VidaStartingPoints({ schedule }: VidaStartingPointsProps = {}) {
  const scheduled = Boolean(schedule)
  const points = scheduled ? getScheduledStartingPoints() : [...VIDA_STARTING_POINTS]
  const [selectedIds, setSelectedIds] = useState<string[]>(
    scheduled ? getScheduledRecommendedIds : getRecommendedStartingPointIds,
  )
  const [days, setDays] = useState<VidaDayOfWeek[]>(schedule?.defaultDays ?? [])
  const [failed, setFailed] = useState<StartingActivityFailure[]>([])
  const createStarting = useCreateStartingActivities()

  const selectedCount = selectedIds.length
  // `isPending` cierra el botón mientras crea: una doble pulsación no duplica.
  const isCreating = createStarting.isPending
  const daysText = describeDaysPhrase(days)

  function toggle(point: VidaStartingPoint) {
    setSelectedIds((current) =>
      current.includes(point.id)
        ? current.filter((id) => id !== point.id)
        : [...current, point.id],
    )
  }

  function toggleDay(day: VidaDayOfWeek) {
    setDays((current) =>
      current.includes(day) ? current.filter((other) => other !== day) : [...current, day],
    )
  }

  function handleCreate() {
    if (selectedCount === 0 || isCreating) return
    // Sin ningún día no hay nada que poner: el API exige al menos uno.
    if (scheduled && days.length === 0) return
    const chosen = points.filter((point) => selectedIds.includes(point.id))

    setFailed([])
    createStarting.mutate(
      { points: chosen, ...(scheduled ? { schedule: { days } } : {}) },
      {
        onSuccess: (result) => {
          setFailed(result.failed)
          // Lo que quedó puesto deja de estar marcado; **lo que falló sigue
          // marcado** para reintentar solo eso (criterio 38).
          const placed = new Set(result.done)
          setSelectedIds((current) => current.filter((id) => !placed.has(id)))
        },
      },
    )
  }

  return (
    <section
      className={styles.root}
      // En la plantilla la frase de arriba —«No hace falta llenarla entera.
      // Empieza por tu mañana»— la pone la página, que es donde el render la
      // dibuja: repetirla aquí la diría dos veces.
      aria-label={scheduled ? 'Puntos de partida con hora' : undefined}
      aria-labelledby={scheduled ? undefined : 'vida-starting-points-title'}
    >
      {scheduled ? null : (
        <p id="vida-starting-points-title" className={styles.lead}>
          Empieza con las que casi todo el mundo hace. <b>Toca las tuyas</b> — luego las
          ajustas.
        </p>
      )}

      <ul className={scheduled ? styles.rows : styles.points}>
        {points.map((point) => {
          const isSelected = selectedIds.includes(point.id)
          return (
            <li key={point.id}>
              <button
                type="button"
                className={[
                  scheduled ? styles.row : styles.point,
                  isSelected ? (scheduled ? styles.rowOn : styles.pointOn) : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={isSelected}
                disabled={isCreating}
                onClick={() => toggle(point)}
              >
                {scheduled && point.startTime ? (
                  <span className={styles.rowTime}>{formatTimeForDisplay(point.startTime)}</span>
                ) : null}
                <AppIcon name={point.icon} size="xs" decorative />
                <span className={styles.pointName}>{point.title}</span>
                {scheduled && point.durationMinutes ? (
                  <span className={styles.rowDuration}>
                    {formatDurationMinutes(point.durationMinutes)}
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>

      {scheduled ? (
        <>
          <p className={styles.footnote}>Horas de partida · las ajustas en un toque después</p>
          <div className={styles.daysField}>
            <span className={styles.daysLabel} id="vida-starting-days-label">
              Qué días
            </span>
            <div className={styles.days} role="group" aria-labelledby="vida-starting-days-label">
              {VIDA_DAY_ORDER.map((day) => {
                const isOn = days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    className={[styles.day, isOn ? styles.dayOn : ''].filter(Boolean).join(' ')}
                    aria-pressed={isOn}
                    aria-label={VIDA_DAY_LABELS[day]}
                    disabled={isCreating}
                    onClick={() => toggleDay(day)}
                  >
                    <span aria-hidden>{VIDA_DAY_SHORT_LABELS[day]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : null}

      {failed.length > 0 ? (
        <Alert
          variant="danger"
          title={scheduled ? 'Algunas no se pudieron poner' : 'Algunas no se pudieron crear'}
        >
          <ul className={styles.failures}>
            {failed.map((failure) => (
              <li key={failure.name}>
                <b>{failure.name}</b>: {failure.reason}
              </li>
            ))}
          </ul>
          <p className={styles.failuresNote}>
            {scheduled
              ? 'Lo que sí entró ya está en tu plantilla. Las demás siguen marcadas para volver a intentarlo.'
              : 'Lo que sí se creó ya está en tu catálogo. Las demás siguen marcadas.'}
          </p>
        </Alert>
      ) : null}

      <div className={styles.actions}>
        <p className={styles.summary} aria-live="polite">
          {selectedCount === 0
            ? 'Toca las que hagas para empezar'
            : scheduled
              ? `${selectedCount} ${selectedCount === 1 ? 'elegida' : 'elegidas'}${
                  daysText ? ` · ${daysText}` : ' · elige algún día'
                }`
              : `${selectedCount} ${selectedCount === 1 ? 'elegida' : 'elegidas'} · con su categoría puesta`}
        </p>
        <Button
          onClick={handleCreate}
          disabled={selectedCount === 0 || isCreating || (scheduled && days.length === 0)}
          isLoading={isCreating}
        >
          {scheduled
            ? 'Ponerlas en mi plantilla'
            : selectedCount === 0
              ? 'Crear'
              : selectedCount === 1
                ? 'Crear la 1'
                : `Crear las ${selectedCount}`}
        </Button>
      </div>

      {/* En la plantilla la línea que quita presión —«un día sin plantilla se
          vive igual»— la pone la página **al final de todo**, como en el
          render: después de «Traer de tus actividades». */}
      {scheduled ? null : (
        <p className={styles.footnote}>
          Ejercicio, tareas y lo demás se enlazan después — no hace falta pensarlo ahora.
        </p>
      )}
    </section>
  )
}
