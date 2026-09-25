import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { parseTimeToMinutes } from '@/features/vida/utils/vida-time.utils'

/**
 * Cuántas fichas ofrece «Empezar algo». **El cinco vive aquí y solo aquí**:
 * ningún componente lleva el número escrito. Es la respuesta literal del
 * usuario —«esa serie de sugerencias no es tan útil al ser tan larga... quizá
 * el top 5»— y el resto de su plantilla se alcanza por el buscador que ya
 * está debajo, que busca sobre **todo el catálogo**, no sobre esta lista.
 */
export const VIDA_START_SUGGESTIONS_MAX = 5

type TopStartSuggestionsInput = {
  /** La plantilla de ese día, tal cual llega de `vidaSuggestionsForDate`. */
  suggestions: readonly VidaSuggestion[] | undefined | null
  /**
   * «Ahora» en minutos desde medianoche: el mismo que ya tiene la página.
   * **`null` cuando el día que se mira no es hoy** —así lo devuelve
   * `useVidaNowMinute`—: sin un «ahora», manda el orden del propio día, de la
   * mañana a la noche, que es lo que ya había.
   */
  nowMinutes: number | null
  /** Actividades que no se ofrecen (las que ya están puestas). */
  excludeActivityIds?: readonly string[]
  /** Solo para los tests: en la app manda `VIDA_START_SUGGESTIONS_MAX`. */
  max?: number
}

/** A qué cajón va un ítem: lo de ahora, lo que ya pasó, y lo que no tiene hora. */
const BUCKET_UPCOMING = 0
const BUCKET_PAST = 1
const BUCKET_NO_TIME = 2

type Ranked = {
  suggestion: VidaSuggestion
  bucket: number
  /** Minutos de distancia a «ahora». Menos es antes en la lista. */
  distance: number
  title: string
  activityId: string
}

/**
 * **«Lo de ahora, sin repetir, cinco»**: las pocas fichas que ofrece «Empezar
 * algo» (criterios 622, 623, 624 y 627 de FEAT-023).
 *
 * Hasta hoy la hoja pintaba **una ficha por ítem de plantilla**, así que una
 * actividad con tres bloques en el día salía tres veces —dos de ellas
 * indistinguibles— y la pared empujaba el buscador y el campo de la hora fuera
 * de la pantalla. La regla, entera, en un sitio:
 *
 * 1. **Candidatos**: los `isActive !== false` (el mismo filtro que ya hacía el
 *    picker) menos los de `excludeActivityIds`.
 * 2. **Una ficha por actividad**: se deduplica por `item.activityId`. Gana el
 *    ítem **más cercano a ahora hacia delante**; si todos los de esa actividad
 *    ya pasaron, el **más reciente de los pasados**.
 * 3. **Orden por distancia a ahora**: primero lo que empieza a partir de
 *    `nowMinutes` de más próximo a más lejano; después lo que ya pasó, del más
 *    reciente al más antiguo; al final lo **sin hora** —la misma lectura que
 *    ya usa el módulo: sin hora va después—.
 * 4. **Tope**: `VIDA_START_SUGGESTIONS_MAX`.
 * 5. **Desempate** (misma hora, o dos sin hora): por título con
 *    `localeCompare('es')` y, si aún empatan, por `activityId`. **Dos
 *    ejecuciones dan la misma lista**, como en `pickBlockHints`.
 *
 * Por qué la hora y no «lo que más haces»: la plantilla del día **ya es** la
 * respuesta del usuario a «qué suelo hacer hoy», y lo único que distingue a
 * unos ítems de otros dentro del día es a qué hora tocaban. Ordenar por
 * patrones costaría de ~13 a ~53 consultas y llegaría **después** del primer
 * pintado: la lista se reordenaría con la hoja ya abierta, bajo el dedo.
 *
 * Devuelve `VidaSuggestion[]` **tal cual**, no un tipo nuevo: el picker no
 * cambia de contrato, igual que hacía `suggestionsForGap` antes de que
 * FEAT-010 retirase las fichas del hueco. Sin plantilla
 * devuelve `[]` y quien pinta ya tiene escrita su frase (criterio 629), y
 * **no se rellena** con el catálogo: meter en la hoja cosas que no están en el
 * plan de hoy es justo lo que no se pidió, y para eso está el buscador.
 */
export function topStartSuggestions({
  suggestions,
  nowMinutes,
  excludeActivityIds = [],
  max = VIDA_START_SUGGESTIONS_MAX,
}: TopStartSuggestionsInput): VidaSuggestion[] {
  if (!suggestions || max <= 0) return []

  // Sin «ahora» (el día que se mira no es hoy), medianoche: todo queda por
  // delante y la lista sale en el orden del día.
  const now = nowMinutes ?? 0
  const excluded = new Set(excludeActivityIds)

  const ranked: Ranked[] = suggestions
    .filter((suggestion) => suggestion.item.isActive !== false)
    .filter((suggestion) => !excluded.has(suggestion.item.activityId))
    .map((suggestion) => {
      const startTime = suggestion.item.startTime
      if (!startTime) {
        return {
          suggestion,
          bucket: BUCKET_NO_TIME,
          distance: 0,
          title: suggestion.item.activity?.title ?? '',
          activityId: suggestion.item.activityId,
        }
      }
      const minutes = parseTimeToMinutes(startTime)
      const isUpcoming = minutes >= now
      return {
        suggestion,
        bucket: isUpcoming ? BUCKET_UPCOMING : BUCKET_PAST,
        distance: isUpcoming ? minutes - now : now - minutes,
        title: suggestion.item.activity?.title ?? '',
        activityId: suggestion.item.activityId,
      }
    })
    .sort((a, b) => {
      if (a.bucket !== b.bucket) return a.bucket - b.bucket
      if (a.distance !== b.distance) return a.distance - b.distance
      const byTitle = a.title.localeCompare(b.title, 'es')
      if (byTitle !== 0) return byTitle
      return a.activityId.localeCompare(b.activityId)
    })

  // Ordenado ya, el **primero** de cada actividad es su representante: el más
  // cercano a ahora hacia delante o, si todos pasaron, el más reciente. Así la
  // regla 2 y la 3 son la misma pasada, sin un segundo criterio escondido.
  const seen = new Set<string>()
  const out: VidaSuggestion[] = []
  for (const entry of ranked) {
    if (seen.has(entry.activityId)) continue
    seen.add(entry.activityId)
    out.push(entry.suggestion)
    if (out.length >= max) break
  }

  return out
}
