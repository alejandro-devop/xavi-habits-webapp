import type { HabitTemplate } from '@/features/habits/data/habit-templates'
import type {
  Habit,
  HabitCategory,
  HabitEditInput,
  HabitInput,
  HabitMeasure,
  HabitType,
} from '@/features/habits/types/habit.types'

export interface HabitFormValues {
  name: string
  description: string
  habitType: HabitType
  shouldAvoid: boolean
  icon: string | null
  color: string | null
  categoryId: string
  measureId: string
  weeklyLifelines: string
  startDate: string
  endDate: string
  dailyGoal: string
  timerGoal: string
  purposeId: string | null
  hidden: boolean
}

export function defaultFormValues(habit?: Habit): HabitFormValues {
  if (!habit) {
    return {
      name: '',
      description: '',
      habitType: 'boolean',
      shouldAvoid: false,
      icon: null,
      color: null,
      categoryId: '',
      measureId: '',
      weeklyLifelines: '0',
      startDate: '',
      endDate: '',
      dailyGoal: '',
      timerGoal: '',
      purposeId: null,
      hidden: false,
    }
  }
  return {
    name: habit.name,
    description: habit.description ?? '',
    habitType: habit.habitType,
    shouldAvoid: habit.shouldAvoid,
    icon: habit.icon,
    color: habit.color,
    categoryId: habit.categoryId ?? '',
    measureId: habit.measureId ?? '',
    weeklyLifelines: String(habit.weeklyLifelines),
    startDate: habit.startDate ?? '',
    endDate: habit.endDate ?? '',
    dailyGoal:
      habit.habitType === 'count' && habit.dailyGoal > 0 ? String(habit.dailyGoal) : '',
    timerGoal:
      habit.habitType === 'time' && habit.timerGoal > 0 ? String(habit.timerGoal) : '',
    purposeId: habit.purposeId ?? null,
    hidden: habit.hidden,
  }
}

export function buildHabitCreatePayload(values: HabitFormValues): HabitInput {
  const payload: HabitInput = {
    name: values.name.trim(),
    description: values.description.trim() || null,
    habitType: values.habitType,
    shouldAvoid: values.shouldAvoid,
    icon: values.icon || null,
    color: values.color || null,
    categoryId: values.categoryId || null,
    measureId: values.measureId || null,
    weeklyLifelines: Number(values.weeklyLifelines) || 0,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    purposeId: values.purposeId || null,
    hidden: values.hidden,
  }

  if (values.habitType === 'count' && values.dailyGoal !== '') {
    payload.dailyGoal = Number(values.dailyGoal)
  }

  if (values.habitType === 'time' && values.timerGoal !== '') {
    payload.timerGoal = Number(values.timerGoal)
  }

  return payload
}

export function buildHabitEditPayload(values: HabitFormValues, habit: Habit): HabitEditInput {
  const payload: Partial<HabitInput> = buildHabitCreatePayload(values)
  const hasFollowUps = habit.days > 0

  if (hasFollowUps) {
    // Backend rejects date/type changes when follow-ups exist; omit locked fields
    delete payload.startDate
    delete payload.endDate
    delete payload.habitType
  }

  // null goal values would overwrite existing DB values with null (violating NOT NULL).
  // undefined means "don't change" in the backend's partial update.
  if (payload.timerGoal === undefined) delete payload.timerGoal
  if (payload.timesGoal === undefined) delete payload.timesGoal
  if (payload.dailyGoal === undefined) delete payload.dailyGoal

  return { id: habit.id, ...payload }
}

// ─────────────────────────────────────────────────────────────────────────────
// La frase de intención
//
// No hay campo propio en la API: la frase viaja dentro de `description`. Por
// eso el formato es estable y analizable, y el análisis es deliberadamente
// estricto: ante cualquier duda devolvemos null y el texto se trata como
// descripción libre. Perder la descripción de alguien es peor que no reconocer
// una frase nuestra.
//
//   Cuando {ancla}, haré {acción} en {lugar}.
//   Cuando {ancla}, haré {acción}.
//   Haré {acción} en {lugar}.      (sin ancla)
//   Haré {acción}.
// ─────────────────────────────────────────────────────────────────────────────

export interface HabitIntention {
  /** El momento que ya existe en el día y sirve de gancho. */
  anchor: string
  /** Qué se hará. Se propone a partir del nombre y el objetivo. */
  action: string
  /** Dónde. Opcional. */
  place: string
}

export const EMPTY_INTENTION: HabitIntention = { anchor: '', action: '', place: '' }

/** Anclas frecuentes del desplegable del hueco 1. */
export const INTENTION_ANCHORS = [
  'me levante',
  'desayune',
  'llegue a casa',
  'termine de trabajar',
  'cene',
  'me meta en la cama',
] as const

const ANCHOR_PREFIX = 'Cuando '
const ACTION_JOIN = ', haré '
const ACTION_PREFIX = 'Haré '
const PLACE_JOIN = ' en '

/** Un hueco más largo que esto ya no es un hueco: es un párrafo. */
const MAX_SLOT_LENGTH = 120
/** Y una frase más larga que esto es una descripción libre. */
const MAX_SENTENCE_LENGTH = 400

export function composeIntention(intention: HabitIntention): string {
  const anchor = intention.anchor.trim()
  const action = intention.action.trim()
  const place = intention.place.trim()

  // Sin acción no hay frase que componer. El hueco de la acción se propone
  // solo a partir del nombre, así que vaciarlo es una decisión explícita.
  if (!action) return ''

  const head = anchor ? `${ANCHOR_PREFIX}${anchor}${ACTION_JOIN}${action}` : `${ACTION_PREFIX}${action}`
  return place ? `${head}${PLACE_JOIN}${place}.` : `${head}.`
}

/**
 * Devuelve los tres huecos, o `null` si el texto no es exactamente una frase
 * nuestra. La última comprobación es una red de seguridad: si recomponer los
 * huecos no reproduce el texto carácter a carácter, no lo tocamos.
 */
export function parseIntention(description: string | null | undefined): HabitIntention | null {
  if (!description) return null

  const text = description.trim()
  if (!text || text.length > MAX_SENTENCE_LENGTH) return null
  if (text.includes('\n')) return null
  if (!text.endsWith('.')) return null

  const body = text.slice(0, -1)
  let anchor = ''
  let rest: string

  if (body.startsWith(ANCHOR_PREFIX)) {
    const parts = body.split(ACTION_JOIN)
    // Dos «, haré » hacen la frase ambigua: mejor no tocarla.
    if (parts.length !== 2) return null
    anchor = parts[0].slice(ANCHOR_PREFIX.length)
    rest = parts[1]
  } else if (body.startsWith(ACTION_PREFIX)) {
    if (body.includes(ACTION_JOIN)) return null
    rest = body.slice(ACTION_PREFIX.length)
  } else {
    return null
  }

  let action = rest
  let place = ''
  // El lugar es lo que va tras el último « en »: así una acción que lleve
  // «en» dentro sigue volviendo entera a su hueco.
  const placeAt = rest.lastIndexOf(PLACE_JOIN)
  if (placeAt > 0) {
    action = rest.slice(0, placeAt)
    place = rest.slice(placeAt + PLACE_JOIN.length)
  }

  const intention: HabitIntention = {
    anchor: anchor.trim(),
    action: action.trim(),
    place: place.trim(),
  }

  if (!intention.action) return null
  if (intention.anchor.length > MAX_SLOT_LENGTH) return null
  if (intention.action.length > MAX_SLOT_LENGTH) return null
  if (intention.place.length > MAX_SLOT_LENGTH) return null
  if (composeIntention(intention) !== text) return null

  return intention
}

export type HabitDescriptionMode = 'intention' | 'free'

export interface HabitDescriptionState {
  mode: HabitDescriptionMode
  intention: HabitIntention
  freeText: string
}

/**
 * Descompone la `description` guardada. Lo que no encaja con el patrón vuelve
 * intacto como texto libre; nunca se reescribe ni se recorta.
 */
export function readDescription(description: string | null | undefined): HabitDescriptionState {
  const intention = parseIntention(description)
  if (intention) return { mode: 'intention', intention, freeText: '' }
  return { mode: 'free', intention: { ...EMPTY_INTENTION }, freeText: description ?? '' }
}

/** El inverso de `readDescription`: lo que acaba en el payload. */
export function writeDescription(state: HabitDescriptionState): string {
  return state.mode === 'intention' ? composeIntention(state.intention) : state.freeText
}

/**
 * Propone el hueco de la acción con el nombre y el objetivo del hábito.
 * «Leer 20 páginas» → «leer 20 páginas»; con objetivo de tiempo, «30 minutos
 * de estudio».
 */
export function proposeIntentionAction(values: HabitFormValues, measureLabel?: string): string {
  const name = values.name.trim()
  if (!name) return ''

  const subject = name.charAt(0).toLocaleLowerCase('es') + name.slice(1)

  if (values.habitType === 'time' && values.timerGoal.trim()) {
    return `${values.timerGoal.trim()} minutos de ${subject}`
  }

  if (values.habitType === 'count' && values.dailyGoal.trim()) {
    const unit = measureLabel?.trim()
    return unit ? `${values.dailyGoal.trim()} ${unit} de ${subject}` : `${values.dailyGoal.trim()} de ${subject}`
  }

  return subject
}

// ─────────────────────────────────────────────────────────────────────────────
// Plantillas
// ─────────────────────────────────────────────────────────────────────────────

/** Sin mayúsculas, sin acentos y sin espacios de sobra. */
export function normalizeNameForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function findByName<T extends { id: string; name: string }>(
  items: T[],
  name: string | undefined,
): T | null {
  if (!name) return null
  const target = normalizeNameForMatch(name)
  if (!target) return null
  return items.find((item) => normalizeNameForMatch(item.name) === target) ?? null
}

export interface HabitTemplateApplication {
  values: HabitFormValues
  /** Acción propuesta para el hueco 2 de la frase de intención. */
  intentionAction: string
  /**
   * Nombre de la medida sugerida que el usuario **no** tiene todavía. No se
   * crea nada a escondidas: el wizard deja el paso de creación prefijado.
   */
  pendingMeasureName: string | null
  /** Lo mismo para la categoría. */
  pendingCategoryName: string | null
}

/**
 * Vuelca una plantilla sobre los valores actuales. Todo sigue editable después:
 * esto rellena huecos, no cierra un camino.
 */
export function applyHabitTemplate(
  current: HabitFormValues,
  template: HabitTemplate,
  catalog: { measures: HabitMeasure[]; categories: HabitCategory[] },
): HabitTemplateApplication {
  const measure = template.measureName ? findByName(catalog.measures, template.measureName) : null
  const category = template.categoryName
    ? findByName(catalog.categories, template.categoryName)
    : null

  return {
    values: {
      ...current,
      name: template.name,
      habitType: template.habitType,
      icon: template.icon,
      color: template.color,
      dailyGoal: template.dailyGoal,
      timerGoal: template.timerGoal,
      weeklyLifelines: template.weeklyLifelines,
      measureId: measure?.id ?? '',
      categoryId: category?.id ?? '',
    },
    intentionAction: template.intentionAction,
    pendingMeasureName: template.measureName && !measure ? template.measureName : null,
    pendingCategoryName: template.categoryName && !category ? template.categoryName : null,
  }
}
