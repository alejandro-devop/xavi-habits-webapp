import { useState } from 'react'
import type { VidaNight, VidaNightLog } from '@/features/vida/utils/vida-night.utils'
import {
  VIDA_NIGHT_SAME_TIME_ERROR,
  crossesMidnight,
  describeDiffToPlanned,
  describeLoggedNightKind,
  describeNightSpan,
  diffToPlannedMinutes,
  formatNightDuration,
  formatNightTime,
  isSameNightTime,
  nightDurationMinutes,
} from '@/features/vida/utils/vida-night.utils'
import { isValidHhMm, normalizeTimeForDisplay } from '@/features/vida/utils/vida-time.utils'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import styles from './VidaNightSheet.module.scss'

/** La pregunta, escrita una sola vez: la dicen la hoja y quien la abre. */
export const VIDA_NIGHT_SHEET_QUESTION = '¿Cómo dormiste?'

export type VidaNightSheetProps = {
  open: boolean
  onClose: () => void
  /** La fecha del día en que **te levantas**: la clave de lo guardado (294). */
  date: string
  /** La noche **planeada** de esos ajustes: es lo que se prellena (291). */
  night: VidaNight
  /** Lo ya guardado, si se viene a corregir desde la franja (criterio 298). */
  log?: VidaNightLog | null
  /** Guarda en el aparato. No devuelve nada: aquí no hay API que pueda fallar. */
  onSave: (log: { bedTime: string | null; wakeTime: string | null }) => void
}

/**
 * **«¿Cómo dormiste?»** (FEAT-012, tajada 3, criterios 291 a 293, 298 y 299).
 *
 * El momento A5 del render aprobado `docs/vida/assets/13-vida-dormir.html`: dos
 * horas, la duración, la diferencia con lo planeado y el «No sé a qué hora».
 *
 * **Molde: `VidaStartTimeSheet`** —la hoja corta de FEAT-013— carácter a
 * carácter: `SteppedModal` con `ds="aura"`, `mobileSheet`, `size="md"`, el
 * estado aquí dentro, una `key` por apertura que pone quien la monta, el fallo
 * leído dentro sin perder lo escrito, y **nada de mutaciones aquí**: recibe
 * `onSave`. La única diferencia de fondo es que lo que se guarda **no viaja al
 * API**: se queda en este aparato, y la hoja lo dice (criterio 299).
 *
 * **Dos horas prellenadas con lo planeado**, así que la corrección más común
 * —«me acosté veinte minutos más tarde»— es tocar un campo y guardar. Al venir
 * a corregir algo ya guardado, lo que se prellena es **lo guardado** (298).
 *
 * **Nada de juicio y ninguna cuenta para el usuario** (criterios 292 y 293): se
 * dice cuánto durmió y en qué se diferencia de su noche, en minutos y con
 * dirección, y se dice si la noche cruzó la medianoche o no. Ni «poco», ni
 * «mal», ni «deberías», y no se pregunta ningún porqué.
 *
 * **Y no se inventa una hora para cuadrar**: «No sé a qué hora» deja ese lado
 * sin dato y se guarda lo que sí se sabe (criterio 303).
 */
export function VidaNightSheet({ open, onClose, date, night, log, onSave }: VidaNightSheetProps) {
  const saved = log ?? null
  const [bedTime, setBedTime] = useState(
    normalizeTimeForDisplay(saved?.bedTime ?? night.bedTime),
  )
  const [wakeTime, setWakeTime] = useState(
    normalizeTimeForDisplay(saved?.wakeTime ?? night.wakeTime),
  )
  // «Sin dato» es un estado del dato, no un campo vacío: se guarda `null` a
  // propósito y por eso se guarda aparte de lo escrito — quien lo desmarca
  // recupera lo que tenía puesto sin volver a escribirlo.
  const [bedUnknown, setBedUnknown] = useState(saved !== null && saved.bedTime === null)
  const [wakeUnknown, setWakeUnknown] = useState(saved !== null && saved.wakeTime === null)
  const [formError, setFormError] = useState<string | null>(null)

  const effectiveBed = bedUnknown ? null : bedTime
  const effectiveWake = wakeUnknown ? null : wakeTime

  const minutes = nightDurationMinutes(effectiveBed, effectiveWake)
  const plannedMinutes = nightDurationMinutes(night.bedTime, night.wakeTime)
  const diff = describeDiffToPlanned(diffToPlannedMinutes(minutes, plannedMinutes))
  const kind = describeLoggedNightKind(effectiveBed, effectiveWake, date)

  function handleSave() {
    if (bedUnknown && wakeUnknown) {
      setFormError(
        'Sin ninguna de las dos horas no hay nada que guardar. Puedes cerrar y dejarlo sin confirmar.',
      )
      return
    }
    if (!bedUnknown && !isValidHhMm(bedTime)) {
      setFormError('Falta la hora a la que te acostaste, o marca que no la sabes.')
      return
    }
    if (!wakeUnknown && !isValidHhMm(wakeTime)) {
      setFormError('Falta la hora a la que te levantaste, o marca que no la sabes.')
      return
    }
    // **La misma vara que Ajustes** (criterio 263): una noche de cero minutos no
    // es una noche, y guardarla dejaría un «confirmado» con duración «—». La
    // regla y el mensaje son los de `vida-night.utils.ts`, no una segunda copia.
    if (isSameNightTime(effectiveBed, effectiveWake)) {
      setFormError(VIDA_NIGHT_SAME_TIME_ERROR)
      return
    }
    setFormError(null)
    onSave({ bedTime: effectiveBed, wakeTime: effectiveWake })
    onClose()
  }

  const footer = (
    <div className={styles.footer}>
      <Button variant="secondary" size="sm" onClick={onClose}>
        Volver
      </Button>
      <Button variant="primary" size="sm" onClick={handleSave}>
        Guardar
      </Button>
    </div>
  )

  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title={VIDA_NIGHT_SHEET_QUESTION}
      description={`${describeNightSpan(date, crossesMidnight(night))} · tu noche dice ${formatNightTime(night.bedTime)} → ${formatNightTime(night.wakeTime)}`}
      size="md"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.form}>
        <div className={styles.inputs}>
          <label className={styles.field} htmlFor="vida-night-bed">
            <span className={styles.lbl}>Te acostaste</span>
            <Input
              id="vida-night-bed"
              type="time"
              value={bedUnknown ? '' : bedTime}
              disabled={bedUnknown}
              onChange={(event) => {
                setBedTime(event.target.value)
                setFormError(null)
              }}
            />
          </label>
          <label className={styles.field} htmlFor="vida-night-wake">
            <span className={styles.lbl}>Te levantaste</span>
            <Input
              id="vida-night-wake"
              type="time"
              value={wakeUnknown ? '' : wakeTime}
              disabled={wakeUnknown}
              onChange={(event) => {
                setWakeTime(event.target.value)
                setFormError(null)
              }}
            />
          </label>
        </div>

        {/* Lo que se acaba de contar, sin calificarlo (criterio 292). Con una
            hora sin dato no hay duración que decir y no se pinta: «—» dentro de
            una frase sería una cifra inventada a medias. */}
        {minutes !== null ? (
          <p className={styles.hint}>
            Dormiste {formatNightDuration(minutes)}
            {diff ? ` · ${diff.charAt(0).toLowerCase()}${diff.slice(1)}` : ''}
          </p>
        ) : null}

        {/* Criterio 293: si cruzó la medianoche o no, dicho con los días, para
            que el usuario no haga ninguna cuenta. */}
        {kind ? <p className={styles.kind}>{kind}</p> : null}

        <div className={styles.unknown}>
          <span className={styles.lbl}>Si no lo tienes claro</span>
          <div className={styles.chips}>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={bedUnknown}
              onClick={() => {
                setBedUnknown((value) => !value)
                setFormError(null)
              }}
            >
              No sé a qué hora me acosté
            </button>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={wakeUnknown}
              onClick={() => {
                setWakeUnknown((value) => !value)
                setFormError(null)
              }}
            >
              No sé a qué hora me levanté
            </button>
          </div>
          <p className={styles.hint}>
            Se guarda lo que sí sabes y lo otro queda sin dato. No se inventa una hora para cuadrar.
          </p>
        </div>

        {formError ? (
          <p className={styles.error} role="alert">
            {formError}
          </p>
        ) : null}

        {/* Lo mismo que ya se dice en FEAT-004 con las notas: esto no viaja. */}
        <p className={styles.device}>Esto se queda en este dispositivo: no viaja a otro.</p>
      </div>
    </SteppedModal>
  )
}
