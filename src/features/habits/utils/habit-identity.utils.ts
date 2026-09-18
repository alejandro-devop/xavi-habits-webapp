import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import type { Habit } from '@/features/habits/types/habit.types'
import type { HabitDayVisualStatus } from '@/features/habits/utils/habit-progress.utils'
import { addDaysToString } from '@/features/habits/utils/habit-type.utils'

/**
 * La identidad que se gana: detección de hitos, lectura y escritura de la
 * evidencia, y composición del retrato.
 *
 * Todo lo de aquí son funciones puras sobre datos que la API ya devuelve. No
 * hay campo nuevo en el backend: la evidencia viaja dentro de
 * `HabitPurpose.description`, igual que la frase de intención viaja dentro de
 * `Habit.description` desde la fase 6.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Los cuatro hitos
// ─────────────────────────────────────────────────────────────────────────────

export type HabitMilestoneKind = 'racha7' | 'record' | 'mes' | 'regreso'

export const HABIT_MILESTONE_KINDS: HabitMilestoneKind[] = ['racha7', 'record', 'mes', 'regreso']

export const HABIT_MILESTONE_HEADINGS: Record<HabitMilestoneKind, string> = {
  racha7: 'Séptimo día seguido',
  record: 'Tu mejor racha hasta hoy',
  mes: 'Tres meses con esto',
  regreso: 'Volviste, y eso también dice algo',
}

/** Días sin cumplir que convierten una vuelta en un regreso. */
export const RETURN_GAP_DAYS = 7

export interface HabitMilestoneInput {
  habit: Habit
  /** Día en curso, `YYYY-MM-DD`. */
  date: string
  /** ¿Se ha cumplido hoy? Sin esto no hay hito que celebrar. */
  accomplishedToday: boolean
  /**
   * Fechas cumplidas **anteriores** a `date` que el llamante conoce. Para
   * distinguir un regreso hace falta ver al menos los 7 días previos; con una
   * ventana más corta el regreso no se detecta (mejor callar que inventarlo).
   */
  previousAccomplishedDates: string[]
  /** Primer día de la ventana que cubre `previousAccomplishedDates`. */
  previousWindowStart: string
}

function isFirstDayOfMonth(date: string): boolean {
  return date.endsWith('-01')
}

/**
 * El hito del día, o `null`. El orden es deliberado: `racha7` y `record` son
 * los que más dicen, y `regreso` nunca colisiona con ellos porque llega con la
 * racha a 1.
 */
export function detectHabitMilestone(input: HabitMilestoneInput): HabitMilestoneKind | null {
  const { habit, date, accomplishedToday } = input
  if (!accomplishedToday) return null

  if (habit.streak === 7) return 'racha7'
  if (habit.streak === habit.maxStreak && habit.streak > 3) return 'record'

  if (isFirstDayOfMonth(date) && habit.days >= 60) return 'mes'

  if (habit.restartCount > 0 && habit.streak <= 1) {
    const gapStart = addDaysToString(date, -RETURN_GAP_DAYS)
    // Sin ventana suficiente no se afirma nada.
    if (input.previousWindowStart <= gapStart) {
      const hasRecent = input.previousAccomplishedDates.some(
        (day) => day >= gapStart && day < date,
      )
      if (!hasRecent) return 'regreso'
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Las reglas de silencio
//
// Son parte de la funcionalidad, no un detalle: si esto aparece a diario deja
// de ser un hito y se convierte en ruido, que es otra forma de morir.
// ─────────────────────────────────────────────────────────────────────────────

/** Días de silencio para un hábito tras un «ahora no». */
export const SNOOZE_DAYS = 14
/** Días mínimos entre dos hitos, sea cual sea el hábito. */
export const MOMENT_COOLDOWN_DAYS = 7

export interface HabitIdentityCandidate {
  habit: Habit
  milestone: HabitMilestoneKind
}

export interface HabitIdentitySilence {
  /** `habitId` → fecha (excluida) hasta la que ese hábito calla. */
  snoozedUntil: Record<string, string>
  /** Último hito enseñado, sea de quien sea. */
  lastShown: { habitId: string; date: string } | null
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T12:00:00Z`)
  const b = Date.parse(`${to}T12:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY
  return Math.round((b - a) / 86_400_000)
}

/**
 * Como mucho un hito visible, como mucho uno por semana, y ninguno para un
 * hábito silenciado. Si dos hábitos lo disparan el mismo día gana el de racha
 * más larga.
 */
export function selectIdentityMoment(
  candidates: HabitIdentityCandidate[],
  silence: HabitIdentitySilence,
  today: string,
): HabitIdentityCandidate | null {
  const awake = candidates.filter((candidate) => {
    const until = silence.snoozedUntil[candidate.habit.id]
    return !until || today >= until
  })
  if (awake.length === 0) return null

  const { lastShown } = silence
  if (lastShown) {
    // El de hoy sigue siendo el de hoy: se puede volver a pintar tras recargar.
    if (lastShown.date === today) {
      return awake.find((candidate) => candidate.habit.id === lastShown.habitId) ?? null
    }
    if (daysBetween(lastShown.date, today) < MOMENT_COOLDOWN_DAYS) return null
  }

  return awake.reduce((best, candidate) =>
    candidate.habit.streak > best.habit.streak ? candidate : best,
  )
}

/** Fecha a partir de la cual el hábito vuelve a poder preguntar. */
export function getSnoozeUntil(today: string): string {
  return addDaysToString(today, SNOOZE_DAYS)
}

// ─────────────────────────────────────────────────────────────────────────────
// La evidencia dentro de `HabitPurpose.description`
//
// Formato: la **primera línea** es la evidencia, con forma fija; lo que venga
// tras una línea en blanco es texto libre del usuario y no se toca jamás.
//
//   Ganado el 2026-08-12 · racha7 · 7 días seguidos
//
//   (cualquier cosa que el usuario hubiera escrito, intacta)
//
// El análisis es deliberadamente estricto: ante cualquier duda, todo es texto
// libre. Perder lo que escribió alguien es el peor fallo posible de esta fase.
// ─────────────────────────────────────────────────────────────────────────────

export interface HabitIdentityEvidence {
  /** `YYYY-MM-DD`. */
  wonAt: string
  milestone: HabitMilestoneKind
  /** «7 días seguidos». Texto corto, humano. */
  detail: string
}

export interface HabitPurposeNote {
  /** `null` cuando la descripción no es nuestra: entonces todo es texto libre. */
  evidence: HabitIdentityEvidence | null
  /** Tal cual lo escribió el usuario. Nunca se reescribe ni se recorta. */
  freeText: string
}

const EVIDENCE_PREFIX = 'Ganado el '
const EVIDENCE_SEPARATOR = ' · '
const MAX_DETAIL_LENGTH = 120

const ISO_DATE_LENGTH = 10

/** `YYYY-MM-DD` y además una fecha que existe. El 31 de febrero no vale. */
export function isIsoDate(value: string): boolean {
  if (value.length !== ISO_DATE_LENGTH) return false
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return false
  if (year.length !== 4 || month.length !== 2 || day.length !== 2) return false
  if (!/^\d+$/.test(year + month + day)) return false

  const parsed = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.toISOString().slice(0, ISO_DATE_LENGTH) === value
}

function isMilestoneKind(value: string): value is HabitMilestoneKind {
  return (HABIT_MILESTONE_KINDS as string[]).includes(value)
}

export function composeIdentityEvidence(evidence: HabitIdentityEvidence): string {
  return [
    `${EVIDENCE_PREFIX}${evidence.wonAt}`,
    evidence.milestone,
    evidence.detail,
  ].join(EVIDENCE_SEPARATOR)
}

/** El inverso de `readPurposeDescription`: lo que acaba en el payload. */
export function composePurposeDescription(note: HabitPurposeNote): string {
  if (!note.evidence) return note.freeText
  const head = composeIdentityEvidence(note.evidence)
  return note.freeText ? `${head}\n\n${note.freeText}` : head
}

function parseEvidenceLine(line: string): HabitIdentityEvidence | null {
  if (!line.startsWith(EVIDENCE_PREFIX)) return null

  const parts = line.split(EVIDENCE_SEPARATOR)
  // Tres trozos exactos. Un « · » de más hace la línea ambigua: no es nuestra.
  if (parts.length !== 3) return null

  const wonAt = parts[0].slice(EVIDENCE_PREFIX.length)
  const milestone = parts[1]
  const detail = parts[2]

  if (!isIsoDate(wonAt)) return null
  if (!isMilestoneKind(milestone)) return null
  if (!detail || detail.length > MAX_DETAIL_LENGTH) return null

  return { wonAt, milestone, detail }
}

/**
 * Descompone la descripción guardada de un propósito. Si la primera línea no
 * encaja con el patrón, **todo** es texto libre: se devuelve entero, sin tocar,
 * y el rasgo se pinta como ganado sin fecha.
 */
export function readPurposeDescription(
  description: string | null | undefined,
): HabitPurposeNote {
  if (!description) return { evidence: null, freeText: '' }

  const lines = description.split('\n')
  const evidence = parseEvidenceLine(lines[0])
  if (!evidence) return { evidence: null, freeText: description }

  // Tras la evidencia solo puede venir una línea en blanco y luego el texto del
  // usuario. Cualquier otra cosa (incluido un salto suelto al final) es señal de
  // que la descripción no la escribimos nosotros.
  if (lines.length === 1) return { evidence, freeText: '' }
  if (lines[1] !== '') return { evidence: null, freeText: description }

  const note: HabitPurposeNote = { evidence, freeText: lines.slice(2).join('\n') }

  // Red de seguridad, como en la fase 6: si recomponer no reproduce el texto
  // carácter a carácter, no lo tocamos.
  if (composePurposeDescription(note) !== description) {
    return { evidence: null, freeText: description }
  }

  return note
}

// ─────────────────────────────────────────────────────────────────────────────
// Microcopia compuesta
// ─────────────────────────────────────────────────────────────────────────────

/** «Alguien sereno» → «alguien sereno». Para meterlo dentro de una frase. */
export function lowerFirst(value: string): string {
  if (!value) return value
  return value.charAt(0).toLocaleLowerCase('es') + value.slice(1)
}

/** `2026-08-12` → `12 de agosto`. */
export function formatEvidenceDate(date: string): string {
  if (!isIsoDate(date)) return date
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

const MILESTONE_EVIDENCE_DETAIL: Record<HabitMilestoneKind, (habit: Habit) => string> = {
  racha7: () => '7 días seguidos',
  record: (habit) => `récord de ${habit.streak} días`,
  mes: (habit) => `${habit.days} días acumulados`,
  regreso: () => 'la vuelta después de dejarlo',
}

/** La prueba corta que se guarda en la primera línea de `description`. */
export function describeMilestoneEvidence(
  milestone: HabitMilestoneKind,
  habit: Habit,
): string {
  return MILESTONE_EVIDENCE_DETAIL[milestone](habit)
}

const MILESTONE_HOW: Record<HabitMilestoneKind, string> = {
  racha7: 'al séptimo día seguido',
  record: 'al romper tu récord',
  mes: 'a los tres meses',
  regreso: 'al volver después de dejarlo',
}

/** «Lo ganaste el 12 de agosto, al séptimo día seguido.» */
export function formatEvidenceSentence(evidence: HabitIdentityEvidence | null): string {
  if (!evidence) return 'Lo escribiste tú. No hay fecha guardada de cuándo se ganó.'
  return `Lo ganaste el ${formatEvidenceDate(evidence.wonAt)}, ${MILESTONE_HOW[evidence.milestone]}.`
}

/** Titular del hito. La segunda línea es literal y no depende de los datos. */
export function composeMomentHeadline(
  milestone: HabitMilestoneKind,
  habit: Habit,
): string {
  switch (milestone) {
    case 'racha7':
      return `Siete días seguidos con ${habit.name}.`
    case 'record':
      return `${habit.streak} días seguidos con ${habit.name}: nunca habías llegado tan lejos.`
    case 'mes':
      return `${habit.days} días de ${habit.name} desde que empezaste.`
    case 'regreso':
      return `Volviste a ${habit.name} después de dejarlo.`
  }
}

export const MOMENT_HEADLINE_TAIL = 'Eso ya no es intención: es evidencia.'

const MOMENT_LEAD: Record<HabitMilestoneKind, string> = {
  racha7: 'Alguien que hace esto siete días seguidos se está volviendo algo.',
  record: 'Alguien que llega más lejos que nunca se está volviendo algo.',
  mes: 'Alguien que sostiene esto tres meses se está volviendo algo.',
  regreso: 'Alguien que vuelve después de dejarlo se está volviendo algo.',
}

export const MOMENT_QUESTION = '¿Cuál de estas te suena a ti?'

export function composeMomentAsk(milestone: HabitMilestoneKind): string {
  return MOMENT_LEAD[milestone]
}

export const MOMENT_MICRO =
  'Un toque y listo. Puedes cambiarlo o quitarlo cuando quieras — esto no es un contrato.'

export const MOMENT_WRITE_PLACEHOLDER = 'Alguien que…'

export const MOMENT_DONE_BODY =
  'Lo escribiste tú al reconocerlo, no al inventarlo. A partir de mañana lo verás al empezar y al cumplir.'

export type HabitIdentityTone = 'start' | 'done'

/** La línea que aparece al empezar y al lograr. Nunca al fallar. */
export function composeIdentityLine(name: string, tone: HabitIdentityTone): string {
  const lowered = lowerFirst(name)
  return tone === 'done' ? `Un día más siendo ${lowered}.` : `Hoy, ${lowered}.`
}

/**
 * La regla innegociable, en una función: un día fallado o con salvavidas
 * gastado **no** enseña identidad. Ni el nombre, ni el icono, ni la línea.
 */
export function getIdentityVisibility(
  status: HabitDayVisualStatus,
): HabitIdentityTone | 'hidden' {
  if (status === 'failed' || status === 'lifeline') return 'hidden'
  if (status === 'accomplished') return 'done'
  return 'start'
}

/** «Un mal día no borra 34. Te queda 1 salvavidas esta semana.» */
export function composeSetbackLine(days: number, lifelinesRemaining: number): string {
  const lifelines =
    lifelinesRemaining > 0
      ? `Te queda${lifelinesRemaining === 1 ? '' : 'n'} ${lifelinesRemaining} salvavidas esta semana.`
      : 'No te quedan salvavidas esta semana.'

  if (days > 1) return `Un mal día no borra ${days}. ${lifelines}`
  return lifelines
}

// ─────────────────────────────────────────────────────────────────────────────
// El retrato
// ─────────────────────────────────────────────────────────────────────────────

/** Con menos de esto no se afirma quién es nadie. */
export const MIN_TRAITS_FOR_PORTRAIT = 2

export const PORTRAIT_HONEST_LINE =
  'Todavía no hay suficientes registros para decir quién eres. Sigue marcando; la app te lo dirá cuando lo sepa.'

export interface PortraitTrait {
  /** Nombre del propósito ganado: «Alguien sereno». */
  name: string
  habitName: string
  /** Días acumulados del hábito que lo sostiene. */
  days: number
  shouldAvoid: boolean
  /** Días seguidos sin caer, solo para los `shouldAvoid`. */
  streak: number
}

export interface HabitPortrait {
  /** «Alguien sereno, fuerte y que se cuida.» */
  lead: string
  /** «Lo sostienen Meditar (34 días) y 18 días sin Redes por la mañana.» */
  support: string
  /** «Compuesto con 214 registros entre el 20 de junio y el 18 de septiembre» */
  source: string
}

const ALGUIEN_PREFIX = 'Alguien '

/** «Alguien sereno» → «sereno»; lo que no empiece así vuelve entero. */
function traitTail(name: string): string {
  return name.startsWith(ALGUIEN_PREFIX) ? name.slice(ALGUIEN_PREFIX.length) : name
}

function joinWithAnd(parts: string[]): string {
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`
}

export interface PortraitInput {
  traits: PortraitTrait[]
  /** Total de registros que sostienen el retrato. */
  records: number
  /** `YYYY-MM-DD` del primer registro conocido. */
  from: string | null
  /** `YYYY-MM-DD` del último día contado. */
  to: string
}

/**
 * El retrato no lo escribe el usuario: lo escriben sus registros. Con menos de
 * dos rasgos ganados devuelve `null` y quien pinta usa la línea honesta.
 */
export function composePortrait(input: PortraitInput): HabitPortrait | null {
  if (input.traits.length < MIN_TRAITS_FOR_PORTRAIT) return null

  const lead = `Alguien ${joinWithAnd(input.traits.map((trait) => traitTail(trait.name)))}.`

  const supportParts = input.traits.map((trait) =>
    trait.shouldAvoid
      ? `${trait.streak} días sin ${trait.habitName}`
      : `${trait.habitName} (${trait.days} días)`,
  )
  const support = `Lo sostienen ${joinWithAnd(supportParts)}.`

  const range =
    input.from && input.from !== input.to
      ? ` entre el ${formatEvidenceDate(input.from)} y el ${formatEvidenceDate(input.to)}`
      : ''
  const source = `Compuesto con ${input.records} registro${input.records === 1 ? '' : 's'}${range}`

  return { lead, support, source }
}

// ─────────────────────────────────────────────────────────────────────────────
// «En camino»
// ─────────────────────────────────────────────────────────────────────────────

/** Días cumplidos en la ventana que hacen falta para poder reclamar un rasgo. */
export const TRAIT_TARGET_DAYS = 7

export interface TraitProgress {
  done: number
  target: number
  remaining: number
  /** 0–1, para la barra. */
  ratio: number
}

export function getTraitProgress(
  accomplishedInWindow: number,
  target: number = TRAIT_TARGET_DAYS,
): TraitProgress {
  const done = Math.max(0, Math.min(accomplishedInWindow, target))
  const remaining = Math.max(0, target - done)
  return { done, target, remaining, ratio: target > 0 ? done / target : 0 }
}

const SPELLED_OUT = [
  'Cero',
  'Uno',
  'Dos',
  'Tres',
  'Cuatro',
  'Cinco',
  'Seis',
  'Siete',
] as const

/** «Cuatro de los últimos siete días. Faltan 3 para que…» */
export function composeTraitProgressLine(progress: TraitProgress): string {
  const done = SPELLED_OUT[progress.done] ?? String(progress.done)
  const target = SPELLED_OUT[progress.target]?.toLocaleLowerCase('es') ?? String(progress.target)
  const head = `${done} de los últimos ${target} días.`
  if (progress.remaining === 0) return `${head} Ya puedes reclamarlo.`
  return `${head} Faltan ${progress.remaining} para que esto se convierta en un rasgo que puedas reclamar.`
}

// ─────────────────────────────────────────────────────────────────────────────
// Mi Persona: el espejo
//
// La pantalla no decide nada; solo pinta lo que sale de aquí.
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonaWonTrait {
  purpose: HabitPurpose
  habit: Habit
  note: HabitPurposeNote
}

export interface PersonaClaimableTrait {
  habit: Habit
  milestone: HabitMilestoneKind
}

export interface PersonaWaytoTrait {
  habit: Habit
  progress: TraitProgress
}

export interface PersonaView {
  won: PersonaWonTrait[]
  claimable: PersonaClaimableTrait[]
  wayto: PersonaWaytoTrait[]
  portrait: HabitPortrait | null
  /** Propósitos que se escribieron antes y ningún hábito ha llegado a ganar. */
  orphanPurposes: HabitPurpose[]
  avoidHabits: Habit[]
}

/**
 * Un rasgo se puede reclamar cuando hay pruebas: una semana seguida, o la
 * mejor racha del hábito por encima de tres días. Ni antes, ni por pedirlo.
 */
export function isClaimableTrait(habit: Habit): boolean {
  if (habit.purposeId != null) return false
  if (habit.streak >= TRAIT_TARGET_DAYS) return true
  return habit.streak === habit.maxStreak && habit.streak > 3
}

/** Qué prueba se guarda al reclamarlo desde Mi Persona. */
export function getClaimMilestone(habit: Habit): HabitMilestoneKind {
  return habit.streak >= TRAIT_TARGET_DAYS ? 'racha7' : 'record'
}

/** `2026-06-20T09:00:00.000Z` → `2026-06-20`. */
function toYmd(value: string | null | undefined): string | null {
  if (!value) return null
  const candidate = value.slice(0, ISO_DATE_LENGTH)
  return isIsoDate(candidate) ? candidate : null
}

export interface PersonaInput {
  habits: Habit[]
  purposes: HabitPurpose[]
  /** `habitId` → días cumplidos en la ventana corta (la de «en camino»). */
  accomplishedLastWeek: Map<string, number>
  today: string
}

export function buildPersonaView(input: PersonaInput): PersonaView {
  const purposeById = new Map(input.purposes.map((purpose) => [purpose.id, purpose]))
  const claimedPurposeIds = new Set<string>()

  const won: PersonaWonTrait[] = []
  const claimable: PersonaClaimableTrait[] = []
  const wayto: PersonaWaytoTrait[] = []

  for (const habit of input.habits) {
    if (habit.purposeId != null) {
      const purpose = purposeById.get(habit.purposeId)
      if (purpose) {
        claimedPurposeIds.add(purpose.id)
        won.push({ purpose, habit, note: readPurposeDescription(purpose.description) })
      }
      continue
    }

    if (isClaimableTrait(habit)) {
      claimable.push({ habit, milestone: getClaimMilestone(habit) })
      continue
    }

    // Los que se dejan atrás ya tienen su propia sección: aquí solo duplicarían.
    if (habit.shouldAvoid) continue

    wayto.push({
      habit,
      progress: getTraitProgress(input.accomplishedLastWeek.get(habit.id) ?? 0),
    })
  }

  const traits: PortraitTrait[] = won.map(({ purpose, habit }) => ({
    name: purpose.name,
    habitName: habit.name,
    days: habit.days,
    shouldAvoid: habit.shouldAvoid,
    streak: habit.streak,
  }))

  const records = won.reduce((total, { habit }) => total + habit.days, 0)
  const starts = won
    .map(({ habit }) => toYmd(habit.startDate) ?? toYmd(habit.createdAt))
    .filter((value): value is string => value !== null)
    .sort()

  return {
    won,
    claimable,
    wayto,
    portrait: composePortrait({
      traits,
      records,
      from: starts[0] ?? null,
      to: input.today,
    }),
    orphanPurposes: input.purposes.filter((purpose) => !claimedPurposeIds.has(purpose.id)),
    avoidHabits: input.habits.filter((habit) => habit.shouldAvoid),
  }
}
