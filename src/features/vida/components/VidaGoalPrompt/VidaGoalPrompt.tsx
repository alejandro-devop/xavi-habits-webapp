import { useState } from 'react'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import { compareVidaNames } from '@/features/vida/utils/vida-text.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaGoalPrompt.module.scss'

/** El icono de una categoría que no eligió ninguno. */
const FALLBACK_CATEGORY_ICON = 'circle-dot'

export type VidaGoalPromptProps = {
  /** El catálogo entero. Vacío: no se pinta nada (criterio 503). */
  categories: ActivityCategory[]
  /** Un toque: apunta esa categoría a la meta. Nada más (criterio 502). */
  onPick: (categoryId: string) => void
  /** Una mutación en vuelo: los botones se inhabilitan a la vez. */
  isBusy?: boolean
}

/**
 * **La pregunta cuando ninguna categoría apunta a una meta** (FEAT-016,
 * tajada 3, criterios 500–503). El momento 8 del render
 * `docs/vida/assets/15-vida-barra-de-trabajo.html:280-301` — de ahí salen el
 * texto, las píldoras con icono y nombre, y el «Ahora no». (Ese render dibuja
 * la barra, que ya no es la forma vigente; **lo que se toma de él es la
 * pregunta**, no el gráfico: el arco es el del render 18 panel 1.)
 *
 * **Un toque, una acción.** El botón escribe el puntero de esa categoría con
 * la misma mutación que la casilla del formulario —`activityCategoryGoalSet`,
 * que crea la meta «Trabajo, 8h» si aún no existe— y ahí acaba: no manda a
 * Ajustes, no abre un formulario, no pide confirmación y no pregunta por los
 * minutos de la jornada. Cuando el catálogo vuelve invalidado, la página pinta
 * el arco en este mismo sitio sin recargar (criterio 501).
 *
 * **La segunda puerta al mismo campo**, no un ajuste nuevo: quien ya marcó
 * desde Ajustes → Categorías nunca ve esto, y en cuanto una categoría apunta a
 * la meta la pregunta no vuelve en ningún día (criterio 502) — lo garantiza el
 * dato, no una bandera: la página pinta el arco en cuanto hay uno.
 *
 * **Es la única parte del front que nombra «trabajo»**, y es a propósito: aquí
 * todavía **no existe** ninguna meta de la que leer el nombre, así que no hay
 * dato del que sacarlo. El arco, que sí lo tiene, es genérico.
 */
export function VidaGoalPrompt({ categories, onPick, isBusy = false }: VidaGoalPromptProps) {
  // «Ahora no» aparta la pregunta **de esta visita**: no guarda nada ni en el
  // aparato ni en el servidor, así que vuelve al recargar. Ningún render dibuja
  // qué pasa después de tocarlo y nadie lo decidió; lo mínimo que no inventa un
  // dato es esto, y queda anotado en la sección 3 por si el usuario lo quiere
  // persistente.
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // El orden del catálogo, el mismo de Ajustes → Categorías.
  const sorted = [...categories].sort(
    (a, b) => a.orderIndex - b.orderIndex || compareVidaNames(a.name, b.name),
  )
  // Criterio 503: sin categorías no hay pregunta que hacer. Ni botones vacíos
  // ni un error: no se pinta nada y la agenda sigue donde estaba.
  if (sorted.length === 0) return null

  return (
    <section className={styles.root} aria-labelledby="vida-goal-prompt-title">
      <p className={styles.question} id="vida-goal-prompt-title">
        ¿Cuál de estas es tu trabajo?
      </p>
      <p className={styles.why}>
        Toca una y te digo, cada día, cuánto llevas trabajado y a qué hora llegas a las 8 horas.
      </p>

      <div className={styles.chips}>
        {sorted.map((category) => (
          <button
            key={category.id}
            type="button"
            className={styles.chip}
            disabled={isBusy}
            onClick={() => onPick(category.id)}
          >
            <span className={styles.capsule} aria-hidden>
              <AppIcon name={category.icon ?? FALLBACK_CATEGORY_ICON} size="sm" decorative />
            </span>
            {category.name}
          </button>
        ))}
      </div>

      <button type="button" className={styles.skip} onClick={() => setDismissed(true)}>
        Ahora no
      </button>
    </section>
  )
}
