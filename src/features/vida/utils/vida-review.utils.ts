/**
 * **Cómo se cuenta un día ya vivido** (FEAT-006, tajada 1).
 *
 * La frontera con `vida-execution.utils.ts` está escrita en A1 del plan y aquí
 * se respeta al pie de la letra:
 *
 * > De `vida-execution.utils.ts` se importa todo lo que define **qué pasó**
 * > —el emparejamiento, las etiquetas, los tramos, el presupuesto y
 * > `collectDayClosing`—. Aquí solo vive **cómo se cuenta**: las filas de plan
 * > frente a real, las filas de los carriles, el orden de las salidas y las
 * > frases.
 *
 * Por eso en este archivo **no hay ninguna regla de emparejamiento, ningún
 * umbral y ninguna segunda definición de «seguido»**: la cifra grande es
 * literalmente `collectDayClosing(...).followedCount / .plannedCount`, y las
 * etiquetas («✓ calcado», «+11 min», «empezó +5», «movido · 40 min tarde») las
 * compone `describeBlockExecution`, que es la misma que lee Hoy (criterios 9 y
 * 13).
 *
 * Todo es **puro**: el «ahora» y el «hoy» entran por parámetro, no hay ni un
 * `new Date()` ni una llamada al API, y nada de aquí sabe qué es
 * `localStorage` —las razones de «No se pudo» entran como un mapa de ids—.
 */

import type { AgendaBlock, DayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import { formatDayHeading, parseYmdToLocalDate } from '@/features/vida/utils/vida-date.utils'
import type {
  BlockExecution,
  BlockMissingStatus,
  DayClosingInput,
  DayExecution,
  ExecutionSessionEntry,
  NoDataSlice,
  SessionSpan,
} from '@/features/vida/utils/vida-execution.utils'
import {
  VIDA_ON_PLAN_TOLERANCE_MINUTES,
  collectDayClosing,
  isDayClosed as isDayClosedFor,
} from '@/features/vida/utils/vida-execution.utils'
import {
  formatDurationFromMinutes,
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'

/** El día que se mira, respecto del reloj. */
export type ReviewDayStatus = 'future' | 'open' | 'closed'

/** La mitad del día en la que cae algo: la frontera son las 14:00. */
export const REVIEW_AFTERNOON_MINUTES = 14 * 60

/**
 * El último día **cerrado** (criterio 3): ayer si hoy todavía no ha llegado al
 * fin del día de Vida, y hoy si ya lo pasó. Nunca un día futuro.
 *
 * Quien pasa un `?d=` manda: la revisión de un día concreto se abre aunque no
 * esté cerrado —hoy se mira «aún abierto» (criterio 5) y un día futuro dice que
 * todavía no ha pasado (criterio 4)—. Esto solo decide **con qué día se entra**.
 */
export function resolveReviewDate(params: {
  /** Lo que venía en la URL, o `null`. */
  param: string | null
  today: string
  /** `HH:mm` del fin del día de Vida (ajustes). */
  dayEnd: string
  /** Minutos desde medianoche de **ahora**. */
  nowMinutes: number
}): string {
  const { param, today, dayEnd, nowMinutes } = params
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param.trim())) return param.trim()
  const todayClosed = isDayClosedFor({ nowMinutes, dayEnd, isPastDay: false })
  if (todayClosed) return today
  const yesterday = parseYmdToLocalDate(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const year = yesterday.getFullYear()
  const month = `${yesterday.getMonth() + 1}`.padStart(2, '0')
  const day = `${yesterday.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** «Viernes 18 de septiembre». `formatDayHeading` da «Viernes 18». */
export function formatReviewDateLabel(date: string): string {
  const month = parseYmdToLocalDate(date).toLocaleDateString('es', { month: 'long' })
  return `${formatDayHeading(date)} de ${month}`
}

/* ── Las filas de plan frente a real (criterios 13, 14, 16, 17 y 19) ────── */

export type ReviewTag = {
  /** Para el estilo: `on-plan` · `shift` · `duration` · `moved` · `running`. */
  kind: string
  label: string
}

export type ReviewRealCell =
  | {
      kind: 'matched' | 'moved'
      /** «7:04». */
      timeLabel: string
      /** «14 min». */
      durationLabel: string
      /** «7:04 – 7:18». */
      rangeLabel: string
      tags: ReviewTag[]
    }
  | {
      kind: 'missing'
      /** «no hecho» · «no se pudo» · «pendiente». */
      label: string
      /** «me fui directo a la llamada» o `null`. La pantalla la entrecomilla. */
      reason: string | null
      /** `true` cuando el día se cerró y nadie explicó nada: «sin razón». */
      withoutReason: boolean
    }
  /** Nada que decir todavía (`upcoming`) o día sin nada apuntado (marco E). */
  | { kind: 'none' }

export type ReviewRow = {
  /** El `id` del bloque de la agenda: sirve de ancla. */
  id: string
  /** El `id` del ítem del plan: la clave de las notas del aparato. */
  itemId: string
  title: string
  icon: string
  color: string | null
  startMinutes: number
  /** «7:00». */
  plannedTimeLabel: string
  /** «15 min». */
  plannedDurationLabel: string
  real: ReviewRealCell
}

export type ReviewOffPlanRow = {
  id: string
  title: string
  icon: string
  color: string | null
  startMinutes: number
  /** «8:15». */
  timeLabel: string
  /** «25 min». */
  durationLabel: string
  /** «8:15 – 8:40». */
  rangeLabel: string
  /** Siempre «fuera del plan»: lo compone `vida-execution.utils.ts`. */
  label: string
}

/* ── Las cifras (criterios 9, 10 y 11) ──────────────────────────────────── */

export type ReviewFigures = {
  /** `collectDayClosing(...).followedCount`: no hay otra definición. */
  followedCount: number
  plannedCount: number
  /** `false` en un día sin plan: ahí no se enseña «N de M» (criterio 20). */
  hasCount: boolean
  plannedMinutes: number
  plannedMinutesLabel: string
  registeredMinutes: number
  registeredMinutesLabel: string
  offPlanMinutes: number
  offPlanMinutesLabel: string
  noDataMinutes: number
  noDataMinutesLabel: string
  dayMinutes: number
  dayMinutesLabel: string
  /** El día sigue abierto: las cifras se leen **hasta ahora** (criterio 5). */
  isOpen: boolean
}

/* ── Los carriles del escritorio (criterio 22, A2) ──────────────────────── */

export type ReviewLanePlan = {
  block: AgendaBlock
  title: string
  icon: string
  color: string | null
  durationLabel: string
  /** El movido deja **sombra** en su hora: la fila se pinta apagada. */
  isShadow: boolean
}

export type ReviewLaneReal =
  | { kind: 'matched' | 'moved' | 'off-plan'; title: string; icon: string; color: string | null; rangeLabel: string; tags: ReviewTag[] }
  | { kind: 'moved-shadow'; label: string }
  | { kind: 'missing'; label: string; reason: string | null; withoutReason: boolean }
  | { kind: 'no-data'; rangeLabel: string; durationLabel: string; minutes: number }
  | { kind: 'none' }

export type ReviewLaneRow = {
  id: string
  /** «7:00»: la hora de la izquierda del render. */
  timeLabel: string
  startMinutes: number
  plan: ReviewLanePlan | null
  real: ReviewLaneReal
}

/* ── Lo que se dice cuando no hay nada que contar ───────────────────────── */

export type ReviewEmptyNotice = {
  title: string
  body: string
  /** La línea que quita presión. `null` cuando no hace falta. */
  hint: string | null
}

export type DayReview = {
  status: ReviewDayStatus
  /** «Viernes 18 de septiembre». */
  dateLabel: string
  /** «día cerrado» · «aún abierto» · «todavía no ha pasado». */
  statusLabel: string
  /** Como mucho tres frases (criterio 6). Vacío en los días raros. */
  story: string[]
  /** `null` en un día normal; el texto del marco E o del día sin plan. */
  emptyNotice: ReviewEmptyNotice | null
  /** `null` en un día futuro: cero cifras, ni a cero ni inventadas (criterio 4). */
  figures: ReviewFigures | null
  /** Plan frente a real, en orden de hora. Vacío si no hay nada registrado. */
  rows: ReviewRow[]
  /** El plan en **trazo fantasma** del marco E (criterio 19). */
  ghostRows: ReviewRow[]
  /** Solo lo que no se hizo: el panel de la izquierda del escritorio (criterio 22). */
  missingRows: ReviewRow[]
  offPlan: ReviewOffPlanRow[]
  offPlanMinutes: number
  offPlanMinutesLabel: string
  lanes: ReviewLaneRow[]
  hasPlan: boolean
  hasExecution: boolean
}

export type BuildDayReviewInput = {
  execution: DayExecution
  agenda: DayAgenda
  /** `YYYY-MM-DD` del día que se mira. */
  date: string
  today: string
  /** Minutos desde medianoche, o `null` si el día que se mira no es hoy. */
  nowMinutes: number | null
  /**
   * `item.id` → la razón del «No se pudo», o `null` si se marcó sin razón.
   * Viene del aparato (FEAT-004, D7) y por eso entra como dato, no se lee aquí.
   */
  couldNotById: ReadonlyMap<string, string | null>
}

function categoryOf(activity: { category?: { color: string | null; icon: string | null } | null } | null | undefined) {
  const category = activity?.category ?? null
  return { icon: category?.icon ?? UNCATEGORIZED_GROUP_ICON, color: category?.color ?? null }
}

/**
 * Los minutos de `[from, to)` que **ninguna sesión cubre**, contando cada
 * minuto una sola vez (unión de intervalos, no suma de duraciones).
 *
 * En un día **cerrado** esto no hace falta: la cifra sale de la leyenda del
 * presupuesto (A9), que es lo que garantiza el criterio 12. Existe por el día
 * **abierto**, donde ninguna de las tres formas del presupuesto tiene el tramo
 * «sin dato» y el criterio 5 pide leer «hasta ahora». El test comprueba que
 * sobre un día cerrado da **exactamente** lo que dice la leyenda: si algún día
 * dejaran de coincidir, sería un fallo de este archivo, no de aquel.
 */
export function uncoveredMinutes(
  spans: readonly { startMinutes: number; endMinutes: number }[],
  from: number,
  to: number,
): number {
  if (to <= from) return 0
  const clipped = spans
    .map((span) => ({
      start: Math.max(from, Math.min(span.startMinutes, to)),
      end: Math.max(from, Math.min(span.endMinutes, to)),
    }))
    .filter((span) => span.end > span.start)
    .sort((a, b) => a.start - b.start)

  let covered = 0
  let cursor = from
  for (const span of clipped) {
    if (span.end <= cursor) continue
    covered += span.end - Math.max(cursor, span.start)
    cursor = span.end
  }
  return Math.max(0, to - from - covered)
}

/** Todas las sesiones del día: las que casaron con un bloque y las de fuera. */
function spansOf(execution: DayExecution): SessionSpan[] {
  const matched = Object.values(execution.byBlockId).map((item) => item.span)
  const offPlan = execution.sessions
    .filter((entry) => entry.variant === 'off-plan')
    .map((entry) => entry.span)
  return [...matched, ...offPlan].sort((a, b) => a.startMinutes - b.startMinutes)
}

/** Las etiquetas de un bloque con sesión. **Ninguna se escribe aquí**. */
function tagsOf(execution: BlockExecution, movedLabel: string | null): ReviewTag[] {
  if (execution.isRunning) return [{ kind: 'running', label: 'en marcha' }]
  if (execution.status === 'moved') {
    return [
      { kind: 'moved', label: 'movido' },
      ...(movedLabel ? [{ kind: 'shift', label: movedLabel }] : []),
    ]
  }
  if (execution.isOnPlan) return [{ kind: 'on-plan', label: '✓ calcado' }]
  return [
    ...(execution.startLabel ? [{ kind: 'shift', label: execution.startLabel }] : []),
    ...(execution.durationLabel ? [{ kind: 'duration', label: execution.durationLabel }] : []),
  ]
}

/** El tipo estrecho: la fila de un bloque sin sesión solo puede ser una de dos. */
export type ReviewMissingCell =
  | Extract<ReviewRealCell, { kind: 'missing' }>
  | { kind: 'none' }

function missingCell(
  missing: BlockMissingStatus,
  couldNot: { has: boolean; reason: string | null },
  isClosed: boolean,
): ReviewMissingCell {
  if (missing === 'upcoming' && !couldNot.has) return { kind: 'none' }
  const label = couldNot.has ? 'no se pudo' : missing === 'pending' ? 'pendiente' : 'no hecho'
  // «Sin razón» solo con el día cerrado: de lo que todavía cabe no se dice que
  // no tenga explicación (criterio 14 y D9 de FEAT-004).
  const withoutReason = couldNot.reason === null && isClosed
  return { kind: 'missing', label, reason: couldNot.reason, withoutReason }
}

/**
 * El día contado: la historia, las cifras, las filas y los carriles.
 *
 * Los tres pases anteriores —`buildDayAgenda`, `buildDayExecution` y
 * `collectDayClosing`— ya hicieron toda la aritmética; este es el cuarto y solo
 * **proyecta**. Si algún día hiciera falta decidir aquí si un bloque se siguió,
 * estaría mal escrito.
 */
export function buildDayReview({
  execution,
  agenda,
  date,
  today,
  nowMinutes,
  couldNotById,
}: BuildDayReviewInput): DayReview {
  const status: ReviewDayStatus =
    date > today ? 'future' : execution.isDayClosed ? 'closed' : 'open'
  const dateLabel = formatReviewDateLabel(date)
  const statusLabel =
    status === 'future' ? 'todavía no ha pasado' : status === 'open' ? 'aún abierto' : 'día cerrado'

  const hasPlan = agenda.blocks.length > 0
  const hasExecution = execution.hasExecution
  const spans = spansOf(execution)
  const movedLabelByBlockId = new Map(
    execution.sessions
      .filter((entry) => entry.variant === 'moved' && entry.fromBlockId !== null)
      .map((entry) => [entry.fromBlockId!, entry.label] as const),
  )

  const rowOf = (block: AgendaBlock, real: ReviewRealCell): ReviewRow => {
    const { icon, color } = categoryOf(block.item.activity)
    return {
      id: block.id,
      itemId: block.item.id,
      title: block.item.activity?.title ?? 'Actividad',
      icon,
      color,
      startMinutes: block.startMinutes,
      plannedTimeLabel: formatTimeForDisplay(minutesToTime(block.startMinutes)),
      plannedDurationLabel: formatDurationMinutes(block.durationMinutes),
      real,
    }
  }

  const realCellOf = (block: AgendaBlock): ReviewRealCell => {
    const blockExecution = execution.byBlockId[block.id]
    if (blockExecution) {
      return {
        kind: blockExecution.status === 'moved' ? 'moved' : 'matched',
        timeLabel: formatTimeForDisplay(minutesToTime(blockExecution.span.startMinutes)),
        durationLabel: formatDurationMinutes(blockExecution.realMinutes),
        rangeLabel: blockExecution.rangeLabel,
        tags: tagsOf(blockExecution, movedLabelByBlockId.get(block.id) ?? null),
      }
    }
    const missing = execution.missingByBlockId[block.id]
    if (!missing) return { kind: 'none' }
    const hasNote = couldNotById.has(block.item.id)
    return missingCell(
      missing,
      { has: hasNote, reason: couldNotById.get(block.item.id) ?? null },
      execution.isDayClosed,
    )
  }

  // Un día **sin nada registrado** no dice «no hecho» de cada bloque: enseña el
  // plan en trazo fantasma y ya (criterio 19). Un día futuro, tampoco.
  const isGhost = status === 'future' || !hasExecution
  const rows = isGhost ? [] : agenda.blocks.map((block) => rowOf(block, realCellOf(block)))
  const ghostRows = isGhost ? agenda.blocks.map((block) => rowOf(block, { kind: 'none' })) : []
  const missingRows = rows.filter((row) => row.real.kind === 'missing')

  const offPlanEntries = execution.sessions.filter((entry) => entry.variant === 'off-plan')
  const offPlan: ReviewOffPlanRow[] = offPlanEntries.map((entry) => {
    const { icon, color } = categoryOf(entry.span.session.activity)
    return {
      id: entry.id,
      title: entry.span.title,
      icon,
      color,
      startMinutes: entry.startMinutes,
      timeLabel: formatTimeForDisplay(minutesToTime(entry.startMinutes)),
      durationLabel: formatDurationMinutes(entry.durationMinutes),
      rangeLabel: entry.rangeLabel,
      label: entry.label,
    }
  })
  // Los minutos de fuera del plan son **minutos de sesión**, como los de
  // «registrado»: el criterio 10 los presenta como una parte de lo registrado
  // («de lo registrado, 1h 50 fuera del plan»), y el tramo de la leyenda mide
  // otra cosa —el reparto del día sin solapes—. Así la cifra grande y la
  // cabecera de «Fuera del plan» dicen **el mismo número** (criterio 16).
  const offPlanMinutes = offPlanEntries.reduce((total, entry) => total + entry.durationMinutes, 0)

  const closing = collectDayClosing({
    execution,
    agenda,
    couldNotItemIds: new Set(couldNotById.keys()),
  })

  const legendNoData = execution.budget.legend.find((item) => item.kind === 'no-data')?.minutes
  const windowEnd =
    status === 'open' && nowMinutes !== null
      ? Math.min(agenda.windowEnd, Math.max(agenda.windowStart, nowMinutes))
      : agenda.windowEnd
  const noDataMinutes =
    legendNoData ?? uncoveredMinutes(spans, agenda.windowStart, windowEnd)
  const plannedMinutes = agenda.blocks.reduce((total, block) => total + block.durationMinutes, 0)
  const registeredMinutes = spans.reduce((total, span) => total + span.durationMinutes, 0)

  const figures: ReviewFigures | null =
    status === 'future'
      ? null
      : {
          followedCount: closing.followedCount,
          plannedCount: closing.plannedCount,
          hasCount: hasPlan,
          plannedMinutes,
          plannedMinutesLabel: formatDurationFromMinutes(plannedMinutes),
          registeredMinutes,
          registeredMinutesLabel: formatDurationFromMinutes(registeredMinutes),
          offPlanMinutes,
          offPlanMinutesLabel: formatDurationFromMinutes(offPlanMinutes),
          noDataMinutes,
          noDataMinutesLabel: formatDurationFromMinutes(noDataMinutes),
          dayMinutes: execution.budget.dayMinutes,
          dayMinutesLabel: formatDurationFromMinutes(execution.budget.dayMinutes),
          isOpen: status === 'open',
        }

  // Lo mismo que `closing.missing` —mismo orden, mismos bloques— más la razón,
  // que la frase necesita entre comillas y el recuento de FEAT-004 no lleva.
  const missingNotes: ReviewMissingNote[] = agenda.blocks
    .filter((block) => execution.missingByBlockId[block.id] !== undefined)
    .map((block) => ({
      title: block.item.activity?.title ?? 'Actividad',
      couldNot: couldNotById.has(block.item.id),
      insteadTitle: execution.insteadByBlockId[block.id]?.title ?? null,
      reason: couldNotById.get(block.item.id) ?? null,
    }))

  const story =
    status === 'future' || !hasExecution
      ? []
      : buildReviewStory({
          ...closing,
          missing: missingNotes,
          status,
          nuance: describeNuance(agenda, execution),
          offPlanTitles: offPlanEntries.map((entry) => entry.span.title),
          offPlanMinutes,
          registeredMinutes,
        })

  return {
    status,
    dateLabel,
    statusLabel,
    story,
    emptyNotice: buildEmptyNotice({ status, hasPlan, hasExecution, plannedCount: closing.plannedCount }),
    figures,
    rows,
    ghostRows,
    missingRows,
    offPlan,
    offPlanMinutes,
    offPlanMinutesLabel: formatDurationFromMinutes(offPlanMinutes),
    lanes: status === 'future' ? [] : buildReviewLanes({ execution, couldNotById }),
    hasPlan,
    hasExecution,
  }
}

/* ── La historia (criterios 6, 7, 8 a medias, 20 y 21) ──────────────────── */

export type ReviewMissingNote = DayClosingInput['missing'][number] & { reason: string | null }

export type ReviewStoryInput = Omit<DayClosingInput, 'missing'> & {
  missing: ReviewMissingNote[]
  status: ReviewDayStatus
  /** El matiz de la primera frase, ya compuesto. `null` si no hay ninguno. */
  nuance: string | null
  offPlanTitles: string[]
  registeredMinutes: number
}

function joinNames(titles: string[]): string {
  if (titles.length === 1) return titles[0]!
  return `${titles.slice(0, -1).join(', ')} y ${titles[titles.length - 1]}`
}

/**
 * El matiz de la primera frase: sale **de los bloques emparejados**, nunca de
 * una categoría.
 *
 * El criterio 8 parte en dos: «la historia habla de bloques» se cumple aquí, y
 * la mitad que puede nombrar una **categoría** en la frase de la mañana o de la
 * tarde necesita el reparto por categoría, que es la tajada 2. **En la tajada 1
 * no se nombra ninguna**: si no se sostiene, no se afirma.
 *
 * Dos reglas, y las dos piden dato:
 *
 * - «la mañana, calcada»: hay **dos o más** bloques seguidos antes de las 14:00
 *   y **todos** cayeron dentro de la tolerancia.
 * - «X, N min más larga de lo que le diste»: el bloque cuya duración más se
 *   separó del plan, y solo por encima de la tolerancia de Hoy.
 */
export function describeNuance(agenda: DayAgenda, execution: DayExecution): string | null {
  const matched = agenda.blocks
    .map((block) => ({ block, item: execution.byBlockId[block.id] }))
    .filter((pair): pair is { block: AgendaBlock; item: BlockExecution } => Boolean(pair.item))
    .filter((pair) => !pair.item.isRunning)

  const parts: string[] = []
  const morning = matched.filter((pair) => pair.block.startMinutes < REVIEW_AFTERNOON_MINUTES)
  if (morning.length >= 2 && morning.every((pair) => pair.item.isOnPlan)) {
    parts.push('la mañana, calcada')
  }

  const widest = matched
    .filter(
      (pair) => Math.abs(pair.item.durationDeltaMinutes) > VIDA_ON_PLAN_TOLERANCE_MINUTES,
    )
    .sort(
      (a, b) =>
        Math.abs(b.item.durationDeltaMinutes) - Math.abs(a.item.durationDeltaMinutes) ||
        a.block.startMinutes - b.block.startMinutes,
    )[0]
  if (widest) {
    const delta = widest.item.durationDeltaMinutes
    const title = widest.block.item.activity?.title ?? 'Actividad'
    parts.push(
      delta > 0
        ? `${title}, ${delta} min más larga de lo que le diste`
        : `${title}, ${Math.abs(delta)} min más corta de lo que le diste`,
    )
  }

  return parts.length > 0 ? parts.join('; ') : null
}

/**
 * La historia del día: **como mucho tres frases**, compuestas con reglas y en
 * el orden del criterio 6 —(a) lo que sí salió, (b) lo que se salió del plan,
 * (c) lo que no se hizo—. **Cada una solo aparece si hay dato que la
 * sostenga**, igual que `composeReading` en el panel de hábitos.
 *
 * No se llama a `buildDayClosingLine`: aquella compone **una** línea con el
 * orden de FEAT-004, pensada para el minuto en que el día se cierra dentro de
 * Hoy. Lo que sí se comparte es el `DayClosingInput`, que es donde está el
 * recuento — y por eso las dos pantallas **no pueden decir cifras distintas**
 * del mismo día (A8).
 *
 * En un día **abierto** nada habla en pasado cerrado (criterio 5): ni
 * «seguiste», ni «se quedó sin hacer». Lo que aún puede pasar no se cuenta.
 */
export function buildReviewStory(input: ReviewStoryInput): string[] {
  const {
    plannedCount,
    followedCount,
    missing,
    sessionCount,
    offPlanCount,
    offPlanTitles,
    offPlanMinutes,
    registeredMinutes,
    status,
    nuance,
  } = input
  const isOpen = status === 'open'
  const sentences: string[] = []

  // Sin plan (criterio 20): ni «N de M», ni lista fantasma. Se cuenta lo que
  // sí quedó apuntado.
  if (plannedCount === 0) {
    if (sessionCount === 0) return []
    sentences.push(
      isOpen
        ? `Este día no tiene plan; llevas ${sessionCount} ${sessionCount === 1 ? 'cosa' : 'cosas'} y ${formatDurationFromMinutes(registeredMinutes)}.`
        : `Este día no tenía plan; registraste ${sessionCount} ${sessionCount === 1 ? 'cosa' : 'cosas'} y ${formatDurationFromMinutes(registeredMinutes)}.`,
    )
    return sentences
  }

  // (a) Siempre abre por lo que sí salió (criterio 7).
  const headline = isOpen
    ? `Hasta ahora llevas ${followedCount} de ${plannedCount} ${plannedCount === 1 ? 'bloque' : 'bloques'}.`
    : followedCount === plannedCount
      ? `Seguiste ${plannedCount === 1 ? 'el bloque' : `los ${plannedCount} bloques`} que planeaste.`
      : `Seguiste ${followedCount} de ${plannedCount} bloques.`
  sentences.push(nuance ? `${headline.slice(0, -1)}: ${nuance}.` : headline)

  // (b) Lo que se salió, con sus minutos.
  if (offPlanCount > 0) {
    const named = offPlanTitles.slice(0, 2)
    const rest = offPlanCount - named.length
    const what = rest > 0 ? `${joinNames(named)} y ${rest} más` : joinNames(named)
    sentences.push(
      isOpen
        ? `Fuera del plan llevas ${what} — ${formatDurationFromMinutes(offPlanMinutes)} que no estaban en él.`
        : `Lo que se salió fue ${what} — ${formatDurationFromMinutes(offPlanMinutes)} que no estaban en el plan.`,
    )
  }

  // (c) Lo que no se hizo. **Solo con el día cerrado**: de lo que todavía cabe
  // no se afirma nada (criterio 5).
  if (!isOpen && missing.length > 0) {
    const couldNot = missing.filter((note) => note.couldNot)
    const plain = missing.filter((note) => !note.couldNot)
    const parts: string[] = []
    for (const note of couldNot.slice(0, 2)) {
      parts.push(note.reason ? `${note.title} no se pudo («${note.reason}»)` : `${note.title} no se pudo`)
    }
    const restCouldNot = couldNot.length - Math.min(couldNot.length, 2)
    if (restCouldNot > 0) parts.push(`otras ${restCouldNot} no se pudieron`)
    if (plain.length > 0) {
      const named = plain.slice(0, 2).map((note) => note.title)
      parts.push(
        plain.length <= 2
          ? `${joinNames(named)} se ${plain.length === 1 ? 'quedó' : 'quedaron'} sin hacer`
          : `${plain.length} más se quedaron sin hacer`,
      )
    }
    if (parts.length > 0) {
      const text = joinNames(parts)
      sentences.push(`${text.charAt(0).toUpperCase()}${text.slice(1)}.`)
    }
  }

  return sentences.slice(0, 3)
}

/* ── Los días raros (criterios 4, 19 y 21) ──────────────────────────────── */

function buildEmptyNotice(params: {
  status: ReviewDayStatus
  hasPlan: boolean
  hasExecution: boolean
  plannedCount: number
}): ReviewEmptyNotice | null {
  const { status, hasPlan, hasExecution, plannedCount } = params
  if (status === 'future') {
    return {
      title: 'Este día todavía no ha pasado',
      body: 'Aquí se cuenta cómo fue un día ya vivido. De este todavía no hay nada que contar.',
      hint: null,
    }
  }
  if (hasExecution) return null
  if (status === 'open') {
    return hasPlan
      ? {
          title: 'El día sigue abierto',
          body: `Tienes ${plannedCount} ${plannedCount === 1 ? 'bloque' : 'bloques'} planeados y todavía no hay registros. Aquí se cuenta cuando empiece a haberlos.`,
          hint: 'Si quieres, se cuenta desde Hoy — o se mira más tarde.',
        }
      : {
          title: 'El día sigue abierto',
          body: 'Todavía no hay plan ni registros de hoy. Aquí se cuenta cuando los haya.',
          hint: null,
        }
  }
  if (!hasPlan) {
    // Criterio 21: una sola frase, sin reproche. Nunca «no hiciste nada».
    return {
      title: 'De este día no quedó nada apuntado',
      body: 'No llegó a tener plan y tampoco hay registros. Puede que lo vivieras sin abrir la app, y también es un día.',
      hint: null,
    }
  }
  // Criterio 19, marco E: el texto literal del render.
  return {
    title: 'De este día no quedó nada apuntado',
    body: `Tenías ${plannedCount} ${plannedCount === 1 ? 'bloque' : 'bloques'} planeados y no hay registros. Puede que lo vivieras sin abrir la app, y también es un día.`,
    hint: 'Si quieres, se rellena ahora — o se queda así.',
  }
}

/* ── Los dos carriles (criterio 22, A2) ─────────────────────────────────── */

/**
 * `execution.entries` **proyectada en filas**, una por borde de tiempo: no es
 * otro cálculo, es otra forma de leer el mismo recorrido de reloj que pinta la
 * agenda de Hoy.
 *
 * Un **movido** produce **dos** filas —la del plan a su hora con la sombra
 * («→ hecho a las 19:40») y la de la sesión donde ocurrió— y **una sola tarjeta
 * real**, que es lo que pide el criterio 17. Los tramos **sin registrar** ocupan
 * su sitio en el carril real con su tamaño, y lo de **fuera del plan** va sin
 * nada enfrente.
 *
 * La marca de «Ahora» se descarta: la revisión mira hacia atrás.
 */
export function buildReviewLanes(params: {
  execution: DayExecution
  couldNotById: ReadonlyMap<string, string | null>
}): ReviewLaneRow[] {
  const { execution, couldNotById } = params
  const rows: ReviewLaneRow[] = []

  const timeLabelOf = (minutes: number) => formatTimeForDisplay(minutesToTime(minutes))

  for (const entry of execution.entries) {
    if (entry.kind === 'now') continue

    if (entry.kind === 'block') {
      const blockExecution = execution.byBlockId[entry.id] ?? null
      const { icon, color } = categoryOf(entry.item.activity)
      const title = entry.item.activity?.title ?? 'Actividad'
      const isMoved = blockExecution?.status === 'moved'
      const plan: ReviewLanePlan = {
        block: entry,
        title,
        icon,
        color,
        durationLabel: formatDurationMinutes(entry.durationMinutes),
        isShadow: isMoved,
      }
      let real: ReviewLaneReal
      if (isMoved) {
        real = { kind: 'moved-shadow', label: blockExecution!.movedToLabel ?? 'movido' }
      } else if (blockExecution) {
        real = {
          kind: 'matched',
          title,
          icon,
          color,
          rangeLabel: blockExecution.rangeLabel,
          tags: tagsOf(blockExecution, null),
        }
      } else {
        const missing = execution.missingByBlockId[entry.id]
        real = missing
          ? missingCell(
              missing,
              {
                has: couldNotById.has(entry.item.id),
                reason: couldNotById.get(entry.item.id) ?? null,
              },
              execution.isDayClosed,
            )
          : { kind: 'none' }
      }
      rows.push({
        id: entry.id,
        timeLabel: timeLabelOf(entry.startMinutes),
        startMinutes: entry.startMinutes,
        plan,
        real,
      })
      continue
    }

    if (entry.kind === 'session') {
      const session = entry as ExecutionSessionEntry
      const { icon, color } = categoryOf(session.span.session.activity)
      rows.push({
        id: session.id,
        timeLabel: timeLabelOf(session.startMinutes),
        startMinutes: session.startMinutes,
        plan: null,
        real: {
          kind: session.variant === 'moved' ? 'moved' : 'off-plan',
          title: session.span.title,
          icon,
          color,
          rangeLabel: session.rangeLabel,
          tags:
            session.variant === 'moved'
              ? [
                  { kind: 'moved', label: 'movido' },
                  { kind: 'shift', label: session.label },
                ]
              : [{ kind: 'off-plan', label: session.label }],
        },
      })
      continue
    }

    // Un hueco: solo entra si es un tramo **sin registrar** de verdad, que es
    // lo que decidió `buildNoDataSlices` (día cerrado y algo registrado).
    const slice: NoDataSlice | undefined = execution.noDataByGapId[entry.id]
    if (!slice) continue
    rows.push({
      id: slice.id,
      timeLabel: timeLabelOf(slice.startMinutes),
      startMinutes: slice.startMinutes,
      plan: null,
      real: {
        kind: 'no-data',
        rangeLabel: slice.rangeLabel,
        durationLabel: slice.durationLabel,
        minutes: slice.durationMinutes,
      },
    })
  }

  return rows
}
