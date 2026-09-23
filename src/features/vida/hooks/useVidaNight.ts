import { useUserSettingsQuery } from '@/features/settings/hooks/useUserSettings'
import type { VidaNight } from '@/features/vida/utils/vida-night.utils'
import { normalizeNightDays } from '@/features/vida/utils/vida-night.utils'
import { isValidHhMm, normalizeTimeForDisplay } from '@/features/vida/utils/vida-time.utils'

export type VidaNightState = {
  /**
   * La noche planeada, o `null` cuando no hay ninguna — que es el estado de
   * todo el mundo hasta que la ponga (criterio 310).
   */
  night: VidaNight | null
  /** Lo que viene del API tal cual, para pintar el formulario de ajustes. */
  saved: { bedTime: string | null; wakeTime: string | null; days: string[] | null }
  isPending: boolean
  isError: boolean
  /** Sin sesión la consulta está deshabilitada: ni carga ni falla, no hay dato. */
  isDisabled: boolean
  refetch: () => void
}

/**
 * **Tu noche**, leída de los ajustes (FEAT-012).
 *
 * Calcado de `useVidaDayHours`, y por la misma razón: es un **envoltorio de
 * lectura** sobre `useUserSettingsQuery`, que Vida ya pide. **No hay consulta
 * nueva, ni clave de caché nueva, ni mutación nueva** (criterio 318): la noche
 * viaja dentro de `mySettings`, al lado de `vidaDayStartTime`.
 *
 * Que lea con `?.` y **degrade a `null`** no es cosmética: es la condición para
 * que esto no necesite una guarda de caché. La regla de la casa
 * (`src/app/providers/query-cache-guards.ts:56-59`) es que lleva guarda lo que
 * **tumba** una pantalla, no lo que la **vacía**; un `mySettings` viejo sin
 * campos de noche rehidratado desde `localStorage` deja `night: null` y el
 * módulo se comporta como antes, sin romper nada.
 *
 * Qué se descarta y por qué:
 *
 * - **Las dos horas tienen que ser `HH:mm`.** Media noche guardada no es una
 *   noche: sin las dos no hay ni duración ni ventana (criterio 317).
 * - **Las dos horas iguales tampoco.** Una noche de cero minutos no es una
 *   noche (criterio 263) — Ajustes lo impide al guardar, pero un dato viejo o
 *   escrito a mano no puede colarse por detrás.
 * - **Los días que no se reconocen se caen** y el resto se queda: `days: []` es
 *   legal y significa «ninguna noche marcada», con lo que la noche existe en
 *   los ajustes pero no aplica a ningún día (criterio 265).
 *
 * Lo que **no** se descarta, y es lo importante: **que te levantes antes de
 * acostarte**. `23:00 → 5:00` es una noche que cruza la medianoche y es legal
 * (criterio 262). Aquí no se aplica `isEndAfterStart`, que es la trampa que
 * `useVidaDayHours` sí usa tres líneas más allá y que **no vale** para esto.
 */
export function useVidaNight(): VidaNightState {
  const query = useUserSettingsQuery()
  const settings = query.data

  const savedBed = settings?.vidaNightBedTime ?? null
  const savedWake = settings?.vidaNightWakeTime ?? null
  const savedDays = settings?.vidaNightDays ?? null

  const usable =
    isValidHhMm(savedBed) &&
    isValidHhMm(savedWake) &&
    normalizeTimeForDisplay(savedBed!) !== normalizeTimeForDisplay(savedWake!)

  return {
    night: usable
      ? {
          bedTime: normalizeTimeForDisplay(savedBed!),
          wakeTime: normalizeTimeForDisplay(savedWake!),
          days: normalizeNightDays(savedDays),
        }
      : null,
    saved: { bedTime: savedBed, wakeTime: savedWake, days: savedDays },
    // Misma lectura que `useVidaDayHours`: deshabilitada (sin sesión) es
    // `isPending` con `fetchStatus: 'idle'`, y tratarlo como «cargando» sería
    // un esqueleto eterno.
    isPending: query.isPending && query.fetchStatus !== 'idle',
    isError: query.isError,
    isDisabled: query.isPending && query.fetchStatus === 'idle',
    refetch: () => {
      void query.refetch()
    },
  }
}
