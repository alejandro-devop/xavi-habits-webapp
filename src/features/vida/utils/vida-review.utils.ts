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
import {
  UNCATEGORIZED_GROUP_ICON,
  UNCATEGORIZED_GROUP_NAME,
} from '@/features/vida/utils/vida-catalog.utils'
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

  // La **otra mitad del criterio 8** (tajada 2): la frase de la mañana o de la
  // tarde puede nombrar una categoría, y **solo esa frase**.
  const halfClause = describeHalfDayCategory(execution)
  if (halfClause) parts.push(halfClause)

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

  // Dos matices como mucho: el tercero convertiría la primera frase en una
  // lista, y la historia se lee en diez segundos (criterio 6).
  return parts.length > 0 ? parts.slice(0, 2).join('; ') : null
}

/**
 * **La mitad del criterio 8 que necesitaba el reparto por categoría**: «la
 * tarde, casi toda en Casa».
 *
 * La regla es la del criterio, literal: se mira **una** mitad del día —la que
 * tenga más minutos registrados— y solo se afirma si **una sola categoría se
 * lleva al menos la mitad** de lo registrado en ella. Si no llega, **no se
 * afirma**: la historia sigue hablando de bloques, que es lo seguro.
 *
 * Los minutos se **recortan** a su mitad del día: una sesión de 13:30 a 15:00
 * aporta 30 min a la mañana y 60 a la tarde, no 90 a ninguna. Y «Sin
 * categoría» **nunca se nombra** —«la tarde se te fue en Sin categoría» no es
 * una frase— aunque sí suma al total contra el que se compara.
 */
export function describeHalfDayCategory(execution: DayExecution): string | null {
  const halves = [
    { key: 'la mañana', from: 0, to: REVIEW_AFTERNOON_MINUTES },
    { key: 'la tarde', from: REVIEW_AFTERNOON_MINUTES, to: 24 * 60 },
  ] as const

  const measured = halves.map((half) => {
    let total = 0
    const byCategory = new Map<string, { name: string; minutes: number }>()
    for (const span of spansOf(execution)) {
      const minutes =
        Math.min(span.endMinutes, half.to) - Math.max(span.startMinutes, half.from)
      if (minutes <= 0) continue
      total += minutes
      const ref = categoryKeyOf(span.session.activity)
      if (ref.key === UNCATEGORIZED_ROW_KEY) continue
      const current = byCategory.get(ref.key)
      if (current) current.minutes += minutes
      else byCategory.set(ref.key, { name: ref.name, minutes })
    }
    const top = [...byCategory.values()].sort((a, b) => b.minutes - a.minutes)[0] ?? null
    return { label: half.key, total, top }
  })

  // **Una** mitad, la que tenga más minutos registrados. Si en esa no hay
  // mayoría, no se cuela la otra: la frase describiría un rato menor y sonaría
  // a la mitad grande del día.
  const half = measured.sort((a, b) => b.total - a.total)[0]
  if (!half || half.total <= 0 || !half.top || half.top.minutes * 2 < half.total) return null
  return `${half.label}, casi toda en ${half.top.name}`
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

/* ── En qué se repartió el día (criterios 26–32, tajada 2) ─────────────── */

/**
 * La clave de la fila «Sin categoría» (criterio 27). No es un `id` del API: el
 * API no tiene una categoría llamada así, y por eso no se puede confundir con
 * una de verdad.
 */
export const UNCATEGORIZED_ROW_KEY = 'sin-categoria'

/** Una fila del bloque «Minutos por categoría». */
export type CategoryRow = {
  /** `category.id`, o `UNCATEGORIZED_ROW_KEY`. */
  key: string
  name: string
  /** El color del catálogo. `null` en «Sin categoría» y en la que no lo tenga. */
  color: string | null
  icon: string
  plannedMinutes: number
  /** «45 min». */
  plannedLabel: string
  registeredMinutes: number
  /** «2h 53». */
  registeredLabel: string
  /** Ancho de la barra rayada, de 0 a 1. */
  plannedShare: number
  /** Ancho de la barra sólida, de 0 a 1. */
  registeredShare: number
  /** La nota del criterio 30, o `null` si ninguna regla dispara. */
  note: string | null
}

/** «Sin registrar» **no es una categoría**: es una fila aparte (criterio 28). */
export type CategoryNoDataRow = {
  minutes: number
  /** «10h 53». */
  label: string
  /** Frente al día entero, de 0 a 1. */
  share: number
  /** «16h 30». */
  dayLabel: string
  /** La frase literal del criterio 28. */
  note: string
}

export type CategoryBreakdown = {
  rows: CategoryRow[]
  noData: CategoryNoDataRow
}

type CategoryTally = {
  key: string
  name: string
  color: string | null
  icon: string
  plannedMinutes: number
  registeredMinutes: number
  /** Bloques de esa categoría que se quedaron sin sesión, para la nota. */
  missing: { title: string; plannedMinutes: number; couldNot: boolean }[]
  offPlanCount: number
}

function categoryKeyOf(
  activity: { category?: { id: string; name: string; color: string | null; icon: string | null } | null } | null | undefined,
): { key: string; name: string; color: string | null; icon: string } {
  const category = activity?.category ?? null
  if (!category) {
    return {
      key: UNCATEGORIZED_ROW_KEY,
      name: UNCATEGORIZED_GROUP_NAME,
      color: null,
      icon: UNCATEGORIZED_GROUP_ICON,
    }
  }
  return {
    key: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon ?? UNCATEGORIZED_GROUP_ICON,
  }
}

/**
 * La nota bajo una categoría (criterio 30): **sale de una regla y solo con dato
 * que la sostenga**. Si ninguna dispara, devuelve `null` y la pantalla no pinta
 * nada — nunca se rellena con una frase de relleno.
 *
 * Las dos reglas, en este orden:
 *
 * 1. **Un bloque de esa categoría marcado «no se pudo»** (el de más minutos
 *    planeados): «El desayuno no se pudo: 30 min planeados que no llegaron a
 *    registro.», que es la nota del marco B tal cual.
 * 2. **Cosas de fuera del plan que cayeron aquí**: «Las 2 cosas fuera del plan
 *    cayeron aquí.».
 *
 * Ninguna juzga: describen de dónde salen los minutos. No hay una tercera
 * regla, y añadir una es una decisión de producto, no un detalle.
 */
export function describeCategoryNote(tally: {
  missing: { title: string; plannedMinutes: number; couldNot: boolean }[]
  offPlanCount: number
}): string | null {
  const couldNot = tally.missing
    .filter((item) => item.couldNot)
    .sort((a, b) => b.plannedMinutes - a.plannedMinutes)[0]
  if (couldNot) {
    return `${couldNot.title} no se pudo: ${formatDurationMinutes(couldNot.plannedMinutes)} planeados que no llegaron a registro.`
  }
  if (tally.offPlanCount > 0) {
    return tally.offPlanCount === 1
      ? 'Una cosa fuera del plan cayó aquí.'
      : `Las ${tally.offPlanCount} cosas fuera del plan cayeron aquí.`
  }
  return null
}

/**
 * **En qué se repartió el día** (criterios 26, 27, 28 y 29).
 *
 * De dónde sale cada número, que es lo único delicado de esta función:
 *
 * - **Planeado**: `agenda.blocks[].durationMinutes`, por la categoría de la
 *   actividad del bloque.
 * - **Registrado**: los **minutos reales de cada `SessionSpan`**, incluidas las
 *   sesiones de **fuera del plan**, por `span.session.activity.category`.
 *
 * > **La suma de «registrado» no cuadra con `budget` a propósito, y no se
 * > fuerza.** Son magnitudes distintas: el presupuesto **reparte el día** en
 * > tramos sin solapes (cada minuto del reloj cuenta una vez), y estas filas
 * > **suman minutos de sesión** (dos cosas a la vez suman dos veces). Cuadrarlas
 * > obligaría a repartir un solape entre dos categorías, que es exactamente el
 * > tipo de invención que esta pantalla no hace. Si alguien lo «arregla», rompe
 * > el criterio 26.
 *
 * «Sin registrar» **no entra en el reparto**: es su propia fila, medida contra
 * el día entero (criterio 28). Y **no hay ningún porcentaje único** de
 * cumplimiento por categoría (criterio 29): dos barras, cada una con su
 * magnitud.
 */
export function buildCategoryBreakdown(params: {
  agenda: DayAgenda
  execution: DayExecution
  /** Los minutos sin registrar ya calculados por `buildDayReview` (A9). */
  noDataMinutes: number
  /** `item.id` → razón del «No se pudo». Del aparato, como en `buildDayReview`. */
  couldNotById?: ReadonlyMap<string, string | null>
}): CategoryBreakdown {
  const { agenda, execution, noDataMinutes } = params
  const couldNotById = params.couldNotById ?? new Map<string, string | null>()
  const tallies = new Map<string, CategoryTally>()

  const tallyOf = (activity: Parameters<typeof categoryKeyOf>[0]): CategoryTally => {
    const ref = categoryKeyOf(activity)
    const existing = tallies.get(ref.key)
    if (existing) {
      // La primera que traiga color e icono manda: el catálogo es el mismo.
      if (existing.color === null && ref.color !== null) existing.color = ref.color
      return existing
    }
    const created: CategoryTally = {
      ...ref,
      plannedMinutes: 0,
      registeredMinutes: 0,
      missing: [],
      offPlanCount: 0,
    }
    tallies.set(ref.key, created)
    return created
  }

  for (const block of agenda.blocks) {
    const tally = tallyOf(block.item.activity)
    tally.plannedMinutes += block.durationMinutes
    if (execution.missingByBlockId[block.id] !== undefined) {
      tally.missing.push({
        title: block.item.activity?.title ?? 'Actividad',
        plannedMinutes: block.durationMinutes,
        couldNot: couldNotById.has(block.item.id),
      })
    }
  }

  for (const span of spansOf(execution)) {
    tallyOf(span.session.activity).registeredMinutes += span.durationMinutes
  }
  for (const entry of execution.sessions) {
    if (entry.variant !== 'off-plan') continue
    tallyOf(entry.span.session.activity).offPlanCount += 1
  }

  const rows = [...tallies.values()]
    .filter((tally) => tally.plannedMinutes > 0 || tally.registeredMinutes > 0)
    // Lo más grande arriba, y «Sin categoría» siempre al final: es un cajón, no
    // una categoría (el mismo orden que el catálogo de FEAT-002).
    .sort((a, b) => {
      if (a.key === UNCATEGORIZED_ROW_KEY) return 1
      if (b.key === UNCATEGORIZED_ROW_KEY) return -1
      return (
        Math.max(b.plannedMinutes, b.registeredMinutes) -
          Math.max(a.plannedMinutes, a.registeredMinutes) || a.name.localeCompare(b.name, 'es')
      )
    })

  // La misma escala para todas las barras, o dos categorías no se podrían
  // comparar de un vistazo. Se redondea al cuarto de hora de arriba para que el
  // extremo no quede siempre pegado al borde, como en el render.
  const largest = rows.reduce(
    (max, row) => Math.max(max, row.plannedMinutes, row.registeredMinutes),
    0,
  )
  const scale = Math.max(30, Math.ceil(largest / 30) * 30)
  const share = (minutes: number) => Math.min(1, Math.max(0, minutes / scale))

  const dayMinutes = execution.budget.dayMinutes
  const fromLabel = formatTimeForDisplay(minutesToTime(agenda.windowStart))
  const toLabel = formatTimeForDisplay(minutesToTime(agenda.windowEnd))

  return {
    rows: rows.map((tally) => ({
      key: tally.key,
      name: tally.name,
      color: tally.color,
      icon: tally.icon,
      plannedMinutes: tally.plannedMinutes,
      plannedLabel: formatDurationFromMinutes(tally.plannedMinutes),
      registeredMinutes: tally.registeredMinutes,
      registeredLabel: formatDurationFromMinutes(tally.registeredMinutes),
      plannedShare: share(tally.plannedMinutes),
      registeredShare: share(tally.registeredMinutes),
      note: describeCategoryNote(tally),
    })),
    noData: {
      minutes: noDataMinutes,
      label: formatDurationFromMinutes(noDataMinutes),
      share: dayMinutes > 0 ? Math.min(1, Math.max(0, noDataMinutes / dayMinutes)) : 0,
      dayLabel: formatDurationFromMinutes(dayMinutes),
      note: `Tiempo del que no hay dato, entre las ${fromLabel} y las ${toLabel}. No se reparte entre categorías ni se adivina: si quieres, se rellena registrando.`,
    },
  }
}

/**
 * **Los tramos más largos sin registrar** (criterios 31 y 32), de mayor a
 * menor.
 *
 * Son los mismos `NoDataSlice` que pinta Hoy —mismo umbral
 * (`VIDA_NO_DATA_MIN_MINUTES`, que es lo que mira `canAsk`), mismo cálculo—:
 * aquí solo se ordenan y se cortan. Si no hay ninguno por encima del umbral, la
 * lista sale **vacía** y la pantalla no pinta la sección: no se escribe «no hay
 * tramos» ni se rellena con tramos menores.
 */
export function topNoDataSlices(execution: DayExecution, limit = 4): NoDataSlice[] {
  return Object.values(execution.noDataByGapId)
    .filter((slice) => slice.canAsk)
    .sort((a, b) => b.durationMinutes - a.durationMinutes || a.startMinutes - b.startMinutes)
    .slice(0, Math.max(0, limit))
}
