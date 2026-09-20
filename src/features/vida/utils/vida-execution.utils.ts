/**
 * Lo real encima de lo planeado: el cruce sesión ↔ bloque y el presupuesto.
 *
 * Archivo **hermano** de `vida-agenda.utils.ts`, no una ampliación suya. Aquel
 * describe **el plan** —lo importan `vida-gap-form.utils.ts`, `VidaAgendaGap` y
 * `VidaTemplateAside`, a los que lo ejecutado no les incumbe— y esto es **un
 * segundo pase** sobre su resultado (decisión 3 del plan). `buildDayAgenda` no
 * gana una cuarta variante ni `AgendaBlock` un campo nuevo.
 *
 * Todo lo de aquí es **puro**: entran la agenda, las sesiones del día y el
 * «ahora» en minutos; salen números, cadenas y listas. Ni React, ni `new Date()`
 * escondido, ni una llamada al API.
 *
 * **El cruce (D1, criterios 19, 20 y 23).** **Dos pases.** Primero se casan las
 * parejas que cumplen la condición del criterio 19 —misma actividad y hora de
 * inicio a **menos de `VIDA_MOVED_THRESHOLD_MINUTES`** de la planeada—,
 * empezando por la más cercana; después, con los bloques que queden libres, las
 * sesiones que sobran se emparejan **sin tope de distancia**, y esas son las
 * **movidas** del criterio 23: el bloque se queda de sombra en su hora con
 * «→ hecho a las 19:40» y lo real se pinta donde ocurrió. Ningún bloque recibe
 * dos sesiones; ninguna sesión va a dos bloques. Lo que sobra al final se pinta
 * **fuera del plan** (criterio 22).
 *
 * El orden de los dos pases **no es un detalle**: con un solo pase por hora, una
 * sesión lejana le robaba el bloque a la que sí cayó en su hora y un día seguido
 * se leía como un día no seguido. Está contado entero sobre
 * `matchSessionsToBlocks`, que es donde vive la regla.
 *
 * **Limitación conocida de D1, escrita donde se lee:** el cruce es del cliente y
 * solo mira `activityId` y hora. Dos bloques de la misma actividad el mismo día
 * se reparten las sesiones por cercanía —el caso «Pasear a las mascotas ×2»—, y
 * si solo hay una sesión, el bloque que se queda sin ella no sabe si es que no
 * se hizo o si la sesión era «suya»: el API no guarda a qué bloque pertenece una
 * sesión. Cuando alguien pueda cambiar eso, se cambia ahí, no aquí.
 *
 * **Los anchos suman el 100 % (criterio 26).** No se suman duraciones: se
 * **parte el día en tramos elementales** por los bordes de todo lo que hay
 * (bloques, sesiones, ahora, la ventana) y cada tramo se clasifica una sola vez,
 * con prioridad. Dos sesiones solapadas, o una sesión encima de su bloque, no
 * cuentan dos veces: es el mismo fallo que ya se cazó en FEAT-003 con dos
 * bloques pisados, y por eso **no se rescata** `getUsedMinutesFromFollowUps` de
 * `79bece0:src/features/activities/utils/activity-day-metrics.utils.ts:86`, que
 * suma `durationMinutes` sin mirar solapes.
 *
 * De `activity-day-metrics.utils.ts` se rescata **la idea** de repartir el día
 * en tramos con porcentajes que suman 100, y **se tira el código**:
 * `wasteMinutes` y `wastePercentage` son «desperdicio», prohibido en Vida
 * (criterio 59). El tramo del pasado sin registro se llama **«sin dato»** y en
 * la tajada 4 tendrá salida.
 */

import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type {
  AgendaBlock,
  AgendaEntry,
  AgendaGap,
  DayAgenda,
} from '@/features/vida/utils/vida-agenda.utils'
import {
  MIN_GAP_MINUTES,
  formatDurationFromMinutes,
  formatTimeForDisplay,
  minutesToTime,
  parseTimeToMinutes,
} from '@/features/vida/utils/vida-time.utils'

/* ── Los dos umbrales (criterio 20, D6) ─────────────────────────────────── */

/**
 * Hasta aquí un bloque se lee **✓ calcado**: cinco minutos arriba o abajo, en
 * el inicio y en la duración. Nadie empieza a las 7:00:00.
 */
export const VIDA_ON_PLAN_TOLERANCE_MINUTES = 5

/**
 * A partir de aquí la sesión ya no es «el bloque con retraso», es **otro
 * momento del día**: el bloque se queda de sombra en su hora y lo real se pinta
 * donde ocurrió (criterio 23).
 */
export const VIDA_MOVED_THRESHOLD_MINUTES = 60

/* ── Una sesión, en minutos del día ─────────────────────────────────────── */

export type SessionSpan = {
  id: string
  session: ActivityFollowUp
  activityId: string
  title: string
  startMinutes: number
  /** Minutos reales. Para la abierta, los que lleva hasta «ahora». Mínimo 1. */
  durationMinutes: number
  /** `startMinutes + durationMinutes`. Puede pasar de la medianoche del día. */
  endMinutes: number
  /** Sigue abierta: `durationMinutes` del API es `null`. */
  isRunning: boolean
}

export type ToSessionSpansInput = {
  followUps: ActivityFollowUp[]
  /** `YYYY-MM-DD` del día mostrado: lo de otros días no entra. */
  date: string
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes: number | null
}

/**
 * Las sesiones del día, en minutos desde medianoche y ordenadas por hora.
 *
 * Una sesión **abierta** no tiene duración: lleva la que va del inicio a
 * «ahora». Si el día mostrado no es hoy —una que quedó abierta y nadie cerró—
 * no se inventa un final: se queda en el mínimo de un minuto y se pinta como lo
 * que es, un registro sin cierre. Nunca una duración negativa (criterio 63).
 */
export function toSessionSpans({ followUps, date, nowMinutes }: ToSessionSpansInput): SessionSpan[] {
  return followUps
    .filter((session) => session.date === date)
    .map((session) => {
      const startMinutes = parseTimeToMinutes(session.startTime)
      const isRunning = session.durationMinutes === null || session.durationMinutes === undefined
      const durationMinutes = isRunning
        ? Math.max(1, nowMinutes === null ? 1 : nowMinutes - startMinutes)
        : Math.max(1, session.durationMinutes ?? 1)
      return {
        id: session.id,
        session,
        activityId: session.activityId,
        title: session.activity?.title ?? 'Actividad',
        startMinutes,
        durationMinutes,
        endMinutes: startMinutes + durationMinutes,
        isRunning,
      }
    })
    .sort((a, b) => a.startMinutes - b.startMinutes || a.id.localeCompare(b.id))
}

/* ── El cruce (D1) ──────────────────────────────────────────────────────── */

export type MatchSessionsInput = {
  blocks: AgendaBlock[]
  spans: SessionSpan[]
}

export type MatchSessionsResult = {
  /** El bloque → la sesión que le tocó. Como mucho una por bloque. */
  byBlockId: Record<string, SessionSpan>
  /** Lo que no es de ningún bloque: se pinta fuera del plan (criterio 22). */
  unmatched: SessionSpan[]
}

type CandidatePair = {
  span: SessionSpan
  block: AgendaBlock
  distance: number
}

/**
 * Empareja lo que queda libre **empezando por lo más cercano**, no por la hora
 * de la sesión: si dos sesiones se pelean por un bloque, gana la que cayó más
 * cerca de él. `maxDistance` en `null` es «sin tope».
 */
function assignClosestPairs(params: {
  spans: SessionSpan[]
  blocks: AgendaBlock[]
  takenBlockIds: Set<string>
  assignedSpanIds: Set<string>
  maxDistance: number | null
  byBlockId: Record<string, SessionSpan>
}): void {
  const { spans, blocks, takenBlockIds, assignedSpanIds, maxDistance, byBlockId } = params
  const pairs: CandidatePair[] = []

  for (const span of spans) {
    if (assignedSpanIds.has(span.id)) continue
    for (const block of blocks) {
      if (takenBlockIds.has(block.id)) continue
      if (block.item.activityId !== span.activityId) continue
      const distance = Math.abs(span.startMinutes - block.startMinutes)
      if (maxDistance !== null && distance > maxDistance) continue
      pairs.push({ span, block, distance })
    }
  }

  // Lo más cercano primero. Los desempates son **estables y explicables**: a
  // igual distancia, la sesión más temprana; a igual sesión, el bloque más
  // temprano; y al final el `id`, para que dos datos iguales den siempre el
  // mismo resultado.
  pairs.sort(
    (a, b) =>
      a.distance - b.distance ||
      a.span.startMinutes - b.span.startMinutes ||
      a.block.startMinutes - b.block.startMinutes ||
      a.span.id.localeCompare(b.span.id),
  )

  for (const pair of pairs) {
    if (assignedSpanIds.has(pair.span.id) || takenBlockIds.has(pair.block.id)) continue
    assignedSpanIds.add(pair.span.id)
    takenBlockIds.add(pair.block.id)
    byBlockId[pair.block.id] = pair.span
  }
}

/**
 * Qué sesión es de qué bloque. **Dos pases**, y el orden importa.
 *
 * 1. **Las que casan**: sesión y bloque de la misma actividad cuya hora de
 *    inicio dista **menos de `VIDA_MOVED_THRESHOLD_MINUTES`**. Es literalmente
 *    la condición del criterio 19. Si varias sesiones compiten por el mismo
 *    bloque, **gana la más cercana**.
 * 2. **Las movidas**: con los bloques que queden libres, las sesiones que
 *    sobran se emparejan con el más cercano **sin tope de distancia**. Ese es el
 *    caso del criterio 23 —el bloque se queda de sombra y lo real se pinta donde
 *    ocurrió—, y solo ocurre cuando al bloque **no le queda más remedio**.
 *
 * Lo que sobre al final queda `unmatched` y se pinta fuera del plan
 * (criterio 22). Ningún bloque recibe dos sesiones y ninguna sesión va a dos.
 *
 * **Por qué dos pases y no uno.** El pase único —cada sesión, por hora, al
 * bloque libre más cercano— le dejaba **robar el bloque** a la que sí cayó en su
 * hora: con un bloque «Pasear» a las 19:00 y sesiones a las 7:30 y a las 19:05,
 * la de las 7:30 llegaba antes, se quedaba el bloque como «movido» y la de las
 * 19:05 acababa «fuera del plan» — un día seguido leído como un día no seguido,
 * y `seguido` en cero en el presupuesto. Es el motivo por el que el revisor
 * devolvió esta tajada, y el caso está en el test con nombre propio.
 *
 * El otro caso que manda aquí sigue cubierto: **dos bloques de la misma
 * actividad el mismo día** («Pasear» a las 7:30 y a las 19:00). Con una sola
 * sesión va al suyo y el otro se queda sin ella; con dos, cada una a la suya.
 * Nunca los dos en marcha, que era el hallazgo 2 de la tajada 1.
 */
export function matchSessionsToBlocks({ blocks, spans }: MatchSessionsInput): MatchSessionsResult {
  const byBlockId: Record<string, SessionSpan> = {}
  const takenBlockIds = new Set<string>()
  const assignedSpanIds = new Set<string>()

  const pass = (maxDistance: number | null) =>
    assignClosestPairs({ spans, blocks, takenBlockIds, assignedSpanIds, maxDistance, byBlockId })

  pass(VIDA_MOVED_THRESHOLD_MINUTES)
  pass(null)

  return {
    byBlockId,
    unmatched: spans.filter((span) => !assignedSpanIds.has(span.id)),
  }
}

/* ── Lo que enseña un bloque encima de su hora ──────────────────────────── */

export type BlockExecutionStatus = 'running' | 'on-plan' | 'changed' | 'moved'

export type BlockExecution = {
  status: BlockExecutionStatus
  span: SessionSpan
  /** Está en marcha **este** bloque, no solo esta actividad. */
  isRunning: boolean
  plannedMinutes: number
  realMinutes: number
  /** Real − plan, en el inicio. Positivo: empezó más tarde. */
  startDeltaMinutes: number
  /** Real − plan, en la duración. Positivo: duró más. */
  durationDeltaMinutes: number
  /** «✓ calcado» cuando el inicio y la duración caben en la tolerancia. */
  isOnPlan: boolean
  /** «empezó +5» / «empezó −3». `null` dentro de la tolerancia. */
  startLabel: string | null
  /** «+11 min» / «−8 min». `null` dentro de la tolerancia. */
  durationLabel: string | null
  /** «7:31 – 8:12»: las horas reales (criterio 20). */
  rangeLabel: string
  /** «plan 30 · real 41» (criterio 21). `null` si no hay nada que comparar. */
  comparisonLabel: string | null
  /** Solo en el movido: «→ hecho a las 19:40» (criterio 23). */
  movedToLabel: string | null
}

function signed(minutes: number): string {
  return minutes > 0 ? `+${minutes}` : `−${Math.abs(minutes)}`
}

/** «7:31 – 8:12». Una sesión que se pasa de la medianoche se recorta al 23:59. */
export function formatSpanRange(span: SessionSpan): string {
  return `${formatTimeForDisplay(minutesToTime(span.startMinutes))} – ${formatTimeForDisplay(minutesToTime(span.endMinutes))}`
}

/**
 * Lo que este bloque cuenta de sí mismo (criterios 20, 21 y 23).
 *
 * Una sesión **en marcha** no se compara todavía: mientras dura, el bloque dice
 * lo que dijo la tajada 1 —«planeado 45 min · en marcha»— y el aviso de haberse
 * pasado va aparte, sin interrumpir (criterio 9). Decir «−30 min» de algo que
 * aún se está haciendo sería afirmar lo que no se sabe.
 */
export function describeBlockExecution(block: AgendaBlock, span: SessionSpan): BlockExecution {
  const plannedMinutes = block.durationMinutes
  const realMinutes = span.durationMinutes
  const startDeltaMinutes = span.startMinutes - block.startMinutes
  const durationDeltaMinutes = realMinutes - plannedMinutes
  const isMoved = Math.abs(startDeltaMinutes) > VIDA_MOVED_THRESHOLD_MINUTES
  const startsOnPlan = Math.abs(startDeltaMinutes) <= VIDA_ON_PLAN_TOLERANCE_MINUTES
  const lastsOnPlan = Math.abs(durationDeltaMinutes) <= VIDA_ON_PLAN_TOLERANCE_MINUTES
  const isOnPlan = !span.isRunning && !isMoved && startsOnPlan && lastsOnPlan

  const status: BlockExecutionStatus = span.isRunning
    ? 'running'
    : isMoved
      ? 'moved'
      : isOnPlan
        ? 'on-plan'
        : 'changed'

  return {
    status,
    span,
    isRunning: span.isRunning,
    plannedMinutes,
    realMinutes,
    startDeltaMinutes,
    durationDeltaMinutes,
    isOnPlan,
    startLabel:
      span.isRunning || isMoved || startsOnPlan ? null : `empezó ${signed(startDeltaMinutes)}`,
    durationLabel:
      span.isRunning || isMoved || lastsOnPlan ? null : `${signed(durationDeltaMinutes)} min`,
    rangeLabel: formatSpanRange(span),
    comparisonLabel:
      span.isRunning || isMoved || (startsOnPlan && lastsOnPlan)
        ? null
        : `plan ${plannedMinutes} · real ${realMinutes}`,
    movedToLabel: isMoved
      ? `→ hecho a las ${formatTimeForDisplay(minutesToTime(span.startMinutes))}`
      : null,
  }
}

/* ── Las sesiones que se pintan sueltas ─────────────────────────────────── */

export type ExecutionSessionEntry = {
  kind: 'session'
  id: string
  span: SessionSpan
  /** Fuera del plan (criterio 22) o lo real de un bloque movido (criterio 23). */
  variant: 'off-plan' | 'moved'
  /** «fuera del plan» · «40 min tarde» · «40 min antes». */
  label: string
  /** «8:15 – 8:40». */
  rangeLabel: string
  /** «25 min». */
  durationLabel: string
  /** El bloque del que salió, cuando es un movido. */
  fromBlockId: string | null
  startMinutes: number
  endMinutes: number
  durationMinutes: number
  trackMinutes: number
}

function sessionEntry(
  span: SessionSpan,
  variant: 'off-plan' | 'moved',
  shiftMinutes: number | null,
  fromBlockId: string | null,
): ExecutionSessionEntry {
  const label =
    variant === 'off-plan'
      ? 'fuera del plan'
      : shiftMinutes !== null && shiftMinutes < 0
        ? `${Math.abs(shiftMinutes)} min antes`
        : `${Math.abs(shiftMinutes ?? 0)} min tarde`
  return {
    kind: 'session',
    id: `session-${span.id}`,
    span,
    variant,
    label,
    rangeLabel: formatSpanRange(span),
    durationLabel: formatDurationFromMinutes(span.durationMinutes),
    fromBlockId,
    startMinutes: span.startMinutes,
    endMinutes: span.endMinutes,
    durationMinutes: span.durationMinutes,
    trackMinutes: span.durationMinutes,
  }
}

/* ── El presupuesto, en sus dos formas (D5, criterio 24) ────────────────── */

export type ExecutedSegmentKind =
  // Día en marcha
  | 'done'
  | 'running'
  | 'planned'
  | 'free'
  // Día cerrado
  | 'followed'
  | 'over'
  | 'off-plan'
  | 'no-data'

export type ExecutedSegment = {
  id: string
  kind: ExecutedSegmentKind
  startMinutes: number
  endMinutes: number
  /** Lo que aporta **a la barra**: los tramos no se pisan, suman el día. */
  trackMinutes: number
}

export type ExecutedLegendItem = {
  kind: ExecutedSegmentKind
  label: string
  minutes: number
}

/**
 * `planned` es la forma que dejó FEAT-003 (planeado · libre): la que se ve
 * cuando **no hay nada registrado**, que es lo que pide el criterio 29.
 */
export type ExecutedBudgetForm = 'planned' | 'running' | 'closed'

export type ExecutedBudget = {
  form: ExecutedBudgetForm
  segments: ExecutedSegment[]
  /** Sin tramos de cero: la leyenda no inventa nada (criterio 29). */
  legend: ExecutedLegendItem[]
  /** Los minutos del día entero: el 100 % de la barra. */
  dayMinutes: number
  /** La línea que explica el cambio de forma (criterio 25). */
  note: string | null
}

const SEGMENT_LABELS: Record<ExecutedSegmentKind, string> = {
  done: 'hecho',
  running: 'en marcha',
  planned: 'planeado',
  free: 'libre',
  followed: 'seguido',
  over: 'de más',
  'off-plan': 'fuera del plan',
  'no-data': 'sin dato',
}

/** El orden en que se leen las dos leyendas. */
const LEGEND_ORDER: Record<ExecutedBudgetForm, ExecutedSegmentKind[]> = {
  planned: ['planned', 'free'],
  running: ['done', 'running', 'planned', 'free'],
  closed: ['followed', 'over', 'off-plan', 'no-data'],
}

/**
 * El día ya terminó: pasada la hora de fin de los ajustes de Vida, o cualquier
 * día pasado (criterio 24).
 */
export function isDayClosed(params: {
  nowMinutes: number | null
  dayEnd: string
  isPastDay: boolean
}): boolean {
  if (params.isPastDay) return true
  if (params.nowMinutes === null) return false
  return params.nowMinutes >= parseTimeToMinutes(params.dayEnd)
}

type Interval = { start: number; end: number }

function overlap(a: Interval, b: Interval): number {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start))
}

function covers(intervals: Interval[], point: Interval): boolean {
  return intervals.some((interval) => overlap(interval, point) > 0)
}

export type GetExecutedBudgetInput = {
  agenda: DayAgenda
  spans: SessionSpan[]
  byBlockId: Record<string, SessionSpan>
  isDayClosed: boolean
}

/**
 * Los minutos de cada tramo y los anchos de la barra, en la forma que toque.
 *
 * **Cómo se garantiza el 100 % (criterio 26):** el día se parte por los bordes
 * de todo lo que hay dentro —la ventana, los bloques, las sesiones— y cada
 * trocito resultante se clasifica **una sola vez**. Con dos sesiones solapadas,
 * o con una sesión encima de su bloque, el minuto compartido se cuenta una vez;
 * sumar duraciones habría pasado del 100 %.
 *
 * Las **dos formas no se mezclan** (D5):
 *
 * - Día **en marcha**: hecho · en marcha · planeado · libre.
 * - Día **cerrado**: seguido · de más · fuera del plan · sin dato.
 * - Día **sin nada registrado**: la forma de FEAT-003 (planeado · libre), esté
 *   cerrado o no. Es el criterio 29: un día con plan y sin registro se ve como
 *   lo dejó F2, y la leyenda no inventa tramos de cero.
 *
 * En la forma cerrada, **«sin dato» es el resto**: todo minuto del día que
 * ninguna sesión cubre. Incluye el rato libre que nadie registró y también el
 * bloque planeado que no se hizo — la tajada 4 es la que sabe llamar a eso «no
 * hecho», y lo hará en la agenda, que es donde se lee con su nombre. La leyenda
 * de este criterio tiene cuatro tramos y ese es el que queda.
 */
export function getExecutedBudget({
  agenda,
  spans,
  byBlockId,
  isDayClosed: dayClosed,
}: GetExecutedBudgetInput): ExecutedBudget {
  const windowStart = agenda.windowStart
  const windowEnd = Math.max(agenda.windowEnd, windowStart)
  const dayMinutes = Math.max(0, windowEnd - windowStart)

  const form: ExecutedBudgetForm = spans.length === 0 ? 'planned' : dayClosed ? 'closed' : 'running'

  const clamp = (value: number) => Math.min(windowEnd, Math.max(windowStart, value))
  const plannedIntervals: Interval[] = agenda.blocks.map((block) => ({
    start: clamp(block.startMinutes),
    end: clamp(block.endMinutes),
  }))
  const runningIntervals: Interval[] = spans
    .filter((span) => span.isRunning)
    .map((span) => ({ start: clamp(span.startMinutes), end: clamp(span.endMinutes) }))
  const doneIntervals: Interval[] = spans
    .filter((span) => !span.isRunning)
    .map((span) => ({ start: clamp(span.startMinutes), end: clamp(span.endMinutes) }))
  // Lo que cae **dentro** del bloque que le tocó es «seguido»; lo que se sale
  // —empezó antes, se pasó de largo— es «de más». Un movido no tiene nada
  // dentro de su bloque, así que entero cuenta como «de más»… salvo que no es
  // suyo: un movido se cuenta **fuera del plan**, que es donde se pinta
  // (criterio 23: una sola cosa contada una vez).
  const followedIntervals: Interval[] = []
  const overIntervals: Interval[] = []
  // Las que se cuentan **fuera del plan**: las que no son de ningún bloque y
  // las movidas, que se pintan donde ocurrieron (criterio 23).
  const offPlanSpanIds = new Set(spans.map((span) => span.id))
  for (const block of agenda.blocks) {
    const span = byBlockId[block.id]
    if (!span) continue
    const isMoved = Math.abs(span.startMinutes - block.startMinutes) > VIDA_MOVED_THRESHOLD_MINUTES
    if (isMoved) continue
    offPlanSpanIds.delete(span.id)
    const sessionInterval = { start: clamp(span.startMinutes), end: clamp(span.endMinutes) }
    const blockInterval = { start: clamp(block.startMinutes), end: clamp(block.endMinutes) }
    const inside = {
      start: Math.max(sessionInterval.start, blockInterval.start),
      end: Math.min(sessionInterval.end, blockInterval.end),
    }
    if (inside.end > inside.start) followedIntervals.push(inside)
    if (sessionInterval.start < inside.start) {
      overIntervals.push({ start: sessionInterval.start, end: Math.min(inside.start, sessionInterval.end) })
    }
    if (sessionInterval.end > inside.end) {
      overIntervals.push({ start: Math.max(inside.end, sessionInterval.start), end: sessionInterval.end })
    }
    // Sin nada en común con su bloque —empezó dentro del umbral de movido pero
    // no se pisan— las dos ramas de arriba ya se han quedado con la sesión
    // entera: no hace falta un tercer caso.
  }
  const offPlanIntervals: Interval[] = spans
    .filter((span) => offPlanSpanIds.has(span.id))
    .map((span) => ({ start: clamp(span.startMinutes), end: clamp(span.endMinutes) }))

  const edges = new Set<number>([windowStart, windowEnd])
  const push = (value: number) => {
    const clamped = clamp(value)
    if (clamped > windowStart && clamped < windowEnd) edges.add(clamped)
  }
  for (const block of agenda.blocks) {
    push(block.startMinutes)
    push(block.endMinutes)
  }
  for (const span of spans) {
    push(span.startMinutes)
    push(span.endMinutes)
  }
  const points = [...edges].sort((a, b) => a - b)

  const raw: ExecutedSegment[] = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]!
    const end = points[index + 1]!
    if (end <= start) continue
    const piece: Interval = { start, end }
    let kind: ExecutedSegmentKind
    if (form === 'planned') {
      kind = covers(plannedIntervals, piece) ? 'planned' : 'free'
    } else if (form === 'running') {
      kind = covers(runningIntervals, piece)
        ? 'running'
        : covers(doneIntervals, piece)
          ? 'done'
          : covers(plannedIntervals, piece)
            ? 'planned'
            : 'free'
    } else {
      kind = covers(followedIntervals, piece)
        ? 'followed'
        : covers(overIntervals, piece)
          ? 'over'
          : covers(offPlanIntervals, piece)
            ? 'off-plan'
            : 'no-data'
    }
    const previous = raw[raw.length - 1]
    if (previous && previous.kind === kind && previous.endMinutes === start) {
      previous.endMinutes = end
      previous.trackMinutes += end - start
      continue
    }
    raw.push({
      id: `${kind}-${minutesToTime(start)}`,
      kind,
      startMinutes: start,
      endMinutes: end,
      trackMinutes: end - start,
    })
  }

  const minutesByKind = new Map<ExecutedSegmentKind, number>()
  for (const segment of raw) {
    minutesByKind.set(segment.kind, (minutesByKind.get(segment.kind) ?? 0) + segment.trackMinutes)
  }

  const legend: ExecutedLegendItem[] = LEGEND_ORDER[form]
    .map((kind) => ({ kind, label: SEGMENT_LABELS[kind], minutes: minutesByKind.get(kind) ?? 0 }))
    .filter((item) => item.minutes > 0)

  return {
    form,
    segments: raw,
    legend,
    dayMinutes,
    note:
      form === 'closed'
        ? 'Tu día ya terminó: esto es lo que pasó.'
        : form === 'running' && spans.length > 0
          ? 'Tu día está en marcha: esto llevas y esto queda.'
          : null,
  }
}

/* ── La agenda con lo real dentro ───────────────────────────────────────── */

export type ExecutionEntry = AgendaEntry | ExecutionSessionEntry

export type DayExecution = {
  /** Lo que enseña cada bloque planeado encima de su hora. */
  byBlockId: Record<string, BlockExecution>
  /** Las sesiones que se pintan sueltas: fuera del plan y las movidas. */
  sessions: ExecutionSessionEntry[]
  /** La agenda del plan **con las sesiones sueltas dentro**, en orden de reloj. */
  entries: ExecutionEntry[]
  budget: ExecutedBudget
  isDayClosed: boolean
  /** Hay algo registrado este día: sin esto, la pantalla se ve como en F2. */
  hasExecution: boolean
}

export type BuildDayExecutionInput = {
  agenda: DayAgenda
  followUps: ActivityFollowUp[]
  /** `YYYY-MM-DD` del día mostrado. */
  date: string
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes: number | null
  dayEnd: string
  isPastDay: boolean
}

/** Un trozo de hueco, con la misma forma que los que hace `buildDayAgenda`. */
function sliceGap(gap: AgendaGap, start: number, end: number, nowMinutes: number | null): AgendaGap {
  return {
    ...gap,
    id: `gap-${minutesToTime(start)}-${minutesToTime(end)}`,
    startMinutes: start,
    endMinutes: end,
    durationMinutes: end - start,
    trackMinutes: end - start,
    isSliver: end - start < MIN_GAP_MINUTES,
    isPast: nowMinutes !== null && end <= nowMinutes,
  }
}

/**
 * El día vivido encima del día planeado.
 *
 * Los bloques **no se mueven de su hora** (criterios 18 y 55): siguen donde los
 * puso el plan y enseñan encima lo que pasó. Lo que no es de ningún bloque se
 * cuela en orden de reloj, y si cae dentro de un hueco, **el hueco se parte**
 * para que los minutos que se leen en la agenda sigan siendo los de la barra
 * (criterio 26).
 *
 * En un día **futuro** no llega ninguna sesión —`useActivityDayFollowUpsQuery`
 * está apagada ahí— y en uno **sin nada registrado** todo esto sale vacío: las
 * entradas son exactamente las de `buildDayAgenda` y el presupuesto, el de
 * FEAT-003 (criterios 27 y 29).
 */
export function buildDayExecution({
  agenda,
  followUps,
  date,
  nowMinutes,
  dayEnd,
  isPastDay,
}: BuildDayExecutionInput): DayExecution {
  const spans = toSessionSpans({ followUps, date, nowMinutes })
  const { byBlockId: spanByBlockId, unmatched } = matchSessionsToBlocks({
    blocks: agenda.blocks,
    spans,
  })

  const byBlockId: Record<string, BlockExecution> = {}
  const sessions: ExecutionSessionEntry[] = []
  for (const block of agenda.blocks) {
    const span = spanByBlockId[block.id]
    if (!span) continue
    const execution = describeBlockExecution(block, span)
    byBlockId[block.id] = execution
    if (execution.status === 'moved') {
      // El movido se cuenta **una vez**: el bloque se queda de sombra en su
      // hora y lo real se pinta donde ocurrió (criterio 23).
      sessions.push(sessionEntry(span, 'moved', execution.startDeltaMinutes, block.id))
    }
  }
  for (const span of unmatched) {
    sessions.push(sessionEntry(span, 'off-plan', null, null))
  }
  sessions.sort((a, b) => a.startMinutes - b.startMinutes || a.id.localeCompare(b.id))

  const entries: ExecutionEntry[] = []
  const pending = [...sessions]
  for (const entry of agenda.entries) {
    if (entry.kind !== 'gap') {
      while (pending.length > 0 && pending[0]!.startMinutes < entry.startMinutes) {
        entries.push(pending.shift()!)
      }
      entries.push(entry)
      continue
    }
    // Un hueco puede contener varias sesiones: se parte en trozos y cada
    // sesión va en su sitio. Lo que sobresale del hueco no recorta nada: la
    // barra ya lo cuenta una sola vez.
    let cursor = entry.startMinutes
    while (pending.length > 0 && pending[0]!.startMinutes < entry.endMinutes) {
      const session = pending.shift()!
      const start = Math.max(cursor, Math.min(session.startMinutes, entry.endMinutes))
      if (start > cursor) entries.push(sliceGap(entry, cursor, start, nowMinutes))
      entries.push(session)
      cursor = Math.max(cursor, Math.min(session.endMinutes, entry.endMinutes))
    }
    if (cursor < entry.endMinutes) {
      entries.push(cursor === entry.startMinutes ? entry : sliceGap(entry, cursor, entry.endMinutes, nowMinutes))
    }
  }
  entries.push(...pending)

  const dayClosed = isDayClosed({ nowMinutes, dayEnd, isPastDay })

  return {
    byBlockId,
    sessions,
    entries,
    budget: getExecutedBudget({ agenda, spans, byBlockId: spanByBlockId, isDayClosed: dayClosed }),
    isDayClosed: dayClosed,
    hasExecution: spans.length > 0,
  }
}
