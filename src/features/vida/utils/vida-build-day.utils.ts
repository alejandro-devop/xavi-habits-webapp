/**
 * «Armar desde la plantilla» (tajada 5 de FEAT-003): convertir los ítems de la
 * plantilla de un día en los bloques de su plan.
 *
 * Todo aquí es **puro**. No hay reloj, no hay caché y no hay red: entran los
 * ítems de plantilla y el horario del día, y sale exactamente lo que se le va a
 * mandar a `activityDayPlanSet` más **el recuento de los ajustes que hubo que
 * hacer**. Ese recuento es la mitad del trabajo: D6 dice que armar **copia la
 * hora y la duración** del ítem, y cuando eso no se puede —dos cosas que se
 * pisan, algo sin hora, algo que no cabe antes de que el día termine— la regla
 * es que **nada se pierde en silencio** (criterios 43 y 44).
 *
 * La geometría del día vive en `vida-agenda.utils.ts` y el calendario en
 * `vida-window.utils.ts`: aquí solo está el volcado plantilla → plan.
 */

import type { ActivityDayPlanSetItemInput } from '@/features/vida/types/activity-day-plan.types'
import type { VidaItem } from '@/features/vida/types/vida-item.types'
import { getVidaDayOfWeek } from '@/features/vida/utils/vida-date.utils'
import {
  DEFAULT_BLOCK_MINUTES,
  minutesToTime,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

export type BuildDayInput = {
  /** Inicio del día, `HH:mm` (ajustes de Vida). */
  dayStart: string
  /** Fin del día, `HH:mm`. */
  dayEnd: string
}

export type BuildDaySummary = {
  /** Cuántos bloques quedaron puestos. */
  placedCount: number
  /** Cuántos ítems de la plantilla se miraron (los vivos: ver `usableTemplateItems`). */
  totalCount: number
  /** Cuántos no cabían a su hora y se corrieron detrás (criterio 43). */
  movedCount: number
  /** Cuántos no tenían hora y fueron al final, encadenados (criterio 44). */
  withoutTimeCount: number
  /** Los que no cupieron antes del fin del día, por su nombre. Nunca en silencio. */
  droppedTitles: string[]
  /** Cuántos entraron con `DEFAULT_BLOCK_MINUTES` porque no traían duración. */
  defaultDurationCount: number
}

export type BuildDayResult = BuildDaySummary & {
  items: ActivityDayPlanSetItemInput[]
}

/**
 * Los ítems de plantilla que se pueden armar de verdad.
 *
 * Se quedan fuera **el ítem desactivado** (`isActive: false`: el usuario lo
 * quitó de su plantilla sin borrarlo) y **la actividad archivada**
 * (`status: 'cancelled'`). Lo segundo es un hallazgo de la revisión de la
 * tajada 4: copiar un día pasado no puede saberlo —`ActivityDayPlanItem` no
 * trae el `status`— pero armar **sí**, porque el ítem de plantilla trae su
 * actividad. `status` llega `undefined` cuando el documento no lo pide: eso es
 * «no se sabe», y entonces no se descarta nada.
 */
export function usableTemplateItems(items: VidaItem[]): VidaItem[] {
  return items.filter(
    (item) => item.isActive !== false && item.activity?.status !== 'cancelled',
  )
}

/**
 * Lo que la plantilla trae **para una fecha**: sus ítems del día de la semana
 * que toque, ya sin los desactivados ni los archivados.
 *
 * Existe para que la vista de semana pueda mirar los siete días con **una sola
 * consulta** (`vidaItems`) en vez de siete `vidaSuggestionsForDate`. El día
 * suelto de Hoy sigue usando las sugerencias, que es de donde salen las fichas
 * de los huecos: los dos caminos acaban en los mismos `VidaItem`.
 */
export function templateItemsForDate(items: VidaItem[], date: string): VidaItem[] {
  const day = getVidaDayOfWeek(date)
  return usableTemplateItems(items).filter((item) => item.days.includes(day))
}

/** Los ítems de la plantilla, ordenados como se van a mirar: primero los que tienen hora. */
function sortForBuild(items: VidaItem[]): VidaItem[] {
  return [...items].sort((a, b) => {
    const aTime = a.startTime ? parseTimeToMinutes(a.startTime) : Number.POSITIVE_INFINITY
    const bTime = b.startTime ? parseTimeToMinutes(b.startTime) : Number.POSITIVE_INFINITY
    if (aTime !== bTime) return aTime - bTime
    return (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
  })
}

function titleOf(item: VidaItem): string {
  return item.activity?.title ?? 'Actividad'
}

/**
 * La duración de un ítem, o `null` si **no la tiene de verdad**.
 *
 * `0` y los negativos cuentan como «sin duración», no como una duración válida:
 * `?? DEFAULT_BLOCK_MINUTES` no atrapa el `0` y un bloque de `08:00–08:00` no es
 * nada. El API valida `> 0` al crear el ítem, así que hoy no debería llegar;
 * esto es el cinturón.
 */
function durationOf(item: VidaItem): number | null {
  const minutes = item.durationMinutes
  if (minutes === null || minutes === undefined || minutes <= 0) return null
  return minutes
}

/**
 * El volcado: cada ítem **a su hora y con su duración** (criterio 41, D6).
 *
 * Las tres reglas que no son «copiar y ya»:
 *
 * 1. **Dos que se pisarían** (D4: en el plan no hay solapes): el segundo se
 *    coloca justo detrás del primero, **conservando su duración**, y se cuenta.
 *    No se descarta y no se le recorta el tiempo (criterio 43).
 * 2. **Sin hora** (los ítems de F1): al final, encadenados detrás del último
 *    bloque con hora, con su duración o con `DEFAULT_BLOCK_MINUTES` si tampoco
 *    la tienen (criterio 44).
 * 3. **Lo que no cabe antes del fin del día** no se pone —un bloque fuera del
 *    horario rompería la barra del presupuesto— pero **se dice por su nombre**.
 *
 * Un ítem cuya hora cae antes del inicio del día también cuenta como «movido»:
 * su hora no se pudo respetar.
 */
export function buildDayFromTemplate(
  templateItems: VidaItem[],
  { dayStart, dayEnd }: BuildDayInput,
): BuildDayResult {
  const startOfDay = parseTimeToMinutes(dayStart)
  const endOfDay = parseTimeToMinutes(dayEnd)

  const usable = sortForBuild(usableTemplateItems(templateItems))
  const items: ActivityDayPlanSetItemInput[] = []
  const droppedTitles: string[] = []
  let movedCount = 0
  let withoutTimeCount = 0
  let defaultDurationCount = 0
  let cursor = startOfDay

  for (const item of usable) {
    const hasTime = Boolean(item.startTime)
    const ownDuration = durationOf(item)
    const duration = ownDuration ?? DEFAULT_BLOCK_MINUTES

    // Sin hora: se encadena detrás de lo que haya. Con hora: la suya, salvo que
    // ya esté ocupada o caiga fuera del horario del día.
    const wanted = hasTime ? parseTimeToMinutes(item.startTime as string) : cursor
    const start = Math.max(wanted, cursor, startOfDay)

    // **Los contadores se suben después de saber que el bloque cabe.** Si se
    // subieran antes, un ítem que se mueve y después no entra se contaría a la
    // vez como «movido» y como «se quedó fuera»: dos frases sobre el mismo
    // ítem, una de ellas falsa. Cada ítem acaba en **una** categoría.
    if (start + duration > endOfDay) {
      droppedTitles.push(titleOf(item))
      continue
    }

    if (!hasTime) {
      withoutTimeCount += 1
    } else if (start !== wanted) {
      movedCount += 1
    }
    if (ownDuration === null) defaultDurationCount += 1

    items.push({
      activityId: item.activityId,
      startTime: minutesToTime(start),
      endTime: minutesToTime(start + duration),
      orderIndex: items.length,
    })
    cursor = start + duration
  }

  return {
    items,
    placedCount: items.length,
    totalCount: usable.length,
    movedCount,
    withoutTimeCount,
    droppedTitles,
    defaultDurationCount,
  }
}

/**
 * Las frases del resumen, **sueltas**, para que quien pinte pueda meter el
 * enlace al catálogo dentro de la de «sin hora» (criterio 44) sin partir texto
 * a mano.
 *
 * Ninguna reprocha nada (criterio 56): se cuenta lo que se hizo, no lo que el
 * usuario dejó de hacer. Un ítem sin hora no es un descuido: se le ofrece
 * ponérsela.
 */
export type BuildDayNotes = {
  /** «Armado: 7 bloques desde tu plantilla.» Siempre hay una. */
  headline: string
  /** Criterio 43, o `null` si nadie se movió. */
  moved: string | null
  /** Criterio 44, o `null` si todos traían hora. La frase **no** incluye el enlace. */
  withoutTime: string | null
  /** Los que entraron con la duración por defecto, dicho en voz alta. */
  defaultDuration: string | null
  /** Lo que no cupo antes del fin del día, o `null`. */
  dropped: string | null
}

function countThings(count: number): string {
  return `${count} ${count === 1 ? 'cosa' : 'cosas'}`
}

function countBlocks(count: number): string {
  return `${count} ${count === 1 ? 'bloque' : 'bloques'}`
}

export function describeBuildDay(summary: BuildDaySummary): BuildDayNotes {
  const headline =
    summary.placedCount === 0
      ? 'No quedó nada puesto desde tu plantilla.'
      : `Armado desde tu plantilla: ${countBlocks(summary.placedCount)}.`

  return {
    headline,
    moved:
      summary.movedCount > 0
        ? `${summary.movedCount} de ${summary.totalCount} no cabían a su hora y quedaron después.`
        : null,
    withoutTime:
      summary.withoutTimeCount > 0
        ? `${countThings(summary.withoutTimeCount)} sin hora, ${summary.withoutTimeCount === 1 ? 'puesta' : 'puestas'} al final — ponles una hora en tu plantilla.`
        : null,
    defaultDuration:
      summary.defaultDurationCount > 0
        ? `${countThings(summary.defaultDurationCount)} sin duración, ${summary.defaultDurationCount === 1 ? 'puesta' : 'puestas'} a ${DEFAULT_BLOCK_MINUTES} min.`
        : null,
    dropped:
      summary.droppedTitles.length > 0
        ? `${summary.droppedTitles.join(', ')} no cabía${summary.droppedTitles.length === 1 ? '' : 'n'} antes de que termine tu día y se quedó fuera del plan.`
        : null,
  }
}

/** El resumen en una sola línea, para un toast (no admite enlaces). */
export function buildDaySummaryLine(summary: BuildDaySummary): string {
  const notes = describeBuildDay(summary)
  return [notes.headline, notes.moved, notes.withoutTime, notes.defaultDuration, notes.dropped]
    .filter(Boolean)
    .join(' ')
}

/**
 * Cuánto suma un plan, en minutos: lo que la línea de la semana enseña como
 * «Planeado · N bloques · Xh YY» (criterio 39).
 */
export function plannedMinutesOf(
  items: { startTime: string; endTime: string }[],
): number {
  return items.reduce(
    (total, item) =>
      total + Math.max(0, parseTimeToMinutes(item.endTime) - parseTimeToMinutes(item.startTime)),
    0,
  )
}
