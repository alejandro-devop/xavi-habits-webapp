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

/**
 * **El mensaje del criterio 263**, escrito una sola vez y usado en los dos
 * sitios donde se pueden escribir dos horas de noche: Ajustes y la hoja de
 * «¿Cómo dormiste?». Dos varas para el mismo dato es como se acaba guardando
 * en un sitio lo que el otro rechaza.
 */
export const VIDA_NIGHT_SAME_TIME_ERROR =
  'Las dos horas no pueden ser la misma: una noche de cero minutos no es una noche.'

/**
 * **Las dos horas son la misma**, o sea: una noche de cero minutos, que no es
 * una noche (criterio 263).
 *
 * **Esta regla es solo del cliente**: el servidor mira el formato y nada más
 * —lo dice la sección 2 tras revisar el validador y la migración—, así que si
 * no está aquí no está en ningún sitio. Se compara en minutos, como todo en
 * este archivo; el formato de dos dígitos ya lo exige `isValidHhMm`, así que
 * `5:00` no llega hasta aquí: se cae antes, por inválido.
 *
 * Con alguna hora que falte o que no valga devuelve `false`: eso no es «la
 * misma hora», es otro problema y lo dice quien llama con sus palabras.
 */
export function isSameNightTime(
  bedTime: string | null | undefined,
  wakeTime: string | null | undefined,
): boolean {
  if (!isValidHhMm(bedTime) || !isValidHhMm(wakeTime)) return false
  return toMinutes(bedTime!) === toMinutes(wakeTime!)
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

/* ------------------------------------------------------------------------- *
 * Lo real encima de lo planeado (tajada 3)
 * ------------------------------------------------------------------------- */

/**
 * **Lo que dormiste de verdad esa noche**, tal y como se guarda en el aparato.
 *
 * El tipo vive aquí, con el resto de la aritmética de la noche, y el store lo
 * importa — igual que ya hace con `VidaPatternAnswer` de `vida-patterns.utils`.
 * Así las funciones puras que lo leen no dependen de `zustand`.
 *
 * **Cualquiera de las dos horas puede ser `null`**: es «No sé a qué hora», y se
 * guarda lo que sí se sabe (criterio 303). Lo que nunca se hace es rellenarla
 * con lo planeado para cuadrar una cifra.
 */
export type VidaNightLog = {
  /** `HH:mm` a la que te acostaste, o `null` si no se sabe. */
  bedTime: string | null
  /** `HH:mm` a la que te levantaste, o `null` si no se sabe. */
  wakeTime: string | null
  /** Cuándo se contestó, en ISO. No se enseña: sirve para saber que hubo respuesta. */
  confirmedAt: string
}

/**
 * **Los tres estados del criterio 296**, y salen del dato, no de una bandera:
 *
 * - `unconfirmed`: hay noche planeada y **no hay entrada**. Nadie contestó.
 * - `confirmed`: hay entrada con **las dos** horas.
 * - `no-data`: hay entrada y alguna hora quedó sin saber.
 *
 * Ignorar la pregunta deja `unconfirmed` **sin escribir nada** (criterio 295):
 * no hacer nada no cuesta ni un byte en el aparato.
 */
export type VidaNightLogState = 'unconfirmed' | 'confirmed' | 'no-data'

/** La palabra de cada estado, la misma en todas las pantallas (criterio 296). */
export const VIDA_NIGHT_STATE_WORD: Record<VidaNightLogState, string> = {
  unconfirmed: 'sin confirmar',
  confirmed: 'confirmado',
  'no-data': 'sin dato',
}

export function nightLogState(log: VidaNightLog | null | undefined): VidaNightLogState {
  if (!log) return 'unconfirmed'
  return isValidHhMm(log.bedTime) && isValidHhMm(log.wakeTime) ? 'confirmed' : 'no-data'
}

/** Cuánto se durmió de verdad. `null` si falta alguna hora (criterios 305 y 317). */
export function nightLogDurationMinutes(log: VidaNightLog | null | undefined): number | null {
  if (!log) return null
  return nightDurationMinutes(log.bedTime, log.wakeTime)
}

/**
 * **La noche del martes al miércoles**, o «la noche del miércoles» cuando no
 * cruzó: el titular de la hoja y de la pregunta (criterio 291).
 *
 * Se nombra por la fecha en que **te levantas**, que es la clave con la que se
 * guarda (criterio 294).
 */
export function describeNightSpan(wakeDate: string, crosses: boolean): string {
  const day = getVidaDayOfWeek(wakeDate)
  const label = VIDA_DAY_LABELS[day]
  if (!crosses) return `Noche del ${label}`
  const previous = VIDA_DAY_ORDER[(VIDA_DAY_ORDER.indexOf(day) + 6) % 7]!
  return `Noche del ${VIDA_DAY_LABELS[previous]} al ${label}`
}

/**
 * **Si la noche que se está registrando cruzó la medianoche o no, dicho**
 * (criterio 293). El usuario no hace ninguna cuenta: acostarse a la 1:00 es una
 * noche entera dentro del miércoles y aquí se lee con esas palabras.
 *
 * `null` mientras falte una hora: no se afirma nada de una noche a medias.
 */
export function describeLoggedNightKind(
  bedTime: string | null,
  wakeTime: string | null,
  wakeDate: string,
): string | null {
  if (!isValidHhMm(bedTime) || !isValidHhMm(wakeTime)) return null
  const day = VIDA_DAY_LABELS[getVidaDayOfWeek(wakeDate)]
  if (nightLogCrosses(bedTime!, wakeTime!)) {
    const previous =
      VIDA_DAY_LABELS[
        VIDA_DAY_ORDER[(VIDA_DAY_ORDER.indexOf(getVidaDayOfWeek(wakeDate)) + 6) % 7]!
      ]
    return `Esta noche cruzó la medianoche: empezó el ${previous} y acabó el ${day}.`
  }
  return `Esta noche no cruzó la medianoche: empezó y acabó el ${day}.`
}

/** `23:20 → 5:40` cruza; `1:00 → 6:40` no. La misma regla que `crossesMidnight`. */
export function nightLogCrosses(bedTime: string, wakeTime: string): boolean {
  return toMinutes(bedTime) > toMinutes(wakeTime)
}

/**
 * **¿Ya terminó la noche que acaba en este día?**
 *
 * Existe porque la pregunta de la mañana tenía **techo y no suelo**: a las 3:00
 * Hoy preguntaba «¿Dormiste 23:00 → 5:00?» por una noche que todavía estaba
 * pasando, y un toque habría guardado como real una hora de levantarse **que no
 * ha ocurrido**. Eso es inventar un dato, y es justo lo que esta feature viene
 * a no hacer.
 *
 * **El borde, que no es una comparación obvia:** la noche cruza la medianoche,
 * pero la que *termina* en este día termina siempre a su `wakeTime` leído en el
 * reloj **de este día**, cruce o no cruce. Lo de «ayer» es su comienzo, y el
 * comienzo aquí no importa: quien decide de qué día es cada noche es
 * `nightEndingOnWeekday`, y esto solo mira su final. Por eso **no** hay que
 * comparar contra `bedTime` ni sumar 24 h en ningún sitio.
 *
 * Sin reloj (`null`, que es lo que pasa en un día que no es hoy) la respuesta es
 * **sí**: un día pasado ya terminó entero, y uno futuro no llega aquí porque su
 * franja no cuenta nada real.
 */
export function nightEndedByNow(night: VidaNight, nowMinutes: number | null): boolean {
  if (nowMinutes === null) return true
  return nowMinutes >= toMinutes(night.wakeTime)
}

/**
 * **Lo que dice la franja de arriba de un día real**, con sus tres estados
 * (criterios 295, 296 y 297).
 *
 * Es una función pura y vive aquí, no en el componente, por la misma razón que
 * `nightBandsForWeekday`: la franja de Hoy, la de la revisión y la de mañana
 * tienen que decir **lo mismo**, y una regla escrita en tres sitios acaba
 * diciendo tres cosas.
 *
 * Ni una palabra de juicio (criterio 316): dormir poco no es un fallo y aquí no
 * se califica, se cuenta.
 */
export function describeNightBandLog(
  night: VidaNight,
  log: VidaNightLog | null | undefined,
  options: { stillRunning?: boolean } = {},
): { state: VidaNightLogState; label: string | null; detail: string | null } {
  const state = nightLogState(log)
  if (state === 'unconfirmed') {
    // **Mientras la noche está pasando no hay nada sin confirmar**: hay una
    // noche a medias. Decir «sin confirmar» a las 3:00 sería reprochar un
    // silencio que todavía no existe, y dejar el hueco vacío sería peor. El
    // dato guardado es el mismo —no hay entrada—, así que el estado no cambia:
    // lo que cambia es la palabra (criterios 295 y 296).
    if (options.stillRunning) {
      return { state, label: null, detail: 'aún no ha terminado' }
    }
    // Sin respuesta no se afirma nada nuevo: la franja sigue diciendo lo
    // planeado y **añade la palabra** (criterio 295).
    return { state, label: null, detail: VIDA_NIGHT_STATE_WORD.unconfirmed }
  }
  const bed = log!.bedTime
  const wake = log!.wakeTime
  if (state === 'confirmed') {
    const minutes = nightDurationMinutes(bed, wake)
    const diff = describeDiffToPlanned(
      diffToPlannedMinutes(minutes, nightDurationMinutes(night.bedTime, night.wakeTime)),
    )
    const parts = [formatNightDuration(minutes)]
    if (diff) parts.push(lowerFirst(diff))
    parts.push(VIDA_NIGHT_STATE_WORD.confirmed)
    return {
      state,
      label: `Dormiste ${formatNightTime(bed!)} → ${formatNightTime(wake!)}`,
      detail: parts.join(' · '),
    }
  }
  // «Sin dato»: se guardó lo que se sabía y lo otro se dice que no se sabe.
  if (isValidHhMm(wake)) {
    return {
      state,
      label: `Te levantaste a las ${formatNightTime(wake!)}`,
      detail: `A qué hora te acostaste, ${VIDA_NIGHT_STATE_WORD['no-data']}`,
    }
  }
  if (isValidHhMm(bed)) {
    return {
      state,
      label: `Te acostaste a las ${formatNightTime(bed!)}`,
      detail: `A qué hora te levantaste, ${VIDA_NIGHT_STATE_WORD['no-data']}`,
    }
  }
  return {
    state,
    label: 'De esta noche no quedó ninguna hora',
    detail: VIDA_NIGHT_STATE_WORD['no-data'],
  }
}

/** «20 min menos que tu noche» en medio de una frase, no al principio. */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}
