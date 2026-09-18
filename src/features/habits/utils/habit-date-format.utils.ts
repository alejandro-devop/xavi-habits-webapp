import { getIsoWeekNumber, getWeekEnd } from '@/features/habits/utils/habit-week.utils'

/** Las fechas llegan como `YYYY-MM-DD`; el mediodía evita saltos de zona horaria. */
function toDate(ymd: string): Date {
  return new Date(`${ymd}T12:00:00Z`)
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Intl en es-ES separa el día de la semana con coma; el titular queda mejor sin ella. */
function withoutWeekdayComma(value: string): string {
  return value.replace(',', '')
}

/** `15–21 sep` · `28 sep – 4 oct` cuando la semana cruza de mes. */
export function formatWeekRange(weekStart: string): string {
  const start = toDate(weekStart)
  const end = toDate(getWeekEnd(weekStart))

  const startDay = start.getUTCDate()
  const endDay = end.getUTCDate()
  const startMonth = start.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' })
  const endMonth = end.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' })

  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${endMonth}`
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`
}

/** Cintillo del encabezado: `Semana 38 · 15–21 sep`. */
export function formatWeekEyebrow(weekStart: string): string {
  return `Semana ${getIsoWeekNumber(weekStart)} · ${formatWeekRange(weekStart)}`
}

/** `Miércoles 17 de septiembre`. */
export function formatLongDate(date: string): string {
  return capitalize(
    withoutWeekdayComma(
      toDate(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }),
    ),
  )
}

/** `miércoles 17` — para los `aria-label` de los controles de cada día. */
export function formatDayForLabel(date: string): string {
  return withoutWeekdayComma(
    toDate(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  )
}
