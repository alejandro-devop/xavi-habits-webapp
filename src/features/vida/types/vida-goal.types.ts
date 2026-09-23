import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'

/**
 * Una meta del módulo Vida: nombre, icono, color y los minutos que el usuario
 * se propone. Varias categorías pueden apuntar a la misma.
 *
 * Llega **dentro de la categoría** (`ActivityCategory.goal`), no por una
 * consulta propia: el catálogo de categorías es la única fuente de las metas
 * mientras no exista una pantalla para gestionarlas.
 *
 * Sin `userId` ni fechas: el front no las selecciona.
 */
export interface VidaGoal {
  id: string
  /** Identidad estable de la meta. La automática es 'work'. */
  slug: string
  name: string
  icon: string | null
  color: string | null
  targetMinutes: number
  /**
   * **Los días de la semana en que esta meta cuenta** (FEAT-019, criterio 575).
   * Nunca vacío: la columna lo impone (`CHECK (cardinality >= 1)`, migración
   * 070) y nace de lunes a viernes.
   *
   * Mismo vocabulario que los días de la plantilla (`VidaItem.days`), así que
   * `getVidaDayOfWeek(date)` se compara con esto sin traducir nada.
   */
  activeDays: VidaDayOfWeek[]
  orderIndex: number
}

/**
 * Lo que la mutación `vidaGoalDaysSet` necesita. `activeDays` **nunca vacío**:
 * el validador del API lo rechaza y la columna tiene `CHECK (cardinality >= 1)`.
 * La interfaz lo impide antes de llegar hasta allí (criterio 581).
 */
export interface VidaGoalDaysSetInput {
  goalId: string
  activeDays: VidaDayOfWeek[]
}
