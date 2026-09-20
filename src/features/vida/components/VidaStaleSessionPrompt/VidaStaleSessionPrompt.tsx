import { useState } from 'react'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import {
  formatDayHeading,
  getCurrentLocalDate,
  parseYmdToLocalDate,
} from '@/features/vida/utils/vida-date.utils'
import {
  minutesUntilEndTime,
  resolveUnknownEndMinutes,
  type UnknownEndReason,
} from '@/features/vida/utils/vida-session.utils'
import {
  formatDurationMinutes,
  formatTimeForDisplay,
  isValidHhMm,
  normalizeTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import styles from './VidaStaleSessionPrompt.module.scss'

type VidaStaleSessionPromptProps = {
  session: ActivityFollowUp
  /** Lo que ese bloque tenía planeado aquel día, o `null` si no se sabe. */
  plannedMinutes: number | null
  /** La hora de fin del día, de los ajustes de Vida: el recorte del «No sé». */
  dayEndTime: string
  /** Cierra la sesión con esos minutos. Resuelve, no lanza. */
  onResolve: (params: {
    minutes: number
    reason: UnknownEndReason | 'typed'
  }) => Promise<{ ok: boolean; message?: string }>
}

/** «ayer» si lo fue, y si no «el martes 15»: nunca un «hace 3 días» vago. */
function describeWhen(date: string, today: string): string {
  const yesterday = new Date(parseYmdToLocalDate(today))
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date === `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  return isYesterday ? 'ayer' : `el ${formatDayHeading(date).toLowerCase()}`
}

/**
 * La sesión que quedó abierta **otro día** (D3, criterios 16 y 54).
 *
 * Lo que **no** se hace: pintar un cronómetro corriendo desde ayer. Catorce
 * horas en marcha no son un dato, son un error de la herramienta enseñado como
 * si fuera normal. Se pregunta: «Dejaste "X" en marcha ayer a las 21:00 · ¿hasta
 * qué hora la hiciste?».
 *
 * **«No sé» registra algo razonable y lo dice** (la hipótesis que resolvió el
 * arquitecto): la **duración planeada** de ese bloque y, si no la hay o hay
 * varios candidatos, **30 minutos** — nunca «hasta el fin del día», que en una
 * sesión abierta a las 9:00 inventaría catorce horas que nadie vivió y que se
 * quedarían en el presupuesto para siempre. Lo que se anota se lee en pantalla
 * **antes** de tocar nada.
 *
 * **Nunca aparece «cancelar»** y nunca se pierde en silencio (criterio 59).
 *
 * **No bloquea la pantalla** (criterio 54): es una tarjeta arriba del módulo, no
 * un modal. Lo único que impide es **empezar otra cosa** —el API solo admite una
 * sesión abierta— y eso lo dice aquí mismo.
 */
export function VidaStaleSessionPrompt({
  session,
  plannedMinutes,
  dayEndTime,
  onResolve,
}: VidaStaleSessionPromptProps) {
  const start = normalizeTimeForDisplay(session.startTime)
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const title = session.activity?.title ?? 'Actividad'
  const when = describeWhen(session.date, getCurrentLocalDate())
  const unknown = resolveUnknownEndMinutes({
    startTime: start,
    plannedMinutes,
    dayEndTime,
  })

  async function resolve(minutes: number, reason: UnknownEndReason | 'typed') {
    setError(null)
    setIsSaving(true)
    const result = await onResolve({ minutes, reason })
    setIsSaving(false)
    if (!result.ok) setError(result.message ?? 'No pudimos guardarla. Inténtalo otra vez.')
  }

  function handleTyped() {
    if (!isValidHhMm(endTime)) {
      setError('Escribe la hora como 21:40.')
      return
    }
    void resolve(minutesUntilEndTime(start, endTime), 'typed')
  }

  return (
    <section className={styles.root} aria-labelledby="vida-stale-title">
      <p className={styles.title} id="vida-stale-title">
        Dejaste «{title}» en marcha {when} a las {formatTimeForDisplay(start)}
      </p>
      <p className={styles.question}>¿Hasta qué hora la hiciste?</p>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Hasta las</span>
          <Input
            type="time"
            value={endTime}
            disabled={isSaving}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </label>
        <Button variant="primary" size="sm" onClick={handleTyped} disabled={isSaving}>
          Guardar
        </Button>
        <Button variant="secondary" size="sm" disabled={isSaving} onClick={() => void resolve(unknown.minutes, unknown.reason)}>
          No sé
        </Button>
      </div>

      <p className={styles.note}>
        Si tocas «No sé» anotamos {formatDurationMinutes(unknown.minutes)}
        {unknown.reason === 'planned' ? ' —lo que tenías planeado—' : ''}. Puedes cambiarlo cuando
        quieras desde ese día.
      </p>
      <p className={styles.note}>
        Hasta que respondas no se puede empezar otra cosa: solo cabe una en marcha. El resto de la
        pantalla funciona igual.
      </p>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
