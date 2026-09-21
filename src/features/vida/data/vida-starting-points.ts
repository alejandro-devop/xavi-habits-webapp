// ─────────────────────────────────────────────────────────────────────────────
// Los puntos de partida de Vida
//
// El primer minuto no puede acabar en una pantalla en blanco con un formulario.
// Estas trece son las cosas que casi todo el mundo hace, con su categoría ya
// puesta: se tocan las propias y existen. Mismo papel que
// `src/features/habits/data/habit-templates.ts` en el wizard de hábitos, y el
// mismo truco: la plantilla trae **`categoryName`, nunca un id**, porque el id
// depende de lo que ya tenga cada cuenta.
//
// Esto es un archivo de datos: aquí no se importa React ni se llama al API.
// ─────────────────────────────────────────────────────────────────────────────

export type VidaStartingCategory = {
  /** Lo que se crea y, normalizado, la llave para reutilizar una existente. */
  name: string
  /** Nombre del catálogo de `@/shared/icons`; da el icono de todas sus tarjetas. */
  icon: string
  /** Hexadecimal del **núcleo** de la paleta (violeta, ámbar, azul, menta). */
  color: string
}

export type VidaStartingPoint = {
  /** Estable y local: identifica la selección, no se guarda en el API. */
  id: string
  /** El nombre con el que se crea la actividad. */
  title: string
  /**
   * Icono **de la ficha de este cartel**, no de la actividad: el API no guarda
   * icono en `Activity`. Una vez creada, la tarjeta pinta el de su categoría.
   */
  icon: string
  /** Se busca por nombre en el catálogo del usuario y, si no está, se crea. */
  categoryName: string
  /** Las seis que vienen marcadas de entrada, como en el render aprobado. */
  recommended?: boolean
  /**
   * **La hora de partida** del primer minuto de la plantilla (FEAT-005,
   * criterio 36), `HH:mm`. Solo la tienen los **seis** que el render dibuja en
   * el marco D: es lo que los convierte en «7:00 Bañarme 15m» en vez de un
   * nombre suelto. En el catálogo (FEAT-002) **no se mira**: allí se crea la
   * actividad y nada más.
   */
  startTime?: string
  /** Los minutos propuestos para ese punto. Va siempre con `startTime`. */
  durationMinutes?: number
  /**
   * Los **tres** que vienen marcados en el primer minuto de la plantilla, que
   * no son los mismos seis que marca el catálogo (`recommended`): el render
   * marca la mañana —bañarse, pasear y desayunar— y deja sin marcar las tres
   * de más adelante. Va explícito y no «los tres primeros por hora» para que
   * añadir un punto más temprano no cambie el arranque sin que nadie lo pida.
   */
  scheduleRecommended?: boolean
}

/**
 * Las cuatro categorías sugeridas. Los colores son los del núcleo de la paleta
 * de hábitos (`HABIT_CORE_COLORS`) en el orden que pidió el usuario —violeta,
 * ámbar, azul, menta—; se escriben aquí como literales en vez de importarse
 * para no atar `features/vida` a `features/habits`. Un test comprueba que
 * siguen siendo exactamente esos cuatro hexadecimales. Cuando la paleta se mude
 * a `@/shared/ui/ColorPicker` (tajada 2), esto puede pasar a leerla de allí.
 */
export const VIDA_STARTING_CATEGORIES: readonly VidaStartingCategory[] = [
  { name: 'Casa', icon: 'house-chimney', color: '#8b5cf6' },
  { name: 'Mascotas', icon: 'paw', color: '#f59e0b' },
  { name: 'Yo', icon: 'spa', color: '#0284c7' },
  { name: 'Comida', icon: 'utensils', color: '#10b981' },
] as const

export const VIDA_STARTING_POINTS: readonly VidaStartingPoint[] = [
  {
    id: 'banarme',
    title: 'Bañarme',
    icon: 'shower',
    categoryName: 'Yo',
    startTime: '07:00',
    durationMinutes: 15,
    scheduleRecommended: true,
    recommended: true,
  },
  {
    id: 'lavarme-los-dientes',
    title: 'Lavarme los dientes',
    icon: 'tooth',
    categoryName: 'Yo',
    recommended: true,
  },
  {
    id: 'pasear-a-las-mascotas',
    title: 'Pasear a las mascotas',
    icon: 'dog',
    categoryName: 'Mascotas',
    startTime: '07:30',
    durationMinutes: 40,
    scheduleRecommended: true,
    recommended: true,
  },
  {
    id: 'organizar-la-casa',
    title: 'Organizar la casa',
    icon: 'broom',
    categoryName: 'Casa',
    startTime: '09:00',
    durationMinutes: 45,
    recommended: true,
  },
  {
    id: 'desayunar-con-calma',
    title: 'Desayunar con calma',
    icon: 'mug-saucer',
    categoryName: 'Comida',
    startTime: '08:30',
    durationMinutes: 30,
    scheduleRecommended: true,
  },
  {
    id: 'cocinar',
    title: 'Cocinar y almorzar',
    icon: 'kitchen-set',
    categoryName: 'Comida',
    startTime: '13:00',
    durationMinutes: 60,
    recommended: true,
  },
  {
    id: 'poner-una-lavadora',
    title: 'Poner una lavadora',
    icon: 'jug-detergent',
    categoryName: 'Casa',
  },
  {
    id: 'leer-un-rato',
    title: 'Leer un rato',
    icon: 'book-open-reader',
    categoryName: 'Yo',
    startTime: '21:30',
    durationMinutes: 30,
    recommended: true,
  },
  { id: 'descansar', title: 'Descansar', icon: 'couch', categoryName: 'Yo' },
  {
    id: 'compra-de-la-semana',
    title: 'Compra de la semana',
    icon: 'cart-shopping',
    categoryName: 'Casa',
  },
  { id: 'llamar-a-alguien', title: 'Llamar a alguien', icon: 'phone', categoryName: 'Yo' },
  { id: 'salir-a-caminar', title: 'Salir a caminar', icon: 'walking', categoryName: 'Yo' },
  { id: 'dormir-la-siesta', title: 'Dormir la siesta', icon: 'bed', categoryName: 'Yo' },
] as const

/**
 * Los seis puntos del **primer minuto de la plantilla** (criterio 36), en orden
 * de reloj: son los que llevan hora y duración propuestas. El catálogo sigue
 * enseñando los trece.
 */
export function getScheduledStartingPoints(): VidaStartingPoint[] {
  return VIDA_STARTING_POINTS.filter((point) => Boolean(point.startTime)).sort((a, b) =>
    (a.startTime ?? '').localeCompare(b.startTime ?? ''),
  )
}

/** Los tres que vienen marcados en el primer minuto de la plantilla. */
export function getScheduledRecommendedIds(): string[] {
  return getScheduledStartingPoints()
    .filter((point) => point.scheduleRecommended)
    .map((point) => point.id)
}

/** Los ids que vienen marcados al abrir la pantalla por primera vez. */
export function getRecommendedStartingPointIds(): string[] {
  return VIDA_STARTING_POINTS.filter((point) => point.recommended).map((point) => point.id)
}

/** La categoría sugerida de un punto de partida, si es una de las cuatro. */
export function findStartingCategory(name: string): VidaStartingCategory | undefined {
  return VIDA_STARTING_CATEGORIES.find((category) => category.name === name)
}
