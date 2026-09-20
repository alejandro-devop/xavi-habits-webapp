import { useState } from 'react'
import type { PickedActivity } from '@/features/vida/components/VidaActivityPicker'
import { VidaActivityPicker } from '@/features/vida/components/VidaActivityPicker'
import { VidaDurationPills } from '@/features/vida/components/VidaDurationPills'
import {
  useCreateActivityFollowUpMutation,
  useUpdateActivityFollowUpMutation,
} from '@/features/vida/hooks/useActivityFollowUps'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import { formatDayHeading } from '@/features/vida/utils/vida-date.utils'
import {
  editSessionInput,
  logSessionInput,
  validateLogPast,
} from '@/features/vida/utils/vida-session.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
  normalizeTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import styles from './VidaLogSessionSheet.module.scss'

/**
 * Las tres puertas de esta hoja. Son una sola pantalla porque preguntan lo
 * mismo con distinto número de preguntas, no tres formularios parecidos.
 */
export type VidaLogSessionMode = 'start' | 'log' | 'edit'

type VidaLogSessionSheetProps = {
  open: boolean
  onClose: () => void
  mode: VidaLogSessionMode
  /** `YYYY-MM-DD` local del día en el que se registra. */
  date: string
  /** «viernes»: de qué día es la plantilla que se ofrece primero. */
  dayLabel: string
  /** La plantilla de ese día, para que el «qué» empiece por ahí. */
  suggestions: VidaSuggestion[]
  /** La hora de la que parte «a qué hora empezó». */
  defaultStartTime: string
  /** Hora y duración **ya puestas** (lo usará el «¿Qué pasó?» de la tajada 4). */
  initial?: { startTime?: string; durationMinutes?: number } | null
  /** La sesión que se corrige, en el modo `edit` (criterio 35). */
  session?: ActivityFollowUp | null
  /**
   * «Empezar algo» arranca **ahora mismo** y eso lo orquesta
   * `useVidaSessionActions` —que además cierra lo que hubiera en marcha (D4)—,
   * así que la hoja no llama a ninguna mutación en ese modo: pide el «qué» y
   * delega. Resuelve, no lanza.
   */
  onStart?: (activityId: string) => Promise<{ ok: boolean; message?: string }>
}

/**
 * **Registrar lo que se sale del plan** (criterios 30, 31 y 35): una hoja, tres
 * modos.
 *
 * - **`start` — «Empezar algo»**: solo **qué**. Arranca la sesión ahora mismo y
 *   **no pide duración**, porque una sesión abierta no la tiene (criterio 30).
 * - **`log` — «Registrar tiempo pasado»**: **qué · a qué hora empezó · cuánto
 *   duró**, con las píldoras 15 · 30 · 45 · 1h · libre, vía `activityFollowUpAdd`
 *   (criterio 31).
 * - **`edit` — corregir lo registrado**: hora, duración y notas de una sesión
 *   que ya existe, vía `activityFollowUpEdit` (criterio 35). El «qué» no se
 *   cambia: el API no admite mover una sesión de actividad, y fingir que sí
 *   sería quitarla y crear otra sin decirlo.
 *
 * **El «qué» es `VidaActivityPicker`**, el mismo que usa `VidaPlaceInGapSheet`
 * (criterio 38): no hay dos buscadores de actividad en el módulo.
 *
 * **Molde: `VidaPlaceInGapSheet`.** `SteppedModal` con `ds="aura"` y
 * `mobileSheet`, el estado aquí arriba, una **`key` por apertura** que pone
 * quien abre, y el cierre en el `onSuccess` **local** del `mutate`: si la
 * mutación falla, la hoja **se queda abierta con lo elegido** y el fallo se lee
 * dentro (criterio 36). Como no hay escritura optimista, tampoco puede quedar
 * una sesión fantasma en la agenda.
 *
 * **Esto no toca el plan** (criterio 37): aquí no se nombra ni una mutación de
 * `activityDayPlan`. Lo real va encima; el plan se queda quieto.
 */
export function VidaLogSessionSheet({
  open,
  onClose,
  mode,
  date,
  dayLabel,
  suggestions,
  defaultStartTime,
  initial = null,
  session = null,
  onStart,
}: VidaLogSessionSheetProps) {
  const createMutation = useCreateActivityFollowUpMutation()
  const editMutation = useUpdateActivityFollowUpMutation()

  const [chosen, setChosen] = useState<PickedActivity | null>(null)
  const [startTime, setStartTime] = useState<string>(
    session
      ? normalizeTimeForDisplay(session.startTime)
      : (initial?.startTime ?? normalizeTimeForDisplay(defaultStartTime)),
  )
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    session?.durationMinutes ?? initial?.durationMinutes ?? null,
  )
  const [notes, setNotes] = useState(session?.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const isPending = createMutation.isPending || editMutation.isPending || isStarting
  const sessionTitle = session?.activity?.title ?? 'Actividad'

  function chooseActivity(activity: PickedActivity, templateMinutes: number | null) {
    setChosen(activity)
    setFormError(null)
    // Lo que la plantilla dice que dura viene puesto y se puede cambiar. En
    // «Empezar algo» no se mira: ahí no hay duración que elegir.
    if (mode === 'log' && durationMinutes === null && templateMinutes !== null) {
      setDurationMinutes(templateMinutes)
    }
  }

  async function handleStart() {
    if (!chosen) {
      setFormError('Elige qué vas a empezar.')
      return
    }
    if (!onStart) return
    setFormError(null)
    setIsStarting(true)
    const result = await onStart(chosen.id)
    setIsStarting(false)
    // Si no se pudo, la hoja **no se cierra** y lo elegido sigue aquí.
    if (!result.ok) {
      setFormError(result.message ?? 'No pudimos empezarla. Inténtalo otra vez.')
      return
    }
    onClose()
  }

  function handleLog() {
    if (!chosen) {
      setFormError('Elige qué hiciste.')
      return
    }
    const result = validateLogPast({ date, startTime, durationMinutes, now: new Date() })
    if (!result.valid) {
      setFormError(result.message)
      return
    }
    setFormError(null)
    createMutation.mutate(
      logSessionInput({
        date,
        activityId: chosen.id,
        startTime,
        durationMinutes: durationMinutes!,
      }),
      { onSuccess: onClose },
    )
  }

  function handleEdit() {
    if (!session) return
    const result = validateLogPast({ date, startTime, durationMinutes, now: new Date() })
    if (!result.valid) {
      setFormError(result.message)
      return
    }
    setFormError(null)
    editMutation.mutate(
      editSessionInput({
        id: session.id,
        startTime,
        durationMinutes: durationMinutes!,
        notes,
      }),
      { onSuccess: onClose },
    )
  }

  const title =
    mode === 'start'
      ? 'Empezar algo'
      : mode === 'edit'
        ? `Corregir «${sessionTitle}»`
        : 'Registrar tiempo pasado'

  const description =
    mode === 'start'
      ? 'Arranca ahora mismo. Cuando termines nos dices cuánto duró.'
      : mode === 'edit'
        ? 'Cambia la hora, cuánto duró o lo que quieras recordar de ese rato.'
        : `Algo que ya hiciste el ${formatDayHeading(date).toLowerCase()}, esté o no en tu plan.`

  const submitLabel = mode === 'start' ? 'Empezar' : mode === 'edit' ? 'Guardar' : 'Registrar'

  const footer = (
    <div className={styles.footer}>
      <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
        Volver
      </Button>
      <Button
        type="button"
        isLoading={isPending}
        disabled={isPending || (mode !== 'edit' && chosen === null)}
        onClick={mode === 'start' ? handleStart : mode === 'edit' ? handleEdit : handleLog}
      >
        {submitLabel}
      </Button>
    </div>
  )

  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.form}>
        {mode === 'edit' ? (
          // Corrigiendo, el «qué» no se pregunta: se recuerda.
          <p className={styles.editing}>
            <AppIcon
              name={session?.activity?.category?.icon ?? UNCATEGORIZED_GROUP_ICON}
              size="2xs"
              decorative
            />
            <span className={styles.editingName}>{sessionTitle}</span>
          </p>
        ) : (
          <VidaActivityPicker
            className={styles.block}
            headingId="vida-log-what"
            value={chosen}
            onChange={chooseActivity}
            suggestions={suggestions}
            dayLabel={dayLabel}
            disabled={isPending}
          />
        )}

        {mode !== 'start' ? (
          <>
            <section className={styles.block} aria-labelledby="vida-log-when">
              <h3 className={styles.legend} id="vida-log-when">
                A qué hora empezó
              </h3>
              <label className={styles.custom} htmlFor="vida-log-start">
                <Input
                  id="vida-log-start"
                  type="time"
                  value={startTime}
                  // El rótulo de la sección ya lo dice; esto es lo que lee un
                  // lector de pantalla al llegar al campo, y no puede repetir
                  // la misma cadena o habría dos cosas con el mismo nombre.
                  aria-label="Hora a la que empezó"
                  disabled={isPending}
                  onChange={(event) => {
                    setStartTime(event.target.value)
                    setFormError(null)
                  }}
                />
              </label>
            </section>

            <section className={styles.block} aria-labelledby="vida-log-how-long">
              <h3 className={styles.legend} id="vida-log-how-long">
                Cuánto duró
              </h3>
              <VidaDurationPills
                label="Cuánto duró"
                value={durationMinutes}
                disabled={isPending}
                onChange={(minutes) => {
                  setDurationMinutes(minutes)
                  setFormError(null)
                }}
              />
            </section>
          </>
        ) : null}

        {mode === 'edit' ? (
          <section className={styles.block} aria-labelledby="vida-log-notes">
            <h3 className={styles.legend} id="vida-log-notes">
              Notas
            </h3>
            <textarea
              className={styles.notes}
              value={notes}
              rows={3}
              maxLength={2000}
              disabled={isPending}
              placeholder="Lo que quieras recordar de este rato."
              aria-label="Notas de esta sesión"
              onChange={(event) => setNotes(event.target.value)}
            />
          </section>
        ) : null}

        {/* Lo que va a quedar registrado, dicho antes de guardarlo. Solo cuando
            las preguntas están resueltas: antes sería una cuenta sobre algo que
            todavía no existe. */}
        {mode === 'log' && chosen && durationMinutes !== null ? (
          <p className={styles.preview}>
            <strong className={styles.previewLine}>
              {chosen.title} · {formatTimeForDisplay(startTime)} ·{' '}
              {formatDurationFromMinutes(durationMinutes)}
            </strong>
            Se apunta encima de tu día. Tu plan se queda como está.
          </p>
        ) : null}

        {formError ? (
          <p className={styles.error} role="alert">
            {formError}
          </p>
        ) : null}

        {createMutation.isError || editMutation.isError ? (
          <Alert variant="danger">
            {mode === 'edit'
              ? 'No pudimos guardar el cambio. Vuelve a intentarlo; lo que escribiste sigue aquí.'
              : 'No pudimos registrarlo. Vuelve a intentarlo; lo que elegiste sigue aquí.'}
          </Alert>
        ) : null}
      </div>
    </SteppedModal>
  )
}
