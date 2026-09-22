/**
 * **La adherencia de las últimas semanas** (FEAT-007, tajada 1).
 *
 * Archivo propio, y no dentro de `vida-week-review.utils.ts`, por la misma
 * razón que aquel no está dentro de `vida-review.utils.ts`: **mira una ventana
 * distinta**. Aquel cuenta siete días; este agrupa seis semanas y siete días de
 * la semana. Lo que sí hace es **usarlo**: cada día se cuenta con
 * `buildWeekReview`, que es `buildDayAgenda` + `buildDayExecution` +
 * `collectDayClosing`, exactamente la aritmética de FEAT-006.
 *
 * Lo que aquí **no hay**, y es deliberado:
 *
 * - **Ninguna segunda definición de «seguido» ni de «planeado»** (criterio 70).
 *   La cifra de cada día es `followedCount / plannedCount` de
 *   `collectDayClosing`, y llega por `buildWeekReview`; aquí solo se suma.
 * - **Ni un `new Date()`.** El «hoy» y el «ahora» entran por parámetro.
 * - **Ninguna cifra a medio componer.** Las fracciones, los porcentajes y las
 *   frases salen de aquí ya escritas, para que el criterio 67 —ningún
 *   porcentaje sin su fracción— se pueda probar sobre este archivo y no solo
 *   sobre el DOM.
 * - **Ningún número inventado por debajo del umbral.** Un día de la semana con
 *   menos de tres semanas dice cuántas lleva; no enseña un promedio de dos
 *   datos disfrazado de costumbre.
 */

import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
  formatDateToYmd,
  getMondayOfWeek,
  getVidaDayOfWeek,
  parseYmdToLocalDate,
  pluralDayLabel,
  shiftYmd,
} from '@/features/vida/utils/vida-date.utils'
import { buildWeekReview } from '@/features/vida/utils/vida-week-review.utils'

/** Con menos de esto no se cuenta la adherencia: se dice cuánto falta. */
export const ADHERENCE_MIN_WEEKS = 2
/** Y la coletilla de «vas subiendo» necesita una semana más. */
export const ADHERENCE_TREND_WEEKS = 3
/** Un día de la semana habla a partir de tres semanas con plan. */
export const WEEKDAY_MIN_WEEKS = 3
/** Una semana con menos de tres días planeados no entra en ninguna media. */
export const WEEK_MIN_PLANNED_DAYS = 3

const DAYS_IN_WEEK = 7

export type AdherenceDayInput = {
  date: string
  planItems: ActivityDayPlanItem[]
  followUps: ActivityFollowUp[]
  /** Su consulta sigue en vuelo: **no cuenta como un día sin plan**. */
  isPending?: boolean
  /** Su consulta falló: tampoco. De ese día no se afirma nada. */
  isError?: boolean
}

export type BuildAdherenceInput = {
  days: AdherenceDayInput[]
  dayHours: { startTime: string; endTime: string }
  /** `YYYY-MM-DD` de hoy. */
  today: string
  /** Minutos desde medianoche, o `null`. */
  nowMinutes: number | null
}

export type AdherenceWeek = {
  /** Lunes de la semana, `YYYY-MM-DD`. */
  monday: string
  /** «ago», «sep»: la columna estrecha de la izquierda. */
  monthLabel: string
  /** «18 – 24». */
  daysLabel: string
  /** Lo que se lee en voz alta: «18 al 24 de agosto». */
  rangeLabel: string
  followedCount: number
  plannedCount: number
  /** «29/36». Nunca se enseña el porcentaje sin esto al lado. */
  fractionLabel: string
  /** «81 %», siempre pegado a su fracción. */
  percentLabel: string
  /** 0–100, para el ancho del tramo sólido. */
  followedPercent: number
  /** Cuántos días de esa semana tenían plan. */
  plannedDays: number
  /** La semana en curso: cuenta solo hasta hoy y la leyenda lo dice. */
  isCurrent: boolean
}

export type AdherenceWeekday = {
  day: VidaDayOfWeek
  /** L M X J V S D. */
  shortLabel: string
  /** «lunes». */
  longLabel: string
  /** En cuántas semanas computables ese día tuvo plan. */
  weeksWithPlan: number
  /** ¿Llega al umbral para poder hablar de él? */
  hasEnough: boolean
  followedCount: number
  plannedCount: number
  /** «9/10», o `null` por debajo del umbral. */
  fractionLabel: string | null
  /** «2 sem», o `null` cuando sí hay fracción. */
  waitingLabel: string | null
}

/** Una fila de «Lo que llega después»: el umbral dicho y lo que falta. */
export type AdherenceWaitingRow = {
  title: string
  /** «A partir de 2 semanas completas». */
  thresholdLabel: string
  /** «te falta 1, la del 22 al 28 de septiembre». */
  missingLabel: string
}

export type VidaAdherence = {
  /** Cuántas semanas cuentan de verdad (3 días planeados o más). */
  computableWeeks: number
  /** Días con plan dentro de la ventana: el contador de «llevas N de 21». */
  plannedDaysInWindow: number
  /** Como mucho dos frases, y la segunda solo si la serie sube. */
  headline: string[]
  /** De cuántos datos habla y qué se deja fuera. Se lee **siempre**. */
  dataNote: string
  /** Solo las semanas computables, de la más vieja a la más nueva. */
  weeks: AdherenceWeek[]
  /** «5 semanas»: de cuántas habla la rejilla de días. */
  weeksLabel: string
  /** Vacío mientras no haya adherencia que contar. */
  weekdays: AdherenceWeekday[]
  /** El pie de la rejilla: el día que más se parece y el umbral de los 3. */
  weekdayNote: string[]
  /** Con menos de 2 semanas computables: qué llega y cuándo. */
  waiting: AdherenceWaitingRow[]
  /** La última línea de la espera: esto sale de los días que vives. */
  waitingNote: string
  /** ¿Hay adherencia que enseñar, o toca esperar? */
  hasAdherence: boolean
}

/** El lunes de la semana que contiene esa fecha. */
function mondayOf(date: string): string {
  return formatDateToYmd(getMondayOfWeek(parseYmdToLocalDate(date)))
}

/** «ago», «sep»: tres letras, sin punto. */
function shortMonth(date: Date): string {
  return date
    .toLocaleDateString('es', { month: 'short' })
    .replace('.', '')
    .slice(0, 3)
}

/** «22 al 28 de septiembre», y con dos meses, «28 de septiembre al 4 de octubre». */
export function formatWeekSpan(monday: string): string {
  const from = parseYmdToLocalDate(monday)
  const to = parseYmdToLocalDate(shiftYmd(monday, DAYS_IN_WEEK - 1))
  const fromMonth = from.toLocaleDateString('es', { month: 'long' })
  const toMonth = to.toLocaleDateString('es', { month: 'long' })
  return fromMonth === toMonth
    ? `${from.getDate()} al ${to.getDate()} de ${toMonth}`
    : `${from.getDate()} de ${fromMonth} al ${to.getDate()} de ${toMonth}`
}

type WeekBucket = {
  monday: string
  followed: number
  planned: number
  plannedDays: number
  /** Por día de la semana, lo contado de los días **cerrados** de esa semana. */
  byWeekday: Map<VidaDayOfWeek, { followed: number; planned: number }>
}

/**
 * **La frase de cabecera** (criterio 65): «De cada 10 bloques que planeas,
 * sigues 8».
 *
 * Cuando la proporción redondea a cero la frase se cambia por la cuenta
 * literal: «De cada 10 … sigues 0» es un cero en la cara, y lo que la pantalla
 * tiene que hacer es decir el dato, no marcarlo. La cifra sigue siendo exacta y
 * sigue yendo en fracción.
 */
function headlineFor(followed: number, planned: number, weeks: number): string {
  const perTen = Math.round((followed / planned) * 10)
  if (perTen >= 1) {
    return `De cada 10 bloques que planeas, sigues ${perTen}.`
  }
  return `Has seguido ${followed} de ${planned} ${planned === 1 ? 'bloque' : 'bloques'} en estas ${weeks} ${
    weeks === 1 ? 'semana' : 'semanas'
  }.`
}

/**
 * Cuántas semanas seguidas lleva subiendo la serie, contando desde la última
 * hacia atrás. Devuelve 0 si la última no sube.
 *
 * Se exige que suba **en las tres últimas** para decir nada (criterio 65): con
 * la serie plana o bajando **no se dice nada de tendencia**, y desde luego no
 * se dice que baja.
 */
function risingRun(percents: number[]): number {
  let run = 1
  for (let index = percents.length - 1; index > 0; index -= 1) {
    const current = percents[index]
    const previous = percents[index - 1]
    if (current === undefined || previous === undefined || current <= previous) break
    run += 1
  }
  return run
}

/** Cuántos días de los 21 hacen falta para hablar de días de la semana. */
const WEEKDAY_TARGET_DAYS = WEEKDAY_MIN_WEEKS * DAYS_IN_WEEK

/**
 * Las semanas que todavía faltan para llegar al umbral, **con sus fechas de
 * verdad** (criterio 71). Se nombran desde la semana en curso hacia adelante,
 * saltándose las que ya cuentan.
 */
function missingWeeks(computable: Set<string>, today: string, howMany: number): string[] {
  const names: string[] = []
  let monday = mondayOf(today)
  // Un tope de doce vueltas: la lista que se pinta nunca pasa de dos.
  for (let step = 0; step < 12 && names.length < howMany; step += 1) {
    if (!computable.has(monday)) names.push(formatWeekSpan(monday))
    monday = shiftYmd(monday, DAYS_IN_WEEK)
  }
  return names
}

/**
 * **La adherencia de la ventana**: semanas, días de la semana y lo que se dice
 * cuando todavía no hay bastante.
 *
 * Los días que no se pudieron leer —y los que siguen en vuelo— **no entran**:
 * contarlos como cero bloques seguidos sería afirmar lo que no se sabe, que es
 * la misma regla del criterio 52 de FEAT-006. Tampoco entran los días que aún
 * no han cerrado: la semana en curso cuenta **hasta hoy**, y eso lo dice la
 * leyenda.
 */
export function buildAdherence(input: BuildAdherenceInput): VidaAdherence {
  const rows = buildWeekReview({
    days: input.days,
    dayHours: input.dayHours,
    today: input.today,
    nowMinutes: input.nowMinutes,
  })

  const buckets = new Map<string, WeekBucket>()
  let plannedDaysInWindow = 0

  for (const row of rows) {
    // Solo los días **cerrados** se cuentan: un día en vuelo, caído, futuro o a
    // medias no tiene cifra que sumar.
    if (row.status !== 'closed') continue
    const monday = mondayOf(row.date)
    const bucket = buckets.get(monday) ?? {
      monday,
      followed: 0,
      planned: 0,
      plannedDays: 0,
      byWeekday: new Map<VidaDayOfWeek, { followed: number; planned: number }>(),
    }
    bucket.followed += row.followedCount
    bucket.planned += row.plannedCount
    if (row.plannedCount > 0) {
      bucket.plannedDays += 1
      plannedDaysInWindow += 1
      const weekday = getVidaDayOfWeek(row.date)
      const cell = bucket.byWeekday.get(weekday) ?? { followed: 0, planned: 0 }
      cell.followed += row.followedCount
      cell.planned += row.plannedCount
      bucket.byWeekday.set(weekday, cell)
    }
    buckets.set(monday, bucket)
  }

  const computableBuckets = [...buckets.values()]
    .filter((bucket) => bucket.plannedDays >= WEEK_MIN_PLANNED_DAYS && bucket.planned > 0)
    .sort((a, b) => a.monday.localeCompare(b.monday))

  const computableWeeks = computableBuckets.length
  const hasAdherence = computableWeeks >= ADHERENCE_MIN_WEEKS
  const currentMonday = mondayOf(input.today)

  const dataNote =
    computableWeeks > 0
      ? `Con ${computableWeeks} ${computableWeeks === 1 ? 'semana' : 'semanas'} de datos. Las semanas con menos de ${WEEK_MIN_PLANNED_DAYS} días planeados se quedan fuera, para que una semana de viaje no arrastre la línea.`
      : `Todavía no hay ninguna semana con ${WEEK_MIN_PLANNED_DAYS} días planeados o más. Las semanas con menos de ${WEEK_MIN_PLANNED_DAYS} días planeados se quedan fuera, para que una semana de viaje no arrastre la línea.`

  if (!hasAdherence) {
    const computable = new Set(computableBuckets.map((bucket) => bucket.monday))
    const missing = ADHERENCE_MIN_WEEKS - computableWeeks
    const names = missingWeeks(computable, input.today, missing)
    const missingLabel =
      names.length === 1
        ? `te falta ${missing}, la del ${names[0]}`
        : `te faltan ${missing}: la del ${names.join(' y la del ')}`

    return {
      computableWeeks,
      plannedDaysInWindow,
      headline: [
        `Llevas ${plannedDaysInWindow} ${plannedDaysInWindow === 1 ? 'día' : 'días'} con plan.`,
      ],
      dataNote,
      weeks: [],
      weeksLabel: `${computableWeeks} ${computableWeeks === 1 ? 'semana' : 'semanas'}`,
      weekdays: [],
      weekdayNote: [],
      waiting: [
        {
          title: 'Adherencia semana a semana',
          thresholdLabel: `A partir de ${ADHERENCE_MIN_WEEKS} semanas completas`,
          missingLabel,
        },
        {
          title: 'Patrones por día de la semana',
          thresholdLabel: `A partir de ${WEEKDAY_MIN_WEEKS} semanas`,
          missingLabel: `llevas ${plannedDaysInWindow} días de ${WEEKDAY_TARGET_DAYS}`,
        },
      ],
      waitingNote:
        'Esto no depende de que planees más ni mejor: sale de los días que vives. Sigue como quieras y se va llenando solo.',
      hasAdherence: false,
    }
  }

  const weeks: AdherenceWeek[] = computableBuckets.map((bucket) => {
    const from = parseYmdToLocalDate(bucket.monday)
    const to = parseYmdToLocalDate(shiftYmd(bucket.monday, DAYS_IN_WEEK - 1))
    const percent = Math.round((bucket.followed / bucket.planned) * 100)
    const fromMonth = shortMonth(from)
    const toMonth = shortMonth(to)
    return {
      monday: bucket.monday,
      monthLabel: fromMonth === toMonth ? fromMonth : `${fromMonth}–${toMonth}`,
      daysLabel: `${from.getDate()} – ${to.getDate()}`,
      rangeLabel: formatWeekSpan(bucket.monday),
      followedCount: bucket.followed,
      plannedCount: bucket.planned,
      fractionLabel: `${bucket.followed}/${bucket.planned}`,
      percentLabel: `${percent} %`,
      followedPercent: Math.min(100, (bucket.followed / bucket.planned) * 100),
      plannedDays: bucket.plannedDays,
      isCurrent: bucket.monday === currentMonday,
    }
  })

  const totals = computableBuckets.reduce(
    (acc, bucket) => ({ followed: acc.followed + bucket.followed, planned: acc.planned + bucket.planned }),
    { followed: 0, planned: 0 },
  )

  const headline = [headlineFor(totals.followed, totals.planned, computableWeeks)]
  if (computableWeeks >= ADHERENCE_TREND_WEEKS) {
    const percents = weeks.map((week) => (week.followedCount / week.plannedCount) * 100)
    const run = risingRun(percents)
    if (run >= ADHERENCE_TREND_WEEKS) headline.push(`Llevas ${run} semanas subiendo.`)
  }

  const weekdays: AdherenceWeekday[] = VIDA_DAY_ORDER.map((day) => {
    let weeksWithPlan = 0
    let followed = 0
    let planned = 0
    for (const bucket of computableBuckets) {
      const cell = bucket.byWeekday.get(day)
      if (!cell || cell.planned === 0) continue
      weeksWithPlan += 1
      followed += cell.followed
      planned += cell.planned
    }
    const hasEnough = weeksWithPlan >= WEEKDAY_MIN_WEEKS
    return {
      day,
      shortLabel: VIDA_DAY_SHORT_LABELS[day],
      longLabel: VIDA_DAY_LABELS[day],
      weeksWithPlan,
      hasEnough,
      followedCount: followed,
      plannedCount: planned,
      fractionLabel: hasEnough ? `${followed}/${planned}` : null,
      waitingLabel: hasEnough ? null : `${weeksWithPlan} sem`,
    }
  })

  return {
    computableWeeks,
    plannedDaysInWindow,
    headline,
    dataNote,
    weeks,
    weeksLabel: `${computableWeeks} ${computableWeeks === 1 ? 'semana' : 'semanas'}`,
    weekdays,
    weekdayNote: buildWeekdayNote(weekdays),
    waiting: [],
    waitingNote: '',
    hasAdherence: true,
  }
}

/** Lo mínimo que tiene que llevar un día para poder nombrarlo. */
const STANDOUT_FLOOR = 0.6
/** Y cuánto le tiene que sacar al segundo. */
const STANDOUT_MARGIN = 0.15

/**
 * **El pie de la rejilla.**
 *
 * Nombra el día que más se parece al plan **solo si uno destaca** —la misma
 * regla de `buildWeekLine` (FEAT-006)— y **no nombra el que menos**: el render
 * lo escribe, pero la regla de producto del módulo es que ninguna pantalla
 * señale un día flojo, y la cifra de cada casilla ya está a la vista para quien
 * quiera mirarla. Queda dicho en el dossier.
 *
 * Y explica **siempre** el umbral de las tres semanas: los días que todavía no
 * llegan dicen «2 sem» y sin esta línea eso no se entiende.
 */
function buildWeekdayNote(weekdays: AdherenceWeekday[]): string[] {
  const note: string[] = []
  const ranked = weekdays
    .filter((weekday) => weekday.hasEnough && weekday.plannedCount > 0)
    .map((weekday) => ({ weekday, ratio: weekday.followedCount / weekday.plannedCount }))
    .sort((a, b) => b.ratio - a.ratio)

  const best = ranked[0]
  const second = ranked[1]
  if (best && second && best.ratio >= STANDOUT_FLOOR && best.ratio - second.ratio >= STANDOUT_MARGIN) {
    note.push(`Los ${pluralDayLabel(best.weekday.longLabel)} son los que más se parecen a tu plan.`)
  }

  const short = weekdays.filter((weekday) => !weekday.hasEnough)
  if (short.length === 0) {
    note.push(`Cada casilla habla desde ${WEEKDAY_MIN_WEEKS} semanas con plan.`)
    return note
  }

  const names = short.map((weekday) => pluralDayLabel(weekday.longLabel))
  const list =
    names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
  const counts = new Set(short.map((weekday) => weekday.weeksWithPlan))
  const same = counts.size === 1 ? (short[0]?.weeksWithPlan ?? 0) : null
  const howMany =
    same === 0
      ? 'no hay ninguna semana con plan'
      : same !== null
        ? `hay ${same} ${same === 1 ? 'semana' : 'semanas'} con plan`
        : `hay menos de ${WEEKDAY_MIN_WEEKS} semanas con plan`
  note.push(
    `De ${list} ${howMany}: a partir de ${WEEKDAY_MIN_WEEKS} se puede hablar de ${
      short.length === 1 ? 'ese día' : 'ellos'
    }, y mientras tanto se dice así.`,
  )
  return note
}
