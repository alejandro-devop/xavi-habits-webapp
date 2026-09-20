import { useCallback, useRef, useState } from 'react'
import {
  useDeleteActivityFollowUpMutation,
  useStartActivityFollowUpMutation,
  useUpdateActivityFollowUpMutation,
} from '@/features/vida/hooks/useActivityFollowUps'
import { useVidaOpenSession } from '@/features/vida/hooks/useVidaOpenSession'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { formatTimeForDisplay } from '@/features/vida/utils/vida-time.utils'
import {
  closeSessionInput,
  elapsedMinutes,
  followUpStartInstant,
  startSessionInput,
  translateSessionError,
  type UnknownEndReason,
} from '@/features/vida/utils/vida-session.utils'
import { useToast } from '@/shared/ui/Toast'

/**
 * Las acciones de la sesión viva: empezar, terminar, cerrar con detalle,
 * descartar y responder por la que quedó abierta de otro día.
 *
 * **Molde: `useCreateStartingActivities`.** Como allí, esto orquesta dos
 * mutaciones que son **un solo gesto** y por eso deja **un solo mensaje**, y
 * como allí **no lanza: resuelve** con `{ ok, message }`. Quien llama decide si
 * lo pinta dentro de una hoja (criterio 12: la hoja no se cierra ni pierde las
 * notas) o se queda con el toast.
 *
 * **El criterio 15, en serie y en este orden.** El API impide dos sesiones
 * abiertas (`assertNoOpenFollowUp` en `start`, 400 y **en inglés**), así que el
 * cerrar→empezar lo orquesta el cliente: se cierra la anterior con los minutos
 * hasta este momento y **solo si eso funciona** se empieza la nueva. Si el
 * cierre falla, la nueva **no se empieza** y se explica: nunca quedan dos
 * abiertas ni se pierde la primera.
 *
 * Los toasts de los hooks van en `silent` donde hay que resumir: si no, un solo
 * gesto dejaría tres avisos apilados.
 */

export type VidaSessionActionResult = {
  ok: boolean
  /** Lo que salió mal, ya en español y sin «cancelar» (criterio 59). */
  message?: string
  /** La sesión que quedó cerrada, para quien quiera ofrecer «añadir una nota». */
  closed?: ActivityFollowUp
}

const OK: VidaSessionActionResult = { ok: true }

/** El reloj de este momento como se lee en Vida: «10:08», sin cero delante. */
function formatClock(now: Date): string {
  return formatTimeForDisplay(
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  )
}

type UseVidaSessionActionsOptions = {
  /**
   * «añadir una nota» del toast del criterio 5: abre el cierre completo sobre la
   * sesión **recién cerrada**. Lo pone quien tenga el modal montado (el layout
   * del módulo); sin él, el toast va sin acción y todo lo demás funciona igual.
   */
  onAddNote?: (session: ActivityFollowUp) => void
}

export function useVidaSessionActions(options: UseVidaSessionActionsOptions = {}) {
  const { onAddNote } = options
  const toast = useToast()
  const { session, isFromAnotherDay } = useVidaOpenSession()

  // Callados: quien resume es este hook. El del cierre además lleva acción, que
  // un hook genérico no puede conocer.
  const startMutation = useStartActivityFollowUpMutation({ silent: true })
  const closeMutation = useUpdateActivityFollowUpMutation({ silent: true })
  // El de descartar **sí** habla: «No la guardamos» ya es el mensaje correcto.
  const discardMutation = useDeleteActivityFollowUpMutation()

  // Un `isPending` propio: `start` encadena dos mutaciones y entre la primera y
  // la segunda ninguna de las dos está «pendiente». Sin esto, el botón se
  // rehabilitaría a mitad del gesto (criterio 13).
  //
  // Son **dos**: el `ref` cierra la puerta en el mismo tic —dos toques seguidos
  // llegan antes de que React repinte, y con solo el estado los dos pasarían y
  // se crearían dos sesiones (criterio 13)— y el estado es lo que inhabilita el
  // botón en pantalla.
  const busyRef = useRef(false)
  const [isBusy, setIsBusy] = useState(false)

  const lock = useCallback(() => {
    if (busyRef.current) return false
    busyRef.current = true
    setIsBusy(true)
    return true
  }, [])

  const unlock = useCallback(() => {
    busyRef.current = false
    setIsBusy(false)
  }, [])

  /**
   * Empezar un bloque **ahora** (criterios 2, 15 y 17). La hora es la del reloj
   * en este momento, no la planeada del bloque.
   */
  const start = useCallback(
    async (activityId: string): Promise<VidaSessionActionResult> => {
      // Con una sesión de otro día sin responder, el API no dejaría empezar
      // nada. Se dice aquí en vez de dejar que vuelva el 400 en inglés.
      if (session && isFromAnotherDay) {
        const message =
          'Antes dinos hasta qué hora hiciste lo que dejaste en marcha el otro día.'
        toast.error(message)
        return { ok: false, message }
      }

      if (!lock()) return { ok: false, message: 'Espera a que termine lo anterior.' }
      try {
        const now = new Date()
        let closedNote = ''

        if (session) {
          try {
            await closeMutation.mutateAsync(closeSessionInput(session, now))
            const title = session.activity?.title ?? 'lo anterior'
            closedNote = `Terminamos «${title}» a las ${formatClock(now)}. `
          } catch (error) {
            // El cierre falló: **no se empieza la nueva**. Dos abiertas no puede
            // haberlas, y perder la primera sería peor que no empezar la segunda.
            const message = translateSessionError(
              error,
              'No pudimos terminar lo que tenías en marcha, así que no empezamos lo nuevo. Inténtalo otra vez.',
            )
            toast.error(message)
            return { ok: false, message }
          }
        }

        try {
          const started = await startMutation.mutateAsync(startSessionInput(activityId, now))
          const title = started.activity?.title
          toast.success(`${closedNote}${title ? `En marcha: ${title}` : 'En marcha'}`)
          return OK
        } catch (error) {
          const message = translateSessionError(error, 'No pudimos empezarla. Inténtalo otra vez.')
          toast.error(message)
          return { ok: false, message }
        }
      } finally {
        unlock()
      }
    },
    [closeMutation, isFromAnotherDay, lock, session, startMutation, toast, unlock],
  )

  /**
   * «Terminar», de un solo toque (criterio 5): los minutos del cronómetro, sin
   * preguntar nada. El toast que confirma ofrece **«añadir una nota»**.
   */
  const finishNow = useCallback(async (): Promise<VidaSessionActionResult> => {
    if (!session) return { ok: false, message: 'No hay nada en marcha.' }
    if (!lock()) return { ok: false, message: 'Espera a que termine lo anterior.' }

    try {
      const startInstant = followUpStartInstant(session)
      const now = new Date()
      const minutes = startInstant ? elapsedMinutes(startInstant, now) : 1
      const closed = await closeMutation.mutateAsync({ id: session.id, durationMinutes: minutes })
      // El toast lo lanza **este** hook y no el de la mutación: la acción es un
      // cierre sobre la sesión recién cerrada, que un hook genérico no conoce.
      toast.show('success', {
        message: `Anotado: ${minutes} min de «${session.activity?.title ?? 'lo tuyo'}».`,
        action: onAddNote ? { label: 'añadir una nota', onClick: () => onAddNote(closed) } : undefined,
      })
      return { ok: true, closed }
    } catch (error) {
      const message = translateSessionError(
        error,
        'No pudimos terminarla. Sigue en marcha; inténtalo otra vez.',
      )
      toast.error(message)
      return { ok: false, message }
    } finally {
      unlock()
    }
  }, [closeMutation, lock, onAddNote, session, toast, unlock])

  /**
   * El cierre completo (criterio 6): duración ajustada, notas en texto plano.
   * No lanza ni cierra nada por su cuenta: quien tiene el modal decide.
   */
  const finishWith = useCallback(
    async (values: {
      id: string
      durationMinutes: number
      notes?: string | null
    }): Promise<VidaSessionActionResult> => {
      try {
        const closed = await closeMutation.mutateAsync({
          id: values.id,
          durationMinutes: Math.max(1, Math.round(values.durationMinutes)),
          notes: values.notes ?? null,
        })
        toast.success('Guardado')
        return { ok: true, closed }
      } catch (error) {
        return {
          ok: false,
          message: translateSessionError(
            error,
            'No pudimos guardarlo. Tus notas siguen aquí; inténtalo otra vez.',
          ),
        }
      }
    },
    [closeMutation, toast],
  )

  /** Una sesión empezada por error (criterio 14). Nunca «cancelar» ni «eliminar». */
  const discard = useCallback(
    async (target: ActivityFollowUp): Promise<VidaSessionActionResult> => {
      try {
        await discardMutation.mutateAsync({
          id: target.id,
          date: target.date,
          activityId: target.activityId,
          wasOpen: target.durationMinutes === null,
        })
        return OK
      } catch (error) {
        const message = translateSessionError(error, 'No pudimos quitarla. Inténtalo otra vez.')
        toast.error(message)
        return { ok: false, message }
      }
    },
    [discardMutation, toast],
  )

  /**
   * La respuesta a «¿hasta qué hora la hiciste?» (criterio 16). `reason` solo
   * sirve para decir **qué se anotó y por qué** cuando la respuesta fue «No sé».
   */
  const resolveStale = useCallback(
    async (params: {
      minutes: number
      reason?: UnknownEndReason | 'typed'
    }): Promise<VidaSessionActionResult> => {
      if (!session) return { ok: false, message: 'No hay nada que responder.' }
      const minutes = Math.max(1, Math.round(params.minutes))
      try {
        const closed = await closeMutation.mutateAsync({ id: session.id, durationMinutes: minutes })
        toast.success(
          params.reason === 'typed'
            ? `Anotado: ${minutes} min.`
            : `No lo sabíamos, así que anotamos ${minutes} min${
                params.reason === 'planned' ? ' —lo que tenías planeado—' : ''
              }. Puedes cambiarlo cuando quieras.`,
        )
        return { ok: true, closed }
      } catch (error) {
        const message = translateSessionError(
          error,
          'No pudimos guardarla. Sigue aquí; inténtalo otra vez.',
        )
        return { ok: false, message }
      }
    },
    [closeMutation, session, toast],
  )

  return {
    session,
    isFromAnotherDay,
    isBusy: isBusy || discardMutation.isPending,
    start,
    finishNow,
    finishWith,
    discard,
    resolveStale,
    onAddNote,
  }
}
