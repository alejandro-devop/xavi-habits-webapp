/**
 * **Las palabras y la aritmética de «qué hiciste»** (FEAT-018).
 *
 * Aquí no hay JSX ni React: solo las frases que se leen en pantalla —para que
 * no vivan copiadas en cuatro filas distintas (hallazgo 3 de la revisión de la
 * tajada 1)— y el cálculo puro de las píldoras de «lo de otras veces».
 */

/** Lo que se lee en una sesión **terminada** sin nota. Nunca un reproche. */
export const VIDA_NOTE_ADD_LABEL = 'añadir qué hiciste'

/** La pregunta mientras algo **corre** (criterios 532 y 542). */
export const VIDA_NOTE_QUESTION_RUNNING = '¿Qué estás haciendo?'

/** La pregunta cuando ya terminó, o se añade después (criterio 532). */
export const VIDA_NOTE_QUESTION_DONE = '¿Qué hiciste?'

/** El rótulo de las píldoras, tal cual el render 19. */
export const VIDA_NOTE_SUGGESTIONS_LABEL = 'Lo de otras veces'

/**
 * Cuántas sesiones se piden para sacar las píldoras. El validador del API
 * (`activityFollowUpsArgsSchema`, `xavi-platform-node`) admite hasta **500**;
 * veinte filas cortas bastan de sobra para tres píldoras distintas.
 */
export const VIDA_NOTE_HISTORY_LIMIT = 20

/** Cuántas píldoras se ofrecen. Tres, como el render. */
export const VIDA_NOTE_SUGGESTIONS_MAX = 3

/**
 * Lo mínimo que hace falta de una sesión para sacar su nota. Estructural a
 * propósito: vale tanto un `ActivityFollowUp` entero como la fila corta que
 * trae `ACTIVITY_FOLLOW_UPS_BY_ACTIVITY_QUERY`.
 */
export type VidaNoteSource = {
  id: string
  notes?: string | null
}

/**
 * **«Lo de otras veces»**: las últimas notas de esa misma actividad, listas
 * para tocarse (criterio 546).
 *
 * No ordena nada: respeta el orden en que llegan, que el API ya devuelve por
 * fecha y hora **descendente** (`listFollowUps`: `ORDER BY af.date DESC,
 * af.start_time DESC`), así que la más reciente va primero.
 *
 * - Las vacías no cuentan (una sesión sin nota no es una píldora en blanco).
 * - **Deduplica ignorando mayúsculas y espacios**: quien escribe «Revisando
 *   MRs» todos los días no ve tres veces la misma píldora. Se conserva la
 *   redacción de la **más reciente**.
 * - `excludeId` quita la sesión que se está editando: ofrecerle a alguien lo
 *   que ya tiene escrito delante no es un atajo.
 *
 * Sin ninguna nota devuelve `[]`, y quien pinta no pinta sección ninguna: sin
 * notas previas **no hay hueco vacío ni error** (criterio 547).
 */
export function recentNoteSuggestions(
  followUps: readonly VidaNoteSource[] | undefined | null,
  options: { max?: number; excludeId?: string | null } = {},
): string[] {
  const max = options.max ?? VIDA_NOTE_SUGGESTIONS_MAX
  const excludeId = options.excludeId ?? null
  if (!followUps || max <= 0) return []

  const seen = new Set<string>()
  const out: string[] = []

  for (const followUp of followUps) {
    if (excludeId && followUp.id === excludeId) continue
    const text = (followUp.notes ?? '').trim()
    if (!text) continue
    const key = text.toLocaleLowerCase('es').replace(/\s+/g, ' ')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(text)
    if (out.length >= max) break
  }

  return out
}
