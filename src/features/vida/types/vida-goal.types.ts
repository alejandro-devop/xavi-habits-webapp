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
  orderIndex: number
}
