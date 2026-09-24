/**
 * **La noche**: la única cosa del módulo Vida que puede cruzar la medianoche.
 *
 * Archivo aparte **a propósito**. `vida-time.utils.ts` tiene escrito en su
 * cabecera que «aquí nada cruza medianoche», `minutesToTime` recorta a `23:59`
 * y `calculateEndTime` no hace `% 24`: usar cualquiera de las dos para la noche
 * devolvería `23:59` **sin avisar**, que es exactamente el defecto original que
 * esta feature viene a rodear (criterio 287). Así que la noche se maneja en
 * **minutos absolutos** y se formatea aquí.
 *
 * Nada de React, nada del API: funciones puras sobre `HH:mm`.
 *
 * Tres ideas que sostienen todo lo demás:
 *
 * 1. **Una noche se nombra por el día en que te acuestas** (D3). Marcar
 *    «viernes» es la noche del viernes al sábado.
 * 2. **Cruzar la medianoche no es un caso raro**: `23:00 → 5:00` cruza y
 *    `1:00 → 6:40` no, y las dos son noches legales. Ninguna validación de
 *    orden se les aplica (criterio 262).
 * 3. **Lo que no se sabe no se calcula.** Sin las dos horas no hay duración:
 *    se devuelve `null`, nunca `0` (criterio 305).
 */

import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import { VIDA_DAY_LABELS, VIDA_DAY_ORDER, getVidaDayOfWeek } from '@/features/vida/utils/vida-date.utils'
import { formatTimeForDisplay, isValidHhMm } from '@/features/vida/utils/vida-time.utils'

const MINUTES_PER_DAY = 24 * 60

/**
 * La noche planeada, tal y como sale de los ajustes.
 *
 * Existe **solo cuando hay algo que decir**: `useVidaNight` devuelve `null`
 * mientras las horas no sean dos `HH:mm` válidos (criterio 310). `days` vacío
 * es legal como dato y significa «ninguna noche marcada»: la noche existe en
 * los ajustes pero no aplica a ningún día (criterio 265).
 */
export type VidaNight = {
  /** `HH:mm` a la que te acuestas. */
  bedTime: string
  /** `HH:mm` a la que te levantas. */
  wakeTime: string
  /** Las noches en que aplica, **por el día en que te acuestas** (D3). */
  days: readonly VidaDayOfWeek[]
}

/** `HH:mm` → minutos desde medianoche, sin recortes ni sorpresas. */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Lo que llegue que no sea un día de la semana conocido, fuera. */
export function normalizeNightDays(days: readonly string[] | null | undefined): VidaDayOfWeek[] {
  if (!days) return []
  return VIDA_DAY_ORDER.filter((day) => days.includes(day))
}

/**
 * **¿Cruza la medianoche?** Sí exactamente cuando te acuestas más tarde de lo
 * que te levantas (criterios 261 y 276).
 *
 * Horas iguales no son una noche y no llegan aquí: se rechazan antes, en
 * Ajustes (criterio 263).
 */
export function crossesMidnight(night: VidaNight): boolean {
  return toMinutes(night.bedTime) > toMinutes(night.wakeTime)
}

/**
 * Cuánto dura la noche, en minutos. **`null` si falta alguna hora** (criterio
 * 305): una noche sin dato no produce «0 h» ni una cifra estimada.
 */
export function nightDurationMinutes(
  bedTime: string | null | undefined,
  wakeTime: string | null | undefined,
): number | null {
  if (!isValidHhMm(bedTime) || !isValidHhMm(wakeTime)) return null
  const bed = toMinutes(bedTime!)
  const wake = toMinutes(wakeTime!)
  if (bed === wake) return null
  return wake > bed ? wake - bed : wake + MINUTES_PER_DAY - bed
}

/**
 * La duración en palabras: «6 h», «5 h 40», «45 min». Sin dato, **«—»**
 * (criterios 305 y 317).
 */
export function formatNightDuration(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m}`
}

/**
 * **Qué clase de noche es**, dicho con las palabras del render (criterio 261).
 *
 * Nombra el día para que no haya que traducir nada: con `23:00 / 5:00` marcado
 * el martes se lee «la noche del martes es la madrugada del miércoles».
 */
export function describeNightKind(night: VidaNight, day?: VidaDayOfWeek): string {
  if (!crossesMidnight(night)) {
    return 'Esta noche no cruza la medianoche: empieza y acaba el mismo día.'
  }
  const from = day ?? night.days[0]
  if (!from) return 'Cruza la medianoche, y eso está bien: te acuestas un día y te levantas al siguiente.'
  const to = VIDA_DAY_ORDER[(VIDA_DAY_ORDER.indexOf(from) + 1) % 7]!
  return `Cruza la medianoche, y eso está bien: la noche del ${VIDA_DAY_LABELS[from]} es la madrugada del ${VIDA_DAY_LABELS[to]}.`
}

/** ¿Esa noche está marcada? */
export function nightAppliesToWeekday(night: VidaNight, day: VidaDayOfWeek): boolean {
  return night.days.includes(day)
}

/**
 * **La noche que *empieza* ese día**: te acuestas ese día. Es la franja de
 * abajo (criterio 271).
 */
export function nightStartingOnWeekday(
  night: VidaNight | null,
  day: VidaDayOfWeek,
): VidaNight | null {
  if (!night) return null
  return nightAppliesToWeekday(night, day) ? night : null
}

/** Lo mismo, por fecha `YYYY-MM-DD`. */
export function nightStartingOn(night: VidaNight | null, ymd: string): VidaNight | null {
  return nightStartingOnWeekday(night, getVidaDayOfWeek(ymd))
}

/**
 * **La noche que *termina* ese día**: te levantas ese día. Es la franja de
 * arriba (criterio 271).
 *
 * Dos caminos, y por eso el criterio 276 existe: si la noche **cruza**, la que
 * termina hoy es la que empezó **ayer**; si **no cruza** (`1:00 → 6:40`),
 * empieza y acaba el mismo día, así que la que termina hoy es la de **hoy**.
 * Nada aquí asume que la noche parte el día en dos.
 */
export function nightEndingOnWeekday(
  night: VidaNight | null,
  day: VidaDayOfWeek,
): VidaNight | null {
  if (!night) return null
  if (crossesMidnight(night)) {
    const yesterday = VIDA_DAY_ORDER[(VIDA_DAY_ORDER.indexOf(day) + 6) % 7]!
    return nightAppliesToWeekday(night, yesterday) ? night : null
  }
  return nightAppliesToWeekday(night, day) ? night : null
}

/** Lo mismo, por fecha `YYYY-MM-DD`. */
export function nightEndingOn(night: VidaNight | null, ymd: string): VidaNight | null {
  return nightEndingOnWeekday(night, getVidaDayOfWeek(ymd))
}

/**
 * **Qué franjas pinta un día**: la de arriba (`dawn`) y la de abajo (`dusk`).
 *
 * Vive aquí y no en la página porque es la misma regla del criterio 276 y tiene
 * que decir lo mismo en la plantilla, en Hoy y en la revisión: **una noche que
 * no cruza la medianoche no anuncia nada abajo**. Empieza y acaba de madrugada,
 * así que se pinta arriba de su propio día y la tarde de ese día no la cierra
 * ninguna noche.
 */
export function nightBandsForWeekday(
  night: VidaNight | null,
  day: VidaDayOfWeek,
): { dawn: VidaNight | null; dusk: VidaNight | null } {
  const starting = nightStartingOnWeekday(night, day)
  return {
    dawn: nightEndingOnWeekday(night, day),
    dusk: starting && crossesMidnight(starting) ? starting : null,
  }
}

/**
 * **La ventana del día que dicta la noche.** La usa la tajada 2; aquí se
 * escribe porque es la misma aritmética y no tiene sentido partirla en dos.
 *
 * - `startTime`: la hora de levantarse de la noche que **termina** ese día.
 * - `endTime`: la hora de acostarse de la noche que **empieza** ese día (D1).
 *
 * Cualquiera de las dos puede ser `null`, y `null` significa **«esta noche no
 * dice nada de este borde»**: quien llame cae a `vidaDayStartTime` /
 * `vidaDayEndTime` (criterios 280 y 283). En particular, una noche que no cruza
 * (`1:00 → 6:40`) **no cierra la tarde**: solo abre la mañana.
 */
export function nightWindowForWeekday(
  night: VidaNight | null,
  day: VidaDayOfWeek,
): { startTime: string | null; endTime: string | null } {
  const { dawn, dusk } = nightBandsForWeekday(night, day)
  return {
    startTime: dawn ? dawn.wakeTime : null,
    // Una noche que no cruza acaba antes de que empiece la tarde: no es el
    // final del día, así que no cierra nada. Esa regla ya la aplica
    // `nightBandsForWeekday`, y por eso la ventana se saca de las **mismas**
    // dos franjas que se pintan: si la franja de abajo no existe, tampoco
    // existe la hora de acostarse que cierra el día (criterio 283).
    endTime: dusk ? dusk.bedTime : null,
  }
}

/** Lo mismo, por fecha `YYYY-MM-DD`. */
export function nightWindowForDate(
  night: VidaNight | null,
  ymd: string,
): { startTime: string | null; endTime: string | null } {
  return nightWindowForWeekday(night, getVidaDayOfWeek(ymd))
}

/**
 * La diferencia con lo planeado, **en minutos y con dirección** (criterios 292
 * y 297). Positivo = dormiste más; negativo = menos. Nunca un juicio.
 */
export function diffToPlannedMinutes(
  actualMinutes: number | null,
  plannedMinutes: number | null,
): number | null {
  if (actualMinutes === null || plannedMinutes === null) return null
  return actualMinutes - plannedMinutes
}

/** «20 min menos que tu noche» / «20 min más que tu noche» / «igual que tu noche». */
export function describeDiffToPlanned(diffMinutes: number | null): string | null {
  if (diffMinutes === null) return null
  if (diffMinutes === 0) return 'Igual que tu noche'
  const size = formatNightDuration(Math.abs(diffMinutes))
  return `${size} ${diffMinutes > 0 ? 'más' : 'menos'} que tu noche`
}

/** «5:00», sin cero a la izquierda, como el resto del módulo. */
export function formatNightTime(time: string): string {
  return formatTimeForDisplay(time)
}

/**
 * Las noches marcadas, en palabras: «Todas las noches», «Ninguna noche»,
 * «lunes, martes y miércoles». Lo usa Ajustes (criterios 264 y 265).
 */
export function describeNightDays(days: readonly VidaDayOfWeek[]): string {
  if (days.length === 0) return 'Ninguna noche marcada'
  if (days.length === 7) return 'Todas las noches'
  const labels = VIDA_DAY_ORDER.filter((day) => days.includes(day)).map(
    (day) => VIDA_DAY_LABELS[day],
  )
  if (labels.length === 1) return `La noche del ${labels[0]}`
  return `Las noches del ${labels.slice(0, -1).join(', ')} y del ${labels[labels.length - 1]}`
}
