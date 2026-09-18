import { normalizeNameForMatch } from '@/features/habits/utils/habit-form.utils'

/**
 * Catálogo de identidades que la app propone cuando un hábito alcanza un hito.
 *
 * Es un archivo de datos a propósito: la elección de qué proponer no es lógica
 * de interfaz. Se propone por palabras del nombre del hábito y por categoría,
 * y siempre salen **tres**. Cuatro ya es una lista que hay que leer en vez de
 * reconocer.
 */

export interface IdentitySuggestion {
  /** Estable: es lo que se guarda como descarte en «no me suena». */
  id: string
  /** Lo que acaba en `HabitPurpose.name`. */
  name: string
  /** Nombre de icono de `@/shared/icons`. */
  icon: string
}

interface IdentityRule {
  id: string
  /** Palabras que pueden aparecer en el nombre del hábito. */
  keywords: string[]
  /** Nombres de categoría que también disparan la regla. */
  categories: string[]
  /** `true` para hábitos que se quieren dejar atrás (`shouldAvoid`). */
  avoid: boolean
  suggestions: [IdentitySuggestion, IdentitySuggestion, IdentitySuggestion]
}

const RULES: IdentityRule[] = [
  {
    id: 'calma',
    keywords: ['meditar', 'meditacion', 'mindfulness', 'respirar', 'respiracion', 'yoga', 'calma'],
    categories: ['mindfulness', 'bienestar'],
    avoid: false,
    suggestions: [
      { id: 'sereno', name: 'Alguien sereno', icon: 'spa' },
      { id: 'se-cuida', name: 'Alguien que se cuida', icon: 'heart' },
      { id: 'empieza-en-calma', name: 'Alguien que empieza el día en calma', icon: 'sun' },
    ],
  },
  {
    id: 'cuerpo',
    keywords: [
      'ejercicio',
      'gimnasio',
      'gym',
      'correr',
      'running',
      'entrenar',
      'entrenamiento',
      'pesas',
      'deporte',
      'caminar',
      'andar',
      'nadar',
      'bici',
      'bicicleta',
    ],
    categories: ['fitness', 'deporte'],
    avoid: false,
    suggestions: [
      { id: 'fuerte', name: 'Alguien fuerte', icon: 'dumbbell' },
      { id: 'cuida-su-cuerpo', name: 'Alguien que cuida su cuerpo', icon: 'heart-pulse' },
      { id: 'no-se-rinde', name: 'Alguien que no se rinde', icon: 'fire' },
    ],
  },
  {
    id: 'mente',
    keywords: ['leer', 'lectura', 'libro', 'libros', 'estudiar', 'estudio', 'curso', 'idioma'],
    categories: ['study', 'estudio'],
    avoid: false,
    suggestions: [
      { id: 'lee', name: 'Alguien que lee', icon: 'book-open' },
      { id: 'curioso', name: 'Alguien curioso', icon: 'lightbulb' },
      { id: 'aprende', name: 'Alguien que aprende cada día', icon: 'graduation-cap' },
    ],
  },
  {
    id: 'descanso',
    keywords: ['dormir', 'sueno', 'descansar', 'descanso', 'acostarme', 'siesta'],
    categories: ['health', 'salud'],
    avoid: false,
    suggestions: [
      { id: 'duerme-a-su-hora', name: 'Alguien que duerme a su hora', icon: 'moon' },
      { id: 'descansado', name: 'Alguien descansado', icon: 'bed' },
      { id: 'se-cuida', name: 'Alguien que se cuida', icon: 'heart' },
    ],
  },
  {
    id: 'comida',
    keywords: ['agua', 'beber', 'comer', 'dieta', 'fruta', 'verdura', 'desayunar', 'cocinar'],
    categories: ['health', 'salud', 'nutricion'],
    avoid: false,
    suggestions: [
      { id: 'se-cuida', name: 'Alguien que se cuida', icon: 'heart' },
      { id: 'come-bien', name: 'Alguien que come bien', icon: 'apple-whole' },
      { id: 'con-energia', name: 'Alguien con energía', icon: 'bolt' },
    ],
  },
  {
    id: 'escritura',
    keywords: ['escribir', 'diario', 'journal', 'gratitud', 'anotar'],
    categories: [],
    avoid: false,
    suggestions: [
      { id: 'se-escucha', name: 'Alguien que se escucha', icon: 'pen' },
      { id: 'escribe', name: 'Alguien que escribe', icon: 'file-lines' },
      { id: 'constante', name: 'Alguien constante', icon: 'seedling' },
    ],
  },
  {
    id: 'dinero',
    keywords: ['ahorrar', 'ahorro', 'gasto', 'gastos', 'dinero', 'presupuesto', 'finanzas'],
    categories: ['finance', 'finanzas'],
    avoid: false,
    suggestions: [
      { id: 'cuida-su-dinero', name: 'Alguien que cuida su dinero', icon: 'piggy-bank' },
      { id: 'previsor', name: 'Alguien previsor', icon: 'chart-line' },
      { id: 'constante', name: 'Alguien constante', icon: 'seedling' },
    ],
  },
  {
    id: 'foco',
    keywords: ['trabajo', 'foco', 'concentracion', 'productividad', 'planificar', 'revisar'],
    categories: ['work', 'productivity', 'trabajo', 'productividad'],
    avoid: false,
    suggestions: [
      { id: 'enfocado', name: 'Alguien enfocado', icon: 'target' },
      { id: 'termina', name: 'Alguien que termina lo que empieza', icon: 'list-check' },
      { id: 'constante', name: 'Alguien constante', icon: 'seedling' },
    ],
  },
  {
    id: 'pantallas',
    keywords: ['movil', 'telefono', 'redes', 'instagram', 'tiktok', 'pantalla', 'pantallas', 'tv'],
    categories: ['technology', 'tecnologia'],
    avoid: true,
    suggestions: [
      { id: 'dueno-atencion', name: 'Alguien dueño de su atención', icon: 'mobile' },
      { id: 'sin-pantallas', name: 'Alguien que empieza el día sin pantallas', icon: 'sun' },
      { id: 'presente', name: 'Alguien presente', icon: 'eye' },
    ],
  },
  {
    id: 'impulsos',
    keywords: ['fumar', 'tabaco', 'alcohol', 'azucar', 'dulce', 'dulces', 'ultraprocesados'],
    categories: ['health', 'salud'],
    avoid: true,
    suggestions: [
      { id: 'se-cuida', name: 'Alguien que se cuida', icon: 'heart' },
      { id: 'ya-no-lo-necesita', name: 'Alguien que ya no lo necesita', icon: 'leaf' },
      { id: 'dueno-impulsos', name: 'Alguien dueño de sus impulsos', icon: 'bolt' },
    ],
  },
]

/** Cuando nada encaja. Decente, nunca vacío. */
const WANT_FALLBACK: IdentitySuggestion[] = [
  { id: 'constante', name: 'Alguien constante', icon: 'seedling' },
  { id: 'cumple', name: 'Alguien que cumple lo que dice', icon: 'check' },
  { id: 'se-cuida', name: 'Alguien que se cuida', icon: 'heart' },
]

const AVOID_FALLBACK: IdentitySuggestion[] = [
  { id: 'ya-no-lo-necesita', name: 'Alguien que ya no lo necesita', icon: 'leaf' },
  { id: 'dueno-impulsos', name: 'Alguien dueño de sus impulsos', icon: 'bolt' },
  { id: 'constante', name: 'Alguien constante', icon: 'seedling' },
]

export const IDENTITY_SUGGESTION_COUNT = 3

export interface IdentitySuggestionQuery {
  habitName: string
  categoryName?: string | null
  shouldAvoid?: boolean
  /** Ids ya descartados con «no me suena». */
  excludeIds?: string[]
}

function matchesRule(rule: IdentityRule, name: string, category: string): boolean {
  if (rule.keywords.some((keyword) => name.includes(keyword))) return true
  return category.length > 0 && rule.categories.some((c) => category.includes(c))
}

/**
 * Siempre devuelve exactamente tres, sin repetir y sin los descartados. Si los
 * descartes dejan la regla sin material, se completa con el genérico y, si aún
 * falta, con el resto del catálogo.
 */
export function getIdentitySuggestions({
  habitName,
  categoryName,
  shouldAvoid = false,
  excludeIds = [],
}: IdentitySuggestionQuery): IdentitySuggestion[] {
  const name = normalizeNameForMatch(habitName)
  const category = normalizeNameForMatch(categoryName ?? '')

  const ordered: IdentitySuggestion[] = []
  const seen = new Set<string>()
  const excluded = new Set(excludeIds)

  function push(suggestion: IdentitySuggestion) {
    if (seen.has(suggestion.id) || excluded.has(suggestion.id)) return
    seen.add(suggestion.id)
    ordered.push(suggestion)
  }

  for (const rule of RULES) {
    if (rule.avoid !== shouldAvoid) continue
    if (!matchesRule(rule, name, category)) continue
    rule.suggestions.forEach(push)
  }

  const fallback = shouldAvoid ? AVOID_FALLBACK : WANT_FALLBACK
  fallback.forEach(push)

  // Última red: el catálogo entero del mismo signo, y luego el contrario. Con
  // esto es imposible devolver menos de tres aunque se descarte medio mundo.
  for (const rule of RULES) {
    if (rule.avoid !== shouldAvoid) continue
    rule.suggestions.forEach(push)
  }
  for (const rule of RULES) {
    rule.suggestions.forEach(push)
  }

  return ordered.slice(0, IDENTITY_SUGGESTION_COUNT)
}
