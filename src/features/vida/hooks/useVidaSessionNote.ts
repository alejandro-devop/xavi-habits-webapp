import { useCallback } from 'react'
import { useUpdateActivityFollowUpMutation } from '@/features/vida/hooks/useActivityFollowUps'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { translateSessionError } from '@/features/vida/utils/vida-session.utils'

export type VidaNoteSaveResult = { ok: boolean; message?: string }

/**
 * **Escribir la nota de una sesión, y nada más que la nota.**
 *
 * Manda `activityFollowUpEdit({ id, notes })`. El backend actualiza **solo las
 * columnas presentes** (`activity-follow-up.service.ts`: `if (input.notes !==
 * undefined) …`), así que esto **no toca la hora ni la duración** y **no cierra
 * una sesión abierta** — que es lo que sostiene los criterios 538 y 543.
 * `notes: null` explícito **borra** la nota (criterio 540).
 *
 * **Silencioso a propósito** (`silent: true`). El cambio ya se ve en la línea
 * del día; un toast por cada nota sería ruido justo encima del gesto que esta
 * feature quiere abaratar. El **error sí se dice**: se devuelve traducido con
 * `translateSessionError`, igual que en `useVidaSessionActions`, y quien llama
 * decide dónde pintarlo.
 *
 * **Resuelve, no lanza**, como el resto de la sesión: la hoja se queda abierta
 * con lo escrito si algo falla.
 */
export function useVidaSessionNote() {
  const mutation = useUpdateActivityFollowUpMutation({ silent: true })
  const { mutateAsync } = mutation

  const saveNote = useCallback(
    async (session: ActivityFollowUp, notes: string | null): Promise<VidaNoteSaveResult> => {
      try {
        await mutateAsync({ id: session.id, notes })
        return { ok: true }
      } catch (error) {
        return {
          ok: false,
          message: translateSessionError(error, 'No pudimos guardarlo. Inténtalo otra vez.'),
        }
      }
    },
    [mutateAsync],
  )

  return { saveNote, isSaving: mutation.isPending }
}
