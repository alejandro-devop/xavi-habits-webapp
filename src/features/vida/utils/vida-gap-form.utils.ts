/**
 * El encaje de algo dentro de un hueco: dónde puede empezar, cuánto puede
 * durar, qué queda libre después.
 *
 * Todo lo de aquí es **puro** y se mide en minutos desde medianoche. Es lo que
 * sostiene **D4 — no hay solapes**: el API no valida nada (lo comprobó el
 * arquitecto con `grep` en `activity-day-plan.service.ts` y en sus validadores),
 * así que la restricción la pone entera el cliente. Una ventana (`GapWindow`) es
 * espacio **libre de verdad**: si la hora y la duración caben dentro de ella, no
 * se pisa ningún bloque ni se sale del día.
 *
 * Rescatado de
 * `git show 79bece0:src/features/activities/utils/activity-time.utils.ts:399-437`
 * —`isStartTimeInsideSlot`, `getMaxDurationForStartTime` y
 * `validateFollowUpInsideSlot`, que son literalmente los criterios 26 y 27— con
 * dos cambios: los mensajes pasan al lenguaje del criterio 56 (nada de «no
 * puede», «error» ni reproches: se dice qué sí cabe) y la ventana se describe
 * en minutos en vez de en un `TimelineFreeSlot`, que era el tipo de la
 * cuadrícula de horas descartada.
 */

import type { AgendaBlock, AgendaGap, DayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import {
  DURATION_PILLS,
  calculateEndTime,
  formatDurationFromMinutes,
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

/** Lo más corto que se deja poner: la píldora más pequeña (D1). */
export const MIN_PLACEMENT_MINUTES = 15

/** Cuántas horas se ofrecen en «cuándo» antes de «otra hora» (criterio 27). */
export const MAX_START_OPTIONS = 4

/**
 * Espacio libre donde cabe algo: el hueco de la agenda, o —editando un bloque—
 * el propio bloque más lo libre que tiene a cada lado.
 */
export type GapWindow = {
  startMinutes: number
  endMinutes: number
  /** El bloque que lo cierra; `null` cuando lo cierra el fin del día. */
  nextBlockTitle: string | null
}

export function gapToWindow(gap: AgendaGap): GapWindow {
  return {
    startMinutes: gap.startMinutes,
    endMinutes: gap.endMinutes,
    nextBlockTitle: gap.nextBlockTitle,
  }
}

/** Minutos de la ventana. */
export function windowMinutes(space: GapWindow): number {
  return Math.max(0, space.endMinutes - space.startMinutes)
}

/**
 * La ventana de un bloque que se está editando: **el bloque más lo libre que
 * tiene pegado a cada lado**. Mover un bloque dentro de ella no pisa a nadie
 * (D4), y es lo que permite alargarlo o adelantarlo sin quitarlo y volverlo a
 * poner.
 *
 * Se lee de la agenda ya construida —no de una cuenta paralela— para que sea
 * exactamente el mismo reparto que se está viendo en pantalla. Con dos bloques
 * pisados (el API los acepta) la ventana se queda en el bloque: no hay libre a
 * los lados y lo único que se puede hacer es acortarlo.
 */
export function getBlockEditWindow(agenda: DayAgenda, blockId: string): GapWindow | null {
  const index = agenda.entries.findIndex(
    (entry) => entry.kind === 'block' && entry.id === blockId,
  )
  if (index === -1) return null
  const block = agenda.entries[index] as AgendaBlock

  let startMinutes = block.startMinutes
  let endMinutes = block.endMinutes
  let nextBlockTitle: string | null = null

  for (let i = index - 1; i >= 0; i -= 1) {
    const previous = agenda.entries[i]
    if (previous.kind === 'now') continue
    if (previous.kind === 'gap') {
      startMinutes = Math.min(startMinutes, previous.startMinutes)
      continue
    }
    break
  }

  for (let i = index + 1; i < agenda.entries.length; i += 1) {
    const next = agenda.entries[i]
    if (next.kind === 'now') continue
    if (next.kind === 'gap') {
      endMinutes = Math.max(endMinutes, next.endMinutes)
      continue
    }
    nextBlockTitle = next.item.activity?.title ?? null
    break
  }

  return { startMinutes, endMinutes, nextBlockTitle }
}

/** La hora empieza dentro de la ventana (el final no cuenta: ahí ya no cabe nada). */
export function isStartTimeInsideWindow(startTime: string, space: GapWindow): boolean {
  const start = parseTimeToMinutes(startTime)
  return start >= space.startMinutes && start < space.endMinutes
}

/** Lo más que puede durar algo que empieza a esa hora, sin salirse (criterio 26). */
export function getMaxDurationForStartTime(startTime: string, space: GapWindow): number {
  const start = parseTimeToMinutes(startTime)
  if (start >= space.endMinutes) return 0
  return Math.max(0, space.endMinutes - Math.max(start, space.startMinutes))
}

/** Cabe entero dentro de la ventana empezando a esa hora. */
export function fitsInWindow(
  startTime: string,
  durationMinutes: number | null,
  space: GapWindow,
): boolean {
  if (durationMinutes === null || durationMinutes < 1) return false
  if (!isStartTimeInsideWindow(startTime, space)) return false
  return durationMinutes <= getMaxDurationForStartTime(startTime, space)
}

export type StartTimeOption = {
  /** `HH:mm`, lo que se manda al API. */
  value: string
  /** «10:30», como se lee. */
  label: string
  /** «ahora mismo», «en cuanto termine lo de antes», «al principio del hueco». */
  hint: string | null
}

/**
 * Las horas que se ofrecen en «cuándo»: **el principio de la ventana** y al
 * menos dos más dentro de ella (criterio 27). Quien las pinte añade «otra
 * hora», que acepta cualquier hora de la ventana y ninguna de fuera.
 *
 * El paso se adapta al tamaño: en un hueco de una hora, cuartos; en uno largo,
 * medias horas. Solo se ofrece una hora si después de ella todavía cabe lo más
 * corto que se puede poner (`MIN_PLACEMENT_MINUTES`): ofrecer las 12:55 en un
 * hueco que acaba a las 13:00 sería ofrecer un callejón sin salida.
 */
export function buildStartTimeOptions(
  space: GapWindow,
  options: { nowMinutes?: number | null; limit?: number } = {},
): StartTimeOption[] {
  const { nowMinutes = null, limit = MAX_START_OPTIONS } = options
  const total = windowMinutes(space)
  if (total <= 0) return []

  const step = total <= 60 ? 15 : 30
  const result: StartTimeOption[] = []

  // Un hueco que ya empezó arranca en «ahora» —lo parte `buildDayAgenda`—, así
  // que la primera hora que se ofrece es el reloj: «ahora mismo».
  const startsNow = nowMinutes !== null && Math.abs(nowMinutes - space.startMinutes) <= 1

  result.push({
    value: minutesToTime(space.startMinutes),
    label: formatTimeForDisplay(minutesToTime(space.startMinutes)),
    hint: startsNow ? 'ahora mismo' : 'al principio del hueco',
  })

  // Desde el siguiente múltiplo del paso, para que las horas ofrecidas sean
  // redondas («11:00», no «10:47») aunque el hueco empiece a deshora.
  let cursor = Math.ceil((space.startMinutes + 1) / step) * step
  while (cursor + MIN_PLACEMENT_MINUTES <= space.endMinutes && result.length < limit) {
    result.push({
      value: minutesToTime(cursor),
      label: formatTimeForDisplay(minutesToTime(cursor)),
      hint: null,
    })
    cursor += step
  }

  return result
}

/** Las píldoras que caben empezando a esa hora; las demás se apagan (criterio 26). */
export function durationPillsForWindow(startTime: string, space: GapWindow): number[] {
  const max = getMaxDurationForStartTime(startTime, space)
  return DURATION_PILLS.filter((minutes) => minutes <= max)
}

export type PlacementValidation = { valid: boolean; message: string | null }

/**
 * ¿Encaja? Las tres razones por las que no, cada una con lo que **sí** se puede
 * hacer. Ninguna dice «error», ni «no puedes», ni nombra al hueco como algo
 * vacío (criterio 56).
 */
export function validatePlacement(
  input: { startTime: string; durationMinutes: number | null },
  space: GapWindow,
): PlacementValidation {
  const rangeLabel = `${formatTimeForDisplay(minutesToTime(space.startMinutes))} y las ${formatTimeForDisplay(minutesToTime(space.endMinutes))}`

  if (!isStartTimeInsideWindow(input.startTime, space)) {
    return {
      valid: false,
      message: `Esa hora se sale de este rato libre. Aquí cabe algo entre las ${rangeLabel}.`,
    }
  }
  if (input.durationMinutes === null || input.durationMinutes < 1) {
    return { valid: false, message: 'Dile cuánto dura, aunque sean 15 minutos.' }
  }
  const max = getMaxDurationForStartTime(input.startTime, space)
  if (input.durationMinutes > max) {
    return {
      valid: false,
      message: `Desde las ${formatTimeForDisplay(input.startTime)} caben ${formatDurationMinutes(max)}. Elige menos tiempo o empieza antes.`,
    }
  }
  return { valid: true, message: null }
}

export type PlacementLeftovers = {
  /** Minutos libres entre el final de lo puesto y el final de la ventana. */
  afterMinutes: number
  /** Minutos libres entre el principio de la ventana y lo puesto. */
  beforeMinutes: number
}

/** Lo que queda libre alrededor de lo que se va a poner (criterio 28). */
export function getPlacementLeftovers(
  input: { startTime: string; durationMinutes: number },
  space: GapWindow,
): PlacementLeftovers {
  const start = Math.max(space.startMinutes, parseTimeToMinutes(input.startTime))
  const end = Math.min(space.endMinutes, start + Math.max(0, input.durationMinutes))
  return {
    beforeMinutes: Math.max(0, start - space.startMinutes),
    afterMinutes: Math.max(0, space.endMinutes - end),
  }
}

/**
 * «Queda libre 1h 30 antes de almorzar» (criterio 28). Si además sobra un rato
 * **antes** de lo que se pone, se dice también: es tiempo suyo y esconderlo
 * haría que la cuenta no cuadrara con la agenda de después.
 */
export function describeLeftovers(
  input: { startTime: string; durationMinutes: number },
  space: GapWindow,
): string {
  const { beforeMinutes, afterMinutes } = getPlacementLeftovers(input, space)
  const tail =
    space.nextBlockTitle === null
      ? 'antes del final del día'
      : `antes de ${space.nextBlockTitle}`

  if (afterMinutes === 0 && beforeMinutes === 0) return 'Con esto el rato queda completo.'
  if (afterMinutes === 0) {
    return `Queda libre ${formatDurationFromMinutes(beforeMinutes)} justo antes.`
  }
  const head = `Queda libre ${formatDurationFromMinutes(afterMinutes)} ${tail}`
  return beforeMinutes > 0
    ? `${head}, y ${formatDurationFromMinutes(beforeMinutes)} antes de empezar.`
    : `${head}.`
}

/**
 * «Hueco de 2h 30 · hasta las 13:00 "Cocinar y almorzar"» — el subtítulo de la
 * hoja (criterio 24), y «hasta el final del día» cuando no hay bloque después.
 */
export function describeWindow(space: GapWindow): string {
  const size = formatDurationFromMinutes(windowMinutes(space))
  const endLabel = formatTimeForDisplay(minutesToTime(space.endMinutes))
  return space.nextBlockTitle
    ? `Hueco de ${size} · hasta las ${endLabel} «${space.nextBlockTitle}»`
    : `Hueco de ${size} · hasta el final del día`
}

/**
 * Hora y duración → lo que piden `activityDayPlanItemAdd` y
 * `activityDayPlanItemEdit`: dos horas `HH:mm`.
 */
export function toDayPlanTimes(
  startTime: string,
  durationMinutes: number,
): { startTime: string; endTime: string } {
  return {
    startTime: minutesToTime(parseTimeToMinutes(startTime)),
    endTime: calculateEndTime(startTime, durationMinutes),
  }
}
