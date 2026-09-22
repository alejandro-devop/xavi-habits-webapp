/**
 * La ventana de planeación y la tira de días (tajada 4 de FEAT-003).
 *
 * Todo aquí es **puro**: recibe el «hoy» por parámetro (`today`, `YYYY-MM-DD`)
 * en vez de leer el reloj, para que la tira y el borde de la ventana se puedan
 * probar sin inyectar `Date` global. Quien no pasa `today` está diciendo «el de
 * verdad», y entonces sí se lee `getCurrentLocalDate()`.
 *
 * La geometría del día vive en `vida-agenda.utils.ts` y las fechas en
 * `vida-date.utils.ts`: aquí solo hay **calendario**.
 */

import type {
  ActivityDayPlanItem,
  ActivityDayPlanSetItemInput,
} from '@/features/vida/types/activity-day-plan.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  formatDateToYmd,
  getCurrentLocalDate,
  getMondayOfWeek,
  parseYmdToLocalDate,
  shiftYmd,
} from '@/features/vida/utils/vida-date.utils'
import { normalizeTimeForApi, parseTimeToMinutes } from '@/features/vida/utils/vida-time.utils'

/** Cuántos días se ven en la tira (criterio 31). */
export const DAY_STRIP_LENGTH = 7

/** Cuántos días antes del que se mira empieza la tira, si la ventana deja. */
export const DAY_STRIP_LEAD = 2

export type PlanningWindow = {
  /** Primer día alcanzable, `YYYY-MM-DD`. */
  from: string
  /** Último día alcanzable, `YYYY-MM-DD`. */
  to: string
}

/**
 * La ventana de D5: **esta semana y la que viene**, de lunes a domingo.
 *
 * Los días **ya pasados de esta semana entran**: son alcanzables y se miran en
 * solo lectura (criterio 38, D3). Lo que no se puede es planear en ellos, y eso
 * lo dice `isEditableDate`, no la ventana.
 */
export function getPlanningWindow(today = getCurrentLocalDate()): PlanningWindow {
  const monday = getMondayOfWeek(parseYmdToLocalDate(today))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 13)
  return { from: formatDateToYmd(monday), to: formatDateToYmd(sunday) }
}

/** ¿Está esta fecha dentro de la ventana? Comparación de cadenas: son ISO. */
export function isInPlanningWindow(date: string, today = getCurrentLocalDate()): boolean {
  const window = getPlanningWindow(today)
  return date >= window.from && date <= window.to
}

/** El recorte, sin decidir **a qué** ventana: eso lo eligen los dos de abajo. */
function clampToWindow(date: string | null, window: PlanningWindow, today: string): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return today
  const value = date.trim()
  if (value < window.from) return window.from
  if (value > window.to) return window.to
  return value
}

/**
 * La fecha que de verdad se va a mostrar: lo que venga fuera de la ventana se
 * recorta a su borde en vez de dejar la pantalla en blanco (criterio 35). Lo
 * que no tenga forma de fecha cae en hoy.
 */
export function clampToPlanningWindow(date: string | null, today = getCurrentLocalDate()): string {
  return clampToWindow(date, getPlanningWindow(today), today)
}

/* ── La ventana de **mirar atrás** (FEAT-006, A3) ───────────────────────── */

/**
 * Cuántos días atrás alcanza la revisión. Es también la ventana de la regla
 * del puente (FEAT-006, criterio 55), y por eso el número vive aquí y no en
 * dos sitios.
 */
export const REVIEW_LOOKBACK_DAYS = 14

/**
 * La ventana de la **revisión**, que no es la de planear.
 *
 * `clampToPlanningWindow` recorta a esta semana y la que viene: un lunes,
 * «ayer» es domingo y **cae fuera**, así que la revisión abriría el lunes en
 * vez del último día cerrado. Aquí `from` es el **lunes de la semana de
 * hoy − 14**, no el día 14 exacto, para que **cualquier día que la semana de
 * la revisión pueda pintar sea alcanzable**: una fila que se toca y lleva a un
 * día fuera de la ventana sería un enlace muerto.
 *
 * `to` se hereda de la ventana de planeación: el criterio 4 exige poder
 * **abrir** un día futuro para decir que todavía no ha pasado.
 */
export function getReviewWindow(today = getCurrentLocalDate()): PlanningWindow {
  const monday = getMondayOfWeek(parseYmdToLocalDate(shiftYmd(today, -REVIEW_LOOKBACK_DAYS)))
  return { from: formatDateToYmd(monday), to: getPlanningWindow(today).to }
}

/** Como `clampToPlanningWindow`, pero contra la ventana de mirar atrás. */
export function clampToReviewWindow(date: string | null, today = getCurrentLocalDate()): string {
  return clampToWindow(date, getReviewWindow(today), today)
}

/**
 * La frase del borde de la revisión: en vez de flechas que no llevan a ningún
 * sitio, se dice **desde cuándo** se puede mirar atrás. Molde exacto de
 * `describePlanningWindowEdge`.
 */
export function describeReviewWindowEdge(today = getCurrentLocalDate()): string {
  const window = getReviewWindow(today)
  const local = parseYmdToLocalDate(window.from)
  const label = VIDA_DAY_LABELS[VIDA_DAY_ORDER[(local.getDay() + 6) % 7]!]
  return `Se miran los días ya vividos: desde el ${label} ${local.getDate()}.`
}

/**
 * Un día pasado **no se edita** (D3, criterio 38). Hoy y los futuros sí,
 * siempre que estén dentro de la ventana.
 */
export function isEditableDate(date: string, today = getCurrentLocalDate()): boolean {
  return date >= today && isInPlanningWindow(date, today)
}

/** El mismo día de la semana, siete días atrás (D7, criterio 36). */
export function sameWeekdayLastWeek(date: string): string {
  return shiftYmd(date, -7)
}

export type DayStripDay = {
  /** `YYYY-MM-DD` local. */
  date: string
  /** «Sáb»: tres letras, como el render. */
  weekdayLabel: string
  /** «sábado», para lo que se lee en voz alta. */
  longLabel: string
  /** El número del día del mes. */
  dayOfMonth: number
  isToday: boolean
  isSelected: boolean
  isPast: boolean
}

/**
 * Los siete días de la tira: **dos antes** del que se mira, recortados a la
 * ventana para que ni el primero ni el último se salgan de ella.
 *
 * Contra el borde la tira no encoge: se desliza. Mirando el lunes de esta
 * semana salen lunes → domingo; mirando el último domingo alcanzable salen los
 * siete anteriores a él. Así nunca hay un día pintado al que no se pueda ir.
 *
 * El **tercer parámetro** (FEAT-006, A3) es la ventana contra la que se
 * recorta: por defecto la de planear, que es lo que usan Hoy y la semana, y la
 * revisión le pasa `getReviewWindow(today)`. Así sigue habiendo **un solo
 * constructor de tiras** y ninguna pantalla anterior cambia de comportamiento.
 */
export function buildDayStrip(
  selectedDate: string,
  today = getCurrentLocalDate(),
  window: PlanningWindow = getPlanningWindow(today),
): DayStripDay[] {
  const selected = clampToWindow(selectedDate, window, today)

  let start = shiftYmd(selected, -DAY_STRIP_LEAD)
  if (start < window.from) start = window.from
  const lastStart = shiftYmd(window.to, -(DAY_STRIP_LENGTH - 1))
  if (start > lastStart) start = lastStart > window.from ? lastStart : window.from

  const days: DayStripDay[] = []
  for (let index = 0; index < DAY_STRIP_LENGTH; index += 1) {
    const date = shiftYmd(start, index)
    if (date > window.to) break
    const local = parseYmdToLocalDate(date)
    const longLabel = VIDA_DAY_LABELS[VIDA_DAY_ORDER[(local.getDay() + 6) % 7]!]
    days.push({
      date,
      weekdayLabel: `${longLabel.charAt(0).toUpperCase()}${longLabel.slice(1, 3)}`,
      longLabel,
      dayOfMonth: local.getDate(),
      isToday: date === today,
      isSelected: date === selected,
      isPast: date < today,
    })
  }
  return days
}

/**
 * Copiar un día encima de otro (criterio 36): los bloques de origen, con **sus
 * horas y sus duraciones**, en la forma que pide `activityDayPlanSet`.
 *
 * Va aquí, con el calendario, porque copiar del mismo día de la semana anterior
 * es la operación de calendario de esta tajada; la geometría del día sigue en
 * `vida-agenda.utils.ts` y no la necesita para nada.
 *
 * Se ordena por hora y se renumera `orderIndex`: el plan de origen pudo quedar
 * con los índices en cualquier orden después de varias ediciones, y `Set`
 * reemplaza el día entero. Las horas se normalizan a `HH:mm` porque el API las
 * devuelve así pero un `HH:mm:ss` de un día viejo no debe llegar a la mutación.
 */
export function planItemsToSetItems(items: ActivityDayPlanItem[]): ActivityDayPlanSetItemInput[] {
  return [...items]
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime))
    .map((item, index) => ({
      activityId: item.activityId,
      startTime: normalizeTimeForApi(item.startTime),
      endTime: normalizeTimeForApi(item.endTime),
      orderIndex: index,
    }))
}

/**
 * La frase del borde (criterio 35): en vez de un botón muerto que no lleva a
 * ninguna parte, se dice **hasta dónde** se puede planear.
 */
export function describePlanningWindowEdge(today = getCurrentLocalDate()): string {
  const window = getPlanningWindow(today)
  const local = parseYmdToLocalDate(window.to)
  const label = VIDA_DAY_LABELS[VIDA_DAY_ORDER[(local.getDay() + 6) % 7]!]
  return `Se planea esta semana y la que viene: hasta el ${label} ${local.getDate()}.`
}
