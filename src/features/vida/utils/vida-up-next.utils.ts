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
import { formatDurationMinutes, formatTimeForDisplay, minutesToTime } from '@/features/vida/utils/vida-time.utils'

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
  const runningSession = entries.find(
    (entry) => entry.kind === 'session' && entry.span.isRunning,
  )
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

export type UpNext = {
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
}: BuildUpNextInput): UpNext {
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
    kicker: UP_NEXT_KICKER,
    metaLine: `En tu plantilla, a las ${startLabel} · suele durarte ${durationLabel}`,
    truthLine,
    isOverdue,
    regionLabel: UP_NEXT_REGION_LABEL,
    buttonLabel: 'Empezar ahora',
    buttonSrLabel: `Empezar ${title} ahora`,
    exits: {
      othersCount: Math.max(0, openCount - 1),
      // La tajada 2 es la que la enciende con `isOverdue` (criterios 193 y 197).
      showDidIt: false,
    },
    canStart,
    blockedNote: canStart ? null : blockedNote,
  }
}
