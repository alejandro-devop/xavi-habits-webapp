import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import * as dayPlanApi from '@/features/vida/api/activity-day-plan.api'
import { useActivityFollowUpsInDatesQuery } from '@/features/vida/hooks/useActivityFollowUps'
import { useVidaQueryGuard } from '@/features/vida/hooks/useVidaQueryGuard'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import {
  formatDateToYmd,
  getMondayOfWeek,
  parseYmdToLocalDate,
  shiftYmd,
} from '@/features/vida/utils/vida-date.utils'
import { vidaKeys } from '@/shared/api/query-keys'

/**
 * **Seis semanas.** El ancho es del módulo, no de la pantalla: si Hoy mirase
 * cuatro y Revisión seis, la misma costumbre tendría dos números.
 *
 * La tajada 2 crea `vida-patterns.utils.ts` y el plan le pone allí un
 * `VIDA_PATTERN_WEEKS`: **que importe este**, no que escriba el segundo.
 */
export const VIDA_HISTORY_WEEKS = 6

const DAYS_IN_WEEK = 7

/**
 * **Un día cerrado no cambia por su cuenta.** La tajada 1 le puso cinco
 * minutos; la 3 lo sube a «no caduca» porque en Hoy —la pantalla que más se
 * abre del módulo— cinco minutos significaban volver a pagar la ventana entera
 * varias veces por sesión.
 *
 * Es seguro: lo único que cambia el plan de un día pasado es una escritura
 * desde esta misma aplicación, y **todas** pasan por
 * `invalidateDayPlanQueries(date)`, que lo marca caducado igual. El techo real
 * de esta decisión es `WINDOW_GC_TIME`: media hora sin nadie mirando y la
 * entrada se tira, así que a la vuelta se vuelve a pedir.
 */
const PAST_STALE_TIME = Number.POSITIVE_INFINITY
/** Hoy sí cambia: el mismo que usa `useActivityDayPlanQuery`. */
const TODAY_STALE_TIME = 1000 * 30
/** Sin esto, ir a Hoy y volver a los seis minutos vuelve a pedir los 42. */
const WINDOW_GC_TIME = 1000 * 60 * 30

export type VidaHistoryDay = {
  date: string
  planItems: ActivityDayPlanItem[]
  followUps: ActivityFollowUp[]
  /** Todavía no se sabe. **No es un día sin plan.** */
  isPending: boolean
  /** Su consulta falló. Tampoco es un día sin plan. */
  isError: boolean
}

export type VidaHistoryWindow = {
  /** Las fechas de la ventana, de la más vieja a hoy. */
  dates: string[]
  from: string
  to: string
  days: VidaHistoryDay[]
  byDate: Record<string, VidaHistoryDay>
  /** Alguna consulta sigue en vuelo. */
  isPending: boolean
  /** Alguna falló: hay días de los que no se sabe nada. */
  hasError: boolean
  /** Vuelve a pedir **solo** las que fallaron. */
  refetch: () => void
}

export type UseVidaHistoryWindowInput = {
  /** Se monta solo con su sección abierta: sin esto, la ventana cuesta 43. */
  enabled: boolean
  /** `YYYY-MM-DD` de hoy. Entra por parámetro: aquí no se lee el reloj. */
  today: string
  weeks?: number
}

/**
 * **La ventana de seis semanas** (FEAT-007, A de la tajada 1).
 *
 * Es `useVidaWeekPlans` + la consulta de rango de sesiones, combinados, y se
 * copia de ellos a propósito —misma lectura de `fetchStatus === 'idle'` para
 * distinguir «deshabilitada» de «cargando», mismo `refetch` que solo repite las
 * que fallaron—.
 *
 * **Ninguna clave de caché nueva** (criterio 102):
 *
 * - **Los planes, uno por día** (`vidaKeys.dayPlan.byDate`), porque el esquema
 *   **no tiene** consulta de plan por rango y esta feature no crea documentos
 *   GraphQL. A cambio, cada día comparte entrada con Hoy, con la tira, con la
 *   semana y con el puente: llegar aquí desde Revisión son ~20 aciertos.
 * - **Las sesiones, una sola consulta de rango** (`vidaKeys.followUps.range`),
 *   como ya hace el puente de FEAT-006 con sus 14 días. Por día serían 42
 *   consultas más. Falla entera, y aquí eso no quita información: el error de
 *   esta sección es global, con «Reintentar».
 *
 * El coste medido de abrirla está escrito en el dossier (criterio 103).
 */
export function useVidaHistoryWindow({
  enabled,
  today,
  weeks = VIDA_HISTORY_WEEKS,
}: UseVidaHistoryWindowInput): VidaHistoryWindow {
  const guard = useVidaQueryGuard()

  const dates = useMemo(() => {
    if (!today) return []
    const monday = formatDateToYmd(getMondayOfWeek(parseYmdToLocalDate(today)))
    const from = shiftYmd(monday, -DAYS_IN_WEEK * (weeks - 1))
    const list: string[] = []
    let cursor = from
    // Del lunes de hace cinco semanas hasta hoy: 36 días el lunes, 42 el
    // domingo. Un tope duro por si alguien pasa una ventana absurda.
    for (let step = 0; step < weeks * DAYS_IN_WEEK && cursor <= today; step += 1) {
      list.push(cursor)
      cursor = shiftYmd(cursor, 1)
    }
    return list
  }, [today, weeks])

  const from = dates[0] ?? ''
  const to = dates[dates.length - 1] ?? ''
  const isOn = enabled && guard && dates.length > 0

  const plans = useQueries({
    queries: dates.map((date) => ({
      queryKey: vidaKeys.dayPlan.byDate(date),
      enabled: isOn,
      queryFn: () => dayPlanApi.getActivityDayPlan(date),
      staleTime: date < today ? PAST_STALE_TIME : TODAY_STALE_TIME,
      gcTime: WINDOW_GC_TIME,
    })),
  })

  const sessionsQuery = useActivityFollowUpsInDatesQuery(isOn ? from : '', isOn ? to : '')

  const sessionsByDate = useMemo(() => {
    // El rango llega **agrupado por fecha** (`ActivityFollowUpsDateGroup`), que
    // es justo la forma que necesita la derivación: un día y sus sesiones.
    return new Map((sessionsQuery.data ?? []).map((group) => [group.date, group.followUps] as const))
  }, [sessionsQuery.data])

  const sessionsPending =
    sessionsQuery.isPending && sessionsQuery.fetchStatus !== 'idle'
  const sessionsFailed = sessionsQuery.isError

  const days: VidaHistoryDay[] = []
  const byDate: Record<string, VidaHistoryDay> = {}
  let isPending = false
  let hasError = false

  dates.forEach((date, index) => {
    const result = plans[index]
    // Deshabilitada (`isPending` + `idle`) no es «cargando»: no va a llegar
    // nada y la sección no se queda girando para siempre.
    const isDisabled = Boolean(result?.isPending) && result?.fetchStatus === 'idle'
    const planPending = Boolean(result?.isPending) && !isDisabled
    const planFailed = Boolean(result?.isError)
    const day: VidaHistoryDay = {
      date,
      planItems: planFailed ? [] : (result?.data ?? []),
      followUps: sessionsFailed ? [] : (sessionsByDate.get(date) ?? []),
      isPending: planPending || sessionsPending,
      isError: planFailed || sessionsFailed,
    }
    days.push(day)
    byDate[date] = day
    if (day.isPending) isPending = true
    if (day.isError) hasError = true
  })

  return {
    dates,
    from,
    to,
    days,
    byDate,
    isPending,
    hasError,
    refetch: () => {
      for (const result of plans) {
        if (result?.isError) void result.refetch()
      }
      if (sessionsQuery.isError) void sessionsQuery.refetch()
    },
  }
}
