/**
 * La aritmética de **la plantilla**: el día tipo repartido por horas, sus
 * cuentas por día de la semana y las frases que se componen con reglas.
 *
 * Todo lo de aquí es **puro**: entran `VidaItem` y cadenas `HH:mm`, salen
 * números y texto. Ni React, ni `new Date()` escondido, ni una llamada al API.
 * Es lo que permite cerrar los criterios 4, 5, 6 y 7 de FEAT-005 sin pintar
 * nada y sin sesión —y todo `/app/*` está detrás del login—.
 *
 * **Por qué no se generaliza `buildDayAgenda`** (decisión A1 del arquitecto):
 * `AgendaBlock.item` es un `ActivityDayPlanItem` con `startTime` y `endTime`
 * **obligatorios**, mientras que un `VidaItem` los tiene los dos opcionales; la
 * plantilla además tiene un concepto que el plan no tiene (el cajón «sin hora»)
 * y le falta uno que el plan sí tiene (la marca de «ahora»). Lo que sí se copia
 * —y se dice de dónde sale— son **dos técnicas** de `vida-agenda.utils.ts`:
 *
 * - `trackMinutes` (`vida-agenda.utils.ts:41-52`): lo que cada tramo aporta a
 *   la barra **descontando lo que ya cubría el anterior**, para que los anchos
 *   sumen el 100 % aunque dos ítems se pisen (criterio 4). En la plantilla los
 *   solapes no se bloquean ni se avisan (criterio 47 y decisión (f) del
 *   analista): se ven, y la barra tiene que seguir cuadrando.
 * - El **estirado de la ventana** (`vida-agenda.utils.ts:120-129`): un ítem con
 *   hora fuera del horario de Vida estira los bordes en vez de desaparecer. Un
 *   bloque que no se pinta es un bloque perdido, y además la leyenda dejaría de
 *   sumar (decisión A5).
 */

import type {
  VidaDayOfWeek,
  VidaItem,
  VidaItemUpdateInput,
} from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
  pluralDayLabel,
} from '@/features/vida/utils/vida-date.utils'
import { compareVidaNames } from '@/features/vida/utils/vida-text.utils'
import {
  DEFAULT_BLOCK_MINUTES,
  MIN_GAP_MINUTES,
  calculateEndTime,
  formatDurationFromMinutes,
  formatDurationMinutes,
  formatTimeForDisplay,
  isValidHhMm,
  minutesToTime,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

/**
 * Un hueco por debajo de esto **no se nombra** en la frase de guía: «libre de
 * 13:00 a 13:20» no es un rato del que se pueda decir nada. El criterio 5 pide
 * explícitamente que, si no hay un hueco grande que nombrar, **no se afirme
 * uno**.
 */
export const TEMPLATE_NAMEABLE_GAP_MINUTES = 90

/**
 * Un tramo del día «está lleno» solo si se lleva **más de la mitad** de lo
 * puesto. Es `>` y no `>=` a propósito: con 60 min por la mañana y 60 por la
 * noche no hay ninguna parte llena, y decir «lleno por la mañana» sería elegir
 * una de las dos por el orden en que se miran.
 */
const BUSY_STRETCH_SHARE = 0.5

/** Los bordes de los tres tramos del día, en minutos desde medianoche. */
const MORNING_END = 12 * 60
const AFTERNOON_END = 18 * 60

export type TemplateEntry = {
  item: VidaItem
  /** Minutos desde medianoche de su hora de inicio. */
  startMinutes: number
  /** `startMinutes` + su duración; igual a `startMinutes` si no la tiene. */
  endMinutes: number
  /** **`null` cuando el ítem no la tiene**: nunca 0, nunca inventada (criterio 7). */
  durationMinutes: number | null
  /** Lo que aporta a la barra, descontando lo que ya cubría el anterior. */
  trackMinutes: number
}

export type TemplateSegment = {
  id: string
  kind: 'planned' | 'free'
  trackMinutes: number
  /** Dónde empieza el tramo en el día, en minutos desde medianoche. */
  startMinutes: number
  /** Dónde acaba. En los tramos `free` es **el fin del hueco** (criterio 140). */
  endMinutes: number
}

/**
 * Las filas de la agenda del día: **la misma geometría que `segments`**, con
 * las horas puestas y con la regla del criterio 145 (un ítem sin duración no
 * produce un hueco que mienta). `segments` y `freeMinutes` **no cambian**: la
 * barra de «Tu día» sigue saliendo de ahí, y por eso el criterio 142 —que la
 * suma de los huecos pintados sea `freeMinutes`— es una propiedad de la única
 * pasada que recorre el día y no una coincidencia entre dos cuentas.
 *
 * Divergen a propósito en un solo caso: donde hay un ítem sin duración,
 * `segments` sigue enseñando su tramo libre (la barra no se mueve) y `rows`
 * pinta en su lugar una línea que dice que no se sabe dónde acaba.
 */
export type TemplateItemRow = {
  kind: 'item'
  id: string
  entry: TemplateEntry
}

export type TemplateGapRow = {
  kind: 'gap'
  id: string
  startMinutes: number
  endMinutes: number
  minutes: number
  /** Menos de `MIN_GAP_MINUTES`: se pinta igual, pero en línea fina (criterio 143). */
  isSliver: boolean
}

export type TemplateUnknownRow = {
  kind: 'unknown'
  id: string
  item: VidaItem
  /** El corte hasta el que no se puede afirmar nada: el ítem siguiente o el fin del día. */
  untilMinutes: number
  /** `true` cuando ese corte es el final del día (criterio 146). */
  isDayEnd: boolean
}

export type TemplateRow = TemplateItemRow | TemplateGapRow | TemplateUnknownRow

export type TemplateDay = {
  day: VidaDayOfWeek
  /** Los que tienen hora, **ordenados por hora** y, a igual hora, por nombre. */
  timed: TemplateEntry[]
  /** Los que no la tienen: el cajón del final (criterio 9), por nombre. */
  untimed: VidaItem[]
  /** Minutos con algo puesto: suma de `trackMinutes`, nunca de duraciones. */
  plannedMinutes: number
  freeMinutes: number
  /** El día entero de la barra: `windowEnd − windowStart`. */
  dayMinutes: number
  windowStart: number
  windowEnd: number
  /** Los tramos de la barra, en orden y sumando `dayMinutes` (criterio 4). */
  segments: TemplateSegment[]
  /**
   * Lo que se lee en la lista, en orden: los ítems con hora y, entre ellos y en
   * los bordes del día, los huecos (FEAT-009, criterios 140-146). Vacío cuando
   * el día no tiene ningún ítem con hora (criterio 149).
   */
  rows: TemplateRow[]
}

export type TemplateDayCount = {
  /** Cuántas cosas hay ese día, con hora y sin ella. */
  count: number
  /** Cuánto suman las que tienen duración. */
  minutes: number
  untimedCount: number
  hasAny: boolean
}

export type BuildTemplateDayInput = {
  items: VidaItem[]
  day: VidaDayOfWeek
  /** `HH:mm` del inicio del día de Vida (ajustes o respaldo). */
  dayStart: string
  dayEnd: string
}

/**
 * Los ítems de la plantilla que se pintan en un día de la semana.
 *
 * Es `usableTemplateItems` (`vida-build-day.utils.ts:63`) **menos la regla de
 * `isActive`**, y eso no es un descuido (decisión A8):
 *
 * - **Las actividades archivadas no se pintan**: «Armar desde la plantilla» ya
 *   las excluye, así que enseñarlas aquí sería prometer algo que Hoy nunca va a
 *   ofrecer. `status` llega `undefined` cuando el documento no lo pide: eso es
 *   «no se sabe» y entonces no se descarta nada.
 * - **Los desactivados sí se pintan**, en su hora y en trazo suave: es
 *   literalmente el criterio 8, y es lo que hace que «desactivar ≠ quitar»
 *   signifique algo.
 */
export function templateItemsForDay(items: VidaItem[], day: VidaDayOfWeek): VidaItem[] {
  return items.filter(
    (item) => item.activity?.status !== 'cancelled' && item.days.includes(day),
  )
}

/** El título de un ítem, con el mismo respaldo que usa el volcado a Hoy. */
export function templateItemTitle(item: VidaItem): string {
  return item.activity?.title ?? 'Actividad'
}

/**
 * La duración **de verdad** de un ítem, o `null`.
 *
 * `0` y los negativos cuentan como «sin duración» —igual que en
 * `vida-build-day.utils.ts`—: un bloque de `08:00–08:00` no es nada, y
 * `?? DEFAULT` no atraparía el `0`. El API valida `> 0` al crear; esto es el
 * cinturón para lo que ya estuviera guardado.
 */
function durationOf(item: VidaItem): number | null {
  const minutes = item.durationMinutes
  if (minutes === null || minutes === undefined || minutes <= 0) return null
  return minutes
}

/** Un ítem tiene hora solo si es `HH:mm` de verdad; si no, va al cajón. */
function hasTime(item: VidaItem): boolean {
  return isValidHhMm(item.startTime)
}

/**
 * El día tipo repartido: lo que tiene hora en orden de reloj, lo que no en su
 * cajón, y los tramos de la barra.
 *
 * El orden es **la hora** y, a igual hora, **el nombre** (lo dice el alcance de
 * la sección 1: `orderIndex` se queda quieto y no vuelve a ser un orden
 * manual). No hay asas de arrastre ni flechas: la hora es el orden (criterio 6).
 */
export function buildTemplateDay({
  items,
  day,
  dayStart,
  dayEnd,
}: BuildTemplateDayInput): TemplateDay {
  const ofDay = templateItemsForDay(items, day)

  const timedItems = ofDay.filter(hasTime).sort((a, b) => {
    const diff = parseTimeToMinutes(a.startTime!) - parseTimeToMinutes(b.startTime!)
    if (diff !== 0) return diff
    return compareVidaNames(templateItemTitle(a), templateItemTitle(b))
  })
  const untimed = ofDay
    .filter((item) => !hasTime(item))
    .sort((a, b) => compareVidaNames(templateItemTitle(a), templateItemTitle(b)))

  const placed = timedItems.map((item) => {
    const startMinutes = parseTimeToMinutes(item.startTime!)
    const durationMinutes = durationOf(item)
    return {
      item,
      startMinutes,
      endMinutes: startMinutes + (durationMinutes ?? 0),
      durationMinutes,
    }
  })

  // La ventana se estira si algo cae fuera del horario de Vida (A5): lo que no
  // se pinta se pierde, y la barra dejaría de sumar el día entero.
  const windowStart = placed.reduce(
    (min, entry) => Math.min(min, entry.startMinutes),
    parseTimeToMinutes(dayStart),
  )
  const windowEnd = placed.reduce(
    (max, entry) => Math.max(max, entry.endMinutes),
    parseTimeToMinutes(dayEnd),
  )

  const segments: TemplateSegment[] = []
  const timed: TemplateEntry[] = []
  const rows: TemplateRow[] = []
  let cursor = windowStart
  // Un ítem sin duración **retiene** el hueco que vendría detrás: hasta el
  // corte siguiente no se sabe si queda algo libre, así que en vez del hueco se
  // emite una línea que lo dice (criterio 145).
  let pendingUnknown: { item: VidaItem; startMinutes: number } | null = null

  function pushGap(from: number, to: number) {
    if (to <= from) return
    segments.push({
      id: `free-${minutesToTime(from)}-${minutesToTime(to)}`,
      kind: 'free',
      trackMinutes: to - from,
      startMinutes: from,
      endMinutes: to,
    })
  }

  /**
   * El corte donde se decide qué va entre lo anterior y lo que viene: la hora
   * del ítem siguiente o el fin del día. Las tres reglas, en este orden:
   *
   * 1. Si el ítem anterior no tenía duración, aquí va **su línea**, nunca un
   *    hueco (criterio 145); `untilMinutes` nunca cae antes de su propia hora
   *    —dos ítems a la misma hora, borde sin criterio— y jamás se emite hueco
   *    por él.
   * 2. Si el corte no pasa del cursor, **no hay hueco**: es un solape, y la
   *    plantilla los permite en silencio (criterio 144).
   * 3. Si no, el hueco, con su tamaño y su forma fina si no llega a
   *    `MIN_GAP_MINUTES` (criterio 143).
   */
  function pushRowsUntil(cut: number, isDayEnd: boolean) {
    if (pendingUnknown) {
      rows.push({
        kind: 'unknown',
        id: `unknown-${pendingUnknown.item.id}`,
        item: pendingUnknown.item,
        untilMinutes: Math.max(cut, pendingUnknown.startMinutes),
        isDayEnd,
      })
      pendingUnknown = null
      return
    }
    if (cut <= cursor) return
    const minutes = cut - cursor
    rows.push({
      kind: 'gap',
      id: `free-${minutesToTime(cursor)}-${minutesToTime(cut)}`,
      startMinutes: cursor,
      endMinutes: cut,
      minutes,
      isSliver: minutes < MIN_GAP_MINUTES,
    })
  }

  for (const entry of placed) {
    pushGap(cursor, entry.startMinutes)
    pushRowsUntil(entry.startMinutes, false)
    // `trackMinutes`, como en la agenda de Hoy: con dos ítems pisados —que aquí
    // se permiten a propósito— sumar duraciones rebasaría el 100 %.
    const trackMinutes = Math.max(0, entry.endMinutes - Math.max(entry.startMinutes, cursor))
    timed.push({ ...entry, trackMinutes })
    rows.push({ kind: 'item', id: `item-${entry.item.id}`, entry: { ...entry, trackMinutes } })
    if (trackMinutes > 0) {
      segments.push({
        id: `planned-${entry.item.id}`,
        kind: 'planned',
        trackMinutes,
        startMinutes: Math.max(entry.startMinutes, cursor),
        endMinutes: entry.endMinutes,
      })
    }
    if (entry.durationMinutes === null || entry.durationMinutes <= 0) {
      pendingUnknown = { item: entry.item, startMinutes: entry.startMinutes }
    }
    cursor = Math.max(cursor, entry.endMinutes)
  }
  pushGap(cursor, windowEnd)
  // Un día sin ningún ítem con hora no pinta huecos: sigue siendo el estado
  // vacío de siempre (criterio 149).
  if (placed.length > 0) pushRowsUntil(windowEnd, true)

  const plannedMinutes = timed.reduce((total, entry) => total + entry.trackMinutes, 0)
  const dayMinutes = Math.max(0, windowEnd - windowStart)

  return {
    day,
    timed,
    untimed,
    plannedMinutes,
    freeMinutes: Math.max(0, dayMinutes - plannedMinutes),
    dayMinutes,
    windowStart,
    windowEnd,
    segments,
    rows,
  }
}

/**
 * Las cuentas de las siete pestañas (criterios 2 y 3), de una sola pasada.
 *
 * `hasAny` es lo que enciende el punto rayado: **cuenta también lo que no tiene
 * hora**, porque una cosa sin hora sigue siendo algo puesto ese día.
 */
export function countTemplateByDay(items: VidaItem[]): Record<VidaDayOfWeek, TemplateDayCount> {
  const empty = () => ({ count: 0, minutes: 0, untimedCount: 0, hasAny: false })
  const result = Object.fromEntries(VIDA_DAY_ORDER.map((day) => [day, empty()])) as Record<
    VidaDayOfWeek,
    TemplateDayCount
  >

  for (const day of VIDA_DAY_ORDER) {
    for (const item of templateItemsForDay(items, day)) {
      const entry = result[day]
      entry.count += 1
      entry.hasAny = true
      entry.minutes += durationOf(item) ?? 0
      if (!hasTime(item)) entry.untimedCount += 1
    }
  }

  return result
}

/**
 * La meta de la tarjeta: «45 min · L M X J V» (criterio 6).
 *
 * Un ítem **sin duración** se lee «sin duración», nunca «0 min» ni una duración
 * inventada (criterio 7).
 */
export function describeItemDuration(item: VidaItem): string {
  const minutes = durationOf(item)
  return minutes === null ? 'sin duración' : formatDurationMinutes(minutes)
}

/** Los días **del propio ítem**: «L M X J V», o «todos los días» con los siete. */
export function describeItemDays(item: VidaItem): string {
  const days = VIDA_DAY_ORDER.filter((day) => item.days.includes(day))
  if (days.length === 0) return 'sin días'
  if (days.length === VIDA_DAY_ORDER.length) return 'todos los días'
  return days.map((day) => VIDA_DAY_SHORT_LABELS[day]).join(' ')
}

/** Las dos mitades juntas, que es como se leen en la tarjeta. */
export function describeItemMeta(item: VidaItem): string {
  return `${describeItemDuration(item)} · ${describeItemDays(item)}`
}

/** El hueco más grande del día, ya recortado a la ventana. `null` si no hay ninguno que nombrar. */
function largestNameableGap(day: TemplateDay): { startMinutes: number; endMinutes: number } | null {
  let best: { startMinutes: number; endMinutes: number; minutes: number } | null = null
  let cursor = day.windowStart

  for (const entry of day.timed) {
    const gap = entry.startMinutes - cursor
    if (gap >= TEMPLATE_NAMEABLE_GAP_MINUTES && (!best || gap > best.minutes)) {
      best = { startMinutes: cursor, endMinutes: entry.startMinutes, minutes: gap }
    }
    cursor = Math.max(cursor, entry.endMinutes)
  }

  const tail = day.windowEnd - cursor
  if (tail >= TEMPLATE_NAMEABLE_GAP_MINUTES && (!best || tail > best.minutes)) {
    best = { startMinutes: cursor, endMinutes: day.windowEnd, minutes: tail }
  }

  return best ? { startMinutes: best.startMinutes, endMinutes: best.endMinutes } : null
}

/** En qué parte del día se concentra lo puesto, si es que se concentra. */
function busiestStretch(day: TemplateDay): string | null {
  if (day.plannedMinutes <= 0) return null
  const buckets = { morning: 0, afternoon: 0, evening: 0 }

  for (const entry of day.timed) {
    if (entry.trackMinutes <= 0) continue
    const middle = entry.startMinutes + entry.trackMinutes / 2
    if (middle < MORNING_END) buckets.morning += entry.trackMinutes
    else if (middle < AFTERNOON_END) buckets.afternoon += entry.trackMinutes
    else buckets.evening += entry.trackMinutes
  }

  const [label, minutes] = (
    [
      ['por la mañana', buckets.morning],
      ['por la tarde', buckets.afternoon],
      ['por la noche', buckets.evening],
    ] as const
  ).reduce((best, current) => (current[1] > best[1] ? current : best))

  return minutes / day.plannedMinutes > BUSY_STRETCH_SHARE ? label : null
}

/** Los números pequeños se escriben con letra, como el render: «Seis cosas». */
function spellFeminine(count: number): string {
  const words = [
    'cero',
    'una',
    'dos',
    'tres',
    'cuatro',
    'cinco',
    'seis',
    'siete',
    'ocho',
    'nueve',
    'diez',
  ]
  return words[count] ?? String(count)
}

/**
 * La frase del criterio 5, **compuesta con reglas y nunca inventada**: «Seis
 * cosas con hora y una sin ella. Tu viernes está lleno por la mañana y libre de
 * 14:00 a 19:00.»
 *
 * Imita a `buildGuidanceLine` (`vida-agenda.utils.ts:371`) en lo que importa:
 * números reales, sin reproche —un rato sin nada es **libre**, nunca «vacío»
 * como reproche— y **cada mitad puede faltar**. Si no hay un hueco grande que
 * nombrar, no se afirma uno; si lo puesto no se concentra en ninguna parte del
 * día, tampoco se dice que el día esté lleno por ningún lado.
 */
export function buildTemplateGuidance(day: TemplateDay, dayLabel: string): string {
  const timedCount = day.timed.length
  const untimedCount = day.untimed.length

  if (timedCount === 0 && untimedCount === 0) {
    return `El ${dayLabel} no tienes nada puesto.`
  }

  const head =
    timedCount === 0
      ? `Todavía nada con hora y ${spellFeminine(untimedCount)} sin ${untimedCount === 1 ? 'ella' : 'ellas'}.`
      : untimedCount === 0
        ? `${capitalize(spellFeminine(timedCount))} ${plural(timedCount, 'cosa', 'cosas')} con hora.`
        : `${capitalize(spellFeminine(timedCount))} ${plural(timedCount, 'cosa', 'cosas')} con hora y ${spellFeminine(untimedCount)} sin ${untimedCount === 1 ? 'ella' : 'ellas'}.`

  // Sin nada con hora **no hay forma del día que describir**: decir «tu jueves
  // está libre de 6:30 a 23:00» es cierto y no aporta, y «lleno» no lo es.
  if (timedCount === 0) return head

  const stretch = busiestStretch(day)
  const gap = largestNameableGap(day)
  if (!stretch && !gap) return head

  const parts = [
    stretch ? `lleno ${stretch}` : null,
    gap
      ? `libre de ${formatTimeForDisplay(minutesToTime(gap.startMinutes))} a ${formatTimeForDisplay(minutesToTime(gap.endMinutes))}`
      : null,
  ].filter((part): part is string => part !== null)

  return `${head} Tu ${dayLabel} está ${parts.join(' y ')}.`
}

/** «3h 40 puestas de 16h 30» (criterio 4), con los minutos como texto real. */
export function describeTemplateDayTotals(day: TemplateDay): {
  plannedLabel: string
  dayLabel: string
} {
  return {
    plannedLabel: formatDurationFromMinutes(day.plannedMinutes),
    dayLabel: formatDurationFromMinutes(day.dayMinutes),
  }
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

/* ── La hoja del ítem (tajada 2) ────────────────────────────────────────────
 *
 * Tres funciones puras que la hoja y su confirmación leen, y que se prueban
 * aquí en vez de montando un modal: la vista previa de cómo queda en Hoy
 * (criterio 20), el aviso de los otros días (criterio 22) y los días que
 * quedan al quitar uno (criterio 22, la salida «solo del viernes»).
 */

export type TemplatePreviewInput = {
  days: VidaDayOfWeek[]
  /** `HH:mm`, `''` o `null`. */
  startTime: string | null
  durationMinutes: number | null
}

export type TemplatePreview = {
  /** `true` cuando se puede enseñar un rango de verdad; `false` cuando falta algo. */
  complete: boolean
  /** «lunes, miércoles y viernes», «todos los días», o `''` si no hay ninguno. */
  daysText: string
  /** «de 9:00 a 9:45» cuando están las dos; `null` si falta alguna. */
  rangeText: string | null
  /** Lo que le falta, dicho: `null` cuando no falta nada. */
  missingText: string | null
  /** La frase entera, que es lo que se lee de corrido. */
  text: string
}

/** «lunes, miércoles y viernes»: la lista en lenguaje natural, de lunes a domingo. */
export function describeDaysInWords(days: VidaDayOfWeek[]): string {
  const ordered = VIDA_DAY_ORDER.filter((day) => days.includes(day))
  if (ordered.length === 0) return ''
  if (ordered.length === VIDA_DAY_ORDER.length) return 'todos los días'
  const labels = ordered.map((day) => VIDA_DAY_LABELS[day])
  if (labels.length === 1) return labels[0]!
  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`
}

/**
 * **Cómo queda en Hoy** (criterio 20), calculado de lo que hay elegido en la
 * hoja —no de lo guardado—: «Así queda en Hoy: lunes, miércoles y viernes de
 * 9:00 a 9:45».
 *
 * Sin hora o sin duración **no se enseña un rango falso**: se dice qué le
 * falta, y lo que se dice es lo que Hoy hace de verdad —sin hora, `buildDay`
 * la encadena al final del día; sin duración, le pone `DEFAULT_BLOCK_MINUTES`
 * (`vida-build-day.utils.ts:146`)—.
 */
export function describeTemplatePreview({
  days,
  startTime,
  durationMinutes,
}: TemplatePreviewInput): TemplatePreview {
  const daysText = describeDaysInWords(days)
  const hasTime = isValidHhMm(startTime)
  const duration = durationMinutes !== null && durationMinutes > 0 ? durationMinutes : null

  if (daysText === '') {
    return {
      complete: false,
      daysText: '',
      rangeText: null,
      missingText: 'Marca al menos un día y verás cómo queda en Hoy.',
      text: 'Marca al menos un día y verás cómo queda en Hoy.',
    }
  }

  const head = `Así queda en Hoy: ${daysText}`

  if (!hasTime) {
    const missing = `Sin hora, Hoy la pone al final del día, una detrás de otra.`
    return {
      complete: false,
      daysText,
      rangeText: null,
      missingText: missing,
      text: `${head}. ${missing}`,
    }
  }

  const from = formatTimeForDisplay(startTime!)

  if (duration === null) {
    const missing = `Sin cuánto dura, Hoy le pone ${DEFAULT_BLOCK_MINUTES} min al armar el día.`
    return {
      complete: false,
      daysText,
      rangeText: null,
      missingText: missing,
      text: `${head} a las ${from}. ${missing}`,
    }
  }

  const to = formatTimeForDisplay(calculateEndTime(startTime!, duration))
  const rangeText = `de ${from} a ${to}`

  return {
    complete: true,
    daysText,
    rangeText,
    missingText: null,
    text: `${head} ${rangeText}.`,
  }
}

/**
 * «también está los lunes y los miércoles» (criterio 22): lo que hay que decir
 * **antes** de quitar un ítem desde un día, porque quitarlo los quita todos.
 *
 * `null` cuando ese ítem solo está en ese día: entonces no hay nada que avisar
 * y la confirmación tiene una sola salida.
 */
export function describeOtherDays(item: VidaItem, day: VidaDayOfWeek): string | null {
  const others = daysWithout(item, day)
  if (others.length === 0) return null
  // Con el artículo en cada día: «los lunes y los miércoles», que es como lo
  // escribe el criterio 22 y como se lee en voz alta.
  const labels = others.map((other) => `los ${pluralDayLabel(VIDA_DAY_LABELS[other])}`)
  const list =
    labels.length === 1
      ? labels[0]!
      : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`
  return `también está ${list}`
}

/** Los días que le quedan a un ítem si se le quita uno, de lunes a domingo. */
export function daysWithout(item: VidaItem, day: VidaDayOfWeek): VidaDayOfWeek[] {
  return VIDA_DAY_ORDER.filter((other) => other !== day && item.days.includes(other))
}

/**
 * Qué hay puesto **a esa hora** en un día (criterio 33).
 *
 * Es el dato del que sale el «Cabe: …» del panel de añadir, y **no bloquea
 * nada**: los solapes se ven y se guardan igual —quien los resuelve es «Armar
 * desde la plantilla» en Hoy, que corre detrás lo que se pisa (decisión (f) del
 * analista)—.
 *
 * Un ítem **sin duración** ocupa solo su minuto de inicio: no se le inventan 30
 * min para decir que estorba, que es la misma regla que el criterio 7.
 */
export function whatIsAt(dayItems: VidaItem[], minutes: number): VidaItem | null {
  for (const item of dayItems) {
    if (!hasTime(item)) continue
    const start = parseTimeToMinutes(item.startTime!)
    const duration = durationOf(item)
    const end = duration === null ? start : start + duration
    if (minutes >= start && minutes < Math.max(end, start + 1)) return item
  }
  return null
}

/**
 * La línea del criterio 33, ya escrita: «a las 18:00 no tienes nada» o «a las
 * 18:00 ya tienes *Pasear a las mascotas*». `null` si todavía no hay hora que
 * mirar: sin hora no se afirma nada.
 */
export function describeFitAt(dayItems: VidaItem[], startTime: string): string | null {
  if (!isValidHhMm(startTime)) return null
  const at = formatTimeForDisplay(startTime)
  const busy = whatIsAt(dayItems, parseTimeToMinutes(startTime))
  if (!busy) return `a las ${at} no tienes nada`
  return `a las ${at} ya tienes ${templateItemTitle(busy)}`
}

/**
 * Las horas a las que **ya está** una actividad en la plantilla, en palabras:
 * «a las 7:30», «a las 7:30 y a las 19:00», «a las 7:30, a las 13:00 y a las
 * 19:00». `null` si esa actividad no está todavía, y los ítems **sin hora** se
 * cuentan aparte («sin hora»), porque tampoco son «otra hora».
 *
 * Es lo que sostiene el aviso del criterio 34 —«*Pasear a las mascotas* ya está
 * a las 7:30 · esto le añade otra hora»— antes de crear el segundo ítem.
 */
export function describeExistingHours(items: VidaItem[]): string | null {
  if (items.length === 0) return null
  const parts = items.map((item) =>
    hasTime(item) ? `a las ${formatTimeForDisplay(item.startTime!)}` : 'sin hora',
  )
  if (parts.length === 1) return parts[0]!
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`
}

/**
 * La línea del criterio 35 para **la hoja del catálogo**: «esta actividad tiene
 * 2 horas en tu plantilla · las dos se cambian en Plantilla».
 *
 * `null` con uno o ninguno: el catálogo sigue enseñando **un** ítem por
 * actividad y solo hay algo que decir cuando esa hoja se estaría quedando
 * corta. Nunca enseña una hora como si fuera la única, que es literalmente lo
 * que el criterio prohíbe.
 */
export function describeMultipleItemsNote(items: VidaItem[]): string | null {
  const timed = items.filter((item) => hasTime(item))
  if (items.length < 2) return null
  const count = timed.length >= 2 ? timed.length : items.length
  const noun = timed.length >= 2 ? 'horas' : 'veces'
  const all = count === 2 ? 'las dos' : `las ${count}`
  return `Esta actividad tiene ${count} ${noun} en tu plantilla · ${all} se cambian en Plantilla.`
}

/**
 * Los días **en la forma corta en que se dicen** (criterio 36): «de lunes a
 * viernes», «el fin de semana», «todos los días», y si no es ninguno de esos
 * tres, la lista de siempre (`describeDaysInWords`).
 *
 * Existe porque el contador del primer minuto es literal —«3 elegidas · de
 * lunes a viernes»— y enumerar los cinco días ahí lo haría ilegible. No
 * sustituye a `describeDaysInWords`: la vista previa de la hoja sigue
 * enumerando, que es lo que su criterio pide.
 */
export function describeDaysPhrase(days: VidaDayOfWeek[]): string {
  const ordered = VIDA_DAY_ORDER.filter((day) => days.includes(day))
  if (ordered.length === 0) return ''
  const key = ordered.join(',')
  if (key === 'monday,tuesday,wednesday,thursday,friday') return 'de lunes a viernes'
  if (key === 'saturday,sunday') return 'el fin de semana'
  return describeDaysInWords(ordered)
}

/* ── La semana entera y copiar un día (tajada 4) ────────────────────────────
 *
 * Tres funciones puras más: la geometría de la cuadrícula (criterios 42–47),
 * el total de la semana (criterio 46) y **qué se copia y qué se queda como
 * está** (criterios 50 y 52).
 *
 * La regla que manda aquí la escribió el arquitecto en A5 y la repitió el
 * revisor de la tajada 1: `buildTemplateDay` **estira la ventana por día** —con
 * algo a las 05:00 el resumen de ese día pasa a «de 18h»—, y siete columnas con
 * siete ventanas distintas **no son comparables**. Por eso la cuadrícula
 * calcula **una sola ventana para los siete días** y la reparte a todos.
 */

/**
 * Lo mínimo que mide un bloque en la cuadrícula, en minutos de escala.
 *
 * No es una duración inventada —`durationMinutes` sigue llegando `null` y la
 * lectura sigue diciendo «sin duración» (criterio 7)—: es **alto mínimo para
 * que se vea**. El criterio 47 pide que nada «se recorte hasta desaparecer», y
 * un bloque de 0 min con alto 0 % es un bloque perdido. El render hace lo
 * mismo: dibuja los de 15 min con el alto de ~30.
 */
export const TEMPLATE_GRID_MIN_BLOCK_MINUTES = 30

/** Cada cuántas horas se escribe una marca en el rail (7:00 · 9:00 · 11:00…). */
export const TEMPLATE_GRID_HOUR_STEP = 2

/** Por debajo de esto, un bloque solo escribe su nombre (cabe una línea). */
export const TEMPLATE_GRID_TIME_LABEL_MINUTES = 40

export type TemplateWeekBlock = {
  item: VidaItem
  startMinutes: number
  /** `startMinutes` + su duración real; igual a `startMinutes` si no la tiene. */
  endMinutes: number
  /** **`null` cuando el ítem no la tiene** (criterio 7). */
  durationMinutes: number | null
  /** Desde el borde de arriba de la ventana común, en %. */
  topPercent: number
  /** Alto en %, **nunca 0** y nunca por debajo del borde de abajo. */
  heightPercent: number
  /** El carril en el que se pinta cuando algo se pisa: 0 es el de la izquierda. */
  lane: number
  /** Cuántos carriles se reparten su trozo de columna (criterio 47). */
  laneCount: number
  /** Lo que se lee de corrido: «Bañarme · lunes a las 7:00 · 15 min». */
  label: string
  /**
   * Si el bloque da de sí para escribir **su hora encima del nombre**. Es
   * geometría, y por eso se decide aquí: un bloque corto con dos líneas recorta
   * las dos y no se lee ninguna. El render hace lo mismo —los de 15 y 20 min
   * llevan solo el nombre—, y la hora **nunca se pierde**: está en el rótulo
   * que se lee y en el rail de la izquierda.
   */
  showTime: boolean
}

export type TemplateWeekColumn = {
  day: VidaDayOfWeek
  blocks: TemplateWeekBlock[]
  /** Los «sin hora» del día, que van **debajo de la columna** (criterio 44). */
  untimed: VidaItem[]
  /** Cuántas cosas hay ese día, con hora y sin ella. */
  count: number
  /**
   * Cuánto tiempo ocupa el día: **la unión de los tramos**, no la suma de
   * duraciones. Es exactamente el mismo número que `plannedMinutes` de
   * `buildTemplateDay`, y por eso la cabecera de la columna y el resumen del
   * día dicen lo mismo aunque dos cosas se pisen.
   */
  plannedMinutes: number
}

export type TemplateGridHourMark = {
  minutes: number
  /** «7:00», sin cero a la izquierda, como el resto del módulo. */
  label: string
  topPercent: number
}

export type TemplateCategoryLegend = {
  id: string
  name: string
  color: string | null
}

export type TemplateWeekGrid = {
  columns: TemplateWeekColumn[]
  /** La ventana **común a las siete columnas** (A5), en minutos desde medianoche. */
  windowStart: number
  windowEnd: number
  windowMinutes: number
  hourMarks: TemplateGridHourMark[]
  /** Las categorías **que aparecen**, por nombre: la leyenda del criterio 45. */
  categories: TemplateCategoryLegend[]
  /** Si hay algo desactivado: lo que el trazo punteado significa (criterio 45). */
  hasInactive: boolean
  /** Si no hay ni un bloque ni una píldora en toda la semana. */
  isEmpty: boolean
}

export type BuildTemplateWeekGridInput = {
  items: VidaItem[]
  dayStart: string
  dayEnd: string
}

type PlacedEntry = {
  item: VidaItem
  startMinutes: number
  endMinutes: number
  durationMinutes: number | null
  /** El tramo que ocupa **en la pantalla**, con el alto mínimo ya aplicado. */
  visibleEnd: number
}

function placeTimed(items: VidaItem[]): PlacedEntry[] {
  return items
    .filter(hasTime)
    .map((item) => {
      const startMinutes = parseTimeToMinutes(item.startTime!)
      const durationMinutes = durationOf(item)
      return {
        item,
        startMinutes,
        endMinutes: startMinutes + (durationMinutes ?? 0),
        durationMinutes,
        visibleEnd:
          startMinutes + Math.max(durationMinutes ?? 0, TEMPLATE_GRID_MIN_BLOCK_MINUTES),
      }
    })
    .sort((a, b) => {
      const diff = a.startMinutes - b.startMinutes
      if (diff !== 0) return diff
      return compareVidaNames(templateItemTitle(a.item), templateItemTitle(b.item))
    })
}

/** La unión de los tramos ocupados: el mismo número que `plannedMinutes`. */
function unionMinutes(entries: PlacedEntry[]): number {
  let total = 0
  let cursor = -Infinity
  for (const entry of entries) {
    const start = Math.max(entry.startMinutes, cursor)
    if (entry.endMinutes > start) {
      total += entry.endMinutes - start
      cursor = entry.endMinutes
    } else {
      cursor = Math.max(cursor, entry.endMinutes)
    }
  }
  return total
}

/**
 * Los carriles: **dos cosas que se pisan se ven las dos** (criterio 47).
 *
 * Se agrupan los que se solapan de verdad —por su hora y su duración, no por el
 * alto mínimo— y dentro de cada grupo cada uno se va al primer carril libre. Un
 * ítem sin duración ocupa **su minuto**, no media hora: inventarle 30 min para
 * decidir que estorba sería la misma mentira que el criterio 7 prohíbe.
 */
function assignLanes(entries: PlacedEntry[]): { lane: number; laneCount: number }[] {
  const result: { lane: number; laneCount: number }[] = entries.map(() => ({
    lane: 0,
    laneCount: 1,
  }))
  const endOf = (entry: PlacedEntry) => Math.max(entry.endMinutes, entry.startMinutes + 1)

  let groupStart = 0
  let groupEnd = -Infinity
  let laneEnds: number[] = []

  function closeGroup(until: number) {
    const laneCount = Math.max(1, laneEnds.length)
    for (let index = groupStart; index < until; index += 1) {
      result[index]!.laneCount = laneCount
    }
  }

  entries.forEach((entry, index) => {
    if (entry.startMinutes >= groupEnd) {
      closeGroup(index)
      groupStart = index
      groupEnd = -Infinity
      laneEnds = []
    }

    let lane = laneEnds.findIndex((end) => end <= entry.startMinutes)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(endOf(entry))
    } else {
      laneEnds[lane] = endOf(entry)
    }

    result[index] = { lane, laneCount: 1 }
    groupEnd = Math.max(groupEnd, endOf(entry))
  })
  closeGroup(entries.length)

  return result
}

/** «Bañarme · lunes a las 7:00 · 15 min», que es lo que se oye de un bloque. */
function describeBlock(item: VidaItem, startMinutes: number, day: VidaDayOfWeek): string {
  const parts = [
    templateItemTitle(item),
    `${VIDA_DAY_LABELS[day]} a las ${formatTimeForDisplay(minutesToTime(startMinutes))}`,
    describeItemDuration(item),
  ]
  if (item.isActive === false) parts.push('desactivada · no sale en Hoy')
  return parts.join(' · ')
}

/**
 * Las siete columnas de la cuadrícula (criterios 42–47), **con una sola ventana
 * para todas**.
 *
 * Aquí sale calculado **todo** lo que la cuadrícula necesita —`top` y `height`
 * en porcentaje, el carril de cada bloque, las marcas del rail, las cuentas de
 * cada cabecera y la leyenda—: el componente solo traduce números a estilos,
 * que es la regla que ya sigue `VidaDayBudget` y que el plan repite para esta
 * pieza.
 *
 * La ventana se estira si algo cae fuera del horario de Vida (A5) **mirando la
 * semana entera**: si el domingo hay algo a las 5:00, las siete columnas
 * empiezan a las 5:00. Si cada una empezara donde le conviene, comparar
 * columnas —que es para lo único que sirve esta vista— sería engañoso.
 */
export function buildTemplateWeekGrid({
  items,
  dayStart,
  dayEnd,
}: BuildTemplateWeekGridInput): TemplateWeekGrid {
  const perDay = VIDA_DAY_ORDER.map((day) => {
    const ofDay = templateItemsForDay(items, day)
    return {
      day,
      placed: placeTimed(ofDay),
      untimed: ofDay
        .filter((item) => !hasTime(item))
        .sort((a, b) => compareVidaNames(templateItemTitle(a), templateItemTitle(b))),
      count: ofDay.length,
    }
  })

  const all = perDay.flatMap((entry) => entry.placed)
  const windowStart = all.reduce(
    (min, entry) => Math.min(min, entry.startMinutes),
    parseTimeToMinutes(dayStart),
  )
  // Con el alto mínimo dentro: si el último bloque del día acabara justo en el
  // borde, se recortaría hasta desaparecer, que es lo que el criterio 47 no
  // quiere.
  const windowEnd = all.reduce(
    (max, entry) => Math.max(max, entry.visibleEnd),
    parseTimeToMinutes(dayEnd),
  )
  const windowMinutes = Math.max(1, windowEnd - windowStart)

  const columns: TemplateWeekColumn[] = perDay.map(({ day, placed, untimed, count }) => {
    const lanes = assignLanes(placed)
    return {
      day,
      untimed,
      count,
      plannedMinutes: unionMinutes(placed),
      blocks: placed.map((entry, index) => {
        const topPercent = ((entry.startMinutes - windowStart) / windowMinutes) * 100
        const rawHeight = ((entry.visibleEnd - entry.startMinutes) / windowMinutes) * 100
        return {
          item: entry.item,
          startMinutes: entry.startMinutes,
          endMinutes: entry.endMinutes,
          durationMinutes: entry.durationMinutes,
          topPercent,
          heightPercent: Math.min(rawHeight, Math.max(0, 100 - topPercent)),
          lane: lanes[index]!.lane,
          laneCount: lanes[index]!.laneCount,
          label: describeBlock(entry.item, entry.startMinutes, day),
          showTime:
            entry.visibleEnd - entry.startMinutes >= TEMPLATE_GRID_TIME_LABEL_MINUTES &&
            entry.durationMinutes !== null,
        }
      }),
    }
  })

  const hourMarks: TemplateGridHourMark[] = []
  const firstHour = Math.ceil(windowStart / 60) * 60
  for (
    let minutes = firstHour;
    minutes <= windowEnd;
    minutes += TEMPLATE_GRID_HOUR_STEP * 60
  ) {
    hourMarks.push({
      minutes,
      label: formatTimeForDisplay(minutesToTime(minutes)),
      topPercent: ((minutes - windowStart) / windowMinutes) * 100,
    })
  }

  const byCategory = new Map<string, TemplateCategoryLegend>()
  let hasInactive = false
  for (const column of columns) {
    for (const entry of [...column.blocks.map((block) => block.item), ...column.untimed]) {
      if (entry.isActive === false) hasInactive = true
      const category = entry.activity?.category
      if (category && !byCategory.has(category.id)) {
        byCategory.set(category.id, {
          id: category.id,
          name: category.name,
          color: category.color ?? null,
        })
      }
    }
  }

  return {
    columns,
    windowStart,
    windowEnd,
    windowMinutes,
    hourMarks,
    categories: [...byCategory.values()].sort((a, b) => compareVidaNames(a.name, b.name)),
    hasInactive,
    isEmpty: columns.every((column) => column.count === 0),
  }
}

export type TemplateWeekTotals = {
  /** Cuántas cosas hay puestas en la semana, contando cada día por separado. */
  itemsCount: number
  timedCount: number
  untimedCount: number
  /** La suma de lo ocupado en los siete días (la unión por día, no duraciones). */
  plannedMinutes: number
  /** Siete veces la ventana común. */
  weekMinutes: number
  windowStart: number
  windowEnd: number
  /** La línea del criterio 46, ya escrita. */
  text: string
}

/**
 * El total de arriba (criterio 46): «43 cosas puestas · 26h 15 a la semana de
 * 115h 30 · tu día va de 6:30 a 23:00».
 *
 * Los tres números salen de la misma ventana común que la cuadrícula, así que
 * lo que se lee arriba y lo que se ve abajo **no pueden contradecirse**. Si
 * algo cae fuera del horario de Vida y estira la ventana, el «tu día va de…»
 * dice la ventana estirada: es la que se está pintando, y la otra sería una
 * media verdad.
 */
export function buildWeekTotals(grid: TemplateWeekGrid): TemplateWeekTotals {
  const itemsCount = grid.columns.reduce((total, column) => total + column.count, 0)
  const timedCount = grid.columns.reduce((total, column) => total + column.blocks.length, 0)
  const plannedMinutes = grid.columns.reduce(
    (total, column) => total + column.plannedMinutes,
    0,
  )
  const weekMinutes = grid.windowMinutes * VIDA_DAY_ORDER.length

  const text = `${itemsCount} ${itemsCount === 1 ? 'cosa puesta' : 'cosas puestas'} · ${formatDurationFromMinutes(
    plannedMinutes,
  )} a la semana de ${formatDurationFromMinutes(weekMinutes)} · tu día va de ${formatTimeForDisplay(
    minutesToTime(grid.windowStart),
  )} a ${formatTimeForDisplay(minutesToTime(grid.windowEnd))}`

  return {
    itemsCount,
    timedCount,
    untimedCount: itemsCount - timedCount,
    plannedMinutes,
    weekMinutes,
    windowStart: grid.windowStart,
    windowEnd: grid.windowEnd,
    text,
  }
}

export type TemplateCopyUpdate = {
  /** Lo que viaja al API: **un `vidaItemUpdate` por ítem** (A7), nunca un create. */
  input: VidaItemUpdateInput
  /** Para poder nombrar por su nombre lo que falle, como `useBuildWeekFromTemplate`. */
  title: string
  /** Los días que se le añaden, de lunes a domingo. */
  addedDays: VidaDayOfWeek[]
}

export type TemplateCopySkip = {
  title: string
  day: VidaDayOfWeek
  /**
   * `already-there`: **ese mismo ítem** ya estaba en el día destino.
   * `other-item`: hay **otro** ítem de la misma actividad, a cualquier hora.
   * En los dos casos no se toca nada y el resumen lo dice (criterio 50).
   */
  reason: 'already-there' | 'other-item'
}

export type TemplateCopyPlan = {
  updates: TemplateCopyUpdate[]
  skipped: TemplateCopySkip[]
}

/**
 * Qué se copia de un día a otros, y qué **se queda como está** (criterios 50 y
 * 52).
 *
 * **Copiar no crea ítems: le añade días al que ya existe** (decisión A7). Es lo
 * único que hace verdad al criterio 51 —un día copiado comparte el mismo ítem,
 * así que cambiarle la hora después cambia los dos días— y lo que convierte el
 * «quitarlo solo del viernes» del criterio 22 en su salida natural.
 *
 * Tres reglas, y ninguna borra nada:
 *
 * 1. Un ítem **desactivado no se copia** (criterio 52): no sale en Hoy, y
 *    llevarlo a tres días más sería multiplicar algo apagado.
 * 2. Si en el día destino ya hay **otro** ítem de la misma actividad —a
 *    cualquier hora— ese ítem **no se toca** y entra en `skipped`.
 * 3. Si el ítem **ya está** en el día destino, tampoco hay nada que hacer; se
 *    dice igual, porque el usuario marcó ese día y merece saber qué pasó con
 *    él.
 */
export function planCopyDay(
  items: VidaItem[],
  fromDay: VidaDayOfWeek,
  toDays: VidaDayOfWeek[],
): TemplateCopyPlan {
  const targets = VIDA_DAY_ORDER.filter((day) => day !== fromDay && toDays.includes(day))
  const source = templateItemsForDay(items, fromDay).filter((item) => item.isActive !== false)
  const updates: TemplateCopyUpdate[] = []
  const skipped: TemplateCopySkip[] = []

  for (const item of source) {
    const addedDays: VidaDayOfWeek[] = []

    for (const day of targets) {
      if (item.days.includes(day)) {
        skipped.push({ title: templateItemTitle(item), day, reason: 'already-there' })
        continue
      }
      // **A cualquier hora**: si ya tienes «Pasear» el sábado a las 19:00, el
      // lunes de las 7:30 no se le añade encima.
      const taken = templateItemsForDay(items, day).some(
        (other) => other.id !== item.id && other.activityId === item.activityId,
      )
      if (taken) {
        skipped.push({ title: templateItemTitle(item), day, reason: 'other-item' })
        continue
      }
      addedDays.push(day)
    }

    if (addedDays.length === 0) continue

    updates.push({
      input: {
        id: item.id,
        days: VIDA_DAY_ORDER.filter((day) => item.days.includes(day) || addedDays.includes(day)),
      },
      title: templateItemTitle(item),
      addedDays,
    })
  }

  return { updates, skipped }
}

/**
 * «*Pasear a las mascotas* ya estaba el sábado, se quedó como estaba»
 * (criterio 50), agrupado por nombre para que no salga siete veces lo mismo.
 */
export function describeCopySkips(skipped: TemplateCopySkip[]): string[] {
  const byTitle = new Map<string, VidaDayOfWeek[]>()
  for (const skip of skipped) {
    const days = byTitle.get(skip.title) ?? []
    if (!days.includes(skip.day)) days.push(skip.day)
    byTitle.set(skip.title, days)
  }
  return [...byTitle.entries()].map(([title, days]) => {
    const ordered = VIDA_DAY_ORDER.filter((day) => days.includes(day))
    const labels = ordered.map((day) => `el ${VIDA_DAY_LABELS[day]}`)
    const list =
      labels.length === 1
        ? labels[0]!
        : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`
    return `${title} ya estaba ${list}, se quedó como estaba`
  })
}
