import { useMemo } from 'react'
import { useActivityDayPlanQuery } from '@/features/vida/hooks/useActivityDayPlan'
import { useActivityOpenFollowUpQuery } from '@/features/vida/hooks/useActivityFollowUps'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { getCurrentLocalDate } from '@/features/vida/utils/vida-date.utils'
import {
  followUpStartInstant,
  isSessionFromAnotherDay,
} from '@/features/vida/utils/vida-session.utils'
import { parseTimeToMinutes } from '@/features/vida/utils/vida-time.utils'

export type VidaOpenSession = {
  /** La sesión abierta, o `null` si no hay ninguna. */
  session: ActivityFollowUp | null
  /** El instante en que empezó: lo que cuenta el cronómetro (criterio 3). */
  startInstant: Date | null
  /** Quedó abierta **otro día**: no se pinta cronómetro, se pregunta (criterio 16). */
  isFromAnotherDay: boolean
  /** Sin sesión de usuario: la consulta está deshabilitada (criterio 64). */
  isDisabled: boolean
  /** En vuelo: todavía no se afirma «no hay nada en marcha». */
  isPending: boolean
}

/**
 * La sesión abierta, **una sola vez para todo el módulo** (criterio 8).
 *
 * Envuelve `useActivityOpenFollowUpQuery` **sin tocarla**: misma clave
 * (`vidaKeys.followUps.open()`), mismo `staleTime` de 15 s y mismo
 * `refetchOnWindowFocus`. React Query deduplica por clave, así que la barra del
 * layout, la agenda y quien la mire leen **la misma** consulta aunque la llamen
 * tres veces; no se pide una vez por pantalla.
 *
 * **Sobrevive a la recarga** (criterio 3) porque la verdad está en el servidor
 * —una sesión abierta es `duration_minutes IS NULL`— y la consulta se rehace al
 * montar. Por eso la sesión **no** se guarda en `localStorage` ni en un store de
 * cliente: sería un segundo sitio con la misma verdad, y los dos sitios se
 * contradicen.
 *
 * *Limitación aceptada:* una sesión empezada en otro aparato tarda en verse lo
 * que tarde el primer foco de ventana.
 */
export function useVidaOpenSession(): VidaOpenSession {
  const query = useActivityOpenFollowUpQuery()
  const session = query.data ?? null

  // Deshabilitada (sin sesión de usuario) es `isPending` con
  // `fetchStatus: 'idle'`: mirar solo `isPending` dejaría un esqueleto girando
  // para siempre (criterio 64).
  const isDisabled = query.isPending && query.fetchStatus === 'idle'

  const startInstant = useMemo(() => followUpStartInstant(session), [session])

  return {
    session,
    startInstant,
    isFromAnotherDay: isSessionFromAnotherDay(session, getCurrentLocalDate()),
    isDisabled,
    isPending: query.isPending && !isDisabled,
  }
}

/**
 * Los minutos que ese bloque tenía planeados, **con lo mínimo y sin adivinar**.
 *
 * Los piden dos criterios de esta tajada: el 9 («llevas 52 min · planeado 45»)
 * y el 16 (lo que registra el «No sé»). El cruce de verdad entre sesión y
 * bloque —`matchSessionsToBlocks`, con sus umbrales— es la **tajada 2**; aquí
 * basta con el bloque de ese día que tenga el mismo `activityId`, y **si hay
 * más de uno no se elige**: `null`, y quien lo reciba cae en su respaldo.
 *
 * No abre ninguna consulta nueva: `vidaKeys.dayPlan.byDate(date)` es la misma
 * que ya pide la pantalla de Hoy para ese día.
 */
export function useVidaSessionPlannedMinutes(
  session: ActivityFollowUp | null,
): number | null {
  const planQuery = useActivityDayPlanQuery(session?.date ?? '')
  const items = planQuery.data
  return useMemo(() => {
    if (!session) return null
    const matches = (items ?? []).filter((item) => item.activityId === session.activityId)
    if (matches.length !== 1) return null
    const only = matches[0]
    if (!only) return null
    // El plan del día guarda `startTime` y `endTime`, no una duración: la resta
    // es la misma que hace `buildDayAgenda`.
    const minutes = parseTimeToMinutes(only.endTime) - parseTimeToMinutes(only.startTime)
    return minutes > 0 ? minutes : null
  }, [items, session])
}
