import { useUserSettingsQuery } from '@/features/settings/hooks/useUserSettings'
import {
  VIDA_DAY_END_FALLBACK,
  VIDA_DAY_START_FALLBACK,
  isEndAfterStart,
  isValidHhMm,
  normalizeTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'

export type VidaDayHours = {
  /** `HH:mm`. Siempre hay valor: si los ajustes no lo dicen, el respaldo. */
  startTime: string
  endTime: string
  /** `true` cuando lo de arriba es el respaldo del cliente, no una elección. */
  isDefault: boolean
  /** Lo que viene del API tal cual, para pintar el formulario de ajustes. */
  saved: { startTime: string | null; endTime: string | null }
  isPending: boolean
  isError: boolean
  /** Sin sesión la consulta está deshabilitada: ni carga ni falla, no hay dato. */
  isDisabled: boolean
}

/**
 * A qué hora empieza y termina tu día (D2, criterios 9 y 50).
 *
 * **Única fuente**: nadie más en Vida lee `mySettings`. Es un envoltorio de
 * lectura sobre `useUserSettingsQuery` —que ya cachea con `staleTime` de 5 min
 * y su propia clave—, no otra consulta: no se crea ni hook de ajustes ni clave
 * nueva.
 *
 * Dos cosas que no son adorno:
 *
 * - `isDefault` existe para que la pantalla pueda **decir** que 06:30 y 23:00
 *   son el valor por defecto y no algo que el usuario eligiera (criterio 9).
 * - `isPending` se propaga sin maquillar para que nadie pinte un presupuesto con
 *   horas por defecto que luego salte cuando lleguen las de verdad (criterio 50).
 *
 * Lo que llega roto —una hora que no es `HH:mm`, o un fin que no es posterior al
 * inicio— **no se usa**: cae al respaldo y se dice que es el respaldo. El API
 * valida, pero un dato viejo o de otra versión no puede dejar la agenda sin
 * geometría.
 */
export function useVidaDayHours(): VidaDayHours {
  const query = useUserSettingsQuery()
  const settings = query.data

  const savedStart = settings?.vidaDayStartTime ?? null
  const savedEnd = settings?.vidaDayEndTime ?? null

  const usable =
    isValidHhMm(savedStart) && isValidHhMm(savedEnd) && isEndAfterStart(savedStart!, savedEnd!)

  return {
    startTime: usable ? normalizeTimeForDisplay(savedStart!) : VIDA_DAY_START_FALLBACK,
    endTime: usable ? normalizeTimeForDisplay(savedEnd!) : VIDA_DAY_END_FALLBACK,
    isDefault: !usable,
    saved: { startTime: savedStart, endTime: savedEnd },
    // Deshabilitada (sin sesión) es `isPending` con `fetchStatus: 'idle'`:
    // tratarlo como «cargando» sería un esqueleto eterno.
    isPending: query.isPending && query.fetchStatus !== 'idle',
    isError: query.isError,
    isDisabled: query.isPending && query.fetchStatus === 'idle',
  }
}
