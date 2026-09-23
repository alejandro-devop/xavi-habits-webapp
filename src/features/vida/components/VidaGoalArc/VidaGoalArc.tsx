import type { CSSProperties } from 'react'
import type { VidaGoalArc as VidaGoalArcData } from '@/features/vida/utils/vida-goals.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaGoalArc.module.scss'

type VidaGoalArcProps = {
  arc: VidaGoalArcData
  /** Un día que ya terminó: se pinta en pasado y sin proyección (criterio 497). */
  isPastDay: boolean
}

/** El icono de la meta cuando el catálogo no le puso ninguno. */
const FALLBACK_GOAL_ICON = 'circle-dot'

/**
 * **El arco de una meta** (FEAT-016, criterios 489–497), el panel 1 del render
 * aprobado (`docs/vida/assets/18-vida-arcos-familia.html:123-135`).
 *
 * Un **semicírculo con la hora en grande dentro**, no una barra ni un donut.
 * La geometría está copiada del render: `viewBox="0 0 220 124"`, dos veces el
 * mismo `path` —pista y trazo— con `pathLength="100"`, y el avance como
 * `stroke-dasharray`. Es el mismo truco de proporción por variable que usa
 * `VidaDayBudget` con sus anchos, aplicado a un arco.
 *
 * **Tonto como su vecino**: recibe el arco ya calculado y no llama a ningún
 * hook. Y **la meta es un dato**: el nombre, el icono, el color y los minutos
 * salen de `arc.goal`. Aquí dentro no hay ninguna constante «Trabajo» ni
 * ningún 480, y por eso el día que haya tres metas esto no se rediseña.
 *
 * **El SVG no es la única forma de leerlo, y solo se lee una vez** (la
 * costumbre de `ChartPanel` y su tabla oculta): el dibujo es **decorativo**
 * (`aria-hidden`) y la frase entera vive en un `<p>` de texto real **solo para
 * lectores de pantalla**. Hasta la tajada 3 iban las dos cosas —el `role="img"`
 * con su `aria-label` y el mismo `<p>` a la vista—, así que la frase se oía dos
 * veces y se veía repetida bajo un arco que ya la dice dentro (la hora grande y
 * su rótulo). El render aprobado (18, panel 1) no tiene ese párrafo: debajo del
 * arco solo va la línea de la sesión en marcha.
 *
 * Ese `<p>` **no lleva `role="alert"`** ni el ámbar o el rojo que el módulo
 * reserva para avisos, tampoco pasada la meta: el dato, sin reproche
 * (criterio 493).
 */
export function VidaGoalArc({ arc, isPastDay }: VidaGoalArcProps) {
  const style = arc.goal.color
    ? ({ '--vida-goal-color': arc.goal.color } as CSSProperties)
    : undefined

  return (
    <article
      className={styles.card}
      data-past={isPastDay ? '' : undefined}
      style={style}
      aria-labelledby={`vida-goal-${arc.goal.id}`}
    >
      <p className={styles.head}>
        <span className={styles.label} id={`vida-goal-${arc.goal.id}`}>
          <span className={styles.capsule} aria-hidden>
            <AppIcon name={arc.goal.icon ?? FALLBACK_GOAL_ICON} size="sm" decorative />
          </span>
          {arc.goal.name}
        </span>
        <span className={styles.count}>
          <strong className={styles.countValue}>{arc.workedLabel}</strong> de {arc.targetLabel}
        </span>
      </p>

      <div className={styles.arc}>
        {/* Decorativo: lo que dice ya está en texto real justo debajo. */}
        <svg viewBox="0 0 220 124" aria-hidden>
          <path
            className={styles.trackPath}
            d="M22 106 A 88 88 0 0 1 198 106"
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            pathLength="100"
          />
          {arc.share > 0 ? (
            <path
              className={styles.valuePath}
              d="M22 106 A 88 88 0 0 1 198 106"
              fill="none"
              strokeWidth="14"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${arc.share * 100} 100`}
            />
          ) : null}
          <text className={styles.caption} x="110" y="70" textAnchor="middle" fontSize="9.5">
            {arc.arcCaption}
          </text>
          <text className={styles.value} x="110" y="101" textAnchor="middle" fontSize="32">
            {arc.arcValue}
          </text>
          <text className={styles.edge} x="18" y="121" textAnchor="start" fontSize="9.5">
            0h
          </text>
          <text className={styles.edge} x="202" y="121" textAnchor="end" fontSize="9.5">
            {arc.targetLabel}
          </text>
        </svg>
      </div>

      {/* La «tabla oculta» del arco: la frase entera, en texto de verdad y una
          sola vez. A la vista la dicen la hora grande y su rótulo. */}
      <p className={styles.srLine}>{arc.line}</p>

      {arc.runningTitle ? (
        <p className={styles.sub}>
          Cuenta <strong className={styles.subValue}>{arc.runningTitle}</strong>, en marcha desde
          las {arc.runningSince}.
        </p>
      ) : null}
    </article>
  )
}
