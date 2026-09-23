/**
 * **«Lo que viene»**: qué proponer después de lo que está pasando, dónde
 * colgarlo dentro de la línea de la agenda y **qué se lee**, palabra por
 * palabra (FEAT-010, render aprobado `docs/vida/assets/14-vida-lo-que-viene.html`).
 *
 * Vive aquí y no en `vida-agenda.utils.ts` porque la regla necesita saber **qué
 * está resuelto**, y esa capa no sabe nada de sesiones por diseño (está escrito
 * en la cabecera de `vida-execution.utils.ts`). Es puro, sin React y sin
 * ninguna constante de minutos: **si aparece un umbral, la regla se está
 * reinterpretando** (criterio 375).
 *
 * Lo que esto **no** hace, y es la razón de ser de la feature: la duración
 * planeada **no viaja a la sesión**. Aquí solo se escribe como texto
 * («suele durarte 4 h») y la frase de verdad dice en la misma tarjeta que se
 * registra lo que dure de verdad. El arranque es `sessionActions.start(activityId)`
 * **sin duración y sin hora**: el cronómetro nace en el segundo del toque
 * (criterios 188, 196 y 373).
 */

import type { AgendaBlock } from '@/features/vida/utils/vida-agenda.utils'
import type { BlockExecution } from '@/features/vida/utils/vida-execution.utils'
import type { ExecutionEntry } from '@/features/vida/utils/vida-execution.utils'
import {
  formatDurationFromMinutes,
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'

/* ── 1. Qué está resuelto ─────────────────────────────────────────────────
 *
 * Las **tres** fuentes del criterio 186 en un sitio: una sesión cruzada con el
 * bloque (`byBlockId`, valga `running`, `on-plan`, `changed` o `moved`), un «en
 * su lugar, X» (`insteadByBlockId`) y un «No se pudo» de este aparato
 * (`couldNotItemIds`, que va por **id del ítem del plan**, no por el del bloque
 * —son el mismo hoy, pero la nota se guarda con `item.id` y así no depende de
 * esa coincidencia).
 */

export type CollectResolvedInput = {
  blocks: AgendaBlock[]
  byBlockId: Record<string, BlockExecution>
  insteadByBlockId: Record<string, unknown>
  couldNotItemIds: ReadonlySet<string>
}

export function collectResolvedBlockIds({
  blocks,
  byBlockId,
  insteadByBlockId,
  couldNotItemIds,
}: CollectResolvedInput): Set<string> {
  const resolved = new Set<string>()
  for (const block of blocks) {
    if (byBlockId[block.id] !== undefined) {
      resolved.add(block.id)
      continue
    }
    if (insteadByBlockId[block.id] !== undefined) {
      resolved.add(block.id)
      continue
    }
    if (couldNotItemIds.has(block.item.id)) resolved.add(block.id)
  }
  return resolved
}

/* ── 2. A quién se propone ────────────────────────────────────────────────── */

export type PickUpNextInput = {
  blocks: AgendaBlock[]
  resolvedBlockIds: ReadonlySet<string>
  nowMinutes: number
}

/**
 * **El más reciente cuya hora ya llegó; si ninguna ha llegado, el siguiente por
 * hora** (criterio 375). Sin ventana de caducidad y sin umbral: a las 20:00,
 * con las 13:00 y las 18:00 sin hacer, se propone **las 18:00**.
 *
 * El desempate es el criterio 184, en tres pasos y en este orden: inicio menor,
 * menos duración (acaba antes y libera al otro) y, si todo empata, el orden que
 * ya trae `buildDayAgenda`. **Nunca devuelve dos.**
 */
export function pickUpNextBlock({
  blocks,
  resolvedBlockIds,
  nowMinutes,
}: PickUpNextInput): AgendaBlock | null {
  const open = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => !resolvedBlockIds.has(block.id))
  if (open.length === 0) return null

  const arrived = open.filter(({ block }) => block.startMinutes <= nowMinutes)
  const pool = arrived.length > 0 ? arrived : open
  const target =
    arrived.length > 0
      ? Math.max(...arrived.map(({ block }) => block.startMinutes))
      : Math.min(...open.map(({ block }) => block.startMinutes))

  const candidates = pool.filter(({ block }) => block.startMinutes === target)
  candidates.sort((a, b) => {
    if (a.block.startMinutes !== b.block.startMinutes) {
      return a.block.startMinutes - b.block.startMinutes
    }
    if (a.block.durationMinutes !== b.block.durationMinutes) {
      return a.block.durationMinutes - b.block.durationMinutes
    }
    return a.index - b.index
  })
  return candidates[0]?.block ?? null
}

/* ── 3. De qué fila cuelga ────────────────────────────────────────────────── */

export type FindAnchorInput = {
  entries: ExecutionEntry[]
  byBlockId: Record<string, BlockExecution>
}

/**
 * **Justo debajo de lo que está pasando** (criterio 370), y el detalle que no
 * es obvio: **hay dos formas de «lo que está pasando»**. Si la sesión viva está
 * movida o fuera del plan, la fila real es un `ExecutionSessionEntry`; si está
 * pegada a su bloque, la fila real es el propio bloque. Sin nada en marcha, la
 * línea de AHORA. Y si el reloj cae fuera del día no hay marca de AHORA, así
 * que **no hay tarjeta** — que es la mitad del criterio 180.
 */
export function findUpNextAnchorId({ entries, byBlockId }: FindAnchorInput): string | null {
  const runningSession = entries.find((entry) => entry.kind === 'session' && entry.span.isRunning)
  if (runningSession) return runningSession.id

  const runningBlock = entries.find(
    (entry) => entry.kind === 'block' && (byBlockId[entry.id]?.isRunning ?? false),
  )
  if (runningBlock) return runningBlock.id

  const nowMark = entries.find((entry) => entry.kind === 'now')
  if (nowMark) return nowMark.id

  return null
}

/* ── 4. Qué se lee ────────────────────────────────────────────────────────── */

export type UpNextExits = {
  /** Cuántos ítems del plan quedan **sin resolver** además del propuesto. */
  othersCount: number
  /** «Ya la hice»: solo cuando la hora ya pasó (criterio 197, tajada 2). */
  showDidIt: boolean
}

export type UpNextProposal = {
  variant: 'proposal'
  /** La fila de la que cuelga: `findUpNextAnchorId`. */
  anchorId: string
  blockId: string
  activityId: string
  /** La hora de la **plantilla**, en gris, en la misma regleta (criterio 371). */
  gutterLabel: string
  /** `HH:mm` para el `dateTime` del `<time>`. */
  gutterTime: string
  title: string
  icon: string | null
  color: string | null
  /** «Lo que viene» · «Lo que viene · se pasó de la hora» (criterio 193). */
  kicker: string
  /** «En tu plantilla, a las 11:30 · suele durarte 30 min» (criterios 183, 372). */
  metaLine: string
  /** La frase de verdad, **siempre** (criterio 373) con la coletilla del 378. */
  truthLine: string
  isOverdue: boolean
  regionLabel: string
  buttonLabel: string
  /** «Empezar Daily meeting ahora» (criterio 206). */
  buttonSrLabel: string
  exits: UpNextExits
  /** `false` → **no se pinta el botón** y manda `blockedNote` (criterio 189). */
  canStart: boolean
  /**
   * Con `canStart === false` no se pinta un botón que no va a funcionar: en su
   * lugar, **una línea que dice qué falta** (criterio 189).
   */
  blockedNote: string | null
}

/**
 * **La cara de cuando no hay nada que proponer** (criterios 377, 192 y la
 * segunda mitad del 209). El mismo sitio y la misma forma que la propuesta —la
 * tarjeta cuelga del mismo ancla y se llama igual para quien la lee con
 * lector—, en trazo apagado, **sin titular de actividad**: no se inventa una
 * sugerencia para rellenar, no se propone algo ya hecho y no se queda muda.
 *
 * La canaleta va **vacía** (criterio 371): no hay hora de plantilla que
 * enseñar, y un «—» o la hora actual serían un dato falso.
 */
export type UpNextEmpty = {
  variant: 'empty'
  anchorId: string
  /**
   * **Por qué no hay propuesta**, que es lo que decide qué se lee:
   *
   * - `template-done` — la plantilla se acabó: se dice cuánto queda de día.
   * - `execution-unknown` — no se pudo cargar lo vivido: **no** se afirma que
   *   no queda nada (criterio 209), se dice que falta ese dato.
   */
  reason: 'template-done' | 'execution-unknown'
  /** Vacía siempre: aquí no hay hora de plantilla (criterio 371). */
  gutterLabel: ''
  kicker: string
  /** «Tu martes se acaba a las 22:00. Te quedan 3h 8.» */
  emptyLine: string
  regionLabel: string
  buttonLabel: string
  buttonSrLabel: string
  canStart: boolean
  blockedNote: string | null
}

export type UpNext = UpNextProposal | UpNextEmpty

export type BuildUpNextInput = {
  block: AgendaBlock
  anchorId: string
  /** La costumbre de FEAT-007 para esa actividad, si la hay (criterio 372). */
  usualMinutes: number | null
  /** El nombre de lo que está corriendo, para la coletilla del criterio 378. */
  runningTitle: string | null
  nowMinutes: number
  /** Cuántos ítems del plan quedan sin resolver **contando el propuesto**. */
  openCount: number
  /** `false` → sin botón y con la línea de qué falta (criterio 189). */
  canStart: boolean
  /** Qué falta para poder empezar, ya escrito por la página. */
  blockedNote?: string | null
}

const UP_NEXT_KICKER = 'Lo que viene'
/**
 * **«se pasó de la hora» es un dato, no un reproche** (criterios 193 y 210).
 * Va pegado al mismo rótulo de siempre porque **nada más cambia**: mismo sitio,
 * mismo botón, misma frase de verdad. Sin color de alarma, sin exclamación y
 * sin una segunda tarjeta.
 */
const UP_NEXT_KICKER_OVERDUE = 'Lo que viene · se pasó de la hora'
/** El rótulo de la cara apagada: un dato, no un reproche (criterios 377, 210). */
const UP_NEXT_EMPTY_KICKER = 'Ya no queda nada en tu plantilla'
const UP_NEXT_REGION_LABEL = 'Lo que viene'

/**
 * **Todos los textos ya escritos**, para que el componente sea tonto.
 *
 * Dos cosas que no son de estilo:
 *
 * 1. **La duración se llama «suele durarte N»**, nunca «N» a secas (criterio
 *    372). Si FEAT-007 tiene costumbre de esa actividad y difiere de la
 *    plantilla, **manda la costumbre**; si no, el número es el de la plantilla y
 *    **las palabras no cambian**, porque es lo que tu plantilla dice que sueles
 *    hacer.
 * 2. **Ninguna hora de fin, en ninguna rama** (criterio 373). Ni «acabarías a
 *    las…», ni una barra que reserve el tramo: eso es justo lo que se leía como
 *    una reserva y lo que impedía pulsar.
 */
export function buildUpNext({
  block,
  anchorId,
  usualMinutes,
  runningTitle,
  nowMinutes,
  openCount,
  canStart,
  blockedNote = null,
}: BuildUpNextInput): UpNextProposal {
  const title = block.item.activity?.title ?? 'Actividad'
  const category = block.item.activity?.category ?? null
  const startTime = minutesToTime(block.startMinutes)
  const startLabel = formatTimeForDisplay(startTime)
  const minutes = usualMinutes ?? block.durationMinutes
  const durationLabel = formatDurationMinutes(minutes)
  const isOverdue = block.startMinutes < nowMinutes
  // «los 30 min» / «las 4 h»: el artículo lo manda el género de lo que se
  // escribe, no una plantilla fija. El criterio 373 cita la frase con 30 min;
  // con 4 h, «los 4 h» no se lee en castellano.
  const durationArticle = minutes < 60 ? 'los' : 'las'

  const truthLine =
    `Arranca cuando pulses, no a las ${startLabel}. Y ${durationArticle} ${durationLabel} son lo que suele` +
    ` durarte: se registra lo que dure de verdad.` +
    (runningTitle === null
      ? ''
      : ` Al hacerlo, «${runningTitle}» se dará por terminada a esa hora.`)

  return {
    variant: 'proposal',
    anchorId,
    blockId: block.id,
    activityId: block.item.activityId,
    gutterLabel: startLabel,
    gutterTime: startTime,
    title,
    icon: category?.icon ?? null,
    color: category?.color ?? null,
    kicker: isOverdue ? UP_NEXT_KICKER_OVERDUE : UP_NEXT_KICKER,
    metaLine: `En tu plantilla, a las ${startLabel} · suele durarte ${durationLabel}`,
    truthLine,
    isOverdue,
    regionLabel: UP_NEXT_REGION_LABEL,
    buttonLabel: 'Empezar ahora',
    buttonSrLabel: `Empezar ${title} ahora`,
    exits: {
      othersCount: Math.max(0, openCount - 1),
      // **Solo cuando la hora ya pasó** (criterio 197). Antes de la hora no
      // tiene sentido y le quitaría sitio al botón, que es lo único que se
      // toca en el caso normal.
      showDidIt: isOverdue,
    },
    canStart,
    blockedNote: canStart ? null : blockedNote,
  }
}

/* ── 5. Cuando no hay nada que proponer ───────────────────────────────────── */

export type BuildUpNextEmptyInput = {
  anchorId: string
  reason: 'template-done' | 'execution-unknown'
  /** El día de la semana en minúsculas, tal como lo escribe `VIDA_DAY_LABELS`. */
  dayLabel: string
  /** `HH:mm` del fin del día: **el mismo `dayHours.endTime` que pinta la barra**. */
  dayEndTime: string
  /**
   * Los minutos que le quedan al día, **los mismos que `getDayBudget` ya puso
   * en la barra de arriba** (criterio 377). No se rehace la resta aquí: si la
   * tarjeta dijera otra cosa que la línea que tiene tres dedos por encima,
   * sería un defecto aunque la cuenta fuese correcta.
   */
  remainingMinutes: number | null
  canStart: boolean
  blockedNote?: string | null
}

/**
 * **«Ya no queda nada en tu plantilla»** (criterio 377) y **«no se pudo cargar
 * lo que llevas hecho»** (criterio 209, su segunda mitad): las dos caras que no
 * proponen nada, con el mismo botón de salida.
 *
 * Tres cosas que no son de estilo:
 *
 * 1. **No es un fallo del usuario.** La plantilla se acabó y eso es un dato:
 *    ni «vacío», ni «todavía no has», ni una cara de que falta algo (criterios
 *    192 y 210). Se dice lo cierto —cuánto queda de día— y se deja el botón.
 * 2. **Los números son los de la barra**, no una cuenta nueva: entran ya
 *    calculados y se escriben con los **mismos formateadores** que usa
 *    `VidaDayBudget` (`formatDurationFromMinutes` y `formatTimeForDisplay`).
 *    Por eso «3h 8» y no «3 h 8»: el render dibuja lo segundo, pero lo que
 *    manda es que las dos líneas de la pantalla digan lo mismo.
 * 3. **Sin saber lo vivido no se afirma que no queda nada** (criterio 209): con
 *    `execution-unknown` el rótulo sigue siendo «Lo que viene» y lo que se dice
 *    es que falta ese dato.
 */
export function buildUpNextEmpty({
  anchorId,
  reason,
  dayLabel,
  dayEndTime,
  remainingMinutes,
  canStart,
  blockedNote = null,
}: BuildUpNextEmptyInput): UpNextEmpty {
  const endLabel = formatTimeForDisplay(dayEndTime)
  // Con el día ya cerrado no se escribe «te quedan 0m» —es el mismo hallazgo
  // que la barra respeta desde FEAT-003—: se dice a qué hora acaba y se calla
  // el resto.
  const emptyLine =
    reason === 'execution-unknown'
      ? 'No pudimos cargar lo que llevas hecho hoy, así que no te proponemos nada.'
      : remainingMinutes !== null && remainingMinutes > 0
        ? `Tu ${dayLabel} se acaba a las ${endLabel}. Te quedan ${formatDurationFromMinutes(remainingMinutes)}.`
        : `Tu ${dayLabel} se acaba a las ${endLabel}.`

  return {
    variant: 'empty',
    anchorId,
    reason,
    gutterLabel: '',
    kicker: reason === 'execution-unknown' ? UP_NEXT_KICKER : UP_NEXT_EMPTY_KICKER,
    emptyLine,
    regionLabel: UP_NEXT_REGION_LABEL,
    buttonLabel: 'Empezar algo',
    buttonSrLabel: 'Empezar algo',
    canStart,
    blockedNote: canStart ? null : blockedNote,
  }
}
