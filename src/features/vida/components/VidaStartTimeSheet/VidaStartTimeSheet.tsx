import { useState } from 'react'
import { useActivityDayFollowUpsQuery } from '@/features/vida/hooks/useActivityFollowUps'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import {
  elapsedMinutes,
  sessionStartInstant,
  validateCorrectedStart,
} from '@/features/vida/utils/vida-session.utils'
import {
  formatDurationMinutes,
  formatTimeForDisplay,
  normalizeTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import styles from './VidaStartTimeSheet.module.scss'

/** La pregunta, una sola vez: la dicen el menú del bloque, la barra y la hoja. */
export const VIDA_START_TIME_QUESTION = '¿A qué hora empezaste?'

/** Lo que se lee en el «···» y en el menú de la barra (criterio 342). */
export const VIDA_START_TIME_LABEL = 'Empecé antes'

type VidaStartTimeSheetProps = {
  open: boolean
  onClose: () => void
  /** La sesión **en marcha** cuyo inicio se corrige. */
  session: ActivityFollowUp
  /**
   * Guarda. **Resuelve, no lanza** (el molde de `VidaNoteSheet`): si falla, la
   * hoja se queda abierta con la hora escrita y el fallo se lee dentro, y la
   * sesión sigue en marcha con su hora de antes (criterio 348).
   */
  onSave: (startTime: string) => Promise<{ ok: boolean; message?: string }> | void
}

/**
 * **Corregir desde cuándo cuenta lo que está en marcha** (FEAT-013, tajada 2,
 * criterios 342 a 348): una pregunta, un campo y «Guardar».
 *
 * Quien llega aquí pulsó «Empezar» tarde y se da cuenta al rato. **Eso no es un
 * fallo**: la hoja no dice «olvidaste» ni «tarde», dice qué va a contar a partir
 * de ahora (criterio 359).
 *
 * **Molde: `VidaNoteSheet`** —la otra hoja corta de la sesión—: `SteppedModal`
 * con `ds="aura"`, `mobileSheet`, `size="md"`, el estado aquí dentro, una `key`
 * por apertura que pone quien la monta, y el fallo leído dentro sin perder lo
 * escrito. **No muta nada**: recibe `onSave`, igual que allí.
 *
 * **Por qué una hoja propia y no el modo `edit` de `VidaLogSessionSheet`**: ese
 * modo pregunta hora **y duración** y manda las dos (`editSessionInput`), y una
 * duración cierra la sesión (`isOpen = duration_minutes === null`). Aquí lo que
 * viaja es **`{ id, startTime }` y nada más** (criterio 343), así que la sesión
 * sigue abierta y el cronómetro sigue corriendo.
 *
 * **La única consulta que hace** es la del día de la sesión —ya cacheada cuando
 * se llega desde Hoy—, y solo mientras está montada: sirve para no meter el
 * inicio dentro de un rato que ya tiene dueño, que el servidor **no** comprueba
 * (el `UPDATE` acepta lo que le llegue).
 */
export function VidaStartTimeSheet({ open, onClose, session, onSave }: VidaStartTimeSheetProps) {
  const [startTime, setStartTime] = useState(normalizeTimeForDisplay(session.startTime))
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const dayFollowUps = useActivityDayFollowUpsQuery(session.date)

  const title = session.activity?.title ?? 'lo que tienes en marcha'
  // Lo que llevaría contado si se guarda esa hora. Es una descripción de lo que
  // va a pasar, no una advertencia; con una hora imposible no se pinta, porque
  // el aviso de debajo ya dice lo que hay.
  const now = new Date()
  const instant = sessionStartInstant(session.date, startTime)
  // Con una hora que **todavía no ha llegado** no se cuenta nada: decir
  // «llevarías 1 min» de algo que no ha pasado sería inventar un dato. Ahí
  // manda la línea neutra, y al guardar lo dice la validación.
  const previewMinutes =
    instant && instant.getTime() <= now.getTime() ? elapsedMinutes(instant, now) : null

  /**
   * **Los ratos del día, esperados si hacen falta** (hallazgo del revisor de la
   * tajada 2). Con la consulta en vuelo, `data` es `undefined` y la
   * comprobación de solape no se haría: desde Hoy la ventana es de milisegundos
   * —ya está cacheada—, pero desde cualquier otra pantalla del módulo es real.
   * Así que si está viniendo, **se espera**; si está parada (sin sesión de
   * usuario, o ya falló) no hay nada que esperar y se sigue, que es lo que dice
   * el criterio 358: no bloquear por una consulta caída.
   */
  async function resolveDaySessions(): Promise<ActivityFollowUp[]> {
    if (dayFollowUps.data) return dayFollowUps.data
    if (dayFollowUps.fetchStatus === 'idle') return []
    const refetched = await dayFollowUps.refetch()
    return refetched.data ?? []
  }

  async function handleSave() {
    setIsSaving(true)
    const daySessions = await resolveDaySessions()
    const result = validateCorrectedStart({
      session,
      startTime,
      now: new Date(),
      daySessions,
    })
    if (!result.valid) {
      setIsSaving(false)
      setFormError(result.message)
      return
    }
    setFormError(null)
    const saved = await onSave(startTime)
    setIsSaving(false)
    if (saved && !saved.ok) {
      setFormError(saved.message ?? 'No pudimos guardarlo. Inténtalo otra vez.')
      return
    }
    onClose()
  }

  const footer = (
    <div className={styles.footer}>
      <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
        Volver
      </Button>
      <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  )

  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title={VIDA_START_TIME_QUESTION}
      description={`${title} · en marcha desde las ${formatTimeForDisplay(session.startTime)}`}
      size="md"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.form}>
        <label className={styles.field} htmlFor="vida-start-time">
          <Input
            id="vida-start-time"
            type="time"
            value={startTime}
            // El título de la hoja ya hace la pregunta; esto es lo que lee un
            // lector de pantalla al llegar al campo, y no puede repetir la
            // misma cadena o habría dos cosas con el mismo nombre.
            aria-label="Hora a la que empezaste"
            disabled={isSaving}
            onChange={(event) => {
              setStartTime(event.target.value)
              setFormError(null)
            }}
          />
        </label>
        {/* Qué va a pasar: **sigue en marcha**, solo cambia desde cuándo se
            cuenta. Nadie tiene que deducirlo del botón. */}
        <p className={styles.hint}>
          {previewMinutes !== null && formError === null
            ? `Sigue en marcha y llevarías ${formatDurationMinutes(previewMinutes)}.`
            : 'Sigue en marcha: solo cambia desde cuándo contamos.'}
        </p>

        {formError ? (
          <p className={styles.error} role="alert">
            {formError}
          </p>
        ) : null}

        {/* El fallo del API, cuando lo hay: la hoja no se cierra y la sesión
            sigue con su hora de antes (criterio 348). */}
        {dayFollowUps.isError ? (
          <Alert variant="warning">
            No pudimos mirar el resto del día. Puedes guardar igual: solo cambia desde cuándo
            contamos esto.
          </Alert>
        ) : null}
      </div>
    </SteppedModal>
  )
}
